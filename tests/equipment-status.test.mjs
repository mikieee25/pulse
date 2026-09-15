import assert from "node:assert/strict"
import test from "node:test"

import { equipmentDisplayStatus, inventoryCardStats, needsReplacement } from "../src/lib/pulse.ts"

const today = new Date("2026-09-11")

test("equipment status reflects lifecycle and manual condition signals", () => {
  assert.equal(equipmentDisplayStatus("Active", "Good", 3, 2020, today), "For Replacement")
  assert.equal(equipmentDisplayStatus("Active", "Good", 2, 2025, today), "Expiring soon")
  assert.equal(equipmentDisplayStatus("Active", "Good", null, 2020, today), "Active")
  assert.equal(equipmentDisplayStatus("Active", "For Replacement", null, 2026, today), "For Replacement")
  assert.equal(equipmentDisplayStatus("Active", "Broken", null, 2026, today), "Broken")
  assert.equal(equipmentDisplayStatus("Retired", "Broken", 3, 2020, today), "Retired")
})

test("replacement totals include lifecycle, manual replacement, and broken units", () => {
  assert.equal(needsReplacement("Active", "Good", 3, 2020, today), true)
  assert.equal(needsReplacement("Active", "For Replacement", null, 2026, today), true)
  assert.equal(needsReplacement("Active", "Broken", null, 2026, today), true)
  assert.equal(needsReplacement("Active", "Good", null, 2026, today), false)
  assert.equal(needsReplacement("Retired", "Broken", 3, 2020, today), false)
})

test("active card includes operational replacement and expiry units, but not broken or retired units", () => {
  const stats = inventoryCardStats([
    { status: "Active", condition_state: "Good", lifespan_years: null, year_acquired: 2026 },
    { status: "Active", condition_state: "For Replacement", lifespan_years: null, year_acquired: 2026 },
    { status: "Active", condition_state: "Good", lifespan_years: 3, year_acquired: 2024 },
    { status: "Active", condition_state: "Broken", lifespan_years: null, year_acquired: 2026 },
    { status: "Retired", condition_state: "Good", lifespan_years: 3, year_acquired: 2026 },
  ], new Date("2026-09-11"))

  assert.deepEqual(stats, { total: 5, active: 3, replacement: 2, expiring: 1, broken: 1 })
})
