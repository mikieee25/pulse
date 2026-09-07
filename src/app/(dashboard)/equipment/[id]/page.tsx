import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default async function EquipmentDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();
  
  const { data: equipment } = await supabase
    .from('equipment')
    .select(`
      *,
      division:divisions(full_name, code),
      personnel:personnel(full_name, position, plantilla_status),
      equipment_categories(name)
    `)
    .eq('id', params.id)
    .single();
    
  if (!equipment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif tracking-tight text-paper">
              {equipment.brand} {equipment.model}
            </h1>
            <Badge variant="outline" className="border-pulse text-pulse bg-pulse/10">
              {equipment.status}
            </Badge>
          </div>
          <p className="text-slate mt-1">Serial: {equipment.serial_number || 'N/A'}</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-canvas border border-line text-paper px-4 py-2 rounded-md font-medium hover:bg-line transition-colors">
            Reassign
          </button>
          <button className="bg-pulse text-canvas-deep px-4 py-2 rounded-md font-semibold hover:bg-pulse/90 transition-colors">
            Edit Details
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-canvas-deep border border-line rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-serif text-paper">Hardware Information</h2>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-sm text-slate">Category</p>
              <p className="text-paper">{equipment.equipment_categories?.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate">Year Acquired</p>
              <p className="text-paper">{equipment.year_acquired || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate">Procurement Method</p>
              <p className="text-paper">{equipment.procurement_method || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-canvas-deep border border-line rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-serif text-paper">Assignment Details</h2>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-sm text-slate">Custodian</p>
              <p className="text-paper">{equipment.personnel?.full_name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-sm text-slate">Position</p>
              <p className="text-paper">{equipment.personnel?.position || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate">Division</p>
              <p className="text-paper">{equipment.division?.full_name || '-'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {equipment.remarks && (
        <div className="bg-canvas-deep border border-line rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-serif text-paper">Remarks</h2>
          <p className="text-slate">{equipment.remarks}</p>
        </div>
      )}
    </div>
  );
}
