import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type {
  ComponentPropsWithRef,
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent,
  MouseEventHandler,
  ReactElement,
  ReactNode,
} from 'react';
import { Button } from './controls';
import { Dialog, Menu, type DialogProps, type MenuProps } from './overlay';
import { ProgressBar, Result, type ResultProps } from './patterns';
import { SideNav } from './navigation';

type Trigger = ReactElement<{
  onClick?: MouseEventHandler;
  onContextMenu?: MouseEventHandler;
  onKeyDown?: (event: ReactKeyboardEvent) => void;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'dialog';
}>;

export type AnchorProps = ComponentPropsWithRef<'a'>;
export function Anchor({ className = '', ...props }: AnchorProps) {
  return <a {...props} className={`mega-anchor ${className}`} />;
}

export interface StepperProps extends Omit<
  ComponentPropsWithRef<'ol'>,
  'children'
> {
  items: readonly {
    label: ReactNode;
    description?: ReactNode;
    disabled?: boolean;
  }[];
  current: number;
  onStepChange?: (step: number) => void;
  label?: string;
}

export function Stepper({
  items,
  current,
  onStepChange,
  label = '진행 단계',
  className = '',
  ...props
}: StepperProps) {
  return (
    <ol {...props} className={`mega-stepper ${className}`} aria-label={label}>
      {items.map((item, index) => {
        const active = index === current;
        const complete = index < current;
        return (
          <li
            key={index}
            className="mega-stepper__item"
            data-active={active || undefined}
            data-complete={complete || undefined}
          >
            <button
              type="button"
              className="mega-stepper__button"
              aria-current={active ? 'step' : undefined}
              aria-label={`${index + 1}. ${typeof item.label === 'string' ? item.label : '단계'}`}
              disabled={item.disabled || !onStepChange}
              onClick={() => onStepChange?.(index)}
            >
              <span className="mega-stepper__number" aria-hidden="true">
                {complete ? '✓' : index + 1}
              </span>
              <span>
                <span
                  className="mega-stepper__label"
                  data-progress={`${index + 1}/${items.length}`}
                >
                  {item.label}
                </span>
                {item.description ? (
                  <span className="mega-stepper__description">
                    {item.description}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export { Menu as DropdownMenu };
export type { MenuProps as DropdownMenuProps };

export interface ContextMenuProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  trigger: Trigger;
  children: ReactNode;
}

/** Local context menu; it deliberately does not attempt viewport collision handling. */
export function ContextMenu({
  trigger,
  children,
  className = '',
  onKeyDown,
  ...props
}: ContextMenuProps) {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = (returnFocus = false) => {
    setPoint(null);
    if (returnFocus)
      ref.current
        ?.querySelector<HTMLElement>('[aria-haspopup="menu"]')
        ?.focus();
  };
  const focusMenuItem = (key: string) => {
    const items = Array.from(
      ref.current?.querySelectorAll<HTMLElement>(
        '.mega-context-menu__popup [role="menuitem"]:not(:disabled)',
      ) ?? [],
    );
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    const index =
      key === 'Home'
        ? 0
        : key === 'End'
          ? items.length - 1
          : (current + (key === 'ArrowDown' ? 1 : items.length - 1)) %
            items.length;
    items[index]?.focus();
  };
  useEffect(() => {
    if (!point) return;
    ref.current
      ?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')
      ?.focus();
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setPoint(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [point]);
  return (
    <div
      {...props}
      ref={ref}
      className={`mega-context-menu ${className}`}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          dismiss(true);
        } else if (
          point &&
          ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
        ) {
          event.preventDefault();
          focusMenuItem(event.key);
        }
      }}
    >
      {cloneElement(trigger, {
        'aria-haspopup': 'menu',
        'aria-expanded': Boolean(point),
        onContextMenu: (event: MouseEvent) => {
          trigger.props.onContextMenu?.(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          setPoint({ x: event.clientX, y: event.clientY });
        },
        onKeyDown: (event: ReactKeyboardEvent) => {
          trigger.props.onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            setPoint({ x: rect.left, y: rect.bottom });
            return;
          }
          if (
            event.key !== 'ContextMenu' &&
            !(event.shiftKey && event.key === 'F10')
          )
            return;
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          setPoint({ x: rect.left, y: rect.bottom });
        },
      })}
      {point ? (
        <div
          role="menu"
          className="mega-context-menu__popup"
          style={{ left: point.x, top: point.y }}
          onClick={() => dismiss(true)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export interface NavigationMenuProps extends ComponentPropsWithRef<'nav'> {
  label: string;
}
export function NavigationMenu({
  label,
  className = '',
  ...props
}: NavigationMenuProps) {
  return (
    <nav
      {...props}
      aria-label={label}
      className={`mega-navigation-menu ${className}`}
    />
  );
}

export interface MegaMenuProps extends ComponentPropsWithRef<'nav'> {
  label: string;
}
export function MegaMenu({ label, className = '', ...props }: MegaMenuProps) {
  return (
    <nav
      {...props}
      aria-label={label}
      className={`mega-mega-menu ${className}`}
    />
  );
}

export { SideNav as Sidebar };
export type { SideNavProps as SidebarProps } from './navigation';

export interface BottomNavigationProps extends Omit<
  ComponentPropsWithRef<'nav'>,
  'children' | 'onChange'
> {
  label: string;
  items: readonly {
    value: string;
    label: string;
    icon: ReactNode;
    href?: string;
    disabled?: boolean;
  }[];
  value?: string;
  onValueChange?: (value: string) => void;
}
export function BottomNavigation({
  label,
  items,
  value,
  onValueChange,
  className = '',
  ...props
}: BottomNavigationProps) {
  return (
    <nav
      {...props}
      aria-label={label}
      className={`mega-bottom-navigation ${className}`}
    >
      {items.map((item) => {
        const content = (
          <>
            <span aria-hidden="true" className="mega-bottom-navigation__icon">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </>
        );
        const shared = {
          className: 'mega-bottom-navigation__item',
          'aria-current': value === item.value ? ('page' as const) : undefined,
        };
        return item.href && !item.disabled ? (
          <a key={item.value} {...shared} href={item.href}>
            {content}
          </a>
        ) : (
          <button
            key={item.value}
            {...shared}
            type="button"
            disabled={item.disabled}
            onClick={() => onValueChange?.(item.value)}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}

export interface CommandPaletteProps extends Omit<
  DialogProps,
  'children' | 'actions' | 'title'
> {
  commands: readonly {
    id: string;
    label: string;
    shortcut?: string;
    disabled?: boolean;
    onSelect: () => void;
  }[];
  label?: string;
}
export function CommandPalette({
  commands,
  label = '명령 팔레트',
  onClose,
  ...props
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (props.open) inputRef.current?.focus();
  }, [props.open]);
  const items = commands.filter((command) =>
    command.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const focusCommand = (key: string) => {
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)',
      ) ?? [],
    );
    if (!buttons.length) return;
    const current = buttons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const index =
      key === 'Home'
        ? 0
        : key === 'End'
          ? buttons.length - 1
          : current < 0
            ? 0
            : (current + (key === 'ArrowDown' ? 1 : buttons.length - 1)) %
              buttons.length;
    buttons[index]?.focus();
  };
  return (
    <Dialog
      {...props}
      title={label}
      onClose={onClose}
      className={`mega-command-palette ${props.className ?? ''}`}
    >
      <input
        ref={inputRef}
        className="mega-command-palette__input"
        type="search"
        autoFocus
        aria-label="명령 검색"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            focusCommand(event.key);
          }
        }}
      />
      <div ref={listRef} className="mega-command-palette__list">
        {items.length === 0 && <p role="status">일치하는 명령이 없어요.</p>}
        {items.map((command) => (
          <button
            key={command.id}
            type="button"
            disabled={command.disabled}
            onClick={() => {
              command.onSelect();
              onClose();
            }}
            onKeyDown={(event) => {
              if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                focusCommand(event.key);
              }
            }}
          >
            <span>{command.label}</span>
            {command.shortcut ? <kbd>{command.shortcut}</kbd> : null}
          </button>
        ))}
      </div>
    </Dialog>
  );
}

export interface BackToTopProps extends ComponentPropsWithRef<'button'> {
  label?: string;
}
export function BackToTop({
  label = '맨 위로',
  className = '',
  onClick,
  ...props
}: BackToTopProps) {
  return (
    <button
      {...props}
      type="button"
      className={`mega-back-to-top ${className}`}
      aria-label={label}
      onClick={(event) => {
        onClick?.(event);
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'auto'
            : 'smooth',
        });
      }}
    >
      ↑
    </button>
  );
}

export interface PopoverProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  trigger: Trigger;
  children: ReactNode;
  label: string;
}
export function Popover({
  trigger,
  children,
  label,
  className = '',
  onKeyDown,
  ...props
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus)
      ref.current
        ?.querySelector<HTMLElement>('[aria-haspopup="dialog"]')
        ?.focus();
  };
  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>('.mega-popover__content')?.focus();
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  return (
    <div
      {...props}
      ref={ref}
      className={`mega-popover ${className}`}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          dismiss(true);
        }
      }}
    >
      {cloneElement(trigger, {
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        onClick: (event: MouseEvent) => {
          trigger.props.onClick?.(event);
          if (event.defaultPrevented) return;
          setOpen((current) => !current);
        },
      })}
      {open ? (
        <div
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          className="mega-popover__content"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export interface HoverCardProps extends Omit<
  ComponentPropsWithRef<'span'>,
  'children'
> {
  trigger: ReactNode;
  children: ReactNode;
}
export function HoverCard({
  trigger,
  children,
  className = '',
  onMouseEnter,
  onFocusCapture,
  onKeyDown,
  ...props
}: HoverCardProps) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  return (
    <span
      {...props}
      className={`mega-hover-card ${className}`}
      data-dismissed={dismissed || undefined}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (!event.defaultPrevented) setDismissed(false);
      }}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        if (!event.defaultPrevented) setDismissed(false);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== 'Escape') return;
        event.preventDefault();
        setDismissed(true);
      }}
    >
      {isValidElement<{ 'aria-describedby'?: string }>(trigger)
        ? cloneElement(trigger, { 'aria-describedby': id })
        : trigger}
      <span id={id} role="tooltip" className="mega-hover-card__content">
        {children}
      </span>
    </span>
  );
}

