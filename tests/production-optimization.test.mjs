import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const config = await read("next.config.ts");
const layout = await read("src/app/layout.tsx");
const envExample = await read(".env.example");
const topbar = await read("src/components/layout/topbar.tsx");
const dashboardLayout = await read("src/app/(dashboard)/layout.tsx");
const cachedData = await read("src/lib/cached-data.ts");
const auth = await read("src/lib/auth.ts");
const activity = await read("src/lib/admin-activity.ts");
const searchMigration = await read(
  "supabase/migrations/20260917040000_add_search_indexes.sql"
).catch(() => "");

test("production config is safe and LAN origins are configurable", () => {
  assert.match(config, /PULSE_ALLOWED_DEV_ORIGINS/);
  assert.match(config, /poweredByHeader:\s*false/);
  assert.match(config, /X-Content-Type-Options/);
  assert.match(config, /Referrer-Policy/);
});

test("authenticated application metadata is not indexable", () => {
  assert.match(layout, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/s);
});

test("environment template documents the service key scope", () => {
  assert.match(envExample, /dashboard|activity|presence/i);
});

test("topbar can stream behind a loading boundary", () => {
  assert.match(dashboardLayout, /Suspense/);
  assert.match(dashboardLayout, /TopbarSkeleton/);
});

test("legacy notification reader is removed", () => {
  assert.doesNotMatch(cachedData, /function readNotifications/);
  assert.doesNotMatch(cachedData, /getCachedNotifications/);
});

test("profile and activity reads expose structured error handling and bounded fields", () => {
  assert.match(auth, /profile lookup failed/i);
  assert.match(activity, /actor_user_id,actor_name,actor_email/);
  assert.match(activity, /pageSize \+ 1/);
});

test("auth user status listing handles multiple pages", () => {
  assert.match(activity, /listUsers/);
  assert.match(activity, /page\s*\+=\s*1/);
});

test("search migration adds trigram indexes and indexed predicates", () => {
  assert.match(searchMigration, /CREATE EXTENSION IF NOT EXISTS pg_trgm/i);
  assert.match(searchMigration, /gin_trgm_ops/i);
  assert.doesNotMatch(searchMigration, /concat_ws\(/i);
});

test("topbar icon actions have accessible names", () => {
  assert.match(topbar, /aria-label="Profile Settings"/);
  assert.match(topbar, /aria-label="Sign Out"/);
});
