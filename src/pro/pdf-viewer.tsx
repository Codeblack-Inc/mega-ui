import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from 'react';
import { Button, Input, Select } from '../components/controls';
import { Alert } from '../components/surfaces';

export type PdfSource = string | Uint8Array | ArrayBuffer | Blob | null;
export type PdfZoom = number | 'fit-width' | 'fit-page';
export interface PdfViewerProProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  /** URL, bytes or a File. Bytes are read once; pass a stable reference. */
  source: PdfSource;
  label?: string;
  /** File name used for download, print and save. */
  name?: string;
  /** Receives the edited bytes. Without it the toolbar downloads them instead. */
  onSave?: (bytes: Uint8Array, name: string) => Promise<void>;
  /** Password for an encrypted document. The viewer also asks when one is needed. */
  password?: string;
  defaultPage?: number;
  defaultZoom?: PdfZoom;
  showTools?: boolean;
  /** Adds the annotation tools: text, drawing and stamp. Default true. */
  editable?: boolean;
  /**
   * URL of `pdfjs-dist/build/pdf.worker.min.mjs`. Without it pdf.js parses on the
   * main thread, which blocks the page on large documents.
   */
  workerSrc?: string;
}
type Pdfjs = typeof import('pdfjs-dist');
type Doc = Awaited<ReturnType<Pdfjs['getDocument']>['promise']>;
type Match = { page: number; index: number };
type AnyManager = {
  updateMode: (mode: number) => Promise<void> | void;
  updateParams: (type: number, value: unknown) => void;
  undo: () => void;
  redo: () => void;
  delete: () => void;
  destroy: () => void;
};
type AnyLayer = {
  render: (options: unknown) => void;
  update: (options: unknown) => void;
  destroy: () => void;
  setParent?: (parent: unknown) => void;
  createAndAddNewEditor?: (
    point: { x: number; y: number },
    isCentered: boolean,
    params: Record<string, unknown>,
  ) => unknown;
};
/** pdf.js only needs on/off/dispatch from the viewer's event bus. */
const createEventBus = (onState: (state: Record<string, unknown>) => void) => {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  return {
    on(name: string, listener: (payload: unknown) => void) {
      const set = listeners.get(name) ?? new Set();
      set.add(listener);
      listeners.set(name, set);
    },
    off(name: string, listener: (payload: unknown) => void) {
      listeners.get(name)?.delete(listener);
    },
    dispatch(name: string, payload: Record<string, unknown>) {
      // pdf.js reports editor availability as `editingstateschanged` with a details bag.
      if (name === 'editingstateschanged')
        onState((payload?.details as Record<string, unknown>) ?? {});
      for (const listener of listeners.get(name) ?? []) listener(payload);
    },
  };
};
const l10nStub = {
  get: async (key: string) => key,
  translate: () => undefined,
  pause: () => undefined,
  resume: () => undefined,
};
const TOOL_MODE: Record<
  'none' | 'text' | 'draw' | 'stamp',
  'NONE' | 'FREETEXT' | 'INK' | 'STAMP'
> = { none: 'NONE', text: 'FREETEXT', draw: 'INK', stamp: 'STAMP' };
const MAX_ZOOM = 4;
const MIN_ZOOM = 0.25;
/** pdf.js needs a link service; this one resolves nothing and opens nothing. */
const linkService = {
  externalLinkTarget: 2,
  externalLinkRel: 'noopener noreferrer nofollow',
  externalLinkEnabled: false,
  isInPresentationMode: false,
  getDestinationHash: () => '#',
  getAnchorUrl: () => '#',
  addLinkAttributes(link: HTMLAnchorElement, url: string) {
    link.href = url;
    link.rel = this.externalLinkRel;
    link.target = '_blank';
  },
  goToDestination: async () => undefined,
  goToPage: () => undefined,
  setHash: () => undefined,
  executeNamedAction: () => undefined,
  executeSetOCGState: async () => undefined,
  eventBus: undefined,
};

