"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { lifecycleStatus, type LifecycleStatus, type StoredEquipmentStatus } from "@/lib/pulse"

export type EquipmentData = {
  id: string
  model: string | null
  brand: string | null
  serial_number: string | null
  year_acquired: number | null
  status: StoredEquipmentStatus
  division: { code: string } | null
  personnel: { full_name: string } | null
  equipment_categories: { name: string } | null
}

function statusBadge(status: LifecycleStatus) {
  const styles: Record<LifecycleStatus, string> = { Active: "border-pulse text-pulse bg-pulse/10", "Expiring soon": "border-amber-400 text-amber-300 bg-amber-400/10", "For Replacement": "bg-alert text-paper", Retired: "bg-slate text-canvas-deep" }
  return <Badge variant="outline" className={styles[status]}>{status}</Badge>
}

export const columns: ColumnDef<EquipmentData>[] = [
  { accessorKey: "brand", header: "Brand", cell: ({ row }) => <span className="text-paper">{row.original.brand || "-"}</span> },
  { accessorKey: "model", header: "Model", cell: ({ row }) => <span className="text-slate">{row.original.model || "-"}</span> },
  { accessorKey: "serial_number", header: "Serial No.", cell: ({ row }) => row.original.serial_number || "-" },
  { accessorKey: "year_acquired", header: "Year", cell: ({ row }) => row.original.year_acquired || "-" },
  { accessorKey: "personnel.full_name", id: "custodian", header: "Custodian", cell: ({ row }) => row.original.personnel?.full_name || <span className="text-slate italic">Unassigned</span> },
  { accessorKey: "division.code", id: "division", header: "Division", cell: ({ row }) => <Badge variant="secondary" className="bg-canvas-deep border-line text-slate">{row.original.division?.code || "N/A"}</Badge> },
  { id: "status", header: "Status", accessorFn: (row) => lifecycleStatus(row.status, row.equipment_categories?.name, row.year_acquired), cell: ({ row }) => statusBadge(row.getValue("status") as LifecycleStatus) },
  { id: "actions", cell: ({ row }) => <a href={`/equipment/${row.original.id}`} className="text-sm font-medium text-pulse hover:underline">View</a> },
]
