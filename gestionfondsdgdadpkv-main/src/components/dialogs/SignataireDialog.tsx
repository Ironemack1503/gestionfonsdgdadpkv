/**
 * Dialogue de gestion des signataires
 * Basé sur SIGNATAIRE.frm du système VB6
 * Permet de configurer les noms des signataires COMPT, DAF, DP
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, Loader2, UserCheck, Users, Shield, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface Signataire {
  type: 'COMPT' | 'DAF' | 'DP';
  nom: string;
  grade: string;
  titre: string;
}

interface SignataireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signataires: Signataire[];
  onSave: (signataires: Signataire[]) => Promise<void>;
  isLoading?: boolean;
}

const defaultSignataires: Signataire[] = [
  { type: 'COMPT', nom: '', grade: '', titre: 'Le Comptable' },
  { type: 'DAF', nom: '', grade: '', titre: 'Le Sous-Directeur chargé de l\'Administration et des Finances' },
  { type: 'DP', nom: '', grade: '', titre: 'Le Directeur Provincial' },
];

const gradeOptions = [
  'Agent de bureau',
  'Attaché de bureau',
  'Assistant administratif',
  'Contrôleur',
  'Inspecteur',
  'Sous-Directeur',
  'Directeur',
  'Directeur Provincial',
  'Inspecteur Général',
];

export function SignataireDialog({
  open,
  onOpenChange,
  signataires: initialSignataires,
  onSave,
  isLoading = false,
}: SignataireDialogProps) {
  const { toast } = useToast();
  const [signataires, setSignataires] = useState<Signataire[]>(defaultSignataires);

  useEffect(() => {
    if (initialSignataires && initialSignataires.length > 0) {
      setSignataires(initialSignataires);
    } else {
      setSignataires(defaultSignataires);
    }
  }, [initialSignataires]);

  const updateSignataire = (type: 'COMPT' | 'DAF' | 'DP', field: keyof Signataire, value: string) => {
    setSignataires(prev => 
      prev.map(s => 
        s.type === type ? { ...s, [field]: value } : s
      )
    );
  };

  const getSignataire = (type: 'COMPT' | 'DAF' | 'DP'): Signataire => {
    return signataires.find(s => s.type === type) || defaultSignataires.find(s => s.type === type)!;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const comptable = getSignataire('COMPT');
    const daf = getSignataire('DAF');
    const dp = getSignataire('DP');
    
    if (!comptable.nom || !daf.nom || !dp.nom) {
      toast({
        title: "Validation",
        description: "Veuillez renseigner tous les noms des signataires",
        variant: "destructive",
      });
      return;
    }

    await onSave(signataires);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COMPT': return <UserCheck className="w-4 h-4" />;
      case 'DAF': return <Users className="w-4 h-4" />;
      case 'DP': return <Shield className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COMPT': return 'bg-primary/10 text-primary border-primary/30';
      case 'DAF': return 'bg-secondary/10 text-secondary border-secondary/30';
      case 'DP': return 'bg-accent/10 text-accent border-accent/30';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Configuration des Signataires
          </DialogTitle>
          <DialogDescription>
            Définissez les noms et grades des personnes autorisées à signer les documents
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Comptable */}
          <div className="space-y-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2">
              <Badge className={getTypeColor('COMPT')}>
                {getTypeIcon('COMPT')}
                <span className="ml-1">Comptable (COMPT)</span>
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compt_nom">Nom complet *</Label>
                <Input
                  id="compt_nom"
                  value={getSignataire('COMPT').nom}
                  onChange={(e) => updateSignataire('COMPT', 'nom', e.target.value)}
                  placeholder="Nom du comptable"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compt_grade">Grade</Label>
                <Select
                  value={getSignataire('COMPT').grade}
                  onValueChange={(value) => updateSignataire('COMPT', 'grade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="compt_titre">Titre de fonction</Label>
              <Input
                id="compt_titre"
                value={getSignataire('COMPT').titre}
                onChange={(e) => updateSignataire('COMPT', 'titre', e.target.value)}
                placeholder="Le Comptable"
              />
            </div>
          </div>

          <Separator />

          {/* DAF */}
          <div className="space-y-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2">
              <Badge className={getTypeColor('DAF')}>
                {getTypeIcon('DAF')}
                <span className="ml-1">Sous-Directeur Finances (DAF)</span>
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daf_nom">Nom complet *</Label>
                <Input
                  id="daf_nom"
                  value={getSignataire('DAF').nom}
                  onChange={(e) => updateSignataire('DAF', 'nom', e.target.value)}
                  placeholder="Nom du DAF"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daf_grade">Grade</Label>
                <Select
                  value={getSignataire('DAF').grade}
                  onValueChange={(value) => updateSignataire('DAF', 'grade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="daf_titre">Titre de fonction</Label>
              <Input
                id="daf_titre"
                value={getSignataire('DAF').titre}
                onChange={(e) => updateSignataire('DAF', 'titre', e.target.value)}
                placeholder="Le Sous-Directeur chargé de l'Administration et des Finances"
              />
            </div>
          </div>

          <Separator />

          {/* Directeur Provincial */}
          <div className="space-y-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2">
              <Badge className={getTypeColor('DP')}>
                {getTypeIcon('DP')}
                <span className="ml-1">Directeur Provincial (DP)</span>
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dp_nom">Nom complet *</Label>
                <Input
                  id="dp_nom"
                  value={getSignataire('DP').nom}
                  onChange={(e) => updateSignataire('DP', 'nom', e.target.value)}
                  placeholder="Nom du Directeur Provincial"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dp_grade">Grade</Label>
                <Select
                  value={getSignataire('DP').grade}
                  onValueChange={(value) => updateSignataire('DP', 'grade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dp_titre">Titre de fonction</Label>
              <Input
                id="dp_titre"
                value={getSignataire('DP').titre}
                onChange={(e) => updateSignataire('DP', 'titre', e.target.value)}
                placeholder="Le Directeur Provincial"
              />
            </div>
          </div>

          <DialogFooter>
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
