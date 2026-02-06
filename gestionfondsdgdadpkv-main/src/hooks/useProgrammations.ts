import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useCallback } from 'react';
import { saveToCache, getFromCache } from './useLocalStorageCache';
import { useLocalAuth } from '@/contexts/LocalAuthContext';

export interface Programmation {
  id: string;
  numero_ordre: number | null;
  mois: number;
  annee: number;
  rubrique_id: string | null;
  designation: string;
  montant_prevu: number;
  montant_lettre: string | null;
  is_validated: boolean;
  validated_by: string | null;
  validated_at: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  rubrique?: {
    id: string;
    code: string;
    libelle: string;
  } | null;
}

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function useProgrammations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useLocalAuth();

  const { data: programmations = [], isLoading, error } = useQuery({
    queryKey: ['programmations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programmations')
        .select(`
          *,
          rubrique:rubriques(id, code, libelle)
        `)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false })
        .order('numero_ordre', { ascending: true });

      if (error) throw error;
      const typedData = data as Programmation[];
      
      // Save to cache
      saveToCache('programmations', typedData);
      return typedData;
    },
    staleTime: 30000,
    placeholderData: () => getFromCache<Programmation[]>('programmations', 60 * 60 * 1000) ?? undefined,
  });

  const createProgrammation = useMutation({
    mutationFn: async (programmation: {
      mois: number;
      annee: number;
      designation: string;
      montant_prevu: number;
      montant_lettre?: string;
      rubrique_id?: string;
    }) => {
      if (!user?.id) {
        throw new Error('Session invalide ou expirée');
      }

      const { data, error } = await supabase
        .from('programmations')
        .insert({
          ...programmation,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmations'] });
      toast({ title: 'Succès', description: 'Programmation créée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateProgrammation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Programmation> & { id: string }) => {
      const { data, error } = await supabase
        .from('programmations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmations'] });
      toast({ title: 'Succès', description: 'Programmation mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteProgrammation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('programmations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmations'] });
      toast({ title: 'Succès', description: 'Programmation supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const formatMois = useCallback((mois: number, annee: number) => 
    `${moisNoms[mois - 1]} ${annee}`, []);

  const totalProgramme = useMemo(() => 
    (programmations || []).reduce((acc, p) => acc + Number(p.montant_prevu), 0), 
    [programmations]
  );

  // Get programmations filtered by month and year
  const getProgrammationsByMonthYear = useCallback((mois: number, annee: number) => {
    return (programmations || [])
      .filter(p => p.mois === mois && p.annee === annee)
      .sort((a, b) => (a.numero_ordre || 0) - (b.numero_ordre || 0));
  }, [programmations]);

  // Fetch user profile separately for export
  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', userId)
      .single();
    return data?.full_name || null;
  }, []);

  return {
    programmations,
    isLoading,
    error,
    totalProgramme,
    formatMois,
    moisNoms,
    createProgrammation,
    updateProgrammation,
    deleteProgrammation,
    getProgrammationsByMonthYear,
    fetchUserProfile,
  };
}
