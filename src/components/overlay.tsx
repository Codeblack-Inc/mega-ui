import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useFloating } from './use-floating';
import type {
  ComponentPropsWithRef,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEventHandler,
  ReactElement,
  ReactNode,
} from 'react';
import { Button, IconButton } from './controls';
import { Heading } from './typography';

const CloseIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

// ---------------------------------------------------------------- Dialog

export interface DialogProps extends Omit<
  ComponentPropsWithRef<'dialog'>,
  'open' | 'title' | 'onClose'
> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  /** Right-aligned footer row. Pass `Button`s. */
  actions?: ReactNode;
  /** Panel max-width: sm 400 · md 560 · lg 800. */
  size?: 'sm' | 'md' | 'lg';
  /** Close button, Escape and backdrop click. Default true. */
  dismissible?: boolean;
  /** On viewports ≤600px, dock to the bottom as a sheet. */
  sheet?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  actions,
  size = 'md',
  dismissible = true,
  sheet = false,
  className = '',
  children,
  ...props
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The `.open` guards keep StrictMode's double-invoked effect from throwing.
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      {...props}
      ref={ref}
      className={`mega-dialog mega-dialog--${size} ${className}`}
      data-sheet={sheet || undefined}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onCancel={(event) => {
        if (!dismissible) event.preventDefault();
      }}
      // Escape fires `cancel` then `close`; only `close` reports upwards, and
      // only when the parent still believes the dialog is open.
      onClose={() => {
        if (open) onClose();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mega-dialog__panel">
        <Heading size="lg" id={`${id}-title`} className="mega-dialog__title">
          {title}
        </Heading>
        {dismissible ? (
          <IconButton
            label="닫기"
            className="mega-dialog__close"
            onClick={onClose}
          >
            {CloseIcon}
          </IconButton>
        ) : null}
        {description ? (
          <p id={`${id}-desc`} className="mega-dialog__description">
            {description}
          </p>
        ) : null}
        {children ? <div className="mega-dialog__body">{children}</div> : null}
        {actions ? <div className="mega-dialog__actions">{actions}</div> : null}
      </div>
    </dialog>
  );
}

// ------------------------------------------------------------------ Menu

type MenuTrigger = ReactElement<{
  onClick?: MouseEventHandler;
  'aria-haspopup'?: 'menu';
  'aria-expanded'?: boolean;
}>;

