export type AuditSnapshot = Record<string, unknown> | null;

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /(password|secret|token|api[_-]?key|service[_-]?role|credential)/i;

export function sanitizeAuditValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) return REDACTED;
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeAuditValue(entryValue, entryKey),
      ]),
    );
  }
  return value;
}

export function buildAuditMetadata(
  before: AuditSnapshot,
  after: AuditSnapshot,
  extras: Record<string, unknown> = {},
) {
  const safeBefore = sanitizeAuditValue(before) as AuditSnapshot;
  const safeAfter = sanitizeAuditValue(after) as AuditSnapshot;
  const keys = new Set([
    ...Object.keys(safeBefore || {}),
    ...Object.keys(safeAfter || {}),
  ]);
  const changedFields = [...keys]
    .filter(
      (key) =>
        JSON.stringify(safeBefore?.[key]) !== JSON.stringify(safeAfter?.[key]),
    )
    .sort();
  return {
    ...(sanitizeAuditValue(extras) as Record<string, unknown>),
    schemaVersion: 1,
    before: safeBefore,
    after: safeAfter,
    changedFields,
  } as Record<string, unknown>;
}
