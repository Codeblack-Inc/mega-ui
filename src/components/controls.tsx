import {
  useEffect,
  useRef,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?:
    'primary' | 'weak' | 'secondary' | 'outline' | 'ghost' | 'text' | 'danger';
  /** TDS PC ladder: xs 24 · sm 28 · md 34 · lg 40, plus xl 56 for mobile CTAs. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  /** Leading / trailing icon slots (pass an inline SVG). */
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leading,
  trailing,
  disabled,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`mega-button mega-button--${variant} mega-button--${size} ${className}`}
      data-full-width={fullWidth || undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <>
          <span className="mega-spinner" aria-hidden="true" />
          <span className="mega-button__label">
            {leading}
            {children}
            {trailing}
          </span>
        </>
      ) : (
        <>
          {leading}
          {children}
          {trailing}
        </>
      )}
    </button>
  );
}

export interface IconButtonProps extends ComponentPropsWithRef<'button'> {
  /** Accessible name; the icon itself is decorative. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'filled';
  round?: boolean;
}

export function IconButton({
  label,
  size = 'md',
  variant = 'ghost',
  round = false,
  type = 'button',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      className={`mega-icon-button mega-icon-button--${size} mega-icon-button--${variant} ${round ? 'mega-icon-button--round' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export interface ChipProps extends ComponentPropsWithRef<'button'> {
  size?: 'sm' | 'md';
  variant?: 'filled' | 'outline';
  /** Toggle state. Rendered as aria-pressed for filter chips. */
  selected?: boolean;
}

export function Chip({
  size = 'md',
  variant = 'filled',
  selected,
  type = 'button',
  className = '',
  ...props
}: ChipProps) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={selected === undefined ? undefined : selected}
      className={`mega-chip mega-chip--${size} mega-chip--${variant} ${className}`}
    />
  );
}

type FieldSkin = {
  /** outline: TDS desktop text field. box: TDS mobile grey box field. */
  variant?: 'outline' | 'box';
  size?: 'sm' | 'md' | 'lg';
};
const skin = (
  base: string,
  { variant = 'outline', size = 'md' }: FieldSkin,
  className: string,
) =>
  `${base} ${variant === 'box' ? 'mega-input--box' : ''} ${size === 'md' ? '' : `mega-input--${size}`} ${className}`;

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> &
  FieldSkin;
export function Input({ className = '', variant, size, ...props }: InputProps) {
  return (
    <input
      className={skin('mega-input', { variant, size }, className)}
      {...props}
    />
  );
}

export type TextareaProps = ComponentPropsWithRef<'textarea'> & FieldSkin;
export function Textarea({
  className = '',
  variant,
  size,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={skin('mega-input mega-textarea', { variant, size }, className)}
      rows={rows}
      {...props}
    />
  );
}

export type SelectProps = Omit<ComponentPropsWithRef<'select'>, 'size'> &
  FieldSkin;
export function Select({
  className = '',
  variant,
  size,
  ...props
}: SelectProps) {
  return (
    <select
      className={skin('mega-input mega-select', { variant, size }, className)}
      {...props}
    />
  );
}

export interface CheckboxProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'children'
> {
  /** Omit to render the box alone (give the input an aria-label). */
  children?: ReactNode;
  /** Square box (form checkbox) instead of the Toss circle check (agreement lists). */
  shape?: 'circle' | 'square';
  indeterminate?: boolean;
}
export function Checkbox({
  children,
  shape = 'circle',
  indeterminate = false,
  className = '',
  ref,
  ...props
}: CheckboxProps) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      className={`mega-checkbox ${shape === 'square' ? 'mega-checkbox--square' : ''} ${className}`}
    >
      <input
        {...props}
        ref={(node) => {
          input.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        type="checkbox"
        aria-checked={indeterminate ? 'mixed' : props['aria-checked']}
      />
      {children != null ? <span>{children}</span> : null}
    </label>
  );
}

export interface RadioProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'children'
> {
  children: ReactNode;
}
export function Radio({ children, className = '', ...props }: RadioProps) {
  return (
    <label className={`mega-radio ${className}`}>
      <input {...props} type="radio" />
      <span>{children}</span>
    </label>
  );
}

export interface FieldProps extends ComponentPropsWithRef<'div'> {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

/** Connect the control's aria-describedby to `${htmlFor}-description` when hint or error is present. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className = '',
  children,
  ...props
}: FieldProps) {
  return (
    <div className={`mega-field ${className}`} {...props}>
      <label className="mega-field__label" htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error || hint ? (
        <p
          className={`mega-field__description ${error ? 'mega-field__description--error' : ''}`}
          id={`${htmlFor}-description`}
        >
          {error || hint}
        </p>
      ) : null}
    </div>
  );
}
