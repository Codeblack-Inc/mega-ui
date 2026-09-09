import { getSchema, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

export type TextEditorDocument = JSONContent;

export function isTextEditorLink(value: string): boolean {
  if (/\s|[\u0000-\u001f\u007f]/u.test(value)) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export const textEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: {
      openOnClick: false,
      autolink: false,
      linkOnPaste: false,
      isAllowedUri: isTextEditorLink,
      HTMLAttributes: { target: null, rel: 'noopener noreferrer' },
    },
  }),
];
const schema = getSchema(textEditorExtensions);
export const emptyTextEditorDocument: TextEditorDocument = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function validateDocument(value: unknown): TextEditorDocument {
  const node = schema.nodeFromJSON(value);
  if (node.type !== schema.topNodeType)
    throw new Error('Invalid document root');
  node.check();
  node.descendants((child) => {
    if (child.type.name === 'heading' && ![2, 3].includes(child.attrs.level)) {
      throw new Error('Unsupported heading');
    }
    for (const mark of child.marks) {
      if (mark.type.name === 'link' && !isTextEditorLink(mark.attrs.href)) {
        throw new Error('Unsafe link');
      }
    }
  });
  return node.toJSON();
}

export function serializeTextEditorDocument(
  document: TextEditorDocument,
): string {
  const text = JSON.stringify({ version: 1, document });
  parseTextEditorDocument(text);
  return text;
}

export function parseTextEditorDocument(text: string): TextEditorDocument {
  // ponytail: 1M UTF-16 units; larger documents need a measured loading strategy.
  if (text.length > 1_000_000) throw new Error('Document too large');
  const value = JSON.parse(text);
  if (value?.version !== 1) throw new Error('Unsupported document version');
  return validateDocument(value.document);
}
