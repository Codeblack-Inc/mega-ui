import type { ComponentPropsWithRef } from 'react';

export interface HeadingProps extends ComponentPropsWithRef<'h2'> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** TDS title roles: sm 17 · md 20 · lg 22 · xl 26 · 2xl 30 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
  /** TDS body roles: xs 13 · sm 14 · md 15 · lg 17 */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'default' | 'secondary' | 'muted' | 'brand' | 'danger' | 'success';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /** Tabular figures for amounts and tables. */
  numeric?: boolean;
  /** Render as an inline span instead of a paragraph. */
  as?: 'p' | 'span' | 'div';
};

export function Text({
  size = 'md',
  tone = 'default',
  weight = 'regular',
  numeric = false,
  as: Tag = 'p',
  className = '',
  ...props
}: TextProps) {
  return (
    <Tag
      className={`mega-text mega-text--${size} mega-text--${tone} ${className}`}
      data-weight={weight === 'regular' ? undefined : weight}
      data-numeric={numeric || undefined}
      {...props}
    />
  );
}
