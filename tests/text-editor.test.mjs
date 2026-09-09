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
      content: [{ type: 'heading', attrs: { level: 1 } }],
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
