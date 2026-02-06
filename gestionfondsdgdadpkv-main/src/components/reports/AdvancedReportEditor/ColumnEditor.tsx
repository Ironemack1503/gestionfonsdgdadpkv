/**
 * Column Editor Component
 * Add, remove, reorder and configure table columns
 */

import { useState } from 'react';
import { GripVertical, Plus, Trash2, Eye, EyeOff, Settings2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { TableColumn, TextAlignment } from './types';

interface ColumnEditorProps {
  columns: TableColumn[];
  onChange: (columns: TableColumn[]) => void;
  availableFields: { key: string; label: string; type: 'text' | 'number' | 'currency' | 'date' }[];
}

export function ColumnEditor({ columns, onChange, availableFields }: ColumnEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingColumn, setEditingColumn] = useState<TableColumn | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newColumn, setNewColumn] = useState<Partial<TableColumn>>({
    header: '',
    key: '',
    type: 'text',
    align: 'left',
    width: 15,
  });

  // Drag handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...columns];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    onChange(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Toggle visibility
  const toggleVisibility = (id: string) => {
    // For now, we remove the column instead of hiding it
    // You could add a 'visible' field to TableColumn if needed
    const updated = columns.filter(col => col.id !== id);
    onChange(updated);
  };

  // Update column
  const updateColumn = (id: string, updates: Partial<TableColumn>) => {
    onChange(columns.map(col => 
      col.id === id ? { ...col, ...updates } : col
    ));
  };

  // Delete column
  const deleteColumn = (id: string) => {
    onChange(columns.filter(col => col.id !== id));
  };

  // Add new column
  const addColumn = () => {
    if (!newColumn.key || !newColumn.header) return;
    
    const column: TableColumn = {
      id: `col_${Date.now()}`,
      header: newColumn.header || '',
      key: newColumn.key || '',
      type: newColumn.type || 'text',
      align: newColumn.align as TextAlignment || 'left',
      width: newColumn.width || 15,
    };
    
    onChange([...columns, column]);
    setNewColumn({ header: '', key: '', type: 'text', align: 'left', width: 15 });
    setShowAddDialog(false);
  };

  // Get unused fields
  const unusedFields = availableFields.filter(
    field => !columns.some(col => col.key === field.key)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Colonnes du tableau ({columns.length})
          </CardTitle>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={unusedFields.length === 0}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une colonne</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-xs">Champ source</Label>
                  <Select
                    value={newColumn.key}
                    onValueChange={(value) => {
                      const field = availableFields.find(f => f.key === value);
                      setNewColumn({
                        ...newColumn,
                        key: value,
                        header: field?.label || value,
                        type: field?.type || 'text',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un champ..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unusedFields.map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label} ({field.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Titre de la colonne</Label>
                  <Input
                    value={newColumn.header}
                    onChange={(e) => setNewColumn({ ...newColumn, header: e.target.value })}
                    placeholder="Entrez le titre..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={newColumn.type}
                      onValueChange={(value: 'text' | 'number' | 'currency' | 'date') => 
                        setNewColumn({ ...newColumn, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texte</SelectItem>
                        <SelectItem value="number">Nombre</SelectItem>
                        <SelectItem value="currency">Montant</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Alignement</Label>
                    <Select
                      value={newColumn.align}
                      onValueChange={(value: TextAlignment) => 
                        setNewColumn({ ...newColumn, align: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Gauche</SelectItem>
                        <SelectItem value="center">Centre</SelectItem>
                        <SelectItem value="right">Droite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Largeur (%)</Label>
                  <Input
                    type="number"
                    value={newColumn.width}
                    onChange={(e) => setNewColumn({ ...newColumn, width: Number(e.target.value) })}
                    min={5}
                    max={50}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={addColumn} disabled={!newColumn.key || !newColumn.header}>
                  <Check className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Glissez pour réorganiser, cliquez sur ✕ pour supprimer
        </p>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[280px]">
          <div className="space-y-2">
            {columns.map((column, index) => (
              <div
                key={column.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-move ${
                  draggedIndex === index
                    ? 'bg-primary/10 border-primary'
                    : 'bg-background border-border hover:border-primary/50'
                }`}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                
                <div className="flex-1 min-w-0">
                  {editingColumn?.id === column.id ? (
                    <Input
                      value={editingColumn.header}
                      onChange={(e) => setEditingColumn({ ...editingColumn, header: e.target.value })}
                      className="h-7 text-sm"
                      onBlur={() => {
                        updateColumn(column.id, { header: editingColumn.header });
                        setEditingColumn(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateColumn(column.id, { header: editingColumn.header });
                          setEditingColumn(null);
                        }
                        if (e.key === 'Escape') {
                          setEditingColumn(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="text-sm font-medium truncate block cursor-text"
                      onClick={() => setEditingColumn(column)}
                    >
                      {column.header}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {column.type === 'currency' && '💰'}
                    {column.type === 'number' && '🔢'}
                    {column.type === 'date' && '📅'}
                    {column.type === 'text' && '📝'}
                    {' '}{column.key} • {column.width || 'auto'}%
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Select
                    value={column.align || 'left'}
                    onValueChange={(value: TextAlignment) => updateColumn(column.id, { align: value })}
                  >
                    <SelectTrigger className="w-20 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">⬅ G</SelectItem>
                      <SelectItem value="center">↔ C</SelectItem>
                      <SelectItem value="right">➡ D</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteColumn(column.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {columns.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Aucune colonne. Cliquez sur "Ajouter" pour commencer.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
