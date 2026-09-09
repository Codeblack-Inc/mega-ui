import type {
  EChartsOption,
  SeriesOption,
  XAXisComponentOption,
} from 'echarts';
import { quoteDelimitedCell } from '../internal/delimited.ts';

export type ChartProPoint = readonly [x: number | string, y: number | null];
export interface ChartProSeries {
  id: string;
  label: string;
  points: readonly ChartProPoint[];
  axis?: 0 | 1;
}
export interface ChartTreeNode {
  id: string;
  label: string;
  value?: number;
  children?: readonly ChartTreeNode[];
}
export type ChartProData =
  | {
      type: 'bar' | 'line' | 'area' | 'scatter';
      series: readonly ChartProSeries[];
      xAxis?: 'category' | 'value' | 'time';
      stacked?: boolean;
    }
  | {
      type: 'pie' | 'donut';
      items: readonly { label: string; value: number | null }[];
    }
  | {
      type: 'heatmap';
      xLabels: readonly string[];
      yLabels: readonly string[];
      cells: readonly (readonly [x: number, y: number, value: number | null])[];
    }
  | { type: 'treemap'; nodes: readonly ChartTreeNode[] }
  | {
      type: 'candlestick';
      candles: readonly {
        time: number;
        open: number;
        close: number;
        low: number;
        high: number;
        volume: number | null;
      }[];
    };