export interface MenuProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  /** A button-like element; cloned to receive the menu's ARIA state and toggle. */
  trigger: MenuTrigger;
  children: ReactNode;
  align?: 'start' | 'end';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Menu({
  trigger,
  align = 'start',
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className = '',
  children,
  ...props
}: MenuProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const ref = useRef<HTMLDivElement>(null);
  useFloating(ref, open, align);
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    ref.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      if (open) close();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (!open) {
      setOpen(true);
      return;
    }
    const items = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? [],
    );
    if (items.length === 0) return;
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      at < 0
        ? step > 0
          ? 0
          : items.length - 1
        : (at + step + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div
      {...props}
      ref={ref}
      className={`mega-menu ${className}`}
      onKeyDown={handleKeyDown}
    >
      {cloneElement(trigger, {
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        onClick: (event) => {
          trigger.props.onClick?.(event);
          setOpen(!open);
        },
      })}
      {open ? (
        <div
          role="menu"
          data-mega-floating=""
          className="mega-menu__popup"
          data-align={align}
          // ponytail: any click inside the popup closes it — items are buttons,
          // and a disabled button fires no click.
          onClick={close}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export interface MenuItemProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'onSelect'
> {
  onSelect?: () => void;
  tone?: 'default' | 'danger';
  icon?: ReactNode;
}

export function MenuItem({
  onSelect,
  tone = 'default',
  icon,
  onClick,
  className = '',
  children,
  ...props
}: MenuItemProps) {
  return (
    <button
      {...props}
      type="button"
      role="menuitem"
      className={`mega-menu__item ${tone === 'danger' ? 'mega-menu__item--danger' : ''} ${className}`}
      onClick={(event) => {
        onClick?.(event);
        onSelect?.();
      }}
    >
      {icon ? (
        <span className="mega-menu__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}

export type MenuSeparatorProps = ComponentPropsWithRef<'div'>;
export function MenuSeparator({
  className = '',
  ...props
}: MenuSeparatorProps) {
  return (
    <div
      {...props}
      role="separator"
      className={`mega-menu__separator ${className}`}
    />
  );
}

export type MenuLabelProps = ComponentPropsWithRef<'div'>;
export function MenuLabel({ className = '', ...props }: MenuLabelProps) {
  return <div {...props} className={`mega-menu__label ${className}`} />;
}

// --------------------------------------------------------------- Tooltip

export interface TooltipProps extends Omit<
  ComponentPropsWithRef<'span'>,
  'content'
> {
  content: string;
  placement?: 'top' | 'bottom';
  children: ReactNode;
}

/** CSS-only: the bubble shows on :hover / :focus-within, no JS positioning. */
export function Tooltip({
  content,
  placement = 'top',
  className = '',
  children,
  ref: forwardedRef,
  ...props
}: TooltipProps) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  useFloating(ref, true, 'center', placement);
  return (
    <span
      {...props}
      ref={(node) => {
        ref.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={`mega-tooltip mega-tooltip--${placement} ${className}`}
    >
      {isValidElement<{ 'aria-describedby'?: string }>(children)
        ? cloneElement(children, { 'aria-describedby': id })
        : children}
      <span
        role="tooltip"
        id={id}
        data-mega-floating=""
        className="mega-tooltip__bubble"
      >
        {content}
      </span>
    </span>
  );
}

// ----------------------------------------------------------------- Toast

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: 'neutral' | 'success' | 'danger';
  /** Milliseconds before auto-dismiss; 0 or Infinity keeps it up. Default 3000. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

type ToastRecord = ToastOptions & { id: number; leaving?: boolean };

export interface ToastHandle {
  id: number;
  dismiss: () => void;
  update: (options: Partial<ToastOptions>) => void;
}

const ToastContext = createContext<
  ((options: ToastOptions) => ToastHandle) | null
>(null);

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used inside <ToastProvider>.');
  return toast;
}

let toastId = 0;

export type ToastProviderProps = ComponentPropsWithRef<'div'>;

export function ToastProvider({
  className = '',
  children,
  ...props
}: ToastProviderProps) {
  const [items, setItems] = useState<ToastRecord[]>([]);
  const dismiss = useCallback(
    (id: number) =>
      setItems((list) =>
        list.map((item) =>
          item.id === id ? { ...item, leaving: true } : item,
        ),
      ),
    [],
  );
  const remove = useCallback(
    (id: number) => setItems((list) => list.filter((item) => item.id !== id)),
    [],
  );
  const toast = useCallback(
    (options: ToastOptions): ToastHandle => {
      const id = ++toastId;
      setItems((list) => [...list, { ...options, id }]);
      return {
        id,
        dismiss: () => dismiss(id),
        update: (next) =>
          setItems((list) =>
            list.map((item) => (item.id === id ? { ...item, ...next } : item)),
          ),
      };
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        {...props}
        className={`mega-toast-viewport ${className}`}
        aria-live="polite"
      >
        {items.map((item) => (
          <ToastItem
            key={item.id}
            toast={item}
            onDismiss={dismiss}
            onExited={remove}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
  onExited,
}: {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
  onExited: (id: number) => void;
}) {
  const { id, leaving, duration = 3000 } = toast;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(duration);
  useEffect(() => {
    remaining.current = duration;
  }, [duration]);
  useEffect(() => {
    if (
      leaving ||
      hovered ||
      focused ||
      !Number.isFinite(duration) ||
      duration <= 0
    )
      return;
    const started = Date.now();
    const timer = setTimeout(
      () => onDismiss(id),
      Math.max(0, remaining.current),
    );
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [id, duration, leaving, hovered, focused, onDismiss]);
  useEffect(() => {
    if (!leaving) return;
    // CSS may be disabled by a consumer; removal must not depend on animationend.
    const timer = setTimeout(() => onExited(id), 400);
    return () => clearTimeout(timer);
  }, [leaving, id, onExited]);

  return (
    <div
      className={`mega-toast mega-toast--${toast.tone ?? 'neutral'}`}
      data-leaving={leaving || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      onAnimationEnd={(event) => {
        if (leaving && event.target === event.currentTarget) onExited(id);
      }}
    >
      <span className="mega-toast__icon" aria-hidden="true" />
      <div className="mega-toast__content">
        <p className="mega-toast__title">{toast.title}</p>
        {toast.description ? (
          <p className="mega-toast__description">{toast.description}</p>
        ) : null}
      </div>
      {toast.action ? (
        <Button
          variant="text"
          size="sm"
          className="mega-toast__action"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(id);
          }}
        >
          {toast.action.label}
        </Button>
      ) : null}
      <IconButton
        label={`${toast.title} 알림 닫기`}
        size="sm"
        onClick={() => onDismiss(id)}
      >
        {CloseIcon}
      </IconButton>
    </div>
  );
}
