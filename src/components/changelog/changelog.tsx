import type { LucideIcon } from "lucide-react"
import { Bell, CheckCircle2, Database, History, Palette, ShieldCheck, Sparkles, Wrench } from "lucide-react"
import { MetricCard } from "@/components/layout/metric-card"
import { PageHeader } from "@/components/layout/page-header"
import { SectionPanel } from "@/components/layout/section-panel"

type ChangeKind = "feature" | "enhancement" | "fix" | "security"

type Change = {
  kind: ChangeKind
  title: string
  description: string
}

type ChangelogGroup = {
  date: string
  release: string
  changes: Change[]
}

const kindStyles: Record<ChangeKind, { label: string; icon: LucideIcon; color: string; background: string }> = {
  feature: { label: "New feature", icon: Sparkles, color: "text-pulse", background: "border-pulse/20 bg-pulse/10" },
  enhancement: { label: "Enhancement", icon: CheckCircle2, color: "text-amber-300", background: "border-amber-300/20 bg-amber-300/10" },
  fix: { label: "Bug fix", icon: Wrench, color: "text-alert", background: "border-alert/20 bg-alert/10" },
  security: { label: "Security", icon: ShieldCheck, color: "text-sky-300", background: "border-sky-300/20 bg-sky-300/10" },
}

const changelogGroups: ChangelogGroup[] = [
  {
    date: "September 11, 2026",
    release: "Production readiness",
    changes: [
      { kind: "feature", title: "Verified the EUMB ICT inventory source", description: "The Excel workbook is now validated by the migration checker, preserving equipment years, categories, divisions, custodians, and data-quality warnings in a reviewable migration report." },
      { kind: "security", title: "Applied the equipment lifecycle migration", description: "Production now has atomic save, reassignment, and retirement functions with assignment validation and history handling. Existing inventory was preserved without duplicate imports." },
      { kind: "enhancement", title: "Confirmed complete inventory coverage", description: "The live inventory contains 436 equipment records across Camera, Desktop, Drone, Laptop, Printer, and Tablet categories." },
    ],
  },
  {
    date: "September 10, 2026",
    release: "Inventory intelligence",
    changes: [
      { kind: "enhancement", title: "Unified lifecycle card calculations", description: "Active now means normal operational units plus active units marked for replacement or expiry. Broken and retired units are excluded from Active, while replacement and expiry remain separate signals." },
      { kind: "feature", title: "Expanded budget and replacement planning", description: "Budget, Summary, and Reports now reflect every equipment category instead of only laptops, desktops, and tablets, with category-specific rates and CSV exports." },
      { kind: "fix", title: "Corrected lifecycle and reporting mismatches", description: "Dashboard, Equipment, Summary, Budget, and Reports now use the same status rules so totals and detail views agree." },
    ],
  },
  {
    date: "September 7–9, 2026",
    release: "PULSE interface and workflows",
    changes: [
      { kind: "enhancement", title: "Applied the Budget visual system across PULSE", description: "Dashboard pages now share the same panels, headers, spacing, typography, responsive tables, focus states, and empty/error treatments." },
      { kind: "feature", title: "Added light theme support", description: "PULSE now includes a persistent light theme alongside the dark interface, with shared color tokens across navigation, cards, tables, forms, and dialogs." },
      { kind: "feature", title: "Made notifications functional", description: "The notification bell now surfaces lifecycle and assignment signals with user-scoped local state so alerts do not leak between accounts." },
      { kind: "enhancement", title: "Completed PULSE and DOE branding", description: "The PULSE SVG identity, DOE logo, branded favicon, login screen, sidebar, and account header now use the project’s official visual identity." },
    ],
  },
  {
    date: "September 6, 2026",
    release: "Access and administration",
    changes: [
      { kind: "feature", title: "Added manual user administration", description: "Administrators can create users with temporary passwords, assign Admin or Viewer roles, and require a password change at first login without depending on invitation email delivery." },
      { kind: "security", title: "Hardened account and role safeguards", description: "PULSE prevents self-lockout, protects the last administrator, validates UUID inputs, hides management controls from Viewers, and keeps authorization checks on the server." },
      { kind: "fix", title: "Improved deployed authentication errors", description: "Login, profile, and dashboard failures now show safe, useful messages instead of leaking raw database errors or producing blank pages." },
    ],
  },
  {
    date: "Project foundation",
    release: "PULSE System",
    changes: [
      { kind: "feature", title: "Built the Personnel & Unit Lifecycle System for Equipment", description: "PULSE established the core Next.js and Supabase application for tracking ICT equipment, personnel, divisions, assignments, lifecycle status, budget planning, summaries, and reports." },
      { kind: "feature", title: "Added equipment, personnel, and division management", description: "The system supports searchable inventory, personnel custodians, division organization, assignment history, editing, deletion safeguards, and role-aware administration." },
      { kind: "security", title: "Established Supabase-backed access control", description: "Authentication, app profiles, Admin and Viewer roles, row-level policies, temporary-password enforcement, and protected server actions form the foundation of the system." },
    ],
  },
]

