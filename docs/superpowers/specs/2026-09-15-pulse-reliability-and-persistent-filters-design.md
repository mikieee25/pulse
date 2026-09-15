# PULSE Reliability and Persistent Filters Design

## Goal

Make PULSE's existing inventory workflow more reliable and easier to resume without adding new business domains or changing permissions.

## Scope

- Make `equipment_categories.lifespan_years` the lifecycle source of truth.
- Correct the stale domain verification and add one documented test/check command.
- Harden category normalization and equipment-action error reporting.
- Make aggregate notifications reappear when their affected equipment changes and deep-link them to useful filters.
- Persist Equipment search, filters, and page in the URL.
- Prevent duplicate mutations and display actionable form errors.

## Architecture

Keep the existing Server Component and Supabase data flow. Lifecycle functions remain pure but receive `lifespan_years` instead of inferring lifespan from a category name. Equipment filtering remains client-side for the current dataset size; a small pure URL-state module owns parsing and serialization, while `window.history.replaceState` keeps filters shareable without a server request on every keystroke.

Server actions continue to enforce Admin authorization and Zod validation. Mutation components add local pending state or `useActionState`; no optimistic mutation is introduced where failure could leave the UI misleading.

## URL Contract

The Equipment route supports these optional parameters:

- `category`: selected database category; existing behavior remains.
- `q`: case-insensitive search across serial number, model, brand, category, division, custodian, and assignee.
- `division`: exact division code.
- `brand`: exact brand.
- `status`: one of `Active`, `Expiring soon`, `For Replacement`, `Broken`, or `Retired`.
- `assignment`: currently supports `unassigned` for equipment with neither a custodian nor an assignee.
- `page`: one-based positive integer; omitted when equal to `1`.

Empty/default values are omitted. Invalid values fall back safely and never reach Supabase queries.

## UX Rules

- Changing a search/filter resets `page` to `1`.
- Filter changes replace the current history entry; normal page links still participate in browser Back navigation.
- A visible “Clear filters” action appears only when a table filter is active.
- Results show the filtered count and current record range.
- Mutation controls are disabled while their request is pending.
- Errors use `role="alert"`; success messages use `role="status"`.
- Closing and reopening an add dialog after success starts from clean defaults.

## Notification Rules

Aggregate notification IDs include a deterministic signature of the sorted affected equipment IDs. Marking the current aggregate as read suppresses that exact set; adding or removing an affected asset produces a new unread notification. Notification links include the matching Equipment URL parameters.

## Non-goals

- Server-side pagination or full-text search.
- Realtime subscriptions or a persisted notifications table.
- Bulk actions, import UI, QR labels, archive restore, category merge, saved reports, or a general audit log.
- Authentication, role, RLS, route, or visual-theme changes.
- New npm dependencies.

## Acceptance Criteria

- Existing Admin/Viewer and division-scope behavior is unchanged.
- Lifecycle output respects `lifespan_years`; `null` means no automatic lifecycle expiry.
- Category aliases do not match partial words such as `dynamic` through `mic`.
- Equipment action failures distinguish missing data from Supabase query failures.
- Reassignment validation no longer fabricates an `EquipmentInput`.
- Changed notification aggregates become unread and open pre-filtered Equipment views.
- Equipment filters survive refresh and browser Back navigation.
- All mutation surfaces prevent duplicate submissions and expose accessible feedback.
- `npm run check` passes from a configured development checkout.
