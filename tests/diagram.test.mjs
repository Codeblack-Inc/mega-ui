import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateDiagram,
  updateDiagram,
  diagramConnectionError,
  diagramPortPoint,
  diagramEdgePath,
  diagramBounds,
  layoutDiagram,
  serializeDiagram,
  parseDiagram,
  defaultDiagramPorts,
} from '../src/components/diagram-model.ts';

const node = (id, x, y, extra = {}) => ({
  id,
  title: id,
  x,
  y,
  width: 160,
  height: 64,
  ...extra,
});
const flow = {
  version: 1,
  nodes: [
    node('start', 40, 40),
    node('review', 280, 40),
    node('done', 520, 40),
  ],
  edges: [
    {
      id: 'e1',
      fromNode: 'start',
      fromPort: 'out',
      toNode: 'review',
      toPort: 'in',
    },
    {
      id: 'e2',
      fromNode: 'review',
      fromPort: 'out',
      toNode: 'done',
      toPort: 'in',
    },
  ],
};

test('validation fills default ports and keeps the input untouched', () => {
  const original = structuredClone(flow);
  const data = validateDiagram(flow);
  assert.deepEqual(data.nodes[0].ports, defaultDiagramPorts());
  assert.equal(data.edges.length, 2);
  assert.deepEqual(flow, original);
});

test('connections need an out port, an in port and a different node', () => {
  const data = validateDiagram(flow);
  assert.equal(
    diagramConnectionError(
      data,
      { node: 'start', port: 'out' },
      { node: 'done', port: 'in' },
    ),
    '',
  );
  assert.match(
    diagramConnectionError(
      data,
      { node: 'start', port: 'out' },
      { node: 'review', port: 'in' },
    ),
    /이미 연결/,
  );
  assert.match(
    diagramConnectionError(
      data,
      { node: 'start', port: 'out' },
      { node: 'start', port: 'in' },
    ),
    /같은 노드/,
  );
  assert.match(
    diagramConnectionError(
      data,
      { node: 'start', port: 'in' },
      { node: 'done', port: 'in' },
    ),
    /출력 포트에서 입력 포트/,
  );
  assert.match(
    diagramConnectionError(
      data,
      { node: 'start', port: 'none' },
      { node: 'done', port: 'in' },
    ),
    /노드와 포트를 다시 확인/,
  );
});

test('port limits and type rules reject connections in the model and the check', () => {
  const limited = {
    version: 1,
    nodes: [
      node('a', 0, 0, {
        type: 'source',
        ports: [
          {
            id: 'out',
            title: '출력',
            side: 'right',
            direction: 'out',
            limit: 1,
          },
        ],
      }),
      node('b', 200, 0, {
        type: 'task',
        ports: [{ id: 'in', title: '입력', side: 'left', direction: 'in' }],
      }),
      node('c', 200, 100, {
        type: 'note',
        ports: [{ id: 'in', title: '입력', side: 'left', direction: 'in' }],
      }),
      node('d', 200, 200, {
        type: 'task',
        ports: [{ id: 'in', title: '입력', side: 'left', direction: 'in' }],
      }),
    ],
    edges: [
      { id: 'e1', fromNode: 'a', fromPort: 'out', toNode: 'b', toPort: 'in' },
    ],
    rules: [{ from: 'source', to: 'task' }],
  };
  const data = validateDiagram(limited);
  assert.match(
    diagramConnectionError(
      data,
      { node: 'a', port: 'out' },
      { node: 'd', port: 'in' },
    ),
    /연결을 1개까지/,
  );
  assert.throws(
    () =>
      updateDiagram(data, {
        type: 'put-edge',
        edge: {
          id: 'e2',
          fromNode: 'a',
          fromPort: 'out',
          toNode: 'd',
          toPort: 'in',
        },
      }),
    /연결을 1개까지/,
  );
  const roomy = validateDiagram({
    ...limited,
    nodes: limited.nodes.map((item) =>
      item.id === 'a'
        ? {
            ...item,
            ports: [
              { id: 'out', title: '출력', side: 'right', direction: 'out' },
            ],
          }
        : item,
    ),
  });
  assert.match(
    diagramConnectionError(
      roomy,
      { node: 'a', port: 'out' },
      { node: 'c', port: 'in' },
    ),
    /연결할 수 없는 조합/,
  );
});

test('deleting a node takes its edges and leaves the rest', () => {
  const data = updateDiagram(validateDiagram(flow), {
    type: 'delete-node',
    id: 'review',
  });
  assert.deepEqual(
    data.nodes.map((item) => item.id),
    ['start', 'done'],
  );
  assert.deepEqual(data.edges, []);
  assert.throws(
    () => updateDiagram(data, { type: 'delete-node', id: 'review' }),
    /변경할 노드가 없어요/,
  );
});

