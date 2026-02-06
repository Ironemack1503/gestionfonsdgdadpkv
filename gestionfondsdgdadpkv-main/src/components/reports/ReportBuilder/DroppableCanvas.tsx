/**
 * DroppableCanvas Component
 * The canvas where fields can be dropped to build the report
 * Supports drag-and-drop reordering with real-time PDF preview updates
 */

import { useRef } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { X, GripVertical, Eye, EyeOff, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ReportField } from './types';

const CANVAS_FIELD_TYPE = 'CANVAS_FIELD';

interface DroppableCanvasProps {
  selectedFields: ReportField[];
  onFieldDrop: (field: ReportField) => void;
  onFieldRemove: (fieldId: string) => void;
  onFieldToggleVisibility: (fieldId: string) => void;
  onFieldReorder: (dragIndex: number, dropIndex: number) => void;
}

export function DroppableCanvas({
  selectedFields,
  onFieldDrop,
  onFieldRemove,
  onFieldToggleVisibility,
  onFieldReorder,
}: DroppableCanvasProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'REPORT_FIELD',
    drop: (item: ReportField) => {
      if (!selectedFields.find(f => f.id === item.id)) {
        onFieldDrop(item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [selectedFields, onFieldDrop]);

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={cn(
        'min-h-[200px] rounded-lg border-2 border-dashed p-4 transition-all duration-200',
        isActive 
          ? 'border-primary bg-primary/5' 
          : canDrop 
            ? 'border-muted-foreground/30 bg-muted/30' 
            : 'border-border bg-card'
      )}
    >
      {selectedFields.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <GripVertical className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            Glissez les champs ici pour construire votre rapport
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Les champs seront affichés dans l'ordre de dépôt
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Colonnes du rapport ({selectedFields.length})
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpDown className="w-3 h-3" />
              <span>Glissez pour réorganiser</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {selectedFields.map((field, index) => (
              <DraggableCanvasField
                key={field.id}
                field={field}
                index={index}
                onRemove={() => onFieldRemove(field.id)}
                onToggleVisibility={() => onFieldToggleVisibility(field.id)}
                onReorder={onFieldReorder}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DraggableCanvasFieldProps {
  field: ReportField;
  index: number;
  onRemove: () => void;
  onToggleVisibility: () => void;
  onReorder: (dragIndex: number, dropIndex: number) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

function DraggableCanvasField({ 
  field, 
  index, 
  onRemove, 
  onToggleVisibility,
  onReorder 
}: DraggableCanvasFieldProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: CANVAS_FIELD_TYPE,
    item: () => ({ id: field.id, index, type: CANVAS_FIELD_TYPE }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: CANVAS_FIELD_TYPE,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    hover: (item, monitor) => {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // Time to actually perform the action
      onReorder(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  // Connect drag and drop refs
  drag(drop(ref));

  const sourceColors = {
    recettes: 'bg-success/10 border-success/30',
    depenses: 'bg-destructive/10 border-destructive/30',
    programmations: 'bg-warning/10 border-warning/30',
    calculated: 'bg-primary/10 border-primary/30',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
        sourceColors[field.source],
        !field.isVisible && 'opacity-50',
        isDragging && 'opacity-40 scale-95 shadow-lg ring-2 ring-primary',
        isOver && canDrop && 'ring-2 ring-primary/50 bg-primary/5'
      )}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
        <span className="text-xs font-medium text-muted-foreground bg-background/50 px-2 py-0.5 rounded">
          {index + 1}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{field.label}</p>
        <p className="text-xs text-muted-foreground capitalize">{field.type}</p>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
        >
          {field.isVisible ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
