// Browser regression fixture, not a documentation route or production entry.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DataGridPro, type GridColumn } from '../src/data-grid';
import '../src/styles/index.scss';
type Item = { id: string; name: string; amount: number; note: string | null };
const columns: readonly GridColumn<Item>[] = [
  { key: 'name', header: '이름', editable: true, width: 160 },
  { key: 'amount', header: '금액', kind: 'number', editable: true, width: 160 },
  { key: 'note', header: '메모', editable: true, width: 160 },
];
const id = (row: Item) => row.id;
function Fixture() {
  const [readOnly, setReadOnly] = useState(false);
  const [rows, setRows] = useState<readonly Item[]>([
    { id: '1', name: '가', amount: 1, note: null },
    { id: '2', name: '나', amount: 2, note: null },
  ]);
  return (
    <>
      <button onClick={() => setReadOnly(!readOnly)}>조회 전용 전환</button>
      <button
        onClick={() =>
          setRows(
            rows.map((row) => ({ ...row, note: '외부 변경', amount: 10 })),
          )
        }
      >
        외부 원본 변경
      </button>
      <DataGridPro
        label="검증 원장"
        readOnly={readOnly}
        draftStorageKey="mega-grid-fixture-v1"
        historyLimit={2}
        rows={rows}
        columns={columns}
        getRowId={id}
        onRowsChange={setRows}
      />
      <DataGridPro
        label="읽기 전용 원장"
        rows={rows}
        columns={columns}
        getRowId={id}
      />
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
