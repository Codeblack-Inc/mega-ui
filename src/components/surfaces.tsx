import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Heading, Text, type HeadingProps } from './typography';
import { Stack } from './layout';

export interface CardProps extends ComponentPropsWithRef<'div'> {
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'elevated' | 'filled' | 'outlined';
}
export function Card({
  padding = 'md',
  variant = 'elevated',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`mega-card mega-card--${padding} mega-card--${variant} ${className}`}
      {...props}
    />
  );
}

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  tone?:
    'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'teal' | 'purple';
  /** weak: tinted (default). solid: filled. dot: small round counter like the red "N". */
  variant?: 'weak' | 'solid' | 'dot';
}
export function Badge({
  tone = 'neutral',
  variant = 'weak',
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`mega-badge mega-badge--${tone} ${variant === 'weak' ? '' : `mega-badge--${variant}`} ${variant === 'dot' ? 'mega-badge--solid' : ''} ${className}`}
      {...props}
    />
  );
}

export interface AlertProps extends ComponentPropsWithRef<'div'> {
  tone?: 'info' | 'neutral' | 'success' | 'warning' | 'danger';
  /** Optional leading icon (inline SVG). */
  icon?: ReactNode;
}
export function Alert({
  tone = 'info',
  icon,
  className = '',
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role="status"
      className={`mega-alert mega-alert--${tone} ${className}`}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <div>{children}</div>
    </div>
  );
}

export interface SeparatorProps extends ComponentPropsWithRef<'hr'> {
  /** thick: 12px section gap in the page background. vertical: inline divider. */
  variant?: 'line' | 'thick' | 'vertical';
}
export function Separator({
  variant = 'line',
  className = '',
  ...props
}: SeparatorProps) {
  return (
    <hr
      className={`mega-separator ${variant === 'line' ? '' : `mega-separator--${variant}`} ${className}`}
      aria-orientation={variant === 'vertical' ? 'vertical' : undefined}
      {...props}
    />
  );
}

export interface PageHeaderProps extends Omit<
  ComponentPropsWithRef<'header'>,
  'title'
> {
  title: string;
  headingLevel?: HeadingProps['level'];
  description?: string;
  actions?: ReactNode;
}
export function PageHeader({
  title,
  headingLevel = 1,
  description,
  actions,
  className = '',
  ...props
}: PageHeaderProps) {
  return (
    <header className={`mega-page-header ${className}`} {...props}>
      <Stack gap={2}>
        <Heading level={headingLevel} size="xl">
          {title}
        </Heading>
        {description ? <Text tone="muted">{description}</Text> : null}
      </Stack>
      {actions ? (
        <Stack direction="row" gap={2} align="center" wrap>
          {actions}
        </Stack>
      ) : null}
    </header>
  );
}
