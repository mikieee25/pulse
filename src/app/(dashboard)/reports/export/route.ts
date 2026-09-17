import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { getEquipmentPage } from "@/lib/inventory-queries";
import { toCsv } from "@/lib/csv";
import { parseEquipmentFilters } from "@/lib/equipment-filters";

export async function GET(request: Request) {
  const access = await requireProfile();
  if (access.error)
    return NextResponse.json(
      { error: access.error },
      { status: 403, headers: { "Cache-Control": "private, no-store" } }
    );
  const url = new URL(request.url);
  const filters = parseEquipmentFilters(url.searchParams);
  const rows: Array<Record<string, unknown>> = [];
  let page = 1;
  let total = 0;
  do {
    const result = await getEquipmentPage(
      { ...filters, category: "", page },
      50
    );
    if (result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500, headers: { "Cache-Control": "private, no-store" } }
      );
    total = result.total;
    rows.push(
      ...result.rows.map((item) => ({
        "Serial Number": item.serial_number || "",
        Brand: item.brand || "",
        Model: item.model || "",
        Division: item.division?.code || "",
        Custodian: item.personnel?.full_name || "Unassigned",
        Assignee: item.assignee?.full_name || "Unassigned",
        Status: item.displayStatus,
      }))
    );
    page += 1;
  } while (rows.length < total && page <= 100);
  const csv = toCsv(
    [
      "Serial Number",
      "Brand",
      "Model",
      "Division",
      "Custodian",
      "Assignee",
      "Status",
    ],
    rows
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pulse-inventory-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
