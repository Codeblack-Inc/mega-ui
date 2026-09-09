/**
 * Spreadsheet model: sheets of raw cell text, a formula parser and evaluator with
 * dependency ordering and circular detection, plus range, sort and merge helpers.
 */
export type SpreadsheetValue = string | number | boolean | null;
export type SpreadsheetFormat =
  'text' | 'number' | 'integer' | 'currency' | 'percent' | 'date';
export interface SpreadsheetCell {
  /** Exactly what the user typed, including a leading `=` for formulas. */
  value: string;
  format?: SpreadsheetFormat;
  align?: 'start' | 'center' | 'end';
  bold?: boolean;
}
export interface SpreadsheetSheet {
  id: string;
  name: string;
  rows: number;
  columns: number;
  /** Keyed by `A1` style reference. Empty cells are absent. */
  cells: Record<string, SpreadsheetCell>;
  /** `A1:B2` ranges. The top-left cell keeps the content. */
  merges?: readonly string[];
  frozenRows?: number;
  frozenColumns?: number;
  /** Column letter to pixel width. */
  columnWidths?: Record<string, number>;
}
export interface SpreadsheetData {
  version: 1;
  sheets: readonly SpreadsheetSheet[];
}
export interface SpreadsheetCellEdit {
  ref: string;
  value?: string;
  format?: SpreadsheetFormat | null;
  align?: 'start' | 'center' | 'end' | null;
  bold?: boolean | null;
}
export type SpreadsheetAction =
  | {
      type: 'set-cells';
      sheetId: string;
      cells: readonly SpreadsheetCellEdit[];
    }
  | { type: 'resize-sheet'; sheetId: string; rows: number; columns: number }
  | { type: 'set-column-width'; sheetId: string; column: string; width: number }
  | { type: 'merge'; sheetId: string; range: string }
  | { type: 'unmerge'; sheetId: string; range: string }
  | { type: 'freeze'; sheetId: string; rows: number; columns: number }
  | {
      type: 'sort';
      sheetId: string;
      range: string;
      column: string;
      direction: 'asc' | 'desc';
      header: boolean;
    }
  | { type: 'add-sheet'; sheet: SpreadsheetSheet }
  | { type: 'rename-sheet'; sheetId: string; name: string }
  | { type: 'delete-sheet'; sheetId: string };

export const SHEET_MAX_ROWS = 1000;
export const SHEET_MAX_COLUMNS = 52;
export const SHEET_MAX_CELLS = 20_000;
export const SHEET_MAX_SHEETS = 10;
export const SHEET_MAX_FORMULA = 1000;
export const SPREADSHEET_ERRORS = [
  '#DIV/0!',
  '#VALUE!',
  '#REF!',
  '#NAME?',
  '#순환!',
] as const;
export type SpreadsheetError = (typeof SPREADSHEET_ERRORS)[number];
const FORMATS: readonly SpreadsheetFormat[] = [
  'text',
  'number',
  'integer',
  'currency',
  'percent',
  'date',
];

const text = (value: unknown, max = 200): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error(
      `이름은 공백을 제외한 글자를 포함해 ${max}자 이내로 입력해 주세요.`,
    );
  return value;
};
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('시트 데이터 형식을 확인해 주세요.');
  return value as Record<string, unknown>;
};
const integer = (value: unknown, min: number, max: number, message: string) => {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    throw new Error(message);
  return value;
};

/** 0 to `A`, 25 to `Z`, 26 to `AA`. */
export function columnLabel(index: number): string {
  let label = '';
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26))
    label = String.fromCharCode(65 + ((value - 1) % 26)) + label;
  return label;
}
export function columnIndex(label: string): number {
  let index = 0;
  for (const char of label.toUpperCase())
    index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}
export function cellRef(row: number, column: number): string {
  return `${columnLabel(column)}${row + 1}`;
}
const REF = /^\$?([A-Z]{1,2})\$?([1-9]\d{0,3})$/;
export function parseRef(ref: string): { row: number; column: number } | null {
  const match = REF.exec(ref.toUpperCase());
  if (!match) return null;
  const column = columnIndex(match[1]!);
  const row = Number(match[2]) - 1;
  if (column >= SHEET_MAX_COLUMNS || row >= SHEET_MAX_ROWS) return null;
  return { row, column };
}
export interface SpreadsheetRange {
  top: number;
  left: number;
  bottom: number;
  right: number;
}
export function parseRange(range: string): SpreadsheetRange | null {
  const [from, to] = range.split(':');
  const start = from ? parseRef(from) : null;
  const end = to ? parseRef(to) : start;
  if (!start || !end) return null;
  return {
    top: Math.min(start.row, end.row),
    left: Math.min(start.column, end.column),
    bottom: Math.max(start.row, end.row),
    right: Math.max(start.column, end.column),
  };
}
export function rangeLabel(range: SpreadsheetRange): string {
  return `${cellRef(range.top, range.left)}:${cellRef(range.bottom, range.right)}`;
}
export function rangeRefs(range: SpreadsheetRange): string[] {
  const refs: string[] = [];
  for (let row = range.top; row <= range.bottom; row++)
    for (let column = range.left; column <= range.right; column++)
      refs.push(cellRef(row, column));
  return refs;
}
export function emptySheet(id: string, name: string): SpreadsheetSheet {
  return { id, name, rows: 50, columns: 12, cells: {} };
}

