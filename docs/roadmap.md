# 로드맵

목표는 사내 웹 대부분을 라이브러리 조합으로 구현하는 것입니다. 아래 순서는 제안이며,
실제 제품 화면의 반복 빈도와 요구를 기준으로 우선순위를 조정합니다.

| 단계              | 범위                                                                                                 | 상태                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 0. 기반           | 빌드/타입/CSS 배포, 213개 런타임 export, 토스 실측 토큰(light/dark), 28개 화면 예제, AI 가이드       | 구현됨                                                                  |
| 1. 상호작용       | Dialog, Tooltip, Menu, Tabs, Toast, Radio                                                            | 구현됨                                                                  |
| 1b. 확장 상호작용 | Drawer, Popover, Accordion                                                                           | 구현됨                                                                  |
| 2. 입력/데이터    | Table, Pagination, EmptyState, Skeleton, Stat, Amount, Avatar/AvatarGroup, Banner                    | 구현됨                                                                  |
| 2b. 확장 입력     | Combobox (datalist), FileUpload (파일 선택 UI)                                                       | 구현됨                                                                  |
| 3. 화면 패턴      | SideNav, NavRail, TopBar, Breadcrumb, Chip, IconButton                                               | 구현됨                                                                  |
| 3b. 확장 패턴     | AppShell, AlertDialog, Chat, AgentActivity                                                           | 구현됨                                                                  |
| 4. 예제 확장      | 목록/상세/생성/수정, 검색, 권한, 오류, 온보딩, 커머스, 운영 화면                                     | 예정                                                                    |
| 5. 유통/AI        | 사내 레지스트리, 버전/변경 기록, 문서 검색, MCP resources/tools                                      | 예정                                                                    |
| 6. 전문 업무 기능 | Scheduler, Text Editor, Charts, Task Board, Data Grid, Diagram, Spreadsheet, PDF Viewer (Gantt 제외) | DataGridPro · Text Editor · Charts · TaskBoard · SchedulerPro 기능 구현 |

## 전문 업무 기능 지원 목표

2026-09-09 요구 반영: 위 9개 영역을 정식 지원 목표에 포함합니다. 기존 컴포넌트의 이름이나 기본 렌더링만으로 전문 기능 지원을 완료 처리하지 않습니다. 아래는 현재 소스와 목표의 차이이며, 구현 완료 목록이 아닙니다. 기존 [확장 보고서](./component-gap-report.md)의 조건부 후보였던 전문 기능을 명시적인 목표로 올립니다.

