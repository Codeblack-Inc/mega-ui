import { useEffect, useState } from 'react';
import {
  Accordion,
  Alert,
  AlertDialog,
  Avatar,
  Badge,
  BottomCTA,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  EmptyState,
  Field,
  FormDescription,
  FormError,
  Grid,
  Heading,
  IconButton,
  Input,
  InputMask,
  InputOtp,
  InputPassword,
  ListRow,
  Menu,
  MenuItem,
  MenuSeparator,
  Notification,
  PageHeader,
  ProgressBar,
  QRCode,
  RadioGroup,
  Result,
  Separator,
  Stack,
  Stat,
  Stepper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  Text,
  Timeline,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';

// ---------- 로그인 ----------

/** Brand marks for social login; the stroke icon set has no filled logos. */
function SocialMark({ name }: { name: 'kakao' | 'google' | 'apple' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {name === 'kakao' ? (
        <path
          fill="currentColor"
          d="M12 3C6.5 3 2 6.4 2 10.6c0 2.7 1.8 5 4.5 6.4l-1 3.6c-.1.3.2.5.5.3l4.2-2.8c.6.1 1.2.1 1.8.1 5.5 0 10-3.4 10-7.6S17.5 3 12 3"
        />
      ) : name === 'apple' ? (
        <path
          fill="currentColor"
          d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.8M14.1 5.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3"
        />
      ) : (
        <>
          <path
            fill="#4285F4"
            d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.8 19.8 8.1 22 12 22"
          />
          <path
            fill="#FBBC05"
            d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.5H3.1C2.4 8.9 2 10.4 2 12s.4 3.1 1.1 4.5z"
          />
          <path
            fill="#EA4335"
            d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3.1 14.7 2 12 2 8.1 2 4.8 4.2 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6"
          />
        </>
      )}
    </svg>
  );
}

export function LoginExample() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => setStatus('done'), 1000);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <div className="login">
      <Card padding="lg">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (password.length < 8) {
              setError('비밀번호는 8자 이상이어야 해요.');
              return;
            }
            setError('');
            setStatus('loading');
          }}
        >
          <Stack gap={5}>
            <Stack gap={3} align="start">
              <span className="login__mark" aria-hidden="true">
                m
              </span>
              <Heading size="lg">다시 만나서 반가워요</Heading>
              <Text tone="muted">메가 계정으로 로그인해요</Text>
            </Stack>
            <Field label="이메일" htmlFor="login-email" required>
              <Input
                variant="box"
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
              />
            </Field>
            <Field label="비밀번호" htmlFor="login-password" required>
              <InputPassword
                variant="box"
                id="login-password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(error)}
                required
              />
            </Field>
            {error ? <FormError>{error}</FormError> : null}
            <Checkbox name="remember" defaultChecked>
              로그인 상태 유지
            </Checkbox>
            <Button
              type="submit"
              size="xl"
              fullWidth
              loading={status === 'loading'}
            >
              로그인
            </Button>
            {status === 'done' ? (
              <Alert tone="success">
                로그인을 체험했어요. 실제 계정에 접속하지 않아요.
              </Alert>
            ) : null}
            <div className="login__divider">
              <Separator />
              <Text size="sm" tone="muted" as="span">
                또는
              </Text>
              <Separator />
            </div>
            <ButtonGroup className="login__social" aria-label="간편 로그인">
              <Button
                variant="secondary"
                fullWidth
                data-brand="kakao"
                leading={<SocialMark name="kakao" />}
              >
                카카오
              </Button>
              <Button
                variant="secondary"
                fullWidth
                data-brand="google"
                leading={<SocialMark name="google" />}
              >
                구글
              </Button>
              <Button
                variant="secondary"
                fullWidth
                data-brand="apple"
                leading={<SocialMark name="apple" />}
              >
                애플
              </Button>
            </ButtonGroup>
            <Stack direction="row" gap={2} justify="center" align="center">
              <Button variant="text" size="sm">
                비밀번호 찾기
              </Button>
              <Separator variant="vertical" />
              <Button variant="text" size="sm">
                회원가입
              </Button>
            </Stack>
          </Stack>
        </form>
      </Card>
    </div>
  );
}

