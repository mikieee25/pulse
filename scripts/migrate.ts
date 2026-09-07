import crypto from "crypto"
import fs from "fs"
import path from "path"
import * as xlsx from "xlsx"

type Cell = string | number | null | undefined
type Row = Record<string, Cell>
type Division = { id: string; code: string; fullName: string }
type Person = {
  id: string
  fullName: string
  initials: string
  divisionId: string
  position: string
  plantillaStatus: string
}

const root = path.join(__dirname, "..")
const uuid = () => crypto.randomUUID()
const validPlantilla = new Set(["Regular", "COS", "Outsourced", "Reserve", "For Transfer", "For RTS"])

function text(value: Cell) {
  return value === null || value === undefined ? "" : String(value).trim()
}

function sql(value: Cell) {
  const valueText = text(value)
  return valueText ? `'${valueText.replace(/'/g, "''")}'` : "NULL"
}

function codeForDivision(name: string) {
  if (name === "Office of the Director") return "OD"
  const explicit = name.match(/\(([^)]+)\)/)?.[1]
  return explicit || name.split(/\s+/).map((word) => word[0]).join("").toUpperCase()
}

function parseDataset(filePath: string) {
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).flatMap((line) => {
    if (!line.trim().startsWith("|") || line.includes("---")) return []
    const parts = line.split("|").map((part) => part.trim())
    if (parts[1] === "Department / Division" || parts.length < 5) return []
    const initials = parts[3].match(/\(([^)]+)\)/)?.[1] || ""
    return [{ division: parts[1], fullName: parts[2].replace(/\*\*/g, ""), initials, position: parts[4] }]
  })
}

function headerValue(row: Row, names: string[]) {
  const key = Object.keys(row).find((candidate) => names.includes(candidate))
  return key ? row[key] : null
}

function normalizeDivision(value: string) {
  const aliases: Record<string, string> = {
    OOTD: "OD",
    "Office of the Director": "OD",
    "Energy Efficiency and Conservation Performance Regulation and Enforcement Division": "EEACPRAED",
  }
  return aliases[value] || value
}

