import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateSpreadsheet,
  updateSpreadsheet,
  evaluateSpreadsheet,
  formatCellValue,
  literalValue,
  shiftFormula,
  fillEdits,
  pasteEdits,
  copyRange,
  parseRange,
  parseDelimited,
  sheetToCsv,
  serializeSpreadsheet,
  parseSpreadsheet,
  columnLabel,
  columnIndex,
  emptySheet,
} from '../src/components/spreadsheet-model.ts';
import {
  spreadsheetToXlsx,
  xlsxToSpreadsheet,
} from '../src/components/spreadsheet-xlsx.ts';

const book = (cells, extra = {}) => ({
  version: 1,
  sheets: [{ ...emptySheet('s1', '판매'), cells, ...extra }],
});
const values = (data) => {
  const results = evaluateSpreadsheet(validateSpreadsheet(data));
  return (ref) => results.get(`s1!${ref}`)?.value ?? null;
};

test('column labels and references round trip', () => {
  assert.equal(columnLabel(0), 'A');
  assert.equal(columnLabel(25), 'Z');
  assert.equal(columnLabel(26), 'AA');
  assert.equal(columnIndex('AA'), 26);
  assert.deepEqual(parseRange('B2:C3'), {
    top: 1,
    left: 1,
    bottom: 2,
    right: 2,
  });
  assert.deepEqual(parseRange('C3:B2'), {
    top: 1,
    left: 1,
    bottom: 2,
    right: 2,
  });
  assert.equal(parseRange('ZZZ1'), null);
  assert.equal(literalValue('1,200'), 1200);
  assert.equal(literalValue('12%'), 0.12);
  assert.equal(literalValue('TRUE'), true);
  assert.equal(literalValue(' 이름 '), ' 이름 ');
});

test('formulas evaluate operators, functions, ranges and other sheets', () => {
  const data = {
    version: 1,
    sheets: [
      {
        ...emptySheet('s1', '판매'),
        cells: {
          A1: { value: '10' },
          A2: { value: '20' },
          A3: { value: '=SUM(A1:A2)' },
          B1: { value: '=A3*2' },
          B2: { value: '=IF(A3>25,"많음","적음")' },
          B3: { value: '="합계 " & A3' },
          C1: { value: '=AVERAGE(A1:A3)' },
          C2: { value: '=ROUND(10/3,2)' },
          C3: { value: '=COUNTIF(A1:A3,">15")' },
          D1: { value: '=요약!A1+1' },
          D2: { value: '=10/0' },
          D3: { value: '=NOPE(1)' },
          E1: { value: '=50%*A1' },
          E2: { value: '=SUMIF(A1:A2,">10",A1:A2)' },
          E3: { value: '=IFERROR(1/0,"대체")' },
        },
      },
      { ...emptySheet('s2', '요약'), cells: { A1: { value: '5' } } },
    ],
  };
  const read = values(data);
  assert.equal(read('A3'), 30);
  assert.equal(read('B1'), 60);
  assert.equal(read('B2'), '많음');
  assert.equal(read('B3'), '합계 30');
  assert.equal(read('C1'), 20);
  assert.equal(read('C2'), 3.33);
  assert.equal(read('C3'), 2);
  assert.equal(read('D1'), 6);
  assert.equal(read('D2'), '#DIV/0!');
  assert.equal(read('D3'), '#NAME?');
  assert.equal(read('E1'), 5);
  assert.equal(read('E2'), 20);
  assert.equal(read('E3'), '대체');
});

test('circular references report an error and do not hang', () => {
  const read = values(
    book({
      A1: { value: '=B1+1' },
      B1: { value: '=A1+1' },
      C1: { value: '=A1' },
      D1: { value: '=D1' },
      E1: { value: '5' },
    }),
  );
  assert.equal(read('A1'), '#순환!');
  assert.equal(read('B1'), '#순환!');
  assert.equal(read('C1'), '#순환!');
  assert.equal(read('D1'), '#순환!');
  assert.equal(read('E1'), 5);
});

test('cells format for display without changing the stored text', () => {
  assert.equal(formatCellValue(1234.5, 'currency'), '1,235원');
  assert.equal(formatCellValue(0.125, 'percent'), '12.5%');
  assert.equal(formatCellValue(1234.5, 'integer'), '1,235');
  assert.equal(formatCellValue(1234.5, 'number'), '1,234.5');
  assert.equal(formatCellValue(1234.5, 'text'), '1234.5');
  assert.equal(formatCellValue(true), 'TRUE');
  assert.equal(formatCellValue(null), '');
});

