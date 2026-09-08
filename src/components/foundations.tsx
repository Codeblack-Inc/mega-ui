import {
  createContext,
  useContext,
  useEffect,
  useState,
  useId,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Stack, type StackProps } from './layout';
export { Text as Typography } from './typography';
export type { TextProps as TypographyProps } from './typography';
export { Separator as Divider, Card as Surface } from './surfaces';
export type {
  SeparatorProps as DividerProps,
  CardProps as SurfaceProps,
} from './surfaces';

export type BoxProps = ComponentPropsWithRef<'div'>;
export function Box({ className = '', ...props }: BoxProps) {
  return <div className={`mega-box ${className}`} {...props} />;
}
export type VisuallyHiddenProps = ComponentPropsWithRef<'span'>;
export function VisuallyHidden({
  className = '',
  ...props
}: VisuallyHiddenProps) {
  return <span className={`mega-visually-hidden ${className}`} {...props} />;
}
export type FocusRingProps = BoxProps;
export function FocusRing({ className = '', ...props }: FocusRingProps) {
  return <div className={`mega-focus-ring ${className}`} {...props} />;
}
export interface IconProps extends ComponentPropsWithRef<'svg'> {
  size?: 16 | 20 | 24 | 32;
  label?: string;
}
export function Icon({ size = 24, label, children, ...props }: IconProps) {
  const accessibleLabel = label ?? props['aria-label'];
  const named = Boolean(accessibleLabel || props['aria-labelledby']);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      {...props}
      role={props.role ?? (named ? 'img' : undefined)}
      aria-label={accessibleLabel}
      aria-hidden={props['aria-hidden'] ?? (!named || undefined)}
      focusable="false"
    >
      {children}
    </svg>
  );
}
export interface ColorProps extends ComponentPropsWithRef<'span'> {
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'text' | 'surface';
  label: string;
}
export function Color({
  tone = 'brand',
  label,
  className = '',
  ...props
}: ColorProps) {
  return (
    <span
      {...props}
      className={`mega-color mega-color--${tone} ${className}`}
      role="img"
      aria-label={label}
    />
  );
}
type Theme = 'light' | 'dark';
const ThemeContext = createContext<Theme>('light');
export interface ThemeProviderProps extends BoxProps {
  theme?: Theme;
}
export function ThemeProvider({
  theme = 'light',
  className = '',
  ...props
}: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme}>
      <div
        {...props}
        className={`mega-theme ${className}`}
        data-mega-theme={theme}
      />
    </ThemeContext.Provider>
  );
}
export interface PortalProps {
  children: ReactNode;
  container?: Element | DocumentFragment | null;
}
export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);
  const theme = useContext(ThemeContext);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted
    ? createPortal(
        <div data-mega-theme={theme}>{children}</div>,
        container ?? document.body,
      )
    : null;
}
export type HStackProps = Omit<StackProps, 'direction'>;
export function HStack(props: HStackProps) {
  return <Stack {...props} direction="row" />;
}
export type VStackProps = Omit<StackProps, 'direction'>;
export function VStack(props: VStackProps) {
  return <Stack {...props} direction="column" />;
}
export type FlexProps = StackProps;
export function Flex({ direction = 'row', ...props }: FlexProps) {
  return <Stack {...props} direction={direction} />;
}
export interface GridItemProps extends BoxProps {
  column?: CSSProperties['gridColumn'];
  row?: CSSProperties['gridRow'];
}
export function GridItem({ column, row, style, ...props }: GridItemProps) {
  return (
    <Box {...props} style={{ gridColumn: column, gridRow: row, ...style }} />
  );
}
export type CenterProps = BoxProps;
export function Center({ className = '', ...props }: CenterProps) {
  return <Box className={`mega-center ${className}`} {...props} />;
}
export type SpacerProps = BoxProps;
export function Spacer({ style, ...props }: SpacerProps) {
  return (
    <Box aria-hidden="true" {...props} style={{ flex: '1 1 0%', ...style }} />
  );
}
export interface AspectRatioProps extends BoxProps {
  ratio?: number;
}
export function AspectRatio({
  ratio = 16 / 9,
  style,
  ...props
}: AspectRatioProps) {
  return (
    <Box
      {...props}
      style={{
        aspectRatio: Number.isFinite(ratio) && ratio > 0 ? ratio : 1,
        ...style,
      }}
    />
  );
}
export interface ScrollAreaProps extends BoxProps {
  label: string;
  maxHeight?: CSSProperties['maxHeight'];
}
export function ScrollArea({
  label,
  maxHeight = 320,
  className = '',
  style,
  ...props
}: ScrollAreaProps) {
  return (
    <Box
      tabIndex={0}
      role="region"
      aria-label={label}
      {...props}
      className={`mega-scroll-area ${className}`}
      style={{ maxHeight, ...style }}
    />
  );
}
export interface ResizablePanelProps extends BoxProps {
  label: string;
  direction?: 'horizontal' | 'vertical' | 'both';
}
export function ResizablePanel({
  label,
  direction = 'horizontal',
  className = '',
  style,
  onKeyDown,
  ...props
}: ResizablePanelProps) {
  return (
    <Box
      {...props}
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`mega-resizable-panel ${className}`}
      style={{ resize: direction, ...style }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.target !== event.currentTarget)
          return;
        const panel = event.currentTarget;
        if (
          direction !== 'vertical' &&
          ['ArrowLeft', 'ArrowRight'].includes(event.key)
        ) {
          event.preventDefault();
          panel.style.width = `${Math.max(120, panel.offsetWidth + (event.key === 'ArrowRight' ? 16 : -16))}px`;
        }
        if (
          direction !== 'horizontal' &&
          ['ArrowUp', 'ArrowDown'].includes(event.key)
        ) {
          event.preventDefault();
          panel.style.height = `${Math.max(80, panel.offsetHeight + (event.key === 'ArrowDown' ? 16 : -16))}px`;
        }
      }}
    />
  );
}
export interface SplitPaneProps extends Omit<BoxProps, 'children'> {
  first: ReactNode;
  second: ReactNode;
  label: string;
  defaultSize?: number;
  min?: number;
  max?: number;
}
export function SplitPane({
  first,
  second,
  label,
  defaultSize = 50,
  min = 15,
  max = 85,
  className = '',
  ...props
}: SplitPaneProps) {
  const lower = Math.max(0, Math.min(100, Number.isFinite(min) ? min : 15));
  const upper = Math.max(lower, Math.min(100, Number.isFinite(max) ? max : 85));
  const [size, setSize] = useState(defaultSize);
  const bounded = Math.max(
    lower,
    Math.min(upper, Number.isFinite(size) ? size : 50),
  );
  const id = useId();
  return (
    <Box {...props} className={`mega-split-pane ${className}`}>
      <label className="mega-split-pane__control">
        {label}
        <input
          aria-controls={`${id}-first ${id}-second`}
          type="range"
          min={lower}
          max={upper}
          value={bounded}
          onChange={(e) => setSize(e.currentTarget.valueAsNumber)}
        />
      </label>
      <div
        className="mega-split-pane__panels"
        style={{
          gridTemplateColumns: `minmax(0, ${bounded}fr) minmax(0, ${100 - bounded}fr)`,
        }}
      >
        <div id={`${id}-first`}>{first}</div>
        <div id={`${id}-second`}>{second}</div>
      </div>
    </Box>
  );
}
export interface AppShellProps extends BoxProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
}
export function AppShell({
  header,
  sidebar,
  footer,
  children,
  className = '',
  ...props
}: AppShellProps) {
  return (
    <Box {...props} className={`mega-app-shell ${className}`}>
      {header && <header>{header}</header>}
      <div className="mega-app-shell__body">
        {sidebar && <aside>{sidebar}</aside>}
        <div className="mega-app-shell__content">{children}</div>
      </div>
      {footer && <footer>{footer}</footer>}
    </Box>
  );
}
export interface PageLayoutProps extends ComponentPropsWithRef<'section'> {
  header?: ReactNode;
  footer?: ReactNode;
}
export function PageLayout({
  header,
  footer,
  children,
  className = '',
  ...props
}: PageLayoutProps) {
  return (
    <section className={`mega-page-layout ${className}`} {...props}>
      {header}
      {children}
      {footer}
    </section>
  );
}
