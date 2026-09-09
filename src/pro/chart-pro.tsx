import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from 'react';
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  ScatterChart,
  PieChart,
  HeatmapChart,
  TreemapChart,
  CandlestickChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  BrushComponent,
  VisualMapComponent,
  AriaComponent,
  ToolboxComponent,
  TitleComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { Button } from '../components/controls';
import { Alert } from '../components/surfaces';
import { quoteDelimitedCell } from '../internal/delimited';
import {
  prepareChartPro,
  type ChartProData,
  type ChartProSettings,
} from './chart-pro-model';

echarts.use([
  BarChart,
  LineChart,
  ScatterChart,
  PieChart,
  HeatmapChart,
  TreemapChart,
  CandlestickChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  BrushComponent,
  VisualMapComponent,
  AriaComponent,
  ToolboxComponent,
  TitleComponent,
  SVGRenderer,
]);
export interface ChartProProps
  extends
    Omit<ComponentPropsWithRef<'figure'>, 'children' | 'onSelect'>,
    ChartProSettings {
  label: string;
  data: ChartProData;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onSelectionChange?: (rowIds: readonly string[]) => void;
  onRangeChange?: (
    range: readonly [startPercent: number, endPercent: number],
  ) => void;
}
function download(href: string, label: string, extension: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = `${label.replace(/[\\/:*?"<>|]/g, '-') || 'chart'}.${extension}`;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
  }
}
export function ChartPro({
  label,
  data,
  xLabel,
  yAxes,
  timeZone,
  locale,
  loading = false,
  error,
  onRetry,
  onSelectionChange,
  onRangeChange,
  className = '',
  ...props
}: ChartProProps) {
  const descriptionId = useId();
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<echarts.EChartsType | null>(null);
  const callbacks = useRef({ onSelectionChange, onRangeChange });
  useEffect(() => {
    callbacks.current = { onSelectionChange, onRangeChange };
  });
  const prepared = useMemo(() => {
    try {
      return prepareChartPro(data, { xLabel, yAxes, timeZone, locale });
    } catch {
      return null;
    }
  }, [data, xLabel, yAxes, timeZone, locale]);
  const [failure, setFailure] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [range, setRange] = useState<readonly [number, number]>([0, 100]);
  const [brush, setBrush] = useState(false);
  const [dragZoom, setDragZoom] = useState(false);
  const [active, setActive] = useState(0);
  const [page, setPage] = useState(0);
  const hasValues =
    prepared?.rows.some((row) =>
      data.type === 'candlestick'
        ? row.cells.slice(2, 6).some((cell) => typeof cell === 'number')
        : typeof row.cells.at(-1) === 'number' &&
          (!(
            data.type === 'pie' ||
            data.type === 'donut' ||
            data.type === 'treemap'
          ) ||
            Number(row.cells.at(-1)) > 0),
    ) ?? false;
  const blocked = loading || !!error || !prepared || !hasValues;
  useEffect(() => {
    setFailure(false);
    setSelected([]);
    setHidden([]);
    setRange([0, 100]);
    setBrush(false);
    setDragZoom(false);
    setActive(0);
    setPage(0);
    if (blocked || !host.current || !prepared) return;
    const element = host.current;
    let chart: echarts.EChartsType | undefined;
    let observer: ResizeObserver | undefined;
    let themeObserver: MutationObserver | undefined;
    const media = matchMedia('(prefers-color-scheme: dark)');
    const theme = () => {
      if (!chart || chart.isDisposed()) return;
      const probe = document.createElement('span');
      element.append(probe);
      const color = (token: string) => {
        probe.style.color = `var(--mega-${token})`;
        return getComputedStyle(probe).color;
      };
      const colors = [
        'brand',
        'teal',
        'purple',
        'warning',
        'danger',
        'success',
      ].map(color);
      const text = color('text'),
        border = color('border'),
        background = color('surface');
      const up = color('up'),
        down = color('down');
      probe.remove();
      chart.setOption({
        color: colors,
        backgroundColor: background,
        textStyle: {
          color: text,
          fontFamily: getComputedStyle(element).fontFamily,
        },
        ...(prepared.cartesian
          ? {
              xAxis: (Array.isArray(prepared.option.xAxis)
                ? prepared.option.xAxis
                : [prepared.option.xAxis]
              ).map(() => ({
                axisLabel: { color: text },
                nameTextStyle: { color: text },
                axisLine: { lineStyle: { color: border } },
                splitLine: { lineStyle: { color: border } },
              })),
              yAxis: (Array.isArray(prepared.option.yAxis)
                ? prepared.option.yAxis
                : [prepared.option.yAxis]
              ).map(() => ({
                axisLabel: { color: text },
                nameTextStyle: { color: text },
                splitLine: { lineStyle: { color: border } },
              })),
            }
          : {}),
        ...(data.type === 'heatmap'
          ? {
              visualMap: {
                inRange: { color: [background, colors[0]] },
                textStyle: { color: text },
              },
            }
          : {}),
        ...(data.type === 'candlestick'
          ? {
              series: [
                {
                  itemStyle: {
                    color: up,
                    color0: down,
                    borderColor: up,
                    borderColor0: down,
                  },
                },
                {},
              ],
            }
          : {}),
        tooltip: {
          backgroundColor: background,
          borderColor: border,
          textStyle: { color: text },
        },
      });
    };
    try {
      chart = echarts.init(element, undefined, { renderer: 'svg' });
      engine.current = chart;
      chart.setOption(
        {
          ...prepared.option,
          legend: { show: false, data: prepared.legends },
          aria: { enabled: false },
        },
        { notMerge: true },
      );
      theme();
      chart.on('datazoom', (event: unknown) => {
        const e = event as {
          start?: number;
          end?: number;
          batch?: { start?: number; end?: number }[];
        };
        const entry =
          (
            chart?.getOption().dataZoom as
              { start?: number; end?: number }[] | undefined
          )?.[0] ??
          e.batch?.[0] ??
          e;
        if (typeof entry.start === 'number' && typeof entry.end === 'number') {
          const value = [entry.start, entry.end] as const;
          setRange(value);
          callbacks.current.onRangeChange?.(value);
        }
      });
      chart.on('brushselected', (event: unknown) => {
        const e = event as {
          batch?: {
            selected?: { seriesIndex: number; dataIndex: number[] }[];
          }[];
        };
        const entries = e.batch?.[0]?.selected ?? [];
        const ids = prepared.rows
          .filter((row) =>
            entries.some(
              (entry) =>
                entry.seriesIndex === row.seriesIndex &&
                entry.dataIndex.includes(row.dataIndex),
            ),
          )
          .map((row) => row.id);
        setSelected(ids);
        callbacks.current.onSelectionChange?.(ids);
      });
      chart.on('click', (event: unknown) => {
        const e = event as { seriesIndex?: number; dataIndex?: number };
        const index = prepared.rows.findIndex(
          (row) =>
            row.seriesIndex === e.seriesIndex && row.dataIndex === e.dataIndex,
        );
        if (index >= 0) setActive(index);
      });
      observer = new ResizeObserver(() => chart?.resize());
      observer.observe(element);
      themeObserver = new MutationObserver(theme);
      let ancestor: HTMLElement | null = element.parentElement;
      while (ancestor) {
        themeObserver.observe(ancestor, {
          attributes: true,
          attributeFilter: ['class', 'style', 'data-mega-theme'],
        });
        ancestor = ancestor.parentElement;
      }
      media.addEventListener('change', theme);
    } catch {
      setFailure(true);
    }
    return () => {
      observer?.disconnect();
      themeObserver?.disconnect();
      media.removeEventListener('change', theme);
      chart?.dispose();
      engine.current = null;
    };
  }, [prepared, blocked, data.type]);
  const changeRange = (start: number, end: number) => {
    const next = [
      Math.max(0, Math.min(99, start)),
      Math.min(100, Math.max(start + 1, end)),
    ] as const;
    engine.current?.dispatchAction({
      type: 'dataZoom',
      start: next[0],
      end: next[1],
    });
  };
  const select = (ids: string[]) => {
    setSelected(ids);
    callbacks.current.onSelectionChange?.(ids);
  };
  const exportFile = async (format: 'csv' | 'selected' | 'svg' | 'png') => {
    setExportError(false);
    let url: string | undefined;
    try {
      if (!prepared) return;
      let blob: Blob;
      if (format === 'csv' || format === 'selected') {
        const rows =
          format === 'selected'
            ? prepared.rows.filter((row) => selected.includes(row.id))
            : prepared.rows;
        const csv =
          '\uFEFF' +
          [prepared.columns, ...rows.map((row) => row.cells)]
            .map((row) =>
              row.map((cell) => quoteDelimitedCell(cell, ',', true)).join(','),
            )
            .join('\r\n');
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      } else {
        const chart = engine.current;
        if (!chart) throw new Error('Chart unavailable');
        const snapshot = echarts.init(null, undefined, {
          renderer: 'svg',
          ssr: true,
          width: Math.max(640, chart.getWidth()),
          height: chart.getHeight(),
        });
        let svg: string;
        try {
          const option = chart.getOption();
          const legend =
            (option.legend as Record<string, unknown>[] | undefined)?.[0] ?? {};
          snapshot.setOption({
            ...option,
            title: {
              text: label,
              left: 'center',
              top: 0,
              textStyle: { fontSize: 14, ...(option.textStyle as object) },
            },
            legend: {
              ...legend,
              show: true,
              type: 'scroll',
              top: 22,
              textStyle: option.textStyle,
            },
          });
          svg = snapshot.renderToSVGString();
        } finally {
          snapshot.dispose();
        }
        blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        if (format === 'png') {
          const imageUrl = URL.createObjectURL(blob);
          try {
            const image = new Image();
            image.src = imageUrl;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(640, chart.getWidth()) * 2;
            canvas.height = chart.getHeight() * 2;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas unavailable');
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            blob = await new Promise<Blob>((resolve, reject) =>
              canvas.toBlob(
                (value) =>
                  value
                    ? resolve(value)
                    : reject(new Error('Image unavailable')),
                'image/png',
              ),
            );
          } finally {
            URL.revokeObjectURL(imageUrl);
          }
        }
      }
      url = URL.createObjectURL(blob);
      download(url, label, format === 'selected' ? 'csv' : format);
    } catch {
      setExportError(true);
    } finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url!), 1000);
    }
  };
  const current = prepared?.rows[active];
  return (
    <figure
      {...props}
      className={`mega-chart-pro ${className}`}
      aria-label={label}
      aria-busy={loading}
    >
      <figcaption>{label}</figcaption>
      {loading ? (
        <p role="status">차트 데이터를 불러오고 있어요.</p>
      ) : error ? (
        <Alert tone="danger" role="alert">
          {error}
          {onRetry && <Button onClick={onRetry}>차트 다시 불러오기</Button>}
        </Alert>
      ) : !prepared ? (
        <Alert tone="danger" role="alert">
          차트 데이터 형식을 확인해 주세요.
        </Alert>
      ) : !hasValues ? (
        <p role="status">표시할 값이 없어요.</p>
      ) : (
        <>
          <div className="mega-chart-pro__tools" aria-label="계열 표시">
            {prepared.legends.map((item) => (
              <Button
                key={item}
                variant="secondary"
                aria-pressed={!hidden.includes(item)}
                onClick={() => {
                  setHidden((value) =>
                    value.includes(item)
                      ? value.filter((v) => v !== item)
                      : [...value, item],
                  );
                  engine.current?.dispatchAction({
                    type: 'legendToggleSelect',
                    name: item,
                  });
                }}
              >
                {item}
              </Button>
            ))}
          </div>
          {prepared.cartesian && (
            <div className="mega-chart-pro__tools" aria-label="차트 탐색">
              <Button
                variant="secondary"
                onClick={() =>
                  changeRange(range[0], range[0] + (range[1] - range[0]) / 2)
                }
              >
                확대
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  changeRange(
                    Math.max(0, range[0] - (range[1] - range[0]) / 2),
                    range[1] + (range[1] - range[0]) / 2,
                  )
                }
              >
                축소
              </Button>
              <Button
                variant="secondary"
                disabled={range[0] === 0}
                onClick={() => {
                  const step = Math.min(range[0], (range[1] - range[0]) / 2);
                  changeRange(range[0] - step, range[1] - step);
                }}
              >
                이전 구간
              </Button>
              <Button
                variant="secondary"
                disabled={range[1] === 100}
                onClick={() => {
                  const step = Math.min(
                    100 - range[1],
                    (range[1] - range[0]) / 2,
                  );
                  changeRange(range[0] + step, range[1] + step);
                }}
              >
                다음 구간
              </Button>
              <Button variant="secondary" onClick={() => changeRange(0, 100)}>
                전체 구간
              </Button>
              <Button
                variant="secondary"
                aria-pressed={brush}
                onClick={() => {
                  setDragZoom(false);
                  setBrush(!brush);
                  engine.current?.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'brush',
                    brushOption: {
                      brushType: brush ? false : 'rect',
                      brushMode: 'single',
                    },
                  });
                }}
              >
                드래그로 선택
              </Button>
              <Button
                variant="secondary"
                aria-pressed={dragZoom}
                onClick={() => {
                  setBrush(false);
                  setDragZoom(!dragZoom);
                  engine.current?.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'dataZoomSelect',
                    dataZoomSelectActive: !dragZoom,
                  });
                }}
              >
                드래그로 확대
              </Button>
              <label>
                구간 시작
                <input
                  aria-label="구간 시작"
                  type="range"
                  min="0"
                  max="99"
                  value={range[0]}
                  onChange={(e) =>
                    changeRange(
                      Math.min(Number(e.target.value), range[1] - 1),
                      range[1],
                    )
                  }
                />
              </label>
              <label>
                구간 끝
                <input
                  aria-label="구간 끝"
                  type="range"
                  min="1"
                  max="100"
                  value={range[1]}
                  onChange={(e) =>
                    changeRange(
                      range[0],
                      Math.max(Number(e.target.value), range[0] + 1),
                    )
                  }
                />
              </label>
              <output aria-live="polite">
                {Math.round(range[0])}%–{Math.round(range[1])}%
              </output>
            </div>
          )}
          <p id={descriptionId}>
            {prepared.cartesian
              ? '차트를 끌어 구간을 이동해요. Ctrl을 누르고 휠을 돌리면 확대하거나 축소해요. '
              : ''}
            방향키로 값을 읽고, 전체 데이터 표에서 항목을 선택할 수 있어요.
          </p>
          {failure && (
            <Alert tone="danger" role="alert">
              차트를 그리지 못했어요. 아래 데이터 표를 이용해 주세요.
            </Alert>
          )}
        </>
      )}
      <div
        ref={host}
        hidden={blocked}
        className="mega-chart-pro__canvas"
        role="group"
        aria-label={`${label} 값 탐색`}
        aria-describedby={descriptionId}
        tabIndex={blocked ? -1 : 0}
        onKeyDown={(event) => {
          if (!prepared?.rows.length) return;
          if (event.key === 'Escape') {
            engine.current?.dispatchAction({ type: 'hideTip' });
            engine.current?.dispatchAction({
              type: 'takeGlobalCursor',
              key: 'brush',
              brushOption: { brushType: false },
            });
            setBrush(false);
            setDragZoom(false);
            engine.current?.dispatchAction({
              type: 'takeGlobalCursor',
              key: 'dataZoomSelect',
              dataZoomSelectActive: false,
            });
            return;
          }
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? prepared.rows.length - 1
                : event.key === 'ArrowRight' || event.key === 'ArrowDown'
                  ? Math.min(active + 1, prepared.rows.length - 1)
                  : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                    ? Math.max(0, active - 1)
                    : active;
          if (
            ![
              'Home',
              'End',
              'ArrowRight',
              'ArrowDown',
              'ArrowLeft',
              'ArrowUp',
              'Enter',
              ' ',
            ].includes(event.key)
          )
            return;
          event.preventDefault();
          setActive(next);
          const row = prepared.rows[next]!;
          engine.current?.dispatchAction({ type: 'downplay' });
          engine.current?.dispatchAction({
            type: 'highlight',
            seriesIndex: row.seriesIndex,
            dataIndex: row.dataIndex,
          });
          engine.current?.dispatchAction({
            type: 'showTip',
            seriesIndex: row.seriesIndex,
            dataIndex: row.dataIndex,
          });
          if (event.key === ' ' || event.key === 'Enter')
            select(
              selected.includes(row.id)
                ? selected.filter((id) => id !== row.id)
                : [...selected, row.id],
            );
        }}
      />
      {!loading && !error && prepared && (
        <>
          <p role="status">
            {current?.cells
              .map(
                (cell, index) =>
                  `${prepared.columns[index]}: ${cell ?? '값 없음'}`,
              )
              .join(' · ')}
          </p>
          <div className="mega-chart-pro__tools">
            <Button variant="secondary" onClick={() => void exportFile('csv')}>
              전체 데이터 CSV 내려받기
            </Button>
            <Button
              variant="secondary"
              disabled={!selected.length}
              onClick={() => void exportFile('selected')}
            >
              선택 데이터 CSV 내려받기
            </Button>
            <Button
              variant="secondary"
              disabled={failure}
              onClick={() => void exportFile('svg')}
            >
              현재 차트 SVG 내려받기
            </Button>
            <Button
              variant="secondary"
              disabled={failure}
              onClick={() => void exportFile('png')}
            >
              현재 차트 PNG 내려받기
            </Button>
            <Button
              variant="secondary"
              disabled={!selected.length}
              onClick={() => {
                engine.current?.dispatchAction({ type: 'brush', areas: [] });
                select([]);
              }}
            >
              선택 해제
            </Button>
            <output aria-live="polite">{selected.length}개 선택</output>
          </div>
          {exportError && (
            <Alert tone="danger" role="alert">
              파일을 만들지 못했어요. 다시 내려받아 주세요.
            </Alert>
          )}
          <details className="mega-chart-pro__table">
            <summary>전체 데이터 표 보기</summary>
            <div className="mega-chart-pro__tools">
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                이전 데이터
              </Button>
              <span>
                {page + 1} /{' '}
                {Math.max(1, Math.ceil(prepared.rows.length / 100))} 페이지
              </span>
              <Button
                variant="secondary"
                disabled={(page + 1) * 100 >= prepared.rows.length}
                onClick={() => setPage(page + 1)}
              >
                다음 데이터
              </Button>
            </div>
            <div className="mega-chart-pro__table-scroll">
              <table>
                <caption>
                  {label} · 전체 데이터 {prepared.rows.length}개
                </caption>
                <thead>
                  <tr>
                    <th scope="col">선택</th>
                    {prepared.columns.map((column, index) => (
                      <th scope="col" key={index}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prepared.rows
                    .slice(page * 100, (page + 1) * 100)
                    .map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`${row.cells.slice(0, -1).join(' · ')} 선택`}
                            checked={selected.includes(row.id)}
                            onChange={(e) =>
                              select(
                                e.target.checked
                                  ? [...selected, row.id]
                                  : selected.filter((id) => id !== row.id),
                              )
                            }
                          />
                        </td>
                        {row.cells.map((cell, index) => (
                          <td key={index}>{cell ?? '값 없음'}</td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </figure>
  );
}
