import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { buildNotifications } from "../src/lib/notifications.ts"

const bell = await readFile(new URL("../src/components/notifications/notification-bell.tsx", import.meta.url), "utf8").catch(() => "")
const topbar = await readFile(new URL("../src/components/layout/topbar.tsx", import.meta.url), "utf8")

test("live notifications cover lifecycle and assignment signals", () => {
  const equipment = [
    { id: "1", status: "Active", condition_state: "Good", year_acquired: 2020, assigned_to: "person-1", assignee_id: null, equipment_categories: { name: "Laptop" } },
    { id: "2", status: "Active", condition_state: "Good", year_acquired: 2024, assigned_to: "person-2", assignee_id: null, equipment_categories: { name: "Tablet" } },
    { id: "3", status: "Active", condition_state: "Good", year_acquired: 2026, assigned_to: null, assignee_id: null, equipment_categories: { name: "Camera" } },
  ]
  const notifications = buildNotifications(equipment, [], new Date("2026-09-11"))

  assert.deepEqual(notifications.map((item) => item.kind), ["replacement", "expiring", "unassigned"])
  assert.match(bell, /Mark all as read/)
  assert.match(bell, /localStorage/)
  assert.match(topbar, /NotificationBell/)
  assert.match(topbar, /assignment_history/)
})
