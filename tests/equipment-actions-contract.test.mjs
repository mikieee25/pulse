import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = await readFile(new URL("../src/app/actions/equipment.ts", import.meta.url), "utf8")

test("equipment actions reuse the validated assignment and category query contracts", () => {
  assert.doesNotMatch(source, /categoryName:\s*["']Laptop["']/)
  assert.match(source, /validateAssignment\(supabase, equipment\.division_id, personnelId, role\)/)
  assert.match(source, /Could not load equipment categories/)
})
