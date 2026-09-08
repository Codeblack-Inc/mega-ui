import {
  Children,
  createElement,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Button, IconButton } from './controls';
import { Heading, Text } from './typography';

export interface TableProps extends ComponentPropsWithRef<'table'> {
  density?: 'compact' | 'regular';
  zebra?: boolean;
  bordered?: boolean;
  stickyHeader?: boolean;
  caption?: ReactNode;
}

/** className/style apply to the scroll wrapper; native table props/ref to the table. */
export function Table({
  density = 'regular',
  zebra = false,
  bordered = false,
  stickyHeader = false,
  caption,
  className = '',
  style,
  children,
  ...props
}: TableProps) {
  return (
    <div
      className={`mega-table mega-table--${density} ${className}`}
      style={style}
      data-zebra={zebra || undefined}
      data-bordered={bordered || undefined}
      data-sticky-header={stickyHeader || undefined}
    >
      <table {...props}>
        {caption != null ? <caption>{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export type TableHeadProps = ComponentPropsWithRef<'thead'>;
export function TableHead({ className = '', ...props }: TableHeadProps) {
  return <thead className={`mega-table__head ${className}`} {...props} />;
}

export type TableBodyProps = ComponentPropsWithRef<'tbody'>;
export function TableBody({ className = '', ...props }: TableBodyProps) {
  return <tbody className={`mega-table__body ${className}`} {...props} />;
}

export interface TableRowProps extends ComponentPropsWithRef<'tr'> {
  selected?: boolean;
  clickable?: boolean;
}
export function TableRow({
  selected,
  clickable = false,
  className = '',
  tabIndex,
  onKeyDown,
  ...props
}: TableRowProps) {
  return (
    <tr
      {...props}
      className={`mega-table__row ${className}`}
      data-selected={selected || undefined}
      data-clickable={clickable || undefined}
      aria-selected={selected}
      tabIndex={tabIndex ?? (clickable ? 0 : undefined)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          clickable &&
          !event.defaultPrevented &&
          event.target === event.currentTarget &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    />
  );
}

export interface TableHeaderCellProps extends Omit<
  ComponentPropsWithRef<'th'>,
  'align'
> {
  align?: 'start' | 'center' | 'end';
  sortDirection?: 'asc' | 'desc' | 'none';
  onSort?: ComponentPropsWithRef<'button'>['onClick'];
}
export function TableHeaderCell({
  align = 'start',
  sortDirection,
  onSort,
  scope = 'col',
  className = '',
  children,
  ...props
}: TableHeaderCellProps) {
  const direction = sortDirection ?? (onSort ? 'none' : undefined);
  return (
    <th
      {...props}
      scope={scope}
      className={`mega-table__header-cell ${className}`}
      data-align={align}
      aria-sort={
        direction === 'asc'
          ? 'ascending'
          : direction === 'desc'
            ? 'descending'
            : direction
      }
    >
      {onSort ? (
        <Button
          variant="ghost"
          size="xs"
          className="mega-table__sort"
          onClick={onSort}
        >
          {children}
          <svg
            width="12"
            height="16"
            viewBox="0 0 12 16"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M6 2 10 6H2Z" opacity={direction === 'desc' ? 0.3 : 1} />
            <path d="m6 14 4-4H2Z" opacity={direction === 'asc' ? 0.3 : 1} />
          </svg>
        </Button>
      ) : (
        children
      )}
    </th>
  );
}

export interface TableCellProps extends Omit<
  ComponentPropsWithRef<'td'>,
  'align'
> {
  align?: 'start' | 'center' | 'end';
  numeric?: boolean;
  tone?: 'default' | 'up' | 'down' | 'muted';
}
export function TableCell({
  align = 'start',
  numeric = false,
  tone = 'default',
  className = '',
  ...props
}: TableCellProps) {
  return (
    <td
      {...props}
      className={`mega-table__cell mega-table__cell--${tone} ${className}`}
      data-align={numeric ? 'end' : align}
      data-numeric={numeric || undefined}
    />
  );
}

export type TableEmptyProps = ComponentPropsWithRef<'td'>;
/** Place directly in TableBody; colSpan can specify the exact column count. */
export function TableEmpty({
  className = '',
  colSpan = 1000,
  ...props
}: TableEmptyProps) {
  return (
    <TableRow>
      <td
        className={`mega-table__empty ${className}`}
        colSpan={colSpan}
        {...props}
      />
    </TableRow>
  );
}

export interface StatProps extends ComponentPropsWithRef<'div'> {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  delta?: { value: string; direction: 'up' | 'down' | 'flat' };
  hint?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'end';
}
export function Stat({
  label,
  value,
  unit,
  delta,
  hint,
  size = 'md',
  align = 'start',
  className = '',
  ...props
}: StatProps) {
  return (
    <div
      className={`mega-stat mega-stat--${size} ${className}`}
      data-align={align}
      {...props}
    >
      <Text size="xs" tone="muted" weight="medium">
        {label}
      </Text>
      <div className="mega-stat__amount">
        <Text as="span" weight="bold" numeric className="mega-stat__value">
          {value}
        </Text>
        {unit != null ? (
          <Text as="span" size="sm" weight="medium" tone="secondary">
            {unit}
          </Text>
        ) : null}
      </div>
      {delta ? (
        <Text
          size="xs"
          weight="semibold"
          numeric
          className={`mega-stat__delta mega-stat__delta--${delta.direction}`}
        >
          {delta.direction !== 'flat' ? (
            <>
              <span className="mega-visually-hidden">
                {delta.direction === 'up' ? '상승 ' : '하락 '}
              </span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d={delta.direction === 'up' ? 'M5 1 10 9H0Z' : 'M5 9 10 1H0Z'}
                />
              </svg>
            </>
          ) : null}
          {delta.value}
        </Text>
      ) : null}
      {hint != null ? (
        <Text tone="muted" className="mega-stat__hint">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}

export type AmountProps = {
  value: number;
  currency?: string;
  signed?: boolean;
  tone?: 'default' | 'up' | 'down' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
} & (
  | (ComponentPropsWithRef<'span'> & { as?: 'span' })
  | (ComponentPropsWithRef<'p'> & { as: 'p' })
);
const amountFormat = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 20,
});
export function Amount({
  value,
  currency = '원',
  signed = false,
  tone = 'default',
  size = 'md',
  as: Tag = 'span',
  className = '',
  ...props
}: AmountProps) {
  const resolvedTone =
    tone === 'auto'
      ? value > 0
        ? 'up'
        : value < 0
          ? 'down'
          : 'default'
      : tone;
  const sign = value < 0 ? '-' : signed && value > 0 ? '+' : '';
  return createElement(
    Tag,
    {
      ...props,
      className: `mega-amount mega-amount--${size} mega-amount--${resolvedTone} ${className}`,
    },
    <>
      {sign}
      {currency === '$' ? '$' : null}
      {amountFormat.format(Math.abs(value))}
      {currency && currency !== '$' ? (
        <span className={currency === '원' ? 'mega-amount__unit' : undefined}>
          {currency}
        </span>
      ) : null}
    </>,
  );
}

export interface AvatarProps extends ComponentPropsWithRef<'span'> {
  name: string;
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'rounded';
}
const avatarTones = ['brand', 'success', 'warning', 'purple', 'teal'] as const;
export function Avatar({
  name,
  src,
  alt = name,
  size = 'md',
  shape = 'circle',
  className = '',
  ...props
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  let hash = 0;
  for (const character of name)
    hash = (Math.imul(hash, 31) + character.codePointAt(0)!) >>> 0;
  return (
    <span
      className={`mega-avatar mega-avatar--${size} mega-avatar--${shape} mega-avatar--${avatarTones[hash % avatarTones.length]} ${className}`}
      {...props}
    >
      {src && src !== failedSrc ? (
        <img src={src} alt={alt} onError={() => setFailedSrc(src)} />
      ) : (
        <span
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
          aria-hidden={!alt || undefined}
        >
          {Array.from(name.trim())[0] || '?'}
        </span>
      )}
    </span>
  );
}

export interface AvatarGroupProps extends ComponentPropsWithRef<'div'> {
  max?: number;
}
export function AvatarGroup({
  max,
  children,
  className = '',
  ...props
}: AvatarGroupProps) {
  const avatars = Children.toArray(children);
  const count =
    max === undefined || !Number.isFinite(max)
      ? avatars.length
      : Math.max(0, Math.floor(max));
  const overflow = Math.max(0, avatars.length - count);
  return (
    <div className={`mega-avatar-group ${className}`} {...props}>
      {avatars.slice(0, count)}
      {overflow > 0 ? (
        <span
          className="mega-avatar-group__overflow"
          aria-label={`추가 ${overflow}명`}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

export interface SkeletonProps extends ComponentPropsWithRef<'span'> {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  shape?: 'text' | 'rect' | 'circle';
  lines?: number;
}
export function Skeleton({
  width,
  height,
  shape = 'text',
  lines = 1,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const count = Number.isFinite(lines) ? Math.max(1, Math.floor(lines)) : 1;
  return (
    <span
      {...props}
      className={`mega-skeleton mega-skeleton--${shape} ${className}`}
      style={{ width, ...style }}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="mega-skeleton__line" style={{ height }} />
      ))}
    </span>
  );
}

export interface BannerProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'title'
> {
  tone?: 'neutral' | 'brand' | 'warning' | 'danger';
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
}
export function Banner({
  tone = 'neutral',
  icon,
  title,
  description,
  action,
  onDismiss,
  className = '',
  children,
  ...props
}: BannerProps) {
  return (
    <div className={`mega-banner mega-banner--${tone} ${className}`} {...props}>
      {icon != null ? (
        <span className="mega-banner__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="mega-banner__content">
        <Heading level={3} className="mega-banner__title">
          {title}
        </Heading>
        {description != null ? (
          <Text size="xs" tone="muted">
            {description}
          </Text>
        ) : null}
        {children}
      </div>
      {action != null ? (
        <div className="mega-banner__action">{action}</div>
      ) : null}
      {onDismiss ? (
        <IconButton label="닫기" size="sm" onClick={onDismiss}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </IconButton>
      ) : null}
    </div>
  );
}

export interface EmptyStateProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'title'
> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div className={`mega-empty-state ${className}`} {...props}>
      {icon != null ? (
        <span className="mega-empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <Heading level={3} size="sm" className="mega-empty-state__title">
        {title}
      </Heading>
      {description != null ? (
        <Text size="sm" tone="muted">
          {description}
        </Text>
      ) : null}
      {action != null ? (
        <div className="mega-empty-state__action">{action}</div>
      ) : null}
      {children}
    </div>
  );
}
