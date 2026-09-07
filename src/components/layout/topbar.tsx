import { Bell, Menu, User } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-16 border-b border-line bg-canvas flex items-center justify-between px-6 lg:px-8 shrink-0">
      <div className="flex items-center">
        <button className="md:hidden text-slate hover:text-paper transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-slate hover:text-paper transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-pulse rounded-full" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-line">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-paper">Admin User</span>
            <span className="text-xs text-pulse font-mono bg-pulse/10 px-1.5 py-0.5 rounded">Admin</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-canvas-deep border border-line flex items-center justify-center text-slate">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
