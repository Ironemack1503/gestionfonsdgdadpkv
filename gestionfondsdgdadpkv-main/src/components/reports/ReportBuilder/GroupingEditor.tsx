/**
 * GroupingEditor Component
 * Editor for managing report groupings and subtotals
 */

import { useState } from 'react';
import { Plus, Layers, Trash2, ChevronDown, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportGrouping, GroupByType, AVAILABLE_GROUPINGS } from './types';
import { cn } from '@/lib/utils';

interface GroupingEditorProps {
  groupings: ReportGrouping[];
  showTotals: boolean;
  showSubtotals: boolean;
  onAddGrouping: (grouping: ReportGrouping) => void;
  onRemoveGrouping: (id: string) => void;
  onToggleGroupingExpanded: (id: string) => void;
  onToggleGroupingSubtotal: (id: string) => void;
  onToggleTotals: (show: boolean) => void;
  onToggleSubtotals: (show: boolean) => void;
}

export function GroupingEditor({
  groupings,
  showTotals,
  showSubtotals,
  onAddGrouping,
  onRemoveGrouping,
  onToggleGroupingExpanded,
  onToggleGroupingSubtotal,
  onToggleTotals,
  onToggleSubtotals,
}: GroupingEditorProps) {
  const [selectedGroupBy, setSelectedGroupBy] = useState<GroupByType | ''>('');

  const handleAddGrouping = () => {
    if (!selectedGroupBy) return;

    const groupingInfo = AVAILABLE_GROUPINGS.find(g => g.value === selectedGroupBy);
    if (!groupingInfo) return;

    // Check if already added
    if (groupings.some(g => g.field === selectedGroupBy)) return;

    const grouping: ReportGrouping = {
      id: `group_${Date.now()}`,
      field: selectedGroupBy,
      label: groupingInfo.label,
      showSubtotal: true,
      isExpanded: true,
    };

    onAddGrouping(grouping);
    setSelectedGroupBy('');
  };

  const availableGroupings = AVAILABLE_GROUPINGS.filter(
    g => !groupings.some(existing => existing.field === g.value)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Regroupements & Totaux
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global options */}
        <div className="flex flex-col gap-3 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-totals" className="flex items-center gap-2 cursor-pointer">
              <ToggleLeft className="w-4 h-4" />
              Afficher les totaux généraux
            </Label>
            <Switch
              id="show-totals"
              checked={showTotals}
              onCheckedChange={onToggleTotals}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-subtotals" className="flex items-center gap-2 cursor-pointer">
              <ToggleRight className="w-4 h-4" />
              Afficher les sous-totaux
            </Label>
            <Switch
              id="show-subtotals"
              checked={showSubtotals}
              onCheckedChange={onToggleSubtotals}
            />
          </div>
        </div>

        {/* Add grouping */}
        <div className="flex gap-2">
          <Select value={selectedGroupBy} onValueChange={(value: GroupByType) => setSelectedGroupBy(value)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Ajouter un regroupement..." />
            </SelectTrigger>
            <SelectContent>
              {availableGroupings.length === 0 ? (
                <SelectItem value="" disabled>
                  Tous les regroupements sont utilisés
                </SelectItem>
              ) : (
                availableGroupings.map((grouping) => (
                  <SelectItem key={grouping.value} value={grouping.value}>
                    {grouping.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            variant="default"
            size="icon"
            onClick={handleAddGrouping}
            disabled={!selectedGroupBy}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current groupings */}
        {groupings.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun regroupement</p>
            <p className="text-xs">Ajoutez des regroupements pour organiser vos données</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Ordre de regroupement
            </p>
            {groupings.map((grouping, index) => (
              <div
                key={grouping.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border"
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onToggleGroupingExpanded(grouping.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {grouping.isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{grouping.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {grouping.showSubtotal ? 'Avec sous-total' : 'Sans sous-total'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={grouping.showSubtotal}
                    onCheckedChange={() => onToggleGroupingSubtotal(grouping.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onRemoveGrouping(grouping.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
