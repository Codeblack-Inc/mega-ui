import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  Card,
  Chat,
  Chip,
  CommandPalette,
  ContextMenu,
  DescriptionList,
  Dialog,
  Field,
  Gallery,
  Heading,
  HoverCard,
  Menu,
  MenuItem,
  MenuSeparator,
  MessageBubble,
  PageHeader,
  PDFViewer,
  Popover,
  PromptInput,
  SearchInput,
  SegmentedControl,
  Select,
  SplitPane,
  Stack,
  Stat,
  Stepper,
  Switch,
  TabPanel,
  Tabs,
  Text,
  Textarea,
  Timeline,
  ToastProvider,
  Tour,
  useToast,
  VirtualTable,
  VisuallyHidden,
  type DataColumn,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';

/* ------------------------------------------------------------------ */
/* 고객 문의 콘솔                                                       */
/* ------------------------------------------------------------------ */

type TicketStatus = '대기' | '처리중' | '보류' | '완료';

interface SupportTicket {
  id: string;
  subject: string;
  detail: string;
  customer: string;
  plan: string;
  channel: string;
  status: TicketStatus;
  priority: '긴급' | '높음' | '보통';
  assignee: string;
  waited: string;
  slaLeft: number;
}

const ticketSubjects = [
  '결제가 두 번 청구됐어요',
  '정산 금액이 주문서와 달라요',
  '앱에서 로그인이 안 돼요',
  '배송지를 바꾸고 싶어요',
  '세금계산서를 다시 받고 싶어요',
  '쿠폰이 자동으로 빠졌어요',
  '주문 취소가 처리되지 않아요',
  '계정 담당자를 바꾸고 싶어요',
];
const ticketDetails = [
  '9월 8일 오후에 같은 금액이 두 번 빠져나갔어요.',
  '주문서에는 128,000원인데 정산서에는 121,600원으로 적혀 있어요.',
  '비밀번호를 바꾼 뒤부터 인증번호 화면에서 멈춰요.',
  '오늘 오전에 주문한 건인데 아직 출고 전이라고 나와요.',
];
const ticketCustomers = [
  '김서윤',
  '이도현',
  '박하린',
  '최준호',
  '정민지',
  '한지우',
];
const ticketPlans = ['비즈니스 연간', '프로 월간', '엔터프라이즈', '스타터'];
const ticketChannels = ['이메일', '실시간 채팅', '전화', '앱 리뷰'];
const ticketAssignees = ['정민지', '오세훈', '배수아', '미배정'];
const ticketStatuses: TicketStatus[] = ['대기', '처리중', '보류', '완료'];

const supportTickets: SupportTicket[] = Array.from(
  { length: 1240 },
  (_, index) => ({
    id: `CS-${String(48210 + index)}`,
    subject: ticketSubjects[index % ticketSubjects.length]!,
    detail: ticketDetails[index % ticketDetails.length]!,
    customer: ticketCustomers[index % ticketCustomers.length]!,
    plan: ticketPlans[index % ticketPlans.length]!,
    channel: ticketChannels[index % ticketChannels.length]!,
    status: ticketStatuses[index % 4]!,
    priority: index % 7 === 0 ? '긴급' : index % 3 === 0 ? '높음' : '보통',
    assignee: ticketAssignees[index % ticketAssignees.length]!,
    waited: `${(index % 9) + 1}시간 ${(index * 13) % 60}분`,
    slaLeft: index % 11 === 4 ? -((index % 40) + 3) : ((index * 7) % 90) + 5,
  }),
);

const statusTone = (status: TicketStatus) =>
  status === '완료'
    ? 'success'
    : status === '처리중'
      ? 'brand'
      : status === '보류'
        ? 'warning'
        : 'neutral';

const ticketFilters = [
  { value: 'all', label: '전체' },
  { value: 'mine', label: '내 담당' },
  { value: 'unassigned', label: '미배정' },
  { value: 'sla', label: 'SLA 초과' },
];

const replyMacros = [
  {
    label: '환불 절차 안내',
    text: '중복 결제 건은 카드사 승인 취소로 처리되고, 카드사 반영까지 영업일 기준 3~5일 걸려요.',
  },
  {
    label: '정산 일정 안내',
    text: '정산서는 매월 5일에 확정되고, 확정 이후 수정분은 다음 달 정산서에 반영돼요.',
  },
  {
    label: '로그인 문제 안내',
    text: '앱을 최신 버전으로 올린 뒤에도 같은 화면에서 멈추면 인증 로그를 확인해 볼게요.',
  },
];

const ROW_HEIGHT = 52;
const LIST_HEIGHT = 468;

export function SupportConsoleExample() {
  return (
    <ToastProvider>
      <SupportConsole />
    </ToastProvider>
  );
}