export function validateSpreadsheet(input: unknown): SpreadsheetData {
  const data = record(input);
  if (data.version !== 1) throw new Error('지원하는 시트 파일 버전은 1이에요.');
  if (!Array.isArray(data.sheets) || !data.sheets.length)
    throw new Error('시트를 하나 이상 전달해 주세요.');
  if (data.sheets.length > SHEET_MAX_SHEETS)
    throw new Error(`시트는 ${SHEET_MAX_SHEETS}개까지 만들 수 있어요.`);
  const sheets = data.sheets.map((item) => {
    const row = record(item);
    const sheet: SpreadsheetSheet = {
      id: text(row.id),
      name: text(row.name, 50),
      rows: integer(
        row.rows,
        1,
        SHEET_MAX_ROWS,
        `행은 1~${SHEET_MAX_ROWS} 사이로 입력해 주세요.`,
      ),
      columns: integer(
        row.columns,
        1,
        SHEET_MAX_COLUMNS,
        `열은 1~${SHEET_MAX_COLUMNS} 사이로 입력해 주세요.`,
      ),
      cells: {},
    };
    const cells = record(row.cells);
    const entries = Object.entries(cells);
    if (entries.length > SHEET_MAX_CELLS)
      throw new Error(
        `한 시트의 셀은 ${SHEET_MAX_CELLS}개까지 채울 수 있어요.`,
      );
    for (const [ref, item] of entries) {
      const position = parseRef(ref);
      if (
        !position ||
        position.row >= sheet.rows ||
        position.column >= sheet.columns
      )
        throw new Error(`시트 범위 밖의 셀 ${ref}이(가) 있어요.`);
      const source = record(item);
      if (
        typeof source.value !== 'string' ||
        source.value.length > SHEET_MAX_FORMULA
      )
        throw new Error(
          `셀 내용은 ${SHEET_MAX_FORMULA}자 이내로 입력해 주세요.`,
        );
      const cell: SpreadsheetCell = { value: source.value };
      if (source.format !== undefined) {
        if (!FORMATS.includes(source.format as SpreadsheetFormat))
          throw new Error('셀 형식을 다시 선택해 주세요.');
        cell.format = source.format as SpreadsheetFormat;
      }
      if (source.align !== undefined) {
        if (!['start', 'center', 'end'].includes(source.align as string))
          throw new Error('셀 정렬을 다시 선택해 주세요.');
        cell.align = source.align as SpreadsheetCell['align'];
      }
      if (source.bold !== undefined) {
        if (typeof source.bold !== 'boolean')
          throw new Error('굵게는 true 또는 false로 전달해 주세요.');
        if (source.bold) cell.bold = true;
      }
      if (cell.value !== '' || cell.format || cell.align || cell.bold)
        sheet.cells[ref.toUpperCase()] = cell;
    }
    if (row.merges !== undefined) {
      if (!Array.isArray(row.merges) || row.merges.length > 200)
        throw new Error('병합은 200개 이내의 목록으로 전달해 주세요.');
      const merges = row.merges.map((value) => {
        const range = typeof value === 'string' ? parseRange(value) : null;
        if (
          !range ||
          (range.top === range.bottom && range.left === range.right)
        )
          throw new Error('병합할 범위를 A1:B2 형식으로 지정해 주세요.');
        if (range.bottom >= sheet.rows || range.right >= sheet.columns)
          throw new Error('병합 범위가 시트를 벗어났어요.');
        return rangeLabel(range);
      });
      for (let i = 0; i < merges.length; i++)
        for (let j = i + 1; j < merges.length; j++)
          if (rangesOverlap(parseRange(merges[i]!)!, parseRange(merges[j]!)!))
            throw new Error('병합 범위끼리 겹칠 수 없어요.');
      if (merges.length) sheet.merges = merges;
    }
    for (const key of ['frozenRows', 'frozenColumns'] as const)
      if (row[key] !== undefined) {
        const max = key === 'frozenRows' ? sheet.rows : sheet.columns;
        sheet[key] = integer(
          row[key],
          0,
          max,
          '고정할 행·열 수를 시트 범위 안에서 입력해 주세요.',
        );
      }
    if (row.columnWidths !== undefined) {
      const widths = record(row.columnWidths);
      const result: Record<string, number> = {};
      for (const [column, width] of Object.entries(widths)) {
        if (columnIndex(column) >= sheet.columns)
          throw new Error('열 너비를 지정할 열이 시트에 없어요.');
        result[column.toUpperCase()] = integer(
          width,
          40,
          600,
          '열 너비는 40~600 사이로 입력해 주세요.',
        );
      }
      if (Object.keys(result).length) sheet.columnWidths = result;
    }
    return sheet;
  });
  if (new Set(sheets.map((sheet) => sheet.id)).size !== sheets.length)
    throw new Error('시트 ID는 중복할 수 없어요.');
  if (
    new Set(sheets.map((sheet) => sheet.name.toLowerCase())).size !==
    sheets.length
  )
    throw new Error('시트 이름은 중복할 수 없어요.');
  const result: SpreadsheetData = { version: 1, sheets };
  if (JSON.stringify(result).length > 2_000_000)
    throw new Error('시트 내용은 2백만 자 이내로 전달해 주세요.');
  return result;
}
const rangesOverlap = (a: SpreadsheetRange, b: SpreadsheetRange) =>
  a.left <= b.right &&
  b.left <= a.right &&
  a.top <= b.bottom &&
  b.top <= a.bottom;

// ---- formulas
type Node =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'ref'; sheet?: string; ref: string }
  | { kind: 'range'; sheet?: string; range: string }
  | { kind: 'unary'; operator: string; operand: Node }
  | { kind: 'binary'; operator: string; left: Node; right: Node }
  | { kind: 'call'; name: string; args: Node[] };
type Cursor = { source: string; index: number };
const FORMULA_ERROR = '#ERROR!';

