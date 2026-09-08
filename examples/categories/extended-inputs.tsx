import { useState, type ReactNode } from 'react';
import {
  Autocomplete,
  Button,
  ButtonGroup,
  ColorInput,
  Combobox,
  CopyButton,
  CurrencyInput,
  DateInput,
  DateRangePicker,
  DateTimePicker,
  FileInput,
  FloatingActionButton,
  FormDescription,
  FormError,
  FormField,
  FormLabel,
  Input,
  LinkButton,
  MaskInput,
  MultiSelect,
  NumberInput,
  OTPInput,
  PasswordInput,
  PercentInput,
  RadioGroup,
  RangeSlider,
  SearchInput,
  SpeedDial,
  SplitButton,
  Stack,
  Text,
  TimePicker,
  TreeSelect,
  useToast,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';
import { CategoryCards } from './shell';

export const extendedInputNames = [
  'ButtonGroup',
  'SplitButton',
  'FloatingActionButton',
  'SpeedDial',
  'CopyButton',
  'LinkButton',
  'PasswordInput',
  'NumberInput',
  'CurrencyInput',
  'PercentInput',
  'MaskInput',
  'OTPInput',
  'SearchInput',
  'ColorInput',
  'FileInput',
  'DateInput',
  'DateRangePicker',
  'TimePicker',
  'DateTimePicker',
  'RangeSlider',
  'FormField',
  'FormLabel',
  'FormDescription',
  'FormError',
  'RadioGroup',
  'MultiSelect',
  'Autocomplete',
  'Combobox',
  'TreeSelect',
] as const;

const teams = [
  { label: '디자인', value: 'design' },
  { label: '개발', value: 'development' },
  { label: '운영', value: 'operations', disabled: true },
];

export function ExtendedInputsCategory() {
  const toast = useToast();
  const [phone, setPhone] = useState('010');
  const [range, setRange] = useState<[number, number]>([20, 70]);
  const [plan, setPlan] = useState('basic');
  const [dates, setDates] = useState({
    start: '2026-09-09',
    end: '2026-09-12',
  });

  const demos: Record<(typeof extendedInputNames)[number], ReactNode> = {
    ButtonGroup: (
      <ButtonGroup aria-label="편집 작업">
        <Button onClick={() => toast({ title: '저장했어요' })}>저장</Button>
        <Button
          variant="secondary"
          onClick={() => toast({ title: '미리보기를 열었어요' })}
        >
          미리보기
        </Button>
      </ButtonGroup>
    ),
    SplitButton: (
      <SplitButton
        onAction={() => toast({ title: '바로 저장했어요' })}
        items={[
          {
            label: '임시 저장',
            onSelect: () => toast({ title: '임시 저장했어요' }),
          },
          {
            label: '사본 저장',
            onSelect: () => toast({ title: '사본을 저장했어요' }),
          },
        ]}
      >
        저장
      </SplitButton>
    ),
    FloatingActionButton: (
      <FloatingActionButton
        label="새 항목 추가"
        onClick={() => toast({ title: '새 항목을 추가했어요' })}
      >
        +
      </FloatingActionButton>
    ),
    SpeedDial: (
      <SpeedDial
        label="빠른 작업 열기"
        actions={[
          {
            label: '일정 만들기',
            icon: <ExampleIcon name="calendar" />,
            onSelect: () => toast({ title: '일정을 만들어요' }),
          },
          {
            label: '알림 보내기',
            icon: <ExampleIcon name="bell" />,
            onSelect: () => toast({ title: '알림을 보내요' }),
          },
        ]}
      />
    ),
    CopyButton: (
      <CopyButton
        value="MEGA-2026"
        onCopied={() => toast({ title: '코드를 복사했어요' })}
      >
        초대 코드 복사
      </CopyButton>
    ),
    LinkButton: <LinkButton href="#TreeSelect">트리 선택으로 이동</LinkButton>,
    PasswordInput: (
      <PasswordInput aria-label="비밀번호" placeholder="비밀번호" />
    ),
    NumberInput: (
      <NumberInput aria-label="수량" min={1} max={20} defaultValue={2} />
    ),
    CurrencyInput: (
      <CurrencyInput
        aria-label="결제 금액"
        min={0}
        step={1000}
        defaultValue={25000}
      />
    ),
    PercentInput: (
      <PercentInput aria-label="할인율" min={0} max={100} defaultValue={15} />
    ),
    MaskInput: (
      <MaskInput
        aria-label="휴대폰 번호"
        mask="###-####-####"
        value={phone}
        onValueChange={setPhone}
        placeholder="010-1234-5678"
      />
    ),
    OTPInput: (
      <OTPInput aria-label="인증번호" length={6} placeholder="000000" />
    ),
    SearchInput: (
      <SearchInput
        aria-label="컴포넌트 검색"
        placeholder="검색어를 입력하세요"
      />
    ),
    ColorInput: <ColorInput aria-label="강조 색상" defaultValue="#3182f6" />,
    FileInput: <FileInput aria-label="계약서 첨부" accept=".pdf,image/*" />,
    DateInput: <DateInput aria-label="예약일" defaultValue="2026-09-09" />,
    DateRangePicker: (
      <Stack gap={2}>
        <DateRangePicker
          label="여행 기간"
          startName="tripStart"
          endName="tripEnd"
          startProps={{ value: dates.start, max: dates.end }}
          endProps={{ value: dates.end, min: dates.start }}
          onValueChange={setDates}
        />
        <Text size="sm" tone="muted">
          {dates.start} ~ {dates.end}
        </Text>
      </Stack>
    ),
    TimePicker: <TimePicker aria-label="시작 시간" defaultValue="09:30" />,
    DateTimePicker: (
      <DateTimePicker aria-label="회의 일시" defaultValue="2026-09-09T14:00" />
    ),
    RangeSlider: (
      <Stack gap={2}>
        <RangeSlider
          label="가격 범위"
          name="price"
          value={range}
          onValueChange={setRange}
        />
        <Text size="sm" tone="muted">
          {range[0]} ~ {range[1]}
        </Text>
      </Stack>
    ),
    FormField: (
      <FormField
        label="이메일"
        htmlFor="extended-email"
        hint="업무용 이메일을 입력해 주세요"
      >
        <Input
          id="extended-email"
          type="email"
          aria-describedby="extended-email-description"
        />
      </FormField>
    ),
    FormLabel: (
      <Stack gap={2}>
        <FormLabel htmlFor="extended-name">이름</FormLabel>
        <Input id="extended-name" />
      </Stack>
    ),
    FormDescription: (
      <FormDescription id="extended-description">
        입력값은 언제든 바꿀 수 있어요.
      </FormDescription>
    ),
    FormError: (
      <FormError id="extended-error">필수 항목을 확인해 주세요.</FormError>
    ),
    RadioGroup: (
      <RadioGroup
        label="요금제"
        name="plan"
        value={plan}
        onValueChange={setPlan}
        options={[
          { label: '베이직', value: 'basic' },
          { label: '프로', value: 'pro' },
        ]}
      />
    ),
    MultiSelect: (
      <MultiSelect
        aria-label="참여 팀"
        defaultValue={['design', 'development']}
        size={3}
      >
        {teams.map((team) => (
          <option key={team.value} value={team.value} disabled={team.disabled}>
            {team.label}
          </option>
        ))}
      </MultiSelect>
    ),
    Autocomplete: (
      <Autocomplete
        aria-label="도시 자동완성"
        suggestions={['서울', '부산', '대전', '제주']}
        placeholder="도시 검색"
      />
    ),
    Combobox: (
      <Combobox
        aria-label="담당자 검색"
        suggestions={['김민준', '이서연', '박지훈']}
        placeholder="이름 검색"
      />
    ),
    TreeSelect: (
      <TreeSelect
        aria-label="소속 팀"
        defaultValue="frontend"
        groups={[
          {
            label: '제품',
            options: [
              { label: '디자인', value: 'design' },
              {
                label: '엔지니어링',
                options: [
                  { label: '프론트엔드', value: 'frontend' },
                  { label: '백엔드', value: 'backend' },
                ],
              },
            ],
          },
          {
            label: '비즈니스',
            options: [
              { label: '운영', value: 'operations' },
              { label: '재무', value: 'finance' },
            ],
          },
        ]}
      />
    ),
  };

  return (
    <CategoryCards
      code="EXTENDED INPUT"
      order={extendedInputNames}
      demos={demos}
    />
  );
}
