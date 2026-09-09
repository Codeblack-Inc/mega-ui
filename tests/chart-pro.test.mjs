import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  prepareChartPro,
  createChartProCsv,
} from '../src/pro/chart-pro-model.ts';

const series = [
  {
    id: 'a',
    label: 'A',
    points: [
      ['one', -3],
      ['two', null],
      ['three', 5],
    ],
  },
];
test('professional chart uses one validated source for all chart types and table/CSV', () => {
  for (const type of ['bar', 'line', 'area']) {
    const prepared = prepareChartPro({ type, series, stacked: true });
    assert.deepEqual(
      prepared.rows.map((row) => row.cells.at(-1)),
      [-3, null, 5],
    );
    assert.equal(prepared.option.series[0].stack, 'axis-0');
    assert.equal(prepared.option.series[0].connectNulls, false);
    assert.equal(prepared.option.dataZoom.length, 2);
  }
  const scatter = prepareChartPro({
    type: 'scatter',
    series: [
      {
        id: 's',
        label: 'S',
        points: [
          [1, 2],
          [1, 3],
          [2, NaN],
        ],
      },
    ],
  });
  assert.equal(scatter.rows[2].cells.at(-1), null);
  for (const type of ['pie', 'donut']) {
    const prepared = prepareChartPro({
      type,
      items: [
        { label: 'A', value: 2 },
        { label: 'B', value: null },
      ],
    });
    assert.equal(prepared.option.series[0].data[1].value, 0);
    assert.equal(prepared.rows[1].cells[1], null);
    assert.throws(() =>
      prepareChartPro({ type, items: [{ label: 'A', value: -1 }] }),
    );
  }
  const heat = prepareChartPro({
    type: 'heatmap',
    xLabels: ['A'],
    yLabels: ['B'],
    cells: [[0, 0, -3]],
  });
  assert.deepEqual(heat.rows[0].cells, ['A', 'B', -3]);
  const tree = prepareChartPro({
    type: 'treemap',
    nodes: [
      {
        id: 'root',
        label: 'Root',
        children: [{ id: 'leaf', label: 'Leaf', value: 4 }],
      },
    ],
  });
  assert.equal(tree.option.series[0].data[0].value, 4);
  assert.deepEqual(
    tree.rows.map((r) => r.cells),
    [
      ['Root / Leaf', 4],
      ['Root', 4],
    ],
  );
  assert.match(
    createChartProCsv({
      type: 'line',
      series: [
        {
          id: 'a',
          label: '=A',
          points: [
            ['@B', -5],
            ['x,"y"\nz', null],
          ],
        },
      ],
    }),
    /'=A,'@B,-5/,
  );
  assert.match(createChartProCsv({ type: 'line', series }), /A,two,\r\n/);
});

test('time axes preserve elapsed time and exact instants across DST and financial data', () => {
  const before = Date.parse('2026-03-08T06:30:00Z'),
    after = Date.parse('2026-03-08T07:30:00Z');
  const data = {
    type: 'line',
    xAxis: 'time',
    series: [
      {
        id: 'a',
        label: 'A',
        points: [
          [before, 1],
          [after, 2],
        ],
      },
    ],
  };
  const model = prepareChartPro(data, {
    timeZone: 'America/New_York',
    locale: 'en-US',
  });
  assert.equal(model.option.xAxis.type, 'time');
  assert.equal(
    model.option.series[0].data[1][0] - model.option.series[0].data[0][0],
    3600000,
  );
  assert.match(model.rows[0].cells[1], /1:30:00/);
  assert.match(model.rows[1].cells[1], /3:30:00/);
  assert.match(createChartProCsv(data), /2026-03-08T06:30:00.000Z/);
  const candle = {
    time: before,
    open: 10,
    close: 12,
    low: 9,
    high: 14,
    volume: 100,
  };
  const financial = prepareChartPro({ type: 'candlestick', candles: [candle] });
  assert.deepEqual(financial.option.series[0].data[0], [before, 10, 12, 9, 14]);
  assert.deepEqual(financial.option.series[1].data[0], [before, 100]);
  for (const patch of [
    { low: 11 },
    { high: 11 },
    { volume: -1 },
    { open: NaN },
    { time: Infinity },
  ])
    assert.throws(() =>
      prepareChartPro({
        type: 'candlestick',
        candles: [{ ...candle, ...patch }],
      }),
    );
  assert.throws(() =>
    prepareChartPro({
      ...data,
      series: [
        {
          ...data.series[0],
          points: [
            [after, 1],
            [before, 2],
          ],
        },
      ],
    }),
  );
});

test('professional input boundary rejects invalid and excessive data without mutating input', () => {
  const invalid = [
    null,
    { type: 'unknown' },
    { type: 'bar', series: new Array(1) },
    { type: 'bar', xAxis: 'bad', series },
    { type: 'bar', series: [...series, ...series] },
    { type: 'bar', series: [{ ...series[0], axis: 1 }] },
    { type: 'bar', series: [{ ...series[0], points: [['a', '3']] }] },
    { type: 'line', series: [{ ...series[0], points: [['a', 1e101]] }] },
    { type: 'heatmap', xLabels: ['a'], yLabels: ['b'], cells: [[1, 0, 3]] },
    {
      type: 'heatmap',
      xLabels: ['a'],
      yLabels: ['b'],
      cells: [
        [0, 0, 3],
        [0, 0, 4],
      ],
    },
    {
      type: 'treemap',
      nodes: [
        {
          id: 'a',
          label: 'A',
          value: 2,
          children: [{ id: 'b', label: 'B', value: 3 }],
        },
      ],
    },
    {
      type: 'scatter',
      series: [
        {
          id: 'a',
          label: 'A',
          points: Array.from({ length: 10001 }, (_, i) => [i, i]),
        },
      ],
    },
  ];
  for (const data of invalid) assert.throws(() => prepareChartPro(data));
  const data = { type: 'line', series };
  const original = structuredClone(data);
  prepareChartPro(data);
  assert.deepEqual(data, original);
  const large = prepareChartPro({
    type: 'scatter',
    series: [
      {
        id: 'a',
        label: 'A',
        points: Array.from({ length: 10000 }, (_, i) => [i, i]),
      },
    ],
  });
  assert.equal(large.rows.length, 10000);
});
