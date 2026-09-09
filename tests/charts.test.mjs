import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { CartesianChart, createChartCsv } from '@mega-ui/react/charts';
import { prepareChartData } from '../src/pro/charts-model.ts';

const data = {
  labels: ['A', 'B', 'C', 'D'],
  series: [
    { id: 'one', label: 'First', values: [-20, null, 0, 40] },
    { id: 'two', label: 'Second', values: [10, 20, NaN, Infinity] },
  ],
};

test('chart scale shares zero, preserves missing values and handles extreme numbers', () => {
  const model = prepareChartData(data);
  assert.deepEqual(model.series[1].values, [10, 20, null, null]);
  assert.equal(model.position(-20), 1);
  assert.equal(model.position(40), 0);
  assert.equal(model.position(0), 2 / 3);
  for (const values of [
    [0],
    [-5],
    [5, 5],
    [-Number.MAX_VALUE, Number.MAX_VALUE],
    [Number.MIN_VALUE],
  ]) {
    const model = prepareChartData({
      labels: values.map(String),
      series: [{ id: 's', label: 'S', values }],
    });
    assert.ok(model.ticks.every(Number.isFinite));
    assert.ok(values.every((value) => Number.isFinite(model.position(value))));
  }
  for (const invalid of [
    null,
    { labels: [null], series: [] },
    { ...data, series: [data.series[0], data.series[0]] },
    { ...data, series: [{ id: 's', label: 'S', values: [1] }] },
    { labels: ['A'], series: [{ id: 's', label: 'S', values: ['3'] }] },
    { labels: new Array(2), series: [] },
    { labels: ['A'], series: new Array(1) },
    { labels: ['A'], series: [{ id: 's', label: 'S', values: new Array(1) }] },
    { labels: Array(201).fill('A'), series: [] },
    { labels: [], series: Array(7).fill({}) },
  ])
    assert.throws(() => prepareChartData(invalid));
});

test('chart CSV uses raw numbers, quotes and formula escaping; gaps remain blank', () => {
  const csv = createChartCsv(
    {
      labels: ['=SUM(A1)', 'a,"b"\nc', '@last'],
      series: [{ id: 's', label: '+Revenue', values: [-12.5, null, Infinity] }],
    },
    'Month',
  );
  assert.equal(
    csv,
    '\uFEFFMonth,\'+Revenue\r\n\'=SUM(A1),-12.5\r\n"a,""b""\nc",\r\n\'@last,',
  );
  assert.match(createChartCsv(data), /A,-20,10/);
});

test('chart SSR preserves gaps, data table, safe errors and a separate entry/CSS', () => {
  const html = render(
    h(CartesianChart, {
      data,
      label: 'Sales',
      type: 'line',
      'data-test': 'native',
    }),
  );
  assert.match(html, /data-test="native"/);
  assert.match(html, /role="button" aria-label="A 값 보기"/);
  assert.match(html, /scope="row"/);
  assert.match(html, /값 없음/);
  assert.match(html, /d="M[^"L]+ M[^" ]+ L/); // Gap starts a second subpath.
  assert.doesNotMatch(html, /(?:NaN|Infinity)/);
  const bar = render(h(CartesianChart, { data, label: 'Sales' }));
  assert.equal(
    (bar.match(/class="mega-cartesian-chart__bar"/g) ?? []).length,
    5,
  );
  assert.match(
    render(
      h(CartesianChart, { data: { labels: [], series: [] }, label: 'Empty' }),
    ),
    /표시할 값이 없어요/,
  );
  assert.match(
    render(
      h(CartesianChart, {
        data: { labels: ['A'], series: [{ id: 's', label: 'S', values: [] }] },
        label: 'Invalid',
      }),
    ),
    /role="alert"/,
  );
  assert.doesNotMatch(
    readFileSync('dist/index.js', 'utf8'),
    /mega-cartesian-chart/,
  );
  assert.match(readFileSync('dist/charts.css', 'utf8'), /mega-cartesian-chart/);
  const tokens = new Set(
    [
      ...readFileSync('src/styles/_tokens.scss', 'utf8').matchAll(
        /(--mega-[\w-]+)\s*:/g,
      ),
    ].map((m) => m[1]),
  );
  for (const [, token] of readFileSync('src/pro/charts.css', 'utf8').matchAll(
    /var\((--mega-[\w-]+)/g,
  ))
    assert.ok(tokens.has(token), token);
});

test('stacked geometry separates positive/negative totals and keeps missing values', () => {
  const data = {
    labels: ['A', 'B'],
    series: [
      { id: 'a', label: 'A', values: [10, -5] },
      { id: 'b', label: 'B', values: [20, -10] },
      { id: 'c', label: 'C', values: [-4, null] },
    ],
  };
  const model = prepareChartData(data, true);
  assert.deepEqual(model.layers[1].values, [
    { start: 10, end: 30 },
    { start: -5, end: -15 },
  ]);
  assert.deepEqual(model.layers[2].values, [{ start: 0, end: -4 }, null]);
  assert.equal(model.position(30), 0);
  assert.equal(model.position(-15), 1);
  assert.throws(() =>
    prepareChartData(
      {
        labels: ['A'],
        series: [
          { id: 'a', label: 'A', values: [Number.MAX_VALUE] },
          { id: 'b', label: 'B', values: [Number.MAX_VALUE] },
        ],
      },
      true,
    ),
  );
  const area = render(
    h(CartesianChart, { label: 'Area', data, type: 'area', stacked: true }),
  );
  assert.match(area, /mega-cartesian-chart__area/);
  assert.doesNotMatch(area, /(?:NaN|Infinity)/);
});

test('ranges clamp invalid input and pie proportions handle zeros, gaps and extreme values', async () => {
  const { normalizeChartRange, preparePieData } =
    await import('../src/pro/charts-model.ts');
  const { PieChart } = await import('@mega-ui/react/charts');
  assert.deepEqual(normalizeChartRange(undefined, 6), [0, 5]);
  assert.deepEqual(normalizeChartRange([-3, 50], 6), [0, 5]);
  assert.deepEqual(normalizeChartRange([4, 2], 6), [4, 4]);
  assert.deepEqual(normalizeChartRange([NaN, Infinity], 6), [0, 5]);
  assert.deepEqual(normalizeChartRange(undefined, 0), [0, 0]);
  const data = [
    { label: 'A', value: Number.MAX_VALUE },
    { label: 'B', value: Number.MAX_VALUE },
    { label: 'Zero', value: 0 },
    { label: 'Missing', value: null },
  ];
  assert.deepEqual(
    preparePieData(data).slices.map((slice) => slice.share),
    [0.5, 0.5, 0, 0],
  );
  assert.throws(() => preparePieData([{ label: 'A', value: -1 }]));
  assert.throws(() => preparePieData(Array(25).fill({ label: 'A', value: 1 })));
  assert.throws(() => preparePieData(new Array(1)));
  for (const variant of ['pie', 'donut']) {
    const html = render(
      h(PieChart, {
        data: [{ label: 'Whole', value: 10 }],
        label: 'Share',
        variant,
      }),
    );
    assert.equal(
      (html.match(/class="mega-pie-chart__slice"/g) ?? []).length,
      1,
    );
    assert.match(html, /100%/);
    assert.doesNotMatch(html, /(?:NaN|Infinity)/);
  }
  assert.match(
    render(h(PieChart, { data: [{ label: 'A', value: 0 }], label: 'Zero' })),
    /양수 값이 없어요/,
  );
  assert.match(
    render(
      h(PieChart, { data: [{ label: 'A', value: -5 }], label: 'Negative' }),
    ),
    /role="alert"/,
  );
});
