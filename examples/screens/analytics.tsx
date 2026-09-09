import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertDialog,
  Badge,
  BarChart,
  Button,
  Card,
  Chip,
  DataExplorer,
  DateRangePicker,
  EditableTable,
  Field,
  FormActions,
  Heading,
  IconButton,
  Input,
  MultiSelect,
  PageHeader,
  PivotTable,
  PropertyGrid,
  SegmentedControl,
  Select,
  Sheet,
  SplitButton,
  Stack,
  Stat,
  Spreadsheet,
  TabPanel,
  Tabs,
  Text,
  Textarea,
  ToastProvider,
  TreeSelect,
  TreeTable,
  useToast,
  type DataColumn,
  type TreeTableNode,
} from '@mega-ui/react';
import { ExampleIcon } from '../icons';

/* ------------------------------------------------------------------ */
/* BI 분석 워크벤치                                                     */
/* ------------------------------------------------------------------ */

interface SalesRow {
  주문번호: string;
  '판매 채널': string;
  지역: string;
  상품군: string;
  분기: string;
  '고객 등급': string;
  매출: number;
  '주문 수': number;
  '신규 고객': number;
}

const channels = ['자사몰', '스마트스토어', '쿠팡', '29CM'];
const regions = ['서울', '경기', '부산', '대구', '광주'];
const productGroups = ['의류', '가전', '식품', '리빙'];
const quarters = ['2026-Q1', '2026-Q2', '2026-Q3'];
const grades = ['VIP', '일반', '신규'];

/** 12,000행은 모듈 로드가 아니라 화면이 열릴 때 만듭니다. */
const buildSalesRows = (): SalesRow[] =>
  Array.from({ length: 12000 }, (_, index) => ({
    주문번호: `OD-${String(700000 + index)}`,
    '판매 채널': channels[index % 4]!,
    상품군: productGroups[Math.floor(index / 4) % 4]!,
    지역: regions[Math.floor(index / 16) % 5]!,
    분기: quarters[Math.floor(index / 80) % 3]!,
    '고객 등급': grades[Math.floor(index / 240) % 3]!,
    매출: 18000 + ((index * 3719) % 940000),
    '주문 수': 1 + (index % 9),
    '신규 고객': index % 5 === 0 ? 1 : 0,
  }));

type DimensionKey = '판매 채널' | '지역' | '상품군' | '분기' | '고객 등급';
type MeasureKey = '매출' | '주문 수' | '신규 고객';

const dimensionGroups = [
  {
    label: '고객',
    options: [
      { label: '지역', value: '지역' },
      { label: '고객 등급', value: '고객 등급' },
    ],
  },
  {
    label: '상품·채널',
    options: [
      { label: '상품군', value: '상품군' },
      { label: '판매 채널', value: '판매 채널' },
    ],
  },
  {
    label: '기간',
    options: [{ label: '분기', value: '분기' }],
  },
];

const filterFields = [
  { value: '판매 채널', label: '판매 채널' },
  { value: '지역', label: '지역' },
  { value: '상품군', label: '상품군' },
  { value: '분기', label: '분기' },
  { value: '고객 등급', label: '고객 등급' },
  { value: '매출', label: '매출' },
  { value: '주문 수', label: '주문 수' },
];

const operators = [
  { value: 'eq', label: '같음' },
  { value: 'ne', label: '같지 않음' },
  { value: 'contains', label: '포함' },
  { value: 'gte', label: '이상' },
  { value: 'lte', label: '이하' },
];

type Operator = 'eq' | 'ne' | 'contains' | 'gte' | 'lte';

interface Condition {
  kind: 'condition';
  id: string;
  field: string;
  operator: Operator;
  value: string;
}
interface QueryGroup {
  kind: 'group';
  id: string;
  join: 'AND' | 'OR';
  items: QueryNode[];
}
type QueryNode = Condition | QueryGroup;

let nodeSeq = 0;
const nextId = () => `q${(nodeSeq += 1)}`;

const condition = (
  field: string,
  operator: Operator,
  value: string,
): Condition => ({
  kind: 'condition',
  id: nextId(),
  field,
  operator,
  value,
});
const group = (join: 'AND' | 'OR', items: QueryNode[]): QueryGroup => ({
  kind: 'group',
  id: nextId(),
  join,
  items,
});

const matchCondition = (row: SalesRow, node: Condition) => {
  const raw = row[node.field as keyof SalesRow];
  if (typeof raw === 'number') {
    const target = Number(node.value);
    if (!Number.isFinite(target)) return true;
    if (node.operator === 'gte') return raw >= target;
    if (node.operator === 'lte') return raw <= target;
    if (node.operator === 'ne') return raw !== target;
    return raw === target;
  }
  const text = String(raw ?? '');
  const value = node.value.trim();
  if (!value) return true;
  if (node.operator === 'contains') return text.includes(value);
  if (node.operator === 'ne') return text !== value;
  return text === value;
};

