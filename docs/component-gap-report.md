# Mega UI 컴포넌트 확장 보고서

> 이 문서는 `05b7e4b` 시점의 구현 전 계획입니다. 여기서 제안한 목록·폼·차트·파일 패턴은 이후 구현됐습니다. 현재 상태와 보완된 API는 [실무 준비도 보강](./readiness.md) 및 실제 소스를 기준으로 확인하세요.

작성일: 2026-09-09 · 기준 커밋: `05b7e4b` · 대상: `@mega-ui/react`

## 1. 판단

**현재 Mega UI는 기본 요소의 종류는 넓게 갖췄지만, 업무 화면을 완성하는 조합 컴포넌트와 복합 컴포넌트의 기능 깊이가 부족하다.** 사용자 관리·설정·리포트·파일 관리 화면을 만들 때 검색 조건, 일괄 작업, 저장 상태, 차트 등을 소비 앱이 다시 구현해야 한다. “컴포넌트가 많은데도 막상 쓸 것이 부족하다”는 인상을 줄 만한 구조다.

다음 확장은 **공통 컴포넌트 후보 15종, 기존 컴포넌트 보강 8개 묶음, 공통 아이콘 자산 승격**을 중심으로 제안한다. 첫 구현 범위는 목록 화면용 4종과 폼 화면용 3종이다. 차트는 별도 병행 목표가 아니라 그다음 구현 순서로 두되, 대시보드가 주력 제품이면 앞당긴다.

이 우선순위는 README의 “회사 웹을 컴포넌트 조합으로 만든다”는 목표와 저장소의 화면 예제를 근거로 정했다. 실제 소비 제품의 사용량·요구사항 자료는 없으므로, 모든 제품에 동일한 우선순위라고 단정하지 않는다.

## 2. 조사 범위와 현재 상태

공개 export, 150개 요청 대조표, 15개 컴포넌트 소스 파일의 API 구조, 관련 구현·스타일, 화면 예제와 검증 문서를 대조했다. 핵심 분석 대상은 사용자 관리, 상품 목록, 설정, 가입, 소비 리포트, 증권 홈, 알림센터, 드라이브, AI 대화다. 이번 조사는 코드와 문서 기반이며, 브라우저 화면을 새로 열어 시각 품질이나 스크린 리더 동작을 전수 검증한 결과는 아니다.

| 항목                         | 확인 결과                                      | 해석                                                                                        |
| ---------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 공개 런타임 export           | 197개                                          | 타입 export는 제외한 수치. `useToast`도 포함한다.                                           |
| 동일 참조를 합친 런타임 구현 | 174개                                          | 같은 함수의 별칭으로 추가된 이름이 23개다. 174개도 독립적인 제품 기능 수를 의미하지 않는다. |
| 기존 요청 대조표             | 150개 이름: 기존 36, 재사용 19, 추가·조합 95   | 과거 요청 이름의 충족 여부다. 제품 화면 전체에 대한 충족률은 아니다.                        |
| 화면 예제                    | 25개 등록                                      | 활용 범위는 넓지만 예제의 사용자 정의 마크업·스타일과 데모 상태도 필요하다.                 |
| 현재 실행한 검사             | `npm run typecheck` 통과, `npm test` 31개 통과 | 라이브러리 빌드 포함. 브라우저 통합 동작의 완전성을 뜻하지 않는다.                          |
| 기존 검증 기록               | Chrome에서 주요 동작 수동 확인 기록 존재       | 스크린 리더·Safari·Firefox·전체 상태 조합은 미검증으로 문서화돼 있다.                       |

런타임 수치는 이번에 빌드한 `dist/index.js`의 export와 함수 참조를 비교했다. 대조표의 재사용 19개는 150개 요청 범위이고, 별칭으로 늘어난 전체 export 23개와 집계 범위가 다르다. 근거: [공개 API](../src/index.ts), [요청 목록](./component-inventory.json), [화면 등록](../examples/routes.tsx), [기존 검증 기록](./verification.md).

### 부족함이 생기는 주요 원인

