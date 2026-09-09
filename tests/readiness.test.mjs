import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import {
  BarChart,
  Combobox,
  DateRangePicker,
  LineChart,
  MultiSelect,
  Tabs,
  TabPanel,
} from '@mega-ui/react';

test('disabled combobox excludes its submitted value; required describes selection', () => {
  const html = render(
    h(Combobox, {
      name: 'owner',
      disabled: true,
      required: true,
      defaultValue: 'a',
      options: [{ value: 'a', label: 'Alice' }],
    }),
  );
  assert.match(html, /type="hidden"[^>]*disabled=""[^>]*value="a"/);
  assert.match(html, /aria-required="true"/);
});

test('date range validates uncontrolled defaults and intersects explicit bounds', () => {
  const html = render(
    h(DateRangePicker, {
      label: 'Period',
      startName: 'start',
      endName: 'end',
      startProps: { defaultValue: '2026-09-12', max: '2026-09-30' },
      endProps: { defaultValue: '2026-09-09', min: '2026-09-01' },
    }),
  );
  assert.match(html, /max="2026-09-09"/);
  assert.match(html, /min="2026-09-12"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /종료일은 시작일 이후/);
});

test('tabs expose stable relationships and skip a disabled initial selection', () => {
  const html = render(
    h(
      'div',
      null,
      h(Tabs, {
        id: 'views',
        label: 'Views',
        items: [
          { value: 'a', label: 'A', disabled: true },
          { value: 'b', label: 'B' },
        ],
      }),
      h(TabPanel, { active: true, tabsId: 'views', value: 'b' }, 'Content'),
    ),
  );
  assert.match(
    html,
    /id="views-tab-b" aria-controls="views-panel-b" aria-selected="true" tabindex="0"/,
  );
  assert.match(html, /id="views-panel-b" aria-labelledby="views-tab-b"/);
});

test('signed charts preserve negative magnitude and expose visible values', () => {
  const data = [
    { label: 'Loss', value: -20 },
    { label: 'Gain', value: 20 },
  ];
  const bar = render(h(BarChart, { label: 'Profit', data }));
  assert.match(bar, /--mega-chart-value:50%;left:0%/);
  assert.match(bar, /--mega-chart-value:50%;left:50%/);
  const line = render(
    h(LineChart, {
      label: 'Profit',
      data,
      formatValue: (value) => `${value}원`,
    }),
  );
  assert.match(line, /<dt>Loss<\/dt><dd>-20원<\/dd>/);
  assert.doesNotMatch(line, /mega-visually-hidden/);
});

test('remote multi-select reports empty, loading and retryable errors', () => {
  const props = { name: 'teams', label: 'Teams', options: [] };
  assert.match(
    render(h(MultiSelect, props)),
    /role="status">검색 결과가 없어요/,
  );
  assert.match(
    render(h(MultiSelect, { ...props, loading: true })),
    /aria-busy="true"/,
  );
  assert.match(
    render(h(MultiSelect, { ...props, error: 'Failed', onRetry() {} })),
    /role="alert">Failed/,
  );
});

test('filled action colors meet normal text contrast without changing the brand', () => {
  const tokens = readFileSync(
    new URL('../src/styles/_tokens.scss', import.meta.url),
    'utf8',
  );
  const luminance = (hex) =>
    hex
      .match(/\w\w/g)
      .map((channel) => parseInt(channel, 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      )
      .reduce(
        (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
        0,
      );
  for (const name of ['action-fill', 'action-danger-fill']) {
    const color = tokens.match(new RegExp(`--mega-${name}: #([a-f0-9]+)`))[1];
    assert.ok(1.05 / (luminance(color) + 0.05) >= 4.5, name);
  }
});
