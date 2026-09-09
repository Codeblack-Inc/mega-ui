import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ui from '@mega-ui/react';

const columns = [
  { key: 'name', header: '이름', sortable: true },
  {
    key: 'amount',
    header: '금액',
    numeric: true,
    editable: true,
    sortable: true,
  },
];
const rows = [
  { id: 'b', name: '베타', amount: 200 },
  { id: 'a', name: '알파', amount: 100 },
];
const id = (row) => row.id;

test('enterprise components are public functions', () => {
  for (const name of [
    'DataTable',
    'VirtualTable',
    'EditableTable',
    'TreeTable',
    'PivotTable',
    'PropertyGrid',
    'DataGrid',
    'Kanban',
    'Calendar',
    'Scheduler',
    'Gantt',
    'Spreadsheet',
    'OrganizationChart',
    'DataExplorer',
  ])
    assert.equal(typeof ui[name], 'function', name);
});

test('data tables sort, window, edit, expand and aggregate meaningful data', () => {
  const data = renderToStaticMarkup(
    h(ui.DataTable, {
      rows,
      columns,
      getRowId: id,
      initialSort: { key: 'amount', direction: 'asc' },
      filterable: true,
    }),
  );
  assert.ok(data.indexOf('알파') < data.indexOf('베타'));
  assert.match(data, /type="search"/);

  const unsorted = renderToStaticMarkup(
    h(ui.DataTable, {
      rows,
      columns: columns.map((column) => ({ ...column, sortable: false })),
      getRowId: id,
      initialSort: { key: 'amount', direction: 'asc' },
    }),
  );
  assert.ok(unsorted.indexOf('베타') < unsorted.indexOf('알파'));

  const serverSorted = renderToStaticMarkup(
    h(ui.DataTable, {
      rows,
      columns,
      getRowId: id,
      sort: { key: 'amount', direction: 'asc' },
      manual: true,
    }),
  );
  assert.ok(serverSorted.indexOf('베타') < serverSorted.indexOf('알파'));

  const sortedGrid = renderToStaticMarkup(
    h(ui.DataGrid, {
      rows,
      columns,
      getRowId: id,
      initialSort: { key: 'amount', direction: 'asc' },
      selectedIds: ['a'],
    }),
  );
  assert.ok(sortedGrid.indexOf('알파') < sortedGrid.indexOf('베타'));
  assert.match(sortedGrid, /aria-checked="mixed"/);

  const virtual = renderToStaticMarkup(
    h(ui.VirtualTable, {
      rows: Array.from({ length: 100 }, (_, index) => ({
        id: String(index),
        name: `행 ${index}`,
        amount: index,
      })),
      columns,
      getRowId: id,
      height: 88,
      rowHeight: 44,
      overscan: 0,
    }),
  );
  assert.match(virtual, /행 0/);
  assert.doesNotMatch(virtual, /행 99/);
  assert.match(virtual, /aria-rowcount="101"/);
  assert.match(virtual, /role="region"/);
  assert.match(virtual, /tabindex="0"/);

  const safeVirtual = renderToStaticMarkup(
    h(ui.VirtualTable, {
      rows: Array.from({ length: 100 }, (_, index) => ({
        id: String(index),
        name: `행 ${index}`,
        amount: index,
      })),
      columns,
      getRowId: id,
      height: 0,
      rowHeight: Number.NaN,
      overscan: -1,
    }),
  );
  assert.match(safeVirtual, /max-height:400px/);
  assert.match(safeVirtual, /height:44px/);
  assert.doesNotMatch(safeVirtual, /NaN|Infinity/);

  const editable = renderToStaticMarkup(
    h(ui.EditableTable, { rows, columns, getRowId: id, onCellChange() {} }),
  );
  assert.match(editable, /aria-label="금액 편집"/);
  assert.match(editable, /data-editable="true"/);
  assert.match(editable, /data-align="end"/);

  const tree = renderToStaticMarkup(
    h(ui.TreeTable, {
      nodes: [{ row: rows[0], children: [{ row: rows[1] }] }],
      columns,
      getRowId: id,
      defaultExpandedIds: ['b'],
    }),
  );
  assert.match(tree, /<table/);
  assert.match(tree, /베타 접기/);

  const pivot = renderToStaticMarkup(
    h(ui.PivotTable, {
      rows: [
        { team: 'A', quarter: 'Q1', amount: 10 },
        { team: 'A', quarter: 'Q1', amount: 20 },
      ],
      rowKey: 'team',
      columnKey: 'quarter',
      valueKey: 'amount',
    }),
  );
  assert.match(pivot, />30</);
});

