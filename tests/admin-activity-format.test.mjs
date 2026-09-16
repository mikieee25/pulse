import assert from "node:assert/strict"
import test from "node:test"
import { formatActivityMessage } from "../src/lib/activity-format.ts"

const timestamp = "2026-09-16T06:14:00.000Z"

test("formats equipment creation with actor and timestamp", () => {
  assert.match(formatActivityMessage({ action: "created", entityType: "equipment", entityLabel: "Laptop Dell 5450", actorName: "Juan Dela Cruz", actorEmail: "juan@example.com", createdAt: timestamp }), /Juan Dela Cruz .*added Laptop Dell 5450/i)
})

test("formats personnel updates and assignments", () => {
  assert.match(formatActivityMessage({ action: "updated", entityType: "personnel", entityLabel: "Maria Santos", actorName: "Admin", actorEmail: "admin@example.com", createdAt: timestamp }), /Admin .*updated Maria Santos/i)
  assert.match(formatActivityMessage({ action: "assigned", entityType: "equipment", entityLabel: "Camera Sony", actorName: "Admin", actorEmail: "admin@example.com", createdAt: timestamp }), /assigned Camera Sony/i)
})

test("formats deletions", () => {
  assert.match(formatActivityMessage({ action: "deleted", entityType: "personnel", entityLabel: "Old User", actorName: "Admin", actorEmail: "admin@example.com", createdAt: timestamp }), /deleted Old User/i)
})

test("activity messages keep the entity label readable", () => {
  assert.match(formatActivityMessage({ action: "updated", entityType: "equipment", entityLabel: "Laptop", actorName: "Admin", actorEmail: "admin@example.com", divisionName: "Finance", createdAt: timestamp }), /updated Laptop/)
})
