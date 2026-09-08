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
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
}
export function Badge({
  tone = 'neutral',
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`mega-badge mega-badge--${tone} ${className}`}
      {...props}
    />
  );
}

export interface AlertProps extends ComponentPropsWithRef<'div'> {
  tone?: 'info' | 'success' | 'warning' | 'danger';
}
export function Alert({ tone = 'info', className = '', ...props }: AlertProps) {
  return (
    <div
      role="status"
      className={`mega-alert mega-alert--${tone} ${className}`}
      {...props}
    />
  );
}

export type SeparatorProps = ComponentPropsWithRef<'hr'>;
export function Separator({ className = '', ...props }: SeparatorProps) {
  return <hr className={`mega-separator ${className}`} {...props} />;
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
