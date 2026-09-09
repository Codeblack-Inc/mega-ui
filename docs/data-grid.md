# DataGridPro

첫 번째 전문 업무 컴포넌트입니다. `@mega-ui/react/data-grid`에서 가져옵니다.
기존 `@mega-ui/react`의 `DataGrid`는 가벼운 정렬·선택 API로 유지합니다. 두 컴포넌트는 같은 API가 아닙니다.

## 설치와 기본 사용

React/React DOM **19.2 이상**이 필요합니다. 엔진은 MIT 라이선스의 `react-data-grid@7.0.0-beta.61`로 고정합니다.
React와 엔진은 라이브러리 산출물에서 외부화하며, 기본 진입점에는 그리드 엔진을 포함하지 않습니다.
전문 그리드의 JS·CSS는 사용하는 화면에서 로드하세요. 배포 스타일에는 엔진 CSS가 포함됩니다.

```tsx
import { useState } from 'react';
import { DataGridPro, type GridColumn } from '@mega-ui/react/data-grid';
import '@mega-ui/react/styles.css';
import '@mega-ui/react/data-grid.css';

type Order = { id: string; customer: string; quantity: number };
const columns: readonly GridColumn<Order>[] = [
  { key: 'id', header: '주문 번호', frozen: 'start', width: 160 },
  { key: 'customer', header: '고객', editable: true },
  {
    key: 'quantity',
    header: '수량',
    kind: 'number',
    editable: true,
    aggregate: 'sum',
    validate: (value) =>
      typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
        ? undefined
        : '수량은 0 이상의 정수로 입력해 주세요.',
  },
];
const getRowId = (row: Order) => row.id;

export function Orders() {
  const [rows, setRows] = useState<readonly Order[]>([
    { id: 'order-1', customer: '김메가', quantity: 3 },
  ]);
  return (
    <DataGridPro
      rows={rows}
      columns={columns}
      getRowId={getRowId}
      onRowsChange={setRows}
      label="주문 원장"
    />
  );
}
```

`onRowsChange`가 없으면 모든 열이 읽기 전용입니다. `editable`이 있는 열도 임의로 편집하지 않습니다.
위 예제는 메모리에서만 저장합니다. 영속 저장은 아래 `onSave` 계약으로 연결합니다.

## 조회 전용 뷰어

단순 조회는 `onRowsChange` 없이 사용합니다. 편집 콜백을 유지한 채 조회 전용으로 표시하려면 `readOnly`를 지정하세요.

```tsx
<DataGridPro
  readOnly
  rows={rows}
  columns={columns}
  getRowId={getRowId}
  label="주문 조회"
/>
```

조회 전용에서는 원본 `rows`를 표시하며 검색·필터·정렬·그룹·트리·행/범위 선택·복사·CSV 내보내기를 유지합니다.
편집기·붙여넣기·값 변경·채우기는 막고 저장·실행 취소·초안 복구 도구와 편집 단축키 안내를 숨깁니다.
잘라내기는 값을 지우지 않고 복사만 합니다. `editable: true` 열과 저장 콜백을 전달해도 `readOnly`가 우선합니다.

실행 중 조회 전용으로 전환해도 미저장 초안은 삭제하지 않습니다. 원본 조회로 전환하고, 다시 편집 모드로 돌아오면
초안과 입력을 표시합니다. 이미 시작된 저장 요청은 완료될 수 있습니다. 조회 전용으로 시작하면 브라우저 초안은 읽거나 지우지 않습니다.
예제의 **사용 모드**에서 조회 전용/편집 가능을 선택할 수 있습니다. 예제는 미저장 작업이 있으면 전환을 막습니다.

## 지원하는 작업

