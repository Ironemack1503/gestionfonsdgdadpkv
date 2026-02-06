/**
 * Dialogue de modification d'une dépense
 * Basé sur MODIFSORTFEUILLE.frm du système VB6
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, Loader2, FileText } from "lucide-react";
import { useRubriques } from "@/hooks/useRubriques";
import { useServices } from "@/hooks/useServices";
import { montantEnLettre } from "@/lib/montantEnLettre";
import { Depense } from "@/hooks/useDepenses";

interface EditDepenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depense: Depense | null;
  onSave: (data: Partial<Depense>) => Promise<void>;
  isLoading?: boolean;
}

export function EditDepenseDialog({
  open,
  onOpenChange,
  depense,
  onSave,
  isLoading = false,
}: EditDepenseDialogProps) {
  const { rubriques } = useRubriques();
  const { services } = useServices();
  const [formData, setFormData] = useState({
    date_transaction: "",
    numero_beo: "",
    libelle: "",
    beneficiaire: "",
    motif: "",
    montant: "",
    montant_lettre: "",
    imp: "",
    observation: "",
    rubrique_id: "",
    service_id: "",
  });

  // Sync form data when depense changes
  useEffect(() => {
    if (depense) {
      setFormData({
        date_transaction: depense.date_transaction || depense.date,
        numero_beo: depense.numero_beo || "",
        libelle: depense.libelle || "",
        beneficiaire: depense.beneficiaire,
        motif: depense.motif,
        montant: String(depense.montant),
        montant_lettre: depense.montant_lettre || "",
        imp: depense.imp || "",
        observation: depense.observation || "",
        rubrique_id: depense.rubrique_id || "",
        service_id: depense.service_id || "",
      });
    }
  }, [depense]);

  // Auto-convert montant to letters
  useEffect(() => {
    const montant = parseFloat(formData.montant);
    if (!isNaN(montant) && montant > 0) {
      setFormData(prev => ({
        ...prev,
        montant_lettre: montantEnLettre(montant),
      }));
    }
  }, [formData.montant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depense) return;

    await onSave({
      id: depense.id,
      date_transaction: formData.date_transaction,
      numero_beo: formData.numero_beo || null,
      libelle: formData.libelle,
      beneficiaire: formData.beneficiaire,
      motif: formData.motif,
      montant: parseFloat(formData.montant),
      montant_lettre: formData.montant_lettre,
      imp: formData.imp,
      observation: formData.observation,
      rubrique_id: formData.rubrique_id || null,
      service_id: formData.service_id || null,
    });
  };

  if (!depense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-destructive" />
            Modification Sortie Feuille de Caisse
          </DialogTitle>
          <DialogDescription>
            Modifier le bon de sortie N° {depense.numero_bon}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Numéro de bon (readonly) */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">N° d'ord</Label>
              <p className="font-mono font-semibold text-lg">{String(depense.numero_bon).padStart(4, '0')}</p>
            </div>
            {depense.numero_beo && (
              <div>
                <Label className="text-xs text-muted-foreground">N° BEO</Label>
                <p className="font-mono">{depense.numero_beo}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date d'enregistrement *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date_transaction}
                onChange={(e) => setFormData(prev => ({ ...prev, date_transaction: e.target.value }))}
                required
              />
            </div>

            {/* N°BEO */}
            <div className="space-y-2">
              <Label htmlFor="numero_beo">N°BEO (4 chiffres)</Label>
              <Input
                id="numero_beo"
                value={formData.numero_beo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormData(prev => ({ ...prev, numero_beo: value }));
                }}
                placeholder="0000"
                maxLength={4}
              />
            </div>

            {/* LIBELLE */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="libelle">LIBELLE *</Label>
              <Input
                id="libelle"
                value={formData.libelle}
                onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
                placeholder="Saisie libre du LIBELLE"
                required
              />
            </div>

            {/* Montant en chiffres */}
            <div className="space-y-2">
              <Label htmlFor="montant">Dépenses (CDF) *</Label>
              <Input
                id="montant"
                type="number"
                min="0"
                step="0.01"
                value={formData.montant}
                onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                placeholder="0"
                className="text-right font-mono text-lg"
                required
              />
            </div>

            {/* Code IMP */}
            <div className="space-y-2">
              <Label htmlFor="imp">Code IMP *</Label>
              <Input
                id="imp"
                value={formData.imp}
                onChange={(e) => setFormData(prev => ({ ...prev, imp: e.target.value }))}
                placeholder="Code IMP"
                required
              />
            </div>
          </div>

          {/* Montant en lettres */}
          <div className="space-y-2">
            <Label htmlFor="montant_lettre">Montant en Lettres</Label>
            <Textarea
              id="montant_lettre"
              value={formData.montant_lettre}
              onChange={(e) => setFormData(prev => ({ ...prev, montant_lettre: e.target.value }))}
              placeholder="Sera généré automatiquement"
              rows={2}
              className="italic text-muted-foreground"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
