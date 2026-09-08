import type { ComponentPropsWithRef, CSSProperties } from 'react';

export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type DivProps = ComponentPropsWithRef<'div'>;

export interface ContainerProps extends DivProps {
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Container({
  size = 'lg',
  className = '',
  ...props
}: ContainerProps) {
  return (
    <div
      className={`mega-container mega-container--${size} ${className}`}
      {...props}
    />
  );
}

export interface StackProps extends DivProps {
  direction?: 'row' | 'column';
  gap?: Space;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
}

export function Stack({
  direction = 'column',
  gap = 4,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  style,
  ...props
}: StackProps) {
  return (
    <div
      className={`mega-stack ${className}`}
      data-direction={direction}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap || undefined}
      style={
        { '--mega-gap': `var(--mega-space-${gap})`, ...style } as CSSProperties
      }
      {...props}
    />
  );
}

export interface GridProps extends DivProps {
  minItemWidth?: number;
  gap?: Space;
}

export function Grid({
  minItemWidth = 260,
  gap = 4,
  className = '',
  style,
  ...props
}: GridProps) {
  return (
    <div
      className={`mega-grid ${className}`}
      style={
        {
          '--mega-grid-min': `${minItemWidth}px`,
          '--mega-gap': `var(--mega-space-${gap})`,
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}
