import { useEffect, useRef, useState } from 'react';
import {
  Accordion,
  ActiveFilters,
  AgentActivity,
  Amount,
  Avatar,
  BackToTop,
  Badge,
  Banner,
  BottomCTA,
  BottomNavigation,
  Button,
  Card,
  Carousel,
  Chat,
  CheckboxGroup,
  Chip,
  DescriptionList,
  DataPagination,
  Dialog,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FilterBar,
  Grid,
  Heading,
  IconButton,
  Input,
  LinkButton,
  List,
  ListItem,
  ListRow,
  Message,
  MessageBubble,
  PageHeader,
  PromptInput,
  RangeSlider,
  Result,
  SearchInput,
  Select,
  Separator,
  SideNav,
  SideNavItem,
  SideNavSection,
  Skeleton,
  Stack,
  Stat,
  Stepper,
  StreamingText,
  Switch,
  TabPanel,
  Text,
  Timeline,
  ToastProvider,
  TopBar,
  TopBarLink,
  Tour,
  useToast,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';

// ---------- 상품 목록 ----------

const products = [
  ['데일리 코튼 티셔츠', '의류', 19000, 4.8, 320, 'blue', 'bag'],
  ['라이트 데일리 백', '가방', 42000, 4.6, 118, 'yellow', 'bag'],
  ['컴포트 스니커즈', '신발', 89000, 4.9, 540, 'purple', 'bolt'],
  ['시그니처 머그컵', '리빙', 24000, 4.7, 86, 'blue', 'gift'],
  ['위클리 노트 세트', '문구', 18000, 4.5, 64, 'yellow', 'file'],
  ['메가 데스크 매트', '리빙', 32000, 4.8, 210, 'purple', 'grid'],
  ['트래블 파우치', '가방', 21000, 4.4, 47, 'blue', 'box'],
  ['클래식 볼캡', '의류', 29000, 4.6, 152, 'yellow', 'star'],
  ['에센셜 코튼 셔츠', '의류', 79000, 4.7, 98, 'purple', 'bag'],
  ['미니 크로스백', '가방', 48000, 4.8, 276, 'blue', 'bag'],
  ['러닝 삭스 3족', '신발', 15000, 4.3, 33, 'yellow', 'bolt'],
  ['우드 트레이', '리빙', 36000, 4.9, 71, 'purple', 'gift'],
].map(([name, category, price, rating, reviews, tone, icon], index) => ({
  id: index + 1,
  name: name as string,
  category: category as string,
  price: price as number,
  rating: rating as number,
  reviews: reviews as number,
  tone: tone as string,
  icon: icon as 'bag' | 'bolt' | 'gift' | 'file' | 'grid' | 'box' | 'star',
  freeShipping: (price as number) >= 30000,
  sale: index % 3 === 0,
}));

const PER_PAGE = 6;

export function ShopExample() {
  return (
    <ToastProvider>
      <Shop />
    </ToastProvider>
  );
}

function Shop() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [range, setRange] = useState<[number, number]>([0, 100000]);
  const [topRated, setTopRated] = useState(false);
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PER_PAGE);
  const [liked, setLiked] = useState<number[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = products
    .filter(
      (item) =>
        item.name.includes(query) &&
        (categories.length === 0 || categories.includes(item.category)) &&
        item.price >= range[0] &&
        item.price <= range[1] &&
        (!topRated || item.rating >= 4.7),
    )
    .sort((a, b) =>
      sort === 'low'
        ? a.price - b.price
        : sort === 'high'
          ? b.price - a.price
          : b.reviews - a.reviews,
    );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);

  const reset = () => {
    setCategories([]);
    setRange([0, 100000]);
    setTopRated(false);
    setPage(1);
  };

  const filters = (
    <Stack gap={5}>
      <CheckboxGroup
        label="카테고리"
        name="shop-category"
        options={['의류', '가방', '신발', '리빙', '문구'].map((label) => ({
          label,
          value: label,
        }))}
        value={categories}
        onValueChange={(value) => {
          setCategories(value);
          setPage(1);
        }}
      />
      <RangeSlider
        label={`가격 ${range[0].toLocaleString('ko-KR')}원 – ${range[1].toLocaleString('ko-KR')}원`}
        name="shop-price"
        min={0}
        max={100000}
        step={5000}
        value={range}
        onValueChange={(value) => {
          setRange(value);
          setPage(1);
        }}
      />
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          평점
        </Text>
        <Stack direction="row" gap={2} wrap>
          <Chip
            selected={topRated}
            onClick={() => {
              setTopRated((value) => !value);
              setPage(1);
            }}
          >
            ★ 4.7 이상
          </Chip>
        </Stack>
      </Stack>
      <Button variant="secondary" onClick={reset}>
        초기화
      </Button>
    </Stack>
  );

  return (
    <div className="shop-layout">
      <aside className="shop-filters">
        <Card>
          <Stack gap={4}>
            <Heading size="sm">필터</Heading>
            {filters}
          </Stack>
        </Card>
      </aside>
      <div className="shop-main">
        <FilterBar
          label="상품 필터"
          search={
            <SearchInput
              aria-label="상품 검색"
              placeholder="어떤 상품을 찾으세요?"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          }
          sort={
            <Select
              aria-label="정렬"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="popular">인기순</option>
              <option value="low">낮은 가격순</option>
              <option value="high">높은 가격순</option>
            </Select>
          }
          actions={
            <Button
              variant="outline"
              className="shop-filter-button"
              leading={<ExampleIcon name="filter" />}
              onClick={() => setFilterOpen(true)}
            >
              필터
            </Button>
          }
        />
        <ActiveFilters
          filters={[
            ...(query ? [{ id: 'query', label: `검색: ${query}` }] : []),
            ...categories.map((category) => ({
              id: `category:${category}`,
              label: category,
            })),
            ...(range[0] !== 0 || range[1] !== 100000
              ? [{ id: 'price', label: '가격 범위' }]
              : []),
            ...(topRated ? [{ id: 'rating', label: '평점 4.7 이상' }] : []),
          ]}
          onRemove={(id) => {
            if (id === 'query') setQuery('');
            if (id.startsWith('category:'))
              setCategories((value) =>
                value.filter((item) => item !== id.slice(9)),
              );
            if (id === 'price') setRange([0, 100000]);
            if (id === 'rating') setTopRated(false);
            setPage(1);
          }}
          onClear={() => {
            setQuery('');
            reset();
          }}
        />
        <Text size="sm" tone="muted">
          {filtered.length}개 상품
        </Text>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ExampleIcon name="search" />}
            title="조건에 맞는 상품이 없어요"
            description="필터를 조금 넓혀 보세요."
            action={
              <Button variant="weak" onClick={reset}>
                필터 초기화
              </Button>
            }
          />
        ) : (
          <Grid minItemWidth={220} gap={4}>
            {filtered
              .slice((current - 1) * pageSize, current * pageSize)
              .map((item) => (
                <Card key={item.id} variant="outlined" className="shop-card">
                  <div className="shop-thumb" data-tone={item.tone}>
                    <ExampleIcon name={item.icon} />
                    <IconButton
                      className="shop-like"
                      round
                      variant="filled"
                      label={liked.includes(item.id) ? '찜 해제' : '찜하기'}
                      aria-pressed={liked.includes(item.id)}
                      onClick={() =>
                        setLiked((ids) =>
                          ids.includes(item.id)
                            ? ids.filter((id) => id !== item.id)
                            : [...ids, item.id],
                        )
                      }
                    >
                      <ExampleIcon name="heart" />
                    </IconButton>
                  </div>
                  <Stack gap={2}>
                    <Stack direction="row" gap={1} wrap>
                      {item.sale ? <Badge tone="danger">10% 할인</Badge> : null}
                      {item.freeShipping ? (
                        <Badge tone="brand">무료배송</Badge>
                      ) : null}
                    </Stack>
                    <Text weight="medium">{item.name}</Text>
                    <Amount value={item.price} size="lg" />
                    <Text size="xs" tone="muted">
                      ★ {item.rating.toFixed(1)} ({item.reviews})
                    </Text>
                    <Button
                      variant="weak"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: '장바구니에 담았어요',
                          description: item.name,
                          tone: 'success',
                        })
                      }
                    >
                      장바구니
                    </Button>
                  </Stack>
                </Card>
              ))}
          </Grid>
        )}
        <DataPagination
          total={filtered.length}
          page={current}
          pageSize={pageSize}
          pageSizeOptions={[6, 12]}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
          formatSummary={({ start, end, total }) =>
            total ? `${total}개 중 ${start}–${end}개 상품` : '상품 0개'
          }
        />
      </div>
      <Drawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="필터"
        size="sm"
        actions={<Button onClick={() => setFilterOpen(false)}>적용하기</Button>}
      >
        {filters}
      </Drawer>
    </div>
  );
}

