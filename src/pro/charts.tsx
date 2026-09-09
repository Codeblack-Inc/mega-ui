import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from 'react';
import { Button } from '../components/controls';
import { ChartDownload, ChartDataTable } from './chart-tools';
import { Alert } from '../components/surfaces';
import {
  prepareChartData,
  normalizeChartRange,
  type ChartRange,
  type CartesianChartData,
} from './charts-model';

export interface CartesianChartProps extends Omit<
  ComponentPropsWithRef<'figure'>,
  'children'
> {
  data: CartesianChartData;
  label: string;
  type?: 'bar' | 'line' | 'area';
  stacked?: boolean;
  range?: ChartRange;
  onRangeChange?: (range: ChartRange) => void;
  showRangeControls?: boolean;
  xLabel?: string;
  yLabel?: string;
  formatValue?: (value: number) => string;
}
const tones = [
  'brand',
  'teal',
  'purple',
  'warning',
  'danger',
  'success',
] as const;
const dashes = ['', '8 4', '2 4', '10 3 2 3', '12 6', '4 3'] as const;
const numberFormat = new Intl.NumberFormat('ko-KR', {
  maximumSignificantDigits: 21,
});
const axisFormat = new Intl.NumberFormat('ko-KR', {
  notation: 'compact',
  maximumSignificantDigits: 3,
});

