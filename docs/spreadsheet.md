# SpreadsheetPro

`SpreadsheetPro`는 수식·범위 편집·여러 시트를 다루는 제어형 스프레드시트입니다.
`@mega-ui/react`와 기본 `styles.css`에서 제공합니다. 추가 엔진 의존성은 없고,
xlsx 압축은 브라우저의 `CompressionStream`·`DecompressionStream`을 사용합니다.
기존 `Spreadsheet`는 문자열 셀만 편집하는 가벼운 컴포넌트로 그대로 유지합니다.

```tsx
import { useState } from 'react';
import {
  SpreadsheetPro,
  emptySheet,
  type SpreadsheetData,
} from '@mega-ui/react';
import '@mega-ui/react/styles.css';

const initial: SpreadsheetData = {
  version: 1,
  sheets: [
    {
      ...emptySheet('sales', '매출'),
      cells: {
        A1: { value: '단가' },
        B1: { value: '수량' },
        C1: { value: '=A1*B1', format: 'currency' },
      },
    },
  ],
};
function Sheet() {
  const [value, setValue] = useState(initial);
  return <SpreadsheetPro value={value} onChange={setValue} label="매출 시트" />;
}
```

## API

| prop                     | 계약                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `value`                  | 필수 `SpreadsheetData`. 원본을 변경하지 않음                                                                       |
| `onChange(next, action)` | 입력·붙여넣기·채우기·정렬·시트 변경·실행 취소·복원의 결과. 생략 시 읽기 전용                                       |
| `onSave(snapshot)`       | 선택적 비동기 저장. resolve를 저장 확정으로 간주. 실패 시 현재 내용 유지. 실제 서버/브라우저 저장은 소비 앱이 수행 |
| `label`                  | 영역 이름·도구 제목. 기본 스프레드시트                                                                             |
| `editable`               | 기본 true. false는 편집 도구를 숨기고 조회·선택·복사만 제공                                                        |
| `showTools`              | 기본 true. 상단 서식/병합/고정/정렬/저장/파일 도구 표시                                                            |
| `defaultSheetId`         | 처음 표시할 시트. 기본은 첫 시트                                                                                   |
| 네이티브 div 속성        | ref·className·style·id·이벤트 전달. children/onChange 제외. 영역 role·이름은 시트가 지정                           |

`SpreadsheetData`는 `version: 1`과 `sheets` 배열입니다. 각 시트는 다음을 가집니다.

- `id`, `name`, `rows`, `columns`
- `cells`: `A1` 키에 `{value, format?, align?, bold?}`. `value`는 사용자가 입력한 원문이며 수식은 `=`로 시작합니다.
- `format`: `text` · `number` · `integer` · `currency` · `percent` · `date`. 표시 형식만 바꾸고 저장 값은 그대로입니다.
- `merges`: `A1:B2` 범위 목록. 병합 범위끼리 겹칠 수 없고 왼쪽 위 셀만 내용을 가집니다.
- `frozenRows` · `frozenColumns`: 화면 위·왼쪽에 고정할 개수
- `columnWidths`: 열 문자에 대한 픽셀 너비(40~600)

시트 10개·시트당 1,000행·52열(A~AZ)·20,000셀, 셀 입력 1,000자, 직렬화된 JSON 2백만 자가 상한입니다.
시트 ID와 이름은 중복할 수 없습니다.

## 수식

`evaluateSpreadsheet(data)`가 모든 셀을 의존성 순서로 계산해 `sheetId!A1` 키의 값을 돌려줍니다.

- 연산자: `+ - * / ^ %`, 비교 `= <> < <= > >=`, 문자 이어붙이기 `&`, 괄호, 음수
- 참조: `A1`, `$A$1`, 범위 `A1:B2`, 다른 시트 `요약!A1`과 `'9월 매출'!A1`
- 함수: SUM, AVERAGE, COUNT, COUNTA, MIN, MAX, ABS, SQRT, ROUND, POWER, MOD, IF, IFERROR,
  AND, OR, NOT, LEN, LEFT, RIGHT, MID, UPPER, LOWER, TRIM, CONCAT, CONCATENATE, COUNTIF, SUMIF
- 오류: `#DIV/0!` · `#VALUE!` · `#REF!` · `#NAME?`와 순환 참조의 `#순환!`.
  오류는 참조하는 셀로 그대로 번지며 `IFERROR`로 대체할 수 있습니다.
- 순환 참조는 계산을 멈추지 않고 순환에 속한 셀만 `#순환!`로 표시합니다.
- 날짜 함수(TODAY·NOW)와 배열 수식, 이름 정의, 조건부 서식은 제공하지 않습니다. 날짜는 문자열로 다룹니다.

`shiftFormula(source, dr, dc)`는 상대 참조만 옮기고 `$` 고정은 유지하며, 시트를 벗어나면 `#REF!`로 바꿉니다.
채우기와 붙여넣기가 이 함수를 사용합니다.

## 변경과 검증

`validateSpreadsheet(unknown)`은 검증 후 알려진 필드만 복사한 데이터를 반환합니다.
`updateSpreadsheet(value, action)`은 같은 검증을 사용하는 순수 함수입니다. 실패 시 예외를 던지며 원본은 유지됩니다.

`SpreadsheetAction`: `set-cells` · `resize-sheet` · `set-column-width` · `merge` · `unmerge` · `freeze` ·
`sort` · `add-sheet` · `rename-sheet` · `delete-sheet`.

