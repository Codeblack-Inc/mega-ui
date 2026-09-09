import { TaskBoardDemo } from '../screens/task-board';
import { SchedulerProDemo } from '../screens/scheduler';
import { DiagramDemo } from '../screens/diagram';
import { SpreadsheetDemo } from '../screens/spreadsheet';
import { ChartProDemo } from '../chart-pro-demos';
import { useState } from 'react';
import { Checkbox, Select, Stack, Text } from '@mega-ui/react';
import { DataGridPro, type GridColumn } from '@mega-ui/react/data-grid';
import { TextEditor } from '@mega-ui/react/text-editor';
import { CartesianChart, PieChart } from '@mega-ui/react/charts';
import '@mega-ui/react/data-grid.css';
import '@mega-ui/react/text-editor.css';
import '@mega-ui/react/charts.css';
import { CategoryCards } from './shell';

type Order = { id: string; customer: string; quantity: number };
const columns: readonly GridColumn<Order>[] = [
  { key: 'id', header: '주문 번호' },
  { key: 'customer', header: '고객', editable: true },
  {
    key: 'quantity',
    header: '수량',
    kind: 'number',
    editable: true,
    validate: (value) =>
      typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
        ? undefined
        : '수량은 0 이상의 정수로 입력해 주세요.',
  },
];
export function ProfessionalCategory() {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [stacked, setStacked] = useState(false);
  const [pieVariant, setPieVariant] = useState<'pie' | 'donut'>('donut');
  const [rows, setRows] = useState<readonly Order[]>([
    { id: 'ORDER-001', customer: '김메가', quantity: 3 },
    { id: 'ORDER-002', customer: '이메가', quantity: 5 },
  ]);
  return (
    <div className="professional-category">
      <CategoryCards
        code="PRO"
        order={[
          'DataGridPro',
          'TextEditor',
          'CartesianChart',
          'PieChart',
          'ChartPro',
          'TaskBoard',
          'SchedulerPro',
          'DiagramEditor',
          'SpreadsheetPro',
        ]}
        notes={{
          SpreadsheetPro: (
            <>
              <a href="./spreadsheet.md">시트 API</a> ·{' '}
              <a href="#spreadsheet?full=1">매출 정산 전체 예제 열기</a>
            </>
          ),
          DiagramEditor: (
            <>
              <a href="./diagram.md">다이어그램 API</a> ·{' '}
              <a href="#diagram?full=1">업무 흐름 전체 예제 열기</a>
            </>
          ),
          SchedulerPro: (
            <>
              <a href="./scheduler.md">일정 API</a> ·{' '}
              <a href="#scheduler?full=1">팀 일정 전체 예제 열기</a>
            </>
          ),
          TaskBoard: (
            <>
              <a href="./task-board.md">작업 보드 API</a> ·{' '}
              <a href="#board?full=1">작업 보드 전체 예제 열기</a>
            </>
          ),
          ChartPro: (
            <>
              <a href="./charts.md">전문 차트 API</a> ·{' '}
              <a href="#charts?full=1">차트 전체 예제 열기</a>
            </>
          ),
          PieChart: (
            <>
              <a href="./charts.md">원형·도넛 차트 API</a> ·{' '}
              <a href="#charts?full=1">차트 전체 예제 열기</a>
            </>
          ),
          DataGridPro: (
            <>
              <a href="./data-grid.md">그리드 API</a> ·{' '}
              <a href="#data-grid-pro?full=1">주문 원장 전체 예제 열기</a>
            </>
          ),
          TextEditor: (
            <>
              <a href="./text-editor.md">텍스트 편집기 API</a> ·{' '}
              <a href="#text-editor?full=1">문서 편집 전체 예제 열기</a>
            </>
          ),
          CartesianChart: (
            <>
              <a href="./charts.md">차트 API</a> ·{' '}
              <a href="#charts?full=1">차트 전체 예제 열기</a>
            </>
          ),
        }}
        demos={{
          TaskBoard: <TaskBoardDemo />,
          SchedulerPro: <SchedulerProDemo />,
          DiagramEditor: <DiagramDemo />,
          SpreadsheetPro: <SpreadsheetDemo />,
          ChartPro: <ChartProDemo />,
          PieChart: (
            <Stack gap={3}>
              <Select
                aria-label="비율 차트 종류"
                value={pieVariant}
                onChange={(event) =>
                  setPieVariant(event.currentTarget.value as 'pie' | 'donut')
                }
              >
                <option value="pie">원형</option>
                <option value="donut">도넛</option>
              </Select>
              <PieChart
                label="판매 채널 비율"
                variant={pieVariant}
                valueLabel="건"
                data={[
                  { label: '온라인', value: 120 },
                  { label: '매장', value: 80 },
                  { label: '파트너', value: 40 },
                ]}
              />
            </Stack>
          ),
          DataGridPro: (
            <Stack gap={3}>
              <Text size="sm" tone="muted">
                셀을 편집하고 변경을 저장해 보세요. 이 예제의 변경은 화면을
                떠나면 사라져요.
              </Text>
              <DataGridPro
                label="주문 편집 예제"
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id}
                onRowsChange={setRows}
              />
            </Stack>
          ),
          TextEditor: (
            <Stack gap={3}>
              <Text size="sm" tone="muted">
                문단·표·이미지와 Markdown 변환을 사용해 보세요. 이 예제의 내용은
                화면을 떠나면 사라져요.
              </Text>
              <TextEditor
                label="문서 작성 예제"
                defaultValue={{
                  type: 'doc',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: '팀의 다음 할 일을 적어 보세요.',
                        },
                      ],
                    },
                  ],
                }}
              />
            </Stack>
          ),
          CartesianChart: (
            <Stack gap={3}>
              <Stack direction="row" gap={3} wrap>
                <Select
                  aria-label="차트 종류"
                  value={chartType}
                  onChange={(event) =>
                    setChartType(
                      event.currentTarget.value as 'bar' | 'line' | 'area',
                    )
                  }
                >
                  <option value="bar">막대</option>
                  <option value="line">선</option>
                  <option value="area">영역</option>
                </Select>
                <Checkbox
                  checked={stacked}
                  disabled={chartType === 'line'}
                  onChange={(event) => setStacked(event.currentTarget.checked)}
                >
                  누적 표시
                </Checkbox>
              </Stack>
              <CartesianChart
                type={chartType}
                stacked={stacked}
                label="채널별 손익"
                xLabel="월"
                yLabel="만원"
                data={{
                  labels: ['7월', '8월', '9월'],
                  series: [
                    { id: 'online', label: '온라인', values: [510, -80, 640] },
                    { id: 'store', label: '매장', values: [null, 330, 390] },
                  ],
                }}
              />
            </Stack>
          ),
        }}
      />
    </div>
  );
}
