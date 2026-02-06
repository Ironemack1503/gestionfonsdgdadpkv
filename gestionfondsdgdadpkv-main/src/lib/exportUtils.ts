import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { writeAoAToFile } from "@/lib/safeXlsx";
import dgdaLogo from "@/assets/dgda-logo-new.jpg";
import { formatMontant } from "@/lib/utils";

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  type?: 'text' | 'currency' | 'number' | 'date';
}

export interface PDFExportSettings {
  useDefaultLogo: boolean;
  customLogoUrl?: string;
  showLogo: boolean;
  headerColor: string;
  headerTextColor: string;
  alternateRowColor: string;
  borderColor: string;
  orientation: 'portrait' | 'landscape';
  fontSize: number;
  margins: 'normal' | 'narrow' | 'wide';
  showWatermark: boolean;
  showFooter: boolean;
  showGenerationDate: boolean;
  // Custom header settings
  customHeaderLine1: string;
  customHeaderLine2: string;
  customHeaderLine3: string;
  customHeaderLine4: string;
  useCustomHeader: boolean;
  // Custom footer settings
  customFooterLine1: string;
  customFooterLine2: string;
  customFooterLine3: string;
  customFooterLine4: string;
  useCustomFooter: boolean;
  // Table positioning
  tablePosition?: 'gauche' | 'centre' | 'droite';
  contentAlignment?: 'gauche' | 'centre' | 'droite';
  tableSpacing?: number;
}

export const defaultPDFSettings: PDFExportSettings = {
  useDefaultLogo: true,
  showLogo: true,
  headerColor: '#3b82f6',
  headerTextColor: '#ffffff',
  alternateRowColor: '#f5f7fa',
  borderColor: '#e5e7eb',
  orientation: 'portrait',
  fontSize: 9,
  margins: 'normal',
  showWatermark: true,
  showFooter: true,
  showGenerationDate: true,
  // Default header
  customHeaderLine1: 'République Démocratique du Congo',
  customHeaderLine2: 'Ministère des Finances',
  customHeaderLine3: 'Direction Générale des Douanes et Accises',
  customHeaderLine4: 'Direction Provinciale de Kinshasa-Ville',
  useCustomHeader: false,
  // Default footer
  customFooterLine1: "Tous mobilisés pour une douane d'action et d'excellence !",
  customFooterLine2: 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
  customFooterLine3: 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
  customFooterLine4: 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
  useCustomFooter: false,
  // Table positioning
  tablePosition: 'gauche',
  contentAlignment: 'gauche',
  tableSpacing: 10,
};

export interface ExportOptions {
  title: string;
  filename: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  subtitle?: string;
  pdfSettings?: PDFExportSettings;
  headerLines?: string[];
  footerLines?: string[];
}

// Format currency for display - uses centralized formatMontant
const formatCurrency = (amount: number): string => {
  return formatMontant(amount, { showCurrency: true });
};

