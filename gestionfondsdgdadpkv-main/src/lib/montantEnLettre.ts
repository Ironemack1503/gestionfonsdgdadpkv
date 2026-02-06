/**
 * Module de conversion de montants en lettres
 * Basé sur la logique du système VB6 original
 * Supporte jusqu'à 999 999 999,99 Francs Congolais
 */

const chiffres = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 
  'six', 'sept', 'huit', 'neuf', 'dix', 
  'onze', 'douze', 'treize', 'quatorze', 'quinze',
  'seize', 'dix-sept', 'dix-huit', 'dix-neuf'
];

const dizaines = [
  '', '', 'vingt', 'trente', 'quarante', 'cinquante',
  'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'
];

/**
 * Convertit un nombre de 0 à 99 en lettres
 */
function convertirDizaine(n: number): string {
  if (n < 20) {
    return chiffres[n];
  }

  const unite = n % 10;
  const dizaine = Math.floor(n / 10);

  // Cas spéciaux pour 70-79 et 90-99
  if (dizaine === 7 || dizaine === 9) {
    if (unite === 1) {
      return `${dizaines[dizaine]}-et-${chiffres[10 + unite]}`;
    }
    return `${dizaines[dizaine]}-${chiffres[10 + unite]}`;
  }

  // Cas spécial pour 80
  if (dizaine === 8 && unite === 0) {
    return 'quatre-vingts';
  }

  // Cas avec "et" (21, 31, 41, 51, 61)
  if (unite === 1 && dizaine >= 2 && dizaine <= 6) {
    return `${dizaines[dizaine]}-et-un`;
  }

  // Cas général
  if (unite === 0) {
    return dizaines[dizaine];
  }

  return `${dizaines[dizaine]}-${chiffres[unite]}`;
}

/**
 * Convertit un nombre de 0 à 999 en lettres
 */
function convertirCentaine(n: number): string {
  if (n === 0) return '';
  if (n < 100) return convertirDizaine(n);

  const centaine = Math.floor(n / 100);
  const reste = n % 100;

  let result = '';

  if (centaine === 1) {
    result = 'cent';
  } else {
    result = `${chiffres[centaine]} cent`;
  }

  // Accord de "cent" au pluriel
  if (reste === 0 && centaine > 1) {
    result += 's';
  } else if (reste > 0) {
    result += ` ${convertirDizaine(reste)}`;
  }

  return result;
}

/**
 * Convertit un nombre entier en lettres
 */
function convertirEntier(n: number): string {
  if (n === 0) return 'zéro';
  if (n < 0) return `moins ${convertirEntier(-n)}`;

  const milliards = Math.floor(n / 1000000000);
  const millions = Math.floor((n % 1000000000) / 1000000);
  const milliers = Math.floor((n % 1000000) / 1000);
  const unites = n % 1000;

  const parties: string[] = [];

  // Milliards
  if (milliards > 0) {
    if (milliards === 1) {
      parties.push('un milliard');
    } else {
      parties.push(`${convertirCentaine(milliards)} milliards`);
    }
  }

  // Millions
  if (millions > 0) {
    if (millions === 1) {
      parties.push('un million');
    } else {
      parties.push(`${convertirCentaine(millions)} millions`);
    }
  }

  // Milliers
  if (milliers > 0) {
    if (milliers === 1) {
      parties.push('mille');
    } else {
      parties.push(`${convertirCentaine(milliers)} mille`);
    }
  }

  // Unités
  if (unites > 0) {
    parties.push(convertirCentaine(unites));
  }

  return parties.join(' ');
}

/**
 * Convertit un montant en lettres avec devise
 * @param montant - Le montant à convertir
 * @param devise - Le nom de la devise (défaut: "francs congolais")
 * @returns Le montant en lettres avec devise
 */
export function montantEnLettre(
  montant: number, 
  devise: string = 'francs congolais'
): string {
  if (montant === 0) {
    return `Zéro ${devise}`;
  }

  const partieEntiere = Math.floor(Math.abs(montant));
  const centimes = Math.round((Math.abs(montant) - partieEntiere) * 100);

  let resultat = convertirEntier(partieEntiere);
  
  // Mettre la première lettre en majuscule
  resultat = resultat.charAt(0).toUpperCase() + resultat.slice(1);

  // Ajouter la devise
  resultat += ` ${devise}`;

  // Ajouter les centimes si présents
  if (centimes > 0) {
    resultat += ` et ${convertirDizaine(centimes)} centimes`;
  }

  return resultat;
}

/**
 * Formate un montant en FC avec séparateurs selon les normes RDC
 * Utilise le nouveau module de formatage centralisé
 * @param montant - Le montant à formater
 * @returns Le montant formaté (ex: "1 250 000,00 FC")
 */
export { formatMontantRDC as formatMontant } from './formatMontantRDC';

/**
 * Génère un numéro de bon formaté
 * @param type - "BE" pour Bon d'Entrée, "BS" pour Bon de Sortie
 * @param numero - Le numéro séquentiel
 * @returns Le numéro formaté (ex: "BE-2024-001")
 */
export function genererNumeroBon(type: 'BE' | 'BS', numero: number): string {
  const annee = new Date().getFullYear();
  const numeroFormate = numero.toString().padStart(3, '0');
  return `${type}-${annee}-${numeroFormate}`;
}
