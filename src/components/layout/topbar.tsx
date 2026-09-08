import { Bell, Menu } from "lucide-react";
import Image from "next/image";
import { getCurrentProfile } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export async function Topbar() {
  const profile = await getCurrentProfile();
  return (
    <header className="h-16 border-b border-line bg-canvas flex items-center px-6 lg:px-8 shrink-0">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden text-slate hover:text-paper"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden md:inline-block text-xl text-slate tracking-wide">
          <span className="text-pulse font-medium">P</span>ersonnel & <span className="text-pulse font-medium">U</span>nit <span className="text-pulse font-medium">L</span>ifecycle <span className="text-pulse font-medium">S</span>ystem for <span className="text-pulse font-medium">E</span>quipment
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3 pl-4 border-l border-line">
        <ThemeToggle />
        <button
          className="text-slate hover:text-paper transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-end hidden sm:flex pl-3 border-l border-line">
          <span className="text-sm font-medium text-paper">
            {profile?.full_name || profile?.email || "PULSE user"}
          </span>
          <span className="text-xs text-pulse font-mono bg-pulse/10 px-1.5 py-0.5 rounded">
            {profile?.role || "Viewer"}
          </span>
        </div>
        <div className="w-9 h-9 overflow-hidden rounded-full border border-line bg-canvas-deep">
          <Image
            src="/pulseicon.svg"
            alt="PULSE account"
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        </div>
        <form action="/auth/logout" method="POST">
          <button className="text-xs text-slate hover:text-paper" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
