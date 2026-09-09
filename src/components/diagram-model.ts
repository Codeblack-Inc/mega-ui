/**
 * Node-port-edge diagram model: validation, immutable edits, layered auto layout
 * and orthogonal edge routing. Coordinates are diagram units, independent of zoom.
 */
export type DiagramSide = 'top' | 'right' | 'bottom' | 'left';
export interface DiagramPort {
  id: string;
  title: string;
  side: DiagramSide;
  direction: 'in' | 'out';
  /** Edges this port accepts. Default: unlimited. */
  limit?: number;
}
export interface DiagramNode {
  id: string;
  title: string;
  /** Used by connection rules and by the consumer's own styling. */
  type?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
  ports: readonly DiagramPort[];
}
export interface DiagramEdge {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
  label?: string;
  shape?: 'orthogonal' | 'straight';
}
/** Allowed `from` node type to `to` node type. An empty list allows every pair. */
export interface DiagramRule {
  from: string;
  to: string;
}
export interface DiagramData {
  version: 1;
  nodes: readonly DiagramNode[];
  edges: readonly DiagramEdge[];
  rules?: readonly DiagramRule[];
}
/** What a consumer may hand in: ports are optional and default to one in and one out. */
export type DiagramNodeInput = Omit<DiagramNode, 'ports'> & {
  ports?: readonly DiagramPort[];
};
export interface DiagramInput {
  version: 1;
  nodes: readonly DiagramNodeInput[];
  edges: readonly DiagramEdge[];
  rules?: readonly DiagramRule[];
}
export type DiagramAction =
  | { type: 'put-node'; node: DiagramNode }
  | { type: 'delete-node'; id: string }
  | {
      type: 'place-nodes';
      positions: readonly { id: string; x: number; y: number }[];
    }
  | { type: 'put-edge'; edge: DiagramEdge }
  | { type: 'delete-edge'; id: string };

export const DIAGRAM_MAX_NODES = 300;
export const DIAGRAM_MAX_EDGES = 600;
/** Node boxes stay inside this range so a stray drag cannot lose the diagram. */
export const DIAGRAM_LIMIT = 100_000;
export const DIAGRAM_MIN_SIZE = 40;
export const DIAGRAM_MAX_SIZE = 2000;

const text = (value: unknown, max = 200): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error(
      `이름은 공백을 제외한 글자를 포함해 ${max}자 이내로 입력해 주세요.`,
    );
  return value;
};
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('다이어그램 데이터 형식을 확인해 주세요.');
  return value as Record<string, unknown>;
};
const array = (value: unknown, max: number): unknown[] => {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    Array.from(value).some((item) => item == null)
  )
    throw new Error(`데이터는 ${max}개 이내의 목록으로 전달해 주세요.`);
  return value;
};
const number = (value: unknown, min: number, max: number, message: string) => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new Error(message);
  return value;
};
const SIDES: readonly DiagramSide[] = ['top', 'right', 'bottom', 'left'];

/** Left in / right out, the shape most diagrams need. */
export function defaultDiagramPorts(): DiagramPort[] {
  return [
    { id: 'in', title: '입력', side: 'left', direction: 'in' },
    { id: 'out', title: '출력', side: 'right', direction: 'out' },
  ];
}

