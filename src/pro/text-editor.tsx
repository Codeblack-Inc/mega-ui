import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Button, Input } from '../components/controls';
import { Alert } from '../components/surfaces';
import {
  emptyTextEditorDocument,
  isTextEditorLink,
  parseTextEditorDocument,
  serializeTextEditorDocument,
  textEditorExtensions,
  type TextEditorDocument,
} from './text-editor-model';

export interface TextEditorProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'onChange' | 'defaultValue'
> {
  label: string;
  defaultValue?: TextEditorDocument;
  readOnly?: boolean;
  onChange?: (document: TextEditorDocument) => void;
  onSave?: (document: TextEditorDocument) => Promise<void>;
}

export function TextEditor({
  label,
  defaultValue = emptyTextEditorDocument,
  readOnly = false,
  onChange,
  onSave,
  className = '',
  ...props
}: TextEditorProps) {
  const [initial] = useState(() =>
    parseTextEditorDocument(serializeTextEditorDocument(defaultValue)),
  );
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [current, setCurrent] = useState(saved);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [href, setHref] = useState('');
  const [linkError, setLinkError] = useState('');
  const linkId = useId();
  const editor = useEditor({
    extensions: textEditorExtensions,
    content: initial,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !readOnly,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': label,
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor }) => {
      const document = editor.getJSON();
      setCurrent(JSON.stringify(document));
      setMessage('');
      onChange?.(document);
    },
  });
  useEffect(() => {
    editor?.setEditable(!readOnly && !saving, false);
    editor?.view.dom.setAttribute('aria-readonly', String(readOnly || saving));
    editor?.view.dom.setAttribute('aria-label', label);
  }, [editor, readOnly, saving, label]);
  const dirty = current !== saved;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save() {
    if (!editor || !onSave || readOnly || busy.current || editor.view.composing)
      return;
    busy.current = true;
    editor.setEditable(false, false);
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const document = parseTextEditorDocument(
        serializeTextEditorDocument(editor.getJSON()),
      );
      await onSave(document);
      setSaved(JSON.stringify(document));
      setMessage('문서를 저장했어요.');
    } catch {
      setError(
        '문서를 저장하지 못했어요. 편집 내용은 이 화면에 남아 있어요. 다시 저장해 주세요.',
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  const locked = !editor || readOnly || saving || composing;
  return (
    <section
      {...props}
      aria-label={label}
      className={`mega-text-editor ${className}`}
    >
      {!readOnly && (
        <>
          <div
            role="group"
            aria-label="문서 서식"
            className="mega-text-editor__tools"
          >
            {(
              [
                [
                  '굵게',
                  'bold',
                  () => editor?.chain().focus().toggleBold().run(),
                ],
                [
                  '기울임',
                  'italic',
                  () => editor?.chain().focus().toggleItalic().run(),
                ],
                [
                  '밑줄',
                  'underline',
                  () => editor?.chain().focus().toggleUnderline().run(),
                ],
                [
                  '취소선',
                  'strike',
                  () => editor?.chain().focus().toggleStrike().run(),
                ],
                [
                  '제목',
                  'heading',
                  () =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                ],
                [
                  '글머리 목록',
                  'bulletList',
                  () => editor?.chain().focus().toggleBulletList().run(),
                ],
                [
                  '번호 목록',
                  'orderedList',
                  () => editor?.chain().focus().toggleOrderedList().run(),
                ],
                [
                  '인용',
                  'blockquote',
                  () => editor?.chain().focus().toggleBlockquote().run(),
                ],
                [
                  '코드 블록',
                  'codeBlock',
                  () => editor?.chain().focus().toggleCodeBlock().run(),
                ],
              ] as const
            ).map(([name, mark, run]) => (
              <Button
                key={mark}
                variant="secondary"
                disabled={locked}
                aria-pressed={editor?.isActive(mark) ?? false}
                onClick={run}
              >
                {name}
              </Button>
            ))}
            <Button
              variant="secondary"
              disabled={locked || !editor?.can().undo()}
              onClick={() => editor?.chain().focus().undo().run()}
            >
              실행 취소
            </Button>
            <Button
              variant="secondary"
              disabled={locked || !editor?.can().redo()}
              onClick={() => editor?.chain().focus().redo().run()}
            >
              다시 실행
            </Button>
          </div>
          <div
            role="group"
            aria-label="링크 편집"
            className="mega-text-editor__tools"
          >
            <label htmlFor={linkId}>링크 주소</label>
            <Input
              id={linkId}
              type="url"
              value={href}
              disabled={locked}
              aria-invalid={!!linkError}
              aria-describedby={linkError ? `${linkId}-error` : undefined}
              onChange={(event) => {
                setHref(event.target.value);
                setLinkError('');
              }}
            />
            <Button
              variant="secondary"
              disabled={locked}
              onClick={() => {
                if (!isTextEditorLink(href)) {
                  setLinkError(
                    'http, https, mailto, tel로 시작하는 주소를 입력해 주세요.',
                  );
                  return;
                }
                if (editor?.state.selection.empty && !editor.isActive('link')) {
                  setLinkError('링크를 연결할 글자를 먼저 선택해 주세요.');
                  return;
                }
                editor
                  ?.chain()
                  .focus()
                  .extendMarkRange('link')
                  .setLink({ href })
                  .run();
                setLinkError('');
              }}
            >
              링크 적용
            </Button>
            <Button
              variant="secondary"
              disabled={locked || !editor?.isActive('link')}
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .extendMarkRange('link')
                  .unsetLink()
                  .run()
              }
            >
              링크 해제
            </Button>
          </div>
          {linkError && (
            <Alert id={`${linkId}-error`} tone="danger" role="alert">
              {linkError}
            </Alert>
          )}
        </>
      )}
      <EditorContent
        editor={editor}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
      />
      {!editor && <p role="status">편집기를 불러오고 있어요.</p>}
      {!readOnly && (
        <div className="mega-text-editor__tools">
          {onSave && (
            <Button
              disabled={!editor || !dirty || composing}
              loading={saving}
              onClick={save}
            >
              문서 저장
            </Button>
          )}
          <span role="status">
            {saving
              ? '문서를 저장하고 있어요.'
              : message || (dirty ? '저장하지 않은 변경 사항' : '')}
          </span>
        </div>
      )}
      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}
    </section>
  );
}
