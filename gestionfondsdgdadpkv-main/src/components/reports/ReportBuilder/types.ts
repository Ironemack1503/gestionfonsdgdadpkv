/**
 * Report Builder Types
 * Types for the drag-drop report builder with formulas and groupings
 */

export type FieldType = 'text' | 'number' | 'currency' | 'date' | 'time';
export type FormulaType = 'sum' | 'count' | 'avg' | 'min' | 'max' | 'custom';
export type GroupByType = 'date' | 'category' | 'month' | 'year' | 'rubrique' | 'provenance' | 'beneficiaire';

export interface ReportField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  source: 'recettes' | 'depenses' | 'programmations' | 'calculated';
  isVisible: boolean;
  width?: number;
}

export interface CalculatedField {
  id: string;
  name: string;
  label: string;
  formula: FormulaType;
  sourceField?: string;
  customFormula?: string;
}

export interface ReportGrouping {
  id: string;
  field: GroupByType;
  label: string;
  showSubtotal: boolean;
  isExpanded: boolean;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
  value: string | number | [string, string] | [number, number];
}

export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  selectedFields: ReportField[];
  calculatedFields: CalculatedField[];
  groupings: ReportGrouping[];
  filters: ReportFilter[];
  showTotals: boolean;
  showSubtotals: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Available fields for drag-drop
export const AVAILABLE_FIELDS: ReportField[] = [
  // Recettes fields
  { id: 'recette_date', name: 'date', label: 'Date', type: 'date', source: 'recettes', isVisible: true },
  { id: 'recette_numero_bon', name: 'numero_bon', label: 'N° Bon', type: 'number', source: 'recettes', isVisible: true },
  { id: 'recette_motif', name: 'motif', label: 'Motif', type: 'text', source: 'recettes', isVisible: true },
  { id: 'recette_provenance', name: 'provenance', label: 'Provenance', type: 'text', source: 'recettes', isVisible: true },
  { id: 'recette_montant', name: 'montant', label: 'Montant Recette', type: 'currency', source: 'recettes', isVisible: true },
  
  // Depenses fields
  { id: 'depense_date', name: 'date', label: 'Date Dépense', type: 'date', source: 'depenses', isVisible: true },
  { id: 'depense_numero_bon', name: 'numero_bon', label: 'N° Bon Dépense', type: 'number', source: 'depenses', isVisible: true },
  { id: 'depense_beneficiaire', name: 'beneficiaire', label: 'Bénéficiaire', type: 'text', source: 'depenses', isVisible: true },
  { id: 'depense_motif', name: 'motif', label: 'Motif Dépense', type: 'text', source: 'depenses', isVisible: true },
  { id: 'depense_montant', name: 'montant', label: 'Montant Dépense', type: 'currency', source: 'depenses', isVisible: true },
  { id: 'depense_rubrique', name: 'rubrique', label: 'Rubrique', type: 'text', source: 'depenses', isVisible: true },
  
  // Programmations fields
  { id: 'prog_designation', name: 'designation', label: 'Désignation', type: 'text', source: 'programmations', isVisible: true },
  { id: 'prog_montant_prevu', name: 'montant_prevu', label: 'Montant Prévu', type: 'currency', source: 'programmations', isVisible: true },
  { id: 'prog_mois', name: 'mois', label: 'Mois', type: 'number', source: 'programmations', isVisible: true },
  { id: 'prog_annee', name: 'annee', label: 'Année', type: 'number', source: 'programmations', isVisible: true },
];

// Default formulas
export const DEFAULT_FORMULAS: CalculatedField[] = [
  { id: 'total_recettes', name: 'total_recettes', label: 'TOTAL Recettes', formula: 'sum', sourceField: 'recette_montant' },
  { id: 'total_depenses', name: 'total_depenses', label: 'TOTAL Dépenses', formula: 'sum', sourceField: 'depense_montant' },
  { id: 'encaisse', name: 'encaisse', label: 'ENCAISSE', formula: 'custom', customFormula: 'SUM(recettes) - SUM(depenses)' },
  { id: 'balance', name: 'balance', label: 'BALANCE', formula: 'custom', customFormula: 'SOLDE + ENCAISSE' },
];

// Available groupings
export const AVAILABLE_GROUPINGS: { value: GroupByType; label: string }[] = [
  { value: 'date', label: 'Par Date' },
  { value: 'month', label: 'Par Mois' },
  { value: 'year', label: 'Par Année' },
  { value: 'category', label: 'Par Catégorie' },
  { value: 'rubrique', label: 'Par Rubrique' },
  { value: 'provenance', label: 'Par Provenance' },
  { value: 'beneficiaire', label: 'Par Bénéficiaire' },
];