참조한 [PrimeUI Pro 공식 소개](https://primeuipro.dev/)는 확인일 기준 Scheduler·Text Editor·Charts·Task Board를 공개 기능으로, PDF Viewer·Diagram·Grid·Gantt를 출시 예정으로 구분합니다. 해당 소개에서 Spreadsheet의 공개 상태는 확인하지 못했습니다. 아래 목표는 사용자 요구와 Mega UI의 업무 활용 기준이며, 경쟁 제품 전체 기능을 직접 검증한 대조표는 아닙니다.

| 영역        | 현재 구현                                                                                           | 정식 지원 목표                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scheduler   | SchedulerPro 일·주·월·리소스 뷰·CRUD·드래그·반복/예외·시간대·충돌·ICS 구현                          | 일·주·월·리소스 뷰, 생성·수정·삭제, 드래그 이동·기간 조절, 겹침 배치, 반복과 개별 예외, 시간대·DST, 업무 시간·예약 충돌 검증, 일정 가져오기·내보내기         |
| Text Editor | TextEditor: 표·이미지·블록·Markdown·JSON 저장/복원                                                  | 문단·서식·목록·링크·표·이미지·블록 편집, Markdown 변환, 붙여넣기 정제, 한글 IME, undo/redo, 문서 직렬화·복원, 저장 실패 시 내용 보존                         |
| Charts      | ChartPro 전체 목표 유형·시간/이중 축·드래그 탐색·표·PNG/SVG/CSV 구현                                | 다중 계열·축·범례·툴팁, 막대·선·영역·원형·산점·히트맵·트리맵·금융 차트, 확대·이동·구간 선택, 결측·음수·시간축 처리, 데이터 대체 표현, 이미지·데이터 내보내기 |
| Task Board  | TaskBoard CRUD·정렬·구획·WIP·필터·저장/JSON, Kanban 통합                                            | 열·카드 생성·편집·삭제, 열 안/사이 드래그 정렬, 키보드 이동, swimlane, WIP 제한, 필터·담당자·기한, 사용자 카드 렌더링, 순서·상태 저장과 복원                 |
| Data Grid   | 별도 DataGridPro에 편집·검증·범위·그룹·트리·가상화·서버 저장 통합                                   | 정렬·필터·편집·선택·가상화의 통합, 열 크기·순서·고정·숨김, 범위 선택·복사·붙여넣기, 그룹·집계·트리, 서버 조회·페이지 연결, 검증·취소·일괄 저장, CSV 내보내기 |
| Gantt Chart | 날짜 범위의 작업 막대와 진행률 표시                                                                 | **지원 목표에서 제외(2026-09-09 결정).** 기존 `Gantt`는 막대·진행률 표시 용도로만 유지하며 의존성·critical path는 제공하지 않습니다                          |
| Diagram     | DiagramEditor 노드·포트·엣지 편집·제약·다중 선택·스냅·확대/미니맵·자동 배치·undo/redo·JSON/SVG 구현 | 노드·포트·엣지 생성·연결·편집, 연결 제약, 드래그·다중 선택·스냅, 확대·이동·미니맵, 자동 배치·엣지 경로, undo/redo, 직렬화·복원·내보내기                      |
| Spreadsheet | 문자열 셀 편집과 방향키 이동                                                                        | 범위 선택·복사·붙여넣기·자동 채우기, 수식·참조·재계산·순환 오류, 셀 형식·병합·고정, 정렬·필터, 여러 시트, undo/redo, CSV/XLSX 반입·반출                      |
| PDF Viewer  | 브라우저 내장 PDF object와 열기 링크                                                                | 일관된 페이지 렌더링·탐색·썸네일·확대·회전, 검색·텍스트 선택, 주석·양식 입력·서명 표시, 변경 저장·재열기·인쇄·다운로드, 암호·손상 문서 오류 처리             |

현재 구현 근거: [업무 데이터](../src/components/enterprise.tsx), [차트](../src/components/advanced-patterns.tsx), [PDFViewer](../src/components/media-ai.tsx), [공개 API](../src/index.ts).

### 구현 원칙과 순서

기존 토큰·컨트롤·제어형 상태 패턴은 재사용합니다. 수식, 문서 편집, PDF 렌더링, 일정 계산처럼 검증 비용이 큰 기능은 전용 엔진 재사용을 우선 검토합니다. 엔진 선택 시 실제 필수 기능, 재배포 라이선스, React 19 호환성, 한글 입력, 접근성, 번들·worker 구성을 작은 동작 예제로 검증합니다. 첫 Data Grid에는 MIT 라이선스의 `react-data-grid@7.0.0-beta.61`을 도입했습니다. Charts는 Apache-2.0 라이선스의 Apache ECharts 6.1을 도입했습니다. 기존 경량 SVG API도 유지합니다.

전문 기능을 사용하는 화면에서만 필요한 엔진을 로드하도록 구성합니다. 현재 가벼운 API의 동작을 바꿀 경우 호환 경로를 제공하고, 무거운 엔진을 기본 진입점에 일괄 추가하지 않습니다. 저장·권한·협업 서버는 소비 앱과 연결하되, 변경 요청·저장 중·실패·재시도·복원 흐름은 공식 예제에서 끝까지 검증합니다.

제안 순서는 **Data Grid → Text Editor → Charts → Task Board → Scheduler → Diagram → Spreadsheet → PDF Viewer**입니다. 2026-09-09 결정으로 **Gantt Chart는 지원 목표에서 제외**하며, 기존 경량 `Gantt` 컴포넌트만 현재 범위대로 유지합니다. 앞의 네 영역은 기존 목록·작성·분석·업무 화면에 적용했고, Scheduler의 달력·시간 모델 검증 뒤 Diagram을 진행합니다. 나머지 영역도 지원 목표에 유지하며 실제 적용 제품에 따라 순서를 조정합니다.

### 첫 구현: DataGridPro

`@mega-ui/react/data-grid`에 전문 그리드를 구현했습니다. 기존 경량 DataGrid는 유지합니다.
[API와 지원 범위](./data-grid.md), `/#data-grid-pro?full=1`의 주문 원장 예제와 브라우저 회귀 검사를 제공합니다.
전체 전문 기능 9종을 완료한 상태는 아닙니다. Text Editor의 표·이미지·블록·Markdown 변환까지 구현했으며 실기기 검증은 남아 있습니다.

### 두 번째 구현: TextEditor

`@mega-ui/react/text-editor`에 Tiptap 기반 편집기를 추가했습니다.
[기능별 상태와 API](./text-editor.md), `/#text-editor?full=1` 예제, JSON 검증과 브라우저 회귀 검사를 제공합니다.
문단·서식·목록·링크·표·이미지·블록 이동/복제/삭제·Markdown 변환·붙여넣기 정제·undo/redo·저장과 복원을 구현했습니다.
기능 구현과 실기기 검증 상태는 구분합니다. 실제 OS IME·스크린 리더 검증은 남아 있으며,
Charts의 구현 범위는 아래와 같습니다.

### 세 번째 구현: Charts

`@mega-ui/react/charts`에 다중 계열 `CartesianChart`와 `createChartCsv`를 추가했습니다.
공통 축·범례·툴팁, 음수·결측, 키보드 탐색, 전체 데이터 표·CSV를 제공합니다.
[API·기능별 상태·검증 한계](./charts.md), `/#charts?full=1`의 판매 채널 손익 예제와
`tests/charts.test.mjs`·`tests/browser/charts.spec.ts`가 구현 근거입니다.
영역·누적 막대·누적 영역·원형·도넛과 범주 구간 확대·축소·이동을 보강했습니다.
`ChartPro`에 산점·히트맵·계층 트리맵·OHLC 캔들/거래량, 실제 시간축·시간대·이중 축,
드래그 확대·이동·영역 선택, 네이티브 키보드 대체 조작과 PNG/SVG/전체·선택 CSV 내보내기를 구현했습니다.
최대 10,000개 데이터의 페이지형 표와 로딩·빈 결과·오류·재시도 예제를 제공합니다.
세 전문 영역은 컴포넌트 카탈로그 `#components/professional`과 글로벌 검색에도 등록했습니다.
로드맵에 명시한 Charts 기능을 구현했습니다. `tests/chart-pro.test.mjs`와 `tests/browser/chart-pro.spec.ts`에서
유형·데이터 검증·DST·실제 포인터 조작·내보내기를 검사합니다. 실제 스크린 리더와 실기기 터치의 수동 검증은 별도로 남습니다.

### 네 번째 구현: TaskBoard

`TaskBoard`에 열·카드·구획 CRUD, Pointer Events 드래그/키보드 정렬, WIP 제한, 검색·담당자·기한,
사용자 카드 렌더링과 버전 1 JSON 저장/복원을 구현했습니다. 저장 실패·재시도·저장 중 편집·실행 취소를 처리합니다.
기존 Kanban 마크업/스타일과 프로젝트 보드의 중복 구현은 제거하고, Kanban은 호환 어댑터만 남겼습니다.
[API와 검증 범위](./task-board.md), `/#board?full=1`, 전문 컴포넌트 카탈로그, 모델·브라우저 검사가 근거입니다.
실제 스크린 리더·모바일 하드웨어·OS IME의 수동 검증은 별도입니다.

### 다섯 번째 구현: SchedulerPro

`SchedulerPro`에 일·주·월·리소스 보기, 일정 생성·편집·삭제, 포인터 드래그 이동·기간 조절, 겹침 배치,
매일·매주·매월 반복과 회차 단위 예외, 벽시계 기반 시간대·DST 처리, 표시 시간대 전환,
업무 시간 표시와 리소스 예약 충돌 검증, iCalendar 내보내기·가져오기를 구현했습니다.
저장 실패·재시도·저장 중 편집·실행 취소와 파일 교체 확인은 TaskBoard와 같은 흐름을 사용합니다.
기존 경량 `Scheduler`는 날짜별 목록 용도로 유지하고, 전문 기능은 새 컴포넌트가 담당합니다.
[API와 검증 범위](./scheduler.md), `/#scheduler?full=1`, 전문 컴포넌트 카탈로그,
`tests/scheduler.test.mjs`·`tests/browser/scheduler.spec.ts`가 근거입니다.
반복 규칙은 매일·매주·매월과 간격·요일·횟수·종료일까지이며 `FREQ=YEARLY`·`BYMONTHDAY` 같은 규칙,
`VTIMEZONE` 내보내기, 초대·참석자 응답은 구현하지 않았습니다.
실제 스크린 리더·모바일 하드웨어·OS IME의 수동 검증은 별도입니다.

### 여섯 번째 구현: DiagramEditor

`DiagramEditor`에 노드·포트·연결 생성과 편집, 방향·자기 연결·중복·포트 제한·종류 규칙의 연결 제약,
드래그 이동과 사각형 다중 선택·격자 스냅, 확대·이동·미니맵, 계층 자동 배치와 직각 경로,
실행 취소·다시 실행, 버전 1 JSON 저장/복원과 SVG 내보내기를 구현했습니다.
저장 실패·재시도·저장 중 편집과 파일 교체 확인은 TaskBoard·SchedulerPro와 같은 흐름을 사용합니다.
기존 `OrganizationChart`는 계층 목록 용도로 유지합니다.
[API와 검증 범위](./diagram.md), `/#diagram?full=1`, 전문 컴포넌트 카탈로그,
`tests/diagram.test.mjs`·`tests/browser/diagram.spec.ts`가 근거입니다.
노드를 피해 가는 경로 계산, PNG 변환, 그룹·서브그래프, 실시간 협업은 구현하지 않았습니다.
실제 스크린 리더·모바일 하드웨어·OS IME의 수동 검증은 별도이며, 다음 전문 영역은 Spreadsheet입니다.

### 전문 기능 완료 기준

- 영역별로 위 목표를 기능 단위의 `미구현 / 부분 구현 / 검증 완료` 목록으로 관리하고, API·예제·회귀 검사 근거를 연결합니다. 일부 기능이 남아 있으면 영역 전체를 완료로 표시하지 않습니다.
- 각 영역에 생성 또는 불러오기 → 편집 → 검증 → 저장 → 재열기의 실제 업무 예제를 제공합니다. 읽기 전용 기능은 조회·탐색·내보내기를 검증합니다. 저장 실패·취소·undo/redo에서 데이터 보존을 확인합니다.
- 키보드·터치·스크린 리더, 한글 IME·로케일·시간대, light/dark, 좁은 화면을 해당 기능에 맞춰 검증합니다. Chrome·Firefox·Safari의 핵심 작업 흐름을 브라우저 회귀 검사와 수동 기록으로 남깁니다.
- 대량 행·열·일정·노드·페이지별로 데이터 규모, 측정 환경, 초기 표시·편집·스크롤 응답 목표를 구현 전에 정하고 측정값을 기록합니다. 단순 SSR 검사로 성능이나 상호작용 완료를 대신하지 않습니다.
- 외부 HTML·URL·파일·수식 입력의 검증과 안전한 처리를 포함합니다. 문서 변환은 지원 서식·함수·파일 버전과 손실 가능 항목을 명시하고, 저장 후 재열기 검사를 통과해야 합니다. XLSX 지원을 Excel 전체 호환으로, 서명 표시를 암호학적 전자서명으로 표현하지 않습니다.
- 각 단계의 타입·빌드·핵심 로직 검사와 브라우저 작업 흐름 검사를 통과하고 문서에 검증 범위를 공개합니다. 구현 범위 밖의 협업·백엔드 기능은 연결 계약과 미지원 상태를 구분합니다.

## 구현됨 상세

150개 요청 전체의 처리 현황과 범위는 [컴포넌트 대조표](./component-coverage.md)를 기준으로 합니다. 기존 목록에 더해 데이터 정렬/편집/가상화, 업무 일정, 파일 미리보기, AI 대화 UI를 제공합니다. 도메인 엔진과 서버 연결은 별도입니다.

- 레이아웃·타이포그래피: Container, Stack, Grid, Heading, Text
- 컨트롤: Button, IconButton, Chip, Input, Textarea, Select, Checkbox, Radio, Field
- 표면·패턴: Card, Badge, Alert, Separator, PageHeader, ListRow, Switch, SegmentedControl, BottomCTA, ProgressBar, Result
- 내비게이션: Tabs, TabPanel, SideNav, SideNavSection, SideNavItem, NavRail, NavRailItem, TopBar, TopBarLink, Breadcrumb, BreadcrumbItem, Pagination
- 오버레이: Dialog, Menu, MenuItem, MenuSeparator, MenuLabel, Tooltip, ToastProvider, useToast
- 데이터: Table 계열 7종, Stat, Amount, Avatar, AvatarGroup, Skeleton, Banner, EmptyState

- 폼: AutoComplete, CheckboxGroup, DatePicker, FloatLabel, IconField, IftaLabel, InputColor, InputGroup, InputMask, InputNumber, InputOtp, InputPassword, InputTags, KeyFilter, Knob, Label, Listbox, Rating, Slider, ToggleButton 및 기존 API 별칭 4종

## 내비게이션 ref 전달 구현

`SideNavItem`·`NavRailItem`은 `href` 유무에 맞춰 링크·버튼 ref와 네이티브 속성을 전달합니다.
[공개 API](./components.md#sidenav-nav--sidenavsection-div--sidenavitem-a-또는-button)와
`examples/readiness.tsx`의 실제 DOM ref·포커스·해제 회귀 검사로 범위를 확인합니다.

## 남은 과제

- 중복 컴포넌트 통합: 이름만 다른 짝(InputPassword/PasswordInput, InputNumber/NumberInput, InputMask/MaskInput, InputOtp/OTPInput, InputColor/ColorInput, AutoComplete/Autocomplete, DatePicker/DateInput, Field/FormField)은 현재 별칭 export이고, Radio/RadioGroup, IconField/SearchInput은 확장판입니다. 다음 메이저에서 한 이름으로 합치고 별칭은 deprecated 처리합니다. FileUpload/Dropzone/FilePreview/PDFViewer도 파일 컴포넌트 하나로 정리합니다.
- Menu와 Tooltip은 위치 계산을 하지 않아 뷰포트 경계에서 잘릴 수 있습니다.
- Table은 표 구조를 제공하고 DataTable/DataGrid/VirtualTable이 정렬·선택·고정 높이 가상 스크롤을 담당합니다. 서버 데이터 요청은 소비 앱의 몫입니다.

## 컴포넌트 완료 기준

- public props와 ref 전달, native 속성 전달을 확인합니다.
- default, hover, focus, disabled, loading, error 등 해당 상태를 다룹니다.
- 키보드만으로 조작하고, 접근 가능한 이름 및 스크린리더 의미를 확인합니다.
- light/dark, 긴 한글/영문, 좁은 화면, reduced motion을 확인합니다.
- 기본 예제뿐 아니라 실제 화면 조합 예제를 추가합니다.
- 핵심 상호작용에 회귀 검증을 남기고 타입/빌드 검사를 통과합니다.
- AI 가이드와 API 문서에 공개 API와 제약을 반영합니다.

## 도구 도입 시점

- 접근성 primitive: 위치 계산이 필요한 Popover/Combobox를 만들 때 검토합니다.
- Storybook: 독립적인 상태 탐색, 시각 회귀, 디자이너 리뷰 수요가 현 예제 사이트를 넘을 때 검토합니다.
- 모노레포: 독립적으로 버전/배포할 패키지가 생겼을 때 도입합니다.
- MCP: 정적 문서로 해결되지 않는 컴포넌트 검색/버전별 조회 수요가 생겼을 때 도입합니다.

빌드한 ESM의 서버 렌더링과 CSS/타입/문서 산출물을 검사합니다.
개발 서버의 카탈로그에서 입력·키보드·모바일·테마를 확인합니다. 수동 브라우저 검증 결과는 [검증 기록](./verification.md)에 남기며, 지속적인 브라우저 회귀 자동화와 스크린 리더 전수 검사는 후속 과제입니다.
