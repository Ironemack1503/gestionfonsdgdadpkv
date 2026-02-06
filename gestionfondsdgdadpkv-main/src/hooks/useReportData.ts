/**
 * Hook for fetching and processing report data
 * Provides data for Feuille de Caisse, Sommaire, Programmation, and États Financiers
 */

import { useMemo, useCallback } from 'react';
import { useRecettes } from './useRecettes';
import { useDepenses } from './useDepenses';
import { useProgrammations } from './useProgrammations';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Number to French words converter
export const numberToFrenchWords = (num: number): string => {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  if (num === 0) return 'zéro';
  if (num < 0) return 'moins ' + numberToFrenchWords(-num);

  let words = '';

  if (num >= 1000000000) {
    words += numberToFrenchWords(Math.floor(num / 1000000000)) + ' milliard ';
    num %= 1000000000;
  }

  if (num >= 1000000) {
    words += numberToFrenchWords(Math.floor(num / 1000000)) + ' million ';
    num %= 1000000;
  }

  if (num >= 1000) {
    if (Math.floor(num / 1000) === 1) {
      words += 'mille ';
    } else {
      words += numberToFrenchWords(Math.floor(num / 1000)) + ' mille ';
    }
    num %= 1000;
  }

  if (num >= 100) {
    if (Math.floor(num / 100) === 1) {
      words += 'cent ';
    } else {
      words += units[Math.floor(num / 100)] + ' cent ';
    }
    num %= 100;
  }

  if (num >= 20) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    if (ten === 7 || ten === 9) {
      words += tens[ten - 1] + '-' + units[10 + unit];
    } else if (unit === 1 && ten !== 8) {
      words += tens[ten] + ' et un';
    } else if (unit > 0) {
      words += tens[ten] + '-' + units[unit];
    } else {
      words += tens[ten];
    }
    num = 0;
  }

  if (num > 0) {
    words += units[num];
  }

  return words.trim();
};

export interface FeuilleCaisseRow {
  id: string;
  date: string;
  numeroOrdre: number;
  numeroBEO: string;
  libelle: string;
  recette: number;
  depense: number;
  imp: string;
  total: number;
  caisse: number;
  balance: number;
}

export interface SommaireRow {
  imp: string;
  designation: string;
  recettes: number;
  depenses: number;
  total: number;
  caisse: number;
  balance: number;
}

export interface ProgrammationRow {
  numeroOrdre: number;
  libelle: string;
  montant: number;
}

export interface EtatResultat {
  totalRecettes: number;
  totalDepenses: number;
  beneficeDeficit: number;
  encaisse: number;
  balance: number;
}

export interface ReportFilters {
  dateDebut: string;
  dateFin: string;
  mois?: number;
  annee?: number;
  userId?: string;
  categorieId?: string;
}

