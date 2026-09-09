import { useLayoutEffect, type RefObject } from 'react';

export function useFloating(
  root: RefObject<HTMLElement | null>,
  open: boolean,
  align: 'start' | 'center' | 'end' = 'start',
  side: 'auto' | 'top' | 'bottom' = 'auto',
) {
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = (root.current?.querySelector(
        '[data-mega-floating-anchor]',
      ) ?? root.current?.firstElementChild) as HTMLElement | null;
      const popup = root.current?.querySelector<HTMLElement>(
        '[data-mega-floating]',
      );
      if (!trigger || !popup) return;
      const anchor = trigger.getBoundingClientRect();
      if (popup.hasAttribute('data-mega-match-anchor'))
        popup.style.width = `${anchor.width}px`;
      const box = popup.getBoundingClientRect();
      const gap = 8;
      const preferredLeft =
        align === 'end'
          ? anchor.right - box.width
          : align === 'center'
            ? anchor.left + (anchor.width - box.width) / 2
            : anchor.left;
      const left = Math.max(
        gap,
        Math.min(innerWidth - box.width - gap, preferredLeft),
      );
      const below = anchor.bottom + gap;
      const above = anchor.top - box.height - gap;
      const top =
        side === 'top'
          ? above >= gap
            ? above
            : below
          : side === 'bottom'
            ? below + box.height <= innerHeight
              ? below
              : Math.max(gap, above)
            : below + box.height <= innerHeight
              ? below
              : Math.max(gap, above);
      Object.assign(popup.style, {
        position: 'fixed',
        left: `${left}px`,
        right: 'auto',
        top: `${top}px`,
        bottom: 'auto',
        transform: 'none',
      });
    };
    place();
    const observer = new ResizeObserver(place);
    const popup = root.current?.querySelector<HTMLElement>(
      '[data-mega-floating]',
    );
    if (popup) observer.observe(popup);
    addEventListener('resize', place);
    addEventListener('scroll', place, true);
    return () => {
      observer.disconnect();
      removeEventListener('resize', place);
      removeEventListener('scroll', place, true);
    };
  }, [align, open, root, side]);
}
