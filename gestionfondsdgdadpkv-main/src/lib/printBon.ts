import { jsPDF } from 'jspdf';
import { formatMontant } from './utils';

export interface BonRecetteData {
  numero_bon: number;
  numero_beo?: string | null;
  date: string;
  heure: string;
  motif: string;
  provenance: string;
  montant: number;
  montant_lettre?: string | null;
  observation?: string | null;
  solde_avant?: number | null;
  solde_apres?: number | null;
}

export interface BonDepenseData {
  numero_bon: number;
  numero_beo?: string | null;
  date: string;
  heure: string;
  motif: string;
  beneficiaire: string;
  montant: number;
  montant_lettre?: string | null;
  observation?: string | null;
  solde_avant?: number | null;
  solde_apres?: number | null;
  rubrique?: {
    code: string;
    libelle: string;
  } | null;
}

export interface SignataireInfo {
  nom: string;
  grade: string;
  titre: string;
}

export interface SignatairesConfig {
  compt: SignataireInfo;
  daf: SignataireInfo;
  dp: SignataireInfo;
}

// Configuration par défaut des signataires (peut être surchargée via paramètres DB)
const DEFAULT_SIGNATAIRES: SignatairesConfig = {
  compt: {
    nom: '',
    grade: '',
    titre: 'Le Comptable'
  },
  daf: {
    nom: '',
    grade: '',
    titre: 'Le DAF'
  },
  dp: {
    nom: '',
    grade: '',
    titre: 'Le Directeur Provincial'
  }
};

const COLORS = {
  primary: [11, 60, 93] as [number, number, number],      // #0B3C5D - Bleu institutionnel
  secondary: [31, 111, 174] as [number, number, number],  // #1F6FAE - Bleu clair
  accent: [244, 196, 48] as [number, number, number],     // #F4C430 - Or
  success: [34, 139, 34] as [number, number, number],     // Vert pour recettes
  destructive: [180, 40, 40] as [number, number, number], // Rouge pour dépenses
  text: [30, 42, 56] as [number, number, number],         // #1E2A38
  muted: [100, 116, 139] as [number, number, number],
  light: [245, 247, 250] as [number, number, number],
  border: [200, 210, 220] as [number, number, number],
};

function drawInstitutionalHeader(doc: jsPDF, type: 'recette' | 'depense', numeroBon: number, numeroBeo?: string | null) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const color = type === 'recette' ? COLORS.success : COLORS.destructive;
  
  // En-tête officielle République Démocratique du Congo
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 52, 'F');
  
  // Ligne dorée sous l'en-tête
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 52, pageWidth, 2, 'F');
  
  // Texte République
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', pageWidth / 2, 10, { align: 'center' });
  
  // Ministère et Direction
  doc.setFontSize(8);
  doc.text('MINISTÈRE DES FINANCES', pageWidth / 2, 16, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DIRECTION GÉNÉRALE DES DOUANES ET ACCISES', pageWidth / 2, 24, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Direction Provinciale de Kinshasa-Ville', pageWidth / 2, 31, { align: 'center' });
  
  // Titre du bon
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const title = type === 'recette' ? 'BON D\'ENTRÉE EN CAISSE' : 'BON DE SORTIE DE CAISSE';
  doc.text(title, pageWidth / 2, 42, { align: 'center' });
  
  // Badge numéro du bon (coin supérieur droit)
  const bonPrefix = type === 'recette' ? 'BE' : 'BS';
  const bonText = `${bonPrefix}-${String(numeroBon).padStart(4, '0')}`;
  
  doc.setFillColor(...color);
  doc.roundedRect(pageWidth - 45, 6, 38, 12, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(bonText, pageWidth - 26, 14, { align: 'center' });
  
  // Badge BEO si disponible (sous le badge principal)
  if (numeroBeo) {
    doc.setFillColor(...COLORS.secondary);
    doc.roundedRect(pageWidth - 45, 20, 38, 10, 2, 2, 'F');
    doc.setFontSize(7);
    doc.text(`BEO: ${numeroBeo}`, pageWidth - 26, 27, { align: 'center' });
  }
}

function drawInfoSection(doc: jsPDF, label: string, value: string, y: number, isHighlighted: boolean = false) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const labelWidth = 38;
  
  // Fond pour le label
  if (isHighlighted) {
    doc.setFillColor(...COLORS.secondary);
  } else {
    doc.setFillColor(...COLORS.light);
  }
  doc.roundedRect(margin, y - 4, labelWidth, 9, 1, 1, 'F');
  
  // Label
  if (isHighlighted) {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(...COLORS.muted);
  }
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(label.toUpperCase(), margin + 2, y + 2);
  
  // Valeur
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Gérer le texte long avec retour à la ligne
  const maxWidth = pageWidth - margin - labelWidth - 20;
  const lines = doc.splitTextToSize(value, maxWidth);
  doc.text(lines[0] || '', margin + labelWidth + 5, y + 2);
  
  // Ligne de séparation subtile
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(margin + labelWidth + 5, y + 5, pageWidth - margin, y + 5);
  
  return lines.length > 1 ? 8 : 0; // Retourner l'espace supplémentaire si multi-lignes
}

