export function quoteDelimitedCell(
  value: unknown,
  delimiter: string,
  safe: boolean,
): string {
  let text = String(value ?? '');
  // Spreadsheet applications interpret these prefixes as formulas, even in quoted CSV.
  if (safe && typeof value !== 'number' && /^[\s\uFEFF]*[=+\-@]/.test(text))
    text = `'${text}`;
  return text.includes(delimiter) || /["\r\n]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}
