import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import type { AppRole } from "@/lib/auth";
import { PULSE_CACHE_TAGS } from "@/lib/cache-tags";

export type EquipmentCategoryRecord = {
  id: string;
  name: string;
  lifespan_years: number | null;
};
export type DivisionRecord = { id: string; code: string; full_name: string };
export type PersonnelOptionRecord = {
  id: string;
  full_name: string;
  plantilla_status: string | null;
  division_id: string;
  position: string | null;
};
export type CategoryCostRecord = {
  category_id: string;
  year: number;
  unit_cost: number;
};
type CachedResult<T> = { data: T[]; error: string | null };

// These reference reads are authorization-scoped and already receive their
// role/scope arguments in the cache key. Keep the stable Next 16-compatible
// boundary here until Cache Components can be enabled and verified end to end.

async function readCategories(): Promise<
  CachedResult<EquipmentCategoryRecord>
> {
  const admin = createAdminClient();
  if (!admin)
    return { data: [], error: "Admin user configuration is incomplete." };
  const { data, error } = await admin
    .from("equipment_categories")
    .select("id,name,lifespan_years")
    .order("name");
  return {
    data: (data || []) as EquipmentCategoryRecord[],
    error: error?.message || null,
  };
}

async function readDivisions(): Promise<CachedResult<DivisionRecord>> {
  const admin = createAdminClient();
  if (!admin)
    return { data: [], error: "Admin user configuration is incomplete." };
  const { data, error } = await admin
    .from("divisions")
    .select("id,code,full_name")
    .order("code");
  return {
    data: (data || []) as DivisionRecord[],
    error: error?.message || null,
  };
}

async function readPersonnel(
  role: AppRole,
  divisionScope: string | null
): Promise<CachedResult<PersonnelOptionRecord>> {
  const admin = createAdminClient();
  if (!admin)
    return { data: [], error: "Admin user configuration is incomplete." };
  if (role === "Viewer" && !divisionScope) return { data: [], error: null };
  let query = admin
    .from("personnel")
    .select("id,full_name,plantilla_status,division_id,position")
    .order("full_name");
  if (role === "Viewer" && divisionScope)
    query = query.eq("division_id", divisionScope);
  const { data, error } = await query;
  return {
    data: (data || []) as PersonnelOptionRecord[],
    error: error?.message || null,
  };
}

async function readCategoryCosts(
  year?: number
): Promise<CachedResult<CategoryCostRecord>> {
  const admin = createAdminClient();
  if (!admin)
    return { data: [], error: "Admin user configuration is incomplete." };
  let query = admin
    .from("category_unit_costs")
    .select("category_id,year,unit_cost")
    .order("year", { ascending: false });
  if (year) query = query.eq("year", year);
  const { data, error } = await query;
  return {
    data: (data || []) as CategoryCostRecord[],
    error: error?.message || null,
  };
}

export const getCachedCategories = unstable_cache(
  readCategories,
  ["pulse-categories-v1"],
  {
    revalidate: 300,
    tags: [PULSE_CACHE_TAGS.categories],
  }
);

export const getCachedDivisions = unstable_cache(
  readDivisions,
  ["pulse-divisions-v1"],
  {
    revalidate: 300,
    tags: [PULSE_CACHE_TAGS.divisions],
  }
);

export const getCachedPersonnel = unstable_cache(
  readPersonnel,
  ["pulse-personnel-v1"],
  {
    revalidate: 60,
    tags: [PULSE_CACHE_TAGS.personnel],
  }
);

export const getCachedCategoryCosts = unstable_cache(
  readCategoryCosts,
  ["pulse-costs-v1"],
  {
    revalidate: 60,
    tags: [PULSE_CACHE_TAGS.costs],
  }
);
