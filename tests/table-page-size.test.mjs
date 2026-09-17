import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSizeSource = await readFile(
  new URL(
    "../src/components/layout/table-page-size-select.tsx",
    import.meta.url
  ),
  "utf8"
);
const tableSources = await Promise.all(
  [
    "../src/components/equipment/equipment-filter-bar.tsx",
    "../src/components/personnel/personnel-filter-bar.tsx",
    "../src/components/divisions/divisions-table.tsx",
    "../src/components/admin/admin-activity.tsx",
    "../src/components/admin/user-management.tsx",
    "../src/app/(dashboard)/summary/summary-content.tsx",
    "../src/app/(dashboard)/budget/page.tsx",
    "../src/app/(dashboard)/page.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8"))
);

test("shared table page-size control exposes the supported choices", () => {
  assert.match(pageSizeSource, /TablePageSizeSelect/);
  assert.match(pageSizeSource, /10/);
  assert.match(pageSizeSource, /25/);
  assert.match(pageSizeSource, /50/);
  assert.match(pageSizeSource, /aria-label/);
});

test("server-backed page-size changes use client navigation instead of form submission", () => {
  assert.match(pageSizeSource, /useRouter/);
  assert.match(pageSizeSource, /router\.replace/);
  assert.match(pageSizeSource, /next\.delete\("page"\)/);
  assert.doesNotMatch(pageSizeSource, /requestSubmit/);
});

test("every application data table uses the shared page-size control", () => {
  for (const source of tableSources)
    assert.match(source, /TablePageSizeSelect/);
});