export { Dialog as Modal };
export type { DialogProps as ModalProps };

export interface AlertDialogProps extends Omit<DialogProps, 'dismissible'> {}
export function AlertDialog(props: AlertDialogProps) {
  return <Dialog {...props} role="alertdialog" dismissible={false} />;
}

export interface DrawerProps extends DialogProps {
  side?: 'start' | 'end';
}
export function Drawer({
  side = 'end',
  className = '',
  ...props
}: DrawerProps) {
  return (
    <Dialog
      {...props}
      className={`mega-drawer mega-drawer--${side} ${className}`}
    />
  );
}

export type SheetProps = DialogProps;
export function Sheet({ className = '', ...props }: SheetProps) {
  return <Dialog {...props} sheet className={`mega-sheet ${className}`} />;
}

export interface TourProps extends Omit<
  DialogProps,
  'children' | 'actions' | 'title'
> {
  steps: readonly { title: string; description?: ReactNode }[];
  current: number;
  onStepChange?: (step: number) => void;
}
export function Tour({
  steps,
  current,
  onStepChange,
  onClose,
  ...props
}: TourProps) {
  const step = steps[current];
  if (!step) return null;
  const last = current === steps.length - 1;
  return (
    <Dialog
      {...props}
      title={step.title}
      description={step.description}
      onClose={onClose}
      className={`mega-tour ${props.className ?? ''}`}
      actions={
        <>
          <Button
            variant="secondary"
            disabled={current === 0}
            onClick={() => onStepChange?.(current - 1)}
          >
            이전
          </Button>
          <Button
            onClick={() => (last ? onClose() : onStepChange?.(current + 1))}
          >
            {last ? '완료' : '다음'}
          </Button>
        </>
      }
    >
      <p className="mega-tour__count">
        {current + 1} / {steps.length}
      </p>
    </Dialog>
  );
}

