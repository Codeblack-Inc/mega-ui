import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type ComponentPropsWithRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button, Input, Select } from './controls';
import { Alert } from './surfaces';
import { Dialog } from './overlay';
import {
  cellRef,
  columnLabel,
  columnIndex,
  copyRange,
  emptySheet,
  evaluateSpreadsheet,
  fillEdits,
  formatCellValue,
  parseDelimited,
  parseRange,
  parseRef,
  parseSpreadsheet,
  pasteEdits,
  rangeLabel,
  sheetToCsv,
  updateSpreadsheet,
  usedRange,
  validateSpreadsheet,
  SHEET_MAX_COLUMNS,
  SHEET_MAX_ROWS,
  type SpreadsheetAction,
  type SpreadsheetCellEdit,
  type SpreadsheetData,
  type SpreadsheetFormat,
  type SpreadsheetRange,
} from './spreadsheet-model';
import { spreadsheetToXlsx, xlsxToSpreadsheet } from './spreadsheet-xlsx';

export interface SpreadsheetProProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'onChange'
> {
  value: SpreadsheetData;
  onChange?: (
    value: SpreadsheetData,
    action: SpreadsheetAction | { type: 'replace' },
  ) => void;
  onSave?: (value: SpreadsheetData) => Promise<void>;
  label?: string;
  editable?: boolean;
  showTools?: boolean;
  /** Sheet shown first. Defaults to the first sheet. */
  defaultSheetId?: string;
}
type Cursor = { row: number; column: number };
type Drag =
  | { kind: 'select'; pointer: number }
  | { kind: 'fill'; pointer: number; source: SpreadsheetRange };
const ROW_HEIGHT = 28;
const DEFAULT_WIDTH = 104;
const HEADER_WIDTH = 52;
const OVERSCAN = 6;
const FORMATS: readonly { value: SpreadsheetFormat | ''; label: string }[] = [
  { value: '', label: '일반' },
  { value: 'text', label: '텍스트' },
  { value: 'number', label: '숫자' },
  { value: 'integer', label: '정수' },
  { value: 'currency', label: '통화' },
  { value: 'percent', label: '백분율' },
  { value: 'date', label: '날짜' },
];
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '시트 데이터 형식을 확인해 주세요.';
const normalize = (a: Cursor, b: Cursor): SpreadsheetRange => ({
  top: Math.min(a.row, b.row),
  left: Math.min(a.column, b.column),
  bottom: Math.max(a.row, b.row),
  right: Math.max(a.column, b.column),
});
const inRange = (range: SpreadsheetRange, row: number, column: number) =>
  row >= range.top &&
  row <= range.bottom &&
  column >= range.left &&
  column <= range.right;

