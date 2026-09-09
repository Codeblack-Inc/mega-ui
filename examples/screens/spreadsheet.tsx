import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  PageHeader,
  Select,
  SpreadsheetPro,
  Stack,
  emptySheet,
  parseSpreadsheet,
  serializeSpreadsheet,
  type SpreadsheetData,
} from '@mega-ui/react';

const cells = (rows: readonly (readonly string[])[], start = 0) => {
  const map: Record<
    string,
    { value: string; bold?: boolean; format?: 'currency' | 'percent' }
  > = {};
  rows.forEach((line, row) =>
    line.forEach((value, column) => {
      if (!value) return;
      const ref = `${String.fromCharCode(65 + column)}${row + 1 + start}`;
      map[ref] = { value };
    }),
  );
  return map;
};
export const spreadsheetSeed: SpreadsheetData = {
  version: 1,
  sheets: [
    {
      ...emptySheet('sales', '9월 매출'),
      rows: 60,
      columns: 8,
      frozenRows: 1,
      columnWidths: { A: 132, B: 116, C: 116, D: 116, E: 116 },
      cells: {
        ...Object.fromEntries(
          Object.entries(
            cells([
              ['채널', '단가', '수량', '매출', '수수료율', '정산액'],
              ['온라인', '12000', '340', '=B2*C2', '0.08', '=D2*(1-E2)'],
              ['매장', '15000', '120', '=B3*C3', '0.05', '=D3*(1-E3)'],
              ['파트너', '9000', '260', '=B4*C4', '0.12', '=D4*(1-E4)'],
              ['정기구독', '19000', '80', '=B5*C5', '0.03', '=D5*(1-E5)'],
              ['합계', '', '=SUM(C2:C5)', '=SUM(D2:D5)', '', '=SUM(F2:F5)'],
            ]),
          ).map(([ref, cell]) => [
            ref,
            ref.endsWith('1')
              ? { ...cell, bold: true }
              : ref.startsWith('D') ||
                  ref.startsWith('F') ||
                  ref.startsWith('B')
                ? { ...cell, format: 'currency' as const }
                : ref.startsWith('E')
                  ? { ...cell, format: 'percent' as const }
                  : cell,
          ]),
        ),
        A6: { value: '합계', bold: true },
        H1: { value: '메모', bold: true },
        H2: { value: '수식은 =로 시작해요.' },
      },
    },
    {
      ...emptySheet('summary', '요약'),
      rows: 20,
      columns: 6,
      cells: {
        A1: { value: '지표', bold: true },
        B1: { value: '값', bold: true },
        A2: { value: '총 매출' },
        B2: { value: "='9월 매출'!D6", format: 'currency' },
        A3: { value: '총 정산액' },
        B3: { value: "='9월 매출'!F6", format: 'currency' },
        A4: { value: '평균 단가' },
        B4: {
          value: "=ROUND(AVERAGE('9월 매출'!B2:B5),0)",
          format: 'currency',
        },
        A5: { value: '최대 매출' },
        B5: { value: "=MAX('9월 매출'!D2:D5)", format: 'currency' },
      },
    },
  ],
};
export function SpreadsheetDemo() {
  const [value, setValue] = useState(spreadsheetSeed);
  return (
    <SpreadsheetPro value={value} onChange={setValue} label="9월 매출 시트" />
  );
}
const storageKey = 'mega-spreadsheet-example-v1';
export function SpreadsheetExample() {
  const [value, setValue] = useState(spreadsheetSeed);
  const [instance, setInstance] = useState(0);
  const [fail, setFail] = useState(false);
  const [mode, setMode] = useState('sales');
  const [reload, setReload] = useState(false);
  const [loadError, setLoadError] = useState('');
  const load = () => {
    try {
      const source = localStorage.getItem(storageKey);
      if (!source) {
        setLoadError(
          '이 브라우저에 저장한 시트가 없어요. 저장한 뒤 다시 불러와 주세요.',
        );
        return;
      }
      setValue(parseSpreadsheet(source));
      setInstance((current) => current + 1);
      setLoadError('');
      setReload(false);
    } catch {
      setLoadError(
        '저장한 시트를 불러오지 못했어요. 브라우저 저장소와 저장한 데이터를 확인해 주세요.',
      );
    }
  };
  return (
    <Stack gap={4}>
      <PageHeader
        title="매출 정산 시트"
        description="수식으로 매출과 정산액을 계산하고, 범위를 채우고, CSV·xlsx로 주고받아요. 저장은 이 브라우저의 저장소에 기록해요."
      />
      <SpreadsheetPro
        key={instance}
        value={value}
        onChange={setValue}
        label="9월 매출 시트"
        onSave={async (next) => {
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (fail) throw new Error('Example save failure');
          localStorage.setItem(storageKey, serializeSpreadsheet(next));
        }}
      />
      <p>예제 데이터를 바꾸면 저장하지 않은 변경은 사라져요.</p>
      <Stack direction="row" gap={3} wrap align="end">
        <label>
          예제 데이터
          <Select
            aria-label="시트 예제 데이터"
            value={mode}
            onChange={(event) => {
              const next = event.target.value;
              setMode(next);
              setValue(
                next === 'large'
                  ? {
                      version: 1,
                      sheets: [
                        {
                          ...emptySheet('bulk', '주문 원장'),
                          rows: 500,
                          columns: 6,
                          frozenRows: 1,
                          cells: {
                            A1: { value: '주문번호', bold: true },
                            B1: { value: '수량', bold: true },
                            C1: { value: '단가', bold: true },
                            D1: { value: '금액', bold: true },
                            ...Object.fromEntries(
                              Array.from(
                                { length: 499 },
                                (_unused, index) => index,
                              ).flatMap((index) => {
                                const row = index + 2;
                                return [
                                  [
                                    `A${row}`,
                                    {
                                      value: `ORDER-${String(index).padStart(4, '0')}`,
                                    },
                                  ],
                                  [
                                    `B${row}`,
                                    { value: String((index % 7) + 1) },
                                  ],
                                  [
                                    `C${row}`,
                                    {
                                      value: String(1000 + (index % 20) * 500),
                                    },
                                  ],
                                  [
                                    `D${row}`,
                                    {
                                      value: `=B${row}*C${row}`,
                                      format: 'currency' as const,
                                    },
                                  ],
                                ];
                              }),
                            ),
                          },
                        },
                      ],
                    }
                  : next === 'empty'
                    ? { version: 1, sheets: [emptySheet('blank', '새 시트')] }
                    : spreadsheetSeed,
              );
              setInstance((current) => current + 1);
            }}
          >
            <option value="sales">매출 정산</option>
            <option value="large">주문 500행</option>
            <option value="empty">빈 시트</option>
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
              현재 시트 전체를 브라우저 저장본으로 바꿔요. 저장하지 않은 변경은
              사라져요.
            </p>
            <Stack direction="row" gap={2}>
              <Button onClick={load}>저장본으로 교체</Button>
              <Button variant="secondary" onClick={() => setReload(false)}>
                현재 시트 유지
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
