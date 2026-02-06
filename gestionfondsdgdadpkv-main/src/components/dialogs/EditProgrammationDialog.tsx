/**
 * Dialogue de modification d'une programmation
 * Basé sur MODIFPGM.frm du système VB6
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
import { Save, X, Loader2, Calendar, Plus, Trash2 } from "lucide-react";
import { useRubriques } from "@/hooks/useRubriques";
import { montantEnLettre } from "@/lib/montantEnLettre";
import { Programmation } from "@/hooks/useProgrammations";

const moisNoms = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

interface EditProgrammationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programmation: Programmation | null;
  onSave: (data: Partial<Programmation>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function EditProgrammationDialog({
  open,
  onOpenChange,
  programmation,
  onSave,
  onDelete,
  isLoading = false,
}: EditProgrammationDialogProps) {
  const { rubriques } = useRubriques();
  const [formData, setFormData] = useState({
    designation: "",
    montant_prevu: "",
    montant_lettre: "",
    rubrique_id: "",
  });

  // Sync form data when programmation changes
  useEffect(() => {
    if (programmation) {
      setFormData({
        designation: programmation.designation,
        montant_prevu: String(programmation.montant_prevu),
        montant_lettre: programmation.montant_lettre || "",
        rubrique_id: programmation.rubrique_id || "",
      });
    }
  }, [programmation]);

  // Auto-convert montant to letters
  useEffect(() => {
    const montant = parseFloat(formData.montant_prevu);
    if (!isNaN(montant) && montant > 0) {
      setFormData(prev => ({
        ...prev,
        montant_lettre: montantEnLettre(montant),
      }));
    }
  }, [formData.montant_prevu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!programmation) return;

    await onSave({
      id: programmation.id,
      designation: formData.designation,
      montant_prevu: parseFloat(formData.montant_prevu),
      montant_lettre: formData.montant_lettre,
      rubrique_id: formData.rubrique_id || null,
    });
  };

  const handleDelete = async () => {
    if (!programmation || !onDelete) return;
    
    if (window.confirm("Voulez-vous supprimer cette rubrique de la programmation?")) {
      await onDelete(programmation.id);
      onOpenChange(false);
    }
  };

  if (!programmation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Modification Programmation Mensuelle
          </DialogTitle>
          <DialogDescription>
            Programmation N° {programmation.numero_ordre} - {moisNoms[programmation.mois - 1]} {programmation.annee}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info période (readonly) */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Période</Label>
              <p className="font-semibold">{moisNoms[programmation.mois - 1]} {programmation.annee}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">N° Ordre</Label>
              <p className="font-mono">{programmation.numero_ordre || '-'}</p>
            </div>
            {programmation.is_validated && (
              <div className="ml-auto">
                <span className="px-2 py-1 text-xs rounded-full bg-success/20 text-success font-medium">
                  Validée
                </span>
              </div>
            )}
          </div>

          {/* Rubrique */}
          <div className="space-y-2">
            <Label htmlFor="rubrique">Rubrique</Label>
            <Select
              value={formData.rubrique_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, rubrique_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une rubrique" />
              </SelectTrigger>
              <SelectContent>
                {(rubriques || []).filter(r => r.is_active).map((rubrique) => (
                  <SelectItem key={rubrique.id} value={rubrique.id}>
                    {rubrique.code} - {rubrique.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Désignation/Libellé */}
          <div className="space-y-2">
            <Label htmlFor="designation">Désignation / Libellé</Label>
            <Input
              id="designation"
              value={formData.designation}
              onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
              placeholder="Description de la ligne budgétaire"
              required
            />
          </div>

          {/* Montant prévu */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant Prévu (FC)</Label>
            <Input
              id="montant"
              type="number"
              min="0"
              step="0.01"
              value={formData.montant_prevu}
              onChange={(e) => setFormData(prev => ({ ...prev, montant_prevu: e.target.value }))}
              placeholder="0"
              className="text-right font-mono text-lg"
              required
            />
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
              className="italic text-muted-foreground text-sm"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading || programmation.is_validated}
                className="sm:mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
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
