# PULSE — AI Build Task List

> **Read `EUMB-ICT-System-Plan.md` first.** That file is the source of truth for data model, business rules, and screen requirements. This file is the _execution checklist_ — do not deviate from the spec's business rules without flagging it to the user first.

**Stack:** Next.js (App Router) + Supabase (Postgres + Auth + RLS) + Tailwind + shadcn/ui + animata.design components + TanStack Table + Recharts + React Hook Form + Zod + SheetJS.

Work through the phases **in order**. Do not start a phase until the previous one's acceptance criteria pass. Ask the user before making any decision that changes a business rule, adds a new entity, or deviates from the spec.

---

## Phase 0 — Project Setup

- [ ] Scaffold Next.js app (TypeScript, App Router, Tailwind, ESLint)
- [ ] Install: `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-table`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, `xlsx`, `framer-motion`
- [ ] Set up shadcn/ui (`npx shadcn init`)
- [ ] Pull 3–5 relevant animata.design components (counters, modal/drawer, table row transitions) into `components/animata/`
- [ ] Create Supabase project; store `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Basic app shell: sidebar nav (Dashboard, Equipment, Personnel, Divisions, Budget, Reports, Admin/Users), top bar with logged-in user + role badge
- [ ] Login page with PULSE branding + tagline ("Personnel & Unit Lifecycle System for Equipment")

**Acceptance:** app boots, empty shell renders, login page works against a test Supabase user.

---

## Phase 1 — Database Schema + RLS

Build exactly the schema in spec §3. Suggested SQL skeleton (adjust types/constraints as needed):

```sql
create type plantilla_status as enum ('Regular','COS','Outsourced','Reserve','For Transfer','For RTS');
create type equipment_status as enum ('Active','For Replacement','Retired');
create type app_role as enum ('Admin','Viewer');

create table divisions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,        -- e.g. "EPRED"
  full_name text not null
);

create table personnel (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  initials text not null,
  division_id uuid references divisions(id) not null,
  position text not null,
  plantilla_status plantilla_status not null default 'Regular'
);

create table equipment_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,        -- Laptop | Tablet | Desktop | Drone | Camera | Printer
  lifespan_years int                -- null = not tracked for expiry
);

create table category_unit_costs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references equipment_categories(id) not null,
  year int not null,
  unit_cost numeric not null,
  unique (category_id, year)
);

create table equipment (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references equipment_categories(id) not null,
  model text, brand text,
  year_acquired int,
  serial_number text,
  procurement_method text,
  division_id uuid references divisions(id) not null,
  assigned_to uuid references personnel(id),
  status equipment_status not null default 'Active',
  remarks text,
  created_at timestamptz default now()
);

create table assignment_history (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references equipment(id) not null,
  personnel_id uuid references personnel(id) not null,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  note text
);

