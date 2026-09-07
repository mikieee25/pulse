import Link from "next/link"

export default function NotFound() {
  return <main className="min-h-screen bg-canvas-deep p-8 text-paper"><h1 className="text-2xl font-serif">Page not found</h1><p className="mt-2 text-slate">The requested PULSE record or page does not exist.</p><Link href="/" className="mt-4 inline-block text-pulse hover:underline">Return to dashboard</Link></main>
}