| 영역        | 제공 동작                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 조회        | 전체 열 검색, 열별 조건의 AND 결합, 다중 열 정렬, 빈 값의 마지막 배치, 로컬·서버 페이지                                       |
| 필터        | 포함·시작·같음·다름·초과·이상·미만·이하·빈 값·값 있음; 숫자와 날짜 비교                                                       |
| 열          | 드래그 순서 변경, 키보드로 사용할 수 있는 앞/뒤 이동 버튼, 크기 조절·너비 입력, 숨김, 시작/끝 고정                            |
| 선택        | 행 선택, 부분 선택, 현재 행 전체 선택, 서버 페이지 밖의 선택 ID 유지, 셀 범위 드래그·Shift+방향키                             |
| 편집        | 텍스트·숫자·날짜·불리언·목록 선택, 값 변환, 셀·행 검증, Enter/Tab 적용, Escape 취소                                           |
| 일괄 작업   | 인용된 TSV 복사·잘라내기·붙여넣기, 다중 행/열, 한 값을 선택 범위에 채우기, 셀 채우기 핸들                                     |
| 초안        | 제한 가능한 undo/redo 이력, 오류 입력 보존, 선택적 브라우저 복구, 저장 전 변경 취소, 저장 실패 후 재시도, 원본 변경 충돌 감지 |
| 집계        | sum·average·min·max·count, 조회 결과 요약 행, 그룹별 요약                                                                     |
| 그룹·트리   | 여러 단계 그룹, 펼침·접힘·전체 펼침, 부모 ID 기반 트리, 부모 누락·순환 검증, 검색 일치 행의 조상 유지                         |
| 대량 데이터 | 행·열 가상화, 고정 행 높이, 10만 행 예제; 대량 CSS 행 배치 보완으로 Firefox에서도 마지막 행 접근                              |
| 내보내기    | 현재 조회 결과 또는 선택 결과의 CSV, 인용·줄바꿈·한글 BOM, 수식 주입 문자열 중화, 서버 내보내기 콜백                          |
| 상태        | 보기 직렬화·복원, 제어형 정렬/필터/페이지/열 설정, 로딩·오류·재조회, 원시 서버 예외와 사용자 안내 분리                        |

날짜 편집은 `YYYY-MM-DD` 문자열의 실제 달력 유효성을 검사합니다. 숫자는 빈 문자열을 `null`로 변환합니다.
빈 값을 허용하지 않는 열은 `validate`에서 제한하세요. `parse`를 지정하면 기본 변환을 대체합니다.
열 렌더러·변환기·검증기는 소비 앱 코드이므로 신뢰할 수 있는 함수만 전달합니다.

## 공개 API

| prop                                        | 의미                                                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `rows`, `columns`, `getRowId`               | 제어형 원본 행, `GridColumn<R>[]`, 고유 문자열 ID. ID는 편집 중 바꾸지 않습니다.                            |
| `readOnly`                                  | 명시적 조회 전용 모드. 기본 false이지만 `onRowsChange`가 없으면 항상 조회 전용입니다.                       |
| `onRowsChange(rows)`                        | 저장 성공 후 원본 상태 갱신. 소비 앱이 받은 행을 반영해야 합니다.                                           |
| `onSave(changes, { rows, signal })`         | 비동기 저장. 저장을 확정한 행 목록을 반환합니다. 실패하면 reject합니다.                                     |
| `onSaveError(error)`                        | 로깅 등 개발자 오류 처리. 원시 예외는 기본 UI에 표시하지 않습니다.                                          |
| `validateRow(row)`                          | 최종 변경 행의 교차 필드 검증. 오류 메시지 또는 `undefined` 반환.                                           |
| `view`, `defaultView`, `onViewChange(view)` | 검색·필터·다중 정렬·열 상태·그룹·페이지. 제어형이면 반드시 콜백에서 상태를 갱신합니다.                      |
| `selectedIds`, `onSelectionChange(ids)`     | 제어형 행 선택. `ReadonlySet<string>`/`Set<string>`. 생략하면 내부 상태를 사용합니다.                       |
| `draftStorageKey`                           | 선택적 브라우저 초안 보관. 사용자·문서·스키마별 고유 키를 지정하고 키 변경 시 컴포넌트를 다시 마운트합니다. |
| `onDirtyChange(dirty)`                      | 확정 전 입력을 포함한 미저장 상태 알림. 앱 내부 이동 보호에 사용합니다.                                     |
| `historyLimit`                              | 보관할 undo 배치 수. 기본 100, 0이면 이력 보관을 끕니다.                                                    |
| `onDraftChange(changes)`                    | 초안 변경 알림. 앱 내 이동을 막거나 미저장 배지를 표시할 때 연결합니다.                                     |
| `manual`, `rowCount`                        | 서버가 이미 처리한 페이지의 표시와 전체 결과 수. 로컬에서 다시 필터·정렬·슬라이스하지 않습니다.             |
| `loading`, `error`, `onRetry`               | 조회 중·실패·재시도. `error`에는 사용자에게 보여도 되는 메시지를 전달합니다.                                |
| `onExport({ view, selectedIds })`           | 전체 서버 결과 내보내기. 소비 앱이 파일 요청/다운로드를 완료한 뒤 resolve합니다.                            |
| `getParentId`, `treeColumnKey`              | 부모 문자열 ID 또는 `null`. 트리 펼침 UI를 표시할 열.                                                       |
| `height`, `rowHeight`, `direction`          | 기본 높이 560, 행 높이 40, `ltr`/`rtl`. 행 높이는 24px 이상.                                                |
| `label`, `className`, `ref`, section 속성   | 접근 가능한 이름, 스타일과 바깥 section DOM 연결.                                                           |