function drawAmountSection(doc: jsPDF, amount: number, amountInWords: string | null | undefined, type: 'recette' | 'depense', y: number, soldeAvant?: number | null, soldeApres?: number | null) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const boxWidth = pageWidth - margin * 2;
  const color = type === 'recette' ? COLORS.success : COLORS.destructive;
  
  // Boîte principale du montant
  doc.setFillColor(...color);
  doc.setDrawColor(...color);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, y, boxWidth, 28, 3, 3, 'FD');
  
  // Label "MONTANT"
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTANT', margin + 8, y + 8);
  
  // Montant en chiffres
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const prefix = type === 'recette' ? '+' : '-';
  doc.text(`${prefix} ${formatMontant(amount)} FC`, margin + 8, y + 20);
  
  // Montant en lettres si disponible
  if (amountInWords) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(255, 255, 255);
    const words = amountInWords.length > 55 ? amountInWords.substring(0, 55) + '...' : amountInWords;
    doc.text(`(${words})`, margin + 8, y + 26);
  }
  
  // Section des soldes si disponibles
  if (soldeAvant !== null && soldeAvant !== undefined) {
    const soldeY = y + 32;
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, soldeY, boxWidth / 2 - 2, 12, 2, 2, 'F');
    doc.roundedRect(margin + boxWidth / 2 + 2, soldeY, boxWidth / 2 - 2, 12, 2, 2, 'F');
    
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('SOLDE AVANT', margin + 4, soldeY + 4);
    doc.text('SOLDE APRÈS', margin + boxWidth / 2 + 6, soldeY + 4);
    
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatMontant(soldeAvant || 0)} FC`, margin + 4, soldeY + 10);
    doc.text(`${formatMontant(soldeApres || 0)} FC`, margin + boxWidth / 2 + 6, soldeY + 10);
    
    return 48; // Hauteur totale avec soldes
  }
  
  return 32; // Hauteur sans soldes
}

function drawTripleSignatureSection(doc: jsPDF, y: number, signataires: SignatairesConfig = DEFAULT_SIGNATAIRES) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const boxWidth = (pageWidth - margin * 2 - 8) / 3;
  
  // Titre de section
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('VISA ET SIGNATURES', pageWidth / 2, y - 3, { align: 'center' });
  
  // Configuration des trois colonnes de signature
  const signatureBoxes = [
    { 
      label: 'COMPT', 
      subtitle: signataires.compt.titre,
      nom: signataires.compt.nom,
      grade: signataires.compt.grade,
      x: margin 
    },
    { 
      label: 'DAF', 
      subtitle: signataires.daf.titre,
      nom: signataires.daf.nom,
      grade: signataires.daf.grade,
      x: margin + boxWidth + 4 
    },
    { 
      label: 'DP', 
      subtitle: signataires.dp.titre,
      nom: signataires.dp.nom,
      grade: signataires.dp.grade,
      x: margin + (boxWidth + 4) * 2 
    }
  ];
  
  signatureBoxes.forEach(box => {
    // Fond de la boîte
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(box.x, y, boxWidth, 38, 2, 2, 'F');
    
    // Bordure
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(box.x, y, boxWidth, 38, 2, 2, 'S');
    
    // Label (COMPT, DAF, DP)
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(box.x + 2, y + 2, boxWidth - 4, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(box.label, box.x + boxWidth / 2, y + 7, { align: 'center' });
    
    // Sous-titre (fonction)
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text(box.subtitle, box.x + boxWidth / 2, y + 14, { align: 'center' });
    
    // Nom du signataire si renseigné
    if (box.nom) {
      doc.setTextColor(...COLORS.text);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(box.nom, box.x + boxWidth / 2, y + 20, { align: 'center' });
      
      if (box.grade) {
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.text(box.grade, box.x + boxWidth / 2, y + 24, { align: 'center' });
      }
    }
    
    // Ligne de signature
    doc.setDrawColor(...COLORS.muted);
    doc.setLineWidth(0.3);
    doc.line(box.x + 4, y + 32, box.x + boxWidth - 4, y + 32);
    
    // Texte "Signature et cachet"
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(4);
    doc.setFont('helvetica', 'italic');
    doc.text('Signature et cachet', box.x + boxWidth / 2, y + 36, { align: 'center' });
  });
}

function drawFooter(doc: jsPDF, date: string, heure: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Pied de page
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');
  
  // Ligne dorée
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, pageHeight - 16, pageWidth, 1, 'F');
  
  // Texte du pied de page
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  
  const generatedText = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(generatedText, 12, pageHeight - 6);
  
  doc.text('DGDA - Direction Provinciale Kinshasa-Ville', pageWidth - 12, pageHeight - 6, { align: 'right' });
  
  // Filigrane discret "ORIGINAL"
  doc.setTextColor(220, 220, 220);
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.text('ORIGINAL', pageWidth / 2, pageHeight / 2, { 
    align: 'center', 
    angle: 45,
  });
}

export function printBonRecette(data: BonRecetteData, signataires?: SignatairesConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });
  
  // En-tête institutionnelle
  drawInstitutionalHeader(doc, 'recette', data.numero_bon, data.numero_beo);
  
  // Section informations
  let y = 62;
  
  drawInfoSection(doc, 'Date', new Date(data.date).toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), y);
  
  y += 12;
  drawInfoSection(doc, 'Heure', data.heure.slice(0, 5), y);
  
  y += 12;
  drawInfoSection(doc, 'Provenance', data.provenance, y, true);
  
  y += 12;
  drawInfoSection(doc, 'Motif', data.motif, y);
  
  if (data.observation) {
    y += 12;
    drawInfoSection(doc, 'Observation', data.observation, y);
  }
  
  // Section montant
  y += 16;
  const amountHeight = drawAmountSection(doc, data.montant, data.montant_lettre, 'recette', y, data.solde_avant, data.solde_apres);
  
  // Section signatures triple
  y += amountHeight + 8;
  drawTripleSignatureSection(doc, y, signataires);
  
  // Pied de page
  drawFooter(doc, data.date, data.heure);
  
  // Ouvrir dans un nouvel onglet
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

export function printBonDepense(data: BonDepenseData, signataires?: SignatairesConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });
  
  // En-tête institutionnelle
  drawInstitutionalHeader(doc, 'depense', data.numero_bon, data.numero_beo);
  
  // Section informations
  let y = 62;
  
  drawInfoSection(doc, 'Date', new Date(data.date).toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), y);
  
  y += 12;
  drawInfoSection(doc, 'Heure', data.heure.slice(0, 5), y);
  
  y += 12;
  drawInfoSection(doc, 'Bénéficiaire', data.beneficiaire, y, true);
  
  y += 12;
  drawInfoSection(doc, 'Motif', data.motif, y);
  
  if (data.rubrique) {
    y += 12;
    drawInfoSection(doc, 'Rubrique', `${data.rubrique.code} - ${data.rubrique.libelle}`, y);
  }
  
  if (data.observation) {
    y += 12;
    drawInfoSection(doc, 'Observation', data.observation, y);
  }
  
  // Section montant
  y += 16;
  const amountHeight = drawAmountSection(doc, data.montant, data.montant_lettre, 'depense', y, data.solde_avant, data.solde_apres);
  
  // Section signatures triple
  y += amountHeight + 8;
  drawTripleSignatureSection(doc, y, signataires);
  
  // Pied de page
  drawFooter(doc, data.date, data.heure);
  
  // Ouvrir dans un nouvel onglet
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

// Téléchargement de bons
export function downloadBonRecette(data: BonRecetteData, signataires?: SignatairesConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });
  
  drawInstitutionalHeader(doc, 'recette', data.numero_bon, data.numero_beo);
  
  let y = 62;
  drawInfoSection(doc, 'Date', new Date(data.date).toLocaleDateString('fr-FR', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }), y);
  
  y += 12;
  drawInfoSection(doc, 'Heure', data.heure.slice(0, 5), y);
  y += 12;
  drawInfoSection(doc, 'Provenance', data.provenance, y, true);
  y += 12;
  drawInfoSection(doc, 'Motif', data.motif, y);
  
  if (data.observation) {
    y += 12;
    drawInfoSection(doc, 'Observation', data.observation, y);
  }
  
  y += 16;
  const amountHeight = drawAmountSection(doc, data.montant, data.montant_lettre, 'recette', y, data.solde_avant, data.solde_apres);
  
  y += amountHeight + 8;
  drawTripleSignatureSection(doc, y, signataires);
  
  drawFooter(doc, data.date, data.heure);
  
  doc.save(`bon-entree-BE-${String(data.numero_bon).padStart(4, '0')}.pdf`);
}

export function downloadBonDepense(data: BonDepenseData, signataires?: SignatairesConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });
  
  drawInstitutionalHeader(doc, 'depense', data.numero_bon, data.numero_beo);
  
  let y = 62;
  drawInfoSection(doc, 'Date', new Date(data.date).toLocaleDateString('fr-FR', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }), y);
  
  y += 12;
  drawInfoSection(doc, 'Heure', data.heure.slice(0, 5), y);
  y += 12;
  drawInfoSection(doc, 'Bénéficiaire', data.beneficiaire, y, true);
  y += 12;
  drawInfoSection(doc, 'Motif', data.motif, y);
  
  if (data.rubrique) {
    y += 12;
    drawInfoSection(doc, 'Rubrique', `${data.rubrique.code} - ${data.rubrique.libelle}`, y);
  }
  
  if (data.observation) {
    y += 12;
    drawInfoSection(doc, 'Observation', data.observation, y);
  }
  
  y += 16;
  const amountHeight = drawAmountSection(doc, data.montant, data.montant_lettre, 'depense', y, data.solde_avant, data.solde_apres);
  
  y += amountHeight + 8;
  drawTripleSignatureSection(doc, y, signataires);
  
  drawFooter(doc, data.date, data.heure);
  
  doc.save(`bon-sortie-BS-${String(data.numero_bon).padStart(4, '0')}.pdf`);
}
