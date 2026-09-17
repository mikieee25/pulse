export function PanelSkeleton({ label = "Loading panel" }: { label?: string }) {
  return (
    <div
      className="h-64 animate-pulse rounded-2xl border border-line bg-canvas-deep"
      aria-label={label}
    />
  );
}
