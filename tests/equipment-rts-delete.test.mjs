import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { formatActivityMessage } from "../src/lib/activity-format.ts";

const read = async (path) => {
  try {
    return await readFile(new URL(path, import.meta.url), "utf8");
  } catch {
    return "";
  }
};

const filters = await read("../src/lib/equipment-filters.ts");
const queries = await read("../src/lib/inventory-queries.ts");
const actions = await read("../src/app/actions/equipment.ts");
const actionUi = await read("../src/components/equipment/equipment-actions.tsx");
const columns = await read("../src/components/equipment/columns.tsx");
const detail = await read("../src/app/(dashboard)/equipment/[id]/page.tsx");
const migration = await readFile(
  new URL(
    "../supabase/migrations/20260917033426_equipment_rts_and_delete.sql",
    import.meta.url
  ),
  "utf8"
);

test("RTS remains an independent equipment tag", () => {
  assert.match(migration, /is_rts\s+boolean\s+not null\s+default\s+false/i);
  assert.match(migration, /set_equipment_rts/i);
  assert.match(migration, /remarks[\s\S]*for rts/i);
  assert.match(columns, /Return to Store/);
  assert.match(detail, /Return to Store/);
  assert.match(actionUi, /RTS|Return to Store/);
});

test("equipment search and filters expose RTS without changing lifecycle status", () => {
  assert.match(filters, /rts/);
  assert.match(filters, /EquipmentRtsFilter/);
  assert.match(queries, /p_rts/);
  assert.match(queries, /is_rts/);
  assert.match(migration, /p_rts/);
  assert.match(migration, /display_status/);
});

test("Admin deletion is guarded and assignment history is deleted atomically", () => {
  assert.match(actions, /export async function deleteEquipment/);
  assert.match(actions, /requireProfile\("Admin"\)/);
  assert.match(actions, /delete_equipment/);
  assert.match(migration, /delete from public\.assignment_history/i);
  assert.match(migration, /delete from public\.equipment/i);
  assert.match(migration, /security invoker/i);
  assert.match(actionUi, /Delete equipment/);
});

test("RTS activity is readable as a separate event", () => {
  const message = formatActivityMessage({
    id: "activity-1",
    actorUserId: "user-1",
    actorName: "Admin",
    actorEmail: "admin@example.com",
    action: "state_changed",
    entityType: "equipment",
    entityId: "equipment-1",
    entityLabel: "Laptop ABC",
    divisionId: null,
    divisionName: null,
    metadata: { is_rts: true },
    createdAt: "2026-09-17T00:00:00.000Z",
  });
  assert.match(message, /marked Laptop ABC RTS/);
});
