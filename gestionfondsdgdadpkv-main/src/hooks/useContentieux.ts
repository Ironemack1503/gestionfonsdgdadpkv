import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Contentieux } from '@/types/database';

export function useContentieux() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contentieux = [], isLoading, error } = useQuery({
    queryKey: ['contentieux'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contentieux')
        .select(`
          *,
          rubrique:rubriques(id, code, libelle)
        `)
        .order('numero_ordre', { ascending: true });

      if (error) throw error;
      return data as Contentieux[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const createContentieux = useMutation({
    mutationFn: async (item: { 
      code: string; 
      libelle: string; 
      code_rubrique?: string;
      rubrique_id?: string;
      montant?: number;
    }) => {
      const { data, error } = await supabase
        .from('contentieux')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentieux'] });
      toast({ title: 'Succès', description: 'Contentieux créé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateContentieux = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contentieux> & { id: string }) => {
      const { data, error } = await supabase
        .from('contentieux')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentieux'] });
      toast({ title: 'Succès', description: 'Contentieux mis à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteContentieux = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contentieux')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentieux'] });
      toast({ title: 'Succès', description: 'Contentieux supprimé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Calculer le total des montants contentieux
  const totalMontant = contentieux.reduce((sum, c) => sum + (c.montant || 0), 0);

  return {
    contentieux,
    totalMontant,
    isLoading,
    error,
    createContentieux,
    updateContentieux,
    deleteContentieux,
  };
}