// ---------- 주문 상세 ----------

export function OrderDetailExample() {
  const [address, setAddress] = useState('서울 강남구 테헤란로 142, 12층');
  const [draft, setDraft] = useState(address);
  const [editing, setEditing] = useState(false);
  return (
    <Stack gap={5} className="order">
      <PageHeader
        title="주문번호 20260908-0421"
        headingLevel={2}
        description="2026년 9월 8일 14:32 주문"
        actions={<Badge tone="brand">배송 중</Badge>}
      />
      <Stepper
        label="주문 진행 단계"
        current={2}
        items={[
          { label: '결제 완료' },
          { label: '상품 준비' },
          { label: '배송 중' },
          { label: '배송 완료' },
        ]}
      />
      <Grid minItemWidth={300} gap={4}>
        <Card>
          <Stack gap={4}>
            <Heading size="sm">배송 현황</Heading>
            <Timeline
              items={[
                {
                  id: 'out',
                  title: '배송 출발',
                  description: '강남 물류센터에서 출발했어요',
                  time: '09.09 08:12',
                  dateTime: '2026-09-09T08:12',
                },
                {
                  id: 'hub',
                  title: '물류센터 도착',
                  time: '09.08 22:40',
                  dateTime: '2026-09-08T22:40',
                },
                {
                  id: 'ready',
                  title: '상품 준비 완료',
                  time: '09.08 17:05',
                  dateTime: '2026-09-08T17:05',
                },
                {
                  id: 'paid',
                  title: '결제 완료',
                  time: '09.08 14:32',
                  dateTime: '2026-09-08T14:32',
                },
              ]}
            />
          </Stack>
        </Card>
        <Stack gap={4}>
          <Card>
            <Heading size="sm">주문 상품</Heading>
            <ListRow
              leading={
                <span className="example-icon" data-tone="blue">
                  <ExampleIcon name="bag" />
                </span>
              }
              title="메가 데일리 티셔츠"
              description="화이트 · M · 1개"
              trailing={<Amount value={19000} />}
            />
            <ListRow
              leading={
                <span className="example-icon" data-tone="yellow">
                  <ExampleIcon name="gift" />
                </span>
              }
              title="시그니처 머그컵"
              description="크림 · 1개"
              trailing={<Amount value={24000} />}
            />
          </Card>
          <Card>
            <Stack gap={3}>
              <Heading size="sm">결제 정보</Heading>
              <DescriptionList
                items={[
                  { term: '상품 금액', description: <Amount value={43000} /> },
                  { term: '배송비', description: <Amount value={3000} /> },
                  {
                    term: '할인',
                    description: <Amount value={-4300} tone="down" />,
                  },
                  {
                    term: <strong>총 결제 금액</strong>,
                    description: <Amount value={41700} size="lg" />,
                  },
                ]}
              />
              <Text size="xs" tone="muted">
                메가카드 일시불 · 승인번호 48213977
              </Text>
            </Stack>
          </Card>
          <Card>
            <Stack gap={3}>
              <Stack direction="row" justify="between" align="center">
                <Heading size="sm">배송지</Heading>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => {
                    setDraft(address);
                    setEditing(true);
                  }}
                >
                  배송지 변경
                </Button>
              </Stack>
              <DescriptionList
                items={[
                  { term: '받는 사람', description: '김메가' },
                  { term: '연락처', description: '010-1234-5678' },
                  { term: '주소', description: address },
                  { term: '요청 사항', description: '문 앞에 놓아주세요' },
                ]}
              />
            </Stack>
          </Card>
        </Stack>
      </Grid>
      <BottomCTA
        className="order-actions"
        description="배송 완료 후 7일까지 교환·반품을 신청할 수 있어요"
      >
        <Button size="xl" variant="secondary">
          교환·반품
        </Button>
        <Button size="xl">배송 문의</Button>
      </BottomCTA>
      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title="배송지를 변경할까요?"
        description="배송 출발 전까지만 변경할 수 있어요."
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                setAddress(draft);
                setEditing(false);
              }}
            >
              변경하기
            </Button>
          </>
        }
      >
        <Field label="주소" htmlFor="order-address">
          <Input
            id="order-address"
            variant="box"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </Field>
      </Dialog>
    </Stack>
  );
}

