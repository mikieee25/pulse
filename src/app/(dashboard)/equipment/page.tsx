import { EquipmentTable } from "@/components/equipment/equipment-table";
import { columns, type EquipmentData } from "@/components/equipment/columns";

import { AddEquipmentDialog } from "@/components/equipment/add-equipment-dialog";
import { AddCategoryDialog } from "@/components/equipment/add-category-dialog";
import { ExportButton } from "@/components/equipment/export-button";

import { Button } from "@/components/ui/button";
import {
  Activity,
  CircleAlert,
  MonitorSmartphone,
  PackageCheck,
} from "lucide-react";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPanel } from "@/components/layout/section-panel";
import {
  canonicalEquipmentCategory,
  equipmentDisplayStatus,
  inventoryCardStats,
} from "@/lib/pulse";
import { getCurrentProfile } from "@/lib/auth";
import {
  getCachedCategories,
  getCachedDivisions,
  getCachedPersonnel,
} from "@/lib/cached-data";
import { parseEquipmentFilters } from "@/lib/equipment-filters";
import {
  getEquipmentCategorySnapshot,
  getEquipmentPage,
} from "@/lib/inventory-queries";
import Link from "next/link";

export default async function EquipmentPage(props: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    division?: string;
    brand?: string;
    status?: string;
    assignment?: string;
    rts?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const profile = await getCurrentProfile();
  const category = canonicalEquipmentCategory(
    searchParams.category || "Camera"
  );
  const filters = parseEquipmentFilters(searchParams);
  const [
    categoriesResult,
    equipmentResult,
    categoryStatsResult,
    divisionsResult,
    personnelResult,
  ] = await Promise.all([
    getCachedCategories(),
    getEquipmentPage({ ...filters, category }, filters.pageSize),
    getEquipmentCategorySnapshot(category),
    getCachedDivisions(),
    getCachedPersonnel(
      profile?.role || "Viewer",
      profile?.division_scope || null
    ),
  ]);
  const canManage = profile?.role === "Admin";
  const { data: categories, error: categoriesError } = categoriesResult;
  const { rows: equipmentData, error } = equipmentResult;
  const { data: categoryStats, error: categoryStatsError } =
    categoryStatsResult;
  const { data: divisions, error: divisionsError } = divisionsResult;
  const { data: personnel, error: personnelError } = personnelResult;
  const personnelOptions = (personnel || []).map((person) => ({
    ...person,
    plantilla_status: person.plantilla_status || undefined,
    position: person.position || undefined,
  }));
  const equipment = (equipmentData || []) as unknown as EquipmentData[];
  const visibleCategories = Array.from(
    new Map(
      (categories || []).map((item) => {
        const name = canonicalEquipmentCategory(item.name);
        return [name, { ...item, name }];
      })
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
  const exportRows = equipment.map((item) => ({
    Category: canonicalEquipmentCategory(
      item.equipment_categories?.name || category
    ),
    Brand: item.brand || "",
    Model: item.model || "",
    "Serial Number": item.serial_number || "",
    Year: item.year_acquired || "",
    Division: item.division?.code || "",
    Custodian: item.personnel?.full_name || "Unassigned",
    Assignee: item.assignee?.full_name || "Unassigned",
    Status: equipmentDisplayStatus(
      item.status,
      item.condition_state,
      item.equipment_categories?.lifespan_years,
      item.year_acquired
    ),
    RTS: item.is_rts ? "Return to Store" : "",
  }));
  if (
    categoriesError ||
    error ||
    categoryStatsError ||
    divisionsError ||
    personnelError
  ) {
    const queryError =
      categoriesError ||
      error ||
      categoryStatsError ||
      divisionsError ||
      personnelError;
    console.error("Equipment query failed", { message: String(queryError) });
    return (
      <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">
        Equipment data is unavailable. Try refreshing.
      </div>
    );
  }
  const cardStats =
    categoryStats ||
    inventoryCardStats(
      equipment.map((item) => ({
        status: item.status,
        condition_state: item.condition_state,
        lifespan_years: item.equipment_categories?.lifespan_years,
        year_acquired: item.year_acquired,
      }))
    );

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <MonitorSmartphone className="size-3.5" aria-hidden="true" />
            Asset register
          </span>
        }
        title="Equipment"
        description="Manage ICT equipment across the bureau."
        actions={
          <>
            <ExportButton data={exportRows} category={category} />
            {canManage && (
              <AddEquipmentDialog
                category={category}
                categories={visibleCategories.map((cat) => cat.name)}
                divisions={divisions || []}
                personnel={personnelOptions}
              >
                <Button>+ Add {category}</Button>
              </AddEquipmentDialog>
            )}
          </>
        }
      />

      <section
        aria-labelledby="equipment-overview-title"
        className="grid gap-4 sm:grid-cols-3"
      >
        <h2 id="equipment-overview-title" className="sr-only">
          Equipment overview
        </h2>
        <MetricCard
          label="Category total"
          value={cardStats.total}
          detail={`${category} assets`}
          icon={PackageCheck}
        />
        <MetricCard
          label="Active"
          value={cardStats.active}
          detail="Operational, replacement, and expiry flagged"
          icon={Activity}
          tone="pulse"
        />
        <MetricCard
          label="For replacement"
          value={cardStats.replacement}
          detail={`${cardStats.broken} broken units`}
          icon={CircleAlert}
          tone="alert"
        />
      </section>

      <SectionPanel
        title="Equipment categories"
        description="Choose a category to review its inventory"
      >
        <nav
          className="flex gap-2 overflow-x-auto p-5"
          aria-label="Equipment categories"
        >
          {visibleCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/equipment?category=${encodeURIComponent(cat.name)}`}
              aria-current={category === cat.name ? "page" : undefined}
              className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40 ${
                category === cat.name
                  ? "border-pulse/40 bg-pulse/10 text-pulse"
                  : "border-line text-slate hover:border-paper/25 hover:bg-paper/5 hover:text-paper"
              }`}
            >
              {cat.name}
            </Link>
          ))}
          {canManage && (
            <AddCategoryDialog>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Add equipment category"
                title="Add equipment category"
                className="size-9 shrink-0 rounded-full border-dashed text-lg text-pulse hover:border-pulse/60 hover:bg-pulse/10"
              >
                +
              </Button>
            </AddCategoryDialog>
          )}
        </nav>
      </SectionPanel>

      <SectionPanel
        title={`${category} inventory`}
        description="Search, filter, and manage registered assets"
      >
        <div className="p-5">
          <EquipmentTable
            columns={columns}
            data={equipment}
            category={category}
            initialFilters={filters}
            total={equipmentResult.total}
            page={equipmentResult.page}
            pageSize={equipmentResult.pageSize}
            divisions={(divisions || []).map((d) => d.code)}
            brands={
              Array.from(
                new Set(equipment.map((item) => item.brand).filter(Boolean))
              ) as string[]
            }
          />
        </div>
      </SectionPanel>
    </div>
  );
}
