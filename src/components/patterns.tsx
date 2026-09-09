import {
  useEffect,
  useId,
  useRef,
  type ComponentPropsWithRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Button, Select } from './controls';
import { Pagination } from './navigation';
import { Alert } from './surfaces';
import { Heading, Text, type HeadingProps } from './typography';

export interface FilterBarProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'children'
> {
  label?: string;
  search?: ReactNode;
  filters?: ReactNode;
  sort?: ReactNode;
  actions?: ReactNode;
  advanced?: ReactNode;
  advancedLabel?: string;
  defaultAdvancedOpen?: boolean;
}

export function FilterBar({
  label = '목록 필터',
  search,
  filters,
  sort,
  actions,
  advanced,
  advancedLabel = '고급 필터',
  defaultAdvancedOpen = false,
  className = '',
  ...props
}: FilterBarProps) {
  return (
    <section
      {...props}
      aria-label={props['aria-label'] ?? label}
      className={`mega-filter-bar ${className}`}
    >
      <div className="mega-filter-bar__row">
        {search ? (
          <div className="mega-filter-bar__search">{search}</div>
        ) : null}
        {filters ? (
          <div className="mega-filter-bar__filters">{filters}</div>
        ) : null}
        {sort ? <div className="mega-filter-bar__sort">{sort}</div> : null}
        {actions ? (
          <div className="mega-filter-bar__actions">{actions}</div>
        ) : null}
      </div>
      {advanced ? (
        <details
          className="mega-filter-bar__advanced"
          open={defaultAdvancedOpen || undefined}
        >
          <summary>{advancedLabel}</summary>
          <div>{advanced}</div>
        </details>
      ) : null}
    </section>
  );
}

export interface ActiveFilter {
  id: string;
  label: ReactNode;
}

export interface ActiveFiltersProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  filters: readonly ActiveFilter[];
  onRemove: (id: string) => void;
  onClear?: () => void;
  label?: string;
  clearLabel?: string;
  removeLabel?: (filter: ActiveFilter) => string;
}

