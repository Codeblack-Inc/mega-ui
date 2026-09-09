import { useState, type ReactNode } from 'react';
import {
  AutoComplete,
  DatePicker,
  Field,
  FloatLabel,
  IconField,
  IftaLabel,
  Input,
  InputColor,
  InputGroup,
  InputMask,
  InputNumber,
  InputOtp,
  InputPassword,
  InputTags,
  KeyFilter,
  Label,
  Listbox,
  Select,
  Stack,
  Text,
  Textarea,
} from '@mega-ui/react';
import { CategoryCards, PairNote } from './shell';

export const inputNames = [
  'Input',
  'Textarea',
  'Select',
  'Listbox',
  'Field',
  'Label',
  'FloatLabel',
  'IftaLabel',
  'IconField',
  'InputGroup',
  'AutoComplete',
  'DatePicker',
  'InputNumber',
  'InputColor',
  'InputMask',
  'KeyFilter',
  'InputOtp',
  'InputPassword',
  'InputTags',
] as const;

const teamOptions = [
  { label: '디자인', value: 'design' },
  { label: '개발', value: 'dev' },
  { label: '운영', value: 'ops', disabled: true },
];

const searchIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="6" />
    <path d="m15 15 5 5" />
  </svg>
);

export function InputsCategory() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [tags, setTags] = useState(['디자인', '개발']);

  const demos: Record<(typeof inputNames)[number], ReactNode> = {
    Input: (
      <Stack gap={4}>
        <Text size="sm" tone="muted">
          데스크톱의 테두리형과 모바일의 회색 박스형이에요.
        </Text>
        {(['outline', 'box'] as const).map((variant) => (
          <Stack gap={2} key={variant}>
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <Input
                key={size}
                variant={variant}
                size={size}
                aria-label={`${variant} ${size} 입력 예제`}
                placeholder={`${variant === 'box' ? '박스형' : '테두리형'} · ${size}`}
              />
            ))}
          </Stack>
        ))}
        <Input
          aria-label="잘못된 입력 예제"
          aria-invalid="true"
          defaultValue="입력 내용을 확인해 주세요"
        />
        <Input
          aria-label="비활성 입력 예제"
          disabled
          placeholder="입력할 수 없어요"
        />
      </Stack>
    ),
    Textarea: (
      <Field label="요청 사항" htmlFor="form-textarea">
        <Textarea id="form-textarea" placeholder="자유롭게 적어 주세요" />
      </Field>
    ),
    Select: (
      <Stack gap={4}>
        <Field label="직무" htmlFor="form-select">
          <Select id="form-select" defaultValue="design">
            {teamOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="계좌 선택" htmlFor="form-account">
          <Select id="form-account">
            <option>메가뱅크</option>
            <option>다른 은행</option>
          </Select>
        </Field>
      </Stack>
    ),
    Listbox: (
      <Field label="팀 선택" htmlFor="form-listbox">
        <Listbox id="form-listbox" defaultValue="dev" size={3}>
          {teamOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </Listbox>
      </Field>
    ),
    Field: (
      <Stack gap={4}>
        <Field label="이름" htmlFor="form-name" hint="실명을 입력해 주세요">
          <Input
            id="form-name"
            placeholder="이름을 입력해 주세요"
            aria-describedby="form-name-description"
          />
        </Field>
        <Field
          label="이메일"
          htmlFor="form-email"
          error="이메일 주소를 다시 확인해 주세요"
        >
          <Input
            id="form-email"
            defaultValue="mega@"
            aria-invalid="true"
            aria-describedby="form-email-description"
          />
        </Field>
        <Field label="변경할 수 없는 정보" htmlFor="form-disabled">
          <Input id="form-disabled" disabled value="인증된 계정" readOnly />
        </Field>
      </Stack>
    ),
    Label: (
      <Stack gap={2}>
        <Label htmlFor="form-label">담당자</Label>
        <Input id="form-label" placeholder="담당자 이름" />
      </Stack>
    ),
    FloatLabel: (
      <FloatLabel label="이메일" htmlFor="form-float">
        <Input id="form-float" type="email" placeholder=" " />
      </FloatLabel>
    ),
    IftaLabel: (
      <IftaLabel label="회사 이름" htmlFor="form-ifta">
        <Input id="form-ifta" placeholder="메가 주식회사" />
      </IftaLabel>
    ),
    IconField: (
      <IconField leading={searchIcon}>
        <Input aria-label="검색어" placeholder="무엇을 찾으세요?" />
      </IconField>
    ),
    InputGroup: (
      <Field label="웹사이트" htmlFor="form-domain">
        <InputGroup leading="https://" trailing=".com">
          <Input id="form-domain" placeholder="mega" />
        </InputGroup>
      </Field>
    ),
    AutoComplete: (
      <Field
        label="도시"
        htmlFor="form-city"
        hint="입력하면 추천 도시가 나타나요."
      >
        <AutoComplete
          id="form-city"
          name="city"
          suggestions={['서울', '부산', '대전', '제주']}
          placeholder="도시 검색"
          aria-describedby="form-city-description"
        />
      </Field>
    ),
    DatePicker: (
      <Field label="예약 날짜" htmlFor="form-date">
        <DatePicker id="form-date" name="date" />
      </Field>
    ),
    InputNumber: (
      <Field label="주문 수량" htmlFor="form-number">
        <InputNumber
          id="form-number"
          defaultValue={1}
          min={1}
          max={99}
          step={1}
        />
      </Field>
    ),
    InputColor: (
      <Field label="브랜드 색상" htmlFor="form-color">
        <InputColor id="form-color" defaultValue="#3182f6" />
      </Field>
    ),
    InputMask: (
      <Field label="휴대폰 번호" htmlFor="form-mask">
        <InputMask
          id="form-mask"
          mask="###-####-####"
          value={phone}
          onValueChange={setPhone}
          placeholder="010-1234-5678"
        />
      </Field>
    ),
    KeyFilter: (
      <Field
        label="숫자 코드"
        htmlFor="form-filter"
        hint="숫자만 남겨요. 붙여넣기도 가능해요."
      >
        <KeyFilter
          id="form-filter"
          value={code}
          onValueChange={setCode}
          aria-describedby="form-filter-description"
          placeholder="숫자 입력"
        />
      </Field>
    ),
    InputOtp: (
      <Field label="인증번호 6자리" htmlFor="form-otp">
        <InputOtp id="form-otp" placeholder="000000" required />
      </Field>
    ),
    InputPassword: (
      <Field label="비밀번호" htmlFor="form-password">
        <InputPassword id="form-password" placeholder="비밀번호를 입력하세요" />
      </Field>
    ),
    InputTags: (
      <Field
        label="태그"
        htmlFor="form-tags"
        hint="입력 후 Enter를 누르면 추가돼요."
      >
        <InputTags
          id="form-tags"
          name="tags"
          value={tags}
          onValueChange={setTags}
          placeholder="태그 추가"
          aria-describedby="form-tags-description"
        />
      </Field>
    ),
  };
  const ext = 'extended-inputs';
  return (
    <CategoryCards
      code="INPUT"
      order={inputNames}
      demos={demos}
      notes={{
        InputPassword: (
          <PairNote name="PasswordInput" category={ext} kind="aliased" />
        ),
        InputNumber: (
          <PairNote name="NumberInput" category={ext} kind="aliased" />
        ),
        InputMask: <PairNote name="MaskInput" category={ext} kind="aliased" />,
        InputOtp: <PairNote name="OTPInput" category={ext} kind="aliased" />,
        InputColor: (
          <PairNote name="ColorInput" category={ext} kind="aliased" />
        ),
        AutoComplete: (
          <PairNote name="Autocomplete" category={ext} kind="aliased" />
        ),
        DatePicker: <PairNote name="DateInput" category={ext} kind="aliased" />,
        Field: <PairNote name="FormField" category={ext} kind="aliased" />,
        IconField: (
          <PairNote name="SearchInput" category={ext} kind="extended" />
        ),
      }}
    />
  );
}
