"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type DivisionData = {
  id: string
  code: string
  full_name: string
  _count?: { personnel: number; equipment: number; expired: number }
}

export const columns: ColumnDef<DivisionData>[] = [
  { accessorKey: "code", header: "Code", cell: ({ row }) => <Badge variant="secondary" className="bg-canvas-deep border-line text-slate">{row.original.code}</Badge> },
  { accessorKey: "full_name", header: "Division Name" },
  { id: "personnel_count", header: "Personnel", cell: ({ row }) => row.original._count?.personnel || 0 },
  { id: "equipment_count", header: "Equipment", cell: ({ row }) => row.original._count?.equipment || 0 },
  { id: "expired_count", header: "For replacement", cell: ({ row }) => <span className="text-alert">{row.original._count?.expired || 0}</span> },
]