1. **이름과 제공 경험 사이의 차이가 크다.** `Combobox`는 문자열 `datalist`, `MultiSelect`는 네이티브 다중 선택, `DateRangePicker`는 날짜 입력 두 개다. 간단한 입력에는 유효하지만, 사용자 검색·태그 선택·기간 분석에 기대하는 경험까지 제공하지 않는다. [입력 구현](../src/components/forms.tsx), [확장 입력 구현](../src/components/extended-inputs.tsx)
2. **복합 기능이 서로 다른 테이블에 흩어져 있다.** `DataTable`은 검색·정렬, `DataGrid`는 선택·셀 이동, `EditableTable`은 편집, `VirtualTable`은 가상화를 제공한다. 공통 열 모델은 있지만, 정렬·선택·서버 페이지를 함께 사용하는 경로는 소비 앱에 남아 있다. [업무 데이터 구현](../src/components/enterprise.tsx)
3. **반복되는 화면 패턴이 예제에 머물러 있다.** `users-toolbar`, `users-bulk`, `users-pagination`, `shop-toolbar`, `drive-toolbar`가 대표적이다. 전부 라이브러리로 올려야 하는 것은 아니지만, 서로 다른 화면에서 반복되는 부분은 추출할 근거가 있다. [업무 예제](../examples/screens/work.tsx), [커머스 예제](../examples/screens/commerce.tsx)
4. **시각화 계층이 비어 있다.** 소비 리포트의 막대와 증권 홈의 작은 추세 그래프를 예제에서 직접 그린다. `Stat`, `Amount`, `ProgressBar`만으로는 분석 화면이 완성되지 않는다. [소비 리포트](../examples/screens/finance.tsx), [증권 홈](../examples/market.tsx)
5. **정상 상태의 표시에서 실제 작업의 완료까지 이어지는 공통 패턴이 약하다.** 저장 중·저장 실패·변경 사항 유지, 파일별 재시도, 읽음 상태, 검색 조건 제거 등을 화면마다 연결해야 한다. 데이터 요청 자체는 앱이 담당하더라도 이 상태를 보여주는 UI는 공통화할 수 있다.

별칭과 네이티브 요소 재사용 자체는 문제로 보지 않는다. 문제는 이름의 개수를 완성도의 근거로 삼거나, 현재 구현의 범위보다 넓은 사용 경험을 기대하게 만드는 데 있다.

## 3. 영역별 진단

아래 평가는 정량 점수가 아니라, 현재 제공 범위와 다음 투자 방향의 판단이다.

| 영역           | 현재 활용 가능한 부분                                      | 주요 부족점                                                | 권장 방향                                  |
| -------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| 기초·레이아웃  | 토큰, Text, Heading, Stack, Grid, Container, ThemeProvider | 공통 아이콘 자산이 예제에 존재. 반응형 업무 셸 조합이 얇음 | 아이콘 자산 승격, AppShell 보강            |
| 버튼·액션      | 다양한 Button, IconButton, SplitButton, CopyButton         | 새로운 버튼 종류보다 저장·일괄 처리 같은 액션 묶음이 필요  | FormActions, BulkActionBar                 |
| 폼 구조        | Field, FormError, FormDescription, 네이티브 입력           | 섹션, 폼 전체 오류 요약, 저장 상태를 화면마다 구성         | FormSection, FormErrorSummary, FormActions |
| 검색·선택      | Select, AutoComplete, MultiSelect, TreeSelect              | ID/표시명 분리, 검색 결과 상태, 선택 칩, 검색형 다중 선택  | 기존 선택 계열 보강                        |
| 날짜·시간      | 네이티브 날짜·시간, DateRangePicker, Calendar              | 기간 프리셋, 일관된 범위 제약, 분석용 기간 선택            | 기존 DateRangePicker 확장                  |
| 목록·테이블    | Table과 여러 데이터 테이블                                 | 필터·선택·정렬·페이지 상태의 연결, 작업 도구 영역          | 목록용 4종 + 테이블 API 보강               |
| 차트·분석      | Stat, Amount, 진행률                                       | 범용 데이터 차트 부재                                      | BarChart, LineChart, Sparkline             |
| 탐색·오버레이  | Tabs, Menu, Dialog, Drawer, Popover                        | 경계 잘림, 모바일 탐색 전환, 제어형 열림 상태              | 기존 오버레이·AppShell 보강                |
| 피드백·상태    | Alert, ToastProvider, Skeleton, EmptyState, ErrorState     | 읽음·그룹·목록 작업, 화면 상태를 전환하는 조합 예제        | NotificationList + 상태별 레시피           |
| 파일·미디어    | 파일 선택·검증, 미리보기, 브라우저 PDF 표시                | 파일별 전송 상태·실패·취소·재시도 UI                       | FileUploadList                             |
| 일정·업무 도구 | Kanban, Calendar, Scheduler, Gantt, Spreadsheet            | 복잡한 편집과 도메인 엔진은 제외된 상태                    | 실제 제품 수요가 있는 도구만 심화          |
| AI·콘텐츠      | Chat, PromptInput, StreamingText, AgentActivity            | 구조화된 답변·출처·메시지 액션은 미제공                    | AI 제품 채택 시 후속 확장                  |

