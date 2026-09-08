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

| #   | 이름              | 상태 | 구현 / 핵심 API                                                            |
| --- | ----------------- | ---- | -------------------------------------------------------------------------- |
| 21  | `Input`           | 기존 | 네이티브 input + `variant`, `size`                                         |
| 22  | `Textarea`        | 기존 | 네이티브 textarea + `variant`, `size`, `rows`                              |
| 23  | `PasswordInput`   | 별칭 | `InputPassword`; 보기/숨기기 버튼과 `showLabel`, `hideLabel`               |
| 24  | `NumberInput`     | 별칭 | `InputNumber`; 네이티브 `type="number"`                                    |
| 25  | `CurrencyInput`   | 추가 | NumberInput + `suffix`(기본 `원`)                                          |
| 26  | `PercentInput`    | 추가 | NumberInput + `suffix`(기본 `%`)                                           |
| 27  | `MaskInput`       | 별칭 | `InputMask`; `#` 숫자 자리 마스크, controlled `value`                      |
| 28  | `OTPInput`        | 별칭 | `InputOtp`; 단일 필드, `length`(기본 6), one-time-code                     |
| 29  | `SearchInput`     | 추가 | 네이티브 `type="search"`                                                   |
| 30  | `ColorInput`      | 별칭 | `InputColor`; 네이티브 `type="color"`                                      |
| 31  | `FileInput`       | 추가 | 네이티브 `type="file"`; `accept`, `multiple`, `capture` 지원               |
| 32  | `DateInput`       | 별칭 | `DatePicker`; 네이티브 단일 `type="date"`                                  |
| 33  | `DatePicker`      | 기존 | 네이티브 단일 `type="date"`                                                |
| 34  | `DateRangePicker` | 추가 | `label`, `startName`, `endName`, `startProps`, `endProps`, `onValueChange` |
| 35  | `TimePicker`      | 추가 | 네이티브 `type="time"`                                                     |
| 36  | `DateTimePicker`  | 추가 | 네이티브 `type="datetime-local"`                                           |
| 37  | `Slider`          | 기존 | 네이티브 `type="range"`                                                    |
| 38  | `RangeSlider`     | 추가 | `label`, `name`, `[min,max]` 값, `onValueChange`                           |
| 39  | `Rating`          | 기존 | 라디오 입력 기반 별점                                                      |
| 40  | `Knob`            | 기존 | 네이티브 range + 원형 표시                                                 |
| 41  | `FormField`       | 별칭 | `Field`; label/hint/error wrapper                                          |
| 42  | `FormLabel`       | 별칭 | `Label`; 네이티브 label                                                    |
| 43  | `FormDescription` | 추가 | 네이티브 p, 설명 스타일; 입력의 `aria-describedby`와 id 연결               |
| 44  | `FormError`       | 추가 | 네이티브 p, 기본 `role="alert"`; 입력에 `aria-invalid` 지정                |
| 45  | `InputGroup`      | 기존 | leading/trailing addon과 입력 조합                                         |

`CurrencyInput`과 `PercentInput`은 표시 문자열을 포맷하지 않습니다. 폼 값은 NumberInput의 원시 숫자이며 범위와 소수점은 `min`, `max`, `step`으로 정합니다.

`DateRangePicker`의 두 입력은 각각 `startProps`와 `endProps`로 native date 속성을 받습니다. 날짜 순서가 필요하면 시작 입력의 `max`, 종료 입력의 `min`을 연결하세요. `RangeSlider`는 낮은 값이 높은 값을 넘지 않게 제한하며 폼 이름은 `${name}Min`, `${name}Max`가 됩니다.

## 46–55 Selection

| #   | 이름            | 상태 | 구현 / 핵심 API                                           |
| --- | --------------- | ---- | --------------------------------------------------------- |
| 46  | `Checkbox`      | 기존 | 네이티브 checkbox + label                                 |
| 47  | `CheckboxGroup` | 기존 | fieldset, 동일 name의 checkbox 목록                       |
| 48  | `Radio`         | 기존 | 네이티브 radio + label                                    |
| 49  | `RadioGroup`    | 추가 | `label`, `name`, `options`, controlled/uncontrolled value |
| 50  | `Switch`        | 기존 | checkbox + `role="switch"`                                |
| 51  | `Select`        | 기존 | 네이티브 select                                           |
| 52  | `MultiSelect`   | 추가 | 네이티브 select를 `multiple`로 고정, `size` 최소 2        |
| 53  | `Autocomplete`  | 별칭 | `AutoComplete`; input + datalist, `suggestions`           |
| 54  | `Combobox`      | 별칭 | `AutoComplete`; 브라우저의 datalist combobox              |
| 55  | `TreeSelect`    | 추가 | 재귀 `groups`를 native `optgroup`/`option`으로 렌더링     |

`Autocomplete`와 `Combobox`는 브라우저 팝업과 키보드 조작을 사용하고 자유 입력을 허용합니다. 비동기 검색, 임의 옵션 렌더링, 선택 강제는 지원하지 않습니다. `TreeSelect`의 최상위 그룹은 `optgroup`, 더 깊은 그룹은 `상위 › 하위` option 라벨로 평탄화됩니다. 조상 그룹의 disabled 상태는 모든 하위 option에 전달됩니다.
