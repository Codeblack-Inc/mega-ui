import { quoteDelimitedCell as quote } from '../internal/delimited.ts';
import type { Column, SortColumn } from 'react-data-grid';

export type GridSummary = Record<string, string | number>;
export interface GridColumn<R extends object> extends Omit<
  Column<R, GridSummary>,
  'name' | 'renderEditCell' | 'editable'
> {
  header: string;
  value?: (row: R) => unknown;
  setValue?: (row: R, value: unknown) => R;
  editable?: boolean | ((row: R) => boolean);
  kind?: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: readonly string[];
  parse?: (text: string, row: R) => unknown;
  validate?: (value: unknown, row: R) => string | undefined;
  filterable?: boolean;
  groupable?: boolean;
  aggregate?: 'sum' | 'average' | 'min' | 'max' | 'count';
}
export type GridFilterOperator =
  | 'contains'
  | 'equals'
  | 'notEquals'
  | 'startsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'empty'
  | 'notEmpty';
export interface GridFilter {
  columnKey: string;
  operator: GridFilterOperator;
  value: string;
}
export interface GridColumnState {
  key: string;
  hidden?: boolean;
  frozen?: false | 'start' | 'end';
  width?: number;
}
export interface GridView {
  query: string;
  filters: readonly GridFilter[];
  sorts: readonly SortColumn[];
  groupBy: readonly string[];
  columns: readonly GridColumnState[];
  page: number;
  pageSize: number;
}
export interface GridChange {
  rowId: string;
  columnKey: string;
  previousValue: unknown;
  value: unknown;
}
export interface GridCellAddress {
  rowId: string;
  columnKey: string;
}
export interface GridCellError extends GridCellAddress {
  message: string;
}
export const defaultGridView: GridView = {
  query: '',
  filters: [],
  sorts: [],
  groupBy: [],
  columns: [],
  page: 1,
  pageSize: 100,
};
const collator = new Intl.Collator('ko', {
  numeric: true,
  sensitivity: 'base',
});
export const gridCellKey = (cell: GridCellAddress) =>
  JSON.stringify([cell.rowId, cell.columnKey]);
export const gridValue = <R extends object>(
  row: R,
  column: GridColumn<R>,
): unknown =>
  column.value
    ? column.value(row)
    : (row as Record<string, unknown>)[column.key];
export const gridEditable = <R extends object>(
  row: R,
  column: GridColumn<R>,
) =>
  typeof column.editable === 'function'
    ? column.editable(row)
    : column.editable === true;
