import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { DataGridPro } from '@mega-ui/react/data-grid';
import {
  applyGridChanges,
  mergeGridSavedRows,
  createGridCsv,
  defaultGridView,
  formatGridClipboard,
  getGridRows,
  parseGridClipboard,
  parseGridValue,
  parseGridView,
  serializeGridView,
  summarizeGridRows,
  validateGridChanges,
} from '../src/pro/data-grid-model.ts';
const columns = [
  { key: 'name', header: '이름', editable: true },
  {
    key: 'amount',
    header: '금액',
    kind: 'number',
    editable: true,
    aggregate: 'sum',
    validate: (v) => (v < 0 ? '음수 불가' : undefined),
  },
  { key: 'group', header: '그룹' },
];
const rows = [
  { id: 'a', name: '열 10', amount: 30, group: 'A' },
  { id: 'b', name: '열 2', amount: 10, group: 'A' },
  { id: 'c', name: '영업', amount: 20, group: 'B' },
];
const id = (row) => row.id;
test('grid filters and multi-sort operate on all rows before pagination; manual mode preserves server order', () => {
  const view = {
    ...defaultGridView,
    filters: [{ columnKey: 'amount', operator: 'gte', value: '20' }],
    sorts: [
      { columnKey: 'group', direction: 'DESC' },
      { columnKey: 'amount', direction: 'ASC' },
    ],
  };
  assert.deepEqual(getGridRows(rows, columns, view).map(id), ['c', 'a']);
  assert.deepEqual(getGridRows(rows, columns, view, true), rows);
  assert.deepEqual(
    getGridRows(rows, columns, {
      ...defaultGridView,
      query: '열',
      sorts: [{ columnKey: 'name', direction: 'ASC' }],
    }).map(id),
    ['b', 'a'],
  );
  assert.deepEqual(
    getGridRows(
      [...rows, { id: 'd', name: '', amount: null, group: 'A' }],
      columns,
      {
        ...defaultGridView,
        sorts: [{ columnKey: 'amount', direction: 'DESC' }],
      },
    ).map(id),
    ['a', 'c', 'b', 'd'],
  );
});
test('quoted clipboard cells preserve tabs, multiline text, quotes, trailing empty cells and reject malformed payloads', () => {
  const cells = [
    ['줄1\n줄2', 'tab\there', '"quoted"', ''],
    ['a', 'b', 'c', ''],
  ];
  assert.deepEqual(parseGridClipboard(formatGridClipboard(cells)), cells);
  assert.deepEqual(parseGridClipboard('a\tb\r\nc\td\r\n'), [
    ['a', 'b'],
    ['c', 'd'],
  ]);
  assert.throws(() => parseGridClipboard('"unfinished'), /따옴표/);
  assert.throws(() => parseGridClipboard('a\tb\nc'), /열 수/);
  assert.throws(() => parseGridClipboard('"a"garbage'), /확인/);
  assert.throws(() => parseGridClipboard('x'.repeat(5_000_001)), /나누어/);
});
test('typed parsing validates finite numbers, real calendar dates, booleans and selection values', () => {
  assert.equal(parseGridValue('0', rows[0], columns[1]), 0);
  assert.equal(parseGridValue('', rows[0], columns[1]), null);
  assert.throws(() => parseGridValue('Infinity', rows[0], columns[1]));
  assert.throws(() =>
    parseGridValue('2026-02-30', rows[0], { key: 'date', kind: 'date' }),
  );
  assert.equal(
    parseGridValue('2024-02-29', rows[0], { key: 'date', kind: 'date' }),
    '2024-02-29',
  );
  assert.equal(
    parseGridValue('false', rows[0], { key: 'ok', kind: 'boolean' }),
    false,
  );
  assert.throws(() =>
    parseGridValue('yes', rows[0], { key: 'ok', kind: 'boolean' }),
  );
  assert.throws(() =>
    parseGridValue('C', rows[0], {
      key: 'group',
      kind: 'select',
      options: ['A', 'B'],
    }),
  );
});
test('batch changes remain immutable, validate against final rows, and detect conflicts, deleted rows and readonly cells', () => {
  const changes = [
    { rowId: 'a', columnKey: 'amount', previousValue: 30, value: 40 },
  ];
  const updated = applyGridChanges(rows, columns, changes, id);
  assert.equal(updated[0].amount, 40);
  assert.equal(rows[0].amount, 30);
  assert.equal(updated[1], rows[1]);
  assert.deepEqual(validateGridChanges(rows, columns, changes, id), []);
  assert.match(
    validateGridChanges(updated, columns, changes, id)[0].message,
    /원본 값/,
  );
  assert.match(
    validateGridChanges(rows.slice(1), columns, changes, id)[0].message,
    /삭제/,
  );
  assert.match(
    validateGridChanges(
      rows,
      columns,
      [{ rowId: 'a', columnKey: 'group', previousValue: 'A', value: 'B' }],
      id,
    )[0].message,
    /수정/,
  );
  assert.match(
    validateGridChanges(rows, columns, [{ ...changes[0], value: -1 }], id)[0]
      .message,
    /음수/,
  );
  assert.match(
    validateGridChanges(rows, columns, changes, id, (row) =>
      row.amount > 35 ? '한도 초과' : undefined,
    )[0].message,
    /한도/,
  );
});
test('CSV neutralizes formula injection and quotes delimiters/newlines; numeric values stay numeric', () => {
  const csv = createGridCsv(
    [{ name: '  =HYPERLINK("x")', amount: -2, group: 'a,b\nc' }],
    columns,
  );
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /'  =HYPERLINK/);
  assert.match(csv, /-2/);
  assert.match(csv, /"a,b\nc"/);
  assert.equal(summarizeGridRows(rows, columns).amount, 60);
});
test('view persistence validates trust boundary and round trips ordered columns, filters and sorting', () => {
  const view = {
    ...defaultGridView,
    columns: [{ key: 'amount', width: 180, frozen: 'end' }],
    filters: [{ columnKey: 'amount', operator: 'gt', value: '5' }],
  };
  assert.deepEqual(parseGridView(serializeGridView(view)), view);
  for (const patch of [
    { version: 2 },
    { page: 0 },
    { pageSize: -1 },
    { columns: [{ key: 'a', width: Infinity }] },
    { sorts: [{ columnKey: 'x', direction: 'bad' }] },
    { filters: [{ columnKey: 'a', operator: 'execute', value: '' }] },
  ])
    assert.throws(() =>
      parseGridView(JSON.stringify({ version: 1, ...view, ...patch })),
    );
});
test('professional entry supports SSR, isolates engine from core, and emits a standalone stylesheet', () => {
  const html = renderToStaticMarkup(
    createElement(DataGridPro, {
      rows,
      columns,
      getRowId: id,
      label: '업무 원장',
    }),
  );
  assert.match(html, /업무 원장/);
  assert.match(html, /role="grid"/);
  assert.match(html, /CSV 내보내기/);
  assert.doesNotMatch(
    readFileSync(new URL('../dist/index.js', import.meta.url), 'utf8'),
    /react-data-grid/,
  );
  assert.match(
    readFileSync(new URL('../dist/data-grid.css', import.meta.url), 'utf8'),
    /mega-pro-grid/,
  );
});

