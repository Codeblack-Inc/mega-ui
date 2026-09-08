import type { ComponentPropsWithRef, ReactNode } from 'react';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: 'primary' | 'weak' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
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
      {loading ? <span className="mega-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export type InputProps = ComponentPropsWithRef<'input'>;
export function Input({ className = '', ...props }: InputProps) {
  return <input className={`mega-input ${className}`} {...props} />;
}

export type TextareaProps = ComponentPropsWithRef<'textarea'>;
export function Textarea({
  className = '',
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={`mega-input mega-textarea ${className}`}
      rows={rows}
      {...props}
    />
  );
}

export type SelectProps = ComponentPropsWithRef<'select'>;
export function Select({ className = '', ...props }: SelectProps) {
  return (
    <select className={`mega-input mega-select ${className}`} {...props} />
  );
}

export interface CheckboxProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'children'
> {
  children: ReactNode;
}
export function Checkbox({
  children,
  className = '',
  ...props
}: CheckboxProps) {
  return (
    <label className={`mega-checkbox ${className}`}>
      <input {...props} type="checkbox" />
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