export function CartesianChart({
  data,
  label,
  type = 'bar',
  stacked = false,
  range,
  onRangeChange,
  showRangeControls = true,
  xLabel = '항목',
  yLabel = '값',
  formatValue = (value) => numberFormat.format(value),
  className = '',
  ...props
}: CartesianChartProps) {
  const id = useId();
  const [containerWidth, setContainerWidth] = useState(640);
  const observeWidth = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setContainerWidth(node.clientWidth),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const points = useRef<(SVGGElement | null)[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [focused, setFocused] = useState(0);
  const [internalRange, setInternalRange] = useState<ChartRange>();
  useEffect(() => {
    if (selected === null) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [selected]);
  let chart;
  try {
    chart = prepareChartData(data);
    if (stacked && type !== 'line') {
      const layout = prepareChartData(
        {
          labels: chart.labels,
          series: chart.series.filter((item) => !hidden.includes(item.id)),
        },
        true,
      );
      chart = {
        ...chart,
        layers: layout.layers,
        ticks: layout.ticks,
        position: layout.position,
      };
    }
  } catch {
    return (
      <figure
        {...props}
        className={`mega-cartesian-chart ${className}`}
        aria-label={label}
      >
        <figcaption>{label}</figcaption>
        <Alert tone="danger" role="alert">
          차트 데이터를 표시하지 못했어요. 항목 수와 값의 형식을 확인해 주세요.
        </Alert>
      </figure>
    );
  }
  const visible = chart.series
    .map((item, index) => ({ ...item, index }))
    .filter((item) => !hidden.includes(item.id));
  const hasValues = chart.series.some((item) =>
    item.values.some((value) => value !== null),
  );
  const [start, end] = normalizeChartRange(
    range ?? internalRange,
    chart.labels.length,
  );
  const count = chart.labels.length ? end - start + 1 : 0;
  const indices = Array.from({ length: count }, (_, index) => start + index);
  const rangeLocked = range !== undefined && !onRangeChange;
  const changeRange = (next: ChartRange) => {
    const normalized = normalizeChartRange(next, chart.labels.length);
    if (range === undefined) setInternalRange(normalized);
    onRangeChange?.(normalized);
    setSelected(null);
  };
  const active =
    selected !== null && selected >= start && selected <= end ? selected : null;
  const width = Math.max(640, containerWidth, count * 72 + 112);
  const left = 88;
  const right = width - 24;
  const top = 32;
  const bottom = 272;
  const step = (right - left) / Math.max(1, count);
  const x = (index: number) => left + step * (index - start + 0.5);
  const y = (value: number) => top + chart.position(value) * (bottom - top);
  const zero = y(0);
  const valueText = (value: number | null | undefined) =>
    value == null ? '값 없음' : formatValue(value);
  return (
    <figure
      {...props}
      className={`mega-cartesian-chart ${className}`}
      aria-label={label}
    >
      <figcaption>{label}</figcaption>
      <div className="mega-cartesian-chart__toolbar">
        <div
          role="group"
          aria-label="표시할 계열"
          className="mega-cartesian-chart__legend"
        >
          {chart.series.map((item, index) => (
            <Button
              key={item.id}
              variant="ghost"
              aria-pressed={!hidden.includes(item.id)}
              onClick={() =>
                setHidden(
                  hidden.includes(item.id)
                    ? hidden.filter((key) => key !== item.id)
                    : [...hidden, item.id],
                )
              }
            >
              <svg
                width="28"
                height="16"
                aria-hidden="true"
                data-tone={item.tone ?? tones[index]}
              >
                <path
                  d="M0 8H28"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={dashes[index]}
                />
              </svg>
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
        <ChartDownload data={data} label={label} categoryLabel={xLabel} />
      </div>
      {showRangeControls &&
        hasValues &&
        visible.length > 0 &&
        chart.labels.length > 1 && (
          <div
            className="mega-cartesian-chart__range"
            role="group"
            aria-label="표시 구간"
          >
            <label>
              시작 항목
              <input
                type="range"
                disabled={rangeLocked}
                min={0}
                max={chart.labels.length - 1}
                value={start}
                aria-valuetext={chart.labels[start]}
                onChange={(event) =>
                  changeRange([
                    Number(event.currentTarget.value),
                    Math.max(end, Number(event.currentTarget.value)),
                  ])
                }
              />
            </label>
            <label>
              끝 항목
              <input
                type="range"
                disabled={rangeLocked}
                min={0}
                max={chart.labels.length - 1}
                value={end}
                aria-valuetext={chart.labels[end]}
                onChange={(event) =>
                  changeRange([
                    Math.min(start, Number(event.currentTarget.value)),
                    Number(event.currentTarget.value),
                  ])
                }
              />
            </label>
            <div className="mega-cartesian-chart__toolbar">
              <Button
                variant="ghost"
                disabled={start === 0 || rangeLocked}
                onClick={() => {
                  const next = Math.max(0, start - count);
                  changeRange([next, next + count - 1]);
                }}
              >
                이전 구간
              </Button>
              <Button
                variant="ghost"
                disabled={end === chart.labels.length - 1 || rangeLocked}
                onClick={() => {
                  const next = Math.min(chart.labels.length - 1, end + count);
                  changeRange([next - count + 1, next]);
                }}
              >
                다음 구간
              </Button>
              <Button
                variant="secondary"
                disabled={count <= 2 || rangeLocked}
                onClick={() => {
                  const trim = Math.max(1, Math.floor(count / 4));
                  changeRange([start + trim, end - trim]);
                }}
              >
                확대
              </Button>
              <Button
                variant="secondary"
                disabled={count === chart.labels.length || rangeLocked}
                onClick={() =>
                  changeRange([
                    start - Math.ceil(count / 2),
                    end + Math.ceil(count / 2),
                  ])
                }
              >
                축소
              </Button>
              <Button
                variant="ghost"
                disabled={count === chart.labels.length || rangeLocked}
                onClick={() => changeRange([0, chart.labels.length - 1])}
              >
                전체 구간
              </Button>
            </div>
            <output aria-live="polite">
              {chart.labels[start]} – {chart.labels[end]} · {count}개 항목
            </output>
          </div>
        )}
      {!hasValues ? (
        <p role="status">표시할 값이 없어요.</p>
      ) : !visible.length ? (
        <p role="status">표시할 계열을 선택해 주세요.</p>
      ) : (
        <>
          <p id={`${id}-hint`} className="mega-cartesian-chart__hint">
            항목에 초점을 맞춘 뒤 좌우 방향키로 값을 살펴보세요. Home·End로
            처음과 끝으로 이동하고 Esc로 값 안내를 닫아요.
          </p>
          <div className="mega-cartesian-chart__scroll" ref={observeWidth}>
            <svg
              width={width}
              height="328"
              viewBox={`0 0 ${width} 328`}
              style={{ minWidth: width }}
              role="group"
              aria-label={`${label} ${type === 'bar' ? '막대' : type === 'area' ? '영역' : '선'} 차트`}
              aria-describedby={`${id}-hint`}
            >
              <g aria-hidden="true">
                <text x={left} y="18">
                  {yLabel}
                </text>
                {chart.ticks.map((tick, index) => (
                  <g key={index}>
                    <line
                      className="mega-cartesian-chart__grid"
                      x1={left}
                      x2={right}
                      y1={y(tick)}
                      y2={y(tick)}
                    />
                    <text x={left - 12} y={y(tick) + 4} textAnchor="end">
                      {Math.abs(tick) >= 1e12 ||
                      (tick !== 0 && Math.abs(tick) < 0.01)
                        ? tick.toExponential(1)
                        : axisFormat.format(tick)}
                      <title>{formatValue(tick)}</title>
                    </text>
                  </g>
                ))}
                <line
                  className="mega-cartesian-chart__zero"
                  x1={left}
                  x2={right}
                  y1={zero}
                  y2={zero}
                />
                <text x={(left + right) / 2} y="320" textAnchor="middle">
                  {xLabel}
                </text>
                {visible.map((item, visibleIndex) => {
                  const layer = chart.layers.find(
                    (layer) => layer.id === item.id,
                  )!;
                  const segments: number[][] = [];
                  for (const index of indices) {
                    if (item.values[index] === null) {
                      segments.push([]);
                      continue;
                    }
                    const previous = segments.at(-1)?.at(-1);
                    if (
                      stacked &&
                      type === 'area' &&
                      previous !== undefined &&
                      Math.sign(item.values[previous]!) !==
                        Math.sign(item.values[index]!)
                    )
                      segments.push([]);
                    if (!segments.length) segments.push([]);
                    segments.at(-1)!.push(index);
                  }
                  const path = segments
                    .filter((segment) => segment.length)
                    .map((segment) =>
                      segment
                        .map(
                          (index, point) =>
                            `${point ? 'L' : 'M'}${x(index)},${y(layer.values[index]!.end)}`,
                        )
                        .join(' '),
                    )
                    .join(' ');
                  const area = segments
                    .filter((segment) => segment.length)
                    .map(
                      (segment) =>
                        segment
                          .map(
                            (index, point) =>
                              `${point ? 'L' : 'M'}${x(index)},${y(layer.values[index]!.end)}`,
                          )
                          .join(' ') +
                        ' ' +
                        segment
                          .slice()
                          .reverse()
                          .map(
                            (index) =>
                              `L${x(index)},${y(layer.values[index]!.start)}`,
                          )
                          .join(' ') +
                        ' Z',
                    )
                    .join(' ');
                  const barWidth =
                    (step * 0.72) / (stacked ? 1 : visible.length);
                  return (
                    <g
                      key={item.id}
                      data-series={item.id}
                      data-tone={item.tone ?? tones[item.index]}
                    >
                      {type === 'area' && (
                        <path className="mega-cartesian-chart__area" d={area} />
                      )}
                      {type !== 'bar' && (
                        <path
                          className="mega-cartesian-chart__line"
                          d={path}
                          strokeDasharray={dashes[item.index]}
                        />
                      )}
                      {indices.map((index) =>
                        item.values[index] === null ? null : type === 'bar' ? (
                          <rect
                            key={index}
                            className="mega-cartesian-chart__bar"
                            x={
                              x(index) -
                              step * 0.36 +
                              (stacked ? 0 : visibleIndex) * barWidth
                            }
                            y={Math.min(
                              y(layer.values[index]!.end),
                              y(layer.values[index]!.start),
                            )}
                            width={barWidth - 2}
                            height={Math.max(
                              1,
                              Math.abs(
                                y(layer.values[index]!.end) -
                                  y(layer.values[index]!.start),
                              ),
                            )}
                          />
                        ) : (
                          <circle
                            key={index}
                            className="mega-cartesian-chart__point"
                            cx={x(index)}
                            cy={y(layer.values[index]!.end)}
                            r={item.index % 2 ? 4 : 3}
                          />
                        ),
                      )}
                    </g>
                  );
                })}
              </g>
              {indices.map((index) => (
                <g
                  key={index}
                  role="button"
                  aria-label={`${chart.labels[index]} 값 보기`}
                  aria-describedby={
                    active === index ? `${id}-tooltip` : undefined
                  }
                  tabIndex={
                    index === Math.max(start, Math.min(focused, end)) ? 0 : -1
                  }
                  ref={(node) => {
                    points.current[index] = node;
                  }}
                  className="mega-cartesian-chart__category"
                  data-active={active === index || undefined}
                  onPointerEnter={() => setSelected(index)}
                  onFocus={() => {
                    setFocused(index);
                    setSelected(index);
                  }}
                  onClick={() => setSelected(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelected(index);
                      return;
                    }
                    const next =
                      event.key === 'Home'
                        ? start
                        : event.key === 'End'
                          ? end
                          : event.key === 'ArrowRight'
                            ? Math.min(end, index + 1)
                            : event.key === 'ArrowLeft'
                              ? Math.max(start, index - 1)
                              : null;
                    if (next !== null) {
                      event.preventDefault();
                      points.current[next]?.focus();
                      points.current[next]?.scrollIntoView({
                        block: 'nearest',
                        inline: 'nearest',
                      });
                    }
                  }}
                >
                  <rect
                    x={left + (index - start) * step}
                    y={top}
                    width={step}
                    height={bottom - top + 32}
                  />
                  <text
                    x={x(index)}
                    y={bottom + 24}
                    textAnchor="middle"
                    aria-hidden="true"
                  >
                    {Array.from(chart.labels[index]!).length > 8
                      ? `${Array.from(chart.labels[index]!).slice(0, 7).join('')}…`
                      : chart.labels[index]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="mega-cartesian-chart__detail">
            {active !== null ? (
              <div id={`${id}-tooltip`} role="tooltip">
                <strong>{chart.labels[active]}</strong>
                <dl>
                  {visible.map((item) => (
                    <div key={item.id}>
                      <dt>{item.label}</dt>
                      <dd>{valueText(item.values[active])}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p>항목을 가리키거나 선택하면 값을 볼 수 있어요.</p>
            )}
          </div>
        </>
      )}
      <ChartDataTable
        data={chart}
        label={label}
        xLabel={xLabel}
        yLabel={yLabel}
        formatValue={formatValue}
      />
    </figure>
  );
}
