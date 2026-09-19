import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { buildAuditMetadata, sanitizeAuditValue } from "../src/lib/activity-audit.ts"
import { equipmentDisplayStatus, lifecycleStatus } from "../src/lib/pulse.ts"

const activityUi = await readFile(new URL("../src/components/admin/admin-activity.tsx", import.meta.url), "utf8")
const detailPage = await readFile(new URL("../src/app/(dashboard)/equipment/[id]/page.tsx", import.meta.url), "utf8")
const actionUi = await readFile(new URL("../src/components/equipment/equipment-actions.tsx", import.meta.url), "utf8")

test("audit metadata records redacted before/after snapshots and changed fields", () => {
  const metadata = buildAuditMetadata(
    { model: "Old", password: "secret", assigned_to: null },
    { model: "New", password: "new-secret", assigned_to: "person-1" },
    { source: "equipment.update", reason: "correction" },
  )
  assert.equal(metadata.schemaVersion, 1)
  assert.deepEqual(metadata.changedFields, ["assigned_to", "model"])
  assert.equal(metadata.before.password, "[REDACTED]")
  assert.equal(metadata.after.password, "[REDACTED]")
  assert.equal(metadata.source, "equipment.update")
})

test("audit sanitizer redacts nested secrets", () => {
  assert.deepEqual(sanitizeAuditValue({ token: "x", nested: { api_key: "y", safe: 1 } }), {
    token: "[REDACTED]",
    nested: { api_key: "[REDACTED]", safe: 1 },
  })
})

test("lifecycle status can differ from stored condition", () => {
  assert.equal(equipmentDisplayStatus("Active", "Good", 3, 2022, new Date("2026-09-17")), "For Replacement")
  assert.equal(lifecycleStatus("Active", 3, 2022, new Date("2026-09-17")), "For Replacement")
})

test("activity UI exposes audit detail and event/entity filters", () => {
  assert.match(activityUi, /View details/)
  assert.match(activityUi, /Event ID/)
  assert.match(activityUi, /Entity ID/)
  assert.match(activityUi, /name="event"/)
  assert.match(activityUi, /name="entityId"/)
  assert.match(activityUi, /title="User status"[\s\S]*TablePageSizeSelect/)
  assert.match(activityUi, /size-9 min-w-9 shrink-0 aspect-square/)
  assert.match(activityUi, /From date/)
  assert.match(activityUi, /To date/)
})

test("user status paginates rows when the page size is smaller than the user list", () => {
  assert.match(activityUi, /const \[statusPage, setStatusPage\] = useState\(1\)/)
  assert.match(activityUi, /statusTotalPages/)
  assert.match(activityUi, /Previous/)
  assert.match(activityUi, /Next/)
  assert.match(activityUi, /Showing \{statusStart\}-\{statusEnd\} of \{statuses\.data\.length\} users/)
})

test("equipment detail labels condition separately from lifecycle status", () => {
  assert.match(actionUi, /Condition/)
  assert.match(detailPage, /Lifecycle status/)
  assert.match(detailPage, /lifecycle basis|3-year lifespan|lifecycle/i)
})
