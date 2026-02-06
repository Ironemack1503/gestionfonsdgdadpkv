import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Palette, Layout, Image, Type } from "lucide-react";

export interface PDFExportSettings {
  // Logo settings
  useDefaultLogo: boolean;
  customLogoUrl?: string;
  showLogo: boolean;
  
  // Color settings
  headerColor: string;
  headerTextColor: string;
  alternateRowColor: string;
  borderColor: string;
  
  // Layout settings
  orientation: 'portrait' | 'landscape';
  fontSize: number;
  margins: 'normal' | 'narrow' | 'wide';
  
  // Content settings
  showWatermark: boolean;
  showFooter: boolean;
  showGenerationDate: boolean;
  
  // Custom header settings
  customHeaderLine1: string;
  customHeaderLine2: string;
  customHeaderLine3: string;
  customHeaderLine4: string;
  useCustomHeader: boolean;
  
  // Custom footer settings
  customFooterLine1: string;
  customFooterLine2: string;
  customFooterLine3: string;
  customFooterLine4: string;
  useCustomFooter: boolean;
}

export const defaultPDFSettings: PDFExportSettings = {
  useDefaultLogo: true,
  showLogo: true,
  headerColor: '#3b82f6',
  headerTextColor: '#ffffff',
  alternateRowColor: '#f5f7fa',
  borderColor: '#e5e7eb',
  orientation: 'portrait',
  fontSize: 9,
  margins: 'normal',
  showWatermark: true,
  showFooter: true,
  showGenerationDate: true,
  // Default header
  customHeaderLine1: 'République Démocratique du Congo',
  customHeaderLine2: 'Ministère des Finances',
  customHeaderLine3: 'Direction Générale des Douanes et Accises',
  customHeaderLine4: 'Direction Provinciale de Kinshasa-Ville',
  useCustomHeader: false,
  // Default footer
  customFooterLine1: "Tous mobilisés pour une douane d'action et d'excellence !",
  customFooterLine2: 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
  customFooterLine3: 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
  customFooterLine4: 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
  useCustomFooter: false,
};

interface PDFExportConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (settings: PDFExportSettings) => void;
  title?: string;
  initialSettings?: PDFExportSettings;
}

const colorPresets = [
  { name: 'DGDA Bleu', header: '#3b82f6', text: '#ffffff', row: '#f5f7fa' },
  { name: 'Vert Officiel', header: '#16a34a', text: '#ffffff', row: '#f0fdf4' },
  { name: 'Bleu Marine', header: '#1e40af', text: '#ffffff', row: '#eff6ff' },
  { name: 'Rouge Bordeaux', header: '#991b1b', text: '#ffffff', row: '#fef2f2' },
  { name: 'Violet', header: '#7c3aed', text: '#ffffff', row: '#f5f3ff' },
  { name: 'Gris Professionnel', header: '#374151', text: '#ffffff', row: '#f9fafb' },
];