// Format number for display with French locale (space as thousand separator)
const formatNumber = (value: number): string => {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// Format date for display
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

// Get cell value with formatting based on column type
const getCellValue = (item: Record<string, any>, key: string, columnType?: 'text' | 'currency' | 'number' | 'date'): string => {
  const value = item[key];
  if (value === null || value === undefined) return '';
  
  // Use explicit column type if provided
  if (columnType) {
    switch (columnType) {
      case 'currency':
        return formatCurrency(Number(value));
      case 'number':
        return formatNumber(Number(value));
      case 'date':
        return formatDate(String(value));
      default:
        return String(value);
    }
  }
  
  // Fallback: Auto-detect based on key name
  if (key === 'date' || key === 'created_at') {
    return formatDate(value);
  }
  
  if (key === 'montant' || key === 'montant_prevu' || key === 'solde_initial' || 
      key === 'total_recettes' || key === 'total_depenses' || key === 'solde_final' ||
      key === 'totalRecettes' || key === 'totalDepenses' || key === 'solde' ||
      key === 'recettes' || key === 'depenses') {
    return formatCurrency(Number(value));
  }
  
  return String(value);
};

// Get raw numeric value for Excel (preserves number type for proper formatting)
const getRawCellValue = (item: Record<string, any>, key: string, columnType?: 'text' | 'currency' | 'number' | 'date'): string | number => {
  const value = item[key];
  if (value === null || value === undefined) return '';
  
  // For currency and number types, return raw number for Excel
  if (columnType === 'currency' || columnType === 'number') {
    return Number(value);
  }
  
  // Auto-detect currency fields
  if (key === 'montant' || key === 'montant_prevu' || key === 'solde_initial' || 
      key === 'total_recettes' || key === 'total_depenses' || key === 'solde_final' ||
      key === 'totalRecettes' || key === 'totalDepenses' || key === 'solde' ||
      key === 'recettes' || key === 'depenses') {
    return Number(value);
  }
  
  if (columnType === 'date' || key === 'date' || key === 'created_at') {
    return formatDate(String(value));
  }
  
  return String(value);
};

// Default footer text for DGDA
const DEFAULT_FOOTER_LINE1 = "Tous mobilisés pour une douane d'action et d'excellence !";
const DEFAULT_FOOTER_LINE2 = "Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe";
const DEFAULT_FOOTER_LINE3 = "B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215 N.I.F. : A0700230J";
const DEFAULT_FOOTER_LINE4 = "Email : info@douane.gouv.cd ; contact@douane.gouv.cd ; courier.dgda@douane.gouv.cd - Web : https://www.douanes.gouv.cd";

// Default header text
const DEFAULT_HEADER_LINE1 = 'République Démocratique du Congo';
const DEFAULT_HEADER_LINE2 = 'Ministère des Finances';
const DEFAULT_HEADER_LINE3 = 'Direction Générale des Douanes et Accises';
const DEFAULT_HEADER_LINE4 = 'Direction Provinciale de Kinshasa-Ville';

// Add watermark to PDF page
const addPDFWatermark = (doc: jsPDF, show: boolean = true) => {
  if (!show) return;
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Save current state
  doc.saveGraphicsState();
  
  // Set watermark style - very light gray, semi-transparent
  doc.setTextColor(220, 220, 220);
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  
  // Add diagonal watermark text in center
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;
  
  // Rotate and add text
  doc.text('DGDA', centerX, centerY, {
    align: 'center',
    angle: 45,
  });
  
  // Restore state
  doc.restoreGraphicsState();
};

// Add custom footer to PDF page
const addPDFFooter = (doc: jsPDF, pageNumber: number, totalPages: number, settings: PDFExportSettings) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const footerStartY = pageHeight - 32;
  
  if (settings.showFooter) {
    // Get footer lines - use custom if enabled, otherwise defaults
    const line1 = settings.useCustomFooter ? settings.customFooterLine1 : DEFAULT_FOOTER_LINE1;
    const line2 = settings.useCustomFooter ? settings.customFooterLine2 : DEFAULT_FOOTER_LINE2;
    const line3 = settings.useCustomFooter ? settings.customFooterLine3 : DEFAULT_FOOTER_LINE3;
    const line4 = settings.useCustomFooter ? settings.customFooterLine4 : DEFAULT_FOOTER_LINE4;
    
    // Draw separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, footerStartY - 2, pageWidth - 14, footerStartY - 2);
    
    // Footer text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    
    doc.text(line1, pageWidth / 2, footerStartY + 2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(line2, pageWidth / 2, footerStartY + 7, { align: 'center' });
    doc.text(line3, pageWidth / 2, footerStartY + 12, { align: 'center' });
    doc.setFontSize(6);
    doc.text(line4, pageWidth / 2, footerStartY + 17, { align: 'center' });
  }
  
  // Page number - always show
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Page ${pageNumber} sur ${totalPages}`, pageWidth / 2, settings.showFooter ? footerStartY + 24 : pageHeight - 10, { align: 'center' });
};

// Helper to convert hex to RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [59, 130, 246]; // Default blue
};

// Add DGDA header with logo
const addPDFHeader = async (doc: jsPDF, settings: PDFExportSettings): Promise<number> => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Get header lines - use custom if enabled, otherwise defaults
  const headerLine1 = settings.useCustomHeader ? settings.customHeaderLine1 : DEFAULT_HEADER_LINE1;
  const headerLine2 = settings.useCustomHeader ? settings.customHeaderLine2 : DEFAULT_HEADER_LINE2;
  const headerLine3 = settings.useCustomHeader ? settings.customHeaderLine3 : DEFAULT_HEADER_LINE3;
  const headerLine4 = settings.useCustomHeader ? settings.customHeaderLine4 : DEFAULT_HEADER_LINE4;
  
  if (settings.showLogo) {
    // Load logo
    const img = new Image();
    img.src = settings.useDefaultLogo || !settings.customLogoUrl ? dgdaLogo : settings.customLogoUrl;
    
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    // Add logo on the left
    try {
      doc.addImage(img, 'JPEG', 14, 8, 25, 25);
    } catch (e) {
      console.warn('Could not load logo');
    }
  }

  // Header text - centered
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(0, 0, 0);
  doc.text(headerLine1, pageWidth / 2, 12, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(headerLine2, pageWidth / 2, 17, { align: 'center' });
  doc.text(headerLine3, pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bolditalic');
  doc.text(headerLine4, pageWidth / 2, 29, { align: 'center' });
  
  // Draw separator line under header with custom color
  const headerRgb = hexToRgb(settings.headerColor);
  doc.setDrawColor(headerRgb[0], headerRgb[1], headerRgb[2]);
  doc.setLineWidth(0.8);
  doc.line(14, 36, pageWidth - 14, 36);
  
  return 42; // Return the Y position after header
};

// Get margin values based on setting
const getMargins = (marginSetting: 'normal' | 'narrow' | 'wide'): { top: number; right: number; bottom: number; left: number } => {
  switch (marginSetting) {
    case 'narrow':
      return { top: 10, right: 10, bottom: 30, left: 10 };
    case 'wide':
      return { top: 20, right: 25, bottom: 45, left: 25 };
    default:
      return { top: 14, right: 14, bottom: 40, left: 14 };
  }
};

export const exportToPDF = async ({ title, filename, columns, data, subtitle, pdfSettings }: ExportOptions): Promise<void> => {
  const settings = pdfSettings || defaultPDFSettings;
  const margins = getMargins(settings.margins);
  
  const doc = new jsPDF({
    orientation: settings.orientation,
    unit: 'mm',
    format: 'a4',
  });
  
  // Add DGDA header with logo
  const headerEndY = await addPDFHeader(doc, settings);
  
  // Add title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, margins.left, headerEndY + 6);
  
  // Add subtitle if provided
  let currentY = headerEndY + 6;
  if (subtitle) {
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, margins.left, currentY);
  }
  
  // Add generation date if enabled
  if (settings.showGenerationDate) {
    currentY += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, margins.left, currentY);
    doc.setTextColor(0, 0, 0);
  }
  
  // Prepare table data with proper formatting
  const tableHeaders = columns.map(col => col.header);
  const tableData = data.map(item => 
    columns.map(col => getCellValue(item, col.key, col.type))
  );
  
  // Convert colors
  const headerColorRgb = hexToRgb(settings.headerColor);
  const headerTextColorRgb = hexToRgb(settings.headerTextColor);
  const alternateRowColorRgb = hexToRgb(settings.alternateRowColor);
  const borderColorRgb = hexToRgb(settings.borderColor);
  
  // Add table with pagination support
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: currentY + 6,
    styles: {
      fontSize: settings.fontSize,
      cellPadding: 3,
      lineColor: borderColorRgb,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: headerColorRgb,
      textColor: headerTextColorRgb,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: alternateRowColorRgb,
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as Record<number, { cellWidth: number }>),
    margin: { 
      top: margins.top,
      right: margins.right,
      bottom: settings.showFooter ? margins.bottom : 20,
      left: margins.left,
    },
  });
  
  // Add watermark and footer with pagination to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addPDFWatermark(doc, settings.showWatermark);
    addPDFFooter(doc, i, pageCount, settings);
  }
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
};

export const exportToExcel = ({ title, filename, columns, data, subtitle, pdfSettings, headerLines, footerLines }: ExportOptions): void => {
  const settings = pdfSettings || defaultPDFSettings;
  
  // Get header/footer lines - use custom arrays if provided, otherwise settings or defaults
  const headerLine1 = headerLines?.[0] || (settings.useCustomHeader ? settings.customHeaderLine1 : DEFAULT_HEADER_LINE1);
  const headerLine2 = headerLines?.[1] || (settings.useCustomHeader ? settings.customHeaderLine2 : DEFAULT_HEADER_LINE2);
  const headerLine3 = headerLines?.[2] || (settings.useCustomHeader ? settings.customHeaderLine3 : DEFAULT_HEADER_LINE3);
  const headerLine4 = headerLines?.[3] || (settings.useCustomHeader ? settings.customHeaderLine4 : DEFAULT_HEADER_LINE4);
  const headerLine5 = headerLines?.[4] || '';
  
  const footerLine1 = footerLines?.[0] || (settings.useCustomFooter ? settings.customFooterLine1 : DEFAULT_FOOTER_LINE1);
  const footerLine2 = footerLines?.[1] || (settings.useCustomFooter ? settings.customFooterLine2 : DEFAULT_FOOTER_LINE2);
  const footerLine3 = footerLines?.[2] || (settings.useCustomFooter ? settings.customFooterLine3 : DEFAULT_FOOTER_LINE3);
  const footerLine4 = footerLines?.[3] || (settings.useCustomFooter ? settings.customFooterLine4 : DEFAULT_FOOTER_LINE4);
  
  // Prepare worksheet data
  const wsData: any[][] = [];
  
  // Add custom header lines
  wsData.push([headerLine1]);
  wsData.push([headerLine2]);
  wsData.push([headerLine3]);
  if (headerLine4) wsData.push([headerLine4]);
  if (headerLine5) wsData.push([headerLine5]);
  wsData.push([]);
  
  // Add title row
  wsData.push([title]);
  
  // Add subtitle if provided
  if (subtitle) {
    wsData.push([subtitle]);
  }
  
  // Add generation date
  wsData.push([`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`]);
  
  // Add empty row
  wsData.push([]);
  
  // Add headers
  wsData.push(columns.map(col => col.header));
  
  // Add data rows with proper number formatting
  data.forEach(item => {
    wsData.push(columns.map(col => getRawCellValue(item, col.key, col.type)));
  });
  
  // Add footer
  wsData.push([]);
  wsData.push(['───────────────────────────────────────────────────────────────────────────────']);
  if (footerLine1) wsData.push([footerLine1]);
  if (footerLine2) wsData.push([footerLine2]);
  if (footerLine3) wsData.push([footerLine3]);
  if (footerLine4) wsData.push([footerLine4]);
  
  // Sanitize data and write Excel file using safe wrapper
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  writeAoAToFile(wsData, `${filename}.xlsx`, 'Données', colWidths);
};

// Recettes export configuration
export const getRecettesExportConfig = (data: any[], dateFilter?: string) => ({
  title: 'Liste des Recettes',
  filename: `recettes_${new Date().toISOString().split('T')[0]}`,
  subtitle: dateFilter ? `Période: ${dateFilter}` : undefined,
  columns: [
    { header: 'N° Bon', key: 'numero_bon', width: 10 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Heure', key: 'heure', width: 10 },
    { header: 'Provenance', key: 'provenance', width: 20 },
    { header: 'Motif', key: 'motif', width: 25 },
    { header: 'Montant', key: 'montant', width: 15 },
    { header: 'Observation', key: 'observation', width: 20 },
  ],
  data,
});

// Dépenses export configuration
export const getDepensesExportConfig = (data: any[], dateFilter?: string) => ({
  title: 'Liste des Dépenses',
  filename: `depenses_${new Date().toISOString().split('T')[0]}`,
  subtitle: dateFilter ? `Période: ${dateFilter}` : undefined,
  columns: [
    { header: 'N° Bon', key: 'numero_bon', width: 10 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Heure', key: 'heure', width: 10 },
    { header: 'Bénéficiaire', key: 'beneficiaire', width: 20 },
    { header: 'Motif', key: 'motif', width: 25 },
    { header: 'Rubrique', key: 'rubrique_libelle', width: 20 },
    { header: 'Montant', key: 'montant', width: 15 },
    { header: 'Observation', key: 'observation', width: 20 },
  ],
  data,
});

// Feuille de caisse export configuration
export const getFeuilleCaisseExportConfig = (
  recettes: any[],
  depenses: any[],
  totals: { soldeInitial: number; totalRecettes: number; totalDepenses: number; soldeFinal: number },
  date: string
) => {
  // Combine recettes and depenses for the report
  const allOperations = [
    ...recettes.map(r => ({ ...r, type: 'Recette', rubrique_libelle: '-' })),
    ...depenses.map(d => ({ ...d, type: 'Dépense', provenance: d.beneficiaire })),
  ].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.heure}`);
    const dateB = new Date(`${b.date}T${b.heure}`);
    return dateA.getTime() - dateB.getTime();
  });
  
  return {
    title: 'Feuille de Caisse',
    filename: `feuille_caisse_${date}`,
    subtitle: `Date: ${new Date(date).toLocaleDateString('fr-FR')} | Solde Initial: ${formatCurrency(totals.soldeInitial)} | Total Recettes: ${formatCurrency(totals.totalRecettes)} | Total Dépenses: ${formatCurrency(totals.totalDepenses)} | Solde Final: ${formatCurrency(totals.soldeFinal)}`,
    columns: [
      { header: 'Type', key: 'type', width: 10 },
      { header: 'N° Bon', key: 'numero_bon', width: 10 },
      { header: 'Heure', key: 'heure', width: 10 },
      { header: 'Provenance/Bénéficiaire', key: 'provenance', width: 20 },
      { header: 'Motif', key: 'motif', width: 25 },
      { header: 'Montant', key: 'montant', width: 15 },
    ],
    data: allOperations,
  };
};

