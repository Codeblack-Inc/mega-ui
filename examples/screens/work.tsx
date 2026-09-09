import { useRef, useState } from 'react';
import {
  Avatar,
  AvatarGroup,
  ActiveFilters,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Calendar,
  Card,
  Chip,
  CopyButton,
  BulkActionBar,
  DataGrid,
  DataPagination,
  DataTable,
  DatePicker,
  DescriptionList,
  Dialog,
  Drawer,
  Dropzone,
  EmptyState,
  Field,
  FilterBar,
  FormActions,
  FormSection,
  Gantt,
  Grid,
  Heading,
  HoverCard,
  IconButton,
  Input,
  Kanban,
  ListRow,
  Menu,
  MenuItem,
  MenuSeparator,
  OrganizationChart,
  ProgressBar,
  PropertyGrid,
  Scheduler,
  SearchInput,
  SegmentedControl,
  Select,
  Sheet,
  SideNav,
  SideNavItem,
  SideNavSection,
  Stack,
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
  TimePicker,
  ToastProvider,
  Tree,
  useToast,
  type DataColumn,
  type KanbanColumn,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';

// ---------- 사용자 관리 ----------

type Role = '관리자' | '편집자' | '뷰어';
type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastActive: string;
  logins: number;
};

const roleTone: Record<Role, 'brand' | 'purple' | 'neutral'> = {
  관리자: 'brand',
  편집자: 'purple',
  뷰어: 'neutral',
};

const seedUsers: User[] = [
  ['김메가', 'mega.kim', '관리자', true, '방금 전', 412],
  ['이하늘', 'sky.lee', '편집자', true, '10분 전', 238],
  ['박바다', 'sea.park', '편집자', true, '1시간 전', 191],
  ['최서준', 'sj.choi', '뷰어', true, '3시간 전', 87],
  ['정유진', 'yj.jung', '편집자', false, '2일 전', 64],
  ['한지우', 'jw.han', '뷰어', true, '어제', 120],
  ['오민준', 'mj.oh', '관리자', true, '5시간 전', 301],
  ['윤서아', 'sa.yoon', '뷰어', false, '3주 전', 12],
  ['장도윤', 'dy.jang', '편집자', true, '어제', 154],
  ['임하린', 'hr.lim', '뷰어', true, '4일 전', 45],
  ['강시우', 'sw.kang', '편집자', true, '2시간 전', 209],
  ['조은우', 'eu.cho', '뷰어', false, '한 달 전', 3],
  ['신예린', 'yr.shin', '편집자', true, '어제', 98],
].map(([name, id, role, active, lastActive, logins]) => ({
  id: id as string,
  name: name as string,
  email: `${id}@mega.example`,
  role: role as Role,
  active: active as boolean,
  lastActive: lastActive as string,
  logins: logins as number,
}));

const PAGE_SIZE = 8;

export function UserManagementExample() {
  return (
    <ToastProvider>
      <UserManagement />
    </ToastProvider>
  );
}

