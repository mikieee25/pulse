import { PageHeader } from "@/components/layout/page-header"
import { SectionPanel } from "@/components/layout/section-panel"

export default function Loading() {
  return <div className="space-y-8"><PageHeader title="Admin Activity" description="Loading live activity and user status…" /><div className="space-y-6"><SectionPanel><div className="h-64 animate-pulse bg-pulse/5" /></SectionPanel><SectionPanel><div className="h-80 animate-pulse bg-pulse/5" /></SectionPanel></div></div>
}
