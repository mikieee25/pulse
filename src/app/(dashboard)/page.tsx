import { createClient } from "@/utils/supabase/server"
import { InventoryByDivisionChart, StatusBreakdownChart } from "@/components/dashboard/dashboard-charts"

export default async function Home() {
  const supabase = await createClient()

  // Fetch basic stats
  // In a real app we'd use aggregate queries or a materialized view, but since our dataset is small (<1000 items), fetching all equipment is fine for a demo.
  const { data: equipment } = await supabase
    .from('equipment')
    .select('status, division:divisions(code)')

  const eqList = equipment || []

  const total = eqList.length
  const activeCount = eqList.filter(e => e.status === 'Active').length
  const replacementCount = eqList.filter(e => e.status === 'For Replacement').length
  const retiredCount = eqList.filter(e => e.status === 'Retired').length

  // Build division chart data
  const divisionCounts: Record<string, number> = {}
  eqList.forEach(e => {
    const code = e.division?.code || 'Unknown'
    divisionCounts[code] = (divisionCounts[code] || 0) + 1
  })
  const divisionChartData = Object.keys(divisionCounts).map(k => ({
    name: k,
    count: divisionCounts[k]
  })).sort((a, b) => b.count - a.count)

  // Build status pie chart data
  const statusChartData = [
    { name: 'Active', value: activeCount },
    { name: 'For Replacement', value: replacementCount },
    { name: 'Retired', value: retiredCount }
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-paper">Dashboard</h1>
        <p className="text-slate mt-1">Overview of ICT equipment across all divisions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <div className="bg-canvas-deep border border-line rounded-lg p-5">
          <p className="text-sm text-slate mb-2">Total Equipment</p>
          <p className="text-3xl font-serif text-paper">{total}</p>
        </div>
        <div className="bg-canvas-deep border border-line rounded-lg p-5">
          <p className="text-sm text-slate mb-2">Active</p>
          <p className="text-3xl font-serif text-pulse">{activeCount}</p>
        </div>
        <div className="bg-canvas-deep border border-line rounded-lg p-5">
          <p className="text-sm text-slate mb-2">For Replacement</p>
          <p className="text-3xl font-serif text-alert">{replacementCount}</p>
        </div>
        <div className="bg-canvas-deep border border-line rounded-lg p-5">
          <p className="text-sm text-slate mb-2">Retired</p>
          <p className="text-3xl font-serif text-slate">{retiredCount}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-canvas-deep border border-line rounded-lg p-5">
          <h2 className="text-lg font-medium text-paper mb-4">Inventory by Division</h2>
          <InventoryByDivisionChart data={divisionChartData} />
        </div>
        <div className="bg-canvas-deep border border-line rounded-lg p-5">
          <h2 className="text-lg font-medium text-paper mb-4">Status Breakdown</h2>
          <StatusBreakdownChart data={statusChartData} />
        </div>
      </div>
    </div>
  );
}
