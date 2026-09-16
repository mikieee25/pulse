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

test("changelog records the DOE central theme and three-logo lockup", async () => {
  const changelog = await source("src/components/changelog/changelog.tsx");

  assert.match(changelog, /central DOE color theme/);
  assert.match(changelog, /Bagong Pilipinas/);
  assert.match(changelog, /light theme the default/);
});

test("equipment list exposes the assignee beside the custodian", async () => {
  const page = await source("src/app/(dashboard)/equipment/page.tsx");
  const columns = await source("src/components/equipment/columns.tsx");

  assert.match(page, /assignee:personnel!equipment_assignee_id_fkey\(full_name\)/);
  assert.match(page, /Assignee: item\.assignee/);
  assert.match(columns, /id: "custodian"[\s\S]*id: "assignee"/);
  assert.match(columns, /header: "Assignee"/);
});

test("equipment filters persist in the URL and search across asset fields", async () => {
  const page = await source("src/app/(dashboard)/equipment/page.tsx");
  const table = await source("src/components/equipment/equipment-table.tsx");

  assert.match(page, /parseEquipmentFilters/);
  assert.match(table, /Search serial, model, brand, custodian/);
  assert.match(table, /Clear filters/);
  assert.match(table, /window\.history\.replaceState/);
  assert.match(table, /Showing .* matching/);
});

test("mutation controls expose pending guards and accessible feedback", async () => {
  const equipmentDialog = await source("src/components/equipment/add-equipment-dialog.tsx");
  const equipmentActions = await source("src/components/equipment/equipment-actions.tsx");
  const personnelDialog = await source("src/components/personnel/add-personnel-dialog.tsx");
  const divisionDialog = await source("src/components/divisions/add-division-dialog.tsx");
  const userManagement = await source("src/components/admin/user-management.tsx");

  assert.match(equipmentDialog, /disabled=\{saving\}/);
  assert.match(equipmentDialog, /Saving…/);
  assert.match(equipmentDialog, /role="alert"/);
  assert.match(equipmentActions, /disabled=\{pendingAction !== null\}/);
  assert.match(personnelDialog, /disabled=\{saving\}/);
  assert.match(divisionDialog, /disabled=\{saving\}/);
  assert.match(userManagement, /creating/);
});

test("personnel overview includes a data-driven outsourced staff card", async () => {
  const page = await source("src/app/(dashboard)/personnel/page.tsx");

  assert.match(page, /outsourcedCount/);
  assert.match(page, /effectivePlantillaStatus/);
  assert.match(page, /label="Outsourced"/);
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

test("interface typography uses Inter-backed sans text instead of serif overrides", async () => {
  const files = [
    "src/app/not-found.tsx",
    "src/app/change-password/page.tsx",
    "src/app/(dashboard)/error.tsx",
    "src/app/(dashboard)/budget/page.tsx",
    "src/components/changelog/changelog.tsx",
    "src/components/layout/brand-lockup.tsx",
    "src/components/layout/page-header.tsx",
    "src/components/layout/section-panel.tsx",
  ];

  for (const file of files) {
    assert.doesNotMatch(await source(file), /font-serif/);
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
