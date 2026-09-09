# Mega UI 컴포넌트 API — 0.1.0

이 페이지는 `@mega-ui/react`의 핵심 API와 목록·폼·분석 조합을 설명하며, 나머지 확장 이름은 [150개 대조표](./component-coverage.md)에 연결된 문서에서 확인합니다. 컴포넌트의 props 타입도 함께 export합니다.
별도 명시가 없으면 해당 HTML 요소의 표준 속성, `className`, `style`, React 19 `ref`를 그대로 전달합니다.
`children`은 ReactNode입니다. 범용 `as`, `asChild`, `sx` API는 제공하지 않습니다(`Text`와 `Amount`만 좁은 `as`를 받습니다).

목차: [레이아웃](#레이아웃) · [타이포그래피](#타이포그래피) · [컨트롤](#컨트롤) · [폼](#폼) · [표면](#표면) · [패턴](#패턴) · [내비게이션](#내비게이션) · [오버레이](#오버레이) · [데이터](#데이터)

## 레이아웃

### Container (div)

| prop        | 타입                     | 기본값 | 설명                                        |
| ----------- | ------------------------ | ------ | ------------------------------------------- |
| `size`      | `sm \| md \| lg \| full` | `lg`   | 최대 너비 640 / 960 / 1280px, full은 무제한 |
| `className` | `string`                 | —      | 좌우 여백은 `--mega-space-5`(24px) 고정     |

### Stack (div)

| prop        | 타입                                | 기본값    | 설명                            |
| ----------- | ----------------------------------- | --------- | ------------------------------- |
| `direction` | `row \| column`                     | `column`  |                                 |
| `gap`       | `0`–`8`                             | `4`       | `--mega-space-*` 인덱스(4=16px) |
| `align`     | `start \| center \| end \| stretch` | `stretch` | align-items                     |
| `justify`   | `start \| center \| end \| between` | `start`   | justify-content                 |
| `wrap`      | `boolean`                           | `false`   | flex-wrap                       |

### Grid (div)

| prop           | 타입     | 기본값 | 설명                                   |
| -------------- | -------- | ------ | -------------------------------------- |
| `minItemWidth` | `number` | `260`  | px. 가용 너비에 따라 열 수를 자동 조정 |
| `gap`          | `0`–`8`  | `4`    | `--mega-space-*` 인덱스                |

컬럼 수나 breakpoint API는 아직 없습니다. `section`, `main`, `nav`, `form` 등 의미를 갖는 HTML은 그대로 사용하세요.

## 타이포그래피

### Heading (h1–h6)

| prop    | 타입                          | 기본값 | 설명                                         |
| ------- | ----------------------------- | ------ | -------------------------------------------- |
| `level` | `1`–`6`                       | `2`    | 렌더링할 태그. 시각 크기와 독립              |
| `size`  | `sm \| md \| lg \| xl \| 2xl` | `md`   | 17 / 20 / 22 / 26 / clamp(28–30)px, 굵기 700 |

`level`과 `size`를 분리했으므로 문서 구조(h1 하나)를 지키면서 크기를 고를 수 있습니다.

### Text (p / span / div)

| prop      | 타입                                                          | 기본값    | 설명                                 |
| --------- | ------------------------------------------------------------- | --------- | ------------------------------------ |
| `size`    | `xs \| sm \| md \| lg`                                        | `md`      | 13 / 14 / 15 / 17px                  |
| `tone`    | `default \| secondary \| muted \| brand \| danger \| success` | `default` | 시맨틱 문자 색 토큰을 읽음           |
| `weight`  | `regular \| medium \| semibold \| bold`                       | `regular` | 400 / 500 / 600 / 700                |
| `numeric` | `boolean`                                                     | `false`   | `font-variant-numeric: tabular-nums` |
| `as`      | `p \| span \| div`                                            | `p`       | 인라인으로 쓸 때 `span`              |

## 컨트롤

### Button (button)

| prop        | 타입                                                                 | 기본값    | 설명                                                        |
| ----------- | -------------------------------------------------------------------- | --------- | ----------------------------------------------------------- |
| `variant`   | `primary \| weak \| secondary \| outline \| ghost \| text \| danger` | `primary` | weak는 옅은 파랑, secondary는 회색, text는 높이 없는 링크형 |
| `size`      | `xs \| sm \| md \| lg \| xl`                                         | `md`      | 최소 높이 24 / 28 / 34 / 40 / 56px                          |
| `loading`   | `boolean`                                                            | `false`   | 실제 `disabled` + `aria-busy`, 스피너가 `leading`을 대체    |
| `fullWidth` | `boolean`                                                            | `false`   |                                                             |
| `leading`   | `ReactNode`                                                          | —         | 인라인 SVG 슬롯                                             |
| `trailing`  | `ReactNode`                                                          | —         | 인라인 SVG 슬롯                                             |
| `type`      | `button \| submit \| reset`                                          | `button`  | 폼 제출에만 `submit`                                        |

`xl`은 모바일 하단 CTA용 크기입니다. 데스크톱 화면의 기본은 `md`입니다.

### IconButton (button)

| prop      | 타입              | 기본값  | 설명                                 |
| --------- | ----------------- | ------- | ------------------------------------ |
| `label`   | `string` **필수** | —       | `aria-label`. 아이콘은 장식으로 처리 |
| `size`    | `sm \| md \| lg`  | `md`    | 28 / 34 / 40px 정사각                |
| `variant` | `ghost \| filled` | `ghost` |                                      |
| `round`   | `boolean`         | `false` | 완전한 원형                          |

### Chip (button)

| prop       | 타입                | 기본값   | 설명                                         |
| ---------- | ------------------- | -------- | -------------------------------------------- |
| `size`     | `sm \| md`          | `md`     | 24 / 28px 높이                               |
| `variant`  | `filled \| outline` | `filled` |                                              |
| `selected` | `boolean`           | —        | 지정했을 때만 `aria-pressed`를 출력(필터 칩) |

토글이 아닌 단순 필터 링크라면 `selected`를 생략하세요. 그러면 일반 버튼으로 읽힙니다.

### Input (input) · Textarea (textarea) · Select (select)

| prop      | 타입             | 기본값    | 설명                                                  |
| --------- | ---------------- | --------- | ----------------------------------------------------- |
| `variant` | `outline \| box` | `outline` | outline은 데스크톱 테두리형, box는 모바일 회색 박스형 |
| `size`    | `sm \| md \| lg` | `md`      | 34 / 40 / 48px. box는 항상 56px                       |
| `rows`    | `number`         | `4`       | Textarea 전용                                         |

Select의 option은 children으로 전달합니다. 세 컴포넌트 모두 네이티브 controlled/uncontrolled 방식을 그대로 따르며,
내부 폼 상태나 검증 엔진은 없습니다.

### Checkbox (label + input) · Radio (label + input)

| prop            | 타입               | 기본값   | 설명                                                 |
| --------------- | ------------------ | -------- | ---------------------------------------------------- |
| `children`      | `ReactNode`        | —        | 생략하면 input에 `aria-label`을 지정합니다.          |
| `shape`         | `circle \| square` | `circle` | Checkbox 전용. square는 폼용 사각 체크박스           |
| `indeterminate` | `boolean`          | `false`  | Checkbox 전용. 부분 선택 상태와 `aria-checked=mixed` |

`className`은 바깥 `label`에, `ref`와 나머지 입력 속성은 안쪽 `input`에 전달됩니다. `type`은 전달할 수 없습니다.

### Field (div + label)

| prop       | 타입              | 기본값 | 설명                                          |
| ---------- | ----------------- | ------ | --------------------------------------------- |
| `label`    | `string` **필수** | —      |                                               |
| `htmlFor`  | `string` **필수** | —      | 자식 입력의 `id`와 동일해야 합니다            |
| `hint`     | `string`          | —      | 안내문                                        |
| `error`    | `string`          | —      | 지정하면 hint보다 우선하고 색이 danger로 바뀜 |
| `required` | `boolean`         | —      | 별표 표시용. 입력에도 `required`를 따로 지정  |

Field는 자식을 복제하거나 속성을 자동 주입하지 않습니다. hint/error가 있으면 `${htmlFor}-description` id의 문단이 생기므로
입력의 `aria-describedby`를 직접 연결합니다.

```tsx
<Field label="이메일" htmlFor="email" hint="회사 이메일을 사용하세요." required>
  <Input
    id="email"
    name="email"
    type="email"
    autoComplete="email"
    required
    aria-describedby="email-description"
  />
</Field>
```

오류가 있으면 입력에 `aria-invalid`도 함께 지정하세요.

## 폼

폼 체험 화면은 예제 사이트의 `#components/inputs`와 `#components/controls`에서 확인합니다. 아래 20종과 별칭 4종을 추가로 export합니다.
타 라이브러리의 동명 API와 호환되는 구현은 아닙니다.

### 기존 컴포넌트 별칭

| 이름                | 기존 구현          | 사용법                                                             |
| ------------------- | ------------------ | ------------------------------------------------------------------ |
| `InputText`         | `Input`            | 동일한 `InputProps`                                                |
| `RadioButton`       | `Radio`            | children으로 라벨, name으로 그룹 연결                              |
| `ToggleSwitch`      | `Switch`           | label, checked/defaultChecked, onChange                            |
| `ToggleButtonGroup` | `SegmentedControl` | label, name, options, value/defaultValue, onValueChange. 단일 선택 |

별칭은 구현을 공유하며 기존 이름도 계속 사용할 수 있습니다. 각 별칭의 Props 타입도 export합니다.

### AutoComplete · DatePicker · InputColor · InputNumber · InputOtp

모두 `Input`의 크기·variant·ref 및 네이티브 입력 속성을 받습니다. `type`은 각 컴포넌트가 지정합니다.
`onChange`는 네이티브 React change event이며, 숫자가 필요하면 `event.currentTarget.valueAsNumber`를 사용합니다.

| 컴포넌트       | 추가 prop                             | 동작                                                                                  |
| -------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| `AutoComplete` | `suggestions: readonly string[]` 필수 | `input` + `datalist`, 문자열 추천과 자유 입력. 별도 list 지정 불가                    |
| `DatePicker`   | —                                     | `type="date"`, value/min/max는 `YYYY-MM-DD`. 단일 날짜                                |
| `InputColor`   | —                                     | `type="color"`, 기본 색상 값은 `#rrggbb`                                              |
| `InputNumber`  | —                                     | `type="number"`, min/max/step 및 네이티브 폼 검증                                     |
| `InputOtp`     | `length?: number` (6)                 | 단일 텍스트 입력, 숫자 키보드·one-time-code 자동완성·maxLength·정확한 자리 수 pattern |

날짜/색상 팝업과 자동완성 추천 UI는 브라우저·OS에 따라 달라집니다.
AutoComplete는 옵션만 선택하도록 강제하지 않으며 비동기 검색이나 커스텀 combobox를 제공하지 않습니다.
InputOtp는 붙여넣기와 모바일 자동완성을 유지하는 단일 필드이며, 숫자 여부는 폼 제출의 네이티브 pattern 검증으로 확인합니다.
필수 값에는 `required`를 지정하세요. 서버에서도 입력값을 검증해야 합니다.

### Label · FloatLabel · IftaLabel

`Label`은 스타일을 적용한 네이티브 label이며 `htmlFor`로 입력 id에 연결합니다.
`FloatLabel`과 `IftaLabel`은 div props + 필수 `label: string`, `htmlFor: string`, 입력 children을 받습니다.
FloatLabel은 포커스/값 유무에 따라 라벨 위치가 바뀌고 IftaLabel은 항상 안쪽 위에 표시됩니다.
자식을 복제하지 않으므로 id 연결은 직접 합니다. FloatLabel의 input/textarea에는 `placeholder=" "`가 필요합니다.

```tsx
<FloatLabel label="이메일" htmlFor="email">
  <InputText id="email" type="email" placeholder=" " />
</FloatLabel>
```

### IconField · InputGroup

div props와 `leading?: ReactNode`, `trailing?: ReactNode`, `children`을 받습니다.
IconField는 입력 내부 양끝에 아이콘/버튼 슬롯을 배치합니다(기본 leading 18px, trailing 36px 이내 권장).
InputGroup은 접두·접미 텍스트와 입력/버튼을 한 줄로 연결합니다.
장식 아이콘에는 `aria-hidden`, 버튼에는 접근 가능한 이름을 지정하세요. wrapper의 ref는 div에 연결됩니다.

```tsx
<Field label="금액" htmlFor="amount">
  <InputGroup trailing="원">
    <InputNumber id="amount" min={0} step={1000} />
  </InputGroup>
</Field>
```

### CheckboxGroup

fieldset props와 필수 `label: string`, `name: string`, `options: readonly { label: string; value: string; disabled?: boolean }[]`를 받습니다.
`value?: readonly string[]`, `defaultValue?: readonly string[]`(빈 배열), `onValueChange?: (value: string[]) => void`를 지원합니다.
value가 있으면 controlled입니다. 두 초기화 방식을 함께 사용하지 마세요. options의 value는 고유해야 합니다.
그룹 전체는 fieldset의 `disabled`, 개별 항목은 option.disabled로 비활성화합니다. name이 같은 체크박스로 직렬화됩니다.

### InputMask · KeyFilter

둘 다 controlled 텍스트 입력입니다. `value: string`, `onValueChange: (value: string) => void`가 필수입니다.
`onChange`/`defaultValue` 대신 이 API를 사용하고, 나머지 Input 속성과 ref는 그대로 전달됩니다.
한글 등 IME 조합 중에는 텍스트를 보존하고 조합이 끝난 뒤 변환합니다. 붙여넣기도 같은 변환을 적용합니다.

| 컴포넌트    | prop                                             | 동작                                                                      |
| ----------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| `InputMask` | `mask: string` 필수                              | `#`는 ASCII 숫자 한 자리, 나머지는 리터럴 구분자. 반환 값에 구분자를 포함 |
| `KeyFilter` | `filter?: 'digits' \| 'alpha' \| 'alphanumeric'` | 기본 digits. ASCII 숫자/영문 이외 문자를 제거                             |

InputMask는 고정 숫자 마스크만 지원하며 가변 길이/국제 전화번호 포맷은 제공하지 않습니다.
입력 중인 불완전한 값도 허용합니다. 필요한 완성 형식은 네이티브 `pattern`/`required`로 검증하세요.

```tsx
const [phone, setPhone] = useState('');
<InputMask
  aria-label="휴대폰"
  mask="###-####-####"
  value={phone}
  onValueChange={setPhone}
/>;
```

### InputPassword

Input props에서 type을 제외하고 `showLabel?: string`(비밀번호 보기), `hideLabel?: string`(비밀번호 숨기기)를 추가합니다.
버튼으로 텍스트 표시를 전환하고 `aria-pressed`로 상태를 알립니다. ref/className은 입력에 전달됩니다.
기본 autoComplete는 current-password이며 신규 비밀번호에는 new-password를 지정하세요.

### InputTags

`value: readonly string[]`, `onValueChange: (value: string[]) => void` 필수. 그 외 Input props에서 type/value/defaultValue/onChange를 제외합니다.
입력 후 Enter 또는 blur로 앞뒤 공백을 제거한 태그를 추가하며 빈 값·중복은 추가하지 않습니다.
삭제 버튼으로 제거합니다. `removeLabel?: (tag: string) => string`으로 접근 가능한 삭제 문구를 바꿀 수 있습니다.
`disabled`/`readOnly`는 추가와 삭제를 모두 막습니다. `name`이 있으면 태그별 hidden input을 생성하며 외부 폼의 `form`도 전달합니다.
ref/id/className/aria는 태그를 작성하는 input에 적용됩니다. value에는 고유한 태그만 전달하세요.
네이티브 required/pattern은 작성 중인 입력에 적용됩니다. 태그 개수 검증은 소비 앱에서 처리하세요.

### Listbox · Slider · Knob

| 컴포넌트  | props                                                                                         | 동작                                                                                        |
| --------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Listbox` | 네이티브 select props. `size` 기본 5, 최소 2                                                  | 항상 펼쳐진 선택 목록, option children. `multiple` 지원                                     |
| `Slider`  | type 제외 네이티브 input props                                                                | type=range, min/max/step/value/defaultValue/onChange. 키보드 및 포인터는 브라우저 기본 동작 |
| `Knob`    | Slider props + 필수 `label: string`, `value: number`, 숫자 min(0)/max(100), defaultValue 제외 | 원형 수치 표시 + 아래 네이티브 슬라이더로 값 조절                                           |

Knob는 controlled이며 `onChange`에서 value를 갱신합니다. 원형 표시는 장식이고 실제 조작·ref·className은 하단 range input에 적용됩니다.
원형 표면을 직접 드래그하는 동작은 제공하지 않습니다. min보다 큰 max와 범위 내의 유한한 value를 전달하세요.

### Rating · ToggleButton

`Rating`은 fieldset props + 필수 `label: string`, `value: number`, 선택적 `max: number`(5), `name: string`, `onValueChange: (value: number) => void`를 받습니다.
1부터 max까지 정수 점수의 controlled radio 그룹입니다. value=0이면 선택 전 상태이며, 사용자가 변경하려면 onValueChange를 연결합니다.
키보드 방향키·네이티브 폼 직렬화·그룹 disabled를 지원합니다. max에는 양의 유한한 정수를 사용하세요.

`ToggleButton`은 Chip props에서 selected를 제외하고 `pressed?: boolean`, `defaultPressed?: boolean`(false), `onPressedChange?: (pressed: boolean) => void`를 받습니다.
pressed가 있으면 controlled입니다. 클릭으로 상태를 바꾸며 aria-pressed로 표현합니다.
onClick에서 preventDefault()하면 토글하지 않습니다. 기본 type=button이며 체크박스 폼 값으로 직렬화되지 않습니다.

## 표면

### Card (div)

| prop      | 타입                             | 기본값     | 설명                                 |
| --------- | -------------------------------- | ---------- | ------------------------------------ |
| `padding` | `sm \| md \| lg`                 | `md`       | 반지름도 함께 16 / 20 / 24px로 변함  |
| `variant` | `elevated \| filled \| outlined` | `elevated` | elevated는 그림자, outlined는 테두리 |

### Badge (span)

| prop      | 타입                                                                 | 기본값    | 설명                                    |
| --------- | -------------------------------------------------------------------- | --------- | --------------------------------------- |
| `tone`    | `neutral \| brand \| success \| warning \| danger \| teal \| purple` | `neutral` |                                         |
| `variant` | `weak \| solid \| dot`                                               | `weak`    | dot은 알림 수를 표시하는 작은 원형 배지 |

색상만으로 상태를 표현하지 말고 상태 텍스트를 함께 넣으세요.

### Alert (div)

| prop   | 타입                                              | 기본값   | 설명                                          |
| ------ | ------------------------------------------------- | -------- | --------------------------------------------- |
| `tone` | `info \| neutral \| success \| warning \| danger` | `info`   |                                               |
| `icon` | `ReactNode`                                       | —        | 선행 인라인 SVG. `aria-hidden`으로 감쌉니다   |
| `role` | `string`                                          | `status` | 색과 긴급도는 별개입니다. 긴급 알림만 `alert` |

### Separator (hr)

| prop      | 타입                        | 기본값 | 설명                                                             |
| --------- | --------------------------- | ------ | ---------------------------------------------------------------- |
| `variant` | `line \| thick \| vertical` | `line` | thick은 페이지 배경색의 12px 섹션 구분, vertical은 인라인 구분선 |

### PageHeader (header)

| prop           | 타입              | 기본값 | 설명                         |
| -------------- | ----------------- | ------ | ---------------------------- |
| `title`        | `string` **필수** | —      | `Heading size="xl"`로 렌더링 |
| `headingLevel` | `1`–`6`           | `1`    |                              |
| `description`  | `string`          | —      | `Text tone="muted"`          |
| `actions`      | `ReactNode`       | —      | 우측 정렬 액션. 줄바꿈됩니다 |

## 패턴

### 목록·폼 조합

| 컴포넌트           | 핵심 props와 동작                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `FilterBar`        | `search`, `filters`, `sort`, `actions`, `advanced`. 좁은 화면에서는 줄바꿈하고 고급 조건은 네이티브 `details`로 펼칩니다. |
| `ActiveFilters`    | `filters: {id,label}[]`, `onRemove`, `onClear`. 각 조건을 버튼으로 제거하고 다음 조건으로 포커스를 옮깁니다.              |
| `BulkActionBar`    | `count`, 작업 버튼 children, `onClear`, `status`, `error`. `count`가 0이면 렌더하지 않습니다.                             |
| `DataPagination`   | `total`, `page`, `pageSize`, 변경 콜백. 표시 범위·페이지 크기·기존 `Pagination`을 한 영역에 배치합니다.                   |
| `FormSection`      | `title`, `description`, `actions`, `grouped`. 기본은 section, `grouped`는 fieldset/legend로 렌더합니다.                   |
| `FormActions`      | `dirty`, `saving`, `disabled`, `status`, `onCancel`, `form`, `sticky`. 저장 중에는 제출과 취소를 막습니다.                |
| `FormErrorSummary` | `errors: {id,label,message}[]`. 오류가 나타나면 요약에 포커스를 두고 각 링크로 해당 입력에 이동합니다.                    |

이 컴포넌트들은 검색 쿼리, 데이터 요청, 선택 작업, 검증·저장 정책을 실행하지 않습니다. 애플리케이션이 상태와 콜백을 전달합니다.

### ListRow (div)

| prop          | 타입              | 기본값 | 설명                 |
| ------------- | ----------------- | ------ | -------------------- |
| `title`       | `string` **필수** | —      |                      |
| `description` | `string`          | —      |                      |
| `leading`     | `ReactNode`       | —      | 아이콘, 아바타, 로고 |
| `trailing`    | `ReactNode`       | —      | 금액, 버튼, 화살표   |

정적인 행입니다. 바깥 div에 클릭 핸들러를 붙이지 말고 `trailing`에 이름이 있는 버튼/링크를 넣으세요.

### Switch (label + input[role=switch])

| prop    | 타입              | 기본값 | 설명             |
| ------- | ----------------- | ------ | ---------------- |
| `label` | `string` **필수** | —      | 접근 가능한 이름 |

`checked`/`onChange` 또는 `defaultChecked`를 사용합니다. `className`은 label, `ref`와 나머지는 input에 전달됩니다.

### SegmentedControl (fieldset + radio)

| prop            | 타입                                                              | 기본값 | 설명                                     |
| --------------- | ----------------------------------------------------------------- | ------ | ---------------------------------------- |
| `label`         | `string` **필수**                                                 | —      | 시각적으로 숨긴 legend                   |
| `name`          | `string` **필수**                                                 | —      | 폼 안에서 그룹마다 고유해야 합니다       |
| `options`       | `readonly { label: string; value: string; disabled?: boolean }[]` | —      | **필수**. value는 중복되지 않게          |
| `value`         | `string`                                                          | —      | controlled                               |
| `defaultValue`  | `string`                                                          | —      | uncontrolled. value와 함께 쓰지 않습니다 |
| `onValueChange` | `(value: string) => void`                                         | —      | controlled일 때 필수적으로 연결          |

탭이 아니라 단일 선택 radio group입니다. 화살표 키 이동과 폼 직렬화는 네이티브 동작을 그대로 씁니다.

### BottomCTA (div)

| prop          | 타입        | 기본값  | 설명                                      |
| ------------- | ----------- | ------- | ----------------------------------------- |
| `description` | `string`    | —       | 액션 위 보조 문구                         |
| `sticky`      | `boolean`   | `false` | 가장 가까운 스크롤 컨테이너 기준으로 고정 |
| `children`    | `ReactNode` | —       | 보통 `Button size="xl" fullWidth`         |

### ProgressBar (progress)

| prop    | 타입              | 기본값 | 설명                               |
| ------- | ----------------- | ------ | ---------------------------------- |
| `label` | `string` **필수** | —      | `aria-label`                       |
| `value` | `number`          | —      | 생략하면 네이티브 미정 진행률 상태 |
| `max`   | `number`          | `100`  | 양수                               |

### Result (div)

| prop          | 타입                        | 기본값    | 설명                    |
| ------------- | --------------------------- | --------- | ----------------------- |
| `title`       | `string` **필수**           | —         | `Heading size="lg"`     |
| `description` | `string`                    | —         |                         |
| `tone`        | `success \| info \| danger` | `success` | 원형 기호의 색과 아이콘 |
| `actions`     | `ReactNode`                 | —         |                         |

정적인 결과 화면입니다. 화면이 동적으로 바뀌면 `ref`와 `tabIndex`로 포커스를 옮기세요.

## 내비게이션

### Tabs (div[role=tablist])

| prop            | 타입                          | 기본값       | 설명                                    |
| --------------- | ----------------------------- | ------------ | --------------------------------------- |
| `items`         | `readonly TabItem[]` **필수** | —            |                                         |
| `label`         | `string` **필수**             | —            | tablist의 `aria-label`                  |
| `value`         | `string`                      | —            | 지정하면 controlled                     |
| `defaultValue`  | `string`                      | 첫 활성 item | uncontrolled 초기값                     |
| `onValueChange` | `(value: string) => void`     | —            |                                         |
| `variant`       | `underline \| pill`           | `underline`  | underline은 섹션 탭, pill은 알약 선택기 |
| `size`          | `md \| lg`                    | `md`         | 14 / 16px                               |

`TabItem`은 `{ value: string; label: ReactNode; disabled?: boolean; badge?: ReactNode; id?: string; panelId?: string }`입니다.
←/→/Home/End로 이동하며, WAI-ARIA 자동 활성화 방식이라 포커스 이동이 곧 선택입니다.

### TabPanel (div[role=tabpanel])

| prop     | 타입               | 기본값 | 설명                                  |
| -------- | ------------------ | ------ | ------------------------------------- |
| `active` | `boolean` **필수** | —      | false면 `hidden`, true면 `tabIndex=0` |

Tabs에 고유 `id`를 주고 TabPanel에 같은 `tabsId`와 항목 `value`를 전달하면 탭·패널 ID와 ARIA 속성을 연결합니다. 비활성 패널도 마운트해 연결 대상을 유지하세요. 직접 지정한 DOM `id`/`aria-labelledby`와 TabItem의 `id`/`panelId`가 우선합니다.

```tsx
const [tab, setTab] = useState('summary');

<Tabs
  id="account-tabs"
  label="계좌 정보"
  items={[
    { value: 'summary', label: '요약' },
    { value: 'history', label: '거래내역', badge: 12 },
  ]}
  value={tab}
  onValueChange={setTab}
/>;
<TabPanel tabsId="account-tabs" value="summary" active={tab === 'summary'}>…</TabPanel>
<TabPanel tabsId="account-tabs" value="history" active={tab === 'history'}>…</TabPanel>
```

### SideNav (nav) · SideNavSection (div) · SideNavItem (a 또는 button)

| 컴포넌트         | prop     | 타입              | 기본값 | 설명                                 |
| ---------------- | -------- | ----------------- | ------ | ------------------------------------ |
| `SideNav`        | `label`  | `string` **필수** | —      | `aria-label`                         |
| `SideNavSection` | `title`  | `string`          | —      | 없으면 제목 없는 그룹                |
| `SideNavItem`    | `icon`   | `ReactNode`       | —      | 20px 인라인 SVG                      |
| `SideNavItem`    | `badge`  | `ReactNode`       | —      | 우측 카운트                          |
| `SideNavItem`    | `active` | `boolean`         | —      | `aria-current="page"`                |
| `SideNavItem`    | `href`   | `string`          | —      | 있으면 `a`, 없으면 `button`으로 렌더 |

`SideNavItem`은 `ref`를 전달하지 않습니다(`a`와 `button` 두 타입을 하나로 표현할 수 없어서).

### NavRail (nav) · NavRailItem (a 또는 button)

| 컴포넌트      | prop     | 타입                 | 기본값 | 설명                        |
| ------------- | -------- | -------------------- | ------ | --------------------------- |
| `NavRail`     | `label`  | `string` **필수**    | —      | `aria-label`                |
| `NavRailItem` | `icon`   | `ReactNode` **필수** | —      | 24px 인라인 SVG             |
| `NavRailItem` | `label`  | `string` **필수**    | —      | 아이콘 아래 11px 캡션       |
| `NavRailItem` | `active` | `boolean`            | —      | `aria-current="page"`       |
| `NavRailItem` | `href`   | `string`             | —      | 있으면 `a`, 없으면 `button` |

`children`을 받지 않습니다. 라벨은 `label`로만 지정합니다. `ref`는 전달하지 않습니다.

### TopBar (header) · TopBarLink (a)

| 컴포넌트     | prop       | 타입        | 기본값      | 설명                               |
| ------------ | ---------- | ----------- | ----------- | ---------------------------------- |
| `TopBar`     | `brand`    | `ReactNode` | —           | 좌측 로고 영역                     |
| `TopBar`     | `actions`  | `ReactNode` | —           | 우측 검색/버튼/아바타 슬롯         |
| `TopBar`     | `navLabel` | `string`    | `주요 메뉴` | children을 감싸는 nav의 aria-label |
| `TopBarLink` | `active`   | `boolean`   | —           | `aria-current="page"`              |

높이는 60px 고정입니다. children이 있을 때만 안쪽 `nav`가 생깁니다.

### Breadcrumb (nav > ol) · BreadcrumbItem (li)

| 컴포넌트         | prop      | 타입      | 기본값      | 설명                             |
| ---------------- | --------- | --------- | ----------- | -------------------------------- |
| `Breadcrumb`     | `label`   | `string`  | `현재 위치` | `aria-label`                     |
| `BreadcrumbItem` | `href`    | `string`  | —           | current가 아니면 링크로 렌더     |
| `BreadcrumbItem` | `current` | `boolean` | —           | `aria-current="page"`, 링크 없음 |

### Pagination (nav)

| prop           | 타입                     | 기본값        | 설명                                    |
| -------------- | ------------------------ | ------------- | --------------------------------------- |
| `page`         | `number` **필수**        | —             | 1부터 시작                              |
| `pageCount`    | `number` **필수**        | —             | 1 미만이면 아무것도 렌더링하지 않습니다 |
| `onPageChange` | `(page: number) => void` | —             |                                         |
| `siblingCount` | `number`                 | `1`           | 현재 페이지 좌우로 보여 줄 이웃 수      |
| `label`        | `string`                 | `페이지 목록` | nav의 `aria-label`                      |
| `prevLabel`    | `string`                 | `이전 페이지` |                                         |
| `nextLabel`    | `string`                 | `다음 페이지` |                                         |

첫 페이지, 마지막 페이지, 현재 페이지 주변만 보여 주고 사이는 `…`으로 접습니다.

## 오버레이

### Dialog (dialog)

| prop          | 타입                  | 기본값  | 설명                                               |
| ------------- | --------------------- | ------- | -------------------------------------------------- |
| `open`        | `boolean` **필수**    | —       | controlled 전용. 소비 앱이 상태를 소유합니다       |
| `onClose`     | `() => void` **필수** | —       | Escape, 배경 클릭, 닫기 버튼에서 호출됨            |
| `title`       | `string` **필수**     | —       | `aria-labelledby`로 연결됨                         |
| `description` | `ReactNode`           | —       | 있으면 `aria-describedby`로 연결됨                 |
| `actions`     | `ReactNode`           | —       | 우측 정렬 하단 액션 행                             |
| `size`        | `sm \| md \| lg`      | `md`    | 최대 너비 400 / 560 / 800px                        |
| `dismissible` | `boolean`             | `true`  | false면 닫기 버튼·Escape·배경 클릭이 모두 막힙니다 |
| `sheet`       | `boolean`             | `false` | 600px 이하 뷰포트에서 하단 시트로 붙습니다         |

네이티브 `<dialog showModal()>`이므로 포커스 트랩과 배경 inert는 브라우저가 처리합니다.

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>계좌 삭제</Button>
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="계좌를 삭제할까요?"
  description="연결된 자동이체가 함께 해지됩니다."
  size="sm"
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
/>
```

### Menu (div) · MenuItem (button[role=menuitem]) · MenuSeparator · MenuLabel

| 컴포넌트   | prop       | 타입                    | 기본값    | 설명                                                        |
| ---------- | ---------- | ----------------------- | --------- | ----------------------------------------------------------- |
| `Menu`     | `trigger`  | `ReactElement` **필수** | —         | 복제되어 `aria-haspopup`/`aria-expanded`/onClick을 받습니다 |
| `Menu`     | `children` | `ReactNode` **필수**    | —         | MenuItem / MenuSeparator / MenuLabel                        |
| `Menu`     | `align`    | `start \| end`          | `start`   | 팝업 정렬                                                   |
| `MenuItem` | `onSelect` | `() => void`            | —         | onClick 이후에 호출됨                                       |
| `MenuItem` | `tone`     | `default \| danger`     | `default` |                                                             |
| `MenuItem` | `icon`     | `ReactNode`             | —         | 선행 아이콘                                                 |

트리거는 `onClick`과 aria 속성을 받을 수 있는 요소여야 합니다(`Button`, `IconButton` 모두 가능).
↓/↑로 열고 이동하며 Escape로 닫고 트리거에 포커스를 돌려줍니다. 팝업 안을 클릭하면 닫힙니다.

```tsx
<Menu align="end" trigger={<IconButton label="더보기">{DotsIcon}</IconButton>}>
  <MenuLabel>계정</MenuLabel>
  <MenuItem onSelect={openProfile}>프로필</MenuItem>
  <MenuSeparator />
  <MenuItem tone="danger" onSelect={signOut}>
    로그아웃
  </MenuItem>
</Menu>
```

### Tooltip (span)

| prop        | 타입                 | 기본값 | 설명                                        |
| ----------- | -------------------- | ------ | ------------------------------------------- |
| `content`   | `string` **필수**    | —      | 문자열만 받습니다                           |
| `placement` | `top \| bottom`      | `top`  |                                             |
| `children`  | `ReactNode` **필수** | —      | 유효한 엘리먼트면 `aria-describedby`를 주입 |

JS 위치 계산 없이 `:hover` / `:focus-within`으로만 동작합니다. 툴팁이 유일한 설명이면 안 되고,
필수 정보는 화면에 그대로 노출하세요.

### ToastProvider (div) · useToast()

`useToast()`는 `(options: ToastOptions) => ToastHandle`을 반환하며, provider 밖에서 호출하면 예외를 던집니다. 핸들은 `id`, `dismiss()`, `update(options: Partial<ToastOptions>)`를 제공합니다. 각 토스트의 닫기 버튼으로 종료할 수 있고, hover·키보드 포커스 중에는 자동 종료 타이머가 멈춥니다.

| ToastOptions  | 타입                                     | 기본값    | 설명                             |
| ------------- | ---------------------------------------- | --------- | -------------------------------- |
| `title`       | `string` **필수**                        | —         |                                  |
| `description` | `string`                                 | —         |                                  |
| `tone`        | `neutral \| success \| danger`           | `neutral` |                                  |
| `duration`    | `number`                                 | `3000`    | ms. `0` 또는 `Infinity`면 유지됨 |
| `action`      | `{ label: string; onClick: () => void }` | —         | 누르면 액션 실행 후 닫힘         |

```tsx
function App() {
  return (
    <ToastProvider>
      <Routes />
    </ToastProvider>
  );
}

function SaveButton() {
  const toast = useToast();
  return (
    <Button onClick={() => toast({ title: '저장했어요', tone: 'success' })}>
      저장
    </Button>
  );
}
```

뷰포트는 `aria-live="polite"`입니다. 즉시 조치가 필요한 오류는 토스트 대신 Alert나 Dialog로 알리세요.

## 데이터

### Table 계열

| 컴포넌트          | prop            | 타입                             | 기본값    | 설명                                  |
| ----------------- | --------------- | -------------------------------- | --------- | ------------------------------------- |
| `Table`           | `density`       | `compact \| regular`             | `regular` | 셀 높이 40 / 52px                     |
| `Table`           | `zebra`         | `boolean`                        | `false`   | 홀수 행 배경                          |
| `Table`           | `bordered`      | `boolean`                        | `false`   | 바깥 테두리 + 12px 반지름             |
| `Table`           | `stickyHeader`  | `boolean`                        | `false`   | thead 고정                            |
| `Table`           | `caption`       | `ReactNode`                      | —         | `<caption>`으로 렌더                  |
| `TableRow`        | `selected`      | `boolean`                        | —         | `aria-selected` + 선택 배경           |
| `TableRow`        | `clickable`     | `boolean`                        | `false`   | `tabIndex=0`, Enter/Space로 클릭 발생 |
| `TableHeaderCell` | `align`         | `start \| center \| end`         | `start`   |                                       |
| `TableHeaderCell` | `sortDirection` | `asc \| desc \| none`            | —         | `onSort`가 있으면 `none`이 기본       |
| `TableHeaderCell` | `onSort`        | `MouseEventHandler`              | —         | 지정하면 헤더가 정렬 버튼이 됨        |
| `TableHeaderCell` | `scope`         | `string`                         | `col`     |                                       |
| `TableCell`       | `align`         | `start \| center \| end`         | `start`   |                                       |
| `TableCell`       | `numeric`       | `boolean`                        | `false`   | tabular-nums + 우측 정렬 강제         |
| `TableCell`       | `tone`          | `default \| up \| down \| muted` | `default` | up/down은 상승·하락 색                |
| `TableEmpty`      | `colSpan`       | `number`                         | `1000`    | 자체적으로 `tr`을 만듭니다            |

`Table`의 `className`/`style`은 가로 스크롤 래퍼에 적용되고, 나머지 props와 `ref`는 안쪽 `<table>`에 전달됩니다.
`TableHead`/`TableBody`는 추가 props 없이 네이티브 `thead`/`tbody`입니다.

```tsx
<Table density="compact" stickyHeader caption="최근 정산 내역">
  <TableHead>
    <TableRow>
      <TableHeaderCell>주문번호</TableHeaderCell>
      <TableHeaderCell align="end" sortDirection={dir} onSort={toggleSort}>
        금액
      </TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {rows.length === 0 ? (
      <TableEmpty colSpan={2}>정산 내역이 없어요.</TableEmpty>
    ) : (
      rows.map((row) => (
        <TableRow key={row.id} clickable onClick={() => open(row.id)}>
          <TableCell>{row.id}</TableCell>
          <TableCell numeric>
            <Amount value={row.amount} />
          </TableCell>
        </TableRow>
      ))
    )}
  </TableBody>
</Table>
```

### Stat (div)

| prop    | 타입                                                     | 기본값  | 설명                            |
| ------- | -------------------------------------------------------- | ------- | ------------------------------- |
| `label` | `ReactNode` **필수**                                     | —       | 13px muted 캡션                 |
| `value` | `ReactNode` **필수**                                     | —       | tabular-nums 굵은 숫자          |
| `unit`  | `ReactNode`                                              | —       | 값 뒤 단위                      |
| `delta` | `{ value: string; direction: 'up' \| 'down' \| 'flat' }` | —       | 삼각형 + 스크린리더용 상승/하락 |
| `hint`  | `ReactNode`                                              | —       | 보조 설명                       |
| `size`  | `sm \| md \| lg`                                         | `md`    | 값 20 / 24 / 28px               |
| `align` | `start \| end`                                           | `start` |                                 |

### Amount (span 또는 p)

| prop       | 타입                            | 기본값    | 설명                                    |
| ---------- | ------------------------------- | --------- | --------------------------------------- |
| `value`    | `number` **필수**               | —         | `Intl.NumberFormat('ko-KR')`로 포맷     |
| `currency` | `string`                        | `원`      | `$`는 앞에 붙고, 나머지는 뒤에 붙습니다 |
| `signed`   | `boolean`                       | `false`   | 양수에도 `+` 표시                       |
| `tone`     | `default \| up \| down \| auto` | `default` | auto는 양수→up(빨강), 음수→down(파랑)   |
| `size`     | `sm \| md \| lg \| xl`          | `md`      | 14 / 16 / 20 / 26px                     |
| `as`       | `span \| p`                     | `span`    |                                         |

### Avatar (span) · AvatarGroup (div)

| 컴포넌트      | prop    | 타입                   | 기본값   | 설명                                      |
| ------------- | ------- | ---------------------- | -------- | ----------------------------------------- |
| `Avatar`      | `name`  | `string` **필수**      | —        | 첫 글자를 표시하고, 이름 해시로 색을 고름 |
| `Avatar`      | `src`   | `string`               | —        | 로딩에 실패하면 자동으로 이니셜로 대체    |
| `Avatar`      | `alt`   | `string`               | `name`   | 빈 문자열이면 장식으로 처리               |
| `Avatar`      | `size`  | `xs \| sm \| md \| lg` | `md`     | 24 / 32 / 40 / 48px                       |
| `Avatar`      | `shape` | `circle \| rounded`    | `circle` |                                           |
| `AvatarGroup` | `max`   | `number`               | —        | 초과분은 `+N` 배지로 표시                 |

### Skeleton (span)

| prop     | 타입                      | 기본값 | 설명                  |
| -------- | ------------------------- | ------ | --------------------- |
| `width`  | `CSSProperties['width']`  | —      | 바깥 요소 너비        |
| `height` | `CSSProperties['height']` | —      | 각 줄 높이            |
| `shape`  | `text \| rect \| circle`  | `text` | rect 기본 높이 100px  |
| `lines`  | `number`                  | `1`    | text에서 여러 줄 생성 |

항상 `aria-hidden`입니다. 로딩 상태 자체는 소비 앱에서 live region이나 `aria-busy`로 알리세요.

### Banner (div)

| prop          | 타입                                    | 기본값    | 설명                          |
| ------------- | --------------------------------------- | --------- | ----------------------------- |
| `title`       | `ReactNode` **필수**                    | —         | `h3`로 렌더                   |
| `tone`        | `neutral \| brand \| warning \| danger` | `neutral` |                               |
| `icon`        | `ReactNode`                             | —         |                               |
| `description` | `ReactNode`                             | —         | 13px muted                    |
| `action`      | `ReactNode`                             | —         | 우측 버튼/링크                |
| `onDismiss`   | `() => void`                            | —         | 지정하면 닫기 IconButton 표시 |

### EmptyState (div)

| prop          | 타입                 | 기본값 | 설명                      |
| ------------- | -------------------- | ------ | ------------------------- |
| `title`       | `ReactNode` **필수** | —      | `h3`, `Heading size="sm"` |
| `icon`        | `ReactNode`          | —      |                           |
| `description` | `ReactNode`          | —      |                           |
| `action`      | `ReactNode`          | —      | 다음 행동 버튼            |

## 분석·업무 패턴

| API                                  | 핵심 동작                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `BarChart`, `LineChart`, `Sparkline` | 데이터 배열로 SVG/CSS 차트를 생성하고 빈 값·같은 값·비정상 숫자를 안전하게 처리 |
| `FileUploadList`                     | pending/uploading/complete/error, 진행률, 취소·재시도·제거                      |
| `NotificationList`                   | 날짜 그룹, 읽음·모두 읽음, 빈 목록, 더 보기                                     |
| `SelectionCard`                      | 네이티브 radio/checkbox 기반 카드 선택                                          |
| `DetailSection`                      | `FormSection`과 같은 구현을 재사용                                              |
| `InlineEdit`                         | Enter 저장, Escape 취소, 비동기 실패 시 입력 보존                               |
| `MegaIcon`                           | 예제에서 쓰던 공통 SVG 자산을 `name`으로 사용                                   |

## 조합 레시피

`NotificationList`는 안 읽은 항목을 제목 앞 작은 점과 굵기로 구분하고, 보조 기술에는 ‘안 읽음’을 전달합니다. 기본 배경은 읽음 여부와 관계없이 중립색이며, 업무상 상태색이 필요하면 항목의 `tone`을 명시하세요.

[실무 준비도 보강](./readiness.md)에 Combobox 필수 선택·reset, 날짜 범위, Tabs 연결, Toast 제어와 실행 가능한 상태 예제를 정리했습니다.

목록 CRUD는 `FilterBar + ActiveFilters + DataGrid + DataPagination + Drawer`, 폼은 `FormErrorSummary + FormSection + FormActions`, 결제는 `SelectionCard + Amount + DescriptionList + Timeline`을 조합합니다. 실제 동작 예제는 사용자 관리·드라이브·설정·결제 화면에 있습니다. Markdown 편집기, 댓글·멘션, 저장된 필터, 승인 흐름 등 보고서 6절의 후보는 제품 수요가 생길 때 이 조합에서 반복되는 부분만 승격합니다.
