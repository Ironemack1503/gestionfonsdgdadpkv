import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useMemo } from 'react';
import { saveToCache, getFromCache } from './useLocalStorageCache';
import { useLocalAuth } from '@/contexts/LocalAuthContext';

export interface Recette {
  id: string;
  numero_bon: number;
  numero_beo?: string | null;
  date: string;  // Nom correct dans la base
  date_transaction?: string;  // Alias pour compatibilité
  heure: string;
  libelle?: string;
  motif: string;
  provenance: string;
  montant: number;
  montant_lettre: string | null;
  imp?: string;
  observation: string | null;
  service_id?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  service?: {
    id: string;
    code: string;
    libelle: string;
  };
}

const DEFAULT_PAGE_SIZE = 50;

export function useRecettes(initialPageSize = DEFAULT_PAGE_SIZE) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useLocalAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Fetch total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['recettes-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('recettes')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
    staleTime: 60000,
  });

  const { data: recettes = [], isLoading, error } = useQuery({
    queryKey: ['recettes', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('recettes')
        .select('*')
        .order('date', { ascending: false })
        .order('heure', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Erreur lors du chargement des recettes:', error);
        throw error;
      }
      
      console.log('Recettes chargées:', data);
      
      const typedData = (data || []).map(r => ({
        ...r,
        date_transaction: r.date  // Créer l'alias pour compatibilité
      })) as Recette[];
      
      // Cache first page only
      if (page === 1) {
        saveToCache('recettes-page1', typedData);
      }
      return typedData;
    },
    staleTime: 30000,
    placeholderData: () => page === 1 ? getFromCache<Recette[]>('recettes-page1', 30 * 60 * 1000) : undefined,
  });

  const createRecette = useMutation({
    mutationFn: async (recette: {
      motif: string;
      provenance: string;
      montant: number;
      montant_lettre?: string;
      observation?: string;
    }) => {
      if (!user?.id) {
        throw new Error('Session invalide ou expirée');
      }

      const { data, error } = await supabase
        .from('recettes')
        .insert({
          ...recette,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recettes'] });
      queryClient.invalidateQueries({ queryKey: ['recettes-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Recette enregistrée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateRecette = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Recette> & { id: string }) => {
      const { data, error } = await supabase
        .from('recettes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recettes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Recette mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRecette = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recettes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recettes'] });
      queryClient.invalidateQueries({ queryKey: ['recettes-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Recette supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  // Memoize fetchAllForExport
  const fetchAllForExport = useCallback(async () => {
    const { data, error } = await supabase
      .from('recettes')
      .select(`
        *,
        service:services(id, code, libelle)
      `)
      .order('date_transaction', { ascending: false })
      .order('heure', { ascending: false });

    if (error) throw error;
    return data as Recette[];
  }, []);

  return {
    recettes,
    isLoading,
    error,
    totalCount,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize: handlePageSizeChange,
    createRecette,
    updateRecette,
    deleteRecette,
    fetchAllForExport,
  };
}