// ---------- 회원가입·본인인증 ----------

const terms = [
  { id: 'service', label: '서비스 이용약관', required: true },
  { id: 'privacy', label: '개인정보 수집·이용 동의', required: true },
  { id: 'age', label: '만 14세 이상이에요', required: true },
  { id: 'marketing', label: '혜택·이벤트 알림 받기', required: false },
];

/** Counts down while active; bump `round` to restart. */
function useCountdown(active: boolean, seconds: number, round: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!active) return;
    setLeft(seconds);
    const timer = setInterval(
      () => setLeft((value) => (value > 0 ? value - 1 : 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, [active, seconds, round]);
  return left;
}

export function SignupExample() {
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [carrier, setCarrier] = useState('skt');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resend, setResend] = useState(0);
  const left = useCountdown(step === 2, 180, resend);
  const requiredDone = terms
    .filter((term) => term.required)
    .every((term) => agreed.includes(term.id));
  const infoDone =
    name.length > 0 && birth.length === 10 && phone.length === 13;
  const canNext = [requiredDone, infoDone, otp.length === 6][step] ?? false;
  const clock = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(
    left % 60,
  ).padStart(2, '0')}`;

  return (
    <div className="signup">
      <Card padding="lg">
        <Stack gap={5}>
          <Stepper
            current={step}
            items={[
              { label: '약관' },
              { label: '정보 입력' },
              { label: '휴대폰 인증' },
              { label: '완료' },
            ]}
          />
          {step === 0 ? (
            <Stack gap={4}>
              <Heading size="lg">약관에 동의해 주세요</Heading>
              <Checkbox
                checked={agreed.length === terms.length}
                onChange={(event) =>
                  setAgreed(event.target.checked ? terms.map((t) => t.id) : [])
                }
              >
                전체 동의
              </Checkbox>
              <Separator />
              {terms.map((term) => (
                <Checkbox
                  key={term.id}
                  name={term.id}
                  checked={agreed.includes(term.id)}
                  onChange={(event) =>
                    setAgreed((ids) =>
                      event.target.checked
                        ? [...ids, term.id]
                        : ids.filter((id) => id !== term.id),
                    )
                  }
                >
                  {term.required ? '[필수] ' : '[선택] '}
                  {term.label}
                </Checkbox>
              ))}
              <Accordion
                items={[
                  {
                    id: 'service',
                    title: '서비스 이용약관 본문',
                    content:
                      '이 약관은 UI 예제를 위한 문장이에요. 실제 서비스 약관은 각 회사의 법무 검토를 거쳐 작성해요.',
                  },
                  {
                    id: 'privacy',
                    title: '개인정보 수집·이용 안내',
                    content:
                      '입력한 정보는 브라우저 밖으로 전송되지 않아요. 예제를 닫으면 모두 사라져요.',
                  },
                ]}
              />
            </Stack>
          ) : null}
          {step === 1 ? (
            <Stack gap={4}>
              <Heading size="lg">본인 정보를 입력해 주세요</Heading>
              <Field label="이름" htmlFor="signup-name" required>
                <Input
                  variant="box"
                  id="signup-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </Field>
              <Field label="생년월일" htmlFor="signup-birth" required>
                <InputMask
                  variant="box"
                  id="signup-birth"
                  mask="####.##.##"
                  placeholder="1990.01.01"
                  value={birth}
                  onValueChange={setBirth}
                />
              </Field>
              <RadioGroup
                label="통신사"
                name="carrier"
                value={carrier}
                onValueChange={setCarrier}
                options={[
                  { label: 'SKT', value: 'skt' },
                  { label: 'KT', value: 'kt' },
                  { label: 'LG U+', value: 'lgu' },
                  { label: '알뜰폰', value: 'mvno' },
                ]}
              />
              <Field label="휴대폰 번호" htmlFor="signup-phone" required>
                <InputMask
                  variant="box"
                  id="signup-phone"
                  mask="###-####-####"
                  placeholder="010-1234-5678"
                  autoComplete="tel"
                  value={phone}
                  onValueChange={setPhone}
                />
              </Field>
            </Stack>
          ) : null}
          {step === 2 ? (
            <Stack gap={4}>
              <Heading size="lg">인증번호를 입력해 주세요</Heading>
              <Text tone="muted">
                {phone}로 보낸 6자리 숫자를 입력하면 돼요. 예제에서는 아무
                숫자나 괜찮아요.
              </Text>
              <Field label="인증번호" htmlFor="signup-otp" required>
                <InputOtp
                  variant="box"
                  id="signup-otp"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                />
              </Field>
              <Stack direction="row" justify="between" align="center">
                <Text size="sm" tone={left === 0 ? 'danger' : 'brand'} numeric>
                  {left === 0 ? '시간이 지났어요' : `남은 시간 ${clock}`}
                </Text>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => {
                    setOtp('');
                    setResend((count) => count + 1);
                  }}
                >
                  재전송
                </Button>
              </Stack>
            </Stack>
          ) : null}
          {step === 3 ? (
            <Result
              title={`${name}님, 가입을 마쳤어요`}
              description="이제 메가의 모든 서비스를 이용할 수 있어요."
              actions={
                <Button
                  fullWidth
                  variant="weak"
                  onClick={() => {
                    setStep(0);
                    setAgreed([]);
                    setOtp('');
                  }}
                >
                  처음부터 다시 보기
                </Button>
              }
            />
          ) : null}
          {step < 3 ? (
            <BottomCTA>
              {step > 0 ? (
                <Button
                  size="xl"
                  variant="secondary"
                  onClick={() => setStep(step - 1)}
                >
                  이전
                </Button>
              ) : null}
              <Button
                size="xl"
                disabled={!canNext || (step === 2 && left === 0)}
                onClick={() => setStep(step + 1)}
              >
                {step === 2 ? '인증하기' : '다음'}
              </Button>
            </BottomCTA>
          ) : null}
        </Stack>
      </Card>
    </div>
  );
}

// ---------- 마이페이지 ----------

export function ProfileExample() {
  const [logout, setLogout] = useState(false);
  const orders = [
    { title: '메가 데일리 티셔츠', date: '9월 8일', status: '배송 중' },
    { title: '시그니처 머그컵', date: '9월 5일', status: '배송 완료' },
    { title: '위클리 노트 세트', date: '8월 29일', status: '구매 확정' },
  ];
  const account = ['개인정보 관리', '알림 설정', '결제 수단', '로그아웃'];
  return (
    <Stack gap={5} className="profile">
      <Card padding="lg">
        <div className="profile__hero">
          <Avatar name="김메가" size="lg" />
          <div className="profile__who">
            <Stack direction="row" gap={2} align="center">
              <Heading size="lg">김메가</Heading>
              <Badge tone="purple">VIP</Badge>
            </Stack>
            <Text size="sm" tone="muted">
              mega@example.com · 2023년부터 함께했어요
            </Text>
          </div>
          <Stack direction="row" gap={1}>
            <IconButton label="프로필 편집">
              <ExampleIcon name="edit" />
            </IconButton>
            <Menu
              align="end"
              trigger={
                <IconButton label="더 보기">
                  <ExampleIcon name="more" />
                </IconButton>
              }
            >
              <MenuItem icon={<ExampleIcon name="gift" />}>친구 초대</MenuItem>
              <MenuItem icon={<ExampleIcon name="help" />}>고객센터</MenuItem>
              <MenuSeparator />
              <MenuItem tone="danger" onSelect={() => setLogout(true)}>
                로그아웃
              </MenuItem>
            </Menu>
          </Stack>
        </div>
        <Separator />
        <div className="profile__stats">
          <Stat label="포인트" value="12,400" unit="P" size="sm" />
          <Stat label="쿠폰" value="3" unit="장" size="sm" />
          <Stat label="찜" value="18" unit="개" size="sm" />
        </div>
      </Card>
      <Grid minItemWidth={280} gap={4}>
        <Card>
          <Heading size="sm">최근 주문</Heading>
          {orders.map((order) => (
            <ListRow
              key={order.title}
              leading={
                <span className="example-icon" data-tone="blue">
                  <ExampleIcon name="box" />
                </span>
              }
              title={order.title}
              description={order.date}
              trailing={
                <Badge tone={order.status === '배송 중' ? 'brand' : 'neutral'}>
                  {order.status}
                </Badge>
              }
            />
          ))}
        </Card>
        <Card>
          <Heading size="sm">내 혜택</Heading>
          <ListRow
            leading={
              <span className="example-icon" data-tone="yellow">
                <ExampleIcon name="gift" />
              </span>
            }
            title="9월 생일 쿠폰"
            description="9월 30일까지 · 10% 할인"
            trailing={<Text tone="brand">사용하기</Text>}
          />
          <ListRow
            leading={
              <span className="example-icon" data-tone="purple">
                <ExampleIcon name="star" />
              </span>
            }
            title="VIP 무료 배송"
            description="모든 주문에 적용돼요"
          />
          <ListRow
            leading={
              <span className="example-icon">
                <ExampleIcon name="sparkle" />
              </span>
            }
            title="친구 초대하면 5,000P"
            description="초대한 친구도 함께 받아요"
          />
        </Card>
        <Card>
          <Heading size="sm">계정</Heading>
          {account.map((label) => (
            <ListRow
              key={label}
              title={label}
              trailing={
                <Button
                  variant="ghost"
                  size="xs"
                  aria-label={`${label} 열기`}
                  onClick={() => label === '로그아웃' && setLogout(true)}
                >
                  ›
                </Button>
              }
            />
          ))}
        </Card>
      </Grid>
      <AlertDialog
        open={logout}
        onClose={() => setLogout(false)}
        title="로그아웃할까요?"
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setLogout(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={() => setLogout(false)}>
              로그아웃
            </Button>
          </>
        }
      >
        다시 로그인하려면 이메일과 비밀번호가 필요해요.
      </AlertDialog>
    </Stack>
  );
}

// ---------- 알림센터 ----------

type Kind = 'transaction' | 'benefit' | 'notice';
const initialNotices: {
  id: number;
  kind: Kind;
  group: '오늘' | '어제' | '이전';
  title: string;
  description: string;
  read: boolean;
}[] = [
  {
    id: 1,
    kind: 'transaction',
    group: '오늘',
    title: '30,000원이 입금됐어요',
    description: '박메가님 · 생활비 통장',
    read: false,
  },
  {
    id: 2,
    kind: 'benefit',
    group: '오늘',
    title: '커피 한 잔 값 캐시백이 도착했어요',
    description: '동네 카페 결제 · 500원',
    read: false,
  },
  {
    id: 3,
    kind: 'transaction',
    group: '어제',
    title: '4,500원을 결제했어요',
    description: '동네 카페 · 메가카드',
    read: false,
  },
  {
    id: 4,
    kind: 'notice',
    group: '어제',
    title: '추석 연휴 고객센터 운영 안내',
    description: '10월 3일부터 6일까지 채팅 상담만 운영해요',
    read: true,
  },
  {
    id: 5,
    kind: 'benefit',
    group: '이전',
    title: '9월 생일 쿠폰이 발급됐어요',
    description: '마이페이지 > 내 혜택에서 확인해요',
    read: true,
  },
];

export function NotificationCenterExample() {
  const [items, setItems] = useState(initialNotices);
  const [tab, setTab] = useState('all');
  const visible = items.filter((item) => tab === 'all' || item.kind === tab);
  const unread = (kind?: Kind) =>
    items.filter((item) => !item.read && (!kind || item.kind === kind)).length;
  const markRead = (id: number) =>
    setItems((list) =>
      list.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  const groups = ['오늘', '어제', '이전'] as const;
  return (
    <Stack gap={5} className="notif">
      <PageHeader
        title="알림"
        headingLevel={2}
        description={
          unread() ? `읽지 않은 알림이 ${unread()}개 있어요` : '모두 확인했어요'
        }
        actions={
          <Button
            variant="weak"
            size="sm"
            disabled={!unread()}
            onClick={() =>
              setItems((list) => list.map((item) => ({ ...item, read: true })))
            }
          >
            모두 읽음
          </Button>
        }
      />
      <Tabs
        label="알림 분류"
        variant="pill"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'all', label: '전체', badge: unread() || undefined },
          {
            value: 'transaction',
            label: '거래',
            badge: unread('transaction') || undefined,
          },
          {
            value: 'benefit',
            label: '혜택',
            badge: unread('benefit') || undefined,
          },
          {
            value: 'notice',
            label: '공지',
            badge: unread('notice') || undefined,
          },
        ]}
      />
      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ExampleIcon name="bell" />}
            title="알림이 없어요"
            description="새로운 소식이 오면 여기에 모아둘게요."
          />
        </Card>
      ) : (
        groups
          .filter((group) => visible.some((item) => item.group === group))
          .map((group) => (
            <Stack key={group} gap={2}>
              <Text size="sm" tone="muted" weight="semibold">
                {group}
              </Text>
              {visible
                .filter((item) => item.group === group)
                .map((item) => (
                  <Notification
                    key={item.id}
                    className={
                      item.read ? 'notif__item' : 'notif__item is-unread'
                    }
                    tone={
                      item.kind === 'benefit'
                        ? 'success'
                        : item.kind === 'notice'
                          ? 'neutral'
                          : 'info'
                    }
                    title={item.title}
                    description={item.description}
                    action={
                      item.read ? (
                        <span
                          className="notif__read"
                          role="img"
                          aria-label="읽음"
                        >
                          <ExampleIcon name="check" />
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="text"
                          onClick={() => markRead(item.id)}
                        >
                          확인
                        </Button>
                      )
                    }
                  />
                ))}
            </Stack>
          ))
      )}
      <Card>
        <Stack gap={3}>
          <Heading size="sm">알림 수신 설정</Heading>
          <Switch label="거래 알림" name="notify-transaction" defaultChecked />
          <Switch label="혜택·이벤트 알림" name="notify-benefit" />
          <Switch label="공지 알림" name="notify-notice" defaultChecked />
        </Stack>
      </Card>
    </Stack>
  );
}

// ---------- 보안·기기 관리 ----------

const initialDevices = [
  {
    id: 1,
    device: 'MacBook Pro · Chrome',
    place: '서울',
    at: '지금',
    current: true,
  },
  {
    id: 2,
    device: 'iPhone 15 · 메가 앱',
    place: '서울',
    at: '2시간 전',
    current: false,
  },
  {
    id: 3,
    device: 'Windows · Edge',
    place: '부산',
    at: '3일 전',
    current: false,
  },
];

function strength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  return score;
}

export function SecurityExample() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [devices, setDevices] = useState(initialDevices);
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [changed, setChanged] = useState(false);
  const score = strength(next);
  return (
    <Grid minItemWidth={320} gap={5} className="security">
      <Stack gap={5}>
        <Card padding="lg">
          <Stack gap={4}>
            <Stack gap={1}>
              <Heading size="sm">2단계 인증</Heading>
              <Text size="sm" tone={twoFactor ? 'success' : 'muted'}>
                {twoFactor
                  ? '인증 앱으로 계정을 보호하고 있어요'
                  : '아직 사용하지 않고 있어요'}
              </Text>
            </Stack>
            <Switch
              label="인증 앱으로 한 번 더 확인하기"
              name="two-factor"
              checked={twoFactor}
              onChange={(event) => setTwoFactor(event.target.checked)}
            />
            {twoFactor ? (
              <Stack gap={3} align="center" className="security__qr">
                <QRCode
                  value="otpauth://totp/MegaUI:demo?secret=DEMO"
                  label="인증 앱 등록용 QR 코드"
                  size={140}
                />
                <Text size="sm" tone="muted">
                  인증 앱으로 QR 코드를 스캔하면 등록이 끝나요.
                </Text>
              </Stack>
            ) : null}
          </Stack>
        </Card>
        <Card padding="lg">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setChanged(true);
            }}
            onChange={() => setChanged(false)}
          >
            <Stack gap={4}>
              <Heading size="sm">비밀번호 변경</Heading>
              <Field label="새 비밀번호" htmlFor="security-next" required>
                <InputPassword
                  id="security-next"
                  autoComplete="new-password"
                  value={next}
                  onChange={(event) => setNext(event.target.value)}
                  required
                />
              </Field>
              <ProgressBar label="비밀번호 안전도" value={score} />
              <FormDescription>
                8자 이상, 대문자·숫자·특수문자를 섞으면 더 안전해요.
              </FormDescription>
              <Field
                label="새 비밀번호 확인"
                htmlFor="security-confirm"
                required
                error={
                  confirm && confirm !== next
                    ? '비밀번호가 서로 달라요.'
                    : undefined
                }
              >
                <InputPassword
                  id="security-confirm"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                />
              </Field>
              <Button
                type="submit"
                fullWidth
                disabled={score < 50 || confirm !== next}
              >
                변경하기
              </Button>
              {changed ? (
                <Alert tone="success">
                  비밀번호 변경을 체험했어요. 실제로 바뀌지 않아요.
                </Alert>
              ) : null}
            </Stack>
          </form>
        </Card>
      </Stack>
      <Stack gap={5}>
        <Card padding="lg">
          <Stack gap={4}>
            <Heading size="sm">로그인된 기기</Heading>
            <Table density="compact" aria-label="로그인된 기기 목록">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>기기</TableHeaderCell>
                  <TableHeaderCell>위치</TableHeaderCell>
                  <TableHeaderCell>마지막 접속</TableHeaderCell>
                  <TableHeaderCell>
                    <span className="mega-visually-hidden">관리</span>
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Stack direction="row" gap={2} align="center">
                        {row.device}
                        {row.current ? <Badge tone="brand">현재</Badge> : null}
                      </Stack>
                    </TableCell>
                    <TableCell tone="muted">{row.place}</TableCell>
                    <TableCell tone="muted">{row.at}</TableCell>
                    <TableCell align="end">
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={row.current}
                        onClick={() =>
                          setDevices((list) =>
                            list.filter((item) => item.id !== row.id),
                          )
                        }
                      >
                        로그아웃
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        </Card>
        <Card padding="lg">
          <Stack gap={4}>
            <Heading size="sm">최근 보안 활동</Heading>
            <Timeline
              items={[
                {
                  id: 'a',
                  title: '새 기기에서 로그인',
                  time: '오늘 09:12',
                  dateTime: '2026-09-09T09:12',
                  description: 'MacBook Pro · Chrome · 서울',
                },
                {
                  id: 'b',
                  title: '비밀번호 변경',
                  time: '8월 21일',
                  dateTime: '2026-08-21',
                },
                {
                  id: 'c',
                  title: '2단계 인증 해제',
                  time: '7월 2일',
                  dateTime: '2026-07-02',
                  description: '인증 앱 분실 신고 후 해제했어요',
                },
              ]}
            />
          </Stack>
        </Card>
      </Stack>
    </Grid>
  );
}
