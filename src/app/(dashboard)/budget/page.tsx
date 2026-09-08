import { createClient } from "@/utils/supabase/server";
import { saveCategoryCost } from "@/app/actions/admin";
import { lifecycleStatus } from "@/lib/pulse";
import { ExportButton } from "@/components/equipment/export-button";
import {
  Banknote,
  Building2,
  CalendarRange,
  CircleAlert,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

type Equipment = {
  status: "Active" | "For Replacement" | "Retired";
  year_acquired: number | null;
  division: { code: string } | null;
  equipment_categories: {
    id: string;
    name: string;
    lifespan_years: number | null;
  } | null;
};
type Category = { id: string; name: string; lifespan_years: number | null };
type Cost = { category_id: string; year: number; unit_cost: number };

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const year = Number((await searchParams).year) || new Date().getFullYear();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: equipmentData, error: equipmentError },
    { data: categoriesData, error: categoriesError },
    { data: costs, error: costsError },
    { data: divisions, error: divisionsError },
    { data: appUser },
  ] = await Promise.all([
    supabase
      .from("equipment")
      .select(
        "status,year_acquired,division:divisions(code),equipment_categories(id,name,lifespan_years)"
      ),
    supabase
      .from("equipment_categories")
      .select("id,name,lifespan_years")
      .order("name"),
    supabase
      .from("category_unit_costs")
      .select("category_id,year,unit_cost")
      .eq("year", year),
    supabase.from("divisions").select("code").order("code"),
    user
      ? supabase.from("app_users").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null as { role: string } | null }),
  ]);

  const queryError =
    equipmentError || categoriesError || costsError || divisionsError;
  if (queryError) {
    return (
      <div className="rounded-lg border border-line bg-canvas-deep p-6 text-alert">
        Couldn’t load the budget data — {queryError.message}. Try refreshing.
      </div>
    );
  }

  const isAdmin = appUser?.role === "Admin";
  const equipment = (equipmentData || []) as unknown as Equipment[];

  const categories = (categoriesData || []) as Category[];

  const costByCategory = new Map(
    ((costs || []) as Cost[]).map((cost) => [cost.category_id, cost.unit_cost])
  );

  const replacementCounts = new Map<string, number>();
  for (const item of equipment) {
    const divisionCode = item.division?.code;
    const categoryName = item.equipment_categories?.name;
    if (!divisionCode || !categoryName) continue;
    const status = lifecycleStatus(
      item.status,
      categoryName,
      item.year_acquired
    );
    if (status !== "For Replacement") continue;
    const key = `${divisionCode}|${categoryName}`;
    replacementCounts.set(key, (replacementCounts.get(key) || 0) + 1);
  }

  // Pre-aggregate hierarchically: Division -> Categories
  const groupedData = (divisions || []).map((division) => {
    const items = categories.map((category) => {
      const units =
        replacementCounts.get(`${division.code}|${category.name}`) || 0;
      const unitCost = costByCategory.get(category.id) || 0;
      return {
        categoryId: category.id,
        categoryName: category.name,
        units,
        unitCost,
        subtotal: units * unitCost,
      };
    });

    const divisionUnits = items.reduce((acc, i) => acc + i.units, 0);
    const divisionCost = items.reduce((acc, i) => acc + i.subtotal, 0);

    return {
      code: division.code,
      items,
      divisionUnits,
      divisionCost,
    };
  });

  const grandTotalCost = groupedData.reduce(
    (acc, d) => acc + d.divisionCost,
    0
  );
  const grandTotalUnits = groupedData.reduce(
    (acc, d) => acc + d.divisionUnits,
    0
  );
  const unpricedCount = categories.filter(
    (c) => (costByCategory.get(c.id) || 0) === 0
  ).length;
  const pricedCategories = categories.length - unpricedCount;
  const requestingDivisions = groupedData.filter(
    (division) => division.divisionUnits > 0
  ).length;
  const coveragePercentage = categories.length
    ? Math.round((pricedCategories / categories.length) * 100)
    : 0;

  const exportRows = groupedData.flatMap((d) =>
    d.items.map((i) => ({
      Division: d.code,
      Category: i.categoryName,
      Units: i.units,
      "Unit Cost": i.unitCost,
      Subtotal: i.subtotal,
    }))
  );

  return (
    <div className="space-y-8 pb-8">
      <header className="relative overflow-hidden rounded-2xl border border-line bg-canvas-deep p-6 shadow-2xl shadow-black/10 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-pulse/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pulse/20 bg-pulse/10 px-3 py-1 text-xs font-medium text-pulse">
              <CalendarRange className="size-3.5" aria-hidden="true" />
              Fiscal year {year}
            </div>
            <h1 className="font-serif text-3xl tracking-tight text-paper sm:text-4xl">
              Budget & Replacement Planning
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate">
              Turn lifecycle requirements into an auditable replacement forecast
              for every ICT category and division.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form className="flex items-center gap-2 rounded-xl border border-line bg-canvas/80 p-1.5 shadow-sm">
              <label htmlFor="budget-year" className="pl-2 text-xs font-medium text-slate">
                FY
              </label>
              <input
                id="budget-year"
                aria-label="Fiscal year"
                name="year"
                type="number"
                min="2000"
                max="2100"
                defaultValue={year}
                className="h-8 w-20 rounded-lg border border-line bg-canvas-deep px-2 text-sm font-semibold tabular-nums text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"
              />
              <button className="h-8 rounded-lg bg-pulse px-3 text-xs font-semibold text-canvas-deep transition hover:bg-pulse/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">
                Apply
              </button>
            </form>
            <ExportButton data={exportRows} category={`budget-${year}`} />
          </div>
        </div>
      </header>

      <section aria-labelledby="budget-overview-title" className="grid gap-4 lg:grid-cols-[1.35fr_2fr]">
        <h2 id="budget-overview-title" className="sr-only">Budget overview</h2>
        <article className="relative overflow-hidden rounded-2xl border border-pulse/25 bg-gradient-to-br from-pulse/15 via-canvas-deep to-canvas-deep p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pulse">Forecast requirement</p>
              <p className="mt-3 break-words font-serif text-3xl tabular-nums text-paper sm:text-4xl">
                {peso.format(grandTotalCost)}
              </p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-pulse/20 bg-pulse/10 text-pulse">
              <Banknote className="size-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-line pt-4 text-xs text-slate">
            <span>Based on {grandTotalUnits} replacement units</span>
            <span className="font-medium text-paper">FY {year}</span>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Units for replacement", value: grandTotalUnits, detail: "ICT assets", icon: PackageCheck, tone: "text-paper bg-paper/5 border-line" },
            { label: "Requesting divisions", value: requestingDivisions, detail: `of ${divisions?.length || 0} divisions`, icon: Building2, tone: "text-paper bg-paper/5 border-line" },
            { label: "Rate coverage", value: `${coveragePercentage}%`, detail: `${pricedCategories} of ${categories.length} priced`, icon: ShieldCheck, tone: unpricedCount ? "text-amber-300 bg-amber-300/5 border-amber-300/20" : "text-pulse bg-pulse/5 border-pulse/20" },
          ].map(({ label, value, detail, icon: Icon, tone }) => (
            <article key={label} className="rounded-2xl border border-line bg-canvas-deep p-5 transition-colors hover:border-paper/25">
              <span className={`grid size-9 place-items-center rounded-lg border ${tone}`}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <p className="mt-5 text-xs font-medium text-slate">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-paper">{value}</p>
              <p className="mt-1 text-xs text-slate">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      {unpricedCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
          <p className="text-slate">
            <span className="font-medium text-amber-300">{unpricedCount} {unpricedCount === 1 ? "category needs" : "categories need"} a rate.</span>{" "}
            Forecast totals exclude replacement units without a standard cost.
          </p>
        </div>
      )}

      <div className={`grid items-start gap-6 ${isAdmin ? "xl:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
        <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas-deep shadow-xl shadow-black/5" aria-labelledby="replacement-breakdown-title">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 id="replacement-breakdown-title" className="font-serif text-xl text-paper">Replacement breakdown</h2>
              <p className="mt-1 text-xs text-slate">Division totals with category-level costing</p>
            </div>
            <span className="rounded-full border border-line bg-canvas px-3 py-1 text-xs text-slate">
              {groupedData.length} divisions
            </span>
          </div>

          {groupedData.length === 0 ? (
            <div className="grid min-h-56 place-items-center p-8 text-center">
              <div>
                <PackageCheck className="mx-auto size-8 text-slate" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-paper">No budget records yet</p>
                <p className="mt-1 text-xs text-slate">No divisions or lifespan-tracked categories were found.</p>
              </div>
            </div>
          ) : (
            <div className="max-h-[720px] overflow-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <caption className="sr-only">FY {year} replacement budget by division and equipment category</caption>
                <thead className="sticky top-0 z-20 border-b border-line bg-canvas text-slate shadow-sm">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Category</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Units</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Unit cost</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                {groupedData.map((group) => (
                  <tbody key={group.code}>
                    <tr className="border-y border-line bg-canvas/80">
                      <th scope="rowgroup" colSpan={2} className="px-5 py-3 text-left font-semibold text-paper">
                        <span className="mr-2 inline-block size-1.5 rounded-full bg-pulse align-middle" />
                        {group.code}
                      </th>
                      <td className="px-4 py-3 text-right font-medium text-slate">{group.divisionUnits} units</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-paper">{peso.format(group.divisionCost)}</td>
                    </tr>
                    {group.items.map((item) => {
                      const hasMissingRate = item.units > 0 && item.unitCost === 0;
                      return (
                        <tr key={`${group.code}-${item.categoryName}`} className={`border-b border-line/50 transition hover:bg-paper/[0.025] ${item.units === 0 ? "text-slate/45" : ""}`}>
                          <td className="px-5 py-3 pl-9 font-medium text-paper">
                            <div className="flex items-center gap-2">
                              <span>{item.categoryName}</span>
                              {hasMissingRate && <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">Missing rate</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-paper">{item.units}</td>
                          <td className={`px-4 py-3 text-right tabular-nums ${hasMissingRate ? "text-amber-300" : "text-slate"}`}>{item.unitCost > 0 ? peso.format(item.unitCost) : "—"}</td>
                          <td className={`px-5 py-3 text-right font-semibold tabular-nums ${item.subtotal > 0 ? "text-pulse" : "text-slate"}`}>{peso.format(item.subtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
                <tfoot className="sticky bottom-0 z-10 border-t-2 border-line bg-canvas shadow-[0_-8px_20px_rgba(0,0,0,0.2)]">
                  <tr>
                    <th scope="row" className="px-5 py-4 text-sm font-semibold text-paper">Grand total</th>
                    <td className="px-4 py-4 text-right font-semibold tabular-nums text-paper">{grandTotalUnits}</td>
                    <td className="px-4 py-4 text-right text-slate">FY {year}</td>
                    <td className="px-5 py-4 text-right text-base font-semibold tabular-nums text-pulse">{peso.format(grandTotalCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {isAdmin && (
          <aside className="rounded-2xl border border-line bg-canvas-deep p-5 xl:sticky xl:top-6" aria-labelledby="standard-rates-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pulse">Admin controls</p>
                <h2 id="standard-rates-title" className="mt-1 font-serif text-xl text-paper">Standard rates</h2>
                <p className="mt-1 text-xs leading-5 text-slate">Set one replacement cost per category for FY {year}.</p>
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-canvas text-slate">
                <Banknote className="size-4" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {categories.map((category) => {
                const currentCost = costByCategory.get(category.id);
                const inputId = `cost-${category.id}`;
                return (
                  <form key={category.id} action={saveCategoryCost} className="rounded-xl border border-line bg-canvas/60 p-3 transition-colors focus-within:border-pulse/50">
                    <input type="hidden" name="category_id" value={category.id} />
                    <input type="hidden" name="year" value={year} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <label htmlFor={inputId} className="block truncate text-xs font-semibold text-paper">{category.name}</label>
                        <span className="mt-0.5 block text-[10px] text-slate">
                          {category.lifespan_years === null ? "Manual replacement" : `${category.lifespan_years}-year lifecycle`}
                        </span>
                      </div>
                      {!currentCost && <span className="shrink-0 rounded-full bg-amber-300/10 px-2 py-0.5 text-[9px] font-medium text-amber-300">Unpriced</span>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate">₱</span>
                        <input
                          id={inputId}
                          aria-label={`Set ${category.name} unit cost`}
                          name="unit_cost"
                          type="number"
                          min="0"
                          defaultValue={currentCost || ""}
                          placeholder="0"
                          className="h-9 w-full rounded-lg border border-line bg-canvas-deep pl-7 pr-2 text-right text-xs tabular-nums text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"
                        />
                      </div>
                      <button type="submit" className="h-9 rounded-lg border border-line bg-canvas px-3 text-xs font-semibold text-paper transition hover:border-pulse/40 hover:text-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40">Save</button>
                    </div>
                  </form>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
