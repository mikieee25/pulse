"use client"

import { Banknote, CircleAlert, FileText, PackageCheck, UserRound } from "lucide-react"
import { useMemo, useState } from "react"
import { ExportButton } from "@/components/equipment/export-button"
import { MetricCard } from "@/components/layout/metric-card"
import { PageHeader } from "@/components/layout/page-header"
import { SectionPanel } from "@/components/layout/section-panel"
import { lifecycleStatus, type StoredEquipmentStatus } from "@/lib/pulse"

export type ReportEquipment = {
  id: string
  brand: string | null
  model: string | null
  year_acquired: number | null
  serial_number: string | null
  procurement_method: string | null
  status: string
  condition_state: string
  division: { code: string } | null
  personnel: { full_name: string } | null
  assignee: { full_name: string } | null
  equipment_categories: { name: string } | null
}

export function ReportsClient({ initialData }: { initialData: ReportEquipment[] }) {
  const [activeTab, setActiveTab] = useState("Full Master Inventory")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDivision, setFilterDivision] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterCondition, setFilterCondition] = useState("")
  const [filterAssignment, setFilterAssignment] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const currentYear = new Date().getFullYear()

  const processedData = useMemo(() => initialData.map(item => {
    const catName = item.equipment_categories?.name || "Other"
    const custodian = item.personnel?.full_name || ""
    const isUnassigned = !custodian
    let rate = 0
    if (catName === "Laptop" || catName === "Desktop") rate = 160000
    if (catName === "Tablet") rate = 115000
    if (catName === "Printer") rate = 45000
    const serviceLife = item.year_acquired ? currentYear - item.year_acquired : 0
    const dynamic = lifecycleStatus(item.status as StoredEquipmentStatus, catName, item.year_acquired)
    const displayStatus = item.condition_state === "Good" ? dynamic : item.condition_state
    return { ...item, catName, custodian, isUnassigned, rate, serviceLife, displayStatus }
  }), [initialData, currentYear])

  const filteredData = useMemo(() => {
    let result = processedData
    if (activeTab === "For Replacement / Condemned") result = result.filter(d => d.displayStatus === "For Replacement" || d.displayStatus === "Broken")
    else if (activeTab === "Unassigned Equipment") result = result.filter(d => d.isUnassigned)
    else if (activeTab === "3+ Years Aging Summary") result = result.filter(d => d.serviceLife >= 3)
    if (filterDivision) result = result.filter(d => d.division?.code === filterDivision)
    if (filterCategory) result = result.filter(d => d.catName === filterCategory)
    if (filterCondition) result = result.filter(d => d.displayStatus === filterCondition)
    if (filterAssignment === "Assigned Only") result = result.filter(d => !d.isUnassigned)
    else if (filterAssignment === "Unassigned Only") result = result.filter(d => d.isUnassigned)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(d => (d.serial_number && d.serial_number.toLowerCase().includes(q)) || (d.brand && d.brand.toLowerCase().includes(q)) || (d.model && d.model.toLowerCase().includes(q)))
    }
    return result
  }, [processedData, activeTab, filterDivision, filterCategory, filterCondition, filterAssignment, searchQuery])

  const totalItems = filteredData.length
  const unassignedCount = filteredData.filter(d => d.isUnassigned).length
  const unassignedRatio = totalItems > 0 ? Math.round((unassignedCount / totalItems) * 100) : 0
  const flaggedCount = filteredData.filter(d => d.displayStatus === "For Replacement" || d.displayStatus === "Broken").length
  const totalValue = filteredData.reduce((sum, item) => sum + item.rate, 0)
  const formatMoney = (n: number) => n >= 1000000 ? `₱ ${(n / 1000000).toFixed(1)}M` : `₱ ${n.toLocaleString()}`
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const divisions = Array.from(new Set(processedData.map(d => d.division?.code).filter(Boolean))) as string[]
  const categories = Array.from(new Set(processedData.map(d => d.catName)))
  const conditions = Array.from(new Set(processedData.map(d => d.displayStatus)))
  const exportRows = filteredData.map((item) => ({
    "Serial Number": item.serial_number || "",
    Category: item.catName,
    Brand: item.brand || "",
    Model: item.model || "",
    "Year Acquired": item.year_acquired,
    "Procurement Method": item.procurement_method || "",
    Division: item.division?.code || "",
    Custodian: item.custodian || "Unassigned",
    Assignee: item.assignee?.full_name || "Unassigned",
    Status: item.displayStatus,
    "Service Life (Years)": item.serviceLife,
  }))

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><FileText className="size-3.5" aria-hidden="true" />Audit workspace</span>}
        title="Inventory & Audit Report"
        description="Generate, filter, and export verified asset reports for COA audit and budget review."
        actions={<>
          <ExportButton data={exportRows} category="inventory" label="Export CSV" format="csv" />
          <ExportButton data={exportRows} category="inventory" label="Export Excel" format="xlsx" />
        </>}
      />

      <SectionPanel title="Report views" description="Choose a prepared view of the asset register">
        <nav className="flex gap-2 overflow-x-auto p-5" aria-label="Report views">
          {["Full Master Inventory", "For Replacement / Condemned", "Unassigned Equipment", "3+ Years Aging Summary"].map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={activeTab === tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1) }}
              className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40 ${activeTab === tab ? "border-pulse/40 bg-pulse/10 text-pulse" : "border-line text-slate hover:border-paper/25 hover:bg-paper/5 hover:text-paper"}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </SectionPanel>

      <section aria-labelledby="report-overview-title" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <h2 id="report-overview-title" className="sr-only">Report overview</h2>
        <MetricCard label="Filtered total" value={totalItems} detail="Matching records" icon={PackageCheck} />
        <MetricCard label="Unassigned ratio" value={`${unassignedRatio}%`} detail={`${unassignedCount} units`} icon={UserRound} tone="warning" />
        <MetricCard label="Flagged for replacement" value={flaggedCount} detail="Requires attention" icon={CircleAlert} tone="alert" />
        <MetricCard label="Estimated asset value" value={formatMoney(totalValue)} detail="Based on standard rates" icon={Banknote} tone="pulse" />
      </section>

      <SectionPanel title="Filters" description="Refine the selected report view">
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <input type="text" aria-label="Search inventory" placeholder="Search serial, model, brand..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15 xl:col-span-1" />
          <select aria-label="Filter division" value={filterDivision} onChange={(e) => { setFilterDivision(e.target.value); setCurrentPage(1) }} className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"><option value="">All divisions</option>{divisions.map(d => <option key={d} value={d}>{d}</option>)}</select>
          <select aria-label="Filter category" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1) }} className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"><option value="">All categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select aria-label="Filter condition" value={filterCondition} onChange={(e) => { setFilterCondition(e.target.value); setCurrentPage(1) }} className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"><option value="">All states</option>{conditions.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select aria-label="Filter assignment" value={filterAssignment} onChange={(e) => { setFilterAssignment(e.target.value); setCurrentPage(1) }} className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"><option value="">All assignments</option><option value="Assigned Only">Assigned only</option><option value="Unassigned Only">Unassigned only</option></select>
        </div>
      </SectionPanel>

      <SectionPanel title="Inventory results" description={`Showing ${totalItems} matching records`}>
        <div className="overflow-auto">
          <table className="w-full min-w-[900px] text-sm">
            <caption className="sr-only">Filtered inventory and audit report</caption>
            <thead className="sticky top-0 z-10 bg-canvas">
              <tr className="border-b border-line text-left text-slate">
                <th scope="col" className="px-4 py-3 font-medium">Serial number</th>
                <th scope="col" className="px-4 py-3 font-medium">Item specification</th>
                <th scope="col" className="px-4 py-3 font-medium">Division</th>
                <th scope="col" className="px-4 py-3 font-medium">Custodian / assignee</th>
                <th scope="col" className="px-4 py-3 text-center font-medium">Condition</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Service life</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const stateStyles: Record<string, string> = { Active: "bg-pulse/10 text-pulse border-pulse/30", "Expiring soon": "bg-amber-300/10 text-amber-300 border-amber-300/30", "For Replacement": "bg-alert/10 text-alert border-alert/30", Broken: "bg-alert/10 text-alert border-alert/30" }
                const stateStyle = stateStyles[item.displayStatus] || "bg-slate/10 text-slate border-slate/30"
                return (
                  <tr key={item.id} className="border-b border-line/50 transition hover:bg-paper/[0.025]">
                    <td className="px-4 py-3 align-middle font-mono text-xs text-pulse">{item.serial_number || "N/A"}</td>
                    <td className="px-4 py-3 align-middle"><div className="font-medium text-paper">{item.brand || "Unknown"} {item.model || ""}</div><div className="text-xs text-slate">{item.catName}</div></td>
                    <td className="px-4 py-3 align-middle font-medium text-paper">{item.division?.code || "—"}</td>
                    <td className="px-4 py-3 align-middle">{item.isUnassigned ? <span className="rounded-full border border-line bg-paper/5 px-2 py-1 text-[11px] text-slate">Unassigned</span> : <><div className="font-medium text-paper">{item.custodian}</div>{item.assignee && <div className="text-[11px] text-slate">Assignee: {item.assignee.full_name}</div>}</>}</td>
                    <td className="px-4 py-3 text-center align-middle"><span className={`inline-block rounded-full border px-2 py-1 text-[11px] font-medium ${stateStyle}`}>{item.displayStatus}</span></td>
                    <td className="px-4 py-3 text-right align-middle tabular-nums text-slate">{item.serviceLife > 0 ? `${item.serviceLife} yrs` : "< 1 yr"}</td>
                  </tr>
                )
              })}
              {paginatedData.length === 0 && <tr><td colSpan={6} className="h-32 text-center text-slate">No records found matching your filters.</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas px-5 py-4 text-xs text-slate"><span>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records</span><div className="flex gap-2"><button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg border border-line bg-canvas-deep px-3 py-2 text-slate transition hover:text-paper disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40">Previous</button><button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-line bg-canvas-deep px-3 py-2 text-paper transition hover:border-pulse/40 hover:text-pulse disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40">Next</button></div></div>}
      </SectionPanel>
    </div>
  )
}