export function PdfViewerPro({
  source,
  label = 'PDF 문서',
  name = 'document.pdf',
  onSave,
  password,
  defaultPage = 1,
  defaultZoom = 'fit-width',
  showTools = true,
  editable = true,
  workerSrc,
  className = '',
  ref,
  ...props
}: PdfViewerProProps) {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current!, []);
  const engine = useRef<Pdfjs | null>(null);
  const document_ = useRef<Doc | null>(null);
  const pageText = useRef<Map<number, string>>(new Map());
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'ready' | 'password' | 'error'
  >('idle');
  const [failure, setFailure] = useState('');
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(defaultPage);
  const [zoom, setZoom] = useState<PdfZoom>(defaultZoom);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [thumbnails, setThumbnails] = useState(true);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [fields, setFields] = useState({ inputs: 0, signatures: 0 });
  const [secret, setSecret] = useState(password ?? '');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [tool, setTool] = useState<'none' | 'text' | 'draw' | 'stamp'>('none');
  const [ink, setInk] = useState('#111827');
  const [editorState, setEditorState] = useState({
    undo: false,
    redo: false,
    selected: false,
  });
  const manager = useRef<AnyManager | null>(null);
  const editorLayers = useRef(
    new Map<number, { layer: AnyLayer; draw: AnyLayer }>(),
  );
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // ---- load
  useEffect(() => {
    if (!source) {
      setStatus('idle');
      setPages(0);
      return;
    }
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
    setStatus('loading');
    setFailure('');
    (async () => {
      try {
        const pdfjs = engine.current ?? ((await import('pdfjs-dist')) as Pdfjs);
        engine.current = pdfjs;
        if (workerSrc && pdfjs.GlobalWorkerOptions.workerSrc !== workerSrc)
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        const data =
          typeof source === 'string'
            ? undefined
            : source instanceof Blob
              ? new Uint8Array(await source.arrayBuffer())
              : source instanceof Uint8Array
                ? source
                : new Uint8Array(source);
        const loading = pdfjs.getDocument({
          // pdf.js transfers the buffer to its worker, so hand it a copy and leave
          // the caller's bytes usable for a second open.
          ...(typeof source === 'string'
            ? { url: source }
            : { data: data?.slice() }),
          ...(secret ? { password: secret } : {}),
        });
        task = loading;
        const doc = await loading.promise;
        if (cancelled) return;
        document_.current = doc;
        pageText.current = new Map();
        for (const entry of editorLayers.current.values()) {
          entry.layer.destroy();
          entry.draw.destroy();
        }
        editorLayers.current.clear();
        setTool('none');
        setPages(doc.numPages);
        setPage((current) => Math.min(Math.max(current, 1), doc.numPages));
        setMatches([]);
        let inputs = 0;
        let signatures = 0;
        for (let number = 1; number <= Math.min(doc.numPages, 50); number++) {
          const annotations = await (
            await doc.getPage(number)
          ).getAnnotations();
          for (const item of annotations as {
            subtype?: string;
            fieldType?: string;
          }[]) {
            if (item.subtype !== 'Widget') continue;
            if (item.fieldType === 'Sig') signatures += 1;
            else inputs += 1;
          }
        }
        if (cancelled) return;
        setFields({ inputs, signatures });
        if (editable) {
          const bus = createEventBus((state) =>
            setEditorState({
              undo: !!state.hasSomethingToUndo,
              redo: !!state.hasSomethingToRedo,
              selected: !!state.hasSelectedEditor,
            }),
          );
          manager.current?.destroy();
          manager.current = new (
            pdfjs as unknown as {
              AnnotationEditorUIManager: new (...args: unknown[]) => AnyManager;
            }
          ).AnnotationEditorUIManager(
            scroller.current,
            scroller.current,
            null,
            null,
            null,
            null,
            bus,
            doc,
            null,
            null,
            false,
            false,
            false,
            null,
            null,
            false,
          );
        }
        setStatus('ready');
        setMessage(`${doc.numPages}쪽 문서를 열었어요.`);
      } catch (error) {
        if (cancelled) return;
        const named = error as { name?: string; message?: string };
        document_.current = null;
        if (named.name === 'PasswordException') {
          setStatus('password');
          setFailure(
            secret ? '비밀번호가 맞지 않아요. 다시 입력해 주세요.' : '',
          );
          return;
        }
        setStatus('error');
        setFailure(
          named.name === 'InvalidPDFException'
            ? '이 파일은 PDF로 열 수 없어요. 파일이 손상됐는지 확인해 주세요.'
            : '문서를 열지 못했어요. 파일과 주소를 확인해 주세요.',
        );
      }
    })();
    return () => {
      cancelled = true;
      task?.destroy().catch(() => undefined);
    };
  }, [source, secret, attempt, workerSrc, editable]);
  useEffect(
    () => () => {
      manager.current?.destroy();
      manager.current = null;
    },
    [],
  );

  // ---- render one page into its canvas and layers
  const drawPage = useCallback(
    async (number: number, host: HTMLElement) => {
      const pdfjs = engine.current;
      const doc = document_.current;
      if (!pdfjs || !doc) return;
      const proxy = await doc.getPage(number);
      const viewport = proxy.getViewport({ scale, rotation });
      const canvas = host.querySelector('canvas')!;
      const textDiv = host.querySelector<HTMLDivElement>('.mega-pdf__text')!;
      const annotationDiv = host.querySelector<HTMLDivElement>(
        '.mega-pdf__annotations',
      )!;
      const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
      host.style.width = `${Math.floor(viewport.width)}px`;
      host.style.height = `${Math.floor(viewport.height)}px`;
      // pdf.js layers and editors size themselves from these two custom properties.
      host.style.setProperty('--scale-factor', String(scale));
      host.style.setProperty('--total-scale-factor', String(scale));
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const context = canvas.getContext('2d')!;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      await proxy.render({
        canvas,
        canvasContext: context,
        viewport,
        // ENABLE_FORMS keeps widgets and editor annotations out of the canvas so the
        // HTML layers own them; otherwise every edit is painted twice.
        annotationMode: pdfjs.AnnotationMode.ENABLE_FORMS,
      }).promise;
      const content = await proxy.getTextContent();
      pageText.current.set(
        number,
        content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join('')
          .toLocaleLowerCase(),
      );
      textDiv.replaceChildren();
      pdfjs.setLayerDimensions(textDiv, viewport);
      await new pdfjs.TextLayer({
        textContentSource: content,
        container: textDiv,
        viewport,
      }).render();
      annotationDiv.replaceChildren();
      pdfjs.setLayerDimensions(annotationDiv, viewport);
      const annotations = await proxy.getAnnotations();
      if (annotations.length) {
        const layer = new pdfjs.AnnotationLayer({
          div: annotationDiv,
          page: proxy,
          viewport: viewport.clone({ dontFlip: true }),
          annotationStorage: doc.annotationStorage,
          linkService: linkService as never,
          structTreeLayer: null as never,
          accessibilityManager: null as never,
          annotationCanvasMap: null as never,
          annotationEditorUIManager: null as never,
          commentManager: null as never,
        });
        await layer.render({
          annotations,
          viewport: viewport.clone({ dontFlip: true }),
          div: annotationDiv,
          page: proxy,
          linkService: linkService as never,
          annotationStorage: doc.annotationStorage,
          renderForms: true,
          imageResourcesPath: '',
        });
      }
      const editorDiv =
        host.querySelector<HTMLDivElement>('.mega-pdf__editors');
      if (editorDiv && manager.current) {
        pdfjs.setLayerDimensions(editorDiv, viewport);
        const existing = editorLayers.current.get(number);
        if (existing) existing.layer.update({ viewport });
        else {
          const draw = new (
            pdfjs as unknown as {
              DrawLayer: new (options: unknown) => AnyLayer;
            }
          ).DrawLayer({ pageIndex: number - 1 });
          draw.setParent?.(editorDiv);
          const layer = new (
            pdfjs as unknown as {
              AnnotationEditorLayer: new (options: unknown) => AnyLayer;
            }
          ).AnnotationEditorLayer({
            uiManager: manager.current,
            pageIndex: number - 1,
            div: editorDiv,
            structTreeLayer: null,
            accessibilityManager: null,
            annotationLayer: null,
            drawLayer: draw,
            textLayer: null,
            viewport,
            l10n: l10nStub,
          });
          layer.render({ viewport });
          editorLayers.current.set(number, { layer, draw });
        }
      }
      host.dataset.rendered = String(number);
    },
    [rotation, scale],
  );

  // ---- render the pages near the viewport, and every thumbnail once
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      // Round so a scrollbar appearing cannot start a resize/redraw feedback loop.
      const width = Math.round(element.clientWidth / 8) * 8;
      const height = Math.round(element.clientHeight / 8) * 8;
      setBox((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [status]);
  useEffect(() => {
    const doc = document_.current;
    if (!doc || status !== 'ready' || typeof zoom === 'number') {
      if (typeof zoom === 'number') setScale(zoom);
      return;
    }
    let cancelled = false;
    (async () => {
      const proxy = await doc.getPage(Math.min(page, doc.numPages));
      const base = proxy.getViewport({ scale: 1, rotation });
      const width = Math.max(160, (box.width || 800) - 48);
      const height = Math.max(160, (box.height || 800) - 48);
      const next =
        zoom === 'fit-page'
          ? Math.min(width / base.width, height / base.height)
          : width / base.width;
      if (!cancelled)
        setScale(
          Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next * 100) / 100)),
        );
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // The page number only picks which size to fit, so it is deliberately not a dependency.
  }, [zoom, rotation, status, box.width, box.height]);
  const pageHosts = useRef(new Map<number, HTMLElement>());
  const drawing = useRef(new Set<number>());
  const version = `${scale}|${rotation}|${status}|${pages}`;
  const renderVisible = useCallback(() => {
    const box = scroller.current;
    if (!box || status !== 'ready') return;
    for (const [number, host] of pageHosts.current) {
      const top = host.offsetTop - box.scrollTop;
      const near =
        top < box.clientHeight * 2 &&
        top + host.offsetHeight > -box.clientHeight;
      const key = `${number}|${version}`;
      if (!near || host.dataset.version === key || drawing.current.has(number))
        continue;
      host.dataset.version = key;
      drawing.current.add(number);
      drawPage(number, host)
        .catch((error: unknown) => {
          // Keep the version marked so a failing page is not redrawn in a loop.
          host.dataset.failed = '';
          setFailure(
            `${number}쪽을 그리지 못했어요. 다른 쪽은 계속 볼 수 있어요.`,
          );
          console.warn('[PdfViewerPro]', error);
        })
        .finally(() => drawing.current.delete(number));
    }
  }, [drawPage, status, version]);
  useEffect(() => {
    for (const host of pageHosts.current.values()) host.dataset.version = '';
    renderVisible();
  }, [renderVisible]);
  const thumbHosts = useRef(new Map<number, HTMLCanvasElement>());
  useEffect(() => {
    if (status !== 'ready' || !thumbnails) return;
    let cancelled = false;
    (async () => {
      const doc = document_.current;
      if (!doc) return;
      for (const [number, canvas] of [...thumbHosts.current]) {
        if (cancelled) return;
        if (canvas.dataset.rendered === String(rotation)) continue;
        const proxy = await doc.getPage(number);
        const viewport = proxy.getViewport({ scale: 1, rotation });
        const width = 96;
        const view = proxy.getViewport({
          scale: width / viewport.width,
          rotation,
        });
        canvas.width = Math.floor(view.width);
        canvas.height = Math.floor(view.height);
        const context = canvas.getContext('2d');
        if (!context) continue;
        await proxy.render({ canvas, canvasContext: context, viewport: view })
          .promise;
        canvas.dataset.rendered = String(rotation);
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [status, thumbnails, rotation, pages]);

  const goTo = (number: number) => {
    const target = Math.min(Math.max(number, 1), Math.max(pages, 1));
    setPage(target);
    const host = pageHosts.current.get(target);
    const box = scroller.current;
    if (host && box) box.scrollTo({ top: host.offsetTop - 12 });
  };
  const search = async (next: string) => {
    setQuery(next);
    const doc = document_.current;
    const term = next.trim().toLocaleLowerCase();
    if (!doc || term.length < 1) {
      setMatches([]);
      setMatchIndex(0);
      return;
    }
    setSearching(true);
    const found: Match[] = [];
    for (let number = 1; number <= doc.numPages; number++) {
      let text = pageText.current.get(number);
      if (text === undefined) {
        const content = await (await doc.getPage(number)).getTextContent();
        text = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join('')
          .toLocaleLowerCase();
        pageText.current.set(number, text);
      }
      let at = text.indexOf(term);
      while (at >= 0 && found.length < 500) {
        found.push({ page: number, index: at });
        at = text.indexOf(term, at + term.length);
      }
    }
    if (!alive.current) return;
    setSearching(false);
    setMatches(found);
    setMatchIndex(0);
    setMessage(
      found.length ? `${found.length}건을 찾았어요.` : '찾는 낱말이 없어요.',
    );
    if (found[0]) goTo(found[0].page);
  };
  const step = (delta: number) => {
    if (!matches.length) return;
    const next = (matchIndex + delta + matches.length) % matches.length;
    setMatchIndex(next);
    goTo(matches[next]!.page);
  };
  const bytes = async () => {
    const doc = document_.current;
    if (!doc) return null;
    // saveDocument keeps filled form values; getData returns the file as opened.
    return doc.saveDocument();
  };
  const download = (data: Uint8Array, fileName: string) => {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(
        new Blob([data as unknown as BlobPart], { type: 'application/pdf' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.append(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
    } catch {
      setFailure('파일을 만들지 못했어요. 다시 내려받아 주세요.');
    } finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url!), 1000);
    }
  };
  const print = async () => {
    const data = await bytes();
    if (!data) return;
    const url = URL.createObjectURL(
      new Blob([data as unknown as BlobPart], { type: 'application/pdf' }),
    );
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.inset = '0 auto auto 0';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.opacity = '0';
    frame.src = url;
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        setFailure('인쇄를 시작하지 못했어요. 파일을 내려받아 인쇄해 주세요.');
      }
      setTimeout(() => {
        frame.remove();
        URL.revokeObjectURL(url);
      }, 60_000);
    };
    document.body.append(frame);
    setMessage('인쇄 창을 열었어요.');
  };
  const useTool = async (next: 'none' | 'text' | 'draw' | 'stamp') => {
    const pdfjs = engine.current;
    if (!pdfjs || !manager.current) return;
    const mode = (
      pdfjs.AnnotationEditorType as unknown as Record<string, number>
    )[TOOL_MODE[next]];
    setTool(next);
    await manager.current.updateMode(mode ?? 0);
    setMessage(
      next === 'none'
        ? '주석 도구를 껐어요.'
        : next === 'text'
          ? '문서를 눌러 글자를 넣어요.'
          : next === 'draw'
            ? '문서에 끌어서 서명이나 그림을 그려요.'
            : '문서를 누르면 이미지를 고를 수 있어요.',
    );
  };
  const addStamp = async (file: File) => {
    const pdfjs = engine.current;
    const entry = editorLayers.current.get(page);
    if (!pdfjs || !manager.current || !entry?.layer.createAndAddNewEditor) {
      setFailure('도장을 넣지 못했어요. 문서를 다시 연 뒤 시도해 주세요.');
      return;
    }
    const modes = pdfjs.AnnotationEditorType as unknown as Record<
      string,
      number
    >;
    await manager.current.updateMode(modes.STAMP ?? 0);
    setTool('stamp');
    entry.layer.createAndAddNewEditor({ x: 0, y: 0 }, true, {
      bitmapFile: file,
    });
    setMessage('도장을 넣었어요. 끌어서 옮기고 모서리를 잡아 크기를 바꿔요.');
  };
  const useColor = (value: string) => {
    const pdfjs = engine.current;
    setInk(value);
    if (!pdfjs || !manager.current) return;
    const params = pdfjs.AnnotationEditorParamsType as unknown as Record<
      string,
      number
    >;
    manager.current.updateParams(
      tool === 'text' ? params.FREETEXT_COLOR! : params.INK_COLOR!,
      value,
    );
  };
  const zoomTo = (next: PdfZoom) => {
    setZoom(
      typeof next === 'number'
        ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next * 100) / 100))
        : next,
    );
  };
  const pageList = Array.from({ length: pages }, (_unused, index) => index + 1);
  const highlightPage = matches[matchIndex]?.page;

  return (
    <div
      {...props}
      ref={root}
      className={`mega-pdf ${className}`}
      role="region"
      aria-label={label}
      aria-busy={status === 'loading' || saving}
    >
      {showTools && (
        <div className="mega-pdf__toolbar">
          <div className="mega-pdf__group">
            <Button
              size="sm"
              variant="secondary"
              aria-label="이전 쪽"
              disabled={status !== 'ready' || page <= 1}
              onClick={() => goTo(page - 1)}
            >
              이전
            </Button>
            <label className="mega-pdf__page">
              <Input
                size="sm"
                type="number"
                aria-label="쪽 번호"
                min={1}
                max={Math.max(pages, 1)}
                value={pages ? page : ''}
                disabled={status !== 'ready'}
                onChange={(event) =>
                  event.target.value && goTo(Number(event.target.value))
                }
              />
              <span>/ {pages || '-'}</span>
            </label>
            <Button
              size="sm"
              variant="secondary"
              aria-label="다음 쪽"
              disabled={status !== 'ready' || page >= pages}
              onClick={() => goTo(page + 1)}
            >
              다음
            </Button>
          </div>
          <div className="mega-pdf__group">
            <Button
              size="sm"
              variant="secondary"
              aria-label="축소"
              disabled={status !== 'ready'}
              onClick={() => zoomTo(scale / 1.25)}
            >
              −
            </Button>
            <Select
              size="sm"
              aria-label="확대 비율"
              value={typeof zoom === 'number' ? 'custom' : zoom}
              disabled={status !== 'ready'}
              onChange={(event) => {
                const next = event.target.value;
                zoomTo(next === 'custom' ? scale : (next as PdfZoom));
              }}
            >
              <option value="fit-width">폭 맞춤</option>
              <option value="fit-page">쪽 맞춤</option>
              <option value="custom">{Math.round(scale * 100)}%</option>
            </Select>
            <Button
              size="sm"
              variant="secondary"
              aria-label="확대"
              disabled={status !== 'ready'}
              onClick={() => zoomTo(scale * 1.25)}
            >
              +
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={status !== 'ready'}
              onClick={() => setRotation((current) => (current + 90) % 360)}
            >
              회전
            </Button>
          </div>
          <div className="mega-pdf__group mega-pdf__search">
            <Input
              size="sm"
              type="search"
              aria-label="문서 검색"
              placeholder="문서 검색"
              value={query}
              disabled={status !== 'ready'}
              onChange={(event) => search(event.target.value)}
            />
            <span role="status">
              {searching
                ? '찾는 중'
                : query && matches.length
                  ? `${matchIndex + 1}/${matches.length}`
                  : query
                    ? '결과 없음'
                    : ''}
            </span>
            <Button
              size="sm"
              variant="secondary"
              aria-label="이전 결과"
              disabled={!matches.length}
              onClick={() => step(-1)}
            >
              ‹
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label="다음 결과"
              disabled={!matches.length}
              onClick={() => step(1)}
            >
              ›
            </Button>
          </div>
          {editable && (
            <div
              className="mega-pdf__group mega-pdf__tools"
              role="group"
              aria-label="주석 도구"
            >
              {(
                [
                  ['none', '선택'],
                  ['text', '글자 넣기'],
                  ['draw', '서명·그리기'],
                ] as const
              ).map(([value, text]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={tool === value ? 'weak' : 'secondary'}
                  aria-pressed={tool === value}
                  disabled={status !== 'ready'}
                  onClick={() => useTool(value)}
                >
                  {text}
                </Button>
              ))}
              <label className="mega-pdf__file mega-button mega-button--secondary mega-button--sm">
                도장 넣기
                <input
                  aria-label="도장 이미지 고르기"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={status !== 'ready'}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) addStamp(file);
                  }}
                />
              </label>
              <label>
                <Select
                  size="sm"
                  aria-label="주석 색"
                  value={ink}
                  disabled={
                    status !== 'ready' || tool === 'none' || tool === 'stamp'
                  }
                  onChange={(event) => useColor(event.target.value)}
                >
                  <option value="#111827">검정</option>
                  <option value="#d32f2f">빨강</option>
                  <option value="#1565c0">파랑</option>
                </Select>
              </label>
              <Button
                size="sm"
                variant="secondary"
                disabled={!editorState.selected}
                onClick={() => manager.current?.delete()}
              >
                주석 삭제
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!editorState.undo}
                onClick={() => manager.current?.undo()}
              >
                실행 취소
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!editorState.redo}
                onClick={() => manager.current?.redo()}
              >
                다시 실행
              </Button>
            </div>
          )}
          <div className="mega-pdf__group">
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={thumbnails}
              onClick={() => setThumbnails((current) => !current)}
            >
              {thumbnails ? '썸네일 숨기기' : '썸네일 보기'}
            </Button>
            {onSave && (
              <Button
                size="sm"
                variant="weak"
                disabled={status !== 'ready' || saving}
                onClick={async () => {
                  if (saving) return;
                  setSaving(true);
                  setFailure('');
                  try {
                    const data = await bytes();
                    if (data) await onSave(data, name);
                    if (alive.current) setMessage('문서를 저장했어요.');
                  } catch {
                    if (alive.current)
                      setFailure(
                        '문서를 저장하지 못했어요. 입력한 내용은 화면에 남아 있어요. 다시 저장해 주세요.',
                      );
                  } finally {
                    if (alive.current) setSaving(false);
                  }
                }}
              >
                {saving ? '저장 중' : '문서 저장'}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={status !== 'ready'}
              onClick={async () => {
                const data = await bytes();
                if (data) download(data, name);
              }}
            >
              내려받기
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={status !== 'ready'}
              onClick={print}
            >
              인쇄
            </Button>
          </div>
        </div>
      )}
      {status === 'ready' && (fields.inputs > 0 || fields.signatures > 0) && (
        <p className="mega-pdf__fields">
          입력 칸 {fields.inputs}개 · 서명 칸 {fields.signatures}개. 입력한 값은
          문서 저장에 포함해요. 서명 칸은 위치만 표시하고 서명을 검증하지
          않아요.
        </p>
      )}
      {failure && (
        <Alert role="alert" tone={status === 'error' ? 'danger' : 'warning'}>
          {failure}
        </Alert>
      )}
      {status === 'password' && (
        <form
          className="mega-pdf__password"
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get('password');
            setSecret(String(value ?? ''));
            setAttempt((current) => current + 1);
          }}
        >
          <label>
            문서 비밀번호
            <Input
              name="password"
              type="password"
              aria-label="문서 비밀번호"
              autoFocus
            />
          </label>
          <Button type="submit">문서 열기</Button>
        </form>
      )}
      <div className="mega-pdf__body" data-thumbnails={thumbnails || undefined}>
        {thumbnails && status === 'ready' && (
          <ol className="mega-pdf__thumbnails" aria-label="쪽 미리보기">
            {pageList.map((number) => (
              <li key={number}>
                <button
                  type="button"
                  aria-label={`${number}쪽으로 이동`}
                  aria-current={number === page || undefined}
                  onClick={() => goTo(number)}
                >
                  <canvas
                    ref={(node) => {
                      if (node) thumbHosts.current.set(number, node);
                      else thumbHosts.current.delete(number);
                    }}
                  />
                  <span>{number}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
        <div
          className="mega-pdf__pages"
          ref={scroller}
          onScroll={() => {
            renderVisible();
            const box = scroller.current;
            if (!box) return;
            let closest = page;
            let best = Infinity;
            for (const [number, host] of pageHosts.current) {
              const distance = Math.abs(host.offsetTop - box.scrollTop - 12);
              if (distance < best) {
                best = distance;
                closest = number;
              }
            }
            if (closest !== page) setPage(closest);
          }}
        >
          {status === 'loading' && <p role="status">문서를 불러오고 있어요.</p>}
          {status === 'idle' && <p>표시할 문서가 없어요.</p>}
          {status === 'ready' &&
            pageList.map((number) => (
              <div
                key={number}
                className="mega-pdf__page-box"
                data-page={number}
                data-match={number === highlightPage || undefined}
                aria-label={`${number}쪽`}
                ref={(node) => {
                  if (node) pageHosts.current.set(number, node);
                  else pageHosts.current.delete(number);
                }}
              >
                <canvas />
                <div className="mega-pdf__text" />
                <div className="mega-pdf__annotations" />
                {editable && (
                  <div className="mega-pdf__editors annotationEditorLayer" />
                )}
              </div>
            ))}
        </div>
      </div>
      <p className="mega-visually-hidden" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