const skip = (cursor: Cursor) => {
  while (cursor.source[cursor.index] === ' ') cursor.index++;
};
const eat = (cursor: Cursor, token: string) => {
  skip(cursor);
  if (cursor.source.startsWith(token, cursor.index)) {
    cursor.index += token.length;
    return true;
  }
  return false;
};
const NAME = /^[A-Za-z_][A-Za-z0-9_.]*/;
const parsePrimary = (cursor: Cursor): Node => {
  skip(cursor);
  const rest = cursor.source.slice(cursor.index);
  if (eat(cursor, '(')) {
    const node = parseCompare(cursor);
    if (!eat(cursor, ')')) throw new Error(FORMULA_ERROR);
    return node;
  }
  if (rest.startsWith('"')) {
    let index = 1;
    let value = '';
    while (index < rest.length) {
      if (rest[index] === '"') {
        if (rest[index + 1] === '"') {
          value += '"';
          index += 2;
          continue;
        }
        index++;
        cursor.index += index;
        return { kind: 'string', value };
      }
      value += rest[index];
      index++;
    }
    throw new Error(FORMULA_ERROR);
  }
  const number = /^\d+(\.\d+)?([eE][+-]?\d+)?/.exec(rest);
  if (number) {
    cursor.index += number[0].length;
    if (eat(cursor, '%'))
      return { kind: 'number', value: Number(number[0]) / 100 };
    return { kind: 'number', value: Number(number[0]) };
  }
  // A quoted sheet name always precedes a reference.
  const quoted = /^'((?:[^']|'')+)'!/.exec(rest);
  const sheetPrefix = quoted ?? /^([\p{L}\p{N}_][\p{L}\p{N}_ .]*)!/u.exec(rest);
  if (sheetPrefix) {
    const after = rest.slice(sheetPrefix[0].length);
    const reference =
      /^\$?[A-Za-z]{1,2}\$?\d{1,4}(:\$?[A-Za-z]{1,2}\$?\d{1,4})?/.exec(after);
    if (reference) {
      cursor.index += sheetPrefix[0].length + reference[0].length;
      const sheet = (
        quoted ? sheetPrefix[1]!.replace(/''/g, "'") : sheetPrefix[1]!
      ).trim();
      return reference[0].includes(':')
        ? { kind: 'range', sheet, range: reference[0].toUpperCase() }
        : { kind: 'ref', sheet, ref: reference[0].toUpperCase() };
    }
  }
  const reference =
    /^\$?[A-Za-z]{1,2}\$?\d{1,4}(:\$?[A-Za-z]{1,2}\$?\d{1,4})?/.exec(rest);
  const name = NAME.exec(rest);
  if (reference && (!name || reference[0].length >= name[0].length)) {
    cursor.index += reference[0].length;
    return reference[0].includes(':')
      ? { kind: 'range', range: reference[0].toUpperCase() }
      : { kind: 'ref', ref: reference[0].toUpperCase() };
  }
  if (name) {
    cursor.index += name[0].length;
    const upper = name[0].toUpperCase();
    if (upper === 'TRUE' || upper === 'FALSE')
      return { kind: 'boolean', value: upper === 'TRUE' };
    if (!eat(cursor, '(')) throw new Error('#NAME?');
    const args: Node[] = [];
    skip(cursor);
    if (!eat(cursor, ')')) {
      do {
        args.push(parseCompare(cursor));
      } while (eat(cursor, ','));
      if (!eat(cursor, ')')) throw new Error(FORMULA_ERROR);
    }
    return { kind: 'call', name: upper, args };
  }
  throw new Error(FORMULA_ERROR);
};
const parseUnary = (cursor: Cursor): Node => {
  skip(cursor);
  if (eat(cursor, '-'))
    return { kind: 'unary', operator: '-', operand: parseUnary(cursor) };
  if (eat(cursor, '+')) return parseUnary(cursor);
  const node = parsePrimary(cursor);
  if (eat(cursor, '^'))
    return {
      kind: 'binary',
      operator: '^',
      left: node,
      right: parseUnary(cursor),
    };
  if (eat(cursor, '%'))
    return {
      kind: 'binary',
      operator: '/',
      left: node,
      right: { kind: 'number', value: 100 },
    };
  return node;
};
const parseMul = (cursor: Cursor): Node => {
  let left = parseUnary(cursor);
  for (;;) {
    skip(cursor);
    const operator = eat(cursor, '*') ? '*' : eat(cursor, '/') ? '/' : '';
    if (!operator) return left;
    left = { kind: 'binary', operator, left, right: parseUnary(cursor) };
  }
};
const parseAdd = (cursor: Cursor): Node => {
  let left = parseMul(cursor);
  for (;;) {
    skip(cursor);
    const operator = eat(cursor, '+') ? '+' : eat(cursor, '-') ? '-' : '';
    if (!operator) return left;
    left = { kind: 'binary', operator, left, right: parseMul(cursor) };
  }
};
const parseConcat = (cursor: Cursor): Node => {
  let left = parseAdd(cursor);
  while (eat(cursor, '&'))
    left = { kind: 'binary', operator: '&', left, right: parseAdd(cursor) };
  return left;
};
function parseCompare(cursor: Cursor): Node {
  let left = parseConcat(cursor);
  for (;;) {
    skip(cursor);
    const operator = ['<=', '>=', '<>', '=', '<', '>'].find((item) =>
      cursor.source.startsWith(item, cursor.index),
    );
    if (!operator) return left;
    cursor.index += operator.length;
    left = { kind: 'binary', operator, left, right: parseConcat(cursor) };
  }
}
/** Parses a formula body (without the leading `=`). Throws on malformed input. */
export function parseFormula(source: string): Node {
  const cursor: Cursor = { source, index: 0 };
  const node = parseCompare(cursor);
  skip(cursor);
  if (cursor.index !== source.length) throw new Error(FORMULA_ERROR);
  return node;
}

const isError = (value: unknown): value is SpreadsheetError =>
  typeof value === 'string' &&
  (SPREADSHEET_ERRORS as readonly string[]).includes(value);