- `set-cells`는 값·형식·정렬·굵게를 한 번에 바꾸고, `null`은 해당 속성을 지웁니다. 내용이 모두 빈 셀은 저장하지 않습니다.
- `resize-sheet`는 내용이 있는 셀을 잘라내야 하면 거부합니다. 붙여넣기가 시트보다 크면 먼저 늘립니다.
- `sort`는 선택 범위의 값과 서식만 옮깁니다. **범위에 수식이 있으면 거부**합니다. 참조를 다시 쓰지 않기 때문입니다.
- `delete-sheet`는 마지막 시트를 지우지 않습니다. 행·열 삽입과 삭제는 제공하지 않습니다.

## 조작·접근성

- 셀을 눌러 선택하고 끌어 범위를 만듭니다. 열·행 머리글을 누르면 열·행 전체를 선택합니다.
- 활성 셀에는 항상 입력 요소가 있습니다. 바로 입력하면 편집이 시작되므로 **한글 IME 조합도 첫 글자부터 입력**됩니다.
  Enter는 아래로, Tab은 오른쪽으로 확정하며 Escape는 취소합니다. 수식 입력줄에서도 같은 값을 편집합니다.
- 방향키로 이동하고 Shift+방향키로 범위를 넓힙니다. Ctrl/⌘+방향키는 끝으로, Home·End는 행의 처음·끝으로 이동합니다.
  PageUp·PageDown은 15행씩 이동하고, Ctrl/⌘+A는 사용 중인 범위를 선택합니다.
- Delete·Backspace는 선택 범위를 비웁니다. Ctrl/⌘+C·X·V는 탭 구분 텍스트로 복사·잘라내기·붙여넣기하며
  엑셀·구글 시트와 그대로 주고받습니다. 붙여넣기는 필요한 만큼 시트를 넓힙니다.
- 선택 오른쪽 아래 손잡이를 끌면 값·수식을 채웁니다. 세로 한 열의 숫자 두 개 이상을 고르면 등차수열로 이어 갑니다.
  수식은 상대 참조를 옮겨서 채웁니다.
- Ctrl/Meta+Z, Shift+Ctrl/Meta+Z는 실행 취소·다시 실행입니다. 기록은 최대 50회입니다.
- 행 필터는 화면 표시만 거릅니다. 데이터·저장·내보내기에는 영향을 주지 않습니다.
- 그리드는 `role="grid"`, 셀은 `role="gridcell"`이며 활성 셀 입력에 셀 주소를 접근 가능한 이름으로 붙입니다.
  화면에 보이는 행만 렌더링하며 고정 행은 항상 유지합니다.

## 파일

- **CSV 내려받기**: 계산된 값과 표시 형식을 그대로 씁니다. BOM을 붙여 엑셀에서 한글이 깨지지 않습니다.
- **xlsx 내려받기**: 값·수식·병합·틀 고정을 담은 최소 SpreadsheetML을 만듭니다. 셀 서식·색·차트·도형은 담지 않습니다.
- **파일 불러오기**: 내용을 보고 형식을 판별합니다. zip 머리표는 xlsx, `{`로 시작하면 버전 1 JSON, 그 외는 CSV입니다.
  xlsx는 값·수식·병합·틀 고정을 가져오고 서식은 가져오지 않습니다. 공유·배열 수식은 각 셀 값으로 들어옵니다.
  가져오지 못한 항목은 확인 화면에 목록으로 보여 줍니다. 파일은 8MB까지입니다.
- xlsx는 **엑셀 전체 호환이 아닙니다.** 위에 적은 범위만 주고받으며, 그 밖의 기능은 파일을 다시 열 때 사라집니다.

`onSave`가 있으면 저장 버튼을 제공합니다. 저장 실패 시 내용과 실행 취소 기록을 유지하고, 되돌리기와 파일 교체는 확인 화면을 거칩니다.

## 검증 범위

- `tests/spreadsheet.test.mjs`: 참조·범위 변환, 연산자·함수·다른 시트 참조, 순환 참조, 표시 형식,
  편집 시 원본 불변성, 병합·고정·크기·시트 동작, 정렬과 수식 거부, 참조 이동과 채우기·붙여넣기,
  CSV 쓰기·읽기, JSON 왕복, xlsx 왕복(값·수식·병합·고정).
- `tests/browser/spreadsheet.spec.ts`: 입력과 재계산, 순환 표시, 실행 취소, 범위 비우기,
  채우기 손잡이, 탭 구분 붙여넣기, 정렬, 병합·해제, 행 필터, 시트 전환·추가·삭제,
  CSV·xlsx 내려받기와 다시 읽기, 저장 실패/재시도·재열기, 다크 390px, 가상 스크롤.
- 성능 기준: 500행(수식 499개) 예제 전환 후 DOM 표시 2,500ms 미만. 브라우저 개발 서버에서 측정하며
  최초 네트워크 로딩은 포함하지 않습니다. 최대 1,000행·20,000셀을 지원하고 행만 가상화합니다.
- 실제 스크린 리더 낭독, 모바일 하드웨어 터치, OS IME 조합 입력은 수동 검증하지 않았습니다.
  자동 검사는 Playwright의 입력 이벤트로만 확인했습니다.

### 실행 기록 · 2026-09-09

Node 24.18.0, macOS arm64, Playwright의 Chromium·Firefox·WebKit, Vite 개발 서버, 2 workers.
500행 예제 전환은 Chromium 67ms, Firefox 48ms, WebKit 56ms였습니다.
통계적 벤치마크나 실제 기기 성능 보장은 아닙니다.
라이트 1440px과 다크 390px 화면에서 그리드·수식 입력줄·시트 탭과 문구를 동작과 대조했습니다.
