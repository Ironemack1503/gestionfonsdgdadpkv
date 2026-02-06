/**
 * Orientation Selector Component
 * Select between portrait and landscape orientation for reports
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageOrientation } from './types';

interface OrientationSelectorProps {
  orientation: PageOrientation;
  onChange: (orientation: PageOrientation) => void;
}

export function OrientationSelector({ orientation, onChange }: OrientationSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4" />
          Orientation de la page
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={orientation} 
          onValueChange={(value) => onChange(value as PageOrientation)}
          className="flex gap-4"
        >
          {/* Portrait */}
          <div className="flex-1">
            <Label
              htmlFor="portrait"
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted/50",
                orientation === 'portrait' 
                  ? "border-primary bg-primary/5" 
                  : "border-muted"
              )}
            >
              <div className="w-8 h-10 border-2 rounded flex items-center justify-center bg-background">
                <FileText className="w-4 h-5 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="portrait" id="portrait" />
                <span className="text-xs font-medium">Portrait</span>
              </div>
            </Label>
          </div>
          
          {/* Landscape */}
          <div className="flex-1">
            <Label
              htmlFor="landscape"
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted/50",
                orientation === 'landscape' 
                  ? "border-primary bg-primary/5" 
                  : "border-muted"
              )}
            >
              <div className="w-10 h-8 border-2 rounded flex items-center justify-center bg-background">
                <FileText className="w-5 h-4 text-muted-foreground rotate-90" />
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="landscape" id="landscape" />
                <span className="text-xs font-medium">Paysage</span>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
