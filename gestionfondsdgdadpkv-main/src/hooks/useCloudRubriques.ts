import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Rubrique } from '@/types/database';

export function useCloudRubriques() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rubriques = [], isLoading, error } = useQuery({
    queryKey: ['cloud-rubriques'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rubriques')
        .select(`
          *,
          categorie:categories(id, code, libelle)
        `)
        .order('code', { ascending: true });

      if (error) throw error;
      return data as Rubrique[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const createRubrique = useMutation({
    mutationFn: async (rubrique: { 
      code: string; 
      libelle: string;
      type?: string;
      imputation?: string;
      no_beo?: string;
      imp?: string;
      categorie_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('rubriques')
        .insert(rubrique)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloud-rubriques'] });
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
      queryClient.invalidateQueries({ queryKey: ['cloud-rubriques'] });
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
      queryClient.invalidateQueries({ queryKey: ['cloud-rubriques'] });
      toast({ title: 'Succès', description: 'Rubrique supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const activeRubriques = rubriques.filter(r => r.is_active);

  return {
    rubriques,
    activeRubriques,
    isLoading,
    error,
    createRubrique,
    updateRubrique,
    deleteRubrique,
  };
}
