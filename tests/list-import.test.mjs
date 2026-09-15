import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const { buildImportPlan, normalizeName } = await import("../scripts/import-list-json.ts")
const source = JSON.parse(await readFile(new URL("../list.json", import.meta.url), "utf8"))
const importerSource = await readFile(new URL("../scripts/import-list-json.ts", import.meta.url), "utf8")

test("list import normalizes source names and categories without losing rows", () => {
  const plan = buildImportPlan(source, [], [])

  assert.equal(plan.rows.length, 451)
  assert.equal(plan.categories.length, 16)
  assert.equal(plan.sameAsCustodianAssignees, 451)
  assert.equal(plan.duplicateSerialGroups.length, 8)
  assert.equal(normalizeName("José A. Cruz"), "joseacruz")
})

test("new categories created by list import use the shared three-year lifespan", () => {
  assert.match(importerSource, /lifespan_years:\s*3/)
})

test("list import keeps unknown category labels intact after normalization", () => {
  assert.match(importerSource, /canonicalEquipmentCategory/)
  assert.equal(buildImportPlan([
    { Category: "Dynamic UPS", Description: "Test UPS", "Serial No.": "UPS-1", Custodian: "", Assignee: "", Division: "OD" },
  ], [], [{ id: "od-id", code: "OD" }]).categories[0], "Dynamic UPS")
})

test("list import maps the two OD source division labels to OD", () => {
  const plan = buildImportPlan(source, [], [
    { id: "od-id", code: "OD" },
    { id: "afetd-id", code: "AFETD" },
    { id: "epred-id", code: "EPRED" },
    { id: "epmpd-id", code: "EPMPD" },
    { id: "evimd-id", code: "EVIMD" },
    { id: "epsmd-id", code: "EPSMD" },
    { id: "ned-id", code: "NED" },
  ])
  assert.equal(plan.unresolvedDivisions.length, 0)
})

test("list import resolves known personnel name variants", () => {
  const plan = buildImportPlan([
    { Category: "GIMBAL", Description: "Test gimbal", "Serial No.": "TEST-1", Custodian: "Patrick T. Aquino", Assignee: "", Division: "OD" },
  ], [
    { id: "person-id", full_name: "Patrick T. Aquino, CESO III", division_id: "od-id", position: "Director IV", plantilla_status: "Regular" },
  ], [{ id: "od-id", code: "OD" }])

  assert.equal(plan.importableRows[0]?.assigned_to, "person-id")
})
