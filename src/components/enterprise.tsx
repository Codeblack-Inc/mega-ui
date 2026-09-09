import {
  useMemo,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Checkbox, IconButton, Input } from './controls';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
} from './data';

export interface DataColumn<Row extends object> {
  key: string;
  header: ReactNode;
  value?: (row: Row) => unknown;
  render?: (value: unknown, row: Row) => ReactNode;
  sortable?: boolean;
  editable?: boolean;
  inputType?: ComponentPropsWithRef<'input'>['type'];
  numeric?: boolean;
  width?: number | string;
}

export type DataTableSort = { key: string; direction: 'asc' | 'desc' };
type BoxProps = Omit<ComponentPropsWithRef<'div'>, 'children'>;

function cellValue<Row extends object>(row: Row, column: DataColumn<Row>) {
  return column.value
    ? column.value(row)
    : (row as Record<string, unknown>)[column.key];
}

function compareValues(a: unknown, b: unknown) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), 'ko');
}

function dateFrom(value: string | Date) {
  if (value instanceof Date)
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date: Date) {
  const part = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`;
}

function dayDifference(start: Date, end: Date) {
  const a = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  ).getTime();
  const b = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  ).getTime();
  return Math.round((b - a) / 86_400_000);
}

export interface DataTableProps<Row extends object> extends BoxProps {
  rows: readonly Row[];
  columns: readonly DataColumn<Row>[];
  getRowId: (row: Row) => string;
  label?: string;
  filterable?: boolean;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  initialSort?: DataTableSort;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  manual?: boolean;
  loading?: boolean;
  error?: ReactNode;
  loadingMessage?: ReactNode;
  emptyMessage?: ReactNode;
}

export function DataTable<Row extends object>({
  rows,
  columns,
  getRowId,
  label = '데이터 테이블',
  filterable = false,
  query,
  defaultQuery = '',
  onQueryChange,
  initialSort,
  sort: controlledSort,
  onSortChange,
  manual = false,
  loading = false,
  error,
  loadingMessage = '데이터를 불러오는 중이에요.',
  emptyMessage = '표시할 데이터가 없어요.',
  className = '',
  ...props
}: DataTableProps<Row>) {
  const [localQuery, setLocalQuery] = useState(defaultQuery);
  const [localSort, setLocalSort] = useState<DataTableSort | undefined>(() =>
    initialSort &&
    columns.some((column) => column.key === initialSort.key && column.sortable)
      ? initialSort
      : undefined,
  );
  const sort = controlledSort ?? localSort;
  const resolvedQuery = query ?? localQuery;
  const visibleRows = useMemo(() => {
    if (manual) return [...rows];
    const needle = resolvedQuery.trim().toLocaleLowerCase('ko');
    const filtered = needle
      ? rows.filter((row) =>
          columns.some((column) =>
            String(cellValue(row, column))
              .toLocaleLowerCase('ko')
              .includes(needle),
          ),
        )
      : [...rows];
    if (!sort) return filtered;
    const column = columns.find(
      (item) => item.key === sort.key && item.sortable,
    );
    if (!column) return filtered;
    return [...filtered].sort((a, b) => {
      const result = compareValues(cellValue(a, column), cellValue(b, column));
      return sort.direction === 'asc' ? result : -result;
    });
  }, [columns, manual, resolvedQuery, rows, sort]);

  return (
    <div {...props} className={`mega-data-table ${className}`}>
      {filterable ? (
        <Input
          type="search"
          aria-label={`${label} 검색`}
          placeholder="검색"
          value={resolvedQuery}
          onChange={(event) => {
            if (query === undefined) setLocalQuery(event.currentTarget.value);
            onQueryChange?.(event.currentTarget.value);
          }}
        />
      ) : null}
      <Table aria-label={label}>
        <TableHead>
          <TableRow>
            {columns.map((column) => {
              const direction =
                sort?.key === column.key ? sort.direction : 'none';
              return (
                <TableHeaderCell
                  key={column.key}
                  align={column.numeric ? 'end' : 'start'}
                  style={{ width: column.width }}
                  sortDirection={column.sortable ? direction : undefined}
                  onSort={
                    column.sortable
                      ? () => {
                          const next: DataTableSort = {
                            key: column.key,
                            direction:
                              sort?.key === column.key &&
                              sort.direction === 'asc'
                                ? 'desc'
                                : 'asc',
                          };
                          if (controlledSort === undefined) setLocalSort(next);
                          onSortChange?.(next);
                        }
                      : undefined
                  }
                >
                  {column.header}
                </TableHeaderCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading || error ? (
            <TableEmpty colSpan={columns.length}>
              <span role={error ? 'alert' : 'status'}>
                {error ?? loadingMessage}
              </span>
            </TableEmpty>
          ) : visibleRows.length ? (
            visibleRows.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((column) => {
                  const value = cellValue(row, column);
                  return (
                    <TableCell key={column.key} numeric={column.numeric}>
                      {column.render
                        ? column.render(value, row)
                        : (value as ReactNode)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableEmpty colSpan={columns.length}>{emptyMessage}</TableEmpty>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export interface VirtualTableProps<Row extends object> extends BoxProps {
  rows: readonly Row[];
  columns: readonly DataColumn<Row>[];
  getRowId: (row: Row) => string;
  height?: number;
  rowHeight?: number;
  overscan?: number;
  label?: string;
}

export function VirtualTable<Row extends object>({
  rows,
  columns,
  getRowId,
  height = 400,
  rowHeight = 44,
  overscan = 3,
  label = '가상화 테이블',
  className = '',
  style,
  onScroll,
  ...props
}: VirtualTableProps<Row>) {
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 400;
  const safeRowHeight =
    Number.isFinite(rowHeight) && rowHeight > 0 ? rowHeight : 44;
  const safeOverscan =
    Number.isFinite(overscan) && overscan >= 0 ? Math.floor(overscan) : 3;
  const [scrollTop, setScrollTop] = useState(0);
  const start = Math.max(
    0,
    Math.floor(scrollTop / safeRowHeight) - safeOverscan,
  );
  const count = Math.ceil(safeHeight / safeRowHeight) + safeOverscan * 2;
  const end = Math.min(rows.length, start + count);
  const visible = rows.slice(start, end);
  return (
    <div
      {...props}
      className={`mega-virtual-table ${className}`}
      style={{ maxHeight: safeHeight, ...style }}
      role="region"
      aria-label={`${label} 스크롤 영역`}
      tabIndex={0}
      onScroll={(event) => {
        setScrollTop(event.currentTarget.scrollTop);
        onScroll?.(event);
      }}
    >
      <table aria-label={label} aria-rowcount={rows.length + 1}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {start ? (
            <tr
              aria-hidden="true"
              className="mega-virtual-table__spacer"
              style={{ height: start * safeRowHeight }}
            >
              <td colSpan={columns.length} />
            </tr>
          ) : null}
          {visible.map((row, index) => (
            <tr
              key={getRowId(row)}
              aria-rowindex={start + index + 2}
              style={{ height: safeRowHeight }}
            >
              {columns.map((column) => {
                const value = cellValue(row, column);
                return (
                  <td
                    key={column.key}
                    data-numeric={column.numeric || undefined}
                  >
                    {column.render
                      ? column.render(value, row)
                      : (value as ReactNode)}
                  </td>
                );
              })}
            </tr>
          ))}
          {end < rows.length ? (
            <tr
              aria-hidden="true"
              className="mega-virtual-table__spacer"
              style={{ height: (rows.length - end) * safeRowHeight }}
            >
              <td colSpan={columns.length} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export interface EditableTableProps<Row extends object> extends BoxProps {
  rows: readonly Row[];
  columns: readonly DataColumn<Row>[];
  getRowId: (row: Row) => string;
  onCellChange: (rowId: string, key: string, value: string) => void;
  label?: string;
}

export function EditableTable<Row extends object>({
  rows,
  columns,
  getRowId,
  onCellChange,
  label = '편집 가능한 테이블',
  className = '',
  ...props
}: EditableTableProps<Row>) {
  return (
    <div {...props} className={`mega-editable-table ${className}`}>
      <Table aria-label={label}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableHeaderCell
                key={column.key}
                align={column.numeric ? 'end' : 'start'}
                style={{ width: column.width }}
              >
                {column.header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowId(row)}>
              {columns.map((column) => {
                const value = cellValue(row, column);
                return (
                  <TableCell
                    key={column.key}
                    numeric={column.numeric}
                    data-editable={column.editable || undefined}
                    style={{ width: column.width }}
                  >
                    {column.editable ? (
                      <Input
                        type={column.inputType ?? 'text'}
                        aria-label={`${String(column.header)} 편집`}
                        value={String(value ?? '')}
                        onChange={(event) =>
                          onCellChange(
                            getRowId(row),
                            column.key,
                            event.currentTarget.value,
                          )
                        }
                      />
                    ) : column.render ? (
                      column.render(value, row)
                    ) : (
                      (value as ReactNode)
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export interface TreeTableNode<Row extends object> {
  row: Row;
  children?: readonly TreeTableNode<Row>[];
}
export interface TreeTableProps<Row extends object> extends BoxProps {
  nodes: readonly TreeTableNode<Row>[];
  columns: readonly DataColumn<Row>[];
  getRowId: (row: Row) => string;
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  label?: string;
}

export function TreeTable<Row extends object>({
  nodes,
  columns,
  getRowId,
  expandedIds,
  defaultExpandedIds = [],
  onExpandedChange,
  label = '트리 테이블',
  className = '',
  ...props
}: TreeTableProps<Row>) {
  const [localExpanded, setLocalExpanded] = useState(defaultExpandedIds);
  const expanded = new Set(expandedIds ?? localExpanded);
  const flat: { node: TreeTableNode<Row>; level: number }[] = [];
  const visit = (items: readonly TreeTableNode<Row>[], level: number) =>
    items.forEach((node) => {
      flat.push({ node, level });
      if (node.children?.length && expanded.has(getRowId(node.row)))
        visit(node.children, level + 1);
    });
  visit(nodes, 1);
  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const ids = [...next];
    if (expandedIds === undefined) setLocalExpanded(ids);
    onExpandedChange?.(ids);
  };
  return (
    <div {...props} className={`mega-tree-table ${className}`}>
      <Table aria-label={label}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableHeaderCell key={column.key}>
                {column.header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {flat.map(({ node, level }) => {
            const id = getRowId(node.row);
            const branch = Boolean(node.children?.length);
            return (
              <TableRow key={id}>
                {columns.map((column, index) => {
                  const value = cellValue(node.row, column);
                  return (
                    <TableCell key={column.key} numeric={column.numeric}>
                      {index === 0 ? (
                        <span
                          className="mega-tree-table__cell"
                          style={{ paddingInlineStart: (level - 1) * 20 }}
                        >
                          {branch ? (
                            <button
                              type="button"
                              aria-label={`${String(value)} ${expanded.has(id) ? '접기' : '펼치기'}`}
                              onClick={() => toggle(id)}
                            >
                              {expanded.has(id) ? '−' : '+'}
                            </button>
                          ) : (
                            <span aria-hidden="true" />
                          )}
                          <span>
                            {column.render
                              ? column.render(value, node.row)
                              : (value as ReactNode)}
                          </span>
                        </span>
                      ) : column.render ? (
                        column.render(value, node.row)
                      ) : (
                        (value as ReactNode)
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export interface PivotTableProps<Row extends object> extends BoxProps {
  rows: readonly Row[];
  rowKey: keyof Row;
  columnKey: keyof Row;
  valueKey: keyof Row;
  aggregate?: 'sum' | 'count' | 'average';
  label?: string;
}

export function PivotTable<Row extends object>({
  rows,
  rowKey,
  columnKey,
  valueKey,
  aggregate = 'sum',
  label = '피벗 테이블',
  className = '',
  ...props
}: PivotTableProps<Row>) {
  const rowGroups = [
    ...new Set(rows.map((row) => String(row[rowKey] ?? ''))),
  ].sort();
  const columnGroups = [
    ...new Set(rows.map((row) => String(row[columnKey] ?? ''))),
  ].sort();
  const aggregateCell = (rowGroup: string, columnGroup: string) => {
    // ponytail: scan source rows per cell; pre-index only when measured pivot size warrants it.
    const matching = rows.filter(
      (row) =>
        String(row[rowKey] ?? '') === rowGroup &&
        String(row[columnKey] ?? '') === columnGroup,
    );
    if (aggregate === 'count') return matching.length;
    const values = matching
      .map((row) => Number(row[valueKey]))
      .filter(Number.isFinite);
    const sum = values.reduce((total, value) => total + value, 0);
    return aggregate === 'average'
      ? values.length
        ? sum / values.length
        : 0
      : sum;
  };
  return (
    <div {...props} className={`mega-pivot-table ${className}`}>
      <Table aria-label={label}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{String(rowKey)}</TableHeaderCell>
            {columnGroups.map((group) => (
              <TableHeaderCell key={group} align="end">
                {group}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rowGroups.map((rowGroup) => (
            <TableRow key={rowGroup}>
              <TableHeaderCell scope="row">{rowGroup}</TableHeaderCell>
              {columnGroups.map((columnGroup) => (
                <TableCell key={columnGroup} numeric>
                  {aggregateCell(rowGroup, columnGroup).toLocaleString('ko-KR')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export interface PropertyGridItem {
  name: string;
  label?: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  editable?: boolean;
}
export interface PropertyGridProps extends BoxProps {
  items: readonly PropertyGridItem[];
  onValueChange?: (name: string, value: string) => void;
  label?: string;
}
export function PropertyGrid({
  items,
  onValueChange,
  label = '속성',
  className = '',
  ...props
}: PropertyGridProps) {
  return (
    <div
      {...props}
      className={`mega-property-grid ${className}`}
      role="group"
      aria-label={label}
    >
      {items.map((item) => (
        <div className="mega-property-grid__row" key={item.name}>
          <div>
            <strong>{item.label ?? item.name}</strong>
            {item.description ? <small>{item.description}</small> : null}
          </div>
          <div>
            {item.editable ? (
              <Input
                aria-label={`${item.name} 값`}
                value={String(item.value ?? '')}
                onChange={(event) =>
                  onValueChange?.(item.name, event.currentTarget.value)
                }
              />
            ) : (
              item.value
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
export interface DataGridProps<Row extends object> extends BoxProps {
  rows: readonly Row[];
  columns: readonly DataColumn<Row>[];
  getRowId: (row: Row) => string;
  selectedIds?: readonly string[];
  defaultSelectedIds?: readonly string[];
  onSelectionChange?: (ids: string[]) => void;
  initialSort?: DataTableSort;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  manual?: boolean;
  loading?: boolean;
  error?: ReactNode;
  loadingMessage?: ReactNode;
  emptyMessage?: ReactNode;
  label?: string;
}
export function DataGrid<Row extends object>({
  rows,
  columns,
  getRowId,
  selectedIds,
  defaultSelectedIds = [],
  onSelectionChange,
  initialSort,
  sort: controlledSort,
  onSortChange,
  manual = false,
  loading = false,
  error,
  loadingMessage = '데이터를 불러오는 중이에요.',
  emptyMessage = '표시할 데이터가 없어요.',
  label = '데이터 그리드',
  className = '',
  ...props
}: DataGridProps<Row>) {
  const [localSelected, setLocalSelected] = useState(defaultSelectedIds);
  const [localSort, setLocalSort] = useState<DataTableSort | undefined>(() =>
    initialSort &&
    columns.some((column) => column.key === initialSort.key && column.sortable)
      ? initialSort
      : undefined,
  );
  const [active, setActive] = useState('0:0');
  const sort = controlledSort ?? localSort;
  const visibleRows = useMemo(() => {
    if (manual || !sort) return [...rows];
    const column = columns.find(
      (item) => item.key === sort.key && item.sortable,
    );
    if (!column) return [...rows];
    return [...rows].sort((a, b) => {
      const result = compareValues(cellValue(a, column), cellValue(b, column));
      return sort.direction === 'asc' ? result : -result;
    });
  }, [columns, manual, rows, sort]);
  const selected = new Set(selectedIds ?? localSelected);
  const visibleIds = visibleRows.map(getRowId);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected =
    !allSelected && visibleIds.some((id) => selected.has(id));
  const update = (ids: string[]) => {
    if (selectedIds === undefined) setLocalSelected(ids);
    onSelectionChange?.(ids);
  };
  const move = (
    event: KeyboardEvent<HTMLTableCellElement>,
    row: number,
    column: number,
  ) => {
    const offsets: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const nextRow = Math.max(
      0,
      Math.min(visibleRows.length - 1, row + offset[0]),
    );
    const nextColumn = Math.max(
      0,
      Math.min(columns.length - 1, column + offset[1]),
    );
    setActive(`${nextRow}:${nextColumn}`);
    event.currentTarget
      .closest('table')
      ?.querySelector<HTMLElement>(
        `[data-grid-cell="${nextRow}:${nextColumn}"]`,
      )
      ?.focus();
  };
  return (
    <div {...props} className={`mega-data-grid ${className}`}>
      <Table
        role="grid"
        aria-label={label}
        aria-multiselectable="true"
        aria-busy={loading || undefined}
      >
        <TableHead>
          <TableRow>
            <TableHeaderCell>
              <Checkbox
                shape="square"
                aria-label="모든 행 선택"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(event) => {
                  const next = new Set(selected);
                  visibleIds.forEach((id) =>
                    event.currentTarget.checked
                      ? next.add(id)
                      : next.delete(id),
                  );
                  update([...next]);
                }}
              />
            </TableHeaderCell>
            {columns.map((column) => {
              const direction =
                sort?.key === column.key ? sort.direction : 'none';
              return (
                <TableHeaderCell
                  key={column.key}
                  align={column.numeric ? 'end' : 'start'}
                  style={{ width: column.width }}
                  sortDirection={column.sortable ? direction : undefined}
                  onSort={
                    column.sortable
                      ? () => {
                          const next: DataTableSort = {
                            key: column.key,
                            direction:
                              sort?.key === column.key &&
                              sort.direction === 'asc'
                                ? 'desc'
                                : 'asc',
                          };
                          if (controlledSort === undefined) setLocalSort(next);
                          onSortChange?.(next);
                        }
                      : undefined
                  }
                >
                  {column.header}
                </TableHeaderCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading || error || !visibleRows.length ? (
            <TableEmpty colSpan={columns.length + 1}>
              <span role={error ? 'alert' : loading ? 'status' : undefined}>
                {error ?? (loading ? loadingMessage : emptyMessage)}
              </span>
            </TableEmpty>
          ) : (
            visibleRows.map((row, rowIndex) => {
              const id = getRowId(row);
              return (
                <TableRow key={id} selected={selected.has(id)}>
                  <TableCell>
                    <Checkbox
                      shape="square"
                      aria-label={`${id} 행 선택`}
                      checked={selected.has(id)}
                      onChange={(event) => {
                        const next = new Set(selected);
                        if (event.currentTarget.checked) next.add(id);
                        else next.delete(id);
                        update([...next]);
                      }}
                    />
                  </TableCell>
                  {columns.map((column, columnIndex) => {
                    const value = cellValue(row, column);
                    const position = `${rowIndex}:${columnIndex}`;
                    return (
                      <TableCell
                        key={column.key}
                        numeric={column.numeric}
                        style={{ width: column.width }}
                        role="gridcell"
                        tabIndex={active === position ? 0 : -1}
                        data-grid-cell={position}
                        onFocus={() => setActive(position)}
                        onKeyDown={(event) =>
                          move(event, rowIndex, columnIndex)
                        }
                      >
                        {column.render
                          ? column.render(value, row)
                          : (value as ReactNode)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export interface KanbanCard {
  id: string;
  title: ReactNode;
  description?: ReactNode;
}
export interface KanbanColumn {
  id: string;
  title: ReactNode;
  cards: readonly KanbanCard[];
}
export interface KanbanProps extends BoxProps {
  columns: readonly KanbanColumn[];
  onMove?: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  label?: string;
}
export function Kanban({
  columns,
  onMove,
  label = '칸반 보드',
  className = '',
  ...props
}: KanbanProps) {
  return (
    <div
      {...props}
      className={`mega-kanban ${className}`}
      role="region"
      aria-label={label}
    >
      {columns.map((column, columnIndex) => (
        <section
          key={column.id}
          className="mega-kanban__column"
          aria-labelledby={`mega-kanban-${column.id}`}
        >
          <h3 id={`mega-kanban-${column.id}`}>
            {column.title}
            <span>{column.cards.length}</span>
          </h3>
          <ul>
            {column.cards.map((card) => (
              <li key={card.id}>
                <strong>{card.title}</strong>
                {card.description ? <p>{card.description}</p> : null}
                {onMove && columns.length > 1 ? (
                  <div className="mega-kanban__actions">
                    {columnIndex > 0 ? (
                      <IconButton
                        size="sm"
                        onClick={() =>
                          onMove(
                            card.id,
                            column.id,
                            columns[columnIndex - 1]!.id,
                          )
                        }
                        label={`${String(card.title)} 이전 열로 이동`}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m15 6-6 6 6 6" />
                        </svg>
                      </IconButton>
                    ) : null}
                    {columnIndex < columns.length - 1 ? (
                      <IconButton
                        size="sm"
                        onClick={() =>
                          onMove(
                            card.id,
                            column.id,
                            columns[columnIndex + 1]!.id,
                          )
                        }
                        label={`${String(card.title)} 다음 열로 이동`}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                      </IconButton>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: ReactNode;
}
export interface CalendarProps extends BoxProps {
  month: string | Date;
  events?: readonly CalendarEvent[];
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  label?: string;
}
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
export function Calendar({
  month,
  events = [],
  selectedDate,
  onDateSelect,
  label = '달력',
  className = '',
  ...props
}: CalendarProps) {
  const [focusedDate, setFocusedDate] = useState(selectedDate ?? '');
  const first = dateFrom(month);
  first.setDate(1);
  const gridStart = new Date(first);
  gridStart.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
  const activeDate = days.some((date) => dateKey(date) === focusedDate)
    ? focusedDate
    : days.some((date) => dateKey(date) === selectedDate)
      ? selectedDate!
      : dateKey(first);
  const moveFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -(index % 7),
      End: 6 - (index % 7),
    };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    const target = days[index + offset];
    if (!target) return;
    event.preventDefault();
    const key = dateKey(target);
    setFocusedDate(key);
    event.currentTarget
      .closest('[role="grid"]')
      ?.querySelector<HTMLElement>(`[data-calendar-date="${key}"]`)
      ?.focus();
  };
  return (
    <section
      {...props}
      className={`mega-calendar ${className}`}
      aria-label={label}
    >
      <header>
        <h3>
          {first.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
          })}
        </h3>
      </header>
      <div className="mega-calendar__grid" role="grid">
        <div role="row" className="mega-calendar__week">
          {weekDays.map((day) => (
            <span role="columnheader" key={day}>
              {day}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, week) => (
          <div role="row" key={week}>
            {days.slice(week * 7, week * 7 + 7).map((date, day) => {
              const key = dateKey(date);
              const index = week * 7 + day;
              const dayEvents = events.filter((event) => event.date === key);
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  data-calendar-date={key}
                  data-outside={
                    date.getMonth() !== first.getMonth() || undefined
                  }
                  aria-selected={selectedDate === key}
                  tabIndex={activeDate === key ? 0 : -1}
                  aria-label={`${date.toLocaleDateString('ko-KR')}${dayEvents.length ? `, 일정 ${dayEvents.length}개` : ''}`}
                  onClick={() => {
                    setFocusedDate(key);
                    onDateSelect?.(key);
                  }}
                  onKeyDown={(event) => moveFocus(event, index)}
                >
                  <span>{date.getDate()}</span>
                  {dayEvents.slice(0, 2).map((event) => (
                    <small key={event.id}>{event.title}</small>
                  ))}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

export interface ScheduleAppointment {
  id: string;
  date: string;
  start: string;
  end: string;
  title: ReactNode;
  resource?: ReactNode;
}
export interface SchedulerProps extends BoxProps {
  appointments: readonly ScheduleAppointment[];
  onAppointmentClick?: (appointment: ScheduleAppointment) => void;
  label?: string;
}
export function Scheduler({
  appointments,
  onAppointmentClick,
  label = '일정',
  className = '',
  ...props
}: SchedulerProps) {
  const dates = [...new Set(appointments.map((item) => item.date))].sort();
  return (
    <section
      {...props}
      className={`mega-scheduler ${className}`}
      aria-label={label}
    >
      {dates.map((date) => (
        <section key={date}>
          <h3>
            {dateFrom(date).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </h3>
          <ol>
            {appointments
              .filter((item) => item.date === date)
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((item) => (
                <li key={item.id}>
                  <time dateTime={`${item.date}T${item.start}`}>
                    {item.start}–{item.end}
                  </time>
                  <button
                    type="button"
                    disabled={!onAppointmentClick}
                    onClick={() => onAppointmentClick?.(item)}
                  >
                    <strong>{item.title}</strong>
                    {item.resource ? <small>{item.resource}</small> : null}
                  </button>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </section>
  );
}

export interface GanttTask {
  id: string;
  title: ReactNode;
  start: string;
  end: string;
  progress?: number;
}
export interface GanttProps extends BoxProps {
  tasks: readonly GanttTask[];
  rangeStart?: string;
  rangeEnd?: string;
  label?: string;
}
export function Gantt({
  tasks,
  rangeStart,
  rangeEnd,
  label = '간트 차트',
  className = '',
  ...props
}: GanttProps) {
  const starts = tasks.map((task) => dateFrom(task.start).getTime());
  const ends = tasks.map((task) => dateFrom(task.end).getTime());
  const start = rangeStart
    ? dateFrom(rangeStart)
    : new Date(Math.min(...starts, Date.now()));
  const end = rangeEnd
    ? dateFrom(rangeEnd)
    : new Date(Math.max(...ends, start.getTime()));
  const total = Math.max(1, dayDifference(start, end) + 1);
  return (
    <section
      {...props}
      className={`mega-gantt ${className}`}
      aria-label={label}
    >
      <header>
        <time>{dateKey(start)}</time>
        <time>{dateKey(end)}</time>
      </header>
      <ol>
        {tasks
          .filter(
            (task) =>
              dateFrom(task.end) >= start && dateFrom(task.start) <= end,
          )
          .map((task) => {
            const offset = Math.max(
              0,
              dayDifference(start, dateFrom(task.start)),
            );
            const duration = Math.max(
              1,
              dayDifference(dateFrom(task.start), dateFrom(task.end)) + 1,
            );
            const progress = Number.isFinite(task.progress)
              ? Math.max(0, Math.min(100, task.progress!))
              : 0;
            return (
              <li key={task.id}>
                <span>{task.title}</span>
                <div
                  className="mega-gantt__track"
                  style={{
                    gridTemplateColumns: `repeat(${total}, minmax(16px, 1fr))`,
                  }}
                >
                  <div
                    className="mega-gantt__bar"
                    style={{
                      gridColumn: `${offset + 1} / span ${Math.max(1, Math.min(duration, total - offset))}`,
                    }}
                    aria-label={`${String(task.title)}: ${task.start}부터 ${task.end}, ${progress}% 완료`}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
      </ol>
    </section>
  );
}

export interface SpreadsheetProps extends BoxProps {
  cells: readonly (readonly unknown[])[];
  onCellChange?: (row: number, column: number, value: string) => void;
  columnLabels?: readonly string[];
  rowLabels?: readonly string[];
  label?: string;
}
export function Spreadsheet({
  cells,
  onCellChange,
  columnLabels,
  rowLabels,
  label = '스프레드시트',
  className = '',
  ...props
}: SpreadsheetProps) {
  const width = Math.max(0, ...cells.map((row) => row.length));
  const columnName = (index: number) => {
    if (columnLabels?.[index]) return columnLabels[index];
    let name = '';
    for (let value = index + 1; value; value = Math.floor((value - 1) / 26))
      name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
    return name;
  };
  const focusNext = (
    event: KeyboardEvent<HTMLInputElement>,
    row: number,
    column: number,
  ) => {
    const offsets: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const offset = offsets[event.key];
    if (!offset) return;
    if (
      !event.altKey &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      const { selectionStart, selectionEnd, value } = event.currentTarget;
      if (
        selectionStart === null ||
        selectionEnd === null ||
        selectionStart !== selectionEnd
      )
        return;
      if (event.key === 'ArrowLeft' && selectionStart !== 0) return;
      if (event.key === 'ArrowRight' && selectionEnd !== value.length) return;
    }
    event.preventDefault();
    event.currentTarget
      .closest('table')
      ?.querySelector<HTMLInputElement>(
        `[data-sheet-cell="${row + offset[0]}:${column + offset[1]}"]`,
      )
      ?.focus();
  };
  return (
    <div {...props} className={`mega-spreadsheet ${className}`}>
      <table aria-label={label}>
        <thead>
          <tr>
            <th aria-label="행 번호" />
            {Array.from({ length: width }, (_, column) => (
              <th key={column} scope="col">
                {columnName(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th scope="row">{rowLabels?.[rowIndex] ?? rowIndex + 1}</th>
              {Array.from({ length: width }, (_, columnIndex) => (
                <td key={columnIndex}>
                  <Input
                    data-sheet-cell={`${rowIndex}:${columnIndex}`}
                    aria-label={`${columnName(columnIndex)}${rowIndex + 1}`}
                    value={String(row[columnIndex] ?? '')}
                    readOnly={!onCellChange}
                    onChange={(event) =>
                      onCellChange?.(
                        rowIndex,
                        columnIndex,
                        event.currentTarget.value,
                      )
                    }
                    onKeyDown={(event) =>
                      focusNext(event, rowIndex, columnIndex)
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface OrganizationNode {
  id: string;
  label: ReactNode;
  detail?: ReactNode;
  children?: readonly OrganizationNode[];
}
export interface OrganizationChartProps extends BoxProps {
  root: OrganizationNode;
  label?: string;
}
export function OrganizationChart({
  root,
  label = '조직도',
  className = '',
  ...props
}: OrganizationChartProps) {
  const renderNode = (node: OrganizationNode): ReactNode => (
    <li key={node.id}>
      <article>
        <strong>{node.label}</strong>
        {node.detail ? <small>{node.detail}</small> : null}
      </article>
      {node.children?.length ? <ul>{node.children.map(renderNode)}</ul> : null}
    </li>
  );
  return (
    <div
      {...props}
      className={`mega-organization-chart ${className}`}
      role="region"
      aria-label={label}
    >
      <ul>{renderNode(root)}</ul>
    </div>
  );
}

export interface DataExplorerProps<Row extends object> extends BoxProps {
  rows: readonly Row[];
  columns: readonly DataColumn<Row>[];
  getRowId: (row: Row) => string;
  label?: string;
}
export function DataExplorer<Row extends object>({
  rows,
  columns,
  getRowId,
  label = '데이터 탐색기',
  className = '',
  ...props
}: DataExplorerProps<Row>) {
  const [query, setQuery] = useState('');
  const [visibleKeys, setVisibleKeys] = useState(() =>
    columns.map((column) => column.key),
  );
  const visible = columns.filter((column) => visibleKeys.includes(column.key));
  return (
    <section
      {...props}
      className={`mega-data-explorer ${className}`}
      aria-label={label}
    >
      <header>
        <Input
          type="search"
          aria-label="데이터 검색"
          placeholder="데이터 검색"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <span aria-live="polite">
          전체 {rows.length.toLocaleString('ko-KR')}개 행
        </span>
      </header>
      <fieldset>
        <legend>표시할 열</legend>
        {columns.map((column) => (
          <Checkbox
            key={column.key}
            shape="square"
            checked={visibleKeys.includes(column.key)}
            onChange={(event) =>
              setVisibleKeys((keys) =>
                event.currentTarget.checked
                  ? [...keys, column.key]
                  : keys.filter((key) => key !== column.key),
              )
            }
          >
            {column.header}
          </Checkbox>
        ))}
      </fieldset>
      {visible.length ? (
        <DataTable
          rows={rows}
          columns={visible}
          getRowId={getRowId}
          query={query}
          label={`${label} 결과`}
        />
      ) : (
        <p role="status">표시할 열을 선택해 주세요.</p>
      )}
    </section>
  );
}
