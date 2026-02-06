/**
 * FormulaEditor Component
 * Editor for adding calculated fields with formulas
 */

import { useState } from 'react';
import { Plus, Calculator, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculatedField, FormulaType, AVAILABLE_FIELDS, DEFAULT_FORMULAS } from './types';
import { cn } from '@/lib/utils';

interface FormulaEditorProps {
  calculatedFields: CalculatedField[];
  onAddFormula: (formula: CalculatedField) => void;
  onRemoveFormula: (id: string) => void;
  onAddDefaultFormulas: () => void;
}

const formulaDescriptions: Record<FormulaType, string> = {
  sum: 'Calcule la somme des valeurs',
  count: 'Compte le nombre d\'éléments',
  avg: 'Calcule la moyenne',
  min: 'Trouve la valeur minimale',
  max: 'Trouve la valeur maximale',
  custom: 'Formule personnalisée',
};

export function FormulaEditor({
  calculatedFields,
  onAddFormula,
  onRemoveFormula,
  onAddDefaultFormulas,
}: FormulaEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFormula, setNewFormula] = useState<Partial<CalculatedField>>({
    formula: 'sum',
  });

  const handleAddFormula = () => {
    if (!newFormula.name || !newFormula.label || !newFormula.formula) return;

    const formula: CalculatedField = {
      id: `calc_${Date.now()}`,
      name: newFormula.name,
      label: newFormula.label,
      formula: newFormula.formula,
      sourceField: newFormula.sourceField,
      customFormula: newFormula.customFormula,
    };

    onAddFormula(formula);
    setNewFormula({ formula: 'sum' });
    setIsDialogOpen(false);
  };

  const numericFields = AVAILABLE_FIELDS.filter(f => f.type === 'currency' || f.type === 'number');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Formules & Calculs
          </CardTitle>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddDefaultFormulas}
                    disabled={calculatedFields.length >= 4}
                  >
                    Formules par défaut
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ajouter TOTAL, ENCAISSE et BALANCE</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Nouvelle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une formule</DialogTitle>
                  <DialogDescription>
                    Créez un champ calculé avec une formule personnalisée
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="formula-name">Nom technique</Label>
                      <Input
                        id="formula-name"
                        placeholder="ex: total_mensuel"
                        value={newFormula.name || ''}
                        onChange={(e) => setNewFormula(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="formula-label">Libellé affiché</Label>
                      <Input
                        id="formula-label"
                        placeholder="ex: Total Mensuel"
                        value={newFormula.label || ''}
                        onChange={(e) => setNewFormula(prev => ({ ...prev, label: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="formula-type">Type de formule</Label>
                    <Select
                      value={newFormula.formula}
                      onValueChange={(value: FormulaType) => setNewFormula(prev => ({ ...prev, formula: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une formule" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(formulaDescriptions).map(([key, desc]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span className="font-medium uppercase">{key}</span>
                              <span className="text-xs text-muted-foreground">{desc}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newFormula.formula !== 'custom' ? (
                    <div className="space-y-2">
                      <Label htmlFor="source-field">Champ source</Label>
                      <Select
                        value={newFormula.sourceField}
                        onValueChange={(value) => setNewFormula(prev => ({ ...prev, sourceField: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un champ" />
                        </SelectTrigger>
                        <SelectContent>
                          {numericFields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.label} ({field.source})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="custom-formula">Formule personnalisée</Label>
                      <Input
                        id="custom-formula"
                        placeholder="ex: SUM(recettes) - SUM(depenses)"
                        value={newFormula.customFormula || ''}
                        onChange={(e) => setNewFormula(prev => ({ ...prev, customFormula: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Utilisez SUM(), AVG(), COUNT(), MIN(), MAX()
                      </p>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddFormula} disabled={!newFormula.name || !newFormula.label}>
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {calculatedFields.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calculator className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune formule ajoutée</p>
            <p className="text-xs">Cliquez sur "Formules par défaut" pour ajouter TOTAL, ENCAISSE et BALANCE</p>
          </div>
        ) : (
          <div className="space-y-2">
            {calculatedFields.map((formula) => (
              <div
                key={formula.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{formula.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formula.formula === 'custom' 
                      ? formula.customFormula 
                      : `${formula.formula.toUpperCase()}(${formula.sourceField || ''})`
                    }
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onRemoveFormula(formula.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
