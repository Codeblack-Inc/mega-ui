import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  BottomCTA,
  Button,
  Card,
  Checkbox,
  Field,
  Grid,
  Heading,
  Input,
  ListRow,
  PageHeader,
  ProgressBar,
  Result,
  SegmentedControl,
  Select,
  Separator,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@mega-ui/react';

export function DashboardExample() {
  const [period, setPeriod] = useState('month');
  const [notice, setNotice] = useState('');
  return (
    <Stack gap={5}>
      <PageHeader
        title="내 돈, 한눈에 모아보기"
        headingLevel={2}
        description="오늘도 차곡차곡 쌓이고 있어요"
        actions={<Badge tone="brand">데모 데이터</Badge>}
      />
      <Grid minItemWidth={300} gap={5}>
        <Stack gap={5}>
          <Card padding="lg">
            <Stack gap={5}>
              <Text tone="muted">전체 자산</Text>
              <Heading size="xl">12,580,000원</Heading>
              <Stack direction="row" gap={2}>
                <Button
                  fullWidth
                  onClick={() =>
                    setNotice(
                      '송금 화면으로 이어지는 자리예요. 실제 송금은 실행하지 않아요.',
                    )
                  }
                >
                  송금하기
                </Button>
                <Button
                  variant="weak"
                  fullWidth
                  onClick={() =>
                    setNotice(
                      '계좌 연결을 체험했어요. 실제 금융 정보에 접근하지 않아요.',
                    )
                  }
                >
                  자산 연결
                </Button>
              </Stack>
              {notice ? <Alert>{notice}</Alert> : null}
            </Stack>
          </Card>
          <Card>
            <Heading size="md">내 계좌</Heading>
            <ListRow
              leading={
                <span className="example-icon" data-tone="blue">
                  ₩
                </span>
              }
              title="생활비 통장"
              description="메가뱅크 · 1234"
              trailing={<Text>2,340,000원</Text>}
            />
            <ListRow
              leading={
                <span className="example-icon" data-tone="yellow">
                  S
                </span>
              }
              title="차곡차곡 적금"
              description="매달 25일 자동 저축"
              trailing={<Text>8,000,000원</Text>}
            />
            <ListRow
              leading={
                <span className="example-icon" data-tone="purple">
                  M
                </span>
              }
              title="비상금 통장"
              description="메가뱅크 · 5678"
              trailing={<Text>2,240,000원</Text>}
            />
          </Card>
        </Stack>
        <Stack gap={5}>
          <Card>
            <Stack gap={5}>
              <Heading>소비 돌아보기</Heading>
              <SegmentedControl
                label="소비 조회 기간"
                name="spending-period"
                options={[
                  { label: '이번 달', value: 'month' },
                  { label: '지난달', value: 'last' },
                ]}
                value={period}
                onValueChange={setPeriod}
              />
              <Stack gap={2}>
                <Text tone="muted">
                  {period === 'month' ? '9월' : '8월'}에 쓴 돈
                </Text>
                <Heading size="lg">
                  {period === 'month' ? '840,500원' : '1,120,000원'}
                </Heading>
              </Stack>
              <ProgressBar
                label="월 예산 사용률"
                value={period === 'month' ? 56 : 75}
              />
              <Text size="sm" tone="muted">
                예산 150만원 중 {period === 'month' ? '56%' : '75%'}를 썼어요
              </Text>
            </Stack>
          </Card>
          <Card>
            <Heading>최근 이용 내역</Heading>
            <ListRow
              leading={
                <span className="example-icon" data-tone="orange">
                  ☕
                </span>
              }
              title="동네 카페"
              description="오늘 10:24"
              trailing={<Text>−4,500원</Text>}
            />
            <ListRow
              leading={
                <span className="example-icon" data-tone="blue">
                  ↗
                </span>
              }
              title="김메가님에게 송금"
              description="어제 18:30"
              trailing={<Text>−30,000원</Text>}
            />
          </Card>
        </Stack>
      </Grid>
    </Stack>
  );
}