// Programmations export configuration
export const getProgrammationsExportConfig = (data: any[], moisLabel?: string, annee?: number) => ({
  title: 'Liste des Programmations',
  filename: `programmations_${new Date().toISOString().split('T')[0]}`,
  subtitle: moisLabel && annee ? `Période: ${moisLabel} ${annee}` : undefined,
  columns: [
    { header: 'N° Ordre', key: 'numero_ordre', width: 10 },
    { header: 'Désignation', key: 'designation', width: 30 },
    { header: 'Mois', key: 'mois_label', width: 12 },
    { header: 'Année', key: 'annee', width: 10 },
    { header: 'Montant Prévu', key: 'montant_prevu', width: 18 },
    { header: 'Statut', key: 'statut', width: 12 },
  ],
  data: data.map(item => ({
    ...item,
    mois_label: MOIS_LABELS_EXPORT[item.mois - 1] || '',
    statut: item.is_validated ? 'Validé' : 'En attente',
  })),
});

// Rapport mensuel export configuration
const MOIS_LABELS_EXPORT = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const getRapportMensuelExportConfig = (
  monthlyStats: { mois: number; totalRecettes: number; totalDepenses: number; solde: number }[],
  annee: number
) => ({
  title: `Rapport Mensuel ${annee}`,
  filename: `rapport_mensuel_${annee}`,
  subtitle: `Statistiques mensuelles de l'année ${annee}`,
  columns: [
    { header: 'Mois', key: 'mois_label', width: 15 },
    { header: 'Recettes', key: 'recettes', width: 18 },
    { header: 'Dépenses', key: 'depenses', width: 18 },
    { header: 'Solde', key: 'solde', width: 18 },
  ],
  data: monthlyStats.map(stat => ({
    mois_label: MOIS_LABELS_EXPORT[stat.mois - 1],
    recettes: formatCurrency(stat.totalRecettes),
    depenses: formatCurrency(stat.totalDepenses),
    solde: formatCurrency(stat.solde),
  })),
});

// Rapport annuel export configuration
export const getRapportAnnuelExportConfig = (
  annualStats: { annee: number; totalRecettes: number; totalDepenses: number; solde: number }[],
  startYear: number,
  endYear: number
) => ({
  title: `Rapport Annuel ${startYear} - ${endYear}`,
  filename: `rapport_annuel_${startYear}_${endYear}`,
  subtitle: `Comparaison des statistiques sur ${annualStats.length} années`,
  columns: [
    { header: 'Année', key: 'annee', width: 10 },
    { header: 'Recettes', key: 'recettes', width: 18 },
    { header: 'Dépenses', key: 'depenses', width: 18 },
    { header: 'Solde', key: 'solde', width: 18 },
  ],
  data: annualStats.map(stat => ({
    annee: stat.annee.toString(),
    recettes: formatCurrency(stat.totalRecettes),
    depenses: formatCurrency(stat.totalDepenses),
    solde: formatCurrency(stat.solde),
  })),
});
