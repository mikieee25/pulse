import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../src/app/(dashboard)/budget/page.tsx", import.meta.url),
  "utf8"
);
const formSource = await readFile(
  new URL("../src/components/budget/category-cost-form.tsx", import.meta.url),
  "utf8"
).catch(() => "");

test("budget page exposes the refreshed planning hierarchy", () => {
  assert.match(source, /aria-labelledby="budget-overview-title"/);
  assert.match(source, /aria-label="Fiscal year"/);
  assert.match(source, /<caption className="sr-only">/);
  assert.match(source, /sticky top-0/);
  assert.match(source, /Missing rate/);
});

test("budget cost saves expose inline pending and error feedback", () => {
  assert.match(source, /CategoryCostForm/);
  assert.match(formSource, /useActionState/);
  assert.match(formSource, /pending/);
  assert.match(formSource, /role="alert"/);
  assert.match(formSource, /role="status"/);
});
