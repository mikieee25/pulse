import assert from "node:assert/strict"
import test from "node:test"

import { equipmentDisplayStatus, needsReplacement } from "../src/lib/pulse.ts"

const today = new Date("2026-09-11")

test("equipment status reflects lifecycle and manual condition signals", () => {
  assert.equal(equipmentDisplayStatus("Active", "Good", "Laptop", 2020, today), "For Replacement")
  assert.equal(equipmentDisplayStatus("Active", "For Replacement", "Camera", 2026, today), "For Replacement")
  assert.equal(equipmentDisplayStatus("Active", "Broken", "Camera", 2026, today), "Broken")
  assert.equal(equipmentDisplayStatus("Retired", "Broken", "Laptop", 2020, today), "Retired")
})

test("replacement totals include lifecycle, manual replacement, and broken units", () => {
  assert.equal(needsReplacement("Active", "Good", "Laptop", 2020, today), true)
  assert.equal(needsReplacement("Active", "For Replacement", "Camera", 2026, today), true)
  assert.equal(needsReplacement("Active", "Broken", "Camera", 2026, today), true)
  assert.equal(needsReplacement("Active", "Good", "Camera", 2026, today), false)
  assert.equal(needsReplacement("Retired", "Broken", "Laptop", 2020, today), false)
})
