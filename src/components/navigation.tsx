import { useId, useState } from 'react';
import type { ComponentPropsWithRef, KeyboardEvent, ReactNode } from 'react';

// ---------- Tabs ----------

export interface TabItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  /** Rendered after the label (count, dot, "N"). */
  badge?: ReactNode;
  id?: string;
  panelId?: string;
}

export interface TabsProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'onChange' | 'children' | 'defaultValue'
> {
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** underline: TDS section tabs. pill: the 차트·호가 selector. */
  variant?: 'underline' | 'pill';
  size?: 'md' | 'lg';
  /** aria-label for the tablist. */
  label: string;
}

const NAV_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

/** Controlled when `value` is passed, otherwise uncontrolled from `defaultValue`. */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = 'underline',
  size = 'md',
  label,
  id,
  onKeyDown,
  className = '',
  ...props
}: TabsProps) {
  const generatedId = useId();
  const [internal, setInternal] = useState(
    () => defaultValue ?? items.find((item) => !item.disabled)?.value ?? '',
  );
  const requested = value ?? internal;
  const selected = items.some(
    (item) => item.value === requested && !item.disabled,
  )
    ? requested
    : items.find((item) => !item.disabled)?.value;

  const select = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  // Automatic activation: moving focus also selects, per the WAI-ARIA tabs pattern.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (!NAV_KEYS.includes(event.key)) return;
    const tabs = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ),
    ];
    const index = tabs.indexOf(event.target as HTMLButtonElement);
    if (index < 0 || tabs.length === 0) return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : tabs.length - 1;
    const next =
      event.key === 'Home'
        ? tabs[0]
        : event.key === 'End'
          ? tabs[tabs.length - 1]
          : tabs[(index + step) % tabs.length];
    next?.focus();
    next?.click();
  };

  return (
    <div
      {...props}
      id={id}
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={`mega-tabs mega-tabs--${variant} mega-tabs--${size} ${className}`}
    >
      {items.map((item) => {
        const active = item.value === selected;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={item.id ?? `${id ?? generatedId}-tab-${item.value}`}
            aria-controls={
              item.panelId ?? (id ? `${id}-panel-${item.value}` : undefined)
            }
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => select(item.value)}
            className="mega-tabs__item"
          >
            {item.label}
            {item.badge ? (
              <span className="mega-tabs__badge">{item.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps extends ComponentPropsWithRef<'div'> {
  active: boolean;
  /** Match the Tabs id and the item's value. */
  tabsId?: string;
  value?: string;
}

export function TabPanel({
  active,
  tabsId,
  value,
  className = '',
  ...props
}: TabPanelProps) {
  return (
    <div
      id={
        tabsId && value !== undefined ? `${tabsId}-panel-${value}` : undefined
      }
      aria-labelledby={
        tabsId && value !== undefined ? `${tabsId}-tab-${value}` : undefined
      }
      {...props}
      role="tabpanel"
      hidden={!active}
      tabIndex={active ? 0 : -1}
      className={`mega-tabs__panel ${className}`}
    />
  );
}

// ---------- SideNav ----------

export interface SideNavProps extends ComponentPropsWithRef<'nav'> {
  label: string;
}

export function SideNav({ label, className = '', ...props }: SideNavProps) {
  return (
    <nav
      {...props}
      aria-label={label}
      className={`mega-side-nav ${className}`}
    />
  );
}

export interface SideNavSectionProps extends ComponentPropsWithRef<'div'> {
  /** Optional — the top group of a dashboard sidebar is usually untitled. */
  title?: string;
}

export function SideNavSection({
  title,
  className = '',
  children,
  ...props
}: SideNavSectionProps) {
  return (
    <div {...props} className={`mega-side-nav__section ${className}`}>
      {title ? <p className="mega-side-nav__title">{title}</p> : null}
      {children}
    </div>
  );
}

type NavigationItemNativeProps =
  | (ComponentPropsWithRef<'a'> & { href: string })
  | (ComponentPropsWithRef<'button'> & { href?: undefined });

export type SideNavItemProps = NavigationItemNativeProps & {
  /** 20px inline SVG. */
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
};
export function SideNavItem({
  icon,
  badge,
  active,
  className = '',
  children,
  ...props
}: SideNavItemProps) {
  const inner = (
    <>
      {icon ? (
        <span className="mega-side-nav__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="mega-side-nav__label">{children}</span>
      {badge ? <span className="mega-side-nav__badge">{badge}</span> : null}
    </>
  );
  const shared = {
    'aria-current': active ? ('page' as const) : undefined,
    className: `mega-side-nav__item ${className}`,
  };
  return props.href === undefined ? (
    <button type="button" {...props} {...shared}>
      {inner}
    </button>
  ) : (
    <a {...props} {...shared}>
      {inner}
    </a>
  );
}

// ---------- NavRail ----------

export interface NavRailProps extends ComponentPropsWithRef<'nav'> {
  label: string;
}

export function NavRail({ label, className = '', ...props }: NavRailProps) {
  return (
    <nav
      {...props}
      aria-label={label}
      className={`mega-nav-rail ${className}`}
    />
  );
}

export type NavRailItemProps = (
  | (Omit<ComponentPropsWithRef<'a'>, 'children'> & { href: string })
  | (Omit<ComponentPropsWithRef<'button'>, 'children'> & { href?: undefined })
) & {
  /** 24px inline SVG. */
  icon: ReactNode;
  label: string;
  active?: boolean;
};
export function NavRailItem({
  icon,
  label,
  active,
  className = '',
  ...props
}: NavRailItemProps) {
  const inner = (
    <>
      <span className="mega-nav-rail__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="mega-nav-rail__label">{label}</span>
    </>
  );
  const shared = {
    'aria-current': active ? ('page' as const) : undefined,
    className: `mega-nav-rail__item ${className}`,
  };
  return props.href === undefined ? (
    <button type="button" {...props} {...shared}>
      {inner}
    </button>
  ) : (
    <a {...props} {...shared}>
      {inner}
    </a>
  );
}

// ---------- TopBar ----------

export interface TopBarProps extends ComponentPropsWithRef<'header'> {
  brand?: ReactNode;
  /** Right-aligned slot: search field, primary button, avatar. */
  actions?: ReactNode;
  /** aria-label for the inline nav that wraps `children`. */
  navLabel?: string;
}

export function TopBar({
  brand,
  actions,
  navLabel = '주요 메뉴',
  className = '',
  children,
  ...props
}: TopBarProps) {
  return (
    <header {...props} className={`mega-top-bar ${className}`}>
      {brand ? <div className="mega-top-bar__brand">{brand}</div> : null}
      {children ? (
        <nav className="mega-top-bar__nav" aria-label={navLabel}>
          {children}
        </nav>
      ) : null}
      {actions ? <div className="mega-top-bar__actions">{actions}</div> : null}
    </header>
  );
}

export interface TopBarLinkProps extends ComponentPropsWithRef<'a'> {
  active?: boolean;
}

export function TopBarLink({
  active,
  className = '',
  ...props
}: TopBarLinkProps) {
  return (
    <a
      {...props}
      aria-current={active ? 'page' : undefined}
      className={`mega-top-bar__link ${className}`}
    />
  );
}

// ---------- Breadcrumb ----------

export interface BreadcrumbProps extends ComponentPropsWithRef<'nav'> {
  label?: string;
}

export function Breadcrumb({
  label = '현재 위치',
  className = '',
  children,
  ...props
}: BreadcrumbProps) {
  return (
    <nav
      {...props}
      aria-label={label}
      className={`mega-breadcrumb ${className}`}
    >
      <ol className="mega-breadcrumb__list">{children}</ol>
    </nav>
  );
}

export interface BreadcrumbItemProps extends ComponentPropsWithRef<'li'> {
  href?: string;
  current?: boolean;
}

export function BreadcrumbItem({
  href,
  current,
  className = '',
  children,
  ...props
}: BreadcrumbItemProps) {
  return (
    <li {...props} className={`mega-breadcrumb__item ${className}`}>
      {href !== undefined && !current ? (
        <a href={href}>{children}</a>
      ) : (
        <span aria-current={current ? 'page' : undefined}>{children}</span>
      )}
    </li>
  );
}

// ---------- Pagination ----------

export interface PaginationProps extends Omit<
  ComponentPropsWithRef<'nav'>,
  'onChange' | 'children'
> {
  /** 1-based. */
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  label?: string;
  prevLabel?: string;
  nextLabel?: string;
}

/** First page, last page, `siblingCount` neighbours of the current page, gaps between. */
function pageItems(page: number, pageCount: number, siblingCount: number) {
  const items: ('gap' | number)[] = [1];
  const start = Math.max(2, page - siblingCount);
  const end = Math.min(pageCount - 1, page + siblingCount);
  if (start > 2) items.push('gap');
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < pageCount - 1) items.push('gap');
  if (pageCount > 1) items.push(pageCount);
  return items;
}

const chevron = (d: string) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d={d}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  label = '페이지 목록',
  prevLabel = '이전 페이지',
  nextLabel = '다음 페이지',
  className = '',
  ...props
}: PaginationProps) {
  if (pageCount < 1) return null;
  return (
    <nav
      {...props}
      aria-label={label}
      className={`mega-pagination ${className}`}
    >
      <button
        type="button"
        className="mega-pagination__arrow"
        aria-label={prevLabel}
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
      >
        {chevron('M14.5 5.5 8 12l6.5 6.5')}
      </button>
      {pageItems(page, pageCount, siblingCount).map((item, index) =>
        item === 'gap' ? (
          <span
            key={`gap-${index}`}
            className="mega-pagination__gap"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className="mega-pagination__page"
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange?.(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="mega-pagination__arrow"
        aria-label={nextLabel}
        disabled={page >= pageCount}
        onClick={() => onPageChange?.(page + 1)}
      >
        {chevron('M9.5 5.5 16 12l-6.5 6.5')}
      </button>
    </nav>
  );
}