test('editing keeps the original data and drops fully empty cells', () => {
  const source = book({ A1: { value: '10' }, A2: { value: '20', bold: true } });
  const original = structuredClone(source);
  const data = updateSpreadsheet(source, {
    type: 'set-cells',
    sheetId: 's1',
    cells: [
      { ref: 'A1', value: '' },
      { ref: 'A2', bold: null },
      { ref: 'B1', value: '=A2', format: 'currency' },
    ],
  });
  assert.equal(data.sheets[0].cells.A1, undefined);
  assert.equal(data.sheets[0].cells.A2.bold, undefined);
  assert.equal(data.sheets[0].cells.B1.format, 'currency');
  assert.deepEqual(source, original);
});

test('merge, freeze, resize and sheet actions validate their range', () => {
  let data = validateSpreadsheet(book({ A1: { value: '제목' } }));
  data = updateSpreadsheet(data, {
    type: 'merge',
    sheetId: 's1',
    range: 'A1:B2',
  });
  assert.deepEqual(data.sheets[0].merges, ['A1:B2']);
  assert.throws(
    () =>
      updateSpreadsheet(data, { type: 'merge', sheetId: 's1', range: 'B1:C1' }),
    /겹칠 수 없어요/,
  );
  data = updateSpreadsheet(data, {
    type: 'unmerge',
    sheetId: 's1',
    range: 'A1:B2',
  });
  assert.equal(data.sheets[0].merges, undefined);
  data = updateSpreadsheet(data, {
    type: 'freeze',
    sheetId: 's1',
    rows: 1,
    columns: 2,
  });
  assert.equal(data.sheets[0].frozenRows, 1);
  assert.throws(
    () =>
      updateSpreadsheet(data, {
        type: 'resize-sheet',
        sheetId: 's1',
        rows: 0,
        columns: 5,
      }),
    /행은 1~1000/,
  );
  assert.throws(
    () =>
      updateSpreadsheet(
        updateSpreadsheet(data, {
          type: 'set-cells',
          sheetId: 's1',
          cells: [{ ref: 'H10', value: '값' }],
        }),
        { type: 'resize-sheet', sheetId: 's1', rows: 5, columns: 5 },
      ),
    /내용이 있어요/,
  );
  data = updateSpreadsheet(data, {
    type: 'add-sheet',
    sheet: emptySheet('s2', '요약'),
  });
  assert.equal(data.sheets.length, 2);
  assert.throws(
    () =>
      updateSpreadsheet(data, {
        type: 'add-sheet',
        sheet: emptySheet('s3', '판매'),
      }),
    /이름은 중복/,
  );
  data = updateSpreadsheet(data, { type: 'delete-sheet', sheetId: 's2' });
  assert.throws(
    () => updateSpreadsheet(data, { type: 'delete-sheet', sheetId: 's1' }),
    /하나 이상 남겨/,
  );
});

test('sorting moves values and refuses ranges with formulas', () => {
  const data = validateSpreadsheet(
    book({
      A1: { value: '이름' },
      B1: { value: '값' },
      A2: { value: '나' },
      B2: { value: '30' },
      A3: { value: '가' },
      B3: { value: '10' },
      A4: { value: '다' },
      B4: { value: '20' },
    }),
  );
  const sorted = updateSpreadsheet(data, {
    type: 'sort',
    sheetId: 's1',
    range: 'A1:B4',
    column: 'B',
    direction: 'asc',
    header: true,
  });
  assert.deepEqual(
    ['A2', 'A3', 'A4'].map((ref) => sorted.sheets[0].cells[ref].value),
    ['가', '다', '나'],
  );
  const withFormula = updateSpreadsheet(data, {
    type: 'set-cells',
    sheetId: 's1',
    cells: [{ ref: 'B4', value: '=B2+1' }],
  });
  assert.throws(
    () =>
      updateSpreadsheet(withFormula, {
        type: 'sort',
        sheetId: 's1',
        range: 'A1:B4',
        column: 'B',
        direction: 'asc',
        header: true,
      }),
    /수식이 있어요/,
  );
});

