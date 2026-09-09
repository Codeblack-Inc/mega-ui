import { useState } from 'react';
import {
  Amount,
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  Dialog,
  EmptyState,
  Heading,
  ListRow,
  Menu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  NavRail,
  NavRailItem,
  Pagination,
  SideNav,
  SideNavItem,
  SideNavSection,
  Stat,
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
import { ExampleIcon } from './icons';

const payments = [
  {
    id: 1,
    time: '09.08 14:32',
    name: '메가 데일리 티셔츠 외 1건',
    method: '신용카드',
    amount: 58000,
    account: '메가뱅크',
  },
  {
    id: 2,
    time: '09.08 14:25',
    name: '시그니처 머그컵',
    method: '간편결제',
    amount: 24000,
    account: '메가뱅크',
  },
  {
    id: 3,
    time: '09.08 14:18',
    name: '에센셜 코튼 셔츠',
    method: '신용카드',
    amount: 79000,
    account: '국민은행',
  },
  {
    id: 4,
    time: '09.08 13:56',
    name: '위클리 노트 세트',
    method: '계좌이체',
    amount: 18000,
    account: '메가뱅크',
  },
  {
    id: 5,
    time: '09.08 13:41',
    name: '라이트 데일리 백',
    method: '간편결제',
    amount: 42000,
    account: '국민은행',
  },
  {
    id: 6,
    time: '09.08 13:22',
    name: '컴포트 스니커즈',
    method: '신용카드',
    amount: 89000,
    account: '메가뱅크',
  },
  {
    id: 7,
    time: '09.08 12:58',
    name: '스트라이프 티셔츠',
    method: '신용카드',
    amount: 39000,
    account: '국민은행',
  },
  {
    id: 8,
    time: '09.08 12:40',
    name: '메가 데스크 매트',
    method: '간편결제',
    amount: 32000,
    account: '메가뱅크',
  },
  {
    id: 9,
    time: '09.08 12:12',
    name: '트래블 파우치',
    method: '계좌이체',
    amount: 21000,
    account: '국민은행',
  },
  {
    id: 10,
    time: '09.08 11:48',
    name: '미니 크로스백',
    method: '신용카드',
    amount: 48000,
    account: '메가뱅크',
  },
  {
    id: 11,
    time: '09.08 11:31',
    name: '데일리 양말 세트',
    method: '간편결제',
    amount: 15000,
    account: '국민은행',
  },
  {
    id: 12,
    time: '09.08 11:09',
    name: '클래식 볼캡',
    method: '신용카드',
    amount: 29000,
    account: '메가뱅크',
  },
];
const notices = [
  {
    title: '[안내] 메가페이먼츠 사칭 이메일 주의',
    category: 'service',
    date: '2026.09.08',
  },
  {
    title: '9월 신용카드 무이자 할부 안내',
    category: 'benefit',
    date: '2026.09.07',
  },
  {
    title: '더 편리해진 정산 내역을 만나보세요',
    category: 'service',
    date: '2026.09.04',
  },
  {
    title: '추석 연휴 정산 일정 안내',
    category: 'service',
    date: '2026.09.02',
  },
  {
    title: '신규 가맹점 혜택을 확인해 보세요',
    category: 'benefit',
    date: '2026.09.01',
  },
];

export function AdminExample() {
  return (
    <ToastProvider>
      <AdminDashboard />
    </ToastProvider>
  );
}

function AdminDashboard() {
  const toast = useToast();
  const [banner, setBanner] = useState(true);
  const [tab, setTab] = useState('payments');
  const [noticeTab, setNoticeTab] = useState('all');
  const [page, setPage] = useState(1);
  const [account, setAccount] = useState('전체');
  const [pending, setPending] = useState<(typeof payments)[number] | null>(
    null,
  );
  const [cancelled, setCancelled] = useState<number[]>([]);
  const [detail, setDetail] = useState<string | null>(null);
  const filtered = payments.filter(
    (payment) => account === '전체' || payment.account === account,
  );
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand__symbol">m</span> payments
        </div>
        <NavRail label="비즈니스 서비스" className="admin-services">
          {(['전체', '쇼핑', '매출', '페이', 'PG', '설정'] as const).map(
            (label, index) => (
              <NavRailItem
                key={label}
                label={label}
                icon={
                  <ExampleIcon
                    name={
                      (
                        [
                          'grid',
                          'bag',
                          'chart',
                          'card',
                          'receipt',
                          'settings',
                        ] as const
                      )[index]
                    }
                  />
                }
                active={label === 'PG'}
                onClick={() => setDetail(`${label} 서비스`)}
              />
            ),
          )}
        </NavRail>
        <Button
          variant="outline"
          fullWidth
          className="admin-store"
          trailing={<ExampleIcon name="chevron" />}
          onClick={() => setDetail('메가스토어 주식회사')}
        >
          메가스토어 주식회사
        </Button>
        <SideNav label="가맹점 관리">
          <SideNavSection>
            <SideNavItem
              icon={<ExampleIcon name="home" />}
              active
              onClick={() => {
                setTab('payments');
                setPage(1);
              }}
            >
              홈
            </SideNavItem>
            <SideNavItem
              icon={<ExampleIcon name="chart" />}
              onClick={() => setTab('settlements')}
            >
              정산내역
            </SideNavItem>
          </SideNavSection>
          <SideNavSection title="결제조회">
            <SideNavItem
              icon={<ExampleIcon name="grid" />}
              badge={
                <Badge
                  variant="dot"
                  tone="danger"
                  className="admin-menu-dot"
                  aria-label="새 소식"
                />
              }
              onClick={() => setTab('payments')}
            >
              통합결제
            </SideNavItem>
            <SideNavItem
              icon={<ExampleIcon name="card" />}
              onClick={() => setTab('payments')}
            >
              신용·체크카드
            </SideNavItem>
            <SideNavItem
              icon={<ExampleIcon name="receipt" />}
              onClick={() => setDetail('현금영수증')}
            >
              현금영수증
            </SideNavItem>
          </SideNavSection>
          <SideNavSection title="결제위젯">
            <SideNavItem
              icon={<ExampleIcon />}
              onClick={() => setDetail('결제 UI 설정')}
            >
              결제 UI 설정
            </SideNavItem>
            <SideNavItem
              icon={<ExampleIcon name="receipt" />}
              onClick={() => setDetail('약관 설정')}
            >
              약관 설정
            </SideNavItem>
          </SideNavSection>
          <SideNavSection title="계약·운영">
            <SideNavItem
              icon={<ExampleIcon name="bag" />}
              onClick={() => setDetail('회사정보')}
            >
              회사정보
            </SideNavItem>
            <SideNavItem
              icon={<ExampleIcon name="settings" />}
              onClick={() => setDetail('사용자 관리')}
            >
              사용자 관리
            </SideNavItem>
          </SideNavSection>
        </SideNav>
        <div className="admin-support">
          <Avatar name="김메가" size="sm" />
          <div>
            <Text size="xs" tone="muted">
              도움이 필요하신가요?
            </Text>
            <Button
              variant="text"
              size="sm"
              onClick={() => setDetail('가맹점 고객센터')}
            >
              고객센터 바로가기 <ExampleIcon name="arrow" />
            </Button>
          </div>
        </div>
      </aside>
      {banner ? (
        <Banner
          className="admin-banner"
          tone="brand"
          icon={<ExampleIcon name="bell" />}
          title="안심정산으로 사장님의 내일을 더 든든하게"
          description="정산한도를 최대 1.5배까지 늘릴 수 있어요"
          action={
            <Button onClick={() => setDetail('안심정산 플랜')}>확인하기</Button>
          }
          onDismiss={() => setBanner(false)}
        />
      ) : null}
      <div className="admin-main">
        <div className="admin-heading">
          <div>
            <Text size="sm" tone="muted">
              메가스토어의 오늘
            </Text>
            <Heading size="xl">2026년 9월 8일</Heading>
          </div>
          <Badge tone="success">정상 운영 중</Badge>
        </div>
        <div className="admin-kpis">
          <Card>
            <Stat
              label="매출액"
              value="3,248,000"
              unit="원"
              delta={{ value: '12.8%', direction: 'up' }}
              hint="어제보다 368,600원 더 팔았어요"
            />
          </Card>
          <Card>
            <Stat
              label="입금 정산액"
              value="2,816,400"
              unit="원"
              delta={{ value: '8.2%', direction: 'up' }}
              hint="오늘 입금이 완료됐어요"
            />
          </Card>
          <Card>
            <Stat
              label="입금 예정 정산액"
              value="1,482,000"
              unit="원"
              delta={{ value: '2.1%', direction: 'down' }}
              hint="다음 입금일 9월 9일"
            />
          </Card>
        </div>
        <Card className="admin-payments">
          <div className="admin-heading">
            <Heading size="md">거래 한눈에 보기</Heading>
            <Menu
              align="end"
              trigger={
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`정산계좌: ${account}`}
                  trailing={<ExampleIcon name="chevron" />}
                >
                  {account === '전체' ? '전체 계좌' : account}
                </Button>
              }
            >
              <MenuLabel>조회할 정산계좌</MenuLabel>
              {['전체', '메가뱅크', '국민은행'].map((bank) => (
                <MenuItem
                  key={bank}
                  onSelect={() => {
                    setAccount(bank);
                    setPage(1);
                  }}
                >
                  {bank}
                </MenuItem>
              ))}
              <MenuSeparator />
              <MenuItem onSelect={() => setDetail('정산계좌 관리')}>
                계좌 관리
              </MenuItem>
            </Menu>
          </div>
          <Tabs
            label="거래 내역"
            variant="underline"
            value={tab}
            onValueChange={setTab}
            items={[
              { value: 'payments', label: '결제 내역', badge: filtered.length },
              { value: 'settlements', label: '정산 보류 내역' },
            ]}
          />
          <TabPanel active={tab === 'payments'} aria-label="결제 내역">
            <div className="admin-table-caption">
              <Text size="xs" tone="muted">
                오늘 00:00 – 23:59 · 총 {filtered.length}건
              </Text>
              <Text size="xs" tone="muted">
                14:32 기준
              </Text>
            </div>
            <Table
              density="compact"
              aria-label="오늘 결제 내역"
              className="admin-table"
            >
              <TableHead>
                <TableRow>
                  {['결제일시', '주문명', '결제수단'].map((label) => (
                    <TableHeaderCell key={label}>{label}</TableHeaderCell>
                  ))}
                  <TableHeaderCell align="end">금액</TableHeaderCell>
                  <TableHeaderCell>상태</TableHeaderCell>
                  <TableHeaderCell aria-label="결제 관리" />
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice((page - 1) * 6, page * 6).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell tone="muted">{payment.time}</TableCell>
                    <TableCell>{payment.name}</TableCell>
                    <TableCell tone="muted">{payment.method}</TableCell>
                    <TableCell numeric>
                      <Amount value={payment.amount} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          cancelled.includes(payment.id) ? 'neutral' : 'success'
                        }
                      >
                        {cancelled.includes(payment.id)
                          ? '취소 완료'
                          : '결제 완료'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={cancelled.includes(payment.id)}
                        onClick={() => setPending(payment)}
                      >
                        취소하기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="admin-pagination">
              <Pagination
                page={page}
                pageCount={Math.ceil(filtered.length / 6)}
                onPageChange={setPage}
              />
            </div>
          </TabPanel>
          <TabPanel active={tab === 'settlements'} aria-label="정산 보류 내역">
            <EmptyState
              icon={<ExampleIcon name="receipt" />}
              title="보류 중인 정산이 없어요"
              description="모든 정산이 예정대로 진행되고 있어요."
              action={
                <Button variant="weak" onClick={() => setTab('payments')}>
                  결제 내역 보기
                </Button>
              }
            />
          </TabPanel>
        </Card>
        <Card className="admin-tip">
          <ExampleIcon name="chart" />
          <div>
            <Heading size="sm">매일의 성장을 함께할게요</Heading>
            <Text size="sm" tone="muted">
              매출과 정산을 한곳에서 확인하고, 비즈니스에 집중하세요.
            </Text>
          </div>
        </Card>
      </div>
      <aside className="admin-right">
        <Card className="admin-promo">
          <span className="admin-promo__card">
            <ExampleIcon name="card" />
          </span>
          <div>
            <Text size="xs" tone="muted">
              메가 비즈니스 카드
            </Text>
            <Heading size="sm">실적·한도 없는 적립</Heading>
            <Button
              variant="text"
              size="xs"
              onClick={() => setDetail('메가 비즈니스 카드')}
            >
              혜택 알아보기 <ExampleIcon name="arrow" />
            </Button>
          </div>
        </Card>
        <Card>
          <Heading size="sm">서비스 바로가기</Heading>
          {[
            '매출액 올리기',
            '정산한도 변경',
            '신용카드 거래내역 취소',
            '회사정보 변경',
            '결제 위젯 UI 설정',
          ].map((label, index) => (
            <ListRow
              key={label}
              title={label}
              leading={
                <span className="admin-service-icon">
                  <ExampleIcon
                    name={
                      (
                        [
                          'chart',
                          'grid',
                          'card',
                          'receipt',
                          'settings',
                        ] as const
                      )[index]
                    }
                  />
                </span>
              }
              trailing={
                <Button
                  variant="ghost"
                  size="xs"
                  aria-label={`${label} 열기`}
                  onClick={() => {
                    if (index === 2) setTab('payments');
                    else setDetail(label);
                  }}
                >
                  {index === 0 ? (
                    <Badge variant="dot" tone="danger">
                      N
                    </Badge>
                  ) : (
                    <ExampleIcon name="chevronRight" />
                  )}
                </Button>
              }
            />
          ))}
        </Card>
        <Card className="admin-notices">
          <Heading size="sm">공지사항</Heading>
          <Tabs
            label="공지사항 분류"
            variant="pill"
            value={noticeTab}
            onValueChange={setNoticeTab}
            items={[
              { value: 'all', label: '전체' },
              { value: 'benefit', label: '혜택' },
              { value: 'service', label: '서비스' },
            ]}
          />
          <div role="tabpanel" aria-label="공지사항 목록">
            {notices
              .filter(
                (notice) =>
                  noticeTab === 'all' || notice.category === noticeTab,
              )
              .map((notice) => (
                <button
                  className="admin-notice"
                  key={notice.title}
                  onClick={() => setDetail(notice.title)}
                >
                  <span>
                    <span className="admin-notice__title">{notice.title}</span>
                    <span className="admin-notice__date">{notice.date}</span>
                  </span>
                  {notice.date >= '2026.09.07' ? (
                    <Badge tone="danger" variant="dot">
                      N
                    </Badge>
                  ) : null}
                </button>
              ))}
          </div>
        </Card>
      </aside>
      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title="결제를 취소할까요?"
        description={
          pending
            ? `${pending.name} · ${pending.amount.toLocaleString('ko-KR')}원 결제를 취소해요.`
            : undefined
        }
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              돌아가기
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!pending) return;
                setCancelled((ids) => [...ids, pending.id]);
                setPending(null);
                toast({
                  title: '결제가 취소됐어요',
                  description: '예제 내역에 반영했어요.',
                  tone: 'success',
                });
              }}
            >
              결제 취소하기
            </Button>
          </>
        }
      />
      <Dialog
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ?? ''}
        description="메가스토어의 비즈니스를 위한 서비스예요. 자세한 내용은 가맹점 고객센터에서 안내받을 수 있어요."
        size="sm"
        actions={<Button onClick={() => setDetail(null)}>확인했어요</Button>}
      />
    </div>
  );
}
