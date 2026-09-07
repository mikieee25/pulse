import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  MonitorSmartphone, 
  Users, 
  Building2, 
  Calculator, 
  FileText, 
  Settings 
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-line bg-canvas-deep flex flex-col h-full hidden md:flex">
      <div className="h-16 px-6 flex items-center gap-3 border-b border-line shrink-0">
        <Image src="/pulseicon.svg" alt="PULSE" width={34} height={34} priority className="h-[34px] w-[34px] rounded-lg" />
        <span className="font-serif text-lg font-medium tracking-wide text-paper">PULSE</span>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-slate hover:text-paper hover:bg-accent rounded-md transition-colors">
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link href="/equipment" className="flex items-center gap-3 px-3 py-2 text-sm text-slate hover:text-paper hover:bg-accent rounded-md transition-colors">
          <MonitorSmartphone className="w-4 h-4" />
          Equipment
        </Link>
        <Link href="/personnel" className="flex items-center gap-3 px-3 py-2 text-sm text-slate hover:text-paper hover:bg-accent rounded-md transition-colors">
          <Users className="w-4 h-4" />
          Personnel
        </Link>
        <Link href="/divisions" className="flex items-center gap-3 px-3 py-2 text-sm text-slate hover:text-paper hover:bg-accent rounded-md transition-colors">
          <Building2 className="w-4 h-4" />
          Divisions
        </Link>
        <Link href="/budget" className="flex items-center gap-3 px-3 py-2 text-sm text-slate hover:text-paper hover:bg-accent rounded-md transition-colors">
          <Calculator className="w-4 h-4" />
          Budget
        </Link>
        <Link href="/reports" className="flex items-center gap-3 px-3 py-2 text-sm text-slate hover:text-paper hover:bg-accent rounded-md transition-colors">
          <FileText className="w-4 h-4" />
          Reports
        </Link>
      </nav>
      <div className="p-4 border-t border-line">
        <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm text-slate hover:text-paper hover:bg-accent rounded-md transition-colors">
          <Settings className="w-4 h-4" />
          Admin / Users
        </Link>
      </div>
    </aside>
  );
}
