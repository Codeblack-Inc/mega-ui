export interface TaskBoardColumn {
  id: string;
  title: string;
  wipLimit?: number;
}
export interface TaskBoardLane {
  id: string;
  title: string;
}
export interface TaskBoardAssignee {
  id: string;
  name: string;
}
export interface TaskBoardCard {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  laneId?: string;
  assigneeId?: string;
  dueDate?: string;
}
export interface TaskBoardData {
  version: 1;
  columns: readonly TaskBoardColumn[];
  cards: readonly TaskBoardCard[];
  lanes: readonly TaskBoardLane[];
  assignees: readonly TaskBoardAssignee[];
}
export type TaskBoardAction =
  | { type: 'put-card'; card: TaskBoardCard }
  | { type: 'delete-card'; id: string }
  | {
      type: 'move-card';
      id: string;
      columnId: string;
      laneId?: string;
      beforeId?: string;
    }
  | { type: 'put-column'; column: TaskBoardColumn }
  | { type: 'delete-column'; id: string; toColumnId?: string }
  | { type: 'move-column'; id: string; index: number }
  | { type: 'put-lane'; lane: TaskBoardLane }
  | { type: 'delete-lane'; id: string };

const text = (value: unknown, max = 200): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error(
      `이름은 공백을 제외한 글자를 포함해 ${max}자 이내로 입력해 주세요.`,
    );
  return value;
};
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('보드 데이터 형식을 확인해 주세요.');
  return value as Record<string, unknown>;
};
const array = (value: unknown, max: number): unknown[] => {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    Array.from(value).some((item) => item == null)
  )
    throw new Error(`데이터는 ${max}개 이내의 목록으로 전달해 주세요.`);
  return value;
};
export function isTaskBoardDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value >= '0001-01-01' &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validateTaskBoard(input: unknown): TaskBoardData {
  const data = record(input);
  if (data.version !== 1) throw new Error('지원하는 보드 파일 버전은 1이에요.');
  const unique = (items: readonly { id: string }[]) => {
    if (new Set(items.map((item) => item.id)).size !== items.length)
      throw new Error('같은 종류의 항목 ID는 중복할 수 없어요.');
  };
  const columns = array(data.columns, 30).map((item) => {
    const row = record(item);
    if (
      row.wipLimit !== undefined &&
      (typeof row.wipLimit !== 'number' ||
        !Number.isInteger(row.wipLimit) ||
        row.wipLimit < 1 ||
        row.wipLimit > 1000)
    )
      throw new Error('열의 카드 제한은 1~1,000 사이의 정수로 입력해 주세요.');
    return {
      id: text(row.id),
      title: text(row.title),
      ...(row.wipLimit !== undefined
        ? { wipLimit: row.wipLimit as number }
        : {}),
    };
  });
  const lanes = array(data.lanes, 20).map((item) => {
    const row = record(item);
    return { id: text(row.id), title: text(row.title) };
  });
  const assignees = array(data.assignees, 100).map((item) => {
    const row = record(item);
    return { id: text(row.id), name: text(row.name) };
  });
  const cards = array(data.cards, 1000).map((item) => {
    const row = record(item);
    const card: TaskBoardCard = {
      id: text(row.id),
      title: text(row.title),
      columnId: text(row.columnId),
    };
    for (const key of ['laneId', 'assigneeId', 'dueDate'] as const)
      if (row[key] !== undefined) card[key] = text(row[key]);
    if (row.description !== undefined) {
      if (typeof row.description !== 'string' || row.description.length > 5000)
        throw new Error('카드 설명은 5,000자 이내로 입력해 주세요.');
      card.description = row.description;
    }
    if (
      !columns.some((column) => column.id === card.columnId) ||
      (card.laneId !== undefined &&
        !lanes.some((lane) => lane.id === card.laneId)) ||
      (card.assigneeId !== undefined &&
        !assignees.some((person) => person.id === card.assigneeId))
    )
      throw new Error('카드의 열·구획·담당자를 확인해 주세요.');
    if (card.dueDate !== undefined && !isTaskBoardDate(card.dueDate))
      throw new Error('기한을 실제 날짜로 입력해 주세요.');
    return card;
  });
  [columns, lanes, assignees, cards].forEach(unique);
  for (const column of columns)
    if (
      column.wipLimit !== undefined &&
      cards.filter((card) => card.columnId === column.id).length >
        column.wipLimit
    )
      throw new Error(
        `${column.title} 열의 카드 제한은 ${column.wipLimit}개예요. 제한을 늘리거나 다른 열을 선택해 주세요.`,
      );
  const result: TaskBoardData = {
    version: 1,
    columns,
    cards,
    lanes,
    assignees,
  };
  if (JSON.stringify(result).length > 2_000_000)
    throw new Error('보드 내용은 2백만 자 이내로 전달해 주세요.');
  return result;
}
export function updateTaskBoard(
  input: TaskBoardData,
  action: TaskBoardAction,
): TaskBoardData {
  const data = validateTaskBoard(input);
  let { columns, cards, lanes } = data;
  const exists = (items: readonly { id: string }[], id: string) => {
    if (!items.some((item) => item.id === id))
      throw new Error('변경할 항목이 없어요. 현재 보드를 다시 확인해 주세요.');
  };
  switch (action.type) {
    case 'put-card':
      cards = cards.some((card) => card.id === action.card.id)
        ? cards.map((card) => (card.id === action.card.id ? action.card : card))
        : [...cards, action.card];
      break;
    case 'delete-card':
      exists(cards, action.id);
      cards = cards.filter((card) => card.id !== action.id);
      break;
    case 'move-card': {
      exists(cards, action.id);
      exists(columns, action.columnId);
      const card = cards.find((item) => item.id === action.id)!;
      if (action.beforeId === action.id) return data;
      const remaining = cards.filter((item) => item.id !== card.id);
      const before = action.beforeId
        ? remaining.find((item) => item.id === action.beforeId)
        : undefined;
      if (action.beforeId && (!before || before.columnId !== action.columnId))
        throw new Error('이동할 위치를 다시 선택해 주세요.');
      const moved = {
        ...card,
        columnId: action.columnId,
        laneId: action.laneId,
      };
      const index = before ? remaining.indexOf(before) : remaining.length;
      cards = [...remaining.slice(0, index), moved, ...remaining.slice(index)];
      break;
    }
    case 'put-column':
      columns = columns.some((column) => column.id === action.column.id)
        ? columns.map((column) =>
            column.id === action.column.id ? action.column : column,
          )
        : [...columns, action.column];
      break;
    case 'delete-column': {
      exists(columns, action.id);
      if (action.toColumnId === action.id)
        throw new Error('카드를 옮길 다른 열을 선택해 주세요.');
      if (action.toColumnId) exists(columns, action.toColumnId);
      if (
        cards.some((card) => card.columnId === action.id) &&
        !action.toColumnId
      )
        throw new Error('열을 삭제하기 전에 카드를 옮길 열을 선택해 주세요.');
      cards = cards.map((card) =>
        card.columnId === action.id
          ? { ...card, columnId: action.toColumnId! }
          : card,
      );
      columns = columns.filter((column) => column.id !== action.id);
      break;
    }
    case 'move-column': {
      exists(columns, action.id);
      if (
        !Number.isInteger(action.index) ||
        action.index < 0 ||
        action.index >= columns.length
      )
        throw new Error('열 위치를 다시 선택해 주세요.');
      const moved = columns.find((column) => column.id === action.id)!;
      const remaining = columns.filter((column) => column.id !== action.id);
      columns = [
        ...remaining.slice(0, action.index),
        moved,
        ...remaining.slice(action.index),
      ];
      break;
    }
    case 'put-lane':
      lanes = lanes.some((lane) => lane.id === action.lane.id)
        ? lanes.map((lane) => (lane.id === action.lane.id ? action.lane : lane))
        : [...lanes, action.lane];
      break;
    case 'delete-lane':
      exists(lanes, action.id);
      lanes = lanes.filter((lane) => lane.id !== action.id);
      cards = cards.map((card) =>
        card.laneId === action.id ? { ...card, laneId: undefined } : card,
      );
      break;
    default:
      throw new Error('지원하지 않는 보드 변경이에요.');
  }
  return validateTaskBoard({ ...data, columns, cards, lanes });
}
export function serializeTaskBoard(data: TaskBoardData): string {
  return JSON.stringify(validateTaskBoard(data));
}
export function parseTaskBoard(source: string): TaskBoardData {
  if (typeof source !== 'string' || source.length > 2_000_000)
    throw new Error('보드 파일은 2백만 자 이내로 불러와 주세요.');
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    throw new Error('보드 JSON 형식을 확인해 주세요.');
  }
  return validateTaskBoard(data);
}
