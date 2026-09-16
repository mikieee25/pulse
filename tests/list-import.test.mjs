import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const { buildImportPlan, normalizeName } = await import("../scripts/import-list-json.ts")
const source = JSON.parse(await readFile(new URL("../list.json", import.meta.url), "utf8"))
const importerSource = await readFile(new URL("../scripts/import-list-json.ts", import.meta.url), "utf8")

test("list import normalizes source names and categories without losing rows", () => {
  const plan = buildImportPlan(source, [], [])

  assert.equal(plan.rows.length, source.length)
  assert.equal(plan.categories.length, 15)
  assert.equal(plan.sameAsCustodianAssignees, source.length)
  assert.equal(plan.duplicateSerialGroups.length, 3)
  assert.equal(normalizeName("José A. Cruz"), "joseacruz")
})

test("list import uses stable row identity instead of source row numbers", () => {
  const original = buildImportPlan([
    { Category: "Laptop", Description: "Existing model", "Serial No.": "EXISTING-1", Custodian: "", Assignee: "", Division: "OD" },
  ], [], [{ id: "od-id", code: "OD" }])
  const marker = original.rows[0].remarks.match(/\[Import:list\.json:[a-f0-9]{12}\]/)[0]
  const plan = buildImportPlan([
    { Category: "Camera", Description: "New model", "Serial No.": "NEW-1", Custodian: "", Assignee: "", Division: "OD" },
    { Category: "Laptop", Description: "Existing model", "Serial No.": "EXISTING-1", Custodian: "", Assignee: "", Division: "OD" },
  ], [], [{ id: "od-id", code: "OD" }], new Set([marker]))

  assert.equal(plan.importableRows.length, 1)
  assert.equal(plan.importableRows[0].serial_number, "NEW-1")
})

test("list import does not reuse row numbers from a replaced source file", () => {
  const plan = buildImportPlan([
    { Category: "Laptop", Description: "New model", "Serial No.": "NEW-1", Custodian: "", Assignee: "", Division: "OD" },
  ], [], [{ id: "od-id", code: "OD" }], new Set(["[Import:list.json row 1]"]))

  assert.equal(plan.importableRows.length, 1)
  assert.match(plan.importableRows[0].remarks, /\[Import:list\.json:[a-f0-9]{12}\]/)
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
  const plan = buildImportPlan([
    { Category: "Laptop", Description: "OD item", "Serial No.": "OD-1", Custodian: "", Assignee: "", Division: "EUMB" },
    { Category: "Laptop", Description: "OD item", "Serial No.": "OD-2", Custodian: "", Assignee: "", Division: "EUMB-OD" },
  ], [], [
    { id: "od-id", code: "OD" },
  ])
  assert.equal(plan.unresolvedDivisions.length, 0)
  assert.deepEqual(plan.rows.map((row) => row.division_id), ["od-id", "od-id"])
})

test("list import resolves known personnel name variants", () => {
  const plan = buildImportPlan([
    { Category: "GIMBAL", Description: "Test gimbal", "Serial No.": "TEST-1", Custodian: "Patrick T. Aquino", Assignee: "", Division: "OD" },
  ], [
    { id: "person-id", full_name: "Patrick T. Aquino, CESO III", division_id: "od-id", position: "Director IV", plantilla_status: "Regular" },
  ], [{ id: "od-id", code: "OD" }])

  assert.equal(plan.importableRows[0]?.assigned_to, "person-id")
})