const matchNode = (row: SalesRow, node: QueryNode): boolean => {
  if (node.kind === 'condition') return matchCondition(row, node);
  if (!node.items.length) return true;
  return node.join === 'AND'
    ? node.items.every((item) => matchNode(row, item))
    : node.items.some((item) => matchNode(row, item));
};

const replaceNode = (
  root: QueryGroup,
  id: string,
  update: (node: QueryNode) => QueryNode | null,
): QueryGroup => ({
  ...root,
  items: root.items.flatMap((item) => {
    if (item.id === id) {
      const next = update(item);
      return next ? [next] : [];
    }
    return item.kind === 'group' ? [replaceNode(item, id, update)] : [item];
  }),
});

interface Segment {
  id: string;
  name: string;
  query: QueryGroup;
  rowDimension: DimensionKey;
  columnDimension: DimensionKey;
  measure: MeasureKey;
  aggregate: 'sum' | 'count' | 'average';
}

const defaultSegments: Segment[] = [
  {
    id: 's1',
    name: '3분기 수도권 매출',
    query: group('AND', [
      condition('분기', 'eq', '2026-Q3'),
      group('OR', [
        condition('지역', 'eq', '서울'),
        condition('지역', 'eq', '경기'),
      ]),
    ]),
    rowDimension: '판매 채널',
    columnDimension: '상품군',
    measure: '매출',
    aggregate: 'sum',
  },
  {
    id: 's2',
    name: 'VIP 고액 주문',
    query: group('AND', [
      condition('고객 등급', 'eq', 'VIP'),
      condition('매출', 'gte', '500000'),
    ]),
    rowDimension: '지역',
    columnDimension: '분기',
    measure: '매출',
    aggregate: 'average',
  },
  {
    id: 's3',
    name: '신규 고객 유입',
    query: group('OR', [
      condition('판매 채널', 'eq', '쿠팡'),
      condition('판매 채널', 'eq', '29CM'),
    ]),
    rowDimension: '판매 채널',
    columnDimension: '고객 등급',
    measure: '신규 고객',
    aggregate: 'count',
  },
];

const measureOptions = [
  { label: '매출', value: '매출' },
  { label: '주문 수', value: '주문 수' },
  { label: '신규 고객', value: '신규 고객' },
];

export function AnalyticsWorkbenchExample() {
  return (
    <ToastProvider>
      <AnalyticsWorkbench />
    </ToastProvider>
  );
}