async function run() {
  const datasetRows = parseDataset(path.join(root, "dataset.md"))
  const workbook = xlsx.readFile(path.join(root, "01 EUMB ICT List.xlsx"))
  const dataRows = xlsx.utils.sheet_to_json<Row>(workbook.Sheets.Data, { defval: null })

  const divisions = new Map<string, Division>()
  const addDivision = (name: string, code = codeForDivision(name)) => {
    const normalizedCode = normalizeDivision(code)
    if (!divisions.has(normalizedCode)) divisions.set(normalizedCode, { id: uuid(), code: normalizedCode, fullName: name })
  }
  for (const row of datasetRows) addDivision(row.division)
  for (const code of ["OD", "NED", "AFETD", "EVIMD", "EPMPD", "EPSMD", "EPRED", "EEACPRAED"]) {
    const names: Record<string, string> = {
      OD: "Office of the Director",
      EPRED: "Energy Efficiency and Conservation Performance Regulation and Enforcement Division (EPRED)",
    }
    addDivision(names[code] || code, code)
  }
  const divisionCodeById = new Map([...divisions.values()].map((division) => [division.id, division.code]))

  const unmatchedPersonnel: string[] = []
  const personnel: Person[] = datasetRows.map((row) => {
    const match = dataRows.find((excelRow) => text(excelRow.Initials) === row.initials || text(excelRow["Full Name"]).includes(row.fullName))
    const rawPlantilla = text(match?.Plantilla)
    const plantillaStatus = validPlantilla.has(rawPlantilla) ? rawPlantilla : "Regular"
    if (!match) unmatchedPersonnel.push(`${row.fullName} (${row.initials})`)
    const divisionCode = codeForDivision(row.division)
    const person = {
      id: uuid(),
      fullName: row.fullName,
      initials: row.initials || row.fullName.split(/\s+/).map((word) => word[0]).join("").toUpperCase(),
      divisionId: divisions.get(normalizeDivision(divisionCode))!.id,
      position: row.position,
      plantillaStatus,
    }
    return person
  })

  const personByName = new Map<string, Person>()
  for (const person of personnel) {
    personByName.set(person.fullName.toLowerCase(), person)
    if (person.initials) personByName.set(person.initials.toLowerCase(), person)
  }

  const equipmentSheets = ["Laptop", "Tablet", "Drone", "Camera", "Printer"] as const
  const sheetCounts: Record<string, number> = {}
  const unmatchedCustodians = new Set<string>()
  const assignmentIssues: string[] = []
  const blankRows: string[] = []
  const equipment: Array<Record<string, Cell> & { id: string; categoryName: string; divisionId: string; assignedTo: string | null; assignmentIssue: string | null }> = []
  const custodianOverrides: Record<string, string> = {
    "Marienelle S. Santos": "MSM",
    "Von Jari Anievas": "VJAA",
    "Hannah Isabel L. Cumpas": "HILC",
    "Mary Ann Fernando": "MAMF",
  }

  for (const sheetName of equipmentSheets) {
    const rows = xlsx.utils.sheet_to_json<Row>(workbook.Sheets[sheetName], { defval: null })
    sheetCounts[sheetName] = 0
    for (const row of rows) {
      if (!Object.values(row).some((value) => text(value))) continue
      const divisionCode = normalizeDivision(text(row.Division) || "OD")
      const division = divisions.get(divisionCode) || divisions.get("OD")!
      const model = text(row.Model)
      const brand = text(row.Brand)
      const year = headerValue(row, ["Year Acquired", "Year Acquired/Transferred", "Year Acquired/ Transferred"])
      const custodian = text(row["Current Custodian"])
      const lookup = (custodianOverrides[custodian] || custodian).toLowerCase()
      const match = custodian ? personByName.get(lookup) || personnel.find((person) => person.fullName.toLowerCase().includes(lookup) || lookup.includes(person.fullName.toLowerCase())) : undefined
      if (custodian && !match) unmatchedCustodians.add(custodian)
      const assignmentReasons = match
        ? [
            match.divisionId !== division.id ? `${divisionCode} equipment; ${divisionCodeById.get(match.divisionId) || "unknown"} personnel` : "",
            match.plantillaStatus !== "Regular" ? `personnel status ${match.plantillaStatus}` : "",
          ].filter(Boolean)
        : []
      const assignmentIssue = match && assignmentReasons.length
        ? `${custodian} (${assignmentReasons.join("; ")})`
        : null
      if (assignmentIssue) assignmentIssues.push(`${sheetName} #${text(row["No."]) || "?"} ${assignmentIssue}`)
      const blank = !model && !brand && !text(year)
      if (blank) blankRows.push(`${sheetName} #${text(row["No."]) || "?"} ${custodian || "unassigned"}`)
      const actualCategory = sheetName === "Laptop" && model.toLowerCase().includes("desktop") ? "Desktop" : sheetName
      equipment.push({
        ...row,
        id: uuid(),
        categoryName: actualCategory,
        divisionId: division.id,
        assignedTo: match && !assignmentIssue ? match.id : null,
        assignmentIssue,
        _year: year,
        _model: model,
        _brand: brand,
      })
      sheetCounts[sheetName]++
    }
  }

  let seed = "-- Seed file generated by scripts/migrate.ts\n\n"
  for (const division of divisions.values()) seed += `INSERT INTO divisions (id, code, full_name) VALUES ('${division.id}', ${sql(division.code)}, ${sql(division.fullName)});\n`
  for (const person of personnel) seed += `INSERT INTO personnel (id, full_name, initials, division_id, position, plantilla_status) VALUES ('${person.id}', ${sql(person.fullName)}, ${sql(person.initials)}, '${person.divisionId}', ${sql(person.position)}, ${sql(person.plantillaStatus)});\n`
  seed += `\nINSERT INTO category_unit_costs (category_id, year, unit_cost) SELECT id, ${new Date().getFullYear()}, 0 FROM equipment_categories;\n\n`
  seed += "\n"
  for (const item of equipment) {
    const remarks = text(item.Remarks)
    const notes = [
      !text(item._model) && !text(item._brand) && !text(item._year) ? "[Migration] Needs data entry" : "",
      item.assignmentIssue ? `[Migration] Custodian division mismatch: ${item.assignmentIssue}; left unassigned` : "",
    ].filter(Boolean)
    const finalRemarks = [remarks, ...notes].filter(Boolean).join(" | ")
    const year = text(item._year) ? Number.parseInt(text(item._year), 10) : null
    seed += `INSERT INTO equipment (id, category_id, model, brand, year_acquired, serial_number, procurement_method, division_id, assigned_to, status, remarks) VALUES ('${item.id}', (SELECT id FROM equipment_categories WHERE name = '${item.categoryName}'), ${sql(item._model)}, ${sql(item._brand)}, ${Number.isFinite(year) ? year : "NULL"}, ${sql(item["Serial Number"])}, ${sql(item["Method of Procurement"])}, '${item.divisionId}', ${item.assignedTo ? `'${item.assignedTo}'` : "NULL"}, 'Active', ${sql(finalRemarks)});\n`
    if (item.assignedTo) seed += `INSERT INTO assignment_history (equipment_id, personnel_id, note) VALUES ('${item.id}', '${item.assignedTo}', 'Imported from workbook');\n`
  }
  fs.writeFileSync(path.join(root, "supabase/seed.sql"), seed)

  const report = [
    "Migration Report",
    "================",
    "",
    "Sheet counts:",
    ...Object.entries(sheetCounts).map(([name, count]) => `- ${name}: ${count}`),
    "",
    "Unmatched personnel plantilla rows:",
    ...(unmatchedPersonnel.length ? unmatchedPersonnel.map((name) => `- ${name}`) : ["- None"]),
    "",
    "Unmatched custodians:",
    ...(unmatchedCustodians.size ? [...unmatchedCustodians].map((name) => `- ${name}`) : ["- None"]),
    "",
    "Custodian assignment issues (left unassigned):",
    ...(assignmentIssues.length ? assignmentIssues.map((row) => `- ${row}`) : ["- None"]),
    "",
    "Blank data rows:",
    ...(blankRows.length ? blankRows.map((row) => `- ${row}`) : ["- None"]),
    "",
  ].join("\n")
  fs.writeFileSync(path.join(root, "migration-report.txt"), report)
  console.log(report)
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
