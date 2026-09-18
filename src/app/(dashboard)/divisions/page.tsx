import { DivisionsTable } from "@/components/divisions/divisions-table";
import { columns, type DivisionData } from "@/components/divisions/columns";
import { AddDivisionDialog } from "@/components/divisions/add-division-dialog";
import { Button } from "@/components/ui/button";
import { Building2, CircleAlert, UsersRound } from "lucide-react";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPanel } from "@/components/layout/section-panel";
import { getCurrentProfile } from "@/lib/auth";
import { getDivisionSummary } from "@/lib/inventory-queries";

export default async function DivisionsPage() {
  const [profile, divisionsResult] = await Promise.all([
    getCurrentProfile(),
    getDivisionSummary(),
  ]);
  const canManage = profile?.role === "Admin";
  const { data: divisionsData, error: divisionsError } = divisionsResult;

  if (divisionsError) {
    console.error("Divisions query failed", {
      message: String(divisionsError),
    });
    return (
      <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">
        Division data is unavailable. Try refreshing.
      </div>
    );
  }

  const divisions = (divisionsData || []).map((d) => ({
    id: d.id,
    code: d.code,
    full_name: d.full_name,
    _count: {
      personnel: d.personnel_count,
      equipment: d.equipment_count,
      expired: d.replacement_count,
    },
  })) as DivisionData[];
  const totalPersonnel = divisions.reduce(
    (total, division) => total + (division._count?.personnel || 0),
    0
  );
  const totalEquipment = divisions.reduce(
    (total, division) => total + (division._count?.equipment || 0),
    0
  );
  const totalExpired = divisions.reduce(
    (total, division) => total + (division._count?.expired || 0),
    0
  );

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Building2 className="size-3.5" aria-hidden="true" />
            Organization
          </span>
        }
        title="Divisions"
        description="Manage bureau divisions and offices."
        actions={
          canManage ? (
            <AddDivisionDialog>
              <Button size="action">+ Add Division</Button>
            </AddDivisionDialog>
          ) : undefined
        }
      />

      <section
        aria-labelledby="divisions-overview-title"
        className="grid gap-4 sm:grid-cols-3"
      >
        <h2 id="divisions-overview-title" className="sr-only">
          Divisions overview
        </h2>
        <MetricCard
          label="Bureau divisions"
          value={divisions.length}
          detail="Registered offices"
          icon={Building2}
        />
        <MetricCard
          label="Personnel"
          value={totalPersonnel}
          detail={`${totalEquipment} tracked assets`}
          icon={UsersRound}
          tone="pulse"
        />
        <MetricCard
          label="Lifecycle attention"
          value={totalExpired}
          detail="Assets for replacement"
          icon={CircleAlert}
          tone="alert"
        />
      </section>

      <SectionPanel
        title="Division directory"
        description="Review personnel, equipment, and lifecycle counts by office"
      >
        <div className="p-5">
          <DivisionsTable columns={columns} data={divisions} />
        </div>
      </SectionPanel>
    </div>
  );
}
