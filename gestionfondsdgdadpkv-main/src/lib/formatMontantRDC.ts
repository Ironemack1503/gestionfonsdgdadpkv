/**
 * Module de correction et formatage des montants selon les normes RDC
 * 
 * Format standard RDC:
 * - Séparateur de milliers: espace
 * - Séparateur décimal: virgule
 * - Toujours 2 décimales
 * 
 * Exemple: 4 500,00 FC
 */

/**
 * Nettoie une chaîne de montant en supprimant les caractères non numériques
 * sauf les séparateurs potentiels (virgule, point, slash)
 */
function cleanAmount(input: string): string {
  if (typeof input !== 'string') {
    input = String(input);
  }
  return input.replace(/[^\d,./]/g, '');
}

/**
 * Détecte si le format utilise des slashes (ex: 4/500/00)
 */
function isSlashFormat(cleaned: string): boolean {
  return cleaned.includes('/');
}

/**
 * Convertit un format slash (4/500/00) en nombre
 * Le format slash suppose que les 2 derniers chiffres après le dernier slash sont les décimales
 */
function parseSlashFormat(cleaned: string): number {
  // Supprimer tous les slashes
  const sansSlash = cleaned.replace(/\//g, '');
  
  if (sansSlash.length >= 2) {
    const partieEntiere = sansSlash.slice(0, -2);
    const decimales = sansSlash.slice(-2);
    return parseFloat(`${partieEntiere || '0'}.${decimales}`);
  }
  
  return parseFloat(sansSlash) || 0;
}

/**
 * Détecte le séparateur décimal dans une chaîne
 * Retourne 'comma', 'dot', ou 'none'
 */
function detectDecimalSeparator(cleaned: string): 'comma' | 'dot' | 'none' {
  // Chercher le dernier point ou virgule suivi de 1-2 chiffres en fin de chaîne
  const commaMatch = cleaned.match(/,(\d{1,2})$/);
  const dotMatch = cleaned.match(/\.(\d{1,2})$/);
  
  if (commaMatch && dotMatch) {
    // Les deux sont présents, le plus à droite est le décimal
    const commaPos = cleaned.lastIndexOf(',');
    const dotPos = cleaned.lastIndexOf('.');
    return commaPos > dotPos ? 'comma' : 'dot';
  }
  
  if (commaMatch) return 'comma';
  if (dotMatch) return 'dot';
  
  // Cas ambigu: point suivi de 3 chiffres = séparateur de milliers, pas décimal
  const dotWith3Digits = cleaned.match(/\.(\d{3})$/);
  if (dotWith3Digits) return 'none';
  
  return 'none';
}

/**
 * Parse une chaîne de montant en nombre, gérant tous les formats possibles
 */
function parseAmount(input: string | number): number {
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : input;
  }
  
  const cleaned = cleanAmount(input);
  
  if (!cleaned) return 0;
  
  // Format slash: 4/500/00
  if (isSlashFormat(cleaned)) {
    return parseSlashFormat(cleaned);
  }
  
  const decimalSep = detectDecimalSeparator(cleaned);
  
  let normalized = cleaned;
  
  if (decimalSep === 'comma') {
    // Virgule = décimal, points = milliers
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (decimalSep === 'dot') {
    // Point = décimal, virgules = milliers
    normalized = cleaned.replace(/,/g, '');
  } else {
    // Pas de décimales détectées, traiter comme entier
    // Supprimer tous les séparateurs
    normalized = cleaned.replace(/[,\.]/g, '');
  }
  
  const result = parseFloat(normalized);
  return isNaN(result) ? 0 : result;
}

/**
 * Formate un nombre avec des espaces comme séparateurs de milliers
 */
function formatWithSpaces(integerPart: string): string {
  // Traiter de droite à gauche, insérer espace tous les 3 chiffres
  let result = '';
  let count = 0;
  
  for (let i = integerPart.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      result = ' ' + result;
    }
    result = integerPart[i] + result;
    count++;
  }
  
  return result;
}

