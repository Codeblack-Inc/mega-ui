import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Heading,
  Select,
  Stack,
  Text,
} from '@mega-ui/react';
import {
  DataGridPro,
  defaultGridView,
  getGridRows,
  parseGridView,
  serializeGridView,
  type GridColumn,
  type GridView,
} from '@mega-ui/react/data-grid';

type Order = {
  id: string;
  customer: string;
  team: string;
  status: string;
  quantity: number;
  price: number;
  due: string;
  approved: boolean;
  parent: string | null;
};
const getId = (row: Order) => row.id;
const getParent = (row: Order) => row.parent;
const columns: readonly GridColumn<Order>[] = [
  {
    key: 'id',
    header: '주문 번호',
    width: 140,
    frozen: 'start',
    groupable: false,
  },
  {
    key: 'customer',
    header: '고객',
    width: 160,
    editable: true,
    validate: (value) =>
      String(value ?? '').trim() ? '' : '고객명을 입력해 주세요.',
  },
  {
    key: 'team',
    header: '담당 팀',
    width: 140,
    kind: 'select',
    options: ['제품', '영업', '운영'],
    editable: true,
  },
  {
    key: 'status',
    header: '상태',
    width: 140,
    kind: 'select',
    options: ['대기', '검토', '완료'],
    editable: true,
  },
  {
    key: 'quantity',
    header: '수량',
    width: 120,
    kind: 'number',
    editable: true,
    aggregate: 'sum',
    validate: (value) =>
      typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
        ? undefined
        : '수량은 0 이상의 정수로 입력해 주세요.',
  },
  {
    key: 'price',
    header: '단가',
    width: 140,
    kind: 'number',
    editable: true,
    validate: (value) =>
      typeof value === 'number' && value >= 0
        ? undefined
        : '단가는 0 이상으로 입력해 주세요.',
  },
  {
    key: 'total',
    header: '주문 금액',
    width: 160,
    value: (row) => row.quantity * row.price,
    aggregate: 'sum',
    renderCell: ({ row }) =>
      `${(row.quantity * row.price).toLocaleString('ko')}원`,
  },
  { key: 'due', header: '납기일', width: 150, kind: 'date', editable: true },
  {
    key: 'approved',
    header: '승인',
    width: 110,
    kind: 'boolean',
    editable: true,
    renderCell: ({ row }) => (row.approved ? '승인' : '미승인'),
  },
];
const ROWS_KEY = 'mega-grid-pro-orders-v1',
  VIEW_KEY = 'mega-grid-pro-view-v1';
