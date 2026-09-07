# PULSE — EUMB ICT Equipment Management System

### _Personnel & Unit Lifecycle System for Equipment_

## 1. Overview

A modern replacement for the current Excel-based ICT tracker used by EUMB. It manages all ICT equipment (Laptops, Tablets, Desktops, Drones, Cameras, Printers) across divisions — who has what, when it was acquired, and when it's due for replacement — with role-based access instead of a shared spreadsheet.

**Branding:** system name is **PULSE**, with the login screen tagline _"Personnel & Unit Lifecycle System for Equipment"_ — leans into the lifespan/expiry tracking being the core feature (checking the "pulse" of the fleet's remaining life).

**Core goals**

- Add / edit / delete / monitor ICT equipment records
- Auto-flag equipment as expired once it passes its lifespan (3 years for Laptop/Tablet/Desktop)
- Assign equipment only to **Regular** plantilla personnel (never PSS/PES/COS/Outsourced), picked from a dropdown sourced from the personnel list
- Organize everything by Division
- Give management a dashboard view of totals, expiring units, and replacement needs — the "REPLACEMENT FOR 2026" summary sheet, but live and always current instead of manually recalculated

## 2. What the Excel file told us

| Sheet                    | Purpose                                                                            | Notes                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `Laptop` / `Laptop only` | Laptop + some desktop inventory per person                                         | Near-duplicate sheets; `Laptop` is the superset — will be the single source |
| `Tablet`                 | Tablet inventory per person                                                        | Same column structure as Laptop                                             |
| `Drone`, `Camera`        | Equipment inventory, mostly unassigned/blank                                       | No 3-year lifespan tracking needed                                          |
| `Printer`                | Inventory per Division (not per person — printers are shared)                      | No `Full Name`/`Position` columns                                           |
| `Data`                   | Personnel master list: No., Full Name, Initials, Division, Position, **Plantilla** | This is the source for the "assign to" dropdown                             |
| `Sheet1`                 | The manually-built "REPLACEMENT FOR 2026" summary                                  | This becomes the auto-generated Dashboard/Reports view                      |

Common columns across equipment sheets: `Full Name, Initials, Division, Position, Model, Brand, Year Acquired, Years in Service (derived), Serial Number, Method of Procurement, Current Custodian, Remarks`.

**Key finding:** the field that actually determines assignment eligibility is **Plantilla status** in the `Data` sheet (`Regular`, `COS`, `Outsourced`, `Reserve`, `For Transfer`, `For RTS`) — not the `Position` title. Titles like "Project Support Staff" (PSS) and "Project Evaluation Specialist" (PES) always pair with a non-Regular plantilla status, so the system will filter the assignment dropdown by `plantilla_status = 'Regular'`, not by parsing job titles. This is more robust if a PSS/PES title changes wording later.

## 3. Data Model

```
Division
  id, name (e.g. "EPRED"), full_name

Personnel                         ← from dataset.md
  id, full_name, initials, division_id (FK), position, plantilla_status
  plantilla_status enum: Regular | COS | Outsourced | Reserve | For Transfer | For RTS
  ← full_name now comes from the elaborated/proper name (dataset.md was updated with real names, not just initials-only entries)

EquipmentCategory
  id, name (Laptop | Tablet | Desktop | Drone | Camera | Printer)
  lifespan_years (nullable — 3 for Laptop/Tablet/Desktop, null for the rest = not tracked for expiry)
  ← Desktop is its own category, separate from Laptop (old sheet merged them; new system splits them)

CategoryUnitCost                  ← powers the Budget tab (see §5, §7.1)
  id, category_id (FK), year, unit_cost
  ← kept per-year so unit costs can be updated annually without losing history (mirrors Sheet1's per-year "Unit Cost" columns)

Equipment
  id, category_id (FK), model, brand
  year_acquired, serial_number, procurement_method
  division_id (FK)                ← always set; printers/shared gear live at division level
  assigned_to (FK → Personnel, nullable) ← only settable when Personnel.plantilla_status = 'Regular'
  status enum: Active | For Replacement | Retired  ← Active/For Replacement auto-computed, Retired is manual
  remarks

AssignmentHistory                 ← new — the old sheet had no audit trail
  id, equipment_id (FK), personnel_id (FK), assigned_at, unassigned_at, note

AppUser                           ← system logins (Supabase Auth), distinct from Personnel
  id, email, full_name, role enum: Admin | Viewer
  division_scope (nullable FK → Division)  ← if set, Viewer only sees that division
```

**Computed, not stored:**

- `years_in_service = current_year - year_acquired`
- `is_expired = years_in_service >= category.lifespan_years` (only for categories with a lifespan)
- This avoids the old sheet's problem of a static "Years in Service" number going stale.

## 4. Business Rules

1. **Lifespan applies only to Laptop, Tablet, Desktop.** Drone, Camera, Printer are tracked for inventory/custody but never flagged "expired."
2. **Expiry status** is computed live: `year_acquired + 3 <= current_year` → **Expired / For Replacement**. A visual "years remaining" indicator shows on every record (e.g. "1 year left", "Expired 2 yrs ago").
3. **Assignment restriction:** the "Assigned To" dropdown on the equipment form only lists Personnel where `plantilla_status = Regular`. PSS/PES/COS/Outsourced/Reserve/For Transfer/For RTS never appear in that dropdown.
4. **Printers** default to division-level assignment (no individual "Assigned To" required, matching the old sheet), but the field stays available if a division wants to assign one to a person.
5. **Retiring equipment:** deleting a record is destructive; "Retired" is a status change that keeps history. Hard delete is reserved for true data-entry mistakes (Admin only, with a confirmation step).
6. **Role permissions:**
   - **Admin:** full CRUD on Equipment, Personnel, Divisions; manages AppUsers; sees all divisions.
   - **Viewer:** read-only; if `division_scope` is set, sees only that division's data — otherwise sees everything read-only.

## 5. Screens

1. **Dashboard**
   - KPI cards: Total equipment, Expired/For Replacement, Expiring within 6 months, Active
   - Bar chart: inventory by division (mirrors `Sheet1`'s DIVISIONS/REGULAR table)
   - Donut/stacked chart: status breakdown by category (Laptop, Tablet, Desktop vs Drone/Camera/Printer)
   - "Replacement Plan for [Year]" table — auto-generated version of `Sheet1`, exportable

2. **Equipment List** (per category tab: Laptop / Tablet / Desktop / Drone / Camera / Printer)
   - Table with search, filter (division, status, brand), sort
   - Status badge: Active (green) / Expiring soon (amber) / For Replacement (red)
   - Row actions: Edit, Reassign, Retire, Delete (Admin only)
   - "+ Add Equipment" button → modal/drawer form with the "Assigned To" dropdown (Regular personnel only) and Division dropdown

3. **Equipment Detail**
   - Full record, custody history (AssignmentHistory timeline), remarks

4. **Personnel** (read view of the `Data` sheet, imported once, editable by Admin)
   - List with division, position, plantilla status, and their currently assigned equipment
   - **"+ Add Employee"** button → modal form to add a single person outside the bulk import: **Name, Division (dropdown), Position, Initials**
     - Initials auto-suggests from the name (e.g. "Michael Angelo O. Guarin" → "MAOG") but stays editable, since the office's convention isn't always strictly first-letter-of-each-word (e.g. "Reymund G. Fiecas Jr." → "RFJR", not "RGFJ")
     - Plantilla status isn't in the 4 requested fields, but it drives the assignment-eligibility rule (§4), so the form defaults new entries to **Regular** with the field visible and editable — otherwise every manually-added employee would be assignable-only or not, silently, with no way to mark someone as PSS/PES/COS/Outsourced if that's what they actually are

5. **Divisions**
   - Per-division rollup: headcount, equipment count, expired count

6. **Reports / Export**
   - Export current inventory or replacement plan to Excel/CSV (keeps continuity with how the office already shares this data)

7. **Admin → Users**
   - Manage AppUser accounts and roles (Admin only)

8. **Budget / Replacement Planning** (own top-level tab, separate from the Dashboard)
   - Select a year → table of Division × Category showing: units currently "For Replacement", unit cost for that year, and the subtotal — auto-computed from live equipment data, replacing the manual math in `Sheet1`
   - Editable unit-cost fields per category per year (Admin only) — feeds `CategoryUnitCost`
   - Grand total budget figure at the bottom, exportable to Excel for submission
   - Because it's driven by the same live "For Replacement" status as the rest of the system, this stays accurate automatically as equipment ages — no more re-tallying every planning cycle

## 6. Tech Stack

- **Framework:** Next.js (App Router, Server Components + Server Actions for mutations)
- **Backend/DB/Auth:** Supabase (Postgres + Row Level Security enforcing the Admin/Viewer + division-scope rules at the DB layer, not just in the UI)
- **UI:** Tailwind CSS + shadcn/ui as the base component layer, with [animata.design](https://animata.design/) components dropped in for the animated bits — dashboard counters, list-item transitions, modals/drawers, hover/reveal effects
- **Tables:** TanStack Table (sorting/filtering/pagination on the equipment lists)
- **Charts:** Recharts for the dashboard
- **Forms:** React Hook Form + Zod validation
- **Export:** SheetJS (xlsx) for Excel export

RLS in Supabase is the important detail here: since Viewer accounts can be division-scoped, that restriction should be enforced as a Postgres policy, not just hidden in the frontend — otherwise a Viewer could technically call the API directly and see other divisions' data.

## 7. Data Migration Plan

1. Import `Data` sheet → `Division` + `Personnel` tables (one-time script, run via Supabase SQL or a seed script)
2. Import `Laptop`, `Tablet`, `Drone`, `Camera`, `Printer` sheets → `Equipment` table, mapped to their `EquipmentCategory`, matched to `Personnel` by name/initials for `assigned_to`
3. Skip `Laptop only` (superseded by `Laptop`) and `Sheet1` (becomes generated, not imported)
4. Manual review pass: some rows had blank `Model`/`Brand`/`Year Acquired` (e.g. most Drone/Camera rows) — these import as inventory placeholders with status "Unassigned/No unit" until filled in

## 8. Decisions (resolved)

- **Desktop is its own category**, separate from Laptop, going forward.
- **Division list is confirmed complete**: OD, NED, AFETD, EVIMD, EPMPD, EPSMD, EPRED, and the EE&C Performance Regulation and Enforcement Division.
- **Budget/cost tracking is built in now**, as its own dedicated tab (§5.8) rather than folded into the Dashboard — driven by `CategoryUnitCost` and live "For Replacement" counts.

## 9. Suggested Build Order (once this spec is approved)

1. Supabase schema + RLS policies + auth
2. Data migration script from the Excel file (personnel, divisions, equipment — including a one-time split of Desktop rows currently mixed into the `Laptop` sheet into their own category; found 5 such rows, all "Mac Mini Desktop" under EPRED/EPSMD, 2022)
3. Equipment List + CRUD (the core daily-use screen)
4. Dashboard + Budget/Replacement Planning tab
5. Personnel/Division admin screens
6. Polish pass: animata.design animations, export to Excel