export function ActiveFilters({
  filters,
  onRemove,
  onClear,
  label = '적용한 필터',
  clearLabel = '모두 지우기',
  removeLabel = (filter) => `${String(filter.label)} 필터 제거`,
  className = '',
  ...props
}: ActiveFiltersProps) {
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingFocus = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (pendingFocus.current === undefined) return;
    buttons.current[
      Math.min(pendingFocus.current, filters.length - 1)
    ]?.focus();
    if (!filters.length) root.current?.focus();
    pendingFocus.current = undefined;
  }, [filters]);

  return (
    <div
      {...props}
      ref={root}
      role="group"
      tabIndex={filters.length ? undefined : -1}
      data-empty={!filters.length || undefined}
      className={`mega-active-filters ${className}`}
      aria-label={props['aria-label'] ?? label}
    >
      <ul>
        {filters.map((filter, index) => (
          <li key={filter.id}>
            <button
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              aria-label={removeLabel(filter)}
              onClick={() => {
                pendingFocus.current = index;
                onRemove(filter.id);
              }}
            >
              <span>{filter.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>
      {onClear && filters.length ? (
        <Button size="sm" variant="text" onClick={onClear}>
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}

export interface BulkActionBarProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  count: number;
  children: ReactNode;
  onClear?: () => void;
  formatCount?: (count: number) => ReactNode;
  clearLabel?: string;
  status?: ReactNode;
  error?: ReactNode;
}

export function BulkActionBar({
  count,
  children,
  onClear,
  formatCount = (value) => `${value}개 선택`,
  clearLabel = '선택 해제',
  status,
  error,
  className = '',
  ...props
}: BulkActionBarProps) {
  if (count < 1) return null;
  return (
    <div
      {...props}
      className={`mega-bulk-action-bar ${className}`}
      aria-live="polite"
    >
      <div className="mega-bulk-action-bar__summary">
        <Text weight="semibold">{formatCount(count)}</Text>
        {onClear ? (
          <Button size="sm" variant="text" onClick={onClear}>
            {clearLabel}
          </Button>
        ) : null}
      </div>
      <div className="mega-bulk-action-bar__actions">{children}</div>
      {status ? <Text size="sm">{status}</Text> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </div>
  );
}

export interface DataPaginationProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  total: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  pageSizeLabel?: string;
  paginationLabel?: string;
  formatSummary?: (range: {
    start: number;
    end: number;
    total: number;
  }) => ReactNode;
}

export function DataPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  pageSizeLabel = '페이지당 항목 수',
  paginationLabel,
  formatSummary = ({ start, end, total: count }) =>
    count ? `${count}개 중 ${start}–${end}개` : '0개',
  className = '',
  ...props
}: DataPaginationProps) {
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;
  const pageCount = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const currentPage = Math.min(
    Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageCount,
  );
  const start = safeTotal ? (currentPage - 1) * safePageSize + 1 : 0;
  const end = Math.min(currentPage * safePageSize, safeTotal);
  const validSizes = [
    ...new Set(
      pageSizeOptions
        .filter((size) => Number.isFinite(size) && size > 0)
        .map(Math.floor),
    ),
  ];
  const sizes = validSizes.includes(safePageSize)
    ? validSizes
    : [safePageSize, ...validSizes];

  return (
    <div {...props} className={`mega-data-pagination ${className}`}>
      <Text size="sm" tone="muted">
        {formatSummary({ start, end, total: safeTotal })}
      </Text>
      <div className="mega-data-pagination__controls">
        {onPageSizeChange ? (
          <label>
            <span>{pageSizeLabel}</span>
            <Select
              size="sm"
              value={safePageSize}
              onChange={(event) =>
                onPageSizeChange(Number(event.currentTarget.value))
              }
            >
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          onPageChange={onPageChange}
          label={paginationLabel}
        />
      </div>
    </div>
  );
}

export interface FormSectionProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'title'
> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  grouped?: boolean;
  headingLevel?: HeadingProps['level'];
}

export function FormSection({
  title,
  description,
  actions,
  grouped = false,
  headingLevel = 2,
  className = '',
  children,
  ...props
}: FormSectionProps) {
  const titleId = useId();
  return grouped ? (
    <fieldset
      {...props}
      className={`mega-form-section ${className}`}
      aria-labelledby={titleId}
    >
      <legend id={titleId}>{title}</legend>
      {description || actions ? (
        <div className="mega-form-section__header">
          {description ? <Text tone="muted">{description}</Text> : <span />}
          {actions ? (
            <div className="mega-form-section__actions">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className="mega-form-section__content">{children}</div>
    </fieldset>
  ) : (
    <section
      {...props}
      className={`mega-form-section ${className}`}
      aria-labelledby={titleId}
    >
      <div className="mega-form-section__header">
        <div>
          <Heading id={titleId} level={headingLevel} size="sm">
            {title}
          </Heading>
          {description ? <Text tone="muted">{description}</Text> : null}
        </div>
        {actions ? (
          <div className="mega-form-section__actions">{actions}</div>
        ) : null}
      </div>
      <div className="mega-form-section__content">{children}</div>
    </section>
  );
}

export interface FormActionsProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  dirty?: boolean;
  saving?: boolean;
  disabled?: boolean;
  sticky?: boolean;
  form?: string;
  submitLabel?: ReactNode;
  cancelLabel?: ReactNode;
  onCancel?: () => void;
  status?: ReactNode;
  statusTone?: 'info' | 'neutral' | 'success' | 'warning' | 'danger';
}

export function FormActions({
  dirty,
  saving = false,
  disabled = false,
  sticky = false,
  form,
  submitLabel = '저장하기',
  cancelLabel = '취소',
  onCancel,
  status,
  statusTone = 'neutral',
  className = '',
  ...props
}: FormActionsProps) {
  return (
    <div
      {...props}
      className={`mega-form-actions ${className}`}
      data-sticky={sticky || undefined}
    >
      <div className="mega-form-actions__status">
        {status ? (
          <Alert tone={statusTone}>{status}</Alert>
        ) : dirty ? (
          <Text size="sm" tone="muted">
            저장하지 않은 변경 사항이 있어요.
          </Text>
        ) : null}
      </div>
      <div className="mega-form-actions__buttons">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          type="submit"
          form={form}
          loading={saving}
          disabled={disabled || dirty === false}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

export interface FormSummaryError {
  id: string;
  label: ReactNode;
  message: ReactNode;
}

export interface FormErrorSummaryProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'ref' | 'title'
> {
  errors: readonly FormSummaryError[];
  title?: ReactNode;
  focusOnMount?: boolean;
}

export function FormErrorSummary({
  errors,
  title = '입력 내용을 확인해 주세요.',
  focusOnMount = true,
  className = '',
  ...props
}: FormErrorSummaryProps) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusOnMount && errors.length) root.current?.focus();
  }, [errors.length, focusOnMount]);

  if (!errors.length) return null;
  return (
    <div
      {...props}
      ref={root}
      role="alert"
      tabIndex={-1}
      className={`mega-form-error-summary ${className}`}
    >
      <Heading level={3} size="sm">
        {title}
      </Heading>
      <ul>
        {errors.map((error) => (
          <li key={error.id}>
            <a
              href={`#${error.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(error.id)?.focus();
              }}
            >
              <strong>{error.label}</strong>: {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface ListRowProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'title' | 'children'
> {
  title: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

/** A static row. Place an explicitly labelled button/link in trailing for actions. */
export function ListRow({
  title,
  description,
  leading,
  trailing,
  className = '',
  ...props
}: ListRowProps) {
  return (
    <div className={`mega-list-row ${className}`} {...props}>
      {leading ? (
        <span className="mega-list-row__leading">{leading}</span>
      ) : null}
      <div className="mega-list-row__content">
        <span className="mega-list-row__title">{title}</span>
        {description ? (
          <span className="mega-list-row__description">{description}</span>
        ) : null}
      </div>
      {trailing ? (
        <div className="mega-list-row__trailing">{trailing}</div>
      ) : null}
    </div>
  );
}

export interface SwitchProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'children'
> {
  label: string;
}

export function Switch({ label, className = '', ...props }: SwitchProps) {
  return (
    <label className={`mega-switch ${className}`}>
      <span>{label}</span>
      <input {...props} type="checkbox" role="switch" />
    </label>
  );
}

export interface SegmentedControlProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'onChange' | 'children' | 'defaultValue' | 'name'
> {
  label: string;
  name: string;
  options: readonly { label: string; value: string; disabled?: boolean }[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

/** Native radio semantics provide arrow-key navigation and form serialization. */
export function SegmentedControl({
  label,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  className = '',
  ...props
}: SegmentedControlProps) {
  return (
    <fieldset className={`mega-segmented ${className}`} {...props}>
      <legend className="mega-visually-hidden">{label}</legend>
      {options.map((option) => (
        <label className="mega-segmented__option" key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            disabled={option.disabled}
            checked={value === undefined ? undefined : value === option.value}
            defaultChecked={
              value === undefined ? defaultValue === option.value : undefined
            }
            onChange={(event) => {
              if (event.target.checked) onValueChange?.(option.value);
            }}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export interface BottomCTAProps extends ComponentPropsWithRef<'div'> {
  description?: string;
  sticky?: boolean;
}

export function BottomCTA({
  description,
  sticky = false,
  className = '',
  children,
  ...props
}: BottomCTAProps) {
  return (
    <div
      className={`mega-bottom-cta ${className}`}
      data-sticky={sticky || undefined}
      {...props}
    >
      {description ? (
        <Text size="sm" tone="muted">
          {description}
        </Text>
      ) : null}
      <div className="mega-bottom-cta__actions">{children}</div>
    </div>
  );
}

export interface ProgressBarProps extends Omit<
  ComponentPropsWithRef<'progress'>,
  'children'
> {
  label: string;
}

export function ProgressBar({
  label,
  max = 100,
  className = '',
  ...props
}: ProgressBarProps) {
  return (
    <progress
      className={`mega-progress ${className}`}
      aria-label={label}
      max={max}
      {...props}
    />
  );
}

export interface ResultProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'title' | 'children'
> {
  title: string;
  description?: string;
  tone?: 'success' | 'info' | 'danger';
  actions?: ReactNode;
}

export function Result({
  title,
  description,
  tone = 'success',
  actions,
  className = '',
  ...props
}: ResultProps) {
  return (
    <div className={`mega-result mega-result--${tone} ${className}`} {...props}>
      <span className="mega-result__symbol" aria-hidden="true" />
      <Heading size="lg">{title}</Heading>
      {description ? <Text tone="muted">{description}</Text> : null}
      {actions ? <div className="mega-result__actions">{actions}</div> : null}
    </div>
  );
}
