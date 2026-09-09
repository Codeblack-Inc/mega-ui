import { useEffect, useState } from 'react';
import { Button, CommandPalette, MegaIcon } from '@mega-ui/react';
import { categories } from './catalog';
import { docs, examples } from './routes';

const destinations = [
  ...categories.flatMap((category) =>
    category.names.map((name) => ({
      id: `${category.key}-${name}`,
      label: name,
      description: `컴포넌트 · ${category.label}`,
      keywords: `${category.description} ${name === 'TaskBoard' ? 'Kanban 칸반 작업 보드' : ''} ${name === 'SchedulerPro' ? 'Scheduler 캘린더 달력 일정 예약 회의실 iCalendar' : ''} ${name === 'DiagramEditor' ? 'Diagram 다이어그램 플로우차트 노드 연결 순서도 워크플로' : ''} ${name === 'SpreadsheetPro' ? 'Spreadsheet 스프레드시트 엑셀 excel 수식 셀 xlsx csv 시트' : ''} ${name === 'PdfViewerPro' ? 'PDF 문서 뷰어 viewer 인쇄 양식 서명 pdfjs' : ''}`,
      href: `#components/${category.key}?to=${encodeURIComponent(name)}`,
    })),
  ),
  ...examples.map((route) => ({
    id: route.id,
    label: route.label,
    description: `화면 예제 · ${route.title}`,
    keywords: `${route.id} ${route.description}`,
    href: `#${route.id}`,
  })),
  ...docs.map((doc) => ({
    id: doc.href,
    label: doc.label,
    description: `문서 · ${doc.description}`,
    href: doc.href,
  })),
];

export function GlobalSearch({ floating = false }: { floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        event.shiftKey
      )
        return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (!open && document.querySelector('dialog[open]')) return;
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);
  return (
    <>
      <Button
        className={`docs-search-trigger${floating ? ' docs-search-trigger--floating' : ''}`}
        variant="secondary"
        size="sm"
        aria-label="글로벌 검색 열기"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="Meta+K Control+K"
        onClick={(event) => {
          event.currentTarget.focus();
          setOpen(true);
        }}
      >
        <MegaIcon name="search" width={16} height={16} />
        검색 <kbd>{mac ? '⌘ K' : 'Ctrl K'}</kbd>
      </Button>
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        label="글로벌 검색"
        description="컴포넌트·화면 예제·문서의 이름과 설명을 검색해요. ↑↓ 이동 · Enter 열기 · Esc 닫기"
        commands={destinations.map((item) => ({
          ...item,
          onSelect: () => {
            location.href = item.href;
          },
        }))}
      />
    </>
  );
}
