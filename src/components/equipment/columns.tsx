"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  equipmentDisplayStatus,
  type EquipmentDisplayStatus,
  type StoredEquipmentStatus,
} from "@/lib/pulse";

export type EquipmentData = {
  id: string;
  model: string | null;
  brand: string | null;
  serial_number: string | null;
  year_acquired: number | null;
  status: StoredEquipmentStatus;
  condition_state: string;
  is_rts: boolean;
  division: { code: string } | null;
  personnel: { full_name: string } | null;
  assignee: { full_name: string } | null;
  equipment_categories: { name: string; lifespan_years: number | null } | null;
};

function statusBadge(status: EquipmentDisplayStatus) {
  const styles: Record<EquipmentDisplayStatus, string> = {
    Active: "border-pulse text-pulse bg-pulse/10",
    "Expiring soon": "border-warning text-warning bg-warning/10",
    "For Replacement": "bg-alert text-paper",
    Broken: "border-alert text-alert bg-alert/10",
    Retired: "bg-slate text-canvas-deep",
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {status}
    </Badge>
  );
}

export const columns: ColumnDef<EquipmentData>[] = [
  {
    accessorKey: "brand",
    header: "Brand",
    cell: ({ row }) => (
      <span className="text-paper">{row.original.brand || "-"}</span>
    ),
  },
  {
    accessorKey: "model",
    header: "Model",
    cell: ({ row }) => (
      <span className="text-slate">{row.original.model || "-"}</span>
    ),
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
    accessorKey: "personnel.full_name",
    id: "custodian",
    header: "Custodian",
    cell: ({ row }) =>
      row.original.personnel?.full_name || (
        <span className="text-slate italic">Unassigned</span>
      ),
  },
  {
    accessorKey: "assignee.full_name",
    id: "assignee",
    header: "Assignee",
    cell: ({ row }) =>
      row.original.assignee?.full_name || (
        <span className="text-slate italic">Unassigned</span>
      ),
  },
  {
    accessorKey: "division.code",
    id: "division",
    header: "Division",
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className="bg-canvas-deep border-line text-slate"
      >
        {row.original.division?.code || "N/A"}
      </Badge>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) =>
      equipmentDisplayStatus(
        row.status,
        row.condition_state,
        row.equipment_categories?.lifespan_years,
        row.year_acquired
      ),
    cell: ({ row }) =>
      statusBadge(row.getValue("status") as EquipmentDisplayStatus),
  },
  {
    id: "rts",
    header: "RTS",
    accessorKey: "is_rts",
    cell: ({ row }) =>
      row.original.is_rts ? (
        <Badge
          variant="outline"
          className="border-warning text-warning bg-warning/10 whitespace-nowrap"
        >
          Return to Store
        </Badge>
      ) : (
        <span className="text-slate">—</span>
      ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link
        href={`/equipment/${row.original.id}`}
        className="text-sm font-medium text-pulse hover:underline"
      >
        View
      </Link>
    ),
  },
];
