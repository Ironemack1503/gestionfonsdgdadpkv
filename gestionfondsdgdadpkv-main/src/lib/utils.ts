import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatMontantRDC, parseMontantRDC, corrigerFormatMontant } from "./formatMontantRDC";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en francs congolais selon les normes RDC
 * Séparateur de milliers: espace
 * Séparateur décimal: virgule
 * Toujours 2 décimales
 * 
 * @param montant - Le montant à formater (supporte les formats mal formatés)
 * @param options - Options de formatage
 * @returns Le montant formaté (ex: "1 234 567,89")
 */
export function formatMontant(
  montant: number | string,
  options?: {
    showCurrency?: boolean;
    showSign?: boolean;
  }
): string {
  return formatMontantRDC(montant, {
    showCurrency: options?.showCurrency,
    currencySymbol: 'FC',
    showSign: options?.showSign,
  });
}

// Re-export des fonctions utilitaires
export { parseMontantRDC, corrigerFormatMontant };
