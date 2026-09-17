export function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  const body = rows.map((row) =>
    headers.map((header) => csvEscape(row[header])).join(",")
  );
  return `\ufeff${[headers.join(","), ...body].join("\r\n")}`;
}
