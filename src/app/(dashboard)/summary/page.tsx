import { createClient } from "@/utils/supabase/server";
import { SummaryContent } from "./summary-content";
import { needsReplacement } from "@/lib/pulse";

type RawEquipment = {
  id: string;
  year_acquired: number | null;
  procurement_method: string | null;
  status: "Active" | "For Replacement" | "Retired";
  condition_state: string;
  equipment_categories: { id: string; name: string } | null;
  division: { code: string; full_name: string } | null;
};

export default async function SummaryPage(props: {
  searchParams: Promise<{ year?: string; view?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const parsedYear = Number.parseInt(searchParams.year || "2026", 10);
  const viewYear = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : 2026;
  const viewType = searchParams.view === "Summary" ? "Summary" : "Replacement";

  const [{ data: equipmentData, error: equipmentError }, { data: categoriesData, error: categoriesError }, { data: costsData, error: costsError }] = await Promise.all([
    supabase.from("equipment").select(`
      id,
      year_acquired,
      procurement_method,
      status,
      condition_state,
      equipment_categories(id, name),
      division:divisions(code, full_name)
    `),
    supabase.from("equipment_categories").select("id,name").order("name"),
    supabase.from("category_unit_costs").select("category_id,year,unit_cost").order("year", { ascending: false }),
  ]);

  const queryError = equipmentError || categoriesError || costsError;
  if (queryError) {
    console.error("Summary query failed", { code: queryError.code, message: queryError.message });
    return <div className="rounded-lg border border-alert/30 bg-alert/10 p-6 text-alert">Summary data is unavailable. Try refreshing.</div>;
  }

  const equipments = (equipmentData || []) as unknown as RawEquipment[];
  const categories = (categoriesData || []) as Array<{ id: string; name: string }>;
  const costs = (costsData || []) as Array<{ category_id: string; year: number; unit_cost: number }>;
  const categoryRates = new Map(categories.map((category) => {
    const matches = costs.filter((cost) => cost.category_id === category.id && cost.year <= viewYear);
    return [category.name, matches[0]?.unit_cost || 0] as const;
  }));

  const processedData = equipments
    .map((eq) => {
      const catName = eq.equipment_categories?.name || "Other";

      let isIncluded = false;

      if (viewType === "Replacement") {
        isIncluded = needsReplacement(eq.status, eq.condition_state, catName, eq.year_acquired, new Date(viewYear, 0, 1));
      } else {
        if (eq.year_acquired === viewYear) {
          isIncluded = true;
        }
      }

      return {
        ...eq,
        catName,
        rate: categoryRates.get(catName) || 0,
        isIncluded,
      };
    })
    .filter((eq) => eq.isIncluded);

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