export function validateDiagram(input: unknown): DiagramData {
  const data = record(input);
  if (data.version !== 1)
    throw new Error('지원하는 다이어그램 파일 버전은 1이에요.');
  const nodes = array(data.nodes, DIAGRAM_MAX_NODES).map((item) => {
    const row = record(item);
    const node: DiagramNode = {
      id: text(row.id),
      title: text(row.title),
      x: number(
        row.x,
        -DIAGRAM_LIMIT,
        DIAGRAM_LIMIT,
        '노드 위치는 ±100,000 안의 숫자로 입력해 주세요.',
      ),
      y: number(
        row.y,
        -DIAGRAM_LIMIT,
        DIAGRAM_LIMIT,
        '노드 위치는 ±100,000 안의 숫자로 입력해 주세요.',
      ),
      width: number(
        row.width,
        DIAGRAM_MIN_SIZE,
        DIAGRAM_MAX_SIZE,
        '노드 크기는 40~2,000 사이로 입력해 주세요.',
      ),
      height: number(
        row.height,
        DIAGRAM_MIN_SIZE,
        DIAGRAM_MAX_SIZE,
        '노드 크기는 40~2,000 사이로 입력해 주세요.',
      ),
      ports: [],
    };
    if (row.type !== undefined) node.type = text(row.type, 50);
    if (row.notes !== undefined) {
      if (typeof row.notes !== 'string' || row.notes.length > 5000)
        throw new Error('노드 메모는 5,000자 이내로 입력해 주세요.');
      node.notes = row.notes;
    }
    const ports = (
      row.ports === undefined ? defaultDiagramPorts() : array(row.ports, 8)
    ).map((entry) => {
      const source = record(entry);
      if (!SIDES.includes(source.side as DiagramSide))
        throw new Error(
          '포트 위치는 top·right·bottom·left 중에서 골라 주세요.',
        );
      if (source.direction !== 'in' && source.direction !== 'out')
        throw new Error('포트 방향은 in 또는 out으로 지정해 주세요.');
      const port: DiagramPort = {
        id: text(source.id, 50),
        title: text(source.title, 50),
        side: source.side as DiagramSide,
        direction: source.direction,
      };
      if (source.limit !== undefined)
        port.limit = number(
          source.limit,
          1,
          100,
          '포트의 연결 제한은 1~100 사이의 숫자로 입력해 주세요.',
        ) as number;
      if (port.limit !== undefined && !Number.isInteger(port.limit))
        throw new Error('포트의 연결 제한은 정수로 입력해 주세요.');
      return port;
    });
    if (!ports.length) throw new Error('노드에는 포트가 하나 이상 필요해요.');
    if (new Set(ports.map((port) => port.id)).size !== ports.length)
      throw new Error('한 노드 안의 포트 ID는 중복할 수 없어요.');
    node.ports = ports;
    return node;
  });
  if (new Set(nodes.map((node) => node.id)).size !== nodes.length)
    throw new Error('노드 ID는 중복할 수 없어요.');
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const rules = (data.rules === undefined ? [] : array(data.rules, 100)).map(
    (item) => {
      const row = record(item);
      return { from: text(row.from, 50), to: text(row.to, 50) };
    },
  );
  const used = new Map<string, number>();
  const edges = array(data.edges, DIAGRAM_MAX_EDGES).map((item) => {
    const row = record(item);
    const edge: DiagramEdge = {
      id: text(row.id),
      fromNode: text(row.fromNode),
      fromPort: text(row.fromPort, 50),
      toNode: text(row.toNode),
      toPort: text(row.toPort, 50),
    };
    if (row.label !== undefined) edge.label = text(row.label);
    if (row.shape !== undefined) {
      if (row.shape !== 'orthogonal' && row.shape !== 'straight')
        throw new Error('연결선 모양은 orthogonal 또는 straight예요.');
      edge.shape = row.shape;
    }
    const source = byId.get(edge.fromNode);
    const target = byId.get(edge.toNode);
    const from = source?.ports.find((port) => port.id === edge.fromPort);
    const to = target?.ports.find((port) => port.id === edge.toPort);
    if (!source || !target || !from || !to)
      throw new Error('연결할 노드와 포트를 다시 확인해 주세요.');
    if (from.direction !== 'out' || to.direction !== 'in')
      throw new Error('연결은 출력 포트에서 입력 포트로만 만들 수 있어요.');
    if (edge.fromNode === edge.toNode)
      throw new Error('같은 노드끼리는 연결할 수 없어요.');
    if (
      rules.length &&
      !rules.some(
        (rule) =>
          rule.from === (source.type ?? '') && rule.to === (target.type ?? ''),
      )
    )
      throw new Error('이 두 노드는 연결할 수 없는 조합이에요.');
    for (const [port, key] of [
      [from, `${edge.fromNode}|${edge.fromPort}`],
      [to, `${edge.toNode}|${edge.toPort}`],
    ] as const) {
      const count = (used.get(key) ?? 0) + 1;
      used.set(key, count);
      if (port.limit !== undefined && count > port.limit)
        throw new Error(
          `${port.title} 포트는 연결을 ${port.limit}개까지 받을 수 있어요.`,
        );
    }
    return edge;
  });
  if (new Set(edges.map((edge) => edge.id)).size !== edges.length)
    throw new Error('연결 ID는 중복할 수 없어요.');
  if (
    new Set(
      edges.map(
        (edge) =>
          `${edge.fromNode}|${edge.fromPort}>${edge.toNode}|${edge.toPort}`,
      ),
    ).size !== edges.length
  )
    throw new Error('같은 두 포트를 두 번 연결할 수 없어요.');
  const result: DiagramData = {
    version: 1,
    nodes,
    edges,
    ...(rules.length ? { rules } : {}),
  };
  if (JSON.stringify(result).length > 2_000_000)
    throw new Error('다이어그램 내용은 2백만 자 이내로 전달해 주세요.');
  return result;
}

