import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { buildNotifications } from "../src/lib/notifications.ts"

const bell = await readFile(new URL("../src/components/notifications/notification-bell.tsx", import.meta.url), "utf8").catch(() => "")
const topbar = await readFile(new URL("../src/components/layout/topbar.tsx", import.meta.url), "utf8")

test("live notifications cover lifecycle and assignment signals", () => {
  const equipment = [
    { id: "1", status: "Active", condition_state: "Good", year_acquired: 2020, assigned_to: "person-1", assignee_id: null, equipment_categories: { name: "Laptop", lifespan_years: 3 } },
    { id: "2", status: "Active", condition_state: "Good", year_acquired: 2024, assigned_to: "person-2", assignee_id: null, equipment_categories: { name: "Tablet", lifespan_years: 3 } },
    { id: "3", status: "Active", condition_state: "Good", year_acquired: 2026, assigned_to: null, assignee_id: null, equipment_categories: { name: "Camera", lifespan_years: null } },
  ]
  const notifications = buildNotifications(equipment, [], new Date("2026-09-11"))

  assert.deepEqual(notifications.map((item) => item.kind), ["replacement", "expiring", "unassigned"])
  const replacementEquipment = { id: "4", status: "Active", condition_state: "Good", year_acquired: 2019, assigned_to: "person-3", assignee_id: null, equipment_categories: { name: "Laptop", lifespan_years: 3 } }
  const first = buildNotifications(equipment, [], new Date("2026-09-11"))
  const second = buildNotifications([...equipment, replacementEquipment], [], new Date("2026-09-11"))
  assert.equal(first[0].id, buildNotifications(equipment, [], new Date("2026-09-11"))[0].id)
  assert.notEqual(first[0].id, second[0].id)
  assert.equal(first.find((item) => item.kind === "replacement")?.href, "/equipment?status=For+Replacement")
  assert.equal(first.find((item) => item.kind === "unassigned")?.href, "/equipment?assignment=unassigned")
  assert.match(bell, /Mark all as read/)
  assert.match(bell, /localStorage/)
  assert.match(topbar, /NotificationBell/)
  assert.match(topbar, /assignment_history/)
})
