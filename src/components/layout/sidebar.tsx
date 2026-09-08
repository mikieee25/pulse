import Image from "next/image"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Building2, Calculator, FileText, LayoutDashboard, MonitorSmartphone, PieChart, Settings, Users } from "lucide-react"

const navItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/equipment", label: "Equipment", icon: MonitorSmartphone },
  { href: "/personnel", label: "Personnel", icon: Users },
  { href: "/divisions", label: "Divisions", icon: Building2 },
  { href: "/budget", label: "Budget", icon: Calculator },
  { href: "/summary", label: "Summary", icon: PieChart },
  { href: "/reports", label: "Reports", icon: FileText },
]

const linkClassName = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate transition-colors hover:bg-pulse/10 hover:text-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40"

export function Sidebar() {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-line bg-canvas-deep md:flex">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-6">
        <Image src="/pulseicon.svg" alt="PULSE" width={34} height={34} priority className="h-[34px] w-[34px] rounded-xl" />
        <span className="font-serif text-lg font-medium tracking-wide text-paper">PULSE</span>
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClassName}>
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-line p-4">
        <Link href="/admin/users" className={linkClassName}>
          <Settings className="size-4" aria-hidden="true" />
          Admin / Users
        </Link>
      </div>
    </aside>
  )
}
