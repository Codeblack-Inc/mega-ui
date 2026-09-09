# Mega UI를 사용하는 AI를 위한 가이드

대상 버전: 0.1.0. 먼저 [`components.md`](./components.md)의 실제 export와 props를 확인하세요.
이 문서는 패키지 내부 `docs/ai-guide.md`와 예제 사이트 `/ai-guide.md`에서 제공합니다.

## 필수 UX 라이팅 계약

UI 작업 전 [UX 라이팅 계약](./ux-writing.md)을 읽고 반드시 준수합니다.
버튼·설명·오류·빈 상태·완료 알림·접근 가능한 이름까지 적용합니다.
정적 검사와 문서의 의미 검토를 완료하기 전에는 작업을 완료로 보고하지 않습니다.
이 저장소에서는 `npm run lint:ux`를 실행합니다. 소비 앱에서는 계약의 AI 지침·CI 연결 절차를 적용합니다.

## 생성 규칙

1. `@mega-ui/react`의 문서화된 공개 export만 사용합니다. [150개 대조표](./component-coverage.md)에서 기존/별칭/확장 API를 확인합니다. 내부 dist 경로를 import하지 않습니다.
2. 앱 진입점에 `import '@mega-ui/react/styles.css'`를 한 번 추가합니다.
3. 간격은 `gap` 0–8 토큰, 색·표면은 문서화된 variant/tone을 사용합니다. 임의의 hex를 쓰지 않습니다.
4. 커스텀 CSS를 추가하기 전에 기존 컴포넌트와 `--mega-*` 시맨틱 토큰으로 해결합니다.
5. `main`/`nav`/`section`/`form`/`table` 같은 의미 있는 HTML은 그대로 사용합니다.
6. Tailwind, styled-components, 새로운 UI 라이브러리를 자동 도입하지 않습니다.
7. 문서에 없는 props나 컴포넌트를 만들어 호출하지 않습니다. 부족하면 명시하고 구현을 제안합니다.
8. 서버 요청, 인증, 폼 상태, 라우팅은 소비 앱에서 담당합니다.
9. aria 연결, 키보드 동작, heading 구조, 좁은 화면, 다크 테마를 확인합니다.

## 무엇을 언제 쓰는가

**어드민·대시보드 화면**

`NavRail`(좌측 아이콘 레일) + `SideNav`/`SideNavSection`/`SideNavItem`(2차 메뉴) + `TopBar`로 셸을 만들고,
본문은 `Breadcrumb` → `PageHeader` → `Grid`의 `Stat` 카드 → `Table` + `Pagination` 순으로 조합합니다.
행 액션은 `Menu` + `IconButton`, 필터는 `Chip` 줄, 데이터가 없으면 `TableEmpty` 또는 `EmptyState`,
로딩 중에는 `Skeleton`을 씁니다. 버튼 크기는 `md`, 테이블 안에서는 `xs`입니다.

**모바일 플로(결제·온보딩·설정)**

입력은 `<Input variant="box" />`, 목록은 `ListRow`, 선택은 `SegmentedControl`이나 `Chip`,
설정 토글은 `Switch`, 마지막 액션은 `BottomCTA` 안의 `<Button size="xl" fullWidth />`,
결과 화면은 `Result`입니다. 모달은 `<Dialog sheet />`로 하단에 붙입니다.

**금융·시세 화면**

금액은 `Amount`(`tone="auto"`면 양수 빨강/음수 파랑), 지표는 `Stat`의 `delta`,
섹션 전환은 `Tabs` + `TabPanel`, 상태 표시는 `Badge`입니다.

**폼 입력**

`AutoComplete`는 자유 입력 가능한 네이티브 datalist, `DatePicker`는 단일 날짜 입력입니다.
`InputNumber`·`InputColor`·`InputOtp`는 네이티브 input 속성 및 검증을 사용합니다.
`InputMask`·`KeyFilter`·`InputTags`는 `value`와 `onValueChange`를 함께 전달합니다.
`FloatLabel` 안의 입력에는 같은 `id`와 `placeholder=" "`를 지정합니다.
`InputText` = `Input`, `RadioButton` = `Radio`, `ToggleSwitch` = `Switch`,
`ToggleButtonGroup` = 단일 선택 `SegmentedControl`입니다. 타 라이브러리와 props 호환을 가정하지 마세요.

**전문 데이터 그리드**

