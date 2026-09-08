# Mega UI를 사용하는 AI를 위한 가이드

대상 버전: 0.1.0. 먼저 [`components.md`](./components.md)의 실제 export와 props를 확인하세요.
이 문서는 패키지 내부 `docs/ai-guide.md`와 예제 사이트 `/ai-guide.md`에서 제공합니다.

## 생성 규칙

1. `@mega-ui/react`의 공개 named export 83개만 사용합니다. 내부 dist 경로를 import하지 않습니다.
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
  title="정말 삭제할까요?"
  actions={
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>
        취소
      </Button>
      <Button variant="danger" onClick={remove}>
        삭제
      </Button>
    </>
  }
/>;
```

`onClose`는 Escape·배경 클릭·닫기 버튼 모두에서 호출되므로 반드시 상태를 false로 바꿔야 합니다.
포커스 트랩은 네이티브 `<dialog>`가 처리하니 직접 구현하지 마세요.

### Tabs

`value`를 넘기면 controlled, 안 넘기면 `defaultValue`로 uncontrolled입니다. 둘을 함께 쓰지 않습니다.
`label`(tablist의 aria-label)은 필수이고, `TabPanel`은 `active={value === '...'}`로 직접 연결합니다.

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
