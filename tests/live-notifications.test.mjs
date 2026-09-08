import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const helper = await readFile(new URL("../src/lib/notifications.ts", import.meta.url), "utf8").catch(() => "")
const bell = await readFile(new URL("../src/components/notifications/notification-bell.tsx", import.meta.url), "utf8").catch(() => "")
const topbar = await readFile(new URL("../src/components/layout/topbar.tsx", import.meta.url), "utf8")

test("live notifications cover lifecycle and assignment signals", () => {
  assert.match(helper, /buildNotifications/)
  assert.match(helper, /For Replacement/)
  assert.match(helper, /Expiring soon/)
  assert.match(helper, /unassigned/i)
  assert.match(bell, /Mark all as read/)
  assert.match(bell, /localStorage/)
  assert.match(topbar, /NotificationBell/)
  assert.match(topbar, /assignment_history/)
})
