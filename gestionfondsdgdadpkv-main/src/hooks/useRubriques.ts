import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocalAuth } from '@/contexts/LocalAuthContext';
import { saveToCache, getFromCache } from './useLocalStorageCache';

export interface Rubrique {
  id: string;
  code: string;
  libelle: string;
  categorie: string | null;
  no_beo: string | null;
  imp: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useRubriques() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useLocalAuth();

  const { data: rubriques = [], isLoading, error } = useQuery({
    queryKey: ['rubriques'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rubriques')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;
      const typedData = data as Rubrique[];
      
      // Save to cache
      saveToCache('rubriques', typedData);
      return typedData;
    },
    staleTime: 60000, // 1 minute
    placeholderData: () => getFromCache<Rubrique[]>('rubriques', 24 * 60 * 60 * 1000) ?? undefined,
  });

  const createRubrique = useMutation({
    mutationFn: async (rubrique: { code: string; libelle: string; categorie?: string; no_beo?: string; imp?: string }) => {
      const { data, error } = await supabase
        .from('rubriques')
        .insert({
          ...rubrique,
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubriques'] });
      toast({ title: 'Succès', description: 'Rubrique créée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateRubrique = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Rubrique> & { id: string }) => {
      const { data, error } = await supabase
        .from('rubriques')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubriques'] });
      toast({ title: 'Succès', description: 'Rubrique mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRubrique = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rubriques')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubriques'] });
      toast({ title: 'Succès', description: 'Rubrique supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    rubriques,
    isLoading,
    error,
    createRubrique,
    updateRubrique,
    deleteRubrique,
  };
}
