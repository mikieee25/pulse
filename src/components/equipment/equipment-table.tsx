"use client";

import * as React from "react";
import Link from "next/link";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  equipmentFiltersQuery,
  type EquipmentFilters,
} from "@/lib/equipment-filters";
import type { EquipmentData } from "./columns";
import { EquipmentFilterBar } from "./equipment-filter-bar";

type EquipmentTableProps = {
  columns: ColumnDef<EquipmentData>[];
  data: EquipmentData[];
  category: string;
  initialFilters: EquipmentFilters;
  total: number;
  page: number;
  pageSize: number;
  divisions?: string[];
  brands?: string[];
};

export function EquipmentTable({
  columns,
  data,
  category,
  initialFilters,
  total,
  page,
  pageSize,
  divisions = [],
  brands = [],
}: EquipmentTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  // TanStack Table exposes a stateful API that React Compiler intentionally skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });
  const baseFilters = { ...initialFilters, page: 1, pageSize };
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const previous =
    page > 1
      ? equipmentFiltersQuery({ ...baseFilters, page: page - 1 }, category)
      : "";
  const next =
    page < totalPages
      ? equipmentFiltersQuery({ ...baseFilters, page: page + 1 }, category)
      : "";
  const pageStart = total ? (page - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <EquipmentFilterBar
        category={category}
        filters={initialFilters}
        pageSize={pageSize}
        divisions={divisions}
        brands={brands}
      />
      <p className="text-xs text-slate">
        Showing {pageStart}-{pageEnd} of {total} matching{" "}
        {total === 1 ? "asset" : "assets"}
      </p>
      <div className="overflow-hidden rounded-xl border border-line bg-canvas-deep">
        <div className="max-h-[680px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-canvas">
              {table.getHeaderGroups().map((group) => (
                <TableRow
                  key={group.id}
                  className="border-line hover:bg-transparent"
                >
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-4 py-3 font-medium text-slate"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-line transition-colors hover:bg-paper/[0.025]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3 text-paper">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-slate"
                  >
                    No equipment found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Link
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : 0}
          className={`inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-paper/5"}`}
          href={previous ? `/equipment?${previous}` : "#"}
        >
          Previous
        </Link>
        <span className="px-2 text-xs text-slate">
          Page {page} of {totalPages}
        </span>
        <Link
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : 0}
          className={`inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-paper/5"}`}
          href={next ? `/equipment?${next}` : "#"}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
