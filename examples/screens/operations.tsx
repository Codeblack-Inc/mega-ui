import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  DataGrid,
  DescriptionList,
  Drawer,
  Heading,
  Input,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Stack,
  Stat,
  Text,
  Timeline,
  ToastProvider,
  useToast,
  VirtualTable,
  type DataColumn,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';

const money = (value: number) => `${value.toLocaleString('ko-KR')}원`;
const PAGE_SIZE = 10;

type Order = {
  id: string;
  customer: string;
  channel: string;
  status: '결제완료' | '상품준비' | '배송중' | '배송지연' | '취소요청';
  carrier: string;
  amount: number;
  orderedAt: string;
  sla: string;
};

const orderStatuses = [
  '결제완료',
  '상품준비',
  '배송중',
  '배송지연',
  '취소요청',
] as const;
const orderRows: Order[] = Array.from({ length: 47 }, (_, index) => ({
  id: `ME-${String(2609091801 + index)}`,
  customer: ['김서윤', '이도현', '박하린', '최준호', '정민지', '한지우'][
    index % 6
  ]!,
  channel: ['자사몰', '스마트스토어', '쿠팡', '29CM'][index % 4]!,
  status: orderStatuses[index % orderStatuses.length]!,
  carrier: ['CJ대한통운', '한진택배', '롯데택배'][index % 3]!,
  amount: 23800 + ((index * 17300) % 310000),
  orderedAt: `09-09 ${String(18 - (index % 9)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}`,
  sla: index % 5 === 3 ? '2시간 초과' : `${20 + (index % 8) * 13}분 남음`,
}));

const orderTone = (status: Order['status']) =>
  status === '배송지연' || status === '취소요청'
    ? 'danger'
    : status === '배송중'
      ? 'brand'
      : status === '결제완료'
        ? 'success'
        : 'warning';

export function OrderOperationsExample() {
  return (
    <ToastProvider>
      <OrderOperations />
    </ToastProvider>
  );
}