function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState(seedUsers);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('전체');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [detail, setDetail] = useState<User | null>(null);

  const filtered = users.filter(
    (user) =>
      (role === '전체' || user.role === role) &&
      (status === 'all' || user.active === (status === 'active')) &&
      (user.name.includes(query) || user.email.includes(query)),
  );
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: DataColumn<User>[] = [
    {
      key: 'name',
      header: '이름',
      render: (_, user) => (
        <button
          type="button"
          className="users-name"
          onClick={() => setDetail(user)}
        >
          <Avatar name={user.name} size="xs" />
          {user.name}
        </button>
      ),
    },
    { key: 'email', header: '이메일' },
    {
      key: 'role',
      header: '역할',
      render: (_, user) => (
        <Badge tone={roleTone[user.role]}>{user.role}</Badge>
      ),
    },
    {
      key: 'active',
      header: '상태',
      render: (_, user) => (
        <Badge tone={user.active ? 'success' : 'neutral'}>
          {user.active ? '활성' : '비활성'}
        </Badge>
      ),
    },
    { key: 'lastActive', header: '마지막 접속' },
    { key: 'logins', header: '로그인', numeric: true },
  ];

  const resetPage = () => {
    setPage(1);
    setSelected([]);
  };

  return (
    <div className="users-layout">
      <div className="users-heading">
        <div>
          <Heading size="xl">사용자 관리</Heading>
          <Text tone="muted">
            전체 {users.length}명 · 활성 {users.filter((u) => u.active).length}
            명
          </Text>
        </div>
        <Button
          leading={<ExampleIcon name="plus" />}
          onClick={() => setInviting(true)}
        >
          사용자 초대
        </Button>
      </div>
      <Card className="users-card">
        <FilterBar
          label="사용자 필터"
          search={
            <SearchInput
              aria-label="사용자 검색"
              placeholder="이름 또는 이메일"
              value={query}
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                resetPage();
              }}
            />
          }
          filters={
            <>
              <label>
                <Text as="span" size="sm" tone="muted">
                  역할
                </Text>
                <Select
                  value={role}
                  onChange={(event) => {
                    setRole(event.currentTarget.value);
                    resetPage();
                  }}
                >
                  {['전체', '관리자', '편집자', '뷰어'].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </label>
              {(
                [
                  ['all', '모두'],
                  ['active', '활성'],
                  ['inactive', '비활성'],
                ] as const
              ).map(([value, label]) => (
                <Chip
                  key={value}
                  selected={status === value}
                  onClick={() => {
                    setStatus(value);
                    resetPage();
                  }}
                >
                  {label}
                </Chip>
              ))}
            </>
          }
        />
        <ActiveFilters
          filters={[
            ...(query ? [{ id: 'query', label: `검색: ${query}` }] : []),
            ...(role !== '전체'
              ? [{ id: 'role', label: `역할: ${role}` }]
              : []),
            ...(status !== 'all'
              ? [
                  {
                    id: 'status',
                    label: status === 'active' ? '활성' : '비활성',
                  },
                ]
              : []),
          ]}
          onRemove={(id) => {
            if (id === 'query') setQuery('');
            if (id === 'role') setRole('전체');
            if (id === 'status') setStatus('all');
            resetPage();
          }}
          onClear={() => {
            setQuery('');
            setRole('전체');
            setStatus('all');
            resetPage();
          }}
        />
        <BulkActionBar
          count={selected.length}
          formatCount={(count) => `${count}명 선택`}
          onClear={() => setSelected([])}
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setUsers((list) =>
                list.map((u) =>
                  selected.includes(u.id) ? { ...u, role: '편집자' } : u,
                ),
              );
              toast({ title: '역할을 편집자로 바꿨어요', tone: 'success' });
              setSelected([]);
            }}
          >
            역할 변경
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setUsers((list) =>
                list.map((u) =>
                  selected.includes(u.id) ? { ...u, active: false } : u,
                ),
              );
              toast({ title: `${selected.length}명을 비활성화했어요` });
              setSelected([]);
            }}
          >
            비활성화
          </Button>
        </BulkActionBar>
        <div className="users-grid">
          <DataGrid
            label="사용자 목록"
            rows={rows}
            columns={columns}
            getRowId={(user) => user.id}
            selectedIds={selected}
            onSelectionChange={setSelected}
          />
        </div>
        <DataPagination
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          pageSizeOptions={[8, 16]}
          onPageChange={(value) => {
            setPage(value);
            setSelected([]);
          }}
          onPageSizeChange={(value) => {
            setPageSize(value);
            resetPage();
          }}
          formatSummary={({ start, end, total }) =>
            total ? `${total}명 중 ${start}–${end}명` : '사용자 0명'
          }
        />
      </Card>

      <Dialog
        open={inviting}
        onClose={() => setInviting(false)}
        title="사용자 초대"
        description="초대 메일을 보내면 바로 목록에 추가돼요."
        size="sm"
      >
        <form
          id="users-invite"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const email = String(form.get('email'));
            const name = email.split('@')[0] ?? email;
            setUsers((list) => [
              {
                id: `u-${Date.now()}`,
                name,
                email,
                role: form.get('role') as Role,
                active: true,
                lastActive: '초대됨',
                logins: 0,
              },
              ...list,
            ]);
            setInviting(false);
            setPage(1);
            toast({ title: `${email}에게 초대를 보냈어요`, tone: 'success' });
          }}
        >
          <FormSection
            title="초대 정보"
            description="업무 이메일과 역할을 지정해 주세요."
          >
            <Field label="이메일" htmlFor="invite-email" required>
              <Input
                id="invite-email"
                name="email"
                type="email"
                placeholder="name@mega.example"
                required
              />
            </Field>
            <Field label="역할" htmlFor="invite-role">
              <Select id="invite-role" name="role" defaultValue="뷰어">
                {['관리자', '편집자', '뷰어'].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
          </FormSection>
          <FormActions
            submitLabel="초대 보내기"
            onCancel={() => setInviting(false)}
          />
        </form>
      </Dialog>

      <Drawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        side="end"
        actions={
          <Button
            onClick={() => {
              if (detail)
                setUsers((list) =>
                  list.map((u) => (u.id === detail.id ? detail : u)),
                );
              setDetail(null);
              toast({ title: '변경 사항을 저장했어요', tone: 'success' });
            }}
          >
            저장하기
          </Button>
        }
      >
        {detail ? (
          <Stack gap={5}>
            <Stack direction="row" gap={3} align="center">
              <Avatar name={detail.name} size="lg" />
              <div>
                <Badge tone={roleTone[detail.role]}>{detail.role}</Badge>
                <Text size="sm" tone="muted">
                  {detail.email}
                </Text>
              </div>
            </Stack>
            <DescriptionList
              items={[
                {
                  term: '상태',
                  description: detail.active ? '활성' : '비활성',
                },
                { term: '마지막 접속', description: detail.lastActive },
                { term: '로그인 횟수', description: `${detail.logins}회` },
              ]}
            />
            <PropertyGrid
              label="편집 가능한 정보"
              items={[
                {
                  name: 'name',
                  label: '이름',
                  value: detail.name,
                  editable: true,
                },
                {
                  name: 'role',
                  label: '역할',
                  value: detail.role,
                  description: '관리자 · 편집자 · 뷰어',
                  editable: true,
                },
              ]}
              onValueChange={(name, value) =>
                setDetail((current) =>
                  current ? { ...current, [name]: value } : current,
                )
              }
            />
          </Stack>
        ) : null}
      </Drawer>
    </div>
  );
}

