import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Signataire } from '@/types/database';

export function useSignataires() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: signataires = [], isLoading, error } = useQuery({
    queryKey: ['signataires'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signataires')
        .select('*')
        .order('type_signature', { ascending: true });

      if (error) throw error;
      return data as Signataire[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const createSignataire = useMutation({
    mutationFn: async (signataire: { 
      matricule: string; 
      nom: string; 
      grade?: string;
      fonction?: string;
      type_signature?: 'COMPT' | 'DAF' | 'DP';
    }) => {
      const { data, error } = await supabase
        .from('signataires')
        .insert(signataire)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signataires'] });
      toast({ title: 'Succès', description: 'Signataire créé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateSignataire = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Signataire> & { id: string }) => {
      const { data, error } = await supabase
        .from('signataires')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signataires'] });
      toast({ title: 'Succès', description: 'Signataire mis à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSignataire = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('signataires')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signataires'] });
      toast({ title: 'Succès', description: 'Signataire supprimé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Récupérer les signataires par type
  const activeSignataires = signataires.filter(s => s.is_active);
  const signataireComptable = signataires.find(s => s.type_signature === 'COMPT' && s.is_active);
  const signataireDAF = signataires.find(s => s.type_signature === 'DAF' && s.is_active);
  const signataireDP = signataires.find(s => s.type_signature === 'DP' && s.is_active);

  return {
    signataires,
    activeSignataires,
    signataireComptable,
    signataireDAF,
    signataireDP,
    isLoading,
    error,
    createSignataire,
    updateSignataire,
    deleteSignataire,
  };
}