export function SpreadsheetPro({
  value,
  onChange,
  onSave,
  label = '스프레드시트',
  editable = true,
  showTools = true,
  defaultSheetId,
  className = '',
  ref,
  ...props
}: SpreadsheetProProps) {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current!, []);
  const valid = useMemo(() => {
    try {
      return { data: validateSpreadsheet(value), error: '' };
    } catch {
      return { data: null, error: '시트 데이터 형식을 확인해 주세요.' };
    }
  }, [value]);
  const data = valid.data;
  const serialized = data ? JSON.stringify(data) : '';
  const [sheetId, setSheetId] = useState(
    () => defaultSheetId ?? data?.sheets[0]?.id ?? '',
  );
  const sheet =
    data?.sheets.find((item) => item.id === sheetId) ?? data?.sheets[0] ?? null;
  const [anchor, setAnchor] = useState<Cursor>({ row: 0, column: 0 });
  const [focus, setFocus] = useState<Cursor>({ row: 0, column: 0 });
  const [editing, setEditing] = useState<{ ref: string; value: string } | null>(
    null,
  );
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const [scrollTop, setScrollTop] = useState(0);
  const [viewHeight, setViewHeight] = useState(420);
  const [filter, setFilter] = useState({ column: '', query: '' });
  const [saved, setSaved] = useState(serialized);
  const [savedOnce, setSavedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ undo: string[]; redo: string[] }>({
    undo: [],
    redo: [],
  });
  const [imported, setImported] = useState<{
    data: SpreadsheetData;
    notes: readonly string[];
  } | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [fillTarget, setFillTarget] = useState<SpreadsheetRange | null>(null);
  const drag = useRef<Drag | null>(null);
  const cellInput = useRef<HTMLInputElement>(null);
  const wantFocus = useRef(false);
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      drag.current = null;
    };
  }, []);
  const writable = !!onChange;
  const canEdit = writable && editable;
  const dirty = serialized !== saved;
  useEffect(() => {
    if (wantFocus.current) cellInput.current?.focus();
  });
  const results = useMemo(
    () => (data ? evaluateSpreadsheet(data) : new Map()),
    [data],
  );
  const selection = normalize(anchor, focus);
  const active = cellRef(focus.row, focus.column);
  const activeCell = sheet?.cells[active];

  // Refs, not state, so two clicks inside one render cycle still see the real stack.
  const historyRef = useRef(history);
  historyRef.current = history;
  const shown = useRef(serialized);
  shown.current = serialized;
  const replace = (
    next: SpreadsheetData,
    action: SpreadsheetAction | { type: 'replace' },
    announcement: string,
    remember = true,
  ) => {
    if (!onChange) return false;
    try {
      onChange(next, action);
    } catch {
      setError('시트를 변경하지 못했어요. 다시 시도해 주세요.');
      return false;
    }
    if (remember) {
      historyRef.current = {
        undo: [...historyRef.current.undo, shown.current].slice(-50),
        redo: [],
      };
      setHistory(historyRef.current);
    }
    shown.current = JSON.stringify(next);
    setError('');
    setMessage(announcement);
    return true;
  };
  const change = (action: SpreadsheetAction, announcement: string) => {
    let next: SpreadsheetData;
    try {
      next = updateSpreadsheet(latest.current, action);
    } catch (failure) {
      setError(errorText(failure));
      setMessage('시트를 변경하지 않았어요.');
      return false;
    }
    if (JSON.stringify(next) === shown.current) {
      setError('');
      return true;
    }
    return replace(next, action, announcement);
  };
  const travel = (direction: 'undo' | 'redo') => {
    const stack = historyRef.current;
    const previous = stack[direction].at(-1);
    if (!previous) return;
    const current = shown.current;
    if (
      replace(
        parseSpreadsheet(previous),
        { type: 'replace' },
        direction === 'undo'
          ? '이전 변경을 되돌렸어요.'
          : '변경을 다시 적용했어요.',
        false,
      )
    ) {
      historyRef.current =
        direction === 'undo'
          ? { undo: stack.undo.slice(0, -1), redo: [...stack.redo, current] }
          : { undo: [...stack.undo, current], redo: stack.redo.slice(0, -1) };
      setHistory(historyRef.current);
    }
  };
  const setCells = (
    cells: readonly SpreadsheetCellEdit[],
    announcement: string,
  ) =>
    sheet && cells.length
      ? change({ type: 'set-cells', sheetId: sheet.id, cells }, announcement)
      : false;
  const width = (column: number) =>
    sheet?.columnWidths?.[columnLabel(column)] ?? DEFAULT_WIDTH;
  const columnOffset = (column: number) => {
    let offset = 0;
    for (let index = 0; index < column; index++) offset += width(index);
    return offset;
  };
  const merged = useMemo(() => {
    const map = new Map<string, { range: SpreadsheetRange; anchor: string }>();
    for (const item of sheet?.merges ?? []) {
      const range = parseRange(item);
      if (!range) continue;
      const anchorRef = cellRef(range.top, range.left);
      for (const row of Array.from(
        { length: range.bottom - range.top + 1 },
        (_unused, index) => range.top + index,
      ))
        for (const column of Array.from(
          { length: range.right - range.left + 1 },
          (_unused, index) => range.left + index,
        ))
          map.set(cellRef(row, column), { range, anchor: anchorRef });
    }
    return map;
  }, [sheet?.merges]);
  const hidden = useMemo(() => {
    if (!sheet || !filter.query.trim()) return new Set<number>();
    const query = filter.query.trim().toLocaleLowerCase();
    const range = usedRange(sheet);
    const rows = new Set<number>();
    if (!range) return rows;
    for (let row = range.top; row <= range.bottom; row++) {
      const columns = filter.column
        ? [columnIndex(filter.column)]
        : Array.from(
            { length: range.right - range.left + 1 },
            (_unused, index) => range.left + index,
          );
      const match = columns.some((column) => {
        const ref = cellRef(row, column);
        const computed = results.get(`${sheet.id}!${ref}`);
        const text = computed
          ? formatCellValue(computed.value, sheet.cells[ref]?.format)
          : (sheet.cells[ref]?.value ?? '');
        return text.toLocaleLowerCase().includes(query);
      });
      if (!match) rows.add(row);
    }
    return rows;
  }, [sheet, filter, results]);

  const commitEdit = (raw: string, move: Cursor | null) => {
    // Unmounting the editor fires blur, so the ref closes the window on a second commit.
    const current = editingRef.current;
    editingRef.current = null;
    if (!current || !sheet) return;
    const target = parseRef(current.ref);
    setEditing(null);
    if (target && raw !== (sheet.cells[current.ref]?.value ?? ''))
      setCells(
        [{ ref: current.ref, value: raw }],
        `${current.ref} 셀을 입력했어요.`,
      );
    if (move) {
      setAnchor(move);
      setFocus(move);
    }
    wantFocus.current = true;
  };
  const startEdit = (cursor: Cursor, initial?: string) => {
    if (!canEdit || !sheet) return;
    const ref = cellRef(cursor.row, cursor.column);
    const target = merged.get(ref);
    const editRef = target ? target.anchor : ref;
    setEditing({
      ref: editRef,
      value: initial ?? sheet.cells[editRef]?.value ?? '',
    });
  };
  const move = (dr: number, dc: number, extend: boolean) => {
    if (!sheet) return;
    const next = {
      row: Math.min(Math.max(focus.row + dr, 0), sheet.rows - 1),
      column: Math.min(Math.max(focus.column + dc, 0), sheet.columns - 1),
    };
    setFocus(next);
    if (!extend) setAnchor(next);
    revealRow(next.row);
  };
  const revealRow = (row: number) => {
    const element = scroller.current;
    if (!element) return;
    const top = row * ROW_HEIGHT;
    if (top < element.scrollTop) element.scrollTop = top;
    else if (top + ROW_HEIGHT > element.scrollTop + element.clientHeight)
      element.scrollTop = top + ROW_HEIGHT - element.clientHeight;
  };
  const clearSelection = () => {
    const edits = [];
    for (let row = selection.top; row <= selection.bottom; row++)
      for (let column = selection.left; column <= selection.right; column++)
        edits.push({ ref: cellRef(row, column), value: '' });
    setCells(edits, `${rangeLabel(selection)} 범위를 비웠어요.`);
  };
  const applyStyle = (
    patch: Omit<SpreadsheetCellEdit, 'ref'>,
    announcement: string,
  ) => {
    const edits: SpreadsheetCellEdit[] = [];
    for (let row = selection.top; row <= selection.bottom; row++)
      for (let column = selection.left; column <= selection.right; column++)
        edits.push({ ref: cellRef(row, column), ...patch });
    setCells(edits, announcement);
  };
  const download = (blob: Blob, name: string) => {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.append(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
    } catch {
      setError('파일을 만들지 못했어요. 다시 내려받아 주세요.');
    } finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url!), 1000);
    }
  };

  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    if (!event.buttons) {
      drag.current = null;
      return;
    }
    const element = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-ref]');
    const position = element?.dataset.ref
      ? parseRef(element.dataset.ref)
      : null;
    if (!position) return;
    if (current.kind === 'select') setFocus(position);
    else
      setFillTarget({
        top: current.source.top,
        left: current.source.left,
        bottom: Math.max(current.source.bottom, position.row),
        right: Math.max(current.source.right, position.column),
      });
  };
  const onCellKeys = (
    event: ReactKeyboardEvent<HTMLInputElement>,
    row: number,
    column: number,
  ) => {
    if (!sheet || event.nativeEvent.isComposing) return;
    // The input owns its keys; without this the grid would handle them a second time.
    event.stopPropagation();
    const open = editingRef.current;
    if (event.key === 'Escape') {
      event.preventDefault();
      setEditing(null);
      return;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const next = {
        row: Math.min(row + (event.key === 'Enter' ? 1 : 0), sheet.rows - 1),
        column: Math.min(
          column + (event.key === 'Tab' ? 1 : 0),
          sheet.columns - 1,
        ),
      };
      if (open) commitEdit(event.currentTarget.value, next);
      else {
        setAnchor(next);
        setFocus(next);
        revealRow(next.row);
      }
      return;
    }
    // While typing, the caret owns the arrows; otherwise they move the selection.
    if (open) return;
    onKeyDown(event as unknown as ReactKeyboardEvent<HTMLDivElement>);
  };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!sheet || event.nativeEvent.isComposing) return;
    const jump = event.ctrlKey || event.metaKey;
    const open = editingRef.current;
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setEditing(null);
      gridRef.current?.focus();
      return;
    }
    if (open) return;
    if (jump && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (canEdit) travel(event.shiftKey ? 'redo' : 'undo');
      return;
    }
    if (jump && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      const range = usedRange(sheet);
      setAnchor({ row: range?.top ?? 0, column: range?.left ?? 0 });
      setFocus({
        row: range?.bottom ?? sheet.rows - 1,
        column: range?.right ?? sheet.columns - 1,
      });
      return;
    }
    const arrows: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const step = arrows[event.key];
    if (step) {
      event.preventDefault();
      const distance = jump ? SHEET_MAX_ROWS : 1;
      move(step[0] * distance, step[1] * distance, event.shiftKey);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const column = event.key === 'Home' ? 0 : sheet.columns - 1;
      const next = { row: focus.row, column };
      setFocus(next);
      if (!event.shiftKey) setAnchor(next);
      return;
    }
    if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault();
      move((event.key === 'PageDown' ? 1 : -1) * 15, 0, event.shiftKey);
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      move(0, event.shiftKey ? -1 : 1, false);
      return;
    }
    if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      startEdit(focus);
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!canEdit) return;
      event.preventDefault();
      clearSelection();
      return;
    }
  };
  const onCopy = (event: ReactClipboardEvent<HTMLDivElement>) => {
    if (!sheet) return;
    event.preventDefault();
    const rows = copyRange(sheet, selection);
    event.clipboardData.setData(
      'text/plain',
      rows.map((line) => line.join('\t')).join('\n'),
    );
    setMessage(`${rangeLabel(selection)} 범위를 복사했어요.`);
  };
  const onCut = (event: ReactClipboardEvent<HTMLDivElement>) => {
    onCopy(event);
    if (canEdit) clearSelection();
  };
  const onPaste = (event: ReactClipboardEvent<HTMLDivElement>) => {
    if (!sheet || !canEdit) return;
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (!text) return;
    const matrix = parseDelimited(text.replace(/\r\n?/g, '\n'), '\t');
    const rows = selection.top + matrix.length;
    const columns =
      selection.left + Math.max(...matrix.map((line) => line.length));
    if (rows > SHEET_MAX_ROWS || columns > SHEET_MAX_COLUMNS) {
      setError('붙여넣을 범위가 시트 한계를 넘었어요.');
      return;
    }
    let next: SpreadsheetData;
    try {
      const grown =
        rows > sheet.rows || columns > sheet.columns
          ? updateSpreadsheet(latest.current, {
              type: 'resize-sheet',
              sheetId: sheet.id,
              rows: Math.max(rows, sheet.rows),
              columns: Math.max(columns, sheet.columns),
            })
          : validateSpreadsheet(latest.current);
      next = updateSpreadsheet(grown, {
        type: 'set-cells',
        sheetId: sheet.id,
        cells: pasteEdits(
          { row: selection.top, column: selection.left },
          matrix,
        ),
      });
    } catch (failure) {
      setError(errorText(failure));
      return;
    }
    if (
      replace(next, { type: 'replace' }, `${matrix.length}행을 붙여넣었어요.`)
    ) {
      setFocus({ row: rows - 1, column: columns - 1 });
      setAnchor({ row: selection.top, column: selection.left });
    }
  };
  // Registered once: a listener added only while a drag exists can miss its own pointerup.
  useEffect(() => {
    const up = () => {
      const current = drag.current;
      drag.current = null;
      if (current?.kind === 'fill' && fillTarget && sheet)
        setCells(
          fillEdits(sheet, current.source, fillTarget),
          `${rangeLabel(fillTarget)} 범위를 채웠어요.`,
        );
      setFillTarget(null);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  });
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setViewHeight(element.clientHeight),
    );
    observer.observe(element);
    setViewHeight(element.clientHeight);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (data && !data.sheets.some((item) => item.id === sheetId))
      setSheetId(data.sheets[0]?.id ?? '');
  }, [data, sheetId]);

  const frozenRows = sheet?.frozenRows ?? 0;
  const frozenColumns = sheet?.frozenColumns ?? 0;
  const totalRows = sheet?.rows ?? 0;
  const first = Math.max(
    frozenRows,
    Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN,
  );
  const last = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + viewHeight) / ROW_HEIGHT) + OVERSCAN,
  );
  const visibleRows: number[] = [];
  for (let row = first; row <= last; row++)
    if (!hidden.has(row)) visibleRows.push(row);
  const totalWidth = columnOffset(sheet?.columns ?? 0);
  const columns = Array.from(
    { length: sheet?.columns ?? 0 },
    (_unused, index) => index,
  );
  const stickyLeft = (column: number) =>
    column < frozenColumns
      ? {
          position: 'sticky' as const,
          insetInlineStart: HEADER_WIDTH + columnOffset(column),
          zIndex: 2,
        }
      : {};

  const cellNode = (row: number, column: number) => {
    if (!sheet) return null;
    const ref = cellRef(row, column);
    const cover = merged.get(ref);
    const isAnchor = !cover || cover.anchor === ref;
    const cell = sheet.cells[cover ? cover.anchor : ref];
    const computed = results.get(`${sheet.id}!${cover ? cover.anchor : ref}`);
    const selected = inRange(selection, row, column);
    const filling = fillTarget ? inRange(fillTarget, row, column) : false;
    const isFocus = focus.row === row && focus.column === column;
    const spanWidth = cover
      ? columnOffset(cover.range.right + 1) - columnOffset(cover.range.left)
      : width(column);
    const spanHeight = cover
      ? (cover.range.bottom - cover.range.top + 1) * ROW_HEIGHT
      : ROW_HEIGHT;
    if (cover && !isAnchor)
      return (
        <div
          key={ref}
          className="mega-spreadsheet__cell"
          data-cover=""
          style={{ width: width(column), ...stickyLeft(column) }}
          aria-hidden="true"
        />
      );
    return (
      <div
        key={ref}
        role="gridcell"
        className="mega-spreadsheet__cell"
        data-ref={ref}
        data-selected={selected || undefined}
        data-focus={isFocus || undefined}
        data-filling={filling || undefined}
        data-error={computed?.error ? '' : undefined}
        data-align={cell?.align}
        data-bold={cell?.bold || undefined}
        aria-selected={selected}
        aria-readonly={!canEdit || undefined}
        style={{
          width: spanWidth,
          ...(cover ? { height: spanHeight, zIndex: 3 } : {}),
          ...stickyLeft(column),
        }}
        onPointerDown={(event: ReactPointerEvent) => {
          if (event.button !== 0) return;
          // Keep the browser from moving focus to the grid after the pointer settles.
          event.preventDefault();
          const cursor = { row, column };
          if (event.shiftKey) setFocus(cursor);
          else {
            setAnchor(cursor);
            setFocus(cursor);
          }
          drag.current = { kind: 'select', pointer: event.pointerId };
          setEditing(null);
          wantFocus.current = true;
          cellInput.current?.focus();
        }}
        onDoubleClick={() => startEdit({ row, column })}
      >
        <span>
          {computed
            ? formatCellValue(computed.value, cell?.format)
            : (cell?.value ?? '')}
        </span>
        {isFocus && (
          // Always mounted on the active cell so IME composition and fast typing
          // never land on an element that cannot take text.
          <input
            ref={cellInput}
            className="mega-spreadsheet__editor"
            data-editing={editing ? '' : undefined}
            aria-label={`${cover ? cover.anchor : ref} 셀`}
            readOnly={!canEdit}
            value={editing ? editing.value : ''}
            onChange={(event) =>
              canEdit &&
              setEditing({
                ref: cover ? cover.anchor : ref,
                value: event.target.value,
              })
            }
            onBlur={(event) =>
              editingRef.current && commitEdit(event.target.value, null)
            }
            onKeyDown={(event) => onCellKeys(event, row, column)}
          />
        )}
        {isFocus && canEdit && !editing && (
          <span
            className="mega-spreadsheet__handle"
            data-fill-handle=""
            aria-hidden="true"
            onPointerDown={(event: ReactPointerEvent) => {
              event.stopPropagation();
              drag.current = {
                kind: 'fill',
                pointer: event.pointerId,
                source: selection,
              };
              setFillTarget(selection);
            }}
          />
        )}
      </div>
    );
  };

  const rowNode = (row: number) => (
    <div
      key={row}
      role="row"
      className="mega-spreadsheet__row"
      data-row={row}
      data-frozen={row < frozenRows || undefined}
      style={
        row < frozenRows
          ? {
              position: 'sticky',
              insetBlockStart: ROW_HEIGHT * (row + 1),
              zIndex: 3,
            }
          : undefined
      }
    >
      <div
        role="rowheader"
        className="mega-spreadsheet__rowhead"
        data-selected={
          (row >= selection.top && row <= selection.bottom) || undefined
        }
        onPointerDown={() => {
          if (!sheet) return;
          setAnchor({ row, column: 0 });
          setFocus({ row, column: sheet.columns - 1 });
          gridRef.current?.focus();
        }}
      >
        {row + 1}
      </div>
      {columns.map((column) => cellNode(row, column))}
    </div>
  );

  return (
    <div
      {...props}
      ref={root}
      className={`mega-spreadsheet ${className}`}
      role="region"
      aria-label={label}
      aria-busy={saving}
    >
      {valid.error || !sheet ? (
        <Alert role="alert" tone="danger">
          {valid.error || '시트 데이터 형식을 확인해 주세요.'}
        </Alert>
      ) : (
        <>
          {showTools && (
            <div className="mega-spreadsheet__toolbar">
              <div>
                <h2>{label}</h2>
                <p>
                  {sheet.name} · {sheet.rows}행 × {sheet.columns}열
                  {hidden.size ? ` · ${hidden.size}행 숨김` : ''}
                </p>
              </div>
              <div className="mega-spreadsheet__actions">
                {canEdit && (
                  <>
                    <label>
                      <Select
                        size="sm"
                        aria-label="셀 형식"
                        value={activeCell?.format ?? ''}
                        onChange={(event) =>
                          applyStyle(
                            {
                              format: (event.target.value ||
                                null) as SpreadsheetFormat | null,
                            },
                            '셀 형식을 바꿨어요.',
                          )
                        }
                      >
                        {FORMATS.map((item) => (
                          <option key={item.label} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </Select>
                    </label>
                    <Button
                      size="sm"
                      variant={activeCell?.bold ? 'weak' : 'secondary'}
                      aria-pressed={!!activeCell?.bold}
                      onClick={() =>
                        applyStyle(
                          { bold: activeCell?.bold ? null : true },
                          '굵게를 바꿨어요.',
                        )
                      }
                    >
                      굵게
                    </Button>
                    <label>
                      <Select
                        size="sm"
                        aria-label="가로 정렬"
                        value={activeCell?.align ?? ''}
                        onChange={(event) =>
                          applyStyle(
                            {
                              align: (event.target.value || null) as
                                'start' | 'center' | 'end' | null,
                            },
                            '정렬을 바꿨어요.',
                          )
                        }
                      >
                        <option value="">기본 정렬</option>
                        <option value="start">왼쪽</option>
                        <option value="center">가운데</option>
                        <option value="end">오른쪽</option>
                      </Select>
                    </label>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const label = rangeLabel(selection);
                        if (sheet.merges?.includes(label))
                          change(
                            {
                              type: 'unmerge',
                              sheetId: sheet.id,
                              range: label,
                            },
                            '병합을 해제했어요.',
                          );
                        else
                          change(
                            { type: 'merge', sheetId: sheet.id, range: label },
                            '셀을 병합했어요.',
                          );
                      }}
                    >
                      {sheet.merges?.includes(rangeLabel(selection))
                        ? '병합 해제'
                        : '셀 병합'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        change(
                          {
                            type: 'freeze',
                            sheetId: sheet.id,
                            rows: frozenRows ? 0 : focus.row + 1,
                            columns: frozenColumns ? 0 : focus.column + 1,
                          },
                          frozenRows || frozenColumns
                            ? '고정을 해제했어요.'
                            : '현재 셀까지 고정했어요.',
                        )
                      }
                    >
                      {frozenRows || frozenColumns ? '고정 해제' : '틀 고정'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        change(
                          {
                            type: 'sort',
                            sheetId: sheet.id,
                            range: rangeLabel(selection),
                            column: columnLabel(focus.column),
                            direction: 'asc',
                            header: false,
                          },
                          '선택 범위를 오름차순으로 정렬했어요.',
                        )
                      }
                    >
                      오름차순 정렬
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!history.undo.length || saving}
                      onClick={() => travel('undo')}
                    >
                      실행 취소
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!history.redo.length || saving}
                      onClick={() => travel('redo')}
                    >
                      다시 실행
                    </Button>
                  </>
                )}
                {onSave && (
                  <div
                    className="mega-spreadsheet__save"
                    data-dirty={dirty || undefined}
                  >
                    <span>
                      {dirty
                        ? '저장하지 않은 변경'
                        : savedOnce
                          ? '저장한 상태'
                          : '변경 없음'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!dirty || saving || !saved}
                      onClick={() => setRestoring(true)}
                    >
                      {savedOnce
                        ? '저장한 상태로 되돌리기'
                        : '처음 상태로 되돌리기'}
                    </Button>
                    <Button
                      variant="weak"
                      size="sm"
                      disabled={(!dirty && savedOnce) || saving}
                      onClick={async () => {
                        if (busy.current) return;
                        busy.current = true;
                        setSaving(true);
                        setError('');
                        try {
                          const snapshot = validateSpreadsheet(latest.current);
                          await onSave(snapshot);
                          if (alive.current) {
                            setSaved(JSON.stringify(snapshot));
                            setSavedOnce(true);
                            setMessage('시트를 저장했어요.');
                          }
                        } catch {
                          if (alive.current)
                            setError(
                              '시트를 저장하지 못했어요. 변경 내용은 화면에 남아 있어요. 다시 저장해 주세요.',
                            );
                        } finally {
                          busy.current = false;
                          if (alive.current) setSaving(false);
                        }
                      }}
                    >
                      {saving ? '저장 중' : '시트 저장'}
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    download(
                      new Blob([`﻿${sheetToCsv(sheet, results)}`], {
                        type: 'text/csv',
                      }),
                      `${sheet.name}.csv`,
                    )
                  }
                >
                  CSV 내려받기
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const bytes = await spreadsheetToXlsx(data!);
                      download(
                        new Blob([bytes as unknown as BlobPart], {
                          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        }),
                        'spreadsheet.xlsx',
                      );
                    } catch {
                      setError(
                        'xlsx 파일을 만들지 못했어요. 다시 내려받아 주세요.',
                      );
                    }
                  }}
                >
                  xlsx 내려받기
                </Button>
                {canEdit && (
                  <label className="mega-spreadsheet__file mega-button mega-button--ghost mega-button--sm">
                    파일 불러오기
                    <input
                      aria-label="시트 파일 불러오기"
                      type="file"
                      accept=".csv,.xlsx,.json,text/csv,application/json"
                      disabled={saving}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (!file) return;
                        try {
                          if (file.size > 8_000_000)
                            throw new Error('파일은 8MB 이내로 불러와 주세요.');
                          // Sniff the content: a zip header means xlsx whatever the name says.
                          const bytes = new Uint8Array(
                            await file.arrayBuffer(),
                          );
                          const zip =
                            bytes[0] === 0x50 &&
                            bytes[1] === 0x4b &&
                            bytes[2] === 0x03;
                          const body = zip
                            ? ''
                            : new TextDecoder().decode(bytes);
                          if (zip) setImported(await xlsxToSpreadsheet(bytes));
                          else if (body.trimStart().startsWith('{'))
                            setImported({
                              data: parseSpreadsheet(body),
                              notes: [],
                            });
                          else {
                            const matrix = parseDelimited(
                              body.replace(/^﻿/, ''),
                            );
                            const next = emptySheet(
                              'sheet-1',
                              file.name.slice(0, 40),
                            );
                            next.rows = Math.max(next.rows, matrix.length);
                            next.columns = Math.max(
                              next.columns,
                              Math.max(...matrix.map((line) => line.length)),
                            );
                            matrix.forEach((line, row) =>
                              line.forEach((cell, column) => {
                                if (cell !== '')
                                  next.cells[cellRef(row, column)] = {
                                    value: cell,
                                  };
                              }),
                            );
                            setImported({
                              data: validateSpreadsheet({
                                version: 1,
                                sheets: [next],
                              }),
                              notes: [
                                'CSV는 값만 가져오고 서식은 남기지 않아요.',
                              ],
                            });
                          }
                          setError('');
                        } catch (failure) {
                          setError(
                            `시트 파일을 불러오지 못했어요. ${errorText(failure)}`,
                          );
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
          <div className="mega-spreadsheet__bar">
            <span className="mega-spreadsheet__name">{active}</span>
            <label className="mega-spreadsheet__formula">
              <Input
                size="sm"
                aria-label="수식 입력줄"
                value={
                  editing?.ref === active
                    ? editing.value
                    : (activeCell?.value ?? '')
                }
                readOnly={!canEdit}
                onChange={(event) =>
                  setEditing({ ref: active, value: event.target.value })
                }
                onFocus={() =>
                  canEdit &&
                  setEditing({ ref: active, value: activeCell?.value ?? '' })
                }
                onBlur={(event) =>
                  editing?.ref === active &&
                  commitEdit(event.target.value, null)
                }
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === 'Enter')
                    commitEdit(event.currentTarget.value, {
                      row: Math.min(focus.row + 1, sheet.rows - 1),
                      column: focus.column,
                    });
                  if (event.key === 'Escape') {
                    setEditing(null);
                    gridRef.current?.focus();
                  }
                }}
              />
            </label>
            <label className="mega-spreadsheet__filter">
              <Input
                size="sm"
                type="search"
                aria-label="행 필터"
                placeholder="행 필터"
                value={filter.query}
                onChange={(event) =>
                  setFilter((old) => ({ ...old, query: event.target.value }))
                }
              />
            </label>
            <label>
              <Select
                size="sm"
                aria-label="필터 열"
                value={filter.column}
                onChange={(event) =>
                  setFilter((old) => ({ ...old, column: event.target.value }))
                }
              >
                <option value="">모든 열</option>
                {columns.map((column) => (
                  <option key={column} value={columnLabel(column)}>
                    {columnLabel(column)}열
                  </option>
                ))}
              </Select>
            </label>
          </div>
          {error && (
            <Alert role="alert" tone="danger">
              {error}
            </Alert>
          )}
          <div
            className="mega-spreadsheet__scroller"
            ref={scroller}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          >
            <div
              className="mega-spreadsheet__grid"
              role="grid"
              aria-label={`${sheet.name} 시트`}
              aria-rowcount={sheet.rows}
              aria-colcount={sheet.columns}
              tabIndex={0}
              ref={gridRef}
              style={{ width: HEADER_WIDTH + totalWidth }}
              onKeyDown={onKeyDown}
              onPointerMove={onDragMove}
              onCopy={onCopy}
              onCut={onCut}
              onPaste={onPaste}
            >
              <div className="mega-spreadsheet__head" role="row">
                <div className="mega-spreadsheet__corner" />
                {columns.map((column) => (
                  <div
                    key={column}
                    role="columnheader"
                    className="mega-spreadsheet__colhead"
                    data-selected={
                      (column >= selection.left && column <= selection.right) ||
                      undefined
                    }
                    style={{ width: width(column), ...stickyLeft(column) }}
                    onPointerDown={() => {
                      setAnchor({ row: 0, column });
                      setFocus({ row: sheet.rows - 1, column });
                      gridRef.current?.focus();
                    }}
                  >
                    {columnLabel(column)}
                  </div>
                ))}
              </div>
              {Array.from({ length: frozenRows }, (_unused, row) =>
                rowNode(row),
              )}
              <div
                style={{
                  height: Math.max(0, (first - frozenRows) * ROW_HEIGHT),
                }}
              />
              {visibleRows.map((row) => rowNode(row))}
              <div
                style={{
                  height: Math.max(0, (totalRows - 1 - last) * ROW_HEIGHT),
                }}
              />
            </div>
          </div>
          <div
            className="mega-spreadsheet__sheets"
            role="tablist"
            aria-label="시트 목록"
          >
            {data!.sheets.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === sheet.id}
                className="mega-spreadsheet__sheet"
                onClick={() => {
                  setSheetId(item.id);
                  setAnchor({ row: 0, column: 0 });
                  setFocus({ row: 0, column: 0 });
                }}
                onDoubleClick={() =>
                  canEdit && setRenaming({ id: item.id, name: item.name })
                }
              >
                {item.name}
              </button>
            ))}
            {canEdit && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const index = data!.sheets.length + 1;
                    change(
                      {
                        type: 'add-sheet',
                        sheet: emptySheet(
                          `sheet-${Date.now().toString(36)}`,
                          `시트 ${index}`,
                        ),
                      },
                      '시트를 추가했어요.',
                    );
                  }}
                >
                  시트 추가
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setRenaming({ id: sheet.id, name: sheet.name })
                  }
                >
                  시트 이름 바꾸기
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={data!.sheets.length < 2}
                  onClick={() =>
                    change(
                      { type: 'delete-sheet', sheetId: sheet.id },
                      `${sheet.name} 시트를 삭제했어요.`,
                    )
                  }
                >
                  시트 삭제
                </Button>
              </>
            )}
          </div>
          <p className="mega-spreadsheet__hint">
            {canEdit
              ? '셀을 눌러 선택하고 바로 입력해요. 수식은 =로 시작하고, 오른쪽 아래 손잡이를 끌면 값과 수식을 채워요. Ctrl/⌘+C·V로 복사·붙여넣기, Delete로 지워요.'
              : '시트를 읽기 전용으로 보고 있어요.'}
          </p>
          <p className="mega-visually-hidden" role="status" aria-live="polite">
            {message}
          </p>
        </>
      )}
      <Dialog
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title="시트 이름 바꾸기"
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setRenaming(null)}>
              이름 바꾸기 취소
            </Button>
            <Button
              onClick={() => {
                if (
                  renaming &&
                  change(
                    {
                      type: 'rename-sheet',
                      sheetId: renaming.id,
                      name: renaming.name,
                    },
                    '시트 이름을 바꿨어요.',
                  )
                )
                  setRenaming(null);
              }}
            >
              이름 적용
            </Button>
          </>
        }
      >
        <label>
          시트 이름
          <Input
            aria-label="시트 이름"
            value={renaming?.name ?? ''}
            maxLength={50}
            onChange={(event) =>
              setRenaming((old) =>
                old ? { ...old, name: event.target.value } : old,
              )
            }
          />
        </label>
      </Dialog>
      <Dialog
        open={!!imported}
        onClose={() => setImported(null)}
        title="파일로 바꿀까요?"
        size="sm"
        description={
          imported
            ? `시트 ${imported.data.sheets.length}개를 읽었어요. 현재 시트 전체를 바꾸고, 저장하지 않은 변경은 사라져요.`
            : undefined
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setImported(null)}>
              현재 시트 유지
            </Button>
            <Button
              onClick={() => {
                if (
                  imported &&
                  replace(
                    imported.data,
                    { type: 'replace' },
                    '파일로 바꿨어요.',
                  )
                ) {
                  setSheetId(imported.data.sheets[0]?.id ?? '');
                  setAnchor({ row: 0, column: 0 });
                  setFocus({ row: 0, column: 0 });
                  setImported(null);
                }
              }}
            >
              파일로 교체
            </Button>
          </>
        }
      >
        {imported?.notes.length ? (
          <ul className="mega-spreadsheet__notes">
            {imported.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </Dialog>
      <Dialog
        open={restoring}
        onClose={() => setRestoring(false)}
        title={
          savedOnce ? '저장한 상태로 되돌릴까요?' : '처음 상태로 되돌릴까요?'
        }
        size="sm"
        description="현재 시트 전체를 바꾸고, 저장하지 않은 변경은 사라져요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setRestoring(false)}>
              현재 시트 유지
            </Button>
            <Button
              onClick={() => {
                try {
                  if (
                    replace(
                      parseSpreadsheet(saved),
                      { type: 'replace' },
                      savedOnce
                        ? '저장한 상태로 되돌렸어요.'
                        : '처음 상태로 되돌렸어요.',
                    )
                  )
                    setRestoring(false);
                } catch {
                  setError(
                    '저장한 시트를 불러오지 못했어요. 다시 저장해 주세요.',
                  );
                  setRestoring(false);
                }
              }}
            >
              되돌리기
            </Button>
          </>
        }
      />
    </div>
  );
}
