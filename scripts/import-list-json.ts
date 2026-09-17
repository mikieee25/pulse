import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalEquipmentCategory } from "../src/lib/pulse";

type SourceRow = Record<string, unknown>;
type Person = {
  id: string;
  full_name: string;
  division_id: string;
  position: string;
  plantilla_status: string;
};
type Division = { id: string; code: string };
type ExistingEquipment = {
  id: string;
  remarks: string | null;
  serial_number: string | null;
};
type ImportRow = {
  sourceRow: number;
  importKey: string;
  importOccurrence: number;
  category: string;
  description: string;
  serial_number: string;
  custodian: string;
  assignee: string;
  division: string;
  division_id: string | null;
  assigned_to: string | null;
  assignee_id: string | null;
  status: "Active";
  condition_state: "Good";
  remarks: string;
};

const aliases: Record<string, string> = {
  slomoncshekatkar: "solomoncshekatkar",
  patricktaquino: "patricktaquinocesoiii",
  victorinoggetaladojr: "victorinogetaladojr",
  rustymargsaclausa: "rustymargsaclusa",
  alejandrecmontemayor: "alejandrecmontemayo",
  cephasvcabatit: "cephasoliviervcabatit",
  chamainepearllaquino: "charmainepearllaquino",
  ewanmaryrosepgalagala: "emrpgalagala",
  annemanetdjimenez: "annemanettedjimenez",
  marinellesmalubay: "marienellesmalubay",
  irishslubendina: "islubendina",
  luzvimindaleonido: "luzvimindapleonido",
  maureencmandoza: "maureencmendoza",
};

export function normalizeName(value: unknown) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeImportValue(value: string) {
  return value.trim().normalize("NFKC").toLowerCase();
}

function importIdentityKey(
  row: Pick<
    ImportRow,
    | "category"
    | "description"
    | "serial_number"
    | "custodian"
    | "assignee"
    | "division"
  >
) {
  return [
    row.category,
    row.description,
    row.serial_number,
    row.custodian,
    row.assignee,
    row.division,
  ]
    .map(normalizeImportValue)
    .join("\u001f");
}

export function importMarker(identityKey: string, occurrence = 0) {
  const markerKey = crypto
    .createHash("sha256")
    .update(`${identityKey}:${occurrence}`)
    .digest("hex")
    .slice(0, 12);
  return `[Import:list.json:${markerKey}]`;
}

function sourceText(row: SourceRow, key: string) {
  return String(row[key] ?? "").trim();
}

function normalizeDivision(value: string) {
  const code = value.trim().toUpperCase();
  return code === "EUMB" || code === "EUMB-OD" ? "OD" : code;
}

function resolvePerson(name: string, peopleByName: Map<string, Person>) {
  const key = normalizeName(name);
  return peopleByName.get(aliases[key] || key);
}

function duplicateSerialGroups(rows: ImportRow[]) {
  const grouped = new Map<string, ImportRow[]>();
  for (const row of rows) {
    if (!row.serial_number) continue;
    grouped.set(row.serial_number, [
      ...(grouped.get(row.serial_number) || []),
      row,
    ]);
  }
  return [...grouped.values()].filter((group) => group.length > 1);
}

