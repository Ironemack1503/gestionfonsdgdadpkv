import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useMemo } from 'react';
import type { Repartition } from '@/types/database';
import { montantEnLettre } from '@/lib/montantEnLettre';

const DEFAULT_PAGE_SIZE = 20;

export function useRepartitions(initialPageSize = DEFAULT_PAGE_SIZE) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Fetch total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['repartitions-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('repartitions')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
    staleTime: 60000,
  });

  // Fetch paginated repartitions
  const { data: repartitions = [], isLoading, error } = useQuery({
    queryKey: ['repartitions', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('repartitions')
        .select(`
          *,
          service:services(id, code, libelle)
        `)
        .order('date_repartition', { ascending: false })
        .order('numero_ordre', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data as Repartition[];
    },
    staleTime: 30000,
  });

  // Create repartition
  const createRepartition = useMutation({
    mutationFn: async (repartition: {
      numero_repartition: string;
      montant: number;
      service_id?: string;
      observation?: string;
      user_id: string;
    }) => {
      const montant_lettre = montantEnLettre(repartition.montant);
      
      const { data, error } = await supabase
        .from('repartitions')
        .insert({
          ...repartition,
          montant_lettre,
          date_repartition: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repartitions'] });
      queryClient.invalidateQueries({ queryKey: ['repartitions-count'] });
      toast({ title: 'Succès', description: 'Répartition enregistrée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Update repartition
  const updateRepartition = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Repartition> & { id: string }) => {
      if (updates.montant !== undefined) {
        updates.montant_lettre = montantEnLettre(updates.montant);
      }

      const { data, error } = await supabase
        .from('repartitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repartitions'] });
      toast({ title: 'Succès', description: 'Répartition mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Delete repartition
  const deleteRepartition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('repartitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repartitions'] });
      queryClient.invalidateQueries({ queryKey: ['repartitions-count'] });
      toast({ title: 'Succès', description: 'Répartition supprimée' });
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

  // Fetch all for export
  const fetchAllForExport = useCallback(async () => {
    const { data, error } = await supabase
      .from('repartitions')
      .select(`
        *,
        service:services(id, code, libelle)
      `)
      .order('date_repartition', { ascending: false });

    if (error) throw error;
    return data as Repartition[];
  }, []);

  // Calculer le total des répartitions
  const totalMontant = repartitions.reduce((sum, r) => sum + r.montant, 0);

  return {
    repartitions,
    totalMontant,
    isLoading,
    error,
    totalCount,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize: handlePageSizeChange,
    createRepartition,
    updateRepartition,
    deleteRepartition,
    fetchAllForExport,
  };
}
