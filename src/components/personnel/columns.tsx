"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { PersonnelActions } from "@/components/personnel/personnel-actions"
import type { PlantillaStatus } from "@/lib/pulse"

export type PersonnelData = {
  id: string
  full_name: string
  initials: string
  position: string | null
  plantilla_status: PlantillaStatus | null
  division_id: string
  division: { code: string; full_name: string } | null
  equipment: Array<{ id: string; brand: string | null; model: string | null }> | null
}

type Division = { id: string; code: string; full_name: string }

export const getPersonnelColumns = (divisions: Division[]): ColumnDef<PersonnelData>[] => [
  { accessorKey: "full_name", header: "Full Name" },
  { accessorKey: "position", header: "Position", cell: ({ row }) => <span className="text-slate">{row.original.position || "-"}</span> },
  { accessorKey: "division.code", id: "division", header: "Division", cell: ({ row }) => <Badge variant="secondary" className="bg-canvas-deep border-line text-slate">{row.original.division?.code || "N/A"}</Badge> },
  { accessorKey: "plantilla_status", header: "Status", cell: ({ row }) => <span className="text-paper">{row.original.plantilla_status || "-"}</span> },
  { id: "equipment", header: "Assigned equipment", cell: ({ row }) => <span className="text-slate">{row.original.equipment?.map((item) => `${item.brand || ""} ${item.model || "unit"}`.trim()).join(", ") || "None"}</span> },
  { id: "actions", header: "Actions", cell: ({ row }) => <PersonnelActions person={row.original} divisions={divisions} /> },
]
