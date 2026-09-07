import { createClient } from "@/utils/supabase/server";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import { columns, type EquipmentData } from "@/components/equipment/columns";

import { AddEquipmentDialog } from "@/components/equipment/add-equipment-dialog";
import { ExportButton } from "@/components/equipment/export-button";

import { Button } from "@/components/ui/button";

export default async function EquipmentPage(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const category = searchParams.category || 'Laptop';
  
  // Fetch categories for tabs
  const { data: categories } = await supabase
    .from('equipment_categories')
    .select('*')
    .order('name');
    
  // Fetch equipment for selected category
  const { data: equipmentData } = await supabase
    .from('equipment')
    .select(`
      id,
      model,
      brand,
      serial_number,
      year_acquired,
      status,
      division:divisions(code),
      personnel:personnel(full_name),
      equipment_categories!inner(name)
    `)
    .eq('equipment_categories.name', category);
    
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
    Status: item.status,
  }));
  const { data: divisions } = await supabase.from('divisions').select('id,code,full_name').order('code');
  const { data: personnel } = await supabase.from('personnel').select('id,full_name,plantilla_status,division_id').eq('plantilla_status', 'Regular').order('full_name');
    
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-paper">Equipment</h1>
          <p className="text-slate mt-1">Manage ICT equipment across the bureau.</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={exportRows} category={category} />
          <AddEquipmentDialog category={category} divisions={divisions || []} personnel={personnel || []}>
            <Button>
              + Add {category}
            </Button>
          </AddEquipmentDialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-line overflow-x-auto pb-px">
        {categories?.map((cat) => (
          <a
            key={cat.id}
            href={`/equipment?category=${cat.name}`}
            className={`whitespace-nowrap px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              category === cat.name
                ? "border-pulse text-pulse"
                : "border-transparent text-slate hover:text-paper hover:border-line"
            }`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      {/* Equipment Table */}
      <EquipmentTable columns={columns} data={equipment} />
    </div>
  );
}
