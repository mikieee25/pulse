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
  return <Button variant="outline" onClick={exportFile}>{label}</Button>
}
