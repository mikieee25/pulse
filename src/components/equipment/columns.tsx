"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

// This type is used to define the shape of our data.
export type EquipmentData = {
  id: string
  model: string | null
  brand: string | null
  serial_number: string | null
  year_acquired: number | null
  status: 'Active' | 'For Replacement' | 'Retired'
  division: { code: string }
  personnel: { full_name: string } | null
}

export const columns: ColumnDef<EquipmentData>[] = [
  {
    accessorKey: "brand",
    header: "Brand",
    cell: ({ row }) => row.original.brand || "-",
  },
  {
    accessorKey: "model",
    header: "Model",
    cell: ({ row }) => row.original.model || "-",
  },
  {
    accessorKey: "serial_number",
    header: "Serial No.",
    cell: ({ row }) => row.original.serial_number || "-",
  },
  {
    accessorKey: "year_acquired",
    header: "Year",
    cell: ({ row }) => row.original.year_acquired || "-",
  },
  {
    id: "division",
    accessorFn: (row) => row.division?.code,
    header: "Division",
  },
  {
    id: "custodian",
    accessorFn: (row) => row.personnel?.full_name || "Unassigned",
    header: "Custodian",
    cell: ({ row }) => {
      const name = row.original.personnel?.full_name;
      return name ? <span className="text-paper">{name}</span> : <span className="text-slate italic">Unassigned</span>;
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      
      if (status === 'Active') {
        return <Badge variant="outline" className="border-pulse text-pulse bg-pulse/10">Active</Badge>
      }
      if (status === 'For Replacement') {
        return <Badge variant="destructive" className="bg-alert text-paper">For Replacement</Badge>
      }
      return <Badge variant="secondary" className="bg-slate text-canvas-deep">Retired</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <a 
          href={`/equipment/${row.original.id}`}
          className="text-sm font-medium text-pulse hover:underline"
        >
          View
        </a>
      )
    },
  },
]
