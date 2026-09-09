# Actions · Inputs · Selection 확장

150 컴포넌트 체크리스트의 11–55번을 현재 공개 API와 대조한 결과입니다. `기존`은 구현을 그대로 사용하고, `별칭`은 같은 함수와 Props 타입을 새 이름으로 export하며, `추가`만 새 코드를 가집니다.

## 11–20 Actions

| #   | 이름                   | 상태      | 구현 / 핵심 API                                                                    |
| --- | ---------------------- | --------- | ---------------------------------------------------------------------------------- |
| 11  | `Button`               | 기존      | `variant`, `size`, `loading`, `leading`, `trailing`                                |
| 12  | `IconButton`           | 기존      | 필수 `label`, `size`, `variant`, `round`                                           |
| 13  | `ButtonGroup`          | 추가      | div props, `orientation`; 접근 가능한 이름은 `aria-label`/`aria-labelledby`로 지정 |
| 14  | `SplitButton`          | 추가      | `children`, `onAction`, `items`, `menuLabel`, `variant`, `size`, `disabled`        |
| 15  | `ToggleButton`         | 기존      | `pressed`/`defaultPressed`, `onPressedChange`                                      |
| 16  | `ToggleButtonGroup`    | 기존 별칭 | `SegmentedControl`; 단일 선택 라디오 그룹                                          |
| 17  | `FloatingActionButton` | 추가      | 필수 `label`, 아이콘 `children`; 위치는 화면 레이아웃에서 결정                     |
| 18  | `SpeedDial`            | 추가      | 필수 `label`, `actions`; 네이티브 `details`/`summary`로 열고 닫음                  |
| 19  | `CopyButton`           | 추가      | 필수 `value`, `copiedLabel`, `resetAfter`, `onCopied`, `onCopyError`               |
| 20  | `LinkButton`           | 추가      | 필수 `href`, Button의 `variant`/`size`/아이콘 슬롯; 실제 anchor라 disabled 없음    |

`SplitButton.items`와 `SpeedDial.actions`는 `{ label, onSelect?, disabled? }`를 받으며 SpeedDial action에는 `icon?`도 지정할 수 있습니다. `CopyButton`은 보안 컨텍스트의 Clipboard API를 사용합니다. 지원하지 않거나 권한이 거부되면 `onCopyError`로 오류를 전달합니다.

## 21–45 Form / Inputs

| #   | 이름              | 상태 | 구현 / 핵심 API                                                 |
| --- | ----------------- | ---- | --------------------------------------------------------------- |
| 21  | `Input`           | 기존 | 네이티브 input + `variant`, `size`                              |
| 22  | `Textarea`        | 기존 | 네이티브 textarea + `variant`, `size`, `rows`                   |
| 23  | `PasswordInput`   | 별칭 | `InputPassword`; 보기/숨기기 버튼과 `showLabel`, `hideLabel`    |
| 24  | `NumberInput`     | 별칭 | `InputNumber`; 네이티브 `type="number"`                         |
| 25  | `CurrencyInput`   | 추가 | NumberInput + `suffix`(기본 `원`)                               |
| 26  | `PercentInput`    | 추가 | NumberInput + `suffix`(기본 `%`)                                |
| 27  | `MaskInput`       | 별칭 | `InputMask`; `#` 숫자 자리 마스크, controlled `value`           |
| 28  | `OTPInput`        | 별칭 | `InputOtp`; 단일 필드, `length`(기본 6), one-time-code          |
| 29  | `SearchInput`     | 추가 | 네이티브 `type="search"`                                        |
| 30  | `ColorInput`      | 별칭 | `InputColor`; 네이티브 `type="color"`                           |
| 31  | `FileInput`       | 추가 | 네이티브 `type="file"`; `accept`, `multiple`, `capture` 지원    |
| 32  | `DateInput`       | 별칭 | `DatePicker`; 네이티브 단일 `type="date"`                       |
| 33  | `DatePicker`      | 기존 | 네이티브 단일 `type="date"`                                     |
| 34  | `DateRangePicker` | 추가 | 날짜 입력 두 개, `presets`, `error`, 범위 제약, `onValueChange` |
| 35  | `TimePicker`      | 추가 | 네이티브 `type="time"`                                          |
| 36  | `DateTimePicker`  | 추가 | 네이티브 `type="datetime-local"`                                |
| 37  | `Slider`          | 기존 | 네이티브 `type="range"`                                         |
| 38  | `RangeSlider`     | 추가 | `label`, `name`, `[min,max]` 값, `onValueChange`                |
| 39  | `Rating`          | 기존 | 라디오 입력 기반 별점                                           |
| 40  | `Knob`            | 기존 | 네이티브 range + 원형 표시                                      |
| 41  | `FormField`       | 별칭 | `Field`; label/hint/error wrapper                               |
| 42  | `FormLabel`       | 별칭 | `Label`; 네이티브 label                                         |
| 43  | `FormDescription` | 추가 | 네이티브 p, 설명 스타일; 입력의 `aria-describedby`와 id 연결    |
| 44  | `FormError`       | 추가 | 네이티브 p, 기본 `role="alert"`; 입력에 `aria-invalid` 지정     |
| 45  | `InputGroup`      | 기존 | leading/trailing addon과 입력 조합                              |

`CurrencyInput`과 `PercentInput`은 표시 문자열을 포맷하지 않습니다. 폼 값은 NumberInput의 원시 숫자이며 범위와 소수점은 `min`, `max`, `step`으로 정합니다.

`DateRangePicker`의 두 입력은 각각 `startProps`와 `endProps`로 native date 속성을 받습니다. `presets`는 `{label,start,end}` 배열이며 controlled 입력에서는 `onValueChange`로 받은 값을 다시 전달합니다. `RangeSlider`는 낮은 값이 높은 값을 넘지 않게 제한하며 폼 이름은 `${name}Min`, `${name}Max`가 됩니다.

## 46–55 Selection

| #   | 이름            | 상태 | 구현 / 핵심 API                                            |
| --- | --------------- | ---- | ---------------------------------------------------------- |
| 46  | `Checkbox`      | 기존 | 네이티브 checkbox + label                                  |
| 47  | `CheckboxGroup` | 기존 | fieldset, 동일 name의 checkbox 목록                        |
| 48  | `Radio`         | 기존 | 네이티브 radio + label                                     |
| 49  | `RadioGroup`    | 추가 | `label`, `name`, `options`, controlled/uncontrolled value  |
| 50  | `Switch`        | 기존 | checkbox + `role="switch"`                                 |
| 51  | `Select`        | 기존 | 네이티브 select                                            |
| 52  | `MultiSelect`   | 추가 | 네이티브 multiple 또는 options 기반 검색·칩·개수·선택 제한 |
| 53  | `Autocomplete`  | 별칭 | `AutoComplete`; input + datalist, `suggestions`            |
| 54  | `Combobox`      | 추가 | id/label/query 분리, 비동기 상태, 옵션 렌더링, clear       |
| 55  | `TreeSelect`    | 추가 | 재귀 `groups`를 native `optgroup`/`option`으로 렌더링      |

`Autocomplete`는 가벼운 자유 입력에 native datalist를 사용합니다. `Combobox`는 `options`, `value`, `query`, `loading`, `error`, `renderOption`을 제공하며 선택 값은 hidden input으로 제출합니다. `MultiSelect`는 children을 주면 기존 native 모드, `options`를 주면 검색형 모드입니다. `TreeSelect`의 깊은 트리 편집은 실제 수요가 생길 때 추가하며 현재는 경로 라벨로 평탄화합니다.
