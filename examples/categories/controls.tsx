import { useState, type ReactNode } from 'react';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Chip,
  IconButton,
  Knob,
  Radio,
  Rating,
  SegmentedControl,
  Separator,
  Slider,
  Stack,
  Switch,
  Text,
  ToggleButton,
  useToast,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';
import { CategoryCards } from './shell';

export const controlNames = [
  'Button',
  'IconButton',
  'Chip',
  'ToggleButton',
  'Checkbox',
  'CheckboxGroup',
  'Radio',
  'Switch',
  'SegmentedControl',
  'Rating',
  'Slider',
  'Knob',
] as const;

const interestOptions = [
  { label: '디자인', value: 'design' },
  { label: '개발', value: 'dev' },
  { label: '운영', value: 'ops', disabled: true },
];

export function ControlsCategory() {
  const toast = useToast();
  const [chip, setChip] = useState('전체');
  const [favorite, setFavorite] = useState(false);
  const [segment, setSegment] = useState('all');
  const [notify, setNotify] = useState(true);
  const [interests, setInterests] = useState(['design']);
  const [rating, setRating] = useState(3);
  const [volume, setVolume] = useState(65);
  const [budget, setBudget] = useState(40);

  const demos: Record<(typeof controlNames)[number], ReactNode> = {
    Button: (
      <Stack gap={4}>
        <Text size="sm" tone="muted">
          주요 액션은 선명하게, 보조 액션은 부드럽게
        </Text>
        <Stack direction="row" gap={3} wrap>
          <Button>확인했어요</Button>
          <Button variant="weak">자세히 보기</Button>
          <Button variant="secondary">나중에</Button>
        </Stack>
        <Stack direction="row" gap={3} align="center" wrap>
          <Button size="xs">xs · 24</Button>
          <Button size="sm">sm · 28</Button>
          <Button size="md">md · 34</Button>
          <Button size="lg">lg · 40</Button>
          <Button size="xl">xl · 56</Button>
        </Stack>
        <Stack direction="row" gap={3} wrap>
          <Button loading>처리 중</Button>
          <Button disabled>선택해 주세요</Button>
          <Button variant="danger" size="sm">
            삭제
          </Button>
          <Button variant="ghost" size="sm">
            닫기
          </Button>
        </Stack>
      </Stack>
    ),
    IconButton: (
      <Stack gap={3}>
        <Text size="sm" tone="muted">
          아이콘만으로도 역할이 분명하게 전해져요.
        </Text>
        <Stack direction="row" gap={3} align="center" wrap>
          <IconButton
            label="관심 등록"
            aria-pressed={favorite}
            variant={favorite ? 'filled' : 'ghost'}
            round
            onClick={() => setFavorite((value) => !value)}
          >
            <ExampleIcon name="heart" />
          </IconButton>
          <IconButton
            label="설정 안내"
            variant="filled"
            onClick={() => toast({ title: '설정 버튼을 눌렀어요' })}
          >
            <ExampleIcon name="settings" />
          </IconButton>
          <IconButton label="알림 사용 불가" disabled size="sm">
            <ExampleIcon name="bell" />
          </IconButton>
        </Stack>
      </Stack>
    ),
    Chip: (
      <Stack gap={3}>
        <Stack
          direction="row"
          gap={2}
          wrap
          role="group"
          aria-label="카탈로그 시장 필터"
        >
          {['전체', '국내', '해외'].map((label) => (
            <Chip
              key={label}
              selected={chip === label}
              onClick={() => setChip(label)}
            >
              {label}
            </Chip>
          ))}
          <Chip variant="outline" size="sm" disabled>
            준비 중
          </Chip>
        </Stack>
        <Text size="sm" tone="muted">
          {chip} 종목을 선택했어요
        </Text>
      </Stack>
    ),
    ToggleButton: (
      <Stack direction="row" gap={2} wrap>
        <ToggleButton>관심 항목</ToggleButton>
        <ToggleButton defaultPressed>알림 받는 중</ToggleButton>
      </Stack>
    ),
    Checkbox: (
      <Stack gap={3}>
        <Checkbox defaultChecked>필수 약관에 동의해요</Checkbox>
        <Checkbox shape="square" defaultChecked>
          이메일로 정산 내역 받기
        </Checkbox>
        <Checkbox shape="square">문자로 알림 받기</Checkbox>
        <Checkbox disabled>선택할 수 없는 항목</Checkbox>
      </Stack>
    ),
    CheckboxGroup: (
      <Stack gap={3}>
        <CheckboxGroup
          label="관심 분야"
          name="interests"
          options={interestOptions}
          value={interests}
          onValueChange={setInterests}
        />
        <Text size="sm" tone="muted">
          {interests.length}개를 선택했어요
        </Text>
      </Stack>
    ),
    Radio: (
      <Stack gap={3}>
        <fieldset className="catalog-radio-group">
          <legend>정산 주기</legend>
          <Radio name="catalog-cycle" value="daily" defaultChecked>
            매일 정산
          </Radio>
          <Radio name="catalog-cycle" value="weekly">
            매주 정산
          </Radio>
          <Radio name="catalog-cycle" value="monthly" disabled>
            매월 정산 · 준비 중
          </Radio>
        </fieldset>
        <Separator />
        <Stack gap={3}>
          <Radio name="plan" value="basic" defaultChecked>
            베이직
          </Radio>
          <Radio name="plan" value="pro">
            프로
          </Radio>
        </Stack>
      </Stack>
    ),
    Switch: (
      <Stack gap={3}>
        <Switch
          label="알림 받기"
          checked={notify}
          onChange={(event) => setNotify(event.target.checked)}
        />
        <Text size="sm" tone="muted">
          {notify ? '새 소식을 알려드릴게요' : '알림을 껐어요'}
        </Text>
        <Switch label="새 소식 알림" defaultChecked />
        <Switch label="사용할 수 없는 설정" disabled />
      </Stack>
    ),
    SegmentedControl: (
      <Stack gap={3}>
        <SegmentedControl
          label="조회할 내역"
          name="catalog-filter"
          options={[
            { label: '전체', value: 'all' },
            { label: '입금', value: 'income' },
            { label: '출금', value: 'expense' },
          ]}
          value={segment}
          onValueChange={setSegment}
        />
        <Text size="sm" tone="muted">
          {segment === 'all'
            ? '전체 내역을 보고 있어요'
            : segment === 'income'
              ? '입금 내역만 보고 있어요'
              : '출금 내역만 보고 있어요'}
        </Text>
        <SegmentedControl
          label="보기 방식"
          name="view"
          defaultValue="list"
          options={[
            { label: '목록', value: 'list' },
            { label: '카드', value: 'card' },
          ]}
        />
      </Stack>
    ),
    Rating: (
      <Stack gap={3}>
        <Rating
          label="만족도"
          name="rating"
          value={rating}
          onValueChange={setRating}
        />
        <Text size="sm" tone="muted">
          {rating}점을 선택했어요
        </Text>
      </Stack>
    ),
    Slider: (
      <Stack gap={3}>
        <Slider
          id="controls-slider"
          aria-label={`목표 달성률 ${budget}%`}
          value={budget}
          onChange={(event) => setBudget(Number(event.currentTarget.value))}
        />
        <Text size="sm" tone="muted">
          목표 달성률 {budget}%
        </Text>
      </Stack>
    ),
    Knob: (
      <Knob
        label="음량"
        value={volume}
        onChange={(event) => setVolume(Number(event.currentTarget.value))}
      />
    ),
  };
  return <CategoryCards code="CONTROL" order={controlNames} demos={demos} />;
}