export function updateDiagram(
  input: DiagramInput,
  action: DiagramAction,
): DiagramData {
  const data = validateDiagram(input);
  let { nodes, edges } = data;
  switch (action.type) {
    case 'put-node':
      nodes = nodes.some((node) => node.id === action.node.id)
        ? nodes.map((node) => (node.id === action.node.id ? action.node : node))
        : [...nodes, action.node];
      break;
    case 'delete-node': {
      if (!nodes.some((node) => node.id === action.id))
        throw new Error(
          '변경할 노드가 없어요. 현재 다이어그램을 다시 확인해 주세요.',
        );
      nodes = nodes.filter((node) => node.id !== action.id);
      // Edges cannot outlive the node they attach to.
      edges = edges.filter(
        (edge) => edge.fromNode !== action.id && edge.toNode !== action.id,
      );
      break;
    }
    case 'place-nodes': {
      const moves = new Map(
        action.positions.map((position) => [position.id, position]),
      );
      if ([...moves.keys()].some((id) => !nodes.some((node) => node.id === id)))
        throw new Error(
          '변경할 노드가 없어요. 현재 다이어그램을 다시 확인해 주세요.',
        );
      nodes = nodes.map((node) => {
        const move = moves.get(node.id);
        return move ? { ...node, x: move.x, y: move.y } : node;
      });
      break;
    }
    case 'put-edge':
      edges = edges.some((edge) => edge.id === action.edge.id)
        ? edges.map((edge) => (edge.id === action.edge.id ? action.edge : edge))
        : [...edges, action.edge];
      break;
    case 'delete-edge':
      if (!edges.some((edge) => edge.id === action.id))
        throw new Error(
          '변경할 연결이 없어요. 현재 다이어그램을 다시 확인해 주세요.',
        );
      edges = edges.filter((edge) => edge.id !== action.id);
      break;
    default:
      throw new Error('지원하지 않는 다이어그램 변경이에요.');
  }
  return validateDiagram({ ...data, nodes, edges });
}

/** Why a connection is refused, or an empty string when it is allowed. */
export function diagramConnectionError(
  data: DiagramData,
  from: { node: string; port: string },
  to: { node: string; port: string },
): string {
  const source = data.nodes.find((node) => node.id === from.node);
  const target = data.nodes.find((node) => node.id === to.node);
  const fromPort = source?.ports.find((port) => port.id === from.port);
  const toPort = target?.ports.find((port) => port.id === to.port);
  if (!source || !target || !fromPort || !toPort)
    return '연결할 노드와 포트를 다시 확인해 주세요.';
  if (from.node === to.node) return '같은 노드끼리는 연결할 수 없어요.';
  if (fromPort.direction !== 'out' || toPort.direction !== 'in')
    return '연결은 출력 포트에서 입력 포트로만 만들 수 있어요.';
  if (
    data.edges.some(
      (edge) =>
        edge.fromNode === from.node &&
        edge.fromPort === from.port &&
        edge.toNode === to.node &&
        edge.toPort === to.port,
    )
  )
    return '이미 연결한 포트예요.';
  if (
    data.rules?.length &&
    !data.rules.some(
      (rule) =>
        rule.from === (source.type ?? '') && rule.to === (target.type ?? ''),
    )
  )
    return '이 두 노드는 연결할 수 없는 조합이에요.';
  for (const [port, node, id] of [
    [fromPort, from.node, from.port],
    [toPort, to.node, to.port],
  ] as const) {
    if (port.limit === undefined) continue;
    const count = data.edges.filter((edge) =>
      port.direction === 'out'
        ? edge.fromNode === node && edge.fromPort === id
        : edge.toNode === node && edge.toPort === id,
    ).length;
    if (count >= port.limit)
      return `${port.title} 포트는 연결을 ${port.limit}개까지 받을 수 있어요.`;
  }
  return '';
}

