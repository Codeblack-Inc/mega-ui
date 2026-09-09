/**
 * Minimal XLSX (SpreadsheetML) reader and writer built on the platform's
 * CompressionStream / DecompressionStream. Cell values, formulas, merges and
 * frozen panes only - see docs/spreadsheet.md for what a file loses.
 */
import {
  cellRef,
  columnLabel,
  emptySheet,
  literalValue,
  parseRef,
  usedRange,
  validateSpreadsheet,
  formatCellValue,
  evaluateSpreadsheet,
  SHEET_MAX_CELLS,
  type SpreadsheetData,
  type SpreadsheetSheet,
} from './spreadsheet-model.ts';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++)
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();
const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const concat = (chunks: Uint8Array[]) => {
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};
const through = async (
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
) => {
  const response = new Response(
    new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(stream),
  );
  return new Uint8Array(await response.arrayBuffer());
};
const deflate = (bytes: Uint8Array) =>
  through(bytes, new CompressionStream('deflate-raw'));
const inflate = (bytes: Uint8Array) =>
  through(bytes, new DecompressionStream('deflate-raw'));

interface ZipEntry {
  name: string;
  data: Uint8Array;
}
const writeZip = async (entries: readonly ZipEntry[]) => {
  const locals: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const compressed = await deflate(entry.data);
    const crc = crc32(entry.data);
    const local = new Uint8Array(30 + name.length + compressed.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 8, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, compressed.length, true);
    view.setUint32(22, entry.data.length, true);
    view.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(compressed, 30 + name.length);
    locals.push(local);
    const record = new Uint8Array(46 + name.length);
    const header = new DataView(record.buffer);
    header.setUint32(0, 0x02014b50, true);
    header.setUint16(4, 20, true);
    header.setUint16(6, 20, true);
    header.setUint16(10, 8, true);
    header.setUint32(16, crc, true);
    header.setUint32(20, compressed.length, true);
    header.setUint32(24, entry.data.length, true);
    header.setUint16(28, name.length, true);
    header.setUint32(42, offset, true);
    record.set(name, 46);
    central.push(record);
    offset += local.length;
  }
  const directory = concat(central);
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, entries.length, true);
  view.setUint16(10, entries.length, true);
  view.setUint32(12, directory.length, true);
  view.setUint32(16, offset, true);
  return concat([...locals, directory, end]);
};
const readZip = async (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0) throw new Error('xlsx 형식의 파일을 선택해 주세요.');
  const count = view.getUint16(end + 10, true);
  let pointer = view.getUint32(end + 16, true);
  const files = new Map<string, Uint8Array>();
  for (let index = 0; index < count; index++) {
    if (view.getUint32(pointer, true) !== 0x02014b50)
      throw new Error('xlsx 형식의 파일을 선택해 주세요.');
    const method = view.getUint16(pointer + 10, true);
    const compressedSize = view.getUint32(pointer + 20, true);
    const nameLength = view.getUint16(pointer + 28, true);
    const extraLength = view.getUint16(pointer + 30, true);
    const commentLength = view.getUint16(pointer + 32, true);
    const localOffset = view.getUint32(pointer + 42, true);
    const name = decoder.decode(
      bytes.subarray(pointer + 46, pointer + 46 + nameLength),
    );
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const raw = bytes.subarray(start, start + compressedSize);
    if (method !== 0 && method !== 8)
      throw new Error('압축 방식을 지원하지 않는 xlsx예요.');
    files.set(name, method === 0 ? raw : await inflate(raw));
    pointer += 46 + nameLength + extraLength + commentLength;
  }
  return files;
};

const xmlText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const unxml = (value: string) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&amp;/g, '&');
const tagsOf = (source: string, name: string) => [
  ...source.matchAll(
    new RegExp(`<${name}(\\s[^>]*)?(/>|>([\\s\\S]*?)</${name}>)`, 'g'),
  ),
];
const attribute = (source: string, name: string) =>
  new RegExp(`${name}="([^"]*)"`).exec(source)?.[1];