const toNumber = (value: SpreadsheetValue): number | SpreadsheetError => {
  if (isError(value)) return value;
  if (value === null || value === '') return 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value;
  const trimmed = value.trim().replace(/,/g, '');
  if (trimmed === '' || !/^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(trimmed))
    return '#VALUE!';
  return Number(trimmed);
};
const toText = (value: SpreadsheetValue): string => {
  if (value === null) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
};
/** Reads a literal cell: numbers and booleans become typed values. */
export function literalValue(raw: string): SpreadsheetValue {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const upper = trimmed.toUpperCase();
  if (upper === 'TRUE' || upper === 'FALSE') return upper === 'TRUE';
  if (/^-?\d*\.?\d+([eE][+-]?\d+)?%?$/.test(trimmed.replace(/,/g, ''))) {
    const clean = trimmed.replace(/,/g, '');
    return clean.endsWith('%')
      ? Number(clean.slice(0, -1)) / 100
      : Number(clean);
  }
  return raw;
}
type Flat = SpreadsheetValue[];
const matches = (
  value: SpreadsheetValue,
  criteria: SpreadsheetValue,
): boolean => {
  const raw = toText(criteria).trim();
  const comparison = /^(<=|>=|<>|=|<|>)(.*)$/.exec(raw);
  if (comparison) {
    const operator = comparison[1]!;
    const target = literalValue(comparison[2]!.trim());
    const left = typeof value === 'number' ? value : toText(value);
    const right = typeof target === 'number' ? target : toText(target);
    if (typeof left !== typeof right) return operator === '<>';
    if (operator === '=') return left === right;
    if (operator === '<>') return left !== right;
    if (operator === '<') return left < right;
    if (operator === '<=') return left <= right;
    if (operator === '>') return left > right;
    return left >= right;
  }
  const target = literalValue(raw);
  return typeof target === 'number' && typeof value === 'number'
    ? value === target
    : toText(value).toLowerCase() === toText(target).toLowerCase();
};
const FUNCTIONS: Record<string, (args: Flat[]) => SpreadsheetValue> = {
  SUM: (args) => sumOf(args.flat()),
  AVERAGE: (args) => {
    const numbers = args.flat().filter((item) => typeof item === 'number');
    if (!numbers.length) return '#DIV/0!';
    const total = sumOf(numbers);
    return typeof total === 'number' ? total / numbers.length : total;
  },
  COUNT: (args) =>
    args.flat().filter((item) => typeof item === 'number').length,
  COUNTA: (args) =>
    args.flat().filter((item) => item !== null && item !== '').length,
  MIN: (args) => extreme(args.flat(), 'min'),
  MAX: (args) => extreme(args.flat(), 'max'),
  ABS: (args) => single(args, Math.abs),
  SQRT: (args) =>
    single(args, (value) => (value < 0 ? '#VALUE!' : Math.sqrt(value))),
  ROUND: (args) => {
    const value = toNumber(args[0]?.[0] ?? null);
    const digits = toNumber(args[1]?.[0] ?? 0);
    if (isError(value)) return value;
    if (isError(digits)) return digits;
    const factor = 10 ** Math.trunc(digits);
    return Math.round(value * factor) / factor;
  },
  POWER: (args) => {
    const base = toNumber(args[0]?.[0] ?? null);
    const exponent = toNumber(args[1]?.[0] ?? null);
    if (isError(base)) return base;
    if (isError(exponent)) return exponent;
    return base ** exponent;
  },
  MOD: (args) => {
    const value = toNumber(args[0]?.[0] ?? null);
    const divisor = toNumber(args[1]?.[0] ?? null);
    if (isError(value)) return value;
    if (isError(divisor)) return divisor;
    return divisor === 0 ? '#DIV/0!' : value % divisor;
  },
  IF: (args) => {
    const condition = args[0]?.[0] ?? null;
    if (isError(condition)) return condition;
    const truthy =
      typeof condition === 'number'
        ? condition !== 0
        : typeof condition === 'boolean'
          ? condition
          : toText(condition).toUpperCase() === 'TRUE';
    const branch = truthy ? args[1] : args[2];
    return branch === undefined ? truthy : (branch[0] ?? null);
  },
  IFERROR: (args) =>
    isError(args[0]?.[0] ?? null)
      ? (args[1]?.[0] ?? null)
      : (args[0]?.[0] ?? null),
  AND: (args) => args.flat().every((item) => truthy(item)),
  OR: (args) => args.flat().some((item) => truthy(item)),
  NOT: (args) => !truthy(args[0]?.[0] ?? null),
  LEN: (args) => toText(args[0]?.[0] ?? null).length,
  LEFT: (args) => toText(args[0]?.[0] ?? null).slice(0, count(args[1])),
  RIGHT: (args) => {
    const value = toText(args[0]?.[0] ?? null);
    const size = count(args[1]);
    return size >= value.length ? value : value.slice(value.length - size);
  },
  MID: (args) => {
    const start = count(args[1]);
    return toText(args[0]?.[0] ?? null).slice(
      Math.max(0, start - 1),
      Math.max(0, start - 1) + count(args[2]),
    );
  },
  UPPER: (args) => toText(args[0]?.[0] ?? null).toUpperCase(),
  LOWER: (args) => toText(args[0]?.[0] ?? null).toLowerCase(),
  TRIM: (args) => toText(args[0]?.[0] ?? null).trim(),
  CONCAT: (args) => args.flat().map(toText).join(''),
  CONCATENATE: (args) => args.flat().map(toText).join(''),
  COUNTIF: (args) =>
    (args[0] ?? []).filter((item) => matches(item, args[1]?.[0] ?? null))
      .length,
  SUMIF: (args) => {
    const source = args[0] ?? [];
    const target = args[2] ?? source;
    const picked = source
      .map((item, index) =>
        matches(item, args[1]?.[0] ?? null) ? (target[index] ?? null) : null,
      )
      .filter((item) => item !== null);
    return sumOf(picked);
  },
};
const truthy = (value: SpreadsheetValue) =>
  typeof value === 'boolean'
    ? value
    : typeof value === 'number'
      ? value !== 0
      : toText(value).toUpperCase() === 'TRUE';