export interface ChartProAxis {
  label: string;
}
export interface ChartProSettings {
  xLabel?: string;
  yAxes?: readonly [ChartProAxis, ChartProAxis?];
  timeZone?: string;
  locale?: string;
}
export interface ChartProRow {
  id: string;
  cells: (string | number | null)[];
  seriesIndex: number;
  dataIndex: number;
}
export interface PreparedChartPro {
  option: EChartsOption;
  columns: string[];
  rows: ChartProRow[];
  legends: string[];
  cartesian: boolean;
}
const name = (value: string) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 200)
    throw new Error('Invalid chart name');
  return value;
};
const number = (value: number | null): number | null => {
  if (value !== null && typeof value !== 'number')
    throw new Error('Invalid chart number');
  if (value !== null && Number.isFinite(value) && Math.abs(value) > 1e100)
    throw new Error('Chart value exceeds numeric scale');
  return value === null || !Number.isFinite(value) ? null : value;
};
const list = <T>(values: readonly T[], max = 10000) => {
  if (
    !Array.isArray(values) ||
    values.length > max ||
    Object.keys(values).filter((k) => /^\d+$/.test(k)).length !== values.length
  )
    throw new Error('Invalid chart array');
  return values;
};
export function prepareChartPro(
  data: ChartProData,
  settings: ChartProSettings = {},
): PreparedChartPro {
  if (settings.xLabel !== undefined) name(settings.xLabel);
  if (settings.yAxes) {
    list(settings.yAxes, 2);
    if (!settings.yAxes.length) throw new Error('Missing axis');
    settings.yAxes.forEach((axis) => name(axis!.label));
  }
  const rows: ChartProRow[] = [];
  const legends: string[] = [];
  const series: SeriesOption[] = [];
  const columns: string[] = [];
  const date = new Intl.DateTimeFormat(settings.locale ?? 'ko-KR', {
    timeZone: settings.timeZone ?? 'Asia/Seoul',
    dateStyle: 'short',
    timeStyle: 'medium',
  });
  const timestamp = (value: number) => {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      Math.abs(value) > 8.64e15
    )
      throw new Error('Invalid chart timestamp');
    return date.format(value);
  };
  const option: EChartsOption = {
    animation: false,
    tooltip: { trigger: 'item', renderMode: 'richText', confine: true },
    series,
    toolbox: {
      show: true,
      itemSize: 0,
      itemGap: 0,
      showTitle: false,
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
          icon: { zoom: 'path://', back: 'path://' },
        },
      },
    },
  };
  let cartesian = false;
  const axes = (type: 'category' | 'value' | 'time', categories?: string[]) => {
    cartesian = true;
    option.grid = { left: 70, right: 70, top: 50, bottom: 100 };
    option.xAxis = {
      type,
      name:
        settings.xLabel ??
        (type === 'time'
          ? `시각 (${settings.timeZone ?? 'Asia/Seoul'})`
          : '항목'),
      data: categories,
      nameLocation: 'middle',
      nameGap: 35,
      axisLabel:
        type === 'time'
          ? {
              formatter: (value: number) => date.format(value),
              hideOverlap: true,
            }
          : { hideOverlap: true },
    } as XAXisComponentOption;
    option.yAxis = (settings.yAxes ?? [{ label: '값' }]).map((axis) => ({
      type: 'value' as const,
      name: name(axis!.label),
      scale: data.type === 'candlestick',
    }));
    option.dataZoom = [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: 'ctrl',
        moveOnMouseMove: true,
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        bottom: 12,
        height: 28,
        filterMode: 'none',
      },
    ];
    option.brush = {
      xAxisIndex: 0,
      brushMode: 'single',
      throttleType: 'debounce',
      throttleDelay: 60,
      removeOnClick: true,
    };
  };
  switch (data.type) {
    case 'bar':
    case 'line':
    case 'area':
    case 'scatter': {
      const axisType =
        data.xAxis ?? (data.type === 'scatter' ? 'value' : 'category');
      if (!['category', 'value', 'time'].includes(axisType))
        throw new Error('Invalid x axis');
      const ids = new Set<string>();
      const categories: string[] = [];
      const categorySet = new Set<string>();
      columns.push(
        '계열',
        settings.xLabel ??
          (axisType === 'time'
            ? `시각 (${settings.timeZone ?? 'Asia/Seoul'})`
            : '항목'),
        '값',
      );
      list(data.series, 20).forEach((item, seriesIndex) => {
        if (ids.has(name(item.id)) || legends.includes(name(item.label)))
          throw new Error('Duplicate series');
        ids.add(item.id);
        legends.push(item.label);
        if (item.axis !== undefined && item.axis !== 0 && item.axis !== 1)
          throw new Error('Invalid axis');
        if (item.axis === 1 && !settings.yAxes?.[1])
          throw new Error('Missing second axis');
        let previous = -Infinity;
        const seen = new Set<string | number>();
        const points = list(item.points).map(([x, raw], dataIndex) => {
          const value = number(raw);
          if (data.type !== 'scatter' && seen.has(x))
            throw new Error('Duplicate x coordinate');
          seen.add(x);
          if (axisType === 'category') {
            name(x as string);
            if (!categorySet.has(x as string)) {
              categorySet.add(x as string);
              categories.push(x as string);
            }
          } else {
            if (typeof x !== 'number' || number(x) === null)
              throw new Error('Invalid x coordinate');
            if (axisType === 'time') {
              timestamp(x);
              if (x <= previous) throw new Error('Time points must be ordered');
              previous = x;
            }
          }
          rows.push({
            id: `${item.id}:${dataIndex}`,
            cells: [
              item.label,
              axisType === 'time' ? timestamp(x as number) : x,
              value,
            ],
            seriesIndex,
            dataIndex,
          });
          return [x, value];
        });
        series.push({
          id: item.id,
          name: item.label,
          type: data.type === 'area' ? 'line' : data.type,
          data: points,
          yAxisIndex: item.axis ?? 0,
          ...(data.stacked && data.type !== 'scatter'
            ? { stack: `axis-${item.axis ?? 0}`, stackStrategy: 'samesign' }
            : {}),
          ...(data.type === 'area' ? { areaStyle: { opacity: 0.25 } } : {}),
          connectNulls: false,
          symbolSize: data.type === 'scatter' ? 10 : 7,
          emphasis: { focus: 'series' },
        } as SeriesOption);
      });
      if (axisType === 'time') {
        columns.splice(2, 0, '시각 (UTC)');
        rows.forEach((row) => {
          const point = data.series[row.seriesIndex]!.points[row.dataIndex]!;
          row.cells.splice(2, 0, new Date(point[0] as number).toISOString());
        });
      }
      axes(axisType, axisType === 'category' ? categories : undefined);
      break;
    }
    case 'pie':
    case 'donut': {
      columns.push('항목', '값');
      const seen = new Set<string>();
      const items = list(data.items, 200).map((item, dataIndex) => {
        const label = name(item.label);
        const value = number(item.value);
        if (seen.has(label) || (value !== null && value < 0))
          throw new Error('Invalid pie item');
        seen.add(label);
        legends.push(label);
        rows.push({
          id: String(dataIndex),
          cells: [label, value],
          seriesIndex: 0,
          dataIndex,
        });
        return { name: label, value: value ?? 0 };
      });
      series.push({
        type: 'pie',
        radius: data.type === 'donut' ? ['35%', '65%'] : '65%',
        data: items,
        stillShowZeroSum: false,
        label: { show: false },
      });
      break;
    }
    case 'heatmap': {
      columns.push(
        settings.xLabel ?? '항목',
        settings.yAxes?.[0].label ?? '구분',
        '값',
      );
      const xs = list(data.xLabels, 1000).map(name),
        ys = list(data.yLabels, 1000).map(name);
      if (new Set(xs).size !== xs.length || new Set(ys).size !== ys.length)
        throw new Error('Duplicate heatmap category');
      const seen = new Set<string>();
      const cells = list(data.cells).map(([x, y, raw], dataIndex) => {
        if (
          !Number.isInteger(x) ||
          !Number.isInteger(y) ||
          !xs[x] ||
          !ys[y] ||
          seen.has(`${x}:${y}`)
        )
          throw new Error('Invalid heatmap position');
        seen.add(`${x}:${y}`);
        const value = number(raw);
        rows.push({
          id: `${x}:${y}`,
          cells: [xs[x]!, ys[y]!, value],
          seriesIndex: 0,
          dataIndex,
        });
        return [x, y, value];
      });
      axes('category', xs);
      option.yAxis = {
        type: 'category',
        data: ys,
        name: settings.yAxes?.[0].label ?? '구분',
      };
      const values = cells
        .map((cell) => cell[2])
        .filter((v): v is number => v !== null && v !== undefined);
      const min = Math.min(0, ...values),
        max = Math.max(1, ...values);
      option.visualMap = {
        min,
        max,
        text: [String(max), String(min)],
        dimension: 2,
        orient: 'horizontal',
        left: 'center',
        top: 0,
        calculable: false,
      };
      series.push({
        type: 'heatmap',
        data: cells,
        label: { show: false },
        emphasis: { itemStyle: { borderWidth: 2 } },
      });
      break;
    }
    case 'treemap': {
      columns.push('경로', '값');
      const ids = new Set<string>();
      let index = 0;
      type Tree = {
        id: string;
        name: string;
        value: number;
        children?: Tree[];
      };
      const visit = (
        nodes: readonly ChartTreeNode[],
        path: string[],
        depth: number,
      ): Tree[] => {
        if (depth > 16) throw new Error('Chart tree too deep');
        return list(nodes).map((node) => {
          if (ids.has(name(node.id)) || ids.size >= 10000)
            throw new Error('Duplicate or excessive tree node');
          ids.add(node.id);
          const label = name(node.label),
            currentIndex = index++;
          const children = node.children
            ? visit(node.children, [...path, label], depth + 1)
            : undefined;
          const total = children?.reduce((sum, child) => sum + child.value, 0);
          const value = node.value ?? total;
          if (
            value === undefined ||
            number(value) === null ||
            value < 0 ||
            (total !== undefined && value !== total)
          )
            throw new Error('Invalid tree total');
          rows.push({
            id: node.id,
            cells: [[...path, label].join(' / '), value],
            seriesIndex: 0,
            dataIndex: currentIndex + 1,
          });
          return { id: node.id, name: label, value, children };
        });
      };
      series.push({
        type: 'treemap',
        data: visit(data.nodes, [], 0),
        roam: true,
        nodeClick: 'zoomToNode',
        breadcrumb: { show: false },
        upperLabel: { show: true },
        leafDepth: undefined,
      });
      break;
    }
    case 'candlestick': {
      columns.push(
        `시각 (${settings.timeZone ?? 'Asia/Seoul'})`,
        '시가',
        '종가',
        '저가',
        '고가',
        '거래량',
      );
      let previous = -Infinity;
      const candles = list(data.candles).map((item, dataIndex) => {
        const time = timestamp(item.time);
        if (item.time <= previous) throw new Error('Candles must be ordered');
        previous = item.time;
        const values = [item.open, item.close, item.low, item.high];
        if (
          values.some((v) => number(v) === null) ||
          item.low > Math.min(item.open, item.close) ||
          item.high < Math.max(item.open, item.close)
        )
          throw new Error('Invalid OHLC');
        const volume = number(item.volume);
        if (volume !== null && volume < 0) throw new Error('Invalid volume');
        rows.push({
          id: String(item.time),
          cells: [time, ...values, volume],
          seriesIndex: 0,
          dataIndex,
        });
        return [item.time, ...values];
      });
      columns.splice(1, 0, '시각 (UTC)');
      rows.forEach((row, index) =>
        row.cells.splice(
          1,
          0,
          new Date(data.candles[index]!.time).toISOString(),
        ),
      );
      axes('time');
      option.grid = [
        { left: 70, right: 70, top: 35, height: '48%' },
        { left: 70, right: 70, top: '66%', bottom: 100 },
      ];
      const x = option.xAxis as object;
      option.xAxis = [
        { ...x, axisLabel: { show: false }, name: '' },
        { ...x, gridIndex: 1 },
      ];
      option.yAxis = [
        {
          type: 'value',
          name: settings.yAxes?.[0].label ?? '가격',
          scale: true,
        },
        { type: 'value', name: '거래량', gridIndex: 1 },
      ];
      option.dataZoom = [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          filterMode: 'none',
          zoomOnMouseWheel: 'ctrl',
        },
        { type: 'slider', xAxisIndex: [0, 1], filterMode: 'none', bottom: 12 },
      ];
      series.push(
        {
          type: 'candlestick',
          name: '가격',
          data: candles,
          encode: { x: 0, y: [1, 2, 3, 4] },
        },
        {
          type: 'bar',
          name: '거래량',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: data.candles.map((c) => [c.time, number(c.volume)]),
        },
      );
      break;
    }
    default:
      throw new Error('Invalid chart type');
  }
  if (rows.length > 10000) throw new Error('Chart exceeds 10000 points');
  if ('series' in data && settings.yAxes) {
    columns.splice(columns.length - 1, 0, '축');
    rows.forEach((row) =>
      row.cells.splice(
        row.cells.length - 1,
        0,
        settings.yAxes![data.series[row.seriesIndex]!.axis ?? 0]!.label,
      ),
    );
  }
  const lookup = new Map(
    rows.map((row) => [`${row.seriesIndex}:${row.dataIndex}`, row]),
  );
  option.tooltip = {
    trigger: 'item',
    renderMode: 'richText',
    confine: true,
    formatter: (params) => {
      const point = Array.isArray(params) ? params[0] : params;
      if (!point) return '';
      const row = lookup.get(
        `${data.type === 'candlestick' ? 0 : point.seriesIndex}:${point.dataIndex}`,
      );
      return (
        row?.cells
          .map((cell, index) => `${columns[index]}: ${cell ?? '값 없음'}`)
          .join('\n') ?? ''
      );
    },
  };
  return { option, columns, rows, legends, cartesian };
}
export function createChartProCsv(
  data: ChartProData,
  settings?: ChartProSettings,
): string {
  const { columns, rows } = prepareChartPro(data, settings);
  return (
    '\uFEFF' +
    [columns, ...rows.map((row) => row.cells)]
      .map((row) =>
        row.map((cell) => quoteDelimitedCell(cell, ',', true)).join(','),
      )
      .join('\r\n')
  );
}
