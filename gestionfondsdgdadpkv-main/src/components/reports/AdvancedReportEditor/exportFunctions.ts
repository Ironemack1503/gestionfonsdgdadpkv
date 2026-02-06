/**
 * Export Functions for Advanced Report Editor
 * Generates PDF, Excel and Word exports with DGDA formatting
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { writeAoAToFile } from '@/lib/safeXlsx';
import dgdaLogo from '@/assets/dgda-logo-new.jpg';
import { ReportTemplate, TableColumn, WatermarkConfig } from './types';
import { formatMontant } from '@/lib/utils';

// Convert hex to RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
};

// Format value based on column type
const formatValue = (value: unknown, type: string): string => {
  if (value === null || value === undefined || value === '') return '';
  
  switch (type) {
    case 'currency':
      return formatMontant(Number(value), { showCurrency: false });
    case 'date':
      if (typeof value === 'string' && value) {
        return new Date(value).toLocaleDateString('fr-FR');
      }
      return String(value);
    case 'number':
      return Number(value).toLocaleString('fr-FR');
    default:
      return String(value);
  }
};

// Calculate totals
const calculateTotals = (data: Record<string, unknown>[], columns: TableColumn[]): Record<string, number> => {
  const result: Record<string, number> = {};
  columns.forEach(col => {
    if (col.type === 'currency' || col.type === 'number') {
      result[col.key] = data.reduce((sum, row) => {
        const value = row[col.key];
        return sum + (typeof value === 'number' ? value : Number(value) || 0);
      }, 0);
    }
  });
  return result;
};

// Export to PDF
export async function exportTemplateToPDF(
  template: ReportTemplate,
  data: Record<string, unknown>[],
  title: string,
  subtitle?: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: template.orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.width;
  const margins = { left: 15, right: 15 };

  // Load and add logo
  if (template.header.showLogo) {
    const img = new Image();
    img.src = dgdaLogo;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    try {
      const logoX = template.header.logoPosition === 'left' 
        ? margins.left 
        : template.header.logoPosition === 'right' 
          ? pageWidth - margins.right - 25 
          : (pageWidth - 25) / 2;
      doc.addImage(img, 'JPEG', logoX, 8, 25, 25);
    } catch (e) {
      console.warn('Could not load logo');
    }
  }

  // Header text
  let headerY = 12;
  doc.setFontSize(10);
  doc.setFont('times', 'italic');
  doc.text(template.header.line1, pageWidth / 2, headerY, { align: 'center' });
  
  headerY += 5;
  doc.setFont('times', 'bold');
  doc.text(template.header.line2, pageWidth / 2, headerY, { align: 'center' });
  
  headerY += 5;
  doc.text(template.header.line3, pageWidth / 2, headerY, { align: 'center' });
  
  headerY += 5;
  doc.setFont('times', 'bolditalic');
  doc.text(template.header.line4, pageWidth / 2, headerY, { align: 'center' });

  // Reference number
  if (template.header.referenceNumber) {
    headerY += 8;
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.text(`${template.header.referenceNumber}/2024`, margins.left, headerY);
  }

  // Separator line
  headerY += 5;
  const accentRgb = hexToRgb(template.styles.accentColor);
  doc.setDrawColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.setLineWidth(0.8);
  doc.line(margins.left, headerY, pageWidth - margins.right, headerY);

  // Title
  headerY += 10;
  doc.setFontSize(template.styles.titleSize);
  doc.setFont('times', 'bold');
  doc.text(title.toUpperCase(), pageWidth / 2, headerY, { align: 'center' });

  // Underline title
  const titleWidth = doc.getTextWidth(title.toUpperCase());
  doc.setLineWidth(0.5);
  doc.line((pageWidth - titleWidth) / 2, headerY + 1, (pageWidth + titleWidth) / 2, headerY + 1);

  // Subtitle
  if (subtitle) {
    headerY += 8;
    doc.setFontSize(10);
    doc.setFont('times', 'italic');
    doc.text(subtitle, pageWidth / 2, headerY, { align: 'center' });
  }

  // Prepare table data
  const headers = template.columns.map(col => col.header);
  const totals = calculateTotals(data, template.columns);
  
  const tableData = data.map(row => 
    template.columns.map(col => formatValue(row[col.key], col.type))
  );

  // Add totals row
  if (template.showTotals) {
    tableData.push(
      template.columns.map((col, idx) => {
        if (idx === 0) return 'TOTAL';
        if (col.type === 'currency' || col.type === 'number') {
          return formatValue(totals[col.key], col.type);
        }
        return '';
      })
    );
  }

  // Generate table
  const borderRgb = hexToRgb(template.styles.borderColor);
  const altRowRgb = hexToRgb(template.styles.alternateRowColor);

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: headerY + 8,
    styles: {
      fontSize: template.styles.bodySize,
      font: 'times',
      cellPadding: 2,
      lineColor: borderRgb,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: altRowRgb,
    },
    columnStyles: template.columns.reduce((acc, col, index) => {
      acc[index] = { 
        halign: col.align || (col.type === 'currency' || col.type === 'number' ? 'right' : 'left'),
      };
      return acc;
    }, {} as Record<number, { halign: 'left' | 'center' | 'right' }>),
    margin: { left: margins.left, right: margins.right, bottom: 35 },
  });

  // Add watermark
  const watermarkConfig = template.watermarkConfig;
  if (watermarkConfig?.enabled || template.watermark) {
    const pageCount = doc.getNumberOfPages();
    const wmText = watermarkConfig?.text || template.watermark || 'ORIGINAL';
    const wmOpacity = watermarkConfig?.opacity || 15;
    const wmFontSize = watermarkConfig?.fontSize || 60;
    const wmRotation = watermarkConfig?.rotation || 45;
    const wmColor = watermarkConfig?.color || '#cccccc';
    const wmPosition = watermarkConfig?.position || 'diagonal';
    
    // Convert hex color to RGB
    const wmRgb = hexToRgb(wmColor);
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();
      
      // Apply opacity by adjusting color intensity
      const opacityFactor = wmOpacity / 100;
      const adjustedR = Math.round(255 - (255 - wmRgb[0]) * opacityFactor);
      const adjustedG = Math.round(255 - (255 - wmRgb[1]) * opacityFactor);
      const adjustedB = Math.round(255 - (255 - wmRgb[2]) * opacityFactor);
      
      doc.setTextColor(adjustedR, adjustedG, adjustedB);
      doc.setFontSize(wmFontSize);
      doc.setFont('times', 'bold');
      
      const centerX = pageWidth / 2;
      const centerY = doc.internal.pageSize.height / 2;
      
      if (wmPosition === 'tiled') {
        // Tiled watermark
        const spacing = wmFontSize * 3;
        for (let y = spacing; y < doc.internal.pageSize.height; y += spacing) {
          for (let x = spacing; x < pageWidth; x += spacing * 2) {
            doc.text(wmText, x, y, { align: 'center', angle: wmRotation });
          }
        }
      } else if (wmPosition === 'center') {
        // Center without rotation
        doc.text(wmText, centerX, centerY, { align: 'center' });
      } else {
        // Diagonal (default)
        doc.text(wmText, centerX, centerY, { align: 'center', angle: wmRotation });
      }
      
      doc.restoreGraphicsState();
    }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.height;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 30;
    
    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margins.left, footerY - 2, pageWidth - margins.right, footerY - 2);
    
    // Footer text
    doc.setFontSize(7);
    doc.setFont('times', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(template.footer.slogan, pageWidth / 2, footerY + 2, { align: 'center' });
    
    doc.setFont('times', 'normal');
    doc.text(template.footer.address, pageWidth / 2, footerY + 7, { align: 'center' });
    doc.text(template.footer.contact, pageWidth / 2, footerY + 12, { align: 'center' });
    doc.setFontSize(6);
    doc.text(template.footer.email, pageWidth / 2, footerY + 17, { align: 'center' });
    
    // Page number
    if (template.footer.showPageNumbers) {
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, footerY + 24, { align: 'center' });
    }
  }

  // Save
  const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Export to Excel
export function exportTemplateToExcel(
  template: ReportTemplate,
  data: Record<string, unknown>[],
  title: string,
  subtitle?: string
): void {
  const wsData: (string | number)[][] = [];
  
  // Header lines
  wsData.push([template.header.line1]);
  wsData.push([template.header.line2]);
  wsData.push([template.header.line3]);
  wsData.push([template.header.line4]);
  if (template.header.referenceNumber) {
    wsData.push([`${template.header.referenceNumber}/2024`]);
  }
  wsData.push([]);
  wsData.push([title.toUpperCase()]);
  if (subtitle) wsData.push([subtitle]);
  wsData.push([`Généré le ${new Date().toLocaleDateString('fr-FR')}`]);
  wsData.push([]);
  
  // Headers
  wsData.push(template.columns.map(col => col.header));
  
  // Data rows
  const totals = calculateTotals(data, template.columns);
  data.forEach(row => {
    wsData.push(template.columns.map(col => {
      const value = row[col.key];
      if (col.type === 'currency' || col.type === 'number') {
        return Number(value) || 0;
      }
      return formatValue(value, col.type);
    }));
  });
  
  // Totals
  if (template.showTotals) {
    wsData.push(template.columns.map((col, idx) => {
      if (idx === 0) return 'TOTAL';
      if (col.type === 'currency' || col.type === 'number') {
        return totals[col.key] || 0;
      }
      return '';
    }));
  }
  
  // Footer
  wsData.push([]);
  wsData.push(['───────────────────────────────────────────────────────────────────────────────']);
  wsData.push([template.footer.slogan]);
  wsData.push([template.footer.address]);
  wsData.push([template.footer.contact]);
  wsData.push([template.footer.email]);
  
  // Sanitize and write Excel file via safe wrapper
  const colWidths = template.columns.map(col => ({ wch: col.width || 15 }));
  const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
  writeAoAToFile(wsData, filename, 'Rapport', colWidths);
}

// Export to Word
export function exportTemplateToWord(
  template: ReportTemplate,
  data: Record<string, unknown>[],
  title: string,
  subtitle?: string
): void {
  const isLandscape = template.orientation === 'landscape';
  const totals = calculateTotals(data, template.columns);
  
  // Generate table rows
  let tableRows = data.map((row, idx) => `
    <tr style="background-color: ${idx % 2 === 1 ? template.styles.alternateRowColor : '#ffffff'};">
      ${template.columns.map(col => `
        <td style="border: 1px solid ${template.styles.borderColor}; padding: 4px 8px; text-align: ${col.align || (col.type === 'currency' || col.type === 'number' ? 'right' : 'left')};">
          ${formatValue(row[col.key], col.type)}
        </td>
      `).join('')}
    </tr>
  `).join('');
  
  // Add totals row
  if (template.showTotals) {
    tableRows += `
      <tr style="background-color: #e5e7eb; font-weight: bold;">
        ${template.columns.map((col, idx) => `
          <td style="border: 1px solid ${template.styles.borderColor}; padding: 4px 8px; text-align: ${col.align || (col.type === 'currency' || col.type === 'number' ? 'right' : 'left')};">
            ${idx === 0 ? 'TOTAL' : (col.type === 'currency' || col.type === 'number') ? formatValue(totals[col.key], col.type) : ''}
          </td>
        `).join('')}
      </tr>
    `;
  }

  const htmlDocument = `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page { size: ${isLandscape ? '297mm 210mm' : '210mm 297mm'}; margin: 20mm 15mm 25mm 15mm; }
        body { font-family: '${template.styles.bodyFont}', Times, serif; font-size: ${template.styles.bodySize}pt; }
        .header { text-align: center; border-bottom: 2px solid ${template.styles.accentColor}; padding-bottom: 15px; margin-bottom: 20px; }
        .header-line { margin: 3px 0; }
        .title { font-family: '${template.styles.titleFont}', Times, serif; font-size: ${template.styles.titleSize}pt; font-weight: bold; text-align: center; margin: 25px 0 15px 0; text-transform: uppercase; text-decoration: underline; }
        .subtitle { font-size: 11pt; text-align: center; margin-bottom: 15px; font-style: italic; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background-color: #ffffff; color: #000000; font-weight: bold; padding: 6px 8px; border: 1px solid ${template.styles.borderColor}; text-align: center; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #d1d5db; text-align: center; font-size: 9pt; color: #666666; }
        .footer-line { margin: 3px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-line" style="font-style: italic;">${template.header.line1}</div>
        <div class="header-line" style="font-weight: bold;">${template.header.line2}</div>
        <div class="header-line" style="font-weight: bold;">${template.header.line3}</div>
        <div class="header-line" style="font-weight: bold; font-style: italic;">${template.header.line4}</div>
        ${template.header.referenceNumber ? `<div style="font-size: 9pt; margin-top: 8px;">${template.header.referenceNumber}/2024</div>` : ''}
      </div>
      
      <div class="title">${title}</div>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
      <div style="font-size: 9pt; color: #666666; margin-bottom: 15px;">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
      
      <table>
        <thead>
          <tr>
            ${template.columns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="footer">
        <div class="footer-line" style="font-style: italic;">${template.footer.slogan}</div>
        <div class="footer-line">${template.footer.address}</div>
        <div class="footer-line">${template.footer.contact}</div>
        <div class="footer-line" style="font-size: 8pt;">${template.footer.email}</div>
      </div>
    </body>
    </html>
  `;

  // Download as .doc
  const blob = new Blob(['\ufeff' + htmlDocument], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
