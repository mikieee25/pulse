export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-paper">Dashboard</h1>
        <p className="text-slate mt-1">Overview of ICT equipment across all divisions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards Placeholder */}
        <div className="bg-canvas-deep border border-line rounded-lg p-5">
          <p className="text-sm text-slate mb-2">Total Equipment</p>
          <p className="text-3xl font-serif text-paper">0</p>
        </div>
        <div className="bg-canvas-deep border border-line rounded-lg p-5">
          <p className="text-sm text-slate mb-2">Active</p>
          <p className="text-3xl font-serif text-pulse">0</p>
        </div>
        <div className="bg-canvas-deep border border-line rounded-lg p-5">
          <p className="text-sm text-slate mb-2">Expiring &lt; 6 mos</p>
          <p className="text-3xl font-serif text-yellow-500">0</p>
        </div>
        <div className="bg-canvas-deep border border-line rounded-lg p-5">
          <p className="text-sm text-slate mb-2">For Replacement</p>
          <p className="text-3xl font-serif text-alert">0</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-canvas-deep border border-line rounded-lg p-5 flex items-center justify-center text-slate">
          Inventory by Division Chart
        </div>
        <div className="h-80 bg-canvas-deep border border-line rounded-lg p-5 flex items-center justify-center text-slate">
          Status Breakdown Chart
        </div>
      </div>
    </div>
  );
}
