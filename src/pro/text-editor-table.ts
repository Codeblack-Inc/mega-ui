import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

export const TableRowHeight = Extension.create({
  name: 'tableRowHeight',
  addGlobalAttributes() {
    return [
      {
        types: ['tableRow'],
        attributes: {
          height: {
            default: null,
            parseHTML: (element) => {
              const raw = element.style.height;
              const value = /^\d+px$/.test(raw) ? Number(raw.slice(0, -2)) : 0;
              return value >= 24 && value <= 4096 ? value : null;
            },
            renderHTML: (attrs) =>
              attrs.height == null
                ? {}
                : { style: `height: ${attrs.height}px` },
          },
        },
      },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        view(view) {
          const dom = view.dom;
          const owner = dom.ownerDocument;
          let cancel: (() => void) | undefined;
          function rowAt(event: MouseEvent) {
            if (
              !view.editable ||
              view.composing ||
              !(event.target instanceof Element)
            )
              return null;
            const cell = event.target.closest('td, th');
            const row = cell?.parentElement;
            if (!row || row.tagName !== 'TR' || !dom.contains(row)) return null;
            const rect = row.getBoundingClientRect();
            const cellRect = cell!.getBoundingClientRect();
            // Leave column edges to the engine's column resize handler.
            return Math.abs(event.clientY - rect.bottom) <= 5 &&
              event.clientX < cellRect.right - 6
              ? row
              : null;
          }
          function hover(event: MouseEvent) {
            if (!cancel)
              dom.classList.toggle('row-resize-cursor', !!rowAt(event));
          }
          function leave() {
            if (!cancel) dom.classList.remove('row-resize-cursor');
          }
          function start(event: MouseEvent) {
            if (event.button !== 0) return;
            const row = rowAt(event);
            if (!row) return;
            const position = view.posAtDOM(row, 0) - 1;
            const node = view.state.doc.nodeAt(position);
            if (node?.type.name !== 'tableRow') return;
            event.preventDefault();
            event.stopPropagation();
            cancel?.();
            const document = view.state.doc;
            const startHeight = row.getBoundingClientRect().height;
            let height = Math.min(4096, Math.max(24, Math.round(startHeight)));
            function move(next: MouseEvent) {
              height = Math.min(
                4096,
                Math.max(
                  24,
                  Math.round(startHeight + next.clientY - event.clientY),
                ),
              );
              row!.classList.add('row-resizing');
              row!.style.setProperty(
                '--mega-editor-row-preview',
                `${height}px`,
              );
            }
            function cleanup() {
              row!.classList.remove('row-resizing');
              row!.style.removeProperty('--mega-editor-row-preview');
              dom.classList.remove('row-resize-cursor');
              owner.removeEventListener('mousemove', move);
              owner.removeEventListener('mouseup', end);
              owner.removeEventListener('keydown', escape);
              owner.defaultView?.removeEventListener('blur', cleanup);
              cancel = undefined;
            }
            function end() {
              cleanup();
              if (
                !view.editable ||
                view.composing ||
                view.state.doc !== document
              )
                return;
              view.dispatch(
                view.state.tr.setNodeMarkup(position, undefined, {
                  ...node!.attrs,
                  height,
                }),
              );
            }
            function escape(next: KeyboardEvent) {
              if (next.key === 'Escape') {
                next.preventDefault();
                cleanup();
              }
            }
            cancel = cleanup;
            dom.classList.add('row-resize-cursor');
            owner.addEventListener('mousemove', move);
            owner.addEventListener('mouseup', end);
            owner.addEventListener('keydown', escape);
            owner.defaultView?.addEventListener('blur', cleanup);
          }
          dom.addEventListener('mousemove', hover);
          dom.addEventListener('mouseleave', leave);
          dom.addEventListener('mousedown', start, true);
          return {
            update() {
              if (!view.editable) cancel?.();
            },
            destroy() {
              cancel?.();
              dom.removeEventListener('mousemove', hover);
              dom.removeEventListener('mouseleave', leave);
              dom.removeEventListener('mousedown', start, true);
            },
          };
        },
      }),
    ];
  },
});
