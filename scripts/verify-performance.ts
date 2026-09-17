import { createClient } from "@supabase/supabase-js";
import { equipmentDisplayStatus } from "../src/lib/pulse";

process.loadEnvFile?.(".env.local");

async function main() {
  const admin =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
      : null;
  if (!admin) throw new Error("Supabase environment is incomplete");
  const asOf = new Date().toISOString().slice(0, 10);
  const dashboard = await admin.rpc("pulse_inventory_dashboard", {
    p_division_scope: null,
    p_as_of: asOf,
  });
  if (dashboard.error) throw dashboard.error;
  const dashboardBytes = Buffer.byteLength(
    JSON.stringify(dashboard.data || {}),
    "utf8"
  );
  if (dashboardBytes >= 100_000)
    throw new Error(`Dashboard payload too large: ${dashboardBytes} bytes`);
  const notifications = await admin.rpc("pulse_notification_snapshot", {
    p_division_scope: null,
    p_as_of: asOf,
  });
  if (notifications.error) throw notifications.error;
  const recent = Array.isArray(
    (notifications.data as { recentAssignments?: unknown[] } | null)
      ?.recentAssignments
  )
    ? (notifications.data as { recentAssignments: unknown[] }).recentAssignments
    : [];
  if (recent.length > 5)
    throw new Error(
      "Notification snapshot returned more than five activity rows"
    );
  const equipment = await admin.rpc("pulse_search_equipment", {
    p_query: null,
    p_category: null,
    p_division: null,
    p_brand: null,
    p_status: null,
    p_assignment: null,
    p_page: 1,
    p_page_size: 50,
  });
  if (equipment.error) throw equipment.error;
  if ((equipment.data || []).length > 50)
    throw new Error("Equipment search exceeded the 50-row bound");
  const personnel = await admin.rpc("pulse_search_personnel", {
    p_query: null,
    p_division: null,
    p_status: null,
    p_assignment: null,
    p_page: 1,
    p_page_size: 50,
  });
  if (personnel.error) throw personnel.error;
  if ((personnel.data || []).length > 50)
    throw new Error("Personnel search exceeded the 50-row bound");
  if (
    equipmentDisplayStatus(
      "Active",
      "Good",
      3,
      2020,
      new Date("2026-09-11")
    ) !== "For Replacement"
  )
    throw new Error("Lifecycle parity check failed");
  console.log(
    JSON.stringify({
      dashboardBytes,
      equipmentRows: equipment.data?.length || 0,
      personnelRows: personnel.data?.length || 0,
      recentActivityRows: recent.length,
      lifecycle: "ok",
    })
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Performance verification failed"
  );
  process.exitCode = 1;
});
