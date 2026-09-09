import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  PageHeader,
  SchedulerPro,
  Select,
  Stack,
  validateScheduler,
  type SchedulerData,
} from '@mega-ui/react';

const monday = '2026-09-07';
export const schedulerSeed: SchedulerData = {
  version: 1,
  timeZone: 'Asia/Seoul',
  businessHours: { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' },
  resources: [
    { id: 'room-a', title: '회의실 A' },
    { id: 'room-b', title: '회의실 B' },
    { id: 'studio', title: '스튜디오' },
  ],
  events: [
    {
      id: 'standup',
      title: '데일리 스탠드업',
      start: `${monday}T09:30`,
      end: `${monday}T09:50`,
      resourceId: 'room-a',
      recurrence: { freq: 'weekly', byWeekday: [1, 2, 3, 4, 5], count: 20 },
      notes: '어제 한 일과 오늘 할 일을 5분씩 나눠요.',
    },
    {
      id: 'design-review',
      title: '디자인 리뷰',
      start: '2026-09-09T14:00',
      end: '2026-09-09T15:30',
      resourceId: 'room-b',
      notes: '일정 컴포넌트의 주간 보기를 함께 확인해요.',
    },
    {
      id: 'recording',
      title: '제품 소개 촬영',
      start: '2026-09-10T13:00',
      end: '2026-09-10T17:00',
      resourceId: 'studio',
    },
    {
      id: 'workshop',
      title: '접근성 워크숍',
      start: '2026-09-11T18:30',
      end: '2026-09-11T20:00',
      resourceId: 'room-a',
    },
    {
      id: 'holiday',
      title: '창립 기념일',
      start: '2026-09-14',
      end: '2026-09-15',
      allDay: true,
    },
    {
      id: 'onboarding',
      title: '신규 입사자 교육',
      start: '2026-09-09T14:30',
      end: '2026-09-09T16:00',
      resourceId: 'room-b',
    },
  ],
};
export function SchedulerProDemo() {
  const [value, setValue] = useState(schedulerSeed);
  return (
    <SchedulerPro
      value={value}
      onChange={setValue}
      label="팀 주간 일정"
      defaultDate="2026-09-09"
    />
  );
}
const storageKey = 'mega-scheduler-example-v1';
export function SchedulerExample() {
  const [value, setValue] = useState(schedulerSeed);
  const [instance, setInstance] = useState(0);
  const [fail, setFail] = useState(false);
  const [mode, setMode] = useState('team');
  const [reload, setReload] = useState(false);
  const [loadError, setLoadError] = useState('');
  const load = () => {
    try {
      const source = localStorage.getItem(storageKey);
      if (!source) {
        setLoadError(
          '이 브라우저에 저장한 일정이 없어요. 일정을 저장한 뒤 다시 불러와 주세요.',
        );
        return;
      }
      setValue(validateScheduler(JSON.parse(source)));
      setInstance((current) => current + 1);
      setLoadError('');
      setReload(false);
    } catch {
      setLoadError(
        '저장한 일정을 불러오지 못했어요. 브라우저 저장소와 저장한 데이터를 확인해 주세요.',
      );
    }
  };
  return (
    <Stack gap={4}>
      <PageHeader
        title="팀 일정과 회의실 예약"
        description="주·일·월·리소스 보기로 일정을 만들고, 끌어서 옮기고, 반복과 예약 충돌을 확인해요. 일정 저장은 이 브라우저의 저장소에 기록해요."
      />
      <SchedulerPro
        key={instance}
        value={value}
        onChange={setValue}
        label="9월 팀 일정"
        defaultDate="2026-09-09"
        onSave={async (next) => {
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (fail) throw new Error('Example save failure');
          localStorage.setItem(storageKey, JSON.stringify(next));
        }}
      />
      <p>예제 데이터를 바꾸면 저장하지 않은 변경은 사라져요.</p>
      <Stack direction="row" gap={3} wrap align="end">
        <label>
          예제 데이터
          <Select
            aria-label="일정 예제 데이터"
            value={mode}
            onChange={(event) => {
              const next = event.target.value;
              setMode(next);
              setValue(
                next === 'large'
                  ? {
                      ...schedulerSeed,
                      events: Array.from({ length: 300 }, (_, index) => {
                        const day = 7 + (index % 12);
                        const hour = 8 + (index % 10);
                        return {
                          id: `bulk-${index}`,
                          title: `상담 ${index + 1}`,
                          start: `2026-09-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00`,
                          end: `2026-09-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:45`,
                          resourceId: ['room-a', 'room-b', 'studio'][index % 3],
                        };
                      }),
                    }
                  : next === 'empty'
                    ? {
                        version: 1,
                        timeZone: 'Asia/Seoul',
                        resources: [],
                        events: [],
                      }
                    : schedulerSeed,
              );
              setInstance((current) => current + 1);
            }}
          >
            <option value="team">팀 주간 일정</option>
            <option value="large">일정 300개</option>
            <option value="empty">빈 일정</option>
          </Select>
        </label>
        <Checkbox
          checked={fail}
          onChange={(event) => setFail(event.target.checked)}
        >
          저장 실패 재현
        </Checkbox>
        <Button variant="secondary" onClick={() => setReload(true)}>
          브라우저 저장본 불러오기
        </Button>
      </Stack>
      {reload && (
        <Alert>
          <Stack gap={2}>
            <p>
              현재 일정 전체를 브라우저 저장본으로 바꿔요. 저장하지 않은 변경은
              사라져요.
            </p>
            <Stack direction="row" gap={2}>
              <Button onClick={load}>저장본으로 교체</Button>
              <Button variant="secondary" onClick={() => setReload(false)}>
                현재 일정 유지
              </Button>
            </Stack>
          </Stack>
        </Alert>
      )}
      {loadError && (
        <Alert tone="danger" role="alert">
          {loadError}
        </Alert>
      )}
    </Stack>
  );
}
