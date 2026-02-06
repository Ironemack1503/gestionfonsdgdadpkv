/**
 * DraggableField Component
 * A field that can be dragged to the report builder canvas
 */

import { useDrag } from 'react-dnd';
import { GripVertical, DollarSign, Calendar, Hash, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportField } from './types';

interface DraggableFieldProps {
  field: ReportField;
  isSelected?: boolean;
  onSelect?: (field: ReportField) => void;
}

const fieldTypeIcons = {
  text: Type,
  number: Hash,
  currency: DollarSign,
  date: Calendar,
  time: Calendar,
};

const sourceColors = {
  recettes: 'border-l-success bg-success/5 hover:bg-success/10',
  depenses: 'border-l-destructive bg-destructive/5 hover:bg-destructive/10',
  programmations: 'border-l-warning bg-warning/5 hover:bg-warning/10',
  calculated: 'border-l-primary bg-primary/5 hover:bg-primary/10',
};

export function DraggableField({ field, isSelected, onSelect }: DraggableFieldProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'REPORT_FIELD',
    item: field,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [field]);

  const Icon = fieldTypeIcons[field.type];

  return (
    <div
      ref={drag}
      onClick={() => onSelect?.(field)}
      className={cn(
        'flex items-center gap-2 p-2.5 rounded-lg border-l-4 cursor-grab transition-all duration-200',
        sourceColors[field.source],
        isSelected && 'ring-2 ring-primary',
        isDragging && 'opacity-50 cursor-grabbing'
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{field.label}</p>
        <p className="text-xs text-muted-foreground capitalize">{field.source}</p>
      </div>
    </div>
  );
}
