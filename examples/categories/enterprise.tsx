import { useState, type ReactNode } from 'react';
import {
  Calendar,
  Amount,
  DataExplorer,
  DataGrid,
  DataTable,
  EditableTable,
  Gantt,
  OrganizationChart,
  PivotTable,
  PropertyGrid,
  Scheduler,
  Spreadsheet,
  Stack,
  Text,
  TreeTable,
  VirtualTable,
  type DataColumn,
} from '@mega-ui/react';
import { CategoryCards } from './shell';

export const enterpriseNames = [
  'DataTable',
  'VirtualTable',
  'EditableTable',
  'TreeTable',
  'PivotTable',
  'PropertyGrid',
  'DataGrid',
  'Calendar',
  'Scheduler',
  'Gantt',
  'Spreadsheet',
  'OrganizationChart',
  'DataExplorer',
] as const;

type Payment = {
  id: string;
  customer: string;
  amount: number;
  status: string;
};

const paymentColumns: DataColumn<Payment>[] = [
  { key: 'customer', header: '고객', sortable: true },
  {
    key: 'amount',
    header: '금액',
    sortable: true,
    editable: true,
    inputType: 'number',
    numeric: true,
    render: (value) => <Amount value={Number(value)} />,
  },
  { key: 'status', header: '상태', editable: true },
];

const initialPayments: Payment[] = [
  { id: 'p1', customer: '김메가', amount: 128000, status: '완료' },
  { id: 'p2', customer: '이하늘', amount: 74000, status: '검토 중' },
  { id: 'p3', customer: '박바다', amount: 216000, status: '완료' },
];

const getPaymentId = (row: Payment) => row.id;

