"use client"

import * as React from "react"
import { ColumnDef, ColumnFiltersState, SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

type EquipmentFilterRow = { division?: { code?: string | null } | null; brand?: string | null }

export function EquipmentTable<TData, TValue>({ columns, data }: { columns: ColumnDef<TData, TValue>[]; data: TData[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  // TanStack Table exposes a stateful API that React Compiler intentionally skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), onSortingChange: setSorting, getSortedRowModel: getSortedRowModel(), onColumnFiltersChange: setColumnFilters, getFilteredRowModel: getFilteredRowModel(), state: { sorting, columnFilters } })
  const filterRows = data as unknown as EquipmentFilterRow[]
  const divisions = React.useMemo(() => Array.from(new Set(filterRows.map(d => d.division?.code).filter(Boolean))).sort() as string[], [filterRows])
  const brands = React.useMemo(() => Array.from(new Set(filterRows.map(d => d.brand).filter(Boolean))).sort() as string[], [filterRows])

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas/80 p-3">
      <input 
        placeholder="Search custodian..." 
        value={(table.getColumn("custodian")?.getFilterValue() as string) ?? ""} 
        onChange={(event) => table.getColumn("custodian")?.setFilterValue(event.target.value)} 
        className="h-10 min-w-[220px] flex-1 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15" 
      />
      
      <select 
        value={(table.getColumn("division")?.getFilterValue() as string) ?? ""} 
        onChange={(event) => table.getColumn("division")?.setFilterValue(event.target.value)} 
        className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15"
      >
        <option value="">All Divisions</option>
        {divisions.map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      <select 
        value={(table.getColumn("brand")?.getFilterValue() as string) ?? ""} 
        onChange={(event) => table.getColumn("brand")?.setFilterValue(event.target.value)} 
        className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15"
      >
        <option value="">All Brands</option>
        {brands.map(b => <option key={b} value={b}>{b}</option>)}
      </select>

      <select 
        aria-label="Filter status" 
        value={(table.getColumn("status")?.getFilterValue() as string) ?? ""} 
        onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value)} 
        className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15"
      >
        <option value="">All Statuses</option>
        <option>Active</option>
        <option>Expiring soon</option>
        <option>For Replacement</option>
        <option>Retired</option>
      </select>
    </div>
    <div className="overflow-hidden rounded-xl border border-line bg-canvas-deep"><div className="max-h-[680px] overflow-auto"><Table><TableHeader className="sticky top-0 z-10 bg-canvas">{table.getHeaderGroups().map((group) => <TableRow key={group.id} className="border-line hover:bg-transparent">{group.headers.map((header) => <TableHead key={header.id} className="px-4 py-3 font-medium text-slate">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id} className="border-line transition-colors hover:bg-paper/[0.025]">{row.getVisibleCells().map((cell) => <TableCell key={cell.id} className="px-4 py-3 text-paper">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-slate">No equipment found.</TableCell></TableRow>}</TableBody></Table></div></div>
    <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button></div>
  </div>
}
