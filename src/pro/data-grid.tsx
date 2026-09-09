import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import {
  Cell,
  DataGrid as EngineGrid,
  Row,
  SelectColumn,
  TreeDataGrid,
  type Column,
  type DataGridHandle,
  type DataGridProps as EngineProps,
  type RenderEditCellProps,
} from 'react-data-grid';
import {
  parseGridDraft,
  serializeGridDraft,
  type GridDraftSnapshot,
  type GridInput,
} from './data-grid-draft';
import { useGridLayout } from './use-grid-layout';
import { Button, Checkbox, Input, Select } from '../components/controls';
import {
  applyGridChanges,
  mergeGridSavedRows,
  createGridCsv,
  defaultGridView,
  formatGridClipboard,
  getGridRows,
  gridCellKey,
  gridEditable,
  gridValue,
  parseGridClipboard,
  parseGridValue,
  setGridValue,
  summarizeGridRows,
  validateGridChanges,
  type GridCellAddress,
  type GridCellError,
  type GridChange,
  type GridColumn,
  type GridColumnState,
  type GridFilterOperator,
  type GridSummary,
  type GridView,
} from './data-grid-model';

export interface DataGridProProps<R extends object> extends Omit<
  ComponentPropsWithRef<'section'>,
  'onCopyCapture' | 'onCutCapture' | 'onPasteCapture'
> {
  rows: readonly R[];
  columns: readonly GridColumn<R>[];
  getRowId: (row: R) => string;
  /** Controlled canonical data; called after a successful batch save. */
  onRowsChange?: (rows: readonly R[]) => void;
  /** Show canonical rows with viewer tools only, even when editing callbacks are supplied. */
  readOnly?: boolean;
  /** Return authoritative rows, including server normalization. Reject to retain every draft. */
  onSave?: (
    changes: readonly GridChange[],
    context: { rows: readonly R[]; signal: AbortSignal },
  ) => Promise<readonly R[]>;
  onSaveError?: (error: unknown) => void;
  onExport?: (request: {
    view: GridView;
    selectedIds?: ReadonlySet<string>;
  }) => Promise<void>;
  validateRow?: (row: R) => string | undefined;
  view?: GridView;
  defaultView?: Partial<GridView>;
  onViewChange?: (view: GridView) => void;
  selectedIds?: ReadonlySet<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onDraftChange?: (changes: readonly GridChange[]) => void;
  /** Opt-in local recovery. Use a stable user/document/schema-specific key; remount to change it. */
  draftStorageKey?: string;
  /** Includes uncommitted editor input as well as validated drafts. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Maximum retained undo batches (default 100). */
  historyLimit?: number;
  /** Server mode: rows are already filtered, sorted and paginated. */
  manual?: boolean;
  rowCount?: number;
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  label?: string;
  height?: number;
  rowHeight?: number;
  direction?: 'ltr' | 'rtl';
  className?: string;
  /** Flat parent-linked tree. Cannot be combined with grouping or server pagination. */
  getParentId?: (row: R) => string | null;
  treeColumnKey?: string;
}
interface Range {
  anchor: GridCellAddress;
  end: GridCellAddress;
}
const filterLabels: Record<GridFilterOperator, string> = {
  contains: '포함',
  equals: '같음',
  notEquals: '다름',
  startsWith: '시작',
  gt: '초과',
  gte: '이상',
  lt: '미만',
  lte: '이하',
  empty: '비어 있음',
  notEmpty: '값 있음',
};
const groupId = (key: string, parent?: string) =>
  JSON.stringify([parent ?? null, key]);

function GridEditor<R extends object>({
  row,
  column,
  onRowChange,
  definition,
  validateRow,
  initialText,
  onTextChange,
  onCancel,
  onRequestSave,
  onInvalid,
  onApply,
}: RenderEditCellProps<R, GridSummary> & {
  definition: GridColumn<R>;
  initialText?: string;
  onTextChange: (text: string) => void;
  onCancel: () => void;
  onRequestSave: () => void;
  onInvalid: (message: string) => void;
  onApply: () => boolean;
  validateRow?: (row: R) => string | undefined;
}) {
  const [text, setText] = useState(
    initialText ?? String(gridValue(row, definition) ?? ''),
  );
  const id = useId();
  let error = '';
  let next = row;
  try {
    const value = parseGridValue(text, row, definition);
    next = setGridValue(row, definition, value);
    error = definition.validate?.(value, next) ?? validateRow?.(next) ?? '';
  } catch (e) {
    error = e instanceof Error ? e.message : '입력값을 다시 확인해 주세요.';
  }
  const change = (text: string) => {
    setText(text);
    onTextChange(text);
    try {
      onRowChange(
        setGridValue(row, definition, parseGridValue(text, row, definition)),
      );
    } catch {
      /* Keep invalid input visible until corrected or cancelled. */
    }
  };
  const common = {
    autoFocus: true,
    'aria-label': `${definition.header} 편집`,
    'aria-invalid': !!error,
    'aria-describedby': error ? id : undefined,
    value: text,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => change(event.target.value),
    onBlur: () => {
      if (!error) onRowChange(next, true);
      else onInvalid(error);
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (!event.nativeEvent.isComposing && event.keyCode !== 229) {
        if (event.key === 'Escape') onCancel();
        if (!error && ['Enter', 'Tab'].includes(event.key) && !onApply()) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 's'
        ) {
          event.preventDefault();
          event.stopPropagation();
          onRequestSave();
          return;
        }
      }
      if (
        event.nativeEvent.isComposing ||
        event.keyCode === 229 ||
        (error && event.key !== 'Escape')
      ) {
        event.stopPropagation();
        if (
          !event.nativeEvent.isComposing &&
          ['Enter', 'Tab'].includes(event.key)
        )
          event.preventDefault();
      }
    },
  };
  return (
    <div className="mega-pro-grid__editor">
      {definition.kind === 'select' || definition.kind === 'boolean' ? (
        <select {...common}>
          {(definition.kind === 'boolean'
            ? ['true', 'false']
            : (definition.options ?? [])
          ).map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          inputMode={definition.kind === 'number' ? 'decimal' : undefined}
          onFocus={(e) => e.target.select()}
        />
      )}
      {error && (
        <span id={id} role="alert">
          {error}
        </span>
      )}
      <span className="mega-visually-hidden">
        {column.name} Enter로 적용, Escape로 취소
      </span>
    </div>
  );
}

