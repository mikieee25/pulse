import Link from "next/link";
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
      <div className="p-6 flex items-center gap-3 border-b border-line">
        <div className="w-3 h-3 rounded-full bg-pulse shadow-[0_0_8px_rgba(62,217,160,0.6)] animate-pulse" />
        <span className="font-mono text-paper font-semibold tracking-wide">PULSE</span>
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
