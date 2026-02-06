/**
 * Utilitaire pour convertir un numéro de mois en nom de mois en lettres
 * Basé sur MLMOIS du système VB6 legacy
 */

const MOIS_EN_LETTRES: Record<number, string> = {
  1: 'JANVIER',
  2: 'FEVRIER',
  3: 'MARS',
  4: 'AVRIL',
  5: 'MAI',
  6: 'JUIN',
  7: 'JUILLET',
  8: 'AOUT',
  9: 'SEPTEMBRE',
  10: 'OCTOBRE',
  11: 'NOVEMBRE',
  12: 'DECEMBRE',
};

/**
 * Convertit un numéro de mois (1-12) en nom de mois en lettres majuscules
 */
export function getMoisEnLettre(mois: number): string {
  return MOIS_EN_LETTRES[mois] || '';
}

/**
 * Convertit une date en mois/année formaté
 * @param date Date au format ISO ou Date object
 * @returns Objet avec mois, annee, mois_lettre et mois_annee
 */
export function getInfosPeriode(date: Date | string): {
  mois: number;
  annee: number;
  mois_lettre: string;
  mois_annee: string;
} {
  const d = typeof date === 'string' ? new Date(date) : date;
  const mois = d.getMonth() + 1; // getMonth() retourne 0-11
  const annee = d.getFullYear();
  const mois_lettre = getMoisEnLettre(mois);
  const mois_annee = `${mois.toString().padStart(2, '0')}/${annee}`;

  return {
    mois,
    annee,
    mois_lettre,
    mois_annee,
  };
}

/**
 * Génère les champs de période à partir d'une date de transaction
 */
export function generatePeriodeFields(dateTransaction: string | Date) {
  return getInfosPeriode(dateTransaction);
}
