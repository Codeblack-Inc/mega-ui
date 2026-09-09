# Enterprise components

대용량·업무 데이터 화면을 위한 최소 API입니다. 모든 컴포넌트는 시맨틱 HTML과 기존 Mega UI 토큰을 사용하며 외부 데이터 그리드 의존성이 없습니다.

전문 기능이 필요한 그리드는 별도 진입점의 [DataGridPro](./data-grid.md)를 사용합니다. 아래 표의 `DataGrid`는 기존 경량 API이며, `DataGridPro`의 편집·필터·그룹·집계·트리·범위 작업·일괄 저장과 구분합니다.

## 공통 열 모델

`DataTable`, `VirtualTable`, `EditableTable`, `TreeTable`, `DataGrid`, `DataExplorer`는 `DataColumn<Row>`를 공유합니다.

```tsx
const columns = [
  { key: 'name', header: '이름', sortable: true },
  { key: 'amount', header: '금액', numeric: true, editable: true },
];
```

`key`는 기본 필드 접근자입니다. 계산 값은 `value(row)`, 표현은 `render(value, row)`로 지정합니다. 행 ID는 각 컴포넌트의 `getRowId(row)`로 제공합니다.

## 15개 매핑

| 번호 | 컴포넌트            | 핵심 API와 동작                                                               | 의도적인 경계                                              |
| ---- | ------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 106  | `Table`             | 기존 `TableHead`/`TableBody`/`TableRow`/셀 조합, 정렬 헤더·sticky·density     | 데이터 상태는 소유하지 않음                                |
| 107  | `DataTable`         | `rows`, `columns`, `getRowId`; 제어형/비제어형 정렬, 검색, 로딩·오류·빈 상태  | `manual`에서는 서버가 정렬·검색한 `rows`를 그대로 표시     |
| 108  | `VirtualTable`      | `height`, `rowHeight`, `overscan`; 스크롤 위치에 해당하는 고정 높이 행만 렌더 | 가변 행 높이는 지원하지 않음                               |
| 109  | `EditableTable`     | `editable`, `inputType`, `onCellChange(rowId, key, value)`                    | 저장·검증·낙관적 갱신은 소비자 책임                        |
| 110  | `TreeTable`         | `children`, controlled/uncontrolled `expandedIds`; 계층 행 펼치기             | 비동기 자식 로딩은 소비자가 노드 갱신                      |
| 111  | `PivotTable`        | `rowKey`, `columnKey`, `valueKey`, `sum`/`count`/`average` 집계               | 다중 차원·사용자 정의 수식 엔진 없음                       |
| 112  | `PropertyGrid`      | `items`, 항목별 `editable`, `onValueChange`                                   | 값 타입별 전용 편집기는 직접 `value`로 합성                |
| 113  | `DataGrid`          | 행 다중 선택, 부분 선택, 제어형/비제어형 정렬, 방향키 셀 이동                 | 클립보드·범위 선택 없음                                    |
| 114  | `Kanban`            | `TaskBoard`에 위임하는 deprecated 호환 API                                    | 신규 보드는 [TaskBoard](./task-board.md) 사용              |
| 115  | `Calendar`          | `month`, `events`, `selectedDate`, `onDateSelect`; 6주 달력                   | 반복 일정·시간대 계산 없음                                 |
| 116  | `Scheduler`         | 날짜별 시간순 `appointments`, 클릭 콜백                                       | 겹침 레이아웃과 반복 일정 없음. 전문 기능은 `SchedulerPro` |
| 117  | `Gantt`             | `start`/`end` 날짜를 실제 범위에 배치, `progress`, 선택적 범위                | dependency/critical-path 계산 없음                         |
| 118  | `Spreadsheet`       | 2차원 `cells`, `onCellChange`, 행·열 라벨, 방향키 이동                        | 수동 셀 편집만 제공하며 수식 엔진·병합 셀 없음             |
| 119  | `OrganizationChart` | 재귀 `root`/`children`을 중첩 목록으로 표현                                   | 자동 조직 편집·그래프 엣지 라우팅 없음                     |
| 120  | `DataExplorer`      | 검색, 표시 열 토글, 행 개수, `DataTable` 결과                                 | 원격 쿼리 빌더·차트 추천 없음                              |

## 제어 패턴

편집·이동 컴포넌트는 원본 데이터를 직접 바꾸지 않습니다. 콜백에서 애플리케이션 상태를 갱신하면 새 props가 다시 렌더됩니다. `TreeTable`과 `DataGrid`의 선택/확장은 controlled props를 생략할 때만 내부 상태를 사용합니다. DataTable/DataGrid의 `sort`와 `onSortChange`로 서버 정렬 상태를 연결하고, `manual`이면 전달된 페이지를 다시 정렬하거나 검색하지 않습니다. DataGrid의 전체 선택은 현재 전달된 행만 더하거나 빼므로 다른 서버 페이지의 선택 ID를 보존합니다. `VirtualTable`의 유효하지 않은 viewport·행 높이는 안전한 기본값으로 돌아가며, `Gantt`의 유효하지 않은 진행률은 0%로 표시합니다. `Spreadsheet`는 셀 경계의 좌우 방향키 또는 `Alt+방향키`로 셀을 이동하므로 셀 안의 텍스트 커서 이동을 방해하지 않습니다.

고정 행 높이로 충분하지 않거나 수식·critical path·서버 쿼리처럼 도메인 엔진이 필요한 시점에만 전용 엔진을 연결하세요.

`SpreadsheetPro`는 수식·범위 편집·채우기·병합·틀 고정·정렬·여러 시트와 CSV·xlsx 반출입을 제공합니다. [SpreadsheetPro API](./spreadsheet.md)를 참조하세요.

`DiagramEditor`는 노드·포트·연결 편집, 연결 제약, 드래그·다중 선택·스냅, 확대·이동·미니맵, 자동 배치, JSON·SVG 내보내기를 제공합니다. [DiagramEditor API](./diagram.md)를 참조하세요.

`SchedulerPro`는 일·주·월·리소스 보기, 반복과 회차 예외, 드래그·키보드 이동, 시간대·DST, 겹침·업무 시간 검증, iCalendar 반출입을 제공합니다. [SchedulerPro API](./scheduler.md)를 참조하세요.

`TaskBoard`는 Kanban의 단일 후속 구현입니다. 열·카드 CRUD, 드래그/키보드 정렬, 구획·카드 제한·필터·JSON·저장 복원은 [TaskBoard API](./task-board.md)를 참조하세요.
