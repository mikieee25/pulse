import "server-only";

import { unstable_cache } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { EquipmentFilters } from "@/lib/equipment-filters";
import type { AppRole } from "@/lib/auth";
import type {
  EquipmentDisplayStatus,
  StoredEquipmentStatus,
  PlantillaStatus,
} from "@/lib/pulse";
import { PULSE_CACHE_TAGS } from "@/lib/cache-tags";

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 50;

export type EquipmentPageRow = {
  id: string;
  model: string | null;
  brand: string | null;
  serial_number: string | null;
  year_acquired: number | null;
  status: StoredEquipmentStatus;
  condition_state: string;
  is_rts: boolean;
  division: { code: string } | null;
  personnel: { full_name: string } | null;
  assignee: { full_name: string } | null;
  equipment_categories: { name: string; lifespan_years: number | null } | null;
  displayStatus: EquipmentDisplayStatus;
};

export type InventoryPage<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
};
export type DashboardSnapshot = {
  metrics: {
    total: number;
    active: number;
    replacement: number;
    expiring: number;
    broken: number;
  };
  statusCounts: Array<{ name: string; value: number }>;
  divisionCounts: Array<{ name: string; count: number }>;
  replacementMatrix: Array<Record<string, unknown>>;
};
export type PlanningRow = {
  division_code: string;
  category_id: string;
  category_name: string;
  unit_count: number;
  unit_cost: number;
  subtotal: number;
};
export type NotificationSnapshot = {
  replacementCount: number;
  expiringCount: number;
  unassignedCount: number;
  recentAssignments: Array<{
    id: string;
    assigned_at: string;
    note: string | null;
    full_name: string | null;
  }>;
};
export type EquipmentCategorySnapshot = {
  total: number;
  active: number;
  replacement: number;
  expiring: number;
  broken: number;
};
export type DivisionSummaryRow = {
  id: string;
  code: string;
  full_name: string;
  personnel_count: number;
  equipment_count: number;
  replacement_count: number;
};
export type PersonnelSummary = {
  total: number;
  regular: number;
  outsourced: number;
  withEquipment: number;
};
export type PersonnelPageRow = {
  id: string;
  full_name: string;
  initials: string;
  position: string | null;
  plantilla_status: PlantillaStatus | null;
  division_id: string;
  division: { code: string; full_name: string } | null;
  equipment_count: number;
};
export type PersonnelFilters = {
  q?: string;
  division?: string;
  status?: string;
  assignment?: "" | "assigned" | "unassigned";
  page?: number;
  pageSize?: number;
};
export type ReportFilters = EquipmentFilters & { category?: string };
export type ReportPageResult = InventoryPage<EquipmentPageRow>;

function pageSize(value: number | undefined) {
  return Math.min(
    Math.max(
      Number.isFinite(value) ? Math.trunc(value as number) : DEFAULT_PAGE_SIZE,
      1
    ),
    MAX_PAGE_SIZE
  );
}

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function dashboardSnapshot(value: unknown): DashboardSnapshot {
  const object = jsonObject(value);
  const metrics = jsonObject(object.metrics);
  return {
    metrics: {
      total: Number(metrics.total || 0),
      active: Number(metrics.active || 0),
      replacement: Number(metrics.replacement || 0),
      expiring: Number(metrics.expiring || 0),
      broken: Number(metrics.broken || 0),
    },
    statusCounts: Array.isArray(object.statusCounts)
      ? (object.statusCounts as DashboardSnapshot["statusCounts"])
      : [],
    divisionCounts: Array.isArray(object.divisionCounts)
      ? (object.divisionCounts as DashboardSnapshot["divisionCounts"])
      : [],
    replacementMatrix: Array.isArray(object.replacementMatrix)
      ? (object.replacementMatrix as Array<Record<string, unknown>>)
      : [],
  };
}

function notificationSnapshot(value: unknown): NotificationSnapshot {
  const object = jsonObject(value);
  return {
    replacementCount: Number(object.replacementCount || 0),
    expiringCount: Number(object.expiringCount || 0),
    unassignedCount: Number(object.unassignedCount || 0),
    recentAssignments: Array.isArray(object.recentAssignments)
      ? (object.recentAssignments as NotificationSnapshot["recentAssignments"])
      : [],
  };
}

function categorySnapshot(value: unknown): EquipmentCategorySnapshot {
  const object = jsonObject(value);
  return {
    total: Number(object.total || 0),
    active: Number(object.active || 0),
    replacement: Number(object.replacement || 0),
    expiring: Number(object.expiring || 0),
    broken: Number(object.broken || 0),
  };
}