function AnalyticsWorkbench() {
  const toast = useToast();
  const salesRows = useMemo(buildSalesRows, []);
  const [segments, setSegments] = useState(defaultSegments);
  const [segmentId, setSegmentId] = useState('s1');
  const [config, setConfig] = useState<Segment>(defaultSegments[0]!);
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify(defaultSegments[0]),
  );
  const [range, setRange] = useState({
    start: '2026-07-01',
    end: '2026-09-30',
  });
  const [series, setSeries] = useState<string[]>([]);
  const [pendingSegment, setPendingSegment] = useState<Segment | null>(null);

  const dirty = JSON.stringify(config) !== baseline;

  const { rows, elapsed } = useMemo(() => {
    const started = performance.now();
    const matched = salesRows.filter((row) => matchNode(row, config.query));
    return { rows: matched, elapsed: Math.round(performance.now() - started) };
  }, [salesRows, config.query]);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + row[config.measure], 0),
    [rows, config.measure],
  );

  const chartData = useMemo(() => {
    const buckets = new Map<string, number>();
    rows.forEach((row) => {
      const key = String(row[config.rowDimension]);
      buckets.set(key, (buckets.get(key) ?? 0) + row[config.measure]);
    });
    return [...buckets.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [rows, config.rowDimension, config.measure]);

  const sample = rows.slice(0, 200);
  const seriesOptions = chartData.map((item) => ({
    label: item.label,
    value: item.label,
  }));
  const activeSeries = series.filter((value) =>
    seriesOptions.some((option) => option.value === value),
  );
  const visibleChart = activeSeries.length
    ? chartData.filter((item) => activeSeries.includes(item.label))
    : chartData;

  const explorerColumns: DataColumn<SalesRow>[] = [
    { key: '주문번호', header: '주문번호' },
    { key: '판매 채널', header: '판매 채널' },
    { key: '지역', header: '지역' },
    { key: '상품군', header: '상품군' },
    { key: '분기', header: '분기' },
    { key: '고객 등급', header: '고객 등급' },
    {
      key: '매출',
      header: '매출',
      numeric: true,
      render: (value) => `${Number(value).toLocaleString('ko-KR')}원`,
    },
  ];

  const applySegment = (segment: Segment, force = false) => {
    if (dirty && !force) {
      setPendingSegment(segment);
      return;
    }
    setPendingSegment(null);
    setSegmentId(segment.id);
    setConfig(segment);
    setBaseline(JSON.stringify(segment));
  };

  const saveSegment = () => {
    setSegments((list) =>
      list.map((item) => (item.id === config.id ? config : item)),
    );
    setBaseline(JSON.stringify(config));
    toast({ title: `${config.name} 조건을 저장했어요`, tone: 'success' });
  };

  const saveAsSegment = () => {
    const created = {
      ...config,
      id: `s${segments.length + 1}`,
      name: `${config.name} 사본`,
    };
    setSegments((list) => [...list, created]);
    setSegmentId(created.id);
    setConfig(created);
    setBaseline(JSON.stringify(created));
    toast({ title: `${created.name}으로 저장했어요`, tone: 'success' });
  };

  const updateQuery = (next: QueryGroup) =>
    setConfig((current) => ({ ...current, query: next }));

  return (
    <div className="bi-screen">
      <PageHeader
        title="매출 분석 워크벤치"
        description="중첩 조건으로 12,000건을 걸러 피벗과 차트로 비교하고, 세그먼트로 저장합니다."
        actions={
          <>
            <SplitButton
              variant="secondary"
              menuLabel="세그먼트 저장 방식"
              onAction={saveSegment}
              items={[
                { label: '다른 이름으로 저장', onSelect: saveAsSegment },
                {
                  label: '저장된 조건으로 되돌리기',
                  onSelect: () => {
                    const saved = segments.find(
                      (item) => item.id === segmentId,
                    );
                    if (saved) applySegment(saved, true);
                  },
                },
              ]}
            >
              세그먼트 저장
            </SplitButton>
            <Button leading={<ExampleIcon name="download" />}>
              결과 내보내기
            </Button>
          </>
        }
      />
      <Card padding="sm" className="bi-segments">
        <Text as="span" size="sm" weight="semibold">
          저장된 세그먼트
        </Text>
        {segments.map((segment) => (
          <Chip
            key={segment.id}
            selected={segment.id === segmentId}
            onClick={() => applySegment(segment)}
          >
            {segment.name}
          </Chip>
        ))}
        {dirty ? (
          <Badge tone="warning">저장하지 않은 조건 변경</Badge>
        ) : (
          <Badge tone="neutral">저장된 조건과 같음</Badge>
        )}
      </Card>
      <div className="bi-layout">
        <Card padding="sm" className="bi-builder">
          <Heading level={2} size="sm">
            조건 만들기
          </Heading>
          <Text size="sm" tone="muted">
            그룹 안에서 AND와 OR를 바꿔 조건을 겹칠 수 있어요.
          </Text>
          <QueryGroupEditor
            node={config.query}
            depth={0}
            onChange={updateQuery}
            onRemove={() => updateQuery(group('AND', []))}
          />
          <DateRangePicker
            label="조회 기간"
            startName="bi-start"
            endName="bi-end"
            startProps={{ value: range.start }}
            endProps={{ value: range.end }}
            onValueChange={setRange}
            presets={[
              { label: '이번 분기', start: '2026-07-01', end: '2026-09-30' },
              { label: '올해 전체', start: '2026-01-01', end: '2026-12-31' },
            ]}
          />
          <Text size="xs" tone="muted">
            기간은 예제 데이터의 분기 값과 따로 계산해요. 조건에 반영하려면 분기
            조건을 함께 넣어 주세요.
          </Text>
        </Card>
        <div className="bi-result">
          <Card padding="sm" className="bi-controls">
            <Field label="행 차원" htmlFor="bi-row">
              <TreeSelect
                id="bi-row"
                groups={dimensionGroups}
                value={config.rowDimension}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    rowDimension: event.currentTarget.value as DimensionKey,
                  }))
                }
              />
            </Field>
            <Field label="열 차원" htmlFor="bi-column">
              <TreeSelect
                id="bi-column"
                groups={dimensionGroups}
                value={config.columnDimension}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    columnDimension: event.currentTarget.value as DimensionKey,
                  }))
                }
              />
            </Field>
            <Field label="측정값" htmlFor="bi-measure">
              <Select
                id="bi-measure"
                value={config.measure}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    measure: event.currentTarget.value as MeasureKey,
                  }))
                }
              >
                {measureOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="집계 방식" htmlFor="bi-aggregate">
              <Select
                id="bi-aggregate"
                value={config.aggregate}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    aggregate: event.currentTarget
                      .value as Segment['aggregate'],
                  }))
                }
              >
                <option value="sum">합계</option>
                <option value="average">평균</option>
                <option value="count">건수</option>
              </Select>
            </Field>
          </Card>
          <div className="bi-kpis">
            <Card>
              <Stat
                label="조건을 통과한 행"
                value={rows.length.toLocaleString('ko-KR')}
                unit="행"
                hint={`전체 ${salesRows.length.toLocaleString('ko-KR')}행`}
              />
            </Card>
            <Card>
              <Stat
                label={`${config.measure} 합계`}
                value={total.toLocaleString('ko-KR')}
              />
            </Card>
            <Card>
              <Stat
                label="브라우저 집계 시간"
                value={`${elapsed}ms`}
                hint="현재 화면에서 측정한 값이에요"
              />
            </Card>
          </div>
          {rows.length ? (
            <>
              <Card padding="sm" className="bi-pivot">
                <Heading level={2} size="sm">
                  {config.rowDimension} × {config.columnDimension}
                </Heading>
                <PivotTable
                  rows={rows}
                  rowKey={config.rowDimension}
                  columnKey={config.columnDimension}
                  valueKey={config.measure}
                  aggregate={config.aggregate}
                  label={`${config.rowDimension}별 ${config.measure} 피벗`}
                />
              </Card>
              <Card padding="sm" className="bi-chart">
                <MultiSelect
                  label="차트에 표시할 항목"
                  name="bi-series"
                  options={seriesOptions}
                  value={activeSeries}
                  onValueChange={setSeries}
                  emptyMessage="이 차원에는 표시할 항목이 없어요."
                />
                <Text size="xs" tone="muted">
                  선택하지 않으면 전체 항목을 보여줘요.
                </Text>
                <BarChart
                  label={`${config.rowDimension}별 ${config.measure} 합계`}
                  data={visibleChart}
                  orientation="horizontal"
                  formatValue={(value) => value.toLocaleString('ko-KR')}
                  emptyMessage="선택한 항목이 없어요. 전체 항목을 보려면 선택을 지워 주세요."
                />
              </Card>
              <Card padding="sm" className="bi-explorer">
                <Heading level={2} size="sm">
                  원본 표본 200행
                </Heading>
                <DataExplorer
                  label="조건을 통과한 원본 데이터"
                  rows={sample}
                  columns={explorerColumns}
                  getRowId={(row) => row.주문번호}
                />
              </Card>
            </>
          ) : (
            <Card padding="sm">
              <Alert tone="warning">
                조건을 통과한 행이 없어요. 값이 좁게 잡혔는지 조건을 확인해
                주세요.
              </Alert>
            </Card>
          )}
        </div>
      </div>
      <AlertDialog
        open={pendingSegment !== null}
        onClose={() => setPendingSegment(null)}
        title="저장하지 않은 조건이 있어요"
        description="다른 세그먼트를 열면 지금 만든 조건은 사라져요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setPendingSegment(null)}>
              계속 편집
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                pendingSegment && applySegment(pendingSegment, true)
              }
            >
              조건 버리고 열기
            </Button>
          </>
        }
      />
    </div>
  );
}

