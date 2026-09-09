# SchedulerPro

`SchedulerPro`는 일·주·월·리소스 보기로 일정을 만들고 옮기는 제어형 달력입니다.
`@mega-ui/react`와 기본 `styles.css`에서 제공합니다. 추가 엔진 의존성은 없고 시간대 계산은 브라우저의 `Intl`을 사용합니다.
기존 `Scheduler`는 날짜별 목록만 표시하는 가벼운 컴포넌트로 그대로 유지합니다.

```tsx
import { useState } from 'react';
import { SchedulerPro, type SchedulerData } from '@mega-ui/react';
import '@mega-ui/react/styles.css';

const initial: SchedulerData = {
  version: 1,
  timeZone: 'Asia/Seoul',
  businessHours: { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' },
  resources: [{ id: 'room-a', title: '회의실 A' }],
  events: [
    {
      id: 'standup',
      title: '데일리 스탠드업',
      start: '2026-09-07T09:30',
      end: '2026-09-07T09:50',
      resourceId: 'room-a',
      recurrence: { freq: 'weekly', byWeekday: [1, 2, 3, 4, 5], count: 20 },
    },
  ],
};
function TeamCalendar() {
  const [value, setValue] = useState(initial);
  return <SchedulerPro value={value} onChange={setValue} label="팀 일정" />;
}
```

## API

| prop                     | 계약                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `value`                  | 필수 `SchedulerData`. 원본을 변경하지 않음                                                                         |
| `onChange(next, action)` | 생성·편집·이동·삭제·실행 취소·복원의 결과. 부모에서 value를 갱신해야 반영. 생략 시 읽기 전용                       |
| `onSave(snapshot)`       | 선택적 비동기 저장. resolve를 저장 확정으로 간주. 실패 시 현재 내용 유지. 실제 서버/브라우저 저장은 소비 앱이 수행 |
| `label`                  | 영역 이름·도구 제목. 기본 일정                                                                                     |
| `defaultView`            | `day` · `week`(기본) · `month` · `resource`                                                                        |
| `defaultDate`            | 처음 표시할 `YYYY-MM-DD`. 기본은 달력 시간대의 오늘                                                                |
| `timeZones`              | 표시 시간대 선택 목록. 기본은 달력 시간대와 브라우저 시간대, UTC                                                   |
| `editable`               | 기본 true. false는 생성·편집·이동을 끄고 조회만 제공                                                               |
| `showTools`              | 기본 true. 상단 이동/보기/저장/파일 도구와 필터 표시                                                               |
| `step`                   | 드래그·키보드 이동 단위(분). 기본 15, 1~240                                                                        |
| `renderEvent(occ)`       | 일정 본문을 ReactNode로 표현. 이동·편집 조작은 공통 구현을 유지                                                    |
| 네이티브 div 속성        | ref·className·style·id·이벤트 전달. children/onChange 제외. 영역 role·이름은 달력이 지정                           |

`SchedulerData`는 `version: 1`, IANA `timeZone`, `events`, `resources`와 선택적 `businessHours`로 구성합니다.

- `events`: `{id, title, start, end, allDay?, resourceId?, notes?, recurrence?, exceptions?}`
- `start`/`end`는 달력 시간대의 벽시계 값입니다. 일반 일정은 `YYYY-MM-DDTHH:mm`, 종일 일정은 `YYYY-MM-DD`이며 종료는 배타적입니다.
- `recurrence`: `{freq: 'daily'|'weekly'|'monthly', interval?, byWeekday?, count?, until?}`. `byWeekday`는 매주 반복에서만 쓰며 0이 일요일입니다.
- `exceptions`: `{date, cancelled?, start?, end?, title?, resourceId?}`. `date`는 예외를 적용할 원래 회차의 시작 날짜입니다.
- `resources`: `{id, title}`. 회의실·장비처럼 겹치면 안 되는 대상입니다.
- `businessHours`: `{days, start, end}`. 표시용 배경과 업무 시간 밖 경고에 사용합니다.

이름·ID는 최대 200 UTF-16 단위이며 공백만인 값은 거부합니다. 메모는 최대 5,000자입니다.
일정 500개·리소스 50개·일정당 예외 100개·직렬화된 JSON 2백만 자가 상한입니다.
한 일정의 길이는 366일 이내이고, 반복은 시작일 기준 5,000회까지 펼칩니다.

