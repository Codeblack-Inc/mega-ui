/**
 * Wall-clock scheduling model. Events store local wall times (`YYYY-MM-DDTHH:mm`)
 * in the calendar's IANA time zone, so a repeating 09:00 stays 09:00 across DST.
 */
export interface SchedulerResource {
  id: string;
  title: string;
}
export interface SchedulerRecurrence {
  freq: 'daily' | 'weekly' | 'monthly';
  /** Default 1. */
  interval?: number;
  /** Weekly only. 0 Sunday … 6 Saturday. Default: the start date's weekday. */
  byWeekday?: readonly number[];
  count?: number;
  /** Inclusive `YYYY-MM-DD`. */
  until?: string;
}
/** One changed or cancelled occurrence, keyed by its original start date. */
export interface SchedulerException {
  date: string;
  cancelled?: true;
  start?: string;
  end?: string;
  title?: string;
  resourceId?: string;
}
export interface SchedulerEvent {
  id: string;
  title: string;
  /** `YYYY-MM-DDTHH:mm`, or `YYYY-MM-DD` when allDay. */
  start: string;
  /** Exclusive end in the same shape as start. */
  end: string;
  allDay?: boolean;
  resourceId?: string;
  notes?: string;
  recurrence?: SchedulerRecurrence;
  exceptions?: readonly SchedulerException[];
}
export interface SchedulerBusinessHours {
  /** 0 Sunday … 6 Saturday. */
  days: readonly number[];
  /** `HH:mm`. */
  start: string;
  end: string;
}
export interface SchedulerData {
  version: 1;
  /** IANA name, e.g. `Asia/Seoul`. */
  timeZone: string;
  events: readonly SchedulerEvent[];
  resources: readonly SchedulerResource[];
  businessHours?: SchedulerBusinessHours;
}
export interface SchedulerOccurrence {
  /** `${eventId}|${date}`. Stable across edits of the same occurrence. */
  key: string;
  eventId: string;
  /** Original occurrence start date, before any exception moved it. */
  date: string;
  title: string;
  start: string;
  end: string;
  startMs: number;
  endMs: number;
  allDay: boolean;
  resourceId?: string;
  notes?: string;
  recurring: boolean;
  /** True when an exception changed this occurrence. */
  changed: boolean;
}
export type SchedulerAction =
  | { type: 'put-event'; event: SchedulerEvent }
  | { type: 'delete-event'; id: string }
  | { type: 'put-occurrence'; id: string; exception: SchedulerException }
  | { type: 'delete-occurrence'; id: string; date: string }
  | { type: 'put-resource'; resource: SchedulerResource }
  | { type: 'delete-resource'; id: string };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const WALL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_MS = 86_400_000;
/** Recurrence expansion cap per event, counted from the start date. */
export const SCHEDULER_MAX_OCCURRENCES = 5000;

const pad = (value: number, size = 2) => String(value).padStart(size, '0');
const text = (value: unknown, max = 200): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error(
      `이름은 공백을 제외한 글자를 포함해 ${max}자 이내로 입력해 주세요.`,
    );
  return value;
};
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('일정 데이터 형식을 확인해 주세요.');
  return value as Record<string, unknown>;
};
const array = (value: unknown, max: number): unknown[] => {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    Array.from(value).some((item) => item == null)
  )
    throw new Error(`데이터는 ${max}개 이내의 목록으로 전달해 주세요.`);
  return value;
};
const integer = (value: unknown, min: number, max: number, message: string) => {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    throw new Error(message);
  return value;
};

export function isSchedulerDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    DAY.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function isSchedulerTime(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    WALL.test(value) &&
    isSchedulerDate(value.slice(0, 10)) &&
    CLOCK.test(value.slice(11))
  );
}
export function isSchedulerZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > 100)
    return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const formatters = new Map<string, Intl.DateTimeFormat>();
