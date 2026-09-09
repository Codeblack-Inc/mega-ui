import type { GridChange } from './data-grid-model';

export interface GridInput {
  rowId: string;
  columnKey: string;
  text: string;
  previousValue: unknown;
}
export interface GridDraftSnapshot<R extends object> {
  changes: readonly GridChange[];
  inputs: readonly GridInput[];
  bases: readonly R[];
}
const scalar = (value: unknown) =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' &&
    Number.isFinite(value) &&
    !Object.is(value, -0));
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const address = (value: Record<string, unknown>) =>
  typeof value.rowId === 'string' && typeof value.columnKey === 'string';
const key = (value: { rowId: string; columnKey: string }) =>
  JSON.stringify([value.rowId, value.columnKey]);

/** Recovery is intentionally restricted to lossless JSON rows and scalar cell values. */
export function serializeGridDraft<R extends object>(
  snapshot: GridDraftSnapshot<R>,
): string {
  const check = (value: unknown): void => {
    if (scalar(value)) return;
    if (Array.isArray(value)) {
      value.forEach(check);
      return;
    }
    if (record(value) && Object.getPrototypeOf(value) === Object.prototype) {
      Object.values(value).forEach(check);
      return;
    }
    throw new Error('Draft recovery requires lossless JSON data');
  };
  if (
    snapshot.changes.length + snapshot.inputs.length > 100_000 ||
    snapshot.changes.some(
      (c) => !scalar(c.value) || !scalar(c.previousValue),
    ) ||
    snapshot.inputs.some((c) => !scalar(c.previousValue))
  )
    throw new Error('Unsupported draft values');
  check(snapshot);
  const text = JSON.stringify({ version: 1, ...snapshot });
  if (text.length > 5_000_000) throw new Error('Draft is too large');
  return text;
}
export function parseGridDraft<R extends object>(
  text: string,
  getRowId: (row: R) => string,
): GridDraftSnapshot<R> {
  if (text.length > 5_000_000) throw new Error('Draft is too large');
  const value: unknown = JSON.parse(text);
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.changes) ||
    !Array.isArray(value.inputs) ||
    !Array.isArray(value.bases) ||
    value.changes.length + value.inputs.length > 100_000 ||
    value.bases.length > 100_000 ||
    !value.changes.every(
      (c) =>
        record(c) && address(c) && scalar(c.value) && scalar(c.previousValue),
    ) ||
    !value.inputs.every(
      (c) =>
        record(c) &&
        address(c) &&
        typeof c.text === 'string' &&
        scalar(c.previousValue),
    ) ||
    !value.bases.every(record)
  )
    throw new Error('Invalid draft');
  const snapshot = value as unknown as GridDraftSnapshot<R>;
  const ids = snapshot.bases.map(getRowId);
  const idSet = new Set(ids);
  if (
    ids.some((id) => typeof id !== 'string') ||
    idSet.size !== ids.length ||
    new Set(snapshot.changes.map(key)).size !== snapshot.changes.length ||
    new Set(snapshot.inputs.map(key)).size !== snapshot.inputs.length ||
    [...snapshot.changes, ...snapshot.inputs].some((c) => !idSet.has(c.rowId))
  )
    throw new Error('Invalid draft identities');
  return {
    changes: snapshot.changes,
    inputs: snapshot.inputs,
    bases: snapshot.bases,
  };
}
