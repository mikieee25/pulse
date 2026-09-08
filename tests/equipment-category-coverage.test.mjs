import assert from "node:assert/strict"
import { access, readFile } from "node:fs/promises"
import test from "node:test"

const budgetSource = await readFile(new URL("../src/app/(dashboard)/budget/page.tsx", import.meta.url), "utf8")
const dashboardSource = await readFile(new URL("../src/app/(dashboard)/page.tsx", import.meta.url), "utf8")
const layoutSource = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8")
const proxySource = await readFile(new URL("../src/proxy.ts", import.meta.url), "utf8")

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
