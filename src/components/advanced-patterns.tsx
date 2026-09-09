import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Button, Input } from './controls';
import { EmptyState } from './data';
import { Notification } from './extended-navigation';
import { ProgressBar } from './patterns';
import { Heading, Text } from './typography';

export interface ChartDatum {
  label: string;
  value: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'teal' | 'purple';
}

type FigureProps = Omit<ComponentPropsWithRef<'figure'>, 'children'>;

export interface BarChartProps extends FigureProps {
  data: readonly ChartDatum[];
  label: string;
  orientation?: 'horizontal' | 'vertical';
  formatValue?: (value: number) => string;
  emptyMessage?: ReactNode;
}

const finite = (value: number) => (Number.isFinite(value) ? value : 0);

export function BarChart({
  data,
  label,
  orientation = 'horizontal',
  formatValue = (value) => value.toLocaleString('ko-KR'),
  emptyMessage = '표시할 데이터가 없어요.',
  className = '',
  ...props
}: BarChartProps) {
  const values = data.map((item) => finite(item.value));
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const zero = (-min / span) * 100;
  return (
    <figure
      {...props}
      className={`mega-bar-chart ${className}`}
      data-orientation={orientation}
      aria-label={label}
    >
      <figcaption>{label}</figcaption>
      {data.length ? (
        <ul>
          {data.map((item, index) => (
            <li key={`${item.label}-${index}`} data-tone={item.tone}>
              <span className="mega-bar-chart__label">{item.label}</span>
              <span className="mega-bar-chart__track" aria-hidden="true">
                <i
                  style={
                    orientation === 'vertical'
                      ? { bottom: `${zero}%` }
                      : { left: `${zero}%` }
                  }
                />
                <span
                  style={
                    {
                      '--mega-chart-value': `${(Math.abs(values[index]!) / span) * 100}%`,
                      [orientation === 'vertical' ? 'bottom' : 'left']:
                        `${((Math.min(0, values[index]!) - min) / span) * 100}%`,
                    } as CSSProperties
                  }
                />
              </span>
              <span className="mega-bar-chart__value">
                {formatValue(finite(item.value))}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Text tone="muted">{emptyMessage}</Text>
      )}
    </figure>
  );
}

export interface LineChartProps extends FigureProps {
  data: readonly ChartDatum[];
  label: string;
  formatValue?: (value: number) => string;
  emptyMessage?: ReactNode;
}

const linePoints = (
  values: readonly number[],
  width: number,
  height: number,
) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map((value, index) => ({
    x: values.length === 1 ? width / 2 : (index / (values.length - 1)) * width,
    y:
      max === min
        ? height / 2
        : height - ((value - min) / (max - min)) * height,
  }));
};

export function LineChart({
  data,
  label,
  formatValue = (value) => value.toLocaleString('ko-KR'),
  emptyMessage = '표시할 데이터가 없어요.',
  className = '',
  ...props
}: LineChartProps) {
  const values = data.map((item) => finite(item.value));
  const points = linePoints(values, 280, 96);
  return (
    <figure
      {...props}
      className={`mega-line-chart ${className}`}
      aria-label={label}
    >
      <figcaption>{label}</figcaption>
      {data.length ? (
        <>
          <svg viewBox="0 0 300 130" aria-hidden="true">
            <line x1="10" y1="106" x2="290" y2="106" />
            <polyline
              points={points.map(({ x, y }) => `${x + 10},${y + 8}`).join(' ')}
            />
            {points.map(({ x, y }, index) => (
              <circle key={index} cx={x + 10} cy={y + 8} r="3" />
            ))}
            <text x="10" y="126">
              {data[0]?.label}
            </text>
            <text x="290" y="126" textAnchor="end">
              {data.at(-1)?.label}
            </text>
          </svg>
          <dl className="mega-line-chart__values">
            {data.map((item, index) => (
              <div key={`${item.label}-${index}`}>
                <dt>{item.label}</dt>
                <dd>{formatValue(finite(item.value))}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <Text tone="muted">{emptyMessage}</Text>
      )}
    </figure>
  );
}

export interface SparklineProps extends Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'values'
> {
  values: readonly number[];
  label?: string;
  direction?: 'auto' | 'up' | 'down' | 'neutral';
}

export function Sparkline({
  values,
  label,
  direction = 'auto',
  className = '',
  ...props
}: SparklineProps) {
  const safe = values.map(finite);
  const points = safe.length ? linePoints(safe, 176, 32) : [];
  const trend =
    direction === 'auto'
      ? (safe.at(-1) ?? 0) > (safe[0] ?? 0)
        ? 'up'
        : (safe.at(-1) ?? 0) < (safe[0] ?? 0)
          ? 'down'
          : 'neutral'
      : direction;
  return (
    <svg
      {...props}
      className={`mega-sparkline mega-sparkline--${trend} ${className}`}
      viewBox="0 0 180 40"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <line x1="2" y1="20" x2="178" y2="20" />
      {points.length ? (
        <polyline
          points={points.map(({ x, y }) => `${x + 2},${y + 4}`).join(' ')}
        />
      ) : null}
    </svg>
  );
}

export type FileUploadStatus = 'pending' | 'uploading' | 'complete' | 'error';
export interface FileUploadItem {
  id: string;
  name: string;
  size?: number;
  status: FileUploadStatus;
  progress?: number;
  error?: ReactNode;
}
export interface FileUploadListProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  items: readonly FileUploadItem[];
  label?: string;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onRemove?: (id: string) => void;
  emptyMessage?: ReactNode;
}

const fileSize = (bytes?: number) =>
  bytes === undefined
    ? null
    : bytes < 1_048_576
      ? `${Math.ceil(bytes / 1024)} KB`
      : `${(bytes / 1_048_576).toFixed(1)} MB`;

export function FileUploadList({
  items,
  label = '업로드 파일',
  onCancel,
  onRetry,
  onRemove,
  emptyMessage = '업로드할 파일이 없어요.',
  className = '',
  ...props
}: FileUploadListProps) {
  return (
    <div
      {...props}
      className={`mega-file-upload-list ${className}`}
      aria-label={label}
    >
      {items.length ? (
        <ul>
          {items.map((item) => {
            const progress = Math.min(
              100,
              Math.max(0, finite(item.progress ?? 0)),
            );
            return (
              <li key={item.id} data-status={item.status}>
                <div className="mega-file-upload-list__info">
                  <strong>{item.name}</strong>
                  <Text as="span" size="xs" tone="muted">
                    {[
                      fileSize(item.size),
                      item.status === 'pending' ? '대기 중' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </div>
                {item.status === 'uploading' ? (
                  <ProgressBar
                    label={`${item.name} 업로드`}
                    value={progress}
                    aria-valuetext={`${progress}%`}
                  />
                ) : null}
                {item.status === 'complete' ? (
                  <Text as="span" size="sm" tone="success">
                    완료
                  </Text>
                ) : null}
                {item.status === 'error' ? (
                  <Text as="span" size="sm" tone="danger" role="alert">
                    {item.error ?? '업로드하지 못했어요.'}
                  </Text>
                ) : null}
                <div className="mega-file-upload-list__actions">
                  {item.status === 'uploading' && onCancel ? (
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => onCancel(item.id)}
                    >
                      취소
                    </Button>
                  ) : null}
                  {item.status === 'error' && onRetry ? (
                    <Button
                      size="sm"
                      variant="weak"
                      onClick={() => onRetry(item.id)}
                    >
                      다시 시도
                    </Button>
                  ) : null}
                  {item.status !== 'uploading' && onRemove ? (
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => onRemove(item.id)}
                    >
                      제거
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Text tone="muted">{emptyMessage}</Text>
      )}
    </div>
  );
}

export interface NotificationListItem {
  id: string | number;
  group: string;
  title: string;
  description?: ReactNode;
  read?: boolean;
  tone?: 'info' | 'neutral' | 'success' | 'warning' | 'danger';
}
export interface NotificationListProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'children'
> {
  items: readonly NotificationListItem[];
  label?: string;
  onRead?: (id: string | number) => void;
  onReadAll?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  emptyMessage?: ReactNode;
}

export function NotificationList({
  items,
  label = '알림 목록',
  onRead,
  onReadAll,
  onLoadMore,
  hasMore = false,
  loading = false,
  emptyMessage = '알림이 없어요.',
  className = '',
  ...props
}: NotificationListProps) {
  const groups = [...new Set(items.map((item) => item.group))];
  const unread = items.some((item) => !item.read);
  return (
    <section
      {...props}
      className={`mega-notification-list ${className}`}
      aria-label={props['aria-label'] ?? label}
      aria-busy={loading || undefined}
    >
      {onReadAll ? (
        <div className="mega-notification-list__toolbar">
          <Button
            size="sm"
            variant="text"
            disabled={!unread}
            onClick={onReadAll}
          >
            모두 읽음
          </Button>
        </div>
      ) : null}
      {items.length ? (
        groups.map((group) => (
          <section key={group} className="mega-notification-list__group">
            <Heading level={3} size="sm">
              {group}
            </Heading>
            {items
              .filter((item) => item.group === group)
              .map((item) => (
                <Notification
                  key={item.id}
                  data-read={item.read || undefined}
                  tone={item.tone ?? 'neutral'}
                  title={
                    <>
                      {!item.read ? (
                        <span className="mega-visually-hidden">안 읽음: </span>
                      ) : null}
                      {item.title}
                    </>
                  }
                  description={item.description}
                  action={
                    item.read ? (
                      <Text as="span" size="xs" tone="muted">
                        읽음
                      </Text>
                    ) : onRead ? (
                      <Button
                        size="sm"
                        variant="text"
                        onClick={() => onRead(item.id)}
                      >
                        읽음으로 표시
                      </Button>
                    ) : null
                  }
                />
              ))}
          </section>
        ))
      ) : (
        <EmptyState title={emptyMessage} />
      )}
      {hasMore && onLoadMore ? (
        <Button variant="secondary" loading={loading} onClick={onLoadMore}>
          더 보기
        </Button>
      ) : null}
    </section>
  );
}

export interface SelectionCardProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'title' | 'children'
> {
  type?: 'radio' | 'checkbox';
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}

export function SelectionCard({
  type = 'radio',
  title,
  description,
  icon,
  className = '',
  ...props
}: SelectionCardProps) {
  return (
    <label className={`mega-selection-card ${className}`}>
      <input {...props} type={type} />
      {icon ? <span className="mega-selection-card__icon">{icon}</span> : null}
      <span className="mega-selection-card__content">
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </span>
      <span className="mega-selection-card__mark" aria-hidden="true" />
    </label>
  );
}

export interface InlineEditProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'onChange'
> {
  value: string;
  label: string;
  onSave: (value: string) => void | Promise<void>;
  onCancel?: () => void;
  editLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
}

export function InlineEdit({
  value,
  label,
  onSave,
  onCancel,
  editLabel = '수정',
  saveLabel = '저장',
  cancelLabel = '취소',
  className = '',
  ...props
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  const cancel = () => {
    setDraft(value);
    setError('');
    setEditing(false);
    onCancel?.();
  };
  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!draft.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div {...props} className={`mega-inline-edit ${className}`}>
      {editing ? (
        <form onSubmit={save}>
          <Input
            ref={input}
            aria-label={label}
            value={draft}
            disabled={saving}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                cancel();
              }
            }}
          />
          <Button
            size="sm"
            type="submit"
            loading={saving}
            disabled={!draft.trim()}
          >
            {saveLabel}
          </Button>
          <Button size="sm" variant="text" onClick={cancel} disabled={saving}>
            {cancelLabel}
          </Button>
        </form>
      ) : (
        <>
          <Text as="span">{value}</Text>
          <Button size="sm" variant="text" onClick={() => setEditing(true)}>
            {editLabel}
          </Button>
        </>
      )}
      {error ? (
        <Text size="sm" tone="danger" role="alert">
          {error}
        </Text>
      ) : null}
    </div>
  );
}

export { FormSection as DetailSection } from './patterns';
export type { FormSectionProps as DetailSectionProps } from './patterns';