const count = (values: Flat | undefined) => {
  const size = toNumber(values?.[0] ?? 0);
  return isError(size) ? 0 : Math.max(0, Math.trunc(size));
};
const sumOf = (values: Flat): SpreadsheetValue => {
  let total = 0;
  for (const item of values) {
    if (isError(item)) return item;
    if (item === null || item === '' || typeof item === 'string') continue;
    total += typeof item === 'boolean' ? (item ? 1 : 0) : item;
  }
  return total;
};
const single = (
  args: Flat[],
  apply: (value: number) => number | SpreadsheetError,
): SpreadsheetValue => {
  const value = toNumber(args[0]?.[0] ?? null);
  return isError(value) ? value : apply(value);
};
const extreme = (values: Flat, mode: 'min' | 'max'): SpreadsheetValue => {
  const numbers: number[] = [];
  for (const item of values) {
    if (isError(item)) return item;
    if (typeof item === 'number') numbers.push(item);
  }
  if (!numbers.length) return 0;
  return mode === 'min' ? Math.min(...numbers) : Math.max(...numbers);
};

export interface SpreadsheetResult {
  value: SpreadsheetValue;
  /** Present when the cell holds an error instead of a value. */
  error?: SpreadsheetError;
}
const collectRefs = (node: Node, into: { sheet?: string; ref: string }[]) => {
  if (node.kind === 'ref') into.push({ sheet: node.sheet, ref: node.ref });
  else if (node.kind === 'range') {
    const range = parseRange(node.range);
    if (range)
      for (const ref of rangeRefs(range)) into.push({ sheet: node.sheet, ref });
  } else if (node.kind === 'unary') collectRefs(node.operand, into);
  else if (node.kind === 'binary') {
    collectRefs(node.left, into);
    collectRefs(node.right, into);
  } else if (node.kind === 'call')
    for (const arg of node.args) collectRefs(arg, into);
};
const clean = (ref: string) => ref.replace(/\$/g, '').toUpperCase();

/** Every cell's value, keyed by `sheetId!A1`. Formulas run in dependency order. */
export function evaluateSpreadsheet(
  data: SpreadsheetData,
): Map<string, SpreadsheetResult> {
  const results = new Map<string, SpreadsheetResult>();
  const byName = new Map(
    data.sheets.map((sheet) => [sheet.name.toLowerCase(), sheet.id]),
  );
  const sheetIds = new Set(data.sheets.map((sheet) => sheet.id));
  const formulas = new Map<string, { sheetId: string; node: Node | null }>();
  for (const sheet of data.sheets)
    for (const [ref, cell] of Object.entries(sheet.cells)) {
      const key = `${sheet.id}!${clean(ref)}`;
      if (!cell.value.startsWith('=')) {
        results.set(key, { value: literalValue(cell.value) });
        continue;
      }
      try {
        formulas.set(key, {
          sheetId: sheet.id,
          node: parseFormula(cell.value.slice(1)),
        });
      } catch (failure) {
        const code = failure instanceof Error ? failure.message : '';
        const error: SpreadsheetError =
          code === '#NAME?' ? '#NAME?' : '#VALUE!';
        results.set(key, { value: error, error });
        formulas.set(key, { sheetId: sheet.id, node: null });
      }
    }
  const keyOf = (sheetId: string, sheet: string | undefined, ref: string) => {
    if (!sheet) return `${sheetId}!${clean(ref)}`;
    const target =
      byName.get(sheet.toLowerCase()) ?? (sheetIds.has(sheet) ? sheet : '');
    return target ? `${target}!${clean(ref)}` : '';
  };
  const dependencies = new Map<string, string[]>();
  for (const [key, entry] of formulas) {
    if (!entry.node) continue;
    const refs: { sheet?: string; ref: string }[] = [];
    collectRefs(entry.node, refs);
    dependencies.set(
      key,
      refs
        .map((item) => keyOf(entry.sheetId, item.sheet, item.ref))
        .filter((item) => item && formulas.has(item)),
    );
  }
  // Depth-first ordering; anything still on the stack when revisited is circular.
  const state = new Map<string, 0 | 1 | 2>();
  const order: string[] = [];
  const circular = new Set<string>();
  const visit = (key: string, stack: string[]) => {
    const current = state.get(key) ?? 0;
    if (current === 2) return;
    if (current === 1) {
      const start = stack.indexOf(key);
      for (const item of stack.slice(start < 0 ? 0 : start)) circular.add(item);
      return;
    }
    state.set(key, 1);
    stack.push(key);
    for (const dependency of dependencies.get(key) ?? [])
      visit(dependency, stack);
    stack.pop();
    state.set(key, 2);
    order.push(key);
  };
  for (const key of formulas.keys()) visit(key, []);
  const read = (
    sheetId: string,
    sheet: string | undefined,
    ref: string,
  ): SpreadsheetValue => {
    const key = keyOf(sheetId, sheet, ref);
    if (!key) return '#REF!';
    return results.get(key)?.value ?? null;
  };
  const evaluate = (node: Node, sheetId: string): SpreadsheetValue | Flat => {
    switch (node.kind) {
      case 'number':
      case 'string':
      case 'boolean':
        return node.value;
      case 'ref':
        return read(sheetId, node.sheet, node.ref);
      case 'range': {
        const range = parseRange(node.range);
        if (!range) return '#REF!';
        return rangeRefs(range).map((ref) => read(sheetId, node.sheet, ref));
      }
      case 'unary': {
        const operand = scalar(evaluate(node.operand, sheetId));
        const value = toNumber(operand);
        return isError(value) ? value : -value;
      }
      case 'binary': {
        const left = scalar(evaluate(node.left, sheetId));
        const right = scalar(evaluate(node.right, sheetId));
        if (isError(left)) return left;
        if (isError(right)) return right;
        if (node.operator === '&') return toText(left) + toText(right);
        if (['=', '<>', '<', '<=', '>', '>='].includes(node.operator)) {
          const a =
            typeof left === 'number' ? left : toText(left).toLowerCase();
          const b =
            typeof right === 'number' ? right : toText(right).toLowerCase();
          if (typeof a !== typeof b)
            return node.operator === '<>'
              ? true
              : node.operator === '='
                ? false
                : '#VALUE!';
          switch (node.operator) {
            case '=':
              return a === b;
            case '<>':
              return a !== b;
            case '<':
              return a < b;
            case '<=':
              return a <= b;
            case '>':
              return a > b;
            default:
              return a >= b;
          }
        }
        const a = toNumber(left);
        const b = toNumber(right);
        if (isError(a)) return a;
        if (isError(b)) return b;
        switch (node.operator) {
          case '+':
            return a + b;
          case '-':
            return a - b;
          case '*':
            return a * b;
          case '^':
            return a ** b;
          default:
            return b === 0 ? '#DIV/0!' : a / b;
        }
      }
      case 'call': {
        const handler = FUNCTIONS[node.name];
        if (!handler) return '#NAME?';
        const args = node.args.map((arg) => {
          const value = evaluate(arg, sheetId);
          return Array.isArray(value) ? value : [value];
        });
        const failed = args.flat().find((item) => isError(item));
        // IF and IFERROR decide for themselves what an error means.
        if (failed && node.name !== 'IFERROR' && node.name !== 'IF')
          return failed;
        return handler(args);
      }
    }
  };
  const scalar = (value: SpreadsheetValue | Flat): SpreadsheetValue =>
    Array.isArray(value)
      ? value.length === 1
        ? (value[0] ?? null)
        : '#VALUE!'
      : value;
  for (const key of order) {
    const entry = formulas.get(key);
    if (!entry?.node) continue;
    if (circular.has(key)) {
      results.set(key, { value: '#순환!', error: '#순환!' });
      continue;
    }
    let value: SpreadsheetValue;
    try {
      value = scalar(evaluate(entry.node, entry.sheetId));
    } catch {
      value = '#VALUE!';
    }
    results.set(key, isError(value) ? { value, error: value } : { value });
  }
  for (const key of circular)
    results.set(key, { value: '#순환!', error: '#순환!' });
  return results;
}

