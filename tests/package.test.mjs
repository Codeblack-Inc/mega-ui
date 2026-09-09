import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ui from '@mega-ui/react';

test('public package exports render without a browser or bundled React', () => {
  assert.ok(Object.keys(ui).length >= 150);
  const html = renderToStaticMarkup(
    h(
      ui.Container,
      null,
      h(
        ui.Grid,
        { minItemWidth: 220 },
        h(ui.Card, null, h(ui.PageHeader, { title: 'Workspace' })),
      ),
    ),
  );
  assert.match(html, /<h1/);
  assert.match(html, /--mega-grid-min:220px/);
  const js = readFileSync(new URL('../dist/index.js', import.meta.url), 'utf8');
  assert.match(js, /from ["']react\/jsx-runtime["']/);
  assert.doesNotMatch(js, /\.scss["']/);
});

test('buttons prevent accidental submit and block duplicate actions while loading', () => {
  const idle = renderToStaticMarkup(h(ui.Button, null, 'Save'));
  assert.match(idle, /type="button"/);
  assert.doesNotMatch(idle, /disabled|aria-busy/);
  const busy = renderToStaticMarkup(
    h(ui.Button, { loading: true, disabled: false, type: 'submit' }, 'Saving'),
  );
  assert.match(busy, /type="submit"/);
  assert.match(busy, /disabled=""/);
  assert.match(busy, /aria-busy="true"/);
  assert.match(busy, /Saving/);
});

test('field error takes precedence and the documented accessibility wiring is retained', () => {
  const html = renderToStaticMarkup(
    h(
      ui.Field,
      { label: 'Email', htmlFor: 'email', hint: 'Hint', error: 'Invalid' },
      h(ui.Input, {
        id: 'email',
        'aria-describedby': 'email-description',
        'aria-invalid': true,
        required: true,
      }),
    ),
  );
  assert.match(html, /for="email"/);
  assert.match(html, /aria-describedby="email-description"/);
  assert.match(html, /id="email-description"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /Invalid/);
  assert.doesNotMatch(html, /Hint/);
});

test('native form values and custom class/style survive composition', () => {
  const html = renderToStaticMarkup(
    h(
      ui.Stack,
      { gap: 2, className: 'consumer', style: { marginTop: 12 } },
      h(ui.Checkbox, { name: 'notify', defaultChecked: true }, 'Notifications'),
      h(
        ui.Select,
        { defaultValue: 'dev', 'aria-label': 'Team' },
        h('option', { value: 'dev' }, 'Development'),
      ),
    ),
  );
  assert.match(html, /consumer/);
  assert.match(html, /margin-top:12px/);
  assert.match(html, /--mega-gap:var\(--mega-space-2\)/);
  assert.match(html, /checked=""/);
  assert.match(html, /selected=""/);
});

test('CSS, declarations, docs and package metadata are available to consumers', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(Object.keys(pkg.dependencies), [
    '@tiptap/core',
    '@tiptap/pm',
    '@tiptap/react',
    '@tiptap/starter-kit',
    'qrcode-generator',
    'react-data-grid',
  ]);
  assert.deepEqual(pkg.sideEffects, ['**/*.css', '**/*.scss']);
  for (const path of [
    'dist/index.d.ts',
    'dist/styles.css',
    'docs/llms.txt',
    'docs/ai-guide.md',
    'docs/components.md',
  ]) {
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), path);
  }
  const css = readFileSync(
    new URL('../dist/styles.css', import.meta.url),
    'utf8',
  );
  assert.match(css, /data-mega-theme=dark/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(
    readFileSync(new URL('../dist/index.d.ts', import.meta.url), 'utf8'),
    /\.scss/,
  );
});

test('selection patterns preserve accessible names, native form values and disabled options', () => {
  const html = renderToStaticMarkup(
    h(
      'form',
      null,
      h(ui.Switch, {
        label: 'Payment alerts',
        name: 'alerts',
        defaultChecked: true,
      }),
      h(ui.SegmentedControl, {
        label: 'Payment method',
        name: 'method',
        defaultValue: 'card',
        options: [
          { label: 'Card', value: 'card' },
          { label: 'Account', value: 'account', disabled: true },
        ],
      }),
      h(ui.ProgressBar, { label: 'Budget usage', value: 56 }),
    ),
  );
  assert.match(html, /role="switch"/);
  assert.match(html, /Payment alerts/);
  assert.match(html, /<legend[^>]*>Payment method<\/legend>/);
  assert.match(html, /type="radio" name="method" checked="" value="card"/);
  assert.match(
    html,
    /<input(?=[^>]*disabled="")(?=[^>]*value="account")[^>]*>/,
  );
  assert.match(html, /aria-label="Budget usage" max="100" value="56"/);
});

test('navigation, data and overlay components render on the server', () => {
  const html = renderToStaticMarkup(
    h(
      ui.ToastProvider,
      null,
      h(ui.Tabs, {
        label: 'Views',
        defaultValue: 'a',
        items: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      }),
      h(
        ui.Table,
        null,
        h(
          ui.TableBody,
          null,
          h(ui.TableRow, null, h(ui.TableCell, { numeric: true }, '1,000')),
        ),
      ),
      h(ui.Dialog, { open: false, title: 'Confirm', onClose() {} }, 'Body'),
      h(ui.Amount, { value: -4500 }),
    ),
  );
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /<table/);
  assert.match(html, /<dialog(?![^>]*\sopen)/);
  assert.match(html, /-4,500/);
});
