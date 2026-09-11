import { createClient } from "@/utils/supabase/server";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import { columns, type EquipmentData } from "@/components/equipment/columns";

import { AddEquipmentDialog } from "@/components/equipment/add-equipment-dialog";
import { ExportButton } from "@/components/equipment/export-button";

import { Button } from "@/components/ui/button";
import { Activity, CircleAlert, MonitorSmartphone, PackageCheck } from "lucide-react";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPanel } from "@/components/layout/section-panel";
import { equipmentDisplayStatus, inventoryCardStats } from "@/lib/pulse";
import { getCurrentProfile } from "@/lib/auth";

export default async function EquipmentPage(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const canManage = profile?.role === "Admin";
  const category = searchParams.category || 'Camera';
  
  // Fetch categories for tabs
  const { data: categories, error: categoriesError } = await supabase
    .from('equipment_categories')
    .select('*')
    .order('name');
    
  // Fetch equipment for selected category
  const { data: equipmentData, error } = await supabase
    .from('equipment')
    .select(`
      id,
      model,
      brand,
      serial_number,
      year_acquired,
      status,
      condition_state,
      division:divisions(code),
      personnel!equipment_assigned_to_fkey(full_name),
      equipment_categories!inner(name)
    `)
    .eq('equipment_categories.name', category);
  
  if (error) console.error("Equipment query failed:", error);
    
  // Need to cast because Supabase types might be inferred loosely here without typegen
  const equipment = (equipmentData || []) as unknown as EquipmentData[];
  const exportRows = equipment.map((item) => ({
    Category: item.equipment_categories?.name || category,
    Brand: item.brand || "",
    Model: item.model || "",
    "Serial Number": item.serial_number || "",
    Year: item.year_acquired || "",
    Division: item.division?.code || "",
    Custodian: item.personnel?.full_name || "Unassigned",
    Status: equipmentDisplayStatus(item.status, item.condition_state, item.equipment_categories?.name, item.year_acquired),
  }));
  const { data: divisions, error: divisionsError } = await supabase.from('divisions').select('id,code,full_name').order('code');
  const { data: personnel, error: personnelError } = await supabase.from('personnel').select('id,full_name,plantilla_status,division_id').eq('plantilla_status', 'Regular').order('full_name');
  if (categoriesError || error || divisionsError || personnelError) {
    const queryError = categoriesError || error || divisionsError || personnelError;
    console.error("Equipment query failed", { code: queryError?.code, message: queryError?.message });
    return <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">Equipment data is unavailable. Try refreshing.</div>;
  }
  const cardStats = inventoryCardStats(equipment.map((item) => ({ status: item.status, condition_state: item.condition_state, category: item.equipment_categories?.name, year_acquired: item.year_acquired })));
    
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><MonitorSmartphone className="size-3.5" aria-hidden="true" />Asset register</span>}
        title="Equipment"
        description="Manage ICT equipment across the bureau."
        actions={<>
          <ExportButton data={exportRows} category={category} />
          {canManage && <AddEquipmentDialog category={category} divisions={divisions || []} personnel={personnel || []}>
            <Button>
              + Add {category}
            </Button>
          </AddEquipmentDialog>}
        </>}
      />

      <section aria-labelledby="equipment-overview-title" className="grid gap-4 sm:grid-cols-3">
        <h2 id="equipment-overview-title" className="sr-only">Equipment overview</h2>
        <MetricCard label="Category total" value={cardStats.total} detail={`${category} assets`} icon={PackageCheck} />
        <MetricCard label="Active" value={cardStats.active} detail="Operational, replacement, and expiry flagged" icon={Activity} tone="pulse" />
        <MetricCard label="For replacement" value={cardStats.replacement} detail={`${cardStats.broken} broken units`} icon={CircleAlert} tone="alert" />
      </section>

      <SectionPanel title="Equipment categories" description="Choose a category to review its inventory">
        <nav className="flex gap-2 overflow-x-auto p-5" aria-label="Equipment categories">
          {categories?.map((cat) => (
            <a
              key={cat.id}
              href={`/equipment?category=${cat.name}`}
              aria-current={category === cat.name ? "page" : undefined}
              className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40 ${
                category === cat.name
                  ? "border-pulse/40 bg-pulse/10 text-pulse"
                  : "border-line text-slate hover:border-paper/25 hover:bg-paper/5 hover:text-paper"
              }`}
            >
              {cat.name}
            </a>
          ))}
        </nav>
      </SectionPanel>

      <SectionPanel title={`${category} inventory`} description="Search, filter, and manage registered assets">
        <div className="p-5"><EquipmentTable columns={columns} data={equipment} /></div>
      </SectionPanel>
    </div>
  );
}
