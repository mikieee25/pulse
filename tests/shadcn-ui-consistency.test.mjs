import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const root = new URL("../", import.meta.url)
const read = (path) => readFileSync(new URL(path, root), "utf8")

test("functional forms use the shared shadcn input primitives", () => {
  assert.ok(existsSync(new URL("src/components/ui/native-select.tsx", root)), "native-select component is missing")
  assert.ok(existsSync(new URL("src/components/ui/textarea.tsx", root)), "textarea component is missing")

  for (const path of [
    "src/components/admin/admin-activity.tsx",
    "src/components/admin/user-management.tsx",
    "src/components/equipment/equipment-filter-bar.tsx",
    "src/components/personnel/personnel-filter-bar.tsx",
    "src/components/equipment/add-equipment-dialog.tsx",
    "src/components/personnel/add-personnel-dialog.tsx",
    "src/app/login/page.tsx",
    "src/app/change-password/page.tsx",
  ]) {
    const source = read(path)
    assert.match(source, /@\/components\/ui\/(input|native-select)/, path)
  }
})

test("functional textareas use the shared shadcn textarea primitive", () => {
  for (const path of [
    "src/components/equipment/add-equipment-dialog.tsx",
  ]) {
    assert.match(read(path), /@\/components\/ui\/textarea/, path)
  }
})
