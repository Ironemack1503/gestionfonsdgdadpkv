/**
 * Style Editor Component
 * Edit fonts, colors and table styling for reports
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { TemplateStyles } from './types';

interface StyleEditorProps {
  styles: TemplateStyles;
  onChange: (styles: TemplateStyles) => void;
}

const AVAILABLE_FONTS = [
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Georgia', label: 'Georgia' },
];

export function StyleEditor({ styles, onChange }: StyleEditorProps) {
  const handleChange = (key: keyof TemplateStyles, value: string | number) => {
    onChange({ ...styles, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Style et mise en forme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Title font */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Police du titre</Label>
          <Select
            value={styles.titleFont}
            onValueChange={(value) => handleChange('titleFont', value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_FONTS.map(font => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title size */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs text-muted-foreground">Taille du titre</Label>
            <span className="text-xs text-muted-foreground">{styles.titleSize}pt</span>
          </div>
          <Slider
            value={[styles.titleSize]}
            onValueChange={([value]) => handleChange('titleSize', value)}
            min={10}
            max={24}
            step={1}
            className="w-full"
          />
        </div>

        {/* Body font */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Police du corps</Label>
          <Select
            value={styles.bodyFont}
            onValueChange={(value) => handleChange('bodyFont', value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_FONTS.map(font => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Body size */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs text-muted-foreground">Taille du texte</Label>
            <span className="text-xs text-muted-foreground">{styles.bodySize}pt</span>
          </div>
          <Slider
            value={[styles.bodySize]}
            onValueChange={([value]) => handleChange('bodySize', value)}
            min={8}
            max={14}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Couleur en-tête</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={styles.headerColor}
                onChange={(e) => handleChange('headerColor', e.target.value)}
                className="w-10 h-9 p-1 cursor-pointer"
              />
              <Input
                value={styles.headerColor}
                onChange={(e) => handleChange('headerColor', e.target.value)}
                className="h-9 text-xs flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Couleur accent</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={styles.accentColor}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                className="w-10 h-9 p-1 cursor-pointer"
              />
              <Input
                value={styles.accentColor}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                className="h-9 text-xs flex-1"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Lignes alternées</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={styles.alternateRowColor}
                onChange={(e) => handleChange('alternateRowColor', e.target.value)}
                className="w-10 h-9 p-1 cursor-pointer"
              />
              <Input
                value={styles.alternateRowColor}
                onChange={(e) => handleChange('alternateRowColor', e.target.value)}
                className="h-9 text-xs flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Bordures</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={styles.borderColor}
                onChange={(e) => handleChange('borderColor', e.target.value)}
                className="w-10 h-9 p-1 cursor-pointer"
              />
              <Input
                value={styles.borderColor}
                onChange={(e) => handleChange('borderColor', e.target.value)}
                className="h-9 text-xs flex-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
