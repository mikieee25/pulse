import Link from "next/link"
import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const profile = await getCurrentProfile()
  if (profile?.role !== "Admin") redirect("/")
  return <div className="space-y-6"><div><h1 className="text-3xl font-serif tracking-tight text-paper">Admin</h1><p className="text-slate mt-1">Manage access and system reference values.</p></div><Link href="/admin/users" className="inline-flex rounded-md border border-line bg-canvas-deep px-4 py-3 text-pulse">Manage users</Link></div>
}
