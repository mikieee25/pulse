import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const personnel = await readFile(new URL("../src/components/personnel/personnel-filter-bar.tsx", import.meta.url), "utf8")
const activity = await readFile(new URL("../src/components/admin/admin-activity.tsx", import.meta.url), "utf8")
const nativeSelect = await readFile(new URL("../src/components/ui/native-select.tsx", import.meta.url), "utf8")

test("personnel and activity filters use consistent full-height controls", () => {
  for (const source of [personnel, activity]) {
    assert.match(source, /h-10 rounded-lg border border-line/)
    assert.match(source, /h-10[^\n]*whitespace-nowrap/)
    assert.match(source, /Search by name|From date/)
  }
})

test("native selects reserve chevron space and activity filters use a responsive grid", () => {
  assert.match(nativeSelect, /pr-10/)
  assert.match(activity, /grid-cols-1[\s\S]*2xl:grid-cols-\[minmax\(14rem,2fr\)_repeat\(7,minmax\(7rem,1fr\)\)_auto\]/)
  assert.match(activity, /2xl:grid-cols/)
  assert.match(activity, /sm:col-span-2 2xl:col-span-1/)
  assert.match(activity, /justify-start[\s\S]*Apply[\s\S]*Clear/)
})
