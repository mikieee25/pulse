"use client"

import { Banknote, CalendarRange, Download, PackageCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { MetricCard } from "@/components/layout/metric-card"
import { PageHeader } from "@/components/layout/page-header"
import { SectionPanel } from "@/components/layout/section-panel"

export type ProcessedEquipment = {
  id: string
  year_acquired: number | null
  procurement_method: string | null
  status: string
  catName: string
  rate: number
  division: { code: string; full_name: string } | null
}

export function SummaryContent({
  initialData,
  divisions,
  viewYear,
  viewType,
}: {
  initialData: ProcessedEquipment[]
  divisions: string[]
  viewYear: number
  viewType: string
}) {
  const router = useRouter()
  const grandTotal = initialData.reduce((sum, item) => sum + item.rate, 0)
  const totalUnits = initialData.length

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === "2026-Replacement") {
      router.push("/summary?year=2026&view=Replacement")
    } else {
      router.push("/summary?year=2025&view=Summary")
    }
  }

  const formatMoney = (n: number) => "₱ " + n.toLocaleString()

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><CalendarRange className="size-3.5" aria-hidden="true" />Planning summary</span>}
        title="Summary"
        description="Multi-division replacement requests and budget totals."
        actions={<>
          <label className="flex items-center gap-2 rounded-xl border border-line bg-canvas/80 p-1.5">
            <span className="sr-only">Summary period</span>
            <select value={`${viewYear}-${viewType}`} onChange={handleYearChange} aria-label="Summary period" className="h-9 rounded-lg border border-line bg-canvas-deep px-3 text-sm text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15">
              <option value="2026-Replacement">FY 2026 Replacement</option>
              <option value="2025-Summary">FY 2025 Summary</option>
            </select>
          </label>
          <button type="button" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-4 text-sm font-semibold text-paper transition hover:border-pulse/40 hover:text-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40">
            <Download className="size-4" aria-hidden="true" />Export Excel
          </button>
        </>}
      />

      <section aria-labelledby="summary-overview-title" className="grid gap-4 sm:grid-cols-2">
        <h2 id="summary-overview-title" className="sr-only">Summary overview</h2>
        <MetricCard label="Grand total budget" value={formatMoney(grandTotal)} detail={`FY ${viewYear} forecast`} icon={Banknote} tone="pulse" />
        <MetricCard label="Total units requested" value={totalUnits} detail={`${divisions.length} requesting divisions`} icon={PackageCheck} tone="warning" />
      </section>

      <SectionPanel title="Division summary" description="Requested units and forecast totals by equipment category">
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Division summary for FY {viewYear}</caption>
            <thead className="sticky top-0 z-10 bg-canvas">
              <tr className="border-b border-line text-left text-slate">
                <th scope="col" className="px-5 py-3 font-medium">Division</th>
                <th scope="col" className="border-l border-line px-4 py-3 text-center font-medium"><div>Laptop</div><div className="text-[11px] font-normal text-slate">Rate: ₱160,000</div></th>
                <th scope="col" className="border-l border-line px-4 py-3 text-center font-medium"><div>Tablet</div><div className="text-[11px] font-normal text-slate">Rate: ₱115,000</div></th>
                <th scope="col" className="border-l border-line px-4 py-3 text-center font-medium"><div>Printer</div><div className="text-[11px] font-normal text-slate">Rate: ₱45,000</div></th>
                <th scope="col" className="border-l border-line px-5 py-3 text-right font-medium text-pulse">Division total</th>
              </tr>
            </thead>
            <tbody>
              {divisions.map((div) => {
                const divItems = initialData.filter((d) => d.division?.code === div)
                if (divItems.length === 0) return null
                const lCount = divItems.filter((d) => d.catName === "Laptop").length
                const tCount = divItems.filter((d) => d.catName === "Tablet").length
                const pCount = divItems.filter((d) => d.catName === "Printer").length
                const divTotal = divItems.reduce((sum, item) => sum + item.rate, 0)

                return (
                  <tr key={div} className="border-b border-line/50 transition hover:bg-paper/[0.025]">
                    <th scope="row" className="px-5 py-3 text-left font-semibold text-paper">{div}</th>
                    <td className={`border-l border-line px-4 py-3 text-center tabular-nums ${lCount ? "text-pulse" : "text-slate/50"}`}>{lCount || "—"}</td>
                    <td className={`border-l border-line px-4 py-3 text-center tabular-nums ${tCount ? "text-pulse" : "text-slate/50"}`}>{tCount || "—"}</td>
                    <td className={`border-l border-line px-4 py-3 text-center tabular-nums ${pCount ? "text-pulse" : "text-slate/50"}`}>{pCount || "—"}</td>
                    <td className="border-l border-line px-5 py-3 text-right font-semibold tabular-nums text-paper">{formatMoney(divTotal)}</td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-line bg-canvas text-paper">
                <th scope="row" className="px-5 py-4 text-left font-semibold">Category totals</th>
                <td className="border-l border-line px-4 py-4 text-center font-semibold tabular-nums text-pulse">{initialData.filter((d) => d.catName === "Laptop").length}</td>
                <td className="border-l border-line px-4 py-4 text-center font-semibold tabular-nums text-pulse">{initialData.filter((d) => d.catName === "Tablet").length}</td>
                <td className="border-l border-line px-4 py-4 text-center font-semibold tabular-nums text-pulse">{initialData.filter((d) => d.catName === "Printer").length}</td>
                <td className="border-l border-line px-5 py-4 text-right text-base font-bold tabular-nums text-pulse">{formatMoney(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  )
}