`GridColumn`은 `key`, `header`와 엔진의 폭·셀·그룹·요약 렌더 옵션을 사용합니다.
추가 속성은 `kind`, `options`, `value(row)`, `setValue(row,value)`, `parse(text,row)`,
`validate(value,finalRow)`, `editable: boolean | (row => boolean)`, `filterable`, `groupable`, `aggregate`입니다.
계산 열은 `value`와 필요하면 `setValue`를 사용합니다. `renderCell`만 바꿔도 정렬/CSV의 원본 값은 바뀌지 않습니다.
입력 편집기는 Mega UI의 검증 흐름을 사용하며 엔진의 `renderEditCell`은 직접 노출하지 않습니다.

`GridView`의 필드는 `query`, `filters`, `sorts`, `groupBy`, `columns`, `page`, `pageSize`입니다.
`sorts`의 방향은 `ASC`/`DESC`, `page`는 1부터 시작하고 `pageSize: 0`은 로컬 전체 행 보기입니다.
`defaultGridView`, `getGridRows`, `serializeGridView`, `parseGridView`, `createGridCsv`도 같은 진입점에서 제공합니다.
`parseGridView`는 버전과 값 구조를 검사하고 손상된 입력을 거부합니다. 예제는 이를 이용해 보기 설정을 복원합니다.

## 비동기 저장과 서버 데이터

각 `GridChange`에는 `rowId`, `columnKey`, `previousValue`, `value`가 들어갑니다.
키보드 편집·붙여넣기·채우기는 같은 검증 경로를 거칩니다. 배치 중 하나라도 오류이면 배치 전체를 거부합니다.
유효하지 않은 편집 입력은 Enter로 확정하지 않으며 Escape로 취소할 수 있습니다.
셀을 벗어나도 입력한 문자열을 보존하고 다시 편집할 때 복원합니다. 편집 중 Ctrl/⌘+S 또는 저장 버튼은
확정 전 입력까지 같은 배치 검증에 포함합니다. 오류가 하나라도 있으면 저장하지 않습니다.
`onDraftChange`에는 검증을 통과한 초안만 전달하며, 확정 전 입력을 포함한 이동 보호에는 `onDirtyChange`를 사용합니다.

```tsx
<DataGridPro
  rows={rows}
  columns={columns}
  getRowId={getRowId}
  onRowsChange={setRows}
  onSave={async (changes, { signal }) => {
    const response = await fetch('/api/orders/batch', {
      method: 'PATCH',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes }),
    });
    if (!response.ok) throw new Error('Batch request rejected');
    // 애플리케이션의 스키마로 응답을 검증한 뒤 전체 원본 행을 반환하세요.
    return parseOrderResponse(await response.json());
  }}
/>
```

`parseOrderResponse`는 소비 앱이 구현하는 도메인 검증 함수입니다. 존재하는 Mega UI export가 아닙니다.
서버는 권한, 값 검증, 원본 값/버전 비교, 트랜잭션을 수행해야 합니다. 프런트엔드 검증은 이를 대체하지 않습니다.
동일 셀의 원본 prop이 바뀌면 충돌을 표시하고 저장을 막습니다. 다른 페이지의 서버 변경은 클라이언트가
볼 수 없으므로 서버의 낙관적 동시성 검사가 반드시 필요합니다.

서버 모드는 `view`를 요청 조건으로 사용하고 오래된 응답을 취소하거나 무시해야 합니다.
초안은 행 ID로 보관하므로 페이지를 바꿔도 유지됩니다. `onSave`의 `context.rows`에는 현재 페이지와
다른 페이지에서 편집한 원본을 합친 변경 결과가 전달됩니다. 서버 모드의 `onRowsChange`에서는 반환 행을
캐시에 병합하고 현재 페이지에 해당하는 행만 다시 `rows`에 전달하세요.
전체 데이터의 최신 스냅샷을 모르는 상태에서 현재 페이지만으로 서버 전체 자료를 덮어쓰면 안 됩니다.

