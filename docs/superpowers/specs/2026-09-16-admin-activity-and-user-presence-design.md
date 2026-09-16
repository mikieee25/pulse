# PULSE Admin Activity and User Presence Design

## Status

Approved design. Implementation is intentionally separate and will follow an approved implementation plan.

## Goal

Give global PULSE Admins a trustworthy way to see who changed data, what they changed, and when it happened. Also show whether each account is currently using PULSE and when that account last signed in.

The feature is global: Admins can see activity and status across every division. Viewers and any future division-scoped roles cannot access this information.

## User-facing behavior

The Admin dashboard includes a compact Recent Activity card showing the five newest successful actions and a View all activity link.

The dedicated `/admin/activity` page contains:

1. A user-status section with Active now, Last seen, and Last Sign In.
2. A newest-first activity history with filters for user, action/module, division, and date range.

Activity entries use readable language, for example:

> Juan Dela Cruz added Dell Latitude 5450 on September 16, 2026 at 2:14 PM.

On smaller screens, activity entries stack vertically and filters collapse into a drawer. The page must not require horizontal scrolling.

## Data model

### `activity_log`

An append-only audit table for successful application data changes.

Required fields:

- `id`: UUID primary key.
- `actor_user_id`: the authenticated application user ID.
- `actor_name`: actor name snapshot for durable historical display.
- `actor_email`: actor email snapshot for disambiguation.
- `action`: normalized action such as `created`, `updated`, `deleted`, `assigned`, `reassigned`, `retired`, or `state_changed`.
- `entity_type`: normalized module/entity such as `equipment`, `personnel`, `division`, `equipment_category`, or `user`.
- `entity_id`: affected record ID when available.
- `entity_label`: readable affected-record snapshot, such as equipment name or personnel name.
- `division_id`: related division ID when applicable.
- `division_name`: division snapshot for historical display.
- `metadata`: JSONB for limited action-specific context, such as old/new assignment names.
- `created_at`: server-generated timestamp with timezone.

Indexes should support newest-first history and the planned filters: `created_at`, actor, action/entity type, and division.

The table is append-only from the application perspective. There is no UI for editing or deleting entries.

### `user_presence`

A lightweight current-status table keyed by application user ID:

- `user_id`: UUID primary key and reference to `app_users`.
- `last_seen_at`: server timestamp of the latest accepted heartbeat.
- `updated_at`: server timestamp for maintenance/debugging.

Presence is not historical audit data. It only represents the latest known activity.

### Last sign-in

Do not duplicate Supabase Auth sign-in timestamps into the application tables. The Admin-only server data layer reads Supabase Auth `last_sign_in_at` and combines it with `app_users` and `user_presence` for the status view.

## Event flow

1. A global Admin performs a supported mutation.
2. The existing server action validates authorization and completes the mutation.
3. After a successful mutation, a shared activity recorder inserts one `activity_log` row using the authenticated actor and server timestamp.
4. The UI refreshes or invalidates the relevant activity query.
5. The Admin activity page loads user profiles, presence, sign-in timestamps, and paginated activity data server-side.

Supported initial mutation coverage:

- Equipment creation, update, assignment/reassignment, retirement, and state changes.
- Personnel creation, update, and deletion.
- Division creation and update.
- Equipment-category creation.
- User creation, update, and deletion.
- Category-cost updates when they are persisted as a mutation.

Import or bulk operations may record one summarized event, for example: `System import added 102 equipment records`, rather than emitting an unnecessarily large feed.

Existing assignment history remains intact and continues to provide assignment-specific history. The activity log is the cross-module administrative feed.

## Presence behavior

- The client sends a heartbeat approximately once per minute while the PULSE document is visible.
- Heartbeats stop or pause when the document is hidden and resume when it becomes visible.
- `Active now` means `last_seen_at` is within the previous five minutes.
- Otherwise the UI displays a relative Last seen value.
- Heartbeat failures are retried and do not interrupt normal work.
- Presence updates are limited to the signed-in user’s own row.

## Authorization and privacy

- Only users with the global `Admin` role can select from `activity_log` or read all `user_presence` rows.
- Viewers cannot read activity or presence data.
- Division scope does not filter global Admins.
- A signed-in user may update only their own presence, preferably through a narrow authenticated RPC or equivalent server action.
- Activity creation is performed by the trusted server path after successful mutations; clients cannot submit arbitrary actor identity or timestamps.
- Supabase service-role credentials remain server-only.
- RLS is mandatory for both new tables, with explicit grants and policies in the migration.

## Failure handling

- Activity-feed failure shows an inline error with Retry while leaving the rest of the Admin page usable.
- Last Sign In failure displays `Unavailable` and does not expose auth-service details.
- Presence failure is non-blocking and should not falsely retain Active now beyond the five-minute threshold.
- A mutation remains successful if its follow-up audit insert fails. The failure must be observable through server logging/monitoring so it can be repaired without blocking data entry.
- Failed or cancelled mutations do not create success activity entries.

## Acceptance criteria

- A global Admin can see successful actions from every division.
- A Viewer cannot access activity or presence data through the UI or direct API queries.
- Supported successful data changes identify the actor, action, affected record, and timestamp.
- The user-status section correctly distinguishes Active now, Last seen, and Last Sign In.
- The five-minute Active now boundary is tested.
- Activity filtering, pagination, empty states, retry behavior, and mobile layout are tested.
- Existing assignment history and current dashboard behavior remain intact.
- Migration, typecheck, tests, lint, and production build pass.

## Out of scope

- A full immutable database-trigger audit system for arbitrary direct SQL changes.
- A historical presence timeline.
- Showing the activity feed to Viewers or division-scoped users.
- Emitting a feed item for every page view, heartbeat, filter change, or read-only action.