export function diagramBounds(nodes: readonly DiagramNode[]) {
  if (!nodes.length) return { x: 0, y: 0, width: 0, height: 0 };
  const minX = Math.min(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxX = Math.max(...nodes.map((node) => node.x + node.width));
  const maxY = Math.max(...nodes.map((node) => node.y + node.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Anchor point and outward normal of one port, in diagram units. */
export function diagramPortPoint(node: DiagramNode, portId: string) {
  const index = node.ports.findIndex((port) => port.id === portId);
  const port = node.ports[index];
  if (!port) return null;
  const sameSide = node.ports.filter((item) => item.side === port.side);
  const order = sameSide.findIndex((item) => item.id === port.id);
  const ratio = (order + 1) / (sameSide.length + 1);
  const point =
    port.side === 'left'
      ? { x: node.x, y: node.y + node.height * ratio, nx: -1, ny: 0 }
      : port.side === 'right'
        ? {
            x: node.x + node.width,
            y: node.y + node.height * ratio,
            nx: 1,
            ny: 0,
          }
        : port.side === 'top'
          ? { x: node.x + node.width * ratio, y: node.y, nx: 0, ny: -1 }
          : {
              x: node.x + node.width * ratio,
              y: node.y + node.height,
              nx: 0,
              ny: 1,
            };
  return { ...point, port };
}

const round = (value: number) => Math.round(value * 100) / 100;
/** Rounded polyline through the waypoints. */
const polyline = (points: readonly { x: number; y: number }[], radius = 8) => {
  if (points.length < 2) return '';
  const parts = [`M ${round(points[0]!.x)} ${round(points[0]!.y)}`];
  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1]!;
    const current = points[index]!;
    const next = points[index + 1]!;
    const before = Math.min(
      radius,
      Math.hypot(current.x - previous.x, current.y - previous.y) / 2,
    );
    const after = Math.min(
      radius,
      Math.hypot(next.x - current.x, next.y - current.y) / 2,
    );
    const entry = {
      x: current.x + Math.sign(previous.x - current.x) * before,
      y: current.y + Math.sign(previous.y - current.y) * before,
    };
    const exit = {
      x: current.x + Math.sign(next.x - current.x) * after,
      y: current.y + Math.sign(next.y - current.y) * after,
    };
    parts.push(
      `L ${round(entry.x)} ${round(entry.y)}`,
      `Q ${round(current.x)} ${round(current.y)} ${round(exit.x)} ${round(exit.y)}`,
    );
  }
  const last = points.at(-1)!;
  parts.push(`L ${round(last.x)} ${round(last.y)}`);
  return parts.join(' ');
};

/** Orthogonal route that leaves and enters along each port's normal. */
export function diagramEdgePath(
  from: { x: number; y: number; nx: number; ny: number },
  to: { x: number; y: number; nx: number; ny: number },
  shape: 'orthogonal' | 'straight' = 'orthogonal',
  gap = 24,
): string {
  if (shape === 'straight')
    return `M ${round(from.x)} ${round(from.y)} L ${round(to.x)} ${round(to.y)}`;
  const start = { x: from.x + from.nx * gap, y: from.y + from.ny * gap };
  const end = { x: to.x + to.nx * gap, y: to.y + to.ny * gap };
  const points = [{ x: from.x, y: from.y }, start];
  if (from.nx !== 0) {
    // Leaving sideways: travel horizontally first, then meet the target's approach.
    if (to.nx !== 0) {
      // A target that sits behind the source is reached through the lane between
      // the two rows instead of a mid-x that would cut straight through them.
      if ((end.x - start.x) * from.nx < 0) {
        const lane = (start.y + end.y) / 2;
        points.push({ x: start.x, y: lane }, { x: end.x, y: lane });
      } else {
        const middle = (start.x + end.x) / 2;
        points.push({ x: middle, y: start.y }, { x: middle, y: end.y });
      }
    } else {
      points.push({ x: end.x, y: start.y });
    }
  } else if (to.ny !== 0) {
    const middle = (start.y + end.y) / 2;
    points.push({ x: start.x, y: middle }, { x: end.x, y: middle });
  } else {
    points.push({ x: start.x, y: end.y });
  }
  points.push(end, { x: to.x, y: to.y });
  const cleaned = points.filter(
    (point, index) =>
      index === 0 ||
      Math.abs(point.x - points[index - 1]!.x) > 0.01 ||
      Math.abs(point.y - points[index - 1]!.y) > 0.01,
  );
  return polyline(cleaned);
}

export interface DiagramLayoutOptions {
  /** Space between layers and between nodes inside a layer. */
  gapX?: number;
  gapY?: number;
  startX?: number;
  startY?: number;
}
/**
 * Layered left-to-right placement: cycles are broken for layering only, layers come
 * from the longest path, and rows are ordered by the average position of predecessors.
 */
export function layoutDiagram(
  input: DiagramInput,
  options: DiagramLayoutOptions = {},
): { id: string; x: number; y: number }[] {
  const data = validateDiagram(input);
  const { gapX = 96, gapY = 32, startX = 40, startY = 40 } = options;
  const ids = data.nodes.map((node) => node.id);
  const outgoing = new Map(ids.map((id) => [id, [] as string[]]));
  const state = new Map(ids.map((id) => [id, 0]));
  const kept: { from: string; to: string }[] = [];
  // Depth-first walk drops back edges so the layering always terminates.
  const walk = (id: string) => {
    state.set(id, 1);
    for (const edge of data.edges.filter((item) => item.fromNode === id)) {
      const next = edge.toNode;
      if (state.get(next) === 1) continue;
      if (!kept.some((item) => item.from === id && item.to === next)) {
        kept.push({ from: id, to: next });
        outgoing.get(id)!.push(next);
      }
      if (state.get(next) === 0) walk(next);
    }
    state.set(id, 2);
  };
  for (const id of ids) if (state.get(id) === 0) walk(id);
  const layer = new Map(ids.map((id) => [id, 0]));
  let changed = true;
  for (let pass = 0; pass < ids.length && changed; pass++) {
    changed = false;
    for (const { from, to } of kept)
      if (layer.get(to)! < layer.get(from)! + 1) {
        layer.set(to, layer.get(from)! + 1);
        changed = true;
      }
  }
  const layers: string[][] = [];
  for (const id of ids) (layers[layer.get(id)!] ??= []).push(id);
  const incoming = new Map(ids.map((id) => [id, [] as string[]]));
  for (const { from, to } of kept) incoming.get(to)!.push(from);
  const order = new Map(
    layers.flatMap((row) => row.map((id, index) => [id, index] as const)),
  );
  for (let pass = 0; pass < 2; pass++)
    for (const row of layers) {
      if (!row) continue;
      const score = new Map(
        row.map((id) => {
          const parents = incoming.get(id)!;
          const average = parents.length
            ? parents.reduce(
                (sum, parent) => sum + (order.get(parent) ?? 0),
                0,
              ) / parents.length
            : (order.get(id) ?? 0);
          return [id, average] as const;
        }),
      );
      row.sort((a, b) => score.get(a)! - score.get(b)! || a.localeCompare(b));
      row.forEach((id, index) => order.set(id, index));
    }
  const positions: { id: string; x: number; y: number }[] = [];
  const size = new Map(data.nodes.map((node) => [node.id, node]));
  let x = startX;
  for (const row of layers) {
    if (!row?.length) continue;
    let y = startY;
    for (const id of row) {
      const node = size.get(id)!;
      positions.push({ id, x, y });
      y += node.height + gapY;
    }
    x += Math.max(...row.map((id) => size.get(id)!.width)) + gapX;
  }
  return positions;
}

export function serializeDiagram(data: DiagramInput): string {
  return JSON.stringify(validateDiagram(data));
}
export function parseDiagram(source: string): DiagramData {
  if (typeof source !== 'string' || source.length > 2_000_000)
    throw new Error('다이어그램 파일은 2백만 자 이내로 불러와 주세요.');
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    throw new Error('다이어그램 JSON 형식을 확인해 주세요.');
  }
  return validateDiagram(data);
}
