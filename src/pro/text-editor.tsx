import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { TextEditorTools } from './text-editor-tools';
import { Button, IconButton, Input, Select } from '../components/controls';
import { Icon } from '../components/foundations';
import { Alert } from '../components/surfaces';
import {
  checkTextEditorNode,
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
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [href, setHref] = useState('');
  const [linkError, setLinkError] = useState('');
  const linkId = useId();
  const [guard] = useState(() =>
    Extension.create({
      name: 'documentGuard',
      addProseMirrorPlugins() {
        return [
          new Plugin({
            filterTransaction(transaction) {
              if (!transaction.docChanged) return true;
              try {
                checkTextEditorNode(transaction.doc);
                return true;
              } catch {
                setError(
                  '지원하지 않는 주소나 표 구조가 있어 변경을 적용하지 않았어요. 내용을 점검해 주세요.',
                );
                return false;
              }
            },
          }),
        ];
      },
    }),
  );
  const editor = useEditor({
    extensions: [...textEditorExtensions, guard],
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
      data-keyboard-focus={keyboardFocus}
      onPointerDownCapture={(event) => {
        setKeyboardFocus(false);
        props.onPointerDownCapture?.(event);
      }}
      onKeyDownCapture={(event) => {
        if (event.key === 'Tab') setKeyboardFocus(true);
        props.onKeyDownCapture?.(event);
      }}
      className={`mega-text-editor ${className}`}
    >
      <div className="mega-text-editor__documentbar">
        <span role="status">
          {saving
            ? '문서를 저장하고 있어요.'
            : message ||
              (dirty
                ? '저장하지 않은 변경 사항'
                : readOnly
                  ? '읽기 전용'
                  : '편집 가능')}
        </span>
        {!readOnly && onSave && (
          <Button
            size="sm"
            disabled={!editor || !dirty || composing}
            loading={saving}
            onClick={save}
          >
            문서 저장
          </Button>
        )}
      </div>
      <div
        className="mega-text-editor__toolbar"
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          const opened =
            event.currentTarget.querySelector<HTMLDetailsElement>(
              'details[open]',
            );
          if (opened) {
            opened.open = false;
            opened.querySelector('summary')?.focus();
            event.stopPropagation();
          }
        }}
      >
        {!readOnly && (
          <>
            <div
              role="group"
              aria-label="문서 서식"
              className="mega-text-editor__tools"
            >
              <Select
                size="sm"
                aria-label="문단 종류"
                className="mega-text-editor__block-select"
                disabled={locked}
                value={
                  editor?.isActive('heading')
                    ? String(editor.getAttributes('heading').level)
                    : 'paragraph'
                }
                onChange={(event) =>
                  event.target.value === 'paragraph'
                    ? editor?.chain().focus().setParagraph().run()
                    : editor
                        ?.chain()
                        .focus()
                        .setHeading({
                          level: Number(event.target.value) as
                            1 | 2 | 3 | 4 | 5 | 6,
                        })
                        .run()
                }
              >
                <option value="paragraph">본문</option>
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <option key={level} value={level}>
                    제목 {level}
                  </option>
                ))}
              </Select>
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
                <IconButton
                  key={mark}
                  variant="ghost"
                  size="sm"
                  className={`mega-text-editor__format mega-text-editor__format--${mark}`}
                  label={name}
                  title={name}
                  disabled={locked}
                  aria-pressed={editor?.isActive(mark) ?? false}
                  onClick={run}
                >
                  <span aria-hidden="true">
                    {
                      {
                        bold: 'B',
                        italic: 'I',
                        underline: 'U',
                        strike: 'S',
                        heading: 'H₂',
                        bulletList: '• ≡',
                        orderedList: '1. ≡',
                        blockquote: '❞',
                        codeBlock: '</>',
                      }[mark]
                    }
                  </span>
                </IconButton>
              ))}
              <IconButton
                variant="ghost"
                size="sm"
                className="mega-text-editor__format"
                label="실행 취소"
                title="실행 취소"
                disabled={locked || !editor?.can().undo()}
                onClick={() => editor?.chain().focus().undo().run()}
              >
                <Icon size={20}>
                  <path d="m9 5-5 5 5 5M4 10h10a6 6 0 0 1 0 12" />
                </Icon>
              </IconButton>
              <IconButton
                variant="ghost"
                size="sm"
                className="mega-text-editor__format"
                label="다시 실행"
                title="다시 실행"
                disabled={locked || !editor?.can().redo()}
                onClick={() => editor?.chain().focus().redo().run()}
              >
                <Icon size={20}>
                  <path d="m15 5 5 5-5 5M20 10H10a6 6 0 0 0 0 12" />
                </Icon>
              </IconButton>
            </div>
            <details className="mega-text-editor__panel" name={linkId}>
              <summary
                title="링크 편집"
                onClick={() => {
                  if (editor?.isActive('link'))
                    setHref(editor.getAttributes('link').href);
                }}
              >
                링크
              </summary>
              <div className="mega-text-editor__panel-body">
                <header>
                  <strong>링크 편집</strong>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      const detail = event.currentTarget.closest('details')!;
                      detail.open = false;
                      detail.querySelector('summary')?.focus();
                    }}
                  >
                    닫기
                  </Button>
                </header>
                <div className="mega-text-editor__tools">
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
                      if (
                        editor?.state.selection.empty &&
                        !editor.isActive('link')
                      ) {
                        setLinkError(
                          '링크를 연결할 글자를 먼저 선택해 주세요.',
                        );
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
              </div>
            </details>
          </>
        )}
        {editor && (
          <TextEditorTools
            editor={editor}
            panelGroup={linkId}
            locked={!editor || saving || composing}
            readOnly={readOnly}
            onError={setError}
          />
        )}
      </div>
      <EditorContent
        className="mega-text-editor__canvas"
        onErrorCapture={(event) => {
          if (event.target instanceof HTMLImageElement)
            setError(
              readOnly
                ? '이미지를 불러오지 못했어요. 원본 주소를 점검해 주세요.'
                : '이미지를 불러오지 못했어요. 이미지 주소를 수정하거나 다른 이미지로 바꿔 주세요.',
            );
        }}
        editor={editor}
        onFocusCapture={(event) => {
          if (
            !event.currentTarget
              .closest('section')
              ?.contains(event.relatedTarget as Node | null)
          )
            setKeyboardFocus(true);
        }}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
      />
      {!editor && <p role="status">편집기를 불러오고 있어요.</p>}
      <div className="mega-text-editor__footer">
        <span>{editor?.getText().length.toLocaleString() ?? 0}자</span>
        <span>{readOnly ? '문서 조회' : '문서 편집'}</span>
      </div>
      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}
    </section>
  );
}
