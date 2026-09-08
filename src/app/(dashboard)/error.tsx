"use client"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-line border-alert/30 bg-canvas-deep p-6 shadow-xl shadow-black/5 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-alert">Dashboard unavailable</p>
      <h2 className="mt-3 font-serif text-2xl text-paper">Something went wrong</h2>
      <p className="mt-2 text-sm leading-6 text-slate">The page could not load. Try again.</p>
      <button
        onClick={() => reset()}
        className="mt-5 rounded-xl bg-pulse px-4 py-2.5 text-sm font-semibold text-canvas-deep transition hover:bg-pulse/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-deep"
      >
        Try again
      </button>
    </div>
  )
}
