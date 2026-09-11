import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();

async function source(path) {
  return readFile(join(root, path), "utf8");
}

test("shared dashboard primitives use the Budget surface contract", async () => {
  const files = [
    "src/components/layout/page-header.tsx",
    "src/components/layout/metric-card.tsx",
    "src/components/layout/section-panel.tsx",
    "src/components/layout/empty-state.tsx",
  ];

  const contents = await Promise.all(files.map(source));
  const combined = contents.join("\n");

  assert.match(combined, /rounded-2xl/);
  assert.match(combined, /border-line/);
  assert.match(combined, /bg-canvas-deep/);
  assert.match(combined, /focus-visible/);
  assert.match(combined, /aria-hidden/);
});

test("authenticated dashboard routes opt into the shared page root", async () => {
  const files = [
    "src/app/(dashboard)/page.tsx",
    "src/app/(dashboard)/equipment/page.tsx",
    "src/app/(dashboard)/personnel/page.tsx",
    "src/app/(dashboard)/divisions/page.tsx",
    "src/app/(dashboard)/summary/summary-content.tsx",
    "src/app/(dashboard)/reports/reports-client.tsx",
    "src/app/(dashboard)/admin/page.tsx",
    "src/app/(dashboard)/admin/users/page.tsx",
  ];

  const contents = await Promise.all(files.map(source));

  for (const content of contents) {
    assert.match(content, /space-y-8/);
    assert.match(content, /pb-8/);
  }
});

test("dashboard navigation preserves the reporting and budget routes", async () => {
  const content = await source("src/app/(dashboard)/layout.tsx");

  assert.match(content, /\["\/budget"/);
  assert.match(content, /\["\/summary"/);
  assert.match(content, /\["\/reports"/);
});

test("dashboard exposes the PULSE changelog route on desktop and mobile", async () => {
  const sidebar = await source("src/components/layout/sidebar.tsx");
  const layout = await source("src/app/(dashboard)/layout.tsx");
  const changelog = await source("src/app/(dashboard)/changelog/page.tsx");
  const changelogComponent = await source("src/components/changelog/changelog.tsx");

  assert.match(sidebar, /\/changelog/);
  assert.match(layout, /\["\/changelog", "Changelog"\]/);
  assert.match(changelog, /Changelog/);
  assert.match(changelogComponent, /PULSE/);
});

test("dashboard route states use the Budget panel treatment", async () => {
  const files = [
    "src/app/(dashboard)/loading.tsx",
    "src/app/(dashboard)/error.tsx",
  ];
  const contents = await Promise.all(files.map(source));

  for (const content of contents) {
    assert.match(content, /rounded-2xl/);
    assert.match(content, /border-line/);
    assert.match(content, /bg-canvas-deep/);
  }
});

test("sidebar navigation uses the shared Budget interaction treatment", async () => {
  const content = await source("src/components/layout/sidebar.tsx");

  assert.match(content, /rounded-xl/);
  assert.match(content, /hover:bg-pulse\/10/);
  assert.match(content, /focus-visible:ring-pulse/);
});

test("inventory routes compose the shared Budget-style layout", async () => {
  const files = [
    "src/app/(dashboard)/page.tsx",
    "src/app/(dashboard)/equipment/page.tsx",
    "src/app/(dashboard)/equipment/[id]/page.tsx",
    "src/app/(dashboard)/personnel/page.tsx",
    "src/app/(dashboard)/divisions/page.tsx",
  ];
  const contents = await Promise.all(files.map(source));

  for (const content of contents) {
    assert.match(content, /PageHeader/);
    assert.match(content, /SectionPanel/);
    assert.match(content, /space-y-8/);
    assert.match(content, /pb-8/);
  }
});

test("reporting routes compose the shared Budget-style layout", async () => {
  const files = [
    "src/app/(dashboard)/summary/summary-content.tsx",
    "src/app/(dashboard)/reports/reports-client.tsx",
  ];
  const contents = await Promise.all(files.map(source));

  for (const content of contents) {
    assert.match(content, /PageHeader/);
    assert.match(content, /MetricCard/);
    assert.match(content, /SectionPanel/);
    assert.match(content, /caption|aria-labelledby/);
  }
});

test("admin routes compose the shared Budget-style layout", async () => {
  const files = [
    "src/app/(dashboard)/admin/page.tsx",
    "src/app/(dashboard)/admin/users/page.tsx",
    "src/components/admin/user-management.tsx",
  ];
  const contents = await Promise.all(files.map(source));

  assert.match(contents[0], /PageHeader/);
  assert.match(contents[1], /PageHeader/);
  assert.match(contents[2], /SectionPanel/);
});
