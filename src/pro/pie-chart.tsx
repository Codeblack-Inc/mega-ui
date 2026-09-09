import { useId, useState, type ComponentPropsWithRef } from 'react';
import { Button } from '../components/controls';
import { Alert } from '../components/surfaces';
import { ChartDownload, ChartDataTable } from './chart-tools';
import { preparePieData, type PieChartDatum } from './charts-model';

export interface PieChartProps extends Omit<
  ComponentPropsWithRef<'figure'>,
  'children'
> {
  data: readonly PieChartDatum[];
  label: string;
  variant?: 'pie' | 'donut';
  valueLabel?: string;
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
const percentage = new Intl.NumberFormat('ko-KR', {
  style: 'percent',
  maximumFractionDigits: 1,
});
export function PieChart({
  data,
  label,
  variant = 'pie',
  valueLabel = '값',
  formatValue = (value) =>
    value.toLocaleString('ko-KR', { maximumSignificantDigits: 21 }),
  className = '',
  ...props
}: PieChartProps) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  let prepared;
  try {
    prepared = preparePieData(data);
  } catch {
    return (
      <figure
        {...props}
        className={`mega-cartesian-chart mega-pie-chart ${className}`}
        aria-label={label}
      >
        <figcaption>{label}</figcaption>
        <Alert tone="danger" role="alert">
          원형 차트 데이터를 표시하지 못했어요. 항목은 24개 이하, 값은 0 이상의
          숫자나 빈 값으로 지정해 주세요.
        </Alert>
      </figure>
    );
  }
  const { chart, slices } = prepared;
  chart.series[0]!.label = valueLabel;
  const selected = active === null ? undefined : slices[active];
  const text = (value: number | null) =>
    value === null ? '값 없음' : formatValue(value);
  const point = (angle: number, radius: number) =>
    `${160 + Math.cos(angle) * radius},${160 + Math.sin(angle) * radius}`;
  return (
    <figure
      {...props}
      className={`mega-cartesian-chart mega-pie-chart ${className}`}
      aria-label={label}
    >
      <figcaption>{label}</figcaption>
      <div className="mega-cartesian-chart__toolbar">
        <span>{valueLabel} · 전체 대비 비율</span>
        <ChartDownload data={chart} label={label} categoryLabel="항목" />
      </div>
      {!slices.some((slice) => slice.share > 0) ? (
        <p role="status">비율을 표시할 양수 값이 없어요.</p>
      ) : (
        <div className="mega-pie-chart__body">
          <svg
            viewBox="0 0 320 320"
            role="group"
            aria-label={`${label} ${variant === 'donut' ? '도넛' : '원형'} 차트`}
          >
            {slices.map((slice, index) => {
              if (slice.share === 0) return null;
              // Two arcs also represent the one-slice full circle without a degenerate path.
              const middle = (slice.start + slice.end) / 2;
              const outer = `M${point(slice.start, 136)} A136,136 0 0 1 ${point(middle, 136)} A136,136 0 0 1 ${point(slice.end, 136)}`;
              const path =
                variant === 'pie'
                  ? `${outer} L160,160 Z`
                  : `${outer} L${point(slice.end, 80)} A80,80 0 0 0 ${point(middle, 80)} A80,80 0 0 0 ${point(slice.start, 80)} Z`;
              return (
                <path
                  key={index}
                  d={path}
                  data-tone={slice.tone ?? tones[index % tones.length]}
                  className="mega-pie-chart__slice"
                  data-active={active === index || undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={`${slice.label}: ${text(slice.value)}, ${percentage.format(slice.share)}`}
                  aria-describedby={
                    active === index ? `${id}-detail` : undefined
                  }
                  onPointerEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActive(index);
                    }
                    if (event.key === 'Escape') setActive(null);
                    const paths = [
                      ...event.currentTarget.parentElement!.querySelectorAll<SVGPathElement>(
                        '[role="button"]',
                      ),
                    ];
                    const position = paths.indexOf(event.currentTarget);
                    const next =
                      event.key === 'ArrowRight'
                        ? (position + 1) % paths.length
                        : event.key === 'ArrowLeft'
                          ? (position + paths.length - 1) % paths.length
                          : event.key === 'Home'
                            ? 0
                            : event.key === 'End'
                              ? paths.length - 1
                              : null;
                    if (next !== null) {
                      event.preventDefault();
                      paths[next]?.focus();
                    }
                  }}
                />
              );
            })}
            {variant === 'donut' && (
              <text
                x="160"
                y="164"
                textAnchor="middle"
                className="mega-pie-chart__center"
                aria-hidden="true"
              >
                100%
              </text>
            )}
          </svg>
          <div
            className="mega-pie-chart__legend"
            role="group"
            aria-label="항목별 비율"
          >
            {slices.map((slice, index) => (
              <Button
                key={index}
                variant="ghost"
                aria-pressed={active === index}
                onClick={() => setActive(active === index ? null : index)}
              >
                <span
                  className="mega-pie-chart__swatch"
                  data-tone={slice.tone ?? tones[index % tones.length]}
                  aria-hidden="true"
                />
                <span>{slice.label}</span>
                <span>
                  {text(slice.value)} · {percentage.format(slice.share)}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
      <div
        className="mega-cartesian-chart__detail"
        id={`${id}-detail`}
        role="status"
      >
        {selected ? (
          <>
            <strong>{selected.label}</strong>
            <p>
              {text(selected.value)} {valueLabel} ·{' '}
              {percentage.format(selected.share)}
            </p>
          </>
        ) : (
          <p>항목을 선택하면 값과 비율을 볼 수 있어요.</p>
        )}
      </div>
      <ChartDataTable
        data={chart}
        label={label}
        xLabel="항목"
        yLabel={valueLabel}
        formatValue={formatValue}
      />
    </figure>
  );
}
