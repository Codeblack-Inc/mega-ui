import type { ComponentPropsWithRef } from 'react';

export interface HeadingProps extends ComponentPropsWithRef<'h2'> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Heading({
  level = 2,
  size = 'md',
  className = '',
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return (
    <Tag
      className={`mega-heading mega-heading--${size} ${className}`}
      {...props}
    />
  );
}

export type TextProps = ComponentPropsWithRef<'p'> & {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'muted';
};

export function Text({
  size = 'md',
  tone = 'default',
  className = '',
  ...props
}: TextProps) {
  return (
    <p
      className={`mega-text mega-text--${size} mega-text--${tone} ${className}`}
      {...props}
    />
  );
}
