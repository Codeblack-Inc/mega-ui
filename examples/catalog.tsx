import { useState } from 'react';
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

export function CatalogExample() {
  const [segment, setSegment] = useState('all');
  const [notify, setNotify] = useState(true);
  return (
    <Stack gap={7}>
      <section aria-labelledby="essentials-title">
        <Stack gap={5}>
          <div className="catalog-section-heading">
            <Heading id="essentials-title">자주 쓰는 컴포넌트</Heading>
            <Text size="sm" tone="muted">
              작은 요소부터 자연스러운 화면까지
            </Text>
          </div>
          <div className="catalog-showcase">
            <Card padding="lg">
              <Stack gap={5}>
                <div className="catalog-label">
                  BUTTON <span>01</span>
                </div>
                <Stack gap={2}>
                  <Heading>다음 행동은 명확하게</Heading>
                  <Text size="sm" tone="muted">
                    주요 액션은 선명하게, 보조 액션은 부드럽게
                  </Text>
                </Stack>
                <Stack direction="row" gap={3} wrap>
                  <Button>확인했어요</Button>
                  <Button variant="weak">자세히 보기</Button>
                  <Button variant="secondary">나중에</Button>
                </Stack>
                <Stack direction="row" gap={3} align="center" wrap>
                  <Button size="sm">작은 버튼</Button>
                  <Button size="md">기본 버튼</Button>
                  <Button size="lg">큰 버튼</Button>
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
            </Card>
            <Card padding="lg">
              <Stack gap={3}>
                <div className="catalog-label">
                  LIST ROW <span>02</span>
                </div>
                <Heading>정보는 편안하게 읽히도록</Heading>
                <ListRow
                  leading={
                    <span className="example-icon" data-tone="blue">
                      ₩
                    </span>
                  }
                  title="메가뱅크 통장"
                  description="잔액 2,340,000원"
                  trailing={
                    <a
                      className="example-link"
                      href="#dashboard"
                      aria-label="메가뱅크 통장 보기"
                    >
                      보기 <span aria-hidden="true">›</span>
                    </a>
                  }
                />
                <ListRow
                  leading={
                    <span className="example-icon" data-tone="yellow">
                      S
                    </span>
                  }
                  title="차곡차곡 모으기"
                  description="목표까지 80% 모았어요"
                  trailing={<Badge tone="brand">저축 중</Badge>}
                />
                <Separator />
                <ListRow
                  leading={
                    <span className="example-icon" data-tone="purple">
                      M
                    </span>
                  }
                  title="이번 달 결제 내역"
                  description="카드와 계좌를 한 번에"
                  trailing={
                    <a
                      className="example-link"
                      href="#payments"
                      aria-label="이번 달 결제 내역 보기"
                    >
                      보기 <span aria-hidden="true">›</span>
                    </a>
                  }
                />
              </Stack>
            </Card>
            <Card padding="lg">
              <Stack gap={5}>
                <div className="catalog-label">
                  TEXT FIELD <span>03</span>
                </div>
                <Field
                  label="이름"
                  htmlFor="catalog-name"
                  hint="실명을 입력해 주세요"
                >
                  <Input
                    id="catalog-name"
                    placeholder="이름을 입력해 주세요"
                    aria-describedby="catalog-name-description"
                  />
                </Field>
                <Field
                  label="이메일"
                  htmlFor="catalog-email"
                  error="이메일 주소를 다시 확인해 주세요"
                >
                  <Input
                    id="catalog-email"
                    defaultValue="mega@"
                    aria-invalid="true"
                    aria-describedby="catalog-email-description"
                  />
                </Field>
              </Stack>
            </Card>
            <Card padding="lg">
              <Stack gap={5}>
                <div className="catalog-label">
                  SELECTION <span>04</span>
                </div>
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
                <Separator />
                <Switch
                  label="알림 받기"
                  checked={notify}
                  onChange={(event) => setNotify(event.target.checked)}
                />
                <Text size="sm" tone="muted">
                  {notify ? '새 소식을 알려드릴게요' : '알림을 껐어요'}
                </Text>
                <Checkbox defaultChecked>필수 약관에 동의해요</Checkbox>
              </Stack>
            </Card>
          </div>
        </Stack>
      </section>
      <section aria-labelledby="feedback-title">
        <Stack gap={5}>
          <div className="catalog-section-heading">
            <Heading id="feedback-title">상태를 알려주는 작은 디테일</Heading>
            <Text size="sm" tone="muted">
              피드백 · 진행률 · 완료 화면
            </Text>
          </div>
          <Grid minItemWidth={280} gap={5}>
            <Card padding="lg">
              <Stack gap={5}>
                <Heading size="sm">Badge & Alert</Heading>
                <Stack direction="row" gap={2} wrap>
                  <Badge>기본</Badge>
                  <Badge tone="brand">새 소식</Badge>
                  <Badge tone="success">완료</Badge>
                  <Badge tone="warning">확인 필요</Badge>
                  <Badge tone="danger">실패</Badge>
                </Stack>
                <Alert>지금 연결하면 자산을 한눈에 볼 수 있어요</Alert>
                <Alert tone="success">변경 사항을 저장했어요</Alert>
                <Alert tone="warning">한 번 더 확인해 주세요</Alert>
                <Alert tone="danger">다시 시도해 주세요</Alert>
              </Stack>
            </Card>
            <Card padding="lg">
              <Stack gap={5}>
                <Heading size="sm">Progress & BottomCTA</Heading>
                <Heading>목표에 가까워지고 있어요</Heading>
                <ListRow
                  title="여행 자금 모으기"
                  description="100만원 중 80만원"
                  trailing={<Badge tone="brand">80%</Badge>}
                />
                <ProgressBar label="여행 자금 저축률" value={80} />
                <BottomCTA description="이어서 목표를 완성해 보세요">
                  <Button size="lg" variant="weak">
                    이어서 하기
                  </Button>
                </BottomCTA>
              </Stack>
            </Card>
            <Card>
              <Result
                title="모두 준비됐어요"
                description="이제 새로운 경험을 시작해 보세요"
                actions={
                  <Button variant="weak" fullWidth>
                    확인했어요
                  </Button>
                }
              />
            </Card>
          </Grid>
        </Stack>
      </section>
      <section aria-labelledby="form-title">
        <Stack gap={5}>
          <Heading id="form-title">폼과 화면의 기본 구조</Heading>
          <Grid minItemWidth={280} gap={5}>
            <Card padding="lg">
              <Stack gap={5}>
                <Field label="계좌 선택" htmlFor="catalog-account">
                  <Select id="catalog-account">
                    <option>메가뱅크</option>
                    <option>다른 은행</option>
                  </Select>
                </Field>
                <Field label="받는 분께 남길 말" htmlFor="catalog-note">
                  <Textarea id="catalog-note" placeholder="메모를 남겨주세요" />
                </Field>
                <Field label="변경할 수 없는 정보" htmlFor="catalog-disabled">
                  <Input id="catalog-disabled" disabled value="인증된 계정" />
                </Field>
                <Switch label="사용할 수 없는 설정" disabled />
                <Checkbox disabled>관리자 권한이 필요해요</Checkbox>
              </Stack>
            </Card>
            <Stack gap={5}>
              <Card variant="filled">
                <Stack gap={3}>
                  <Heading size="lg">중요한 내용부터, 차근차근</Heading>
                  <Text>
                    넉넉한 여백과 읽기 편한 글자 크기로 정보의 순서를 만들어요.
                  </Text>
                  <Text size="sm" tone="muted">
                    Heading · Text · Stack · Grid · Container
                  </Text>
                </Stack>
              </Card>
              <Card variant="outlined">
                <Stack gap={3}>
                  <Heading size="sm">필요할 때만 경계를 더해요</Heading>
                  <Text tone="muted">
                    Card의 elevated, filled, outlined로 화면의 깊이를 조절해요.
                  </Text>
                  <Separator />
                  <Text size="sm" tone="muted">
                    커스텀 CSS 없이 컴포넌트로 조합하세요.
                  </Text>
                </Stack>
              </Card>
            </Stack>
          </Grid>
        </Stack>
      </section>
    </Stack>
  );
}