// ---------- 프로젝트 보드 ----------

type Task = {
  id: string;
  title: string;
  owner: string;
  priority: '높음' | '보통' | '낮음';
  column: string;
  start: string;
  end: string;
  progress: number;
};

const columnTitles: Record<string, string> = {
  backlog: '백로그',
  todo: '할 일',
  doing: '진행 중',
  done: '완료',
};

const seedTasks: Task[] = [
  [
    '디자인 토큰 정리',
    '이하늘',
    '높음',
    'done',
    '2026-09-01',
    '2026-09-05',
    100,
  ],
  [
    '버튼 접근성 검토',
    '김메가',
    '보통',
    'done',
    '2026-09-03',
    '2026-09-08',
    100,
  ],
  [
    '테이블 정렬 구현',
    '박바다',
    '높음',
    'doing',
    '2026-09-07',
    '2026-09-14',
    60,
  ],
  [
    '다크 모드 대비 점검',
    '최서준',
    '보통',
    'doing',
    '2026-09-09',
    '2026-09-16',
    30,
  ],
  [
    '문서 사이트 개편',
    '이하늘',
    '높음',
    'doing',
    '2026-09-10',
    '2026-09-24',
    20,
  ],
  [
    '차트 컴포넌트 설계',
    '오민준',
    '보통',
    'todo',
    '2026-09-15',
    '2026-09-26',
    0,
  ],
  [
    '폼 검증 메시지 통일',
    '정유진',
    '낮음',
    'todo',
    '2026-09-17',
    '2026-09-22',
    0,
  ],
  ['릴리스 노트 작성', '김메가', '낮음', 'todo', '2026-09-28', '2026-09-30', 0],
  [
    '모바일 내비게이션 실험',
    '한지우',
    '보통',
    'backlog',
    '2026-10-01',
    '2026-10-10',
    0,
  ],
  [
    '성능 측정 자동화',
    '박바다',
    '낮음',
    'backlog',
    '2026-10-05',
    '2026-10-15',
    0,
  ],
].map(([title, owner, priority, column, start, end, progress], index) => ({
  id: `t${index + 1}`,
  title: title as string,
  owner: owner as string,
  priority: priority as Task['priority'],
  column: column as string,
  start: start as string,
  end: end as string,
  progress: progress as number,
}));

const priorityTone = {
  높음: 'danger',
  보통: 'warning',
  낮음: 'neutral',
} as const;

const taskColumns: DataColumn<Task>[] = [
  { key: 'title', header: '작업', sortable: true },
  { key: 'owner', header: '담당', sortable: true },
  {
    key: 'priority',
    header: '우선순위',
    sortable: true,
    render: (_, task) => (
      <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
    ),
  },
  {
    key: 'column',
    header: '상태',
    sortable: true,
    value: (task) => columnTitles[task.column],
  },
  { key: 'end', header: '마감', sortable: true },
  {
    key: 'progress',
    header: '진행률',
    numeric: true,
    value: (t) => `${t.progress}%`,
  },
];

