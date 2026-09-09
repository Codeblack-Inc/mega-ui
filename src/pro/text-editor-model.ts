import { getSchema, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { MarkdownManager } from '@tiptap/markdown';
import { TableMap } from '@tiptap/pm/tables';
import type { Node } from '@tiptap/pm/model';
import { TableRowHeight } from './text-editor-table';

export type TextEditorDocument = JSONContent;
const documentLimit = 1_000_000;
export const imageFileLimit = 512_000;

export function isTextEditorLink(value: unknown): value is string {
  if (typeof value !== 'string' || /\s|[\u0000-\u001f\u007f]/u.test(value))
    return false;
  try {
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(
      new URL(value).protocol,
    );
  } catch {
    return false;
  }
}

export function isTextEditorImage(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (isTextEditorLink(value) && /^https?:/i.test(value)) return true;
  const match =
    /^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      value,
    );
  if (!match || value.length > 700_000) return false;
  try {
    const bytes = atob(match[2]!);
    if (bytes.length > imageFileLimit) return false;
    return match[1] === 'png'
      ? bytes.startsWith('\x89PNG\r\n\x1a\n')
      : match[1] === 'jpeg'
        ? bytes.startsWith('\xff\xd8\xff')
        : match[1] === 'gif'
          ? /^GIF8[79]a/.test(bytes)
          : bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP';
  } catch {
    return false;
  }
}

const SafeImage = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), alt: { default: '설명 없는 이미지' } };
  },
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) =>
          isTextEditorImage(element.getAttribute('src')) ? null : false,
      },
    ];
  },
  // Image input rules bypass file/URL validation. The explicit image tools handle insertion.
  addInputRules() {
    return [];
  },
  renderMarkdown(node) {
    const escape = (text: string) => text.replace(/[\\\[\]"]/g, '\\$&');
    const src = String(node.attrs?.src ?? '').replace(
      /[()<>]/g,
      encodeURIComponent,
    );
    const title = node.attrs?.title ? ` "${escape(node.attrs.title)}"` : '';
    return `![${escape(node.attrs?.alt ?? '')}](${src}${title})`;
  },
}).configure({
  allowBase64: true,
  HTMLAttributes: { loading: 'lazy', referrerpolicy: 'no-referrer' },
});

export const textEditorExtensions = [
  StarterKit.configure({
    link: {
      openOnClick: false,
      autolink: false,
      linkOnPaste: false,
      isAllowedUri: isTextEditorLink,
      HTMLAttributes: { target: null, rel: 'noopener noreferrer' },
    },
  }),
  TableKit.configure({
    table: { resizable: true, allowTableNodeSelection: true },
  }),
  SafeImage,
  TableRowHeight,
];
const schema = getSchema(textEditorExtensions);
const markdown = new MarkdownManager({ extensions: textEditorExtensions });
export const emptyTextEditorDocument: TextEditorDocument = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export function checkTextEditorNode(node: Node): void {
  node.check();
  let cells = 0;
  node.descendants((child) => {
    if (
      child.type.name === 'heading' &&
      ![1, 2, 3, 4, 5, 6].includes(child.attrs.level)
    )
      throw new Error('Unsupported heading');
    if (
      child.type.name === 'tableRow' &&
      child.attrs.height != null &&
      (!Number.isInteger(child.attrs.height) ||
        child.attrs.height < 24 ||
        child.attrs.height > 4096)
    )
      throw new Error('Invalid row height');
    if (child.type.name === 'image') {
      if (!isTextEditorImage(child.attrs.src)) throw new Error('Unsafe image');
      for (const key of ['alt', 'title'])
        if (child.attrs[key] != null && typeof child.attrs[key] !== 'string')
          throw new Error('Invalid image text');
      for (const key of ['width', 'height'])
        if (
          child.attrs[key] != null &&
          (!Number.isInteger(Number(child.attrs[key])) ||
            Number(child.attrs[key]) < 1 ||
            Number(child.attrs[key]) > 4096)
        )
          throw new Error('Invalid image size');
    }
    if (['tableCell', 'tableHeader'].includes(child.type.name)) {
      cells += 1;
      if (cells > 10_000) throw new Error('Too many cells');
      for (const key of ['colspan', 'rowspan'])
        if (
          !Number.isInteger(child.attrs[key]) ||
          child.attrs[key] < 1 ||
          child.attrs[key] > 100
        )
          throw new Error('Invalid cell span');
      if (
        child.attrs.align != null &&
        !['left', 'center', 'right'].includes(child.attrs.align)
      )
        throw new Error('Invalid cell alignment');
      const widths: unknown = child.attrs.colwidth;
      if (
        widths != null &&
        (!Array.isArray(widths) ||
          widths.length !== child.attrs.colspan ||
          widths.some(
            (width) => !Number.isInteger(width) || width < 0 || width > 4096,
          ))
      )
        throw new Error('Invalid column width');
    }
    for (const mark of child.marks)
      if (mark.type.name === 'link' && !isTextEditorLink(mark.attrs.href))
        throw new Error('Unsafe link');
  });
  node.descendants((child) => {
    if (child.type.name === 'table') {
      // Bound the allocation before TableMap expands spans from external documents.
      if (child.childCount > 100 || child.firstChild!.childCount > 100)
        throw new Error('Table too large');
      child.forEach((row) => {
        let width = 0;
        row.forEach((cell) => {
          width += cell.attrs.colspan;
        });
        if (width > 100) throw new Error('Table too wide');
      });
      const map = TableMap.get(child);
      if (
        map.width > 100 ||
        map.problems?.some((problem) => problem.type !== 'colwidth mismatch')
      )
        throw new Error('Invalid table geometry');
    }
  });
}