범위 확인 자료: [기초·콘텐츠·파일·AI API](./extended-components.md), [입력 API](./extended-inputs.md), [탐색·오버레이 API](./extended-navigation.md), [업무 데이터 API](./enterprise.md).

## 4. 추가할 공통 컴포넌트 후보 15종

P0는 사내 CRUD·설정 화면의 다음 구현 묶음, P1은 그 뒤에 적용 화면을 정해서 추진할 항목이다. 이름은 제안이며 확정 API가 아니다. 하나의 후보에 표시된 하위 동작을 별도 export로 쪼개 수를 늘릴 필요는 없다.

### P0 — 목록 화면과 폼 화면을 완성하는 7종

| 순서 | 후보                 | 필요한 이유·적용 화면                                    | 최소 제공 범위                                                    | 재사용할 기존 요소                |
| ---- | -------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| 1    | **FilterBar**        | 사용자·상품·파일 화면이 검색·조건·정렬 영역을 각각 구현  | 검색·필터·정렬·액션 슬롯, 좁은 화면의 배치, 고급 조건 펼침        | SearchInput, Select, Stack, Sheet |
| 2    | **ActiveFilters**    | 적용한 조건을 확인하고 하나씩 해제하는 공통 UI가 없음    | 조건 라벨, 개별 제거, 전체 초기화, 제거 뒤 포커스 유지            | Chip 스타일, Button, Text         |
| 3    | **BulkActionBar**    | 사용자 관리의 `users-bulk`가 예제 전용                   | 선택 개수, 선택 해제, 작업 버튼, 진행·실패 상태 영역              | Button, Text, Stack, Alert        |
| 4    | **DataPagination**   | 사용자·상품·관리자 화면이 건수와 페이지 이동을 따로 배치 | 전체 건수, 현재 표시 범위, 페이지 크기 선택, 이동, 0건 상태       | Pagination, Select, Text          |
| 5    | **FormSection**      | 설정·생성 폼에서 제목·설명·입력 배치·구분선 반복         | 제목/설명/액션 슬롯, 내용 배치, 적절한 section 또는 fieldset 의미 | Heading, Text, Grid, Separator    |
| 6    | **FormActions**      | 설정 저장과 다이얼로그 제출에서 저장·취소·상태 표시 반복 | 변경 여부, 저장 중, 성공/실패 메시지, 저장·취소, 고정 배치 선택   | Button, BottomCTA, Alert          |
| 7    | **FormErrorSummary** | Field는 개별 오류만 표시. 긴 폼의 전체 오류 안내가 없음  | 오류 목록, 해당 입력으로 이동, 제출 실패 후 요약 포커스           | Alert, Anchor, 기존 Field의 ID    |

**경계:** FilterBar는 쿼리 엔진을 만들지 않고, BulkActionBar는 삭제 API를 실행하지 않으며, FormActions는 폼 전체 상태를 추측하지 않는다. 앱이 현재 상태와 콜백을 전달한다. 데이터 요청·검증 규칙·저장 정책은 소비 앱이 소유한다.