const legend = Object.entries(kindStyles) as Array<[ChangeKind, (typeof kindStyles)[ChangeKind]]>

export function Changelog() {
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><History className="size-3.5" aria-hidden="true" />Product history</span>}
        title="PULSE Changelog"
        description="A plain-language record of the features, fixes, and operational improvements delivered to the Personnel & Unit Lifecycle System for Equipment."
        actions={<span className="rounded-full border border-pulse/20 bg-pulse/10 px-3 py-2 text-xs font-medium text-pulse">Updated September 11, 2026</span>}
      />

      <section aria-labelledby="changelog-overview-title" className="grid gap-4 sm:grid-cols-3">
        <h2 id="changelog-overview-title" className="sr-only">Changelog overview</h2>
        <MetricCard label="Tracked releases" value={changelogGroups.length} detail="From foundation to production" icon={History} />
        <MetricCard label="Current inventory" value="436" detail="Equipment records covered" icon={Database} tone="pulse" />
        <MetricCard label="Release areas" value="4" detail="Features, fixes, security, polish" icon={Palette} tone="warning" />
      </section>

      <SectionPanel title="Update history" description="The newest changes appear first. Expand any item for the short version of what changed and why it matters.">
        <div className="p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-line bg-canvas/60 px-4 py-3">
            {legend.map(([kind, style]) => {
              const Icon = style.icon
              return <span key={kind} className={`inline-flex items-center gap-2 text-xs ${style.color}`}><Icon className="size-3.5" aria-hidden="true" />{style.label}</span>
            })}
          </div>

          <div className="relative">
            <div className="absolute bottom-3 left-[17px] top-3 w-px bg-line sm:left-[25px]" aria-hidden="true" />
            <div className="space-y-8">
              {changelogGroups.map((group, groupIndex) => (
                <article key={group.date} className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-4 sm:grid-cols-[52px_minmax(0,1fr)] sm:gap-5">
                  <div className="relative flex justify-center">
                    <span className="relative z-10 mt-1.5 size-3.5 rounded-full border-4 border-canvas-deep bg-pulse shadow-[0_0_0_3px_rgba(62,211,161,0.18)]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <h3 className="font-serif text-xl text-paper">{group.date}</h3>
                      <span className="text-xs text-slate">{group.release}</span>
                    </div>
                    <div className="space-y-2">
                      {group.changes.map((change, changeIndex) => {
                        const style = kindStyles[change.kind]
                        const Icon = style.icon
                        return (
                          <details key={change.title} open={groupIndex === 0 && changeIndex === 0} className="group rounded-xl border border-line bg-canvas/60 transition-colors open:border-pulse/25 open:bg-canvas hover:border-paper/20">
                            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-pulse/40 [&::-webkit-details-marker]:hidden">
                              <span className={`grid size-8 shrink-0 place-items-center rounded-lg border ${style.background} ${style.color}`}><Icon className="size-4" aria-hidden="true" /></span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-paper">{change.title}</span>
                                <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] ${style.color}`}>{style.label}</span>
                              </span>
                              <span className="text-slate transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                            </summary>
                            <p className="border-t border-line px-4 py-4 pl-[68px] text-sm leading-6 text-slate">{change.description}</p>
                          </details>
                        )
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </SectionPanel>

      <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas-deep px-4 py-3 text-sm text-slate">
        <Bell className="mt-0.5 size-4 shrink-0 text-pulse" aria-hidden="true" />
        <p>New updates should be added here before the related commit is pushed, keeping the in-app history aligned with the deployed system.</p>
      </div>
    </div>
  )
}

export default Changelog