export function setGridValue<R extends object>(
  row: R,
  column: GridColumn<R>,
  value: unknown,
): R {
  return column.setValue
    ? column.setValue(row, value)
    : { ...row, [column.key]: value };
}
function empty(value: unknown) {
  return value === null || value === undefined || value === '';
}
function compare(a: unknown, b: unknown): number {
  if (empty(a)) return empty(b) ? 0 : 1;
  if (empty(b)) return -1;
  return typeof a === 'number' && typeof b === 'number'
    ? a - b
    : collator.compare(String(a), String(b));
}
export function gridFilterMatches<R extends object>(
  row: R,
  column: GridColumn<R>,
  filter: GridFilter,
): boolean {
  const value = gridValue(row, column);
  const text = String(value ?? '').toLocaleLowerCase('ko');
  const needle = filter.value.toLocaleLowerCase('ko');
  if (filter.operator === 'empty') return empty(value);
  if (filter.operator === 'notEmpty') return !empty(value);
  if (filter.operator === 'contains') return text.includes(needle);
  if (filter.operator === 'startsWith') return text.startsWith(needle);
  if (filter.operator === 'equals') return text === needle;
  if (filter.operator === 'notEquals') return text !== needle;
  if (empty(value)) return false;
  const target = column.kind === 'number' ? Number(filter.value) : filter.value;
  if (
    typeof target === 'number' &&
    (!filter.value.trim() || !Number.isFinite(target))
  )
    return false;
  const result = compare(value, target);
  return filter.operator === 'gt'
    ? result > 0
    : filter.operator === 'gte'
      ? result >= 0
      : filter.operator === 'lt'
        ? result < 0
        : result <= 0;
}
export function getGridRows<R extends object>(
  rows: readonly R[],
  columns: readonly GridColumn<R>[],
  view: GridView,
  manual = false,
): R[] {
  if (manual) return [...rows];
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const query = view.query.trim().toLocaleLowerCase('ko');
  const result = rows.filter(
    (row) =>
      (!query ||
        columns.some(
          (c) =>
            c.filterable !== false &&
            String(gridValue(row, c) ?? '')
              .toLocaleLowerCase('ko')
              .includes(query),
        )) &&
      view.filters.every((filter) => {
        const column = byKey.get(filter.columnKey);
        return (
          !column ||
          column.filterable === false ||
          gridFilterMatches(row, column, filter)
        );
      }),
  );
  const sorts = view.sorts.flatMap((sort) => {
    const column = byKey.get(sort.columnKey);
    return column && column.sortable !== false
      ? [{ column, direction: sort.direction }]
      : [];
  });
  if (sorts.length)
    result.sort((a, b) => {
      for (const { column, direction } of sorts) {
        const av = gridValue(a, column),
          bv = gridValue(b, column);
        const result = compare(av, bv);
        if (result)
          return empty(av) || empty(bv)
            ? result
            : direction === 'ASC'
              ? result
              : -result;
      }
      return 0;
    });
  return result;
}
export function parseGridValue<R extends object>(
  text: string,
  row: R,
  column: GridColumn<R>,
): unknown {
  let value: unknown = text;
  if (column.parse) value = column.parse(text, row);
  else if (column.kind === 'number') {
    value = text.trim() === '' ? null : Number(text);
    if (value !== null && !Number.isFinite(value))
      throw new Error('유한한 숫자를 입력해 주세요.');
  } else if (column.kind === 'boolean') {
    if (!/^(true|false|1|0)$/i.test(text))
      throw new Error('true 또는 false를 입력해 주세요.');
    value = /^(true|1)$/i.test(text);
  } else if (column.kind === 'date' && text) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(text) ||
      !Number.isFinite(Date.parse(text)) ||
      new Date(text).toISOString().slice(0, 10) !== text
    )
      throw new Error('유효한 날짜를 YYYY-MM-DD로 입력해 주세요.');
  } else if (column.kind === 'select' && !column.options?.includes(text))
    throw new Error('목록에 있는 값을 선택해 주세요.');
  return value;
}
export function applyGridChanges<R extends object>(
  rows: readonly R[],
  columns: readonly GridColumn<R>[],
  changes: readonly GridChange[],
  getRowId: (row: R) => string,
): R[] {
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const byRow = new Map<string, GridChange[]>();
  for (const change of changes) {
    const list = byRow.get(change.rowId) ?? [];
    list.push(change);
    byRow.set(change.rowId, list);
  }
  return rows.map((row) =>
    (byRow.get(getRowId(row)) ?? []).reduce((next, change) => {
      const column = byKey.get(change.columnKey);
      return column ? setGridValue(next, column, change.value) : next;
    }, row),
  );
}
export function validateGridChanges<R extends object>(
  rows: readonly R[],
  columns: readonly GridColumn<R>[],
  changes: readonly GridChange[],
  getRowId: (row: R) => string,
  validateRow?: (row: R) => string | undefined,
): GridCellError[] {
  const byId = new Map(rows.map((row) => [getRowId(row), row]));
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const proposed = new Map(
    applyGridChanges(rows, columns, changes, getRowId).map((row, index) => [
      getRowId(rows[index]!),
      row,
    ]),
  );
  return changes.flatMap((change) => {
    const row = byId.get(change.rowId),
      column = byKey.get(change.columnKey);
    let message: string | undefined;
    if (!row || !column)
      message =
        '원본 행이나 열이 삭제됐어요. 변경을 취소하고 다시 불러와 주세요.';
    else if (!gridEditable(row, column)) message = '수정할 수 없는 셀이에요.';
    else if (!Object.is(gridValue(row, column), change.previousValue))
      message = '원본 값이 바뀌었어요. 변경을 취소한 뒤 다시 편집해 주세요.';
    else {
      const next = proposed.get(change.rowId);
      if (!next || getRowId(next) !== change.rowId)
        message = '행 ID는 편집할 수 없어요.';
      else {
        try {
          message =
            column.validate?.(change.value, next) ?? validateRow?.(next);
        } catch (error) {
          message =
            error instanceof Error
              ? error.message
              : '입력값을 확인하지 못했어요. 값을 다시 확인해 주세요.';
        }
      }
    }
    return message
      ? [{ rowId: change.rowId, columnKey: change.columnKey, message }]
      : [];
  });
}
/** Excel-compatible quoted TSV. Never evaluates formulas or HTML. */
export function parseGridClipboard(text: string): string[][] {
  if (text.length > 5_000_000)
    throw new Error('붙여넣을 내용이 너무 커요. 나누어 붙여넣어 주세요.');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let closed = false;
  let count = 0;
  const push = () => {
    if (++count > 100_000)
      throw new Error('한 번에 100,000셀까지 붙여넣을 수 있어요.');
    row.push(cell);
    cell = '';
    closed = false;
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += char;
    } else if (char === '"' && !cell && !closed) quoted = true;
    else if (char === '\t') push();
    else if (char === '\r' || char === '\n') {
      push();
      rows.push(row);
      row = [];
      if (char === '\r' && text[i + 1] === '\n') i++;
    } else {
      if (closed) throw new Error('따옴표 뒤의 데이터를 확인해 주세요.');
      cell += char;
    }
  }
  if (quoted) throw new Error('따옴표를 닫은 뒤 다시 붙여넣어 주세요.');
  if (cell || row.length || !rows.length || closed) {
    push();
    rows.push(row);
  }
  const width = rows[0]?.length ?? 0;
  if (rows.some((r) => r.length !== width))
    throw new Error('붙여넣을 행의 열 수를 맞춰 주세요.');
  return rows;
}
export const formatGridClipboard = (cells: readonly (readonly unknown[])[]) =>
  cells
    .map((row) => row.map((value) => quote(value, '\t', true)).join('\t'))
    .join('\r\n');
