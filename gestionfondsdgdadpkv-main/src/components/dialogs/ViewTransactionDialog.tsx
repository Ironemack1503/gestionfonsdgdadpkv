/**
 * Dialogue de visualisation détaillée d'une transaction (Recette/Dépense)
 * Affiche tous les détails incluant montant en lettres, soldes et signatures triple
 * Inspiré de SORTIEAAFICHAGE.frm et SORTIECAISSES.frm du système VB6
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, Printer, Download, Calendar, Clock, User, 
  FileText, Tag, Wallet, Hash, ArrowUpRight, ArrowDownRight,
  Building, PenLine, TrendingUp, TrendingDown, CheckCircle2
} from "lucide-react";
import { formatMontant } from "@/lib/utils";

interface TransactionDetails {
  id: string;
  type: 'recette' | 'depense';
  numero_bon: number;
  numero_beo?: string | null;
  date_transaction?: string;
  date?: string;
  heure: string;
  libelle?: string;
  motif: string;
  montant: number;
  montant_lettre?: string | null;
  imp?: string;
  observation?: string | null;
  // Soldes
  solde_avant?: number | null;
  solde_apres?: number | null;
  // Pour recettes
  provenance?: string;
  // Pour dépenses
  beneficiaire?: string;
  rubrique?: {
    id: string;
    code: string;
    libelle: string;
  } | null;
  service?: {
    id: string;
    code: string;
    libelle: string;
  } | null;
  // Signatures (optionnelles)
  signatures?: {
    compt?: { name?: string; signed?: boolean; date?: string };
    daf?: { name?: string; signed?: boolean; date?: string };
    dp?: { name?: string; signed?: boolean; date?: string };
  };
}

interface ViewTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDetails | null;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function ViewTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onPrint,
  onDownload,
}: ViewTransactionDialogProps) {
  if (!transaction) return null;

  const isRecette = transaction.type === 'recette';
  const typePrefix = isRecette ? 'REC' : 'DEP';
  const typeColor = isRecette ? 'success' : 'destructive';
  const typeLabel = isRecette ? 'Recette' : 'Dépense';
  const TrendIcon = isRecette ? ArrowUpRight : ArrowDownRight;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-${typeColor}/10 flex items-center justify-center`}>
              <TrendIcon className={`w-5 h-5 text-${typeColor}`} />
            </div>
            <div>
              <span>Détails de {typeLabel}</span>
              <Badge variant="outline" className={`ml-2 bg-${typeColor}/10 border-${typeColor}/30 text-${typeColor}`}>
                {typePrefix}-{String(transaction.numero_bon).padStart(4, "0")}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Informations complètes de la transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* En-tête avec numéros */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Hash className="w-4 h-4" />
                N° {typeLabel}
              </div>
              <p className="font-mono text-lg font-bold">
                {typePrefix}-{String(transaction.numero_bon).padStart(4, "0")}
              </p>
            </div>
            {transaction.numero_beo && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  N° BEO
                </div>
                <p className="font-mono text-lg font-bold">{transaction.numero_beo}</p>
              </div>
            )}
          </div>

          {/* Date et Heure */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
                <p className="font-semibold">
                  {new Date(transaction.date_transaction || transaction.date || '').toLocaleDateString("fr-FR", {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Heure</p>
                <p className="font-semibold">{transaction.heure}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Source/Destination */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <User className="w-4 h-4" />
              {isRecette ? 'Provenance' : 'Bénéficiaire'}
            </div>
            <p className="font-semibold text-lg">
              {isRecette ? transaction.provenance : transaction.beneficiaire}
            </p>
          </div>

          {/* Motif */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <PenLine className="w-4 h-4" />
              Motif / Désignation
            </div>
            <p className="text-base">{transaction.motif}</p>
          </div>

          {/* Rubrique et Service */}
          <div className="grid grid-cols-2 gap-4">
            {transaction.rubrique && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Tag className="w-4 h-4" />
                  Rubrique
                </div>
                <Badge className="bg-secondary/20 text-secondary-foreground">
                  {transaction.rubrique.code} - {transaction.rubrique.libelle}
                </Badge>
              </div>
            )}
            {transaction.service && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Building className="w-4 h-4" />
                  Service
                </div>
                <Badge variant="outline">
                  {transaction.service.code} - {transaction.service.libelle}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Montant principal */}
          <div className={`p-6 rounded-xl border-2 border-${typeColor}/30 bg-${typeColor}/5`}>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
              <Wallet className="w-4 h-4" />
              Montant
            </div>
            <div className={`flex items-center gap-3 text-${typeColor}`}>
              <TrendIcon className="w-8 h-8" />
              <span className="text-3xl font-bold">
                {isRecette ? '+' : '-'}{formatMontant(transaction.montant)} FC
              </span>
            </div>
            
          {/* Montant en lettres */}
            {transaction.montant_lettre && (
              <div className="mt-4 p-3 rounded-lg bg-background/60 border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  En lettres
                </p>
                <p className="text-sm italic text-foreground/80">
                  {transaction.montant_lettre}
                </p>
              </div>
            )}
          </div>

          {/* Soldes avant/après */}
          {(transaction.solde_avant !== null && transaction.solde_avant !== undefined) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Solde avant
                </div>
                <p className="text-lg font-bold text-foreground">
                  {formatMontant(transaction.solde_avant || 0)} FC
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <TrendingDown className="w-4 h-4" />
                  Solde après
                </div>
                <p className={`text-lg font-bold ${
                  (transaction.solde_apres || 0) >= (transaction.solde_avant || 0) 
                    ? 'text-success' 
                    : 'text-destructive'
                }`}>
                  {formatMontant(transaction.solde_apres || 0)} FC
                </p>
              </div>
            </div>
          )}

          {/* Observation */}
          {transaction.observation && (
            <div className="p-4 rounded-lg border bg-muted/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Observation
              </p>
              <p className="text-sm">{transaction.observation}</p>
            </div>
          )}

          {/* Zone signatures triple - COMPT, DAF, DP */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">Zone de signatures</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* COMPT */}
              <div className={`text-center p-4 rounded-lg border-2 transition-all ${
                transaction.signatures?.compt?.signed 
                  ? 'border-success/50 bg-success/5' 
                  : 'border-dashed border-muted-foreground/30 bg-muted/20'
              }`}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  COMPT
                </p>
                <p className="text-xs text-muted-foreground mt-1">Comptable</p>
                <div className="mt-3 min-h-[40px] flex items-center justify-center">
                  {transaction.signatures?.compt?.signed ? (
                    <div className="text-center">
                      <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
                      <p className="text-xs font-medium text-success">
                        {transaction.signatures.compt.name || 'Signé'}
                      </p>
                      {transaction.signatures.compt.date && (
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(transaction.signatures.compt.date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-lg text-muted-foreground/50">—</p>
                  )}
                </div>
              </div>

              {/* DAF */}
              <div className={`text-center p-4 rounded-lg border-2 transition-all ${
                transaction.signatures?.daf?.signed 
                  ? 'border-success/50 bg-success/5' 
                  : 'border-dashed border-muted-foreground/30 bg-muted/20'
              }`}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  DAF
                </p>
                <p className="text-xs text-muted-foreground mt-1">Dir. Admin. Fin.</p>
                <div className="mt-3 min-h-[40px] flex items-center justify-center">
                  {transaction.signatures?.daf?.signed ? (
                    <div className="text-center">
                      <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
                      <p className="text-xs font-medium text-success">
                        {transaction.signatures.daf.name || 'Signé'}
                      </p>
                      {transaction.signatures.daf.date && (
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(transaction.signatures.daf.date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-lg text-muted-foreground/50">—</p>
                  )}
                </div>
              </div>

              {/* DP */}
              <div className={`text-center p-4 rounded-lg border-2 transition-all ${
                transaction.signatures?.dp?.signed 
                  ? 'border-success/50 bg-success/5' 
                  : 'border-dashed border-muted-foreground/30 bg-muted/20'
              }`}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  DP
                </p>
                <p className="text-xs text-muted-foreground mt-1">Dir. Provincial</p>
                <div className="mt-3 min-h-[40px] flex items-center justify-center">
                  {transaction.signatures?.dp?.signed ? (
                    <div className="text-center">
                      <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
                      <p className="text-xs font-medium text-success">
                        {transaction.signatures.dp.name || 'Signé'}
                      </p>
                      {transaction.signatures.dp.date && (
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(transaction.signatures.dp.date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-lg text-muted-foreground/50">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
          {onDownload && (
            <Button
              type="button"
              variant="outline"
              onClick={onDownload}
              className="text-primary hover:bg-primary/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          )}
          {onPrint && (
            <Button
              type="button"
              onClick={onPrint}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
