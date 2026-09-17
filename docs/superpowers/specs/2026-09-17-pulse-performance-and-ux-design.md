# PULSE Performance and UX Optimization Design

**Date:** 2026-09-17

## Objective

Make PULSE materially faster at its current size and safe as inventory grows, while preserving Supabase RLS, live admin activity/presence, lifecycle rules, and the existing DOE-branded interface.

## Confirmed baseline

- PULSE uses dynamic Next.js server rendering for authenticated routes.
- Request-local profile reads are deduplicated with React `cache()`.
- Categories and divisions are cached for 300 seconds, personnel and category costs for 60 seconds, and notifications for 30 seconds with `unstable_cache` plus tag invalidation.
- Activity and presence are intentionally uncached.
- Hashed Next.js assets already receive long-lived immutable browser caching.
- Dashboard, Budget, Summary, and Reports currently load the complete equipment table and aggregate in the Next.js server.
- Equipment and Reports paginate only after loading their full result set.
- Personnel loads the full directory plus nested equipment arrays, and Divisions loads every equipment row merely to calculate counts.
- The live inventory has reached 1,000 equipment records, the usual default PostgREST response ceiling, so an unbounded read can become incomplete as the dataset grows.
- Equipment, personnel, and assignment-history foreign-key/filter columns do not yet have supporting indexes beyond primary or unique indexes.
- PULSE uses Supabase's query client directly. It does not use Prisma, Drizzle, or another ORM.

## Considered approaches

### 1. Cache-first migration to Next.js Cache Components

This could prerender a larger shell and use `"use cache"`, but authenticated pages read cookies and division-scoped data. Migrating the whole application now would add security and invalidation risk before fixing the larger cost: unbounded database reads.

### 2. Client-side SPA cache

A React Query-style client cache could make repeat navigation feel fast, but it would add a dependency, send more data and logic to the browser, duplicate server authorization/cache rules, and leave the unbounded-query problem intact.

### 3. Database-first incremental optimization — selected

Keep dynamic SSR and the current tagged reference-data cache. Move lifecycle aggregation, search, filtering, totals, and pagination into Postgres; return only the rows required for the current view. Add granular streaming and optimized navigation after the data layer is bounded. This produces the largest improvement with the smallest security and architectural change.

## Data architecture

### Indexed read paths

Add indexes for the foreign keys and common filters used by inventory, personnel, assignment history, and reports. Indexes must match actual predicates and sort order; do not duplicate the existing `category_unit_costs(category_id, year)` unique index or activity indexes.

### One lifecycle definition

Add an immutable SQL helper equivalent to `equipmentDisplayStatus` in `src/lib/pulse.ts`. Its precedence is:

1. `Retired`
2. `Broken`
3. condition or stored status `For Replacement`
4. lifecycle expired
5. lifecycle expires within one year
6. `Active`

SQL and TypeScript parity tests will use the same fixtures so Dashboard, Budget, Equipment, Summary, Reports, notifications, and exports cannot drift.

### Bounded database functions

Create RLS-aware read RPCs for:

- Dashboard metrics, status counts, division counts, and replacement matrix.
- Budget/Summary division-category totals and current applicable category rates.
- Equipment and report search with validated filters, deterministic ordering, exact count, and bounded pages.
- Personnel directory search plus compact personnel/division summaries without nested equipment arrays.
- Notification counts plus only the newest five assignment events.

List functions return at most 50 records per call. Aggregate functions return compact grouped rows, not equipment records.

### Server data facade

`src/lib/inventory-queries.ts` becomes the only application entry point for the new RPCs. It owns input validation, response mapping, stable error results, and generated Supabase types. Pages should not know raw RPC response shapes.

PULSE will generate Supabase database types after the migration. It will not add an ORM: the Supabase client, SQL migrations, RLS, and typed RPCs already cover the persistence requirements without another schema or migration layer.

## Cache strategy

Keep the current cache model and add an inventory tag:

- Categories/divisions: 300 seconds.
- Personnel/costs: 60 seconds.
- Dashboard/planning aggregates: 30 seconds, keyed by role/division scope/date or fiscal year.
- Notifications: 30 seconds, but cache only compact aggregates/events.
- Equipment, Personnel, and Reports search pages: not shared-cached; they are request-specific and already bounded by server pagination.
- Admin activity, presence, authorization, and authenticated HTML: never shared-cached.

Every successful inventory mutation invalidates the inventory and notification tags. Cost/category/personnel/division mutations continue invalidating their specific tags and additionally invalidate affected aggregate tags.

## Rendering and navigation

- Keep the shared authenticated layout interactive while page panels stream independently through route and component-level Suspense boundaries.
- Show real page headers immediately, then metric, chart, and table skeletons matching final geometry.
- Replace raw category anchors with Next.js `Link` so route transitions preserve the shell and can prefetch loading states.
- Move Equipment and Reports filters into URL search parameters. Use a short debounced transition for text search, immediate transitions for selects, and announce updating/results state accessibly.
- Keep the previous table visible while the next page/filter request resolves where React transitions allow it.
- Lazy-load the Recharts client bundle behind chart skeletons; tables and KPI text remain server-rendered and usable first.

## Browser caching

- Preserve Next.js immutable caching for fingerprinted `/_next/static` assets.
- Add a one-day browser/CDN cache with stale-while-revalidate for public logo files and the favicon.
- Keep authenticated documents and authenticated route payloads private/no-store.
- Do not store inventory, permissions, activity, or presence in browser storage as a data cache.

## UX behavior

- Equipment, Personnel, and Reports display 25 rows by default with a hard maximum of 50.
- Pagination, filters, and selected category remain URL-addressable and browser-back-button friendly.
- Empty, error, loading, and updating states use the existing PULSE panels and preserve table dimensions to avoid layout shift.
- Export uses a protected server route with the same validated filters. It streams CSV directly and does not hydrate the full export dataset into the browser.
- Viewers do not load personnel management options or Admin-only data.
- Mutations keep existing confirmation and activity logging behavior, then refresh/invalidate only affected data.

## Performance and correctness budgets

- No authenticated page may issue an unbounded `equipment.select("*")` query or equivalent full-row read.
- Equipment, Personnel, and Reports responses contain at most 50 records.
- Dashboard, Budget, and Summary receive aggregate payloads under 100 KB at the current dataset.
- Notification snapshots contain counts plus at most five activity rows.
- Lifecycle parity tests pass for Active, Expiring soon, For Replacement, Broken, and Retired.
- RLS continues to limit Viewer results to their allowed division.
- Production targets: LCP below 2.5 seconds, INP below 200 ms, and CLS below 0.1 on representative desktop and mobile runs.

## Rollout strategy

1. Establish query-shape tests and measurement scripts.
2. Add indexes and read RPCs, then generate types.
3. Migrate Dashboard/Budget/Summary and compact notifications.
4. Migrate Equipment/Reports to server pagination and protected streaming export.
5. Add streaming, transitions, Link navigation, and public-asset headers.
6. Verify RLS, lifecycle parity, row counts, payload budgets, build, and production smoke tests.

Each phase is independently deployable and must retain the old page behavior until its replacement passes equivalence tests.

## Out of scope

- Introducing Prisma, Drizzle, or another ORM.
- Enabling Cache Components across the application in this pass.
- Caching admin activity, presence, authorization decisions, or user-specific HTML.
- Redesigning PULSE branding or changing lifecycle/business rules.
- Adding Redis or another external cache before Postgres/query-shape improvements are measured.
