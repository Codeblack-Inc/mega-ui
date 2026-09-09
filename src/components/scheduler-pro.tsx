import {
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { Portal } from './foundations';
import { Button, Checkbox, Input, Select, Textarea } from './controls';
import { Alert } from './surfaces';
import { Dialog } from './overlay';
import {
  expandScheduler,
  parseSchedulerIcs,
  schedulerConflicts,
  schedulerOutsideHours,
  schedulerShift,
  schedulerToUtc,
  schedulerToWall,
  schedulerWeekday,
  serializeSchedulerIcs,
  updateScheduler,
  validateScheduler,
  type SchedulerAction,
  type SchedulerData,
  type SchedulerEvent,
  type SchedulerException,
  type SchedulerOccurrence,
  type SchedulerRecurrence,
} from './scheduler-model';

export type SchedulerView = 'day' | 'week' | 'month' | 'resource';
export interface SchedulerProProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'onChange'
> {
  value: SchedulerData;
  onChange?: (
    value: SchedulerData,
    action: SchedulerAction | { type: 'replace' },
  ) => void;
  onSave?: (value: SchedulerData) => Promise<void>;
  label?: string;
  defaultView?: SchedulerView;
  /** `YYYY-MM-DD` the first view opens on. Default: today in the calendar's zone. */
  defaultDate?: string;
  /** Time zones offered for reading the calendar. Default: the calendar's own zone and the browser's. */
  timeZones?: readonly string[];
  editable?: boolean;
  showTools?: boolean;
  /** Drag and keyboard snap in minutes. Default 15. */
  step?: number;
  renderEvent?: (occurrence: SchedulerOccurrence) => ReactNode;
}
type Editor = {
  eventId?: string;
  date?: string;
  scope: 'one' | 'all';
  title: string;
  allDay: boolean;
  start: string;
  end: string;
  resourceId: string;
  notes: string;
  freq: '' | 'daily' | 'weekly' | 'monthly';
  interval: string;
  byWeekday: number[];
  ends: 'never' | 'count' | 'until';
  count: string;
  until: string;
};
type Drag = {
  key: string;
  mode: 'move' | 'resize';
  pointer: number;
  x: number;
  y: number;
  active: boolean;
  grab: number;
  startMs: number;
  endMs: number;
  resourceId?: string;
  changed: boolean;
};
const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const MINUTE = 60_000;
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '일정 데이터 형식을 확인해 주세요.';
const dateLabel = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'UTC', ...options }).format(
    new Date(`${date.slice(0, 10)}T00:00:00Z`),
  );
/** Greedy column packing so overlapping occurrences share the day's width. */
const packColumns = (items: readonly SchedulerOccurrence[]) => {
  const places = new Map<string, { column: number; columns: number }>();
  const sorted = [...items].sort(
    (a, b) => a.startMs - b.startMs || b.endMs - a.endMs,
  );
  let cluster: SchedulerOccurrence[] = [];
  let clusterEnd = -Infinity;
  const flush = () => {
    const ends: number[] = [];
    const assigned = cluster.map((item) => {
      let column = ends.findIndex((end) => end <= item.startMs);
      if (column < 0) column = ends.length;
      ends[column] = item.endMs;
      return { item, column };
    });
    for (const { item, column } of assigned)
      places.set(item.key, { column, columns: ends.length });
    cluster = [];
  };
  for (const item of sorted) {
    if (cluster.length && item.startMs >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMs);
  }
  if (cluster.length) flush();
  return places;
};
const emptyEditor = (start: string, end: string, allDay: boolean): Editor => ({
  scope: 'all',
  title: '',
  allDay,
  start,
  end,
  resourceId: '',
  notes: '',
  freq: '',
  interval: '1',
  byWeekday: [],
  ends: 'never',
  count: '10',
  until: '',
});