**중복 방지:** `Chip`은 현재 버튼이므로 삭제 버튼을 자식 버튼으로 넣으면 안 된다. ActiveFilters의 각 항목은 텍스트와 별도 제거 버튼으로 구성하거나, 항목 자체를 제거 버튼으로 사용한다. `InputTags`는 입력 편집용이므로 읽기 중심의 필터 요약과 역할을 구분한다.

근거: [사용자 관리의 필터·일괄 작업·페이지 영역](../examples/screens/work.tsx), [상품 필터와 모바일 Sheet 조합](../examples/screens/commerce.tsx), [설정 폼](../examples/recipes.tsx), [Field·Chip 구현](../src/components/controls.tsx).

### P1 — 분석·파일·상세 화면을 위한 8종

| 순서 | 후보                 | 필요한 이유·적용 화면                                            | 최소 제공 범위                                                          | 범위 제한                                           |
| ---- | -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| 8    | **BarChart**         | 소비 리포트에 직접 작성한 막대·SVG가 있음                        | 단일 계열 가로/세로 막대, 항목·값 라벨, 값 포맷, 빈 데이터, 텍스트 대체 | 누적·복합 축은 실제 수요 이후                       |
| 9    | **LineChart**        | 시간에 따른 지표 변화를 공통 표현할 API가 없음                   | 단일 계열, 축·단위, 반응형 크기, 데이터 요약, 0개·1개·동일 값 처리      | 줌·브러시·실시간 금융 엔진 제외                     |
| 10   | **Sparkline**        | 증권 홈의 작은 그래프가 고정 SVG 경로                            | 숫자 배열 기반 추세, 상승·하락 표현, 크기, 설명 또는 장식 모드          | 축·툴팁이 필요하면 LineChart 사용                   |
| 11   | **FileUploadList**   | FileUpload는 파일명·크기를 표시하고 전송 상태는 받지 않음        | 파일별 대기/진행/완료/실패, 진행률, 취소·재시도·제거 콜백               | 전송·인증·스토리지는 앱 책임                        |
| 12   | **NotificationList** | 알림센터가 날짜 그룹·읽음·모두 읽음·빈 상태를 직접 조합          | 그룹, 읽음/미읽음, 개별/전체 읽음 요청, 추가 로딩·빈 상태               | 알림 수신·저장은 앱 책임                            |
| 13   | **SelectionCard**    | 결제 수단·플랜 같은 설명이 긴 선택 항목에 필요                   | 네이티브 radio/checkbox, 아이콘·제목·설명, 선택/포커스/비활성 상태      | RadioGroup과 별도의 선택 엔진은 만들지 않음         |
| 14   | **DetailSection**    | 사용자·파일·주문 상세에서 제목·정보·수정 액션 조합 반복          | 섹션 제목, 액션 슬롯, DescriptionList 또는 children, 좁은 화면 배치     | FormSection과 차이가 작으면 하나의 Section으로 통합 |
| 15   | **InlineEdit**       | PropertyGrid·EditableTable 외의 제목·메타데이터 수정 패턴이 없음 | 표시/편집 전환, 저장·취소, Enter/Escape, 비동기 실패 시 입력 보존       | 기본 텍스트 입력부터 시작, 리치 텍스트 제외         |

근거: [소비 리포트](../examples/screens/finance.tsx), [증권 홈](../examples/market.tsx), [파일 선택·표시 API](../src/components/media-ai.tsx), [알림센터](../examples/screens/account.tsx), [사용자·파일 상세](../examples/screens/work.tsx), [결제 예제](../examples/recipes.tsx).

LineChart·SelectionCard·InlineEdit는 현재 구현의 직접 추출보다 **예상 사용 시나리오에 따른 후보** 성격이 강하다. 첫 소비 화면을 확정한 뒤 공개 API를 정한다. DetailSection도 추출 과정에서 기존 조합만으로 충분하면 독립 컴포넌트로 만들지 않는다.

### 공통 아이콘 자산 승격

