import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocalUserRole } from './useLocalUserRole';
import { useLocalAuth } from '@/contexts/LocalAuthContext';

/**
 * Hook pour gérer automatiquement la rubrique "Solde du 31/10/2025"
 * Date de référence pour tous les opérations de l'application
 */
export function useSoldeMoisAnterieurs() {
  const { isAdmin } = useLocalUserRole();
  const { user } = useLocalAuth();
  const queryClient = useQueryClient();

  // Date de référence : 31/10/2025
  const REFERENCE_DATE = new Date(2025, 9, 31); // Mois 0-indexed, donc 9 = octobre

  const requiredSoldeRubriques = [
    { libelle: "Solde du 31/10/2025", imp: "707820" },
  ];

  // Fonction pour générer le libellé avec la date du mois en cours
  const generateSoldeLibelle = () => {
    return "Solde du 31/10/2025";
  };

  // Fonction pour vérifier si la rubrique du mois existe
  const checkMonthlySoldeRubrique = async () => {
    const libelle = generateSoldeLibelle();
    
    const { data, error } = await supabase
      .from('rubriques')
      .select('*')
      .eq('libelle', libelle)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification de la rubrique solde:', error);
      return null;
    }

    return data;
  };

  // Fonction pour créer la rubrique du mois si elle n'existe pas
  const createSoldeRubriqueWithLibelle = async (libelle: string, imp: string) => {
    const { data, error } = await supabase
      .from('rubriques')
      .insert({
        code: 'SOLDE-ANT',
        libelle,
        categorie: 'Recette',
        imp,
        no_beo: '',
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Erreur lors de la création de la rubrique solde');
    }

    return data;
  };

  const createMonthlySoldeRubrique = async () => {
    const libelle = generateSoldeLibelle();
    return createSoldeRubriqueWithLibelle(libelle, '000000');
  };

  // Query pour vérifier l'existence de la rubrique du mois
  const { data: soldeMoisRubrique, refetch } = useQuery({
    queryKey: ['solde-mois-anterieurs', 'Solde du 31/10/2025'],
    queryFn: checkMonthlySoldeRubrique,
    enabled: isAdmin, // Seulement pour les administrateurs
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour créer la rubrique
  const createSoldeRubrique = useMutation({
    mutationFn: createMonthlySoldeRubrique,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubriques'] });
      queryClient.invalidateQueries({ queryKey: ['solde-mois-anterieurs'] });
      refetch();
    },
  });

  // Effet pour créer automatiquement la rubrique si elle n'existe pas
  useEffect(() => {
    if (isAdmin && soldeMoisRubrique === null && !createSoldeRubrique.isPending) {
      // La rubrique n'existe pas, on la crée automatiquement
      createSoldeRubrique.mutate();
    }
  }, [isAdmin, soldeMoisRubrique, createSoldeRubrique]);

  useEffect(() => {
    if (!isAdmin) return;

    const ensureRequiredSoldeRubriques = async () => {
      for (const item of requiredSoldeRubriques) {
        // Vérifier d'abord par le code "SOLDE-ANT" car il a une contrainte d'unicité
        const { data, error } = await supabase
          .from('rubriques')
          .select('id, libelle, imp')
          .eq('code', 'SOLDE-ANT')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Erreur lors de la vérification de la rubrique solde spécifique:', error);
          continue;
        }

        // Si la rubrique n'existe pas, la créer
        if (!data) {
          try {
            await createSoldeRubriqueWithLibelle(item.libelle, item.imp);
            queryClient.invalidateQueries({ queryKey: ['rubriques'] });
          } catch (err) {
            console.error('Erreur lors de la création de la rubrique solde spécifique:', err);
          }
        }
        // Si elle existe, ne rien faire (pas besoin de la créer à nouveau)
      }
    };

    void ensureRequiredSoldeRubriques();
  }, [isAdmin, queryClient]);

  return {
    soldeMoisRubrique,
    generateSoldeLibelle,
    createSoldeRubrique,
  };
}
