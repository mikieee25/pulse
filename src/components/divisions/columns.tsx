"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type DivisionData = {
  id: string
  code: string
  full_name: string
  _count?: {
    personnel: number
    equipment: number
  }
}

export const columns: ColumnDef<DivisionData>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => {
      const code = row.getValue("code") as string
      return <Badge variant="secondary" className="bg-canvas-deep border-line text-slate">{code}</Badge>
    }
  },
  {
    accessorKey: "full_name",
    header: "Division Name",
  },
  {
    id: "personnel_count",
    header: "Personnel",
    cell: ({ row }) => {
      const count = row.original._count?.personnel || 0
      return <span className="text-slate">{count}</span>
    }
  },
  {
    id: "equipment_count",
    header: "Equipment",
    cell: ({ row }) => {
      const count = row.original._count?.equipment || 0
      return <span className="text-slate">{count}</span>
    }
  },
]