// ---------- 랜딩 페이지 ----------

const features = [
  ['bolt', '3분 만에 시작', '설치하고 스타일 한 줄 불러오면 바로 써요.'],
  ['grid', '150개 컴포넌트', '레이아웃부터 데이터 그리드까지 한 세트예요.'],
  ['shield', '접근성 기본', '브라우저 기본 동작 위에 쌓아 키보드가 통해요.'],
  ['sparkle', 'AI 친화 문서', 'llms.txt 하나로 AI가 규칙을 읽어요.'],
  ['globe', '다크 모드', '토큰만 바꾸면 전체 화면이 따라와요.'],
  ['users', '팀 단위 일관성', '같은 언어로 만들어 리뷰가 빨라져요.'],
] as const;

const plans = [
  {
    name: '스타터',
    price: 0,
    note: '개인 프로젝트',
    items: ['컴포넌트 전체', '커뮤니티 지원'],
  },
  {
    name: '팀',
    price: 29000,
    note: '1인당 월',
    items: ['컴포넌트 전체', '디자인 토큰 동기화', '우선 지원'],
    highlight: true,
  },
  {
    name: '엔터프라이즈',
    price: 99000,
    note: '1인당 월',
    items: ['팀 플랜 전체', 'SSO · 감사 로그', '전담 매니저'],
  },
];