export function buildImportPlan(
  source: unknown[],
  people: Person[],
  divisions: Division[],
  existingMarkers = new Set<string>(),
  existingSerials = new Set<string>()
) {
  const peopleByName = new Map(
    people.map((person) => [normalizeName(person.full_name), person])
  );
  const divisionsByCode = new Map(
    divisions.map((division) => [division.code.toUpperCase(), division])
  );
  const rows: ImportRow[] = [];
  let sameAsCustodianAssignees = 0;
  const unresolvedCustodians = new Set<string>();
  const unresolvedAssignees = new Set<string>();
  const unresolvedDivisions = new Set<string>();
  const identityOccurrences = new Map<string, number>();

  for (const [index, raw] of source.entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const sourceRow = index + 1;
    const row = raw as SourceRow;
    const category = canonicalEquipmentCategory(sourceText(row, "Category"));
    const description = sourceText(row, "Description");
    const serial = sourceText(row, "Serial No.");
    const custodianName = sourceText(row, "Custodian");
    const assigneeName = sourceText(row, "Assignee");
    const sourceDivision = normalizeDivision(sourceText(row, "Division"));
    const custodian = resolvePerson(custodianName, peopleByName);
    const assignee = resolvePerson(assigneeName, peopleByName);
    const division =
      custodian?.division_id || divisionsByCode.get(sourceDivision)?.id || null;
    const custodianIsValid = Boolean(
      custodian &&
      custodian.plantilla_status === "Regular" &&
      !["PSS", "PES"].includes(custodian.position)
    );
    const isSameAsCustodian = Boolean(
      assigneeName &&
      normalizeName(assigneeName) === normalizeName(custodianName)
    );
    const assigneeIsValid = Boolean(
      assignee &&
      assignee.position &&
      ["PSS", "PES"].includes(assignee.position) &&
      assignee.division_id === division
    );
    const warnings: string[] = [];

    if (!custodian) {
      unresolvedCustodians.add(custodianName);
      warnings.push("custodian not matched");
    }
    if (custodian && !custodianIsValid)
      warnings.push(
        `custodian ${custodian.plantilla_status} or position not eligible`
      );
    if (!divisionsByCode.has(sourceDivision) && !custodian) {
      unresolvedDivisions.add(sourceDivision);
      warnings.push("division not matched");
    }
    if (isSameAsCustodian) sameAsCustodianAssignees++;
    if (assigneeName && !isSameAsCustodian && !assignee) {
      unresolvedAssignees.add(assigneeName);
      warnings.push("assignee not matched");
    }
    if (assigneeName && !isSameAsCustodian && assignee && !assigneeIsValid)
      warnings.push(
        "assignee is not an eligible PSS/PES user in the same division"
      );
    const identityRow = {
      category,
      description,
      serial_number: serial,
      custodian: custodianName,
      assignee: assigneeName,
      division: sourceDivision,
    };
    const importKey = importIdentityKey(identityRow);
    const importOccurrence = identityOccurrences.get(importKey) || 0;
    identityOccurrences.set(importKey, importOccurrence + 1);

    rows.push({
      sourceRow,
      importKey,
      importOccurrence,
      category,
      description,
      serial_number: serial,
      custodian: custodianName,
      assignee: assigneeName,
      division: sourceDivision,
      division_id: division,
      assigned_to: custodianIsValid ? custodian!.id : null,
      assignee_id: assigneeIsValid && !isSameAsCustodian ? assignee!.id : null,
      status: "Active",
      condition_state: "Good",
      remarks: [importMarker(importKey, importOccurrence), ...warnings].join(
        " "
      ),
    });
  }

  const categories = [
    ...new Set(rows.map((row) => row.category).filter(Boolean)),
  ].sort();
  const validRows = rows.filter(
    (row) =>
      row.category && row.description && row.serial_number && row.division_id
  );
  const importableRows = validRows.filter(
    (row) =>
      !existingMarkers.has(importMarker(row.importKey, row.importOccurrence)) &&
      !existingSerials.has(normalizeName(row.serial_number))
  );
  return {
    rows,
    validRows,
    importableRows,
    invalidRows: rows.filter((row) => !validRows.includes(row)),
    categories,
    sameAsCustodianAssignees,
    duplicateSerialGroups: duplicateSerialGroups(rows),
    unresolvedCustodians: [...unresolvedCustodians].filter(Boolean),
    unresolvedAssignees: [...unresolvedAssignees].filter(Boolean),
    unresolvedDivisions: [...unresolvedDivisions].filter(Boolean),
  };
}

async function fetchAll(supabase: SupabaseClient) {
  const [
    { data: people, error: peopleError },
    { data: divisions, error: divisionError },
    { data: categories, error: categoryError },
    { data: existing, error: equipmentError },
  ] = await Promise.all([
    supabase
      .from("personnel")
      .select("id,full_name,division_id,position,plantilla_status"),
    supabase.from("divisions").select("id,code"),
    supabase.from("equipment_categories").select("id,name"),
    supabase.from("equipment").select("id,remarks,serial_number"),
  ]);
  const error = peopleError || divisionError || categoryError || equipmentError;
  if (error) throw new Error(`Could not read Supabase data: ${error.message}`);
  return {
    people: people as Person[],
    divisions: divisions as Division[],
    categories: categories as Array<{ id: string; name: string }>,
    existing: existing as ExistingEquipment[],
  };
}

