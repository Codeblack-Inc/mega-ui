import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SchedulerPro } from '@mega-ui/react';
import {
  validateScheduler,
  updateScheduler,
  expandScheduler,
  schedulerConflicts,
  schedulerOutsideHours,
  schedulerOccurrenceDates,
  schedulerToUtc,
  schedulerToWall,
  serializeSchedulerIcs,
  parseSchedulerIcs,
} from '../src/components/scheduler-model.ts';

const seoul = {
  version: 1,
  timeZone: 'Asia/Seoul',
  resources: [
    { id: 'room-a', title: '회의실 A' },
    { id: 'room-b', title: '회의실 B' },
  ],
  businessHours: { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' },
  events: [
    {
      id: 'standup',
      title: '데일리 스탠드업',
      start: '2026-09-07T09:00',
      end: '2026-09-07T09:30',
      resourceId: 'room-a',
      recurrence: { freq: 'weekly', byWeekday: [1, 3], count: 4 },
    },
    {
      id: 'review',
      title: '설계 리뷰',
      start: '2026-09-09T14:00',
      end: '2026-09-09T15:00',
      resourceId: 'room-b',
    },
  ],
};
const range = (from, to, zone = 'Asia/Seoul') => [
  schedulerToUtc(`${from}T00:00`, zone),
  schedulerToUtc(`${to}T00:00`, zone),
];

test('recurrence expands by rule, keeps count and applies exceptions', () => {
  const original = structuredClone(seoul);
  const data = validateScheduler(seoul);
  const dates = schedulerOccurrenceDates(
    data.events[0],
    '2026-09-01',
    '2026-12-31',
  );
  assert.deepEqual(dates, [
    '2026-09-07',
    '2026-09-09',
    '2026-09-14',
    '2026-09-16',
  ]);
  const moved = updateScheduler(data, {
    type: 'put-occurrence',
    id: 'standup',
    exception: {
      date: '2026-09-14',
      start: '2026-09-14T11:00',
      end: '2026-09-14T11:30',
      title: '스탠드업(시간 변경)',
    },
  });
  const cancelled = updateScheduler(moved, {
    type: 'delete-occurrence',
    id: 'standup',
    date: '2026-09-16',
  });
  const week = expandScheduler(cancelled, ...range('2026-09-14', '2026-09-21'));
  assert.deepEqual(
    week.map((item) => `${item.key} ${item.start}`),
    ['standup|2026-09-14 2026-09-14T11:00'],
  );
  assert.equal(week[0].changed, true);
  assert.deepEqual(seoul, original);
});

test('monthly recurrence skips months without the day and honours until', () => {
  const data = validateScheduler({
    version: 1,
    timeZone: 'Asia/Seoul',
    resources: [],
    events: [
      {
        id: 'close',
        title: '월말 마감',
        start: '2026-01-31T18:00',
        end: '2026-01-31T19:00',
        recurrence: { freq: 'monthly', until: '2026-05-31' },
      },
    ],
  });
  assert.deepEqual(
    schedulerOccurrenceDates(data.events[0], '2026-01-01', '2026-12-31'),
    ['2026-01-31', '2026-03-31', '2026-05-31'],
  );
});

test('wall times keep the clock across a DST change and skipped times move forward', () => {
  const zone = 'America/New_York';
  const before = schedulerToUtc('2026-03-07T09:00', zone);
  const after = schedulerToUtc('2026-03-09T09:00', zone);
  assert.equal((after - before) / 3_600_000, 47);
  assert.equal(schedulerToWall(before, zone), '2026-03-07T09:00');
  assert.equal(schedulerToWall(after, zone), '2026-03-09T09:00');
  assert.equal(
    schedulerToWall(schedulerToUtc('2026-03-08T02:30', zone), zone),
    '2026-03-08T03:30',
  );
  const data = validateScheduler({
    version: 1,
    timeZone: zone,
    resources: [],
    events: [
      {
        id: 'daily',
        title: '아침 점검',
        start: '2026-03-06T09:00',
        end: '2026-03-06T09:30',
        recurrence: { freq: 'daily', count: 5 },
      },
    ],
  });
  const days = expandScheduler(
    data,
    ...range('2026-03-06', '2026-03-11', zone),
  );
  assert.deepEqual(
    days.map((item) => item.start.slice(11)),
    ['09:00', '09:00', '09:00', '09:00', '09:00'],
  );
  // A 25-hour view day still shows the same wall clock in Seoul.
  assert.equal(
    schedulerToWall(days[3].startMs, 'Asia/Seoul'),
    '2026-03-09T22:00',
  );
});

test('conflicts need the same resource and business hours cover days and clock', () => {
  const data = updateScheduler(validateScheduler(seoul), {
    type: 'put-event',
    event: {
      id: 'sync',
      title: '주간 동기화',
      start: '2026-09-09T09:15',
      end: '2026-09-09T10:00',
      resourceId: 'room-a',
    },
  });
  const day = expandScheduler(data, ...range('2026-09-09', '2026-09-10'));
  const conflicts = schedulerConflicts(day);
  assert.deepEqual([...conflicts].sort(), [
    'standup|2026-09-09',
    'sync|2026-09-09',
  ]);
  const free = schedulerConflicts(
    day.map((item) => ({ ...item, resourceId: undefined })),
  );
  assert.equal(free.size, 0);
  const hours = data.businessHours;
  assert.equal(schedulerOutsideHours(day[0], hours), false);
  assert.equal(
    schedulerOutsideHours(
      { ...day[0], start: '2026-09-09T08:00', end: '2026-09-09T08:30' },
      hours,
    ),
    true,
  );
  assert.equal(
    schedulerOutsideHours(
      { ...day[0], start: '2026-09-12T10:00', end: '2026-09-12T11:00' },
      hours,
    ),
    true,
  );
  assert.equal(schedulerOutsideHours(day[0], undefined), false);
});

test('validation rejects broken ranges, zones, references and exception dates', () => {
  const bad = (event, pattern) =>
    assert.throws(
      () => validateScheduler({ ...seoul, events: [event] }),
      pattern,
    );
  bad(
    {
      id: 'a',
      title: '끝이 빠른 일정',
      start: '2026-09-09T10:00',
      end: '2026-09-09T09:00',
    },
    /종료는 시작보다/,
  );
  bad(
    { id: 'a', title: '형식 오류', start: '2026-09-09', end: '2026-09-10' },
    /YYYY-MM-DDTHH:mm/,
  );
  bad(
    {
      id: 'a',
      title: '없는 리소스',
      start: '2026-09-09T10:00',
      end: '2026-09-09T11:00',
      resourceId: 'none',
    },
    /리소스/,
  );
  bad(
    {
      id: 'a',
      title: '반복 없는 예외',
      start: '2026-09-09T10:00',
      end: '2026-09-09T11:00',
      exceptions: [{ date: '2026-09-10', cancelled: true }],
    },
    /반복 일정에서만/,
  );
  bad(
    {
      id: 'a',
      title: '없는 날짜의 예외',
      start: '2026-09-09T10:00',
      end: '2026-09-09T11:00',
      recurrence: { freq: 'weekly' },
      exceptions: [{ date: '2026-09-10', cancelled: true }],
    },
    /반복 일정에 없어요/,
  );
  assert.throws(
    () => validateScheduler({ ...seoul, timeZone: 'Mars/Olympus' }),
    /IANA/,
  );
  assert.throws(() => validateScheduler({ ...seoul, version: 2 }), /버전은 1/);
  assert.throws(
    () =>
      updateScheduler(validateScheduler(seoul), {
        type: 'put-occurrence',
        id: 'review',
        exception: { date: '2026-09-09' },
      }),
    /반복 일정에서만/,
  );
  assert.throws(
    () =>
      updateScheduler(validateScheduler(seoul), {
        type: 'delete-event',
        id: 'none',
      }),
    /변경할 일정이 없어요/,
  );
});

test('deleting a resource keeps its events and drops the reference', () => {
  const data = updateScheduler(validateScheduler(seoul), {
    type: 'delete-resource',
    id: 'room-a',
  });
  assert.equal(data.events.length, 2);
  assert.equal(data.events[0].resourceId, undefined);
  assert.equal(data.resources.length, 1);
});

test('editing a series drops exceptions the new rule no longer has', () => {
  const data = updateScheduler(validateScheduler(seoul), {
    type: 'put-occurrence',
    id: 'standup',
    exception: { date: '2026-09-14', cancelled: true },
  });
  const event = data.events.find((item) => item.id === 'standup');
  const next = updateScheduler(data, {
    type: 'put-event',
    event: {
      ...event,
      recurrence: { freq: 'weekly', byWeekday: [3], count: 4 },
    },
  });
  assert.equal(
    next.events.find((item) => item.id === 'standup').exceptions,
    undefined,
  );
});

test('iCalendar export and import round-trip rules, exceptions and text', () => {
  const data = updateScheduler(
    updateScheduler(validateScheduler(seoul), {
      type: 'put-occurrence',
      id: 'standup',
      exception: {
        date: '2026-09-14',
        start: '2026-09-14T11:00',
        end: '2026-09-14T11:30',
        title: '스탠드업; 장소, 변경',
      },
    }),
    {
      type: 'put-occurrence',
      id: 'standup',
      exception: { date: '2026-09-16', cancelled: true },
    },
  );
  const ics = serializeSchedulerIcs(data);
  assert.match(ics, /BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4/);
  assert.match(ics, /EXDATE;TZID=Asia\/Seoul:20260916T090000/);
  assert.match(ics, /RECURRENCE-ID;TZID=Asia\/Seoul:20260914T090000/);
  assert.match(ics, /SUMMARY:스탠드업\\\; 장소\\\, 변경/);
  assert.ok(ics.split('\r\n').every((line) => Buffer.byteLength(line) <= 75));
  const back = parseSchedulerIcs(ics, 'Asia/Seoul');
  assert.deepEqual(back.notes, []);
  assert.deepEqual(back.data.events, data.events);
  assert.deepEqual(back.data.resources, data.resources);
});

test('imported files report what the model does not keep', () => {
  const file = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VTODO',
    'SUMMARY:할 일',
    'END:VTODO',
    'BEGIN:VEVENT',
    'UID:yearly',
    'SUMMARY:창립 기념일',
    'DTSTART;VALUE=DATE:20260401',
    'DTEND;VALUE=DATE:20260402',
    'RRULE:FREQ=YEARLY',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:utc',
    'SUMMARY:UTC 회의',
    'DTSTART:20260909T000000Z',
    'DURATION:PT90M',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:nostart',
    'SUMMARY:시작 없음',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const result = parseSchedulerIcs(file, 'Asia/Seoul');
  assert.equal(result.data.events.length, 2);
  const [holiday, meeting] = result.data.events;
  assert.deepEqual(holiday, {
    id: 'yearly',
    title: '창립 기념일',
    start: '2026-04-01',
    end: '2026-04-02',
    allDay: true,
  });
  assert.equal(meeting.start, '2026-09-09T09:00');
  assert.equal(meeting.end, '2026-09-09T10:30');
  assert.deepEqual(result.notes.length, 3);
  assert.ok(result.notes.some((note) => note.includes('VTODO')));
  assert.ok(result.notes.some((note) => note.includes('반복 규칙')));
  assert.ok(result.notes.some((note) => note.includes('시작 시각')));
  assert.throws(
    () => parseSchedulerIcs('일정 없음', 'Asia/Seoul'),
    /iCalendar/,
  );
});

test('scheduler renders on the server and reports broken data instead of throwing', () => {
  const html = renderToStaticMarkup(
    h(SchedulerPro, {
      value: seoul,
      label: '팀 일정',
      defaultDate: '2026-09-09',
    }),
  );
  assert.match(html, /aria-label="팀 일정"/);
  assert.match(html, /데일리 스탠드업/);
  assert.match(html, /설계 리뷰/);
  assert.match(html, /읽기 전용/);
  assert.doesNotMatch(html, /일정 저장/);
  const broken = renderToStaticMarkup(
    h(SchedulerPro, { value: { version: 1 }, label: '팀 일정' }),
  );
  assert.match(broken, /일정 데이터 형식을 확인해 주세요/);
});