const getCachedDashboard = unstable_cache(
  async (role: AppRole, divisionScope: string | null, asOf: string) => {
    const admin = createAdminClient();
    if (!admin)
      return { data: null, error: "Admin user configuration is incomplete." };
    const { data, error } = await admin.rpc("pulse_inventory_dashboard", {
      p_division_scope: role === "Viewer" ? divisionScope : null,
      p_as_of: asOf,
    });
    return { data: dashboardSnapshot(data), error: error?.message || null };
  },
  ["pulse-dashboard-v1"],
  { revalidate: 30, tags: ["pulse:inventory"] }
);

const getCachedPlanning = unstable_cache(
  async (
    role: AppRole,
    divisionScope: string | null,
    year: number,
    mode: "replacement" | "acquired"
  ) => {
    const admin = createAdminClient();
    if (!admin)
      return { data: [], error: "Admin user configuration is incomplete." };
    const { data, error } = await admin.rpc("pulse_inventory_plan", {
      p_division_scope: role === "Viewer" ? divisionScope : null,
      p_year: year,
      p_mode: mode,
    });
    return {
      data: (data || []) as PlanningRow[],
      error: error?.message || null,
    };
  },
  ["pulse-planning-v1"],
  { revalidate: 30, tags: ["pulse:planning", "pulse:inventory"] }
);

const getCachedNotificationSnapshot = unstable_cache(
  async (role: AppRole, divisionScope: string | null, asOf: string) => {
    const admin = createAdminClient();
    if (!admin)
      return { data: null, error: "Admin user configuration is incomplete." };
    const { data, error } = await admin.rpc("pulse_notification_snapshot", {
      p_division_scope: role === "Viewer" ? divisionScope : null,
      p_as_of: asOf,
    });
    return { data: notificationSnapshot(data), error: error?.message || null };
  },
  ["pulse-notifications-v2"],
  { revalidate: 30, tags: ["pulse:notifications", "pulse:inventory"] }
);

export async function getDashboardSnapshot(asOf = new Date()) {
  const profile = await getCurrentProfile();
  if (!profile)
    return { data: null, error: "Your account is not registered in PULSE." };
  if (profile.role === "Viewer" && !profile.division_scope)
    return { data: null, error: "Your Viewer account has no division scope." };
  return getCachedDashboard(
    profile.role,
    profile.division_scope,
    asOf.toISOString().slice(0, 10)
  );
}

export async function getPlanningSnapshot(
  year: number,
  mode: "replacement" | "acquired"
) {
  const profile = await getCurrentProfile();
  if (!profile)
    return { data: [], error: "Your account is not registered in PULSE." };
  if (profile.role === "Viewer" && !profile.division_scope)
    return { data: [], error: "Your Viewer account has no division scope." };
  return getCachedPlanning(profile.role, profile.division_scope, year, mode);
}

export async function getNotificationSnapshot() {
  const profile = await getCurrentProfile();
  if (!profile)
    return { data: null, error: "Your account is not registered in PULSE." };
  if (profile.role === "Viewer" && !profile.division_scope)
    return { data: null, error: "Your Viewer account has no division scope." };
  return getCachedNotificationSnapshot(
    profile.role,
    profile.division_scope,
    new Date().toISOString().slice(0, 10)
  );
}

export async function getEquipmentCategorySnapshot(category: string) {
  const profile = await getCurrentProfile();
  if (!profile)
    return { data: null, error: "Your account is not registered in PULSE." };
  if (profile.role === "Viewer" && !profile.division_scope)
    return { data: null, error: "Your Viewer account has no division scope." };
  return getCachedCategorySnapshot(
    profile.role,
    profile.role === "Viewer" ? profile.division_scope : null,
    category,
    new Date().toISOString().slice(0, 10)
  );
}

export async function getDivisionSummary(asOf = new Date()) {
  const profile = await getCurrentProfile();
  if (!profile)
    return {
      data: [] as DivisionSummaryRow[],
      error: "Your account is not registered in PULSE.",
    };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pulse_division_summary", {
    p_as_of: asOf.toISOString().slice(0, 10),
  });
  return {
    data: (data || []) as DivisionSummaryRow[],
    error: error?.message || null,
  };
}

export async function getPersonnelSummary() {
  const profile = await getCurrentProfile();
  if (!profile)
    return {
      data: null as PersonnelSummary | null,
      error: "Your account is not registered in PULSE.",
    };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pulse_personnel_summary");
  const value = jsonObject(data);
  return {
    data: {
      total: Number(value.total || 0),
      regular: Number(value.regular || 0),
      outsourced: Number(value.outsourced || 0),
      withEquipment: Number(value.withEquipment || 0),
    },
    error: error?.message || null,
  };
}

