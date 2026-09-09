import { useId, useRef, useState, type MouseEvent } from 'react';
import type { Editor, ChainedCommands } from '@tiptap/core';
import { Fragment } from '@tiptap/pm/model';
import { Selection } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import { CellSelection, TableMap } from '@tiptap/pm/tables';
import { Button, Checkbox, Input, Textarea } from '../components/controls';
import { Dialog } from '../components/overlay';
import { Alert } from '../components/surfaces';
import {
  exportTextEditorMarkdown,
  imageFileLimit,
  isTextEditorImage,
  parseTextEditorDocument,
  parseTextEditorMarkdown,
  serializeTextEditorDocument,
  type TextEditorDocument,
} from './text-editor-model';

function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function TextEditorTools({
  editor,
  panelGroup,
  locked,
  readOnly,
  onError,
}: {
  editor: Editor;
  panelGroup: string;
  locked: boolean;
  readOnly: boolean;
  onError: (message: string) => void;
}) {
  const id = useId();
  const [rows, setRows] = useState('3');
  const [cols, setCols] = useState('3');
  const [cellWidth, setCellWidth] = useState('160');
  const [rowHeight, setRowHeight] = useState('');
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');
  const [decorative, setDecorative] = useState(false);
  const [width, setWidth] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [pending, setPending] = useState<TextEditorDocument | null>(null);
  const [exported, setExported] = useState<ReturnType<
    typeof exportTextEditorMarkdown
  > | null>(null);
  const [reading, setReading] = useState(false);
  const [outline, setOutline] = useState(false);
  const dragging = useRef<{
    index: number;
    document: typeof editor.state.doc;
  } | null>(null);
  const disabled = locked || reading;
  const tableActions: [string, (chain: ChainedCommands) => ChainedCommands][] =
    [
      ['위에 행 추가', (c) => c.addRowBefore()],
      ['아래에 행 추가', (c) => c.addRowAfter()],
      ['행 삭제', (c) => c.deleteRow()],
      ['왼쪽에 열 추가', (c) => c.addColumnBefore()],
      ['오른쪽에 열 추가', (c) => c.addColumnAfter()],
      ['열 삭제', (c) => c.deleteColumn()],
      ['셀 병합', (c) => c.mergeCells()],
      ['셀 분할', (c) => c.splitCell()],
      ['제목 행 전환', (c) => c.toggleHeaderRow()],
      ['제목 열 전환', (c) => c.toggleHeaderColumn()],
      ['표 삭제', (c) => c.deleteTable()],
    ];
  function selectTable() {
    const { $from } = editor.state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name !== 'table') continue;
      const map = TableMap.get(node);
      const start = $from.start(depth);
      editor
        .chain()
        .focus()
        .setCellSelection({
          anchorCell: start + map.map[0]!,
          headCell: start + map.map[map.map.length - 1]!,
        })
        .run();
      return;
    }
  }
  function applyRowHeight() {
    if (disabled || !editor.isEditable) return;
    const height = rowHeight === '' ? null : Number(rowHeight);
    if (
      height !== null &&
      (!Number.isInteger(height) || height < 24 || height > 4096)
    ) {
      onError('행 높이는 24~4,096 또는 빈 값으로 입력해 주세요.');
      return;
    }
    const { selection, tr } = editor.state;
    const { $from } = selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      const table = $from.node(depth);
      if (table.type.name !== 'table') continue;
      const start = $from.start(depth);
      const map = TableMap.get(table);
      const rect =
        selection instanceof CellSelection
          ? map.rectBetween(
              selection.$anchorCell.pos - start,
              selection.$headCell.pos - start,
            )
          : map.findCell($from.before(depth + 2) - start);
      table.forEach((row, offset, index) => {
        if (index >= rect.top && index < rect.bottom)
          tr.setNodeMarkup(start + offset, undefined, { ...row.attrs, height });
      });
      editor.view.dispatch(closeHistory(tr));
      onError('');
      return;
    }
  }
  function imageAttributes() {
    const size = width === '' ? null : Number(width);
    if (
      !isTextEditorImage(src) ||
      (!decorative && !alt.trim()) ||
      (size !== null && (!Number.isInteger(size) || size < 1 || size > 4096))
    ) {
      onError(
        '이미지 주소와 설명을 입력해 주세요. 너비는 1~4,096 또는 빈 값으로 입력해 주세요.',
      );
      return null;
    }
    return { src, alt: decorative ? '' : alt, width: size, height: null };
  }
  async function readFile(
    file: File | undefined,
    kind: 'image' | 'markdown' | 'json',
  ) {
    if (!file || disabled) return;
    const limit = kind === 'image' ? imageFileLimit : 4_000_000;
    if (file.size > limit) {
      onError(
        kind === 'image'
          ? '이미지는 512KB 이하 파일을 선택해 주세요.'
          : '문서는 4MB 이하 파일을 선택해 주세요.',
      );
      return;
    }
    setReading(true);
    try {
      if (kind === 'image') {
        if (
          !['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(
            file.type,
          )
        )
          throw new Error('Unsupported image');
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        if (!isTextEditorImage(data))
          throw new Error('Invalid image signature');
        // Decode the file too: a matching header alone does not prove it is an image.
        await new Promise<void>((resolve, reject) => {
          const image = new window.Image();
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = data;
        });
        if (editor.isDestroyed) return;
        setSrc(data);
      } else {
        const text = await file.text();
        const document =
          kind === 'json'
            ? parseTextEditorDocument(text)
            : parseTextEditorMarkdown(text);
        if (editor.isDestroyed) return;
        if (kind === 'markdown') setMarkdown(text);
        setPending(document);
      }
      onError('');
    } catch {
      onError(
        kind === 'image'
          ? '이미지 파일을 읽지 못했어요. PNG·JPEG·GIF·WebP 파일을 다시 선택해 주세요.'
          : '문서를 읽지 못했어요. 파일 형식과 크기를 점검한 뒤 다시 선택해 주세요.',
      );
    } finally {
      setReading(false);
    }
  }
  function blockAction(
    index: number,
    action:
      'up' | 'down' | 'duplicate' | 'delete' | 'before' | 'after' | number,
  ) {
    if (disabled || !editor.isEditable) return;
    const nodes = [...editor.state.doc.content.content];
    if (!nodes[index]) return;
    let target = index;
    if (action === 'delete') nodes.splice(index, 1);
    else if (action === 'duplicate') {
      nodes.splice(index + 1, 0, nodes[index]!);
      target++;
    } else if (action === 'before' || action === 'after') {
      target += action === 'after' ? 1 : 0;
      nodes.splice(target, 0, editor.schema.nodes.paragraph!.create());
    } else {
      target =
        typeof action === 'number'
          ? action
          : index + (action === 'up' ? -1 : 1);
      if (target < 0 || target >= nodes.length) return;
      nodes.splice(target, 0, nodes.splice(index, 1)[0]!);
    }
    if (!nodes.length) nodes.push(editor.schema.nodes.paragraph!.create());
    const tr = closeHistory(editor.state.tr).replaceWith(
      0,
      editor.state.doc.content.size,
      Fragment.fromArray(nodes),
    );
    const position = nodes
      .slice(0, Math.min(target, nodes.length - 1))
      .reduce((sum, node) => sum + node.nodeSize, 0);
    tr.setSelection(Selection.near(tr.doc.resolve(position)));
    editor.view.dispatch(tr.scrollIntoView());
    editor.view.focus();
  }
  function closePanel(event: MouseEvent<HTMLButtonElement>) {
    const detail = event.currentTarget.closest('details')!;
    detail.open = false;
    detail.querySelector('summary')?.focus();
  }
  return (
    <>
      {!readOnly && (
        <>
          <details className="mega-text-editor__panel" name={panelGroup}>
            <summary>서식</summary>
            <div className="mega-text-editor__panel-body">
              <header>
                <strong>추가 서식</strong>
                <Button variant="ghost" size="sm" onClick={closePanel}>
                  닫기
                </Button>
              </header>
              <Button
                variant="secondary"
                disabled={disabled}
                onClick={() =>
                  editor.chain().focus().unsetAllMarks().clearNodes().run()
                }
              >
                서식 지우기
              </Button>
              <Button
                variant="secondary"
                disabled={disabled}
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              >
                구분선 추가
              </Button>
            </div>
          </details>
          <details className="mega-text-editor__panel" name={panelGroup}>
            <summary aria-label="표 편집">표</summary>
            <div className="mega-text-editor__panel-body">
              <header>
                <strong>표 편집</strong>
                <Button variant="ghost" size="sm" onClick={closePanel}>
                  닫기
                </Button>
              </header>
              <div className="mega-text-editor__tools">
                <label htmlFor={`${id}-rows`}>행 수</label>
                <Input
                  id={`${id}-rows`}
                  type="number"
                  min={1}
                  max={100}
                  value={rows}
                  disabled={disabled}
                  onChange={(e) => setRows(e.target.value)}
                />
                <label htmlFor={`${id}-cols`}>열 수</label>
                <Input
                  id={`${id}-cols`}
                  type="number"
                  min={1}
                  max={100}
                  value={cols}
                  disabled={disabled}
                  onChange={(e) => setCols(e.target.value)}
                />
                <Button
                  variant="secondary"
                  disabled={disabled || editor.isActive('table')}
                  onClick={() => {
                    if (
                      ![Number(rows), Number(cols)].every(
                        (n) => Number.isInteger(n) && n >= 1 && n <= 100,
                      )
                    ) {
                      onError('행과 열 수는 1~100으로 입력해 주세요.');
                      return;
                    }
                    editor
                      .chain()
                      .focus()
                      .insertTable({
                        rows: Number(rows),
                        cols: Number(cols),
                        withHeaderRow: true,
                      })
                      .run();
                    onError('');
                  }}
                >
                  표 추가
                </Button>
              </div>
              <div
                role="group"
                aria-label="표 작업"
                className="mega-text-editor__tools"
              >
                <Button
                  variant="secondary"
                  disabled={disabled || !editor.isActive('table')}
                  onClick={selectTable}
                >
                  표 전체 선택
                </Button>
                {tableActions.map(([name, command]) => (
                  <Button
                    key={name}
                    variant="secondary"
                    disabled={disabled || !command(editor.can().chain()).run()}
                    onClick={() => command(editor.chain().focus()).run()}
                  >
                    {name}
                  </Button>
                ))}
              </div>
              <div className="mega-text-editor__tools">
                <label htmlFor={`${id}-cell-width`}>선택 셀 너비</label>
                <Input
                  id={`${id}-cell-width`}
                  type="number"
                  min={25}
                  max={4096}
                  value={cellWidth}
                  disabled={disabled}
                  onChange={(e) => setCellWidth(e.target.value)}
                />
                <Button
                  variant="secondary"
                  disabled={disabled || !editor.isActive('table')}
                  onClick={() => {
                    const value = Number(cellWidth);
                    if (
                      !Number.isInteger(value) ||
                      value < 25 ||
                      value > 4096
                    ) {
                      onError('셀 너비는 25~4,096으로 입력해 주세요.');
                      return;
                    }
                    const attrs = editor.isActive('tableHeader')
                      ? editor.getAttributes('tableHeader')
                      : editor.getAttributes('tableCell');
                    editor
                      .chain()
                      .focus()
                      .setCellAttribute(
                        'colwidth',
                        Array(Number(attrs.colspan) || 1).fill(value),
                      )
                      .run();
                    onError('');
                  }}
                >
                  셀 너비 적용
                </Button>
              </div>
              <div className="mega-text-editor__tools">
                <label htmlFor={`${id}-row-height`}>선택 행 높이 (px)</label>
                <Input
                  id={`${id}-row-height`}
                  type="number"
                  min={24}
                  max={4096}
                  value={rowHeight}
                  disabled={disabled || !editor.isActive('table')}
                  aria-describedby={`${id}-row-height-hint`}
                  onChange={(event) => setRowHeight(event.target.value)}
                />
                <Button
                  variant="secondary"
                  disabled={disabled || !editor.isActive('table')}
                  onClick={applyRowHeight}
                >
                  행 높이 적용
                </Button>
              </div>
              <p id={`${id}-row-height-hint`}>
                빈 값은 자동 높이예요. 내용이 많으면 지정한 높이보다 늘어나요.
              </p>
              <p>
                셀을 드래그해 선택한 뒤 병합할 수 있어요. 열 경계를 드래그하거나
                너비를 입력해 크기를 바꿔요. 행 아래쪽 경계를 드래그하거나
                높이를 입력할 수도 있어요.
              </p>
            </div>
          </details>
          <details className="mega-text-editor__panel" name={panelGroup}>
            <summary
              aria-label="이미지 편집"
              onClick={() => {
                if (editor.isActive('image')) {
                  const attrs = editor.getAttributes('image');
                  setSrc(attrs.src);
                  setAlt(attrs.alt ?? '');
                  setDecorative(!attrs.alt);
                  setWidth(attrs.width ? String(attrs.width) : '');
                }
              }}
            >
              이미지
            </summary>
            <div className="mega-text-editor__panel-body">
              <header>
                <strong>이미지 편집</strong>
                <Button variant="ghost" size="sm" onClick={closePanel}>
                  닫기
                </Button>
              </header>
              <div className="mega-text-editor__tools">
                <label htmlFor={`${id}-image-file`}>이미지 파일</label>
                <input
                  id={`${id}-image-file`}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  disabled={disabled}
                  onChange={(e) => {
                    void readFile(e.target.files?.[0], 'image');
                    e.target.value = '';
                  }}
                />
              </div>
              <p>
                파일은 512KB 이하 PNG·JPEG·GIF·WebP를 문서에 포함해요. URL
                이미지는 원본 주소에서 불러와요.
              </p>
              <div className="mega-text-editor__tools">
                <label htmlFor={`${id}-src`}>이미지 주소</label>
                <Input
                  id={`${id}-src`}
                  value={src}
                  disabled={disabled}
                  onChange={(e) => setSrc(e.target.value)}
                />
                <label htmlFor={`${id}-alt`}>이미지 설명</label>
                <Input
                  id={`${id}-alt`}
                  value={alt}
                  disabled={disabled || decorative}
                  onChange={(e) => setAlt(e.target.value)}
                />
                <Checkbox
                  checked={decorative}
                  disabled={disabled}
                  onChange={(e) => setDecorative(e.target.checked)}
                >
                  장식용 이미지
                </Checkbox>
                <label htmlFor={`${id}-width`}>이미지 너비</label>
                <Input
                  id={`${id}-width`}
                  type="number"
                  min={1}
                  max={4096}
                  value={width}
                  disabled={disabled}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </div>
              <div className="mega-text-editor__tools">
                <Button
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => {
                    const attrs = imageAttributes();
                    if (attrs) {
                      editor
                        .chain()
                        .focus()
                        .setImage({
                          ...attrs,
                          width: attrs.width ?? undefined,
                          height: undefined,
                        })
                        .run();
                      onError('');
                    }
                  }}
                >
                  이미지 추가
                </Button>
                <Button
                  variant="secondary"
                  disabled={disabled || !editor.isActive('image')}
                  onClick={() => {
                    const attrs = editor.getAttributes('image');
                    setSrc(attrs.src);
                    setAlt(attrs.alt ?? '');
                    setDecorative(!attrs.alt);
                    setWidth(attrs.width ? String(attrs.width) : '');
                  }}
                >
                  선택 이미지 정보 불러오기
                </Button>
                <Button
                  variant="secondary"
                  disabled={disabled || !editor.isActive('image')}
                  onClick={() => {
                    const attrs = imageAttributes();
                    if (attrs) {
                      editor
                        .chain()
                        .focus()
                        .updateAttributes('image', attrs)
                        .run();
                      onError('');
                    }
                  }}
                >
                  선택 이미지 수정
                </Button>
                <Button
                  variant="secondary"
                  disabled={disabled || !editor.isActive('image')}
                  onClick={() => editor.chain().focus().deleteSelection().run()}
                >
                  선택 이미지 삭제
                </Button>
              </div>
            </div>
          </details>
          <details
            className="mega-text-editor__panel"
            name={panelGroup}
            onToggle={(e) => setOutline(e.currentTarget.open)}
          >
            <summary aria-label="블록 순서 편집">블록</summary>
            <div className="mega-text-editor__panel-body">
              <header>
                <strong>블록 순서 편집</strong>
                <Button variant="ghost" size="sm" onClick={closePanel}>
                  닫기
                </Button>
              </header>
              <p>
                블록을 끌어서 순서를 바꿔요. 키보드로는 위로·아래로 버튼을
                사용해요. 목록과 표는 하나의 블록으로 이동해요. 삭제한 블록은
                실행 취소로 되돌릴 수 있어요.
              </p>
              {outline && (
                <ol className="mega-text-editor__blocks">
                  {editor.state.doc.content.content.map((node, index) => (
                    <li
                      key={index}
                      draggable={!disabled}
                      onDragStart={(e) => {
                        if (disabled) {
                          e.preventDefault();
                          return;
                        }
                        dragging.current = {
                          index,
                          document: editor.state.doc,
                        };
                        e.dataTransfer.setData('text/plain', String(index));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        dragging.current = null;
                      }}
                      onDragOver={(e) => {
                        if (!disabled && dragging.current) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const source = dragging.current;
                        dragging.current = null;
                        if (source?.document === editor.state.doc)
                          blockAction(source.index, index);
                      }}
                    >
                      <span>
                        {index + 1}.{' '}
                        {node.textContent.slice(0, 60) ||
                          (node.type.name === 'image'
                            ? node.attrs.alt || '이미지'
                            : '빈 블록')}
                      </span>
                      <div
                        role="group"
                        aria-label={`${index + 1}번 블록 작업`}
                        className="mega-text-editor__tools"
                      >
                        <Button
                          variant="secondary"
                          disabled={disabled || index === 0}
                          onClick={() => blockAction(index, 'up')}
                        >
                          위로
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={
                            disabled ||
                            index === editor.state.doc.childCount - 1
                          }
                          onClick={() => blockAction(index, 'down')}
                        >
                          아래로
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={disabled}
                          onClick={() => blockAction(index, 'before')}
                        >
                          앞에 문단 추가
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={disabled}
                          onClick={() => blockAction(index, 'after')}
                        >
                          뒤에 문단 추가
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={disabled}
                          onClick={() => blockAction(index, 'duplicate')}
                        >
                          복제
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={disabled}
                          onClick={() => blockAction(index, 'delete')}
                        >
                          삭제
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </details>
        </>
      )}
      <details className="mega-text-editor__panel" name={panelGroup}>
        <summary aria-label="문서 가져오기·내보내기">파일</summary>
        <div className="mega-text-editor__panel-body">
          <header>
            <strong>문서 가져오기·내보내기</strong>
            <Button variant="ghost" size="sm" onClick={closePanel}>
              닫기
            </Button>
          </header>
          {!readOnly && (
            <>
              <label htmlFor={`${id}-markdown`}>Markdown 원문</label>
              <Textarea
                id={`${id}-markdown`}
                value={markdown}
                disabled={disabled}
                rows={6}
                onChange={(e) => setMarkdown(e.target.value)}
              />
              <div className="mega-text-editor__tools">
                <Button
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => {
                    try {
                      setPending(parseTextEditorMarkdown(markdown));
                      onError('');
                    } catch {
                      onError(
                        'Markdown을 읽지 못했어요. 주소·표 구조·문서 크기를 점검해 주세요.',
                      );
                    }
                  }}
                >
                  Markdown 적용 검토
                </Button>
                <label htmlFor={`${id}-md-file`}>Markdown 파일</label>
                <input
                  id={`${id}-md-file`}
                  type="file"
                  accept=".md,.markdown,text/markdown,text/plain"
                  disabled={disabled}
                  onChange={(e) => {
                    void readFile(e.target.files?.[0], 'markdown');
                    e.target.value = '';
                  }}
                />
                <label htmlFor={`${id}-json-file`}>문서 JSON 파일</label>
                <input
                  id={`${id}-json-file`}
                  type="file"
                  accept=".json,application/json"
                  disabled={disabled}
                  onChange={(e) => {
                    void readFile(e.target.files?.[0], 'json');
                    e.target.value = '';
                  }}
                />
              </div>
            </>
          )}
          <div className="mega-text-editor__tools">
            <Button
              variant="secondary"
              disabled={locked || reading}
              onClick={() => {
                try {
                  setExported(exportTextEditorMarkdown(editor.getJSON()));
                  onError('');
                } catch {
                  onError(
                    'Markdown을 만들지 못했어요. 문서 크기와 서식을 점검해 주세요.',
                  );
                }
              }}
            >
              Markdown 내보내기 검토
            </Button>
            <Button
              variant="secondary"
              disabled={locked || reading}
              onClick={() => {
                try {
                  download(
                    serializeTextEditorDocument(editor.getJSON()),
                    'document.json',
                    'application/json',
                  );
                  onError('');
                } catch {
                  onError(
                    '문서 파일을 만들지 못했어요. 문서 크기와 서식을 점검해 주세요.',
                  );
                }
              }}
            >
              문서 JSON 내려받기
            </Button>
          </div>
        </div>
      </details>
      {reading && <p role="status">파일을 읽고 있어요.</p>}
      <Dialog
        open={!!pending && !readOnly}
        onClose={() => setPending(null)}
        title="가져온 문서로 바꿀까요?"
        description="현재 편집 내용을 가져온 문서로 바꿔요. 저장 전에는 실행 취소로 되돌릴 수 있어요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              계속 편집
            </Button>
            <Button
              disabled={disabled}
              onClick={() => {
                if (pending && editor.isEditable) {
                  const node = editor.schema.nodeFromJSON(pending);
                  editor.view.dispatch(
                    closeHistory(editor.state.tr).replaceWith(
                      0,
                      editor.state.doc.content.size,
                      node.content,
                    ),
                  );
                  editor.view.focus();
                  setPending(null);
                }
              }}
            >
              문서 바꾸기
            </Button>
          </>
        }
      >
        <p>
          지원하는 문단·서식·목록·링크·표·이미지를 가져와요. 지원하지 않는 HTML
          서식은 달라질 수 있어요.
        </p>
      </Dialog>
      <Dialog
        open={!!exported}
        onClose={() => setExported(null)}
        title="Markdown 내보내기"
        description="변환된 문서를 내려받아요. 편집 중인 원본은 바꾸지 않아요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setExported(null)}>
              닫기
            </Button>
            <Button
              disabled={!exported}
              onClick={() => {
                if (exported)
                  download(
                    exported.markdown,
                    'document.md',
                    'text/markdown;charset=utf-8',
                  );
              }}
            >
              Markdown 내려받기
            </Button>
          </>
        }
      >
        {exported?.warnings.map((warning) => (
          <Alert key={warning} tone="warning">
            {warning}
          </Alert>
        ))}
        {!!exported?.warnings.length && (
          <p>
            서식과 크기를 그대로 보관하려면 문서 JSON 내려받기를 사용해 주세요.
          </p>
        )}
        <Textarea
          aria-label="내보낼 Markdown"
          readOnly
          rows={8}
          value={exported?.markdown ?? ''}
        />
      </Dialog>
    </>
  );
}
