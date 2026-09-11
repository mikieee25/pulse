import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full bg-canvas text-paper overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <nav className="flex gap-2 overflow-x-auto border-b border-line bg-canvas-deep p-3 md:hidden" aria-label="Mobile navigation">
          {[["/", "Dashboard"], ["/equipment", "Equipment"], ["/personnel", "Personnel"], ["/divisions", "Divisions"], ["/budget", "Budget"], ["/reports", "Reports"], ["/summary", "Summary"], ["/changelog", "Changelog"]].map(([href, label]) => <Link key={href} href={href} className="whitespace-nowrap rounded-full border border-line px-3 py-2 text-xs text-slate transition-colors hover:border-pulse/30 hover:bg-pulse/10 hover:text-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40">{label}</Link>)}
        </nav>
        <main className="flex-1 overflow-y-auto bg-canvas p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
