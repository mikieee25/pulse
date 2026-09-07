import { createClient } from "@/utils/supabase/server"
import { BudgetChart } from "@/components/dashboard/budget-chart"

export default async function BudgetPage() {
  const supabase = await createClient()

  // Fetch equipment year acquired
  const { data: equipment } = await supabase
    .from('equipment')
    .select('year_acquired, equipment_categories(name)')

  const eqList = equipment || []
  
  // Fake cost data since it wasn't in Excel. We'll use 50k for laptops, 30k for tablet, etc.
  const costMap: Record<string, number> = {
    'Laptop': 50000,
    'Tablet': 30000,
    'Desktop': 45000,
    'Drone': 80000,
    'Camera': 60000,
    'Printer': 15000
  }

  let totalCost = 0
  const yearCounts: Record<string, number> = {}

  eqList.forEach(e => {
    const year = e.year_acquired
    if (year) {
      const cat = e.equipment_categories?.name as string || 'Laptop'
      const cost = costMap[cat] || 0
      totalCost += cost
      yearCounts[year] = (yearCounts[year] || 0) + cost
    }
  })

  const chartData = Object.keys(yearCounts).sort().map(year => ({
    year,
    amount: yearCounts[year]
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-paper">Budget Overview</h1>
          <p className="text-slate mt-1">Estimated historical expenditure on ICT equipment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-canvas-deep border border-line rounded-lg p-6 flex flex-col justify-center">
          <p className="text-sm text-slate mb-2">Total Estimated Value</p>
          <p className="text-4xl font-serif text-pulse">
            ₱ {totalCost.toLocaleString()}
          </p>
        </div>
        <div className="md:col-span-2 bg-canvas-deep border border-line rounded-lg p-6">
          <h2 className="text-lg font-medium text-paper mb-4">Expenditure by Year</h2>
          <BudgetChart data={chartData} />
        </div>
      </div>
    </div>
  )
}