export interface MessageProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'title'
> {
  title: ReactNode;
  description?: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}
export function Message({
  title,
  description,
  tone = 'info',
  className = '',
  children,
  ...props
}: MessageProps) {
  return (
    <div
      {...props}
      role="status"
      className={`mega-message mega-message--${tone} ${className}`}
    >
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
      {children}
    </div>
  );
}

export type ToastProps = MessageProps;
/** Static toast; for queued, timed toasts use ToastProvider/useToast. */
export function Toast({ className = '', ...props }: ToastProps) {
  return <Message {...props} className={`mega-static-toast ${className}`} />;
}

export interface NotificationProps extends MessageProps {
  action?: ReactNode;
}
export function Notification({
  action,
  className = '',
  children,
  ...props
}: NotificationProps) {
  return (
    <Message {...props} className={`mega-notification ${className}`}>
      {children}
      {action}
    </Message>
  );
}

export { ProgressBar as Progress };
export type { ProgressBarProps as ProgressProps } from './patterns';

export interface CircularProgressProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  label: string;
  value?: number;
  max?: number;
  size?: number;
}
export function CircularProgress({
  label,
  value,
  max = 100,
  size = 32,
  className = '',
  style,
  ...props
}: CircularProgressProps) {
  const determinate = value !== undefined;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue =
    typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const amount = determinate
    ? Math.min(safeMax, Math.max(0, safeValue))
    : undefined;
  const percent = determinate ? (amount! / safeMax) * 100 : 25;
  const progressStyle = {
    width: size,
    height: size,
    ...style,
  } as CSSProperties;
  return (
    <div
      {...props}
      className={`mega-circular-progress ${className}`}
      style={progressStyle}
      role="progressbar"
      aria-label={label}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? safeMax : undefined}
      aria-valuenow={amount}
    >
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle
          className="mega-circular-progress__track"
          cx="18"
          cy="18"
          r="15.9"
          pathLength="100"
        />
        <circle
          className="mega-circular-progress__value"
          cx="18"
          cy="18"
          r="15.9"
          pathLength="100"
          strokeDasharray={`${percent} 100`}
        />
      </svg>
    </div>
  );
}

export interface SpinnerProps extends ComponentPropsWithRef<'span'> {
  label?: string;
}
export function Spinner({
  label = '로딩 중',
  className = '',
  ...props
}: SpinnerProps) {
  return (
    <span
      {...props}
      role="status"
      aria-label={label}
      className={`mega-spinner mega-spinner--standalone ${className}`}
    />
  );
}

export type ErrorStateProps = Omit<ResultProps, 'tone'>;
export function ErrorState(props: ErrorStateProps) {
  return <Result {...props} tone="danger" />;
}
