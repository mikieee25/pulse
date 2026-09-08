export default function Loading() {
  return (
    <div className="space-y-8 pb-8" aria-label="Loading dashboard">
      <div className="animate-pulse overflow-hidden rounded-2xl border border-line bg-canvas-deep p-6 sm:p-8">
        <div className="h-3 w-28 rounded-full bg-pulse/15" />
        <div className="mt-5 h-10 w-64 rounded-lg bg-paper/10" />
        <div className="mt-3 h-4 max-w-xl rounded bg-slate/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["w-20", "w-16", "w-24", "w-28"].map((width) => (
          <div key={width} className="animate-pulse rounded-2xl border border-line bg-canvas-deep p-5">
            <div className="size-9 rounded-lg bg-paper/10" />
            <div className={`mt-5 h-3 ${width} rounded bg-slate/10`} />
            <div className="mt-2 h-8 w-20 rounded bg-paper/10" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-canvas-deep" />
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-canvas-deep" />
      </div>
    </div>
  )
}
