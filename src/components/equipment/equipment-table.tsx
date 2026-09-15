"use client"

import * as React from "react"
import { ColumnDef, ColumnFiltersState, PaginationState, SortingState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { equipmentFiltersQuery, type EquipmentFilters } from "@/lib/equipment-filters"
import type { EquipmentData } from "./columns"

type EquipmentTableProps = {
  columns: ColumnDef<EquipmentData>[]
  data: EquipmentData[]
  category: string
  initialFilters: EquipmentFilters
}

function columnFilterValue(filters: ColumnFiltersState, id: string) {
  return String(filters.find((filter) => filter.id === id)?.value || "")
}

export function EquipmentTable({ columns, data, category, initialFilters }: EquipmentTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState(initialFilters.q)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(() => [
    initialFilters.division && { id: "division", value: initialFilters.division },
    initialFilters.brand && { id: "brand", value: initialFilters.brand },
    initialFilters.status && { id: "status", value: initialFilters.status },
  ].filter(Boolean) as ColumnFiltersState)
  const [assignment, setAssignment] = React.useState(initialFilters.assignment)
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: initialFilters.page - 1, pageSize: 10 })
  const filteredData = React.useMemo(
    () => assignment === "unassigned" ? data.filter((item) => !item.personnel && !item.assignee) : data,
    [assignment, data],
  )

  // TanStack Table exposes a stateful API that React Compiler intentionally skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: (update) => {
      setColumnFilters(update)
      setPagination((current) => ({ ...current, pageIndex: 0 }))
    },
    onGlobalFilterChange: (value) => {
      setGlobalFilter(String(value || ""))
      setPagination((current) => ({ ...current, pageIndex: 0 }))
    },
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const item = row.original as EquipmentData
      const haystack = [
        item.serial_number,
        item.model,
        item.brand,
        item.division?.code,
        item.personnel?.full_name,
        item.assignee?.full_name,
        item.equipment_categories?.name,
      ].filter(Boolean).join(" ").toLowerCase()
      return haystack.includes(String(filterValue).toLowerCase())
    },
    state: { sorting, columnFilters, globalFilter, pagination },
  })
  const divisions = React.useMemo(() => Array.from(new Set(data.map((item) => item.division?.code).filter(Boolean))).sort() as string[], [data])
  const brands = React.useMemo(() => Array.from(new Set(data.map((item) => item.brand).filter(Boolean))).sort() as string[], [data])
  const filteredRows = table.getFilteredRowModel().rows

  React.useEffect(() => {
    const filters: EquipmentFilters = {
      q: globalFilter.trim(),
      division: columnFilterValue(columnFilters, "division"),
      brand: columnFilterValue(columnFilters, "brand"),
      status: columnFilterValue(columnFilters, "status") as EquipmentFilters["status"],
      assignment,
      page: pagination.pageIndex + 1,
    }
    const query = equipmentFiltersQuery(filters, category)
    window.history.replaceState(null, "", query ? `/equipment?${query}` : "/equipment")
  }, [assignment, category, columnFilters, globalFilter, pagination.pageIndex])

  const clearFilters = () => {
    setGlobalFilter("")
    setColumnFilters([])
    setAssignment("")
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas/80 p-3">
      <input aria-label="Search equipment" placeholder="Search serial, model, brand, custodian..." value={globalFilter} onChange={(event) => table.setGlobalFilter(event.target.value)} className="h-10 min-w-[260px] flex-1 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15" />
      <select aria-label="Filter division" value={columnFilterValue(columnFilters, "division")} onChange={(event) => table.getColumn("division")?.setFilterValue(event.target.value)} className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15">
        <option value="">All Divisions</option>
        {divisions.map((division) => <option key={division} value={division}>{division}</option>)}
      </select>
      <select aria-label="Filter brand" value={columnFilterValue(columnFilters, "brand")} onChange={(event) => table.getColumn("brand")?.setFilterValue(event.target.value)} className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15">
        <option value="">All Brands</option>
        {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
      </select>
      <select aria-label="Filter status" value={columnFilterValue(columnFilters, "status")} onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value)} className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15">
        <option value="">All Statuses</option>
        <option>Active</option>
        <option>Expiring soon</option>
        <option>For Replacement</option>
        <option>Broken</option>
        <option>Retired</option>
      </select>
      <select aria-label="Filter assignment" value={assignment} onChange={(event) => { setAssignment(event.target.value as EquipmentFilters["assignment"]); setPagination((current) => ({ ...current, pageIndex: 0 })) }} className="h-10 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition-colors focus:border-pulse focus:ring-2 focus:ring-pulse/15">
        <option value="">All Assignments</option>
        <option value="unassigned">Unassigned</option>
      </select>
      <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
    </div>
    <p className="text-xs text-slate">Showing {table.getRowModel().rows.length} of {filteredRows.length} matching {data.length === 1 ? "asset" : "assets"}</p>
    <div className="overflow-hidden rounded-xl border border-line bg-canvas-deep"><div className="max-h-[680px] overflow-auto"><Table><TableHeader className="sticky top-0 z-10 bg-canvas">{table.getHeaderGroups().map((group) => <TableRow key={group.id} className="border-line hover:bg-transparent">{group.headers.map((header) => <TableHead key={header.id} className="px-4 py-3 font-medium text-slate">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id} className="border-line transition-colors hover:bg-paper/[0.025]">{row.getVisibleCells().map((cell) => <TableCell key={cell.id} className="px-4 py-3 text-paper">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-slate">No equipment found.</TableCell></TableRow>}</TableBody></Table></div></div>
    <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button></div>
  </div>
}