const zoneParts = (ms: number, timeZone: string) => {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(new Date(ms));
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
};
/** Zone offset in ms at the given instant: local wall clock minus UTC. */
export function schedulerOffset(ms: number, timeZone: string): number {
  const parts = zoneParts(ms, timeZone);
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) -
    Math.floor(ms / 1000) * 1000
  );
}
/** Wall clock in `timeZone` to an instant. Times skipped by DST move forward. */
export function schedulerToUtc(wall: string, timeZone: string): number {
  const target = wallMs(wall);
  const first = target - schedulerOffset(target, timeZone);
  const second = target - schedulerOffset(first, timeZone);
  const normalized = wall.length === 10 ? `${wall}T00:00` : wall;
  // A clock time DST skips never happens; use the first instant after the gap.
  return schedulerToWall(second, timeZone) === normalized
    ? second
    : Math.max(first, second);
}
/** Instant to `YYYY-MM-DDTHH:mm` wall clock in `timeZone`. */
export function schedulerToWall(ms: number, timeZone: string): string {
  const parts = zoneParts(ms, timeZone);
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

const wallMs = (wall: string) =>
  Date.parse(`${wall.length === 10 ? `${wall}T00:00` : wall}:00Z`);
/** Adds days to a date or wall time string, keeping its shape and clock time. */
export function schedulerShift(wall: string, days: number): string {
  const iso = new Date(wallMs(wall) + days * DAY_MS).toISOString();
  return wall.length === 10 ? iso.slice(0, 10) : iso.slice(0, 16);
}
export function schedulerDaysBetween(from: string, to: string): number {
  return Math.round(
    (wallMs(to.slice(0, 10)) - wallMs(from.slice(0, 10))) / DAY_MS,
  );
}
export function schedulerWeekday(date: string): number {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`).getUTCDay();
}
const shiftMonths = (date: string, months: number): string | null => {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const total = year * 12 + (month - 1) + months;
  const next = `${pad(Math.floor(total / 12), 4)}-${pad((total % 12) + 1)}-${pad(day)}`;
  return isSchedulerDate(next) ? next : null;
};

/** Occurrence start dates between two `YYYY-MM-DD` bounds, inclusive. */
export function schedulerOccurrenceDates(
  event: SchedulerEvent,
  from: string,
  to: string,
): string[] {
  const base = event.start.slice(0, 10);
  const rule = event.recurrence;
  if (!rule) return base >= from && base <= to ? [base] : [];
  const interval = rule.interval ?? 1;
  const weekdays = [...(rule.byWeekday ?? [schedulerWeekday(base)])].sort(
    (a, b) => a - b,
  );
  const weekStart = schedulerShift(base, -schedulerWeekday(base));
  const dateAt = (step: number): string | null => {
    if (rule.freq === 'daily') return schedulerShift(base, step * interval);
    if (rule.freq === 'monthly') return shiftMonths(base, step * interval);
    const week = Math.floor(step / weekdays.length);
    const date = schedulerShift(
      weekStart,
      week * interval * 7 + (weekdays[step % weekdays.length] ?? 0),
    );
    return date < base ? null : date;
  };
  const dates: string[] = [];
  let count = 0;
  for (let step = 0; step < SCHEDULER_MAX_OCCURRENCES; step++) {
    const date = dateAt(step);
    // A monthly rule skips months without that day, and those never count.
    if (date === null) continue;
    if (rule.until && date > rule.until) break;
    if (++count > (rule.count ?? Infinity)) break;
    if (date > to) break;
    if (date >= from) dates.push(date);
  }
  return dates;
}

const occurrenceOf = (
  event: SchedulerEvent,
  date: string,
  timeZone: string,
): SchedulerOccurrence | null => {
  const exception = event.exceptions?.find((item) => item.date === date);
  if (exception?.cancelled) return null;
  const shift = schedulerDaysBetween(event.start, date);
  const start = exception?.start ?? schedulerShift(event.start, shift);
  const end = exception?.end ?? schedulerShift(event.end, shift);
  const instant = (wall: string) =>
    schedulerToUtc(wall.length === 10 ? `${wall}T00:00` : wall, timeZone);
  return {
    key: `${event.id}|${date}`,
    eventId: event.id,
    date,
    title: exception?.title ?? event.title,
    start,
    end,
    startMs: instant(start),
    endMs: instant(end),
    allDay: !!event.allDay,
    resourceId: exception?.resourceId ?? event.resourceId,
    notes: event.notes,
    recurring: !!event.recurrence,
    changed: !!exception,
  };
};

/** Every occurrence overlapping `[fromMs, toMs)`, sorted by start. */
export function expandScheduler(
  data: SchedulerData,
  fromMs: number,
  toMs: number,
): SchedulerOccurrence[] {
  if (!(toMs > fromMs)) return [];
  const zone = data.timeZone;
  const from = schedulerToWall(fromMs, zone).slice(0, 10);
  const to = schedulerToWall(toMs, zone).slice(0, 10);
  const occurrences: SchedulerOccurrence[] = [];
  for (const event of data.events) {
    const span = Math.max(0, schedulerDaysBetween(event.start, event.end));
    const dates = schedulerOccurrenceDates(
      event,
      schedulerShift(from, -span - 1),
      schedulerShift(to, 1),
    );
    // Occurrences an exception moved across the window edge keep their key.
    const moved = (event.exceptions ?? [])
      .filter(
        (item) => !item.cancelled && item.start && !dates.includes(item.date),
      )
      .map((item) => item.date);
    for (const date of [...dates, ...moved]) {
      const occurrence = occurrenceOf(event, date, zone);
      if (occurrence && occurrence.endMs > fromMs && occurrence.startMs < toMs)
        occurrences.push(occurrence);
    }
  }
  return occurrences.sort(
    (a, b) => a.startMs - b.startMs || a.key.localeCompare(b.key),
  );
}

/** Keys of occurrences that double-book a resource. */
export function schedulerConflicts(
  occurrences: readonly SchedulerOccurrence[],
): Set<string> {
  const conflicts = new Set<string>();
  const byResource = new Map<string, SchedulerOccurrence[]>();
  for (const occurrence of occurrences) {
    if (!occurrence.resourceId) continue;
    const list = byResource.get(occurrence.resourceId) ?? [];
    list.push(occurrence);
    byResource.set(occurrence.resourceId, list);
  }
  // ponytail: pairwise inside one resource; switch to a sweep if a resource holds thousands.
  for (const list of byResource.values()) {
    const sorted = [...list].sort((a, b) => a.startMs - b.startMs);
    for (let i = 0; i < sorted.length; i++)
      for (let j = i + 1; j < sorted.length; j++) {
        const left = sorted[i]!;
        const right = sorted[j]!;
        if (right.startMs >= left.endMs) break;
        if (right.eventId === left.eventId && right.date === left.date)
          continue;
        conflicts.add(left.key);
        conflicts.add(right.key);
      }
  }
  return conflicts;
}

/** True when the occurrence falls outside the working days or hours. */
export function schedulerOutsideHours(
  occurrence: SchedulerOccurrence,
  hours?: SchedulerBusinessHours,
): boolean {
  if (!hours) return false;
  const days = new Set(hours.days);
  if (occurrence.allDay) {
    for (
      let date = occurrence.start;
      date < occurrence.end;
      date = schedulerShift(date, 1)
    )
      if (!days.has(schedulerWeekday(date))) return true;
    return false;
  }
  if (occurrence.start.slice(0, 10) !== occurrence.end.slice(0, 10))
    return true;
  return (
    !days.has(schedulerWeekday(occurrence.start)) ||
    occurrence.start.slice(11) < hours.start ||
    occurrence.end.slice(11) > hours.end
  );
}

const validateRecurrence = (input: unknown, start: string) => {
  const row = record(input);
  if (row.freq !== 'daily' && row.freq !== 'weekly' && row.freq !== 'monthly')
    throw new Error('반복은 매일·매주·매월 중에서 선택해 주세요.');
  const rule: SchedulerRecurrence = { freq: row.freq };
  if (row.interval !== undefined)
    rule.interval = integer(
      row.interval,
      1,
      999,
      '반복 간격은 1~999 사이의 정수로 입력해 주세요.',
    );
  if (row.count !== undefined)
    rule.count = integer(
      row.count,
      1,
      999,
      '반복 횟수는 1~999 사이의 정수로 입력해 주세요.',
    );
  if (row.until !== undefined) {
    if (!isSchedulerDate(row.until) || row.until < start.slice(0, 10))
      throw new Error('반복 종료일은 시작일 이후의 날짜로 입력해 주세요.');
    rule.until = row.until;
  }
  if (row.byWeekday !== undefined) {
    if (rule.freq !== 'weekly')
      throw new Error('요일 반복은 매주 반복에서만 사용할 수 있어요.');
    const days = array(row.byWeekday, 7).map((day) =>
      integer(day, 0, 6, '반복 요일을 다시 선택해 주세요.'),
    );
    if (!days.length || new Set(days).size !== days.length)
      throw new Error('반복 요일을 다시 선택해 주세요.');
    rule.byWeekday = [...days].sort((a, b) => a - b);
  }
  return rule;
};

export function validateScheduler(input: unknown): SchedulerData {
  const data = record(input);
  if (data.version !== 1) throw new Error('지원하는 일정 파일 버전은 1이에요.');
  if (!isSchedulerZone(data.timeZone))
    throw new Error('시간대를 IANA 이름으로 입력해 주세요. 예: Asia/Seoul');
  const timeZone = data.timeZone;
  const resources = array(data.resources, 50).map((item) => {
    const row = record(item);
    return { id: text(row.id), title: text(row.title) };
  });
  const resourceIds = new Set(resources.map((item) => item.id));
  const resourceOf = (value: unknown) => {
    const id = text(value);
    if (!resourceIds.has(id))
      throw new Error('일정의 리소스를 다시 선택해 주세요.');
    return id;
  };
  let businessHours: SchedulerBusinessHours | undefined;
  if (data.businessHours !== undefined) {
    const row = record(data.businessHours);
    const days = array(row.days, 7).map((day) =>
      integer(day, 0, 6, '업무 요일을 다시 선택해 주세요.'),
    );
    if (!days.length || new Set(days).size !== days.length)
      throw new Error('업무 요일을 다시 선택해 주세요.');
    if (
      typeof row.start !== 'string' ||
      typeof row.end !== 'string' ||
      !CLOCK.test(row.start) ||
      !CLOCK.test(row.end) ||
      row.start >= row.end
    )
      throw new Error('업무 시간은 HH:mm 형식으로 시작보다 늦게 끝내 주세요.');
    businessHours = {
      days: [...days].sort((a, b) => a - b),
      start: row.start,
      end: row.end,
    };
  }
  const events = array(data.events, 500).map((item) => {
    const row = record(item);
    const allDay = row.allDay === true;
    const valid = allDay ? isSchedulerDate : isSchedulerTime;
    if (row.allDay !== undefined && typeof row.allDay !== 'boolean')
      throw new Error('종일 여부는 true 또는 false로 전달해 주세요.');
    if (!valid(row.start) || !valid(row.end))
      throw new Error(
        allDay
          ? '종일 일정의 날짜를 YYYY-MM-DD로 입력해 주세요.'
          : '일정 시각을 YYYY-MM-DDTHH:mm으로 입력해 주세요.',
      );
    const start = row.start as string;
    const end = row.end as string;
    if (end <= start) throw new Error('종료는 시작보다 늦게 입력해 주세요.');
    if (schedulerDaysBetween(start, end) > 366)
      throw new Error('한 일정의 길이는 366일 이내로 입력해 주세요.');
    const event: SchedulerEvent = {
      id: text(row.id),
      title: text(row.title),
      start,
      end,
    };
    if (allDay) event.allDay = true;
    if (row.resourceId !== undefined)
      event.resourceId = resourceOf(row.resourceId);
    if (row.notes !== undefined) {
      if (typeof row.notes !== 'string' || row.notes.length > 5000)
        throw new Error('일정 메모는 5,000자 이내로 입력해 주세요.');
      event.notes = row.notes;
    }
    if (row.recurrence !== undefined)
      event.recurrence = validateRecurrence(row.recurrence, start);
    if (row.exceptions !== undefined) {
      const exceptions = array(row.exceptions, 100).map((entry) => {
        const source = record(entry);
        if (!isSchedulerDate(source.date))
          throw new Error('예외 일정의 기준 날짜를 확인해 주세요.');
        const exception: SchedulerException = { date: source.date };
        if (source.cancelled !== undefined) {
          if (source.cancelled !== true)
            throw new Error('취소한 일정은 cancelled: true로 표시해 주세요.');
          exception.cancelled = true;
        }
        if (source.start !== undefined || source.end !== undefined) {
          if (!valid(source.start) || !valid(source.end))
            throw new Error('예외 일정의 시작과 종료를 함께 입력해 주세요.');
          if ((source.end as string) <= (source.start as string))
            throw new Error('종료는 시작보다 늦게 입력해 주세요.');
          exception.start = source.start as string;
          exception.end = source.end as string;
        }
        if (source.title !== undefined) exception.title = text(source.title);
        if (source.resourceId !== undefined)
          exception.resourceId = resourceOf(source.resourceId);
        return exception;
      });
      if (
        new Set(exceptions.map((item) => item.date)).size !== exceptions.length
      )
        throw new Error('한 날짜의 예외 일정은 하나만 남겨 주세요.');
      exceptions.sort((a, b) => a.date.localeCompare(b.date));
      if (exceptions.length) {
        if (!event.recurrence)
          throw new Error('예외 일정은 반복 일정에서만 사용할 수 있어요.');
        const last = exceptions.reduce(
          (latest, entry) => (entry.date > latest ? entry.date : latest),
          exceptions[0]!.date,
        );
        const dates = new Set(
          schedulerOccurrenceDates(event, '0001-01-01', last),
        );
        if (exceptions.some((entry) => !dates.has(entry.date)))
          throw new Error('예외 일정의 기준 날짜가 반복 일정에 없어요.');
        event.exceptions = exceptions;
      }
    }
    return event;
  });
  if (new Set(events.map((event) => event.id)).size !== events.length)
    throw new Error('일정 ID는 중복할 수 없어요.');
  if (resourceIds.size !== resources.length)
    throw new Error('리소스 ID는 중복할 수 없어요.');
  const result: SchedulerData = {
    version: 1,
    timeZone,
    events,
    resources,
    ...(businessHours ? { businessHours } : {}),
  };
  if (JSON.stringify(result).length > 2_000_000)
    throw new Error('일정 내용은 2백만 자 이내로 전달해 주세요.');
  return result;
}

/** Drops exceptions whose date is no longer an occurrence of the rule. */
const pruneExceptions = (event: SchedulerEvent): SchedulerEvent => {
  if (!event.exceptions?.length) return event;
  if (!event.recurrence) return { ...event, exceptions: undefined };
  const last = event.exceptions.reduce(
    (latest, entry) => (entry.date > latest ? entry.date : latest),
    event.exceptions[0]!.date,
  );
  const dates = new Set(schedulerOccurrenceDates(event, '0001-01-01', last));
  const kept = event.exceptions.filter((entry) => dates.has(entry.date));
  return kept.length === event.exceptions.length
    ? event
    : { ...event, exceptions: kept.length ? kept : undefined };
};
export function updateScheduler(
  input: SchedulerData,
  action: SchedulerAction,
): SchedulerData {
  const data = validateScheduler(input);
  let { events, resources } = data;
  const find = (id: string) => {
    const event = events.find((item) => item.id === id);
    if (!event)
      throw new Error('변경할 일정이 없어요. 현재 일정을 다시 확인해 주세요.');
    return event;
  };
  switch (action.type) {
    case 'put-event': {
      const next = pruneExceptions(action.event);
      events = events.some((event) => event.id === next.id)
        ? events.map((event) => (event.id === next.id ? next : event))
        : [...events, next];
      break;
    }
    case 'delete-event':
      find(action.id);
      events = events.filter((event) => event.id !== action.id);
      break;
    case 'put-occurrence': {
      const event = find(action.id);
      if (!event.recurrence)
        throw new Error('반복 일정에서만 하루치 일정을 따로 바꿀 수 있어요.');
      const rest = (event.exceptions ?? []).filter(
        (entry) => entry.date !== action.exception.date,
      );
      events = events.map((item) =>
        item.id === event.id
          ? { ...item, exceptions: [...rest, action.exception] }
          : item,
      );
      break;
    }
    case 'delete-occurrence': {
      const event = find(action.id);
      if (!event.recurrence) {
        events = events.filter((item) => item.id !== event.id);
        break;
      }
      const rest = (event.exceptions ?? []).filter(
        (entry) => entry.date !== action.date,
      );
      events = events.map((item) =>
        item.id === event.id
          ? {
              ...item,
              exceptions: [...rest, { date: action.date, cancelled: true }],
            }
          : item,
      );
      break;
    }
    case 'put-resource':
      resources = resources.some((item) => item.id === action.resource.id)
        ? resources.map((item) =>
            item.id === action.resource.id ? action.resource : item,
          )
        : [...resources, action.resource];
      break;
    case 'delete-resource': {
      if (!resources.some((item) => item.id === action.id))
        throw new Error(
          '변경할 리소스가 없어요. 현재 일정을 다시 확인해 주세요.',
        );
      resources = resources.filter((item) => item.id !== action.id);
      events = events.map((event) =>
        event.resourceId === action.id ||
        event.exceptions?.some((entry) => entry.resourceId === action.id)
          ? {
              ...event,
              resourceId:
                event.resourceId === action.id ? undefined : event.resourceId,
              exceptions: event.exceptions?.map((entry) =>
                entry.resourceId === action.id
                  ? { ...entry, resourceId: undefined }
                  : entry,
              ),
            }
          : event,
      );
      break;
    }
    default:
      throw new Error('지원하지 않는 일정 변경이에요.');
  }
  return validateScheduler({ ...data, events, resources });
}

const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;
const icsText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
const icsPlain = (value: string) =>
  value.replace(/\\([\\;,nN])/g, (_match, char: string) =>
    char === 'n' || char === 'N' ? '\n' : char,
  );
/** RFC 5545 line folding at 75 octets, splitting between code points. */
const fold = (line: string) => {
  const lines: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const code = char.codePointAt(0) ?? 0;
    const size = code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    if (bytes + size > (lines.length ? 74 : 75)) {
      lines.push(current);
      current = '';
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  lines.push(current);
  return lines.map((part, index) => (index ? ` ${part}` : part)).join('\r\n');
};
const icsStamp = (wall: string) =>
  wall.length === 10
    ? wall.replace(/-/g, '')
    : `${wall.replace(/[-:]/g, '')}00`;
const icsUtc = (ms: number) =>
  `${new Date(ms).toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;

/** iCalendar (RFC 5545) text for the whole calendar. */
export function serializeSchedulerIcs(input: SchedulerData): string {
  const data = validateScheduler(input);
  const zone = data.timeZone;
  const stamp = icsUtc(Date.now());
  const title = (id: string) =>
    data.resources.find((item) => item.id === id)?.title;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mega UI//Scheduler//KO',
    'CALSCALE:GREGORIAN',
    `X-WR-TIMEZONE:${zone}`,
  ];
  const time = (wall: string, name: string) =>
    wall.length === 10
      ? `${name};VALUE=DATE:${icsStamp(wall)}`
      : `${name};TZID=${zone}:${icsStamp(wall)}`;
  const body = (
    event: SchedulerEvent,
    start: string,
    end: string,
    summary: string,
    resourceId?: string,
  ) => {
    const rows = [
      time(start, 'DTSTART'),
      time(end, 'DTEND'),
      `SUMMARY:${icsText(summary)}`,
    ];
    if (event.notes) rows.push(`DESCRIPTION:${icsText(event.notes)}`);
    if (resourceId) {
      rows.push(`X-MEGA-RESOURCE:${icsText(resourceId)}`);
      const name = title(resourceId);
      if (name) rows.push(`LOCATION:${icsText(name)}`);
    }
    return rows;
  };
  for (const event of data.events) {
    lines.push('BEGIN:VEVENT', `UID:${icsText(event.id)}`, `DTSTAMP:${stamp}`);
    lines.push(
      ...body(event, event.start, event.end, event.title, event.resourceId),
    );
    const rule = event.recurrence;
    if (rule) {
      const parts = [`FREQ=${rule.freq.toUpperCase()}`];
      if (rule.interval && rule.interval !== 1)
        parts.push(`INTERVAL=${rule.interval}`);
      if (rule.byWeekday?.length)
        parts.push(
          `BYDAY=${rule.byWeekday.map((day) => WEEKDAY_CODES[day]).join(',')}`,
        );
      if (rule.count) parts.push(`COUNT=${rule.count}`);
      if (rule.until)
        parts.push(
          `UNTIL=${icsUtc(schedulerToUtc(`${rule.until}T23:59`, zone))}`,
        );
      lines.push(`RRULE:${parts.join(';')}`);
      for (const entry of event.exceptions ?? [])
        if (entry.cancelled)
          lines.push(
            time(
              schedulerShift(
                event.start,
                schedulerDaysBetween(event.start, entry.date),
              ),
              'EXDATE',
            ),
          );
    }
    lines.push('END:VEVENT');
    for (const entry of event.exceptions ?? []) {
      if (entry.cancelled || !entry.start || !entry.end) continue;
      const original = schedulerShift(
        event.start,
        schedulerDaysBetween(event.start, entry.date),
      );
      lines.push(
        'BEGIN:VEVENT',
        `UID:${icsText(event.id)}`,
        `DTSTAMP:${stamp}`,
      );
      lines.push(time(original, 'RECURRENCE-ID'));
      lines.push(
        ...body(
          event,
          entry.start,
          entry.end,
          entry.title ?? event.title,
          entry.resourceId ?? event.resourceId,
        ),
      );
      lines.push('END:VEVENT');
    }
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

export interface SchedulerIcsResult {
  data: SchedulerData;
  /** What the file held but this model does not keep. */
  notes: readonly string[];
}
type IcsProperty = { params: Record<string, string>; value: string };
type IcsBlock = Map<string, IcsProperty[]>;

const parseProperty = (line: string): [string, IcsProperty] | null => {
  const colon = (() => {
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') quoted = !quoted;
      else if (line[i] === ':' && !quoted) return i;
    }
    return -1;
  })();
  if (colon < 1) return null;
  const [name = '', ...rest] = line.slice(0, colon).split(';');
  const params: Record<string, string> = {};
  for (const part of rest) {
    const equals = part.indexOf('=');
    if (equals > 0)
      params[part.slice(0, equals).toUpperCase()] = part
        .slice(equals + 1)
        .replace(/^"|"$/g, '');
  }
  return [name.toUpperCase(), { params, value: line.slice(colon + 1) }];
};
const DURATION =
  /^([+-]?)P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
const durationMinutes = (value: string) => {
  const match = DURATION.exec(value.trim());
  if (!match) return null;
  const [, sign, weeks, days, hours, minutes] = match;
  const total =
    Number(weeks ?? 0) * 10080 +
    Number(days ?? 0) * 1440 +
    Number(hours ?? 0) * 60 +
    Number(minutes ?? 0);
  return sign === '-' ? -total : total;
};

/** Reads an iCalendar file into this model, reporting what it could not keep. */
export function parseSchedulerIcs(
  source: string,
  timeZone = 'UTC',
): SchedulerIcsResult {
  if (typeof source !== 'string' || source.length > 2_000_000)
    throw new Error('일정 파일은 2백만 자 이내로 불러와 주세요.');
  if (!isSchedulerZone(timeZone))
    throw new Error('시간대를 IANA 이름으로 입력해 주세요. 예: Asia/Seoul');
  if (!/BEGIN:VCALENDAR/i.test(source))
    throw new Error('iCalendar 형식의 일정 파일을 선택해 주세요.');
  const lines = source
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n');
  const notes = new Set<string>();
  const blocks: IcsBlock[] = [];
  let block: IcsBlock | null = null;
  let skipping = '';
  for (const line of lines) {
    const parsed = parseProperty(line.trim());
    if (!parsed) continue;
    const [name, property] = parsed;
    if (name === 'BEGIN') {
      const kind = property.value.toUpperCase();
      if (kind === 'VEVENT') block = new Map();
      else if (kind !== 'VCALENDAR' && !skipping) skipping = kind;
      continue;
    }
    if (name === 'END') {
      const kind = property.value.toUpperCase();
      if (kind === 'VEVENT' && block) {
        blocks.push(block);
        block = null;
      } else if (kind === skipping) {
        if (kind !== 'VTIMEZONE')
          notes.add(`${kind} 항목은 일정으로 가져오지 않았어요.`);
        skipping = '';
      }
      continue;
    }
    if (block && !skipping) {
      const list = block.get(name) ?? [];
      list.push(property);
      block.set(name, list);
    }
  }
  if (blocks.length > 500)
    throw new Error('일정 파일은 500개 이내의 일정으로 나눠서 불러와 주세요.');
  const wallOf = (property: IcsProperty): string | null => {
    const raw = property.value.trim();
    const date = /^(\d{4})(\d{2})(\d{2})$/.exec(raw);
    if (date) return `${date[1]}-${date[2]}-${date[3]}`;
    const stamp = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(raw);
    if (!stamp) return null;
    const wall = `${stamp[1]}-${stamp[2]}-${stamp[3]}T${stamp[4]}:${stamp[5]}`;
    const zone = stamp[7] === 'Z' ? 'UTC' : property.params.TZID;
    if (!zone || zone === timeZone) return wall;
    if (!isSchedulerZone(zone)) {
      notes.add(`${zone} 시간대를 몰라서 ${timeZone} 기준으로 읽었어요.`);
      return wall;
    }
    return schedulerToWall(schedulerToUtc(wall, zone), timeZone);
  };
  const resources = new Map<string, SchedulerResource>();
  const events = new Map<string, SchedulerEvent>();
  const overrides: {
    uid: string;
    date: string;
    exception: SchedulerException;
  }[] = [];
  const seen = new Set<string>();
  for (const [index, entry] of blocks.entries()) {
    const first = (name: string) => entry.get(name)?.[0];
    const startProperty = first('DTSTART');
    const start = startProperty ? wallOf(startProperty) : null;
    if (!start) {
      notes.add('시작 시각이 없는 일정은 가져오지 않았어요.');
      continue;
    }
    const allDay =
      start.length === 10 || startProperty?.params.VALUE === 'DATE';
    const endProperty = first('DTEND');
    const duration = first('DURATION');
    const minutes = duration ? durationMinutes(duration.value) : null;
    let end = endProperty ? wallOf(endProperty) : null;
    if (!end && minutes !== null && minutes > 0)
      end = allDay
        ? schedulerShift(start, Math.max(1, Math.round(minutes / 1440)))
        : schedulerToWall(
            schedulerToUtc(start, timeZone) + minutes * 60_000,
            timeZone,
          );
    if (!end) end = allDay ? schedulerShift(start, 1) : start;
    if (!allDay && end <= start)
      end = schedulerToWall(
        schedulerToUtc(start, timeZone) + 3_600_000,
        timeZone,
      );
    if (allDay && end <= start) end = schedulerShift(start, 1);
    const uid = first('UID')?.value.trim() || `ics-${index + 1}`;
    const summary =
      icsPlain(first('SUMMARY')?.value ?? '').trim() || '제목 없는 일정';
    const resourceId = first('X-MEGA-RESOURCE')?.value.trim();
    if (resourceId && !resources.has(resourceId))
      resources.set(resourceId, {
        id: resourceId,
        title: icsPlain(first('LOCATION')?.value ?? '').trim() || resourceId,
      });
    const recurrenceId = first('RECURRENCE-ID');
    if (recurrenceId) {
      const original = wallOf(recurrenceId);
      if (!original) {
        notes.add('기준 시각을 읽지 못한 예외 일정은 가져오지 않았어요.');
        continue;
      }
      overrides.push({
        uid,
        date: original.slice(0, 10),
        exception: {
          date: original.slice(0, 10),
          start,
          end,
          title: summary,
          ...(resourceId ? { resourceId } : {}),
        },
      });
      continue;
    }
    if (seen.has(uid)) {
      notes.add('같은 UID의 일정이 여러 개라 첫 일정만 가져왔어요.');
      continue;
    }
    seen.add(uid);
    const event: SchedulerEvent = { id: uid, title: summary, start, end };
    if (allDay) event.allDay = true;
    if (resourceId) event.resourceId = resourceId;
    const description = icsPlain(first('DESCRIPTION')?.value ?? '').trim();
    if (description) event.notes = description.slice(0, 5000);
    const rrule = first('RRULE')?.value;
    if (rrule) {
      const parts = new Map(
        rrule.split(';').map((part) => {
          const equals = part.indexOf('=');
          return [
            part.slice(0, Math.max(0, equals)).toUpperCase(),
            part.slice(equals + 1),
          ] as const;
        }),
      );
      const freq = parts.get('FREQ')?.toUpperCase();
      const known = ['FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'BYDAY', 'WKST'];
      const byDay = parts.get('BYDAY')?.toUpperCase().split(',') ?? [];
      const weekdays = byDay.map((code) =>
        WEEKDAY_CODES.indexOf(code as (typeof WEEKDAY_CODES)[number]),
      );
      const supported =
        (freq === 'DAILY' || freq === 'WEEKLY' || freq === 'MONTHLY') &&
        [...parts.keys()].every((key) => known.includes(key)) &&
        (!byDay.length ||
          (freq === 'WEEKLY' && weekdays.every((day) => day >= 0)));
      if (!supported) {
        notes.add(
          '매일·매주·매월 외의 반복 규칙은 한 번만 열리는 일정으로 가져왔어요.',
        );
      } else {
        const rule: SchedulerRecurrence = {
          freq:
            freq === 'DAILY'
              ? 'daily'
              : freq === 'WEEKLY'
                ? 'weekly'
                : 'monthly',
        };
        const interval = Number(parts.get('INTERVAL') ?? 1);
        if (Number.isInteger(interval) && interval > 1 && interval < 1000)
          rule.interval = interval;
        const count = Number(parts.get('COUNT') ?? 0);
        if (Number.isInteger(count) && count > 0 && count < 1000)
          rule.count = count;
        const until = parts.get('UNTIL');
        if (until) {
          const wall = wallOf({ params: {}, value: until });
          if (wall) rule.until = wall.slice(0, 10);
          else notes.add('반복 종료일을 읽지 못해 종료 없이 가져왔어요.');
        }
        if (weekdays.length && freq === 'WEEKLY') rule.byWeekday = weekdays;
        event.recurrence = rule;
      }
    }
    if (entry.has('EXDATE')) {
      const exceptions: SchedulerException[] = [];
      for (const property of entry.get('EXDATE') ?? [])
        for (const raw of property.value.split(',')) {
          const wall = wallOf({ params: property.params, value: raw });
          if (
            wall &&
            !exceptions.some((item) => item.date === wall.slice(0, 10))
          )
            exceptions.push({ date: wall.slice(0, 10), cancelled: true });
        }
      if (exceptions.length && event.recurrence) event.exceptions = exceptions;
      else if (exceptions.length)
        notes.add('반복이 없는 일정의 제외 날짜는 가져오지 않았어요.');
    }
    events.set(uid, event);
  }
  for (const override of overrides) {
    const event = events.get(override.uid);
    if (!event?.recurrence) {
      notes.add('반복 일정을 찾지 못한 예외 일정은 가져오지 않았어요.');
      continue;
    }
    if (override.exception.resourceId === event.resourceId)
      delete override.exception.resourceId;
    if (
      override.exception.resourceId &&
      !resources.has(override.exception.resourceId)
    )
      resources.set(override.exception.resourceId, {
        id: override.exception.resourceId,
        title: override.exception.resourceId,
      });
    const rest = (event.exceptions ?? []).filter(
      (entry) => entry.date !== override.date,
    );
    events.set(override.uid, {
      ...event,
      exceptions: [...rest, override.exception],
    });
  }
  const kept = [...events.values()].map((event) => {
    const pruned = pruneExceptions(event);
    if (pruned !== event)
      notes.add('반복에 없는 날짜의 예외 일정은 가져오지 않았어요.');
    return pruned;
  });
  return {
    data: validateScheduler({
      version: 1,
      timeZone,
      events: kept,
      resources: [...resources.values()],
    }),
    notes: [...notes],
  };
}