범위 편집·그룹·집계·가상화·일괄 저장에는 별도 진입점 `@mega-ui/react/data-grid`의
`DataGridPro`를 사용합니다. [전문 그리드 API](./data-grid.md)를 먼저 읽고 기본 CSS와
`@mega-ui/react/data-grid.css`를 함께 로드합니다. 기존 `DataGrid`/`DataColumn` API와
호환된다고 가정하지 마세요. 저장 서버는 권한·트랜잭션·원본 버전 검증을 수행해야 합니다.

**리치 텍스트 문서**

`@mega-ui/react/text-editor`의 `TextEditor`는 별도 진입점입니다. [API와 제한](./text-editor.md)을 먼저 읽고
기본 CSS와 `@mega-ui/react/text-editor.css`를 함께 로드합니다. `defaultValue`는 최초 JSON이며
변경은 `onChange`, 저장 확정은 비동기 `onSave`로 연결합니다. 문서 교체는 미저장 변경을 확인한 뒤 재마운트합니다.
표·이미지·블록 편집과 Markdown/JSON 반입·반출을 제공합니다. `exportTextEditorMarkdown`의 `warnings`를 표시하고,
병합 셀·너비 등 원본 구조 보관에는 JSON을 사용합니다. 파일 이미지 512KB·문서 1M UTF-16 상한을 확인하세요.

**다중 계열 분석 차트**

