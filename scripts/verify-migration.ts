import fs from "fs"
import path from "path"
import * as xlsx from "xlsx"

type Row = Record<string, string | number | null | undefined>
const workbookPath = process.env.PULSE_WORKBOOK_PATH || path.join(process.cwd(), "01 EUMB ICT List.xlsx")
if (!fs.existsSync(workbookPath)) throw new Error(`Workbook not found: ${workbookPath}. Set PULSE_WORKBOOK_PATH to the source workbook.`)
const workbook = xlsx.readFile(workbookPath)
const expectedSheets = ["Laptop", "Tablet", "Drone", "Camera", "Printer"]
const expectedCounts = Object.fromEntries(expectedSheets.map((name) => [name, xlsx.utils.sheet_to_json<Row>(workbook.Sheets[name], { defval: null }).filter((row) => Object.values(row).some(Boolean)).length]))
const seed = fs.readFileSync("supabase/seed.sql", "utf8")
const report = fs.readFileSync("migration-report.txt", "utf8")
const failures: string[] = []

for (const [sheet, count] of Object.entries(expectedCounts)) {
  const actual = (seed.match(new RegExp(`equipment_categories WHERE name = '${sheet === "Laptop" ? "Laptop" : sheet}'`, "g")) || []).length
  const desktopRows = sheet === "Laptop" ? xlsx.utils.sheet_to_json<Row>(workbook.Sheets.Laptop, { defval: null }).filter((row) => String(row.Model || "").toLowerCase().includes("desktop")).length : 0
  const expectedSeedCount = sheet === "Laptop" ? count - desktopRows : count
  if (sheet === "Laptop" && actual !== expectedSeedCount) failures.push(`Laptop seed rows: expected ${expectedSeedCount}, got ${actual}`)
  if (sheet !== "Laptop" && actual !== expectedSeedCount) failures.push(`${sheet} seed rows: expected ${expectedSeedCount}, got ${actual}`)
}

const yearValues = seed.match(/, (20\d{2}),/g)?.length || 0
if (yearValues < 1) failures.push("No year_acquired values were preserved in seed.sql")
for (const sheet of expectedSheets) if (!report.includes(`- ${sheet}:`)) failures.push(`Migration report has no ${sheet} count`)
if (!report.includes("Blank data rows:")) failures.push("Migration report has no blank-data section")
if (!report.includes("Unmatched custodians:")) failures.push("Migration report has no unmatched-custodian section")

if (failures.length) {
  console.error(failures.join("\n"))
  process.exitCode = 1
} else {
  console.log("Migration verification passed")
}
