/**
 * Word Document Export Utility
 * Generates Word documents (.docx) for reports using HTML-to-Word conversion
 */

import { PDFExportSettings, defaultPDFSettings } from './exportUtils';
import { formatMontant } from './utils';

export interface WordExportOptions {
  title: string;
  filename: string;
  content: string; // HTML content
  settings?: Partial<PDFExportSettings>;
  headerLines?: string[];
  footerLines?: string[];
}

const DEFAULT_HEADER_LINES = [
  'République Démocratique du Congo',
  'Ministère des Finances',
  'Direction Générale des Douanes et Accises',
  'Direction Provinciale de Kinshasa-Ville',
];

const DEFAULT_FOOTER_LINES = [
  "Tous mobilisés pour une douane d'action et d'excellence !",
  'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
  'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
  'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
];

/**
 * Generate a Word document from HTML content
 */
export function exportToWord({
  title,
  filename,
  content,
  settings,
  headerLines = DEFAULT_HEADER_LINES,
  footerLines = DEFAULT_FOOTER_LINES,
}: WordExportOptions): void {
  const orientation = settings?.orientation || 'portrait';
  const isLandscape = orientation === 'landscape';
  
  // Build the complete HTML document with Word-compatible styles
  const htmlDocument = `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: ${isLandscape ? '297mm 210mm' : '210mm 297mm'};
          margin: 20mm 15mm 25mm 15mm;
          mso-header-margin: 10mm;
          mso-footer-margin: 10mm;
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000000;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 15px;
        }
        
        .header-line {
          margin: 3px 0;
        }
        
        .header-line-1 {
          font-size: 12pt;
          font-style: italic;
        }
        
        .header-line-2 {
          font-size: 11pt;
          font-weight: bold;
        }
        
        .header-line-3 {
          font-size: 11pt;
          font-weight: bold;
        }
        
        .header-line-4 {
          font-size: 12pt;
          font-weight: bold;
          font-style: italic;
        }
        
        .title {
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          margin: 25px 0 15px 0;
          text-transform: uppercase;
        }
        
        .subtitle {
          font-size: 11pt;
          text-align: center;
          margin-bottom: 15px;
          font-style: italic;
        }
        
        .date-line {
          font-size: 10pt;
          color: #666666;
          margin-bottom: 15px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 10pt;
        }
        
        th {
          background-color: #3b82f6;
          color: #ffffff;
          font-weight: bold;
          padding: 8px 10px;
          border: 1px solid #1e40af;
          text-align: left;
        }
        
        td {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
        }
        
        tr:nth-child(even) {
          background-color: #f5f7fa;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .font-bold {
          font-weight: bold;
        }
        
        .total-row {
          background-color: #e5e7eb !important;
          font-weight: bold;
        }
        
        .amount-positive {
          color: #16a34a;
        }
        
        .amount-negative {
          color: #dc2626;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #d1d5db;
          text-align: center;
          font-size: 9pt;
          color: #666666;
        }
        
        .footer-line {
          margin: 3px 0;
        }
        
        .footer-line-1 {
          font-style: italic;
        }
        
        .signature-area {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        
        .signature-block {
          width: 45%;
          text-align: center;
        }
        
        .signature-title {
          font-size: 10pt;
          margin-bottom: 40px;
        }
        
        .signature-name {
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .montant-lettres {
          font-style: italic;
          margin: 15px 0;
          padding: 10px;
          background-color: #f9fafb;
          border-left: 3px solid #3b82f6;
        }

        .summary-card {
          display: inline-block;
          padding: 10px 20px;
          margin: 5px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .summary-label {
          font-size: 10pt;
          color: #666666;
        }

        .summary-value {
          font-size: 14pt;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        ${headerLines.map((line, i) => `<div class="header-line header-line-${i + 1}">${line}</div>`).join('')}
      </div>
      
      <!-- Title -->
      <div class="title">${title}</div>
      
      <!-- Date -->
      <div class="date-line">
        Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
      </div>
      
      <!-- Main Content -->
      ${content}
      
      <!-- Footer -->
      <div class="footer">
        ${footerLines.map((line, i) => `<div class="footer-line footer-line-${i + 1}">${line}</div>`).join('')}
      </div>
    </body>
    </html>
  `;

  // Convert to Blob and download
  const blob = new Blob(['\ufeff' + htmlDocument], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate table HTML from data
 */
export function generateTableHTML<T extends Record<string, any>>(
  columns: { header: string; key: string; type?: 'text' | 'currency' | 'date' | 'number'; align?: 'left' | 'center' | 'right' }[],
  data: T[],
  options?: {
    showTotals?: boolean;
    totalsLabel?: string;
    totalsColumns?: string[];
  }
): string {
  const formatValue = (value: any, type?: string): string => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return formatMontant(Number(value), { showCurrency: true });
      case 'date':
        return new Date(value).toLocaleDateString('fr-FR');
      case 'number':
        return Number(value).toLocaleString('fr-FR');
      default:
        return String(value);
    }
  };

  const getAlignment = (align?: string, type?: string): string => {
    if (align) return `text-${align}`;
    if (type === 'currency' || type === 'number') return 'text-right';
    return '';
  };

  let html = '<table>';
  
  // Header
  html += '<thead><tr>';
  columns.forEach(col => {
    html += `<th class="${getAlignment(col.align, col.type)}">${col.header}</th>`;
  });
  html += '</tr></thead>';
  
  // Body
  html += '<tbody>';
  data.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      const value = row[col.key];
      const formatted = formatValue(value, col.type);
      const isPositive = col.type === 'currency' && Number(value) > 0;
      const isNegative = col.type === 'currency' && Number(value) < 0;
      html += `<td class="${getAlignment(col.align, col.type)} ${isPositive ? 'amount-positive' : ''} ${isNegative ? 'amount-negative' : ''}">${formatted}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';

  // Totals row
  if (options?.showTotals && options.totalsColumns) {
    html += '<tfoot><tr class="total-row">';
    columns.forEach((col, index) => {
      if (index === 0) {
        html += `<td class="font-bold">${options.totalsLabel || 'TOTAL'}</td>`;
      } else if (options.totalsColumns?.includes(col.key)) {
        const total = data.reduce((acc, row) => acc + (Number(row[col.key]) || 0), 0);
        html += `<td class="${getAlignment(col.align, col.type)} font-bold">${formatValue(total, col.type)}</td>`;
      } else {
        html += '<td></td>';
      }
    });
    html += '</tr></tfoot>';
  }

  html += '</table>';
  return html;
}

/**
 * Generate summary cards HTML
 */
export function generateSummaryHTML(items: { label: string; value: string | number; type?: 'success' | 'danger' | 'info' }[]): string {
  return `
    <div style="text-align: center; margin: 20px 0;">
      ${items.map(item => {
        const color = item.type === 'success' ? '#16a34a' : item.type === 'danger' ? '#dc2626' : '#3b82f6';
        return `
          <div class="summary-card" style="border-left: 4px solid ${color};">
            <div class="summary-label">${item.label}</div>
            <div class="summary-value" style="color: ${color};">${typeof item.value === 'number' ? formatMontant(item.value, { showCurrency: true }) : item.value}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
