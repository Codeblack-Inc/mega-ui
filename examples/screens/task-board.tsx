import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  PageHeader,
  Select,
  Stack,
  TaskBoard,
  parseTaskBoard,
  serializeTaskBoard,
  type TaskBoardData,
} from '@mega-ui/react';

export const taskBoardSeed: TaskBoardData = {
  version: 1,
  columns: [
    { id: 'backlog', title: '검토 대기' },
    { id: 'doing', title: '진행 중', wipLimit: 3 },
    { id: 'review', title: '리뷰', wipLimit: 4 },
    { id: 'done', title: '완료' },
  ],
  lanes: [
    { id: 'product', title: '제품' },
    { id: 'platform', title: '플랫폼' },
  ],
  assignees: [
    { id: 'mega', name: '김메가' },
    { id: 'sky', name: '이하늘' },
    { id: 'sea', name: '박바다' },
  ],
  cards: [
    {
      id: 'task-1',
      title: '결제 오류 문구 정리',
      description: '실패한 단계와 다시 시도할 행동을 함께 안내해요.',
      columnId: 'backlog',
      laneId: 'product',
      assigneeId: 'mega',
      dueDate: '2026-09-18',
    },
    {
      id: 'task-2',
      title: '모바일 내비게이션 검토',
      description: '좁은 화면의 메뉴 이동을 확인해요.',
      columnId: 'backlog',
      laneId: 'product',
      assigneeId: 'sky',
      dueDate: '2026-09-21',
    },
    {
      id: 'task-3',
      title: '데이터 표 키보드 탐색',
      columnId: 'doing',
      laneId: 'platform',
      assigneeId: 'sea',
      dueDate: '2026-09-19',
    },
    {
      id: 'task-4',
      title: '버튼 상태 문서화',
      columnId: 'review',
      laneId: 'product',
      assigneeId: 'mega',
      dueDate: '2026-09-17',
    },
    {
      id: 'task-5',
      title: '디자인 토큰 정리',
      columnId: 'done',
      laneId: 'platform',
      assigneeId: 'sky',
    },
    { id: 'task-6', title: '다음 릴리스 준비', columnId: 'backlog' },
  ],
};
export function TaskBoardDemo() {
  const [value, setValue] = useState(taskBoardSeed);
  return <TaskBoard value={value} onChange={setValue} label="팀 작업 보드" />;
}
const storageKey = 'mega-task-board-example-v1';
export function TaskBoardExample() {
  const [value, setValue] = useState(taskBoardSeed);
  const [instance, setInstance] = useState(0);
  const [fail, setFail] = useState(false);
  const [custom, setCustom] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [mode, setMode] = useState('sample');
  const [reload, setReload] = useState(false);
  const load = () => {
    try {
      const source = localStorage.getItem(storageKey);
      if (!source) {
        setLoadError(
          '이 브라우저에 저장한 보드가 없어요. 보드를 저장한 뒤 다시 불러와 주세요.',
        );
        return;
      }
      setValue(parseTaskBoard(source));
      setInstance((current) => current + 1);
      setLoadError('');
      setReload(false);
    } catch {
      setLoadError(
        '저장한 보드를 불러오지 못했어요. 브라우저 저장소와 저장한 데이터를 확인해 주세요.',
      );
    }
  };
  return (
    <Stack gap={4}>
      <PageHeader
        title="팀 작업 보드"
        description="카드를 상태별로 정리하고 구획으로 나눠요. 보드 저장은 이 브라우저의 저장소에 기록해요."
      />
      <TaskBoard
        key={instance}
        value={value}
        onChange={setValue}
        label="릴리스 작업 보드"
        onSave={async (next) => {
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (fail) throw new Error('Example save failure');
          localStorage.setItem(storageKey, serializeTaskBoard(next));
        }}
        renderCard={
          custom
            ? (card) => (
                <Stack gap={2}>
                  <Badge tone="brand">{card.id}</Badge>
                  <strong>{card.title}</strong>
                  {card.description && <p>{card.description}</p>}
                  <span>
                    {value.assignees.find(
                      (person) => person.id === card.assigneeId,
                    )?.name ?? '담당자 없음'}
                    {card.dueDate ? ` · ${card.dueDate}` : ''}
                  </span>
                </Stack>
              )
            : undefined
        }
      />
      <p>예제 데이터를 바꾸면 저장하지 않은 변경은 사라져요.</p>
      <Stack direction="row" gap={3} wrap align="end">
        <label>
          예제 데이터
          <Select
            aria-label="보드 예제 데이터"
            value={mode}
            onChange={(event) => {
              const next = event.target.value;
              setMode(next);
              setValue(
                next === 'large'
                  ? {
                      ...taskBoardSeed,
                      cards: Array.from({ length: 500 }, (_, i) => ({
                        id: `large-${i}`,
                        title: `검토 항목 ${i + 1}`,
                        columnId: 'backlog',
                        assigneeId: i % 2 ? 'mega' : 'sky',
                      })),
                    }
                  : next === 'empty'
                    ? {
                        version: 1,
                        columns: [],
                        cards: [],
                        lanes: [],
                        assignees: [],
                      }
                    : taskBoardSeed,
              );
              setInstance((current) => current + 1);
            }}
          >
            <option value="sample">제품·플랫폼 예시</option>
            <option value="large">카드 500개</option>
            <option value="empty">빈 보드</option>
          </Select>
        </label>
        <Checkbox
          checked={fail}
          onChange={(event) => setFail(event.target.checked)}
        >
          저장 실패 재현
        </Checkbox>
        <Checkbox
          checked={custom}
          onChange={(event) => setCustom(event.target.checked)}
        >
          사용자 카드 표시
        </Checkbox>
        <Button variant="secondary" onClick={() => setReload(true)}>
          브라우저 저장본 불러오기
        </Button>
      </Stack>
      {reload && (
        <Alert>
          <Stack gap={2}>
            <p>
              현재 보드 전체를 브라우저 저장본으로 바꿔요. 저장하지 않은 변경은
              사라져요.
            </p>
            <Stack direction="row" gap={2}>
              <Button onClick={load}>저장본으로 교체</Button>
              <Button variant="secondary" onClick={() => setReload(false)}>
                현재 보드 유지
              </Button>
            </Stack>
          </Stack>
        </Alert>
      )}
      {loadError && (
        <Alert tone="danger" role="alert">
          {loadError}
        </Alert>
      )}
    </Stack>
  );
}
