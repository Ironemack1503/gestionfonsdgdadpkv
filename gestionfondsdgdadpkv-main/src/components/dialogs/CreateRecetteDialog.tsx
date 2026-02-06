/**
 * Dialogue de création d'une nouvelle recette
 * Basé sur les formulaires VB6 de saisie d'entrée
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
import { useServices } from "@/hooks/useServices";
import { montantEnLettre } from "@/lib/montantEnLettre";

interface CreateRecetteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    date_transaction: string;
    provenance: string;
    motif: string;
    montant: number;
    montant_lettre: string;
    observation?: string;
    service_id?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateRecetteDialog({
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}: CreateRecetteDialogProps) {
  const { services } = useServices();
  const [formData, setFormData] = useState({
    date_transaction: new Date().toISOString().split('T')[0],
    provenance: "",
    motif: "",
    montant: "",
    montant_lettre: "",
    observation: "",
    service_id: "",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        date_transaction: new Date().toISOString().split('T')[0],
        provenance: "",
        motif: "",
        montant: "",
        montant_lettre: "",
        observation: "",
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
      provenance: formData.provenance,
      motif: formData.motif,
      montant: parseFloat(formData.montant),
      montant_lettre: formData.montant_lettre,
      observation: formData.observation || undefined,
      service_id: formData.service_id || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-success" />
            Nouvelle Entrée de Caisse
          </DialogTitle>
          <DialogDescription>
            Créer un nouveau bon d'entrée en caisse
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

            {/* Provenance */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="provenance">Provenance / Client</Label>
              <Input
                id="provenance"
                value={formData.provenance}
                onChange={(e) => setFormData(prev => ({ ...prev, provenance: e.target.value }))}
                placeholder="Nom du client ou service"
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
                placeholder="Motif de l'entrée"
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
