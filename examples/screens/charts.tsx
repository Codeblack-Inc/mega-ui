import { ChartProDemo } from '../chart-pro-demos';
import '@mega-ui/react/charts.css';
import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Field,
  PageHeader,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from '@mega-ui/react';
import {
  CartesianChart,
  PieChart,
  type CartesianChartData,
} from '@mega-ui/react/charts';

const monthly: CartesianChartData = {
  labels: ['4월', '5월', '6월', '7월', '8월', '9월'],
  series: [
    { id: 'online', label: '온라인', values: [320, 460, null, 510, -80, 640] },
    { id: 'store', label: '매장', values: [210, 260, 180, -120, 330, 390] },
    { id: 'partner', label: '파트너', values: [null, 90, 140, 0, 170, 220] },
  ],
};
const history: CartesianChartData = {
  labels: Array.from(
    { length: 200 },
    (_, index) => `${2010 + Math.floor(index / 12)}년 ${(index % 12) + 1}월`,
  ),
  series: Array.from({ length: 6 }, (_, series) => ({
    id: `channel-${series}`,
    label: `판매 채널 ${series + 1}`,
    values: Array.from({ length: 200 }, (_, index) =>
      index % 13 === 0
        ? null
        : Math.round(Math.sin(index / 8 + series) * 400 + 100),
    ),
  })),
};
export function ChartsExample() {
  const [type, setType] = useState<'bar' | 'line' | 'area'>('bar');
  const [stacked, setStacked] = useState(false);
  const [pieVariant, setPieVariant] = useState<'pie' | 'donut'>('donut');
  const [period, setPeriod] = useState('recent');
  const data =
    period === 'history'
      ? history
      : period === 'empty'
        ? { labels: [], series: [] }
        : monthly;
  return (
    <Stack gap={5}>
      <PageHeader
        title="판매 채널별 손익"
        description="예시 집계예요. 금액은 만원 단위이며 집계되지 않은 값은 비워 두었어요."
      />
      <Card variant="outlined" padding="lg">
        <ChartProDemo />
      </Card>
      <Stack direction="row" gap={4} wrap align="end">
        <Field label="조회 기간" htmlFor="chart-period">
          <Select
            id="chart-period"
            value={period}
            onChange={(event) => setPeriod(event.currentTarget.value)}
          >
            <option value="recent">최근 6개월</option>
            <option value="history">전체 200개월</option>
            <option value="empty">집계 전 기간</option>
            <option value="error">조회 실패 예제</option>
          </Select>
        </Field>
        <SegmentedControl
          style={{ minWidth: 220 }}
          label="차트 종류"
          name="chart-type"
          value={type}
          onValueChange={(value) => setType(value as 'bar' | 'line' | 'area')}
          options={[
            { label: '막대', value: 'bar' },
            { label: '선', value: 'line' },
            { label: '영역', value: 'area' },
          ]}
        />
        <Checkbox
          checked={stacked}
          disabled={type === 'line'}
          onChange={(event) => setStacked(event.currentTarget.checked)}
        >
          누적 표시
        </Checkbox>
      </Stack>
      {period === 'error' ? (
        <Alert tone="danger" role="alert">
          <Stack gap={3}>
            <Text>손익 예시를 불러오지 못했어요. 다시 불러와 주세요.</Text>
            <Button variant="secondary" onClick={() => setPeriod('recent')}>
              예시 다시 불러오기
            </Button>
          </Stack>
        </Alert>
      ) : (
        <Card variant="outlined" padding="lg">
          <CartesianChart
            data={data}
            label="월별 손익 비교"
            type={type}
            stacked={stacked}
            xLabel="월"
            yLabel="손익 (만원)"
          />
        </Card>
      )}
      <Card variant="outlined" padding="lg">
        <Stack gap={4}>
          <SegmentedControl
            label="비율 차트 종류"
            name="pie-type"
            value={pieVariant}
            onValueChange={(value) => setPieVariant(value as 'pie' | 'donut')}
            options={[
              { label: '원형', value: 'pie' },
              { label: '도넛', value: 'donut' },
            ]}
          />
          <PieChart
            label="9월 채널별 매출 비율"
            variant={pieVariant}
            valueLabel="만원"
            data={[
              { label: '온라인', value: 1200 },
              { label: '매장', value: 800 },
              { label: '파트너', value: 400 },
            ]}
          />
        </Stack>
      </Card>
    </Stack>
  );
}
