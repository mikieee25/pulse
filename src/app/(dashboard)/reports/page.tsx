import { ReportsClient, type ReportEquipment } from "./reports-client";
import { getReportPage } from "@/lib/inventory-queries";

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = (await searchParams) || {};
  const { rows, error } = await getReportPage({
        q: params.q || "",
        division: params.division || "",
        brand: params.brand || "",
        status: (params.status as "" | "Active" | "Expiring soon" | "For Replacement" | "Broken" | "Retired") || "",
        assignment: params.assignment === "unassigned" ? "unassigned" : "",
        rts: params.rts === "rts" ? "rts" : "",
        page: Number(params.page) || 1,
        pageSize: Number(params.pageSize) || 25,
        category: params.category || "",
  });

  const queryError = error;
  if (queryError) {
    console.error("Reports query failed", {
      message: String(queryError),
    });
    return (
      <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">
        Report data is unavailable. Try refreshing.
      </div>
    );
  }

  const equipment = rows.map((item) => ({
    id: item.id,
    brand: item.brand,
    model: item.model,
    year_acquired: item.year_acquired,
    serial_number: item.serial_number,
    procurement_method: null,
    status: item.status,
    condition_state: item.condition_state,
    is_rts: item.is_rts,
    rate: 0,
    division: item.division,
    personnel: item.personnel,
    assignee: item.assignee,
    equipment_categories: item.equipment_categories,
  })) as ReportEquipment[];

  return <ReportsClient initialData={equipment} />;
}