export async function getPersonnelPage(
  filters: PersonnelFilters = {}
): Promise<InventoryPage<PersonnelPageRow>> {
  const supabase = await createClient();
  const safePage =
    Number.isInteger(filters.page) && (filters.page as number) > 0
      ? (filters.page as number)
      : 1;
  const safePageSize = pageSize(filters.pageSize);
  const { data, error } = await supabase.rpc("pulse_search_personnel", {
    p_query: filters.q?.trim() || null,
    p_division: filters.division?.trim() || null,
    p_status: filters.status?.trim() || null,
    p_assignment: filters.assignment || null,
    p_page: safePage,
    p_page_size: safePageSize,
  });
  const rows = (data || []) as Array<Record<string, unknown>>;
  return {
    rows: rows.map((row) => ({
      id: String(row.id),
      full_name: String(row.full_name || ""),
      initials: String(row.initials || ""),
      position: row.position as string | null,
      plantilla_status: row.plantilla_status as PlantillaStatus | null,
      division_id: String(row.division_id),
      division: row.division_code
        ? {
            code: String(row.division_code),
            full_name: String(row.division_code),
          }
        : null,
      equipment_count: Number(row.equipment_count || 0),
    })),
    total: rows[0] ? Number(rows[0].total_count || 0) : 0,
    page: safePage,
    pageSize: safePageSize,
    error: error?.message || null,
  };
}

export async function getReportPage(
  filters: ReportFilters
): Promise<ReportPageResult> {
  return getEquipmentPage(
    {
      q: filters.q || "",
      division: filters.division || "",
      brand: filters.brand || "",
      status: filters.status || "",
      assignment: filters.assignment || "",
      rts: filters.rts || "",
      page: filters.page || 1,
      pageSize: filters.pageSize,
      category: filters.category || "",
    },
    filters.pageSize
  );
}

const getCachedCategorySnapshot = unstable_cache(
  async (
    role: AppRole,
    divisionScope: string | null,
    category: string,
    asOf: string
  ) => {
    const admin = createAdminClient();
    if (!admin)
      return { data: null, error: "Admin user configuration is incomplete." };
    const { data, error } = await admin.rpc(
      "pulse_equipment_category_snapshot",
      {
        p_category: category,
        p_division_scope: role === "Viewer" ? divisionScope : null,
        p_as_of: asOf,
      }
    );
    return { data: categorySnapshot(data), error: error?.message || null };
  },
  ["pulse-category-snapshot-v1"],
  { revalidate: 30, tags: [PULSE_CACHE_TAGS.inventory] }
);

export async function getEquipmentPage(
  filters: EquipmentFilters & { category: string },
  requestedPageSize = DEFAULT_PAGE_SIZE
): Promise<InventoryPage<EquipmentPageRow>> {
  const supabase = await createClient();
  const safePageSize = pageSize(requestedPageSize);
  const { data, error } = await supabase.rpc("pulse_search_equipment", {
    p_query: filters.q || null,
    p_category: filters.category || null,
    p_division: filters.division || null,
    p_brand: filters.brand || null,
    p_status: filters.status || null,
    p_assignment: filters.assignment || null,
    p_rts: filters.rts || null,
    p_page: filters.page,
    p_page_size: safePageSize,
  });
  const rows = (data || []) as Array<Record<string, unknown>>;
  return {
    rows: rows.map((row) => ({
      id: String(row.id),
      model: row.model as string | null,
      brand: row.brand as string | null,
      serial_number: row.serial_number as string | null,
      year_acquired: row.year_acquired as number | null,
      status: row.status as StoredEquipmentStatus,
      condition_state: String(row.condition_state || "Good"),
      is_rts: Boolean(row.is_rts),
      division: row.division_code ? { code: String(row.division_code) } : null,
      personnel: row.custodian_name
        ? { full_name: String(row.custodian_name) }
        : null,
      assignee: row.assignee_name
        ? { full_name: String(row.assignee_name) }
        : null,
      equipment_categories: row.category_name
        ? {
            name: String(row.category_name),
            lifespan_years: row.lifespan_years as number | null,
          }
        : null,
      displayStatus: row.display_status as EquipmentDisplayStatus,
    })),
    total: rows[0] ? Number(rows[0].total_count || 0) : 0,
    page: filters.page,
    pageSize: safePageSize,
    error: error?.message || null,
  };
}