`onSave` 없이 저장하면 메모리 상태만 갱신합니다. 서버 콜백이 성공하기 전에는 초안/undo 이력을 지우지 않습니다.
미저장 초안과 확정 전 입력은 브라우저 종료 경고를 등록합니다. 앱 내부 라우팅은 `onDirtyChange`로 소비 앱에서 보호합니다.
`draftStorageKey`가 없으면 언마운트·강제 종료 후 복구하지 않습니다.

### 브라우저 초안 복구

`draftStorageKey="orders:user-123:document-456:v1"`처럼 사용자·문서·스키마 버전을 구분하는 키를 지정하면
초안, 오류가 있는 원문 입력, 편집한 행의 원본을 localStorage에 보관합니다. 복구 시에는 **초안 복구** 또는
**보관된 초안 삭제**를 선택합니다. 복구 전에는 편집을 막으며, 복구 후 현재 원본과의 충돌·편집 권한·값을 다시 검사합니다.
저장 성공·전체 변경 취소·마지막 변경 실행 취소 시 해당 초안을 지웁니다. undo/redo 이력 자체는 복구하지 않습니다.

- 브라우저 보관은 서버 저장을 대신하지 않습니다. 같은 브라우저·출처에서만 복구하며 로그아웃 시 키 정리는 소비 앱이 담당합니다.
  민감한 데이터 화면에서는 이 옵션을 사용하지 않거나 앱의 별도 보관 정책을 적용하세요.
- 기본 복구 형식은 손실 없이 JSON으로 표현되는 행과 문자열·유한 숫자·불리언·null 셀 값입니다.
  객체 셀 값, Date, undefined, BigInt, 음의 0 등은 변형해서 저장하지 않고 보관 실패로 알립니다.
  최대 5,000,000 UTF-16 코드 단위·100,000개 변경/입력 항목이며 브라우저 용량 제한은 더 작을 수 있습니다.
- 보관 실패 시 현재 화면의 입력은 유지하며 서버 저장을 계속 시도할 수 있습니다. 손상된 보관 자료는 자동 삭제하지 않습니다.
  같은 키가 다른 탭에서 변경된 것을 감지하면 덮어쓰기를 중단합니다. localStorage는 다중 탭 트랜잭션 저장소가 아니므로
  정확히 동시에 쓰는 상황까지 원자성을 보장하지 않습니다. 여러 탭의 동시 편집은 서버 버전 검증과 별도로 설계하세요.
- `draftStorageKey` 변경은 `key` prop으로 재마운트해야 합니다. 서버 모드의 페이지 밖 원본은 저장 서버가 다시 검증해야 합니다.
- `historyLimit`은 undo 배치 수를 제한합니다. 전체 초안 크기나 단일 대량 편집의 메모리 상한을 의미하지 않습니다.

## 작업 범위의 경계

- 그룹은 현재 그리드에 전달되는 페이지의 행을 대상으로 합니다. 서버 전체 그룹 집계는 서버에서 계산해야 합니다.
  로컬 하단 합계는 필터링된 전체 결과, 서버 하단 합계는 로드된 페이지의 합계입니다.
- 부모 트리는 클라이언트 전체 행을 사용하며 서버 페이지 또는 그룹과 동시에 사용하지 않습니다.
  데이터/검색/정렬/편집 모델은 공유하지만 임의 트리와 열 그룹은 별개의 계층입니다.
- 범위 작업은 현재 펼쳐진 행·표시 열에만 적용합니다. 읽기 전용 셀이 섞이거나 붙여넣기 범위를 벗어나면
  잘라 적용하지 않고 전체 작업을 거부합니다. 그룹 모드에서는 엔진 채우기 핸들을 제공하지 않으며,
  범위 붙여넣기로 같은 값을 채울 수 있습니다.
- TSV는 최대 5,000,000 UTF-16 코드 단위, 100,000셀까지 허용합니다. 대량 작업은 나눠 붙여넣습니다.
- 기본 CSV는 조회 결과/표시 열 기준입니다. 서버 모드에서 `onExport`가 없으면 버튼에 **현재 페이지**를
  표시하며 로드된 행만 내보냅니다. 전체 서버 결과/페이지 밖 선택 내보내기는 `onExport`로 연결합니다.
- CSV/TSV로 문자열을 복사할 때 수식 실행 위험이 있는 접두사에는 작은따옴표를 붙입니다. 숫자는 유지합니다.
  범용 CSV 수입이나 XLSX/수식 엔진은 이 그리드의 기능이 아닙니다. Spreadsheet 단계에서 별도로 다룹니다.
