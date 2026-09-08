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
  heart: 'M12 21 3 12C-2 4 8 0 12 7c4-7 14-3 9 5z',
  info: 'M12 11v6M12 7v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  calendar: 'M4 5h16v16H4zM8 2v6M16 2v6M4 11h16',
} as const;

export function ExampleIcon({ name = 'grid' }: { name?: keyof typeof paths }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