export function useReportData() {
  const { recettes, isLoading: loadingRecettes, fetchAllForExport: fetchAllRecettes } = useRecettes();
  const { depenses, isLoading: loadingDepenses, fetchAllForExport: fetchAllDepenses } = useDepenses();
  const { programmations, isLoading: loadingProgrammations, getProgrammationsByMonthYear } = useProgrammations();

  // Calculate previous month closing balance
  const calculatePreviousMonthBalance = useCallback(async (mois: number, annee: number): Promise<number> => {
    // Get the previous month/year
    let prevMois = mois - 1;
    let prevAnnee = annee;
    if (prevMois === 0) {
      prevMois = 12;
      prevAnnee = annee - 1;
    }

    // Calculate start and end dates for previous month
    const startDate = `${prevAnnee}-${String(prevMois).padStart(2, '0')}-01`;
    const lastDay = new Date(prevAnnee, prevMois, 0).getDate();
    const endDate = `${prevAnnee}-${String(prevMois).padStart(2, '0')}-${lastDay}`;

    // Fetch all recettes and depenses for previous month
    const { data: prevRecettes } = await supabase
      .from('recettes')
      .select('montant')
      .gte('date', startDate)
      .lte('date', endDate);

    const { data: prevDepenses } = await supabase
      .from('depenses')
      .select('montant')
      .gte('date', startDate)
      .lte('date', endDate);

    const totalRecettes = (prevRecettes || []).reduce((acc, r) => acc + Number(r.montant), 0);
    const totalDepenses = (prevDepenses || []).reduce((acc, d) => acc + Number(d.montant), 0);

    // Recursively get balance before previous month
    let previousBalance = 0;
    if (prevAnnee >= 2024) { // Limit recursion
      previousBalance = await calculatePreviousMonthBalance(prevMois, prevAnnee);
    }

    return previousBalance + totalRecettes - totalDepenses;
  }, []);

  // Previous month balance query
  const usePreviousMonthBalance = (mois: number, annee: number) => {
    return useQuery({
      queryKey: ['previous-month-balance', mois, annee],
      queryFn: () => calculatePreviousMonthBalance(mois, annee),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Generate Feuille de Caisse data
  const generateFeuilleCaisse = useCallback((
    filters: ReportFilters,
    soldePrecedent: number = 0
  ): FeuilleCaisseRow[] => {
    const { dateDebut, dateFin } = filters;
    
    // Filter and combine data
    const filteredRecettes = recettes.filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin);
    const filteredDepenses = depenses.filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin);

    // Combine into operations
    const operations = [
      ...filteredRecettes.map((r, idx) => ({
        id: r.id,
        date: r.date_transaction,
        numeroOrdre: idx + 1,
        numeroBEO: `REC-${String(r.numero_bon).padStart(4, '0')}`,
        libelle: `${r.motif} - ${r.provenance}`,
        recette: Number(r.montant),
        depense: 0,
        imp: 'R',
        rubrique: null as string | null,
      })),
      ...filteredDepenses.map((d, idx) => ({
        id: d.id,
        date: d.date_transaction,
        numeroOrdre: idx + 1,
        numeroBEO: `DEP-${String(d.numero_bon).padStart(4, '0')}`,
        libelle: `${d.motif} - ${d.beneficiaire}`,
        recette: 0,
        depense: Number(d.montant),
        imp: 'D',
        rubrique: d.rubrique?.code || null,
      })),
    ].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.numeroBEO.localeCompare(b.numeroBEO);
    });

    // Calculate running balance, caisse, and total
    let runningBalance = soldePrecedent;
    let runningCaisse = soldePrecedent;

    const rows: FeuilleCaisseRow[] = operations.map((op, index) => {
      const total = op.recette - op.depense;
      runningBalance += total;
      runningCaisse = runningBalance;

      return {
        id: op.id,
        date: op.date,
        numeroOrdre: index + 1,
        numeroBEO: op.numeroBEO,
        libelle: op.libelle,
        recette: op.recette,
        depense: op.depense,
        imp: op.imp,
        total: total,
        caisse: runningCaisse,
        balance: runningBalance,
      };
    });

    return rows;
  }, [recettes, depenses]);

  // Generate Sommaire data (grouped by rubrique/category)
  const generateSommaire = useCallback((
    filters: ReportFilters,
    soldePrecedent: number = 0
  ): SommaireRow[] => {
    const { dateDebut, dateFin } = filters;

    const filteredRecettes = recettes.filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin);
    const filteredDepenses = depenses.filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin);

    // Group depenses by rubrique
    const depensesByRubrique = new Map<string, { designation: string; total: number }>();
    filteredDepenses.forEach(d => {
      const code = d.rubrique?.code || 'AUTRE';
      const designation = d.rubrique?.libelle || 'Autres dépenses';
      const existing = depensesByRubrique.get(code) || { designation, total: 0 };
      existing.total += Number(d.montant);
      depensesByRubrique.set(code, existing);
    });

    // Total recettes
    const totalRecettes = filteredRecettes.reduce((acc, r) => acc + Number(r.montant), 0);

    // Build sommaire rows
    const rows: SommaireRow[] = [];
    
    // Add solde precedent row
    if (soldePrecedent > 0) {
      rows.push({
        imp: 'SP',
        designation: 'Solde de clôture mois antérieur',
        recettes: soldePrecedent,
        depenses: 0,
        total: soldePrecedent,
        caisse: soldePrecedent,
        balance: soldePrecedent,
      });
    }

    // Add recettes row
    rows.push({
      imp: 'R',
      designation: 'Total des Recettes',
      recettes: totalRecettes,
      depenses: 0,
      total: totalRecettes,
      caisse: soldePrecedent + totalRecettes,
      balance: soldePrecedent + totalRecettes,
    });

    // Add depenses by rubrique
    let runningBalance = soldePrecedent + totalRecettes;
    depensesByRubrique.forEach((value, code) => {
      runningBalance -= value.total;
      rows.push({
        imp: code,
        designation: value.designation,
        recettes: 0,
        depenses: value.total,
        total: -value.total,
        caisse: runningBalance,
        balance: runningBalance,
      });
    });

    return rows;
  }, [recettes, depenses]);

  // Generate Programmation data
  const generateProgrammation = useCallback((
    mois: number,
    annee: number
  ): ProgrammationRow[] => {
    const monthProgrammations = getProgrammationsByMonthYear(mois, annee);
    
    return monthProgrammations.map((p, index) => ({
      numeroOrdre: p.numero_ordre || index + 1,
      libelle: p.designation,
      montant: Number(p.montant_prevu),
    }));
  }, [getProgrammationsByMonthYear]);

  // Calculate État de Résultat
  const calculateEtatResultat = useCallback((
    filters: ReportFilters,
    soldePrecedent: number = 0
  ): EtatResultat => {
    const { dateDebut, dateFin } = filters;

    const filteredRecettes = recettes.filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin);
    const filteredDepenses = depenses.filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin);

    const totalRecettes = filteredRecettes.reduce((acc, r) => acc + Number(r.montant), 0);
    const totalDepenses = filteredDepenses.reduce((acc, d) => acc + Number(d.montant), 0);
    const encaisse = totalRecettes - totalDepenses;
    const balance = soldePrecedent + encaisse;

    return {
      totalRecettes,
      totalDepenses,
      beneficeDeficit: encaisse,
      encaisse,
      balance,
    };
  }, [recettes, depenses]);

  const isLoading = loadingRecettes || loadingDepenses || loadingProgrammations;

  return {
    // Data generators
    generateFeuilleCaisse,
    generateSommaire,
    generateProgrammation,
    calculateEtatResultat,
    usePreviousMonthBalance,
    
    // Raw data
    recettes,
    depenses,
    programmations,
    
    // State
    isLoading,
    
    // Utilities
    numberToFrenchWords,
    fetchAllRecettes,
    fetchAllDepenses,
  };
}