function createRows(count: number): Order[] {
  let stored: Record<string, Order> = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(ROWS_KEY) ?? '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      stored = parsed;
  } catch {
    /* Storage may be disabled; saving reports that error explicitly. */
  }
  return Array.from({ length: count }, (_, i) => {
    const id = `ORD-${String(i + 1).padStart(6, '0')}`;
    const base: Order = {
      id,
      customer: `고객 ${i + 1}`,
      team: ['제품', '영업', '운영'][i % 3]!,
      status: ['대기', '검토', '완료'][i % 3]!,
      quantity: (i % 10) + 1,
      price: 1000 * ((i % 20) + 1),
      due: `2026-09-${String((i % 28) + 1).padStart(2, '0')}`,
      approved: i % 2 === 0,
      parent:
        i % 10 === 0
          ? null
          : `ORD-${String(Math.floor(i / 10) * 10 + 1).padStart(6, '0')}`,
    };
    const row = stored[id];
    return row &&
      row.id === id &&
      typeof row.customer === 'string' &&
      Number.isFinite(row.quantity) &&
      Number.isFinite(row.price) &&
      typeof row.team === 'string' &&
      typeof row.status === 'string' &&
      typeof row.due === 'string' &&
      typeof row.approved === 'boolean'
      ? { ...base, ...row, parent: base.parent }
      : base;
  });
}
function initialView(): GridView {
  try {
    return parseGridView(localStorage.getItem(VIEW_KEY) ?? '');
  } catch {
    return { ...defaultGridView, pageSize: 100 };
  }
}
export function DataGridExample() {
  const [readOnly, setReadOnly] = useState(false);
  const [mode, setMode] = useState<'client' | 'server' | 'tree'>('client');
  const [count, setCount] = useState(2000);
  const [dataset, setDataset] = useState(() => createRows(2000));
  const [view, setView] = useState<GridView>(initialView);
  const [failSave, setFailSave] = useState(false);
  const [failLoad, setFailLoad] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [loaded, setLoaded] = useState<readonly Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const result = useMemo(
    () => getGridRows(dataset, columns, view),
    [dataset, view],
  );
  useEffect(() => {
    if (mode !== 'server') return;
    setLoading(true);
    setLoadError('');
    const timer = setTimeout(() => {
      if (failLoad) {
        setLoadError(
          '데이터를 불러오지 못했어요. 조회 실패 설정을 끄고 다시 불러와 주세요.',
        );
        setLoaded([]);
      } else
        setLoaded(
          result.slice(
            (view.page - 1) * view.pageSize,
            view.page * view.pageSize,
          ),
        );
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [mode, result, view.page, view.pageSize, failLoad, reload]);
  const updateRows = (next: readonly Order[]) => {
    if (mode === 'server') {
      const byId = new Map(next.map((row) => [row.id, row]));
      setDataset((current) => current.map((row) => byId.get(row.id) ?? row));
      setLoaded((current) => current.map((row) => byId.get(row.id) ?? row));
    } else setDataset([...next]);
  };
  return (
    <Stack gap={5}>
      <div>
        <Text size="sm" tone="muted">
          MEGA UI · DATA GRID
        </Text>
        <Heading level={1}>주문 데이터 워크벤치</Heading>
        <Text tone="muted">
          {readOnly
            ? '데이터를 검색하고 정렬하거나 복사할 수 있어요.'
            : '저장한 변경 사항은 이 브라우저에서 새로 열어도 유지돼요.'}
        </Text>
      </div>
      <Card>
        <Stack gap={3}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Select
              aria-label="사용 모드"
              value={readOnly ? 'viewer' : 'editor'}
              disabled={dirty}
              onChange={(e) => setReadOnly(e.target.value === 'viewer')}
            >
              <option value="viewer">조회 전용</option>
              <option value="editor">편집 가능</option>
            </Select>
            <Select
              style={{ width: 220 }}
              aria-label="데이터 모드"
              value={mode}
              disabled={dirty}
              onChange={(e) => {
                setMode(e.target.value as typeof mode);
                setView({ ...defaultGridView, pageSize: 100 });
              }}
            >
              <option value="client">클라이언트 데이터</option>
              <option value="server">서버 페이지</option>
              <option value="tree">부모·자식 트리</option>
            </Select>
            <Select
              style={{ width: 180 }}
              aria-label="데이터 규모"
              value={count}
              disabled={dirty}
              onChange={(e) => {
                const size = Number(e.target.value);
                setCount(size);
                setDataset(createRows(size));
                setView({
                  ...defaultGridView,
                  pageSize: size >= 10000 ? 0 : 100,
                });
              }}
            >
              <option value={2000}>2,000행</option>
              <option value={10000}>10,000행</option>
              <option value={100000}>100,000행</option>
            </Select>
            {!readOnly && (
              <Checkbox
                checked={failSave}
                onChange={(e) => setFailSave(e.target.checked)}
              >
                저장 실패 시뮬레이션
              </Checkbox>
            )}
            <Checkbox
              checked={failLoad}
              onChange={(e) => setFailLoad(e.target.checked)}
            >
              조회 실패 시뮬레이션
            </Checkbox>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                try {
                  localStorage.setItem(VIEW_KEY, serializeGridView(view));
                  setSavedMessage('보기 설정을 저장했어요.');
                } catch {
                  setSavedMessage(
                    '브라우저에 보기를 저장하지 못했어요. 저장소 설정을 확인해 주세요.',
                  );
                }
              }}
            >
              보기 저장
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setView(initialView());
                setSavedMessage('보기 설정을 불러왔어요.');
              }}
            >
              보기 불러오기
            </Button>
          </div>
          <Text size="sm" tone="muted">
            데모 저장소는 이 브라우저의 localStorage입니다. 서버 모드는 취소
            가능한 응답을 기다리는 동안의 조회 동작을 보여드려요.
          </Text>
          {savedMessage && <Text role="status">{savedMessage}</Text>}
        </Stack>
      </Card>
      <DataGridPro
        key={mode}
        readOnly={readOnly}
        draftStorageKey={`mega-ui-order-draft-v1-${mode}`}
        label="주문 원장"
        rows={mode === 'server' ? loaded : dataset}
        columns={columns}
        getRowId={getId}
        view={view}
        onViewChange={setView}
        manual={mode === 'server'}
        rowCount={result.length}
        loading={mode === 'server' && loading}
        error={loadError}
        onRetry={() => setReload((n) => n + 1)}
        getParentId={mode === 'tree' ? getParent : undefined}
        treeColumnKey="customer"
        onRowsChange={updateRows}
        onDirtyChange={setDirty}
        onSave={async (changes, { rows, signal }) => {
          await new Promise<void>((resolve, reject) => {
            const abort = () => {
              clearTimeout(timer);
              reject(new Error('저장이 취소되었습니다.'));
            };
            const timer = setTimeout(() => {
              signal.removeEventListener('abort', abort);
              resolve();
            }, 250);
            signal.addEventListener('abort', abort, { once: true });
          });
          if (signal.aborted) throw new Error('저장이 취소되었습니다.');
          if (failSave) throw new Error('테스트용 서버 오류');
          const changedIds = new Set(changes.map((change) => change.rowId));
          const stored = JSON.parse(localStorage.getItem(ROWS_KEY) ?? '{}');
          for (const row of rows)
            if (changedIds.has(row.id)) stored[row.id] = row;
          localStorage.setItem(ROWS_KEY, JSON.stringify(stored));
          return rows;
        }}
      />
    </Stack>
  );
}
