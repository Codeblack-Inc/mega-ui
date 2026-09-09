import { useLayoutEffect, type RefObject } from 'react';
import type { DataGridHandle } from 'react-data-grid';

/** Keep the engine's virtual rows, but avoid Firefox's 10,000 CSS track ceiling.
 * Large grids use a single body track; rows retain logical ARIA indices and pixel offsets.
 * This integration targets the pinned engine's public row renderer and semantic DOM.
 */
export function useGridLayout(
  ref: RefObject<DataGridHandle | null>,
  rowHeight: number,
) {
  useLayoutEffect(() => {
    const grid = ref.current?.element;
    if (!grid) return;
    const layout = () => {
      const summary = grid.querySelector(':scope > .rdg-summary-row') ? 1 : 0;
      const count = Number(grid.getAttribute('aria-rowcount')) - 1 - summary;
      if (count < 5000) {
        delete grid.dataset.large;
        return;
      }
      grid.dataset.large = 'true';
      grid.style.setProperty(
        '--mega-pro-body-height',
        `${count * rowHeight}px`,
      );
      grid.style.setProperty('--mega-pro-row-height', `${rowHeight}px`);
      grid.style.setProperty(
        '--mega-pro-summary-height',
        summary ? '40px' : '0px',
      );
      for (const row of grid.querySelectorAll<HTMLElement>(
        ':scope > [role="row"][aria-rowindex]',
      )) {
        const index = Number(row.getAttribute('aria-rowindex')) - 2;
        if (index >= 0 && !row.classList.contains('rdg-summary-row'))
          row.style.setProperty('--mega-pro-row-top', `${index * rowHeight}px`);
      }
      const active = grid.querySelector<HTMLElement>(
        '[role="gridcell"][tabindex="0"]',
      );
      const index =
        Number(active?.parentElement?.getAttribute('aria-rowindex')) - 2;
      grid.style.setProperty(
        '--mega-pro-active-top',
        `${Math.max(0, index) * rowHeight}px`,
      );
    };
    layout();
    const observer = new MutationObserver(layout);
    observer.observe(grid, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-rowindex', 'aria-rowcount', 'tabindex'],
    });
    return () => observer.disconnect();
  });
}
