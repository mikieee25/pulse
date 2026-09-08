import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = await readFile(new URL("../src/app/(dashboard)/budget/page.tsx", import.meta.url), "utf8")

test("budget page exposes the refreshed planning hierarchy", () => {
  assert.match(source, /aria-labelledby="budget-overview-title"/)
  assert.match(source, /aria-label="Fiscal year"/)
  assert.match(source, /<caption className="sr-only">/)
  assert.match(source, /sticky top-0/)
  assert.match(source, /Missing rate/)
})
