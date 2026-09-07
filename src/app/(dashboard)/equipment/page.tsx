import { createClient } from "@/utils/supabase/server";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import { columns, type EquipmentData } from "@/components/equipment/columns";

import { AddEquipmentDialog } from "@/components/equipment/add-equipment-dialog";

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
    
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-paper">Equipment</h1>
          <p className="text-slate mt-1">Manage ICT equipment across the bureau.</p>
        </div>
        <AddEquipmentDialog category={category}>
          <button className="bg-pulse text-canvas-deep px-4 py-2 rounded-md font-semibold hover:bg-pulse/90 transition-colors">
            + Add {category}
          </button>
        </AddEquipmentDialog>
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
