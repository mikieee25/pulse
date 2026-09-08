import { createClient } from "@/utils/supabase/server";
import { SummaryContent } from "./summary-content";
import { lifecycleStatus } from "@/lib/pulse";

type RawEquipment = {
  id: string;
  year_acquired: number | null;
  procurement_method: string | null;
  status: "Active" | "For Replacement" | "Retired";
  equipment_categories: { name: string } | null;
  division: { code: string; full_name: string } | null;
};

export default async function SummaryPage(props: {
  searchParams: Promise<{ year?: string; view?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Default to 2026 Replacement if no params
  const viewYear = parseInt(searchParams.year || "2026");
  const viewType = searchParams.view || "Replacement"; // "Replacement" or "Summary"

  const { data: equipmentData } = await supabase.from("equipment").select(`
      id,
      year_acquired,
      procurement_method,
      status,
      equipment_categories(name),
      division:divisions(code, full_name)
    `);

  const equipments = (equipmentData || []) as unknown as RawEquipment[];

  const processedData = equipments
    .map((eq) => {
      let catName = eq.equipment_categories?.name || "Other";
      if (catName === "Desktop") catName = "Laptop"; // Combine Desktop and Laptop for summary matrix

      let isIncluded = false;

      if (viewType === "Replacement") {
        // 3 year lifespan logic for Replacement view
        const status = lifecycleStatus(
          eq.status,
          catName,
          eq.year_acquired,
          new Date(viewYear, 0, 1)
        );
        if (status === "For Replacement" || status === "Expiring soon") {
          isIncluded = true;
        }
      } else {
        // Summary view: year made
        if (eq.year_acquired === viewYear) {
          isIncluded = true;
        }
      }

      // Determine Rate
      let rate = 0;
      if (catName === "Laptop") rate = 160000;
      if (catName === "Tablet") rate = 115000; // Average of 90k/140k
      if (catName === "Printer") rate = 45000; // Average of 30k/60k

      return {
        ...eq,
        catName,
        rate,
        isIncluded,
      };
    })
    .filter(
      (eq) =>
        eq.isIncluded &&
        (eq.catName === "Laptop" ||
          eq.catName === "Tablet" ||
          eq.catName === "Printer")
    );

  // Get unique divisions that have requests
  const divCodes = Array.from(
    new Set(processedData.map((d) => d.division?.code).filter(Boolean))
  ) as string[];
  divCodes.sort();

  return (
    <SummaryContent
      initialData={processedData}
      divisions={divCodes}
      viewYear={viewYear}
      viewType={viewType}
    />
  );
}
