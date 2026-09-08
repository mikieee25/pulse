# Budget-Style Dashboard Design

## Goal

Apply the approved Budget page visual language to every authenticated dashboard route while preserving existing Supabase queries, server actions, exports, filters, and route behavior.

## Scope

In scope:

- Dashboard (`/`)
- Equipment list and equipment detail (`/equipment`, `/equipment/[id]`)
- Personnel (`/personnel`)
- Divisions (`/divisions`)
- Budget (`/budget`, already the visual reference)
- Summary (`/summary`)
- Reports (`/reports`)
- Admin landing and user management (`/admin`, `/admin/users`)
- Authenticated loading and error states under the dashboard route group

Out of scope:

- Login and authentication route visuals
- Global data-model, Supabase, RLS, or action changes
- New dashboard features or new business calculations
- Replacing the existing chart, table, dialog, export, or form libraries

## Visual Direction

Budget is the source of truth. The shared visual language uses the existing PULSE tokens from `src/app/globals.css`:

- Canvas: `bg-canvas` for page background and `bg-canvas-deep` for raised surfaces
- Text: `text-paper` for primary content and `text-slate` for supporting copy
- Accent: `text-pulse`, `bg-pulse`, and restrained pulse-tinted borders/backgrounds
- Alerts: `text-alert` for destructive or replacement attention states and amber for warnings
- Dividers: `border-line`

Page geometry follows Budget:

- Page root: `space-y-8 pb-8`
- Primary panels: `rounded-2xl border border-line bg-canvas-deep`
- Standard panel padding: `p-5` or `p-6`; larger hero padding: `p-6 sm:p-8`
- Hero title: serif, `text-3xl sm:text-4xl`, tight tracking
- Supporting copy: compact `text-sm` with `leading-6`
- KPI values: tabular numbers, serif or semibold hierarchy, semantic accent colors
- Tables: contained in a rounded panel, horizontal scrolling on narrow screens, sticky headers only where the table is vertically scrollable
- Controls: rounded-xl grouped controls, visible focus rings, responsive wrapping

The refresh should feel like one product: no page introduces a new surface color, radius scale, typography treatment, or button language unless the content requires a semantic warning or destructive state.

## Shared Components

Add focused server-compatible presentation primitives under `src/components/layout/`:

### `page-header.tsx`

`PageHeader` renders the Budget-style hero header and accepts:

- `eyebrow?: React.ReactNode`
- `title: React.ReactNode`
- `description?: React.ReactNode`
- `actions?: React.ReactNode`
- `children?: React.ReactNode` for optional hero content

It owns the responsive flex layout, decorative pulse glow, title hierarchy, and spacing. It must not own navigation, data fetching, or route changes.

### `metric-card.tsx`

`MetricCard` renders a compact KPI surface and accepts:

- `label: React.ReactNode`
- `value: React.ReactNode`
- `detail?: React.ReactNode`
- `icon?: React.ComponentType<{ className?: string }>`
- `tone?: "neutral" | "pulse" | "warning" | "alert"`

It owns icon treatment, value hierarchy, tabular number styling, and semantic tone classes. It must remain presentational.

### `section-panel.tsx`

`SectionPanel` wraps charts, tables, forms, and management areas with the shared rounded surface. It accepts an optional `title`, `description`, `actions`, and `className`, while allowing arbitrary children. The title area must use semantic heading markup when a title is supplied.

### `empty-state.tsx`

`EmptyState` renders the same centered icon/title/supporting-copy treatment for no rows, missing budget data, and other empty results. It accepts an optional icon and `action` node.

Do not create separate components for every route-specific card. Route pages should compose these primitives and retain their domain-specific table/chart content.

## Route Treatment

### Dashboard

- Replace the compact title block with `PageHeader` and a dashboard eyebrow.
- Convert the four existing overview surfaces into `MetricCard` instances.
- Place the two existing charts in `SectionPanel` instances with consistent headings.
- Place the replacement plan in one `SectionPanel` with a responsive, scrollable table.
- Preserve all lifecycle calculations and current replacement-plan columns.

### Equipment

- Use `PageHeader` with category context and existing export/add actions.
- Restyle category links as a contained responsive tab strip with a clear active pulse state.
- Wrap `EquipmentTable` in `SectionPanel` and retain edit, delete, assignment, and export behavior.
- Keep the selected category query parameter unchanged.

### Personnel

- Use `PageHeader` with existing add action.
- Add small derived overview metrics only from the already-loaded personnel array: total personnel, regular personnel, and personnel with assigned equipment. Do not add queries.
- Wrap the existing table in `SectionPanel`.
- Preserve edit/delete safeguards and dialog behavior.

### Divisions

- Use `PageHeader` with existing add action.
- Surface existing division row counts as compact overview metrics without changing the query.
- Wrap `DivisionsTable` in `SectionPanel`.

### Equipment detail

- Use the same `PageHeader` treatment with a back action and equipment identity.
- Group detail fields, assignment controls, and lifecycle information into `SectionPanel` surfaces.
- Preserve all existing update/reassign actions.

### Summary

- Move the current view/year controls into `PageHeader` actions.
- Convert the two summary figures into `MetricCard` instances.
- Wrap the pivot matrix in `SectionPanel` and add the Budget table caption/header treatment.
- Preserve the current query parameters and client-side view switching.

### Reports

- Use `PageHeader` with the existing export action.
- Style report tabs as the same responsive tab strip used by Equipment.
- Convert current report totals into `MetricCard` instances.
- Wrap filters and results in separate `SectionPanel` surfaces.
- Preserve filtering, pagination, status labels, and export rows.

### Admin and Admin / Users

- Use `PageHeader` for both routes.
- Present the Admin landing link as a prominent `SectionPanel` action card.
- Present the invite form in a `SectionPanel` with responsive fields.
- Wrap user settings in a scrollable `SectionPanel` table.
- Preserve admin-only redirects, invite actions, role changes, and division scope behavior.

### Loading and error states

- Match Budget panel geometry and typography.
- Use a restrained pulse loading treatment and an alert panel with a clear retry/recovery message.
- Do not alter route or authentication behavior.

## Responsive and Accessibility Requirements

- All action groups wrap below the large breakpoint; tables remain usable through horizontal scrolling.
- Every icon-only control has an accessible label; decorative icons use `aria-hidden="true"`.
- Each table has a meaningful caption or an equivalent labelled section and uses `scope` on column headers where practical.
- Focus states remain visible against `bg-canvas` and `bg-canvas-deep`.
- Color is never the only indicator for warning, replacement, assignment, or active states.
- Preserve keyboard operation for tabs, filters, forms, dialogs, pagination, and sign-out.

## Verification

Use the existing project checks after each route group:

- Focused ESLint on changed route and component files with `--max-warnings=0`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- Existing Node tests under `tests/`
- `git diff --check`

For the final pass, start the production server on the LAN bind address and smoke-test the authenticated route redirects plus the rendered routes with an authenticated session if available. Do not treat an unauthenticated redirect as a page rendering failure.
