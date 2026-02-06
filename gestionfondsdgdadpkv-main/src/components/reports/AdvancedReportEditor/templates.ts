/**
 * DGDA Official Report Templates
 * Pre-configured templates matching the original Excel/Word documents
 */

import { ReportTemplate, TableColumn, TemplateStyles, WatermarkConfig } from './types';

// Default DGDA header
export const DEFAULT_DGDA_HEADER = {
  line1: 'République Démocratique du Congo',
  line2: 'Ministère des Finances',
  line3: 'Direction Générale des Douanes et Accises',
  line4: 'Direction Provinciale de Kin – Ville',
  showLogo: true,
  logoPosition: 'left' as const,
  referenceNumber: 'DGDA/3400/DP/KV/SDAF/',
};

// Default DGDA footer
export const DEFAULT_DGDA_FOOTER = {
  slogan: "Toujours davantage, aujourd'hui plus qu'hier et demain plus qu'aujourd'hui !",
  address: 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
  contact: 'B.P.8248 KIN I / Tél. : (0) 1 503 07 00 - (0) 1 503 07 04 / Fax : +243 (0) 1 503 07 03 N.I.F. : A0700230J',
  email: 'Email : info@douanesrdc.com bco@douanesrdc.com - Web : http://www.douanesgouv.cd',
  showPageNumbers: true,
};

// Default watermark config
export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: true,
  text: 'ORIGINAL',
  opacity: 15,
  rotation: 45,
  fontSize: 60,
  color: '#cccccc',
  position: 'diagonal',
  type: 'text',
  imageUrl: undefined,
  imageSize: 40,
};

// Default styles matching DGDA documents
export const DEFAULT_DGDA_STYLES: TemplateStyles = {
  titleFont: 'Times New Roman',
  titleSize: 14,
  bodyFont: 'Times New Roman',
  bodySize: 10,
  headerColor: '#1e40af',
  headerTextColor: '#000000',
  alternateRowColor: '#f5f7fa',
  borderColor: '#000000',
  accentColor: '#1e40af',
  rowStyles: [
    { condition: 'header', backgroundColor: '#ffffff', textColor: '#000000', fontWeight: 'bold' },
    { condition: 'subheader', backgroundColor: '#f0f0f0', textColor: '#000000', fontWeight: 'bold' },
    { condition: 'data', backgroundColor: '#ffffff', textColor: '#000000', fontWeight: 'normal' },
    { condition: 'total', backgroundColor: '#e5e7eb', textColor: '#000000', fontWeight: 'bold' },
    { condition: 'subtotal', backgroundColor: '#f3f4f6', textColor: '#000000', fontWeight: 'bold' },
  ],
};

// Feuille de Caisse columns (matching Excel format)
export const FEUILLE_CAISSE_COLUMNS: TableColumn[] = [
  { id: 'date', header: 'DATE', key: 'date', width: 12, type: 'date', align: 'center' },
  { id: 'numero_ordre', header: 'N° ORD', key: 'numero_ordre', width: 8, type: 'text', align: 'center' },
  { id: 'numero_beo', header: 'N° BEO', key: 'numero_beo', width: 8, type: 'text', align: 'center' },
  { id: 'libelle', header: 'LIBELLÉ', key: 'libelle', width: 40, type: 'text', align: 'left' },
  { id: 'recette', header: 'RECETTE', key: 'recette', width: 15, type: 'currency', align: 'right' },
  { id: 'depense', header: 'DÉPENSE', key: 'depense', width: 15, type: 'currency', align: 'right' },
  { id: 'imputation', header: 'IMP', key: 'imputation', width: 10, type: 'text', align: 'center' },
];

// Sommaire columns (matching Word format)
export const SOMMAIRE_COLUMNS: TableColumn[] = [
  { id: 'article', header: 'ART.', key: 'article', width: 12, type: 'text', align: 'center' },
  { id: 'designation', header: 'DESIGNATION', key: 'designation', width: 50, type: 'text', align: 'left' },
  { id: 'recettes', header: 'RECETTES', key: 'recettes', width: 18, type: 'currency', align: 'right' },
  { id: 'depenses', header: 'DEPENSES', key: 'depenses', width: 18, type: 'currency', align: 'right' },
];

