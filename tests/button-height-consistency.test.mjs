import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const button = await readFile(new URL("../src/components/ui/button.tsx", import.meta.url), "utf8")
const personnel = await readFile(new URL("../src/app/(dashboard)/personnel/page.tsx", import.meta.url), "utf8")
const divisions = await readFile(new URL("../src/app/(dashboard)/divisions/page.tsx", import.meta.url), "utf8")
const reports = await readFile(new URL("../src/app/(dashboard)/reports/reports-client.tsx", import.meta.url), "utf8")
const exportButton = await readFile(new URL("../src/components/equipment/export-button.tsx", import.meta.url), "utf8")
const equipment = await readFile(new URL("../src/app/(dashboard)/equipment/page.tsx", import.meta.url), "utf8")
const budget = await readFile(new URL("../src/app/(dashboard)/budget/page.tsx", import.meta.url), "utf8")
const tutorial = await readFile(new URL("../src/app/(dashboard)/tutorial/page.tsx", import.meta.url), "utf8")
const admin = await readFile(new URL("../src/app/(dashboard)/admin/page.tsx", import.meta.url), "utf8")
const equipmentDetail = await readFile(new URL("../src/app/(dashboard)/equipment/[id]/page.tsx", import.meta.url), "utf8")
const equipmentFilter = await readFile(new URL("../src/components/equipment/equipment-filter-bar.tsx", import.meta.url), "utf8")
const personnelFilter = await readFile(new URL("../src/components/personnel/personnel-filter-bar.tsx", import.meta.url), "utf8")
const equipmentTable = await readFile(new URL("../src/components/equipment/equipment-table.tsx", import.meta.url), "utf8")
const personnelTable = await readFile(new URL("../src/components/personnel/personnel-table.tsx", import.meta.url), "utf8")
const divisionsTable = await readFile(new URL("../src/components/divisions/divisions-table.tsx", import.meta.url), "utf8")

test("shared action buttons use the 40px height token", () => {
  assert.match(button, /action:\s*"h-10[^\"]*px-4/)
  for (const source of [personnel, divisions, exportButton, equipment, equipmentFilter, personnelFilter, divisionsTable, equipmentDetail]) {
    assert.match(source, /size="action"/)
  }
  for (const source of [budget, tutorial, admin, equipmentDetail]) {
    assert.match(source, /h-10/)
  }
  assert.match(reports, /nativeButton=\{false\}[\s\S]*render=\{<Link href="\/reports\/export" \/>\}/)
  assert.match(reports, /size="action"[\s\S]*Export full CSV/)
  assert.match(reports, /Export full CSV/)
  assert.match(reports, /Previous/)
  assert.match(reports, /Next/)
  for (const source of [equipmentTable, personnelTable]) {
    assert.match(source, /inline-flex h-10/)
    assert.match(source, /Previous/)
    assert.match(source, /Next/)
  }
})