export function ProjectBoardExample() {
  const [tasks, setTasks] = useState(seedTasks);
  const [view, setView] = useState('board');
  const [adding, setAdding] = useState(false);

  const board: KanbanColumn[] = Object.entries(columnTitles).map(
    ([id, title]) => ({
      id,
      title,
      cards: tasks
        .filter((task) => task.column === id)
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: (
            <span className="board-meta">
              <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
              <Avatar name={task.owner} size="xs" /> {task.owner}
            </span>
          ),
        })),
    }),
  );

  return (
    <div className="board-layout">
      <div className="board-heading">
        <Stack gap={1}>
          <Text size="sm" tone="brand" weight="semibold">
            MEGA UI 2.0
          </Text>
          <Heading size="xl">디자인 시스템 개편</Heading>
        </Stack>
        <Stack direction="row" gap={3} align="center" wrap>
          <AvatarGroup max={3}>
            {['김메가', '이하늘', '박바다', '최서준', '오민준'].map((name) => (
              <Avatar key={name} name={name} size="sm" />
            ))}
          </AvatarGroup>
          <Tabs
            label="보기 방식"
            variant="pill"
            value={view}
            onValueChange={setView}
            items={[
              { value: 'board', label: '보드' },
              { value: 'list', label: '목록' },
              { value: 'timeline', label: '타임라인' },
            ]}
          />
          <Button
            leading={<ExampleIcon name="plus" />}
            onClick={() => setAdding(true)}
          >
            할 일 추가
          </Button>
        </Stack>
      </div>
      <TabPanel active={view === 'board'} aria-label="보드">
        <Kanban
          label="작업 보드"
          className="board-kanban"
          columns={board}
          onMove={(cardId, _from, to) =>
            setTasks((list) =>
              list.map((task) =>
                task.id === cardId
                  ? {
                      ...task,
                      column: to,
                      progress: to === 'done' ? 100 : task.progress,
                    }
                  : task,
              ),
            )
          }
        />
      </TabPanel>
      <TabPanel active={view === 'list'} aria-label="목록">
        <Card className="board-card">
          <DataTable
            label="작업 목록"
            rows={tasks}
            columns={taskColumns}
            getRowId={(task) => task.id}
            filterable
            initialSort={{ key: 'end', direction: 'asc' }}
          />
        </Card>
      </TabPanel>
      <TabPanel active={view === 'timeline'} aria-label="타임라인">
        <Card className="board-card">
          <Gantt
            label="작업 일정"
            rangeStart="2026-09-01"
            rangeEnd="2026-10-15"
            tasks={tasks.map((task) => ({
              id: task.id,
              title: task.title,
              start: task.start,
              end: task.end,
              progress: task.progress,
            }))}
          />
        </Card>
      </TabPanel>

      <Sheet open={adding} onClose={() => setAdding(false)} title="할 일 추가">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setTasks((list) => [
              ...list,
              {
                id: `t${Date.now()}`,
                title: String(form.get('title')),
                owner: '김메가',
                priority: '보통',
                column: String(form.get('column')),
                start: '2026-09-20',
                end: '2026-09-30',
                progress: 0,
              },
            ]);
            setAdding(false);
          }}
        >
          <Stack gap={4}>
            <Field label="작업 이름" htmlFor="task-title" required>
              <Input id="task-title" name="title" required autoFocus />
            </Field>
            <Field label="상태" htmlFor="task-column">
              <Select id="task-column" name="column" defaultValue="todo">
                {Object.entries(columnTitles).map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" size="lg" fullWidth>
              추가하기
            </Button>
          </Stack>
        </form>
      </Sheet>
    </div>
  );
}

// ---------- 일정 관리 ----------

type Event = {
  id: string;
  date: string;
  start: string;
  end: string;
  title: string;
  place: string;
};

const seedEvents: Event[] = [
  {
    id: 'e1',
    date: '2026-09-09',
    start: '10:00',
    end: '11:00',
    title: '디자인 리뷰',
    place: '3층 회의실',
  },
  {
    id: 'e2',
    date: '2026-09-09',
    start: '14:00',
    end: '15:30',
    title: '컴포넌트 워크숍',
    place: '온라인',
  },
  {
    id: 'e3',
    date: '2026-09-10',
    start: '09:30',
    end: '10:00',
    title: '데일리 싱크',
    place: '온라인',
  },
  {
    id: 'e4',
    date: '2026-09-11',
    start: '13:00',
    end: '14:00',
    title: '접근성 점검',
    place: '5층 랩',
  },
  {
    id: 'e5',
    date: '2026-09-15',
    start: '11:00',
    end: '12:00',
    title: '릴리스 회의',
    place: '3층 회의실',
  },
  {
    id: 'e6',
    date: '2026-09-17',
    start: '16:00',
    end: '17:00',
    title: '스프린트 회고',
    place: '온라인',
  },
  {
    id: 'e7',
    date: '2026-09-24',
    start: '10:00',
    end: '12:00',
    title: '문서 사이트 데모',
    place: '1층 라운지',
  },
];