export function createGridCsv<R extends object>(
  rows: readonly R[],
  columns: readonly GridColumn<R>[],
): string {
  return (
    '\uFEFF' +
    [
      columns.map((c) => c.header),
      ...rows.map((row) => columns.map((c) => gridValue(row, c))),
    ]
      .map((row) => row.map((value) => quote(value, ',', true)).join(','))
      .join('\r\n')
  );
}
export function summarizeGridRows<R extends object>(
  rows: readonly R[],
  columns: readonly GridColumn<R>[],
): GridSummary {
  return Object.fromEntries(
    columns
      .filter((c) => c.aggregate)
      .map((c) => {
        const values = rows
          .map((r) => gridValue(r, c))
          .filter(
            (v): v is number => typeof v === 'number' && Number.isFinite(v),
          );
        let value: number | string = '';
        if (c.aggregate === 'count') value = rows.length;
        else if (c.aggregate === 'sum')
          value = values.reduce((a, b) => a + b, 0);
        else if (values.length)
          value =
            c.aggregate === 'average'
              ? values.reduce((a, b) => a + b, 0) / values.length
              : values.reduce((a, b) =>
                  c.aggregate === 'min' ? Math.min(a, b) : Math.max(a, b),
                );
        return [c.key, value];
      }),
  );
}
export function serializeGridView(view: GridView): string {
  return JSON.stringify({ version: 1, ...view });
}
export function parseGridView(text: string): GridView {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object')
    throw new Error('잘못된 보기 설정입니다.');
  const v = value as Record<string, unknown>;
  const operators: readonly unknown[] = [
    'contains',
    'equals',
    'notEquals',
    'startsWith',
    'gt',
    'gte',
    'lt',
    'lte',
    'empty',
    'notEmpty',
  ];
  const records = (x: unknown): x is Record<string, unknown>[] =>
    Array.isArray(x) && x.every((i) => i && typeof i === 'object');
  if (
    v.version !== 1 ||
    typeof v.query !== 'string' ||
    !Number.isSafeInteger(v.page) ||
    (v.page as number) < 1 ||
    !Number.isSafeInteger(v.pageSize) ||
    (v.pageSize as number) < 0 ||
    !Array.isArray(v.groupBy) ||
    !v.groupBy.every((k) => typeof k === 'string') ||
    !records(v.filters) ||
    !v.filters.every(
      (f) =>
        typeof f.columnKey === 'string' &&
        operators.includes(f.operator) &&
        typeof f.value === 'string',
    ) ||
    !records(v.sorts) ||
    !v.sorts.every(
      (s) =>
        typeof s.columnKey === 'string' &&
        (s.direction === 'ASC' || s.direction === 'DESC'),
    ) ||
    !records(v.columns) ||
    !v.columns.every(
      (c) =>
        typeof c.key === 'string' &&
        (c.hidden === undefined || typeof c.hidden === 'boolean') &&
        (c.frozen === undefined ||
          c.frozen === false ||
          c.frozen === 'start' ||
          c.frozen === 'end') &&
        (c.width === undefined ||
          (Number.isFinite(c.width) &&
            (c.width as number) >= 50 &&
            (c.width as number) <= 10000)),
    )
  )
    throw new Error('지원하지 않거나 손상된 보기 설정입니다.');
  return {
    query: v.query,
    filters: v.filters as unknown as GridFilter[],
    sorts: v.sorts as unknown as SortColumn[],
    columns: v.columns as unknown as GridColumnState[],
    groupBy: v.groupBy,
    page: v.page as number,
    pageSize: v.pageSize as number,
  };
}

