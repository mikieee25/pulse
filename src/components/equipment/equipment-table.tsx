"use client"

import * as React from "react"
import { ColumnDef, ColumnFiltersState, SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function EquipmentTable<TData, TValue>({ columns, data }: { columns: ColumnDef<TData, TValue>[]; data: TData[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  // TanStack Table exposes a stateful API that React Compiler intentionally skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), onSortingChange: setSorting, getSortedRowModel: getSortedRowModel(), onColumnFiltersChange: setColumnFilters, getFilteredRowModel: getFilteredRowModel(), state: { sorting, columnFilters } })
  const filter = (id: string, placeholder: string) => <Input placeholder={placeholder} value={(table.getColumn(id)?.getFilterValue() as string) ?? ""} onChange={(event) => table.getColumn(id)?.setFilterValue(event.target.value)} className="max-w-sm bg-canvas-deep text-paper border-line focus-visible:ring-pulse" />
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">{filter("custodian", "Search custodian...")}{filter("division", "Filter division...")}{filter("brand", "Filter brand...")}<select aria-label="Filter status" value={(table.getColumn("status")?.getFilterValue() as string) ?? ""} onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value)} className="h-9 rounded-md border border-line bg-canvas-deep px-2 text-sm text-paper"><option value="">All statuses</option><option>Active</option><option>Expiring soon</option><option>For Replacement</option><option>Retired</option></select></div>
    <div className="rounded-md border border-line bg-canvas-deep overflow-x-auto"><Table><TableHeader className="bg-canvas">{table.getHeaderGroups().map((group) => <TableRow key={group.id} className="border-line hover:bg-transparent">{group.headers.map((header) => <TableHead key={header.id} className="text-slate font-medium">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id} className="border-line hover:bg-canvas transition-colors">{row.getVisibleCells().map((cell) => <TableCell key={cell.id} className="text-paper">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-slate">No equipment found.</TableCell></TableRow>}</TableBody></Table></div>
    <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button></div>
  </div>
}