## 변경과 검증

`validateScheduler(unknown)`은 검증 후 알려진 필드만 복사한 데이터를 반환합니다.
`updateScheduler(value, action)`은 같은 검증을 사용하는 순수 함수입니다. 실패 시 예외를 던지며 원본은 유지됩니다.

`SchedulerAction`:

- `put-event {event}`, `delete-event {id}`
- `put-occurrence {id, exception}`: 반복 일정의 한 회차만 변경. 같은 `date`의 예외를 교체합니다.
- `delete-occurrence {id, date}`: 반복이면 그 회차만 취소하고, 반복이 아니면 일정을 삭제합니다.
- `put-resource {resource}`, `delete-resource {id}`

put은 같은 ID가 있으면 편집하고 없으면 추가합니다. 파일 교체·실행 취소의 onChange는 `{type: 'replace'}`를 전달합니다.
반복 규칙을 바꿔 더 이상 존재하지 않는 회차의 예외는 `put-event`에서 함께 정리합니다.
리소스를 삭제해도 일정은 남고 리소스 연결만 해제합니다.

`expandScheduler(data, fromMs, toMs)`는 구간에 걸치는 회차를 시작 시각 순으로 펼칩니다.
각 회차의 `key`는 `이벤트ID|원래 시작 날짜`이며 예외로 옮긴 뒤에도 유지합니다.
`schedulerConflicts(occurrences)`는 같은 리소스가 겹치는 회차의 key 집합을, `schedulerOutsideHours(occurrence, hours)`는 업무 시간 밖 여부를 반환합니다.
겹침과 업무 시간은 저장을 막지 않고 화면에 표시하며, 편집 폼에서는 한 번 더 확인을 받습니다.

## 시간대와 DST

일정은 달력 시간대의 벽시계로 저장하므로 매일 09:00 반복은 서머타임 전후에도 09:00입니다.
`schedulerToUtc(wall, zone)`와 `schedulerToWall(ms, zone)`이 실제 시각과 벽시계를 변환합니다.
서머타임으로 존재하지 않는 시각은 건너뛴 구간 직후로 옮기고, 두 번 나타나는 시각은 앞선 쪽을 사용합니다.
표시 시간대를 바꾸면 화면의 열과 시각만 다시 계산하고 데이터는 그대로 둡니다. 이때 23시간·25시간인 날도 같은 열에 비례로 배치합니다.
편집 폼의 시작·종료는 항상 달력 시간대 기준이며 라벨에 시간대를 함께 표시합니다.

## 조작·접근성

- 빈 시간을 누르면 그 시각에서 시작하는 1시간짜리 일정을 만들고, 월 보기의 빈칸은 그날 09:00로 시작합니다.
  일정을 누르면 편집 폼이 열립니다. 반복 일정은 기본이 `이 일정만`이고 `반복 전체`로 바꾸면 시리즈 정의를 편집합니다.
- 마우스·펜으로 일정을 끌어 시간·날짜를, 아래 가장자리를 끌어 길이를 바꿉니다. 리소스 보기에서는 리소스도 바뀝니다.
  이동 중 목적지 시각을 표시하고, 화면 경계에서는 달력을 세로로 자동 스크롤합니다.
  Escape·창 포커스 이탈·pointercancel은 이동을 취소합니다. 반복 일정을 끌면 그 회차만 예외로 저장합니다.
- 일정에 포커스한 뒤 Alt+상하로 `step`분 이동, Alt+Shift+상하로 길이 조절, Alt+좌우로 하루씩 이동합니다.
  종일 일정은 Alt+상하도 하루 단위입니다. 이동 후 포커스를 복원하고 결과를 live region으로 알립니다.
- 터치는 드래그 대신 편집 폼과 키보드 조작을 사용합니다. 일정 버튼의 접근 가능한 이름에 제목·시각·리소스·겹침·반복 여부를 담습니다.
- 검색은 제목·메모의 부분 문자열, 리소스 필터는 ID입니다. 필터는 원본·저장·내보내기에 영향을 주지 않습니다.
- Ctrl/Meta+Z, Shift+Ctrl/Meta+Z는 입력 필드 밖에서 실행 취소·다시 실행을 수행합니다. 기록은 최대 50회입니다.
- 겹치는 일정은 같은 열을 나눠 배치하고, 겹침은 색과 접근 가능한 이름으로, 업무 시간 밖은 점선으로 표시합니다.
  다크·모바일·긴 문구를 기본 토큰으로 처리하고 가로 스크롤은 달력 내부에서만 발생합니다.

