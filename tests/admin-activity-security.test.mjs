import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL(
    "../supabase/migrations/20260916060738_admin_activity_presence.sql",
    import.meta.url
  ),
  "utf8"
);
const grantsMigration = await readFile(
  new URL(
    "../supabase/migrations/20260916062851_restrict_admin_activity_table_grants.sql",
    import.meta.url
  ),
  "utf8"
);
const adminPage = await readFile(
  new URL("../src/app/(dashboard)/admin/page.tsx", import.meta.url),
  "utf8"
);
const sidebar = await readFile(
  new URL("../src/components/layout/sidebar.tsx", import.meta.url),
  "utf8"
);
const activityComponent = await readFile(
  new URL("../src/components/admin/admin-activity.tsx", import.meta.url),
  "utf8"
);

test("activity and presence tables are protected for Admin reads", () => {
  assert.match(migration, /create table activity_log/i);
  assert.match(migration, /create table user_presence/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /private\.current_user_role\(\).*Admin/is);
  assert.match(migration, /grant select on activity_log to authenticated/i);
  assert.match(migration, /grant select on user_presence to authenticated/i);
  assert.doesNotMatch(
    migration,
    /grant (all|insert|update|delete).*activity_log to authenticated/i
  );
  assert.match(
    grantsMigration,
    /revoke all on table public\.activity_log, public\.user_presence from authenticated, anon/i
  );
  assert.match(
    grantsMigration,
    /grant select on table public\.activity_log, public\.user_presence to authenticated/i
  );
});

test("Admin activity route and navigation are role protected", async () => {
  const page = await readFile(
    new URL("../src/app/(dashboard)/admin/activity/page.tsx", import.meta.url),
    "utf8"
  ).catch(() => "");
  assert.match(page, /profile\?\.role !== ["']Admin["']/);
  assert.match(page, /getAdminActivityPage/);
  assert.match(page, /getAdminUserStatus/);
  assert.match(adminPage, /getRecentAdminActivity/);
  assert.match(activityComponent, /Recent Activity/);
  assert.match(activityComponent, /Active now/);
  assert.match(activityComponent, /Last Seen/);
  assert.match(activityComponent, /Last Sign In/);
  assert.match(activityComponent, /\/admin\/activity/);
  assert.match(sidebar, /isAdmin/);
});
