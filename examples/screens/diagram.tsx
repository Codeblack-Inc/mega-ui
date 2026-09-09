import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  DiagramEditor,
  PageHeader,
  Select,
  Stack,
  parseDiagram,
  serializeDiagram,
  type DiagramInput,
  type DiagramNodeType,
} from '@mega-ui/react';

const node = (
  id: string,
  title: string,
  type: string,
  x: number,
  y: number,
  notes?: string,
) => ({
  id,
  title,
  type,
  x: x,
  y,
  width: 176,
  height: 64,
  ...(notes ? { notes } : {}),
});

export const diagramSeed: DiagramInput = {
  version: 1,
  nodes: [
    node(
      'intake',
      '주문 접수',
      '시작',
      40,
      160,
      '결제 완료 웹훅으로 들어와요.',
    ),
    node('check', '재고 확인', '작업', 296, 160),
    node('pack', '포장', '작업', 552, 80),
    node('backorder', '입고 대기', '작업', 552, 240),
    node('ship', '출고', '작업', 808, 80),
    node('done', '배송 완료', '완료', 1064, 80),
  ],
  edges: [
    {
      id: 'e1',
      fromNode: 'intake',
      fromPort: 'out',
      toNode: 'check',
      toPort: 'in',
    },
    {
      id: 'e2',
      fromNode: 'check',
      fromPort: 'out',
      toNode: 'pack',
      toPort: 'in',
      label: '재고 있음',
    },
    {
      id: 'e3',
      fromNode: 'check',
      fromPort: 'out',
      toNode: 'backorder',
      toPort: 'in',
      label: '재고 없음',
    },
    {
      id: 'e4',
      fromNode: 'pack',
      fromPort: 'out',
      toNode: 'ship',
      toPort: 'in',
    },
    {
      id: 'e5',
      fromNode: 'ship',
      fromPort: 'out',
      toNode: 'done',
      toPort: 'in',
    },
    {
      id: 'e6',
      fromNode: 'backorder',
      fromPort: 'out',
      toNode: 'pack',
      toPort: 'in',
      label: '입고 후',
    },
  ],
};
const types: readonly DiagramNodeType[] = [
  { type: '작업', title: '작업' },
  { type: '분기', title: '분기', width: 148 },
  { type: '완료', title: '완료' },
];
export function DiagramDemo() {
  const [value, setValue] = useState(diagramSeed);
  return (
    <DiagramEditor
      value={value}
      onChange={setValue}
      label="주문 처리 흐름"
      nodeTypes={types}
    />
  );
}
const storageKey = 'mega-diagram-example-v1';
export function DiagramExample() {
  const [value, setValue] = useState(diagramSeed);
  const [instance, setInstance] = useState(0);
  const [fail, setFail] = useState(false);
  const [mode, setMode] = useState('order');
  const [reload, setReload] = useState(false);
  const [loadError, setLoadError] = useState('');
  const load = () => {
    try {
      const source = localStorage.getItem(storageKey);
      if (!source) {
        setLoadError(
          '이 브라우저에 저장한 다이어그램이 없어요. 저장한 뒤 다시 불러와 주세요.',
        );
        return;
      }
      setValue(parseDiagram(source));
      setInstance((current) => current + 1);
      setLoadError('');
      setReload(false);
    } catch {
      setLoadError(
        '저장한 다이어그램을 불러오지 못했어요. 브라우저 저장소와 저장한 데이터를 확인해 주세요.',
      );
    }
  };
  return (
    <Stack gap={4}>
      <PageHeader
        title="주문 처리 흐름 편집"
        description="노드를 끌어 옮기고 포트를 연결해 업무 흐름을 그려요. 저장은 이 브라우저의 저장소에 기록해요."
      />
      <DiagramEditor
        key={instance}
        value={value}
        onChange={setValue}
        label="주문 처리 흐름"
        nodeTypes={types}
        onSave={async (next) => {
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (fail) throw new Error('Example save failure');
          localStorage.setItem(storageKey, serializeDiagram(next));
        }}
      />
      <p>예제 데이터를 바꾸면 저장하지 않은 변경은 사라져요.</p>
      <Stack direction="row" gap={3} wrap align="end">
        <label>
          예제 데이터
          <Select
            aria-label="다이어그램 예제 데이터"
            value={mode}
            onChange={(event) => {
              const next = event.target.value;
              setMode(next);
              setValue(
                next === 'large'
                  ? {
                      version: 1,
                      nodes: Array.from({ length: 60 }, (_, index) => ({
                        id: `step-${index}`,
                        title: `단계 ${index + 1}`,
                        type: index % 3 === 0 ? '분기' : '작업',
                        x: 40 + (index % 10) * 220,
                        y: 40 + Math.floor(index / 10) * 120,
                        width: 176,
                        height: 64,
                      })),
                      edges: Array.from({ length: 59 }, (_, index) => ({
                        id: `link-${index}`,
                        fromNode: `step-${index}`,
                        fromPort: 'out',
                        toNode: `step-${index + 1}`,
                        toPort: 'in',
                      })),
                    }
                  : next === 'empty'
                    ? { version: 1, nodes: [], edges: [] }
                    : diagramSeed,
              );
              setInstance((current) => current + 1);
            }}
          >
            <option value="order">주문 처리 흐름</option>
            <option value="large">노드 60개</option>
            <option value="empty">빈 다이어그램</option>
          </Select>
        </label>
        <Checkbox
          checked={fail}
          onChange={(event) => setFail(event.target.checked)}
        >
          저장 실패 재현
        </Checkbox>
        <Button variant="secondary" onClick={() => setReload(true)}>
          브라우저 저장본 불러오기
        </Button>
      </Stack>
      {reload && (
        <Alert>
          <Stack gap={2}>
            <p>
              현재 다이어그램 전체를 브라우저 저장본으로 바꿔요. 저장하지 않은
              변경은 사라져요.
            </p>
            <Stack direction="row" gap={2}>
              <Button onClick={load}>저장본으로 교체</Button>
              <Button variant="secondary" onClick={() => setReload(false)}>
                현재 다이어그램 유지
              </Button>
            </Stack>
          </Stack>
        </Alert>
      )}
      {loadError && (
        <Alert tone="danger" role="alert">
          {loadError}
        </Alert>
      )}
    </Stack>
  );
}
