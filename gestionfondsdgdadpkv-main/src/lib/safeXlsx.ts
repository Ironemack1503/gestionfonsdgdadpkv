import * as ExcelJS from 'exceljs';

export function sanitizeCell(v: any): string | number | boolean | Date | null {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (v instanceof Date) return v;
  // Fallback to string to avoid prototype pollution via objects
  return String(v);
}

export async function writeAoAToFile(wsData: unknown[][], filename: string, sheetName: string = 'Données', colWidths?: { wch: number }[]) {
  const safe = wsData.map(row => row.map(cell => sanitizeCell(cell)));
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(sheetName);

  // Set column widths if provided
  if (colWidths && colWidths.length > 0) {
    ws.columns = colWidths.map(c => ({ header: '', key: '', width: c.wch }));
  }

  // Append rows
  safe.forEach(row => ws.addRow(row as (string|number|boolean|Date|null)[]));

  // Write file
  await workbook.xlsx.writeFile(filename);
}
