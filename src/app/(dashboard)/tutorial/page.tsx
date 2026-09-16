import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  Banknote,
  Bell,
  BookOpen,
  CircleAlert,
  FileText,
  PackageCheck,
  UsersRound,
} from "lucide-react";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { SectionPanel } from "@/components/layout/section-panel";

const inputClass =
  "h-9 w-full rounded-md border border-line bg-canvas px-2.5 text-sm text-paper outline-none focus-visible:ring-2 focus-visible:ring-pulse/40";
const labelClass = "space-y-1 text-xs text-slate";

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pulse text-xs font-semibold text-ink">
        {number}
      </span>
      <div>
        <h3 className="font-sans text-base font-semibold text-paper">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate">{children}</p>
      </div>
    </div>
  );
}

function DemoField({
  label,
  value,
  options,
}: {
  label: string;
  value?: string;
  options?: string[];
}) {
  return (
    <label className={labelClass}>
      {label}
      {options ? (
        <select className={inputClass} defaultValue={value || options[0]}>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          className={inputClass}
          defaultValue={value}
          placeholder={value ? undefined : "Enter value"}
          readOnly={Boolean(value)}
        />
      )}
    </label>
  );
}

export default function TutorialPage() {
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <BookOpen className="size-3.5" aria-hidden="true" />
            PULSE user guide
          </span>
        }
        title="PULSE User Guide"
        description="Use PULSE with confidence: record ICT equipment, manage personnel and divisions, review lifecycle needs, and prepare reports."
        actions={
          <Link
            href="#equipment"
            className="inline-flex items-center justify-center rounded-lg bg-pulse px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40"
          >
            Start with equipment
          </Link>
        }
      />

      <SectionPanel
        title="Before you begin"
        description="A few rules keep PULSE data reliable."
      >
        <div className="grid gap-3 p-5 md:grid-cols-3">
          <div className="rounded-xl border border-line bg-paper/[0.03] p-4">
            <h3 className="font-sans font-semibold text-paper">
              Use your own account
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate">
              Your role controls whether you can add, edit, assign, or remove
              records.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-paper/[0.03] p-4">
            <h3 className="font-sans font-semibold text-paper">
              Check the source record
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate">
              Use the serial number, division, and assignment details when
              checking a physical unit.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-paper/[0.03] p-4">
            <h3 className="font-sans font-semibold text-paper">
              Keep status accurate
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate">
              Good, For Replacement, and Broken affect dashboard totals and
              planning reports.
            </p>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel
        title="1. Sign in securely"
        description="Open the PULSE address provided by your organization."
      >
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <Step number={1} title="Enter your account details">
              Use your registered email and password, then select Sign In. Never
              share a temporary password.
            </Step>
            <Step number={2} title="Change a temporary password">
              If an administrator created a temporary account, PULSE sends you
              to Change your password before opening the dashboard.
            </Step>
            <Step number={3} title="Ask an Admin when blocked">
              Do not create a second account to work around an access problem.
              Ask an Admin to check your profile and role.
            </Step>
          </div>
          <div className="rounded-2xl border border-line bg-canvas p-5 shadow-inner sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <Image
                src="/pulseicon.svg"
                alt=""
                width={40}
                height={40}
                className="size-10 rounded-xl"
              />
              <div>
                <p className="font-sans font-semibold text-paper">PULSE</p>
                <p className="text-xs text-slate">
                  Personnel & Unit Lifecycle System for Equipment
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <DemoField label="Email" />
              <DemoField label="Password" />
              <button
                type="button"
                className="mt-2 h-10 w-full rounded-lg bg-pulse text-sm font-semibold text-ink"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </SectionPanel>

      <section id="dashboard" className="scroll-mt-6">
        <SectionPanel
          title="2. Read the Dashboard"
          description="The Dashboard is the live overview of ICT equipment across all divisions."
        >
          <div className="space-y-5 p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total equipment"
                value="436"
                detail="Tracked ICT assets"
                icon={PackageCheck}
              />
              <MetricCard
                label="Active"
                value="225"
                detail="Operational, replacement, and expiry flagged"
                icon={Activity}
                tone="pulse"
              />
              <MetricCard
                label="For replacement"
                value="139"
                detail="Includes broken units"
                icon={CircleAlert}
                tone="alert"
              />
              <MetricCard
                label="Expiring in 1 year"
                value="72"
                detail="Lifecycle attention needed"
                icon={CircleAlert}
                tone="warning"
              />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-line p-4">
                <h3 className="font-sans font-semibold text-paper">
                  Inventory by Division
                </h3>
                <p className="mt-1 text-xs text-slate">
                  Asset distribution across bureau offices.
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    ["AFETD", "37", "76%"],
                    ["EPRED", "40", "88%"],
                    ["EPMSD", "28", "61%"],
                  ].map(([name, count, width]) => (
                    <div key={name}>
                      <div className="flex justify-between text-xs text-slate">
                        <span>{name}</span>
                        <strong className="text-paper">{count}</strong>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper/10">
                        <div
                          className="h-full rounded-full bg-pulse"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-line p-4">
                <h3 className="font-sans font-semibold text-paper">
                  Status Breakdown
                </h3>
                <p className="mt-1 text-xs text-slate">
                  Current lifecycle signals for tracked assets.
                </p>
                <div className="mt-5 flex items-center gap-5">
                  <div
                    className="grid size-24 place-items-center rounded-full"
                    style={{
                      background:
                        "conic-gradient(var(--pulse) 0 51%, var(--warning) 51% 78%, var(--alert) 78% 100%)",
                    }}
                  >
                    <div className="grid size-14 place-items-center rounded-full bg-canvas-deep text-xs font-semibold text-paper">
                      436
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate">
                    <p>
                      <span className="mr-2 inline-block size-2 rounded-full bg-pulse" />
                      Active
                    </p>
                    <p>
                      <span className="mr-2 inline-block size-2 rounded-full bg-warning" />
                      Expiring soon
                    </p>
                    <p>
                      <span className="mr-2 inline-block size-2 rounded-full bg-alert" />
                      Replacement / Broken
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionPanel>
      </section>

      <section id="equipment" className="scroll-mt-6">
        <SectionPanel
          title="3. Manage Equipment"
          description="Choose a category, add or edit an asset, then review assignment and lifecycle status."
        >
          <div className="space-y-5 p-5">
            <Step number={1} title="Choose a category">
              Use the category pills to switch between Laptop, Tablet, Desktop,
              Drone, Camera, Printer, and other configured categories.
            </Step>
            <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-paper/[0.03] p-4">
              {[
                "Laptop",
                "Tablet",
                "Camera",
                "Desktop",
                "Drone",
                "Printer",
              ].map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${category === "Camera" ? "border-pulse/40 bg-pulse/10 text-pulse" : "border-line text-slate"}`}
                >
                  {category}
                </button>
              ))}
            </div>
            <Step number={2} title="Add or edit a record">
              Admins select + Add [category] or open an existing record and
              choose Edit. Complete the identity, procurement, state, division,
              and assignment fields.
            </Step>
            <div className="rounded-xl border border-line bg-paper/[0.03] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-sans font-semibold text-paper">
                  Equipment form fields
                </h3>
                <span className="text-xs text-slate">Add Camera</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DemoField
                  label="Category"
                  options={["Camera", "Laptop", "Printer"]}
                />
                <DemoField label="Division" value="EPRED" />
                <DemoField label="Brand" value="GoPro" />
                <DemoField label="Model" value="GoPro Hero 12 Black Creator" />
                <DemoField label="Year acquired" value="2024" />
                <DemoField label="Serial number" value="C3501325501968" />
                <DemoField
                  label="State"
                  options={["Good", "For Replacement", "Broken"]}
                />
                <DemoField label="Procurement method" />
                <DemoField
                  label="Custodian (Regulars)"
                  options={["Unassigned", "Maria Santos"]}
                />
                <DemoField
                  label="Assignee (PSS/PES)"
                  options={["Unassigned", "Juan Dela Cruz"]}
                />
                <label className={`${labelClass} sm:col-span-2`}>
                  Remarks
                  <textarea
                    className={`${inputClass} min-h-20 py-2`}
                    placeholder="Additional notes for this asset"
                  />
                </label>
                <div className="flex justify-end gap-2 sm:col-span-2">
                  <button
                    type="button"
                    className="rounded-lg border border-line px-3 py-2 text-xs text-slate"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-pulse px-3 py-2 text-xs font-semibold text-ink"
                  >
                    Save Camera
                  </button>
                </div>
              </div>
            </div>
            <Step number={3} title="Review Custodian / Assignee and status">
              Custodian is for eligible Regular staff. Assignee is for PSS/PES
              personnel. On the equipment detail page, update assignments,
              change Good / For Replacement / Broken, or retire the asset.
            </Step>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[850px] text-left text-xs">
                <thead className="bg-paper/[0.04] text-slate">
                  <tr>
                    {[
                      "Brand",
                      "Model",
                      "Serial No.",
                      "Custodian",
                      "Assignee",
                      "Division",
                      "Status",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="border-b border-line px-3 py-3 font-medium"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line/50">
                    <td className="px-3 py-3 font-medium text-paper">GoPro</td>
                    <td className="px-3 py-3 text-paper">
                      Hero 12 Black Creator
                    </td>
                    <td className="px-3 py-3 text-slate">C3501325501968</td>
                    <td className="px-3 py-3 text-slate">Unassigned</td>
                    <td className="px-3 py-3 text-slate">Juan Dela Cruz</td>
                    <td className="px-3 py-3 text-slate">EPRED</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-pulse/40 bg-pulse/10 px-2 py-1 text-pulse">
                        Active
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-pulse">View</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 font-medium text-paper">Nikon</td>
                    <td className="px-3 py-3 text-paper">
                      Professional Camera
                    </td>
                    <td className="px-3 py-3 text-slate">—</td>
                    <td className="px-3 py-3 text-slate">Maria Santos</td>
                    <td className="px-3 py-3 text-slate">Unassigned</td>
                    <td className="px-3 py-3 text-slate">OD</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-alert/40 bg-alert/10 px-2 py-1 text-alert">
                        For Replacement
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-pulse">View</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="rounded-lg border border-pulse/20 bg-pulse/5 p-4 text-sm text-slate">
              Use <strong className="text-paper">Export CSV</strong> to download
              the selected category, including Custodian, Assignee, status,
              division, and equipment details.
            </div>
          </div>
        </SectionPanel>
      </section>

      <section id="personnel" className="scroll-mt-6">
        <SectionPanel
          title="4. Manage Personnel"
          description="Keep names, initials, positions, divisions, and plantilla status accurate before assigning equipment."
        >
          <div className="space-y-5 p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total personnel"
                value="157"
                detail="Registered staff"
                icon={UsersRound}
              />
              <MetricCard
                label="Regular staff"
                value="89"
                detail="Eligible custodians"
                icon={UsersRound}
                tone="pulse"
              />
              <MetricCard
                label="Outsourced"
                value="68"
                detail="Outsourced and COS personnel"
                icon={UsersRound}
                tone="warning"
              />
              <MetricCard
                label="With equipment"
                value="52"
                detail="Active custodians"
                icon={PackageCheck}
              />
            </div>
            <Step number={1} title="Add or edit personnel">
              Select + Add Personnel or use the row’s Edit action. Choose
              Regular, COS, Outsourced, Reserve, For Transfer, or For RTS
              carefully.
            </Step>
            <div className="rounded-xl border border-line bg-paper/[0.03] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-sans font-semibold text-paper">
                  Personnel form fields
                </h3>
                <span className="text-xs text-slate">Add personnel</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DemoField label="Full name" value="Juan Dela Cruz" />
                <DemoField label="Initials" value="JDC" />
                <DemoField label="Position" value="PSS" />
                <DemoField label="Division" value="EPRED" />
                <DemoField
                  label="Plantilla status"
                  options={["COS", "Regular", "Outsourced"]}
                />
                <div className="flex items-end justify-end sm:col-span-2">
                  <button
                    type="button"
                    className="rounded-lg bg-pulse px-3 py-2 text-xs font-semibold text-ink"
                  >
                    Save personnel
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-line p-4">
                <h3 className="font-sans font-semibold text-paper">Edit</h3>
                <p className="mt-1 text-sm text-slate">
                  Choose Edit from the Actions column, update the fields, and
                  select Save changes.
                </p>
              </div>
              <div className="rounded-xl border border-alert/20 bg-alert/5 p-4">
                <h3 className="font-sans font-semibold text-paper">Delete</h3>
                <p className="mt-1 text-sm text-slate">
                  Choose Delete only when the directory record should be
                  removed. Confirm carefully; the action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </SectionPanel>
      </section>

      <section id="planning" className="scroll-mt-6">
        <SectionPanel
          title="5. Plan replacements and budgets"
          description="Planning pages use the complete equipment category list and shared lifecycle rules."
        >
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            <div className="rounded-xl border border-line p-4">
              <h3 className="font-sans font-semibold text-paper">Divisions</h3>
              <p className="mt-2 text-sm leading-6 text-slate">
                Review personnel, equipment, and lifecycle counts by office to
                understand which bureau needs attention.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Bureau divisions"
                  value="7"
                  detail="Registered offices"
                  icon={UsersRound}
                />
                <MetricCard
                  label="Lifecycle attention"
                  value="139"
                  detail="Assets for replacement"
                  icon={CircleAlert}
                  tone="alert"
                />
              </div>
            </div>
            <div className="rounded-xl border border-line p-4">
              <h3 className="font-sans font-semibold text-paper">Budget</h3>
              <p className="mt-2 text-sm leading-6 text-slate">
                Choose a year, review standard rates by category, and compare
                replacement totals by division. Admins can save category unit
                costs.
              </p>
              <div className="mt-4 rounded-lg border border-warning/20 bg-warning/5 p-3 text-sm text-slate">
                <Banknote
                  className="mr-2 inline size-4 text-warning"
                  aria-hidden="true"
                />
                Laptop, Tablet, Desktop, Drone, Camera, Printer, and configured
                categories can appear in planning tables.
              </div>
            </div>
          </div>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-paper/[0.04] text-slate">
                <tr>
                  <th className="px-5 py-3 font-medium">Division</th>
                  <th className="px-4 py-3 font-medium">Units expiring</th>
                  <th className="px-4 py-3 font-medium">Units broken</th>
                  <th className="px-4 py-3 font-medium">Camera</th>
                  <th className="px-4 py-3 font-medium">Laptop</th>
                  <th className="px-4 py-3 font-medium">Printer</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line/50">
                  <td className="px-5 py-3 font-semibold text-paper">AFETD</td>
                  <td className="px-4 py-3 text-slate">37</td>
                  <td className="px-4 py-3 text-slate">0</td>
                  <td className="px-4 py-3 text-slate">0 / 16</td>
                  <td className="px-4 py-3 text-slate">37 / 39</td>
                  <td className="px-4 py-3 text-slate">0 / 15</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-paper">EPRED</td>
                  <td className="px-4 py-3 text-slate">40</td>
                  <td className="px-4 py-3 text-alert">2</td>
                  <td className="px-4 py-3 text-alert">2 / 16</td>
                  <td className="px-4 py-3 text-alert">20 / 29</td>
                  <td className="px-4 py-3 text-slate">18 / 26</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionPanel>
      </section>

      <section id="reports" className="scroll-mt-6">
        <SectionPanel
          title="6. Use Summary and Reports"
          description="Summary gives a fiscal-year view. Reports is the audit workspace for filtering and exporting verified inventory."
        >
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-pulse/40 bg-pulse/10 px-3 py-2 text-xs font-medium text-pulse"
              >
                FY 2026 Replacement
              </button>
              <button
                type="button"
                className="rounded-full border border-line px-3 py-2 text-xs text-slate"
              >
                FY 2025 Summary
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Grand total budget"
                value="₱12.4M"
                detail="FY 2026 forecast"
                icon={Banknote}
                tone="pulse"
              />
              <MetricCard
                label="Total units requested"
                value="139"
                detail="7 requesting divisions"
                icon={PackageCheck}
                tone="warning"
              />
            </div>
            <div className="rounded-xl border border-line bg-paper/[0.03] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-sans font-semibold text-paper">
                  Report filters
                </h3>
                <FileText className="size-4 text-pulse" aria-hidden="true" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DemoField label="Search inventory" />
                <DemoField
                  label="Division"
                  options={["All divisions", "EPRED"]}
                />
                <DemoField
                  label="Category"
                  options={["All categories", "Camera"]}
                />
                <DemoField
                  label="Assignment"
                  options={[
                    "All assignments",
                    "Assigned only",
                    "Unassigned only",
                  ]}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-2 text-xs text-slate"
                >
                  Full Master Inventory
                </button>
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-2 text-xs text-slate"
                >
                  For Replacement / Condemned
                </button>
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-2 text-xs text-slate"
                >
                  Unassigned Equipment
                </button>
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-2 text-xs text-slate"
                >
                  3+ Years Aging Summary
                </button>
                <button
                  type="button"
                  className="ml-auto rounded-lg bg-pulse px-3 py-2 text-xs font-semibold text-ink"
                >
                  Export CSV
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-pulse/20 bg-pulse/5 p-4 text-sm text-slate">
              Filter first, check the matching total and status, then export.
              Reports include category, serial number, division, Custodian,
              Assignee, status, and service life.
            </div>
          </div>
        </SectionPanel>
      </section>

      <section id="notifications" className="scroll-mt-6">
        <SectionPanel
          title="7. Check Notifications"
          description="Select the bell in the top bar to review operational signals."
        >
          <div className="space-y-3 p-5">
            <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning/5 p-4">
              <Bell
                className="mt-0.5 size-4 shrink-0 text-warning"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-sans text-sm font-semibold text-paper">
                  Expiring soon · Laptop · EPRED
                </h3>
                <p className="mt-1 text-sm text-slate">
                  Review the equipment record and confirm whether replacement
                  planning is required.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-pulse/20 bg-pulse/5 p-4">
              <Activity
                className="mt-0.5 size-4 shrink-0 text-pulse"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-sans text-sm font-semibold text-paper">
                  Assignment updated · Camera
                </h3>
                <p className="mt-1 text-sm text-slate">
                  Open the equipment record to review the assignment history.
                </p>
              </div>
            </div>
          </div>
        </SectionPanel>
      </section>

      <SectionPanel
        title="8. Common questions"
        description="Use these checks before contacting your administrator."
      >
        <div className="divide-y divide-line px-5">
          <details className="py-4" open>
            <summary className="cursor-pointer font-semibold text-paper">
              Why does a page say data is unavailable?
            </summary>
            <p className="mt-2 text-sm leading-6 text-slate">
              Refresh the page first. If it persists, your session may need to
              be refreshed or your PULSE profile may not be registered
              correctly. Contact an Admin if other users see the same message.
            </p>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer font-semibold text-paper">
              Why is an equipment record not counted as Active?
            </summary>
            <p className="mt-2 text-sm leading-6 text-slate">
              Broken and retired units are excluded from Active. An operational
              unit can still be counted as Active while appearing in replacement
              or expiry planning.
            </p>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer font-semibold text-paper">
              Why can I not select someone as Custodian or Assignee?
            </summary>
            <p className="mt-2 text-sm leading-6 text-slate">
              Eligibility follows the assignment rules. Regular personnel are
              used for Custodian selection; PSS/PES personnel are used for
              Assignee selection. The division must also match.
            </p>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer font-semibold text-paper">
              How do I report a data mistake?
            </summary>
            <p className="mt-2 text-sm leading-6 text-slate">
              Note the category, serial number, and division, then ask an Admin
              to edit the record. Keep exported CSV evidence for audit
              corrections.
            </p>
          </details>
        </div>
      </SectionPanel>
    </div>
  );
}