/** Text shown in a cell for a computed value. */
export function formatCellValue(
  value: SpreadsheetValue,
  format?: SpreadsheetFormat,
): string {
  if (value === null) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value !== 'number' || format === 'text') return String(value);
  switch (format) {
    case 'integer':
      return Math.round(value).toLocaleString('ko-KR');
    case 'currency':
      return `${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원`;
    case 'percent':
      return `${(value * 100).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`;
    case 'number':
      return value.toLocaleString('ko-KR', { maximumFractionDigits: 10 });
    default:
      return String(value);
  }
}

// ---- editing
const cellsOf = (sheet: SpreadsheetSheet) => ({ ...sheet.cells });
const withSheet = (
  data: SpreadsheetData,
  sheetId: string,
  apply: (sheet: SpreadsheetSheet) => SpreadsheetSheet,
): SpreadsheetData => {
  if (!data.sheets.some((sheet) => sheet.id === sheetId))
    throw new Error('변경할 시트가 없어요. 현재 시트를 다시 확인해 주세요.');
  return {
    ...data,
    sheets: data.sheets.map((sheet) =>
      sheet.id === sheetId ? apply(sheet) : sheet,
    ),
  };
};
/** Shifts relative references by a row and column delta, keeping `$` anchors. */
export function shiftFormula(source: string, dr: number, dc: number): string {
  let output = '';
  let index = 0;
  while (index < source.length) {
    const char = source[index]!;
    if (char === '"') {
      const end = source.indexOf('"', index + 1);
      const stop = end < 0 ? source.length : end + 1;
      output += source.slice(index, stop);
      index = stop;
      continue;
    }
    const match = /^(\$?)([A-Za-z]{1,2})(\$?)(\d{1,4})/.exec(
      source.slice(index),
    );
    if (match && !/[A-Za-z0-9_.]/.test(source[index - 1] ?? '')) {
      const [whole, columnAnchor, letters, rowAnchor, digits] = match;
      const column = columnIndex(letters!) + (columnAnchor ? 0 : dc);
      const row = Number(digits) - 1 + (rowAnchor ? 0 : dr);
      if (
        column < 0 ||
        row < 0 ||
        column >= SHEET_MAX_COLUMNS ||
        row >= SHEET_MAX_ROWS
      )
        output += '#REF!';
      else
        output += `${columnAnchor}${columnLabel(column)}${rowAnchor}${row + 1}`;
      index += whole!.length;
      continue;
    }
    output += char;
    index += 1;
  }
  return output;
}
/** Raw cell text for a range, row by row. */
export function copyRange(
  sheet: SpreadsheetSheet,
  range: SpreadsheetRange,
): string[][] {
  const rows: string[][] = [];
  for (let row = range.top; row <= range.bottom; row++) {
    const line: string[] = [];
    for (let column = range.left; column <= range.right; column++)
      line.push(sheet.cells[cellRef(row, column)]?.value ?? '');
    rows.push(line);
  }
  return rows;
}
/** Edits that write `matrix` with its top-left corner at `target`. */
export function pasteEdits(
  target: { row: number; column: number },
  matrix: readonly (readonly string[])[],
  shift?: { row: number; column: number },
): SpreadsheetCellEdit[] {
  const edits: SpreadsheetCellEdit[] = [];
  matrix.forEach((line, rowOffset) =>
    line.forEach((value, columnOffset) => {
      const row = target.row + rowOffset;
      const column = target.column + columnOffset;
      if (row >= SHEET_MAX_ROWS || column >= SHEET_MAX_COLUMNS) return;
      edits.push({
        ref: cellRef(row, column),
        value:
          shift && value.startsWith('=')
            ? `=${shiftFormula(value.slice(1), row - shift.row - rowOffset, column - shift.column - columnOffset)}`
            : value,
      });
    }),
  );
  return edits;
}
/**
 * Fill handle: repeats the source block over the target, continuing a numeric run
 * and moving relative references in formulas.
 */