/**
 * Fonction principale de formatage des montants selon les normes RDC
 * 
 * @param montant - Le montant à formater (string ou number)
 * @param options - Options de formatage
 * @returns Le montant formaté (ex: "4 500,00")
 */
export function formatMontantRDC(
  montant: string | number,
  options?: {
    showCurrency?: boolean;
    currencySymbol?: string;
    showSign?: boolean;
    decimals?: number;
  }
): string {
  const {
    showCurrency = false,
    currencySymbol = 'FC',
    showSign = false,
    decimals = 2
  } = options || {};
  
  // Parser le montant
  const value = parseAmount(montant);
  
  // Séparer partie entière et décimales
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const partieEntiere = Math.floor(absValue).toString();
  const partieDecimale = Math.round((absValue - Math.floor(absValue)) * Math.pow(10, decimals))
    .toString()
    .padStart(decimals, '0');
  
  // Formater avec espaces
  const formatted = formatWithSpaces(partieEntiere);
  
  // Assembler le résultat
  let result = `${formatted},${partieDecimale}`;
  
  // Ajouter le signe si négatif ou si demandé pour positif
  if (isNegative) {
    result = `-${result}`;
  } else if (showSign && value > 0) {
    result = `+${result}`;
  }
  
  // Ajouter la devise si demandée
  if (showCurrency) {
    result = `${result} ${currencySymbol}`;
  }
  
  return result;
}

/**
 * Corrige un montant mal formaté et retourne le format RDC correct
 * Fonction de correction automatique pour les imports/copier-coller
 * 
 * @param montant - Le montant potentiellement mal formaté
 * @returns Le montant corrigé au format RDC
 */
export function corrigerFormatMontant(montant: string | number): string {
  return formatMontantRDC(montant);
}

/**
 * Valide si un montant est correctement formaté selon les normes RDC
 * 
 * @param montant - Le montant à valider
 * @returns true si le format est correct
 */
export function isFormatRDCValide(montant: string): boolean {
  // Format attendu: chiffres, espaces comme séparateurs de milliers, virgule décimale, 2 décimales
  const formatRDC = /^-?\d{1,3}( \d{3})*,\d{2}( FC)?$/;
  return formatRDC.test(montant.trim());
}

/**
 * Parse un montant au format RDC et retourne un nombre
 * 
 * @param montant - Le montant au format RDC (ex: "4 500,00")
 * @returns Le nombre correspondant
 */
export function parseMontantRDC(montant: string): number {
  return parseAmount(montant);
}

/**
 * Tests unitaires intégrés pour validation
 */
export const testsFormatMontant = [
  { input: "4/500/00", expected: "4 500,00", description: "Format slash typique" },
  { input: "1.250.75", expected: "1 250,75", description: "Points comme séparateurs mixtes" },
  { input: "1234567", expected: "1 234 567,00", description: "Grand nombre sans format" },
  { input: "89,5", expected: "89,50", description: "Décimales incomplètes" },
  { input: "10.000", expected: "10 000,00", description: "Point comme séparateur de milliers" },
  { input: 4500, expected: "4 500,00", description: "Nombre JavaScript" },
  { input: "100/000/00", expected: "100 000,00", description: "Format slash grand nombre" },
  { input: "1,200.50", expected: "1 200,50", description: "Format américain" },
  { input: "12.345,60", expected: "12 345,60", description: "Format européen" },
  { input: "750 000", expected: "750 000,00", description: "Déjà avec espaces, sans décimales" },
  { input: "2 000,0", expected: "2 000,00", description: "Décimale unique" },
  { input: "-1500.75", expected: "-1 500,75", description: "Montant négatif" },
];

/**
 * Exécute les tests et retourne les résultats
 */
export function runTests(): { passed: number; failed: number; results: Array<{ input: any; expected: string; actual: string; passed: boolean; description: string }> } {
  const results = testsFormatMontant.map(test => {
    const actual = formatMontantRDC(test.input);
    const passed = actual === test.expected;
    return {
      input: test.input,
      expected: test.expected,
      actual,
      passed,
      description: test.description
    };
  });
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return { passed, failed, results };
}