function validateDocument(value: unknown): TextEditorDocument {
  const node = schema.nodeFromJSON(value);
  if (node.type !== schema.topNodeType)
    throw new Error('Invalid document root');
  checkTextEditorNode(node);
  // Schema defaults may share attribute objects; callers own their returned document.
  return structuredClone(node.toJSON());
}
export function serializeTextEditorDocument(
  document: TextEditorDocument,
): string {
  const text = JSON.stringify({ version: 1, document });
  parseTextEditorDocument(text);
  return text;
}
export function parseTextEditorDocument(text: string): TextEditorDocument {
  if (text.length > documentLimit) throw new Error('Document too large');
  const value = JSON.parse(text);
  if (value?.version !== 1) throw new Error('Unsupported document version');
  return validateDocument(value.document);
}

export function parseTextEditorMarkdown(text: string): TextEditorDocument {
  if (text.length > documentLimit) throw new Error('Document too large');
  const document = markdown.parse(text);
  if (!document.content?.length) document.content = [{ type: 'paragraph' }];
  return parseTextEditorDocument(JSON.stringify({ version: 1, document }));
}
export function exportTextEditorMarkdown(document: TextEditorDocument): {
  markdown: string;
  warnings: string[];
} {
  const valid = parseTextEditorDocument(serializeTextEditorDocument(document));
  const warnings = new Set<string>();
  schema.nodeFromJSON(valid).descendants((node) => {
    if (node.type.name === 'tableRow' && node.attrs.height != null)
      warnings.add('행 높이는 Markdown에 포함되지 않아요.');
    if (node.type.name === 'image' && (node.attrs.width || node.attrs.height))
      warnings.add('이미지 크기는 Markdown에 포함되지 않아요.');
    if (
      ['tableCell', 'tableHeader'].includes(node.type.name) &&
      (node.attrs.colspan !== 1 ||
        node.attrs.rowspan !== 1 ||
        node.attrs.colwidth ||
        node.childCount !== 1 ||
        node.firstChild?.type.name !== 'paragraph')
    )
      warnings.add(
        '셀 병합·열 너비·셀 안의 여러 문단과 블록은 Markdown에서 원래 모양을 유지하지 못해요.',
      );
    if (
      node.type.name === 'table' &&
      node.firstChild?.firstChild?.type.name !== 'tableHeader'
    )
      warnings.add('표의 첫 행은 Markdown에서 제목 행으로 바뀌어요.');
    if (node.marks.some((mark) => mark.type.name === 'underline'))
      warnings.add(
        '밑줄은 ++글자++ 확장 문법으로 내보내요. 다른 Markdown 도구에서는 다르게 보일 수 있어요.',
      );
  });
  return { markdown: markdown.serialize(valid), warnings: [...warnings] };
}
