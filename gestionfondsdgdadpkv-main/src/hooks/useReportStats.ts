import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyStats {
  mois: number;
  annee: number;
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
}

export interface AnnualStats {
  annee: number;
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
  monthlyData: MonthlyStats[];
}

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function useMonthlyStats(annee: number) {
  return useQuery({
    queryKey: ['monthly-stats', annee],
    queryFn: async () => {
      // Fetch all recettes for the year
      const { data: recettes, error: recettesError } = await supabase
        .from('recettes')
        .select('date_transaction, montant')
        .gte('date_transaction', `${annee}-01-01`)
        .lte('date_transaction', `${annee}-12-31`);

      if (recettesError) throw recettesError;

      // Fetch all depenses for the year
      const { data: depenses, error: depensesError } = await supabase
        .from('depenses')
        .select('date_transaction, montant')
        .gte('date_transaction', `${annee}-01-01`)
        .lte('date_transaction', `${annee}-12-31`);

      if (depensesError) throw depensesError;

      // Group by month
      const monthlyStats: MonthlyStats[] = [];
      
      for (let mois = 1; mois <= 12; mois++) {
        const monthRecettes = recettes?.filter(r => {
          const date = new Date(r.date_transaction);
          return date.getMonth() + 1 === mois;
        }) || [];

        const monthDepenses = depenses?.filter(d => {
          const date = new Date(d.date_transaction);
          return date.getMonth() + 1 === mois;
        }) || [];

        const totalRecettes = monthRecettes.reduce((sum, r) => sum + Number(r.montant), 0);
        const totalDepenses = monthDepenses.reduce((sum, d) => sum + Number(d.montant), 0);

        monthlyStats.push({
          mois,
          annee,
          totalRecettes,
          totalDepenses,
          solde: totalRecettes - totalDepenses,
        });
      }

      return monthlyStats;
    },
  });
}

export function useAnnualStats(startYear: number, endYear: number) {
  return useQuery({
    queryKey: ['annual-stats', startYear, endYear],
    queryFn: async () => {
      const annualStats: AnnualStats[] = [];

      for (let year = startYear; year <= endYear; year++) {
        // Fetch recettes for the year
        const { data: recettes, error: recettesError } = await supabase
          .from('recettes')
          .select('date_transaction, montant')
          .gte('date_transaction', `${year}-01-01`)
          .lte('date_transaction', `${year}-12-31`);

        if (recettesError) throw recettesError;

        // Fetch depenses for the year
        const { data: depenses, error: depensesError } = await supabase
          .from('depenses')
          .select('date_transaction, montant')
          .gte('date_transaction', `${year}-01-01`)
          .lte('date_transaction', `${year}-12-31`);

        if (depensesError) throw depensesError;

        // Calculate monthly data
        const monthlyData: MonthlyStats[] = [];
        for (let mois = 1; mois <= 12; mois++) {
          const monthRecettes = recettes?.filter(r => {
            const date = new Date(r.date_transaction);
            return date.getMonth() + 1 === mois;
          }) || [];

          const monthDepenses = depenses?.filter(d => {
            const date = new Date(d.date_transaction);
            return date.getMonth() + 1 === mois;
          }) || [];

          const totalRecettes = monthRecettes.reduce((sum, r) => sum + Number(r.montant), 0);
          const totalDepenses = monthDepenses.reduce((sum, d) => sum + Number(d.montant), 0);

          monthlyData.push({
            mois,
            annee: year,
            totalRecettes,
            totalDepenses,
            solde: totalRecettes - totalDepenses,
          });
        }

        const totalRecettes = recettes?.reduce((sum, r) => sum + Number(r.montant), 0) || 0;
        const totalDepenses = depenses?.reduce((sum, d) => sum + Number(d.montant), 0) || 0;

        annualStats.push({
          annee: year,
          totalRecettes,
          totalDepenses,
          solde: totalRecettes - totalDepenses,
          monthlyData,
        });
      }

      return annualStats;
    },
  });
}

export function useRubriqueStats(annee: number) {
  return useQuery({
    queryKey: ['rubrique-stats', annee],
    queryFn: async () => {
      // Fetch depenses with rubriques for the year
      const { data: depenses, error: depensesError } = await supabase
        .from('depenses')
        .select(`
          montant,
          date_transaction,
          rubrique:rubriques(id, libelle, code)
        `)
        .gte('date_transaction', `${annee}-01-01`)
        .lte('date_transaction', `${annee}-12-31`);

      if (depensesError) throw depensesError;

      // Group by rubrique
      const rubriqueMap = new Map<string, { libelle: string; code: string; total: number }>();

      depenses?.forEach(d => {
        const rubrique = d.rubrique as { id: string; libelle: string; code: string } | null;
        if (rubrique) {
          const existing = rubriqueMap.get(rubrique.id) || {
            libelle: rubrique.libelle,
            code: rubrique.code,
            total: 0,
          };
          existing.total += Number(d.montant);
          rubriqueMap.set(rubrique.id, existing);
        }
      });

      return Array.from(rubriqueMap.values()).sort((a, b) => b.total - a.total);
    },
  });
}

export { MOIS_LABELS };
