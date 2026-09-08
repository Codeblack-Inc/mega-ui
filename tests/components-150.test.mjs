import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import * as ui from '@mega-ui/react';

const inventory = JSON.parse(
  readFileSync(
    new URL('../docs/component-inventory.json', import.meta.url),
    'utf8',
  ),
);
test('all 150 requested components are public and existing aliases reuse the implementation', () => {
  assert.equal(inventory.length, 150);
  assert.equal(new Set(inventory.map((item) => item.name)).size, 150);
  for (const item of inventory) {
    assert.equal(typeof ui[item.name], 'function', item.name);
    if (item.status === 'reused')
      assert.equal(ui[item.name], ui[item.implementation], item.name);
  }
});

test('foundation semantics and invalid layout dimensions have safe output', () => {
  const html = render(
    h(
      ui.ThemeProvider,
      { theme: 'dark' },
      h(ui.Icon, { label: 'Check' }, h('path', { d: 'M0 0' })),
      h(ui.VisuallyHidden, null, 'Assistive text'),
      h(ui.AspectRatio, { ratio: NaN }),
      h(ui.SplitPane, {
        label: 'Size',
        first: 'A',
        second: 'B',
        min: 90,
        max: 10,
        defaultSize: Infinity,
      }),
      h(ui.Portal, null, 'Client only'),
    ),
  );
  assert.match(html, /data-mega-theme="dark"/);
  assert.match(html, /aria-label="Check"/);
  assert.match(html, /aspect-ratio:1/);
  assert.match(html, /min="90" max="90"/);
  assert.doesNotMatch(html, /NaN|Infinity|Client only/);
  const panel = ui.ResizablePanel({ label: 'Resize', direction: 'both' });
  const element = { offsetWidth: 200, offsetHeight: 100, style: {} };
  let prevented = false;
  panel.props.onKeyDown({
    key: 'ArrowRight',
    target: element,
    currentTarget: element,
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(element.style.width, '216px');
  assert.ok(prevented);
  assert.match(
    render(h(ui.Icon, { 'aria-label': 'Native label' })),
    /aria-label="Native label"/,
  );
  assert.doesNotMatch(
    render(h(ui.Icon, { 'aria-labelledby': 'label-id' })),
    /aria-hidden="true"/,
  );
});

test('content renders native disclosures, literal code, real QR paths and safe empty states', () => {
  const html = render(
    h(
      'div',
      null,
      h(ui.Accordion, { items: [{ id: 'a', title: 'A', content: 'Body' }] }),
      h(ui.Tree, {
        label: 'Files',
        nodes: [
          {
            id: 'a',
            label: 'Folder',
            children: [{ id: 'b', label: 'File', disabled: true }],
          },
        ],
      }),
      h(ui.CodeBlock, { code: '<script>alert(1)</script>' }),
      h(ui.Carousel, { label: 'Empty' }),
      h(ui.QRCode, { value: 'https://example.com', label: 'Link' }),
    ),
  );
  assert.match(html, /<details/);
  assert.match(html, /disabled=""/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /0 \/ 0/);
  assert.match(html, /shape-rendering="crispEdges"/);
  assert.match(html, /M4 4h1v1h-1z/);
  assert.notEqual(
    render(h(ui.QRCode, { value: '가', label: 'QR' })),
    render(h(ui.QRCode, { value: '나', label: 'QR' })),
  );
  assert.match(
    render(h(ui.QRCode, { value: 'a'.repeat(10000), label: 'Large' })),
    /role="alert"/,
  );
});

test('media and AI components retain accessible labels and controlled busy states', () => {
  const html = render(
    h(
      'div',
      null,
      h(ui.Dropzone, {
        label: 'Files',
        accept: 'image/*',
        multiple: true,
        disabled: true,
        onFilesChange() {},
      }),
      h(ui.PDFViewer, { label: 'Document', src: '/sample.pdf' }),
      h(ui.PromptInput, {
        label: 'Prompt',
        busy: true,
        onSubmit() {},
        onStop() {},
      }),
      h(ui.StreamingText, { text: 'Partial', streaming: true }),
      h(ui.AgentActivity, {
        steps: [{ id: 'x', label: 'Task', status: 'error' }],
      }),
    ),
  );
  assert.match(html, /type="file" accept="image\/\*" multiple="" disabled=""/);
  assert.match(html, /type="application\/pdf" aria-label="Document"/);
  assert.match(html, /생성 중지/);
  assert.match(html, /aria-busy="true" aria-live="off"/);
  assert.match(html, /data-status="error"/);
  assert.match(render(h(ui.Image, { alt: 'Missing' })), /mega-image-fallback/);
  assert.doesNotMatch(render(h(ui.Image, { alt: '' })), /role="img"/);
});