현재 `Icon`은 SVG를 감싸는 공개 컴포넌트이고, 실제 검색·파일·사용자·메뉴 등의 path는 [examples/icons.tsx](../examples/icons.tsx)의 `ExampleIcon`에 있다. 패키지 소비자는 `Icon`만 가져와서는 해당 아이콘을 사용할 수 없다.

예제에서 이미 쓰는 아이콘 중 공통 사용이 확실한 것부터 공개 자산으로 옮기는 편이 효과적이다. 기존 `Icon`의 크기·색·접근성 규칙을 재사용하고, 이 작업은 신규 컴포넌트 개수와 별도로 관리한다. 추가 아이콘 시스템이나 생성 도구 도입은 선행 조건이 아니다.

## 5. 새 이름보다 기존 기능을 보강해야 할 8개 묶음

### 5.1 Combobox / AutoComplete

현재 `suggestions: string[]`를 `datalist`로 보여주며 자유 입력을 허용한다. 담당자처럼 “표시는 김메가, 저장 값은 user-123”인 선택에 바로 쓰기 어렵다.

- ID와 표시명 분리, 선택값과 검색어 분리, 선택 해제, 비활성 옵션을 제공한다.
- 외부 검색어 콜백과 loading/error/empty 상태, 보조 설명·아바타 등 옵션 표현을 지원한다.
- 비동기 요청과 오래된 응답의 폐기는 앱에서 처리한다. UI는 결과와 상태를 받는다.
- 기존 자유 입력 동작을 깨뜨리지 않도록 네이티브 모드를 유지하고 고급 선택 경로를 명시한다. `Combobox` 별칭의 의미를 바꾼다면 호환성 정책도 함께 정한다.

근거: [AutoComplete](../src/components/forms.tsx), [별칭 export](../src/components/extended-inputs.tsx). 적용 후보: 사용자 초대, 담당자 선택, 조직 검색.

### 5.2 MultiSelect / TreeSelect

현재 MultiSelect는 `<select multiple>`, TreeSelect는 optgroup과 평탄화된 경로 라벨이다. 기능이 없는 것은 아니지만, 검색형 태그 선택이나 펼치고 접는 계층 선택과는 제공 범위가 다르다.

검색·선택 칩·전체 해제·선택 개수·선택 제한을 MultiSelect에 추가한다. TreeSelect의 트리 펼침, 상하위 부분 선택, 비동기 자식 로딩 표시는 실제 조직 선택 수요가 있을 때 추가한다. 검색형 옵션 표현은 5.1의 동작을 재사용하며, 단순 네이티브 모드는 유지한다.

근거: [MultiSelect·TreeSelect](../src/components/extended-inputs.tsx), [선택 API의 제약](./extended-inputs.md).

### 5.3 DataTable / DataGrid

현재 DataTable은 `initialSort`를 받아 내부에서 정렬하고, 외부 `sort`/`onSortChange`나 서버 정렬 모드가 없다. 서버에서 한 페이지씩 전달하면 정렬 버튼이 전달된 페이지 내부만 정렬한다. DataGrid는 같은 열 모델을 받아도 선택·키보드 이동을 담당하는 별도 구현이다.

첫 보강은 **외부 정렬 상태, 서버 처리 시 로컬 정렬·필터 생략, 선택 기능과의 조합, 로딩/오류/빈 결과 슬롯**이다. 페이지 제어는 DataPagination과 연결하고, 기존 DataColumn을 유지한다. 이어서 열 표시·고정·크기 조절을 실제 사용 빈도로 선택한다.

모든 표를 단번에 하나의 거대 그리드로 교체할 필요는 없다. 다만 “서버 페이지 + 정렬 + 행 선택”이 하나의 공식 예제에서 동작해야 한다. 페이지를 넘겼을 때 선택 유지 여부와 “전체 선택”의 범위도 문서화해야 한다.

근거: [DataTableProps·DataTable·DataGrid](../src/components/enterprise.tsx), [외부 페이지 처리 예제](../examples/screens/work.tsx).

### 5.4 DateRangePicker

현재 시작일·종료일 입력과 변경 콜백을 제공하며, 날짜 순서는 소비자가 `min`/`max`를 연결하도록 안내한다.