- 지원 브라우저는 현대 Chromium·Firefox·WebKit이며 고정 행 높이를 사용합니다. 10만 행은 검증용 규모이고
  무제한 메모리·데이터 크기를 보장하지 않습니다. 엔진 버전을 변경할 때 대량 행 배치 회귀 검사를 재실행해야 합니다.

## 검증

```sh
npm run check
npx playwright install chromium firefox webkit
npm run test:browser -- tests/browser/data-grid.spec.ts
```

예제: `/#data-grid-pro?full=1`. 브라우저 저장 후 재열기, 저장/조회 실패, 서버 페이지, 트리와
2,000/10,000/100,000행을 직접 조작할 수 있습니다. `/data-grid-test.html`은 개발 서버의 회귀 검사 전용입니다.
합성 IME/클립보드 이벤트 검사와 ARIA 검사는 실제 OS 입력기·스크린 리더·시스템 클립보드 전수 인증이 아닙니다.

엔진 출처: [react-data-grid 공식 문서](https://github.com/Comcast/react-data-grid),
[라이선스 고지](./react-data-grid-license.txt).

### 2026-09-09 검증 기록

- `npm run check` 통과: UX 문구 정적 검사, 타입, 포맷, Node 회귀 52개, 라이브러리·문서 빌드.
- Chromium·Firefox·WebKit의 DataGridPro 21개 시나리오씩 **63개 통과**. 실무 준비도·컴포넌트 검색 검사 포함 브라우저 전체 75개 통과.
- 편집/undo/redo, 실패 후 재저장·새로고침, 범위 붙여넣기 원자성, 실제 부모 트리, 검색·정렬·열 상태,
  페이지 간 초안 저장, 외부 원본 충돌, 읽기 전용, 합성 한글 조합 이벤트, CSV와 좁은 다크 화면을 검사했습니다.
- 추가 검사: 편집 중 단축키/버튼 저장, 오류 원문 이동·새로고침 복구, 복구 후 Enter/Tab 적용, 원본 충돌,
  초안 삭제, 보관 용량 실패, 다른 탭의 변경 감지, 손상 자료 보존, undo 이력 제한을 검사했습니다.
- 조회 전용 검사: 편집 콜백이 있어도 편집/붙여넣기를 차단하고 검색·정렬·선택·복사·CSV를 유지하며,
  편집→조회→편집 전환에서 원본 표시와 미저장 초안·오류 입력 보존을 확인했습니다.
- 배포 목록에 전문 JS·CSS·타입·API 문서·MIT 고지가 포함되는지 확인했습니다.
- 문구 의미 검토: 저장 확인 뒤 완료 안내, 저장 실패 시 입력 유지와 재시도, 현재 페이지 내보내기 범위,
  변경 취소 범위와 계속 편집 선택, 복구/삭제 선택, 보관 실패 시 서버 저장 안내, 브라우저 데모 저장 범위를 실제 동작과 대조했습니다.
- 문서 사이트의 기존 메인 청크 500KB 권고 경고는 남습니다. 전문 그리드 JS는 별도 동적 청크입니다.
- 실제 OS IME·스크린 리더·실제 서버의 권한/경합 검증은 미검증입니다. 서버 연결 계약과 테스트된 프런트엔드 흐름을 구분합니다.

10만 행 검사의 사전 통과 기준은 **데이터 전환부터 마지막 행 접근까지 10초 이내, DOM 행 80개 미만**입니다.
아래는 Apple M5 Pro / macOS arm64 / Node 24.18.0 / 1440×1000 / Vite 개발 서버에서 브라우저별 1회 측정한 참고값입니다.
데이터 생성·React 표시를 포함하며 네트워크 요청은 없습니다. 중앙값이나 운영 환경 성능 보장은 아닙니다.

| 브라우저               | 10만 행 전환 | 마지막 행 스크롤·표시 | DOM 행 수 |
| ---------------------- | ------------ | --------------------- | --------- |
| Chromium 153.0.8010.12 | 127ms        | 33ms                  | 18        |
| Firefox 155.0          | 190ms        | 35ms                  | 18        |
| WebKit 26.6            | 199ms        | 49ms                  | 18        |

## 남은 전문 기능

이번 보강은 편집·저장·초안 복구 흐름에 집중했습니다. 서버 전체 그룹/집계·트리 지연 로딩·전체 조회 결과 선택,
행 추가/삭제·사용자 정의 편집기·선택 범위 지우기/자동 스크롤, OR/중첩 필터·피벗·다단 헤더는 아직 구현하지 않았습니다.
실제 OS 입력기·클립보드·스크린 리더·터치와 장시간 대량 편집은 별도 검증이 필요합니다.