function OrderOperations() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('전체 상태');
  const [channel, setChannel] = useState('전체 채널');
  const [carrier, setCarrier] = useState('전체 택배사');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<Order | null>(null);

  const filtered = orderRows.filter(
    (order) =>
      (status === '전체 상태' || order.status === status) &&
      (channel === '전체 채널' || order.channel === channel) &&
      (carrier === '전체 택배사' || order.carrier === carrier) &&
      `${order.id} ${order.customer}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const reset = () => {
    setQuery('');
    setStatus('전체 상태');
    setChannel('전체 채널');
    setCarrier('전체 택배사');
    setPage(1);
    setSelected([]);
  };
  const columns: DataColumn<Order>[] = [
    {
      key: 'id',
      header: '주문번호',
      render: (_, order) => (
        <button className="ops-link" onClick={() => setDetail(order)}>
          {order.id}
        </button>
      ),
    },
    { key: 'orderedAt', header: '주문 시각' },
    { key: 'customer', header: '고객' },
    { key: 'channel', header: '판매 채널' },
    {
      key: 'status',
      header: '처리 상태',
      render: (_, order) => (
        <Badge tone={orderTone(order.status)}>{order.status}</Badge>
      ),
    },
    { key: 'carrier', header: '택배사' },
    {
      key: 'amount',
      header: '결제 금액',
      numeric: true,
      render: (value) => money(value as number),
    },
    {
      key: 'sla',
      header: '처리 SLA',
      render: (_, order) => (
        <Text
          as="span"
          size="sm"
          tone={order.sla.includes('초과') ? 'danger' : 'muted'}
        >
          {order.sla}
        </Text>
      ),
    },
  ];

  return (
    <div className="ops-screen">
      <PageHeader
        title="주문 운영 관제"
        description="18,426건의 주문을 채널별로 모니터링하고 배송 예외를 처리합니다."
        actions={
          <>
            <Button
              variant="secondary"
              leading={<ExampleIcon name="download" />}
            >
              내보내기
            </Button>
            <Button>주문 등록</Button>
          </>
        }
      />
      <div className="ops-kpis">
        <Card>
          <Stat
            label="오늘 주문"
            value="18,426건"
            delta={{ value: '어제보다 12.4% 증가', direction: 'up' }}
          />
        </Card>
        <Card>
          <Stat label="출고 대기" value="1,284건" hint="14시 마감 826건" />
        </Card>
        <Card>
          <Stat
            label="배송 지연"
            value="73건"
            delta={{ value: '즉시 확인 필요', direction: 'down' }}
          />
        </Card>
        <Card>
          <Stat label="취소 요청" value="28건" hint="평균 처리 11분" />
        </Card>
      </div>
      <Card className="ops-card" padding="sm">
        <div className="ops-saved">
          <Text size="sm" weight="semibold">
            저장된 보기
          </Text>
          <Chip selected>전체 주문</Chip>
          <Chip>오늘 출고</Chip>
          <Chip>배송 지연 73</Chip>
          <Chip>취소 검토 28</Chip>
        </div>
        <div className="ops-filters">
          <SearchInput
            aria-label="주문 검색"
            placeholder="주문번호, 고객명 검색"
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setPage(1);
            }}
          />
          <Select
            aria-label="처리 상태"
            value={status}
            onChange={(e) => {
              setStatus(e.currentTarget.value);
              setPage(1);
            }}
          >
            {['전체 상태', ...orderStatuses].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          <Select
            aria-label="판매 채널"
            value={channel}
            onChange={(e) => {
              setChannel(e.currentTarget.value);
              setPage(1);
            }}
          >
            {['전체 채널', '자사몰', '스마트스토어', '쿠팡', '29CM'].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </Select>
          <Select
            aria-label="택배사"
            value={carrier}
            onChange={(e) => {
              setCarrier(e.currentTarget.value);
              setPage(1);
            }}
          >
            {['전체 택배사', 'CJ대한통운', '한진택배', '롯데택배'].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </Select>
          <Button variant="text" onClick={reset}>
            초기화
          </Button>
        </div>
        <details className="ops-advanced">
          <summary>상세 검색 조건</summary>
          <div>
            <label>
              주문일 시작
              <Input type="date" defaultValue="2026-09-01" />
            </label>
            <label>
              주문일 종료
              <Input type="date" defaultValue="2026-09-09" />
            </label>
            <label>
              최소 결제금액
              <Input type="number" placeholder="0" />
            </label>
            <label>
              상품 SKU
              <Input placeholder="예: SKU-39201" />
            </label>
          </div>
        </details>
        {selected.length ? (
          <div className="ops-bulk">
            <Text weight="semibold">{selected.length}건 선택</Text>
            <Stack direction="row" gap={2}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  toast({ title: '송장을 일괄 출력했어요', tone: 'success' })
                }
              >
                송장 출력
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast({ title: '출고 처리했어요', tone: 'success' });
                  setSelected([]);
                }}
              >
                출고 처리
              </Button>
            </Stack>
          </div>
        ) : null}
        <div className="ops-table">
          <DataGrid
            label="주문 운영 목록"
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            selectedIds={selected}
            onSelectionChange={setSelected}
          />
        </div>
        <div className="ops-pagination">
          <Text size="sm" tone="muted">
            검색 결과 {filtered.length.toLocaleString()}건 · 전체 18,426건
          </Text>
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      </Card>
      <Drawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.id ?? ''}
        size="md"
        actions={
          <Button
            onClick={() => {
              setDetail(null);
              toast({ title: '처리 내용을 저장했어요', tone: 'success' });
            }}
          >
            처리 내용 저장
          </Button>
        }
      >
        {detail ? (
          <Stack gap={5}>
            <Alert tone={detail.status === '배송지연' ? 'warning' : 'info'}>
              {detail.status === '배송지연'
                ? '택배사 집하 스캔이 예정 시각보다 2시간 늦습니다.'
                : '현재 정상 처리 중인 주문입니다.'}
            </Alert>
            <DescriptionList
              items={[
                { term: '고객', description: detail.customer },
                { term: '판매 채널', description: detail.channel },
                { term: '결제 금액', description: money(detail.amount) },
                { term: '택배사', description: detail.carrier },
              ]}
            />
            <Heading size="sm">처리 이력</Heading>
            <Timeline
              items={[
                { id: '3', title: '물류센터 피킹 요청', time: '오늘 18:42' },
                {
                  id: '2',
                  title: '결제 승인',
                  description: '카드 일시불',
                  time: '오늘 18:39',
                },
                {
                  id: '1',
                  title: '주문 접수',
                  description: detail.channel,
                  time: '오늘 18:38',
                },
              ]}
            />
          </Stack>
        ) : null}
      </Drawer>
    </div>
  );
}

type Settlement = {
  id: string;
  partner: string;
  cycle: string;
  sales: number;
  fee: number;
  expected: number;
  deposited: number;
  difference: number;
  status: '일치' | '차이 발생' | '입금 대기';
};

const settlementRows: Settlement[] = Array.from({ length: 34 }, (_, index) => {
  const sales = 5400000 + ((index * 1183400) % 39000000);
  const fee = Math.round(sales * (0.028 + (index % 3) * 0.004));
  const expected = sales - fee;
  const status: Settlement['status'] =
    index % 7 === 2 ? '차이 발생' : index % 5 === 1 ? '입금 대기' : '일치';
  const difference = status === '차이 발생' ? (index % 2 ? -18400 : 32700) : 0;
  return {
    id: `ST-202609-${String(index + 1).padStart(3, '0')}`,
    partner: ['스마트스토어', '쿠팡', '29CM', '무신사', '카카오쇼핑'][
      index % 5
    ]!,
    cycle: `09.${String(1 + (index % 9)).padStart(2, '0')}–09.${String(2 + (index % 9)).padStart(2, '0')}`,
    sales,
    fee,
    expected,
    deposited: status === '입금 대기' ? 0 : expected + difference,
    difference,
    status,
  };
});

export function SettlementReconciliationExample() {
  return (
    <ToastProvider>
      <SettlementReconciliation />
    </ToastProvider>
  );
}

function SettlementReconciliation() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [partner, setPartner] = useState('전체 파트너');
  const [status, setStatus] = useState('전체 상태');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<Settlement | null>(null);
  const rows = settlementRows.filter(
    (row) =>
      (partner === '전체 파트너' || row.partner === partner) &&
      (status === '전체 상태' || row.status === status) &&
      `${row.id} ${row.partner}`.includes(query),
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columns: DataColumn<Settlement>[] = [
    {
      key: 'id',
      header: '정산 ID',
      render: (_, row) => (
        <button className="ops-link" onClick={() => setDetail(row)}>
          {row.id}
        </button>
      ),
    },
    { key: 'partner', header: '판매처' },
    { key: 'cycle', header: '정산 기간' },
    {
      key: 'sales',
      header: '주문 금액',
      numeric: true,
      render: (value) => money(value as number),
    },
    {
      key: 'fee',
      header: '수수료',
      numeric: true,
      render: (value) => money(value as number),
    },
    {
      key: 'expected',
      header: '예정액',
      numeric: true,
      render: (value) => money(value as number),
    },
    {
      key: 'deposited',
      header: '입금액',
      numeric: true,
      render: (value) => (value ? money(value as number) : '—'),
    },
    {
      key: 'difference',
      header: '차이',
      numeric: true,
      render: (value) => (
        <Text as="span" size="sm" tone={value ? 'danger' : 'muted'}>
          {value
            ? `${Number(value) > 0 ? '+' : ''}${money(value as number)}`
            : '0원'}
        </Text>
      ),
    },
    {
      key: 'status',
      header: '대사 상태',
      render: (_, row) => (
        <Badge
          tone={
            row.status === '일치'
              ? 'success'
              : row.status === '차이 발생'
                ? 'danger'
                : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];
  return (
    <div className="ops-screen settlement-screen">
      <PageHeader
        title="채널 정산 대사"
        description="주문 원장과 판매처 입금 내역을 맞추고 차액의 원인을 추적합니다."
        actions={
          <Button leading={<ExampleIcon name="upload" />}>
            입금 파일 불러오기
          </Button>
        }
      />
      <Alert tone="warning">
        <strong>대사 차이 7건 · 184,900원</strong>
        <br />
        쿠팡 3건, 스마트스토어 2건, 기타 2건의 확인이 필요합니다.
      </Alert>
      <div className="ops-kpis ops-kpis--three">
        <Card>
          <Stat
            label="9월 정산 예정"
            value="₩1,284,390,200"
            hint="38개 판매처"
          />
        </Card>
        <Card>
          <Stat
            label="입금 완료"
            value="₩982,114,600"
            delta={{ value: '76.5% 완료', direction: 'up' }}
          />
        </Card>
        <Card>
          <Stat
            label="미확인 차이"
            value="₩184,900"
            delta={{ value: '7건 확인 필요', direction: 'down' }}
          />
        </Card>
      </div>
      <Card className="ops-card" padding="sm">
        <div className="ops-filters">
          <SearchInput
            aria-label="정산 검색"
            placeholder="정산 ID, 판매처 검색"
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setPage(1);
            }}
          />
          <Select
            aria-label="판매처"
            value={partner}
            onChange={(e) => {
              setPartner(e.currentTarget.value);
              setPage(1);
            }}
          >
            {[
              '전체 파트너',
              '스마트스토어',
              '쿠팡',
              '29CM',
              '무신사',
              '카카오쇼핑',
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          <Select
            aria-label="대사 상태"
            value={status}
            onChange={(e) => {
              setStatus(e.currentTarget.value);
              setPage(1);
            }}
          >
            {['전체 상태', '일치', '차이 발생', '입금 대기'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          <Input
            aria-label="정산 시작일"
            type="date"
            defaultValue="2026-09-01"
          />
          <Input
            aria-label="정산 종료일"
            type="date"
            defaultValue="2026-09-09"
          />
        </div>
        {selected.length ? (
          <div className="ops-bulk">
            <Text weight="semibold">
              {selected.length}건 선택 · 차이 합계{' '}
              {money(
                rows
                  .filter((row) => selected.includes(row.id))
                  .reduce((sum, row) => sum + row.difference, 0),
              )}
            </Text>
            <Button
              size="sm"
              onClick={() => {
                toast({ title: '검토 완료로 처리했어요', tone: 'success' });
                setSelected([]);
              }}
            >
              검토 완료
            </Button>
          </div>
        ) : null}
        <div className="ops-table">
          <DataGrid
            label="정산 대사 목록"
            rows={visibleRows}
            columns={columns}
            getRowId={(row) => row.id}
            selectedIds={selected}
            onSelectionChange={setSelected}
          />
        </div>
        <div className="ops-pagination">
          <Text size="sm" tone="muted">
            검색 결과 {rows.length}건 · 마지막 동기화 오늘 19:02
          </Text>
          <Stack direction="row" gap={3} align="center">
            <Button
              size="sm"
              variant="text"
              leading={<ExampleIcon name="refresh" />}
            >
              다시 동기화
            </Button>
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </Stack>
        </div>
      </Card>
      <Drawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        title="대사 상세"
        size="md"
      >
        {detail ? (
          <Stack gap={5}>
            <Stack direction="row" justify="between">
              <div>
                <Text size="sm" tone="muted">
                  {detail.id}
                </Text>
                <Heading size="md">{detail.partner}</Heading>
              </div>
              <Badge
                tone={
                  detail.status === '차이 발생'
                    ? 'danger'
                    : detail.status === '일치'
                      ? 'success'
                      : 'warning'
                }
              >
                {detail.status}
              </Badge>
            </Stack>
            <DescriptionList
              items={[
                { term: '주문 금액', description: money(detail.sales) },
                { term: '수수료', description: money(detail.fee) },
                { term: '정산 예정액', description: money(detail.expected) },
                {
                  term: '실제 입금액',
                  description: detail.deposited
                    ? money(detail.deposited)
                    : '입금 전',
                },
                { term: '차이', description: money(detail.difference) },
              ]}
            />
            {detail.difference ? (
              <Alert tone="danger">
                판매처 쿠폰 분담금이 원장에 반영되지 않은 주문 2건을 찾았습니다.
              </Alert>
            ) : (
              <Alert tone="success">
                주문 원장과 입금 내역이 모두 일치합니다.
              </Alert>
            )}
          </Stack>
        ) : null}
      </Drawer>
    </div>
  );
}

type LogRow = {
  id: string;
  time: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  service: string;
  trace: string;
  message: string;
  latency: number;
};
const logRows: LogRow[] = Array.from({ length: 240 }, (_, index) => ({
  id: `log-${index}`,
  time: `19:${String(8 - Math.floor(index / 60)).padStart(2, '0')}:${String(59 - (index % 60)).padStart(2, '0')}.${String((index * 37) % 1000).padStart(3, '0')}`,
  level: index % 17 === 0 ? 'ERROR' : index % 7 === 0 ? 'WARN' : 'INFO',
  service: ['checkout-api', 'payment-worker', 'order-api', 'inventory-sync'][
    index % 4
  ]!,
  trace: `7fd${(884129 + index).toString(16)}`,
  message:
    index % 17 === 0
      ? 'Payment gateway timed out after 3000ms'
      : index % 7 === 0
        ? 'Inventory lock retry scheduled'
        : [
            'Order state transition completed',
            'Webhook delivered with status 200',
            'Inventory reservation confirmed',
          ][index % 3]!,
  latency: 18 + ((index * 83) % 3400),
}));

export function LogExplorerExample() {
  return <LogExplorer />;
}

function LogExplorer() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('ALL');
  const [service, setService] = useState('전체 서비스');
  const [live, setLive] = useState(true);
  const [detail, setDetail] = useState<LogRow | null>(null);
  const rows = useMemo(
    () =>
      logRows.filter(
        (row) =>
          (level === 'ALL' || row.level === level) &&
          (service === '전체 서비스' || row.service === service) &&
          `${row.message} ${row.trace}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [level, query, service],
  );
  const columns: DataColumn<LogRow>[] = [
    { key: 'time', header: '시간', width: 110 },
    {
      key: 'level',
      header: '레벨',
      width: 80,
      render: (_, row) => (
        <Badge
          tone={
            row.level === 'ERROR'
              ? 'danger'
              : row.level === 'WARN'
                ? 'warning'
                : 'neutral'
          }
        >
          {row.level}
        </Badge>
      ),
    },
    { key: 'service', header: '서비스', width: 150 },
    { key: 'trace', header: 'Trace ID', width: 120 },
    {
      key: 'message',
      header: '메시지',
      render: (_, row) => (
        <button className="log-message" onClick={() => setDetail(row)}>
          {row.message}
        </button>
      ),
    },
    {
      key: 'latency',
      header: '지연',
      numeric: true,
      width: 80,
      render: (value) => `${value}ms`,
    },
  ];
  return (
    <div className="ops-screen log-screen">
      <PageHeader
        title="프로덕션 로그 탐색기"
        description="4개 서비스에서 초당 약 12,800건의 이벤트를 수집하고 있습니다."
        actions={
          <>
            <Button
              variant="secondary"
              leading={<ExampleIcon name="download" />}
            >
              CSV 내보내기
            </Button>
            <Button
              variant={live ? 'primary' : 'secondary'}
              onClick={() => setLive((value) => !value)}
            >
              {live ? '● 실시간 수신 중' : '▶ 수신 재개'}
            </Button>
          </>
        }
      />
      <div className="log-health">
        <div>
          <span className="log-health__dot" />
          전체 시스템 정상
        </div>
        <Text size="sm" tone="muted">
          수집 지연 1.2초 · 인덱스 보존 14일 · 서울 리전
        </Text>
      </div>
      <Card className="log-query" padding="sm">
        <SearchInput
          aria-label="로그 쿼리"
          placeholder='메시지 또는 Trace ID 검색 · 예: "timeout"'
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        <Button>검색</Button>
      </Card>
      <div className="log-toolbar">
        <Stack direction="row" gap={2} wrap>
          {['ALL', 'ERROR', 'WARN', 'INFO'].map((item) => (
            <Chip
              key={item}
              selected={level === item}
              onClick={() => setLevel(item)}
            >
              {item}
              {item === 'ERROR' ? ' 15' : item === 'WARN' ? ' 34' : ''}
            </Chip>
          ))}
        </Stack>
        <Stack direction="row" gap={2} wrap>
          <Select aria-label="환경" defaultValue="production">
            <option>production</option>
            <option>staging</option>
          </Select>
          <Select
            aria-label="서비스"
            value={service}
            onChange={(e) => setService(e.currentTarget.value)}
          >
            {[
              '전체 서비스',
              'checkout-api',
              'payment-worker',
              'order-api',
              'inventory-sync',
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          <Select aria-label="조회 구간" defaultValue="최근 15분">
            <option>최근 15분</option>
            <option>최근 1시간</option>
            <option>최근 24시간</option>
          </Select>
        </Stack>
      </div>
      <Card className="log-chart" padding="sm">
        <div className="log-chart__head">
          <Text weight="semibold">이벤트 빈도</Text>
          <Text size="sm" tone="muted">
            총 192,438건 · 오류율 0.08%
          </Text>
        </div>
        <div className="log-bars" aria-label="최근 15분 이벤트 빈도 막대 차트">
          {[
            38, 44, 41, 55, 48, 62, 58, 71, 52, 49, 66, 81, 57, 63, 74, 51, 43,
            59, 68, 54, 47, 61, 77, 69, 56, 64, 72, 86, 62, 58,
          ].map((height, index) => (
            <i
              key={index}
              style={{ height: `${height}%` }}
              data-error={index === 11 || index === 27 || undefined}
            />
          ))}
        </div>
      </Card>
      <Card className="log-table" padding="sm">
        <div className="log-table__head">
          <Text size="sm" tone="muted">
            필터 결과 {rows.length.toLocaleString()}건 · 새 이벤트 24건
          </Text>
          <Button size="sm" variant="text">
            맨 아래로 이동
          </Button>
        </div>
        <VirtualTable
          label="프로덕션 로그"
          height={440}
          rowHeight={42}
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
        />
      </Card>
      <Drawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        title="이벤트 상세"
        size="md"
      >
        {detail ? (
          <Stack gap={5}>
            <Badge
              tone={
                detail.level === 'ERROR'
                  ? 'danger'
                  : detail.level === 'WARN'
                    ? 'warning'
                    : 'neutral'
              }
            >
              {detail.level}
            </Badge>
            <DescriptionList
              items={[
                {
                  term: '발생 시각',
                  description: `2026-09-09 ${detail.time} KST`,
                },
                { term: '서비스', description: detail.service },
                { term: 'Trace ID', description: detail.trace },
                { term: '응답 시간', description: `${detail.latency}ms` },
              ]}
            />
            <div className="log-payload">
              <Text size="xs">event.payload</Text>
              <pre>
                {JSON.stringify(
                  {
                    message: detail.message,
                    region: 'ap-northeast-2',
                    attempt: detail.level === 'INFO' ? 1 : 3,
                    orderId: 'ME-2609091847',
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
            <Button variant="secondary">이 Trace만 보기</Button>
          </Stack>
        ) : null}
      </Drawer>
    </div>
  );
}