먼저 오늘·최근 7일·이번 달 같은 프리셋과 범위 제약·오류 표시의 일관된 조합을 제공한다. 네이티브 날짜 입력으로 충족되는 화면은 그대로 사용한다. 이중 달력, 월/분기 선택, 시간대 선택은 보고서·예약 화면의 요구가 확인된 뒤 확장한다.

근거: [DateRangePicker](../src/components/extended-inputs.tsx), [기간 입력 계약](./extended-inputs.md).

### 5.5 Popover / Menu / Tooltip / HoverCard

현재 로컬 absolute 배치 또는 CSS 배치를 사용하고, 문서에도 viewport 충돌 보정 미제공이 명시돼 있다. 검색 옵션·필터 팝업을 늘리기 전에 가장자리와 스크롤 컨테이너 안에서 잘리는 문제를 해결할 공통 배치 경로가 필요하다.

경계에 따른 방향 전환·위치 조정, 필요 시 Portal, 스크롤/리사이즈 추적, Escape·외부 클릭·포커스 복귀를 검증한다. Popover/Menu는 외부에서 열림 상태를 제어할 수 있는 경로도 제공한다. 단순 Tooltip에는 불필요한 대화상자 동작을 더하지 않는다.

근거: [Popover·HoverCard](../src/components/extended-navigation.tsx), [Menu·Tooltip](../src/components/overlay.tsx), [위치 스타일](../src/styles/_extended-navigation.scss).

### 5.6 AppShell / SideNav

현재 AppShell은 헤더·사이드바·콘텐츠·푸터 슬롯을 제공하고, 모바일에서는 사이드바와 본문을 세로로 쌓는다. 업무용 앱에서 기대하는 사이드바 접기, 모바일 메뉴 Drawer, 독립 스크롤은 기본 계약에 없다.

이미 있는 Drawer·TopBar·SideNav로 반응형 셸을 먼저 구성한다. 토글, 포커스 복귀, 콘텐츠 스크롤 경계를 공식 예제에서 검증한 뒤 반복되는 부분만 AppShell API로 올린다. 라우팅과 권한 판정은 소비 앱에 둔다.

근거: [AppShell](../src/components/foundations.tsx), [모바일 셸 스타일](../src/styles/_foundations.scss), [관리자 화면](../examples/admin.tsx).

### 5.7 Checkbox / CheckboxGroup

전체 선택과 일부 선택을 구분하는 공식 `indeterminate` 경로가 없다. DataGrid 헤더도 현재 모든 행이 선택됐는지 여부만 표시한다. 사용자 관리·약관 동의에 공통으로 필요한 상태다.

네이티브 checkbox의 indeterminate 상태를 제어할 API와 예제를 추가하고, 표 헤더·그룹 전체 선택에서 재사용한다. `checked` 및 폼 제출 의미와의 관계, 부분 선택의 보조 기술 노출도 검증한다.

근거: [Checkbox](../src/components/controls.tsx), [DataGrid 헤더](../src/components/enterprise.tsx), [가입 동의 예제](../examples/screens/account.tsx).

### 5.8 Field와 폼 접근성 연결

Field는 label과 설명 ID를 만들지만 입력의 `aria-describedby`·`aria-invalid` 연결은 소비자가 작성한다. 이 계약은 문서와 테스트에 명시돼 있어 현재 구현 오류로 단정할 부분은 아니다. 다만 새 폼마다 연결을 빠뜨리기 쉬운 사용 비용이다.

단일 입력과 복합 입력의 권장 조합을 정리하고, FormErrorSummary에서 해당 입력으로 이동하는 흐름까지 한 예제로 제공한다. 무조건 자식을 복제하는 범용 Form 엔진을 추가하기보다, 기존 API에서 가능한 연결을 명확히 하고 필요한 경우에만 작은 보조 API를 추가한다.

근거: [Field](../src/components/controls.tsx), [접근성 연결 테스트](../tests/package.test.mjs).

## 6. 제품 수요가 확인되면 추가할 후보

아래 항목은 기능적 공백은 있지만, 지금 저장소만으로 P0라고 볼 근거는 부족하다.