## 저장·복원과 iCalendar

`onSave`가 있으면 저장 버튼을 제공합니다. 처음 입력은 기준 상태이며 실제 저장을 했다고 표시하지 않습니다.
저장 호출은 중복 실행하지 않고, 실패하면 내용과 실행 취소 기록을 유지합니다.
저장 중 편집은 허용하며 저장 응답은 요청 당시 스냅샷만 확정합니다.
처음/저장한 상태로 되돌리기와 파일 교체는 현재 달력 전체를 바꾸므로 적용 확인 화면을 제공합니다.

`serializeSchedulerIcs(data)`는 RFC 5545 형식의 텍스트를, `parseSchedulerIcs(source, timeZone)`은 `{data, notes}`를 반환합니다.
`notes`는 가져오지 못한 항목을 한국어로 설명하며 반입 확인 화면에 그대로 표시합니다.

- 내보내기: `VEVENT`, `DTSTART`/`DTEND`(TZID 또는 VALUE=DATE), `SUMMARY`, `DESCRIPTION`, `RRULE`, `EXDATE`,
  변경한 회차의 `RECURRENCE-ID`, 리소스의 `LOCATION`과 `X-MEGA-RESOURCE`. 75옥텟 줄 접기와 텍스트 이스케이프를 적용합니다.
- 가져오기: 위 속성과 `DURATION`, UTC(`Z`)·다른 TZID 시각을 지원합니다. TZID를 모르면 대상 시간대로 읽고 note에 남깁니다.
- 지원하지 않는 부분: `VTIMEZONE` 정의를 내보내지 않고 TZID 이름에 의존합니다. `FREQ=YEARLY`와 `BYMONTHDAY`·`BYSETPOS`처럼
  모델에 없는 반복은 한 번만 열리는 일정으로 가져오며 note로 알립니다. `VTODO`·`VALARM`·참석자·상태·첨부는 가져오지 않습니다.
  파일은 8MB·2백만 자·일정 500개까지이며, 파싱이나 검증에 실패하면 현재 달력에 적용하지 않습니다.

협업 서버·권한·초대 응답·충돌 버전 검증은 소비 앱 책임입니다. onSave 실패 시 서버의 원시 예외를 화면에 노출하지 않습니다.

## 검증 범위

- `tests/scheduler.test.mjs`: 반복 전개·월말 건너뛰기·예외 적용·DST 벽시계와 없는 시각·겹침·업무 시간·검증 거부·
  원본 불변성·리소스 삭제·규칙 변경 시 예외 정리·iCalendar 왕복과 note·SSR.
- `tests/browser/scheduler.spec.ts`: 생성 시 겹침 경고와 재확인, 한 회차 편집·삭제와 나머지 회차 보존, 실행 취소·다시 실행,
  저장 실패/재시도·재열기, 실제 포인터 이동·길이 조절, 키보드 이동, 보기 전환, 표시 시간대 전환, iCalendar 내려받기·불러오기,
  다크 390px 레이아웃, 빈 상태.
- 성능 기준: 일정 300개(월 보기)의 표시 1,500ms 미만, 같은 데이터의 키보드 이동 800ms 미만.
  브라우저 개발 서버에서 측정하며 최초 네트워크 로딩은 포함하지 않습니다. 최대 500개를 지원하고 가상화는 하지 않습니다.
- 실제 스크린 리더 낭독, 모바일 하드웨어 터치, OS IME 조합 입력은 수동 검증하지 않았습니다.

### 실행 기록 · 2026-09-09

Node 24.18.0, macOS arm64, Playwright의 Chromium·Firefox·WebKit, Vite 개발 서버, 2 workers.
일정 300개의 월 보기 표시/키보드 이동은 Chromium 139/61ms, Firefox 97/76ms, WebKit 82/51ms였습니다.
통계적 벤치마크나 실제 기기 성능 보장은 아닙니다.
다크 390px과 1440px 화면, 겹침·업무 시간 표시, 저장 실패 시 내용 보존 문구를 동작과 대조했습니다.
