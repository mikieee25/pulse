import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const files = {
  equipment: await readFile(new URL("../src/app/actions/equipment.ts", import.meta.url), "utf8"),
  personnel: await readFile(new URL("../src/app/actions/personnel.ts", import.meta.url), "utf8"),
  divisions: await readFile(new URL("../src/app/actions/divisions.ts", import.meta.url), "utf8"),
  categories: await readFile(new URL("../src/app/actions/equipment-categories.ts", import.meta.url), "utf8"),
  admin: await readFile(new URL("../src/app/actions/admin.ts", import.meta.url), "utf8"),
}

test("supported mutations record activity", () => {
  for (const source of Object.values(files)) assert.match(source, /recordActivity/)
  for (const name of ["addEquipment", "updateEquipment", "reassignEquipment", "retireEquipment", "updateEquipmentState"]) assert.match(files.equipment, new RegExp(`export async function ${name}[\\s\\S]*recordActivity`))
  for (const name of ["addPersonnel", "updatePersonnel", "deletePersonnel"]) assert.match(files.personnel, new RegExp(`export async function ${name}[\\s\\S]*recordActivity`))
  for (const name of ["addDivision", "updateDivision"]) assert.match(files.divisions, new RegExp(`export async function ${name}[\\s\\S]*recordActivity`))
  assert.match(files.categories, /export async function addEquipmentCategory[\s\S]*recordActivity/)
  for (const name of ["createUser", "updateUser", "deleteUser", "saveCategoryCost"]) assert.match(files.admin, new RegExp(`export async function ${name}[\\s\\S]*recordActivity`))
})