export function EnterpriseCategory() {
  const [payments, setPayments] = useState(initialPayments);
  const [selectedRows, setSelectedRows] = useState<string[]>(['p1']);
  const [propertyOwner, setPropertyOwner] = useState('메가 운영팀');
  const [selectedDate, setSelectedDate] = useState('2026-09-09');
  const [scheduleMessage, setScheduleMessage] =
    useState('일정을 선택해 주세요.');
  const [sheet, setSheet] = useState<unknown[][]>([
    ['제품', '수량', '단가'],
    ['베이직', 12, 19000],
    ['프로', 7, 39000],
  ]);

  const demos: Record<(typeof enterpriseNames)[number], ReactNode> = {
    DataTable: (
      <DataTable
        rows={payments}
        columns={paymentColumns}
        getRowId={getPaymentId}
        filterable
        initialSort={{ key: 'amount', direction: 'desc' }}
        label="결제 데이터"
      />
    ),
    VirtualTable: (
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          1,000개 중 보이는 고정 높이 행만 렌더해요.
        </Text>
        <div className="demo-overflow demo-virtual">
          <VirtualTable
            height={264}
            rows={Array.from({ length: 1000 }, (_, index) => ({
              id: String(index),
              customer: `고객 ${index + 1}`,
              amount: (index + 1) * 1200,
              status: index % 2 ? '완료' : '대기',
            }))}
            columns={paymentColumns}
            getRowId={getPaymentId}
          />
        </div>
      </Stack>
    ),
    EditableTable: (
      <EditableTable
        rows={payments}
        columns={paymentColumns}
        getRowId={getPaymentId}
        onCellChange={(rowId, key, value) =>
          setPayments((rows) =>
            rows.map((row) =>
              row.id === rowId
                ? { ...row, [key]: key === 'amount' ? Number(value) : value }
                : row,
            ),
          )
        }
      />
    ),
    TreeTable: (
      <TreeTable
        nodes={[
          {
            row: { id: 'hq', customer: '본사', amount: 418000, status: '운영' },
            children: [
              {
                row: {
                  id: 'sales',
                  customer: '영업팀',
                  amount: 202000,
                  status: '운영',
                },
              },
              {
                row: {
                  id: 'product',
                  customer: '제품팀',
                  amount: 216000,
                  status: '운영',
                },
              },
            ],
          },
        ]}
        columns={paymentColumns}
        getRowId={getPaymentId}
        defaultExpandedIds={['hq']}
      />
    ),
    PivotTable: (
      <PivotTable
        rows={[
          { team: '제품', quarter: '1분기', amount: 42 },
          { team: '제품', quarter: '2분기', amount: 58 },
          { team: '영업', quarter: '1분기', amount: 71 },
          { team: '영업', quarter: '2분기', amount: 83 },
        ]}
        rowKey="team"
        columnKey="quarter"
        valueKey="amount"
      />
    ),
    PropertyGrid: (
      <PropertyGrid
        items={[
          {
            name: 'owner',
            label: '담당 조직',
            value: propertyOwner,
            editable: true,
            description: '운영 알림을 받는 조직',
          },
          { name: 'region', label: '리전', value: '서울' },
          { name: 'retention', label: '보관 기간', value: '90일' },
        ]}
        onValueChange={(_, value) => setPropertyOwner(value)}
      />
    ),
    DataGrid: (
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          방향키로 셀을 이동하고 체크박스로 행을 선택해요.
        </Text>
        <DataGrid
          rows={payments}
          columns={paymentColumns}
          getRowId={getPaymentId}
          selectedIds={selectedRows}
          onSelectionChange={setSelectedRows}
        />
      </Stack>
    ),
    Calendar: (
      <Calendar
        month="2026-09"
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        events={[
          { id: 'c1', date: '2026-09-09', title: '릴리스' },
          { id: 'c2', date: '2026-09-17', title: '회고' },
        ]}
      />
    ),
    Scheduler: (
      <Stack gap={2}>
        <Text size="sm" tone="muted" role="status">
          {scheduleMessage}
        </Text>
        <Scheduler
          appointments={[
            {
              id: 's1',
              date: '2026-09-09',
              start: '09:00',
              end: '09:30',
              title: '운영 점검',
              resource: '회의실 A',
            },
            {
              id: 's2',
              date: '2026-09-09',
              start: '14:00',
              end: '15:00',
              title: '디자인 리뷰',
              resource: '온라인',
            },
          ]}
          onAppointmentClick={(item) =>
            setScheduleMessage(`${String(item.title)} 일정을 선택했어요.`)
          }
        />
      </Stack>
    ),
    Gantt: (
      <div className="demo-overflow">
        <Gantt
          tasks={[
            {
              id: 'g1',
              title: '설계',
              start: '2026-09-01',
              end: '2026-09-04',
              progress: 100,
            },
            {
              id: 'g2',
              title: '개발',
              start: '2026-09-03',
              end: '2026-09-12',
              progress: 60,
            },
            {
              id: 'g3',
              title: '검증',
              start: '2026-09-11',
              end: '2026-09-16',
              progress: 20,
            },
          ]}
        />
      </div>
    ),
    Spreadsheet: (
      <div className="demo-overflow">
        <Spreadsheet
          cells={sheet}
          onCellChange={(row, column, value) =>
            setSheet((cells) =>
              cells.map((current, rowIndex) =>
                rowIndex === row
                  ? current.map((cell, columnIndex) =>
                      columnIndex === column ? value : cell,
                    )
                  : current,
              ),
            )
          }
        />
      </div>
    ),
    OrganizationChart: (
      <OrganizationChart
        root={{
          id: 'ceo',
          label: '대표',
          detail: '김메가',
          children: [
            {
              id: 'product',
              label: '제품',
              detail: '12명',
              children: [{ id: 'design', label: '디자인', detail: '4명' }],
            },
            { id: 'business', label: '사업', detail: '9명' },
          ],
        }}
      />
    ),
    DataExplorer: (
      <DataExplorer
        rows={payments}
        columns={paymentColumns}
        getRowId={getPaymentId}
      />
    ),
  };

  return (
    <CategoryCards code="ENTERPRISE" order={enterpriseNames} demos={demos} />
  );
}