function QueryGroupEditor({
  node,
  depth,
  onChange,
  onRemove,
}: {
  node: QueryGroup;
  depth: number;
  onChange: (next: QueryGroup) => void;
  onRemove: () => void;
}) {
  const update = (id: string, next: (item: QueryNode) => QueryNode | null) =>
    onChange(replaceNode(node, id, next));

  return (
    <fieldset className="bi-group" data-depth={depth}>
      <legend>{depth === 0 ? '전체 조건' : '조건 그룹'}</legend>
      <Stack direction="row" gap={2} align="center" wrap>
        <SegmentedControl
          label="조건 결합 방식"
          name={`join-${node.id}`}
          options={[
            { label: '모두 만족(AND)', value: 'AND' },
            { label: '하나만 만족(OR)', value: 'OR' },
          ]}
          value={node.join}
          onValueChange={(value) =>
            onChange({ ...node, join: value as 'AND' | 'OR' })
          }
        />
        {depth > 0 ? (
          <Button size="xs" variant="text" onClick={onRemove}>
            이 그룹 삭제
          </Button>
        ) : null}
      </Stack>
      <ul className="bi-nodes">
        {node.items.map((item) => (
          <li key={item.id}>
            {item.kind === 'group' ? (
              <QueryGroupEditor
                node={item}
                depth={depth + 1}
                onChange={(next) => update(item.id, () => next)}
                onRemove={() => update(item.id, () => null)}
              />
            ) : (
              <div className="bi-condition">
                <Select
                  aria-label="조건 필드"
                  value={item.field}
                  onChange={(event) =>
                    update(item.id, () => ({
                      ...item,
                      field: event.currentTarget.value,
                      value: '',
                    }))
                  }
                >
                  {filterFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label="비교 방식"
                  value={item.operator}
                  onChange={(event) =>
                    update(item.id, () => ({
                      ...item,
                      operator: event.currentTarget.value as Operator,
                    }))
                  }
                >
                  {operators.map((operator) => (
                    <option key={operator.value} value={operator.value}>
                      {operator.label}
                    </option>
                  ))}
                </Select>
                <Input
                  aria-label="비교할 값"
                  placeholder="예: 서울, 500000"
                  value={item.value}
                  onChange={(event) =>
                    update(item.id, () => ({
                      ...item,
                      value: event.currentTarget.value,
                    }))
                  }
                />
                <IconButton
                  label={`${item.field} 조건 삭제`}
                  onClick={() => update(item.id, () => null)}
                >
                  <ExampleIcon name="close" />
                </IconButton>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Stack direction="row" gap={2}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onChange({
              ...node,
              items: [...node.items, condition('지역', 'eq', '')],
            })
          }
        >
          조건 추가
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={depth >= 2}
          onClick={() =>
            onChange({
              ...node,
              items: [
                ...node.items,
                group('OR', [condition('지역', 'eq', '')]),
              ],
            })
          }
        >
          그룹 추가
        </Button>
      </Stack>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* 입고·재고 워크벤치                                                   */
/* ------------------------------------------------------------------ */

const sheetHeaders = [
  'SKU',
  '품목',
  '입고 수량',
  '매입 단가',
  '유통기한',
  '창고',
];
const warehouses = ['서울', '부산', '대전'];
const PASTE_LIMIT = 200;
const SERVER_LIMIT = 500;

const validators: ((value: string) => string)[] = [
  (value) =>
    /^SKU-\d{5}$/.test(value) ? '' : 'SKU-12345 형식으로 적어 주세요.',
  (value) => (value.trim() ? '' : '품목 이름을 적어 주세요.'),
  (value) =>
    /^\d+$/.test(value) && Number(value) > 0
      ? ''
      : '입고 수량은 1 이상 정수로 적어 주세요.',
  (value) =>
    /^\d+$/.test(value) ? '' : '매입 단가는 0 이상 정수로 적어 주세요.',
  (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? ''
      : '유통기한은 2026-12-31 형식으로 적어 주세요.',
  (value) =>
    warehouses.includes(value.trim())
      ? ''
      : `창고는 ${warehouses.join(', ')} 중에서 골라 주세요.`,
];

const initialSheet = Array.from({ length: 10 }, (_, row) =>
  row < 6
    ? [
        `SKU-${String(10230 + row)}`,
        [
          '면 티셔츠',
          '무선 이어폰',
          '현미 5kg',
          '유리컵 4입',
          '캠핑 의자',
          '핸드크림',
        ][row]!,
        String([120, 640, 80, 240, 45, 310][row]),
        String([12800, 79000, 21500, 9800, 54000, 7400][row]),
        [
          '2027-03-31',
          '2029-01-31',
          '2026-11-30',
          '2030-12-31',
          '2029-06-30',
          '2027-08-31',
        ][row]!,
        warehouses[row % warehouses.length]!,
      ]
    : Array.from({ length: 6 }, () => ''),
);

interface StockNode {
  id: string;
  name: string;
  onHand: number;
  safety: number;
  state: string;
}

const stockTree: TreeTableNode<StockNode>[] = [
  {
    row: {
      id: 'w-seoul',
      name: '서울 물류센터',
      onHand: 4820,
      safety: 3600,
      state: '정상',
    },
    children: [
      {
        row: {
          id: 'w-seoul-a',
          name: 'A구역 · 의류',
          onHand: 2140,
          safety: 1800,
          state: '정상',
        },
        children: [
          {
            row: {
              id: 'sku-10230',
              name: 'SKU-10230 면 티셔츠',
              onHand: 1240,
              safety: 900,
              state: '정상',
            },
          },
          {
            row: {
              id: 'sku-10233',
              name: 'SKU-10233 유리컵 4입',
              onHand: 900,
              safety: 900,
              state: '보충 임박',
            },
          },
        ],
      },
      {
        row: {
          id: 'w-seoul-b',
          name: 'B구역 · 가전',
          onHand: 2680,
          safety: 1800,
          state: '정상',
        },
        children: [
          {
            row: {
              id: 'sku-10231',
              name: 'SKU-10231 무선 이어폰',
              onHand: 2680,
              safety: 1800,
              state: '정상',
            },
          },
        ],
      },
    ],
  },
  {
    row: {
      id: 'w-busan',
      name: '부산 물류센터',
      onHand: 1360,
      safety: 1900,
      state: '보충 필요',
    },
    children: [
      {
        row: {
          id: 'w-busan-a',
          name: 'A구역 · 식품',
          onHand: 1360,
          safety: 1900,
          state: '보충 필요',
        },
        children: [
          {
            row: {
              id: 'sku-10232',
              name: 'SKU-10232 현미 5kg',
              onHand: 620,
              safety: 1200,
              state: '보충 필요',
            },
          },
          {
            row: {
              id: 'sku-10235',
              name: 'SKU-10235 핸드크림',
              onHand: 740,
              safety: 700,
              state: '정상',
            },
          },
        ],
      },
    ],
  },
];

interface SafetyRow {
  id: string;
  name: string;
  safety: string;
  leadTime: string;
}

const initialSafety: SafetyRow[] = [
  {
    id: 'sku-10230',
    name: 'SKU-10230 면 티셔츠',
    safety: '900',
    leadTime: '5',
  },
  {
    id: 'sku-10231',
    name: 'SKU-10231 무선 이어폰',
    safety: '1800',
    leadTime: '12',
  },
  {
    id: 'sku-10232',
    name: 'SKU-10232 현미 5kg',
    safety: '1200',
    leadTime: '3',
  },
];

export function InventoryIntakeExample() {
  return (
    <ToastProvider>
      <InventoryIntake />
    </ToastProvider>
  );
}

function InventoryIntake() {
  const toast = useToast();
  const [cells, setCells] = useState<string[][]>(initialSheet);
  const [snapshot, setSnapshot] = useState<string[][] | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteMode, setPasteMode] = useState('append');
  const [resetOpen, setResetOpen] = useState(false);
  const [tab, setTab] = useState('sheet');
  const [safety, setSafety] = useState(initialSafety);
  const [item, setItem] = useState<Record<string, string>>({
    담당자: '정민지',
    검수: '샘플 검수',
  });
  const sheetRef = useRef<HTMLDivElement>(null);

  const filled = cells.filter((row) => row.some((cell) => cell.trim()));

  const errors = cells.flatMap((row, rowIndex) =>
    row.some((cell) => cell.trim())
      ? row.flatMap((cell, columnIndex) => {
          const message = validators[columnIndex]?.(cell) ?? '';
          return message
            ? [{ rowIndex, columnIndex, message, value: cell }]
            : [];
        })
      : [],
  );

  const setCell = (row: number, column: number, value: string) => {
    setDirty(true);
    setCells((current) =>
      current.map((line, index) =>
        index === row
          ? line.map((cell, position) => (position === column ? value : cell))
          : line,
      ),
    );
  };

  /* ponytail: 셀 이동은 Spreadsheet가 만드는 aria-label(열 라벨 + 행 번호)로
     찾습니다. 전용 focus API가 생기면 그걸로 바꿉니다. */
  const focusCell = (row: number, column: number) => {
    const name = `${sheetHeaders[column]}${row + 1}`;
    sheetRef.current
      ?.querySelector<HTMLInputElement>(`input[aria-label="${name}"]`)
      ?.focus();
  };

  const parsePaste = () => {
    const lines = pasteText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return lines.map((line) =>
      (line.includes('\t') ? line.split('\t') : line.split(','))
        .map((value) => value.trim())
        .slice(0, sheetHeaders.length),
    );
  };

  const pasteRows = pasteText.trim() ? parsePaste() : [];
  const pasteTooMany = pasteRows.length > PASTE_LIMIT;

  const applyPaste = () => {
    const parsed = pasteRows.map((row) =>
      Array.from(
        { length: sheetHeaders.length },
        (_, index) => row[index] ?? '',
      ),
    );
    setSnapshot(cells);
    setCells(pasteMode === 'replace' ? parsed : [...filled, ...parsed]);
    setDirty(true);
    setPasteOpen(false);
    setPasteText('');
    toast({
      title: `${parsed.length}행을 시트에 넣었어요`,
      description: '되돌리기로 이전 시트를 복구할 수 있어요.',
      tone: 'success',
    });
  };

  /** 저장은 부분 성공을 허용합니다. 서버가 거절한 행만 시트에 남습니다. */
  const save = () => {
    if (errors.length) {
      focusCell(errors[0]!.rowIndex, errors[0]!.columnIndex);
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      const rejected = filled.filter((row) => Number(row[2]) > SERVER_LIMIT);
      const accepted = filled.length - rejected.length;
      setSnapshot(cells);
      setSaving(false);
      setSavedCount(accepted);
      setDirty(rejected.length > 0);
      setCells(
        rejected.length
          ? rejected
          : Array.from({ length: 4 }, () =>
              Array.from({ length: sheetHeaders.length }, () => ''),
            ),
      );
      if (rejected.length) {
        toast({
          title: `${accepted}행을 저장하고 ${rejected.length}행은 남겼어요`,
          description: `한 번에 ${SERVER_LIMIT}개를 넘는 입고는 승인이 필요해요.`,
          tone: 'danger',
          duration: 0,
        });
        return;
      }
      toast({ title: `${accepted}행을 저장했어요`, tone: 'success' });
    }, 700);
  };

  const undo = () => {
    if (!snapshot) return;
    setCells(snapshot);
    setSnapshot(null);
    setSavedCount(0);
    setDirty(true);
    toast({ title: '이전 시트로 되돌렸어요', tone: 'neutral' });
  };

  const safetyColumns: DataColumn<SafetyRow>[] = [
    { key: 'name', header: '품목' },
    {
      key: 'safety',
      header: '안전재고',
      numeric: true,
      editable: true,
      inputType: 'number',
    },
    {
      key: 'leadTime',
      header: '리드타임(일)',
      numeric: true,
      editable: true,
      inputType: 'number',
    },
  ];

  const stockColumns: DataColumn<StockNode>[] = [
    { key: 'name', header: '창고·구역·품목' },
    { key: 'onHand', header: '현재 재고', numeric: true },
    { key: 'safety', header: '안전재고', numeric: true },
    {
      key: 'state',
      header: '상태',
      render: (value) => (
        <Badge
          tone={
            String(value) === '보충 필요'
              ? 'danger'
              : String(value) === '보충 임박'
                ? 'warning'
                : 'success'
          }
        >
          {String(value)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="stock-screen">
      <PageHeader
        title="입고 등록·재고 워크벤치"
        description="시트에 입고를 입력하거나 붙여넣고, 검증을 통과한 행만 저장합니다."
        actions={
          <>
            <Button variant="secondary" onClick={() => setPasteOpen(true)}>
              붙여넣기로 채우기
            </Button>
            <Button variant="secondary" onClick={() => setResetOpen(true)}>
              시트 비우기
            </Button>
          </>
        }
      />
      <Tabs
        id="stock-tabs"
        label="재고 작업"
        items={[
          {
            value: 'sheet',
            label: '입고 시트',
            badge: errors.length || undefined,
          },
          { value: 'tree', label: '재고 계층' },
          { value: 'item', label: '품목 속성' },
        ]}
        value={tab}
        onValueChange={setTab}
      />
      <TabPanel tabsId="stock-tabs" value="sheet" active={tab === 'sheet'}>
        <Card padding="sm" className="stock-card">
          <form
            id="stock-intake"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <Stack direction="row" gap={3} align="center" wrap>
              <Text size="sm" weight="semibold">
                입력한 행 {filled.length}개
              </Text>
              <Badge tone={errors.length ? 'danger' : 'success'}>
                {errors.length ? `검증 오류 ${errors.length}건` : '검증 통과'}
              </Badge>
              {savedCount ? (
                <Badge tone="neutral">직전 저장 {savedCount}행</Badge>
              ) : null}
              {snapshot ? (
                <Button size="sm" variant="text" onClick={undo}>
                  되돌리기
                </Button>
              ) : null}
            </Stack>
            {errors.length ? (
              <Alert tone="danger" role="alert">
                <Text size="sm" weight="semibold">
                  고쳐야 할 셀 {errors.length}개
                </Text>
                <ul className="stock-errors">
                  {errors.slice(0, 6).map((error) => (
                    <li key={`${error.rowIndex}-${error.columnIndex}`}>
                      <Button
                        size="xs"
                        variant="text"
                        onClick={() =>
                          focusCell(error.rowIndex, error.columnIndex)
                        }
                      >
                        {error.rowIndex + 1}행 {sheetHeaders[error.columnIndex]}
                      </Button>
                      <Text as="span" size="sm">
                        {error.message}
                      </Text>
                    </li>
                  ))}
                </ul>
                {errors.length > 6 ? (
                  <Text size="sm">
                    나머지 {errors.length - 6}개는 셀을 고치면 이어서 보여요.
                  </Text>
                ) : null}
              </Alert>
            ) : null}
            <div ref={sheetRef} className="stock-sheet">
              <Spreadsheet
                label="입고 시트"
                cells={cells}
                columnLabels={sheetHeaders}
                onCellChange={setCell}
              />
            </div>
            <Text size="xs" tone="muted">
              한 번에 {SERVER_LIMIT}개를 넘는 입고 수량은 승인 대상이라 저장에서
              빠지고 시트에 남아요.
            </Text>
            <FormActions
              dirty={dirty}
              saving={saving}
              disabled={errors.length > 0 || filled.length === 0}
              submitLabel="입고 저장"
              cancelLabel="변경 되돌리기"
              onCancel={undo}
              status={
                errors.length
                  ? '오류를 고치면 저장할 수 있어요'
                  : dirty
                    ? '저장하지 않은 변경이 있어요'
                    : '변경 사항이 없어요'
              }
              statusTone={
                errors.length ? 'danger' : dirty ? 'warning' : 'neutral'
              }
            />
          </form>
        </Card>
      </TabPanel>
      <TabPanel tabsId="stock-tabs" value="tree" active={tab === 'tree'}>
        <Card padding="sm" className="stock-card">
          <TreeTable
            label="창고별 재고"
            nodes={stockTree}
            columns={stockColumns}
            getRowId={(row) => row.id}
            defaultExpandedIds={['w-seoul', 'w-busan']}
          />
        </Card>
      </TabPanel>
      <TabPanel tabsId="stock-tabs" value="item" active={tab === 'item'}>
        <div className="stock-item">
          <Card padding="sm">
            <Heading level={2} size="sm">
              품목 속성
            </Heading>
            <PropertyGrid
              label="SKU-10230 속성"
              items={[
                { name: 'SKU', value: 'SKU-10230' },
                { name: '품목', value: '면 티셔츠' },
                { name: '보관 온도', value: '상온' },
                {
                  name: '담당자',
                  value: item.담당자,
                  editable: true,
                  description: '입고 검수를 확인하는 사람이에요.',
                },
                {
                  name: '검수',
                  value: item.검수,
                  editable: true,
                  description: '전수 검수 또는 샘플 검수',
                },
              ]}
              onValueChange={(name, value) =>
                setItem((current) => ({ ...current, [name]: value }))
              }
            />
          </Card>
          <Card padding="sm">
            <Heading level={2} size="sm">
              안전재고 편집
            </Heading>
            <EditableTable
              label="안전재고"
              rows={safety}
              columns={safetyColumns}
              getRowId={(row) => row.id}
              onCellChange={(id, key, value) =>
                setSafety((rows) =>
                  rows.map((row) =>
                    row.id === id ? { ...row, [key]: value } : row,
                  ),
                )
              }
            />
          </Card>
        </div>
      </TabPanel>
      <Sheet
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="붙여넣기로 채우기"
        description="엑셀에서 복사한 행을 그대로 붙여 넣어요. 탭 또는 쉼표로 나뉜 6개 열을 읽어요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setPasteOpen(false)}>
              닫기
            </Button>
            <Button
              disabled={!pasteRows.length || pasteTooMany}
              onClick={applyPaste}
            >
              시트에 넣기
            </Button>
          </>
        }
      >
        <Field
          label="붙여넣을 데이터"
          htmlFor="stock-paste"
          hint={`${sheetHeaders.join(' · ')} 순서로 읽어요.`}
        >
          <Textarea
            id="stock-paste"
            rows={6}
            value={pasteText}
            aria-describedby="stock-paste-description"
            onChange={(event) => setPasteText(event.currentTarget.value)}
          />
        </Field>
        <SegmentedControl
          label="넣는 방식"
          name="stock-paste-mode"
          options={[
            { label: '아래에 추가', value: 'append' },
            { label: '시트 덮어쓰기', value: 'replace' },
          ]}
          value={pasteMode}
          onValueChange={setPasteMode}
        />
        {pasteTooMany ? (
          <Alert tone="danger" role="alert">
            한 번에 {PASTE_LIMIT}행까지 넣을 수 있어요. 지금 {pasteRows.length}
            행을 붙여 넣었어요.
          </Alert>
        ) : pasteRows.length ? (
          <Alert tone="info">
            {pasteRows.length}행 · {pasteRows[0]?.length ?? 0}열을 읽었어요.
            {pasteMode === 'replace'
              ? ' 시트를 덮어쓰지만 되돌리기로 복구할 수 있어요.'
              : ' 입력된 행 아래에 이어 붙여요.'}
          </Alert>
        ) : null}
      </Sheet>
      <AlertDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="시트를 비울까요?"
        description="입력한 행이 모두 지워져요. 되돌리기로 한 번은 복구할 수 있어요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              계속 편집
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setSnapshot(cells);
                setCells(
                  Array.from({ length: 6 }, () =>
                    Array.from({ length: sheetHeaders.length }, () => ''),
                  ),
                );
                setDirty(false);
                setResetOpen(false);
              }}
            >
              시트 비우기
            </Button>
          </>
        }
      />
    </div>
  );
}
