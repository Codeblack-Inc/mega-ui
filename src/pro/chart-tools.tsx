import { useState } from 'react';
import { Button } from '../components/controls';
import { Alert } from '../components/surfaces';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '../components/data';
import { createChartCsv, type CartesianChartData } from './charts-model';

export function ChartDownload({
  data,
  label,
  categoryLabel,
}: {
  data: CartesianChartData;
  label: string;
  categoryLabel: string;
}) {
  const [error, setError] = useState(false);
  return (
    <div>
      <Button
        variant="secondary"
        disabled={!data.labels.length || !data.series.length}
        onClick={() => {
          setError(false);
          try {
            const url = URL.createObjectURL(
              new Blob([createChartCsv(data, categoryLabel)], {
                type: 'text/csv;charset=utf-8',
              }),
            );
            const link = document.createElement('a');
            link.href = url;
            link.download = `${label.replace(/[\\/:*?"<>|]/g, '-') || 'chart'}.csv`;
            document.body.append(link);
            try {
              link.click();
            } finally {
              link.remove();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
          } catch {
            setError(true);
          }
        }}
      >
        전체 데이터 CSV 내려받기
      </Button>
      {error && (
        <Alert tone="danger" role="alert">
          CSV 파일을 만들지 못했어요. 다시 내려받아 주세요.
        </Alert>
      )}
    </div>
  );
}
export function ChartDataTable({
  data,
  label,
  xLabel,
  yLabel,
  formatValue,
}: {
  data: CartesianChartData;
  label: string;
  xLabel: string;
  yLabel: string;
  formatValue: (value: number) => string;
}) {
  return (
    <details className="mega-cartesian-chart__table">
      <summary>전체 데이터 표 보기</summary>
      <Table density="compact" caption={`${label} · ${yLabel} · 전체 데이터`}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{xLabel}</TableHeaderCell>
            {data.series.map((item) => (
              <TableHeaderCell key={item.id} align="end">
                {item.label}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.labels.map((category, index) => (
            <TableRow key={index}>
              <TableHeaderCell scope="row">{category}</TableHeaderCell>
              {data.series.map((item) => (
                <TableCell key={item.id} numeric>
                  {item.values[index] == null
                    ? '값 없음'
                    : formatValue(item.values[index]!)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </details>
  );
}
