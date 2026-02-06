/**
 * Advanced Report Editor Types
 * Types for DGDA-compliant report templates with full customization
 */

export type ReportTemplateType = 'feuille_caisse' | 'sommaire' | 'programmation' | 'custom';
export type ExportFormat = 'pdf' | 'excel' | 'word' | 'csv';
export type PageOrientation = 'portrait' | 'landscape';
export type TextAlignment = 'left' | 'center' | 'right';

// Header configuration matching DGDA document format
export interface ReportHeader {
  line1: string; // République Démocratique du Congo
  line2: string; // Ministère des Finances
  line3: string; // Direction Générale des Douanes et Accises
  line4: string; // Direction Provinciale de Kin-Ville
  showLogo: boolean;
  logoPosition: 'left' | 'center' | 'right';
  referenceNumber: string; // DGDA/3400/DP/KV/SDAF/.../2022
}

// Footer configuration
export interface ReportFooter {
  slogan: string; // "Toujours davantage..."
  address: string;
  contact: string;
  email: string;
  showPageNumbers: boolean;
}

// Table column definition
export interface TableColumn {
  id: string;
  header: string;
  key: string;
  width?: number;
  type: 'text' | 'number' | 'currency' | 'date';
  align?: TextAlignment;
  format?: string;
}

// Row styling for different categories
export interface RowStyle {
  condition: 'header' | 'subheader' | 'data' | 'total' | 'subtotal';
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
}

// Template styling
export interface TemplateStyles {
  titleFont: string;
  titleSize: number;
  bodyFont: string;
  bodySize: number;
  headerColor: string;
  headerTextColor: string;
  alternateRowColor: string;
  borderColor: string;
  accentColor: string;
  rowStyles: RowStyle[];
}

// Watermark configuration
export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number;
  rotation: number;
  fontSize: number;
  color: string;
  position: 'center' | 'diagonal' | 'tiled';
  // Image watermark properties
  type: 'text' | 'image';
  imageUrl?: string;
  imageSize: number; // percentage of page width
}

// Complete report template
export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportTemplateType;
  description: string;
  orientation: PageOrientation;
  header: ReportHeader;
  footer: ReportFooter;
  columns: TableColumn[];
  styles: TemplateStyles;
  showTotals: boolean;
  showSubtotals: boolean;
  groupBy?: string;
  sortBy?: string[];
  watermark?: string;
  watermarkConfig?: WatermarkConfig;
  createdAt: Date;
  updatedAt: Date;
}

// Editor state for customization
export interface EditorState {
  template: ReportTemplate;
  data: Record<string, unknown>[];
  selectedElement: 'header' | 'title' | 'table' | 'footer' | null;
  isDirty: boolean;
  previewMode: 'edit' | 'preview';
}

// Feuille de Caisse specific fields
export interface FeuilleCaisseRow {
  date: string;
  numeroOrdre: string;
  numeroBeo: string;
  libelle: string;
  recette?: number;
  depense?: number;
  imputation: string;
}

// Sommaire specific fields  
export interface SommaireRow {
  article: string;
  designation: string;
  recettes?: number;
  depenses?: number;
  isCategory?: boolean;
}

// Programmation specific fields
export interface ProgrammationRow {
  numeroOrdre: number;
  designation: string;
  montantPrevu: number;
  rubrique?: string;
  periode?: string;
}

// Export configuration
export interface ExportConfig {
  format: ExportFormat;
  filename: string;
  includeHeader: boolean;
  includeFooter: boolean;
  includeWatermark: boolean;
  pageSize: 'A4' | 'A5' | 'Letter';
  orientation: PageOrientation;
  quality: 'draft' | 'normal' | 'high';
}

// Editable text block
export interface EditableTextBlock {
  id: string;
  type: 'header' | 'title' | 'subtitle' | 'footer' | 'note';
  content: string;
  style: {
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: TextAlignment;
    textDecoration?: 'underline' | 'none';
    color?: string;
  };
  editable: boolean;
}
