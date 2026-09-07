"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type PersonnelData = {
  id: string
  full_name: string
  position: string | null
  plantilla_status: string | null
  division: { code: string; full_name: string } | null
}

export const columns: ColumnDef<PersonnelData>[] = [
  {
    accessorKey: "full_name",
    header: "Full Name",
  },
  {
    accessorKey: "position",
    header: "Position",
    cell: ({ row }) => {
      const position = row.getValue("position") as string
      return <span className="text-slate">{position || '-'}</span>
    }
  },
  {
    accessorKey: "division.code",
    id: "division",
    header: "Division",
    cell: ({ row }) => {
      const code = row.original.division?.code
      return <Badge variant="secondary" className="bg-canvas-deep border-line text-slate">{code || 'N/A'}</Badge>
    }
  },
  {
    accessorKey: "plantilla_status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("plantilla_status") as string
      return <span className="text-paper">{status || 'Contractual'}</span>
    }
  },
]
