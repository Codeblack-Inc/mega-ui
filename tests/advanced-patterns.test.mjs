import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import * as ui from '@mega-ui/react';

test('P1 patterns render data, states, actions and native selection semantics', () => {
  for (const name of [
    'BarChart',
    'LineChart',
    'Sparkline',
    'FileUploadList',
    'NotificationList',
    'SelectionCard',
    'DetailSection',
    'InlineEdit',
    'MegaIcon',
  ])
    assert.equal(typeof ui[name], 'function', name);
  assert.equal(ui.DetailSection, ui.FormSection);

  const html = render(
    h(
      'main',
      null,
      h(ui.BarChart, { label: 'Sales', data: [{ label: 'A', value: 10 }] }),
      h(ui.LineChart, {
        label: 'Trend',
        data: [
          { label: 'Mon', value: 4 },
          { label: 'Tue', value: 4 },
        ],
      }),
      h(ui.Sparkline, { values: [1, 3], label: 'Up' }),
      h(ui.FileUploadList, {
        items: [
          { id: '1', name: 'report.pdf', status: 'error', error: 'Failed' },
        ],
        onRetry() {},
      }),
      h(ui.NotificationList, {
        items: [{ id: 1, group: 'Today', title: 'Notice' }],
        onRead() {},
        onReadAll() {},
      }),
      h(ui.SelectionCard, { name: 'plan', value: 'pro', title: 'Pro' }),
      h(ui.MegaIcon, { name: 'bell', 'aria-label': 'Notifications' }),
    ),
  );
  assert.match(html, /--mega-chart-value:100%/);
  assert.doesNotMatch(html, /NaN|Infinity/);
  assert.match(html, /Failed/);
  assert.match(html, />다시 시도<\/button>/);
  assert.match(html, /Today/);
  assert.match(html, /type="radio" name="plan" value="pro"/);
  assert.match(html, /aria-label="Notifications"/);
});
