import { useMemo, useState } from 'react';
import {
  Accordion,
  Alert,
  Amount,
  Avatar,
  Badge,
  Banner,
  BarChart,
  BottomCTA,
  Button,
  Card,
  Chip,
  CircularProgress,
  CurrencyInput,
  DescriptionList,
  Dialog,
  Field,
  Grid,
  Heading,
  ListRow,
  LineChart,
  PageHeader,
  ProgressBar,
  RadioGroup,
  Result,
  SearchInput,
  SegmentedControl,
  Slider,
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
  TabPanel,
  Tabs,
  Text,
  ToastProvider,
  useToast,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`;

// ---------- 송금 플로우 ----------
const contacts = [
  { name: '김하나', bank: '메가뱅크', account: '110-234-567890' },
  { name: '이서준', bank: '국민은행', account: '333-01-234567' },
  { name: '박지우', bank: '카카오뱅크', account: '3333-02-1234567' },
  { name: '최민준', bank: '신한은행', account: '110-987-654321' },
];
const BALANCE = 2_340_000;

export function TransferExample() {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [to, setTo] = useState<(typeof contacts)[number] | null>(null);
  const [amount, setAmount] = useState(0);
  const [done, setDone] = useState(false);

  const reset = () => {
    setStep(0);
    setTo(null);
    setAmount(0);
    setDone(false);
  };
  const shown = contacts.filter((c) => c.name.includes(query.trim()));
  const tooMuch = amount > BALANCE;

  if (done)
    return (
      <div className="transfer">
        <Card padding="lg">
          <Result
            title={`${to?.name}님에게 ${won(amount)}을 보냈어요`}
            description="실제 송금은 일어나지 않는 UI 예제예요."
            actions={
              <Button fullWidth variant="weak" onClick={reset}>
                다시 하기
              </Button>
            }
          />
        </Card>
      </div>
    );

  return (
    <div className="transfer">
      <Card padding="lg">
        <Stack gap={5}>
          <Stepper
            label="송금 단계"
            current={step}
            onStepChange={(next) => next < step && setStep(next)}
            items={[
              { label: '받는 사람' },
              { label: '금액', disabled: !to },
              { label: '송금 정보 확인', disabled: !to || !amount },
            ]}
          />

          {step === 0 ? (
            <Stack gap={4}>
              <Heading size="lg">누구에게 보낼까요?</Heading>
              <SearchInput
                variant="box"
                aria-label="받는 사람 검색"
                placeholder="이름, 계좌번호 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Text size="sm" tone="muted">
                최근 보낸 사람
              </Text>
              <div className="transfer-contacts">
                {shown.map((c) => (
                  <button
                    key={c.account}
                    type="button"
                    className="transfer-contact"
                    onClick={() => {
                      setTo(c);
                      setStep(1);
                    }}
                  >
                    <ListRow
                      leading={<Avatar name={c.name} />}
                      title={c.name}
                      description={`${c.bank} ${c.account}`}
                      trailing={<ExampleIcon name="arrow" />}
                    />
                  </button>
                ))}
                {shown.length === 0 ? (
                  <Text tone="muted">검색 결과가 없어요</Text>
                ) : null}
              </div>
            </Stack>
          ) : null}

          {step === 1 && to ? (
            <Stack gap={4}>
              <ListRow
                leading={<Avatar name={to.name} size="sm" />}
                title={`${to.name}님에게`}
                description={`${to.bank} ${to.account}`}
              />
              <Heading size="xl" className="transfer-amount">
                {amount ? won(amount) : '얼마를 보낼까요?'}
              </Heading>
              <Field
                label="보낼 금액"
                htmlFor="transfer-amount"
                error={tooMuch ? '잔액보다 큰 금액이에요' : undefined}
                hint={`출금 가능 ${won(BALANCE)}`}
              >
                <CurrencyInput
                  variant="box"
                  id="transfer-amount"
                  min={0}
                  step={1000}
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                />
              </Field>
              <Stack direction="row" gap={2} wrap>
                {[
                  ['+1만', 10_000],
                  ['+5만', 50_000],
                  ['+10만', 100_000],
                ].map(([label, add]) => (
                  <Chip
                    key={label}
                    variant="outline"
                    onClick={() => setAmount((v) => v + Number(add))}
                  >
                    {label}
                  </Chip>
                ))}
                <Chip variant="outline" onClick={() => setAmount(BALANCE)}>
                  전액
                </Chip>
              </Stack>
              <BottomCTA>
                <Button
                  size="xl"
                  fullWidth
                  disabled={!amount || tooMuch}
                  onClick={() => setStep(2)}
                >
                  다음
                </Button>
              </BottomCTA>
            </Stack>
          ) : null}

          {step === 2 && to ? (
            <Stack gap={4}>
              <Heading size="lg">
                {to.name}님에게
                <br />
                {won(amount)}을 보낼까요?
              </Heading>
              <DescriptionList
                items={[
                  {
                    term: '받는 계좌',
                    description: `${to.bank} ${to.account}`,
                  },
                  { term: '출금 계좌', description: '메가뱅크 생활비 통장' },
                  { term: '수수료', description: '무료' },
                  { term: '보낸 후 잔액', description: won(BALANCE - amount) },
                ]}
              />
              <BottomCTA description="실제 송금은 실행되지 않아요">
                <Button size="xl" fullWidth onClick={() => setDone(true)}>
                  보내기
                </Button>
              </BottomCTA>
            </Stack>
          ) : null}
        </Stack>
      </Card>
    </div>
  );
}

// ---------- 대출 계산기 ----------
type Repay = 'annuity' | 'principal' | 'bullet';

function schedule(
  principal: number,
  months: number,
  rate: number,
  kind: Repay,
) {
  const r = rate / 100 / 12;
  const rows: {
    month: number;
    pay: number;
    interest: number;
    balance: number;
  }[] = [];
  let balance = principal;
  const annuity =
    r === 0
      ? principal / months
      : (principal * r) / (1 - Math.pow(1 + r, -months));
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    let pay: number;
    if (kind === 'annuity') pay = annuity;
    else if (kind === 'principal') pay = principal / months + interest;
    else pay = m === months ? principal + interest : interest;
    balance -= pay - interest;
    rows.push({ month: m, pay, interest, balance: Math.max(0, balance) });
  }
  return rows;
}

export function LoanCalculatorExample() {
  const [principal, setPrincipal] = useState(30_000_000);
  const [months, setMonths] = useState(36);
  const [kind, setKind] = useState<Repay>('annuity');
  const [rateType, setRateType] = useState('fixed');
  const rate = rateType === 'fixed' ? 5.2 : 4.6;

  const rows = useMemo(
    () => schedule(principal, months, rate, kind),
    [principal, months, rate, kind],
  );
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  const total = principal + totalInterest;
  const monthly = rows[0]?.pay ?? 0;

  return (
    <Stack gap={5}>
      <PageHeader
        headingLevel={2}
        title="얼마나 갚게 될까요?"
        description="조건을 바꿔가며 월 상환금을 미리 계산해 보세요"
      />
      <Grid minItemWidth={320} gap={5} className="loan-grid">
        <Card padding="lg">
          <Stack gap={5}>
            <Stack gap={2}>
              <Stack direction="row" justify="between">
                <Text as="span" tone="muted">
                  대출 금액
                </Text>
                <Text as="span" weight="semibold">
                  {won(principal)}
                </Text>
              </Stack>
              <Slider
                aria-label="대출 금액"
                min={5_000_000}
                max={100_000_000}
                step={1_000_000}
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
              />
            </Stack>
            <Stack gap={2}>
              <Stack direction="row" justify="between">
                <Text as="span" tone="muted">
                  대출 기간
                </Text>
                <Text as="span" weight="semibold">
                  {months}개월
                </Text>
              </Stack>
              <Slider
                aria-label="대출 기간"
                min={12}
                max={60}
                step={6}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
              />
            </Stack>
            <RadioGroup
              className="loan-repay"
              label="상환 방식"
              name="loan-repay"
              value={kind}
              onValueChange={(v) => setKind(v as Repay)}
              options={[
                { label: '원리금균등 · 매달 같은 금액', value: 'annuity' },
                {
                  label: '원금균등 · 갈수록 줄어드는 금액',
                  value: 'principal',
                },
                {
                  label: '만기일시 · 이자만 내다 마지막에 원금',
                  value: 'bullet',
                },
              ]}
            />
            <SegmentedControl
              label="금리 유형"
              name="loan-rate"
              value={rateType}
              onValueChange={setRateType}
              options={[
                { label: '고정 5.2%', value: 'fixed' },
                { label: '변동 4.6%', value: 'floating' },
              ]}
            />
          </Stack>
        </Card>
        <Card padding="lg">
          <Stack gap={5}>
            <Stat
              size="lg"
              label={kind === 'annuity' ? '매달 내는 돈' : '첫 달 내는 돈'}
              value={Math.round(monthly).toLocaleString('ko-KR')}
              unit="원"
              hint={`연 ${rate}% · ${months}개월`}
            />
            <Grid minItemWidth={120} gap={3}>
              <Stat
                size="sm"
                label="총 이자"
                value={Math.round(totalInterest).toLocaleString('ko-KR')}
                unit="원"
              />
              <Stat
                size="sm"
                label="총 상환액"
                value={Math.round(total).toLocaleString('ko-KR')}
                unit="원"
              />
            </Grid>
            <Stack gap={1}>
              <ProgressBar
                label="총 상환액 중 이자 비중"
                value={Math.round((totalInterest / total) * 100)}
              />
              <Text size="sm" tone="muted">
                이자가 총 상환액의 {Math.round((totalInterest / total) * 100)}%
                예요
              </Text>
            </Stack>
            <Table density="compact" aria-label="초기 6개월 상환 일정">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>회차</TableHeaderCell>
                  <TableHeaderCell align="end">납입금</TableHeaderCell>
                  <TableHeaderCell align="end">이자</TableHeaderCell>
                  <TableHeaderCell align="end">잔액</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.slice(0, 6).map((r) => (
                  <TableRow key={r.month}>
                    <TableCell tone="muted">{r.month}회</TableCell>
                    <TableCell numeric>
                      <Amount value={Math.round(r.pay)} size="sm" />
                    </TableCell>
                    <TableCell numeric tone="muted">
                      <Amount value={Math.round(r.interest)} size="sm" />
                    </TableCell>
                    <TableCell numeric>
                      <Amount value={Math.round(r.balance)} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Alert tone="neutral">
              예시 금리로 계산한 값이에요. 실제 조건은 심사 결과에 따라 달라요.
            </Alert>
          </Stack>
        </Card>
      </Grid>
    </Stack>
  );
}

// ---------- 소비 리포트 ----------
const periods = {
  month: {
    label: '9월',
    total: 840_500,
    budget: 1_500_000,
    delta: '12%',
    direction: 'down' as const,
    weekly: [92, 138, 74, 160, 121, 205, 50],
    categories: [
      { name: '식비', value: 312_000, tone: 'brand' },
      { name: '교통', value: 148_000, tone: 'teal' },
      { name: '쇼핑', value: 205_500, tone: 'purple' },
      { name: '구독', value: 65_000, tone: 'warning' },
      { name: '기타', value: 110_000, tone: 'neutral' },
    ],
  },
  last: {
    label: '8월',
    total: 1_120_000,
    budget: 1_500_000,
    delta: '8%',
    direction: 'up' as const,
    weekly: [130, 180, 160, 210, 140, 190, 110],
    categories: [
      { name: '식비', value: 380_000, tone: 'brand' },
      { name: '교통', value: 160_000, tone: 'teal' },
      { name: '쇼핑', value: 350_000, tone: 'purple' },
      { name: '구독', value: 65_000, tone: 'warning' },
      { name: '기타', value: 165_000, tone: 'neutral' },
    ],
  },
  quarter: {
    label: '최근 3개월',
    total: 3_010_500,
    budget: 4_500_000,
    delta: '3%',
    direction: 'down' as const,
    weekly: [420, 510, 470, 600, 380, 390, 240],
    categories: [
      { name: '식비', value: 1_020_000, tone: 'brand' },
      { name: '교통', value: 450_000, tone: 'teal' },
      { name: '쇼핑', value: 900_500, tone: 'purple' },
      { name: '구독', value: 195_000, tone: 'warning' },
      { name: '기타', value: 445_000, tone: 'neutral' },
    ],
  },
};
const merchants = [
  { name: '동네 카페', count: 18, value: 81_000, tone: 'orange', mark: '☕' },
  { name: '메가마트', count: 6, value: 142_300, tone: 'blue', mark: 'M' },
  { name: '지하철·버스', count: 41, value: 62_000, tone: 'purple', mark: '🚌' },
  { name: '메가플릭스', count: 1, value: 17_000, tone: 'yellow', mark: '▶' },
];

export function SpendingReportExample() {
  const [period, setPeriod] = useState<keyof typeof periods>('month');
  const data = periods[period];
  const used = Math.round((data.total / data.budget) * 100);
  const maxWeek = Math.max(...data.weekly);
  const days = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <Stack gap={5}>
      <PageHeader
        headingLevel={2}
        title="이번 달, 어디에 썼을까요?"
        description="소비 패턴을 카테고리와 요일별로 살펴봐요"
        actions={<Badge tone="brand">데모 데이터</Badge>}
      />
      <SegmentedControl
        label="조회 기간"
        name="report-period"
        value={period}
        onValueChange={(v) => setPeriod(v as keyof typeof periods)}
        options={[
          { value: 'month', label: '이번 달' },
          { value: 'last', label: '지난달' },
          { value: 'quarter', label: '3개월' },
        ]}
      />
      <Grid minItemWidth={200} gap={3}>
        <Card variant="outlined">
          <Stat
            label={`${data.label}에 쓴 돈`}
            value={data.total.toLocaleString('ko-KR')}
            unit="원"
            delta={{ value: data.delta, direction: data.direction }}
            hint="같은 기간 대비"
          />
        </Card>
        <Card variant="outlined">
          <Stat
            label="하루 평균"
            value={Math.round(data.total / 30).toLocaleString('ko-KR')}
            unit="원"
            hint="30일 기준"
          />
        </Card>
        <Card variant="outlined" className="report-budget">
          <Stat
            label="예산 달성률"
            value={used}
            unit="%"
            hint={`예산 ${won(data.budget)}`}
          />
          <CircularProgress
            label={`예산 ${used}% 사용`}
            value={Math.min(used, 100)}
            size={40}
          />
        </Card>
      </Grid>

      <Grid minItemWidth={300} gap={5}>
        <Card padding="lg">
          <BarChart
            label="카테고리별 소비"
            data={data.categories.map((category) => ({
              label: category.name,
              value: category.value,
            }))}
            formatValue={won}
          />
        </Card>
        <Card padding="lg">
          <Stack gap={4}>
            <LineChart
              label="요일별 소비"
              data={data.weekly.map((value, index) => ({
                label: days[index]!,
                value,
              }))}
              formatValue={(value) => `${value}천원`}
            />
            <Text size="sm" tone="muted">
              {days[data.weekly.indexOf(maxWeek)]}요일에 가장 많이 썼어요
            </Text>
          </Stack>
        </Card>
      </Grid>

      <Card>
        <Heading size="md">자주 간 곳</Heading>
        {merchants.map((m) => (
          <ListRow
            key={m.name}
            leading={
              <span className="example-icon" data-tone={m.tone}>
                {m.mark}
              </span>
            }
            title={m.name}
            description={`${m.count}회`}
            trailing={<Amount value={m.value} />}
          />
        ))}
      </Card>
      <Banner
        tone="brand"
        icon={<ExampleIcon name="sparkle" />}
        title="구독 서비스를 한 번 정리해 볼까요?"
        description="쓰지 않는 구독 2개를 해지하면 매달 21,000원을 아낄 수 있어요"
        action={<Button variant="weak">구독 보기</Button>}
      />
    </Stack>
  );
}

// ---------- 카드 혜택·관리 ----------
const benefits = [
  {
    tone: 'brand',
    category: '카페',
    title: '커피 50% 할인',
    body: '전국 카페에서 월 5회, 최대 2만원',
  },
  {
    tone: 'success',
    category: '교통',
    title: '대중교통 10% 적립',
    body: '버스·지하철·택시 한도 없이',
  },
  {
    tone: 'purple',
    category: '구독',
    title: '스트리밍 3천원 할인',
    body: '메가플릭스, 뮤직 등 구독 결제',
  },
  {
    tone: 'warning',
    category: '해외',
    title: '해외결제 수수료 면제',
    body: '전 세계 어디서나 수수료 0원',
  },
] as const;
const history = [
  { date: '09.08', name: '동네 카페', amount: 4_500, benefit: 2_250 },
  { date: '09.08', name: '지하철', amount: 1_550, benefit: 155 },
  { date: '09.07', name: '메가플릭스', amount: 17_000, benefit: 3_000 },
  { date: '09.06', name: '메가마트', amount: 48_200, benefit: 0 },
  { date: '09.05', name: '택시', amount: 12_300, benefit: 1_230 },
];

export function CardBenefitsExample() {
  return (
    <ToastProvider>
      <CardBenefits />
    </ToastProvider>
  );
}

function CardBenefits() {
  const toast = useToast();
  const [tab, setTab] = useState('benefits');
  const [confirm, setConfirm] = useState(false);
  const [lost, setLost] = useState(false);
  const saved = history.reduce((s, h) => s + h.benefit, 0);

  return (
    <Stack gap={5}>
      <div className="cardb-hero">
        <div className="cardb-face" aria-label="메가 데일리 카드 **** 4821">
          <div className="cardb-face__top">
            <span>MEGA CARD</span>
            <ExampleIcon name="bolt" />
          </div>
          <div className="cardb-face__number">**** **** **** 4821</div>
          <div className="cardb-face__bottom">
            <span>KIM MEGA</span>
            <span>12/29</span>
          </div>
        </div>
        <Stack gap={3} align="start">
          {lost ? (
            <Badge tone="danger">분실 신고됨</Badge>
          ) : (
            <Badge tone="success">사용 중</Badge>
          )}
          <Heading size="lg">메가 데일리 카드</Heading>
          <Stat
            size="sm"
            label="이번 달 받은 혜택"
            value={saved.toLocaleString('ko-KR')}
            unit="원"
          />
          <Button
            variant="secondary"
            leading={<ExampleIcon name="shield" />}
            disabled={lost}
            onClick={() => setConfirm(true)}
          >
            {lost ? '분실 신고 완료' : '분실 신고'}
          </Button>
        </Stack>
      </div>
      <Tabs
        id="card-information"
        label="카드 정보"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'benefits', label: '혜택' },
          { value: 'history', label: '이용내역' },
          { value: 'settings', label: '설정' },
        ]}
      />
      <TabPanel
        tabsId="card-information"
        value="benefits"
        active={tab === 'benefits'}
      >
        <Stack gap={5}>
          <Grid minItemWidth={220} gap={3}>
            {benefits.map((b) => (
              <Card key={b.title} variant="outlined">
                <Stack gap={2} align="start">
                  <Badge tone={b.tone}>{b.category}</Badge>
                  <Heading size="sm">{b.title}</Heading>
                  <Text size="sm" tone="secondary">
                    {b.body}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Grid>
          <Accordion
            items={[
              {
                id: 'q1',
                title: '전월 실적 조건이 있나요?',
                content: '전월 30만원 이상 이용하면 모든 혜택이 적용돼요.',
              },
              {
                id: 'q2',
                title: '혜택은 언제 들어오나요?',
                content: '결제 다음 날 카드 대금에서 바로 차감돼요.',
              },
              {
                id: 'q3',
                title: '연회비는 얼마인가요?',
                content: '국내 전용 1만원, 해외 겸용 1만 5천원이에요.',
              },
            ]}
          />
        </Stack>
      </TabPanel>
      <TabPanel
        tabsId="card-information"
        value="history"
        active={tab === 'history'}
      >
        <Card>
          <Table aria-label="카드 이용 내역">
            <TableHead>
              <TableRow>
                <TableHeaderCell>일자</TableHeaderCell>
                <TableHeaderCell>가맹점</TableHeaderCell>
                <TableHeaderCell align="end">결제 금액</TableHeaderCell>
                <TableHeaderCell align="end">받은 혜택</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((h, i) => (
                <TableRow key={i}>
                  <TableCell tone="muted">{h.date}</TableCell>
                  <TableCell>{h.name}</TableCell>
                  <TableCell numeric>
                    <Amount value={h.amount} />
                  </TableCell>
                  <TableCell numeric>
                    {h.benefit ? (
                      <Amount value={-h.benefit} tone="down" signed />
                    ) : (
                      <Text as="span" tone="muted">
                        –
                      </Text>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </TabPanel>
      <TabPanel
        tabsId="card-information"
        value="settings"
        active={tab === 'settings'}
      >
        <Card padding="lg">
          <Stack gap={4}>
            <Switch label="해외 결제 허용" name="overseas" defaultChecked />
            <Switch label="온라인 결제 잠금" name="online-lock" />
            <Switch label="결제 알림 받기" name="notify" defaultChecked />
            <Text size="sm" tone="muted">
              카드를 잃어버렸다면 바로 신고해 주세요. 신고 후엔 결제가 막혀요.
            </Text>
            <Button
              variant="danger"
              leading={<ExampleIcon name="shield" />}
              disabled={lost}
              onClick={() => setConfirm(true)}
            >
              {lost ? '분실 신고 완료' : '카드 분실 신고'}
            </Button>
          </Stack>
        </Card>
      </TabPanel>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        size="sm"
        title="카드 분실 신고를 할까요?"
        description="신고 즉시 이 카드로는 결제할 수 없어요. 재발급은 앱에서 바로 신청할 수 있어요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              돌아가기
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setLost(true);
                setConfirm(false);
                toast({
                  title: '분실 신고를 접수했어요',
                  description: '예제 화면이라 실제 신고는 되지 않아요.',
                  tone: 'success',
                });
              }}
            >
              신고하기
            </Button>
          </>
        }
      />
    </Stack>
  );
}
