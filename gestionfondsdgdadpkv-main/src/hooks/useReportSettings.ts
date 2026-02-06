// Hook désactivé - les paramètres de mise en forme seront implémentés ultérieurement

export interface ReportSettings {
  id?: string;
  logo_url: string | null;
  titre_entete: string;
  sous_titre: string;
  contenu_pied_page: string;
  afficher_numero_page: boolean;
  afficher_date: boolean;
  afficher_nom_institution: boolean;
  police: string;
  taille_police: number;
  couleur_principale: string;
  marges_haut: number;
  marges_bas: number;
  marges_gauche: number;
  marges_droite: number;
  orientation: string;
  position_logo: string;
  filigrane_actif: boolean;
  filigrane_texte: string;
  ligne_entete_1: string;
  ligne_entete_2: string;
  ligne_entete_3: string;
  ligne_entete_4: string;
  ligne_pied_1: string;
  ligne_pied_2: string;
  ligne_pied_3: string;
  ligne_pied_4: string;
  position_tableau: string;
  alignement_contenu: string;
  espacement_tableau: number;
  couleur_entete_tableau: string;
  couleur_texte_entete: string;
  couleur_lignes_alternees: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
}

export const defaultReportSettings: ReportSettings = {
  logo_url: null,
  titre_entete: 'DIRECTION GÉNÉRALE DES DOUANES ET ACCISES',
  sous_titre: 'Rapport Financier',
  contenu_pied_page: 'DGDA - Document officiel',
  afficher_numero_page: true,
  afficher_date: true,
  afficher_nom_institution: true,
  police: 'helvetica',
  taille_police: 10,
  couleur_principale: '#1e40af',
  marges_haut: 15,
  marges_bas: 15,
  marges_gauche: 10,
  marges_droite: 10,
  orientation: 'portrait',
  position_logo: 'gauche',
  filigrane_actif: true,
  filigrane_texte: 'DGDA',
  ligne_entete_1: 'République Démocratique du Congo',
  ligne_entete_2: 'Ministère des Finances',
  ligne_entete_3: 'Direction Générale des Douanes et Accises',
  ligne_entete_4: 'Direction Provinciale de Kinshasa-Ville',
  ligne_pied_1: "Tous mobilisés pour une douane d'action et d'excellence !",
  ligne_pied_2: 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
  ligne_pied_3: 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
  ligne_pied_4: 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
  position_tableau: 'gauche',
  alignement_contenu: 'gauche',
  espacement_tableau: 10,
  couleur_entete_tableau: '#3b82f6',
  couleur_texte_entete: '#ffffff',
  couleur_lignes_alternees: '#f5f7fa',
};

export function useReportSettings() {
  return {
    settings: defaultReportSettings,
    isLoading: false,
    error: null,
    updateSettings: (_settings?: Partial<ReportSettings>) => {},
    resetSettings: () => {},
    isUpdating: false,
    isResetting: false,
  };
}

export function convertToExportSettings(dbSettings: ReportSettings) {
  return {
    useDefaultLogo: !dbSettings.logo_url,
    customLogoUrl: dbSettings.logo_url || undefined,
    showLogo: true,
    headerColor: dbSettings.couleur_entete_tableau || dbSettings.couleur_principale,
    headerTextColor: dbSettings.couleur_texte_entete || '#ffffff',
    alternateRowColor: dbSettings.couleur_lignes_alternees || '#f5f7fa',
    borderColor: '#e5e7eb',
    orientation: dbSettings.orientation as 'portrait' | 'landscape',
    fontSize: dbSettings.taille_police,
    margins: 'normal' as const,
    showWatermark: dbSettings.filigrane_actif,
    showFooter: true,
    showGenerationDate: dbSettings.afficher_date,
    customHeaderLine1: dbSettings.ligne_entete_1,
    customHeaderLine2: dbSettings.ligne_entete_2,
    customHeaderLine3: dbSettings.ligne_entete_3,
    customHeaderLine4: dbSettings.ligne_entete_4,
    useCustomHeader: true,
    customFooterLine1: dbSettings.ligne_pied_1,
    customFooterLine2: dbSettings.ligne_pied_2,
    customFooterLine3: dbSettings.ligne_pied_3,
    customFooterLine4: dbSettings.ligne_pied_4,
    useCustomFooter: true,
    tablePosition: dbSettings.position_tableau as 'gauche' | 'centre' | 'droite',
    contentAlignment: dbSettings.alignement_contenu as 'gauche' | 'centre' | 'droite',
    tableSpacing: dbSettings.espacement_tableau,
  };
}
