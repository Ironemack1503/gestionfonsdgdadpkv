/**
 * Dialogue de modification d'une recette
 * Basé sur MODIFENTREFEUIL.frm du système VB6
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
import { useServices } from "@/hooks/useServices";
import { montantEnLettre } from "@/lib/montantEnLettre";
import { Recette } from "@/hooks/useRecettes";

interface EditRecetteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recette: Recette | null;
  onSave: (data: Partial<Recette>) => Promise<void>;
  isLoading?: boolean;
}

export function EditRecetteDialog({
  open,
  onOpenChange,
  recette,
  onSave,
  isLoading = false,
}: EditRecetteDialogProps) {
  const { services } = useServices();
  const [formData, setFormData] = useState({
    date_transaction: "",
    numero_beo: "",
    libelle: "",
    provenance: "",
    motif: "",
    montant: "",
    montant_lettre: "",
    imp: "",
    observation: "",
    service_id: "",
  });

  // Sync form data when recette changes
  useEffect(() => {
    if (recette) {
      setFormData({
        date_transaction: recette.date_transaction || recette.date,
        numero_beo: recette.numero_beo || "",
        libelle: recette.libelle || "",
        provenance: recette.provenance,
        motif: recette.motif,
        montant: String(recette.montant),
        montant_lettre: recette.montant_lettre || "",
        imp: recette.imp || "",
        observation: recette.observation || "",
        service_id: recette.service_id || "",
      });
    }
  }, [recette]);

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
    
    if (!recette) return;

    await onSave({
      id: recette.id,
      date_transaction: formData.date_transaction,
      numero_beo: formData.numero_beo || null,
      libelle: formData.libelle,
      provenance: formData.provenance,
      motif: formData.motif,
      montant: parseFloat(formData.montant),
      montant_lettre: formData.montant_lettre,
      imp: formData.imp,
      observation: formData.observation,
      service_id: formData.service_id || null,
    });
  };

  if (!recette) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-success" />
            Modification Entrée Feuille de Caisse
          </DialogTitle>
          <DialogDescription>
            Modifier le bon d'entrée N° {recette.numero_bon}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Numéro de bon (readonly) */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">N° d'ord</Label>
              <p className="font-mono font-semibold text-lg">{String(recette.numero_bon).padStart(4, '0')}</p>
            </div>
            {recette.numero_beo && (
              <div>
                <Label className="text-xs text-muted-foreground">N° BEO</Label>
                <p className="font-mono">{recette.numero_beo}</p>
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

            {/* Désignation */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="libelle">LIBELLE *</Label>
              <Input
                id="libelle"
                value={formData.libelle}
                onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
                placeholder="Saisir la désignation"
                required
              />
            </div>

            {/* Montant en chiffres */}
            <div className="space-y-2">
              <Label htmlFor="montant">Recettes (CDF) *</Label>
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
            <Button type="submit" disabled={isLoading} className="bg-success hover:bg-success/90">
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
