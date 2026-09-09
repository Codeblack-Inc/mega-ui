import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TextEditor,
  parseTextEditorDocument,
  serializeTextEditorDocument,
} from '@mega-ui/react/text-editor';

test('editor documents round trip and reject unsafe or unsupported input', () => {
  const document = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '한글 <script>', marks: [{ type: 'bold' }] },
        ],
      },
    ],
  };
  assert.deepEqual(
    parseTextEditorDocument(serializeTextEditorDocument(document)),
    document,
  );
  for (const value of [
    '{',
    '{"version":2}',
    'x'.repeat(1_000_001),
    '{"version":1,"document":{"type":"paragraph"}}',
  ])
    assert.throws(() => parseTextEditorDocument(value));
  for (const href of [
    'javascript:alert(1)',
    'data:text/html,test',
    '//example.com',
    'java\nscript:alert(1)',
    'https://a.test/ a',
  ]) {
    assert.throws(() =>
      serializeTextEditorDocument({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'link',
                marks: [{ type: 'link', attrs: { href } }],
              },
            ],
          },
        ],
      }),
    );
  }
  assert.throws(() =>
    serializeTextEditorDocument({
      type: 'doc',
      content: [{ type: 'unknown' }],
    }),
  );
  assert.throws(() =>
    serializeTextEditorDocument({
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 7 } }],
    }),
  );
});

test('editor supports SSR and its engine and CSS stay outside the core entry', () => {
  assert.match(
    renderToStaticMarkup(createElement(TextEditor, { label: '문서 본문' })),
    /aria-label="문서 본문"/,
  );
  assert.doesNotMatch(
    readFileSync('dist/index.js', 'utf8'),
    /@tiptap|text-editor/,
  );
  assert.match(
    readFileSync('dist/text-editor.css', 'utf8'),
    /mega-text-editor/,
  );
  assert.doesNotMatch(
    readFileSync('dist/data-grid.css', 'utf8'),
    /mega-text-editor/,
  );
});

test('Markdown, table and image data round trip and unsafe imports fail atomically', async () => {
  const { parseTextEditorMarkdown: parse, exportTextEditorMarkdown: exp } =
    await import('@mega-ui/react/text-editor');
  const source =
    '# 제목\n\n**굵게** ++밑줄++ [문서](https://example.com)\n\n| 항목 | 값 |\n| --- | --- |\n| 문서 | 3 |\n\n![설명](https://example.com/a.png)\n\n```js\nconst x = 1;\n```';
  const document = parse(source);
  assert.deepEqual(parse(exp(document).markdown), document);
  assert.deepEqual(
    parseTextEditorDocument(serializeTextEditorDocument(document)),
    document,
  );
  assert.equal(exp(document).warnings.length, 1);
  for (const text of [
    '![bad](javascript:alert)',
    '![bad](data:image/svg+xml;base64,PHN2Zz4=)',
    '[bad](javascript:alert)',
    'x'.repeat(1_000_001),
  ])
    assert.throws(() => parse(text));
  for (const src of [
    '//example.com/a.png',
    'data:image/png;base64,YmFk',
    'file:///tmp/a.png',
  ])
    assert.throws(() =>
      serializeTextEditorDocument({
        type: 'doc',
        content: [{ type: 'image', attrs: { src } }],
      }),
    );
  const table = document.content.find((node) => node.type === 'table');
  table.content[0].content[0].attrs.colspan = 999999;
  assert.throws(() => serializeTextEditorDocument(document));
});

test('row heights round trip, reject unsafe values and warn about Markdown loss', async () => {
  const { parseTextEditorMarkdown, exportTextEditorMarkdown } =
    await import('@mega-ui/react/text-editor');
  const document = parseTextEditorMarkdown('| 항목 |\n| --- |\n| 문서 |');
  const row = document.content[0].content[0];
  row.attrs.height = 120;
  assert.equal(
    parseTextEditorDocument(serializeTextEditorDocument(document)).content[0]
      .content[0].attrs.height,
    120,
  );
  assert.ok(
    exportTextEditorMarkdown(document).warnings.some((text) =>
      text.includes('행 높이'),
    ),
  );
  for (const height of [0, -1, 23, 4097, 24.5, '120', '1px; color:red']) {
    row.attrs.height = height;
    assert.throws(() => serializeTextEditorDocument(document));
  }
});
