import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL(
    "../supabase/migrations/20260917000234_optimize_inventory_read_paths.sql",
    import.meta.url
  ),
  "utf8"
);

test("inventory read migration defines indexed bounded paths", () => {
  assert.match(migration, /equipment_category_id_idx/);
  assert.match(migration, /equipment_division_id_idx/);
  assert.match(migration, /assignment_history_equipment_time_idx/);
  assert.match(migration, /pulse_effective_equipment_status/);
  assert.match(migration, /pulse_inventory_dashboard/);
  assert.match(migration, /pulse_inventory_plan/);
  assert.match(migration, /pulse_search_equipment/);
  assert.match(migration, /pulse_notification_snapshot/);
  assert.match(migration, /pulse_personnel_summary/);
  assert.match(migration, /pulse_search_personnel/);
  assert.match(migration, /pulse_division_summary/);
});

test("search functions are bounded and authorization is explicit", () => {
  assert.match(migration, /security invoker/i);
  assert.match(
    migration,
    /limit least\(greatest\(coalesce\(p_page_size, 25\), 1\), 50\)/
  );
  assert.match(
    migration,
    /grant execute on function public\.pulse_search_equipment.*authenticated/i
  );
  assert.match(
    migration,
    /grant execute on function public\.pulse_search_personnel.*authenticated/i
  );
  assert.match(
    migration,
    /grant execute on function public\.pulse_inventory_dashboard\(uuid, date\) to service_role/i
  );
});
