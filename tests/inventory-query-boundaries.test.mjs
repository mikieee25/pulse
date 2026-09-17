import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../src/lib/inventory-queries.ts", import.meta.url),
  "utf8"
);

test("inventory facade exports bounded read APIs", () => {
  assert.match(source, /DEFAULT_PAGE_SIZE = 25/);
  assert.match(source, /MAX_PAGE_SIZE = 50/);
  for (const name of [
    "getDashboardSnapshot",
    "getPlanningSnapshot",
    "getEquipmentPage",
    "getNotificationSnapshot",
    "getEquipmentCategorySnapshot",
    "getReportPage",
    "getPersonnelPage",
  ])
    assert.match(source, new RegExp(`export async function ${name}`));
  assert.match(source, /unstable_cache/);
  assert.match(source, /Math\.min\(\s*Math\.max/);
});