export function LandingExample() {
  return (
    <div className="landing">
      <TopBar
        className="landing-topbar"
        navLabel="랜딩 메뉴"
        brand={
          <span className="landing-brand">
            <span className="landing-brand__mark">m</span>mega
          </span>
        }
        actions={<Button size="sm">무료로 시작하기</Button>}
      >
        <TopBarLink href="#landing-features">기능</TopBarLink>
        <TopBarLink href="#landing-pricing">요금</TopBarLink>
        <TopBarLink href="#landing-faq">FAQ</TopBarLink>
      </TopBar>
      <section className="landing-hero">
        <Stack gap={4} align="center">
          <Badge tone="brand">v0.1.0 출시</Badge>
          <Heading level={2} size="2xl">
            익숙해서 쉽고, 단순해서 편안한
            <br />
            회사 웹을 위한 UI
          </Heading>
          <Text size="lg" tone="secondary">
            실측한 디자인 토큰 위에 만든 React 컴포넌트로 같은 언어로 화면을
            만들어요.
          </Text>
          <Stack direction="row" gap={2} wrap justify="center">
            <Button size="lg">무료로 시작하기</Button>
            <Button size="lg" variant="secondary">
              문서 보기
            </Button>
          </Stack>
        </Stack>
      </section>
      <div className="landing-section">
        <Grid minItemWidth={200} gap={3}>
          <Card variant="outlined">
            <Stat label="컴포넌트" value="150" unit="개" />
          </Card>
          <Card variant="outlined">
            <Stat label="도입 팀" value="42" unit="팀" />
          </Card>
          <Card variant="outlined">
            <Stat label="번들 크기" value="38" unit="KB" hint="gzip 기준" />
          </Card>
        </Grid>
      </div>
      <section id="landing-features" className="landing-section">
        <Stack gap={5}>
          <Heading level={2} size="xl">
            필요한 건 전부, 군더더기는 없이
          </Heading>
          <Grid minItemWidth={260} gap={4}>
            {features.map(([icon, title, body]) => (
              <Card key={title} variant="outlined" padding="lg">
                <Stack gap={3}>
                  <span className="landing-feature-icon">
                    <ExampleIcon name={icon} />
                  </span>
                  <Heading level={3} size="sm">
                    {title}
                  </Heading>
                  <Text size="sm" tone="secondary">
                    {body}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      </section>
      <section className="landing-section">
        <Carousel label="고객 후기">
          {(
            [
              [
                '박지수',
                '프론트엔드 리드',
                '디자인 리뷰 시간이 절반으로 줄었어요. 팀이 같은 단어로 이야기해요.',
              ],
              [
                '이도윤',
                '프로덕트 디자이너',
                '토큰이 실제 제품과 같아서 핸드오프가 필요 없어졌어요.',
              ],
              [
                '최하린',
                'CTO',
                '접근성 이슈가 눈에 띄게 줄었어요. 브라우저 기본 동작이 정답이더라고요.',
              ],
            ] as const
          ).map(([name, role, quote]) => (
            <Card key={name} padding="lg" className="landing-quote">
              <Stack gap={4}>
                <Text size="lg">“{quote}”</Text>
                <Stack direction="row" gap={3} align="center">
                  <Avatar name={name} />
                  <div>
                    <Text weight="semibold" as="div">
                      {name}
                    </Text>
                    <Text size="sm" tone="muted" as="div">
                      {role}
                    </Text>
                  </div>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Carousel>
      </section>
      <section id="landing-pricing" className="landing-section">
        <Stack gap={5}>
          <Heading level={2} size="xl">
            팀 크기에 맞는 요금
          </Heading>
          <Grid minItemWidth={240} gap={4}>
            {plans.map((plan) => (
              <Card
                key={plan.name}
                variant="outlined"
                padding="lg"
                className={
                  plan.highlight
                    ? 'landing-plan landing-plan--highlight'
                    : 'landing-plan'
                }
              >
                <Stack gap={4}>
                  <Stack direction="row" justify="between" align="center">
                    <Heading level={3} size="sm">
                      {plan.name}
                    </Heading>
                    {plan.highlight ? <Badge tone="brand">추천</Badge> : null}
                  </Stack>
                  <div>
                    <Amount value={plan.price} size="xl" />
                    <Text size="sm" tone="muted">
                      {plan.note}
                    </Text>
                  </div>
                  <List>
                    {plan.items.map((item) => (
                      <ListItem key={item}>{item}</ListItem>
                    ))}
                  </List>
                  <Button
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    fullWidth
                  >
                    {plan.price ? '14일 무료 체험' : '무료로 시작'}
                  </Button>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      </section>
      <section id="landing-faq" className="landing-section">
        <Stack gap={5}>
          <Heading level={2} size="xl">
            자주 묻는 질문
          </Heading>
          <Accordion
            items={[
              {
                id: 'f1',
                title: 'React 18에서도 쓸 수 있나요?',
                content: 'React 19 peer 하나만 요구해요. 18은 지원하지 않아요.',
              },
              {
                id: 'f2',
                title: 'Tailwind와 같이 써도 되나요?',
                content:
                  '네. 스타일은 CSS 변수 기반이라 어떤 도구와도 충돌하지 않아요.',
              },
              {
                id: 'f3',
                title: '디자인 토큰을 바꿀 수 있나요?',
                content: '--mega-* 변수만 덮어쓰면 전체 컴포넌트가 따라와요.',
              },
            ]}
          />
        </Stack>
      </section>
      <footer className="landing-footer">
        <Text size="sm" tone="muted">
          © 2026 Mega UI · 이용약관 · 개인정보 처리방침
        </Text>
        <BackToTop className="landing-top" />
      </footer>
    </div>
  );
}

// ---------- AI 어시스턴트 ----------

const cannedReplies: [string, string][] = [
  [
    '소비',
    '이번 달 총 소비는 84만 원이에요. 지난달보다 25% 줄었고, 카페와 배달이 가장 많이 줄었어요. 남은 예산은 66만 원이에요.',
  ],
  [
    '적금',
    '매달 25일에 50만 원씩 자동 저축 중이에요. 이대로면 내년 3월에 목표 1,000만 원을 채워요.',
  ],
  [
    '카드',
    '이번 달 메가카드 실적은 48만 원으로 혜택 기준 50만 원까지 2만 원 남았어요. 다음 결제는 카드로 하면 좋겠어요.',
  ],
];
const fallbackReply =
  '지금 계좌와 소비 데이터를 기준으로 답했어요. 더 궁금한 점이 있으면 편하게 물어보세요.';
const suggestions = [
  '이번 달 소비 요약해줘',
  '적금 진행 상황 알려줘',
  '카드 실적 얼마나 남았어?',
];

interface ChatMessage {
  id: number;
  author: '나' | '메가 AI';
  text: string;
  time: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    author: '나',
    text: '이번 달 소비가 지난달보다 얼마나 줄었어?',
    time: '09:00',
  },
  {
    id: 2,
    author: '메가 AI',
    text: '이번 달 총 소비는 84만 원으로 지난달보다 25% 줄었어요. 카페와 배달 지출이 가장 많이 줄었고, 남은 예산은 66만 원이에요.',
    time: '09:00',
  },
];

const now = () =>
  new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

export function AssistantExample() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [prompt, setPrompt] = useState('');
  const [streaming, setStreaming] = useState<{
    full: string;
    shown: string;
  } | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const steps = ['질문 이해하기', '거래 내역 조회', '답변 작성'];

  const finish = (text: string) => {
    window.clearInterval(timer.current);
    timer.current = undefined;
    setStreaming(null);
    setMessages((items) => [
      ...items,
      { id: Date.now(), author: '메가 AI', text, time: now() },
    ]);
  };

  useEffect(() => () => window.clearInterval(timer.current), []);

  const newChat = () => {
    window.clearInterval(timer.current);
    timer.current = undefined;
    setStreaming(null);
    setStepIndex(0);
    setMessages([
      {
        id: Date.now(),
        author: '메가 AI',
        text: '새 대화를 시작했어요. 궁금한 내용을 물어보세요.',
        time: now(),
      },
    ]);
  };

  const ask = (text: string) => {
    if (!text.trim() || streaming) return;
    setMessages((items) => [
      ...items,
      { id: Date.now(), author: '나', text, time: now() },
    ]);
    setPrompt('');
    const full =
      cannedReplies.find(([key]) => text.includes(key))?.[1] ?? fallbackReply;
    setStreaming({ full, shown: '' });
    setStepIndex(0);
    let index = 0;
    timer.current = window.setInterval(() => {
      index += 1;
      setStepIndex(Math.min(2, Math.floor(index / 12)));
      if (index >= full.length) {
        finish(full);
        return;
      }
      setStreaming({ full, shown: full.slice(0, index) });
    }, 35);
  };

  return (
    <div className="assist-layout">
      <aside className="assist-sidebar">
        <Button
          fullWidth
          leading={<ExampleIcon name="plus" />}
          onClick={newChat}
        >
          새 대화
        </Button>
        <SideNav label="대화 목록">
          <SideNavSection title="최근">
            <SideNavItem icon={<ExampleIcon name="chat" />} active>
              소비 분석
            </SideNavItem>
            <SideNavItem icon={<ExampleIcon name="chat" />}>
              적금 목표 상담
            </SideNavItem>
            <SideNavItem icon={<ExampleIcon name="chat" />}>
              카드 추천
            </SideNavItem>
          </SideNavSection>
        </SideNav>
      </aside>
      <div className="assist-main">
        <Chat label="메가 AI 대화" className="assist-chat">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              author={message.author}
              side={message.author === '나' ? 'end' : 'start'}
              time={message.time}
            >
              {message.author === '메가 AI' ? (
                <StreamingText text={message.text} />
              ) : (
                message.text
              )}
            </MessageBubble>
          ))}
          {streaming ? (
            <MessageBubble author="메가 AI" time={now()}>
              <StreamingText text={streaming.shown} streaming />
            </MessageBubble>
          ) : null}
        </Chat>
        {streaming || messages.length > 1 ? (
          <Card variant="outlined" className="assist-activity">
            <AgentActivity
              steps={steps.map((label, index) => ({
                id: label,
                label,
                status: streaming
                  ? index < stepIndex
                    ? 'complete'
                    : index === stepIndex
                      ? 'running'
                      : 'pending'
                  : 'complete',
              }))}
            />
          </Card>
        ) : null}
        <Stack direction="row" gap={2} wrap className="assist-suggestions">
          {suggestions.map((item) => (
            <Chip key={item} variant="outline" onClick={() => setPrompt(item)}>
              {item}
            </Chip>
          ))}
        </Stack>
        <PromptInput
          label="메가 AI에게 질문"
          placeholder="무엇이든 물어보세요"
          value={prompt}
          onValueChange={setPrompt}
          busy={streaming !== null}
          onStop={() => streaming && finish(streaming.shown)}
          onSubmit={ask}
        />
        <Text size="xs" tone="muted">
          예제 답변이에요. 실제 금융 데이터를 조회하지 않아요.
        </Text>
      </div>
    </div>
  );
}

// ---------- 모바일 앱 홈 ----------

export function MobileHomeExample() {
  const [tab, setTab] = useState('home');
  const [claimed, setClaimed] = useState<string[]>([]);
  const gifts = ['커피 쿠폰 4,500원', '송금 수수료 면제권', '포인트 2배 적립'];
  return (
    <div className="mobile-frame">
      <div className="mobile-screen">
        <TabPanel active={tab === 'home'} aria-label="홈">
          <Stack gap={5}>
            <Heading size="lg">좋은 아침이에요, 메가님</Heading>
            <Card padding="lg" className="mobile-balance">
              <Stack gap={4}>
                <Text tone="muted">생활비 통장</Text>
                <Amount value={2340000} size="xl" />
                <Stack direction="row" gap={2}>
                  <Button fullWidth onClick={() => setTab('transfer')}>
                    송금
                  </Button>
                  <Button fullWidth variant="weak">
                    채우기
                  </Button>
                </Stack>
              </Stack>
            </Card>
            <div className="mobile-quick">
              {(
                [
                  ['card', '카드'],
                  ['chart', '투자'],
                  ['gift', '혜택'],
                  ['receipt', '내역'],
                ] as const
              ).map(([icon, label]) => (
                <button key={label} type="button" className="mobile-tile">
                  <ExampleIcon name={icon} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <Carousel label="추천 소식">
              <Card variant="filled">
                <Badge tone="brand">이벤트</Badge>
                <Heading size="sm">친구 초대하면 1만 원</Heading>
              </Card>
              <Card variant="filled">
                <Badge tone="success">새 기능</Badge>
                <Heading size="sm">AI 소비 리포트가 나왔어요</Heading>
              </Card>
            </Carousel>
            <Card>
              <Heading size="sm">최근 내역</Heading>
              <ListRow
                leading={
                  <span className="example-icon" data-tone="orange">
                    ☕
                  </span>
                }
                title="동네 카페"
                description="오늘 10:24"
                trailing={<Amount value={-4500} />}
              />
              <ListRow
                leading={
                  <span className="example-icon" data-tone="blue">
                    ↗
                  </span>
                }
                title="김메가님에게 송금"
                description="어제 18:30"
                trailing={<Amount value={-30000} />}
              />
            </Card>
          </Stack>
        </TabPanel>
        <TabPanel active={tab === 'benefit'} aria-label="혜택">
          <Stack gap={4}>
            <Heading size="lg">오늘의 혜택</Heading>
            {gifts.map((gift) => (
              <Card key={gift}>
                <ListRow
                  leading={
                    <span className="example-icon" data-tone="yellow">
                      <ExampleIcon name="gift" />
                    </span>
                  }
                  title={gift}
                  description="오늘까지"
                  trailing={
                    claimed.includes(gift) ? (
                      <Badge tone="success">받음</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setClaimed((items) => [...items, gift])}
                      >
                        받기
                      </Button>
                    )
                  }
                />
              </Card>
            ))}
          </Stack>
        </TabPanel>
        <TabPanel active={tab === 'transfer'} aria-label="송금">
          <Stack gap={4}>
            <Heading size="lg">누구에게 보낼까요?</Heading>
            <SearchInput
              aria-label="받는 사람 검색"
              variant="box"
              placeholder="이름, 계좌번호"
            />
            <Card>
              {['이하늘', '박서준', '최유진'].map((name) => (
                <ListRow
                  key={name}
                  leading={<Avatar name={name} size="sm" />}
                  title={name}
                  description="메가뱅크 · 최근 송금"
                  trailing={<ExampleIcon name="arrow" />}
                />
              ))}
            </Card>
          </Stack>
        </TabPanel>
        <TabPanel active={tab === 'stock'} aria-label="증권">
          <Stack gap={4}>
            <Heading size="lg">내 투자</Heading>
            <Card padding="lg">
              <Stat
                label="총 평가 금액"
                value="4,120,000"
                unit="원"
                delta={{ value: '3.2%', direction: 'up' }}
              />
            </Card>
            <Card>
              {[
                ['삼성전자', 72800, -1.22],
                ['SOXL', 166093, 5.48],
              ].map(([name, price, change]) => (
                <ListRow
                  key={String(name)}
                  title={String(name)}
                  trailing={
                    <Stack gap={0} align="end">
                      <Amount value={Number(price)} />
                      <Amount
                        value={Number(change)}
                        currency="%"
                        signed
                        tone="auto"
                        size="sm"
                      />
                    </Stack>
                  }
                />
              ))}
            </Card>
          </Stack>
        </TabPanel>
        <TabPanel active={tab === 'all'} aria-label="전체">
          <Stack gap={4}>
            <Heading size="lg">전체</Heading>
            <Card>
              {(
                [
                  ['user', '내 정보'],
                  ['bell', '알림 설정'],
                  ['shield', '보안'],
                  ['help', '고객센터'],
                  ['logout', '로그아웃'],
                ] as const
              ).map(([icon, label]) => (
                <ListRow
                  key={label}
                  leading={<ExampleIcon name={icon} />}
                  title={label}
                  trailing={<ExampleIcon name="chevronRight" />}
                />
              ))}
            </Card>
          </Stack>
        </TabPanel>
      </div>
      <BottomNavigation
        className="mobile-nav"
        label="앱 메뉴"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'home', label: '홈', icon: <ExampleIcon name="home" /> },
          {
            value: 'benefit',
            label: '혜택',
            icon: <ExampleIcon name="gift" />,
          },
          {
            value: 'transfer',
            label: '송금',
            icon: <ExampleIcon name="send" />,
          },
          { value: 'stock', label: '증권', icon: <ExampleIcon name="chart" /> },
          { value: 'all', label: '전체', icon: <ExampleIcon name="menu" /> },
        ]}
      />
    </div>
  );
}

// ---------- 상태 화면 모음 ----------

export function StatesExample() {
  const [retry, setRetry] = useState<'idle' | 'loading' | 'done'>('idle');
  const [loadingDemo, setLoadingDemo] = useState(true);
  const [tour, setTour] = useState<number | null>(null);
  const [offline, setOffline] = useState(true);

  useEffect(() => {
    if (retry !== 'loading') return;
    const id = window.setTimeout(() => setRetry('done'), 1000);
    return () => window.clearTimeout(id);
  }, [retry]);

  return (
    <Stack gap={5} className="states">
      {offline ? (
        <Banner
          tone="warning"
          icon={<ExampleIcon name="globe" />}
          title="인터넷 연결이 끊겼어요"
          description="연결되면 자동으로 다시 불러와요."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setOffline(false)}
            >
              다시 연결
            </Button>
          }
          onDismiss={() => setOffline(false)}
        />
      ) : null}
      <Grid minItemWidth={300} gap={4}>
        <Card padding="lg">
          <ErrorState
            title="페이지를 찾을 수 없어요"
            description="주소가 바뀌었거나 삭제된 페이지예요."
            actions={
              <LinkButton href="#home" variant="weak">
                홈으로
              </LinkButton>
            }
          />
        </Card>
        <Card padding="lg">
          {retry === 'done' ? (
            <Stack gap={3}>
              <Message tone="success" title="다시 불러왔어요" />
              <Button variant="text" size="sm" onClick={() => setRetry('idle')}>
                오류 상태 다시 보기
              </Button>
            </Stack>
          ) : (
            <ErrorState
              title="잠시 문제가 생겼어요"
              description="서버가 응답하지 않아요. 잠시 후 다시 시도해 주세요."
              actions={
                <Button
                  variant="weak"
                  loading={retry === 'loading'}
                  onClick={() => setRetry('loading')}
                >
                  다시 시도
                </Button>
              }
            />
          )}
        </Card>
        <Card padding="lg">
          <Stack gap={4}>
            <SearchInput aria-label="검색" defaultValue="메가 데스크 램프" />
            <EmptyState
              icon={<ExampleIcon name="search" />}
              title="검색 결과가 없어요"
              description="다른 검색어로 다시 찾아보세요."
            />
          </Stack>
        </Card>
        <Card padding="lg">
          <Result
            tone="info"
            title="서비스 점검 안내"
            description="9월 10일 02:00 – 04:00에는 송금이 잠시 멈춰요."
            actions={<Button variant="weak">점검 일정 자세히</Button>}
          />
        </Card>
        <Card padding="lg">
          <Stack gap={4}>
            <Heading size="sm">불러오는 중</Heading>
            <Skeleton lines={3} />
          </Stack>
        </Card>
        <Card padding="lg">
          <Stack gap={4}>
            <Heading size="sm">둘러보기</Heading>
            <Text size="sm" tone="secondary">
              처음 방문한 사용자에게 핵심 기능을 3단계로 안내해요.
            </Text>
            <Button variant="weak" onClick={() => setTour(0)}>
              둘러보기 시작
            </Button>
          </Stack>
        </Card>
      </Grid>
      <Separator />
      <Card padding="lg">
        <Stack gap={4}>
          <Switch
            label="로딩 상태 보기"
            checked={loadingDemo}
            onChange={(event) => setLoadingDemo(event.target.checked)}
          />
          {loadingDemo ? (
            <Stack gap={3} aria-busy="true" aria-label="내 계좌 불러오는 중">
              <Skeleton width="30%" />
              <Skeleton shape="rect" height={56} />
              <Skeleton shape="rect" height={56} />
            </Stack>
          ) : (
            <div>
              <Heading size="sm">내 계좌</Heading>
              <ListRow
                leading={
                  <span className="example-icon" data-tone="blue">
                    ₩
                  </span>
                }
                title="생활비 통장"
                description="메가뱅크 · 1234"
                trailing={<Amount value={2340000} />}
              />
              <ListRow
                leading={
                  <span className="example-icon" data-tone="yellow">
                    S
                  </span>
                }
                title="차곡차곡 적금"
                description="매달 25일 자동 저축"
                trailing={<Amount value={8000000} />}
              />
            </div>
          )}
        </Stack>
      </Card>
      <Tour
        open={tour !== null}
        onClose={() => setTour(null)}
        current={tour ?? 0}
        onStepChange={setTour}
        steps={[
          {
            title: '홈에서 자산을 한눈에',
            description: '모든 계좌와 카드 잔액을 한 화면에서 봐요.',
          },
          {
            title: '송금은 3초면 충분해요',
            description: '받는 사람을 고르고 금액만 입력하면 끝이에요.',
          },
          {
            title: '혜택은 놓치지 마세요',
            description: '나에게 맞는 혜택을 매일 골라 드려요.',
          },
        ]}
      />
    </Stack>
  );
}
