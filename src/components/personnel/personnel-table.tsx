"use client";

import * as React from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PersonnelFilterBar } from "./personnel-filter-bar";
import { getPersonnelColumns, type PersonnelData } from "./columns";
import {
  personnelFiltersQuery,
  type PersonnelFilters,
} from "@/lib/personnel-filters";

type Division = { id: string; code: string; full_name: string };
export function PersonnelTable({
  data,
  divisions,
  canManage,
  filters,
  total,
}: {
  data: PersonnelData[];
  divisions: Division[];
  canManage: boolean;
  filters: PersonnelFilters;
  total: number;
}) {
  const columns = React.useMemo(
    () => getPersonnelColumns(divisions, canManage),
    [canManage, divisions]
  );
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: columns as ColumnDef<PersonnelData>[],
    getCoreRowModel: getCoreRowModel(),
  });
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const previous =
    filters.page > 1
      ? personnelFiltersQuery({ ...filters, page: filters.page - 1 })
      : "";
  const next =
    filters.page < totalPages
      ? personnelFiltersQuery({ ...filters, page: filters.page + 1 })
      : "";
  const start = total ? (filters.page - 1) * filters.pageSize + 1 : 0;
  const end = Math.min(filters.page * filters.pageSize, total);
  return (
    <div className="space-y-4">
      <PersonnelFilterBar filters={filters} divisions={divisions} />
      <div className="overflow-hidden rounded-xl border border-line bg-canvas-deep">
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
                  No personnel found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate">
          Showing {start}-{end} of {total} personnel
        </span>
        <div className="flex gap-2">
          <Link
            aria-disabled={filters.page <= 1}
            tabIndex={filters.page <= 1 ? -1 : 0}
            href={previous ? `/personnel?${previous}` : "#"}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm"
          >
            Previous
          </Link>
          <span className="px-2 py-2 text-xs text-slate">
            Page {filters.page} of {totalPages}
          </span>
          <Link
            aria-disabled={filters.page >= totalPages}
            tabIndex={filters.page >= totalPages ? -1 : 0}
            href={next ? `/personnel?${next}` : "#"}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm"
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
