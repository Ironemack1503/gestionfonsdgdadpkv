import ExcelJS from 'exceljs';
import fs from 'fs';

async function run() {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Test');
  ws.columns = [{ header: 'A', key: 'a', width: 20 }, { header: 'B', key: 'b', width: 15 }];
  ws.addRow(['Header1', 'Header2']);
  ws.addRow(['Row1', 123]);
  const filename = 'test_export_js.xlsx';
  await workbook.xlsx.writeFile(filename);
  if (fs.existsSync(filename)) {
    console.log('✅ test_export_js.xlsx created');
  } else {
    console.error('❌ failed to create test_export_js.xlsx');
    process.exitCode = 1;
  }
}

run().catch(err => { console.error('Error:', err); process.exitCode = 1; });
