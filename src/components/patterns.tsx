import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Heading, Text } from './typography';

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
      <span className="mega-result__symbol" aria-hidden="true">
        {tone === 'success' ? '✓' : tone === 'danger' ? '!' : 'i'}
      </span>
      <Heading>{title}</Heading>
      {description ? <Text tone="muted">{description}</Text> : null}
      {actions ? <div className="mega-result__actions">{actions}</div> : null}
    </div>
  );
}
