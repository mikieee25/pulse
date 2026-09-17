export function PanelSkeleton({ label = "Loading panel" }: { label?: string }) {
  return (
    <div
      className="h-64 animate-pulse rounded-2xl border border-line bg-canvas-deep p-5 sm:p-6"
      aria-label={label}
      aria-busy="true"
      role="status"
    >
      <div className="h-4 w-36 rounded bg-slate/20" />
      <div className="mt-3 h-3 w-3/4 rounded bg-slate/10" />
      <div className="mt-8 space-y-3">
        {["w-full", "w-11/12", "w-4/5", "w-10/12"].map((width) => (
          <div key={width} className={`h-4 rounded bg-slate/10 ${width}`} />
        ))}
      </div>
    </div>
  );
}