create table app_users (
  id uuid primary key references auth.users(id),
  email text not null,
  full_name text not null,
  role app_role not null default 'Viewer',
  division_scope uuid references divisions(id)
);
```

- [ ] Add a **trigger or check constraint** enforcing: `equipment.assigned_to` can only reference a `personnel` row where `plantilla_status = 'Regular'` (do not rely on frontend validation alone — spec §4.3 is a hard rule)
- [ ] Enable RLS on all tables
- [ ] RLS policy: Admin (`app_users.role = 'Admin'`) → full access, all divisions
- [ ] RLS policy: Viewer with `division_scope` set → `select` only where `equipment.division_id = division_scope` (and same for personnel)
- [ ] RLS policy: Viewer with `division_scope` null → `select` only, all divisions
- [ ] Seed `equipment_categories`: Laptop (3), Tablet (3), Desktop (3), Drone (null), Camera (null), Printer (null)

**Acceptance:** schema deployed; a test Viewer account scoped to one division cannot read another division's equipment via the Supabase client (verify directly, not just through the UI).

---

## Phase 2 — Data Migration Script

Source files: `01_EUMB_ICT_List.xlsx` (sheets: `Laptop`, `Tablet`, `Drone`, `Camera`, `Printer`, `Data`) and `dataset.md`.

- [ ] Parse `dataset.md` → `personnel` + `divisions` (division names/codes come from the "Department / Division" column; split "Elaborated Name" into `full_name`, extract initials from the "Original / Abbreviated Name" column's parenthetical, e.g. `(PTA)`)
- [ ] Cross-reference `Data` sheet in the xlsx for `plantilla_status` per person (match by initials/name) — `dataset.md` does not carry plantilla status, the xlsx `Data` sheet does
- [ ] Import `Laptop` sheet → `equipment` rows, category = Laptop, **except** the 5 known "Mac Mini Desktop" rows (EPRED/EPSMD, 2022) → import those as category = Desktop instead
- [ ] Import `Tablet`, `Drone`, `Camera`, `Printer` sheets → `equipment` rows in their categories
- [ ] Skip `Laptop only` and `Sheet1` entirely (per spec §7)
- [ ] Blank `Model`/`Brand`/`Year Acquired` rows (mostly Drone/Camera) import with `status` left `Active` but with a `remarks` note flagging "needs data entry" — do not fabricate values
- [ ] Match each equipment row's `Current Custodian` name to a `personnel` row for `assigned_to`; log any unmatched names to a console report instead of silently dropping them
- [ ] Printer rows (division-level, no named custodian) → `assigned_to = null`, `division_id` set

**Acceptance:** run script against real files, produce a migration report (counts per sheet, unmatched-name list, blank-data list) for the user to review before trusting the imported data.

---

## Phase 3 — Equipment List + CRUD

- [ ] `/equipment` page, tabs per category (Laptop/Tablet/Desktop/Drone/Camera/Printer)
- [ ] TanStack Table: search, filter by division/status/brand, sort, pagination
- [ ] Status badge computed client-side or via a view: Active (green) / Expiring soon — within 6 months of 3-yr mark (amber) / For Replacement (red) — only for categories with `lifespan_years` set
- [ ] "+ Add Equipment" → drawer/modal form (React Hook Form + Zod): category, model, brand, year acquired, serial number, procurement method, division, assigned-to
  - Assigned-to dropdown: query `personnel` where `plantilla_status = 'Regular'` **and** `division_id` matches selected division (confirm with user whether cross-division assignment should be allowed — spec doesn't explicitly restrict this, flag it)
- [ ] Edit / Reassign (writes to `assignment_history`: close previous open assignment, open new one) / Retire (status → Retired) / Delete (Admin only, confirmation dialog, hard delete)
- [ ] Equipment Detail page: full record + `assignment_history` timeline

**Acceptance:** can add/edit/reassign/retire/delete equipment; assignment dropdown never shows non-Regular personnel; reassigning correctly closes out the prior `assignment_history` row.

---

## Phase 4 — Dashboard + Budget Tab

- [ ] Dashboard KPI cards (animata counters): Total equipment, Expired/For Replacement, Expiring within 6 months, Active
- [ ] Bar chart: inventory by division
- [ ] Status breakdown chart by category
- [ ] Auto-generated "Replacement Plan for [Year]" table (mirrors old `Sheet1`)
- [ ] `/budget` page: year selector, Division × Category grid of (units for replacement × unit cost from `category_unit_costs`) = subtotal, grand total
- [ ] Admin-only inline edit of `category_unit_costs` per year
- [ ] Export budget table to Excel (SheetJS)

**Acceptance:** dashboard numbers match a manual count against the database; budget total recalculates correctly when a unit cost is edited.

---

## Phase 5 — Personnel / Division Admin Screens

- [ ] `/personnel` list: division, position, plantilla status, currently assigned equipment
- [ ] "+ Add Employee" modal: Name, Division (dropdown), Position, Initials (auto-suggested, editable) — see spec §5.4 for the plantilla-status-defaults-to-Regular note; surface that field in the form too, don't hide it
- [ ] `/divisions` rollup page: headcount, equipment count, expired count per division
- [ ] `/admin/users`: manage `app_users` (invite, set role, set division_scope) — Admin only

**Acceptance:** adding an employee through the UI makes them immediately selectable in the equipment "Assigned To" dropdown (if Regular).

---

## Phase 6 — Reports + Polish

- [ ] `/reports`: export current inventory (all categories or filtered) to Excel/CSV
- [ ] Apply animata.design treatments: list transitions, modal/drawer animations, dashboard counter animations, hover states
- [ ] Empty states, loading states, error states for every screen
- [ ] Mobile-responsive pass on Dashboard and Equipment List at minimum

**Acceptance:** full walkthrough of every screen with no dead ends, no unhandled loading/error state, exports open cleanly in Excel.

---

## Things to flag to the user, not decide silently

- Cross-division equipment assignment (Phase 3) — spec doesn't say if a person can be assigned equipment tagged to a different division than their own
- Any personnel row in the xlsx `Data` sheet that can't be matched to a `dataset.md` entry during migration (name mismatches, transfers, etc.)
- Any equipment row whose `Current Custodian` doesn't match any personnel record