export function SchedulerPro({
  value,
  onChange,
  onSave,
  label = '일정',
  defaultView = 'week',
  defaultDate,
  timeZones,
  editable = true,
  showTools = true,
  step = 15,
  renderEvent,
  className = '',
  ref,
  ...props
}: SchedulerProProps) {
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current!, []);
  const id = useId();
  const valid = useMemo(() => {
    try {
      return { data: validateScheduler(value), error: '' };
    } catch {
      return { data: null, error: '일정 데이터 형식을 확인해 주세요.' };
    }
  }, [value]);
  const data = valid.data;
  const zone = data?.timeZone ?? 'UTC';
  const serialized = data ? JSON.stringify(data) : '';
  const [viewZone, setViewZone] = useState(zone);
  const [view, setView] = useState<SchedulerView>(defaultView);
  const [anchor, setAnchor] = useState(
    () => defaultDate ?? schedulerToWall(Date.now(), zone).slice(0, 10),
  );
  const [search, setSearch] = useState('');
  const [resource, setResource] = useState('');
  const [saved, setSaved] = useState(serialized);
  const [savedOnce, setSavedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [formError, setFormError] = useState('');
  const [warned, setWarned] = useState(false);
  const [removing, setRemoving] = useState<SchedulerOccurrence | null>(null);
  const [removeScope, setRemoveScope] = useState<'one' | 'all'>('one');
  const [imported, setImported] = useState<{
    data: SchedulerData;
    notes: readonly string[];
  } | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [history, setHistory] = useState<{ undo: string[]; redo: string[] }>({
    undo: [],
    redo: [],
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const drag = useRef<Drag | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
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
  const snap = Math.min(Math.max(Math.round(step) || 15, 1), 240);

  const columns = useMemo(() => {
    const start =
      view === 'week'
        ? schedulerShift(anchor, -schedulerWeekday(anchor))
        : view === 'month'
          ? (() => {
              const first = `${anchor.slice(0, 7)}-01`;
              return schedulerShift(first, -schedulerWeekday(first));
            })()
          : anchor;
    const days = view === 'week' ? 7 : view === 'month' ? 42 : 1;
    return Array.from({ length: days }, (_, index) =>
      schedulerShift(start, index),
    );
  }, [view, anchor]);
  const rangeStart = columns[0] ?? anchor;
  const rangeEnd = schedulerShift(columns.at(-1) ?? anchor, 1);
  const fromMs = schedulerToUtc(`${rangeStart}T00:00`, viewZone);
  const toMs = schedulerToUtc(`${rangeEnd}T00:00`, viewZone);
  const occurrences = useMemo(
    () => (data ? expandScheduler(data, fromMs, toMs) : []),
    [data, fromMs, toMs],
  );
  const conflicts = useMemo(
    () => schedulerConflicts(occurrences),
    [occurrences],
  );
  const visible = occurrences.filter(
    (item) =>
      (!search ||
        `${item.title} ${item.notes ?? ''}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())) &&
      (!resource ||
        (resource === 'none'
          ? !item.resourceId
          : item.resourceId === resource.slice(9))),
  );
  const resources = data?.resources ?? [];
  const resourceColumns =
    view === 'resource'
      ? resources.filter(
          (item) => !resource || resource === `resource:${item.id}`,
        )
      : [];

  const focusEvent = (key: string) =>
    requestAnimationFrame(() => {
      if (drag.current) return;
      const node = root.current?.querySelector<HTMLElement>(
        `[data-event-key="${CSS.escape(key)}"]`,
      );
      node?.focus();
      node?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  const replace = (
    next: SchedulerData,
    action: SchedulerAction | { type: 'replace' },
    announcement: string,
    remember = true,
  ) => {
    if (!onChange) return false;
    try {
      onChange(next, action);
    } catch {
      setError('일정을 변경하지 못했어요. 다시 시도해 주세요.');
      setFormError('일정을 변경하지 못했어요. 다시 시도해 주세요.');
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
  const change = (action: SchedulerAction, announcement: string) => {
    let next: SchedulerData;
    try {
      next = updateScheduler(latest.current, action);
    } catch (failure) {
      setError(errorText(failure));
      setFormError(errorText(failure));
      setMessage('일정을 변경하지 않았어요.');
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
        validateScheduler(JSON.parse(previous)),
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
  const clock = (ms: number) => schedulerToWall(ms, viewZone).slice(11);
  const spanLabel = (startMs: number, endMs: number, allDay: boolean) =>
    allDay
      ? `${dateLabel(schedulerToWall(startMs, viewZone), { month: 'long', day: 'numeric' })} 종일`
      : `${dateLabel(schedulerToWall(startMs, viewZone), { month: 'long', day: 'numeric' })} ${clock(startMs)}–${clock(endMs)}`;

  /** Applies a move or resize to one occurrence, keeping the rest of the series. */
  const applyTimes = (
    occurrence: SchedulerOccurrence,
    startMs: number,
    endMs: number,
    resourceId: string | undefined,
    announcement: string,
  ) => {
    const event = data?.events.find((item) => item.id === occurrence.eventId);
    if (!event) return false;
    const wall = (ms: number) =>
      event.allDay
        ? schedulerToWall(ms, zone).slice(0, 10)
        : schedulerToWall(ms, zone);
    const start = wall(startMs);
    const end = event.allDay
      ? schedulerShift(
          start,
          Math.max(1, Math.round((endMs - startMs) / 86_400_000)),
        )
      : wall(endMs);
    if (!occurrence.recurring)
      return change(
        { type: 'put-event', event: { ...event, start, end, resourceId } },
        announcement,
      );
    const previous = event.exceptions?.find(
      (item) => item.date === occurrence.date,
    );
    const exception: SchedulerException = {
      ...previous,
      date: occurrence.date,
      start,
      end,
      resourceId,
    };
    delete exception.cancelled;
    return change(
      { type: 'put-occurrence', id: event.id, exception },
      announcement,
    );
  };

  const slotAt = (x: number, y: number) => {
    const element = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>('[data-scheduler-slot]');
    if (!element || !root.current?.contains(element)) return null;
    const date = element.dataset.date!;
    const rect = element.getBoundingClientRect();
    const dayStart = schedulerToUtc(`${date}T00:00`, viewZone);
    const dayEnd = schedulerToUtc(`${schedulerShift(date, 1)}T00:00`, viewZone);
    const ratio = Math.min(Math.max((y - rect.top) / rect.height, 0), 1);
    const minutes = element.dataset.allDay
      ? 0
      : Math.round(((dayEnd - dayStart) * ratio) / MINUTE / snap) * snap;
    return {
      date,
      resourceId: element.dataset.resourceId || undefined,
      allDay: !!element.dataset.allDay,
      ms: dayStart + minutes * MINUTE,
    };
  };
  const finishDrag = (cancel: boolean) => {
    cancelAnimationFrame(animation.current);
    const current = drag.current;
    drag.current = null;
    setDragging(null);
    if (!current?.active) return;
    const occurrence = occurrences.find((item) => item.key === current.key);
    if (cancel || !current.changed || !occurrence) {
      setMessage('이동을 취소했어요.');
      focusEvent(current.key);
      return;
    }
    applyTimes(
      occurrence,
      current.startMs,
      current.endMs,
      current.resourceId,
      current.mode === 'resize'
        ? `${occurrence.title} 일정을 ${spanLabel(current.startMs, current.endMs, occurrence.allDay)}으로 조정했어요.`
        : `${occurrence.title} 일정을 ${spanLabel(current.startMs, current.endMs, occurrence.allDay)}으로 옮겼어요.`,
    );
    focusEvent(current.key);
  };
  const track = () => {
    const current = drag.current;
    if (!current?.active) return;
    if (preview.current)
      preview.current.style.transform = `translate(${Math.min(current.x + 16, innerWidth - 240)}px, ${Math.min(current.y + 16, innerHeight - 90)}px)`;
    const surface = board.current;
    if (surface) {
      const rect = surface.getBoundingClientRect();
      const dy =
        current.y < Math.max(0, rect.top) + 60
          ? -16
          : current.y > Math.min(innerHeight, rect.bottom) - 60
            ? 16
            : 0;
      if (dy) surface.scrollBy(0, dy);
    }
    const slot = slotAt(current.x, current.y);
    const occurrence = occurrences.find((item) => item.key === current.key);
    if (slot && occurrence) {
      const before = `${current.startMs}|${current.endMs}|${current.resourceId}`;
      const duration = occurrence.endMs - occurrence.startMs;
      if (current.mode === 'resize') {
        current.endMs = Math.max(
          occurrence.startMs + snap * MINUTE,
          slot.allDay ? slot.ms + 86_400_000 : slot.ms,
        );
      } else {
        const start =
          slot.allDay || occurrence.allDay ? slot.ms : slot.ms - current.grab;
        current.startMs = start;
        current.endMs = start + duration;
        if (view === 'resource') current.resourceId = slot.resourceId;
      }
      // Compare with the occurrence, not the last frame, so a drop still applies.
      current.changed =
        current.startMs !== occurrence.startMs ||
        current.endMs !== occurrence.endMs ||
        current.resourceId !== occurrence.resourceId;
      // Only the drag preview depends on the proposal, so redraw when it moves.
      if (
        `${current.startMs}|${current.endMs}|${current.resourceId}` !== before
      )
        setTick((count) => count + 1);
    }
    animation.current = requestAnimationFrame(track);
  };
  const startDrag = (
    event: ReactPointerEvent,
    occurrence: SchedulerOccurrence,
    mode: 'move' | 'resize',
  ) => {
    if (!canEdit || event.button !== 0 || drag.current) return;
    const grabbed = slotAt(event.clientX, event.clientY);
    drag.current = {
      key: occurrence.key,
      mode,
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      active: false,
      grab: grabbed ? grabbed.ms - occurrence.startMs : 0,
      startMs: occurrence.startMs,
      endMs: occurrence.endMs,
      resourceId: occurrence.resourceId,
      changed: false,
    };
    dragStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
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
  const nudge = (
    occurrence: SchedulerOccurrence,
    minutes: number,
    mode: 'move' | 'resize',
  ) => {
    const shift = minutes * MINUTE;
    if (mode === 'resize') {
      const end = occurrence.endMs + shift;
      if (end <= occurrence.startMs) {
        setMessage('일정 길이는 시작 시각보다 길어야 해요.');
        return;
      }
      applyTimes(
        occurrence,
        occurrence.startMs,
        end,
        occurrence.resourceId,
        `${occurrence.title} 일정을 ${spanLabel(occurrence.startMs, end, occurrence.allDay)}으로 조정했어요.`,
      );
    } else {
      const start = occurrence.startMs + shift;
      const end = occurrence.endMs + shift;
      applyTimes(
        occurrence,
        start,
        end,
        occurrence.resourceId,
        `${occurrence.title} 일정을 ${spanLabel(start, end, occurrence.allDay)}으로 옮겼어요.`,
      );
    }
    focusEvent(occurrence.key);
  };
  const openEditor = (next: Editor) => {
    setFormError('');
    setWarned(false);
    setEditor(next);
  };
  const editorFor = (
    occurrence: SchedulerOccurrence,
    scope: 'one' | 'all',
  ): Editor | null => {
    const event = data?.events.find((item) => item.id === occurrence.eventId);
    if (!event) return null;
    const rule = event.recurrence;
    const single = scope === 'one' && occurrence.recurring;
    return {
      eventId: event.id,
      date: occurrence.date,
      scope,
      title: single ? occurrence.title : event.title,
      allDay: !!event.allDay,
      start: single ? occurrence.start : event.start,
      end: single ? occurrence.end : event.end,
      resourceId: (single ? occurrence.resourceId : event.resourceId) ?? '',
      notes: event.notes ?? '',
      freq: rule?.freq ?? '',
      interval: String(rule?.interval ?? 1),
      byWeekday: [...(rule?.byWeekday ?? [])],
      ends: rule?.count ? 'count' : rule?.until ? 'until' : 'never',
      count: String(rule?.count ?? 10),
      until: rule?.until ?? '',
    };
  };
  const createAt = (date: string, ms?: number, resourceId?: string) => {
    const start = ms ? schedulerToWall(ms, zone) : `${date}T09:00`;
    const end = schedulerToWall(
      schedulerToUtc(start, zone) + 60 * MINUTE,
      zone,
    );
    openEditor({
      ...emptyEditor(start, end, false),
      resourceId:
        resourceId ??
        (resource.startsWith('resource:') ? resource.slice(9) : ''),
    });
  };
  const editorTimes = (form: Editor) => {
    const startMs = schedulerToUtc(
      form.allDay ? `${form.start.slice(0, 10)}T00:00` : form.start,
      zone,
    );
    const endMs = schedulerToUtc(
      form.allDay ? `${form.end.slice(0, 10)}T00:00` : form.end,
      zone,
    );
    return { startMs, endMs };
  };
  /** Conflict and business-hour warnings for the event the form describes. */
  const formWarnings = (form: Editor): string[] => {
    if (!data) return [];
    const { startMs, endMs } = editorTimes(form);
    if (!(endMs > startMs)) return [];
    const probe: SchedulerOccurrence = {
      key: `${form.eventId ?? 'new'}|${form.start.slice(0, 10)}`,
      eventId: form.eventId ?? 'new',
      date: form.start.slice(0, 10),
      title: form.title,
      start: form.allDay ? form.start.slice(0, 10) : form.start,
      end: form.allDay ? form.end.slice(0, 10) : form.end,
      startMs,
      endMs,
      allDay: form.allDay,
      resourceId: form.resourceId || undefined,
      recurring: !!form.freq,
      changed: false,
    };
    const warnings: string[] = [];
    if (schedulerOutsideHours(probe, data.businessHours))
      warnings.push('업무 시간 밖의 일정이에요.');
    const others = expandScheduler(data, startMs, endMs).filter(
      (item) => item.eventId !== probe.eventId,
    );
    const clash = schedulerConflicts([...others, probe]);
    if (clash.has(probe.key)) {
      const first = others.find(
        (item) =>
          item.resourceId === probe.resourceId &&
          item.startMs < endMs &&
          item.endMs > startMs,
      );
      warnings.push(
        `같은 리소스에 ${first ? `${first.title} 일정이 ` : ''}겹쳐요.`,
      );
    }
    return warnings;
  };
  const submitEditor = (form: Editor) => {
    if (!data) return;
    if (!form.title.trim()) {
      setFormError('일정 제목을 입력해 주세요.');
      return;
    }
    const { startMs, endMs } = editorTimes(form);
    if (!(endMs > startMs)) {
      setFormError('종료는 시작보다 늦게 입력해 주세요.');
      return;
    }
    const warnings = formWarnings(form);
    if (warnings.length && !warned) {
      setWarned(true);
      setFormError(
        `${warnings.join(' ')} 그대로 저장하려면 한 번 더 선택해 주세요.`,
      );
      return;
    }
    const start = form.allDay ? form.start.slice(0, 10) : form.start;
    const end = form.allDay ? form.end.slice(0, 10) : form.end;
    const existing = data.events.find((item) => item.id === form.eventId);
    if (form.scope === 'one' && existing?.recurrence && form.date) {
      const previous = existing.exceptions?.find(
        (item) => item.date === form.date,
      );
      const exception: SchedulerException = {
        ...previous,
        date: form.date,
        start,
        end,
        title: form.title,
        resourceId: form.resourceId || undefined,
      };
      delete exception.cancelled;
      if (
        change(
          { type: 'put-occurrence', id: existing.id, exception },
          `${form.title} 일정을 하루만 변경했어요.`,
        )
      )
        setEditor(null);
      return;
    }
    const recurrence: SchedulerRecurrence | undefined = form.freq
      ? {
          freq: form.freq,
          ...(Number(form.interval) > 1
            ? { interval: Number(form.interval) }
            : {}),
          ...(form.freq === 'weekly' && form.byWeekday.length
            ? { byWeekday: [...form.byWeekday].sort((a, b) => a - b) }
            : {}),
          ...(form.ends === 'count' ? { count: Number(form.count) } : {}),
          ...(form.ends === 'until' && form.until ? { until: form.until } : {}),
        }
      : undefined;
    const event: SchedulerEvent = {
      id:
        form.eventId ??
        `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      title: form.title,
      start,
      end,
      ...(form.allDay ? { allDay: true as const } : {}),
      ...(form.resourceId ? { resourceId: form.resourceId } : {}),
      ...(form.notes.trim() ? { notes: form.notes } : {}),
      ...(recurrence ? { recurrence } : {}),
      ...(existing?.exceptions ? { exceptions: existing.exceptions } : {}),
    };
    if (
      change(
        { type: 'put-event', event },
        existing
          ? `${form.title} 일정을 변경했어요.`
          : `${form.title} 일정을 추가했어요.`,
      )
    )
      setEditor(null);
  };

  const suppressClick = useRef(false);
  // Open the time grid on the working day instead of midnight.
  useEffect(() => {
    if (view === 'month' || !board.current) return;
    const column = board.current.querySelector<HTMLElement>(
      '.mega-scheduler-pro__column',
    );
    const hour = Number(data?.businessHours?.start.slice(0, 2) ?? 8);
    if (column)
      board.current.scrollTop =
        (column.clientHeight * Math.max(0, hour - 1)) / 24 - 8;
  }, [view, data?.businessHours?.start]);
  const hours = Array.from({ length: 24 }, (_, hour) => hour);
  const today = schedulerToWall(Date.now(), viewZone).slice(0, 10);
  const hasAllDay = visible.some((item) => item.allDay);
  const zoneOptions = [
    ...new Set([
      zone,
      ...(timeZones ?? [
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        'UTC',
      ]),
    ]),
  ];
  const rangeLabel =
    view === 'month'
      ? dateLabel(anchor, { year: 'numeric', month: 'long' })
      : view === 'week'
        ? `${dateLabel(rangeStart, { year: 'numeric', month: 'long', day: 'numeric' })} – ${dateLabel(schedulerShift(rangeEnd, -1), { month: 'long', day: 'numeric' })}`
        : dateLabel(anchor, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          });
  const stepDays = view === 'week' ? 7 : view === 'month' ? 0 : 1;
  const moveRange = (direction: -1 | 1) => {
    setAnchor((current) =>
      stepDays
        ? schedulerShift(current, direction * stepDays)
        : (() => {
            const [year = 2026, month = 1] = current.split('-').map(Number);
            const total = year * 12 + (month - 1) + direction;
            return `${String(Math.floor(total / 12)).padStart(4, '0')}-${String((total % 12) + 1).padStart(2, '0')}-01`;
          })(),
    );
  };
  const gridColumns =
    view === 'resource'
      ? resourceColumns.map((item) => ({
          key: item.id,
          date: anchor,
          resourceId: item.id as string | undefined,
          title: item.title,
        }))
      : columns.map((date) => ({
          key: date,
          date,
          resourceId: undefined as string | undefined,
          title: `${dateLabel(date, { month: 'numeric', day: 'numeric' })} (${WEEKDAY_NAMES[schedulerWeekday(date)]})`,
        }));
  const dragged = dragging
    ? occurrences.find((item) => item.key === dragging)
    : undefined;
  const outside = (item: SchedulerOccurrence) =>
    schedulerOutsideHours(item, data?.businessHours);
  const resourceTitle = (resourceId?: string) =>
    resources.find((item) => item.id === resourceId)?.title;
  const columnSlot = (date: string, resourceId?: string) => {
    const dayStart = schedulerToUtc(`${date}T00:00`, viewZone);
    const dayEnd = schedulerToUtc(`${schedulerShift(date, 1)}T00:00`, viewZone);
    const inDay = visible.filter(
      (item) =>
        item.endMs > dayStart &&
        item.startMs < dayEnd &&
        (!resourceId || item.resourceId === resourceId),
    );
    return { dayStart, dayEnd, inDay };
  };
  const bands = (date: string) => {
    const rules = data?.businessHours;
    if (!rules) return [];
    const { dayStart, dayEnd } = columnSlot(date);
    const days = new Set(rules.days);
    return [
      schedulerToWall(dayStart, zone).slice(0, 10),
      schedulerToWall(dayEnd - MINUTE, zone).slice(0, 10),
    ]
      .filter((value, index, list) => list.indexOf(value) === index)
      .filter((workday) => days.has(schedulerWeekday(workday)))
      .map((workday) => {
        const from = Math.max(
          dayStart,
          schedulerToUtc(`${workday}T${rules.start}`, zone),
        );
        const to = Math.min(
          dayEnd,
          schedulerToUtc(`${workday}T${rules.end}`, zone),
        );
        return { workday, from, to, dayStart, dayEnd };
      })
      .filter((band) => band.to > band.from);
  };
  const eventStyle = (
    item: SchedulerOccurrence,
    dayStart: number,
    dayEnd: number,
    place: { column: number; columns: number },
  ) => {
    const total = dayEnd - dayStart;
    const top = ((Math.max(item.startMs, dayStart) - dayStart) / total) * 100;
    const height =
      ((Math.min(item.endMs, dayEnd) - Math.max(item.startMs, dayStart)) /
        total) *
      100;
    return {
      top: `${top}%`,
      height: `${Math.max(height, 2.5)}%`,
      insetInlineStart: `${(place.column / place.columns) * 100}%`,
      width: `${(1 / place.columns) * 100}%`,
    };
  };
  const eventNode = (
    item: SchedulerOccurrence,
    style?: Record<string, string>,
  ) => {
    const conflict = conflicts.has(item.key);
    return (
      <button
        key={style ? item.key : `${item.key}|chip`}
        type="button"
        className="mega-scheduler-pro__event"
        data-event-key={item.key}
        data-conflict={conflict || undefined}
        data-outside={outside(item) || undefined}
        data-dragging={dragging === item.key || undefined}
        data-all-day={item.allDay || undefined}
        style={style}
        aria-describedby={`${id}-help`}
        aria-label={`${item.title}, ${spanLabel(item.startMs, item.endMs, item.allDay)}${item.resourceId ? `, ${resourceTitle(item.resourceId)}` : ''}${conflict ? ', 같은 리소스에 겹치는 일정' : ''}${item.recurring ? ', 반복 일정' : ''}`}
        onPointerDown={(event) => {
          if (
            event.pointerType !== 'touch' &&
            !(event.target as HTMLElement).closest('[data-scheduler-resize]')
          )
            startDrag(event, item, 'move');
        }}
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          const next = editorFor(item, item.recurring ? 'one' : 'all');
          if (next) openEditor(next);
        }}
        onKeyDown={(event) => {
          if (!canEdit || !event.altKey || event.nativeEvent.isComposing)
            return;
          const vertical = item.allDay ? 1440 : snap;
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            nudge(
              item,
              (event.key === 'ArrowUp' ? -1 : 1) * vertical,
              event.shiftKey ? 'resize' : 'move',
            );
          }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            nudge(item, (event.key === 'ArrowLeft' ? -1 : 1) * 1440, 'move');
          }
        }}
      >
        {renderEvent ? (
          renderEvent(item)
        ) : (
          <>
            <strong>{item.title}</strong>
            {!item.allDay && (
              <span>
                {clock(item.startMs)}–{clock(item.endMs)}
              </span>
            )}
            {item.resourceId && <small>{resourceTitle(item.resourceId)}</small>}
          </>
        )}
        {canEdit && !item.allDay && style && (
          <span
            className="mega-scheduler-pro__resize"
            data-scheduler-resize=""
            aria-hidden="true"
            onPointerDown={(event) => {
              event.stopPropagation();
              startDrag(event, item, 'resize');
            }}
          />
        )}
      </button>
    );
  };
  const slotClick = (event: {
    target: EventTarget | null;
    clientX: number;
    clientY: number;
  }) => {
    if (!canEdit) return;
    if ((event.target as HTMLElement).closest('[data-event-key],button'))
      return;
    const slot = slotAt(event.clientX, event.clientY);
    if (slot)
      createAt(slot.date, slot.allDay ? undefined : slot.ms, slot.resourceId);
  };

  const editorOccurrence = editor
    ? occurrences.find(
        (item) => item.eventId === editor.eventId && item.date === editor.date,
      )
    : undefined;
  const warnings = editor ? formWarnings(editor) : [];
  const setForm = (patch: Partial<Editor>) =>
    setEditor((current) => (current ? { ...current, ...patch } : current));

  return (
    <div
      {...props}
      ref={root}
      className={`mega-scheduler-pro ${className}`}
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
            current.x - dragStart.current.x,
            current.y - dragStart.current.y,
          ) > 5
        ) {
          current.active = true;
          window.getSelection()?.removeAllRanges();
          setDragging(current.key);
          setMessage('옮길 시간으로 끌어 주세요. Escape로 취소할 수 있어요.');
          track();
        }
        if (current.active) event.preventDefault();
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event);
        const current = drag.current;
        if (current?.pointer !== event.pointerId) return;
        if (current.active) {
          suppressClick.current = true;
          cancelAnimationFrame(animation.current);
          track();
        }
        finishDrag(false);
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
      {dragging && dragged && (
        <Portal>
          <div
            ref={preview}
            className="mega-scheduler-pro__drag-preview"
            aria-hidden="true"
            style={{
              transform: `translate(${Math.min(drag.current?.x ?? 0, innerWidth - 240)}px, ${Math.min(drag.current?.y ?? 0, innerHeight - 90)}px)`,
            }}
          >
            <strong>{dragged.title}</strong>
            <span>
              {spanLabel(
                drag.current?.startMs ?? dragged.startMs,
                drag.current?.endMs ?? dragged.endMs,
                dragged.allDay,
              )}
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
              <div className="mega-scheduler-pro__toolbar">
                <div>
                  <h2>{label}</h2>
                  <p>
                    {rangeLabel} · 일정 {visible.length}개
                    {conflicts.size ? ` · 겹침 ${conflicts.size}개` : ''}
                  </p>
                </div>
                <div className="mega-scheduler-pro__actions">
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        disabled={!history.undo.length || saving}
                        onClick={() => travel('undo')}
                      >
                        실행 취소
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!history.redo.length || saving}
                        onClick={() => travel('redo')}
                      >
                        다시 실행
                      </Button>
                    </>
                  )}
                  {onSave && (
                    <div
                      className="mega-scheduler-pro__save"
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
                        disabled={!dirty || saving || !saved}
                        onClick={() => setRestoring(true)}
                      >
                        {savedOnce
                          ? '저장한 상태로 되돌리기'
                          : '처음 상태로 되돌리기'}
                      </Button>
                      <Button
                        variant="weak"
                        disabled={(!dirty && savedOnce) || saving}
                        onClick={async () => {
                          if (busy.current) return;
                          busy.current = true;
                          setSaving(true);
                          setError('');
                          try {
                            const snapshot = validateScheduler(latest.current);
                            await onSave(snapshot);
                            if (alive.current) {
                              setSaved(JSON.stringify(snapshot));
                              setSavedOnce(true);
                              setMessage('일정을 저장했어요.');
                            }
                          } catch {
                            if (alive.current)
                              setError(
                                '일정을 저장하지 못했어요. 변경 내용은 화면에 남아 있어요. 다시 저장해 주세요.',
                              );
                          } finally {
                            busy.current = false;
                            if (alive.current) setSaving(false);
                          }
                        }}
                      >
                        {saving ? '저장 중' : '일정 저장'}
                      </Button>
                    </div>
                  )}
                  {canEdit && (
                    <Button onClick={() => createAt(anchor)}>새 일정</Button>
                  )}
                </div>
              </div>
            )}
            {showTools && (
              <div className="mega-scheduler-pro__controls">
                <div className="mega-scheduler-pro__nav">
                  <div className="mega-scheduler-pro__group">
                    <Button
                      variant="outline"
                      onClick={() => moveRange(-1)}
                      aria-label="이전 기간"
                    >
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setAnchor(
                          schedulerToWall(Date.now(), viewZone).slice(0, 10),
                        )
                      }
                    >
                      오늘
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => moveRange(1)}
                      aria-label="다음 기간"
                    >
                      다음
                    </Button>
                  </div>
                  <label className="mega-scheduler-pro__control mega-scheduler-pro__control--date">
                    <span className="mega-visually-hidden">기준 날짜</span>
                    <Input
                      type="date"
                      size="sm"
                      aria-label="기준 날짜"
                      value={anchor}
                      onChange={(event) =>
                        event.target.value && setAnchor(event.target.value)
                      }
                    />
                  </label>
                  <label className="mega-scheduler-pro__control mega-scheduler-pro__control--view">
                    <span className="mega-visually-hidden">보기</span>
                    <Select
                      size="sm"
                      aria-label="달력 보기"
                      value={view}
                      onChange={(event) =>
                        setView(event.target.value as SchedulerView)
                      }
                    >
                      <option value="day">일</option>
                      <option value="week">주</option>
                      <option value="month">월</option>
                      <option value="resource">리소스</option>
                    </Select>
                  </label>
                  <label className="mega-scheduler-pro__control mega-scheduler-pro__control--zone">
                    <span className="mega-visually-hidden">시간대</span>
                    <Select
                      size="sm"
                      aria-label="표시 시간대"
                      value={viewZone}
                      onChange={(event) => setViewZone(event.target.value)}
                    >
                      {zoneOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
                <div className="mega-scheduler-pro__filters">
                  <label className="mega-scheduler-pro__control mega-scheduler-pro__control--search">
                    <span className="mega-visually-hidden">일정 검색</span>
                    <Input
                      type="search"
                      size="sm"
                      aria-label="일정 검색"
                      placeholder="일정 검색"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  <label className="mega-scheduler-pro__control mega-scheduler-pro__control--resource">
                    <span className="mega-visually-hidden">리소스</span>
                    <Select
                      size="sm"
                      aria-label="리소스 필터"
                      value={resource}
                      onChange={(event) => setResource(event.target.value)}
                    >
                      <option value="">전체 리소스</option>
                      <option value="none">리소스 없음</option>
                      {resources.map((item) => (
                        <option key={item.id} value={`resource:${item.id}`}>
                          {item.title}
                        </option>
                      ))}
                    </Select>
                  </label>
                  {(search || resource) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearch('');
                        setResource('');
                      }}
                    >
                      필터 지우기
                    </Button>
                  )}
                  <span role="status">{visible.length}개 표시</span>
                  <div className="mega-scheduler-pro__files">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        let url: string | undefined;
                        try {
                          url = URL.createObjectURL(
                            new Blob([serializeSchedulerIcs(data)], {
                              type: 'text/calendar',
                            }),
                          );
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = 'scheduler.ics';
                          document.body.append(link);
                          try {
                            link.click();
                          } finally {
                            link.remove();
                          }
                        } catch {
                          setError(
                            '일정 파일을 만들지 못했어요. 다시 내려받아 주세요.',
                          );
                        } finally {
                          if (url)
                            setTimeout(() => URL.revokeObjectURL(url!), 1000);
                        }
                      }}
                    >
                      일정 파일 내려받기
                    </Button>
                    {canEdit && (
                      <label className="mega-scheduler-pro__file mega-button mega-button--ghost mega-button--md">
                        일정 파일 불러오기
                        <input
                          aria-label="일정 파일 불러오기"
                          type="file"
                          accept=".ics,text/calendar"
                          disabled={saving}
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            event.target.value = '';
                            if (!file) return;
                            try {
                              if (file.size > 8_000_000)
                                throw new Error(
                                  '일정 파일은 8MB 이내로 불러와 주세요.',
                                );
                              setImported(
                                parseSchedulerIcs(await file.text(), zone),
                              );
                              setError('');
                            } catch {
                              setError(
                                '일정 파일을 불러오지 못했어요. 파일 형식과 크기를 확인해 주세요.',
                              );
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
            {error && (
              <Alert role="alert" tone="danger">
                {error}
              </Alert>
            )}
            <p
              className="mega-visually-hidden"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
            {view === 'month' ? (
              <div
                className="mega-scheduler-pro__month"
                onClick={(event) => slotClick(event)}
              >
                {WEEKDAY_NAMES.map((name) => (
                  <div key={name} className="mega-scheduler-pro__weekday">
                    {name}
                  </div>
                ))}
                {columns.map((date) => {
                  const { inDay } = columnSlot(date);
                  return (
                    <section
                      key={date}
                      className="mega-scheduler-pro__month-cell"
                      data-scheduler-slot=""
                      data-date={date}
                      data-all-day=""
                      data-other-month={
                        date.slice(0, 7) !== anchor.slice(0, 7) || undefined
                      }
                      aria-label={dateLabel(date, {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    >
                      <button
                        type="button"
                        className={`mega-scheduler-pro__day${date === today ? ' mega-scheduler-pro__day--today' : ''}`}
                        onClick={() => {
                          setAnchor(date);
                          setView('day');
                        }}
                        aria-label={`${dateLabel(date, { month: 'long', day: 'numeric' })} 하루 보기`}
                      >
                        {Number(date.slice(8))}
                      </button>
                      {inDay.map((item) => eventNode(item))}
                      {!inDay.length && (
                        <span className="mega-visually-hidden">일정 없음</span>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <div
                className={`mega-scheduler-pro__board${data.businessHours ? ' mega-scheduler-pro__board--hours' : ''}`}
                ref={board}
                style={{
                  ['--mega-scheduler-columns' as string]: String(
                    Math.max(gridColumns.length, 1),
                  ),
                }}
                onClick={(event) => slotClick(event)}
              >
                <div className="mega-scheduler-pro__corner">
                  {hasAllDay && <span>종일</span>}
                </div>
                {gridColumns.map((column) => {
                  const { dayStart, dayEnd, inDay } = columnSlot(
                    column.date,
                    column.resourceId,
                  );
                  const allDayItems = inDay.filter((item) => item.allDay);
                  return (
                    <div
                      key={`head-${column.key}`}
                      className={`mega-scheduler-pro__head${column.date === today && view !== 'resource' ? ' mega-scheduler-pro__head--today' : ''}`}
                    >
                      <h3>{column.title}</h3>
                      <div
                        className="mega-scheduler-pro__allday"
                        data-scheduler-slot=""
                        data-date={column.date}
                        data-resource-id={column.resourceId}
                        data-all-day=""
                        aria-label={`${column.title} 종일 일정`}
                      >
                        {allDayItems.map((item) => eventNode(item))}
                      </div>
                      <span className="mega-visually-hidden">
                        {inDay.length ? `일정 ${inDay.length}개` : '일정 없음'}
                        {dayEnd - dayStart !== 86_400_000
                          ? `, ${Math.round((dayEnd - dayStart) / 3_600_000)}시간인 날`
                          : ''}
                      </span>
                    </div>
                  );
                })}
                <div className="mega-scheduler-pro__hours" aria-hidden="true">
                  {hours.map((hour) => (
                    <span key={hour}>{String(hour).padStart(2, '0')}:00</span>
                  ))}
                </div>
                {gridColumns.map((column) => {
                  const { dayStart, dayEnd, inDay } = columnSlot(
                    column.date,
                    column.resourceId,
                  );
                  const timed = inDay.filter((item) => !item.allDay);
                  const places = packColumns(timed);
                  return (
                    <div
                      key={`body-${column.key}`}
                      className={`mega-scheduler-pro__column${column.date === today && view !== 'resource' ? ' mega-scheduler-pro__column--today' : ''}`}
                      data-scheduler-slot=""
                      data-date={column.date}
                      data-resource-id={column.resourceId}
                      aria-label={column.title}
                    >
                      {bands(column.date).map((band) => (
                        <div
                          key={band.workday}
                          className="mega-scheduler-pro__band"
                          aria-hidden="true"
                          style={{
                            top: `${((band.from - dayStart) / (dayEnd - dayStart)) * 100}%`,
                            height: `${((band.to - band.from) / (dayEnd - dayStart)) * 100}%`,
                          }}
                        />
                      ))}
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="mega-scheduler-pro__hour"
                          aria-hidden="true"
                        />
                      ))}
                      {timed.map((item) =>
                        eventNode(
                          item,
                          eventStyle(
                            item,
                            dayStart,
                            dayEnd,
                            places.get(item.key) ?? { column: 0, columns: 1 },
                          ),
                        ),
                      )}
                    </div>
                  );
                })}
                {view === 'resource' && !resourceColumns.length && (
                  <p className="mega-scheduler-pro__empty">
                    표시할 리소스가 없어요. 리소스를 추가한 뒤 다시 확인해
                    주세요.
                  </p>
                )}
              </div>
            )}
            {!visible.length && (
              <p className="mega-scheduler-pro__empty" role="status">
                이 기간에 표시할 일정이 없어요.
              </p>
            )}
            <p id={`${id}-help`} className="mega-scheduler-pro__hint">
              {canEdit
                ? '빈 시간을 눌러 일정을 만들고, 일정을 끌어 옮기거나 아래 가장자리로 길이를 바꿔요. 일정에 포커스한 뒤 Alt+상하로 시간, Alt+Shift+상하로 길이, Alt+좌우로 날짜를 바꿔요.'
                : '일정을 읽기 전용으로 보고 있어요.'}
              {viewZone !== zone
                ? ` 화면은 ${viewZone}, 편집 폼은 달력 시간대 ${zone} 기준이에요.`
                : ''}
            </p>
          </>
        )
      )}
      <Dialog
        open={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.eventId ? '일정 편집' : '새 일정'}
        size="md"
        actions={
          <>
            {editor?.eventId && editorOccurrence && (
              <Button
                variant="danger"
                onClick={() => {
                  setRemoveScope(editorOccurrence.recurring ? 'one' : 'all');
                  setRemoving(editorOccurrence);
                  setEditor(null);
                }}
              >
                일정 삭제
              </Button>
            )}
            <Button variant="secondary" onClick={() => setEditor(null)}>
              편집 취소
            </Button>
            <Button type="submit" form={`${id}-form`}>
              {warned
                ? '그대로 저장'
                : editor?.eventId
                  ? '일정 변경 적용'
                  : '일정 추가'}
            </Button>
          </>
        }
      >
        {editor && (
          <form
            id={`${id}-form`}
            className="mega-scheduler-pro__form"
            onSubmit={(event) => {
              event.preventDefault();
              submitEditor(editor);
            }}
          >
            <label>
              제목
              <Input
                aria-label="일정 제목"
                value={editor.title}
                required
                maxLength={200}
                onChange={(event) => setForm({ title: event.target.value })}
              />
            </label>
            {editorOccurrence?.recurring && (
              <fieldset className="mega-scheduler-pro__scope">
                <legend>적용 범위</legend>
                {(['one', 'all'] as const).map((scope) => (
                  <label key={scope}>
                    <input
                      type="radio"
                      name={`${id}-scope`}
                      checked={editor.scope === scope}
                      onChange={() => {
                        const next = editorFor(editorOccurrence, scope);
                        if (next) openEditor(next);
                      }}
                    />
                    {scope === 'one' ? '이 일정만' : '반복 전체'}
                  </label>
                ))}
              </fieldset>
            )}
            <Checkbox
              checked={editor.allDay}
              onChange={(event) => {
                const allDay = event.target.checked;
                setForm({
                  allDay,
                  start: allDay
                    ? editor.start.slice(0, 10)
                    : `${editor.start.slice(0, 10)}T09:00`,
                  end: allDay
                    ? schedulerShift(editor.start.slice(0, 10), 1)
                    : `${editor.start.slice(0, 10)}T10:00`,
                });
              }}
            >
              종일 일정
            </Checkbox>
            <div className="mega-scheduler-pro__times">
              <label>
                시작 ({zone})
                <Input
                  type={editor.allDay ? 'date' : 'datetime-local'}
                  value={editor.start}
                  required
                  onChange={(event) => setForm({ start: event.target.value })}
                />
              </label>
              <label>
                종료 ({zone})
                <Input
                  type={editor.allDay ? 'date' : 'datetime-local'}
                  value={editor.end}
                  required
                  onChange={(event) => setForm({ end: event.target.value })}
                />
              </label>
            </div>
            <label>
              리소스
              <Select
                aria-label="일정 리소스"
                value={editor.resourceId}
                onChange={(event) =>
                  setForm({ resourceId: event.target.value })
                }
              >
                <option value="">리소스 없음</option>
                {resources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </label>
            {editor.scope === 'all' && (
              <>
                <label>
                  메모
                  <Textarea
                    aria-label="일정 메모"
                    rows={3}
                    maxLength={5000}
                    value={editor.notes}
                    onChange={(event) => setForm({ notes: event.target.value })}
                  />
                </label>
                <label>
                  반복
                  <Select
                    aria-label="반복 주기"
                    value={editor.freq}
                    onChange={(event) =>
                      setForm({ freq: event.target.value as Editor['freq'] })
                    }
                  >
                    <option value="">반복 없음</option>
                    <option value="daily">매일</option>
                    <option value="weekly">매주</option>
                    <option value="monthly">매월</option>
                  </Select>
                </label>
                {editor.freq && (
                  <div className="mega-scheduler-pro__recurrence">
                    <label>
                      간격
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={editor.interval}
                        onChange={(event) =>
                          setForm({ interval: event.target.value })
                        }
                      />
                    </label>
                    {editor.freq === 'weekly' && (
                      <fieldset>
                        <legend>반복 요일</legend>
                        {WEEKDAY_NAMES.map((name, day) => (
                          <label key={name}>
                            <input
                              type="checkbox"
                              checked={editor.byWeekday.includes(day)}
                              onChange={(event) =>
                                setForm({
                                  byWeekday: event.target.checked
                                    ? [...editor.byWeekday, day]
                                    : editor.byWeekday.filter(
                                        (item) => item !== day,
                                      ),
                                })
                              }
                            />
                            {name}
                          </label>
                        ))}
                      </fieldset>
                    )}
                    <label>
                      반복 종료
                      <Select
                        aria-label="반복 종료 조건"
                        value={editor.ends}
                        onChange={(event) =>
                          setForm({
                            ends: event.target.value as Editor['ends'],
                          })
                        }
                      >
                        <option value="never">종료 없음</option>
                        <option value="count">횟수</option>
                        <option value="until">날짜</option>
                      </Select>
                    </label>
                    {editor.ends === 'count' && (
                      <label>
                        반복 횟수
                        <Input
                          type="number"
                          min={1}
                          max={999}
                          value={editor.count}
                          onChange={(event) =>
                            setForm({ count: event.target.value })
                          }
                        />
                      </label>
                    )}
                    {editor.ends === 'until' && (
                      <label>
                        반복 종료일
                        <Input
                          type="date"
                          value={editor.until}
                          onChange={(event) =>
                            setForm({ until: event.target.value })
                          }
                        />
                      </label>
                    )}
                  </div>
                )}
              </>
            )}
            {warnings.length > 0 && (
              <Alert tone="warning">{warnings.join(' ')}</Alert>
            )}
            {formError && (
              <Alert tone="danger" role="alert">
                {formError}
              </Alert>
            )}
          </form>
        )}
      </Dialog>
      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="일정을 삭제할까요?"
        size="sm"
        description={
          removing
            ? `${removing.title} · ${spanLabel(removing.startMs, removing.endMs, removing.allDay)}`
            : undefined
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              삭제 취소
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!removing) return;
                change(
                  removeScope === 'one' && removing.recurring
                    ? {
                        type: 'delete-occurrence',
                        id: removing.eventId,
                        date: removing.date,
                      }
                    : { type: 'delete-event', id: removing.eventId },
                  removeScope === 'one' && removing.recurring
                    ? `${removing.title} 일정을 하루만 삭제했어요.`
                    : `${removing.title} 일정을 삭제했어요.`,
                );
                setRemoving(null);
              }}
            >
              일정 삭제
            </Button>
          </>
        }
      >
        {removing?.recurring && (
          <fieldset className="mega-scheduler-pro__scope">
            <legend>삭제 범위</legend>
            {(['one', 'all'] as const).map((scope) => (
              <label key={scope}>
                <input
                  type="radio"
                  name={`${id}-remove-scope`}
                  checked={removeScope === scope}
                  onChange={() => setRemoveScope(scope)}
                />
                {scope === 'one' ? '이 일정만' : '반복 전체'}
              </label>
            ))}
          </fieldset>
        )}
      </Dialog>
      <Dialog
        open={!!imported}
        onClose={() => setImported(null)}
        title="일정 파일로 바꿀까요?"
        size="sm"
        description={
          imported
            ? `일정 ${imported.data.events.length}개를 읽었어요. 현재 일정 전체를 바꾸고, 저장하지 않은 변경은 사라져요.`
            : undefined
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setImported(null)}>
              현재 일정 유지
            </Button>
            <Button
              onClick={() => {
                if (
                  imported &&
                  replace(
                    imported.data,
                    { type: 'replace' },
                    '일정 파일로 바꿨어요.',
                  )
                )
                  setImported(null);
              }}
            >
              파일로 교체
            </Button>
          </>
        }
      >
        {imported?.notes.length ? (
          <ul className="mega-scheduler-pro__notes">
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
        description="현재 일정 전체를 바꾸고, 저장하지 않은 변경은 사라져요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setRestoring(false)}>
              현재 일정 유지
            </Button>
            <Button
              onClick={() => {
                try {
                  if (
                    replace(
                      validateScheduler(JSON.parse(saved)),
                      { type: 'replace' },
                      savedOnce
                        ? '저장한 상태로 되돌렸어요.'
                        : '처음 상태로 되돌렸어요.',
                    )
                  )
                    setRestoring(false);
                } catch {
                  setError(
                    '저장한 일정을 불러오지 못했어요. 다시 저장해 주세요.',
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
