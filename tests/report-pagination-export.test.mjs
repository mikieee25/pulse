import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(
  new URL("../src/app/(dashboard)/reports/export/route.ts", import.meta.url),
  "utf8"
);
const csv = await readFile(
  new URL("../src/lib/csv.ts", import.meta.url),
  "utf8"
);
test("report export is authenticated, batched, and private", () => {
  assert.match(route, /requireProfile/);
  assert.match(route, /getEquipmentPage/);
  assert.match(route, /page <= 100/);
  assert.match(route, /private, no-store/);
  assert.match(csv, /replaceAll/);
  assert.match(csv, /\\ufeff/);
});