interface Reply {
  id: string;
  text: string;
  time: string;
}

function SupportConsole() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [statusOverride, setStatusOverride] = useState<
    Record<string, TicketStatus>
  >({});
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [sending, setSending] = useState<string[]>([]);
  const [pendingTicket, setPendingTicket] = useState<SupportTicket | null>(
    null,
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [tab, setTab] = useState('thread');
  const [memo, setMemo] = useState('');
  const [savedMemo, setSavedMemo] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const saveAttempts = useRef(0);
  const sendAttempts = useRef(0);

  const statusOf = (ticket: SupportTicket) =>
    statusOverride[ticket.id] ?? ticket.status;

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return supportTickets.filter((ticket) => {
      if (scope === 'mine' && ticket.assignee !== '정민지') return false;
      if (scope === 'unassigned' && ticket.assignee !== '미배정') return false;
      if (scope === 'sla' && ticket.slaLeft >= 0) return false;
      if (!keyword) return true;
      return `${ticket.id} ${ticket.subject} ${ticket.customer}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [query, scope]);

  const current = rows[Math.min(index, rows.length - 1)];

  useEffect(() => {
    setIndex(0);
  }, [query, scope]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const top = index * ROW_HEIGHT;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + ROW_HEIGHT > list.scrollTop + LIST_HEIGHT)
      list.scrollTop = top + ROW_HEIGHT - LIST_HEIGHT;
  }, [index]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  const moveTo = (next: number) => {
    const bounded = Math.max(0, Math.min(rows.length - 1, next));
    const target = rows[bounded];
    if (!target || bounded === index) return;
    if (draft.trim()) {
      setPendingTicket(target);
      return;
    }
    setIndex(bounded);
  };

  const openTicket = (ticket: SupportTicket) =>
    moveTo(rows.findIndex((row) => row.id === ticket.id));

  const discardDraft = () => {
    const target = pendingTicket;
    setPendingTicket(null);
    if (!target) return;
    setDraft('');
    setIndex(
      Math.max(
        0,
        rows.findIndex((row) => row.id === target.id),
      ),
    );
  };

  /** 낙관적 상태 변경. 세 번째 요청마다 거절되고 이전 상태로 되돌립니다. */
  const changeStatus = (ticket: SupportTicket, next: TicketStatus) => {
    const previous = statusOf(ticket);
    if (previous === next) return;
    setStatusOverride((map) => ({ ...map, [ticket.id]: next }));
    window.setTimeout(() => {
      saveAttempts.current += 1;
      if (saveAttempts.current % 3 === 0) {
        setStatusOverride((map) => ({ ...map, [ticket.id]: previous }));
        toast({
          title: `${ticket.id} 상태를 저장하지 못했어요`,
          description: `서버가 요청을 거절해서 ${previous} 상태로 되돌렸어요.`,
          tone: 'danger',
          duration: 0,
          action: {
            label: '다시 시도',
            onClick: () => changeStatus(ticket, next),
          },
        });
        return;
      }
      toast({
        title: `${ticket.id} 상태를 저장했어요`,
        description: `${next} 상태로 바꿨어요.`,
        tone: 'success',
      });
    }, 600);
  };

  /** 답장도 낙관적으로 붙이고, 실패하면 목록에서 지우고 초안을 남깁니다. */
  const sendReply = async (text: string) => {
    if (!current) return;
    const id = `${current.id}-${Date.now()}`;
    const time = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setSending((ids) => [...ids, id]);
    setReplies((map) => ({
      ...map,
      [current.id]: [...(map[current.id] ?? []), { id, text, time }],
    }));
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    sendAttempts.current += 1;
    setSending((ids) => ids.filter((item) => item !== id));
    if (sendAttempts.current % 3 === 0) {
      setReplies((map) => ({
        ...map,
        [current.id]: (map[current.id] ?? []).filter((item) => item.id !== id),
      }));
      toast({
        title: '답장을 보내지 못했어요',
        description: '작성한 내용은 입력창에 그대로 남아 있어요.',
        tone: 'danger',
        duration: 0,
        action: { label: '다시 보내기', onClick: () => void sendReply(text) },
      });
      throw new Error('reply rejected');
    }
    setDraft('');
    toast({ title: '답장을 보냈어요', tone: 'success' });
  };

  const listKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const tag = (event.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || event.metaKey || event.ctrlKey)
      return;
    const key = event.key.toLowerCase();
    if (key === 'j' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveTo(index + 1);
    } else if (key === 'k' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveTo(index - 1);
    } else if (key === 'e' && current) {
      event.preventDefault();
      changeStatus(current, '완료');
    } else if (key === 'r') {
      event.preventDefault();
      document
        .querySelector<HTMLTextAreaElement>('[data-support-reply] textarea')
        ?.focus();
    }
  };

  const columns: DataColumn<SupportTicket>[] = [
    {
      key: 'subject',
      header: '문의',
      render: (_, ticket) => (
        <ContextMenu
          trigger={
            <button
              type="button"
              className="cs-row"
              aria-current={current?.id === ticket.id || undefined}
              onClick={() => openTicket(ticket)}
            >
              <span className="cs-row__subject">{ticket.subject}</span>
              <span className="cs-row__meta">
                {ticket.id} · {ticket.customer} · {ticket.channel}
              </span>
            </button>
          }
        >
          <MenuItem onSelect={() => changeStatus(ticket, '처리중')}>
            처리중으로 바꾸기
          </MenuItem>
          <MenuItem onSelect={() => changeStatus(ticket, '보류')}>
            보류로 바꾸기
          </MenuItem>
          <MenuItem onSelect={() => changeStatus(ticket, '완료')}>
            완료로 바꾸기
          </MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={() => openTicket(ticket)}>상세 열기</MenuItem>
        </ContextMenu>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (_, ticket) => (
        <Badge tone={statusTone(statusOf(ticket))}>{statusOf(ticket)}</Badge>
      ),
    },
    {
      key: 'slaLeft',
      header: '첫 응답 SLA',
      render: (_, ticket) => (
        <Text
          as="span"
          size="sm"
          tone={ticket.slaLeft < 0 ? 'danger' : 'muted'}
          numeric
        >
          {ticket.slaLeft < 0
            ? `${Math.abs(ticket.slaLeft)}분 초과`
            : `${ticket.slaLeft}분 남음`}
        </Text>
      ),
    },
  ];

  const thread = current
    ? [
        {
          id: `${current.id}-in`,
          author: current.customer,
          side: 'start' as const,
          time: '09:12',
          text: `${current.subject}. ${current.detail}`,
        },
        {
          id: `${current.id}-out`,
          author: '상담사 정민지',
          side: 'end' as const,
          time: '09:20',
          text: '문의 주신 내용 확인하고 있어요. 결제 승인 기록부터 살펴볼게요.',
        },
      ]
    : [];

  const commands = current
    ? [
        {
          id: 'next',
          label: '다음 문의로 이동',
          shortcut: 'J',
          onSelect: () => moveTo(index + 1),
        },
        {
          id: 'prev',
          label: '이전 문의로 이동',
          shortcut: 'K',
          onSelect: () => moveTo(index - 1),
        },
        {
          id: 'progress',
          label: '처리중으로 바꾸기',
          keywords: '상태 처리',
          onSelect: () => changeStatus(current, '처리중'),
        },
        {
          id: 'done',
          label: '완료로 바꾸기',
          shortcut: 'E',
          keywords: '상태 종료',
          onSelect: () => changeStatus(current, '완료'),
        },
        {
          id: 'sla',
          label: 'SLA 초과 문의만 보기',
          keywords: '필터',
          onSelect: () => setScope('sla'),
        },
        {
          id: 'tour',
          label: '단축키 안내 열기',
          keywords: '도움말 키보드',
          onSelect: () => setTourStep(0),
        },
      ]
    : [];

  return (
    <div className="cs-screen">
      <PageHeader
        title="고객 문의 콘솔"
        description="1,240건의 문의를 키보드로 훑고, 상태 변경과 답장을 낙관적으로 처리합니다."
        actions={
          <>
            <Button
              variant="secondary"
              leading={<ExampleIcon name="help" />}
              onClick={() => setTourStep(0)}
            >
              단축키 안내
            </Button>
            <Button
              leading={<ExampleIcon name="search" />}
              onClick={() => setPaletteOpen(true)}
            >
              명령 팔레트 열기
            </Button>
          </>
        }
      />
      <div className="cs-kpis">
        <Card>
          <Stat label="대기 문의" value="184건" hint="미배정 42건" />
        </Card>
        <Card>
          <Stat
            label="첫 응답 SLA 준수"
            value="92.4%"
            delta={{ value: '어제보다 1.8%p 상승', direction: 'up' }}
          />
        </Card>
        <Card>
          <Stat label="오늘 처리" value="317건" hint="평균 처리 18분" />
        </Card>
        <Card>
          <Stat
            label="SLA 초과"
            value="27건"
            delta={{ value: '즉시 배정 필요', direction: 'down' }}
          />
        </Card>
      </div>
      <SplitPane
        className="cs-split"
        label="목록과 상세 비율"
        defaultSize={42}
        min={28}
        max={64}
        first={
          <Card className="cs-panel" padding="sm">
            <div className="cs-list__head">
              <SearchInput
                aria-label="문의 검색"
                placeholder="문의번호, 제목, 고객명 검색"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
              <SegmentedControl
                label="문의 범위"
                name="cs-scope"
                options={ticketFilters}
                value={scope}
                onValueChange={setScope}
              />
            </div>
            <div className="cs-list" onKeyDown={listKeys}>
              <VirtualTable
                ref={listRef}
                label="문의 목록"
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id}
                height={LIST_HEIGHT}
                rowHeight={ROW_HEIGHT}
              />
            </div>
            <div className="cs-list__foot">
              <Text size="sm" tone="muted" role="status">
                {rows.length
                  ? `${index + 1}번째 문의 선택 · 검색 결과 ${rows.length.toLocaleString('ko-KR')}건`
                  : '검색 결과가 없어요. 다른 조건으로 검색해 보세요.'}
              </Text>
              <Text size="xs" tone="muted">
                J 다음 · K 이전 · E 완료 · R 답장 · ⌘K 명령
              </Text>
            </div>
          </Card>
        }
        second={
          current ? (
            <Card className="cs-panel" padding="sm">
              <div className="cs-detail__head">
                <div>
                  <Heading level={2} size="md">
                    {current.subject}
                  </Heading>
                  <Stack direction="row" gap={2} align="center" wrap>
                    <Badge tone={statusTone(statusOf(current))}>
                      {statusOf(current)}
                    </Badge>
                    <Badge
                      tone={current.priority === '긴급' ? 'danger' : 'neutral'}
                    >
                      우선순위 {current.priority}
                    </Badge>
                    <HoverCard
                      trigger={
                        <span className="cs-customer">{current.customer}</span>
                      }
                    >
                      <strong>{current.customer}</strong> · {current.plan}
                      <br />
                      최근 결제 128,000원 · 미해결 문의 2건
                    </HoverCard>
                    <Text as="span" size="sm" tone="muted">
                      {current.id} · {current.channel} · 대기 {current.waited}
                    </Text>
                  </Stack>
                </div>
                <Stack direction="row" gap={2}>
                  <Menu
                    align="end"
                    trigger={
                      <Button variant="secondary" size="sm">
                        상태 변경
                      </Button>
                    }
                  >
                    {ticketStatuses.map((status) => (
                      <MenuItem
                        key={status}
                        onSelect={() => changeStatus(current, status)}
                      >
                        {status} 상태로 바꾸기
                      </MenuItem>
                    ))}
                  </Menu>
                  <Button
                    size="sm"
                    onClick={() => changeStatus(current, '완료')}
                  >
                    완료 처리
                  </Button>
                </Stack>
              </div>
              {current.slaLeft < 0 ? (
                <Alert tone="danger" role="alert">
                  첫 응답 SLA를 {Math.abs(current.slaLeft)}분 넘겼어요. 답장을
                  보내면 초과 사유가 함께 기록돼요.
                </Alert>
              ) : null}
              <Tabs
                id="cs-tabs"
                label="문의 상세"
                items={[
                  { value: 'thread', label: '대화' },
                  { value: 'history', label: '고객 이력' },
                  { value: 'memo', label: '내부 메모' },
                ]}
                value={tab}
                onValueChange={setTab}
              />
              <TabPanel
                tabsId="cs-tabs"
                value="thread"
                active={tab === 'thread'}
              >
                <Chat label={`${current.id} 대화`} className="cs-thread">
                  {thread.map((message) => (
                    <MessageBubble
                      key={message.id}
                      author={message.author}
                      side={message.side}
                      time={message.time}
                    >
                      {message.text}
                    </MessageBubble>
                  ))}
                  {(replies[current.id] ?? []).map((reply) => (
                    <MessageBubble
                      key={reply.id}
                      author="상담사 정민지"
                      side="end"
                      time={
                        sending.includes(reply.id) ? '보내는 중' : reply.time
                      }
                    >
                      {reply.text}
                    </MessageBubble>
                  ))}
                </Chat>
                <div className="cs-macros">
                  <Text as="span" size="sm" weight="semibold">
                    자주 쓰는 답변
                  </Text>
                  {replyMacros.map((macro) => (
                    <Chip
                      key={macro.label}
                      size="sm"
                      onClick={() =>
                        setDraft((text) =>
                          text ? `${text}\n${macro.text}` : macro.text,
                        )
                      }
                    >
                      {macro.label}
                    </Chip>
                  ))}
                </div>
                <div data-support-reply>
                  <PromptInput
                    label="답장 작성"
                    placeholder="답장을 입력하고 Enter로 보내요. Shift+Enter는 줄바꿈이에요."
                    value={draft}
                    onValueChange={setDraft}
                    onSubmit={sendReply}
                  />
                </div>
              </TabPanel>
              <TabPanel
                tabsId="cs-tabs"
                value="history"
                active={tab === 'history'}
              >
                <Timeline
                  items={[
                    {
                      id: 'h1',
                      title: '중복 결제 환불 완료',
                      description: '128,000원 승인 취소 · 담당 배수아',
                      time: '8월 21일',
                    },
                    {
                      id: 'h2',
                      title: '정산 오차 문의 종료',
                      description: '정산서 재발행으로 해결',
                      time: '7월 14일',
                    },
                    {
                      id: 'h3',
                      title: '비즈니스 연간 요금제 전환',
                      description: '월간에서 연간으로 변경',
                      time: '5월 2일',
                    },
                  ]}
                />
              </TabPanel>
              <TabPanel tabsId="cs-tabs" value="memo" active={tab === 'memo'}>
                <Field
                  label="내부 메모"
                  htmlFor="cs-memo"
                  hint="메모는 고객에게 보이지 않아요."
                >
                  <Textarea
                    id="cs-memo"
                    rows={4}
                    value={memo}
                    aria-describedby="cs-memo-description"
                    onChange={(event) => setMemo(event.currentTarget.value)}
                  />
                </Field>
                <Stack direction="row" gap={2} align="center">
                  <Button
                    size="sm"
                    disabled={memo === savedMemo}
                    onClick={() => {
                      setSavedMemo(memo);
                      toast({ title: '메모를 저장했어요', tone: 'success' });
                    }}
                  >
                    메모 저장
                  </Button>
                  <Text
                    size="sm"
                    tone={memo === savedMemo ? 'muted' : 'danger'}
                  >
                    {memo === savedMemo
                      ? '저장된 메모예요'
                      : '저장하지 않은 변경이 있어요'}
                  </Text>
                </Stack>
              </TabPanel>
            </Card>
          ) : (
            <Card className="cs-panel" padding="sm">
              <Text tone="muted">
                검색 결과가 없어요. 검색어를 지우면 전체 문의를 다시 볼 수
                있어요.
              </Text>
            </Card>
          )
        }
      />
      <VisuallyHidden aria-live="polite">
        {current ? `${current.id} ${current.subject} 선택됨` : ''}
      </VisuallyHidden>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        label="문의 콘솔 명령"
        commands={commands}
      />
      <AlertDialog
        open={pendingTicket !== null}
        onClose={() => setPendingTicket(null)}
        title="작성 중인 답장이 있어요"
        description="다른 문의로 이동하면 작성한 답장은 사라져요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setPendingTicket(null)}>
              계속 작성
            </Button>
            <Button variant="danger" onClick={discardDraft}>
              답장 지우고 이동
            </Button>
          </>
        }
      />
      {tourStep === null ? null : (
        <Tour
          open
          onClose={() => setTourStep(null)}
          current={tourStep}
          onStepChange={setTourStep}
          steps={[
            {
              title: '목록은 키보드로 움직여요',
              description:
                '목록에 포커스를 두고 J와 K로 문의를 옮겨요. 화살표 키도 같게 동작해요.',
            },
            {
              title: 'E로 완료, R로 답장',
              description:
                'E는 선택한 문의를 완료로 바꾸고, R은 답장 입력창으로 포커스를 옮겨요.',
            },
            {
              title: '⌘K로 모든 명령 검색',
              description:
                '상태 변경, 필터, 이동 명령을 이름이나 키워드로 찾아 실행해요.',
            },
          ]}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 계약 검토·승인                                                       */
/* ------------------------------------------------------------------ */

const contractLines = [
  'SERVICE AGREEMENT (SAMPLE)',
  'Contract No. MEGA-2026-0912',
  'Parties: Mega Commerce Inc. and Hanul Logistics Co.',
  'Term: 2026-10-01 ~ 2027-09-30 (12 months)',
  'Fee: KRW 48,000,000 per year, billed quarterly',
  'Renewal: automatic, 60 days written notice to opt out',
  'Termination: 30 days written notice for cause',
  'Governing law: Republic of Korea',
];

/** 외부 자산 없이 미리보기를 띄우려고 최소 PDF를 즉석에서 만듭니다. */
function buildSamplePdf() {
  const content = contractLines
    .map(
      (line, i) =>
        `BT /F1 ${i === 0 ? 20 : 12} Tf 56 ${772 - i * 30} Td (${line}) Tj ET`,
    )
    .join('\n');
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>',
    `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const startxref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${startxref}\n%%EOF`;
  return pdf;
}

const attachmentImage = (title: string, tint: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="${tint}"/><rect x="32" y="40" width="416" height="18" rx="9" fill="#ffffff" opacity="0.85"/><rect x="32" y="76" width="300" height="12" rx="6" fill="#ffffff" opacity="0.6"/><rect x="32" y="100" width="360" height="12" rx="6" fill="#ffffff" opacity="0.6"/><rect x="32" y="150" width="416" height="110" rx="12" fill="#ffffff" opacity="0.35"/><text x="32" y="288" font-family="sans-serif" font-size="16" fill="#ffffff">${title}</text></svg>`,
  )}`;

const contractAttachments = [
  { src: attachmentImage('Signed page 1', '#2f6fed'), alt: '서명 페이지 사본' },
  { src: attachmentImage('Fee schedule', '#0f9d7a'), alt: '요금표 사본' },
  { src: attachmentImage('Insurance', '#7a5af5'), alt: '보험 증서 사본' },
];

interface ContractComment {
  id: string;
  author: string;
  page: number;
  quote: string;
  body: string;
  resolved: boolean;
}

const initialComments: ContractComment[] = [
  {
    id: 'c1',
    author: '법무 배수아',
    page: 1,
    quote: 'Renewal: automatic',
    body: '자동 갱신 조항은 거절 통보 기한을 60일에서 30일로 줄이는 안으로 협의해요.',
    resolved: false,
  },
  {
    id: 'c2',
    author: '재무 오세훈',
    page: 1,
    quote: 'Fee: KRW 48,000,000',
    body: '분기 청구라 3분기 예산에 12,000,000원이 잡혀야 해요.',
    resolved: true,
  },
];

const contractDiff = [
  {
    id: 'd1',
    kind: 'same' as const,
    before: '계약 기간은 2026년 10월 1일부터 12개월로 한다.',
    after: '계약 기간은 2026년 10월 1일부터 12개월로 한다.',
  },
  {
    id: 'd2',
    kind: 'changed' as const,
    before: '연간 이용료는 4,500만원으로 하고 반기마다 청구한다.',
    after: '연간 이용료는 4,800만원으로 하고 분기마다 청구한다.',
  },
  {
    id: 'd3',
    kind: 'added' as const,
    before: '',
    after: '배송 지연이 월 3회를 넘으면 다음 달 이용료의 5%를 감액한다.',
  },
  {
    id: 'd4',
    kind: 'removed' as const,
    before: '분쟁은 대한상사중재원의 중재로 해결한다.',
    after: '',
  },
];

const approvalSteps = [
  { label: '법무 검토', description: '배수아' },
  { label: '재무 승인', description: '오세훈' },
  { label: '대표 승인', description: '정한별' },
  { label: '전자 서명', description: '양 사 대표' },
];

export function ContractReviewExample() {
  return (
    <ToastProvider>
      <ContractReview />
    </ToastProvider>
  );
}

function ContractReview() {
  const toast = useToast();
  const [pdfUrl, setPdfUrl] = useState('');
  const [version, setVersion] = useState('v3');
  const [compare, setCompare] = useState(false);
  const [tab, setTab] = useState('comments');
  const [comments, setComments] = useState(initialComments);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentPage, setCommentPage] = useState('1');
  const [commentOpen, setCommentOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [signOpen, setSignOpen] = useState(false);
  const [history, setHistory] = useState([
    {
      id: 'a1',
      title: '법무 검토 완료',
      description: '자동 갱신 조항 의견 1건 등록 · 배수아',
      time: '9월 8일 16:20',
    },
    {
      id: 'a2',
      title: 'v3 업로드',
      description: '요금·감액 조항 반영 · 정민지',
      time: '9월 8일 11:05',
    },
  ]);

  useEffect(() => {
    const url = URL.createObjectURL(
      new Blob([buildSamplePdf()], { type: 'application/pdf' }),
    );
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  const open = comments.filter((comment) => !comment.resolved).length;

  const addComment = () => {
    if (!commentDraft.trim()) return;
    setComments((list) => [
      ...list,
      {
        id: `c${list.length + 1}`,
        author: '나 (정민지)',
        page: Number(commentPage),
        quote: contractLines[Number(commentPage)] ?? contractLines[1]!,
        body: commentDraft.trim(),
        resolved: false,
      },
    ]);
    setCommentDraft('');
    setCommentOpen(false);
    toast({ title: '코멘트를 등록했어요', tone: 'success' });
  };

  const approve = () => {
    const next = Math.min(approvalSteps.length - 1, step + 1);
    setStep(next);
    setHistory((items) => [
      {
        id: `a${items.length + 1}`,
        title: `${approvalSteps[step]?.label} 완료`,
        description: '승인 기록을 남겼어요 · 나 (정민지)',
        time: '방금',
      },
      ...items,
    ]);
    toast({
      title: `${approvalSteps[step]?.label} 단계를 승인했어요`,
      tone: 'success',
    });
  };

  const reject = () => {
    if (rejectReason.trim().length < 10) {
      setRejectError(
        '반려 사유를 10자 이상 적어 주세요. 작성자에게 그대로 전달돼요.',
      );
      return;
    }
    setRejectError('');
    setRejectOpen(false);
    setStep(0);
    setHistory((items) => [
      {
        id: `a${items.length + 1}`,
        title: `${approvalSteps[step]?.label} 반려`,
        description: rejectReason.trim(),
        time: '방금',
      },
      ...items,
    ]);
    setRejectReason('');
    toast({ title: '반려 사유를 작성자에게 보냈어요', tone: 'neutral' });
  };

  return (
    <div className="ct-screen">
      <PageHeader
        title="계약 검토·승인"
        description="원문과 코멘트를 나란히 보고, 버전 차이를 확인한 뒤 승인 단계를 진행합니다."
        actions={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(true)}>
              반려 요청
            </Button>
            <Button onClick={() => setSignOpen(true)}>서명 요청 보내기</Button>
          </>
        }
      />
      <Card padding="sm" className="ct-flow">
        <Stepper
          label="승인 단계"
          items={approvalSteps}
          current={step}
          onStepChange={setStep}
        />
        <Stack direction="row" gap={2} align="center" wrap>
          <Badge tone={open ? 'warning' : 'success'}>
            {open ? `미해결 코멘트 ${open}건` : '미해결 코멘트 없음'}
          </Badge>
          <Text size="sm" tone="muted">
            연 48,000,000원 · 12개월 · 자동 갱신(거절 통보 60일 전)
          </Text>
          {step < approvalSteps.length - 1 ? (
            <Button size="sm" onClick={approve}>
              승인하고 다음 단계로
            </Button>
          ) : (
            <Text size="sm" tone="muted">
              마지막 단계예요. 서명 요청 보내기로 마무리해요.
            </Text>
          )}
        </Stack>
      </Card>
      <SplitPane
        className="ct-split"
        label="원문과 검토 패널 비율"
        defaultSize={52}
        min={30}
        max={70}
        first={
          <Card className="ct-panel" padding="sm">
            <div className="ct-doc__head">
              <Select
                aria-label="문서 버전"
                value={version}
                onChange={(event) => setVersion(event.currentTarget.value)}
              >
                <option value="v3">v3 · 9월 8일 (최신)</option>
                <option value="v2">v2 · 9월 2일</option>
                <option value="v1">v1 · 8월 27일</option>
              </Select>
              <Switch
                label="이전 버전과 비교"
                checked={compare}
                onChange={(event) => setCompare(event.currentTarget.checked)}
              />
            </div>
            {compare ? (
              <div className="ct-diff">
                <Text size="sm" tone="muted">
                  v2와 v3의 차이예요. 표시는 조항 단위이고, 서명본은 원문
                  PDF예요.
                </Text>
                {contractDiff.map((row) => (
                  <div
                    key={row.id}
                    className="ct-diff__row"
                    data-kind={row.kind}
                  >
                    <div>
                      <Text size="xs" tone="muted">
                        v2
                      </Text>
                      <Text size="sm">{row.before || '조항 없음'}</Text>
                    </div>
                    <div>
                      <Text size="xs" tone="muted">
                        v3
                      </Text>
                      <Text size="sm">{row.after || '삭제됨'}</Text>
                    </div>
                  </div>
                ))}
              </div>
            ) : pdfUrl ? (
              <PDFViewer
                className="ct-pdf"
                src={pdfUrl}
                label={`표준 용역 계약서 ${version} 영문본`}
              >
                <Stack gap={2}>
                  <Text size="sm">
                    이 브라우저에서는 PDF를 바로 열지 못해요.
                  </Text>
                  <a href={pdfUrl} download="contract-v3.pdf">
                    계약서 내려받기
                  </a>
                </Stack>
              </PDFViewer>
            ) : (
              <Text tone="muted" role="status">
                문서를 준비하고 있어요.
              </Text>
            )}
          </Card>
        }
        second={
          <Card className="ct-panel" padding="sm">
            <Tabs
              id="ct-tabs"
              label="검토 패널"
              items={[
                {
                  value: 'comments',
                  label: '코멘트',
                  badge: open || undefined,
                },
                { value: 'history', label: '승인 이력' },
                { value: 'files', label: '첨부' },
              ]}
              value={tab}
              onValueChange={setTab}
            />
            <TabPanel
              tabsId="ct-tabs"
              value="comments"
              active={tab === 'comments'}
            >
              <Popover
                label="코멘트 작성"
                open={commentOpen}
                onOpenChange={setCommentOpen}
                trigger={<Button size="sm">코멘트 추가</Button>}
              >
                <Stack gap={3}>
                  <Field label="위치" htmlFor="ct-comment-page">
                    <Select
                      id="ct-comment-page"
                      value={commentPage}
                      onChange={(event) =>
                        setCommentPage(event.currentTarget.value)
                      }
                    >
                      <option value="1">계약 번호 줄</option>
                      <option value="3">계약 기간 줄</option>
                      <option value="4">이용료 줄</option>
                      <option value="5">자동 갱신 줄</option>
                    </Select>
                  </Field>
                  <Field
                    label="의견"
                    htmlFor="ct-comment-body"
                    hint="작성자와 승인자 모두에게 보여요."
                  >
                    <Textarea
                      id="ct-comment-body"
                      rows={3}
                      value={commentDraft}
                      aria-describedby="ct-comment-body-description"
                      onChange={(event) =>
                        setCommentDraft(event.currentTarget.value)
                      }
                    />
                  </Field>
                  <Stack direction="row" gap={2} justify="end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setCommentOpen(false)}
                    >
                      닫기
                    </Button>
                    <Button
                      size="sm"
                      disabled={!commentDraft.trim()}
                      onClick={addComment}
                    >
                      코멘트 등록
                    </Button>
                  </Stack>
                </Stack>
              </Popover>
              <ul className="ct-comments">
                {comments.map((comment) => (
                  <li
                    key={comment.id}
                    data-resolved={comment.resolved || undefined}
                  >
                    <Stack direction="row" gap={2} align="center" wrap>
                      <Text as="span" size="sm" weight="semibold">
                        {comment.author}
                      </Text>
                      <Badge tone={comment.resolved ? 'success' : 'warning'}>
                        {comment.resolved ? '해결' : '미해결'}
                      </Badge>
                      <Text as="span" size="xs" tone="muted">
                        {comment.page}번째 줄 인용
                      </Text>
                    </Stack>
                    <Text size="xs" tone="muted" className="ct-quote">
                      “{comment.quote}”
                    </Text>
                    <Text size="sm">{comment.body}</Text>
                    <Button
                      size="xs"
                      variant="text"
                      onClick={() =>
                        setComments((list) =>
                          list.map((item) =>
                            item.id === comment.id
                              ? { ...item, resolved: !item.resolved }
                              : item,
                          ),
                        )
                      }
                    >
                      {comment.resolved ? '다시 열기' : '해결로 표시'}
                    </Button>
                  </li>
                ))}
              </ul>
            </TabPanel>
            <TabPanel
              tabsId="ct-tabs"
              value="history"
              active={tab === 'history'}
            >
              <Timeline items={history} />
            </TabPanel>
            <TabPanel tabsId="ct-tabs" value="files" active={tab === 'files'}>
              <Text size="sm" tone="muted">
                썸네일을 누르면 확대해서 볼 수 있어요.
              </Text>
              <Gallery label="계약 첨부 이미지" images={contractAttachments} />
            </TabPanel>
          </Card>
        }
      />
      <AlertDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="이 계약을 반려할까요?"
        description="반려하면 승인 단계가 법무 검토로 돌아가고, 사유가 작성자에게 전달돼요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              계속 검토
            </Button>
            <Button variant="danger" onClick={reject}>
              반려하고 사유 보내기
            </Button>
          </>
        }
      >
        <Field
          label="반려 사유"
          htmlFor="ct-reject"
          hint="어떤 조항을 어떻게 고쳐야 하는지 적어 주세요."
          error={rejectError}
          required
        >
          <Textarea
            id="ct-reject"
            rows={3}
            required
            value={rejectReason}
            aria-describedby="ct-reject-description"
            aria-invalid={rejectError ? true : undefined}
            onChange={(event) => setRejectReason(event.currentTarget.value)}
          />
        </Field>
      </AlertDialog>
      <Dialog
        open={signOpen}
        onClose={() => setSignOpen(false)}
        title="서명 요청을 보낼까요?"
        description="양 사 담당자에게 서명 링크가 메일로 나가고, 이후에는 원문을 바꿀 수 없어요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setSignOpen(false)}>
              나중에
            </Button>
            <Button
              onClick={() => {
                setSignOpen(false);
                setStep(approvalSteps.length - 1);
                toast({ title: '서명 요청을 보냈어요', tone: 'success' });
              }}
            >
              서명 요청 보내기
            </Button>
          </>
        }
      >
        <DescriptionList
          items={[
            { term: '계약 금액', description: '연 48,000,000원 (분기 청구)' },
            { term: '계약 기간', description: '2026-10-01 ~ 2027-09-30' },
            {
              term: '자동 갱신',
              description: '갱신됨 · 거절하려면 만료 60일 전에 서면 통보',
            },
            { term: '미해결 코멘트', description: `${open}건` },
          ]}
        />
      </Dialog>
    </div>
  );
}
