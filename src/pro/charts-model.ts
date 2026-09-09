import { quoteDelimitedCell } from '../internal/delimited.ts';

export interface ChartSeries {
  id: string;
  label: string;
  values: readonly (number | null)[];
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'teal' | 'purple';
}
export interface CartesianChartData {
  labels: readonly string[];
  series: readonly ChartSeries[];
}

/** Category positions are equally spaced; this is not a time scale. */
export function prepareChartData(data: CartesianChartData, stacked = false) {
  if (!data || !Array.isArray(data.labels) || !Array.isArray(data.series))
    throw new Error('Charts: labels and series must be arrays.');
  // ponytail: SVG is bounded to 1,200 cells; use aggregation or a canvas engine beyond this limit.
  if (data.labels.length > 200 || data.series.length > 6)
    throw new Error('Charts: maximum 200 categories and 6 series.');
  const text = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
  if (!Array.from(data.labels).every(text))
    throw new Error('Charts: invalid category label.');
  const ids = new Set<string>();
  const series = Array.from(data.series).map((item: ChartSeries) => {
    if (
      !item ||
      !text(item.id) ||
      !text(item.label) ||
      ids.has(item.id) ||
      !Array.isArray(item.values) ||
      item.values.length !== data.labels.length ||
      !Array.from(item.values).every(
        (value: unknown) => value === null || typeof value === 'number',
      ) ||
      (item.tone !== undefined &&
        !['brand', 'success', 'warning', 'danger', 'teal', 'purple'].includes(
          item.tone,
        ))
    )
      throw new Error(
        'Charts: invalid series, duplicate id or mismatched values.',
      );
    ids.add(item.id);
    return {
      ...item,
      values: item.values.map((value: number | null) =>
        typeof value === 'number' && Number.isFinite(value) ? value : null,
      ),
    };
  });
  const positive = Array<number>(data.labels.length).fill(0);
  const negative = Array<number>(data.labels.length).fill(0);
  const layers = series.map((item) => ({
    id: item.id,
    values: item.values.map((value, index) => {
      if (value === null) return null;
      const totals = value < 0 ? negative : positive;
      const start = stacked ? totals[index]! : 0;
      const end = start + value;
      if (!Number.isFinite(end))
        throw new Error('Charts: stacked total exceeds numeric range.');
      totals[index] = end;
      return { start, end };
    }),
  }));
  let magnitude = 0;
  for (const item of layers)
    for (const value of item.values)
      if (value !== null)
        magnitude = Math.max(
          magnitude,
          Math.abs(value.start),
          Math.abs(value.end),
        );
  magnitude ||= 1;
  let min = 0;
  let max = 0;
  for (const item of layers)
    for (const value of item.values)
      if (value !== null) {
        min = Math.min(min, value.start / magnitude, value.end / magnitude);
        max = Math.max(max, value.start / magnitude, value.end / magnitude);
      }
  if (min === max) max = 1;
  // Normalize before subtracting so +/- Number.MAX_VALUE cannot overflow.
  const position = (value: number) => (max - value / magnitude) / (max - min);
  const ticks = [
    ...new Set([
      0,
      ...Array.from(
        { length: 5 },
        (_, index) => (min + (max - min) * (index / 4)) * magnitude,
      ),
    ]),
  ].sort((a, b) => a - b);
  return { labels: data.labels, series, layers, ticks, position };
}

/** All supplied series, raw numbers, empty cells for missing/non-finite values. */
export function createChartCsv(
  data: CartesianChartData,
  categoryLabel = '항목',
): string {
  const chart = prepareChartData(data);
  return (
    '\uFEFF' +
    [
      [categoryLabel, ...chart.series.map((item) => item.label)],
      ...chart.labels.map((label, index) => [
        label,
        ...chart.series.map((item) => item.values[index]),
      ]),
    ]
      .map((row) =>
        row.map((value) => quoteDelimitedCell(value, ',', true)).join(','),
      )
      .join('\r\n')
  );
}

export type ChartRange = readonly [start: number, end: number];
export function normalizeChartRange(
  range: ChartRange | undefined,
  count: number,
): ChartRange {
  const last = Math.max(0, count - 1);
  if (!range || !Number.isFinite(range[0]) || !Number.isFinite(range[1]))
    return [0, last];
  const start = Math.max(0, Math.min(last, Math.floor(range[0])));
  return [start, Math.max(start, Math.min(last, Math.floor(range[1])))];
}

export interface PieChartDatum {
  label: string;
  value: number | null;
  tone?: ChartSeries['tone'];
}
export function preparePieData(data: readonly PieChartDatum[]) {
  if (
    !Array.isArray(data) ||
    data.length > 24 ||
    !Array.from(data).every(
      (item) => item && (item.value === null || typeof item.value === 'number'),
    )
  )
    throw new Error('Charts: pie data requires up to 24 labeled values.');
  const chart = prepareChartData({
    labels: data.map((item) => item.label),
    series: [
      { id: 'value', label: '값', values: data.map((item) => item.value) },
    ],
  });
  if (chart.series[0]!.values.some((value) => value !== null && value < 0))
    throw new Error('Charts: pie values must be nonnegative.');
  for (const item of data)
    if (
      item.tone !== undefined &&
      !['brand', 'success', 'warning', 'danger', 'teal', 'purple'].includes(
        item.tone,
      )
    )
      throw new Error('Charts: invalid tone.');
  const values = chart.series[0]!.values;
  const magnitude = Math.max(0, ...values.map((value) => value ?? 0)) || 1;
  const sum = values.reduce<number>(
    (total, value) => total + (value ?? 0) / magnitude,
    0,
  );
  let angle = -Math.PI / 2;
  return {
    chart,
    slices: values.map((value, index) => {
      const share = sum ? (value ?? 0) / magnitude / sum : 0;
      const start = angle;
      angle += share * Math.PI * 2;
      return { ...data[index]!, value, share, start, end: angle };
    }),
  };
}
