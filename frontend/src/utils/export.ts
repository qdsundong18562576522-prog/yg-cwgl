import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportExcel({
  columns,
  data,
  title,
  filename,
}: {
  columns: { header: string; key: string; width?: number }[];
  data: any[];
  title: string;
  filename: string;
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title);

  // Title row
  sheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 36;

  // Header row
  const headerRow = sheet.addRow(columns.map(c => c.header));
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fg: { argb: 'FF1677FF' } } as any;
  headerRow.alignment = { horizontal: 'center' };
  headerRow.height = 28;

  // Data rows
  data.forEach(item => {
    const row = sheet.addRow(columns.map(c => item[c.key] ?? '-'));
    row.alignment = { horizontal: 'center' };
  });

  // Column widths
  columns.forEach((col, i) => {
    sheet.getColumn(i + 1).width = col.width || 16;
  });

  // Borders for all cells
  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  sheet.eachRow(row => {
    row.eachCell(cell => { cell.border = borderStyle; });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}.xlsx`);
}