| 영역             | 후보                                        | 추가 시점                                                    | 먼저 활용할 것                                      |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| 장문 콘텐츠      | MarkdownRenderer, RichTextEditor            | 공지·게시글·문서 작성 기능이 실제로 필요할 때                | 표시만 필요하면 ReactNode 조합, 입력은 Textarea     |
| 협업             | CommentThread, MentionInput, AssigneePicker | 댓글·멘션·담당자 흐름이 제품에 들어갈 때                     | Chat/MessageBubble, 강화한 Combobox, Avatar         |
| AI 답변          | CitationList, MessageActions, ToolResult    | 출처 표시·복사·재생성·도구 결과 확인이 필요할 때             | MessageBubble의 children, CopyButton, AgentActivity |
| 고급 조회        | SavedViews, FilterBuilder                   | 복수 사용자가 조건을 저장하거나 AND/OR 필터를 반복 사용할 때 | FilterBar, ActiveFilters, Menu                      |
| 데이터 반입      | ImportPreview                               | 업로드 데이터의 열 매핑·행별 오류 확인이 필요할 때           | FileUploadList, Table, FormErrorSummary             |
| 조직·계정        | WorkspaceSwitcher, MemberPicker             | 다중 조직·프로젝트 전환이 실제 요구일 때                     | Menu, Combobox, Avatar                              |
| 승인 업무        | ApprovalSteps, AuditLog                     | 결재 순서와 변경 이력을 보여줘야 할 때                       | Stepper, Timeline, DescriptionList                  |
| 이미지 편집      | ImageCropper                                | 프로필·상품 이미지의 크롭이 필수일 때                        | ImageViewer, FileUpload                             |
| 이동·재정렬      | SortableList                                | 항목 순서 편집이 반복될 때                                   | 우선 위/아래 이동 버튼, 필요 시 드래그 추가         |
| 통계 고도화      | DonutChart, AreaChart, ChartLegend          | 비중·누적·다중 계열 요구가 확정될 때                         | 먼저 만드는 BarChart·LineChart의 표현 규칙          |
| 일정 고도화      | 기존 Scheduler·Gantt의 편집 확장            | 시간 겹침·리소스 예약·의존성 편집이 제품 핵심일 때           | 현재 읽기 중심 뷰와 앱의 데이터 모델                |
| 개발 도구형 화면 | CodeEditor, DiffViewer                      | 코드·규칙·설정 편집이 실제 업무일 때                         | CodeBlock, Textarea                                 |

Markdown의 HTML 처리·링크 정책, 편집기의 입력 보존, 파일 처리 검증처럼 신뢰 경계와 데이터 보존은 해당 기능을 구현할 때 함께 해결해야 한다. 현재 보고서에서는 전용 엔진이나 외부 의존성의 선택까지 확정하지 않는다.

## 7. 컴포넌트 대신 조합 예제로 먼저 제공할 것

| 요구                                       | 권장 제공 방식                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| 로딩·빈 결과·검색 결과 없음·오류·권한 없음 | Skeleton, EmptyState, ErrorState, Alert, Button을 연결한 화면 상태 레시피      |
| CRUD 목록·상세·생성·수정                   | FilterBar + Table 계열 + DataPagination + Drawer/FormSection의 완성 예제       |
| 여러 단계 입력                             | 기존 Stepper + FormSection + FormActions. 분기·이전 단계 값 보존은 앱에서 제어 |
| 저장하지 않고 나가기                       | FormActions + AlertDialog. 라우터 연결과 페이지 종료 처리는 앱 경계에서 구현   |
| 로그인·가입·약관                           | 기존 계정 예제를 정리. 인증·만료·약관 정책까지 라이브러리에 넣지 않음          |
| 상품 카드·가격표·주문 상세                 | Card, SelectionCard, Amount, DescriptionList, Timeline 조합                    |
| 팀원 초대·역할 변경                        | Combobox/Select + Dialog + FormActions. 실제 권한 검증은 앱/서버 책임          |

