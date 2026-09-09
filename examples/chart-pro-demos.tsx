import { useState } from 'react';
import { ChartPro, type ChartProData } from '@mega-ui/react/charts';
import { Select, Stack } from '@mega-ui/react';

const points = [
  ['4월', 320],
  ['5월', 460],
  ['6월', null],
  ['7월', -120],
  ['8월', 330],
  ['9월', 640],
] as const;
const series = [
  { id: 'online', label: '온라인', points },
  {
    id: 'store',
    label: '매장',
    points: [
      ['4월', 210],
      ['5월', 260],
      ['6월', 180],
      ['7월', 220],
      ['8월', -80],
      ['9월', 390],
    ] as const,
  },
];
const base = Date.UTC(2026, 8, 1);
export const chartProExamples: {
  id: string;
  label: string;
  data: ChartProData;
}[] = [
  { id: 'bar', label: '묶음 막대', data: { type: 'bar', series } },
  {
    id: 'stacked-bar',
    label: '누적 막대',
    data: { type: 'bar', series, stacked: true },
  },
  { id: 'line', label: '선', data: { type: 'line', series } },
  { id: 'area', label: '영역', data: { type: 'area', series } },
  {
    id: 'stacked-area',
    label: '누적 영역',
    data: { type: 'area', series, stacked: true },
  },
  {
    id: 'pie',
    label: '원형',
    data: {
      type: 'pie',
      items: [
        { label: '온라인', value: 120 },
        { label: '매장', value: 80 },
        { label: '파트너', value: 40 },
      ],
    },
  },
  {
    id: 'donut',
    label: '도넛',
    data: {
      type: 'donut',
      items: [
        { label: '온라인', value: 120 },
        { label: '매장', value: 80 },
        { label: '파트너', value: 40 },
      ],
    },
  },
  {
    id: 'scatter',
    label: '산점',
    data: {
      type: 'scatter',
      series: [
        {
          id: 'a',
          label: '그룹 A',
          points: [
            [1, 4],
            [2, 6],
            [4, 3],
            [6, 9],
            [8, 7],
          ],
        },
        {
          id: 'b',
          label: '그룹 B',
          points: [
            [1, 2],
            [3, 1],
            [5, -2],
            [7, 5],
            [9, 4],
          ],
        },
      ],
    },
  },
  {
    id: 'heatmap',
    label: '히트맵',
    data: {
      type: 'heatmap',
      xLabels: ['월', '화', '수', '목', '금'],
      yLabels: ['오전', '오후', '저녁'],
      cells: Array.from(
        { length: 15 },
        (_, i) =>
          [i % 5, Math.floor(i / 5), i === 7 ? null : i * 3 - 8] as const,
      ),
    },
  },
  {
    id: 'treemap',
    label: '트리맵',
    data: {
      type: 'treemap',
      nodes: [
        {
          id: 'online',
          label: '온라인',
          children: [
            { id: 'web', label: '웹', value: 80 },
            { id: 'app', label: '앱', value: 120 },
          ],
        },
        {
          id: 'store',
          label: '매장',
          children: [
            { id: 'seoul', label: '서울', value: 90 },
            { id: 'busan', label: '부산', value: 60 },
          ],
        },
      ],
    },
  },
  {
    id: 'candlestick',
    label: '캔들·거래량',
    data: {
      type: 'candlestick',
      candles: Array.from({ length: 30 }, (_, i) => ({
        time: base + i * 86400000,
        open: 100 + Math.sin(i) * 8,
        close: 100 + Math.cos(i) * 8,
        low: 90,
        high: 110,
        volume: i === 3 ? null : 200 + i * 20,
      })),
    },
  },
  {
    id: 'time',
    label: '시간축·이중 축',
    data: {
      type: 'line',
      xAxis: 'time',
      series: [
        {
          id: 'price',
          label: '가격',
          points: [
            [base, 100],
            [base + 3600000, 110],
            [base + 7200000, null],
            [base + 18000000, 90],
            [base + 86400000, 130],
          ],
        },
        {
          id: 'count',
          label: '건수',
          axis: 1,
          points: [
            [base, 1000],
            [base + 3600000, 1200],
            [base + 7200000, 950],
            [base + 18000000, 1400],
            [base + 86400000, 1300],
          ],
        },
      ],
    },
  },
  {
    id: 'large',
    label: '산점 10,000개',
    data: {
      type: 'scatter',
      series: [
        {
          id: 'samples',
          label: '표본',
          points: Array.from(
            { length: 10000 },
            (_, i) =>
              [i, Math.sin(i / 100) * 100 + Math.cos(i / 7) * 10] as const,
          ),
        },
      ],
    },
  },
  { id: 'empty', label: '빈 데이터', data: { type: 'line', series: [] } },
];
const axes = [{ label: '가격' }, { label: '건수' }] as const;
export function ChartProDemo() {
  const [kind, setKind] = useState('scatter');
  const [zone, setZone] = useState('Asia/Seoul');
  const example =
    chartProExamples.find((item) => item.id === kind) ?? chartProExamples[0]!;
  return (
    <Stack gap={4}>
      <p>
        유형별 예시 데이터예요. 표와 CSV에는 전체 원본이, 이미지에는 현재 표시
        구간이 담겨요.
      </p>
      <Stack direction="row" gap={3} wrap>
        <label>
          전문 차트 종류
          <Select
            aria-label="전문 차트 종류"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {chartProExamples.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value="loading">불러오는 중</option>
            <option value="error">조회 실패</option>
          </Select>
        </label>
        <label>
          시간대
          <Select
            aria-label="시간대"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          >
            <option value="Asia/Seoul">서울</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">뉴욕</option>
          </Select>
        </label>
      </Stack>
      <ChartPro
        label="전문 차트 탐색"
        data={example.data}
        timeZone={zone}
        yAxes={kind === 'time' ? axes : undefined}
        loading={kind === 'loading'}
        error={
          kind === 'error'
            ? '차트 예시를 불러오지 못했어요. 다시 불러와 주세요.'
            : undefined
        }
        onRetry={() => setKind('scatter')}
      />
    </Stack>
  );
}
