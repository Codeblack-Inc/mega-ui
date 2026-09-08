# Mega UI 컴포넌트 API — 0.1.0

아래 22개가 현재 공개 API입니다. 모두 named export이며 `@mega-ui/react`에서 가져옵니다.
별도 명시가 없으면 해당 HTML 요소의 표준 속성, `className`, `style`, React 19 `ref`를 전달할 수 있습니다.
`children`은 ReactNode입니다. 범용 `as`, `asChild`, `sx` API는 제공하지 않습니다.

| 컴포넌트   | HTML          | 추가 props (기본값)                                                                                                                                                               |
| ---------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Container  | div           | size: sm / md / lg / full (`lg`)                                                                                                                                                  |
| Stack      | div           | direction: row / column (`column`), gap: 0–8 (`4`), align: start / center / end / stretch (`stretch`), justify: start / center / end / between (`start`), wrap: boolean (`false`) |
| Grid       | div           | minItemWidth: number, px (`260`), gap: 0–8 (`4`)                                                                                                                                  |
| Heading    | h1–h6         | level: 1–6 (`2`), size: sm / md / lg / xl (`md`)                                                                                                                                  |
| Text       | p             | size: sm / md / lg (`md`), tone: default / muted (`default`)                                                                                                                      |
| Button     | button        | variant: primary / weak / secondary / ghost / danger (`primary`), size: sm / md / lg (`md`), loading: boolean (`false`), fullWidth: boolean (`false`), type (`button`)            |
| Input      | input         | 네이티브 input props                                                                                                                                                              |
| Textarea   | textarea      | 네이티브 textarea props, rows (`4`)                                                                                                                                               |
| Select     | select        | 네이티브 select props. option을 children으로 전달                                                                                                                                 |
| Checkbox   | label + input | input props (type 제외), 필수 children: 라벨. className은 바깥 label, ref와 나머지 입력 속성은 input에 전달                                                                       |
| Field      | div + label   | 필수 label: string, 필수 htmlFor: string, hint?: string, error?: string, required?: boolean                                                                                       |
| Card       | div           | padding: sm / md / lg (`md`), variant: elevated / filled / outlined (`elevated`)                                                                                                  |
| Badge      | span          | tone: neutral / brand / success / warning / danger (`neutral`)                                                                                                                    |
| Alert      | div           | tone: info / success / warning / danger (`info`), role (`status`, 필요하면 alert로 명시)                                                                                          |
| Separator  | hr            | 네이티브 hr props                                                                                                                                                                 |
| PageHeader | header        | 필수 title: string, description?: string, actions?: ReactNode. headingLevel: 1–6 (`1`). 기본 제목은 h1                                                                            |

## 레이아웃

Container는 최대 너비 640/960/1280px, full은 제한 없이 배치합니다. 좌우 여백은 space-5입니다.
Stack은 한 축 배치에 사용합니다. Grid는 가용 너비에 따라 열 수를 자동으로 조정합니다.
minItemWidth는 양수 픽셀 값으로 지정하세요. 컬럼 수나 breakpoint API는 아직 없습니다.
섹션, nav, main, form, table 등 문서 의미를 표현하는 HTML은 화면에서 그대로 사용합니다.

## 폼

Field의 hint/error는 `${htmlFor}-description` id를 갖습니다. error가 hint보다 우선합니다.
입력의 id / aria-describedby / aria-invalid / required는 호출자가 명시합니다.
Input, Select, Checkbox는 checked/value/onChange 또는 defaultChecked/defaultValue 등 네이티브
controlled/uncontrolled 방식을 그대로 따릅니다. 내부 폼 상태 관리나 검증 엔진은 없습니다.
Checkbox.children은 접근 가능한 라벨이므로 비워 두지 말고, 내부에 링크/버튼을 중첩하지 마세요.

## 버튼과 피드백

Button은 loading 또는 disabled일 때 실제 disabled가 됩니다. loading은 aria-busy를 표시합니다.
버튼 텍스트는 로딩 중에도 유지되므로 `저장 중`처럼 현재 상태에 맞는 이름을 전달하세요.
Alert의 색상과 live region의 긴급도는 독립적입니다. 긴급 알림에만 role="alert"를 사용하세요.
Badge는 색상만으로 상태를 표현하지 말고 상태 텍스트를 포함하세요.

## 실행 가능한 예제

예제 사이트의 컴포넌트 페이지에는 버튼 5종/3크기/로딩/비활성, 입력 오류/안내/비활성,
Select, Textarea, Checkbox, Badge 5종, Alert 4종, 타이포그래피 및 반응형 Grid가 있습니다.
화면 조합 예제는 `examples/recipes.tsx`의 DashboardExample, SettingsExample, PaymentExample입니다.
사이트에서 소스 코드 펼치기로 실제 실행 중인 코드 전체를 읽을 수 있습니다.

## 아직 없는 API

Dialog, Popover, Tooltip, Menu, Tabs, Accordion, Combobox, DatePicker, DataTable, Toast,
Pagination, 업로드, 차트, AppShell은 현재 export하지 않습니다. 같은 이름의 컴포넌트가 있다고 추정하지 마세요.

## 토스 스타일 1차 확장

| 컴포넌트         | HTML             | props                                                                                                                                                                                                                       |
| ---------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ListRow          | div              | 필수 title: string, description?: string, leading?: ReactNode, trailing?: ReactNode                                                                                                                                         |
| Switch           | label + input    | 필수 label: string, 네이티브 input props(type 제외), role은 switch. className은 label, ref/나머지는 input                                                                                                                   |
| SegmentedControl | fieldset + radio | 필수 label: string, name: string, options: readonly { label: string; value: string; disabled?: boolean }[], value?: string, defaultValue?: string, onValueChange?: (value: string) => void. fieldset ref/disabled/form 지원 |
| BottomCTA        | div              | description?: string, sticky?: boolean (`false`), children: 액션 요소                                                                                                                                                       |
| ProgressBar      | progress         | 필수 label: string, value?: number, max?: number (`100`), 네이티브 progress props                                                                                                                                           |
| Result           | div              | 필수 title: string, description?: string, tone: success / info / danger (`success`), actions?: ReactNode                                                                                                                    |

ListRow는 정적인 행입니다. 전체 div에 클릭 핸들러를 붙이지 말고 trailing에 이름이 있는 버튼/링크를 넣습니다.
SegmentedControl은 탭이 아닌 단일 선택 radio group입니다. 같은 폼의 다른 그룹에는 고유한 name을 지정하고,
옵션 value는 중복되지 않게 합니다. value와 defaultValue는 동시에 사용하지 않으며, controlled 방식에는 onValueChange를 연결합니다.
화살표 키로 선택할 수 있고 form 제출 시 name/value가 포함됩니다.
Switch는 checked/onChange 또는 defaultChecked를 사용합니다. label이 접근 가능한 이름입니다.
ProgressBar는 0 이상 max 이하의 유한한 value와 양수 max를 받습니다. 값 생략 시 네이티브 미정 진행률 상태가 됩니다.
BottomCTA의 sticky는 가장 가까운 스크롤 컨테이너 안에서 동작하며, 기본값은 일반 문서 흐름입니다.
Result는 정적인 결과 화면입니다. 동적 화면 전환 시 예제처럼 ref와 tabIndex를 사용해 포커스를 이동하세요.

기존 API는 유지했습니다. Button의 weak는 옅은 파란색 보조 액션, secondary는 회색 액션입니다.
Card는 elevated가 기본이며 경계가 필요하면 outlined를 선택합니다.