export function DataGridPro<R extends object>({
  rows,
  columns,
  getRowId,
  onRowsChange,
  readOnly = false,
  onSave,
  onSaveError,
  onExport,
  validateRow,
  view: controlledView,
  defaultView,
  onViewChange,
  selectedIds,
  onSelectionChange,
  onDraftChange,
  draftStorageKey,
  onDirtyChange,
  historyLimit = 100,
  manual = false,
  rowCount,
  loading = false,
  error,
  onRetry,
  label = '전문 데이터 그리드',
  height = 560,
  rowHeight: requestedRowHeight = 40,
  direction = 'ltr',
  className = '',
  getParentId,
  treeColumnKey,
  ...sectionProps
}: DataGridProProps<R>) {
  const rowHeight =
    Number.isFinite(requestedRowHeight) && requestedRowHeight >= 24
      ? requestedRowHeight
      : 40;
  const [localView, setLocalView] = useState<GridView>(() => ({
    ...defaultGridView,
    ...defaultView,
  }));
  const view = controlledView ?? localView;
  const [localSelected, setLocalSelected] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const selected = selectedIds ?? localSelected;
  const [drafts, setDrafts] = useState<readonly GridChange[]>([]);
  const [draftBases, setDraftBases] = useState<ReadonlyMap<string, R>>(
    new Map(),
  );
  const [inputs, setInputs] = useState<ReadonlyMap<string, GridInput>>(
    new Map(),
  );
  const [recovery, setRecovery] = useState<GridDraftSnapshot<R> | null>(null);
  const [storageError, setStorageError] = useState('');
  const [storageReady, setStorageReady] = useState(false);
  const storage = useRef<{
    key?: string;
    observed: string | null;
    ready: boolean;
    blocked: boolean;
  }>({
    key: draftStorageKey,
    observed: null,
    ready: false,
    blocked: false,
  });
  const undoLimit =
    Number.isSafeInteger(historyLimit) && historyLimit >= 0
      ? historyLimit
      : 100;
  const remember = (
    entries: (readonly GridChange[])[],
    entry: readonly GridChange[],
  ) => (undoLimit ? [...entries, entry].slice(-undoLimit) : []);
  const [past, setPast] = useState<(readonly GridChange[])[]>([]);
  const [future, setFuture] = useState<(readonly GridChange[])[]>([]);
  const [errors, setErrors] = useState<readonly GridCellError[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [range, setRange] = useState<Range | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<unknown>>(new Set());
  const [settings, setSettings] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [filterKey, setFilterKey] = useState(
    columns.find((c) => c.filterable !== false)?.key ?? '',
  );
  const [filterOperator, setFilterOperator] =
    useState<GridFilterOperator>('contains');
  const [filterText, setFilterText] = useState('');
  const engine = useRef<DataGridHandle>(null);
  const dragging = useRef(false);
  const preserveRange = useRef(false);
  const saveController = useRef<AbortController | null>(null);
  const helpId = useId();
  useGridLayout(engine, rowHeight);
  const viewer = readOnly || !onRowsChange;
  const canEdit = !viewer && !saving && !loading && !recovery;
  const dirty = drafts.length > 0 || inputs.size > 0;
  useEffect(() => {
    setMessage('');
  }, [viewer]);
  useEffect(() => {
    const release = () => {
      dragging.current = false;
    };
    window.addEventListener('pointerup', release);
    return () => window.removeEventListener('pointerup', release);
  }, []);
  useEffect(() => () => saveController.current?.abort(), []);
  useEffect(() => {
    onDraftChange?.(drafts);
  }, [drafts, onDraftChange]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    const state = storage.current;
    if (viewer || !state.key || state.ready) return;
    try {
      state.observed = localStorage.getItem(state.key);
      if (state.observed)
        setRecovery(parseGridDraft<R>(state.observed, getRowId));
    } catch {
      state.blocked = true;
      setStorageError(
        '초안을 불러오지 못했어요. 화면을 닫기 전에 변경 사항을 저장해 주세요.',
      );
    }
    state.ready = true;
    setStorageReady(true);
  }, [getRowId, viewer]);
  useEffect(() => {
    const state = storage.current;
    if (viewer || !state.key || !storageReady || state.blocked || recovery)
      return;
    try {
      if (localStorage.getItem(state.key) !== state.observed)
        throw new Error('Concurrent draft');
      const draftIds = new Set(
        [...drafts, ...inputs.values()].map((c) => c.rowId),
      );
      const text = dirty
        ? serializeGridDraft({
            changes: drafts,
            inputs: [...inputs.values()],
            bases: [...draftBases]
              .filter(([id]) => draftIds.has(id))
              .map(([, row]) => row),
          })
        : null;
      if (text === null) localStorage.removeItem(state.key);
      else localStorage.setItem(state.key, text);
      state.observed = text;
    } catch {
      state.blocked = true;
      setStorageError(
        '초안을 브라우저에 보관하지 못했어요. 입력은 이 화면에 남아 있어요. 화면을 닫기 전에 변경 사항을 저장해 주세요.',
      );
    }
  }, [drafts, inputs, draftBases, dirty, recovery, storageReady, viewer]);
  const clearStoredDraft = () => {
    const state = storage.current;
    if (!state.key || state.blocked) return;
    try {
      if (localStorage.getItem(state.key) !== state.observed)
        throw new Error('Concurrent draft');
      localStorage.removeItem(state.key);
      state.observed = null;
    } catch {
      state.blocked = true;
      setStorageError(
        '브라우저의 초안을 지우지 못했어요. 다시 열면 이전 초안이 표시될 수 있어요.',
      );
    }
  };
  const updateView = (patch: Partial<GridView>, reset = true) => {
    const next = { ...view, ...(reset ? { page: 1 } : {}), ...patch };
    if (controlledView === undefined) setLocalView(next);
    onViewChange?.(next);
    setRange(null);
  };
  const selectRows = (ids: Set<string>) => {
    if (selectedIds === undefined) setLocalSelected(ids);
    onSelectionChange?.(ids);
  };
  const workingRows = useMemo(
    () => (viewer ? rows : applyGridChanges(rows, columns, drafts, getRowId)),
    [rows, columns, drafts, getRowId, viewer],
  );
  const resultRows = useMemo(
    () => getGridRows(workingRows, columns, view, manual),
    [workingRows, columns, view, manual],
  );
  const total = manual ? (rowCount ?? rows.length) : resultRows.length;
  const pageSize =
    Number.isSafeInteger(view.pageSize) && view.pageSize >= 0
      ? view.pageSize
      : 100;
  const pages = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const page = Math.max(1, Math.min(pages, view.page));
  const pageRows = useMemo(
    () =>
      manual || !pageSize || getParentId
        ? resultRows
        : resultRows.slice((page - 1) * pageSize, page * pageSize),
    [manual, pageSize, getParentId, resultRows, page],
  );
  const sourceRows = useMemo(
    () =>
      manual
        ? [
            ...new Map([
              ...draftBases,
              ...rows.map((row) => [getRowId(row), row] as const),
            ]).values(),
          ]
        : rows,
    [rows, getRowId, manual, draftBases],
  );
  const latestSource = useRef(sourceRows);
  latestSource.current = sourceRows;
  const sourceById = useMemo(
    () => new Map(sourceRows.map((row) => [getRowId(row), row])),
    [sourceRows, getRowId],
  );
  const columnByKey = useMemo(
    () => new Map(columns.map((c) => [c.key, c])),
    [columns],
  );
  const columnState = useMemo(() => {
    const map = new Map(view.columns.map((c) => [c.key, c]));
    const order = [
      ...view.columns.map((c) => c.key),
      ...columns.map((c) => c.key),
    ].filter((k, i, a) => a.indexOf(k) === i && columnByKey.has(k));
    return order.map((key) => ({ key, ...map.get(key) }));
  }, [columns, columnByKey, view.columns]);
  const groupBy = getParentId
    ? []
    : view.groupBy.filter(
        (key) =>
          columnByKey.get(key)?.groupable !== false && columnByKey.has(key),
      );
  const visibleColumns = columnState
    .filter((c) => !c.hidden || groupBy.includes(c.key))
    .map((state) => ({ ...columnByKey.get(state.key)!, ...state }))
    .sort((a, b) => {
      const order = (c: typeof a) =>
        groupBy.includes(c.key)
          ? -1
          : c.frozen === 'end'
            ? 2
            : c.frozen
              ? 0
              : 1;
      return (
        order(a) - order(b) ||
        (groupBy.includes(a.key) && groupBy.includes(b.key)
          ? groupBy.indexOf(a.key) - groupBy.indexOf(b.key)
          : 0)
      );
    });
  const rowGrouper = (groupRows: readonly R[], key: string) => {
    const result: Record<string, R[]> = Object.create(null);
    const column = columnByKey.get(key)!;
    for (const row of groupRows) {
      const value = String(gridValue(row, column) ?? '');
      (result[value] ??= []).push(row);
    }
    return result;
  };
  const tree = useMemo(() => {
    if (!getParentId) return null;
    const byId = new Map(workingRows.map((row) => [getRowId(row), row]));
    const children = new Map<string | null, R[]>();
    const depth = new Map<string, number>();
    for (const row of getGridRows(
      workingRows,
      columns,
      { ...view, query: '', filters: [] },
      false,
    )) {
      const parent = getParentId(row);
      if (parent !== null && !byId.has(parent))
        throw new Error(`존재하지 않는 부모 행: ${parent}`);
      const list = children.get(parent) ?? [];
      list.push(row);
      children.set(parent, list);
    }
    // Validate disconnected cycles as well as reachable branches.
    const visited = new Set<string>();
    for (const row of workingRows) {
      const path = new Set<string>();
      let current: R | undefined = row;
      while (current && !visited.has(getRowId(current))) {
        const id = getRowId(current);
        if (path.has(id))
          throw new Error('트리 데이터에 순환 참조가 있습니다.');
        path.add(id);
        const parent = getParentId(current);
        current = parent === null ? undefined : byId.get(parent);
      }
      for (const id of path) visited.add(id);
    }
    const matches = new Set(resultRows.map(getRowId));
    const keep = new Set(matches);
    for (const id of matches) {
      let row = byId.get(id);
      while (row) {
        const parent = getParentId(row);
        if (parent === null || keep.has(parent)) break;
        keep.add(parent);
        row = byId.get(parent);
      }
    }
    const visible: R[] = [];
    const stack = (children.get(null) ?? [])
      .map((row) => ({ row, level: 1 }))
      .reverse();
    while (stack.length) {
      const { row, level } = stack.pop()!;
      const id = getRowId(row);
      if (!keep.has(id)) continue;
      depth.set(id, level);
      visible.push(row);
      if (expanded.has(id) || view.query || view.filters.length)
        for (const child of [...(children.get(id) ?? [])].reverse())
          stack.push({ row: child, level: level + 1 });
    }
    return { visible, children, depth };
  }, [workingRows, resultRows, getParentId, getRowId, columns, view, expanded]);
  const { rangeRows, rowPositions } = useMemo(() => {
    const rangeRows: R[] = [];
    const rowPositions = new Map<string, number>();
    let position = 0;
    const visit = (items: readonly R[], level: number, parent?: string) => {
      const key = tree ? undefined : groupBy[level];
      if (!key) {
        for (const row of items) {
          rowPositions.set(getRowId(row), position++);
          rangeRows.push(row);
        }
        return;
      }
      for (const [value, group] of Object.entries(rowGrouper(items, key))) {
        position++;
        const id = groupId(value, parent);
        if (expanded.has(id)) visit(group, level + 1, id);
      }
    };
    visit(tree ? tree.visible : pageRows, 0);
    return { rangeRows, rowPositions };
  }, [tree, pageRows, view, columns, expanded, getRowId]);
  const bounds = useMemo(() => {
    if (!range) return null;
    const r1 = rangeRows.findIndex(
        (row) => getRowId(row) === range.anchor.rowId,
      ),
      r2 = rangeRows.findIndex((row) => getRowId(row) === range.end.rowId);
    const c1 = visibleColumns.findIndex(
        (c) => c.key === range.anchor.columnKey,
      ),
      c2 = visibleColumns.findIndex((c) => c.key === range.end.columnKey);
    return Math.min(r1, r2, c1, c2) < 0
      ? null
      : {
          top: Math.min(r1, r2),
          bottom: Math.max(r1, r2),
          left: Math.min(c1, c2),
          right: Math.max(c1, c2),
        };
  }, [range, rangeRows, visibleColumns, getRowId]);
  const rangeIds = new Set(
    bounds ? rangeRows.slice(bounds.top, bounds.bottom + 1).map(getRowId) : [],
  );
  const rangeKeys = new Set(
    bounds
      ? visibleColumns.slice(bounds.left, bounds.right + 1).map((c) => c.key)
      : [],
  );
  const conflicts = useMemo(
    () =>
      validateGridChanges(sourceRows, columns, drafts, getRowId, validateRow),
    [sourceRows, columns, drafts, getRowId, validateRow],
  );
  const errorMap = new Map(
    (viewer ? [] : [...conflicts, ...errors]).map((error) => [
      gridCellKey(error),
      error.message,
    ]),
  );
  const dirtyKeys = new Set(viewer ? [] : drafts.map(gridCellKey));
  const summary = useMemo(
    () => summarizeGridRows(resultRows, columns),
    [resultRows, columns],
  );
  const updateColumns = (next: readonly GridColumnState[]) =>
    updateView({ columns: next }, false);
  const changeColumn = (key: string, patch: Partial<GridColumnState>) =>
    updateColumns(
      columnState.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    );
  const reorder = (source: string, target: string) => {
    const next = [...columnState];
    const from = next.findIndex((c) => c.key === source),
      to = next.findIndex((c) => c.key === target);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    updateColumns(next);
  };
  const commit = (
    candidates: readonly { rowId: string; columnKey: string; value: unknown }[],
    useEditorInput = false,
  ) => {
    if (!canEdit) return;
    const merged = new Map(
      drafts.map((change) => [gridCellKey(change), change]),
    );
    const editorRows = useEditorInput
      ? new Map(
          applyGridChanges(sourceRows, columns, drafts, getRowId).map((row) => [
            getRowId(row),
            row,
          ]),
        )
      : undefined;
    const missing: GridCellError[] = [];
    for (const item of candidates) {
      let candidate = item;
      const row = sourceById.get(item.rowId),
        column = columnByKey.get(item.columnKey);
      if (!row || !column) {
        missing.push({
          ...candidate,
          message: '원본 셀을 찾지 못했어요. 데이터를 다시 불러와 주세요.',
        });
        continue;
      }
      const key = gridCellKey(candidate);
      const input = useEditorInput ? inputs.get(key) : undefined;
      if (input) {
        try {
          candidate = {
            ...candidate,
            value: parseGridValue(
              input.text,
              editorRows!.get(candidate.rowId)!,
              column,
            ),
          };
        } catch (e) {
          missing.push({
            ...candidate,
            message: e instanceof Error ? e.message : '입력값을 확인해 주세요.',
          });
          continue;
        }
      }
      const existing = merged.get(key);
      const previousValue = existing
        ? existing.previousValue
        : input
          ? input.previousValue
          : gridValue(row, column);
      if (Object.is(candidate.value, previousValue)) merged.delete(key);
      else merged.set(key, { ...candidate, previousValue });
    }
    const next = [...merged.values()];
    const invalid = [
      ...missing,
      ...validateGridChanges(sourceRows, columns, next, getRowId, validateRow),
    ];
    if (invalid.length) {
      setErrors(invalid);
      setMessage(
        `${invalid.length}개 오류가 있어 변경하지 않았어요. 입력값을 확인해 주세요.`,
      );
      return;
    }
    setInputs((current) => {
      const remaining = new Map(current);
      for (const candidate of candidates)
        remaining.delete(gridCellKey(candidate));
      return remaining;
    });
    setErrors([]);
    if (
      next.length === drafts.length &&
      next.every(
        (change, i) =>
          gridCellKey(change) === gridCellKey(drafts[i]!) &&
          Object.is(change.value, drafts[i]!.value),
      )
    )
      return next;
    setDraftBases((current) => {
      const bases = new Map(current);
      for (const candidate of candidates) {
        const row = sourceById.get(candidate.rowId);
        if (row && !bases.has(candidate.rowId)) bases.set(candidate.rowId, row);
      }
      return bases;
    });
    setPast(remember(past, drafts));
    setFuture([]);
    setDrafts(next);
    setErrors([]);
    setMessage(
      `${candidates.length}셀을 변경했어요. 저장 전까지 초안으로 보관해요.`,
    );
    return next;
  };
  const history = (redo: boolean) => {
    if (!canEdit) return;
    const list = redo ? future : past;
    const next = list.at(-1);
    if (!next) return;
    if (redo) {
      setPast(remember(past, drafts));
      setFuture(future.slice(0, -1));
    } else {
      setFuture(remember(future, drafts));
      setPast(past.slice(0, -1));
    }
    setDrafts(next);
    setErrors([]);
    setMessage(redo ? '다시 실행했어요.' : '실행을 취소했어요.');
  };
  const save = async () => {
    if (!canEdit || !onRowsChange || saveController.current) return;
    const pending = inputs.size
      ? commit(
          [...inputs.values()].map((input) => ({
            ...input,
            value: input.text,
          })),
          true,
        )
      : drafts;
    if (!pending?.length) return;
    const invalid = validateGridChanges(
      sourceRows,
      columns,
      pending,
      getRowId,
      validateRow,
    );
    if (invalid.length) {
      setErrors(invalid);
      setMessage('원본과 달라진 값이나 입력 오류를 먼저 확인해 주세요.');
      return;
    }
    const controller = new AbortController();
    saveController.current = controller;
    setSaving(true);
    setMessage('변경 사항을 저장하고 있어요.');
    try {
      const proposed = applyGridChanges(sourceRows, columns, pending, getRowId);
      const saved = onSave
        ? await onSave(pending, { rows: proposed, signal: controller.signal })
        : proposed;
      if (controller.signal.aborted) return;
      if (
        !Array.isArray(saved) ||
        new Set(saved.map(getRowId)).size !== saved.length
      )
        throw new Error(
          '서버가 유효한 고유 ID의 행 목록을 반환하지 않았습니다.',
        );
      const accepted = mergeGridSavedRows(
        sourceRows,
        latestSource.current,
        saved,
        columns,
        pending,
        getRowId,
      );
      onRowsChange(accepted);
      clearStoredDraft();
      setInputs(new Map());
      setDrafts([]);
      setDraftBases(new Map());
      setPast([]);
      setFuture([]);
      setErrors([]);
      setMessage('저장했어요.');
    } catch (e) {
      if (!controller.signal.aborted) {
        setMessage(
          '변경 사항을 저장하지 못했어요. 입력은 남아 있으니 다시 저장해 주세요.',
        );
        onSaveError?.(e);
      }
    } finally {
      saveController.current = null;
      if (!controller.signal.aborted) setSaving(false);
    }
  };
  const clipboard = (
    event: ClipboardEvent,
    action: 'copy' | 'cut' | 'paste',
  ) => {
    if (
      !(event.target instanceof Node) ||
      !engine.current?.element?.contains(event.target)
    )
      return;
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return;
    if (!bounds) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      const selectionRows = rangeRows.slice(bounds.top, bounds.bottom + 1),
        selectionColumns = visibleColumns.slice(bounds.left, bounds.right + 1);
      if (action !== 'paste') {
        event.clipboardData.setData(
          'text/plain',
          formatGridClipboard(
            selectionRows.map((row) =>
              selectionColumns.map((c) => gridValue(row, c)),
            ),
          ),
        );
        if (action === 'copy') return;
      }
      if (!canEdit) return;
      const matrix =
        action === 'cut'
          ? [['']]
          : parseGridClipboard(event.clipboardData.getData('text/plain'));
      const single = matrix.length === 1 && matrix[0]!.length === 1;
      const rh = single ? selectionRows.length : matrix.length,
        cw = single ? selectionColumns.length : matrix[0]!.length;
      if (
        bounds.top + rh > rangeRows.length ||
        bounds.left + cw > visibleColumns.length
      )
        throw new Error('현재 보이는 행과 열 안에 붙여넣어 주세요.');
      if (rh * cw > 100_000)
        throw new Error(
          '한 번에 100,000셀까지 변경할 수 있어요. 범위를 나누어 주세요.',
        );
      const changes = [];
      for (let r = 0; r < rh; r++)
        for (let c = 0; c < cw; c++) {
          const row = rangeRows[bounds.top + r]!,
            column = visibleColumns[bounds.left + c]!;
          if (!gridEditable(row, column))
            throw new Error(
              `${column.header}: 수정할 수 없는 셀이 포함돼 있어요.`,
            );
          changes.push({
            rowId: getRowId(row),
            columnKey: column.key,
            value: parseGridValue(
              matrix[single ? 0 : r]![single ? 0 : c]!,
              row,
              column,
            ),
          });
        }
      commit(changes);
    } catch (e) {
      setMessage(
        `작업 실패: ${e instanceof Error ? e.message : '복사한 값을 확인해 주세요.'}`,
      );
    }
  };
  const toggleExpanded = (id: unknown) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
    setRange(null);
  };
  const expandAll = () => {
    const ids = new Set<unknown>();
    if (tree)
      for (const [id, children] of tree.children) {
        if (id !== null && children.length) ids.add(id);
      }
    else {
      const visit = (items: readonly R[], level: number, parent?: string) => {
        const key = groupBy[level];
        if (!key) return;
        for (const [value, group] of Object.entries(rowGrouper(items, key))) {
          const id = groupId(value, parent);
          ids.add(id);
          visit(group, level + 1, id);
        }
      };
      visit(pageRows, 0);
    }
    setExpanded(ids);
  };
  const engineColumns: Column<R, GridSummary>[] = [
    { ...SelectColumn, name: '행 선택', frozen: true, draggable: false },
    ...visibleColumns.map((column): Column<R, GridSummary> => ({
      ...column,
      name: column.header,
      sortable: column.sortable !== false,
      resizable: column.resizable !== false,
      draggable: column.draggable !== false,
      editable: (row) => canEdit && gridEditable(row, column),
      editorOptions: { ...column.editorOptions, commitOnOutsideClick: false },
      renderEditCell: (props) => (
        <GridEditor
          {...props}
          definition={column}
          validateRow={validateRow}
          initialText={
            inputs.get(
              gridCellKey({
                rowId: getRowId(props.row),
                columnKey: column.key,
              }),
            )?.text
          }
          onTextChange={(text) => {
            const rowId = getRowId(props.row),
              key = gridCellKey({ rowId, columnKey: column.key });
            setInputs((current) => {
              const previous =
                current.get(key) ?? drafts.find((c) => gridCellKey(c) === key);
              return new Map(current).set(key, {
                rowId,
                columnKey: column.key,
                text,
                previousValue: previous
                  ? previous.previousValue
                  : gridValue(sourceById.get(rowId)!, column),
              });
            });
            setDraftBases((current) =>
              new Map(current).set(
                rowId,
                current.get(rowId) ?? sourceById.get(rowId)!,
              ),
            );
          }}
          onCancel={() => {
            const key = gridCellKey({
              rowId: getRowId(props.row),
              columnKey: column.key,
            });
            setInputs((current) => {
              const next = new Map(current);
              next.delete(key);
              return next;
            });
            setErrors((current) =>
              current.filter((e) => gridCellKey(e) !== key),
            );
          }}
          onApply={() =>
            commit(
              [
                {
                  rowId: getRowId(props.row),
                  columnKey: column.key,
                  value: gridValue(props.row, column),
                },
              ],
              true,
            ) !== undefined
          }
          onRequestSave={() => void save()}
          onInvalid={(message) =>
            setErrors((current) => [
              ...current.filter(
                (e) =>
                  e.rowId !== getRowId(props.row) || e.columnKey !== column.key,
              ),
              { rowId: getRowId(props.row), columnKey: column.key, message },
            ])
          }
        />
      ),
      cellClass: (row) =>
        [
          typeof column.cellClass === 'function'
            ? column.cellClass(row)
            : column.cellClass,
          rangeIds.has(getRowId(row)) && rangeKeys.has(column.key)
            ? 'mega-pro-grid__range'
            : '',
          dirtyKeys.has(
            gridCellKey({ rowId: getRowId(row), columnKey: column.key }),
          )
            ? 'mega-pro-grid__dirty'
            : '',
          errorMap.has(
            gridCellKey({ rowId: getRowId(row), columnKey: column.key }),
          )
            ? 'mega-pro-grid__invalid'
            : '',
        ]
          .filter(Boolean)
          .join(' '),
      renderCell: (props) => {
        const input =
          !viewer &&
          inputs.get(
            gridCellKey({ rowId: getRowId(props.row), columnKey: column.key }),
          );
        const content = input
          ? input.text
          : column.renderCell
            ? column.renderCell(props)
            : String(gridValue(props.row, column) ?? '');
        if (tree && column.key === (treeColumnKey ?? visibleColumns[0]?.key)) {
          const id = getRowId(props.row),
            children = tree.children.get(id);
          return (
            <span
              style={{
                paddingInlineStart: ((tree.depth.get(id) ?? 1) - 1) * 20,
              }}
            >
              {children?.length ? (
                <button
                  type="button"
                  tabIndex={props.tabIndex}
                  aria-label={`${String(gridValue(props.row, column))} ${expanded.has(id) ? '접기' : '펼치기'}`}
                  aria-expanded={expanded.has(id)}
                  onClick={() => toggleExpanded(id)}
                >
                  {expanded.has(id) ? '▾' : '▸'}
                </button>
              ) : (
                <span aria-hidden="true">　</span>
              )}
              {content}
            </span>
          );
        }
        return content;
      },
      renderSummaryCell: (props) =>
        column.renderSummaryCell?.(props) ??
        (column.aggregate
          ? String(props.row[column.key] ?? '')
          : column.key === visibleColumns[0]?.key
            ? '조회 결과 합계'
            : ''),
      renderGroupCell: (props) =>
        column.renderGroupCell?.(props) ??
        (groupBy[props.row.level] === column.key ? (
          <button
            type="button"
            tabIndex={props.tabIndex}
            onClick={props.toggleGroup}
            aria-expanded={props.isExpanded}
          >
            {props.isExpanded ? '▾' : '▸'} {String(props.groupKey) || '(빈 값)'}{' '}
            · {props.childRows.length}건
          </button>
        ) : column.aggregate ? (
          String(summarizeGridRows(props.childRows, [column])[column.key] ?? '')
        ) : null),
    })),
  ];
  const engineProps: EngineProps<R, GridSummary, string> = {
    ref: engine,
    columns: engineColumns,
    rows: tree ? tree.visible : pageRows,
    rowKeyGetter: getRowId,
    selectedRows: selected,
    onSelectedRowsChange: selectRows,
    sortColumns: view.sorts,
    onSortColumnsChange: (sorts) => updateView({ sorts }),
    rowHeight,
    headerRowHeight: 44,
    summaryRowHeight: 40,
    style: { height: Number.isFinite(height) && height > 0 ? height : 560 },
    direction,
    className: 'mega-pro-grid__canvas',
    'aria-label': label,
    'aria-describedby': helpId,
    bottomSummaryRows: columns.some((c) => c.aggregate) ? [summary] : undefined,
    onColumnsReorder: reorder,
    onColumnResize: (column, width) => changeColumn(column.key, { width }),
    onRowsChange: viewer
      ? undefined
      : (next, { indexes, column }) =>
          commit(
            indexes.map((i) => ({
              rowId: getRowId(next[i]!),
              columnKey: column.key,
              value: gridValue(next[i]!, columnByKey.get(column.key)!),
            })),
            true,
          ),
    onFill: !canEdit
      ? undefined
      : ({ columnKey, sourceRow, targetRow }) => {
          const column = columnByKey.get(columnKey)!;
          return gridEditable(targetRow, column)
            ? setGridValue(targetRow, column, gridValue(sourceRow, column))
            : targetRow;
        },
    onCellPaste: ({ row }) => row,
    onCellMouseDown: ({ row, column }, event) => {
      if (column.key === SelectColumn.key) return;
      const cell = { rowId: getRowId(row), columnKey: column.key };
      dragging.current = event.button === 0;
      preserveRange.current = true;
      setRange((current) => ({
        anchor: event.shiftKey && current ? current.anchor : cell,
        end: cell,
      }));
    },
    onActivePositionChange: ({ row, column }) => {
      if (preserveRange.current) {
        preserveRange.current = false;
        return;
      }
      if (row && column && column.key !== SelectColumn.key) {
        const cell = { rowId: getRowId(row), columnKey: column.key };
        setRange({ anchor: cell, end: cell });
      }
    },
    onCellKeyDown: (args, event) => {
      if (event.nativeEvent.isComposing || event.keyCode === 229) {
        event.preventGridDefault();
        return;
      }
      if (args.mode === 'EDIT') return;
      if (
        (event.ctrlKey || event.metaKey) &&
        ['Home', 'End', 'a'].includes(event.key) &&
        rangeRows.length &&
        visibleColumns.length
      ) {
        event.preventDefault();
        event.preventGridDefault();
        const first = {
          rowId: getRowId(rangeRows[0]!),
          columnKey: visibleColumns[0]!.key,
        };
        const last = {
          rowId: getRowId(rangeRows.at(-1)!),
          columnKey: visibleColumns.at(-1)!.key,
        };
        if (event.key === 'a') {
          setRange({ anchor: first, end: last });
          return;
        }
        const target = event.key === 'Home' ? first : last;
        preserveRange.current = true;
        setRange({
          anchor: event.shiftKey && range ? range.anchor : target,
          end: target,
        });
        const element = engine.current?.element;
        if (element)
          element.scrollTop = event.key === 'Home' ? 0 : element.scrollHeight;
        args.setActivePosition({
          rowIdx: rowPositions.get(target.rowId)!,
          idx: event.key === 'Home' ? 1 : visibleColumns.length,
        });
        return;
      }
      if (
        !viewer &&
        (event.ctrlKey || event.metaKey) &&
        ['z', 'y', 's'].includes(event.key.toLowerCase())
      ) {
        event.preventDefault();
        event.preventGridDefault();
        if (event.key.toLowerCase() === 's') void save();
        else history(event.key.toLowerCase() === 'y' || event.shiftKey);
        return;
      }
      if (
        tree &&
        args.row &&
        args.column?.key === (treeColumnKey ?? visibleColumns[0]?.key) &&
        ['ArrowLeft', 'ArrowRight'].includes(event.key)
      ) {
        const id = getRowId(args.row);
        if (tree.children.has(id)) {
          event.preventGridDefault();
          event.preventDefault();
          if ((event.key === 'ArrowRight') !== expanded.has(id))
            toggleExpanded(id);
          return;
        }
      }
      if (
        event.shiftKey &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
          event.key,
        ) &&
        range
      ) {
        const r = rangeRows.findIndex(
            (row) => getRowId(row) === range.end.rowId,
          ),
          c = visibleColumns.findIndex(
            (column) => column.key === range.end.columnKey,
          );
        if (r < 0 || c < 0) return;
        const nr = Math.max(
            0,
            Math.min(
              rangeRows.length - 1,
              r +
                (event.key === 'ArrowDown'
                  ? 1
                  : event.key === 'ArrowUp'
                    ? -1
                    : 0),
            ),
          ),
          nc = Math.max(
            0,
            Math.min(
              visibleColumns.length - 1,
              c +
                (event.key === 'ArrowRight'
                  ? direction === 'rtl'
                    ? -1
                    : 1
                  : event.key === 'ArrowLeft'
                    ? direction === 'rtl'
                      ? 1
                      : -1
                    : 0),
            ),
          );
        event.preventDefault();
        event.preventGridDefault();
        setRange({
          ...range,
          end: {
            rowId: getRowId(rangeRows[nr]!),
            columnKey: visibleColumns[nc]!.key,
          },
        });
        preserveRange.current = true;
        args.setActivePosition({
          rowIdx: rowPositions.get(getRowId(rangeRows[nr]!))!,
          idx: nc + 1,
        });
      }
    },
    renderers: {
      renderSortStatus: ({ sortDirection, priority }) =>
        sortDirection ? (
          <span>
            <span aria-hidden="true">
              {sortDirection === 'ASC' ? ' ↑' : ' ↓'}
              {priority}
            </span>
            <span className="mega-visually-hidden">
              {priority ? `${priority}순위 ` : ''}
              {sortDirection === 'ASC' ? '오름차순' : '내림차순'}
            </span>
          </span>
        ) : null,
      renderCell: (key, props) => (
        <Cell
          key={key}
          {...props}
          data-pro-row={getRowId(props.row)}
          data-pro-column={props.column.key}
          aria-selected={
            rangeIds.has(getRowId(props.row)) && rangeKeys.has(props.column.key)
          }
          aria-invalid={
            errorMap.has(
              gridCellKey({
                rowId: getRowId(props.row),
                columnKey: props.column.key,
              }),
            ) || undefined
          }
          title={errorMap.get(
            gridCellKey({
              rowId: getRowId(props.row),
              columnKey: props.column.key,
            }),
          )}
        />
      ),
      renderRow: (key, props) => (
        <Row
          key={key}
          {...props}
          style={
            {
              '--mega-pro-row-top': `${props.rowIdx * rowHeight}px`,
            } as CSSProperties
          }
          aria-level={tree?.depth.get(getRowId(props.row))}
          aria-expanded={
            tree?.children.has(getRowId(props.row))
              ? expanded.has(getRowId(props.row))
              : undefined
          }
        />
      ),
      noRowsFallback: (
        <div className="mega-pro-grid__empty" role="status">
          {loading
            ? '데이터를 불러오고 있어요.'
            : error
              ? '데이터를 불러오지 못했어요.'
              : '조건에 맞는 데이터가 없어요.'}
        </div>
      ),
      renderCheckbox: (props) => (
        <Checkbox
          shape="square"
          checked={props.checked}
          indeterminate={props.indeterminate}
          disabled={props.disabled}
          tabIndex={props.tabIndex}
          aria-label={
            props['aria-label'] === 'Select All'
              ? '현재 표시 행 전체 선택'
              : '행 선택'
          }
          onChange={(e) =>
            props.onChange(
              e.target.checked,
              (e.nativeEvent as MouseEvent).shiftKey ?? false,
            )
          }
        />
      ),
    },
  };
  if (new Set(rows.map(getRowId)).size !== rows.length)
    throw new Error('DataGridPro: 행 ID가 중복되었습니다.');
  if (
    new Set(columns.map((c) => c.key)).size !== columns.length ||
    columns.some((c) => c.key === SelectColumn.key)
  )
    throw new Error('DataGridPro: 열 키가 중복되거나 예약된 키입니다.');
  if (getParentId && (manual || view.groupBy.length))
    throw new Error(
      'DataGridPro: 부모 트리는 서버 페이지 및 그룹과 함께 사용할 수 없습니다.',
    );
  const exportCsv = async (selectedOnly: boolean) => {
    if (exporting) return;
    if (onExport) {
      setExporting(true);
      try {
        await onExport({
          view,
          selectedIds: selectedOnly ? selected : undefined,
        });
        setMessage('파일 내보내기를 마쳤어요.');
      } catch {
        setMessage('파일을 내보내지 못했어요. 다시 시도해 주세요.');
      } finally {
        setExporting(false);
      }
      return;
    }
    const content = createGridCsv(
      selectedOnly
        ? resultRows.filter((row) => selected.has(getRowId(row)))
        : resultRows,
      visibleColumns,
    );
    const url = URL.createObjectURL(
      new Blob([content], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.replace(/[\\/:*?"<>|]/g, '-')}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return (
    <section
      {...sectionProps}
      className={`mega-pro-grid ${className}`}
      aria-label={`${label} 작업 영역`}
      aria-busy={saving || loading}
      onCopyCapture={(e) => clipboard(e, 'copy')}
      onCutCapture={(e) => clipboard(e, 'cut')}
      onPasteCapture={(e) => clipboard(e, 'paste')}
      onPointerOver={(event) => {
        sectionProps.onPointerOver?.(event);
        if (event.defaultPrevented || !dragging.current || !range) return;
        const cell = (event.target as HTMLElement).closest<HTMLElement>(
          '[data-pro-row][data-pro-column]',
        );
        if (cell?.dataset.proRow && cell.dataset.proColumn !== SelectColumn.key)
          setRange({
            ...range,
            end: {
              rowId: cell.dataset.proRow,
              columnKey: cell.dataset.proColumn!,
            },
          });
      }}
    >
      <fieldset className="mega-pro-grid__toolbar" disabled={saving}>
        <legend className="mega-visually-hidden">그리드 도구</legend>
        <Input
          type="search"
          aria-label={`${label} 검색`}
          placeholder="전체 열 검색"
          value={view.query}
          onChange={(e) => updateView({ query: e.target.value })}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
        >
          필터 {view.filters.length || ''}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSettings(!settings)}
          aria-expanded={settings}
        >
          열 설정
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={exporting}
          onClick={() => void exportCsv(false)}
        >
          {manual && !onExport ? '현재 페이지 CSV 내보내기' : 'CSV 내보내기'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!selected.size || exporting}
          onClick={() => void exportCsv(true)}
        >
          {manual && !onExport
            ? '현재 페이지 선택 행 내보내기'
            : '선택 행 내보내기'}
        </Button>
        {!viewer && (
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={!past.length}
              onClick={() => history(false)}
            >
              실행 취소
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!future.length}
              onClick={() => history(true)}
            >
              다시 실행
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!dirty}
              onClick={() => setDiscardOpen(true)}
            >
              변경 취소
            </Button>
            <Button
              size="sm"
              disabled={!dirty || !!conflicts.length}
              onClick={() => void save()}
            >
              변경 저장{drafts.length ? ` (${drafts.length})` : ''}
            </Button>
          </>
        )}
      </fieldset>
      {!viewer && storageError && (
        <p role="alert" className="mega-pro-grid__notice">
          {storageError}
        </p>
      )}
      {!viewer && recovery && (
        <div role="alert" className="mega-pro-grid__notice">
          이 브라우저에 저장하지 않은 초안이 있어요. 복구할까요?{' '}
          <Button
            size="sm"
            disabled={loading || !onRowsChange}
            onClick={() => {
              setDrafts(recovery.changes);
              setInputs(
                new Map(
                  recovery.inputs.map((input) => [gridCellKey(input), input]),
                ),
              );
              setDraftBases(
                new Map(recovery.bases.map((row) => [getRowId(row), row])),
              );
              setRecovery(null);
              setMessage(
                '초안을 복구했어요. 변경 사항을 확인한 뒤 저장해 주세요.',
              );
            }}
          >
            초안 복구
          </Button>{' '}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              clearStoredDraft();
              setRecovery(null);
            }}
          >
            보관된 초안 삭제
          </Button>
        </div>
      )}
      {!viewer && discardOpen && (
        <div role="alert" className="mega-pro-grid__notice">
          저장하지 않은 변경과 편집 중인 입력을 모두 취소할까요?{' '}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDiscardOpen(false)}
          >
            계속 편집
          </Button>{' '}
          <Button
            size="sm"
            onClick={() => {
              clearStoredDraft();
              setInputs(new Map());
              setDrafts([]);
              setDraftBases(new Map());
              setPast([]);
              setFuture([]);
              setErrors([]);
              setDiscardOpen(false);
              setMessage('변경 사항을 취소했어요.');
            }}
          >
            변경 취소 확인
          </Button>
        </div>
      )}
      {filtersOpen && (
        <fieldset className="mega-pro-grid__panel" disabled={saving}>
          <legend>열 필터 · 모든 조건 일치</legend>
          <div className="mega-pro-grid__toolbar">
            <Select
              aria-label="필터 열"
              value={filterKey}
              onChange={(e) => setFilterKey(e.target.value)}
            >
              {columns
                .filter((c) => c.filterable !== false)
                .map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.header}
                  </option>
                ))}
            </Select>
            <Select
              aria-label="필터 연산"
              value={filterOperator}
              onChange={(e) =>
                setFilterOperator(e.target.value as GridFilterOperator)
              }
            >
              {Object.entries(filterLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              aria-label="필터 값"
              value={filterText}
              disabled={
                filterOperator === 'empty' || filterOperator === 'notEmpty'
              }
              onChange={(e) => setFilterText(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!filterKey}
              onClick={() =>
                updateView({
                  filters: [
                    ...view.filters,
                    {
                      columnKey: filterKey,
                      operator: filterOperator,
                      value: filterText,
                    },
                  ],
                })
              }
            >
              조건 추가
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updateView({ filters: [], query: '' })}
            >
              검색 초기화
            </Button>
          </div>
          <ul>
            {view.filters.map((filter, index) => (
              <li key={index}>
                {columnByKey.get(filter.columnKey)?.header}{' '}
                {filterLabels[filter.operator]} {filter.value}{' '}
                <button
                  type="button"
                  aria-label={`${index + 1}번째 필터 삭제`}
                  onClick={() =>
                    updateView({
                      filters: view.filters.filter((_, i) => i !== index),
                    })
                  }
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      {settings && (
        <fieldset className="mega-pro-grid__panel" disabled={saving}>
          <legend>열 표시 · 고정 · 순서 · 그룹</legend>
          <div className="mega-pro-grid__columns">
            {columnState.map((state, index) => {
              const column = columnByKey.get(state.key)!;
              return (
                <div key={state.key}>
                  <Checkbox
                    checked={!state.hidden}
                    disabled={
                      (!state.hidden && visibleColumns.length === 1) ||
                      groupBy.includes(state.key)
                    }
                    onChange={(e) =>
                      changeColumn(state.key, { hidden: !e.target.checked })
                    }
                  >
                    {column.header}
                  </Checkbox>
                  <Select
                    aria-label={`${column.header} 고정`}
                    value={
                      (state.frozen ?? column.frozen) === true
                        ? 'start'
                        : String(state.frozen ?? column.frozen ?? false)
                    }
                    onChange={(e) =>
                      changeColumn(state.key, {
                        frozen:
                          e.target.value === 'false'
                            ? false
                            : (e.target.value as 'start' | 'end'),
                      })
                    }
                  >
                    <option value="false">고정 안 함</option>
                    <option value="start">시작 고정</option>
                    <option value="end">끝 고정</option>
                  </Select>
                  <Input
                    aria-label={`${column.header} 너비`}
                    type="number"
                    min={column.minWidth ?? 50}
                    max={column.maxWidth ?? 10000}
                    value={
                      state.width ??
                      (typeof column.width === 'number' ? column.width : 160)
                    }
                    onChange={(e) => {
                      const width = Number(e.target.value);
                      if (
                        width >= (column.minWidth ?? 50) &&
                        width <= (column.maxWidth ?? 10000)
                      )
                        changeColumn(state.key, { width });
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`${column.header} 앞으로`}
                    disabled={index === 0}
                    onClick={() =>
                      reorder(state.key, columnState[index - 1]!.key)
                    }
                  >
                    앞으로
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`${column.header} 뒤로`}
                    disabled={index === columnState.length - 1}
                    onClick={() =>
                      reorder(state.key, columnState[index + 1]!.key)
                    }
                  >
                    뒤로
                  </Button>
                  {!getParentId && column.groupable !== false && (
                    <Checkbox
                      checked={groupBy.includes(state.key)}
                      onChange={(e) => {
                        setExpanded(new Set());
                        updateView({
                          groupBy: e.target.checked
                            ? [...groupBy, state.key]
                            : groupBy.filter((k) => k !== state.key),
                        });
                      }}
                    >
                      {column.header} 그룹
                    </Checkbox>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => updateView({ columns: [], groupBy: [], sorts: [] })}
          >
            열·그룹·정렬 초기화
          </Button>
        </fieldset>
      )}
      {(groupBy.length > 0 || tree) && (
        <div className="mega-pro-grid__toolbar">
          <span>
            {tree
              ? '계층 보기'
              : `그룹: ${groupBy.map((k) => columnByKey.get(k)?.header).join(' → ')}`}
          </span>
          <Button size="sm" variant="secondary" onClick={expandAll}>
            모두 펼치기
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setExpanded(new Set())}
          >
            모두 접기
          </Button>
        </div>
      )}
      {error && (
        <div role="alert" className="mega-pro-grid__notice">
          {error}
          {onRetry && (
            <Button size="sm" onClick={onRetry}>
              다시 불러오기
            </Button>
          )}
        </div>
      )}
      {groupBy.length ? (
        <TreeDataGrid
          key={viewer ? 'viewer' : 'editor'}
          {...engineProps}
          rowHeight={rowHeight}
          columns={engineColumns}
          groupBy={groupBy}
          rowGrouper={rowGrouper}
          expandedGroupIds={expanded}
          onExpandedGroupIdsChange={(ids) => {
            setExpanded(ids);
            setRange(null);
          }}
          groupIdGetter={groupId}
        />
      ) : (
        <EngineGrid
          key={viewer ? 'viewer' : 'editor'}
          {...engineProps}
          role={tree ? 'treegrid' : 'grid'}
        />
      )}
      <div className="mega-pro-grid__footer">
        <span>
          조회 {total.toLocaleString('ko')}건 · 선택{' '}
          {selected.size.toLocaleString('ko')}건
          {viewer ? ' · 조회 전용' : ` · 변경 ${drafts.length}셀`}
          {!viewer && inputs.size > 0 ? ` · 편집 중 ${inputs.size}셀` : ''}
          {manual ? ' · 서버 조회' : ''}
        </span>
        {!getParentId && (
          <div className="mega-pro-grid__toolbar">
            <Select
              aria-label="페이지 크기"
              value={pageSize}
              disabled={saving}
              onChange={(e) => updateView({ pageSize: Number(e.target.value) })}
            >
              {[
                ...new Set([
                  25,
                  50,
                  100,
                  500,
                  ...(!manual ? [0] : []),
                  pageSize,
                ]),
              ].map((size) => (
                <option key={size} value={size}>
                  {size ? `${size}행` : '전체 행'}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1 || loading || saving}
              onClick={() => updateView({ page: page - 1 }, false)}
            >
              이전 페이지
            </Button>
            <span>
              {page} / {pages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= pages || loading || saving}
              onClick={() => updateView({ page: page + 1 }, false)}
            >
              다음 페이지
            </Button>
          </div>
        )}
      </div>
      {viewer && dirty && (
        <p className="mega-pro-grid__notice">
          미저장 변경은 유지하고 있어요. 편집 모드에서 저장하거나 취소할 수
          있어요.
        </p>
      )}
      <p id={helpId} className="mega-pro-grid__help">
        {viewer
          ? '조회 전용 · 방향키로 이동 · Shift+방향키 또는 드래그로 범위 선택 · Ctrl/⌘+C로 복사 · Ctrl/⌘+헤더 클릭으로 다중 정렬'
          : '방향키로 이동 · Enter/F2로 편집 · Shift+방향키 또는 드래그로 범위 선택 · Ctrl/⌘+C/V · Ctrl/⌘+Z · Ctrl/⌘+S · Ctrl/⌘+헤더 클릭으로 다중 정렬'}
      </p>
      <div role="status" aria-live="polite" className="mega-pro-grid__message">
        {message || (loading ? '데이터를 불러오고 있어요.' : '')}
        {bounds &&
          ` · 선택 범위 ${bounds.bottom - bounds.top + 1}행 × ${bounds.right - bounds.left + 1}열`}
      </div>
      {!viewer && (errors.length > 0 || conflicts.length > 0) && (
        <ul role="alert" className="mega-pro-grid__errors">
          {[...errorMap].slice(0, 20).map(([key, message]) => (
            <li key={key}>
              {JSON.parse(key)[0]} ·{' '}
              {columnByKey.get(JSON.parse(key)[1])?.header}: {message}
            </li>
          ))}
          {errorMap.size > 20 && <li>외 {errorMap.size - 20}개 오류</li>}
        </ul>
      )}
    </section>
  );
}