test('formulas shift on fill and paste, and numeric runs continue', () => {
  assert.equal(shiftFormula('A1+$B$2', 1, 1), 'B2+$B$2');
  assert.equal(shiftFormula('SUM(A1:A3)', 2, 0), 'SUM(A3:A5)');
  assert.equal(shiftFormula('"A1"&A1', 1, 0), '"A1"&A2');
  assert.equal(shiftFormula('A1', -1, 0), '#REF!');
  const sheet = validateSpreadsheet(
    book({
      A1: { value: '1' },
      A2: { value: '3' },
      B1: { value: '=A1*2' },
    }),
  ).sheets[0];
  const series = fillEdits(sheet, parseRange('A1:A2'), parseRange('A1:A4'));
  assert.deepEqual(
    series.map((edit) => [edit.ref, edit.value]),
    [
      ['A3', '5'],
      ['A4', '7'],
    ],
  );
  const formulas = fillEdits(sheet, parseRange('B1:B1'), parseRange('B1:B3'));
  assert.deepEqual(
    formulas.map((edit) => edit.value),
    ['=A2*2', '=A3*2'],
  );
  assert.deepEqual(copyRange(sheet, parseRange('A1:A2')), [['1'], ['3']]);
  const pasted = pasteEdits({ row: 4, column: 1 }, [['=A1', '2']], {
    row: 0,
    column: 0,
  });
  assert.deepEqual(
    pasted.map((edit) => [edit.ref, edit.value]),
    [
      ['B5', '=B5'],
      ['C5', '2'],
    ],
  );
});

test('CSV writes computed values and parses quoted input', () => {
  const data = validateSpreadsheet(
    book({
      A1: { value: '이름' },
      B1: { value: '금액' },
      A2: { value: '가, 나' },
      B2: { value: '=1000*2', format: 'currency' },
    }),
  );
  const csv = sheetToCsv(data.sheets[0], evaluateSpreadsheet(data));
  assert.equal(csv, '이름,금액\r\n"가, 나","2,000원"');
  assert.deepEqual(parseDelimited('a,"b,c"\r\nd,'), [
    ['a', 'b,c'],
    ['d', ''],
  ]);
  assert.deepEqual(parseDelimited('a\tb', '\t'), [['a', 'b']]);
});

test('JSON round trip keeps cells, merges, freezing and widths', () => {
  const data = validateSpreadsheet(
    book(
      { A1: { value: '제목', bold: true }, B2: { value: '=A1' } },
      { merges: ['C1:D2'], frozenRows: 1, columnWidths: { A: 160 } },
    ),
  );
  assert.deepEqual(parseSpreadsheet(serializeSpreadsheet(data)), data);
  assert.throws(() => parseSpreadsheet('{'), /JSON 형식/);
});

test('xlsx round trip keeps values, formulas, merges and frozen panes', async () => {
  const data = validateSpreadsheet({
    version: 1,
    sheets: [
      {
        ...emptySheet('s1', '판매'),
        cells: {
          A1: { value: '품목' },
          B1: { value: '수량' },
          A2: { value: '연필 & <상자>' },
          B2: { value: '12' },
          B3: { value: '=SUM(B2:B2)*2' },
          C1: { value: 'TRUE' },
        },
        merges: ['D1:E2'],
        frozenRows: 1,
      },
      { ...emptySheet('s2', '요약'), cells: { A1: { value: '=판매!B3' } } },
    ],
  });
  const bytes = await spreadsheetToXlsx(data);
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  const back = await xlsxToSpreadsheet(bytes);
  const sheet = back.data.sheets[0];
  assert.equal(sheet.name, '판매');
  assert.equal(sheet.cells.A2.value, '연필 & <상자>');
  assert.equal(sheet.cells.B3.value, '=SUM(B2:B2)*2');
  assert.equal(sheet.cells.C1.value, 'TRUE');
  assert.deepEqual(sheet.merges, ['D1:E2']);
  assert.equal(sheet.frozenRows, 1);
  assert.equal(back.data.sheets[1].cells.A1.value, '=판매!B3');
  const read = evaluateSpreadsheet(back.data);
  assert.equal(read.get('sheet-1!B3')?.value, 24);
  await assert.rejects(
    () => xlsxToSpreadsheet(new Uint8Array([1, 2, 3])),
    /xlsx 형식/,
  );
});
