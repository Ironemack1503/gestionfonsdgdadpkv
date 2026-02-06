import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useMemo } from 'react';
import type { Depense } from '@/types/database';
import { montantEnLettre } from '@/lib/montantEnLettre';
import { generatePeriodeFields } from '@/lib/moisEnLettre';

const DEFAULT_PAGE_SIZE = 20;

export function useCloudDepenses(initialPageSize = DEFAULT_PAGE_SIZE) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Fetch total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['cloud-depenses-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('depenses')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
    staleTime: 60000,
  });

  // Fetch paginated depenses
  const { data: depenses = [], isLoading, error } = useQuery({
    queryKey: ['cloud-depenses', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('depenses')
        .select(`
          *,
          rubrique:rubriques(id, code, libelle),
          service:services(id, code, libelle)
        `)
        .order('date_transaction', { ascending: false })
        .order('heure', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data as Depense[];
    },
    staleTime: 30000,
  });

  // Create depense
  const createDepense = useMutation({
    mutationFn: async (depense: {
      beneficiaire: string;
      motif: string;
      montant: number;
      rubrique_id?: string;
      numero_beo?: string;
      observation?: string;
      service_id?: string;
      code_contentieux?: string;
      user_id: string;
    }) => {
      const montant_lettre = montantEnLettre(depense.montant);
      const dateTransaction = new Date().toISOString().split('T')[0];
      const periodeFields = generatePeriodeFields(dateTransaction);
      
      const { data, error } = await supabase
        .from('depenses')
        .insert({
          ...depense,
          montant_lettre,
          date_transaction: dateTransaction,
          heure: new Date().toTimeString().split(' ')[0],
          ...periodeFields,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloud-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['cloud-depenses-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Dépense enregistrée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Update depense
  const updateDepense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Depense> & { id: string }) => {
      // Recalculer le montant en lettres si le montant change
      if (updates.montant !== undefined) {
        updates.montant_lettre = montantEnLettre(updates.montant);
      }

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
      queryClient.invalidateQueries({ queryKey: ['cloud-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Succès', description: 'Dépense mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Delete depense
  const deleteDepense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('depenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloud-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['cloud-depenses-count'] });
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

  // Fetch all for export
  const fetchAllForExport = useCallback(async () => {
    const { data, error } = await supabase
      .from('depenses')
      .select(`
        *,
        rubrique:rubriques(id, code, libelle),
        service:services(id, code, libelle)
      `)
      .order('date_transaction', { ascending: false });

    if (error) throw error;
    return data as Depense[];
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
