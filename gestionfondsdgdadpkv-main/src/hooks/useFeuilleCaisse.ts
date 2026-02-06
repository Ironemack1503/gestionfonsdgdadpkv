import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';
import { useLocalAuth } from '@/contexts/LocalAuthContext';

export interface FeuilleCaisse {
  id: string;
  date: string;
  solde_initial: number;
  total_recettes: number;
  total_depenses: number;
  solde_final: number | null;
  is_closed: boolean;
  closed_at: string | null;
  closed_by: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useFeuilleCaisse() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useLocalAuth();

  const { data: feuilles = [], isLoading, error } = useQuery({
    queryKey: ['feuilles-caisse'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feuilles_caisse')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as FeuilleCaisse[];
    },
    staleTime: 30000,
  });

  const getByDate = useCallback(async (date: string) => {
    const { data, error } = await supabase
      .from('feuilles_caisse')
      .select('*')
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return (data || null) as FeuilleCaisse | null;
  }, []);

  const createFeuille = useMutation({
    mutationFn: async (feuille: {
      date: string;
      solde_initial?: number;
      total_recettes?: number;
      total_depenses?: number;
      solde_final?: number;
    }) => {
      const { data, error } = await supabase
        .from('feuilles_caisse')
        .insert({
          ...feuille,
          user_id: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feuilles-caisse'] });
      toast({ title: 'Succès', description: 'Feuille de caisse créée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateFeuille = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FeuilleCaisse> & { id: string }) => {
      const { data, error } = await supabase
        .from('feuilles_caisse')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feuilles-caisse'] });
      toast({ title: 'Succès', description: 'Feuille de caisse mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const closeFeuille = useMutation({
    mutationFn: async ({ id, solde_final }: { id: string; solde_final: number }) => {
      const { data, error } = await supabase
        .from('feuilles_caisse')
        .update({ solde_final, is_closed: true, closed_at: new Date().toISOString(), closed_by: user?.id ?? null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feuilles-caisse'] });
      toast({ title: 'Succès', description: 'Feuille de caisse clôturée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteFeuille = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feuilles_caisse')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feuilles-caisse'] });
      toast({ title: 'Succès', description: 'Feuille de caisse supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    feuilles,
    isLoading,
    error,
    getByDate,
    createFeuille,
    updateFeuille,
    closeFeuille,
    deleteFeuille,
  };
}
