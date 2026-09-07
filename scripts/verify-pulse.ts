import assert from "node:assert/strict"
import { lifecycleStatus, suggestedInitials } from "../src/lib/pulse"

assert.equal(lifecycleStatus("Active", "Laptop", 2020, new Date("2026-09-07")), "For Replacement")
assert.equal(lifecycleStatus("Active", "Laptop", 2024, new Date("2026-09-07")), "Expiring soon")
assert.equal(lifecycleStatus("Active", "Drone", 2018, new Date("2026-09-07")), "Active")
assert.equal(lifecycleStatus("Retired", "Laptop", 2024, new Date("2026-09-07")), "Retired")
assert.equal(suggestedInitials("Michael Angelo O. Guarin"), "MAOG")
console.log("PULSE domain verification passed")
