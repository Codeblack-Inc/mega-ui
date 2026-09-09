import type { ComponentPropsWithRef } from 'react';

const paths = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
  card: 'M3 5h18v14H3zM3 10h18M7 15h3',
  chart: 'M4 3v17h17M8 15l4-5 4 2 5-7',
  bag: 'M4 7h16l1 14H3zM8 7V5a4 4 0 0 1 8 0v2',
  receipt: 'M5 3h14v18l-3-2-4 2-4-2-3 2zM9 8h6M9 12h6',
  bell: 'M5 16h14l-2-3V9a5 5 0 0 0-10 0v4zM10 20h4',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  chevronLeft: 'm16 4-8 8 8 8',
  chevronRight: 'm8 4 8 8-8 8',
  heart: 'M12 21 3 12C-2 4 8 0 12 7c4-7 14-3 9 5z',
  info: 'M12 11v6M12 7v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  calendar: 'M4 5h16v16H4zM8 2v6M16 2v6M4 11h16',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0',
  users:
    'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12 5 5 9-10',
  close: 'M6 6l12 12M18 6 6 18',
  file: 'M6 2h8l5 5v15H6zM14 2v5h5M9 13h6M9 17h6',
  folder: 'M3 5h6l2 2h10v13H3z',
  chat: 'M4 4h16v12H8l-4 4z',
  star: 'm12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  truck:
    'M2 6h12v10H2zM14 10h5l3 3v3h-8zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  box: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
  clock: 'M12 7v5l3 3M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  pin: 'M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  phone:
    'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2',
  menu: 'M4 6h16M4 12h16M4 18h16',
  download: 'M12 3v12m-5-5 5 5 5-5M4 21h16',
  upload: 'M12 15V3m-5 5 5-5 5 5M4 21h16',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  sparkle:
    'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1z',
  shield: 'M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z',
  gift: 'M3 9h18v4H3zM5 13h14v8H5zM12 9v12M12 9c-2-4-6-4-6-1s4 1 6 1M12 9c2-4 6-4 6-1s-4 1-6 1',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  building:
    'M4 21V5l8-3v19M12 21V9l8 3v9M4 21h16M8 8h1M8 12h1M8 16h1M16 15h1M16 18h1',
  wallet:
    'M3 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7V5a2 2 0 0 1 2-2h12v4M16 14h5v3h-5z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  image: 'M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 5M16 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  chevron: 'm6 8 6 8 6-8',
  help: 'M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 17v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  globe:
    'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20',
} as const;

export type MegaIconName = keyof typeof paths;
export const megaIconNames = Object.keys(paths) as MegaIconName[];
export interface MegaIconProps extends Omit<
  ComponentPropsWithRef<'svg'>,
  'children'
> {
  name?: MegaIconName;
}
export function MegaIcon({
  name = 'grid',
  width = 24,
  height = 24,
  ...props
}: MegaIconProps) {
  const named = Boolean(props['aria-label'] || props['aria-labelledby']);
  return (
    <svg
      {...props}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={props.role ?? (named ? 'img' : undefined)}
      aria-hidden={props['aria-hidden'] ?? (!named || undefined)}
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
