"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TablePageSizeSelect } from "@/components/layout/table-page-size-select";
import type { EquipmentFilters } from "@/lib/equipment-filters";

export function EquipmentFilterBar({
  category,
  filters,
  pageSize,
  divisions,
  brands,
}: {
  category: string;
  filters: EquipmentFilters;
  pageSize: number;
  divisions: string[];
  brands: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  useEffect(() => {
    const current = searchParams.get("q") || "";
    if (current === query) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (query) next.set("q", query);
      else next.delete("q");
      next.delete("page");
      startTransition(() => router.replace(`${pathname}?${next.toString()}`));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filters.q, pathname, query, router, searchParams]);
  return (
    <form
      method="get"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas/80 p-3"
    >
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="page" value="1" />
      <input
        name="q"
        aria-label="Search equipment"
        placeholder="Search serial, model, brand, custodian..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-10 min-w-[260px] flex-1 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none focus:border-pulse focus:ring-2 focus:ring-pulse/15"
      />
      <select
        name="division"
        aria-label="Filter division"
        defaultValue={filters.division}
        className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper"
      >
        <option value="">All Divisions</option>
        {divisions.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      <select
        name="brand"
        aria-label="Filter brand"
        defaultValue={filters.brand}
        className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper"
      >
        <option value="">All Brands</option>
        {brands.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      <select
        name="status"
        aria-label="Filter status"
        defaultValue={filters.status}
        className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper"
      >
        <option value="">All Statuses</option>
        <option>Active</option>
        <option>Expiring soon</option>
        <option>For Replacement</option>
        <option>Broken</option>
        <option>Retired</option>
      </select>
      <select
        name="assignment"
        aria-label="Filter assignment"
        defaultValue={filters.assignment}
        className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper"
      >
        <option value="">All Assignments</option>
        <option value="unassigned">Unassigned</option>
      </select>
      <select
        name="rts"
        aria-label="Filter RTS"
        defaultValue={filters.rts}
        className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper"
      >
        <option value="">All store status</option>
        <option value="rts">RTS · Return to Store</option>
      </select>
      <TablePageSizeSelect value={pageSize} name="pageSize" />
      <Button type="submit" size="sm">
        Apply
      </Button>
      {isPending && <span role="status" className="text-xs text-slate">Updating equipment…</span>}
      <Link
        href={`/equipment?category=${encodeURIComponent(category)}`}
        aria-label="Clear filters"
        className="rounded-lg border border-line px-3 py-2 text-sm text-slate hover:text-paper"
      >
        Clear
      </Link>
    </form>
  );
}
