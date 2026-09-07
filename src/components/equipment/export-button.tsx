"use client"

import { Button } from "@/components/ui/button"
import * as xlsx from "xlsx"

export function ExportButton({ data, category }: { data: any[], category: string }) {
  const handleExport = () => {
    // Flatten data for export
    const flatData = data.map(item => ({
      Category: item.equipment_categories?.name || category,
      Brand: item.brand,
      Model: item.model,
      'Serial Number': item.serial_number,
      'Year Acquired': item.year_acquired,
      Status: item.status,
      Division: item.division?.code || 'N/A',
      Custodian: item.personnel?.full_name || 'Unassigned',
    }))

    const ws = xlsx.utils.json_to_sheet(flatData)
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, "Inventory")
    
    // Auto-size columns loosely
    const colWidths = [
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 25 }
    ]
    ws['!cols'] = colWidths
    
    xlsx.writeFile(wb, `PULSE_Inventory_${category}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <Button 
      variant="outline" 
      className="bg-canvas border-line text-paper hover:bg-canvas-deep hover:text-pulse"
      onClick={handleExport}
    >
      Export Excel
    </Button>
  )
}