export function SettingsExample() {
  const [saved, setSaved] = useState(false);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(true);
      }}
      onChange={() => setSaved(false)}
    >
      <Stack gap={5}>
        <PageHeader
          title="나에게 맞게 설정해요"
          headingLevel={2}
          description="내 정보와 필요한 알림을 관리하세요"
        />
        <Card padding="lg">
          <Stack gap={5}>
            <Heading>프로필</Heading>
            <Grid>
              <Field label="이름" htmlFor="profile-name" required>
                <Input
                  variant="box"
                  id="profile-name"
                  name="name"
                  defaultValue="김메가"
                  required
                />
              </Field>
              <Field label="이메일" htmlFor="profile-email" required>
                <Input
                  variant="box"
                  id="profile-email"
                  name="email"
                  type="email"
                  defaultValue="mega@example.com"
                  required
                />
              </Field>
            </Grid>
            <Field
              label="소개"
              htmlFor="profile-bio"
              hint="나를 소개하는 한마디를 남겨주세요"
            >
              <Textarea
                variant="box"
                id="profile-bio"
                name="bio"
                aria-describedby="profile-bio-description"
                defaultValue="일상의 좋은 경험을 만들어요."
              />
            </Field>
            <Separator />
            <Heading>알림</Heading>
            <Switch
              label="결제·입출금 알림"
              name="transactions"
              defaultChecked
            />
            <Switch label="혜택과 이벤트 알림" name="marketing" />
            <Text size="sm" tone="muted">
              중요한 보안 알림은 설정과 관계없이 전달돼요.
            </Text>
            <BottomCTA className="settings-actions">
              <Button
                type="reset"
                size="xl"
                variant="secondary"
                onClick={() => setSaved(false)}
              >
                초기화
              </Button>
              <Button type="submit" size="xl">
                저장하기
              </Button>
            </BottomCTA>
            {saved ? (
              <Alert tone="success">
                설정을 확인했어요. 서버에 저장하지 않는 예제예요.
              </Alert>
            ) : null}
          </Stack>
        </Card>
      </Stack>
    </form>
  );
}

export function PaymentExample() {
  const [method, setMethod] = useState('card');
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (done) resultRef.current?.focus();
  }, [done]);
  if (done)
    return (
      <Card padding="lg">
        <Result
          ref={resultRef}
          tabIndex={-1}
          title="결제 화면 체험을 마쳤어요"
          description="실제 결제나 주문은 발생하지 않았어요."
          actions={
            <Button
              fullWidth
              variant="weak"
              onClick={() => {
                setDone(false);
                setAgreed(false);
              }}
            >
              다시 체험하기
            </Button>
          }
        />
      </Card>
    );
  return (
    <Card padding="lg">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setDone(true);
        }}
      >
        <Stack gap={5}>
          <Badge tone="brand">MEGA PAY · UI 데모</Badge>
          <Heading size="lg">어떻게 결제할까요?</Heading>
          <ListRow
            leading={
              <span className="example-icon" data-tone="blue">
                M
              </span>
            }
            title="메가 플랜"
            description="팀을 위한 한 달 이용권"
            trailing={<Text>58,000원</Text>}
          />
          <Separator />
          <SegmentedControl
            label="결제 수단"
            name="payment-method"
            options={[
              { label: '카드', value: 'card' },
              { label: '계좌', value: 'account' },
            ]}
            value={method}
            onValueChange={setMethod}
          />
          <Field
            label={method === 'card' ? '카드사' : '은행'}
            htmlFor="payment-provider"
          >
            <Select
              variant="box"
              id="payment-provider"
              name="provider"
              key={method}
            >
              {(method === 'card'
                ? ['메가카드', '다른 카드']
                : ['메가뱅크', '다른 은행']
              ).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="영수증 받을 이메일" htmlFor="payment-email" required>
            <Input
              variant="box"
              id="payment-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
            />
          </Field>
          <ListRow
            title="총 결제 금액"
            trailing={<Heading size="lg">58,000원</Heading>}
          />
          <Checkbox
            name="agreement"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            required
          >
            예제 이용 안내를 확인했어요
          </Checkbox>
          <BottomCTA description="실제 금액이 청구되지 않는 UI 예제예요">
            <Button type="submit" size="xl" disabled={!agreed}>
              58,000원 결제 체험하기
            </Button>
          </BottomCTA>
        </Stack>
      </form>
    </Card>
  );
}