전문 분석에는 `@mega-ui/react/charts`의 `ChartPro`를 사용합니다. 막대·선·영역·누적·원형·도넛·산점·히트맵·트리맵·캔들/거래량,
시간/이중 축·드래그 탐색·선택·PNG/SVG/CSV·페이지형 데이터 표를 제공합니다.
시간축은 오름차순 epoch milliseconds와 명시적인 `timeZone`을 사용하며 최대 10,000개 데이터·20개 계열입니다.
[ChartPro API](./charts.md#chartpro)를 읽고 유형에 맞는 `ChartProData`를 전달하세요. 원시 ECharts 옵션은 받지 않습니다.

기존 경량 막대·선·영역·누적 비교, 구간 확대·이동, 축·범례·키보드 값 탐색에는 `@mega-ui/react/charts`의 `CartesianChart`를 사용합니다.
[API와 제한](./charts.md)을 먼저 읽고 기본 CSS와 `@mega-ui/react/charts.css`를 로드합니다.
`labels`와 각 `series.values`의 길이를 맞추고, 결측은 `null`로 전달합니다. 범주는 등간격이며 시간축이 아닙니다.
최대 200개 항목·6개 계열을 지원하며 전체 데이터 표와 CSV는 숨긴 계열도 포함합니다.
양수 비율의 원형·도넛은 같은 진입점의 `PieChart`를 사용하며 음수 입력은 거부합니다.
컴포넌트 카탈로그의 `#components/professional`에서 그리드·편집기·차트 데모와 API를 함께 찾을 수 있습니다.
단일 계열의 간단한 표시에는 기존 `BarChart`·`LineChart`·`Sparkline`을 계속 사용합니다.

**일정·예약**

`SchedulerPro`는 일·주·월·리소스 보기와 반복 일정을 다루는 달력입니다. [SchedulerPro API](./scheduler.md)를 먼저 읽습니다.
`value`와 `onChange`로 제어하며 `onSave`가 있으면 저장 중·실패·재시도를 제공합니다.
일정 시각은 달력 `timeZone`의 벽시계 문자열이고 종료는 배타적입니다. 반복은 매일·매주·매월과 회차 예외까지 지원합니다.
겹침과 업무 시간 밖은 저장을 막지 않고 표시하며, 편집 폼에서 한 번 더 확인을 받습니다.
파일 연동은 `serializeSchedulerIcs`·`parseSchedulerIcs`를 사용하고 가져오지 못한 항목은 note로 안내합니다.
날짜별 목록만 필요하면 기존 `Scheduler`를, 월 달력 표시는 `Calendar`를 사용합니다.

**작업 보드**

`TaskBoard`는 기존 Kanban의 편집·이동 구현을 통합한 API입니다. [TaskBoard API](./task-board.md)를 먼저 읽습니다.
`value`와 `onChange`로 제어하며 `onSave`가 있으면 저장 중·실패·재시도를 제공합니다.
열·카드·구획·담당자·기한을 버전 1 데이터로 전달하고 `parseTaskBoard`로 반입을 검증합니다.
열의 카드 제한은 필터와 구획에 관계없이 전체 카드 수에 적용합니다. 카드가 있는 열 삭제는 다른 열로 이동해야 합니다.
새 코드에 deprecated `Kanban`을 추가하지 마세요. 카탈로그의 전문 업무 컴포넌트 → TaskBoard를 사용합니다.

**공통**

강조 안내는 `Banner`, 인라인 경고는 `Alert`, 일시적 완료 알림은 `useToast()`입니다.
`Card`는 elevated가 기본이고 경계가 필요하면 outlined를 고릅니다.

## 반드시 지켜야 하는 배선

### Field 접근성

Field는 자식을 복제하지 않습니다. id와 aria를 직접 연결해야 합니다.

```tsx
<Field label="이메일" htmlFor="email" error={error} required>
  <Input
    id="email"
    name="email"
    type="email"
    required
    aria-describedby="email-description"
    aria-invalid={error ? true : undefined}
  />
</Field>
```

`htmlFor`와 `id`가 같아야 하고, hint/error가 있으면 `aria-describedby`는 `${htmlFor}-description`입니다.
한 페이지에 폼이 여럿이면 id가 중복되지 않게 만듭니다.

### Toast는 provider가 필요

`useToast()`는 `ToastProvider` 밖에서 호출하면 예외를 던집니다. 앱 루트에 한 번 감쌉니다.

```tsx
<ToastProvider>
  <App />
</ToastProvider>
```

`toast({ title, description?, tone?, duration?, action? })`로 호출합니다. 기본 3초 뒤 사라지며,
`duration: 0`이면 유지됩니다. 즉시 조치가 필요한 오류는 토스트가 아니라 `Alert`나 `Dialog`로 알립니다.

### Dialog는 controlled

`open`을 내부에서 관리하지 않습니다. 상태는 소비 앱이 소유합니다.

```tsx
const [open, setOpen] = useState(false);

<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="문서를 삭제할까요?"
  description="삭제한 문서는 복구할 수 없어요."
  actions={
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>
        계속 편집
      </Button>
      <Button variant="danger" onClick={remove}>
        문서 삭제
      </Button>
    </>
  }
/>;
```

위 삭제 설명은 복구가 불가능한 구현을 가정합니다. 실제 보관·복구 정책에 맞춰 바꾸세요.

`onClose`는 Escape·배경 클릭·닫기 버튼 모두에서 호출되므로 반드시 상태를 false로 바꿔야 합니다.
포커스 트랩은 네이티브 `<dialog>`가 처리하니 직접 구현하지 마세요.

### Tabs

`value`를 넘기면 controlled, 안 넘기면 `defaultValue`로 uncontrolled입니다. 둘을 함께 쓰지 않습니다.
`label`(tablist의 aria-label)은 필수이고, `TabPanel`은 `active={value === '...'}`로 직접 연결합니다.
Tabs에 고유 `id`를 주고 각 TabPanel에 같은 `tabsId`와 항목 `value`를 전달하면 ARIA 관계도 연결됩니다. 비활성 패널은 언마운트하지 말고 `active={false}`로 유지하세요.

### 그 밖의 주의

- `ListRow`의 바깥 div에 onClick을 붙이지 말고 `trailing`에 이름 있는 버튼/링크를 넣습니다.
- 아이콘만 있는 버튼은 `IconButton`의 `label`로 이름을 줍니다.
- `Badge`는 색만으로 상태를 표현하지 말고 텍스트를 함께 넣습니다.
- `Skeleton`은 `aria-hidden`이므로 로딩 상태 자체는 별도로 알립니다.
- `Heading`의 `level`과 `size`는 독립입니다. 문서 구조는 level로, 크기는 size로 맞춥니다.

## 확장 시 원칙

같은 조합이 실제 화면에서 반복되면 작은 합성 컴포넌트로 추출합니다.
처음부터 모든 화면을 포괄하는 거대한 configuration API를 만들지 않습니다.
새 public API에는 타입, SCSS, 상태별 예제, 문서, 동작 검증을 함께 추가합니다.

## MCP 지원 상태

현재 MCP 서버는 제공하지 않습니다. 이 가이드와 API 문서가 AI 지원의 첫 단계입니다.
MCP를 추가할 때는 동일 문서를 resources로 노출하고, 컴포넌트 조회/검색부터 시작합니다.