test('enterprise planning views retain accessible native semantics', () => {
  const html = renderToStaticMarkup(
    h(
      'main',
      null,
      h(ui.PropertyGrid, {
        items: [{ name: 'owner', value: '메가', editable: true }],
      }),
      h(ui.DataGrid, { rows, columns, getRowId: id }),
      h(ui.Kanban, {
        columns: [
          { id: 'todo', title: '할 일', cards: [{ id: '1', title: '검토' }] },
          { id: 'done', title: '완료', cards: [] },
        ],
        onMove() {},
      }),
      h(ui.Calendar, {
        month: '2026-09',
        events: [{ id: '1', date: '2026-09-09', title: '배포' }],
      }),
      h(ui.Scheduler, {
        appointments: [
          {
            id: '1',
            date: '2026-09-09',
            start: '09:00',
            end: '10:00',
            title: '회의',
          },
        ],
      }),
      h(ui.Gantt, {
        tasks: [
          {
            id: '1',
            title: '설계',
            start: '2026-09-01',
            end: '2026-09-03',
            progress: 50,
          },
        ],
      }),
      h(ui.Gantt, {
        tasks: [
          {
            id: 'invalid-progress',
            title: '검증',
            start: '2026-09-01',
            end: '2026-09-02',
            progress: Number.NaN,
          },
        ],
      }),
      h(ui.Spreadsheet, { cells: [['값']], onCellChange() {} }),
      h(ui.OrganizationChart, {
        root: {
          id: 'ceo',
          label: '대표',
          children: [{ id: 'dev', label: '개발' }],
        },
      }),
      h(ui.DataExplorer, { rows, columns, getRowId: id }),
    ),
  );
  assert.match(html, /role="grid"/);
  assert.match(html, /aria-multiselectable="true"/);
  assert.match(html, /다음 열로 이동/);
  assert.match(html, /mega-icon-button/);
  assert.doesNotMatch(html, />[←→]</);
  assert.equal((html.match(/mega-checkbox/g) ?? []).length >= 5, true);
  assert.match(html, /data-numeric="true"/);
  assert.equal((html.match(/role="gridcell"/g) ?? []).length >= 42, true);
  assert.equal((html.match(/tabindex="0"/g) ?? []).length >= 1, true);
  assert.match(html, /09:00–10:00/);
  assert.match(html, /grid-column:1 \/ span 3/);
  assert.match(html, /검증: 2026-09-01부터 2026-09-02, 0% 완료/);
  assert.doesNotMatch(html, /NaN|Infinity/);
  assert.match(html, /aria-label="A1"/);
  assert.match(html, /표시할 열/);
});

test('spreadsheet labels continue after Z', () => {
  const html = renderToStaticMarkup(
    h(ui.Spreadsheet, { cells: [Array.from({ length: 27 }, () => '')] }),
  );
  assert.match(html, /aria-label="AA1"/);
});

test('spreadsheet horizontal arrows preserve text editing until a boundary', () => {
  const sheet = ui.Spreadsheet({
    cells: [['abc', 'next']],
    onCellChange() {},
  });
  const inputs = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    if (node.props?.['data-sheet-cell']) inputs.push(node);
    visit(node.props?.children);
  };
  visit(sheet);
  const onKeyDown = inputs[0].props.onKeyDown;
  let prevented = false;
  let focused = false;
  const event = (
    key,
    selectionStart,
    selectionEnd = selectionStart,
    altKey = false,
  ) => ({
    key,
    altKey,
    preventDefault() {
      prevented = true;
    },
    currentTarget: {
      value: 'abc',
      selectionStart,
      selectionEnd,
      closest() {
        return {
          querySelector: () => ({
            focus: () => {
              focused = true;
            },
          }),
        };
      },
    },
  });

  onKeyDown(event('ArrowRight', 1));
  assert.equal(prevented, false);
  assert.equal(focused, false);

  onKeyDown(event('ArrowRight', 3));
  assert.equal(prevented, true);
  assert.equal(focused, true);

  prevented = false;
  focused = false;
  onKeyDown(event('ArrowLeft', 2, 2, true));
  assert.equal(prevented, true);
  assert.equal(focused, true);
});
