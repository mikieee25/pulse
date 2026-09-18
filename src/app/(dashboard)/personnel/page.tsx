import { PersonnelTable } from "@/components/personnel/personnel-table";
import { AddPersonnelDialog } from "@/components/personnel/add-personnel-dialog";
import { Button } from "@/components/ui/button";
import {
  BriefcaseBusiness,
  ContactRound,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPanel } from "@/components/layout/section-panel";
import { getCurrentProfile } from "@/lib/auth";
import { getCachedDivisions } from "@/lib/cached-data";
import { getPersonnelPage, getPersonnelSummary } from "@/lib/inventory-queries";
import { parsePersonnelFilters } from "@/lib/personnel-filters";

export default async function PersonnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = parsePersonnelFilters(params);
  const [profile, personnelResult, divisionsResult, summaryResult] =
    await Promise.all([
      getCurrentProfile(),
      getPersonnelPage(filters),
      getCachedDivisions(),
      getPersonnelSummary(),
    ]);
  const canManage = profile?.role === "Admin";
  const personnelPage = personnelResult;
  const { error } = personnelResult;
  const personnel = (personnelPage?.rows || []).map((p) => ({
    ...p,
    equipment: null,
  }));
  const { data: divisions, error: divisionsError } = divisionsResult;
  const { data: summary, error: summaryError } = summaryResult;
  if (error || personnelPage?.error || divisionsError || summaryError) {
    const queryError =
      error || personnelPage?.error || divisionsError || summaryError;
    console.error("Personnel query failed", { message: String(queryError) });
    return (
      <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">
        Personnel data is unavailable. Try refreshing.
      </div>
    );
  }
  const regularCount =
    summary?.regular ??
    personnel.filter((person) => person.plantilla_status === "Regular").length;
  const outsourcedCount =
    summary?.outsourced ??
    personnel.filter((person) =>
      ["Outsourced", "COS"].includes(person.plantilla_status || "")
    ).length;
  const assignedCount =
    summary?.withEquipment ??
    personnel.filter((person) => (person.equipment_count || 0) > 0).length;

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <UsersRound className="size-3.5" aria-hidden="true" />
            People & custodians
          </span>
        }
        title="Personnel"
        description="Manage staff and equipment custodians."
        actions={
          canManage ? (
            <AddPersonnelDialog divisions={divisions || []}>
              <Button size="action">+ Add Personnel</Button>
            </AddPersonnelDialog>
          ) : undefined
        }
      />

      <section
        aria-labelledby="personnel-overview-title"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <h2 id="personnel-overview-title" className="sr-only">
          Personnel overview
        </h2>
        <MetricCard
          label="Total personnel"
          value={summary?.total ?? personnel.length}
          detail="Registered staff"
          icon={UsersRound}
        />
        <MetricCard
          label="Regular staff"
          value={regularCount}
          detail="Eligible custodians"
          icon={UserCheck}
          tone="pulse"
        />
        <MetricCard
          label="Outsourced"
          value={outsourcedCount}
          detail="Outsourced and COS personnel"
          icon={BriefcaseBusiness}
          tone="warning"
        />
        <MetricCard
          label="With equipment"
          value={assignedCount}
          detail="Active custodians"
          icon={ContactRound}
          tone="warning"
        />
      </section>

      <SectionPanel
        title="Personnel directory"
        description="Search staff, divisions, positions, and assignment status"
      >
        <div className="p-5">
          <PersonnelTable
            data={personnel}
            divisions={divisions || []}
            canManage={canManage}
            filters={filters}
            total={personnelPage?.total || 0}
          />
        </div>
      </SectionPanel>
    </div>
  );
}
