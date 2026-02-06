/**
 * Watermark Editor Component
 * Edit watermark text/image, opacity, rotation and visibility
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Droplets, Upload, X, Type, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number;
  rotation: number;
  fontSize: number;
  color: string;
  position: 'center' | 'diagonal' | 'tiled';
  // New image watermark properties
  type: 'text' | 'image';
  imageUrl?: string;
  imageSize: number; // percentage of page width
}

interface WatermarkEditorProps {
  config: WatermarkConfig;
  onChange: (config: WatermarkConfig) => void;
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: true,
  text: 'ORIGINAL',
  opacity: 15,
  rotation: 45,
  fontSize: 60,
  color: '#cccccc',
  position: 'center',
  type: 'text',
  imageUrl: undefined,
  imageSize: 40,
};

export function WatermarkEditor({ config, onChange }: WatermarkEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = <K extends keyof WatermarkConfig>(key: K, value: WatermarkConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Fichier invalide',
        description: 'Veuillez sélectionner une image (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 2 Mo',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onChange({
          ...config,
          type: 'image',
          imageUrl: base64,
        });
        toast({
          title: 'Image chargée',
          description: 'L\'image a été définie comme filigrane',
        });
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger l\'image',
          variant: 'destructive',
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'image',
        variant: 'destructive',
      });
      setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    onChange({
      ...config,
      type: 'text',
      imageUrl: undefined,
    });
    toast({
      title: 'Image supprimée',
      description: 'Le filigrane texte a été restauré',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            Filigrane
          </CardTitle>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>
      </CardHeader>
      
      {config.enabled && (
        <CardContent className="space-y-4">
          {/* Type selector */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Type de filigrane</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={config.type === 'text' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => handleChange('type', 'text')}
              >
                <Type className="w-4 h-4 mr-1" />
                Texte
              </Button>
              <Button
                type="button"
                variant={config.type === 'image' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => handleChange('type', 'image')}
              >
                <ImageIcon className="w-4 h-4 mr-1" />
                Image
              </Button>
            </div>
          </div>

          {/* Text watermark settings */}
          {config.type === 'text' && (
            <>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Texte du filigrane</Label>
                <Input
                  value={config.text}
                  onChange={(e) => handleChange('text', e.target.value)}
                  placeholder="ORIGINAL, CONFIDENTIEL, COPIE..."
                  className="h-9"
                />
              </div>

              {/* Font size */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-muted-foreground">Taille</Label>
                  <span className="text-xs text-muted-foreground">{config.fontSize}pt</span>
                </div>
                <Slider
                  value={[config.fontSize]}
                  onValueChange={([value]) => handleChange('fontSize', value)}
                  min={30}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="h-9 text-xs flex-1"
                  />
                </div>
              </div>
            </>
          )}

          {/* Image watermark settings */}
          {config.type === 'image' && (
            <>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Image de filigrane</Label>
                
                {config.imageUrl ? (
                  <div className="relative border rounded-md p-2 bg-muted/30">
                    <img 
                      src={config.imageUrl} 
                      alt="Filigrane" 
                      className="w-full h-20 object-contain opacity-50"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {isUploading ? 'Chargement...' : 'Cliquez pour charger une image'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG (max 2 Mo)</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Image size */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-muted-foreground">Taille de l'image</Label>
                  <span className="text-xs text-muted-foreground">{config.imageSize}%</span>
                </div>
                <Slider
                  value={[config.imageSize]}
                  onValueChange={([value]) => handleChange('imageSize', value)}
                  min={10}
                  max={80}
                  step={5}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Position */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Position</Label>
            <Select
              value={config.position}
              onValueChange={(value: 'center' | 'diagonal' | 'tiled') => handleChange('position', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Centre de la page</SelectItem>
                <SelectItem value="diagonal">En diagonale</SelectItem>
                <SelectItem value="tiled">Répété (mosaïque)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Opacité</Label>
              <span className="text-xs text-muted-foreground">{config.opacity}%</span>
            </div>
            <Slider
              value={[config.opacity]}
              onValueChange={([value]) => handleChange('opacity', value)}
              min={5}
              max={50}
              step={5}
              className="w-full"
            />
          </div>

          {/* Rotation (only for diagonal) */}
          {config.position === 'diagonal' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Rotation</Label>
                <span className="text-xs text-muted-foreground">{config.rotation}°</span>
              </div>
              <Slider
                value={[config.rotation]}
                onValueChange={([value]) => handleChange('rotation', value)}
                min={-90}
                max={90}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