/** The workbook as an .xlsx byte array. Values are written as computed results. */
export async function spreadsheetToXlsx(
  input: SpreadsheetData,
): Promise<Uint8Array> {
  const data = validateSpreadsheet(input);
  const results = evaluateSpreadsheet(data);
  const sheetXml = data.sheets.map((sheet) => {
    const used = usedRange(sheet);
    const rows: string[] = [];
    if (used)
      for (let row = used.top; row <= used.bottom; row++) {
        const cells: string[] = [];
        for (let column = used.left; column <= used.right; column++) {
          const ref = cellRef(row, column);
          const cell = sheet.cells[ref];
          if (!cell || cell.value === '') continue;
          const computed =
            results.get(`${sheet.id}!${ref}`)?.value ??
            literalValue(cell.value);
          const formula = cell.value.startsWith('=')
            ? `<f>${xmlText(cell.value.slice(1))}</f>`
            : '';
          if (typeof computed === 'number')
            cells.push(`<c r="${ref}">${formula}<v>${computed}</v></c>`);
          else if (typeof computed === 'boolean')
            cells.push(
              `<c r="${ref}" t="b">${formula}<v>${computed ? 1 : 0}</v></c>`,
            );
          else
            cells.push(
              `<c r="${ref}" t="inlineStr">${formula}<is><t xml:space="preserve">${xmlText(
                computed === null ? '' : String(computed),
              )}</t></is></c>`,
            );
        }
        if (cells.length)
          rows.push(`<row r="${row + 1}">${cells.join('')}</row>`);
      }
    const merges = sheet.merges?.length
      ? `<mergeCells count="${sheet.merges.length}">${sheet.merges
          .map((range) => `<mergeCell ref="${range}"/>`)
          .join('')}</mergeCells>`
      : '';
    const frozen =
      sheet.frozenRows || sheet.frozenColumns
        ? `<sheetViews><sheetView workbookViewId="0"><pane xSplit="${sheet.frozenColumns ?? 0}" ySplit="${sheet.frozenRows ?? 0}" topLeftCell="${cellRef(sheet.frozenRows ?? 0, sheet.frozenColumns ?? 0)}" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>`
        : '';
    const columns = sheet.columnWidths
      ? `<cols>${Object.entries(sheet.columnWidths)
          .map(
            ([column, width]) =>
              `<col min="${columnIndexOf(column)}" max="${columnIndexOf(column)}" width="${(width / 7).toFixed(2)}" customWidth="1"/>`,
          )
          .join('')}</cols>`
      : '';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${frozen}${columns}<sheetData>${rows.join('')}</sheetData>${merges}</worksheet>`;
  });
  const files: ZipEntry[] = [
    {
      name: '[Content_Types].xml',
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${data.sheets
          .map(
            (_sheet, index) =>
              `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
          )
          .join('')}</Types>`,
      ),
    },
    {
      name: '_rels/.rels',
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
    },
    {
      name: 'xl/workbook.xml',
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${data.sheets
          .map(
            (sheet, index) =>
              `<sheet name="${xmlText(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
          )
          .join('')}</sheets></workbook>`,
      ),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${data.sheets
          .map(
            (_sheet, index) =>
              `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
          )
          .join('')}</Relationships>`,
      ),
    },
    ...sheetXml.map((xml, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      data: encoder.encode(xml),
    })),
  ];
  return writeZip(files);
}
const columnIndexOf = (column: string) => {
  let index = 0;
  for (const char of column.toUpperCase())
    index = index * 26 + (char.charCodeAt(0) - 64);
  return index;
};

export interface SpreadsheetXlsxResult {
  data: SpreadsheetData;
  /** What the file held but this model does not keep. */
  notes: readonly string[];
}
/** Reads sheet values, formulas, merges and frozen panes from an .xlsx file. */
export async function xlsxToSpreadsheet(
  bytes: Uint8Array,
): Promise<SpreadsheetXlsxResult> {
  if (bytes.length > 8_000_000)
    throw new Error('시트 파일은 8MB 이내로 불러와 주세요.');
  const files = await readZip(bytes);
  const workbook = files.get('xl/workbook.xml');
  if (!workbook) throw new Error('xlsx 형식의 파일을 선택해 주세요.');
  const notes = new Set<string>();
  const workbookXml = decoder.decode(workbook);
  const rels = decoder.decode(
    files.get('xl/_rels/workbook.xml.rels') ?? new Uint8Array(),
  );
  const targets = new Map(
    tagsOf(rels, 'Relationship').map((match) => [
      attribute(match[0], 'Id') ?? '',
      (attribute(match[0], 'Target') ?? '').replace(/^\/?(xl\/)?/, ''),
    ]),
  );
  const shared = tagsOf(
    decoder.decode(files.get('xl/sharedStrings.xml') ?? new Uint8Array()),
    'si',
  ).map((match) =>
    tagsOf(match[3] ?? '', 't')
      .map((item) => unxml(item[3] ?? ''))
      .join(''),
  );
  const sheets: SpreadsheetSheet[] = [];
  const entries = tagsOf(workbookXml, 'sheet');
  if (!entries.length) throw new Error('xlsx에서 시트를 찾지 못했어요.');
  for (const [index, entry] of entries.entries()) {
    if (sheets.length >= 10) {
      notes.add('시트는 10개까지만 가져왔어요.');
      break;
    }
    const name = unxml(attribute(entry[0], 'name') ?? `시트 ${index + 1}`);
    const id = attribute(entry[0], 'r:id') ?? '';
    const path = targets.get(id) ?? `worksheets/sheet${index + 1}.xml`;
    const file = files.get(`xl/${path}`);
    if (!file) {
      notes.add(`${name} 시트를 읽지 못했어요.`);
      continue;
    }
    const xml = decoder.decode(file);
    const sheet: SpreadsheetSheet = {
      ...emptySheet(
        `sheet-${index + 1}`,
        name.slice(0, 50) || `시트 ${index + 1}`,
      ),
      cells: {},
    };
    let maxRow = 0;
    let maxColumn = 0;
    for (const row of tagsOf(xml, 'row'))
      for (const cell of tagsOf(row[3] ?? '', 'c')) {
        const ref = attribute(cell[0], 'r') ?? '';
        const position = parseRef(ref);
        if (!position) {
          notes.add('시트 범위를 벗어난 셀은 가져오지 않았어요.');
          continue;
        }
        const type = attribute(cell[0], 't') ?? 'n';
        const body = cell[3] ?? '';
        const formula = tagsOf(body, 'f')[0]?.[3];
        const raw = tagsOf(body, 'v')[0]?.[3] ?? '';
        let value = '';
        if (formula) value = `=${unxml(formula)}`;
        else if (type === 's') value = shared[Number(raw)] ?? '';
        else if (type === 'inlineStr')
          value = tagsOf(body, 't')
            .map((item) => unxml(item[3] ?? ''))
            .join('');
        else if (type === 'b') value = raw === '1' ? 'TRUE' : 'FALSE';
        else if (type === 'e') value = unxml(raw);
        else value = unxml(raw);
        if (value === '') continue;
        if (Object.keys(sheet.cells).length >= SHEET_MAX_CELLS) {
          notes.add(`한 시트에서 ${SHEET_MAX_CELLS}개 셀까지만 가져왔어요.`);
          break;
        }
        sheet.cells[ref.toUpperCase()] = { value: value.slice(0, 1000) };
        maxRow = Math.max(maxRow, position.row + 1);
        maxColumn = Math.max(maxColumn, position.column + 1);
      }
    sheet.rows = Math.min(1000, Math.max(sheet.rows, maxRow));
    sheet.columns = Math.min(52, Math.max(sheet.columns, maxColumn));
    const merges = tagsOf(xml, 'mergeCell')
      .map((match) => attribute(match[0], 'ref') ?? '')
      .filter(Boolean);
    if (merges.length) sheet.merges = merges;
    const pane = /<pane[^>]*>/.exec(xml)?.[0];
    if (pane) {
      const rows = Number(attribute(pane, 'ySplit') ?? 0);
      const columns = Number(attribute(pane, 'xSplit') ?? 0);
      if (rows) sheet.frozenRows = Math.min(rows, sheet.rows);
      if (columns) sheet.frozenColumns = Math.min(columns, sheet.columns);
    }
    if (/<f[\s>][^>]*t="(shared|array)"/.test(xml))
      notes.add('공유·배열 수식은 각 셀의 값으로 가져왔어요.');
    if (files.has('xl/styles.xml'))
      notes.add('셀 서식과 색은 가져오지 않았어요.');
    if (/<charts?|<drawing/.test(xml))
      notes.add('차트와 도형은 가져오지 않았어요.');
    sheets.push(sheet);
  }
  if (!sheets.length) throw new Error('xlsx에서 시트를 찾지 못했어요.');
  return {
    data: validateSpreadsheet({ version: 1, sheets }),
    notes: [...notes],
  };
}
/** Computed values as CSV text for the whole workbook's active sheet. */
export function spreadsheetCsvName(sheet: SpreadsheetSheet) {
  return `${sheet.name.replace(/[\\/:*?"<>|]/g, '_')}.csv`;
}
export { columnLabel, formatCellValue };
