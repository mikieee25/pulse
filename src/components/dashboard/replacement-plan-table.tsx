import { Info, MoveHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ReplacementStats = {
  totalExpiring: number;
  totalBroken: number;
  categories: Record<string, { total: number; replacement: number }>;
};

type ReplacementPlanTableProps = {
  plan: Record<string, ReplacementStats>;
  categories: string[];
  pageSize: number;
};

function SummaryCount({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "warning" | "alert";
}) {
  if (!value)
    return (
      <span aria-label={`No units ${label}`} className="text-slate">
        —
      </span>
    );

  return (
    <Badge
      variant={tone === "alert" ? "destructive" : "outline"}
      aria-label={`${value} ${value === 1 ? "unit" : "units"} ${label}`}
      className="h-7 min-w-9 tabular-nums"
    >
      {tone === "warning" && (
        <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
      )}
      {value}
    </Badge>
  );
}

function CategoryCount({
  category,
  replacement,
  total,
}: {
  category: string;
  replacement: number;
  total: number;
}) {
  if (!total)
    return (
      <span aria-label={`No ${category} inventory`} className="text-slate">
        —
      </span>
    );

  const label = replacement
    ? `${replacement} ${category} units need replacement out of ${total} total`
    : `No ${category} units need replacement out of ${total} total`;

  if (!replacement)
    return (
      <span
        aria-label={label}
        className="inline-flex h-7 min-w-14 items-center justify-center gap-1 tabular-nums text-slate"
      >
        <span>0</span>
        <span aria-hidden="true" className="opacity-50">
          /
        </span>
        <span>{total}</span>
      </span>
    );

  return (
    <Badge
      variant="destructive"
      aria-label={label}
      className="h-7 min-w-14 justify-center gap-1 tabular-nums"
    >
      <span>{replacement}</span>
      <span aria-hidden="true" className="opacity-60">
        /
      </span>
      <span>{total}</span>
    </Badge>
  );
}

export function ReplacementPlanTable({
  plan,
  categories,
  pageSize,
}: ReplacementPlanTableProps) {
  return (
    <>
      <div className="flex flex-col gap-3 border-b border-line bg-accent px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pulse/10 text-pulse">
            <Info className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-paper">How to read</p>
            <p className="mt-0.5 text-xs text-slate">
              4 / 22 means 4 units need replacement out of 22 tracked units.
              Empty inventory is shown as —.
            </p>
          </div>
        </div>
        <div
          className="flex flex-wrap items-center gap-2 text-xs text-slate"
          aria-label="Replacement plan legend"
        >
          <Badge variant="outline">
            <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
            Expiring
          </Badge>
          <Badge variant="destructive">Needs attention</Badge>
          <span className="inline-flex items-center gap-1.5">
            <MoveHorizontal className="size-4" aria-hidden="true" />
            Scroll horizontally to view all categories
          </span>
        </div>
      </div>

      <div
        role="region"
        aria-label="Scrollable replacement plan table"
        tabIndex={0}
        className="max-h-[720px] overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pulse"
      >
        <table className="w-max min-w-full table-fixed text-left text-xs">
          <caption className="sr-only">
            Replacement plan by division and equipment category. Category cells
            show replacement units followed by total units.
          </caption>
          <thead className="sticky top-0 z-20 border-b border-line bg-canvas-deep text-slate">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-30 w-28 min-w-28 border-r border-line bg-canvas-deep px-5 py-3 font-semibold text-paper"
              >
                Division
              </th>
              <th
                scope="col"
                className="w-24 min-w-24 bg-canvas-deep px-3 py-3 text-center font-medium md:sticky md:left-28 md:z-30"
              >
                <span className="block">Expiring</span>
                <span className="mt-0.5 block font-normal text-slate">Units</span>
              </th>
              <th
                scope="col"
                className="w-24 min-w-24 border-r border-line bg-canvas-deep px-3 py-3 text-center font-medium md:sticky md:left-52 md:z-30"
              >
                <span className="block">Broken</span>
                <span className="mt-0.5 block font-normal text-slate">Units</span>
              </th>
              {categories.map((category) => (
                <th
                  scope="col"
                  key={category}
                  aria-label={`${category}, replacement units out of total units`}
                  className="w-32 min-w-32 bg-canvas-deep px-3 py-3 text-center align-bottom font-medium"
                >
                  <span className="block whitespace-normal leading-tight text-paper">
                    {category}
                  </span>
                  <span className="mt-1 block font-normal text-slate">
                    Replace / total
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(plan)
              .sort(([left], [right]) => left.localeCompare(right))
              .slice(0, pageSize)
              .map(([division, stats]) => (
                <tr
                  key={division}
                  className="group border-b border-line/50 bg-canvas-deep transition-colors even:bg-canvas hover:bg-accent"
                >
                  <th
                    scope="row"
                    className="sticky left-0 z-10 w-28 min-w-28 border-r border-line bg-inherit px-5 py-3 text-left font-semibold text-paper"
                  >
                    {division}
                  </th>
                  <td className="w-24 min-w-24 bg-inherit px-3 py-3 text-center md:sticky md:left-28 md:z-10">
                    <SummaryCount
                      value={stats.totalExpiring}
                      label="expiring"
                      tone="warning"
                    />
                  </td>
                  <td className="w-24 min-w-24 border-r border-line bg-inherit px-3 py-3 text-center md:sticky md:left-52 md:z-10">
                    <SummaryCount
                      value={stats.totalBroken}
                      label="broken"
                      tone="alert"
                    />
                  </td>
                  {categories.map((category) => {
                    const categoryStats = stats.categories[category] || {
                      total: 0,
                      replacement: 0,
                    };
                    return (
                      <td
                        key={category}
                        className="w-32 min-w-32 px-3 py-3 text-center"
                      >
                        <CategoryCount
                          category={category}
                          replacement={categoryStats.replacement}
                          total={categoryStats.total}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