test('save acknowledgements preserve concurrent unrelated changes and reject data loss', () => {
  const changes = [
    { rowId: 'a', columnKey: 'amount', previousValue: 30, value: 40 },
  ];
  const saved = applyGridChanges(rows, columns, changes, id);
  const latest = rows.map((row) =>
    row.id === 'a' ? { ...row, name: 'remote name' } : row,
  );
  const merged = mergeGridSavedRows(rows, latest, saved, columns, changes, id);
  assert.equal(merged[0].name, 'remote name');
  assert.equal(merged[0].amount, 40);
  assert.throws(
    () => mergeGridSavedRows(rows, rows, [], columns, changes, id),
    /Incomplete/,
  );
  assert.throws(
    () => mergeGridSavedRows(rows, rows.slice(1), saved, columns, changes, id),
    /deleted/,
  );
  assert.throws(
    () =>
      mergeGridSavedRows(
        rows,
        rows.map((row) => ({ ...row, amount: 999 })),
        saved,
        columns,
        changes,
        id,
      ),
    /changed/,
  );
  const idColumn = [{ key: 'id', header: 'ID', editable: true }];
  assert.match(
    validateGridChanges(
      rows,
      idColumn,
      [{ rowId: 'a', columnKey: 'id', previousValue: 'a', value: 'b' }],
      id,
    )[0].message,
    /ID/,
  );
});

test('draft snapshots round-trip raw input and reject malformed, duplicate, oversized or lossy data', async () => {
  const { parseGridDraft, serializeGridDraft } =
    await import('../src/pro/data-grid-draft.ts');
  const snapshot = {
    changes: [
      { rowId: 'a', columnKey: 'amount', previousValue: 30, value: 42 },
    ],
    inputs: [
      { rowId: 'b', columnKey: 'amount', previousValue: 10, text: '12x' },
    ],
    bases: rows.slice(0, 2),
  };
  assert.deepEqual(parseGridDraft(serializeGridDraft(snapshot), id), snapshot);
  for (const patch of [
    { version: 2 },
    { changes: [...snapshot.changes, ...snapshot.changes] },
    { inputs: [{ ...snapshot.inputs[0], text: 12 }] },
    { bases: [rows[0], rows[0]] },
    { bases: [] },
    { changes: [{ ...snapshot.changes[0], value: { nested: true } }] },
  ])
    assert.throws(() =>
      parseGridDraft(JSON.stringify({ version: 1, ...snapshot, ...patch }), id),
    );
  assert.throws(() => parseGridDraft('x'.repeat(5_000_001), id));
  for (const value of [
    undefined,
    NaN,
    Infinity,
    -0,
    new Date(),
    { nested: true },
    1n,
  ]) {
    assert.throws(() =>
      serializeGridDraft({
        ...snapshot,
        changes: [{ ...snapshot.changes[0], value }],
      }),
    );
  }
  assert.throws(() =>
    serializeGridDraft({
      ...snapshot,
      bases: [{ ...rows[0], date: new Date() }],
    }),
  );
});
