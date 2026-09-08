# 로드맵

목표는 사내 웹 대부분을 라이브러리 조합으로 구현하는 것입니다. 아래 순서는 제안이며,
실제 제품 화면의 반복 빈도와 요구를 기준으로 우선순위를 조정합니다.

| 단계              | 범위                                                                                  | 상태   |
| ----------------- | ------------------------------------------------------------------------------------- | ------ |
| 0. 기반           | 빌드/타입/CSS 배포, 83개 export, 토스 실측 토큰(light/dark), 5개 화면 예제, AI 가이드 | 구현됨 |
| 1. 상호작용       | Dialog, Tooltip, Menu, Tabs, Toast, Radio                                             | 구현됨 |
| 1b. 남은 상호작용 | Drawer, Popover, Accordion                                                            | 예정   |
| 2. 입력/데이터    | Table, Pagination, EmptyState, Skeleton, Stat, Amount, Avatar/AvatarGroup, Banner     | 구현됨 |
| 2b. 남은 입력     | Combobox, Upload                                                                      | 예정   |
| 3. 화면 패턴      | SideNav, NavRail, TopBar, Breadcrumb, Chip, IconButton                                | 구현됨 |
| 3b. 남은 패턴     | AppShell, SearchToolbar, FilterBar, FormSection, ConfirmDialog                        | 예정   |
| 4. 예제 확장      | 목록/상세/생성/수정, 검색, 권한, 오류, 온보딩, 커머스, 운영 화면                      | 예정   |
| 5. 유통/AI        | 사내 레지스트리, 버전/변경 기록, 문서 검색, MCP resources/tools                       | 예정   |

## 구현됨 상세

- 레이아웃·타이포그래피: Container, Stack, Grid, Heading, Text
- 컨트롤: Button, IconButton, Chip, Input, Textarea, Select, Checkbox, Radio, Field
- 표면·패턴: Card, Badge, Alert, Separator, PageHeader, ListRow, Switch, SegmentedControl, BottomCTA, ProgressBar, Result
- 내비게이션: Tabs, TabPanel, SideNav, SideNavSection, SideNavItem, NavRail, NavRailItem, TopBar, TopBarLink, Breadcrumb, BreadcrumbItem, Pagination
- 오버레이: Dialog, Menu, MenuItem, MenuSeparator, MenuLabel, Tooltip, ToastProvider, useToast
- 데이터: Table 계열 7종, Stat, Amount, Avatar, AvatarGroup, Skeleton, Banner, EmptyState

- 폼: AutoComplete, CheckboxGroup, DatePicker, FloatLabel, IconField, IftaLabel, InputColor, InputGroup, InputMask, InputNumber, InputOtp, InputPassword, InputTags, KeyFilter, Knob, Label, Listbox, Rating, Slider, ToggleButton 및 기존 API 별칭 4종

## 남은 과제

- `SideNavItem`/`NavRailItem`은 `a`/`button`을 모두 렌더링하느라 ref를 전달하지 않습니다.
- Menu와 Tooltip은 위치 계산을 하지 않아 뷰포트 경계에서 잘릴 수 있습니다.
- Table은 정렬 표시만 제공하고 정렬·선택·가상 스크롤 로직은 소비 앱의 몫입니다.

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
폼은 `node examples/check-forms.mjs <개발 서버 주소>`로 입력·IME·키보드·모바일·테마 검증을 실행할 수 있습니다.
Dialog, Menu, Tabs, Toast 같은 상호작용 컴포넌트의 키보드 동작은 브라우저 자동화로 확장해야 합니다.
