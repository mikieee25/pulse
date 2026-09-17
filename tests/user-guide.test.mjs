import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("native PULSE tutorial documents the live application workflows", async () => {
  const guide = await readFile("src/app/(dashboard)/tutorial/page.tsx", "utf8");
  const sidebar = await readFile("src/components/layout/sidebar.tsx", "utf8");
  const topbar = await readFile("src/components/layout/topbar.tsx", "utf8");
  const layout = await readFile("src/app/(dashboard)/layout.tsx", "utf8");

  for (const text of [
    "PULSE User Guide",
    "Sign in",
    "Dashboard",
    "Equipment",
    "Custodian",
    "Assignee",
    "Personnel",
    "Outsourced",
    "Divisions",
    "Budget",
    "Summary",
    "Reports",
    "Notifications",
    "Change your password",
  ]) {
    assert.match(
      guide,
      new RegExp(text.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"))
    );
  }

  assert.match(guide, /<MetricCard/);
  assert.match(guide, /Equipment form fields/);
  assert.match(guide, /Custodian \/ Assignee/);
  assert.match(guide, /<details/);
  assert.match(sidebar, /href: "\/tutorial"/);
  assert.match(topbar, /href="\/tutorial"/);
  assert.match(layout, /\["\/tutorial", "Tutorial"\]/);
});