export function PDFExportConfigDialog({
  open,
  onOpenChange,
  onExport,
  title = "Configuration de l'export PDF",
  initialSettings,
}: PDFExportConfigDialogProps) {
  const [settings, setSettings] = useState<PDFExportSettings>(initialSettings || defaultPDFSettings);
  const [customLogoPreview, setCustomLogoPreview] = useState<string | null>(null);

  // Update settings when initialSettings changes
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomLogoPreview(result);
        setSettings(prev => ({ ...prev, customLogoUrl: result, useDefaultLogo: false }));
      };
      reader.readAsDataURL(file);
    }
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setSettings(prev => ({
      ...prev,
      headerColor: preset.header,
      headerTextColor: preset.text,
      alternateRowColor: preset.row,
    }));
  };

  const handleExport = () => {
    onExport(settings);
    onOpenChange(false);
  };

  const resetToDefaults = () => {
    setSettings(defaultPDFSettings);
    setCustomLogoPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Personnalisez l'apparence de vos exports PDF
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="logo" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logo" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Logo
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Couleurs
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Mise en page
            </TabsTrigger>
            <TabsTrigger value="header-footer" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              En-tête/Pied
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logo" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Afficher le logo</Label>
                <p className="text-sm text-muted-foreground">
                  Inclure un logo dans l'en-tête du PDF
                </p>
              </div>
              <Switch
                checked={settings.showLogo}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, showLogo: checked }))
                }
              />
            </div>

            {settings.showLogo && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Utiliser le logo DGDA par défaut</Label>
                    <p className="text-sm text-muted-foreground">
                      Logo officiel de la DGDA
                    </p>
                  </div>
                  <Switch
                    checked={settings.useDefaultLogo}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, useDefaultLogo: checked }))
                    }
                  />
                </div>

                {!settings.useDefaultLogo && (
                  <div className="space-y-2">
                    <Label htmlFor="logo-upload">Logo personnalisé</Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                    />
                    {customLogoPreview && (
                      <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-2">Aperçu:</p>
                        <img 
                          src={customLogoPreview} 
                          alt="Logo personnalisé" 
                          className="max-h-16 object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="colors" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Préréglages de couleurs</Label>
              <div className="grid grid-cols-3 gap-2">
                {colorPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => applyColorPreset(preset)}
                  >
                    <div 
                      className="w-4 h-4 rounded mr-2" 
                      style={{ backgroundColor: preset.header }}
                    />
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="header-color">Couleur de l'en-tête</Label>
                <div className="flex gap-2">
                  <Input
                    id="header-color"
                    type="color"
                    value={settings.headerColor}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, headerColor: e.target.value }))
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.headerColor}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, headerColor: e.target.value }))
                    }
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="header-text-color">Couleur du texte en-tête</Label>
                <div className="flex gap-2">
                  <Input
                    id="header-text-color"
                    type="color"
                    value={settings.headerTextColor}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, headerTextColor: e.target.value }))
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.headerTextColor}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, headerTextColor: e.target.value }))
                    }
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternate-row-color">Couleur lignes alternées</Label>
                <div className="flex gap-2">
                  <Input
                    id="alternate-row-color"
                    type="color"
                    value={settings.alternateRowColor}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, alternateRowColor: e.target.value }))
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.alternateRowColor}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, alternateRowColor: e.target.value }))
                    }
                    placeholder="#f5f7fa"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="border-color">Couleur des bordures</Label>
                <div className="flex gap-2">
                  <Input
                    id="border-color"
                    type="color"
                    value={settings.borderColor}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, borderColor: e.target.value }))
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.borderColor}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, borderColor: e.target.value }))
                    }
                    placeholder="#e5e7eb"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="p-4 border rounded-lg space-y-2">
              <p className="text-sm font-medium">Aperçu des couleurs:</p>
              <div className="overflow-hidden rounded border" style={{ borderColor: settings.borderColor }}>
                <div 
                  className="px-3 py-2 text-sm font-medium"
                  style={{ 
                    backgroundColor: settings.headerColor, 
                    color: settings.headerTextColor 
                  }}
                >
                  En-tête du tableau
                </div>
                <div className="px-3 py-2 text-sm">Ligne normale</div>
                <div 
                  className="px-3 py-2 text-sm"
                  style={{ backgroundColor: settings.alternateRowColor }}
                >
                  Ligne alternée
                </div>
                <div className="px-3 py-2 text-sm">Ligne normale</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={settings.orientation}
                  onValueChange={(value: 'portrait' | 'landscape') =>
                    setSettings(prev => ({ ...prev, orientation: value }))
                  }
                >
                  <SelectTrigger id="orientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Paysage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="margins">Marges</Label>
                <Select
                  value={settings.margins}
                  onValueChange={(value: 'normal' | 'narrow' | 'wide') =>
                    setSettings(prev => ({ ...prev, margins: value }))
                  }
                >
                  <SelectTrigger id="margins">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narrow">Étroites</SelectItem>
                    <SelectItem value="normal">Normales</SelectItem>
                    <SelectItem value="wide">Larges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">Taille de police</Label>
                <Select
                  value={settings.fontSize.toString()}
                  onValueChange={(value) =>
                    setSettings(prev => ({ ...prev, fontSize: parseInt(value) }))
                  }
                >
                  <SelectTrigger id="font-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Très petit (7pt)</SelectItem>
                    <SelectItem value="8">Petit (8pt)</SelectItem>
                    <SelectItem value="9">Normal (9pt)</SelectItem>
                    <SelectItem value="10">Grand (10pt)</SelectItem>
                    <SelectItem value="11">Très grand (11pt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base">Options de contenu</Label>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Filigrane DGDA</Label>
                  <p className="text-sm text-muted-foreground">
                    Afficher le filigrane en arrière-plan
                  </p>
                </div>
                <Switch
                  checked={settings.showWatermark}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, showWatermark: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Pied de page DGDA</Label>
                  <p className="text-sm text-muted-foreground">
                    Inclure les informations de contact DGDA
                  </p>
                </div>
                <Switch
                  checked={settings.showFooter}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, showFooter: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Date de génération</Label>
                  <p className="text-sm text-muted-foreground">
                    Afficher la date et l'heure de génération
                  </p>
                </div>
                <Switch
                  checked={settings.showGenerationDate}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, showGenerationDate: checked }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="header-footer" className="space-y-4 mt-4">
            {/* Custom Header Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">En-tête personnalisé</Label>
                  <p className="text-sm text-muted-foreground">
                    Personnaliser le texte de l'en-tête du document
                  </p>
                </div>
                <Switch
                  checked={settings.useCustomHeader}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, useCustomHeader: checked }))
                  }
                />
              </div>

              {settings.useCustomHeader && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="header-line1">Ligne 1 (italique)</Label>
                    <Input
                      id="header-line1"
                      value={settings.customHeaderLine1}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, customHeaderLine1: e.target.value }))
                      }
                      placeholder="République Démocratique du Congo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header-line2">Ligne 2 (gras)</Label>
                    <Input
                      id="header-line2"
                      value={settings.customHeaderLine2}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, customHeaderLine2: e.target.value }))
                      }
                      placeholder="Ministère des Finances"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header-line3">Ligne 3 (gras)</Label>
                    <Input
                      id="header-line3"
                      value={settings.customHeaderLine3}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, customHeaderLine3: e.target.value }))
                      }
                      placeholder="Direction Générale des Douanes et Accises"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header-line4">Ligne 4 (gras italique)</Label>
                    <Input
                      id="header-line4"
                      value={settings.customHeaderLine4}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, customHeaderLine4: e.target.value }))
                      }
                      placeholder="Direction Provinciale de Kinshasa-Ville"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4" />

            {/* Custom Footer Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Pied de page personnalisé</Label>
                  <p className="text-sm text-muted-foreground">
                    Personnaliser le texte du pied de page
                  </p>
                </div>
                <Switch
                  checked={settings.useCustomFooter}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, useCustomFooter: checked }))
                  }
                />
              </div>

              {settings.useCustomFooter && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="footer-line1">Ligne 1 (slogan)</Label>
                    <Input
                      id="footer-line1"
                      value={settings.customFooterLine1}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, customFooterLine1: e.target.value }))
                      }
                      placeholder="Tous mobilisés pour une douane d'action et d'excellence !"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer-line2">Ligne 2 (adresse)</Label>
                    <Input
                      id="footer-line2"
                      value={settings.customFooterLine2}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, customFooterLine2: e.target.value }))
                      }
                      placeholder="Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer-line3">Ligne 3 (téléphone)</Label>
                    <Input
                      id="footer-line3"
                      value={settings.customFooterLine3}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, customFooterLine3: e.target.value }))
                      }
                      placeholder="B.P.8248 KIN I / Tél. : +243(0) 818 968 481"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer-line4">Ligne 4 (email/web)</Label>
                    <Textarea
                      id="footer-line4"
                      value={settings.customFooterLine4}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, customFooterLine4: e.target.value }))
                      }
                      placeholder="Email : info@douane.gouv.cd - Web : https://www.douanes.gouv.cd"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Réinitialiser
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleExport}>
              <FileText className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
