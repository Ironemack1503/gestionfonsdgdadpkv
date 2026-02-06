import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useMemo } from 'react';
import { saveToCache, getFromCache } from './useLocalStorageCache';
import { useLocalAuth } from '@/contexts/LocalAuthContext';

export interface Depense {
  id: string;
  numero_bon: number;
  numero_beo?: string | null;
  rubrique_id?: string | null;
  service_id?: string | null;
  date: string;  // Nom correct dans la base
  date_transaction?: string;  // Alias pour compatibilité
  heure: string;
  libelle?: string;
  beneficiaire: string;
  motif: string;
  montant: number;
  montant_lettre: string | null;
  imp?: string;
  observation: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  rubrique?: {
    id: string;
    code: string;
    libelle: string;
  };
  service?: {
    id: string;
    code: string;
    libelle: string;
  };
}

const DEFAULT_PAGE_SIZE = 50;

export function useDepenses(initialPageSize = DEFAULT_PAGE_SIZE) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useLocalAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Fetch total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['depenses-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('depenses')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
    staleTime: 60000,
  });

  const { data: depenses = [], isLoading, error } = useQuery({
    queryKey: ['depenses', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('depenses')
        .select(`
          *,
          rubrique:rubriques(id, code, libelle)
        `)
        .order('date', { ascending: false })
        .order('heure', { ascending: false })
        .range(from, to);

      if (error) throw error;
      const typedData = (data || []).map(d => ({
        ...d,
        date_transaction: d.date  // Créer l'alias pour compatibilité
      })) as Depense[];
      
      // Cache first page only
      if (page === 1) {
        saveToCache('depenses-page1', typedData);
      }
      return typedData;
    },
    staleTime: 30000,
    placeholderData: () =>
      page === 1 ? (getFromCache<Depense[]>('depenses-page1', 30 * 60 * 1000) ?? undefined) : undefined,
  });

  // Memoize fetchAllForExport
  const fetchAllForExport = useCallback(async () => {
    const { data, error } = await supabase
      .from('depenses')
      .select(`
        *,
        rubrique:rubriques(id, code, libelle)
      `)
      .order('date_transaction', { ascending: false })
      .order('heure', { ascending: false });

    if (error) throw error;
    return data as Depense[];
  }, []);

  const createDepense = useMutation({
    mutationFn: async (depense: {
      rubrique_id: string;
      beneficiaire: string;
      motif: string;
      montant: number;
      montant_lettre?: string;
      observation?: string;
    }) => {
      if (!user?.id) {
        throw new Error('Session invalide ou expirée');
      }

      const { data, error } = await supabase
        .from('depenses')
        .insert({
          ...depense,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depenses-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({ title: 'Succès', description: 'Dépense enregistrée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateDepense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Depense> & { id: string }) => {
      const { data, error } = await supabase
        .from('depenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Dépense mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteDepense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('depenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depenses-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Dépense supprimée' });
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

  return {
    depenses,
    isLoading,
    error,
    totalCount,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize: handlePageSizeChange,
    createDepense,
    updateDepense,
    deleteDepense,
    fetchAllForExport,
  };
}
