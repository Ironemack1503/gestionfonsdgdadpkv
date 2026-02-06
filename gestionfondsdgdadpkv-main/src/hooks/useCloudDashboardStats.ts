import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardStats } from '@/types/database';

export function useCloudDashboardStats() {
  const query = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];

      // Fetch all recettes for calculations
      const { data: recettes, error: recettesError } = await supabase
        .from('recettes')
        .select('montant, date_transaction, statut');

      if (recettesError) throw recettesError;

      // Fetch all depenses for calculations
      const { data: depenses, error: depensesError } = await supabase
        .from('depenses')
        .select('montant, date_transaction, statut');

      if (depensesError) throw depensesError;

      // Calculate stats
      const totalRecettes = recettes?.reduce((sum, r) => sum + Number(r.montant), 0) || 0;
      const totalDepenses = depenses?.reduce((sum, d) => sum + Number(d.montant), 0) || 0;

      const recettesJour = recettes
        ?.filter(r => r.date_transaction === today)
        .reduce((sum, r) => sum + Number(r.montant), 0) || 0;

      const depensesJour = depenses
        ?.filter(d => d.date_transaction === today)
        .reduce((sum, d) => sum + Number(d.montant), 0) || 0;

      const recettesMois = recettes
        ?.filter(r => r.date_transaction >= startOfMonth)
        .reduce((sum, r) => sum + Number(r.montant), 0) || 0;

      const depensesMois = depenses
        ?.filter(d => d.date_transaction >= startOfMonth)
        .reduce((sum, d) => sum + Number(d.montant), 0) || 0;

      const transactionsEnAttente = 
        (recettes?.filter(r => r.statut === 'brouillon').length || 0) +
        (depenses?.filter(d => d.statut === 'brouillon').length || 0);

      // Get solde initial from parametres
      const { data: soldeParam } = await supabase
        .from('parametres')
        .select('valeur')
        .eq('cle', 'solde_initial')
        .maybeSingle();

      const soldeInitial = soldeParam ? Number(soldeParam.valeur) : 0;
      const soldeActuel = soldeInitial + totalRecettes - totalDepenses;

      return {
        soldeActuel,
        recettesJour,
        depensesJour,
        recettesMois,
        depensesMois,
        nombreRecettes: recettes?.length || 0,
        nombreDepenses: depenses?.length || 0,
        transactionsEnAttente,
      };
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Add legacy stats format for compatibility
  const stats = query.data ? {
    soldeCaisse: query.data.soldeActuel,
    recettesMois: query.data.recettesMois,
    depensesMois: query.data.depensesMois,
    programmationRestante: 0,
    recentTransactions: [] as { id: string; date: string; reference: string; type: 'Recette' | 'Dépense'; motif: string; montant: number }[],
  } : {
    soldeCaisse: 0,
    recettesMois: 0,
    depensesMois: 0,
    programmationRestante: 0,
    recentTransactions: [],
  };

  return {
    ...query,
    stats,
  };
}