export function CalendarExample() {
  const [events, setEvents] = useState(seedEvents);
  const [date, setDate] = useState('2026-09-09');
  const [month, setMonth] = useState('2026-09');
  const [mode, setMode] = useState('month');
  const [adding, setAdding] = useState(false);
  const dayEvents = events
    .filter((event) => event.date === date)
    .sort((a, b) => a.start.localeCompare(b.start));
  const label = new Date(`${date}T00:00`).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const monthLabel = new Date(`${month}-01T00:00`).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });
  const shiftMonth = (by: number) => {
    const next = new Date(`${month}-01T00:00`);
    next.setMonth(next.getMonth() + by);
    setMonth(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`,
    );
  };

  return (
    <div className="cal-layout">
      <div className="cal-heading">
        <Stack direction="row" gap={2} align="center">
          <IconButton label="이전 달" size="sm" onClick={() => shiftMonth(-1)}>
            <ExampleIcon name="chevronLeft" />
          </IconButton>
          <Heading size="xl">{monthLabel}</Heading>
          <IconButton label="다음 달" size="sm" onClick={() => shiftMonth(1)}>
            <ExampleIcon name="chevronRight" />
          </IconButton>
        </Stack>
        <Stack direction="row" gap={2} align="center">
          <SegmentedControl
            label="보기 방식"
            name="calendar-mode"
            options={[
              { label: '월', value: 'month' },
              { label: '주', value: 'week' },
            ]}
            value={mode}
            onValueChange={setMode}
          />
          <Button
            leading={<ExampleIcon name="plus" />}
            onClick={() => setAdding(true)}
          >
            일정 추가
          </Button>
        </Stack>
      </div>
      <div className="cal-body">
        <Card className="cal-main">
          {mode === 'month' ? (
            <Calendar
              label={`${monthLabel} 달력`}
              month={month}
              selectedDate={date}
              onDateSelect={setDate}
              events={events.map((event) => ({
                id: event.id,
                date: event.date,
                title: event.title,
              }))}
            />
          ) : (
            <Scheduler
              label="이번 주 일정"
              appointments={events
                .filter(
                  (event) =>
                    event.date >= '2026-09-07' && event.date <= '2026-09-13',
                )
                .map((event) => ({
                  id: event.id,
                  date: event.date,
                  start: event.start,
                  end: event.end,
                  title: event.title,
                  resource: event.place,
                }))}
              onAppointmentClick={(item) => setDate(item.date)}
            />
          )}
        </Card>
        <Card className="cal-side">
          <Stack gap={4}>
            <Stack gap={1}>
              <Text size="sm" tone="muted">
                선택한 날
              </Text>
              <Heading size="md">{label}</Heading>
            </Stack>
            {dayEvents.length ? (
              <div className="cal-list">
                {dayEvents.map((event) => (
                  <ListRow
                    key={event.id}
                    leading={<Badge tone="brand">{event.start}</Badge>}
                    title={event.title}
                    description={`${event.start}–${event.end} · ${event.place}`}
                    trailing={
                      <IconButton
                        label={`${event.title} 삭제`}
                        size="sm"
                        onClick={() =>
                          setEvents((list) =>
                            list.filter((e) => e.id !== event.id),
                          )
                        }
                      >
                        <ExampleIcon name="trash" />
                      </IconButton>
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ExampleIcon name="calendar" />}
                title="일정이 없어요"
                description="여유로운 하루예요. 새 일정을 추가해 보세요."
                action={
                  <Button variant="weak" onClick={() => setAdding(true)}>
                    일정 추가
                  </Button>
                }
              />
            )}
          </Stack>
        </Card>
      </div>

      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="일정 추가"
        size="sm"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const next = {
              id: `e${Date.now()}`,
              date: String(form.get('date')),
              start: String(form.get('start')),
              end: String(form.get('end')),
              title: String(form.get('title')),
              place: '미정',
            };
            setEvents((list) => [...list, next]);
            setDate(next.date);
            setAdding(false);
          }}
        >
          <Stack gap={4}>
            <Field label="제목" htmlFor="event-title" required>
              <Input id="event-title" name="title" required autoFocus />
            </Field>
            <Field label="날짜" htmlFor="event-date" required>
              <DatePicker
                id="event-date"
                name="date"
                defaultValue={date}
                min="2026-09-01"
                max="2026-09-30"
                required
              />
            </Field>
            <Grid minItemWidth={120} gap={3}>
              <Field label="시작" htmlFor="event-start" required>
                <TimePicker
                  id="event-start"
                  name="start"
                  defaultValue="10:00"
                  required
                />
              </Field>
              <Field label="종료" htmlFor="event-end" required>
                <TimePicker
                  id="event-end"
                  name="end"
                  defaultValue="11:00"
                  required
                />
              </Field>
            </Grid>
            <Stack direction="row" gap={2} justify="end">
              <Button variant="secondary" onClick={() => setAdding(false)}>
                취소
              </Button>
              <Button type="submit">추가하기</Button>
            </Stack>
          </Stack>
        </form>
      </Dialog>
    </div>
  );
}

// ---------- 조직도·인사 ----------

type Member = {
  name: string;
  title: string;
  joined: string;
  status: '재직' | '휴가' | '수습';
};

const departments: Record<string, { label: string; members: Member[] }> = {
  design: {
    label: '디자인팀',
    members: [
      { name: '이하늘', title: '팀장', joined: '2021.03.02', status: '재직' },
      {
        name: '윤서아',
        title: '프로덕트 디자이너',
        joined: '2023.07.10',
        status: '휴가',
      },
      {
        name: '임하린',
        title: '프로덕트 디자이너',
        joined: '2026.08.18',
        status: '수습',
      },
    ],
  },
  frontend: {
    label: '프론트엔드팀',
    members: [
      { name: '박바다', title: '팀장', joined: '2020.11.16', status: '재직' },
      {
        name: '최서준',
        title: '엔지니어',
        joined: '2022.02.14',
        status: '재직',
      },
      {
        name: '강시우',
        title: '엔지니어',
        joined: '2024.05.20',
        status: '재직',
      },
      {
        name: '신예린',
        title: '엔지니어',
        joined: '2026.09.01',
        status: '수습',
      },
    ],
  },
  backend: {
    label: '백엔드팀',
    members: [
      { name: '오민준', title: '팀장', joined: '2019.06.03', status: '재직' },
      {
        name: '장도윤',
        title: '엔지니어',
        joined: '2023.01.09',
        status: '휴가',
      },
    ],
  },
  growth: {
    label: '그로스팀',
    members: [
      { name: '정유진', title: '팀장', joined: '2022.09.05', status: '재직' },
      { name: '한지우', title: '마케터', joined: '2025.03.17', status: '재직' },
    ],
  },
  people: {
    label: '피플팀',
    members: [
      { name: '조은우', title: '팀장', joined: '2021.08.23', status: '재직' },
    ],
  },
};

const statusTone = { 재직: 'success', 휴가: 'warning', 수습: 'brand' } as const;

export function OrgChartExample() {
  const [team, setTeam] = useState('frontend');
  const all = Object.values(departments).flatMap((d) => d.members);
  const count = (id: string) => `${departments[id]!.members.length}명`;
  const members = departments[team]!.members;

  return (
    <div className="org-layout">
      <Heading size="xl">조직도</Heading>
      <div className="org-stats">
        <Card>
          <Stat label="전체 인원" value={all.length} unit="명" />
        </Card>
        <Card>
          <Stat
            label="부서"
            value={Object.keys(departments).length}
            unit="개"
          />
        </Card>
        <Card>
          <Stat
            label="이달 입사"
            value={all.filter((m) => m.status === '수습').length}
            unit="명"
            delta={{ value: '2명', direction: 'up' }}
          />
        </Card>
        <Card>
          <Stat
            label="휴가 중"
            value={all.filter((m) => m.status === '휴가').length}
            unit="명"
          />
        </Card>
      </div>
      <div className="org-body">
        <Card className="org-chart">
          <OrganizationChart
            label="메가 조직도"
            root={{
              id: 'ceo',
              label: '김메가 · 대표',
              detail: `${all.length + 1}명`,
              children: [
                {
                  id: 'product',
                  label: '프로덕트 본부',
                  detail: `${departments.design!.members.length + departments.frontend!.members.length + departments.backend!.members.length}명`,
                  children: [
                    {
                      id: 'design',
                      label: '디자인팀',
                      detail: count('design'),
                    },
                    {
                      id: 'frontend',
                      label: '프론트엔드팀',
                      detail: count('frontend'),
                    },
                    {
                      id: 'backend',
                      label: '백엔드팀',
                      detail: count('backend'),
                    },
                  ],
                },
                {
                  id: 'biz',
                  label: '비즈니스 본부',
                  detail: count('growth'),
                  children: [
                    {
                      id: 'growth',
                      label: '그로스팀',
                      detail: count('growth'),
                    },
                  ],
                },
                {
                  id: 'ops',
                  label: '경영지원 본부',
                  detail: count('people'),
                  children: [
                    { id: 'people', label: '피플팀', detail: count('people') },
                  ],
                },
              ],
            }}
          />
        </Card>
        <Card className="org-members">
          <Stack gap={4}>
            <Tree
              label="부서 선택"
              value={team}
              onValueChange={setTeam}
              nodes={[
                {
                  id: 'product',
                  label: '프로덕트 본부',
                  children: [
                    { id: 'design', label: '디자인팀' },
                    { id: 'frontend', label: '프론트엔드팀' },
                    { id: 'backend', label: '백엔드팀' },
                  ],
                },
                {
                  id: 'biz',
                  label: '비즈니스 본부',
                  children: [{ id: 'growth', label: '그로스팀' }],
                },
                {
                  id: 'ops',
                  label: '경영지원 본부',
                  children: [{ id: 'people', label: '피플팀' }],
                },
              ]}
            />
            <Stack direction="row" justify="between" align="center">
              <Heading size="sm">{departments[team]!.label}</Heading>
              <Badge tone="brand">{members.length}명</Badge>
            </Stack>
            <Table
              density="compact"
              aria-label={`${departments[team]!.label} 구성원`}
            >
              <TableHead>
                <TableRow>
                  <TableHeaderCell>이름</TableHeaderCell>
                  <TableHeaderCell>직책</TableHeaderCell>
                  <TableHeaderCell>입사일</TableHeaderCell>
                  <TableHeaderCell>상태</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.name}>
                    <TableCell>
                      <HoverCard
                        trigger={
                          <button type="button" className="org-name">
                            <Avatar name={member.name} size="xs" />
                            {member.name}
                          </button>
                        }
                      >
                        <strong>{member.name}</strong>
                        <br />
                        {departments[team]!.label} · {member.title}
                        <br />
                        {member.name.toLowerCase()}@mega.example
                      </HoverCard>
                    </TableCell>
                    <TableCell tone="muted">{member.title}</TableCell>
                    <TableCell tone="muted">{member.joined}</TableCell>
                    <TableCell>
                      <Badge tone={statusTone[member.status]}>
                        {member.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        </Card>
      </div>
    </div>
  );
}

// ---------- 파일 드라이브 ----------

type Doc = {
  id: string;
  name: string;
  kind: 'folder' | 'doc' | 'image' | 'sheet';
  owner: string;
  modified: string;
  size: number;
};

const seedDocs: Doc[] = [
  {
    id: 'd1',
    name: '디자인 가이드',
    kind: 'folder',
    owner: '이하늘',
    modified: '오늘 09:12',
    size: 0,
  },
  {
    id: 'd2',
    name: '2026 3분기 계획.docx',
    kind: 'doc',
    owner: '김메가',
    modified: '어제',
    size: 184_320,
  },
  {
    id: 'd3',
    name: '컴포넌트 목록.xlsx',
    kind: 'sheet',
    owner: '박바다',
    modified: '2026.09.05',
    size: 92_160,
  },
  {
    id: 'd4',
    name: '홈 화면 시안.png',
    kind: 'image',
    owner: '이하늘',
    modified: '2026.09.03',
    size: 2_411_520,
  },
  {
    id: 'd5',
    name: '회의록',
    kind: 'folder',
    owner: '정유진',
    modified: '2026.09.01',
    size: 0,
  },
  {
    id: 'd6',
    name: '접근성 체크리스트.docx',
    kind: 'doc',
    owner: '최서준',
    modified: '2026.08.28',
    size: 61_440,
  },
  {
    id: 'd7',
    name: '로고 원본.png',
    kind: 'image',
    owner: '윤서아',
    modified: '2026.08.20',
    size: 5_242_880,
  },
];

const kindIcon = {
  folder: 'folder',
  doc: 'file',
  image: 'image',
  sheet: 'grid',
} as const;

const formatSize = (bytes: number) =>
  bytes === 0
    ? '—'
    : bytes < 1_048_576
      ? `${Math.round(bytes / 1024)}KB`
      : `${(bytes / 1_048_576).toFixed(1)}MB`;

export function DriveExample() {
  const [docs, setDocs] = useState(seedDocs);
  const [section, setSection] = useState('mine');
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState('list');
  const [sort, setSort] = useState<'name' | 'size'>('name');
  const [detail, setDetail] = useState<Doc | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const addFiles = (files: File[]) =>
    setDocs((list) => [
      ...files.map((file) => ({
        id: `f-${file.name}-${file.size}`,
        name: file.name,
        kind: file.type.startsWith('image/')
          ? ('image' as const)
          : ('doc' as const),
        owner: '김메가',
        modified: '방금 전',
        size: file.size,
      })),
      ...list,
    ]);

  const visible = docs
    .filter((doc) => doc.name.includes(query))
    .sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name, 'ko') : b.size - a.size,
    );

  const remove = (id: string) =>
    setDocs((list) => list.filter((doc) => doc.id !== id));

  return (
    <div className="drive-layout">
      <aside className="drive-side">
        <Button
          fullWidth
          leading={<ExampleIcon name="upload" />}
          onClick={() => fileInput.current?.click()}
        >
          업로드
        </Button>
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          aria-label="업로드할 파일"
          onChange={(event) => {
            addFiles(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = '';
          }}
        />
        <SideNav label="드라이브 메뉴">
          <SideNavSection>
            {(
              [
                ['mine', '내 드라이브', 'folder', docs.length],
                ['shared', '공유됨', 'users', 3],
                ['recent', '최근', 'clock', 0],
                ['trash', '휴지통', 'trash', 0],
              ] as const
            ).map(([id, label, icon, badge]) => (
              <SideNavItem
                key={id}
                icon={<ExampleIcon name={icon} />}
                active={section === id}
                badge={badge ? <Badge>{badge}</Badge> : undefined}
                onClick={() => setSection(id)}
              >
                {label}
              </SideNavItem>
            ))}
          </SideNavSection>
        </SideNav>
        <Stack gap={2} className="drive-storage">
          <ProgressBar label="저장 공간 사용량" value={32.4} max={100} />
          <Text size="xs" tone="muted">
            100GB 중 32.4GB 사용 중
          </Text>
        </Stack>
      </aside>
      <div className="drive-main" onDragEnter={() => setDragging(true)}>
        <Breadcrumb label="폴더 경로">
          <BreadcrumbItem href="#drive">내 드라이브</BreadcrumbItem>
          <BreadcrumbItem current>프로젝트</BreadcrumbItem>
        </Breadcrumb>
        <div className="drive-toolbar">
          <SearchInput
            aria-label="파일 검색"
            placeholder="파일 이름"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <SegmentedControl
            label="보기 방식"
            name="drive-layout"
            options={[
              { label: '목록', value: 'list' },
              { label: '격자', value: 'grid' },
            ]}
            value={layout}
            onValueChange={setLayout}
          />
          <Menu
            align="end"
            trigger={
              <Button
                variant="secondary"
                size="sm"
                trailing={<ExampleIcon name="chevron" />}
              >
                정렬
              </Button>
            }
          >
            <MenuItem onSelect={() => setSort('name')}>이름순</MenuItem>
            <MenuItem onSelect={() => setSort('size')}>크기순</MenuItem>
          </Menu>
        </div>
        {dragging ? (
          <Dropzone
            label="여기에 놓으면 업로드돼요"
            multiple
            className="drive-drop"
            onDragLeave={() => setDragging(false)}
            onDrop={() => setDragging(false)}
            onFilesChange={addFiles}
          />
        ) : null}
        {section !== 'mine' ? (
          <EmptyState
            icon={<ExampleIcon name="folder" />}
            title="아직 파일이 없어요"
            description="이 예제는 내 드라이브만 데이터를 담고 있어요."
            action={
              <Button variant="weak" onClick={() => setSection('mine')}>
                내 드라이브로
              </Button>
            }
          />
        ) : layout === 'list' ? (
          <Table aria-label="파일 목록" className="drive-table">
            <TableHead>
              <TableRow>
                <TableHeaderCell>이름</TableHeaderCell>
                <TableHeaderCell>소유자</TableHeaderCell>
                <TableHeaderCell>수정일</TableHeaderCell>
                <TableHeaderCell align="end">크기</TableHeaderCell>
                <TableHeaderCell>
                  <span className="mega-visually-hidden">작업</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <button
                      type="button"
                      className="drive-name"
                      onClick={() => setDetail(doc)}
                    >
                      <ExampleIcon name={kindIcon[doc.kind]} />
                      {doc.name}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="drive-owner">
                      <Avatar name={doc.owner} size="xs" /> {doc.owner}
                    </span>
                  </TableCell>
                  <TableCell tone="muted">{doc.modified}</TableCell>
                  <TableCell numeric>{formatSize(doc.size)}</TableCell>
                  <TableCell>
                    <Menu
                      align="end"
                      trigger={
                        <IconButton label={`${doc.name} 더 보기`} size="sm">
                          <ExampleIcon name="more" />
                        </IconButton>
                      }
                    >
                      <MenuItem icon={<ExampleIcon name="download" />}>
                        다운로드
                      </MenuItem>
                      <MenuItem
                        icon={<ExampleIcon name="edit" />}
                        onSelect={() => setDetail(doc)}
                      >
                        상세 보기
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem
                        tone="danger"
                        icon={<ExampleIcon name="trash" />}
                        onSelect={() => remove(doc.id)}
                      >
                        삭제
                      </MenuItem>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Grid minItemWidth={160} gap={3}>
            {visible.map((doc) => (
              <Card key={doc.id} variant="outlined" className="drive-tile">
                <button
                  type="button"
                  className="drive-tile__button"
                  onClick={() => setDetail(doc)}
                >
                  <span className="drive-tile__icon">
                    <ExampleIcon name={kindIcon[doc.kind]} />
                  </span>
                  <Text size="sm" weight="medium">
                    {doc.name}
                  </Text>
                  <Text size="xs" tone="muted">
                    {doc.modified} · {formatSize(doc.size)}
                  </Text>
                </button>
              </Card>
            ))}
          </Grid>
        )}
      </div>

      <Drawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        actions={
          <>
            <CopyButton
              value={`https://drive.mega.example/${detail?.id ?? ''}`}
              variant="secondary"
            >
              링크 복사
            </CopyButton>
            <Button onClick={() => setDetail(null)}>공유하기</Button>
          </>
        }
      >
        {detail ? (
          <DescriptionList
            items={[
              {
                term: '종류',
                description: {
                  folder: '폴더',
                  doc: '문서',
                  image: '이미지',
                  sheet: '스프레드시트',
                }[detail.kind],
              },
              { term: '소유자', description: detail.owner },
              { term: '수정일', description: detail.modified },
              { term: '크기', description: formatSize(detail.size) },
              { term: '위치', description: '내 드라이브 / 프로젝트' },
            ]}
          />
        ) : null}
      </Drawer>
    </div>
  );
}
