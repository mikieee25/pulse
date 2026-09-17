import { SummaryContent } from "./summary-content";
import { getCachedCategories } from "@/lib/cached-data";
import { getPlanningSnapshot } from "@/lib/inventory-queries";

export default async function SummaryPage(props: {
  searchParams: Promise<{ year?: string; view?: string }>;
}) {
  const searchParams = await props.searchParams;

  const parsedYear = Number.parseInt(searchParams.year || "2026", 10);
  const viewYear =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : 2026;
  const viewType = searchParams.view === "Summary" ? "Summary" : "Replacement";

  const [
    { data: planning, error: planningError },
    { data: categoriesData, error: categoriesError },
  ] = await Promise.all([
    getPlanningSnapshot(
      viewYear,
      viewType === "Replacement" ? "replacement" : "acquired"
    ),
    getCachedCategories(),
  ]);

  const queryError = planningError || categoriesError;
  if (queryError) {
    console.error("Summary query failed", { message: String(queryError) });
    return (
      <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">
        Summary data is unavailable. Try refreshing.
      </div>
    );
  }

  const categories = (categoriesData || []) as Array<{
    id: string;
    name: string;
  }>;
  const categoryRates = new Map(
    (planning || []).map((row) => [row.category_name, row.unit_cost])
  );
  const processedData = (planning || []).map((row) => ({
    id: `${row.division_code}-${row.category_id}`,
    year_acquired: viewType === "Summary" ? viewYear : null,
    procurement_method: null,
    status: viewType === "Replacement" ? "For Replacement" : "Active",
    catName: row.category_name,
    rate: row.unit_cost,
    units: row.unit_count,
    division: { code: row.division_code, full_name: row.division_code },
  }));

  // Get unique divisions that have requests
  const divCodes = Array.from(
    new Set(processedData.map((d) => d.division?.code).filter(Boolean))
  ) as string[];
  divCodes.sort();

  return (
    <SummaryContent
      initialData={processedData}
      divisions={divCodes}
      categories={categories.map((category) => category.name)}
      categoryRates={Object.fromEntries(categoryRates)}
      viewYear={viewYear}
      viewType={viewType}
    />
  );
}