// Programmation columns
export const PROGRAMMATION_COLUMNS: TableColumn[] = [
  { id: 'numero_ordre', header: 'N° ORD', key: 'numero_ordre', width: 10, type: 'number', align: 'center' },
  { id: 'designation', header: 'DÉSIGNATION', key: 'designation', width: 50, type: 'text', align: 'left' },
  { id: 'montant_prevu', header: 'MONTANT PRÉVU', key: 'montant_prevu', width: 20, type: 'currency', align: 'right' },
  { id: 'rubrique', header: 'RUBRIQUE', key: 'rubrique', width: 15, type: 'text', align: 'center' },
  { id: 'periode', header: 'PÉRIODE', key: 'periode', width: 15, type: 'text', align: 'center' },
];

// Feuille de Caisse Template
export const FEUILLE_CAISSE_TEMPLATE: ReportTemplate = {
  id: 'feuille_caisse',
  name: 'Feuille de Caisse',
  type: 'feuille_caisse',
  description: 'Feuille de caisse mensuelle avec suivi des recettes et dépenses',
  orientation: 'landscape',
  header: {
    ...DEFAULT_DGDA_HEADER,
    referenceNumber: 'DGDA/3400/DP/KV/SDAF/',
  },
  footer: DEFAULT_DGDA_FOOTER,
  columns: FEUILLE_CAISSE_COLUMNS,
  styles: DEFAULT_DGDA_STYLES,
  showTotals: true,
  showSubtotals: false,
  watermark: 'ORIGINAL',
  watermarkConfig: { ...DEFAULT_WATERMARK_CONFIG },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Sommaire Template
export const SOMMAIRE_TEMPLATE: ReportTemplate = {
  id: 'sommaire',
  name: 'Sommaire Mensuel',
  type: 'sommaire',
  description: 'Sommaire mensuel des opérations par rubrique budgétaire',
  orientation: 'portrait',
  header: {
    ...DEFAULT_DGDA_HEADER,
    referenceNumber: 'DGDA/3400/DP/KV/SDAF/',
  },
  footer: DEFAULT_DGDA_FOOTER,
  columns: SOMMAIRE_COLUMNS,
  styles: {
    ...DEFAULT_DGDA_STYLES,
    rowStyles: [
      { condition: 'header', backgroundColor: '#ffffff', textColor: '#000000', fontWeight: 'bold', underline: true },
      { condition: 'subheader', backgroundColor: '#ffffff', textColor: '#000000', fontWeight: 'bold' },
      { condition: 'data', backgroundColor: '#ffffff', textColor: '#000000', fontWeight: 'normal' },
      { condition: 'total', backgroundColor: '#ffffff', textColor: '#000000', fontWeight: 'bold' },
      { condition: 'subtotal', backgroundColor: '#ffffff', textColor: '#000000', fontWeight: 'bold' },
    ],
  },
  showTotals: true,
  showSubtotals: true,
  groupBy: 'category',
  watermark: 'ORIGINAL',
  watermarkConfig: { ...DEFAULT_WATERMARK_CONFIG },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Programmation Template
export const PROGRAMMATION_TEMPLATE: ReportTemplate = {
  id: 'programmation',
  name: 'Programmation Mensuelle',
  type: 'programmation',
  description: 'Programmation mensuelle des dépenses prévisionnelles',
  orientation: 'portrait',
  header: {
    ...DEFAULT_DGDA_HEADER,
    referenceNumber: 'DGDA/3400/DP/KV/SDAF/',
  },
  footer: DEFAULT_DGDA_FOOTER,
  columns: PROGRAMMATION_COLUMNS,
  styles: DEFAULT_DGDA_STYLES,
  showTotals: true,
  showSubtotals: false,
  watermark: 'ORIGINAL',
  watermarkConfig: { ...DEFAULT_WATERMARK_CONFIG },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// All available templates
export const REPORT_TEMPLATES: ReportTemplate[] = [
  FEUILLE_CAISSE_TEMPLATE,
  SOMMAIRE_TEMPLATE,
  PROGRAMMATION_TEMPLATE,
];

// Get template by type
export function getTemplateByType(type: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find(t => t.type === type);
}

// Clone template for customization
export function cloneTemplate(template: ReportTemplate): ReportTemplate {
  return {
    ...template,
    id: `${template.id}_${Date.now()}`,
    header: { ...template.header },
    footer: { ...template.footer },
    columns: template.columns.map(c => ({ ...c })),
    styles: { 
      ...template.styles,
      rowStyles: template.styles.rowStyles.map(r => ({ ...r })),
    },
    watermarkConfig: template.watermarkConfig ? { ...template.watermarkConfig } : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
