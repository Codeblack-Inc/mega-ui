import {
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button, Input, Select, Textarea } from './controls';
import { Alert } from './surfaces';
import { Dialog } from './overlay';
import {
  DIAGRAM_MAX_NODES,
  diagramBounds,
  diagramConnectionError,
  diagramEdgePath,
  diagramPortPoint,
  layoutDiagram,
  parseDiagram,
  serializeDiagram,
  updateDiagram,
  validateDiagram,
  defaultDiagramPorts,
  type DiagramAction,
  type DiagramData,
  type DiagramEdge,
  type DiagramInput,
  type DiagramNode,
  type DiagramPort,
} from './diagram-model';

export interface DiagramNodeType {
  type: string;
  title: string;
  width?: number;
  height?: number;
  ports?: readonly DiagramPort[];
}
export interface DiagramEditorProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'onChange'
> {
  value: DiagramInput;
  onChange?: (
    value: DiagramData,
    action: DiagramAction | { type: 'replace' },
  ) => void;
  onSave?: (value: DiagramData) => Promise<void>;
  label?: string;
  editable?: boolean;
  showTools?: boolean;
  /** Snap step in diagram units. 0 turns snapping off. Default 16. */
  grid?: number;
  /** Palette for the add button. Default: one plain node. */
  nodeTypes?: readonly DiagramNodeType[];
}
type View = { x: number; y: number; zoom: number };
type Drag =
  | {
      kind: 'nodes';
      pointer: number;
      x: number;
      y: number;
      startX: number;
      startY: number;
      origin: Map<string, { x: number; y: number }>;
      moved: boolean;
    }
  | { kind: 'pan'; pointer: number; x: number; y: number; view: View }
  | {
      kind: 'marquee';
      pointer: number;
      x: number;
      y: number;
      startX: number;
      startY: number;
      additive: boolean;
    }
  | {
      kind: 'connect';
      pointer: number;
      x: number;
      y: number;
      node: string;
      port: string;
    };
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;
const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : '다이어그램 데이터 형식을 확인해 주세요.';
/** Rough advance width so a label can be cut before it leaves its node. */
const fitLabel = (value: string, width: number, size: number) => {
  let used = 0;
  let index = 0;
  for (const char of value) {
    used += /[ᄀ-퟿＀-￯]/.test(char) ? size : size * 0.55;
    if (used > width) break;
    index += char.length;
  }
  return index >= value.length
    ? value
    : `${value.slice(0, Math.max(1, index - 1))}…`;
};
const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function DiagramEditor({
  value,
  onChange,
  onSave,
  label = '다이어그램',
  editable = true,
  showTools = true,
  grid = 16,
  nodeTypes,
  className = '',
  ref,
  ...props
}: DiagramEditorProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<SVGSVGElement>(null);
  useImperativeHandle(ref, () => root.current!, []);
  const id = useId();
  const valid = useMemo(() => {
    try {
      return { data: validateDiagram(value), error: '' };
    } catch {
      return { data: null, error: '다이어그램 데이터 형식을 확인해 주세요.' };
    }
  }, [value]);
  const data = valid.data;
  const serialized = data ? JSON.stringify(data) : '';
  const [view, setView] = useState<View>({ x: 40, y: 40, zoom: 1 });
  const [selection, setSelection] = useState<string[]>([]);
  const [saved, setSaved] = useState(serialized);
  const [savedOnce, setSavedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ undo: string[]; redo: string[] }>({
    undo: [],
    redo: [],
  });
  const [removing, setRemoving] = useState<string[] | null>(null);
  const [imported, setImported] = useState<DiagramData | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [, setTick] = useState(0);
  const drag = useRef<Drag | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<Drag['kind'] | null>(null);
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      drag.current = null;
    };
  }, []);
  const writable = !!onChange;
  const canEdit = writable && editable;
  const dirty = serialized !== saved;
  const snap = (position: number) =>
    grid > 0 ? Math.round(position / grid) * grid : Math.round(position);
  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];
  const palette: readonly DiagramNodeType[] = nodeTypes?.length
    ? nodeTypes
    : [{ type: '', title: '새 노드' }];
  const selectedNodes = nodes.filter((node) =>
    selection.includes(`node:${node.id}`),
  );
  const selectedEdge =
    selection.length === 1 && selection[0]?.startsWith('edge:')
      ? edges.find((edge) => `edge:${edge.id}` === selection[0])
      : undefined;
  const singleNode = selectedNodes.length === 1 ? selectedNodes[0] : undefined;

  const replace = (
    next: DiagramData,
    action: DiagramAction | { type: 'replace' },
    announcement: string,
    remember = true,
  ) => {
    if (!onChange) return false;
    try {
      onChange(next, action);
    } catch {
      setError('다이어그램을 변경하지 못했어요. 다시 시도해 주세요.');
      return false;
    }
    if (remember)
      setHistory((old) => ({
        undo: [...old.undo, serialized].slice(-50),
        redo: [],
      }));
    setError('');
    setMessage(announcement);
    return true;
  };
  const change = (action: DiagramAction, announcement: string) => {
    let next: DiagramData;
    try {
      next = updateDiagram(latest.current, action);
    } catch (failure) {
      setError(errorText(failure));
      setMessage('다이어그램을 변경하지 않았어요.');
      return false;
    }
    if (JSON.stringify(next) === serialized) {
      setError('');
      setMessage('변경 사항이 없어요.');
      return true;
    }
    return replace(next, action, announcement);
  };
  const travel = (direction: 'undo' | 'redo') => {
    const previous = history[direction].at(-1);
    if (!previous) return;
    if (
      replace(
        parseDiagram(previous),
        { type: 'replace' },
        direction === 'undo'
          ? '이전 변경을 되돌렸어요.'
          : '변경을 다시 적용했어요.',
        false,
      )
    )
      setHistory((old) =>
        direction === 'undo'
          ? { undo: old.undo.slice(0, -1), redo: [...old.redo, serialized] }
          : { undo: [...old.undo, serialized], redo: old.redo.slice(0, -1) },
      );
  };

  const toDiagram = (clientX: number, clientY: number) => {
    const rect = canvas.current?.getBoundingClientRect();
    return {
      x: (clientX - (rect?.left ?? 0) - view.x) / view.zoom,
      y: (clientY - (rect?.top ?? 0) - view.y) / view.zoom,
    };
  };
  const zoomTo = (zoom: number, clientX?: number, clientY?: number) => {
    setView((old) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
      const rect = canvas.current?.getBoundingClientRect();
      const px =
        clientX === undefined
          ? (rect?.width ?? 0) / 2
          : clientX - (rect?.left ?? 0);
      const py =
        clientY === undefined
          ? (rect?.height ?? 0) / 2
          : clientY - (rect?.top ?? 0);
      return {
        zoom: next,
        x: px - ((px - old.x) / old.zoom) * next,
        y: py - ((py - old.y) / old.zoom) * next,
      };
    });
  };
  const fitted = useRef(false);
  const fit = (announce = true) => {
    const rect = canvas.current?.getBoundingClientRect();
    const bounds = diagramBounds(nodes);
    if (!rect || !bounds.width || !bounds.height) {
      setView({ x: 40, y: 40, zoom: 1 });
      return;
    }
    const zoom = Math.min(
      MAX_ZOOM,
      Math.max(
        MIN_ZOOM,
        Math.min(
          (rect.width - 64) / bounds.width,
          (rect.height - 64) / bounds.height,
        ),
      ),
    );
    setView({
      zoom,
      x: rect.width / 2 - (bounds.x + bounds.width / 2) * zoom,
      y: rect.height / 2 - (bounds.y + bounds.height / 2) * zoom,
    });
    if (announce) setMessage('다이어그램 전체를 화면에 맞췄어요.');
  };
  // A diagram wider than the stage opens zoomed out instead of cropped.
  useEffect(() => {
    if (fitted.current || !nodes.length) return;
    fitted.current = true;
    const rect = canvas.current?.getBoundingClientRect();
    const bounds = diagramBounds(nodes);
    if (
      rect &&
      (bounds.width > rect.width - 64 || bounds.height > rect.height - 64)
    )
      fit(false);
  }, [nodes.length]);

  const select = (key: string, additive: boolean) =>
    setSelection((old) =>
      additive
        ? old.includes(key)
          ? old.filter((item) => item !== key)
          : [...old, key]
        : [key],
    );
  const addNode = (type: DiagramNodeType) => {
    if (!data) return;
    if (data.nodes.length >= DIAGRAM_MAX_NODES) {
      setError(`노드는 ${DIAGRAM_MAX_NODES}개까지 만들 수 있어요.`);
      return;
    }
    const rect = canvas.current?.getBoundingClientRect();
    const center = toDiagram(
      (rect?.left ?? 0) + (rect?.width ?? 400) / 2,
      (rect?.top ?? 0) + (rect?.height ?? 300) / 2,
    );
    const width = type.width ?? 168;
    const height = type.height ?? 64;
    const node: DiagramNode = {
      id: newId('node'),
      title: type.title,
      ...(type.type ? { type: type.type } : {}),
      x: snap(center.x - width / 2),
      y: snap(center.y - height / 2),
      width,
      height,
      ports: type.ports
        ? type.ports.map((port) => ({ ...port }))
        : defaultDiagramPorts(),
    };
    if (
      change({ type: 'put-node', node }, `${node.title} 노드를 추가했어요.`)
    ) {
      setSelection([`node:${node.id}`]);
      requestAnimationFrame(() =>
        root.current
          ?.querySelector<SVGGElement>(
            `[data-node-id="${CSS.escape(node.id)}"]`,
          )
          ?.focus(),
      );
    }
  };
  const moveSelection = (dx: number, dy: number) => {
    if (!canEdit || !selectedNodes.length) return;
    change(
      {
        type: 'place-nodes',
        positions: selectedNodes.map((node) => ({
          id: node.id,
          x: node.x + dx,
          y: node.y + dy,
        })),
      },
      `선택한 노드 ${selectedNodes.length}개를 옮겼어요.`,
    );
  };
  const removeSelection = (keys: string[]) => {
    if (!data || !keys.length) return;
    let next: DiagramData = data;
    try {
      for (const key of keys)
        next = updateDiagram(
          next,
          key.startsWith('node:')
            ? { type: 'delete-node', id: key.slice(5) }
            : { type: 'delete-edge', id: key.slice(5) },
        );
    } catch (failure) {
      setError(errorText(failure));
      return;
    }
    if (
      replace(
        next,
        { type: 'replace' },
        `${keys.length}개 항목을 삭제했어요. 실행 취소로 되돌릴 수 있어요.`,
      )
    )
      setSelection([]);
  };
  const requestRemove = (keys: string[]) => {
    if (!canEdit || !keys.length) return;
    const attached = keys
      .filter((key) => key.startsWith('node:'))
      .some((key) =>
        edges.some(
          (edge) =>
            edge.fromNode === key.slice(5) || edge.toNode === key.slice(5),
        ),
      );
    if (attached) setRemoving(keys);
    else removeSelection(keys);
  };
  const autoLayout = () => {
    if (!data) return;
    try {
      change(
        { type: 'place-nodes', positions: layoutDiagram(data) },
        '노드를 단계별로 다시 배치했어요.',
      );
    } catch (failure) {
      setError(errorText(failure));
    }
  };

  const startNodeDrag = (event: ReactPointerEvent, node: DiagramNode) => {
    if (!canEdit || event.button !== 0) return;
    const key = `node:${node.id}`;
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    const keys =
      selection.includes(key) && !additive
        ? selection
        : additive
          ? [...new Set([...selection, key])]
          : [key];
    setSelection(keys);
    const point = toDiagram(event.clientX, event.clientY);
    drag.current = {
      kind: 'nodes',
      pointer: event.pointerId,
      x: point.x,
      y: point.y,
      startX: point.x,
      startY: point.y,
      origin: new Map(
        nodes
          .filter((item) => keys.includes(`node:${item.id}`))
          .map((item) => [item.id, { x: item.x, y: item.y }]),
      ),
      moved: false,
    };
    setDragging('nodes');
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  };
  const startConnect = (
    event: ReactPointerEvent,
    node: DiagramNode,
    port: DiagramPort,
  ) => {
    if (!canEdit || event.button !== 0 || port.direction !== 'out') return;
    event.stopPropagation();
    const point = toDiagram(event.clientX, event.clientY);
    drag.current = {
      kind: 'connect',
      pointer: event.pointerId,
      x: point.x,
      y: point.y,
      node: node.id,
      port: port.id,
    };
    setDragging('connect');
    setMessage('연결할 입력 포트로 끌어 주세요. Escape로 취소할 수 있어요.');
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  };
  const startCanvasDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (drag.current) return;
    const target = event.target as Element;
    if (target.closest('[data-node-id],[data-edge-id]')) return;
    const point = toDiagram(event.clientX, event.clientY);
    if (event.button === 1 || event.altKey || !canEdit) {
      drag.current = {
        kind: 'pan',
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        view,
      };
      setDragging('pan');
    } else if (event.button === 0) {
      const additive = event.shiftKey || event.metaKey || event.ctrlKey;
      if (!additive) setSelection([]);
      drag.current = {
        kind: 'marquee',
        pointer: event.pointerId,
        x: point.x,
        y: point.y,
        startX: point.x,
        startY: point.y,
        additive,
      };
      setDragging('marquee');
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const finishDrag = (cancel: boolean) => {
    const current = drag.current;
    drag.current = null;
    setDragging(null);
    if (!current) return;
    if (current.kind === 'nodes' && !cancel && current.moved) {
      const dx = snap(current.x - current.startX);
      const dy = snap(current.y - current.startY);
      if (dx || dy)
        change(
          {
            type: 'place-nodes',
            positions: [...current.origin].map(([nodeId, origin]) => ({
              id: nodeId,
              x: snap(origin.x + dx),
              y: snap(origin.y + dy),
            })),
          },
          `노드 ${current.origin.size}개를 옮겼어요.`,
        );
    }
    if (current.kind === 'marquee' && !cancel) {
      const left = Math.min(current.startX, current.x);
      const right = Math.max(current.startX, current.x);
      const top = Math.min(current.startY, current.y);
      const bottom = Math.max(current.startY, current.y);
      if (right - left > 4 || bottom - top > 4) {
        const hit = nodes
          .filter(
            (node) =>
              node.x < right &&
              node.x + node.width > left &&
              node.y < bottom &&
              node.y + node.height > top,
          )
          .map((node) => `node:${node.id}`);
        setSelection((old) =>
          current.additive ? [...new Set([...old, ...hit])] : hit,
        );
        setMessage(`${hit.length}개 노드를 선택했어요.`);
      }
    }
    if (current.kind === 'connect') {
      if (cancel || !data) {
        setMessage('연결을 취소했어요.');
        return;
      }
      const target = document
        .elementFromPoint(lastPointer.current.x, lastPointer.current.y)
        ?.closest<Element>('[data-node-id]');
      const nodeId = target?.getAttribute('data-node-id') ?? '';
      const node = nodes.find((item) => item.id === nodeId);
      if (!node) {
        setMessage('연결할 노드 위에서 놓아 주세요.');
        return;
      }
      const portId =
        document
          .elementFromPoint(lastPointer.current.x, lastPointer.current.y)
          ?.closest<Element>('[data-port-id]')
          ?.getAttribute('data-port-id') ??
        node.ports.find((port) => port.direction === 'in')?.id ??
        '';
      const failure = diagramConnectionError(
        data,
        { node: current.node, port: current.port },
        { node: node.id, port: portId },
      );
      if (failure) {
        setMessage(failure);
        setError(failure);
        return;
      }
      const edge: DiagramEdge = {
        id: newId('edge'),
        fromNode: current.node,
        fromPort: current.port,
        toNode: node.id,
        toPort: portId,
      };
      if (
        change({ type: 'put-edge', edge }, `${node.title} 노드로 연결했어요.`)
      )
        setSelection([`edge:${edge.id}`]);
    }
  };
  // Wheel needs a non-passive listener so pinch-zoom does not scroll the page.
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey)
        zoomTo(
          view.zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1),
          event.clientX,
          event.clientY,
        );
      else
        setView((old) => ({
          ...old,
          x: old.x - event.deltaX,
          y: old.y - event.deltaY,
        }));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [view.zoom]);
  useEffect(() => {
    if (!dragging) return;
    const cancel = () => finishDrag(true);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }
    };
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', keydown, true);
    return () => {
      window.removeEventListener('blur', cancel);
      window.removeEventListener('keydown', keydown, true);
    };
  }, [dragging]);

  const dragDelta =
    drag.current?.kind === 'nodes'
      ? {
          x: snap(drag.current.x - drag.current.startX),
          y: snap(drag.current.y - drag.current.startY),
        }
      : { x: 0, y: 0 };
  const nodeAt = (node: DiagramNode) =>
    drag.current?.kind === 'nodes' && drag.current.origin.has(node.id)
      ? {
          ...node,
          x: snap(
            (drag.current.origin.get(node.id)?.x ?? node.x) + dragDelta.x,
          ),
          y: snap(
            (drag.current.origin.get(node.id)?.y ?? node.y) + dragDelta.y,
          ),
        }
      : node;
  const exportSvg = () => {
    const source = canvas.current;
    if (!source || !data) return;
    const bounds = diagramBounds(nodes);
    const padding = 24;
    const clone = source.cloneNode(true) as SVGSVGElement;
    clone
      .querySelectorAll('[data-export-hide]')
      .forEach((item) => item.remove());
    // The file has no stylesheet, so carry the resolved colours over.
    const live = source.querySelectorAll<Element>('*');
    clone.querySelectorAll<Element>('*').forEach((item, index) => {
      const origin = live[index];
      if (!origin) return;
      const style = getComputedStyle(origin);
      const rules = [
        'fill',
        'stroke',
        'stroke-width',
        'stroke-dasharray',
        'font-size',
        'font-family',
        'font-weight',
        'opacity',
      ]
        .map((name) => `${name}:${style.getPropertyValue(name)}`)
        .join(';');
      item.setAttribute('style', rules);
      item.removeAttribute('class');
    });
    const world = clone.querySelector<SVGGElement>('[data-world]');
    world?.setAttribute('transform', '');
    clone.setAttribute(
      'viewBox',
      `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`,
    );
    clone.setAttribute('width', String(Math.round(bounds.width + padding * 2)));
    clone.setAttribute(
      'height',
      String(Math.round(bounds.height + padding * 2)),
    );
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    download(
      new Blob([clone.outerHTML], { type: 'image/svg+xml' }),
      'diagram.svg',
    );
  };
  const download = (blob: Blob, name: string) => {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.append(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
    } catch {
      setError('파일을 만들지 못했어요. 다시 내려받아 주세요.');
    } finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url!), 1000);
    }
  };

  const placedNodes = nodes.map(nodeAt);
  const placedById = new Map(placedNodes.map((node) => [node.id, node]));
  const port = (nodeId: string, portId: string) => {
    const node = placedById.get(nodeId);
    return node ? diagramPortPoint(node, portId) : null;
  };
  const bounds = diagramBounds(placedNodes);
  const minimap = {
    x: bounds.x - 40,
    y: bounds.y - 40,
    width: Math.max(bounds.width + 80, 200),
    height: Math.max(bounds.height + 80, 140),
  };
  const stage = canvas.current?.getBoundingClientRect();
  const viewport = {
    x: -view.x / view.zoom,
    y: -view.y / view.zoom,
    width: (stage?.width ?? 600) / view.zoom,
    height: (stage?.height ?? 400) / view.zoom,
  };
  const [draft, setDraft] = useState<{
    key: string;
    title: string;
    type: string;
    notes: string;
    labelText: string;
  }>({
    key: '',
    title: '',
    type: '',
    notes: '',
    labelText: '',
  });
  const inspected = singleNode
    ? `node:${singleNode.id}`
    : selectedEdge
      ? `edge:${selectedEdge.id}`
      : '';
  useEffect(() => {
    setDraft({
      key: inspected,
      title: singleNode?.title ?? '',
      type: singleNode?.type ?? '',
      notes: singleNode?.notes ?? '',
      labelText: selectedEdge?.label ?? '',
    });
  }, [
    inspected,
    singleNode?.title,
    singleNode?.type,
    singleNode?.notes,
    selectedEdge?.label,
  ]);
  const commitNode = (patch: Partial<DiagramNode>) => {
    if (!singleNode) return;
    const next = { ...singleNode, ...patch };
    if (!next.title.trim()) {
      setError('노드 이름을 입력해 주세요.');
      return;
    }
    change(
      { type: 'put-node', node: next },
      `${next.title} 노드를 편집했어요.`,
    );
  };
  const commitEdge = (patch: Partial<DiagramEdge>) => {
    if (!selectedEdge) return;
    change(
      { type: 'put-edge', edge: { ...selectedEdge, ...patch } },
      '연결을 편집했어요.',
    );
  };
  const title = (nodeId: string) =>
    nodes.find((node) => node.id === nodeId)?.title ?? nodeId;

  return (
    <div
      {...props}
      ref={root}
      className={`mega-diagram ${className}`}
      role="region"
      aria-label={label}
      aria-busy={saving}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented || event.nativeEvent.isComposing) return;
        const inField =
          event.target instanceof HTMLElement &&
          event.target.closest('input,textarea,select,[contenteditable=true]');
        if (inField) return;
        if (event.key === 'Escape') {
          if (drag.current) finishDrag(true);
          else setSelection([]);
          return;
        }
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'z'
        ) {
          event.preventDefault();
          if (canEdit) travel(event.shiftKey ? 'redo' : 'undo');
          return;
        }
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'a'
        ) {
          event.preventDefault();
          setSelection(nodes.map((node) => `node:${node.id}`));
          setMessage(`${nodes.length}개 노드를 선택했어요.`);
          return;
        }
        if (event.key === 'Delete' || event.key === 'Backspace') {
          if (!selection.length) return;
          event.preventDefault();
          requestRemove(selection);
          return;
        }
        if (event.key.startsWith('Arrow')) {
          const step = event.shiftKey ? 1 : grid || 1;
          const dx =
            event.key === 'ArrowLeft'
              ? -step
              : event.key === 'ArrowRight'
                ? step
                : 0;
          const dy =
            event.key === 'ArrowUp'
              ? -step
              : event.key === 'ArrowDown'
                ? step
                : 0;
          event.preventDefault();
          if (selectedNodes.length && canEdit) moveSelection(dx, dy);
          else
            setView((old) => ({
              ...old,
              x: old.x - dx * 4,
              y: old.y - dy * 4,
            }));
        }
      }}
      onPointerMove={(event) => {
        props.onPointerMove?.(event);
        lastPointer.current = { x: event.clientX, y: event.clientY };
        const current = drag.current;
        if (!current || current.pointer !== event.pointerId) return;
        if (current.kind === 'pan') {
          setView({
            zoom: current.view.zoom,
            x: current.view.x + (event.clientX - current.x),
            y: current.view.y + (event.clientY - current.y),
          });
          return;
        }
        const point = toDiagram(event.clientX, event.clientY);
        current.x = point.x;
        current.y = point.y;
        if (current.kind === 'nodes') current.moved = true;
        setTick((count) => count + 1);
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event);
        lastPointer.current = { x: event.clientX, y: event.clientY };
        if (drag.current?.pointer === event.pointerId) finishDrag(false);
      }}
      onPointerCancel={(event) => {
        props.onPointerCancel?.(event);
        if (drag.current?.pointer === event.pointerId) finishDrag(true);
      }}
    >
      {valid.error ? (
        <Alert role="alert" tone="danger">
          {valid.error}
        </Alert>
      ) : (
        data && (
          <>
            {showTools && (
              <div className="mega-diagram__toolbar">
                <div>
                  <h2>{label}</h2>
                  <p>
                    노드 {nodes.length}개 · 연결 {edges.length}개
                    {selection.length ? ` · 선택 ${selection.length}개` : ''}
                  </p>
                </div>
                <div className="mega-diagram__actions">
                  {canEdit && (
                    <>
                      {palette.map((item) => (
                        <Button
                          key={item.type || item.title}
                          onClick={() => addNode(item)}
                          variant={
                            item === palette[0] ? 'primary' : 'secondary'
                          }
                        >
                          {item.title} 추가
                        </Button>
                      ))}
                      <Button variant="secondary" onClick={autoLayout}>
                        자동 배치
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!history.undo.length || saving}
                        onClick={() => travel('undo')}
                      >
                        실행 취소
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!history.redo.length || saving}
                        onClick={() => travel('redo')}
                      >
                        다시 실행
                      </Button>
                    </>
                  )}
                  {onSave && (
                    <div
                      className="mega-diagram__save"
                      data-dirty={dirty || undefined}
                    >
                      <span>
                        {dirty
                          ? '저장하지 않은 변경'
                          : savedOnce
                            ? '저장한 상태'
                            : '변경 없음'}
                      </span>
                      <Button
                        variant="ghost"
                        disabled={!dirty || saving || !saved}
                        onClick={() => setRestoring(true)}
                      >
                        {savedOnce
                          ? '저장한 상태로 되돌리기'
                          : '처음 상태로 되돌리기'}
                      </Button>
                      <Button
                        variant="weak"
                        disabled={(!dirty && savedOnce) || saving}
                        onClick={async () => {
                          if (busy.current) return;
                          busy.current = true;
                          setSaving(true);
                          setError('');
                          try {
                            const snapshot = validateDiagram(latest.current);
                            await onSave(snapshot);
                            if (alive.current) {
                              setSaved(JSON.stringify(snapshot));
                              setSavedOnce(true);
                              setMessage('다이어그램을 저장했어요.');
                            }
                          } catch {
                            if (alive.current)
                              setError(
                                '다이어그램을 저장하지 못했어요. 변경 내용은 화면에 남아 있어요. 다시 저장해 주세요.',
                              );
                          } finally {
                            busy.current = false;
                            if (alive.current) setSaving(false);
                          }
                        }}
                      >
                        {saving ? '저장 중' : '다이어그램 저장'}
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() =>
                      download(
                        new Blob([serializeDiagram(data)], {
                          type: 'application/json',
                        }),
                        'diagram.json',
                      )
                    }
                  >
                    JSON 내려받기
                  </Button>
                  <Button variant="ghost" onClick={exportSvg}>
                    SVG 내려받기
                  </Button>
                  {canEdit && (
                    <label className="mega-diagram__file mega-button mega-button--ghost mega-button--md">
                      JSON 불러오기
                      <input
                        aria-label="다이어그램 파일 불러오기"
                        type="file"
                        accept=".json,application/json"
                        disabled={saving}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (!file) return;
                          try {
                            if (file.size > 8_000_000)
                              throw new Error(
                                '파일은 8MB 이내로 불러와 주세요.',
                              );
                            setImported(parseDiagram(await file.text()));
                            setError('');
                          } catch {
                            setError(
                              '다이어그램 파일을 불러오지 못했어요. 파일 형식과 크기를 확인해 주세요.',
                            );
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
            {error && (
              <Alert role="alert" tone="danger">
                {error}
              </Alert>
            )}
            <div className="mega-diagram__stage">
              <svg
                ref={canvas}
                className="mega-diagram__canvas"
                role="application"
                aria-label={`${label} 캔버스`}
                data-dragging={dragging ?? undefined}
                onPointerDown={startCanvasDrag}
              >
                <defs>
                  <marker
                    id={`${id}-arrow`}
                    markerWidth="10"
                    markerHeight="8"
                    refX="9"
                    refY="4"
                    orient="auto"
                  >
                    <path
                      className="mega-diagram__arrow"
                      d="M 0 0 L 9 4 L 0 8 z"
                    />
                  </marker>
                  <pattern
                    id={`${id}-grid`}
                    width={Math.max(grid, 8) * view.zoom}
                    height={Math.max(grid, 8) * view.zoom}
                    patternUnits="userSpaceOnUse"
                    x={view.x}
                    y={view.y}
                  >
                    <circle className="mega-diagram__dot" cx="1" cy="1" r="1" />
                  </pattern>
                </defs>
                <rect
                  data-export-hide=""
                  className="mega-diagram__grid"
                  width="100%"
                  height="100%"
                  fill={`url(#${id}-grid)`}
                />
                <g
                  data-world=""
                  transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}
                >
                  {edges.map((edge) => {
                    const from = port(edge.fromNode, edge.fromPort);
                    const to = port(edge.toNode, edge.toPort);
                    if (!from || !to) return null;
                    const path = diagramEdgePath(from, to, edge.shape);
                    const selected = selection.includes(`edge:${edge.id}`);
                    return (
                      <g
                        key={edge.id}
                        className="mega-diagram__edge"
                        data-edge-id={edge.id}
                        data-selected={selected || undefined}
                        tabIndex={0}
                        role="button"
                        aria-label={`${title(edge.fromNode)}에서 ${title(edge.toNode)}로 가는 연결${edge.label ? `, ${edge.label}` : ''}`}
                        aria-describedby={`${id}-help`}
                        onClick={(event) =>
                          select(
                            `edge:${edge.id}`,
                            event.shiftKey || event.metaKey || event.ctrlKey,
                          )
                        }
                        onFocus={() =>
                          setSelection((old) =>
                            old.includes(`edge:${edge.id}`)
                              ? old
                              : [`edge:${edge.id}`],
                          )
                        }
                      >
                        <path
                          className="mega-diagram__edge-hit"
                          d={path}
                          data-export-hide=""
                        />
                        <path
                          className="mega-diagram__edge-line"
                          d={path}
                          markerEnd={`url(#${id}-arrow)`}
                        />
                        {edge.label && (
                          <text
                            className="mega-diagram__edge-label"
                            x={(from.x + to.x) / 2}
                            y={(from.y + to.y) / 2 - 6}
                            textAnchor="middle"
                          >
                            {edge.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {placedNodes.map((node) => {
                    const selected = selection.includes(`node:${node.id}`);
                    return (
                      <g
                        key={node.id}
                        className="mega-diagram__node"
                        data-node-id={node.id}
                        data-node-type={node.type || undefined}
                        data-selected={selected || undefined}
                        tabIndex={0}
                        role="button"
                        aria-label={`${node.title} 노드${node.type ? `, ${node.type}` : ''}`}
                        aria-describedby={`${id}-help`}
                        transform={`translate(${node.x} ${node.y})`}
                        onPointerDown={(event) => startNodeDrag(event, node)}
                        onClick={(event) =>
                          select(
                            `node:${node.id}`,
                            event.shiftKey || event.metaKey || event.ctrlKey,
                          )
                        }
                        onFocus={() =>
                          setSelection((old) =>
                            old.includes(`node:${node.id}`)
                              ? old
                              : [`node:${node.id}`],
                          )
                        }
                      >
                        <rect
                          className="mega-diagram__box"
                          width={node.width}
                          height={node.height}
                          rx={10}
                        />
                        <text
                          className="mega-diagram__node-title"
                          x={14}
                          y={node.height / 2 + (node.type ? -2 : 5)}
                        >
                          {fitLabel(node.title, node.width - 28, 14)}
                        </text>
                        {node.type && (
                          <text
                            className="mega-diagram__node-type"
                            x={14}
                            y={node.height / 2 + 16}
                          >
                            {fitLabel(node.type, node.width - 28, 11)}
                          </text>
                        )}
                        <title>
                          {node.notes
                            ? `${node.title} · ${node.notes}`
                            : node.title}
                        </title>
                        {node.ports.map((item) => {
                          const point = diagramPortPoint(node, item.id);
                          if (!point) return null;
                          return (
                            <circle
                              key={item.id}
                              className="mega-diagram__port"
                              data-port-id={item.id}
                              data-direction={item.direction}
                              cx={point.x - node.x}
                              cy={point.y - node.y}
                              r={5}
                              onPointerDown={(event) =>
                                startConnect(event, node, item)
                              }
                            >
                              <title>{item.title}</title>
                            </circle>
                          );
                        })}
                      </g>
                    );
                  })}
                  {drag.current?.kind === 'connect' &&
                    (() => {
                      const from = port(drag.current.node, drag.current.port);
                      if (!from) return null;
                      return (
                        <path
                          data-export-hide=""
                          className="mega-diagram__preview"
                          d={diagramEdgePath(from, {
                            x: drag.current.x,
                            y: drag.current.y,
                            nx: -from.nx,
                            ny: -from.ny,
                          })}
                        />
                      );
                    })()}
                  {drag.current?.kind === 'marquee' && (
                    <rect
                      data-export-hide=""
                      className="mega-diagram__marquee"
                      x={Math.min(drag.current.startX, drag.current.x)}
                      y={Math.min(drag.current.startY, drag.current.y)}
                      width={Math.abs(drag.current.x - drag.current.startX)}
                      height={Math.abs(drag.current.y - drag.current.startY)}
                    />
                  )}
                </g>
              </svg>
              <div className="mega-diagram__zoom">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="축소"
                  onClick={() => zoomTo(view.zoom / 1.2)}
                >
                  −
                </Button>
                <span>{Math.round(view.zoom * 100)}%</span>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="확대"
                  onClick={() => zoomTo(view.zoom * 1.2)}
                >
                  +
                </Button>
                <Button size="sm" variant="secondary" onClick={() => fit()}>
                  전체 맞추기
                </Button>
              </div>
              <svg
                className="mega-diagram__minimap"
                viewBox={`${minimap.x} ${minimap.y} ${minimap.width} ${minimap.height}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="미니맵"
                onPointerDown={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const scale = Math.min(
                    rect.width / minimap.width,
                    rect.height / minimap.height,
                  );
                  const offsetX = (rect.width - minimap.width * scale) / 2;
                  const offsetY = (rect.height - minimap.height * scale) / 2;
                  const x =
                    (event.clientX - rect.left - offsetX) / scale + minimap.x;
                  const y =
                    (event.clientY - rect.top - offsetY) / scale + minimap.y;
                  setView((old) => ({
                    ...old,
                    x: (stage?.width ?? 600) / 2 - x * old.zoom,
                    y: (stage?.height ?? 400) / 2 - y * old.zoom,
                  }));
                  setMessage('미니맵에서 위치를 옮겼어요.');
                }}
              >
                {placedNodes.map((node) => (
                  <rect
                    key={node.id}
                    className="mega-diagram__minimap-node"
                    data-selected={
                      selection.includes(`node:${node.id}`) || undefined
                    }
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx={4}
                  />
                ))}
                <rect
                  className="mega-diagram__minimap-view"
                  x={viewport.x}
                  y={viewport.y}
                  width={viewport.width}
                  height={viewport.height}
                />
              </svg>
            </div>
            <div className="mega-diagram__inspector">
              {singleNode ? (
                <>
                  <h3>노드 편집</h3>
                  <label>
                    이름
                    <Input
                      aria-label="노드 이름"
                      value={draft.title}
                      maxLength={200}
                      onChange={(event) =>
                        setDraft((old) => ({
                          ...old,
                          title: event.target.value,
                        }))
                      }
                      onBlur={() =>
                        draft.title !== singleNode.title &&
                        commitNode({ title: draft.title })
                      }
                      onKeyDown={(event) =>
                        event.key === 'Enter' && event.currentTarget.blur()
                      }
                      disabled={!canEdit}
                    />
                  </label>
                  <label>
                    종류
                    <Input
                      aria-label="노드 종류"
                      value={draft.type}
                      maxLength={50}
                      onChange={(event) =>
                        setDraft((old) => ({
                          ...old,
                          type: event.target.value,
                        }))
                      }
                      onBlur={() =>
                        draft.type !== (singleNode.type ?? '') &&
                        commitNode({ type: draft.type.trim() || undefined })
                      }
                      disabled={!canEdit}
                    />
                  </label>
                  <label>
                    메모
                    <Textarea
                      aria-label="노드 메모"
                      rows={3}
                      value={draft.notes}
                      maxLength={5000}
                      onChange={(event) =>
                        setDraft((old) => ({
                          ...old,
                          notes: event.target.value,
                        }))
                      }
                      onBlur={() =>
                        draft.notes !== (singleNode.notes ?? '') &&
                        commitNode({ notes: draft.notes.trim() || undefined })
                      }
                      disabled={!canEdit}
                    />
                  </label>
                  <p>
                    포트{' '}
                    {singleNode.ports.map((item) => item.title).join(' · ')}
                  </p>
                  {canEdit && (
                    <Button
                      variant="danger"
                      onClick={() => requestRemove([`node:${singleNode.id}`])}
                    >
                      노드 삭제
                    </Button>
                  )}
                </>
              ) : selectedEdge ? (
                <>
                  <h3>연결 편집</h3>
                  <p>
                    {title(selectedEdge.fromNode)} →{' '}
                    {title(selectedEdge.toNode)}
                  </p>
                  <label>
                    라벨
                    <Input
                      aria-label="연결 라벨"
                      value={draft.labelText}
                      maxLength={200}
                      onChange={(event) =>
                        setDraft((old) => ({
                          ...old,
                          labelText: event.target.value,
                        }))
                      }
                      onBlur={() =>
                        draft.labelText !== (selectedEdge.label ?? '') &&
                        commitEdge({
                          label: draft.labelText.trim() || undefined,
                        })
                      }
                      disabled={!canEdit}
                    />
                  </label>
                  <label>
                    모양
                    <Select
                      aria-label="연결 모양"
                      value={selectedEdge.shape ?? 'orthogonal'}
                      onChange={(event) =>
                        commitEdge({
                          shape: event.target.value as DiagramEdge['shape'],
                        })
                      }
                      disabled={!canEdit}
                    >
                      <option value="orthogonal">직각</option>
                      <option value="straight">직선</option>
                    </Select>
                  </label>
                  {canEdit && (
                    <Button
                      variant="danger"
                      onClick={() => requestRemove([`edge:${selectedEdge.id}`])}
                    >
                      연결 삭제
                    </Button>
                  )}
                </>
              ) : selection.length ? (
                <>
                  <h3>{selection.length}개 선택</h3>
                  {canEdit && (
                    <Button
                      variant="danger"
                      onClick={() => requestRemove(selection)}
                    >
                      선택 삭제
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <h3>선택한 항목 없음</h3>
                  <p>
                    노드나 연결을 눌러 편집해요. 빈 곳을 끌면 여러 노드를
                    선택해요.
                  </p>
                </>
              )}
            </div>
            <p id={`${id}-help`} className="mega-diagram__hint">
              {canEdit
                ? '노드를 끌어 옮기고, 출력 포트에서 입력 포트로 끌어 연결해요. 방향키로 선택한 노드를 격자만큼, Shift+방향키로 1씩 옮기고 Delete로 삭제해요. Alt+드래그로 화면을 옮기고 Ctrl/⌘+휠로 확대·축소해요.'
                : '다이어그램을 읽기 전용으로 보고 있어요.'}
            </p>
            <p
              className="mega-visually-hidden"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          </>
        )
      )}
      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="선택한 항목을 삭제할까요?"
        size="sm"
        description="연결된 선도 함께 지워져요. 실행 취소로 되돌릴 수 있어요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              삭제 취소
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                removeSelection(removing ?? []);
                setRemoving(null);
              }}
            >
              삭제
            </Button>
          </>
        }
      />
      <Dialog
        open={!!imported}
        onClose={() => setImported(null)}
        title="파일로 바꿀까요?"
        size="sm"
        description={
          imported
            ? `노드 ${imported.nodes.length}개를 읽었어요. 현재 다이어그램 전체를 바꾸고, 저장하지 않은 변경은 사라져요.`
            : undefined
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setImported(null)}>
              현재 다이어그램 유지
            </Button>
            <Button
              onClick={() => {
                if (
                  imported &&
                  replace(imported, { type: 'replace' }, '파일로 바꿨어요.')
                ) {
                  setSelection([]);
                  setImported(null);
                }
              }}
            >
              파일로 교체
            </Button>
          </>
        }
      />
      <Dialog
        open={restoring}
        onClose={() => setRestoring(false)}
        title={
          savedOnce ? '저장한 상태로 되돌릴까요?' : '처음 상태로 되돌릴까요?'
        }
        size="sm"
        description="현재 다이어그램 전체를 바꾸고, 저장하지 않은 변경은 사라져요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setRestoring(false)}>
              현재 다이어그램 유지
            </Button>
            <Button
              onClick={() => {
                try {
                  if (
                    replace(
                      parseDiagram(saved),
                      { type: 'replace' },
                      savedOnce
                        ? '저장한 상태로 되돌렸어요.'
                        : '처음 상태로 되돌렸어요.',
                    )
                  ) {
                    setSelection([]);
                    setRestoring(false);
                  }
                } catch {
                  setError(
                    '저장한 다이어그램을 불러오지 못했어요. 다시 저장해 주세요.',
                  );
                  setRestoring(false);
                }
              }}
            >
              되돌리기
            </Button>
          </>
        }
      />
    </div>
  );
}
