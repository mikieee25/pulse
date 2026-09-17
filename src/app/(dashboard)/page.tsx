import {
  InventoryByDivisionChart,
  StatusBreakdownChart,
} from "@/components/dashboard/dashboard-charts-lazy";
import { Activity, Building2, CircleAlert, PackageCheck } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPanel } from "@/components/layout/section-panel";
import { TablePageSizeSelect } from "@/components/layout/table-page-size-select";
import { getCachedCategories } from "@/lib/cached-data";
import { getDashboardSnapshot } from "@/lib/inventory-queries";
import { Suspense } from "react";
import { PanelSkeleton } from "@/components/layout/panel-skeleton";

type EquipmentCategory = { name: string };

type ReplacementStats = {
  totalExpiring: number;
  totalBroken: number;
  categories: Record<string, { total: number; replacement: number }>;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ pageSize?: string }>;
}) {
  const params = await searchParams;
  const requestedPageSize = Number(params.pageSize);
  const pageSize = [10, 25, 50].includes(requestedPageSize)
    ? requestedPageSize
    : 25;
  const [
    { data: snapshot, error },
    { data: categoryData, error: categoryError },
  ] = await Promise.all([getDashboardSnapshot(), getCachedCategories()]);
  const queryError = error || categoryError;
  if (queryError) {
    console.error("Dashboard inventory query failed", {
      message: String(queryError),
    });
    return (
      <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">
        <h1 className="text-xl font-medium">Inventory unavailable</h1>
        <p className="mt-2 text-sm text-slate">
          Your PULSE profile may need to be registered or your session may need
          to be refreshed.
        </p>
      </div>
    );
  }
  const categories = (categoryData || []) as EquipmentCategory[];
  const cardStats = snapshot?.metrics || {
    total: 0,
    active: 0,
    replacement: 0,
    expiring: 0,
    broken: 0,
  };
  const statuses = snapshot?.statusCounts || [];
  const divisionCounts = Object.fromEntries(
    (snapshot?.divisionCounts || []).map((row) => [row.name, row.count])
  );

  // New replacement plan tracking
  const plan: Record<string, ReplacementStats> = {};
  const allCategories = new Set(categories.map((category) => category.name));

  for (const row of snapshot?.replacementMatrix || []) {
    const division = String(row.division_code || "Unknown");
    const cat = String(row.category_name || "Unknown");
    allCategories.add(cat);
    plan[division] ||= { totalExpiring: 0, totalBroken: 0, categories: {} };
    plan[division].categories[cat] = {
      total: Number(row.total_units || 0),
      replacement: Number(row.replacement_units || 0),
    };
    plan[division].totalExpiring += Number(row.expiring_units || 0);
    plan[division].totalBroken += Number(row.broken_units || 0);
  }

  const catArray = Array.from(allCategories).sort();

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Activity className="size-3.5" aria-hidden="true" />
            Live inventory
          </span>
        }
        title="Dashboard"
        description="Live overview of ICT equipment across all divisions."
      />

      <section
        aria-labelledby="dashboard-overview-title"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <h2 id="dashboard-overview-title" className="sr-only">
          Dashboard overview
        </h2>
        <MetricCard
          label="Total equipment"
          value={cardStats.total}
          detail="Tracked ICT assets"
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
        <MetricCard
          label="Expiring in 1 year"
          value={cardStats.expiring}
          detail="Lifecycle attention needed"
          icon={Building2}
          tone="warning"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel
          title="Inventory by Division"
          description="Asset distribution across bureau offices"
        >
          <Suspense fallback={<PanelSkeleton label="Loading division chart" />}>
            <div className="p-5">
              <InventoryByDivisionChart
                data={Object.entries(divisionCounts).map(([name, count]) => ({
                  name,
                  count,
                }))}
              />
            </div>
          </Suspense>
        </SectionPanel>
        <SectionPanel
          title="Status Breakdown"
          description="Current lifecycle status of tracked assets"
        >
          <Suspense fallback={<PanelSkeleton label="Loading status chart" />}>
            <div className="p-5">
              <StatusBreakdownChart data={statuses} />
            </div>
          </Suspense>
        </SectionPanel>
      </div>

      <SectionPanel
        title={`Replacement Plan for ${new Date().getFullYear()}`}
        description="Replacement and condition signals by division and category"
        actions={
          <form method="get">
            <TablePageSizeSelect value={pageSize} name="pageSize" />
          </form>
        }
      >
        {Object.keys(plan).length ? (
          <div className="max-h-[720px] overflow-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <caption className="sr-only">
                Replacement plan by division and equipment category
              </caption>
              <thead className="sticky top-0 z-10 border-b border-line bg-canvas text-slate">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Division
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Units expiring
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Units broken
                  </th>
                  {catArray.map((cat) => (
                    <th
                      scope="col"
                      key={cat}
                      className="px-4 py-3 text-right font-medium"
                    >
                      {cat} (Rep/Tot)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(plan)
                  .sort()
                  .slice(0, pageSize)
                  .map(([division, stats]) => (
                    <tr
                      key={division}
                      className="border-b border-line/50 transition hover:bg-paper/[0.025]"
                    >
                      <th
                        scope="row"
                        className="px-5 py-3 text-left font-semibold text-paper"
                      >
                        {division}
                      </th>
                      <td
                        className={`px-4 py-3 text-right tabular-nums ${stats.totalExpiring > 0 ? "text-warning" : "text-slate"}`}
                      >
                        {stats.totalExpiring}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums ${stats.totalBroken > 0 ? "text-alert" : "text-slate"}`}
                      >
                        {stats.totalBroken}
                      </td>
                      {catArray.map((cat) => {
                        const catStats = stats.categories[cat] || {
                          total: 0,
                          replacement: 0,
                        };
                        return (
                          <td
                            key={cat}
                            className={`px-4 py-3 text-right tabular-nums ${catStats.replacement > 0 ? "text-alert" : "text-slate"}`}
                          >
                            {catStats.replacement} / {catStats.total}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No replacement records yet"
            description="No equipment has been flagged for lifecycle attention."
          />
        )}
      </SectionPanel>
    </div>
  );
}