이미 `Dialog`, `Drawer`, `Sheet`, `Calendar`, `Tree`, `FileUpload`, `Chat` 등이 있으므로 이를 누락된 컴포넌트로 다시 제안하지 않는다. `Stack/HStack/Flex`, `Card/Surface`, `Badge/Tag`처럼 같은 역할의 이름을 더 추가할 필요도 없다.

## 8. 구현 순서와 완료 기준

### 1차 — 목록 화면의 반복 코드 제거

**범위:** FilterBar, ActiveFilters, BulkActionBar, DataPagination. 기존 DataTable/DataGrid의 정렬·선택 연결, Checkbox 부분 선택을 함께 보강한다. 떠 있는 UI를 사용하는 부분은 오버레이 배치 보강을 선행한다.

**적용 화면:** 사용자 관리 + 상품 목록. 파일 목록은 재사용 확인용으로 추가한다.

**완료 기준:** 검색·조건 변경 후 페이지와 선택의 처리 정책이 일정하고, 조건별 해제·전체 초기화·선택 작업·페이지 크기 변경이 연결된다. 서버 페이지를 흉내 낸 비동기 예제에서 정렬이 현재 페이지에만 적용되는 혼동이 없어야 한다. 좁은 화면에서도 동일한 작업을 완료할 수 있어야 한다.

### 2차 — 생성·수정·설정 폼 완성

**범위:** FormSection, FormActions, FormErrorSummary. Combobox/MultiSelect와 날짜 범위는 실제 폼에 필요한 부분부터 확장한다.

**적용 화면:** 사용자 초대/수정 + 설정. 가입 화면은 단계별 입력 검증에 활용한다.

**완료 기준:** 제출 실패 시 입력을 보존하고 오류 입력으로 이동할 수 있다. 저장 중 중복 실행을 막고, 재시도·취소 동작이 구분된다. 복합 입력의 이름·설명·오류 연결과 한글 IME 입력을 확인한다.

### 3차 — 분석·파일·알림의 재사용

**범위:** BarChart, LineChart, Sparkline, FileUploadList, NotificationList, 공통 아이콘. DetailSection·SelectionCard·InlineEdit는 첫 적용 화면이 확정된 것만 포함한다.

**적용 화면:** 소비 리포트 + 증권 홈, 드라이브, 알림센터.

**완료 기준:** 차트는 고정 path가 아닌 데이터로 그려지고 빈 값·같은 값·작은 화면에서도 읽을 수 있다. 파일은 일부 실패와 개별 재시도를 표현한다. 알림은 읽음 상태 변경과 빈 목록을 같은 컴포넌트로 처리한다. 예제 전용 아이콘 코드를 복사하지 않고 패키지에서 사용할 수 있다.

### 모든 차수의 공통 기준

- 새 컴포넌트는 실제 소비 화면에 적용한다. 기본적으로 서로 다른 두 화면에서 재사용을 확인하고, 한 화면에만 필요한 것은 먼저 로컬 조합으로 둔다.
- 목록·폼·오버레이의 핵심 흐름에는 실행 가능한 브라우저 회귀 검사를 남긴다. 현재 SSR·정적 검사만으로 포커스, 레이아웃 경계, 비동기 상태 전환까지 보장하지 않는다.
- 변경한 범위의 키보드 조작, light/dark, 긴 한글·영문, 모바일, reduced motion을 확인한다. 전체 라이브러리 전수 검증과 혼동하지 않도록 검증 범위를 기록한다.
- 문서에는 기본 예제뿐 아니라 실패·빈 값·비활성·제어형 상태와 지원하지 않는 범위를 표시한다. 기존 public API의 동작을 바꾸는 경우 이행 경로를 제공한다.
- 성과는 export 증가량보다 **화면별 전용 마크업·CSS 감소, 조합 재사용, 정상·오류·로딩 흐름의 완성 여부**로 평가한다.

일정은 인원과 실제 소비 화면의 요구가 없어서 일수로 산정하지 않았다. 1차 적용 결과를 보고 2·3차의 범위를 확정하는 방식이 적절하다. 이 보고서 작성 과정에서는 컴포넌트 구현이나 기존 예제를 변경하지 않았다.
