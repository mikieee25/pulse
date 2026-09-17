import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboard = await readFile(
  new URL("../src/app/(dashboard)/page.tsx", import.meta.url),
  "utf8"
);
const loading = await readFile(
  new URL("../src/app/(dashboard)/loading.tsx", import.meta.url),
  "utf8"
);
const lazy = await readFile(
  new URL(
    "../src/components/dashboard/dashboard-charts-lazy.tsx",
    import.meta.url
  ),
  "utf8"
);
test("dashboard charts are progressively loaded with accessible skeletons", () => {
  assert.match(dashboard, /Suspense/);
  assert.match(loading, /aria-label/);
  assert.match(lazy, /dynamic/);
  assert.match(lazy, /ssr: false/);
});
