"use client"

import * as React from "react"
import {
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getPersonnelColumns, type PersonnelData } from "@/components/personnel/columns"

type Division = { id: string; code: string; full_name: string }

interface PersonnelTableProps {
  data: PersonnelData[]
  divisions: Division[]
}

export function PersonnelTable({
  data,
  divisions,
}: PersonnelTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const columns = React.useMemo(() => getPersonnelColumns(divisions), [divisions])

  const positions = React.useMemo(() => Array.from(new Set(data.map((d) => d.position).filter((value): value is string => Boolean(value)))).sort(), [data])
  const statuses = React.useMemo(() => Array.from(new Set(data.map((d) => d.plantilla_status).filter((value): value is NonNullable<PersonnelData["plantilla_status"]> => Boolean(value)))).sort(), [data])

  // TanStack Table exposes a stateful API that React Compiler intentionally skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas/80 p-3">
        <input
          placeholder="Search by name..."
          value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("full_name")?.setFilterValue(event.target.value)
          }
          className="h-10 min-w-[220px] flex-1 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15"
        />
        <select
          value={(table.getColumn("division")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("division")?.setFilterValue(event.target.value)
          }
          className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15"
        >
          <option value="">All Divisions</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.code}>
              {d.code}
            </option>
          ))}
        </select>
        <select
          value={(table.getColumn("position")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("position")?.setFilterValue(event.target.value)
          }
          className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15"
        >
          <option value="">All Positions</option>
          {positions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={(table.getColumn("plantilla_status")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("plantilla_status")?.setFilterValue(event.target.value)
          }
          className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-canvas-deep">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-canvas">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-line hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-4 py-3 font-medium text-slate">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-line transition-colors hover:bg-paper/[0.025]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 text-paper">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate">
                  No personnel found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