async function run() {
  loadEnvConfig(process.cwd());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required."
    );
  const sourcePath = path.join(process.cwd(), "list.json");
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as unknown;
  if (!Array.isArray(source))
    throw new Error("list.json must contain an array of records.");

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const current = await fetchAll(supabase);
  const existingSerials = new Set(
    current.existing
      .map((row) => normalizeName(row.serial_number))
      .filter(Boolean)
  );
  const existingMarkers = new Set(
    current.existing.flatMap(
      (row) =>
        row.remarks?.match(
          /\[Import:list\.json(?::[a-f0-9]{12})(?: row \d+)?\]/g
        ) || []
    )
  );
  const plan = buildImportPlan(
    source,
    current.people,
    current.divisions,
    existingMarkers,
    existingSerials
  );
  const sourceSerialOverlaps = plan.rows.filter((row) =>
    existingSerials.has(normalizeName(row.serial_number))
  ).length;
  const summary = {
    sourceRows: plan.rows.length,
    categories: plan.categories.length,
    rowsReady: plan.importableRows.length,
    alreadyImported: plan.validRows.length - plan.importableRows.length,
    invalidRows: plan.invalidRows.length,
    sameAsCustodianAssignees: plan.sameAsCustodianAssignees,
    duplicateSerialGroups: plan.duplicateSerialGroups.length,
    duplicateSerialRows: plan.duplicateSerialGroups.reduce(
      (count, group) => count + group.length,
      0
    ),
    existingSerialOverlaps: sourceSerialOverlaps,
    unresolvedCustodians: plan.unresolvedCustodians,
    unresolvedAssignees: plan.unresolvedAssignees,
    unresolvedDivisions: plan.unresolvedDivisions,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (process.argv.includes("--dry-run")) return;
  if (
    plan.unresolvedDivisions.length &&
    !process.argv.includes("--skip-invalid")
  )
    throw new Error(
      `Cannot import rows with unresolved divisions: ${plan.unresolvedDivisions.join(", ")}. Re-run with --skip-invalid to import only validated rows.`
    );
  if (!plan.importableRows.length) {
    console.log("No new rows to import.");
    return;
  }

  const existingCategoryNames = new Set(
    current.categories.map((category) => category.name)
  );
  const newCategories = plan.categories.filter(
    (name) => !existingCategoryNames.has(name)
  );
  if (newCategories.length) {
    const { error } = await supabase.from("equipment_categories").upsert(
      newCategories.map((name) => ({ name, lifespan_years: 3 })),
      { onConflict: "name", ignoreDuplicates: true }
    );
    if (error) throw new Error(`Could not create categories: ${error.message}`);
  }
  const { data: categoryRows, error: categoryError } = await supabase
    .from("equipment_categories")
    .select("id,name")
    .in("name", plan.categories);
  if (categoryError)
    throw new Error(`Could not reload categories: ${categoryError.message}`);
  const categoryIds = new Map(
    (categoryRows || []).map((category) => [category.name, category.id])
  );
  const equipmentIds = plan.importableRows.map(() => crypto.randomUUID());
  const equipmentRows = plan.importableRows.map((row, index) => ({
    id: equipmentIds[index],
    category_id: categoryIds.get(row.category),
    model: row.description,
    brand: null,
    year_acquired: null,
    serial_number: row.serial_number,
    procurement_method: null,
    division_id: row.division_id,
    assigned_to: row.assigned_to,
    assignee_id: row.assignee_id,
    status: row.status,
    condition_state: row.condition_state,
    remarks: row.remarks,
  }));
  if (equipmentRows.some((row) => !row.category_id || !row.division_id))
    throw new Error("Import plan contains an unresolved category or division.");
  const { error: equipmentError } = await supabase
    .from("equipment")
    .insert(equipmentRows);
  if (equipmentError)
    throw new Error(`Could not import equipment: ${equipmentError.message}`);

  const historyRows = equipmentRows.flatMap((row) =>
    row.assigned_to
      ? [
          {
            equipment_id: row.id,
            personnel_id: row.assigned_to,
            assignment_type: "Custodian",
            note: "Imported from list.json",
          },
        ]
      : []
  );
  if (historyRows.length) {
    const { error: historyError } = await supabase
      .from("assignment_history")
      .insert(historyRows);
    if (historyError) {
      await supabase.from("equipment").delete().in("id", equipmentIds);
      throw new Error(
        `Assignment history failed; imported equipment was rolled back: ${historyError.message}`
      );
    }
  }

  const { data: verified, error: verifyError } = await supabase
    .from("equipment")
    .select("id")
    .in("id", equipmentIds);
  if (verifyError || verified?.length !== equipmentIds.length)
    throw new Error(
      `Import verification failed: expected ${equipmentIds.length}, found ${verified?.length || 0}.`
    );
  console.log(
    `Imported ${equipmentIds.length} equipment records and ${newCategories.length} new categories.`
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
