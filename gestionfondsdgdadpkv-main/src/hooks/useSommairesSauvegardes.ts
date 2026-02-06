import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SommaireSauvegarde } from '@/types/database';
import { montantEnLettre } from '@/lib/montantEnLettre';

export function useSommairesSauvegardes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sommaires = [], isLoading, error } = useQuery({
    queryKey: ['sommaires-sauvegardes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sommaires_sauvegardes')
        .select(`
          *,
          categorie:categories(id, code, libelle)
        `)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false })
        .order('numero_sommaire', { ascending: true });

      if (error) throw error;
      return data as SommaireSauvegarde[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const createSommaire = useMutation({
    mutationFn: async (sommaire: {
      code?: string;
      libelle: string;
      montant?: number;
      categorie_id?: string;
      mois?: number;
      annee?: number;
      mois_annee?: string;
      user_id?: string;
    }) => {
      const montant_lettre = sommaire.montant ? montantEnLettre(sommaire.montant) : null;
      
      const { data, error } = await supabase
        .from('sommaires_sauvegardes')
        .insert({
          ...sommaire,
          montant_lettre,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sommaires-sauvegardes'] });
      toast({ title: 'Succès', description: 'Sommaire enregistré avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateSommaire = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SommaireSauvegarde> & { id: string }) => {
      if (updates.montant !== undefined) {
        updates.montant_lettre = montantEnLettre(updates.montant);
      }

      const { data, error } = await supabase
        .from('sommaires_sauvegardes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sommaires-sauvegardes'] });
      toast({ title: 'Succès', description: 'Sommaire mis à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSommaire = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sommaires_sauvegardes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sommaires-sauvegardes'] });
      toast({ title: 'Succès', description: 'Sommaire supprimé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Filtrer par mois/année
  const getSommairesByPeriod = (mois: number, annee: number) => {
    return sommaires.filter(s => s.mois === mois && s.annee === annee);
  };

  // Calculer le total
  const totalMontant = sommaires.reduce((sum, s) => sum + (s.montant || 0), 0);

  return {
    sommaires,
    totalMontant,
    isLoading,
    error,
    getSommairesByPeriod,
    createSommaire,
    updateSommaire,
    deleteSommaire,
  };
}