/** Merge acknowledged edits without overwriting unrelated props received during the request. */
export function mergeGridSavedRows<R extends object>(
  snapshot: readonly R[],
  latest: readonly R[],
  saved: readonly R[],
  columns: readonly GridColumn<R>[],
  changes: readonly GridChange[],
  getRowId: (row: R) => string,
): R[] {
  const before = new Map(snapshot.map((row) => [getRowId(row), row]));
  const current = new Map(latest.map((row) => [getRowId(row), row]));
  const acknowledged = new Map(saved.map((row) => [getRowId(row), row]));
  const byKey = new Map(columns.map((column) => [column.key, column]));
  if (
    acknowledged.size !== saved.length ||
    snapshot.some((row) => !acknowledged.has(getRowId(row)))
  )
    throw new Error('Incomplete or duplicate rows in save response');
  const byRow = new Map<string, GridChange[]>();
  for (const change of changes) {
    if (!current.has(change.rowId))
      throw new Error('An edited row was deleted while saving');
    const list = byRow.get(change.rowId) ?? [];
    list.push(change);
    byRow.set(change.rowId, list);
  }
  const merged = latest.map((row) => {
    const id = getRowId(row),
      original = before.get(id),
      accepted = acknowledged.get(id);
    if (!original || !accepted) return row;
    if (row === original) return accepted;
    return (byRow.get(id) ?? []).reduce((next, change) => {
      const column = byKey.get(change.columnKey);
      if (!column) throw new Error('An edited column was removed while saving');
      const value = gridValue(row, column),
        savedValue = gridValue(accepted, column);
      if (
        !Object.is(value, change.previousValue) &&
        !Object.is(value, savedValue)
      )
        throw new Error('An edited value changed while saving');
      return setGridValue(next, column, savedValue);
    }, row);
  });
  for (const row of saved)
    if (!before.has(getRowId(row)) && !current.has(getRowId(row)))
      merged.push(row);
  return merged;
}
