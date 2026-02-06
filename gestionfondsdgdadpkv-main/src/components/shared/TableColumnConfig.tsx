/**
 * TableColumnConfig - Component for configuring table columns visibility and order
 * Allows users to customize which columns appear and their order
 */

import { useState, useCallback } from "react";
import { GripVertical, Eye, EyeOff, Settings2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export interface ConfigurableColumn {
  key: string;
  header: string;
  width?: number;
  visible: boolean;
  type?: "text" | "currency" | "number" | "date";
  order: number;
}

interface TableColumnConfigProps {
  columns: ConfigurableColumn[];
  onColumnsChange: (columns: ConfigurableColumn[]) => void;
  trigger?: React.ReactNode;
}

export function TableColumnConfig({
  columns,
  onColumnsChange,
  trigger,
}: TableColumnConfigProps) {
  const [open, setOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<ConfigurableColumn[]>(columns);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Reset local columns when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalColumns([...columns]);
    }
    setOpen(isOpen);
  };

  const handleVisibilityToggle = (index: number) => {
    const updated = [...localColumns];
    updated[index] = { ...updated[index], visible: !updated[index].visible };
    setLocalColumns(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...localColumns];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    // Update order values
    updated.forEach((col, i) => {
      col.order = i;
    });
    
    setLocalColumns(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSelectAll = () => {
    const allVisible = localColumns.every((c) => c.visible);
    setLocalColumns(
      localColumns.map((c) => ({ ...c, visible: !allVisible }))
    );
  };

  const handleApply = () => {
    onColumnsChange(localColumns);
    setOpen(false);
  };

  const handleReset = () => {
    const reset = columns.map((c, i) => ({ ...c, visible: true, order: i }));
    setLocalColumns(reset);
  };

  const visibleCount = localColumns.filter((c) => c.visible).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings2 className="w-4 h-4 mr-2" />
            Colonnes ({visibleCount}/{columns.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Configuration des colonnes
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-muted-foreground">
            Glissez pour réorganiser, activez/désactivez pour afficher
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {localColumns.every((c) => c.visible) ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" /> Tout masquer
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" /> Tout afficher
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />
        
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {localColumns.map((column, index) => (
              <div
                key={column.key}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-move ${
                  draggedIndex === index
                    ? "bg-primary/10 border-primary"
                    : column.visible
                    ? "bg-background border-border hover:border-primary/50"
                    : "bg-muted/50 border-border/50 opacity-60"
                }`}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <Label className="font-medium truncate block">
                    {column.header}
                  </Label>
                  {column.type && (
                    <span className="text-xs text-muted-foreground">
                      {column.type === "currency" && "💰 Montant"}
                      {column.type === "number" && "🔢 Nombre"}
                      {column.type === "date" && "📅 Date"}
                      {column.type === "text" && "📝 Texte"}
                    </span>
                  )}
                </div>
                
                <Switch
                  checked={column.visible}
                  onCheckedChange={() => handleVisibilityToggle(index)}
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="sm:mr-auto">
            Réinitialiser
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleApply}>
            <Check className="w-4 h-4 mr-2" />
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TableColumnConfig;
