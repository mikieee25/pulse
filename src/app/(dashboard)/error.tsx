"use client"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="rounded-lg border border-alert/40 bg-canvas-deep p-6"><h2 className="text-xl text-paper">Something went wrong</h2><p className="mt-2 text-slate">The page could not load. Try again.</p><button onClick={() => reset()} className="mt-4 rounded-md bg-pulse px-3 py-2 text-canvas">Try again</button></div>
}
