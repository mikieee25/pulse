import assert from "node:assert/strict"
import { access, readFile } from "node:fs/promises"
import test from "node:test"
import { canonicalEquipmentCategory } from "../src/lib/pulse.ts"

const budgetSource = await readFile(new URL("../src/app/(dashboard)/budget/page.tsx", import.meta.url), "utf8")
const dashboardSource = await readFile(new URL("../src/app/(dashboard)/page.tsx", import.meta.url), "utf8")
const layoutSource = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8")
const proxySource = await readFile(new URL("../src/proxy.ts", import.meta.url), "utf8")
const equipmentPageSource = await readFile(new URL("../src/app/(dashboard)/equipment/page.tsx", import.meta.url), "utf8")
const equipmentDialogSource = await readFile(new URL("../src/components/equipment/add-equipment-dialog.tsx", import.meta.url), "utf8")
const equipmentActionsSource = await readFile(new URL("../src/components/equipment/equipment-actions.tsx", import.meta.url), "utf8")
const categoryActionSource = await readFile(new URL("../src/app/actions/equipment-categories.ts", import.meta.url), "utf8")
const categoryMigrationSource = await readFile(new URL("../supabase/migrations/20260915000000_normalize_equipment_categories.sql", import.meta.url), "utf8")

test("budget includes every database category, including manual replacement categories", () => {
  assert.doesNotMatch(budgetSource, /\.filter\(\s*\(category\) => category\.lifespan_years !== null\s*\)/)
  assert.match(budgetSource, /category\.lifespan_years === null \? "Manual replacement"/)
})

test("replacement plan seeds columns from the complete category list", () => {
  assert.match(dashboardSource, /from\("equipment_categories"\)/)
  assert.match(dashboardSource, /allCategories = new Set\(categories\.map\(\(category\) => category\.name\)\)/)
})

test("PULSE uses its branded SVG instead of the default file favicon", async () => {
  await assert.rejects(access(new URL("../src/app/favicon.ico", import.meta.url)))
  assert.match(layoutSource, /icon: "\/pulseicon\.svg"/)
  assert.doesNotMatch(layoutSource, /favicon\.ico/)
  assert.match(proxySource, /pulseicon\.svg/)
  assert.match(proxySource, /pulselogo\.svg/)
})

test("equipment exposes an admin-only circular category action", () => {
  assert.match(equipmentPageSource, /AddCategoryDialog/)
  assert.match(equipmentPageSource, /aria-label=\"Add equipment category\"/)
  assert.match(equipmentPageSource, /canManage && <AddCategoryDialog/)
})

test("category creation is server-authorized and revalidates dependent views", () => {
  assert.match(categoryActionSource, /requireProfile\("Admin"\)/)
  assert.match(categoryActionSource, /equipment_categories.*insert/s)
  assert.match(categoryActionSource, /revalidatePath\("\/equipment"\)/)
  assert.match(categoryActionSource, /revalidatePath\("\/budget"\)/)
})

test("new categories are available in the equipment form", () => {
  assert.match(equipmentPageSource, /categories=\{visibleCategories\.map\(\(cat\) => cat\.name\)/)
  assert.match(equipmentDialogSource, /categories\?: string\[\]/)
  assert.match(equipmentDialogSource, /categoryOptions\.map\(\(value\)/)
})

test("assignee options are not limited to Regular personnel", () => {
  assert.doesNotMatch(equipmentPageSource, /\.eq\(['"]plantilla_status['"], ['"]Regular['"]\)/)
  assert.match(equipmentDialogSource, /\["PSS", "PES"\]/)
  assert.match(equipmentActionsSource, /\["PSS", "PES"\]/)
})

test("equipment category aliases share one reporting category", () => {
  assert.equal(canonicalEquipmentCategory("Portable Monitor"), "Monitors")
  assert.equal(canonicalEquipmentCategory('MONITOR 27"'), "Monitors")
  assert.equal(canonicalEquipmentCategory("Earbuds"), "Headphones")
  assert.equal(canonicalEquipmentCategory("NOISE CANCELLING OVER-THE-HEAD HEADPHONES"), "Headphones")
  assert.equal(canonicalEquipmentCategory("GIMBAL"), "GIMBAL")
  assert.match(categoryMigrationSource, /UPDATE equipment/)
  assert.match(categoryMigrationSource, /DELETE FROM equipment_categories/)
})
