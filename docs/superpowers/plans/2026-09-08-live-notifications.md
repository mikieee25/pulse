# PULSE Live Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the authenticated topbar notification bell show live, grouped PULSE alerts with locally persisted read state.

**Architecture:** The server-rendered topbar reads the minimum equipment and assignment-history fields allowed by existing RLS and converts them into serializable `NotificationItem` values through a pure helper. A client `NotificationBell` owns menu visibility and local read state; query failure is isolated to the bell.

**Tech Stack:** Next.js 16.3.4 App Router, React 19, Supabase SSR, TypeScript, `lucide-react`, `localStorage`, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-08-light-theme-live-notifications-design.md`

## Global Constraints

- Derive alerts from existing equipment and assignment-history data.
- Store read state locally in the browser and provide “Mark all as read”.
- Keep all reads behind the existing authenticated Supabase session and RLS policies.
- Do not add a notifications table, email delivery, push delivery, or realtime subscription.
- If notification queries fail, keep the topbar usable and show an unavailable state in the bell.

---

### Task 1: Define the notification contract and failing tests

**Files:**
- Create: `tests/live-notifications.test.mjs`
- Inspect: `src/components/layout/topbar.tsx`, `src/lib/pulse.ts`

**Interfaces:**
- Produces the contract for `NotificationItem`, `buildNotifications`, `NotificationBell`, and the server query fields used by later tasks.

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const helper = await readFile(new URL("../src/lib/notifications.ts", import.meta.url), "utf8").catch(() => "")
const bell = await readFile(new URL("../src/components/notifications/notification-bell.tsx", import.meta.url), "utf8").catch(() => "")
const topbar = await readFile(new URL("../src/components/layout/topbar.tsx", import.meta.url), "utf8")

test("live notifications cover lifecycle and assignment signals", () => {
  assert.match(helper, /buildNotifications/)
  assert.match(helper, /For Replacement/)
  assert.match(helper, /Expiring soon/)
  assert.match(helper, /unassigned/i)
  assert.match(bell, /Mark all as read/)
  assert.match(bell, /localStorage/)
  assert.match(topbar, /NotificationBell/)
  assert.match(topbar, /assignment_history/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/live-notifications.test.mjs`

Expected: FAIL because the helper and client bell do not exist and the topbar has no notification query.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/live-notifications.test.mjs
git commit -m "test: define live notification contract"
```

### Task 2: Implement the pure live-alert builder

**Files:**
- Create: `src/lib/notifications.ts`

**Interfaces:**
- Produces `NotificationItem` and `buildNotifications(input, now)`.
- `NotificationItem` fields: `id`, `kind`, `title`, `description`, `href`, `tone`, and optional `timestamp`.
- `buildNotifications` accepts equipment rows with `id`, `status`, `condition_state`, `year_acquired`, nullable `assigned_to`, nullable `assignee_id`, and nullable `equipment_categories.name`, plus assignment rows with `id`, `assigned_at`, `note`, and nullable `personnel.full_name`.

- [ ] **Step 1: Implement grouped alert rules**

Return at most four groups, omitting zero-count groups:

```ts
replacement: lifecycleStatus(...) === "For Replacement" || condition_state === "Broken"
expiring: lifecycleStatus(...) === "Expiring soon"
unassigned: !assigned_to && !assignee_id
activity: assignment history rows sorted newest first
```

Use stable IDs `replacement`, `expiring`, `unassigned`, and `activity`; use `/equipment` for equipment alerts and `/reports` for activity. Preserve the newest assignment timestamp on the activity item.

- [ ] **Step 2: Run the focused test**

Run: `node --test tests/live-notifications.test.mjs`

Expected: PASS once the helper exists.

- [ ] **Step 3: Commit the pure helper**

```bash
git add src/lib/notifications.ts
git commit -m "feat: derive live pulse notifications"
```

### Task 3: Add the client notification bell

**Files:**
- Create: `src/components/notifications/notification-bell.tsx`

**Interfaces:**
- Consumes: `notifications: NotificationItem[]`, `unavailable?: boolean`.
- Produces: A bell button with unread badge, an accessible dropdown, alert links, an empty/unavailable state, and a “Mark all as read” button.

- [ ] **Step 1: Implement local read state**

Use the PULSE-specific key `pulse-read-notifications`. Read a JSON array inside `try/catch`; when “Mark all as read” is pressed, persist every current item ID and clear the badge. If storage is unavailable, keep state in React for the current session.

- [ ] **Step 2: Implement the accessible menu**

Use a button with `aria-label="Notifications"`, `aria-expanded`, and `aria-controls`. Give the menu a stable ID, close it when an alert link is clicked, and render `No new notifications` when all current items are read. Keep the panel aligned to the right side of the topbar and use the Budget surface tokens.

- [ ] **Step 3: Run the focused test**

Run: `node --test tests/live-notifications.test.mjs`

Expected: PASS.

- [ ] **Step 4: Commit the client bell**

```bash
git add src/components/notifications/notification-bell.tsx
git commit -m "feat: add notification bell dropdown"
```

### Task 4: Connect the server topbar to Supabase

**Files:**
- Modify: `src/components/layout/topbar.tsx`

**Interfaces:**
- Consumes: `createClient`, `buildNotifications`, `NotificationBell`, and the current profile helper.
- Produces: Authenticated live notification data without blocking profile/sign-out rendering.

- [ ] **Step 1: Add the minimum parallel queries**

Fetch:

```ts
equipment: id,status,condition_state,year_acquired,assigned_to,assignee_id,equipment_categories(name)
assignment_history: id,assigned_at,note,personnel(full_name), order assigned_at desc, limit 5
```

Keep the existing `getCurrentProfile()` call and treat either notification query error as `unavailable: true` rather than throwing.

- [ ] **Step 2: Render the bell in the existing topbar position**

Replace the presentation-only Bell button with `<NotificationBell notifications={notifications} unavailable={notificationUnavailable} />`; preserve the profile, avatar, sign-out placement, and Budget-style focus treatment.

- [ ] **Step 3: Run all checks**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass.

Run: `npx tsc --noEmit --pretty false`

Expected: exit code 0.

Run: `npx eslint --max-warnings=0 "src/components/layout/topbar.tsx" "src/components/notifications/notification-bell.tsx" "src/lib/notifications.ts"`

Expected: zero errors and warnings.

- [ ] **Step 4: Commit the server integration**

```bash
git add src/components/layout/topbar.tsx
git commit -m "feat: connect topbar notifications to live data"
```

### Task 5: Verify production and LAN behavior

**Files:**
- Test: `tests/live-notifications.test.mjs`

- [ ] **Step 1: Build the application**

Run: `npm run build`

Expected: Next.js production build completes successfully.

- [ ] **Step 2: Restart the LAN dev server after the build**

Restart only the PULSE process on port 3000, then open `http://192.168.68.58:3000/login`.

- [ ] **Step 3: Verify the bell manually**

Sign in, open the bell, confirm live alert groups appear when applicable, activate “Mark all as read”, confirm the unread badge clears, refresh, and confirm the local read state remains.

