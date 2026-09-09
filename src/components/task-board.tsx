import {
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Portal } from './foundations';
import { Button, Checkbox, Input, Select } from './controls';
import { Alert } from './surfaces';
import { Dialog } from './overlay';
import {
  validateTaskBoard,
  updateTaskBoard,
  parseTaskBoard,
  serializeTaskBoard,
  type TaskBoardData,
  type TaskBoardAction,
  type TaskBoardCard,
  type TaskBoardColumn,
} from './task-board-model';

export interface TaskBoardProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'onChange'
> {
  value: TaskBoardData;
  onChange?: (
    value: TaskBoardData,
    action: TaskBoardAction | { type: 'replace' },
  ) => void;
  onSave?: (value: TaskBoardData) => Promise<void>;
  label?: string;
  editable?: boolean;
  allowReorder?: boolean;
  showTools?: boolean;
  renderCard?: (card: TaskBoardCard) => ReactNode;
  renderColumnTitle?: (column: TaskBoardColumn) => ReactNode;
}
type Editor = {
  kind: 'card' | 'column' | 'lane';
  id?: string;
  columnId?: string;
  laneId?: string;
};
type Drag = {
  kind: 'card' | 'column';
  id: string;
  pointer: number;
  x: number;
  y: number;
  active: boolean;
  target?: {
    columnId: string;
    laneId?: string;
    beforeId?: string;
    index: number;
  };
};
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '보드 데이터 형식을 확인해 주세요.';
export function TaskBoard({
  value,
  onChange,
  onSave,
  label = '작업 보드',
  editable = true,
  allowReorder = true,
  showTools = true,
  renderCard,
  renderColumnTitle,
  className = '',
  ref,
  ...props
}: TaskBoardProps) {
  const root = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current!, []);
  const id = useId();
  const valid = useMemo(() => {
    try {
      return { data: validateTaskBoard(value), error: '' };
    } catch {
      return { data: null, error: '보드 데이터 형식을 확인해 주세요.' };
    }
  }, [value]);
  const data = valid.data;
  const serialized = data ? JSON.stringify(data) : '';
  const [saved, setSaved] = useState(serialized);
  const [savedOnce, setSavedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [assignee, setAssignee] = useState('');
  const [due, setDue] = useState('');
  const [grouped, setGrouped] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [formError, setFormError] = useState('');
  const [removing, setRemoving] = useState<Editor | null>(null);
  const [imported, setImported] = useState<TaskBoardData | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [history, setHistory] = useState<{ undo: string[]; redo: string[] }>({
    undo: [],
    redo: [],
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<Drag['target']>();
  const drag = useRef<Drag | null>(null);
  const currentStart = useRef({ x: 0, y: 0 });
  const animation = useRef(0);
  const preview = useRef<HTMLDivElement>(null);
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      cancelAnimationFrame(animation.current);
      drag.current = null;
    };
  }, []);
  const writable = !!onChange;
  const canEdit = writable && editable;
  const dirty = serialized !== saved;
  const focusHandle = (kind: 'card' | 'column', key: string) =>
    requestAnimationFrame(() => {
      // A new gesture may start before the previous move's focus callback runs.
      if (drag.current) return;
      const nodes = root.current?.querySelectorAll<HTMLElement>(
        `[data-${kind}-handle]`,
      );
      const node = Array.from(nodes ?? []).find(
        (item) => item.getAttribute(`data-${kind}-handle`) === key,
      );
      node?.focus();
      node?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  const replace = (
    next: TaskBoardData,
    action: TaskBoardAction | { type: 'replace' },
    announcement: string,
    remember = true,
  ) => {
    if (!onChange) return false;
    try {
      onChange(next, action);
    } catch {
      setError('보드를 변경하지 못했어요. 다시 시도해 주세요.');
      setFormError('보드를 변경하지 못했어요. 다시 시도해 주세요.');
      return false;
    }
    if (remember)
      setHistory((old) => ({
        undo: [...old.undo, serialized].slice(-50),
        redo: [],
      }));
    setError('');
    setMessage(announcement);
    return true;
  };
  const change = (action: TaskBoardAction, announcement: string) => {
    let next: TaskBoardData;
    try {
      next = updateTaskBoard(latest.current, action);
    } catch (failure) {
      setError(errorText(failure));
      setMessage('보드를 변경하지 않았어요.');
      return false;
    }
    if (JSON.stringify(next) === serialized) {
      setError('');
      setMessage('변경 사항이 없어요.');
      return true;
    }
    return replace(next, action, announcement);
  };
  const travel = (direction: 'undo' | 'redo') => {
    const source = history[direction];
    const previous = source.at(-1);
    if (!previous || !data) return;
    if (
      replace(
        parseTaskBoard(previous),
        { type: 'replace' },
        direction === 'undo'
          ? '이전 변경을 되돌렸어요.'
          : '변경을 다시 적용했어요.',
        false,
      )
    )
      setHistory((old) =>
        direction === 'undo'
          ? { undo: old.undo.slice(0, -1), redo: [...old.redo, serialized] }
          : { undo: [...old.undo, serialized], redo: old.redo.slice(0, -1) },
      );
  };
  const finishDrag = (cancel: boolean) => {
    cancelAnimationFrame(animation.current);
    const current = drag.current;
    drag.current = null;
    setDragging(null);
    setTarget(undefined);
    if (!current?.active || cancel || !current.target) {
      if (current?.active) {
        setMessage('이동을 취소했어요.');
        focusHandle(current.kind, current.id);
      }
      return;
    }
    if (current.kind === 'column')
      change(
        { type: 'move-column', id: current.id, index: current.target.index },
        '열 순서를 변경했어요.',
      );
    else
      change(
        {
          type: 'move-card',
          id: current.id,
          columnId: current.target.columnId,
          laneId: current.target.laneId,
          beforeId: current.target.beforeId,
        },
        '카드를 이동했어요.',
      );
    focusHandle(current.kind, current.id);
  };
  useEffect(() => {
    if (!dragging) return;
    const cancel = () => finishDrag(true);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }
    };
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', keydown, true);
    return () => {
      window.removeEventListener('blur', cancel);
      window.removeEventListener('keydown', keydown, true);
    };
  }, [dragging]);
  const hit = () => {
    const current = drag.current;
    if (!current?.active || !scroll.current) return;
    const surface = scroll.current;
    const rect = surface.getBoundingClientRect();
    if (preview.current)
      preview.current.style.transform = `translate(${Math.min(current.x + 16, innerWidth - 240)}px, ${Math.min(current.y + 16, innerHeight - 100)}px)`;
    let ancestorScrolled = false;
    // Scroll a clipping ancestor before the board so offscreen lanes remain reachable.
    if (
      current.x >= Math.max(0, rect.left) &&
      current.x <= Math.min(innerWidth, rect.right)
    ) {
      for (
        let parent = surface.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        const isPage = parent === document.scrollingElement;
        if (
          !isPage &&
          !/(auto|scroll)/.test(getComputedStyle(parent).overflowY)
        )
          continue;
        const bounds = isPage
          ? { top: 0, bottom: innerHeight }
          : parent.getBoundingClientRect();
        const bottom = Math.min(innerHeight, bounds.bottom);
        const top = Math.max(0, bounds.top);
        const dy =
          current.y > bottom - 40 && rect.bottom > bottom
            ? 14
            : current.y < top + 40 && rect.top < top
              ? -14
              : 0;
        if (dy) {
          const previous = parent.scrollTop;
          if (isPage) window.scrollBy(0, dy);
          else parent.scrollBy(0, dy);
          if (previous !== parent.scrollTop) {
            ancestorScrolled = true;
            break;
          }
        }
      }
    }
    const dx =
      current.x < Math.max(0, rect.left) + 40
        ? -14
        : current.x > Math.min(innerWidth, rect.right) - 40
          ? 14
          : 0;
    const dy =
      current.y < Math.max(0, rect.top) + 50
        ? -14
        : current.y > Math.min(innerHeight, rect.bottom) - 50
          ? 14
          : 0;
    if (
      current.x >= rect.left - 40 &&
      current.x <= rect.right + 40 &&
      current.y >= Math.max(0, rect.top) - 40 &&
      current.y <= Math.min(innerHeight, rect.bottom) + 40
    )
      surface.scrollBy(dx, ancestorScrolled ? 0 : dy);
    const element = document
      .elementFromPoint(current.x, current.y)
      ?.closest<HTMLElement>('[data-board-slot]');
    if (element && root.current?.contains(element)) {
      const columnId = element.dataset.columnId!;
      const beforeId = Array.from(
        element.querySelectorAll<HTMLElement>('[data-board-card]'),
      ).find(
        (card) =>
          card.dataset.boardCard !== current.id &&
          current.y <
            card.getBoundingClientRect().top +
              card.getBoundingClientRect().height / 2,
      )?.dataset.boardCard;
      current.target = {
        columnId,
        laneId: showLanes
          ? element.dataset.laneId || undefined
          : data?.cards.find((card) => card.id === current.id)?.laneId,
        beforeId,
        index: Number(element.dataset.columnIndex),
      };
      setTarget((old) =>
        JSON.stringify(old) === JSON.stringify(current.target)
          ? old
          : current.target,
      );
    } else {
      current.target = undefined;
      setTarget(undefined);
    }
    animation.current = requestAnimationFrame(hit);
  };
  const moveCard = (
    card: TaskBoardCard,
    direction: 'up' | 'down' | 'left' | 'right',
  ) => {
    if (!data) return;
    const columnIndex = data.columns.findIndex(
      (column) => column.id === card.columnId,
    );
    const siblings = filtered.filter(
      (item) =>
        item.columnId === card.columnId &&
        (!showLanes || item.laneId === card.laneId),
    );
    const index = siblings.findIndex((item) => item.id === card.id);
    if (direction === 'left' || direction === 'right') {
      const column =
        data.columns[columnIndex + (direction === 'left' ? -1 : 1)];
      if (!column) {
        setMessage(
          direction === 'left'
            ? '이미 첫 번째 열이에요.'
            : '이미 마지막 열이에요.',
        );
        return;
      }
      change(
        {
          type: 'move-card',
          id: card.id,
          columnId: column.id,
          laneId: card.laneId,
        },
        `${card.title} 카드를 ${column.title} 열로 이동했어요.`,
      );
    } else if (
      allowReorder &&
      (direction !== 'up' || index > 0) &&
      (direction !== 'down' || index < siblings.length - 1)
    ) {
      change(
        {
          type: 'move-card',
          id: card.id,
          columnId: card.columnId,
          laneId: card.laneId,
          beforeId:
            direction === 'up'
              ? siblings[index - 1]?.id
              : siblings[index + 2]?.id,
        },
        `${card.title} 카드 순서를 변경했어요.`,
      );
    } else if (allowReorder) {
      setMessage(
        direction === 'up' ? '이미 첫 번째 카드예요.' : '이미 마지막 카드예요.',
      );
    }
    focusHandle('card', card.id);
  };
  const startEditor = (next: Editor) => {
    setFormError('');
    setEditor(next);
  };
  const currentCard = data?.cards.find((card) => card.id === editor?.id);
  const currentColumn = data?.columns.find(
    (column) => column.id === editor?.id,
  );
  const currentLane = data?.lanes.find((lane) => lane.id === editor?.id);
  const formTitle =
    editor?.kind === 'card'
      ? '카드'
      : editor?.kind === 'column'
        ? '열'
        : '구획';
  const filtered =
    data?.cards.filter(
      (card) =>
        (!search ||
          `${card.title} ${card.description ?? ''}`
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase())) &&
        (!assignee ||
          (assignee === 'unassigned'
            ? !card.assigneeId
            : card.assigneeId === assignee.slice(7))) &&
        (!due || (!!card.dueDate && card.dueDate <= due)),
    ) ?? [];
  const lanes =
    data && grouped && data.lanes.length
      ? [{ id: '', title: '미분류' }, ...data.lanes]
      : [{ id: '', title: '' }];
  const showLanes = !!data?.lanes.length && grouped;
  const targetColumn = data?.columns.find(
    (column) => column.id === target?.columnId,
  );
  const blocked =
    drag.current?.kind === 'card' &&
    targetColumn?.wipLimit !== undefined &&
    data!.cards.find((card) => card.id === dragging)?.columnId !==
      targetColumn.id &&
    data!.cards.filter((card) => card.columnId === targetColumn.id).length >=
      targetColumn.wipLimit;
  const dragTitle =
    drag.current?.kind === 'column'
      ? data?.columns.find((column) => column.id === dragging)?.title
      : data?.cards.find((card) => card.id === dragging)?.title;
  return (
    <div
      {...props}
      ref={root}
      className={`mega-task-board ${className}`}
      role="region"
      aria-label={label}
      aria-busy={saving}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented || event.nativeEvent.isComposing) return;
        if (event.key === 'Escape' && drag.current) {
          event.preventDefault();
          finishDrag(true);
        }
        if (
          canEdit &&
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'z' &&
          !(
            event.target instanceof HTMLElement &&
            event.target.closest('input,textarea,select,[contenteditable=true]')
          )
        ) {
          event.preventDefault();
          travel(event.shiftKey ? 'redo' : 'undo');
        }
      }}
      onPointerMove={(event) => {
        props.onPointerMove?.(event);
        const current = drag.current;
        if (!current || current.pointer !== event.pointerId) return;
        current.x = event.clientX;
        current.y = event.clientY;
        if (
          !current.active &&
          Math.hypot(
            current.x - currentStart.current.x,
            current.y - currentStart.current.y,
          ) > 5
        ) {
          current.active = true;
          window.getSelection()?.removeAllRanges();
          // A pointer drag should not leave an unrelated text field editing behind it.
          if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur();
          setDragging(current.id);
          setMessage('이동할 위치로 끌어 주세요. Escape로 취소할 수 있어요.');
          hit();
        }
        if (current.active) event.preventDefault();
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event);
        if (drag.current?.active) {
          cancelAnimationFrame(animation.current);
          hit();
        }
        if (drag.current?.pointer === event.pointerId) finishDrag(false);
      }}
      onPointerCancel={(event) => {
        props.onPointerCancel?.(event);
        if (drag.current?.pointer === event.pointerId) finishDrag(true);
      }}
      onLostPointerCapture={(event) => {
        props.onLostPointerCapture?.(event);
        if (drag.current?.pointer === event.pointerId) finishDrag(true);
      }}
    >
      {dragging && (
        <Portal>
          <div
            ref={preview}
            className="mega-task-board__drag-preview"
            aria-hidden="true"
            data-blocked={blocked || undefined}
            style={{
              transform: `translate(${Math.min(drag.current!.x + 16, innerWidth - 240)}px, ${Math.min(drag.current!.y + 16, innerHeight - 100)}px)`,
            }}
          >
            <strong>{dragTitle}</strong>
            <span>
              {blocked
                ? '열의 카드 제한에 도달했어요.'
                : targetColumn
                  ? `${targetColumn.title}${showLanes && drag.current?.kind === 'card' ? ` · ${target?.laneId ? data?.lanes.find((lane) => lane.id === target.laneId)?.title : '미분류'}` : ''}에 놓기`
                  : '이동할 위치로 끌어 주세요.'}
            </span>
          </div>
        </Portal>
      )}
      {valid.error ? (
        <Alert role="alert" tone="danger">
          {valid.error}
        </Alert>
      ) : (
        data && (
          <>
            {showTools && (
              <div className="mega-task-board__toolbar">
                <div>
                  <h2>{label}</h2>
                  <p>
                    {data.cards.length}개 카드 · {data.columns.length}개 열
                  </p>
                </div>
                <div className="mega-task-board__actions">
                  {canEdit && (
                    <>
                      <Button
                        onClick={() =>
                          startEditor({
                            kind: 'card',
                            columnId: data.columns[0]?.id,
                          })
                        }
                        disabled={!data.columns.length}
                      >
                        카드 추가
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => startEditor({ kind: 'column' })}
                      >
                        열 추가
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => startEditor({ kind: 'lane' })}
                      >
                        구획 추가
                      </Button>
                    </>
                  )}
                  {canEdit && (
                    <>
                      <Button
                        variant="secondary"
                        disabled={!history.undo.length || saving}
                        onClick={() => travel('undo')}
                      >
                        실행 취소
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={!history.redo.length || saving}
                        onClick={() => travel('redo')}
                      >
                        다시 실행
                      </Button>
                    </>
                  )}
                  {onSave && (
                    <>
                      <Button
                        disabled={(!dirty && savedOnce) || saving}
                        onClick={async () => {
                          if (busy.current) return;
                          busy.current = true;
                          setSaving(true);
                          setError('');
                          try {
                            const snapshot = validateTaskBoard(latest.current);
                            await onSave(snapshot);
                            if (alive.current) {
                              setSaved(JSON.stringify(snapshot));
                              setSavedOnce(true);
                              setMessage('보드를 저장했어요.');
                            }
                          } catch {
                            if (alive.current)
                              setError(
                                '보드를 저장하지 못했어요. 변경 내용은 화면에 남아 있어요. 다시 저장해 주세요.',
                              );
                          } finally {
                            busy.current = false;
                            if (alive.current) setSaving(false);
                          }
                        }}
                      >
                        {saving ? '저장 중' : '보드 저장'}
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={!dirty || saving || !saved}
                        onClick={() => setRestoring(true)}
                      >
                        {savedOnce
                          ? '저장한 상태로 되돌리기'
                          : '처음 상태로 되돌리기'}
                      </Button>
                      <span>
                        {dirty
                          ? '저장하지 않은 변경'
                          : savedOnce
                            ? '저장한 상태'
                            : '변경 없음'}
                      </span>
                    </>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      let url: string | undefined;
                      try {
                        url = URL.createObjectURL(
                          new Blob([serializeTaskBoard(data)], {
                            type: 'application/json',
                          }),
                        );
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'task-board.json';
                        document.body.append(link);
                        try {
                          link.click();
                        } finally {
                          link.remove();
                        }
                      } catch {
                        setError(
                          '보드 파일을 만들지 못했어요. 다시 내려받아 주세요.',
                        );
                      } finally {
                        if (url)
                          setTimeout(() => URL.revokeObjectURL(url!), 1000);
                      }
                    }}
                  >
                    보드 파일 내려받기
                  </Button>
                  {canEdit && (
                    <label className="mega-task-board__file">
                      보드 파일 불러오기
                      <input
                        aria-label="보드 파일 불러오기"
                        type="file"
                        accept=".json,application/json"
                        disabled={saving}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (!file) return;
                          try {
                            if (file.size > 8_000_000)
                              throw new Error(
                                '보드 파일은 8MB 이내로 불러와 주세요.',
                              );
                            setImported(parseTaskBoard(await file.text()));
                            setError('');
                          } catch (failure) {
                            setError(
                              '보드 파일을 불러오지 못했어요. 파일 형식과 크기를 확인해 주세요.',
                            );
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
            {showTools && (
              <div className="mega-task-board__filters">
                <label>
                  카드 검색
                  <Input
                    type="search"
                    aria-label="카드 검색"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label>
                  담당자
                  <Select
                    aria-label="담당자 필터"
                    value={assignee}
                    onChange={(event) => setAssignee(event.target.value)}
                  >
                    <option value="">전체 담당자</option>
                    <option value="unassigned">담당자 없음</option>
                    {data.assignees.map((person) => (
                      <option key={person.id} value={`person:${person.id}`}>
                        {person.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label>
                  기한까지
                  <Input
                    type="date"
                    aria-label="기한 필터"
                    value={due}
                    onChange={(event) => setDue(event.target.value)}
                  />
                </label>
                {data.lanes.length > 0 && (
                  <Checkbox
                    shape="square"
                    checked={grouped}
                    onChange={(event) => setGrouped(event.target.checked)}
                  >
                    구획별 보기
                  </Checkbox>
                )}
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setAssignee('');
                    setDue('');
                  }}
                >
                  필터 지우기
                </Button>
                <span role="status">{filtered.length}개 표시</span>
              </div>
            )}
            {error && (
              <Alert role="alert" tone="danger">
                {error}
              </Alert>
            )}
            <p id={`${id}-help`} className="mega-task-board__hint">
              {writable
                ? allowReorder
                  ? '카드를 끌어 옮겨요. 터치는 이동 손잡이를 사용해 주세요. 손잡이의 Alt+방향키나 이동 메뉴로도 옮길 수 있어요.'
                  : '카드의 이동 메뉴나 Alt+좌우 방향키로 열을 바꿔요.'
                : '보드를 읽기 전용으로 보고 있어요.'}
            </p>
            <p
              className="mega-visually-hidden"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
            <div className="mega-task-board__scroll" ref={scroll}>
              {!data.columns.length && (
                <p>
                  {canEdit
                    ? '열이 없어요. 열을 추가해 카드를 분류해 보세요.'
                    : '표시할 열이 없어요.'}
                </p>
              )}
              {lanes.map((lane) => (
                <section
                  key={lane.id}
                  className="mega-task-board__lane"
                  data-empty={
                    (showLanes &&
                      !data.cards.some(
                        (card) => (card.laneId ?? '') === lane.id,
                      )) ||
                    undefined
                  }
                  aria-label={lane.title || '전체 카드'}
                >
                  {showLanes && (
                    <header>
                      <h3>{lane.title}</h3>
                      {canEdit && lane.id && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            startEditor({ kind: 'lane', id: lane.id })
                          }
                        >
                          {lane.title} 구획 편집
                        </Button>
                      )}
                    </header>
                  )}
                  <div className="mega-task-board__columns">
                    {data.columns.map((column, columnIndex) => {
                      const ColumnHeading = showLanes ? 'h4' : 'h3';
                      const cards = filtered.filter(
                        (card) =>
                          card.columnId === column.id &&
                          (!showLanes || (card.laneId ?? '') === lane.id),
                      );
                      const count = data.cards.filter(
                        (card) => card.columnId === column.id,
                      ).length;
                      const full =
                        column.wipLimit !== undefined &&
                        count >= column.wipLimit;
                      return (
                        <section
                          key={column.id}
                          className="mega-task-board__column"
                          data-board-slot=""
                          data-column-id={column.id}
                          data-lane-id={showLanes ? lane.id : undefined}
                          data-column-index={columnIndex}
                          data-drop-target={
                            (target?.columnId === column.id &&
                              (!showLanes ||
                                (target.laneId ?? '') === lane.id)) ||
                            undefined
                          }
                          aria-label={`${lane.title ? lane.title + ' · ' : ''}${column.title}`}
                        >
                          <header
                            onPointerDown={(event) => {
                              if (
                                canEdit &&
                                allowReorder &&
                                event.pointerType !== 'touch' &&
                                !(event.target as HTMLElement).closest(
                                  'button,a,input,select,textarea,summary,[contenteditable]',
                                )
                              )
                                startDrag(event, 'column', column.id);
                            }}
                            data-draggable={
                              (canEdit && allowReorder) || undefined
                            }
                          >
                            {canEdit && allowReorder && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="mega-task-board__handle"
                                aria-label={`${column.title} 열 이동`}
                                data-column-handle={column.id}
                                aria-describedby={`${id}-help`}
                                onPointerDown={(event) =>
                                  startDrag(event, 'column', column.id)
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.altKey &&
                                    ['ArrowLeft', 'ArrowRight'].includes(
                                      event.key,
                                    )
                                  ) {
                                    event.preventDefault();
                                    const index =
                                      columnIndex +
                                      (event.key === 'ArrowLeft' ? -1 : 1);
                                    if (
                                      index >= 0 &&
                                      index < data.columns.length
                                    ) {
                                      change(
                                        {
                                          type: 'move-column',
                                          id: column.id,
                                          index,
                                        },
                                        '열 순서를 변경했어요.',
                                      );
                                      focusHandle('column', column.id);
                                    }
                                  }
                                }}
                              >
                                ↔
                              </Button>
                            )}
                            <ColumnHeading>
                              {renderColumnTitle?.(column) ?? column.title}
                            </ColumnHeading>
                            <span
                              className="mega-task-board__count"
                              data-full={full || undefined}
                              aria-label={`${column.title} 전체 ${count}개${column.wipLimit ? `, 제한 ${column.wipLimit}개` : ''}`}
                            >
                              {count}
                              {column.wipLimit ? ` / ${column.wipLimit}` : ''}
                            </span>
                            {canEdit && (
                              <Button
                                variant="secondary"
                                size="sm"
                                aria-label={`${column.title} 열 편집`}
                                onClick={() =>
                                  startEditor({ kind: 'column', id: column.id })
                                }
                              >
                                편집
                              </Button>
                            )}
                          </header>
                          <ul
                            data-drop-end={
                              (drag.current?.kind === 'card' &&
                                target?.columnId === column.id &&
                                (!showLanes ||
                                  (target.laneId ?? '') === lane.id) &&
                                !target.beforeId) ||
                              undefined
                            }
                          >
                            {cards.map((card) => (
                              <li
                                key={card.id}
                                onDragStart={(event) => {
                                  if (allowReorder && writable)
                                    event.preventDefault();
                                }}
                                data-board-card={card.id}
                                data-draggable={
                                  (writable && allowReorder) || undefined
                                }
                                onPointerDown={(event) => {
                                  if (
                                    event.pointerType !== 'touch' &&
                                    !(event.target as HTMLElement).closest(
                                      'button,a,input,select,textarea,summary,[contenteditable],[role="button"]',
                                    )
                                  )
                                    startDrag(event, 'card', card.id);
                                }}
                                data-dragging={
                                  (drag.current?.kind === 'card' &&
                                    dragging === card.id) ||
                                  undefined
                                }
                                data-drop-before={
                                  target?.beforeId === card.id || undefined
                                }
                              >
                                <div className="mega-task-board__card-content">
                                  {renderCard ? (
                                    renderCard(card)
                                  ) : (
                                    <>
                                      <strong>{card.title}</strong>
                                      {card.description && (
                                        <p>{card.description}</p>
                                      )}
                                      <div className="mega-task-board__meta">
                                        <span>
                                          {data.assignees.find(
                                            (person) =>
                                              person.id === card.assigneeId,
                                          )?.name ?? '담당자 없음'}
                                        </span>
                                        {card.dueDate && (
                                          <time dateTime={card.dueDate}>
                                            {card.dueDate}
                                          </time>
                                        )}
                                        {!showLanes && card.laneId && (
                                          <span>
                                            {
                                              data.lanes.find(
                                                (item) =>
                                                  item.id === card.laneId,
                                              )?.title
                                            }
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                                {writable && (
                                  <div className="mega-task-board__card-actions">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="mega-task-board__handle"
                                      data-card-handle={card.id}
                                      aria-label={`${card.title} 카드 이동`}
                                      aria-describedby={`${id}-help`}
                                      onPointerDown={(event) =>
                                        startDrag(event, 'card', card.id)
                                      }
                                      onKeyDown={(event) => {
                                        if (
                                          event.altKey &&
                                          [
                                            'ArrowUp',
                                            'ArrowDown',
                                            'ArrowLeft',
                                            'ArrowRight',
                                          ].includes(event.key)
                                        ) {
                                          event.preventDefault();
                                          moveCard(
                                            card,
                                            (
                                              {
                                                ArrowUp: 'up',
                                                ArrowDown: 'down',
                                                ArrowLeft: 'left',
                                                ArrowRight: 'right',
                                              } as const
                                            )[event.key as 'ArrowUp'],
                                          );
                                        }
                                      }}
                                    >
                                      이동
                                    </Button>
                                    {canEdit && (
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        aria-label={`${card.title} 카드 편집`}
                                        onClick={() =>
                                          startEditor({
                                            kind: 'card',
                                            id: card.id,
                                          })
                                        }
                                      >
                                        편집
                                      </Button>
                                    )}
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      aria-label={`${card.title} 카드 내용 복사`}
                                      onClick={async (event) => {
                                        const content =
                                          event.currentTarget
                                            .closest('[data-board-card]')
                                            ?.querySelector<HTMLElement>(
                                              '.mega-task-board__card-content',
                                            )?.innerText ?? card.title;
                                        try {
                                          await navigator.clipboard.writeText(
                                            content,
                                          );
                                          if (alive.current) {
                                            setError('');
                                            setMessage(
                                              '카드 내용을 복사했어요.',
                                            );
                                          }
                                        } catch {
                                          if (alive.current)
                                            setError(
                                              '카드 내용을 복사하지 못했어요. 다시 시도해 주세요.',
                                            );
                                        }
                                      }}
                                    >
                                      복사
                                    </Button>
                                    <details>
                                      <summary
                                        aria-label={`${card.title} 이동 메뉴`}
                                      >
                                        이동 메뉴
                                      </summary>
                                      <div className="mega-task-board__move-menu">
                                        {allowReorder && (
                                          <>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={() =>
                                                moveCard(card, 'up')
                                              }
                                              disabled={
                                                cards[0]?.id === card.id
                                              }
                                            >
                                              위로 이동
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={() =>
                                                moveCard(card, 'down')
                                              }
                                              disabled={
                                                cards.at(-1)?.id === card.id
                                              }
                                            >
                                              아래로 이동
                                            </Button>
                                          </>
                                        )}
                                        {columnIndex > 0 && (
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            aria-label={`${card.title} 이전 열로 이동`}
                                            onClick={() =>
                                              moveCard(card, 'left')
                                            }
                                          >
                                            이전 열로 이동
                                          </Button>
                                        )}
                                        {columnIndex <
                                          data.columns.length - 1 && (
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            aria-label={`${card.title} 다음 열로 이동`}
                                            onClick={() =>
                                              moveCard(card, 'right')
                                            }
                                          >
                                            다음 열로 이동
                                          </Button>
                                        )}
                                        {data.columns.map((destination) => (
                                          <Button
                                            key={destination.id}
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                              change(
                                                {
                                                  type: 'move-card',
                                                  id: card.id,
                                                  columnId: destination.id,
                                                  laneId: card.laneId,
                                                },
                                                `${destination.title} 열로 이동했어요.`,
                                              );
                                              focusHandle('card', card.id);
                                            }}
                                          >
                                            {destination.title} 열 끝으로 이동
                                          </Button>
                                        ))}
                                        {showLanes &&
                                          lanes.map((destination) => (
                                            <Button
                                              key={destination.id}
                                              variant="secondary"
                                              size="sm"
                                              onClick={() =>
                                                change(
                                                  {
                                                    type: 'move-card',
                                                    id: card.id,
                                                    columnId: card.columnId,
                                                    laneId:
                                                      destination.id ||
                                                      undefined,
                                                  },
                                                  '카드 구획을 변경했어요.',
                                                )
                                              }
                                            >
                                              {destination.title} 구획으로 이동
                                            </Button>
                                          ))}
                                      </div>
                                    </details>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                          {!cards.length && (
                            <p className="mega-task-board__empty">
                              {search || assignee || due
                                ? '조건에 맞는 카드가 없어요.'
                                : '카드가 없어요.'}
                            </p>
                          )}
                          {canEdit && (
                            <Button
                              variant="secondary"
                              className="mega-task-board__add"
                              disabled={full}
                              onClick={() =>
                                startEditor({
                                  kind: 'card',
                                  columnId: column.id,
                                  laneId: showLanes ? lane.id : undefined,
                                })
                              }
                            >
                              {column.title}에 카드 추가
                            </Button>
                          )}
                        </section>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <Dialog
              open={!!editor}
              onClose={() => setEditor(null)}
              title={`${formTitle} ${editor?.id ? '편집' : '추가'}`}
              sheet
            >
              {editor && (
                <form
                  key={`${editor.kind}:${editor.id ?? editor.columnId ?? 'new'}:${editor.laneId ?? ''}`}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fields = new FormData(event.currentTarget);
                    const title = String(fields.get('title') ?? '').trim();
                    const key = editor.id ?? crypto.randomUUID();
                    let action: TaskBoardAction;
                    if (editor.kind === 'card')
                      action = {
                        type: 'put-card',
                        card: {
                          id: key,
                          title,
                          description: String(fields.get('description') ?? ''),
                          columnId: String(fields.get('columnId')),
                          laneId:
                            String(fields.get('laneId') ?? '') || undefined,
                          assigneeId:
                            String(fields.get('assigneeId') ?? '') || undefined,
                          dueDate:
                            String(fields.get('dueDate') ?? '') || undefined,
                        },
                      };
                    else if (editor.kind === 'column')
                      action = {
                        type: 'put-column',
                        column: {
                          id: key,
                          title,
                          wipLimit: fields.get('wipLimit')
                            ? Number(fields.get('wipLimit'))
                            : undefined,
                        },
                      };
                    else
                      action = { type: 'put-lane', lane: { id: key, title } };
                    try {
                      const next = updateTaskBoard(latest.current, action);
                      if (
                        replace(next, action, `${formTitle} 변경을 적용했어요.`)
                      )
                        setEditor(null);
                    } catch (failure) {
                      setFormError(errorText(failure));
                    }
                  }}
                  className="mega-task-board__form"
                >
                  <label>
                    {formTitle} 이름
                    <Input
                      name="title"
                      aria-label={`${formTitle} 이름`}
                      required
                      maxLength={200}
                      defaultValue={
                        editor.kind === 'card'
                          ? currentCard?.title
                          : editor.kind === 'column'
                            ? currentColumn?.title
                            : currentLane?.title
                      }
                      autoFocus
                    />
                  </label>
                  {editor.kind === 'card' && (
                    <>
                      <label>
                        설명
                        <textarea
                          name="description"
                          aria-label="카드 설명"
                          maxLength={5000}
                          defaultValue={currentCard?.description}
                        />
                      </label>
                      <label>
                        열
                        <Select
                          name="columnId"
                          aria-label="카드 열"
                          defaultValue={
                            currentCard?.columnId ?? editor.columnId
                          }
                        >
                          {data.columns.map((column) => (
                            <option key={column.id} value={column.id}>
                              {column.title}
                            </option>
                          ))}
                        </Select>
                      </label>
                      <label>
                        구획
                        <Select
                          name="laneId"
                          aria-label="카드 구획"
                          defaultValue={
                            currentCard?.laneId ?? editor.laneId ?? ''
                          }
                        >
                          <option value="">미분류</option>
                          {data.lanes.map((lane) => (
                            <option key={lane.id} value={lane.id}>
                              {lane.title}
                            </option>
                          ))}
                        </Select>
                      </label>
                      <label>
                        담당자
                        <Select
                          name="assigneeId"
                          aria-label="카드 담당자"
                          defaultValue={currentCard?.assigneeId ?? ''}
                        >
                          <option value="">담당자 없음</option>
                          {data.assignees.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.name}
                            </option>
                          ))}
                        </Select>
                      </label>
                      <label>
                        기한
                        <Input
                          name="dueDate"
                          type="date"
                          aria-label="카드 기한"
                          min="0001-01-01"
                          max="9999-12-31"
                          defaultValue={currentCard?.dueDate}
                        />
                      </label>
                    </>
                  )}
                  {editor.kind === 'column' && (
                    <label>
                      열의 카드 제한
                      <Input
                        name="wipLimit"
                        type="number"
                        aria-label="열의 카드 제한"
                        min={1}
                        max={1000}
                        step={1}
                        defaultValue={currentColumn?.wipLimit}
                      />
                      <span>
                        비워 두면 제한하지 않아요. 구획과 필터에 관계없이 열
                        전체에 적용해요.
                      </span>
                    </label>
                  )}
                  {formError && (
                    <Alert role="alert" tone="danger">
                      {formError}
                    </Alert>
                  )}
                  <div className="mega-task-board__actions">
                    <Button type="submit">
                      {formTitle} {editor.id ? '변경 적용' : '추가'}
                    </Button>
                    <Button variant="secondary" onClick={() => setEditor(null)}>
                      편집 취소
                    </Button>
                    {editor.id && (
                      <Button
                        variant="danger"
                        onClick={() => {
                          setRemoving(editor);
                          setEditor(null);
                          setFormError('');
                        }}
                      >
                        {formTitle} 삭제
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </Dialog>
            <Dialog
              open={!!removing}
              onClose={() => setRemoving(null)}
              title="항목 삭제"
              description={
                removing?.kind === 'column'
                  ? '카드가 있으면 선택한 열로 이동해요.'
                  : removing?.kind === 'lane'
                    ? '구획의 카드는 미분류로 이동해요.'
                    : '카드를 보드에서 제거해요. 실행 취소로 되돌릴 수 있어요.'
              }
              sheet
            >
              {removing && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const destination =
                      String(
                        new FormData(event.currentTarget).get('destination') ??
                          '',
                      ) || undefined;
                    const action: TaskBoardAction =
                      removing.kind === 'card'
                        ? { type: 'delete-card', id: removing.id! }
                        : removing.kind === 'lane'
                          ? { type: 'delete-lane', id: removing.id! }
                          : {
                              type: 'delete-column',
                              id: removing.id!,
                              toColumnId: destination,
                            };
                    try {
                      const next = updateTaskBoard(latest.current, action);
                      if (replace(next, action, '항목을 삭제했어요.'))
                        setRemoving(null);
                    } catch (failure) {
                      setFormError(errorText(failure));
                    }
                  }}
                  className="mega-task-board__form"
                >
                  {removing.kind === 'column' &&
                    data.cards.some(
                      (card) => card.columnId === removing.id,
                    ) && (
                      <label>
                        카드를 옮길 열
                        <Select
                          name="destination"
                          aria-label="카드를 옮길 열"
                          required
                        >
                          <option value="">열 선택</option>
                          {data.columns
                            .filter((column) => column.id !== removing.id)
                            .map((column) => (
                              <option key={column.id} value={column.id}>
                                {column.title}
                              </option>
                            ))}
                        </Select>
                      </label>
                    )}
                  {formError && (
                    <Alert role="alert" tone="danger">
                      {formError}
                    </Alert>
                  )}
                  <div className="mega-task-board__actions">
                    <Button type="submit" variant="danger">
                      삭제 적용
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setRemoving(null)}
                    >
                      삭제 취소
                    </Button>
                  </div>
                </form>
              )}
            </Dialog>
            <Dialog
              open={!!imported || restoring}
              onClose={() => {
                setImported(null);
                setRestoring(false);
              }}
              title={
                imported
                  ? '보드 파일 적용'
                  : savedOnce
                    ? '저장한 상태로 되돌리기'
                    : '처음 상태로 되돌리기'
              }
              description="현재 보드 전체를 바꿔요. 적용 후 실행 취소로 되돌릴 수 있어요."
              actions={
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setImported(null);
                      setRestoring(false);
                    }}
                  >
                    현재 보드 유지
                  </Button>
                  <Button
                    onClick={() => {
                      const next = imported ?? parseTaskBoard(saved);
                      if (
                        replace(next, { type: 'replace' }, '보드를 불러왔어요.')
                      ) {
                        setImported(null);
                        setRestoring(false);
                      }
                    }}
                  >
                    보드 교체 적용
                  </Button>
                </>
              }
            />
          </>
        )
      )}
    </div>
  );
  function startDrag(
    event: PointerEvent<HTMLElement>,
    kind: 'card' | 'column',
    key: string,
  ) {
    if (
      drag.current ||
      !event.isPrimary ||
      event.button !== 0 ||
      !writable ||
      !allowReorder
    )
      return;
    event.preventDefault();
    if (event.currentTarget.matches('button'))
      event.currentTarget.focus({ preventScroll: true });
    currentStart.current = { x: event.clientX, y: event.clientY };
    drag.current = {
      kind,
      id: key,
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      active: false,
    };
    root.current?.setPointerCapture(event.pointerId);
  }
}