export function fillEdits(
  sheet: SpreadsheetSheet,
  source: SpreadsheetRange,
  target: SpreadsheetRange,
): SpreadsheetCellEdit[] {
  const height = source.bottom - source.top + 1;
  const width = source.right - source.left + 1;
  const values = copyRange(sheet, source);
  const numeric =
    height > 1 &&
    width === 1 &&
    values.every((line) => typeof literalValue(line[0] ?? '') === 'number');
  const step =
    numeric && height > 1
      ? (literalValue(values.at(-1)?.[0] ?? '') as number) -
        (literalValue(values.at(-2)?.[0] ?? '') as number)
      : 0;
  const edits: SpreadsheetCellEdit[] = [];
  for (let row = target.top; row <= target.bottom; row++)
    for (let column = target.left; column <= target.right; column++) {
      if (
        row >= source.top &&
        row <= source.bottom &&
        column >= source.left &&
        column <= source.right
      )
        continue;
      const rowOffset = (((row - source.top) % height) + height) % height;
      const columnOffset = (((column - source.left) % width) + width) % width;
      const raw = values[rowOffset]?.[columnOffset] ?? '';
      if (numeric && step !== 0) {
        const last = literalValue(values.at(-1)?.[0] ?? '') as number;
        const distance = row - source.bottom;
        edits.push({
          ref: cellRef(row, column),
          value: String(last + step * distance),
        });
        continue;
      }
      edits.push({
        ref: cellRef(row, column),
        value: raw.startsWith('=')
          ? `=${shiftFormula(raw.slice(1), row - source.top - rowOffset, column - source.left - columnOffset)}`
          : raw,
      });
    }
  return edits;
}

