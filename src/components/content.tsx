import {
  Children,
  useId,
  useMemo,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import qrcode from 'qrcode-generator';
import { Badge, type BadgeProps } from './surfaces';
import { Button } from './controls';
export { Badge as Tag } from './surfaces';
export type { BadgeProps as TagProps } from './surfaces';
export { Stat as KPI } from './data';
export type { StatProps as KPIProps } from './data';

export type StatusProps = BadgeProps;
export function Status(props: StatusProps) {
  return <Badge role="status" {...props} />;
}
export interface DescriptionListProps extends ComponentPropsWithRef<'dl'> {
  items?: readonly { term: ReactNode; description: ReactNode }[];
}
export function DescriptionList({
  items,
  children,
  className = '',
  ...props
}: DescriptionListProps) {
  return (
    <dl className={`mega-description-list ${className}`} {...props}>
      {items
        ? items.map((item, i) => (
            <div key={i}>
              <dt>{item.term}</dt>
              <dd>{item.description}</dd>
            </div>
          ))
        : children}
    </dl>
  );
}
export type ListProps = ComponentPropsWithRef<'ul'>;
export function List({ className = '', ...props }: ListProps) {
  return <ul className={`mega-list ${className}`} {...props} />;
}
export type ListItemProps = ComponentPropsWithRef<'li'>;
export function ListItem({ className = '', ...props }: ListItemProps) {
  return <li className={`mega-list__item ${className}`} {...props} />;
}
export interface TimelineProps extends ComponentPropsWithRef<'ol'> {
  items: readonly {
    id: string;
    title: ReactNode;
    description?: ReactNode;
    dateTime?: string;
    time?: ReactNode;
  }[];
}
export function Timeline({ items, className = '', ...props }: TimelineProps) {
  return (
    <ol className={`mega-timeline ${className}`} {...props}>
      {items.map((item) => (
        <li key={item.id}>
          <div>{item.title}</div>
          {item.time && <time dateTime={item.dateTime}>{item.time}</time>}
          {item.description && <p>{item.description}</p>}
        </li>
      ))}
    </ol>
  );
}
export interface TreeNode {
  id: string;
  label: string;
  children?: readonly TreeNode[];
  disabled?: boolean;
}
export interface TreeProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'onSelect'
> {
  nodes: readonly TreeNode[];
  label: string;
  value?: string;
  onValueChange?: (id: string) => void;
}
/** Native disclosure lists keep nested content operable without a custom ARIA tree widget. */
export function Tree({
  nodes,
  label,
  value,
  onValueChange,
  className = '',
  ...props
}: TreeProps) {
  const branch = (items: readonly TreeNode[]): ReactNode => (
    <ul>
      {items.map((node) => (
        <li key={node.id}>
          {node.children?.length ? (
            <details>
              <summary
                aria-disabled={node.disabled || undefined}
                tabIndex={node.disabled ? -1 : undefined}
                onClick={(event) => {
                  if (node.disabled) event.preventDefault();
                }}
              >
                {node.label}
              </summary>
              {branch(node.children)}
            </details>
          ) : (
            <Button
              variant={value === node.id ? 'secondary' : 'ghost'}
              disabled={node.disabled}
              aria-pressed={value === node.id}
              onClick={() => onValueChange?.(node.id)}
            >
              {node.label}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
  return (
    <div
      {...props}
      role="group"
      aria-label={label}
      className={`mega-tree ${className}`}
    >
      {branch(nodes)}
    </div>
  );
}
export interface AccordionProps extends ComponentPropsWithRef<'div'> {
  items: readonly { id: string; title: ReactNode; content: ReactNode }[];
  multiple?: boolean;
  defaultValue?: string;
}
export function Accordion({
  items,
  multiple = false,
  defaultValue,
  className = '',
  ...props
}: AccordionProps) {
  const name = useId();
  const [expanded, setExpanded] = useState<string[]>(() =>
    defaultValue ? [defaultValue] : [],
  );
  return (
    <div className={`mega-accordion ${className}`} {...props}>
      {items.map((item) => (
        <details
          key={item.id}
          name={multiple ? undefined : name}
          open={expanded.includes(item.id)}
          onToggle={(event) => {
            const open = event.currentTarget.open;
            setExpanded((current) =>
              open
                ? multiple
                  ? [...new Set([...current, item.id])]
                  : [item.id]
                : current.filter((id) => id !== item.id),
            );
          }}
        >
          <summary>{item.title}</summary>
          <div>{item.content}</div>
        </details>
      ))}
    </div>
  );
}
export interface CarouselProps extends ComponentPropsWithRef<'section'> {
  label: string;
}
export function Carousel({
  label,
  children,
  className = '',
  ...props
}: CarouselProps) {
  const slides = Children.toArray(children);
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(0, slides.length - 1));
  return (
    <section
      {...props}
      aria-roledescription="carousel"
      aria-label={label}
      className={`mega-carousel ${className}`}
    >
      <div aria-live="polite">
        {slides.map((slide, i) => (
          <div
            key={i}
            hidden={current !== i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}`}
          >
            {slide}
          </div>
        ))}
      </div>
      <div className="mega-carousel__controls">
        <Button
          variant="secondary"
          disabled={current === 0}
          onClick={() => setIndex(current - 1)}
        >
          이전
        </Button>
        <span>
          {slides.length ? current + 1 : 0} / {slides.length}
        </span>
        <Button
          variant="secondary"
          disabled={current >= slides.length - 1}
          onClick={() => setIndex(current + 1)}
        >
          다음
        </Button>
      </div>
    </section>
  );
}
export type CodeProps = ComponentPropsWithRef<'code'>;
export function Code({ className = '', ...props }: CodeProps) {
  return <code className={`mega-code ${className}`} {...props} />;
}
export interface CodeBlockProps extends ComponentPropsWithRef<'pre'> {
  code: string;
  language?: string;
}
export function CodeBlock({
  code,
  language,
  className = '',
  ...props
}: CodeBlockProps) {
  return (
    <pre tabIndex={0} {...props} className={`mega-code-block ${className}`}>
      <code data-language={language}>{code}</code>
    </pre>
  );
}
export interface QRCodeProps extends Omit<
  ComponentPropsWithRef<'svg'>,
  'children'
> {
  value: string;
  label: string;
  size?: number;
  correction?: 'L' | 'M' | 'Q' | 'H';
}
export function QRCode({
  value,
  label,
  size = 160,
  correction = 'M',
  className = '',
  ...props
}: QRCodeProps) {
  const result = useMemo(() => {
    try {
      const qr = qrcode(0, correction);
      // addData captures bytes immediately; restore the library's global encoder.
      const previous = qrcode.stringToBytes;
      try {
        qrcode.stringToBytes = (text) =>
          Array.from(new TextEncoder().encode(text));
        qr.addData(value);
      } finally {
        qrcode.stringToBytes = previous;
      }
      qr.make();
      const count = qr.getModuleCount();
      let path = '';
      for (let row = 0; row < count; row++)
        for (let col = 0; col < count; col++)
          if (qr.isDark(row, col)) path += `M${col + 4} ${row + 4}h1v1h-1z`;
      return { count: count + 8, path };
    } catch {
      return null;
    }
  }, [value, correction]);
  if (!result)
    return <span role="alert">QR 코드에 담을 내용이 너무 길어요.</span>;
  return (
    <svg
      {...props}
      className={`mega-qr-code ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${result.count} ${result.count}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <path d={result.path} fill="currentColor" />
    </svg>
  );
}
