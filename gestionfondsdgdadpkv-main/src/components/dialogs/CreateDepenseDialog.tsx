/**
 * Dialogue de création d'une nouvelle dépense
 * Basé sur les formulaires VB6 de saisie de sortie
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
import { Save, X, Loader2, Plus } from "lucide-react";
import { useRubriques } from "@/hooks/useRubriques";
import { useServices } from "@/hooks/useServices";
import { montantEnLettre } from "@/lib/montantEnLettre";

interface CreateDepenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    date_transaction: string;
    beneficiaire: string;
    motif: string;
    montant: number;
    montant_lettre: string;
    observation?: string;
    rubrique_id?: string;
    service_id?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateDepenseDialog({
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}: CreateDepenseDialogProps) {
  const { rubriques } = useRubriques();
  const { services } = useServices();
  const [formData, setFormData] = useState({
    date_transaction: new Date().toISOString().split('T')[0],
    beneficiaire: "",
    motif: "",
    montant: "",
    montant_lettre: "",
    observation: "",
    rubrique_id: "",
    service_id: "",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        date_transaction: new Date().toISOString().split('T')[0],
        beneficiaire: "",
        motif: "",
        montant: "",
        montant_lettre: "",
        observation: "",
        rubrique_id: "",
        service_id: "",
      });
    }
  }, [open]);

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
    
    await onSave({
      date_transaction: formData.date_transaction,
      beneficiaire: formData.beneficiaire,
      motif: formData.motif,
      montant: parseFloat(formData.montant),
      montant_lettre: formData.montant_lettre,
      observation: formData.observation || undefined,
      rubrique_id: formData.rubrique_id || undefined,
      service_id: formData.service_id || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-destructive" />
            Nouvelle Sortie de Caisse
          </DialogTitle>
          <DialogDescription>
            Créer un nouveau bon de sortie de caisse
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date Transaction</Label>
              <Input
                id="date"
                type="date"
                value={formData.date_transaction}
                onChange={(e) => setFormData(prev => ({ ...prev, date_transaction: e.target.value }))}
                required
              />
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

            {/* Service */}
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select
                value={formData.service_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {(services || []).filter(s => s.is_active).map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.code} - {service.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bénéficiaire */}
            <div className="space-y-2">
              <Label htmlFor="beneficiaire">Bénéficiaire</Label>
              <Input
                id="beneficiaire"
                value={formData.beneficiaire}
                onChange={(e) => setFormData(prev => ({ ...prev, beneficiaire: e.target.value }))}
                placeholder="Nom du bénéficiaire"
                required
              />
            </div>

            {/* Motif */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="motif">Motif</Label>
              <Input
                id="motif"
                value={formData.motif}
                onChange={(e) => setFormData(prev => ({ ...prev, motif: e.target.value }))}
                placeholder="Motif de la sortie"
                required
              />
            </div>

            {/* Montant en chiffres */}
            <div className="space-y-2">
              <Label htmlFor="montant">Montant en Chiffres (FC)</Label>
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

            {/* Montant en lettres */}
            <div className="space-y-2 md:col-span-2">
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
          </div>

          {/* Observation */}
          <div className="space-y-2">
            <Label htmlFor="observation">Observation</Label>
            <Textarea
              id="observation"
              value={formData.observation}
              onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))}
              placeholder="Notes additionnelles..."
              rows={2}
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
