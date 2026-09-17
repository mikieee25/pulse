export function TopbarSkeleton() {
  return (
    <header
      className="flex h-16 shrink-0 items-center justify-end gap-3 border-b border-line bg-canvas px-6 lg:px-8"
      aria-label="Loading navigation"
    >
      <div className="h-8 w-8 animate-pulse rounded-full bg-slate/10" />
      <div className="h-8 w-24 animate-pulse rounded-lg bg-slate/10" />
      <div className="h-9 w-9 animate-pulse rounded-full bg-slate/10" />
    </header>
  );
}
