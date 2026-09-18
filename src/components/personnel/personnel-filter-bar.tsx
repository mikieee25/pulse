"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { TablePageSizeSelect } from "@/components/layout/table-page-size-select";
import type { PersonnelFilters } from "@/lib/personnel-filters";

export function PersonnelFilterBar({
  filters,
  divisions,
}: {
  filters: PersonnelFilters;
  divisions: Array<{ id: string; code: string }>;
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas/80 p-3"
    >
      <input type="hidden" name="page" value="1" />
      <Input
        name="q"
        aria-label="Search personnel"
        placeholder="Search by name, initials, position..."
        defaultValue={filters.q}
        className="h-10 min-w-[240px] flex-1 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper"
      />
      <NativeSelect
        name="division"
        aria-label="Filter division"
        defaultValue={filters.division}
        className="h-10 rounded-lg border border-line bg-canvas-deep pl-3 pr-10 text-sm text-paper"
      >
        <option value="">All Divisions</option>
        {divisions.map((d) => (
          <option key={d.id} value={d.code}>
            {d.code}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        name="status"
        aria-label="Filter status"
        defaultValue={filters.status}
        className="h-10 rounded-lg border border-line bg-canvas-deep pl-3 pr-10 text-sm text-paper"
      >
        <option value="">All Statuses</option>
        <option>Regular</option>
        <option>Outsourced</option>
        <option>COS</option>
        <option>For Transfer</option>
      </NativeSelect>
      <NativeSelect
        name="assignment"
        aria-label="Filter assignment"
        defaultValue={filters.assignment}
        className="h-10 rounded-lg border border-line bg-canvas-deep pl-3 pr-10 text-sm text-paper"
      >
        <option value="">All Assignments</option>
        <option value="assigned">With equipment</option>
        <option value="unassigned">No equipment</option>
      </NativeSelect>
      <TablePageSizeSelect value={filters.pageSize} name="pageSize" />
      <Button type="submit" size="action">
        Apply
      </Button>
      <Link
        href="/personnel"
        aria-label="Clear personnel filters"
        className="inline-flex h-10 items-center whitespace-nowrap rounded-lg border border-line px-4 text-sm text-slate hover:text-paper"
      >
        Clear
      </Link>
    </form>
  );
}
