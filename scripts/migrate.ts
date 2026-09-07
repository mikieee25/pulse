import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import crypto from 'crypto';

const uuid = () => crypto.randomUUID();

function escapeSql(str: string | null | undefined): string {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function parseMarkdownTable(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const rows = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('|') && !line.includes(':---')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length > 4 && parts[1] !== 'Department / Division') {
        const division = parts[1];
        const nameRaw = parts[2].replace(/\*\*/g, '');
        const originalName = parts[3];
        const position = parts[4];
        
        // Extract initials from parentheses e.g. "P. T. Aquino (PTA)"
        const match = originalName.match(/\((.*?)\)/);
        const initials = match ? match[1] : '';
        
        rows.push({
          division,
          fullName: nameRaw,
          initials,
          position
        });
      }
    }
  }
  return rows;
}

async function run() {
  console.log('Starting Migration Script...');
  const datasetRows = parseMarkdownTable(path.join(__dirname, '../dataset.md'));
  
  const workbook = xlsx.readFile(path.join(__dirname, '../01 EUMB ICT List.xlsx'));
  
  // Parse Data sheet for Plantilla Status
  const dataSheet = workbook.Sheets['Data'];
  const excelDataRows = xlsx.utils.sheet_to_json(dataSheet) as any[];
  
  // Extract unique divisions
  const divisionsMap = new Map<string, { id: string, code: string, fullName: string }>();
  for (const r of datasetRows) {
    if (!divisionsMap.has(r.division)) {
      // Create code, e.g. Office of the Director -> OD, Nuclear Energy Division (NED) -> NED
      let code = '';
      const match = r.division.match(/\((.*?)\)/);
      if (match) {
        code = match[1];
      } else {
        code = r.division.split(' ').map(w => w[0]).join('').toUpperCase();
      }
      divisionsMap.set(r.division, { id: uuid(), code, fullName: r.division });
    }
  }

  // Build Personnel map
  const personnelList = [];
  const personnelByNameMap = new Map<string, any>();
  
  let unmatchedInExcelCount = 0;
  
  for (const row of datasetRows) {
    // Find Plantilla status in Excel
    const excelMatch = excelDataRows.find(e => 
      (e['Full Name'] && e['Full Name'].includes(row.fullName)) || 
      (e['Initials'] && e['Initials'] === row.initials)
    );
    
    let plantillaStatus = 'Regular';
    if (excelMatch && excelMatch['Plantilla']) {
      plantillaStatus = excelMatch['Plantilla'];
    } else {
      unmatchedInExcelCount++;
    }
    
    const p = {
      id: uuid(),
      fullName: row.fullName,
      initials: row.initials,
      divisionId: divisionsMap.get(row.division)!.id,
      position: row.position,
      plantillaStatus
    };
    personnelList.push(p);
    personnelByNameMap.set(p.fullName, p);
    personnelByNameMap.set(p.initials, p); // fallback
  }

  console.log(`Parsed ${divisionsMap.size} Divisions and ${personnelList.length} Personnel (${unmatchedInExcelCount} couldn't match plantilla from Excel).`);

  // Parse Equipment
  const equipmentCategories = [
    { name: 'Laptop', sheet: 'Laptop', hasLifespan: true },
    { name: 'Tablet', sheet: 'Tablet', hasLifespan: true },
    { name: 'Drone', sheet: 'Drone', hasLifespan: false },
    { name: 'Camera', sheet: 'Camera', hasLifespan: false },
    { name: 'Printer', sheet: 'Printer', hasLifespan: false }
  ];
  
  // Category mapping: we know the seed IDs from our init SQL, but let's just generate them
  // or use sub-selects in the sql
  
  const equipmentList: any[] = [];
  let unmatchedCustodians = [];
  let blankRows = [];
  
  for (const cat of equipmentCategories) {
    const sheet = workbook.Sheets[cat.sheet];
    if (!sheet) continue;
    
    const rows = xlsx.utils.sheet_to_json(sheet) as any[];
    for (const r of rows) {
      let actualCat = cat.name;
      
      // Desktop edge case in Laptop sheet
      if (cat.name === 'Laptop' && r['Model'] && typeof r['Model'] === 'string' && r['Model'].toLowerCase().includes('desktop')) {
        actualCat = 'Desktop';
      }
      
      const model = r['Model'] ? String(r['Model']) : '';
      const brand = r['Brand'] ? String(r['Brand']) : '';
      const yearAcquired = r['Year Acquired'] ? parseInt(r['Year Acquired']) : null;
      const serial = r['Serial Number'] ? String(r['Serial Number']) : '';
      const procurement = r['Method of Procurement'] ? String(r['Method of Procurement']) : '';
      const remarks = r['Remarks'] ? String(r['Remarks']) : '';
      const custodianName = r['Current Custodian'] ? String(r['Current Custodian']).trim() : '';
      const divRaw = r['Division'];
      
      let divId = null;
      if (divRaw) {
        // try to match division
        const matchDiv = Array.from(divisionsMap.values()).find(d => d.code === divRaw || d.fullName.includes(divRaw));
        if (matchDiv) divId = matchDiv.id;
      }
      if (!divId && custodianName) {
         // fallback to person's division
         const matchP = personnelList.find(p => p.fullName.includes(custodianName) || custodianName.includes(p.fullName));
         if (matchP) divId = matchP.divisionId;
      }
      
      // If we still can't find division, just use OD as a fallback for the script so it doesn't fail foreign keys
      if (!divId) {
        divId = Array.from(divisionsMap.values())[0].id; 
      }
      
      let assignedTo = null;
      if (custodianName && cat.name !== 'Printer') {
        // Manual overrides for known name mismatches
        let searchName = custodianName;
        const overrides: Record<string, string> = {
          'Marienelle S. Santos': 'MSM',
          'Von Jari Anievas': 'VJAA', // From dataset.md: Von Jari A. Anievas (VJAA)
          'Hannah Isabel L. Cumpas': 'HILC',
          'Mary Ann Fernando': 'MAMF', // From dataset.md: Mary Ann M. Fernando (MAMF)
        };
        if (overrides[custodianName]) {
          searchName = overrides[custodianName];
        }

        const matchP = personnelList.find(p => 
          p.fullName.includes(searchName) || 
          searchName.includes(p.fullName) || 
          searchName === p.initials ||
          p.initials === searchName
        );
        
        if (matchP) {
          assignedTo = matchP.id;
        } else {
          // Unmatched (e.g. "Eleanor R. Hainto", "Ewan Mary Rose Galagala", "Jayvie A. Gaya" which user marked "idk")
          unmatchedCustodians.push(custodianName);
        }
      }
      
      let status = 'Active';
      let finalRemarks = remarks;
      
      if (!model && !brand && !yearAcquired) {
         finalRemarks = (finalRemarks ? finalRemarks + ' | ' : '') + '[Migration] Needs data entry';
         blankRows.push(r);
      }
      
      equipmentList.push({
        id: uuid(),
        categoryName: actualCat,
        model, brand, yearAcquired, serial, procurement,
        divisionId: divId,
        assignedTo,
        status,
        remarks: finalRemarks
      });
    }
  }
  
  console.log(`Parsed ${equipmentList.length} Equipment items.`);
  console.log(`Unmatched custodians: ${new Set(unmatchedCustodians).size}`);
  console.log(`Blank rows flagged: ${blankRows.length}`);
  
  // Generate SQL Seed file
  let sql = `-- Seed file generated by migrate.ts\n\n`;
  
  // Divisions
  for (const d of divisionsMap.values()) {
    sql += `INSERT INTO divisions (id, code, full_name) VALUES ('${d.id}', ${escapeSql(d.code)}, ${escapeSql(d.fullName)});\n`;
  }
  
  // Personnel
  for (const p of personnelList) {
    sql += `INSERT INTO personnel (id, full_name, initials, division_id, position, plantilla_status) VALUES ('${p.id}', ${escapeSql(p.fullName)}, ${escapeSql(p.initials)}, '${p.divisionId}', ${escapeSql(p.position)}, '${p.plantillaStatus}');\n`;
  }
  
  // Equipment
  for (const e of equipmentList) {
     sql += `INSERT INTO equipment (id, category_id, model, brand, year_acquired, serial_number, procurement_method, division_id, assigned_to, status, remarks) 
     VALUES ('${e.id}', (SELECT id FROM equipment_categories WHERE name = '${e.categoryName}'), ${escapeSql(e.model)}, ${escapeSql(e.brand)}, ${e.yearAcquired || 'NULL'}, ${escapeSql(e.serial)}, ${escapeSql(e.procurement)}, '${e.divisionId}', ${e.assignedTo ? `'${e.assignedTo}'` : 'NULL'}, '${e.status}', ${escapeSql(e.remarks)});\n`;
  }
  
  // Output report
  fs.writeFileSync(path.join(__dirname, '../supabase/seed.sql'), sql);
  console.log('Seed SQL written to supabase/seed.sql');
  
  // Create report.txt
  let report = `Migration Report\n================\n\n`;
  report += `Unmatched Custodians:\n` + Array.from(new Set(unmatchedCustodians)).map(c => `- ${c}`).join('\n') + `\n\n`;
  fs.writeFileSync(path.join(__dirname, '../migration-report.txt'), report);
  console.log('Report written to migration-report.txt');
}

run().catch(console.error);
