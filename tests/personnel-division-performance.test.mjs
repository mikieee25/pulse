import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const personnel = await readFile(
  new URL("../src/app/(dashboard)/personnel/page.tsx", import.meta.url),
  "utf8"
);
const divisions = await readFile(
  new URL("../src/app/(dashboard)/divisions/page.tsx", import.meta.url),
  "utf8"
);
const facade = await readFile(
  new URL("../src/lib/inventory-queries.ts", import.meta.url),
  "utf8"
);
test("directory pages use compact summary RPCs", () => {
  assert.match(personnel, /getPersonnelSummary/);
  assert.match(personnel, /getPersonnelPage/);
  assert.doesNotMatch(personnel, /equipment!equipment_assigned_to_fkey/);
  assert.match(divisions, /getDivisionSummary/);
  assert.match(facade, /pulse_personnel_summary/);
  assert.match(facade, /pulse_division_summary/);
  assert.doesNotMatch(divisions, /equipment \(id, status/);
});