export function updateSpreadsheet(
  input: SpreadsheetData,
  action: SpreadsheetAction,
): SpreadsheetData {
  const data = validateSpreadsheet(input);
  switch (action.type) {
    case 'set-cells':
      return validateSpreadsheet(
        withSheet(data, action.sheetId, (sheet) => {
          const cells = cellsOf(sheet);
          for (const edit of action.cells) {
            const ref = clean(edit.ref);
            const current = cells[ref];
            const next: SpreadsheetCell = {
              value: edit.value ?? current?.value ?? '',
            };
            const format =
              edit.format === undefined ? current?.format : edit.format;
            const align =
              edit.align === undefined ? current?.align : edit.align;
            const bold = edit.bold === undefined ? current?.bold : edit.bold;
            if (format) next.format = format;
            if (align) next.align = align;
            if (bold) next.bold = true;
            if (next.value === '' && !next.format && !next.align && !next.bold)
              delete cells[ref];
            else cells[ref] = next;
          }
          return { ...sheet, cells };
        }),
      );
    case 'resize-sheet': {
      integer(
        action.rows,
        1,
        SHEET_MAX_ROWS,
        `행은 1~${SHEET_MAX_ROWS} 사이로 입력해 주세요.`,
      );
      integer(
        action.columns,
        1,
        SHEET_MAX_COLUMNS,
        `열은 1~${SHEET_MAX_COLUMNS} 사이로 입력해 주세요.`,
      );
      return validateSpreadsheet(
        withSheet(data, action.sheetId, (sheet) => {
          const cells = cellsOf(sheet);
          const dropped = Object.keys(cells).filter((ref) => {
            const position = parseRef(ref);
            return (
              !position ||
              position.row >= action.rows ||
              position.column >= action.columns
            );
          });
          if (dropped.some((ref) => (cells[ref]?.value ?? '') !== ''))
            throw new Error(
              '줄이려는 범위에 내용이 있어요. 셀을 비운 뒤 다시 시도해 주세요.',
            );
          for (const ref of dropped) delete cells[ref];
          return {
            ...sheet,
            rows: action.rows,
            columns: action.columns,
            cells,
            frozenRows:
              Math.min(sheet.frozenRows ?? 0, action.rows) || undefined,
            frozenColumns:
              Math.min(sheet.frozenColumns ?? 0, action.columns) || undefined,
            merges: sheet.merges?.filter((item) => {
              const range = parseRange(item)!;
              return range.bottom < action.rows && range.right < action.columns;
            }),
          };
        }),
      );
    }
    case 'set-column-width':
      return validateSpreadsheet(
        withSheet(data, action.sheetId, (sheet) => ({
          ...sheet,
          columnWidths: {
            ...sheet.columnWidths,
            [action.column.toUpperCase()]: action.width,
          },
        })),
      );
    case 'merge':
      return validateSpreadsheet(
        withSheet(data, action.sheetId, (sheet) => {
          const range = parseRange(action.range);
          if (!range)
            throw new Error('병합할 범위를 A1:B2 형식으로 지정해 주세요.');
          const cells = cellsOf(sheet);
          const keep = cellRef(range.top, range.left);
          for (const ref of rangeRefs(range))
            if (ref !== keep && (cells[ref]?.value ?? '') !== '')
              throw new Error(
                '병합할 범위에 다른 내용이 있어요. 왼쪽 위 셀만 남기고 비워 주세요.',
              );
          return {
            ...sheet,
            merges: [...(sheet.merges ?? []), rangeLabel(range)],
          };
        }),
      );
    case 'unmerge':
      return validateSpreadsheet(
        withSheet(data, action.sheetId, (sheet) => {
          const range = parseRange(action.range);
          const label = range ? rangeLabel(range) : '';
          if (!sheet.merges?.includes(label))
            throw new Error('해제할 병합이 없어요.');
          const merges = sheet.merges.filter((item) => item !== label);
          return { ...sheet, merges: merges.length ? merges : undefined };
        }),
      );
    case 'freeze':
      return validateSpreadsheet(
        withSheet(data, action.sheetId, (sheet) => ({
          ...sheet,
          frozenRows: action.rows || undefined,
          frozenColumns: action.columns || undefined,
        })),
      );
    case 'sort': {
      return validateSpreadsheet(
        withSheet(data, action.sheetId, (sheet) => {
          const range = parseRange(action.range);
          const column = parseRef(`${action.column}1`);
          if (!range || !column)
            throw new Error('정렬할 범위를 다시 선택해 주세요.');
          if (column.column < range.left || column.column > range.right)
            throw new Error('정렬 기준 열이 선택 범위 밖이에요.');
          const cells = cellsOf(sheet);
          const top = range.top + (action.header ? 1 : 0);
          const rows: {
            cells: (SpreadsheetCell | undefined)[];
            key: SpreadsheetValue;
          }[] = [];
          for (let row = top; row <= range.bottom; row++) {
            const line: (SpreadsheetCell | undefined)[] = [];
            for (let index = range.left; index <= range.right; index++) {
              const cell = cells[cellRef(row, index)];
              if (cell?.value.startsWith('='))
                throw new Error(
                  '정렬할 범위에 수식이 있어요. 값만 있는 범위를 선택해 주세요.',
                );
              line.push(cell);
            }
            rows.push({
              cells: line,
              key: literalValue(
                cells[cellRef(row, column.column)]?.value ?? '',
              ),
            });
          }
          rows.sort((a, b) => {
            const left = a.key;
            const right = b.key;
            if (left === null) return right === null ? 0 : 1;
            if (right === null) return -1;
            const order =
              typeof left === 'number' && typeof right === 'number'
                ? left - right
                : String(left).localeCompare(String(right), 'ko-KR');
            return action.direction === 'asc' ? order : -order;
          });
          rows.forEach((line, offset) => {
            line.cells.forEach((cell, index) => {
              const ref = cellRef(top + offset, range.left + index);
              if (cell) cells[ref] = cell;
              else delete cells[ref];
            });
          });
          return { ...sheet, cells };
        }),
      );
    }
    case 'add-sheet': {
      if (data.sheets.length >= SHEET_MAX_SHEETS)
        throw new Error(`시트는 ${SHEET_MAX_SHEETS}개까지 만들 수 있어요.`);
      return validateSpreadsheet({
        ...data,
        sheets: [...data.sheets, action.sheet],
      });
    }
    case 'rename-sheet':
      return validateSpreadsheet(
        withSheet(data, action.sheetId, (sheet) => ({
          ...sheet,
          name: action.name,
        })),
      );
    case 'delete-sheet': {
      if (data.sheets.length <= 1)
        throw new Error('시트는 하나 이상 남겨 주세요.');
      if (!data.sheets.some((sheet) => sheet.id === action.sheetId))
        throw new Error(
          '변경할 시트가 없어요. 현재 시트를 다시 확인해 주세요.',
        );
      return validateSpreadsheet({
        ...data,
        sheets: data.sheets.filter((sheet) => sheet.id !== action.sheetId),
      });
    }
    default:
      throw new Error('지원하지 않는 시트 변경이에요.');
  }
}

// ---- text formats
const csvCell = (value: string) =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
/** Computed values as CSV, trimmed to the used range. */
export function sheetToCsv(
  sheet: SpreadsheetSheet,
  results?: Map<string, SpreadsheetResult>,
): string {
  const used = usedRange(sheet);
  if (!used) return '';
  const lines: string[] = [];
  for (let row = used.top; row <= used.bottom; row++) {
    const line: string[] = [];
    for (let column = used.left; column <= used.right; column++) {
      const ref = cellRef(row, column);
      const cell = sheet.cells[ref];
      const computed = results?.get(`${sheet.id}!${ref}`);
      line.push(
        csvCell(
          computed
            ? formatCellValue(computed.value, cell?.format)
            : (cell?.value ?? ''),
        ),
      );
    }
    lines.push(line.join(','));
  }
  return lines.join('\r\n');
}
export function usedRange(sheet: SpreadsheetSheet): SpreadsheetRange | null {
  const refs = Object.keys(sheet.cells)
    .map((ref) => parseRef(ref))
    .filter((item): item is { row: number; column: number } => !!item);
  if (!refs.length) return null;
  return {
    top: Math.min(...refs.map((item) => item.row)),
    left: Math.min(...refs.map((item) => item.column)),
    bottom: Math.max(...refs.map((item) => item.row)),
    right: Math.max(...refs.map((item) => item.column)),
  };
}
/** RFC 4180 rows, also used for `text/plain` clipboard data when tab separated. */
export function parseDelimited(source: string, separator = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          value += '"';
          index++;
        } else quoted = false;
      } else value += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === separator) {
      row.push(value);
      value = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index++;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else value += char;
  }
  if (value !== '' || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}
export function serializeSpreadsheet(data: SpreadsheetData): string {
  return JSON.stringify(validateSpreadsheet(data));
}
export function parseSpreadsheet(source: string): SpreadsheetData {
  if (typeof source !== 'string' || source.length > 2_000_000)
    throw new Error('시트 파일은 2백만 자 이내로 불러와 주세요.');
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    throw new Error('시트 JSON 형식을 확인해 주세요.');
  }
  return validateSpreadsheet(data);
}
