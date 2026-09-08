"use client"

import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"

export type ExportRow = Record<string, string | number | null>
export function ExportButton({ data, category = "inventory", label = "Export Excel", format = "xlsx" }: { data: ExportRow[]; category?: string; label?: string; format?: "xlsx" | "csv" }) {
  function exportFile() {
    const sheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, category.slice(0, 31))
    const filename = `pulse-${category.toLowerCase().replace(/\s+/g, "-")}.${format}`
    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(sheet)
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } else XLSX.writeFile(workbook, filename)
  }
  return (
    <Button variant="outline" onClick={exportFile} className="gap-2 font-medium">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      {label}
    </Button>
  )
}
