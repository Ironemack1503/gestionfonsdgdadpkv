import { Rubrique } from "@/hooks/useRubriques";

/**
 * Vérifie si une rubrique est la rubrique spéciale "Solde du mois (antérieur)"
 */
export function isSoldeMoisAnterieurs(
  rubrique: Rubrique | { code?: string; libelle?: string; imp?: string | null }
): boolean {
  return (
    rubrique.code === 'SOLDE-ANT' || 
    (rubrique.libelle?.includes('Solde du mois (antérieur)') ?? false) ||
    rubrique.libelle === 'Solde du 31/10/2025' ||
    rubrique.imp === '707820'
  );
}

/**
 * Trie les rubriques en plaçant "Solde du mois (antérieur)" en première position
 * Cette rubrique doit toujours apparaître en haut des rapports (Feuille de caisse, Sommaire)
 */
export function sortRubriquesWithSoldeFirst<
  T extends Rubrique | { code?: string; libelle?: string; imp?: string | null }
>(
  rubriques: T[]
): T[] {
  return [...rubriques].sort((a, b) => {
    const aIsSolde = isSoldeMoisAnterieurs(a);
    const bIsSolde = isSoldeMoisAnterieurs(b);

    // Si a est solde et b ne l'est pas, a vient en premier
    if (aIsSolde && !bIsSolde) return -1;
    
    // Si b est solde et a ne l'est pas, b vient en premier
    if (!aIsSolde && bIsSolde) return 1;
    
    // Sinon, tri par code ou libellé
    const aCode = a.code || '';
    const bCode = b.code || '';
    return aCode.localeCompare(bCode);
  });
}

/**
 * Trie les opérations en plaçant les transactions liées à "Solde du 31/10/2025" en premier
 */
export function sortOperationsWithSoldeFirst<T extends { designation?: string; rubrique?: string }>(
  operations: T[]
): T[] {
  return [...operations].sort((a, b) => {
    const aIsSolde = 
      (a.designation?.includes('Solde du mois (antérieur)') || 
      a.rubrique?.includes('Solde du mois (antérieur)') ||
      a.designation?.includes('Solde du 31/10/2025') ||
      a.rubrique?.includes('Solde du 31/10/2025'));
    const bIsSolde = 
      (b.designation?.includes('Solde du mois (antérieur)') || 
      b.rubrique?.includes('Solde du mois (antérieur)') ||
      b.designation?.includes('Solde du 31/10/2025') ||
      b.rubrique?.includes('Solde du 31/10/2025'));

    // Si a est solde et b ne l'est pas, a vient en premier
    if (aIsSolde && !bIsSolde) return -1;
    
    // Si b est solde et a ne l'est pas, b vient en premier
    if (!aIsSolde && bIsSolde) return 1;
    
    // Sinon, conserver l'ordre original
    return 0;
  });
}