test('placing nodes moves only the listed ones and rejects unknown ids', () => {
  const data = updateDiagram(validateDiagram(flow), {
    type: 'place-nodes',
    positions: [{ id: 'done', x: 900, y: 200 }],
  });
  assert.deepEqual(
    data.nodes.map((item) => [item.id, item.x, item.y]),
    [
      ['start', 40, 40],
      ['review', 280, 40],
      ['done', 900, 200],
    ],
  );
  assert.throws(
    () =>
      updateDiagram(data, {
        type: 'place-nodes',
        positions: [{ id: 'none', x: 0, y: 0 }],
      }),
    /변경할 노드가 없어요/,
  );
});

test('validation rejects duplicate edges, ids, sizes and stray references', () => {
  const bad = (patch, pattern) =>
    assert.throws(() => validateDiagram({ ...flow, ...patch }), pattern);
  bad(
    {
      edges: [
        ...flow.edges,
        {
          id: 'e3',
          fromNode: 'start',
          fromPort: 'out',
          toNode: 'review',
          toPort: 'in',
        },
      ],
    },
    /두 번 연결/,
  );
  bad({ nodes: [node('start', 0, 0), node('start', 0, 0)] }, /노드 ID는 중복/);
  bad({ nodes: [node('start', 0, 0, { width: 10 })] }, /노드 크기/);
  bad({ nodes: [node('start', 1e6, 0)] }, /노드 위치/);
  bad(
    {
      edges: [
        {
          id: 'e1',
          fromNode: 'start',
          fromPort: 'out',
          toNode: 'none',
          toPort: 'in',
        },
      ],
    },
    /노드와 포트를 다시 확인/,
  );
  bad(
    {
      nodes: [
        node('a', 0, 0, {
          ports: [
            { id: 'p', title: '하나', side: 'left', direction: 'in' },
            { id: 'p', title: '둘', side: 'right', direction: 'out' },
          ],
        }),
      ],
      edges: [],
    },
    /포트 ID는 중복/,
  );
  assert.throws(() => validateDiagram({ ...flow, version: 2 }), /버전은 1/);
});

test('port anchors sit on the node edge and routes leave along the normal', () => {
  const data = validateDiagram(flow);
  const out = diagramPortPoint(data.nodes[0], 'out');
  const into = diagramPortPoint(data.nodes[1], 'in');
  assert.deepEqual([out.x, out.y, out.nx, out.ny], [200, 72, 1, 0]);
  assert.deepEqual([into.x, into.y, into.nx, into.ny], [280, 72, -1, 0]);
  assert.equal(diagramPortPoint(data.nodes[0], 'none'), null);
  const path = diagramEdgePath(out, into);
  assert.match(path, /^M 200 72/);
  assert.match(path, /280 72$/);
  assert.equal(diagramEdgePath(out, into, 'straight'), 'M 200 72 L 280 72');
  const bounds = diagramBounds(data.nodes);
  assert.deepEqual(bounds, { x: 40, y: 40, width: 640, height: 64 });
  assert.deepEqual(diagramBounds([]), { x: 0, y: 0, width: 0, height: 0 });
});

test('auto layout puts each step in its own column and survives a cycle', () => {
  const looped = validateDiagram({
    ...flow,
    edges: [
      ...flow.edges,
      {
        id: 'e3',
        fromNode: 'done',
        fromPort: 'out',
        toNode: 'start',
        toPort: 'in',
      },
    ],
  });
  const positions = layoutDiagram(looped, { gapX: 100, startX: 0, startY: 0 });
  const at = (id) => positions.find((item) => item.id === id);
  assert.equal(at('start').x, 0);
  assert.equal(at('review').x, 260);
  assert.equal(at('done').x, 520);
  assert.deepEqual([at('start').y, at('review').y, at('done').y], [0, 0, 0]);
  const branched = validateDiagram({
    version: 1,
    nodes: [node('a', 0, 0), node('b', 0, 0), node('c', 0, 0)],
    edges: [
      { id: 'e1', fromNode: 'a', fromPort: 'out', toNode: 'b', toPort: 'in' },
      { id: 'e2', fromNode: 'a', fromPort: 'out', toNode: 'c', toPort: 'in' },
    ],
  });
  const spread = layoutDiagram(branched, { gapY: 40, startY: 0 });
  assert.deepEqual(
    spread.filter((item) => item.id !== 'a').map((item) => item.y),
    [0, 104],
  );
});

test('JSON round trip keeps nodes, ports, edges and rules', () => {
  const data = validateDiagram({
    ...flow,
    nodes: flow.nodes.map((item) => ({ ...item, type: 'task', notes: '메모' })),
    rules: [{ from: 'task', to: 'task' }],
  });
  assert.deepEqual(parseDiagram(serializeDiagram(data)), data);
  assert.throws(() => parseDiagram('{'), /JSON 형식/);
  assert.throws(() => parseDiagram('x'.repeat(2_000_001)), /2백만 자/);
});
