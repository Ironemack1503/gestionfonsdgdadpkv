/**
 * Advanced Report Editor Main Component
 * Complete editor for DGDA reports with customizable templates
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileIcon,
  Download,
  RotateCcw,
  Eye,
  Edit3,
  Loader2,
  ChevronLeft,
  Columns3,
  Droplets
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/shared/PageHeader';

import { HeaderEditor } from './HeaderEditor';
import { FooterEditor } from './FooterEditor';
import { StyleEditor } from './StyleEditor';
import { WatermarkEditor, DEFAULT_WATERMARK_CONFIG } from './WatermarkEditor';
import type { WatermarkConfig } from './WatermarkEditor';
import { OrientationSelector } from './OrientationSelector';
import { ColumnEditor } from './ColumnEditor';
import { TemplatePreview } from './TemplatePreview';
import { TemplateSaveDialog } from './TemplateSaveDialog';
import { ReportTemplate, TableColumn, PageOrientation } from './types';
import { 
  REPORT_TEMPLATES, 
  cloneTemplate, 
  DEFAULT_DGDA_HEADER, 
  DEFAULT_DGDA_FOOTER, 
  DEFAULT_DGDA_STYLES,
  FEUILLE_CAISSE_COLUMNS,
  SOMMAIRE_COLUMNS,
  PROGRAMMATION_COLUMNS,
} from './templates';
import { 
  exportTemplateToPDF, 
  exportTemplateToExcel, 
  exportTemplateToWord 
} from './exportFunctions';

import { useRecettes } from '@/hooks/useRecettes';
import { useDepenses } from '@/hooks/useDepenses';
import { useProgrammations } from '@/hooks/useProgrammations';
import { useSavedReportTemplates } from '@/hooks/useReportTemplates';

// Available fields for each template type
const AVAILABLE_FIELDS = {
  feuille_caisse: [
    { key: 'date', label: 'Date', type: 'date' as const },
    { key: 'numero_ordre', label: 'N° Ordre', type: 'text' as const },
    { key: 'numero_beo', label: 'N° BEO', type: 'text' as const },
    { key: 'libelle', label: 'Libellé', type: 'text' as const },
    { key: 'recette', label: 'Recette', type: 'currency' as const },
    { key: 'depense', label: 'Dépense', type: 'currency' as const },
    { key: 'imputation', label: 'Imputation', type: 'text' as const },
    { key: 'service', label: 'Service', type: 'text' as const },
    { key: 'beneficiaire', label: 'Bénéficiaire', type: 'text' as const },
    { key: 'solde', label: 'Solde', type: 'currency' as const },
  ],
  sommaire: [
    { key: 'article', label: 'Article', type: 'text' as const },
    { key: 'designation', label: 'Désignation', type: 'text' as const },
    { key: 'recettes', label: 'Recettes', type: 'currency' as const },
    { key: 'depenses', label: 'Dépenses', type: 'currency' as const },
    { key: 'solde', label: 'Solde', type: 'currency' as const },
    { key: 'code', label: 'Code', type: 'text' as const },
  ],
  programmation: [
    { key: 'numero_ordre', label: 'N° Ordre', type: 'number' as const },
    { key: 'designation', label: 'Désignation', type: 'text' as const },
    { key: 'montant_prevu', label: 'Montant Prévu', type: 'currency' as const },
    { key: 'rubrique', label: 'Rubrique', type: 'text' as const },
    { key: 'periode', label: 'Période', type: 'text' as const },
    { key: 'jours', label: 'Jours', type: 'number' as const },
    { key: 'observation', label: 'Observation', type: 'text' as const },
  ],
};

export function AdvancedReportEditor() {
  const { toast } = useToast();
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('feuille_caisse');
  const [template, setTemplate] = useState<ReportTemplate>(() => cloneTemplate(REPORT_TEMPLATES[0]));
  const [reportTitle, setReportTitle] = useState('FEUILLE DE CAISSE');
  const [reportSubtitle, setReportSubtitle] = useState('MOIS DE JANVIER 2024');
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('header');
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);

  // Prevent default template auto-load from overriding user-selected template type
  const didAutoLoadDefaultRef = useRef(false);
  
  // Watermark config state
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>(
    template.watermarkConfig || DEFAULT_WATERMARK_CONFIG
  );

  // Load data
  const { recettes } = useRecettes();
  const { depenses } = useDepenses();
  const { programmations } = useProgrammations();
  
  // Load saved templates including default
  const { defaultTemplate, isLoading: isLoadingTemplates } = useSavedReportTemplates();
  
  // Auto-load default template (only once) - never override user changes
  useEffect(() => {
    if (didAutoLoadDefaultRef.current) return;
    if (!defaultTemplate || currentTemplateId || isLoadingTemplates) return;

    didAutoLoadDefaultRef.current = true;

      // Clone the default template config to ensure proper column references
      const loadedConfig = {
        ...defaultTemplate.config,
        columns: defaultTemplate.config.columns.map(c => ({ ...c })),
        header: { ...defaultTemplate.config.header },
        footer: { ...defaultTemplate.config.footer },
        styles: { 
          ...defaultTemplate.config.styles,
          rowStyles: defaultTemplate.config.styles.rowStyles?.map(r => ({ ...r })) || [],
        },
        watermarkConfig: defaultTemplate.config.watermarkConfig 
          ? { ...defaultTemplate.config.watermarkConfig } 
          : DEFAULT_WATERMARK_CONFIG,
      };
      
      setTemplate(loadedConfig);
      setWatermarkConfig(loadedConfig.watermarkConfig || DEFAULT_WATERMARK_CONFIG);
      setSelectedTemplateType(loadedConfig.type);
      setCurrentTemplateId(defaultTemplate.id);
      
      // Update title based on loaded template
      switch (loadedConfig.type) {
        case 'feuille_caisse':
          setReportTitle('FEUILLE DE CAISSE');
          setReportSubtitle('MOIS DE JANVIER 2024');
          break;
        case 'sommaire':
          setReportTitle('SOMMAIRE DU MOIS DE JANVIER 2024');
          setReportSubtitle('');
          break;
        case 'programmation':
          setReportTitle('PROGRAMMATION MENSUELLE');
          setReportSubtitle('MOIS DE JANVIER 2024');
          break;
      }
  }, [defaultTemplate, currentTemplateId, isLoadingTemplates]);

  // Prepare data based on template type
  const previewData = useMemo(() => {
    switch (selectedTemplateType) {
      case 'feuille_caisse':
        // Combine recettes and depenses
        const combined: Record<string, unknown>[] = [];
        
        recettes?.slice(0, 20).forEach(r => {
          combined.push({
            date: r.date_transaction,
            numero_ordre: r.numero_bon,
            numero_beo: r.numero_beo || '',
            libelle: r.motif,
            recette: r.montant,
            depense: null,
            imputation: '',
          });
        });
        
        depenses?.slice(0, 20).forEach(d => {
          combined.push({
            date: d.date_transaction,
            numero_ordre: d.numero_bon,
            numero_beo: d.numero_beo || '',
            libelle: d.motif,
            recette: null,
            depense: d.montant,
            imputation: d.rubrique?.code || '',
          });
        });
        
        return combined.sort((a, b) => {
          const dateA = new Date(a.date as string).getTime();
          const dateB = new Date(b.date as string).getTime();
          return dateA - dateB;
        });
      
      case 'sommaire':
        // Group by category for sommaire
        const categoryMap = new Map<string, { recettes: number; depenses: number }>();
        
        recettes?.forEach(r => {
          const key = r.provenance || 'Autres recettes';
          const current = categoryMap.get(key) || { recettes: 0, depenses: 0 };
          current.recettes += r.montant;
          categoryMap.set(key, current);
        });
        
        depenses?.forEach(d => {
          const key = d.rubrique?.libelle || 'Autres dépenses';
          const current = categoryMap.get(key) || { recettes: 0, depenses: 0 };
          current.depenses += d.montant;
          categoryMap.set(key, current);
        });
        
        return Array.from(categoryMap.entries()).map(([designation, values]) => ({
          article: '',
          designation,
          recettes: values.recettes || null,
          depenses: values.depenses || null,
        }));
      
      case 'programmation':
        return programmations?.slice(0, 20).map((p, idx) => ({
          numero_ordre: idx + 1,
          designation: p.designation,
          montant_prevu: p.montant_prevu,
          rubrique: p.rubrique?.libelle || '',
          periode: `${p.mois}/${p.annee}`,
        })) || [];
      
      default:
        return [];
    }
  }, [selectedTemplateType, recettes, depenses, programmations]);

  // Handle template type change - always reset to default columns for the new type
  const handleTemplateChange = useCallback((type: string) => {
    // Always get the base template from REPORT_TEMPLATES for the selected type
    const baseTemplate = REPORT_TEMPLATES.find(t => t.type === type);
    if (!baseTemplate) return;
    
    // Deep clone the template to avoid reference issues
    const cloned = cloneTemplate(baseTemplate);
    
    // Update all state
    setSelectedTemplateType(type);
    setTemplate(cloned);
    setWatermarkConfig(cloned.watermarkConfig || DEFAULT_WATERMARK_CONFIG);
    setCurrentTemplateId(null); // Reset saved template ID when changing template type
    
    // Update default title based on template
    switch (type) {
      case 'feuille_caisse':
        setReportTitle('FEUILLE DE CAISSE');
        setReportSubtitle('MOIS DE JANVIER 2024');
        break;
      case 'sommaire':
        setReportTitle('SOMMAIRE DU MOIS DE JANVIER 2024');
        setReportSubtitle('');
        break;
      case 'programmation':
        setReportTitle('PROGRAMMATION MENSUELLE');
        setReportSubtitle('MOIS DE JANVIER 2024');
        break;
    }
    
    toast({ 
      title: 'Type de rapport changé', 
      description: `Modèle "${baseTemplate.name}" chargé avec ses colonnes par défaut` 
    });
  }, [toast]);

  // Handle loading a saved template
  const handleLoadSavedTemplate = useCallback((loadedTemplate: ReportTemplate) => {
    setTemplate(loadedTemplate);
    setWatermarkConfig(loadedTemplate.watermarkConfig || DEFAULT_WATERMARK_CONFIG);
    setSelectedTemplateType(loadedTemplate.type);
    
    // Update title based on loaded template
    switch (loadedTemplate.type) {
      case 'feuille_caisse':
        setReportTitle('FEUILLE DE CAISSE');
        setReportSubtitle('MOIS DE JANVIER 2024');
        break;
      case 'sommaire':
        setReportTitle('SOMMAIRE DU MOIS DE JANVIER 2024');
        setReportSubtitle('');
        break;
      case 'programmation':
        setReportTitle('PROGRAMMATION MENSUELLE');
        setReportSubtitle('MOIS DE JANVIER 2024');
        break;
    }
    
    toast({ title: 'Modèle chargé', description: `Le modèle "${loadedTemplate.name}" a été chargé` });
  }, [toast]);

  // Handle columns change
  const handleColumnsChange = useCallback((columns: TableColumn[]) => {
    setTemplate(prev => ({ ...prev, columns, updatedAt: new Date() }));
  }, []);

  // Handle watermark change
  const handleWatermarkChange = useCallback((config: WatermarkConfig) => {
    setWatermarkConfig(config);
    setTemplate(prev => ({ 
      ...prev, 
      watermark: config.enabled ? config.text : undefined,
      watermarkConfig: config,
      updatedAt: new Date() 
    }));
  }, []);

  // Update template parts
  const handleHeaderChange = useCallback((header: typeof template.header) => {
    setTemplate(prev => ({ ...prev, header, updatedAt: new Date() }));
  }, []);

  const handleFooterChange = useCallback((footer: typeof template.footer) => {
    setTemplate(prev => ({ ...prev, footer, updatedAt: new Date() }));
  }, []);

  const handleStylesChange = useCallback((styles: typeof template.styles) => {
    setTemplate(prev => ({ ...prev, styles, updatedAt: new Date() }));
  }, []);

  // Reset to defaults
  const handleReset = useCallback(() => {
    const found = REPORT_TEMPLATES.find(t => t.type === selectedTemplateType);
    if (found) {
      const cloned = cloneTemplate(found);
      setTemplate(cloned);
      setWatermarkConfig(cloned.watermarkConfig || DEFAULT_WATERMARK_CONFIG);
      toast({ title: 'Réinitialisé', description: 'Le modèle a été réinitialisé aux valeurs par défaut' });
    }
  }, [selectedTemplateType, toast]);

  // Get available fields for current template
  const availableFields = useMemo(() => {
    return AVAILABLE_FIELDS[selectedTemplateType as keyof typeof AVAILABLE_FIELDS] || [];
  }, [selectedTemplateType]);

  // Export handlers
  const handleExportPDF = useCallback(async () => {
    setIsExporting('pdf');
    try {
      await exportTemplateToPDF(template, previewData, reportTitle, reportSubtitle);
      toast({ title: 'Export PDF réussi', description: 'Le document a été téléchargé' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ title: 'Erreur', description: 'Impossible de générer le PDF', variant: 'destructive' });
    } finally {
      setIsExporting(null);
    }
  }, [template, previewData, reportTitle, reportSubtitle, toast]);

  const handleExportExcel = useCallback(() => {
    setIsExporting('excel');
    try {
      exportTemplateToExcel(template, previewData, reportTitle, reportSubtitle);
      toast({ title: 'Export Excel réussi', description: 'Le document a été téléchargé' });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({ title: 'Erreur', description: 'Impossible de générer le fichier Excel', variant: 'destructive' });
    } finally {
      setIsExporting(null);
    }
  }, [template, previewData, reportTitle, reportSubtitle, toast]);

  const handleExportWord = useCallback(() => {
    setIsExporting('word');
    try {
      exportTemplateToWord(template, previewData, reportTitle, reportSubtitle);
      toast({ title: 'Export Word réussi', description: 'Le document a été téléchargé' });
    } catch (error) {
      console.error('Word export error:', error);
      toast({ title: 'Erreur', description: 'Impossible de générer le fichier Word', variant: 'destructive' });
    } finally {
      setIsExporting(null);
    }
  }, [template, previewData, reportTitle, reportSubtitle, toast]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Éditeur de Rapports Avancé"
        description="Personnalisez les en-têtes, pieds de page et mise en forme de vos rapports officiels DGDA"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <NavLink to="/rapports">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>
          </NavLink>
          
          <Select value={selectedTemplateType} onValueChange={handleTemplateChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Choisir un modèle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feuille_caisse">Feuille de Caisse</SelectItem>
              <SelectItem value="sommaire">Sommaire Mensuel</SelectItem>
              <SelectItem value="programmation">Programmation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Template Save/Load */}
          <TemplateSaveDialog
            currentTemplate={template}
            currentTemplateId={currentTemplateId}
            onTemplateIdChange={setCurrentTemplateId}
            onLoadTemplate={handleLoadSavedTemplate}
          />
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPreviewMode(m => m === 'edit' ? 'preview' : 'edit')}
          >
            {previewMode === 'edit' ? <Eye className="w-4 h-4 mr-1" /> : <Edit3 className="w-4 h-4 mr-1" />}
            {previewMode === 'edit' ? 'Aperçu' : 'Éditer'}
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button 
            size="sm" 
            variant="outline"
            onClick={handleExportPDF}
            disabled={isExporting !== null}
          >
            {isExporting === 'pdf' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
            PDF
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleExportExcel}
            disabled={isExporting !== null}
          >
            {isExporting === 'excel' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-1" />}
            Excel
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleExportWord}
            disabled={isExporting !== null}
          >
            {isExporting === 'word' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileIcon className="w-4 h-4 mr-1" />}
            Word
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Editors */}
        <div className="lg:col-span-1 space-y-4">
          {/* Title settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Titre du rapport</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs text-muted-foreground">Titre principal</Label>
                <Input
                  id="title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle" className="text-xs text-muted-foreground">Sous-titre (période)</Label>
                <Input
                  id="subtitle"
                  value={reportSubtitle}
                  onChange={(e) => setReportSubtitle(e.target.value)}
                  placeholder="MOIS DE JANVIER 2024"
                  className="h-9 text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <Label className="text-sm">Afficher les totaux</Label>
                <Switch
                  checked={template.showTotals}
                  onCheckedChange={(checked) => setTemplate(prev => ({ ...prev, showTotals: checked }))}
                />
              </div>
              
              <OrientationSelector
                orientation={template.orientation}
                onChange={(orientation) => setTemplate(prev => ({ ...prev, orientation }))}
              />
            </CardContent>
          </Card>

          {/* Tabs for header/footer/styles/watermark/columns */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="header" className="text-xs">En-tête</TabsTrigger>
              <TabsTrigger value="footer" className="text-xs">Pied</TabsTrigger>
              <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
              <TabsTrigger value="watermark" className="text-xs">
                <Droplets className="w-3 h-3 mr-1" />
                Filig.
              </TabsTrigger>
              <TabsTrigger value="columns" className="text-xs">
                <Columns3 className="w-3 h-3 mr-1" />
                Col.
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="header" className="mt-4">
              <HeaderEditor header={template.header} onChange={handleHeaderChange} />
            </TabsContent>
            
            <TabsContent value="footer" className="mt-4">
              <FooterEditor footer={template.footer} onChange={handleFooterChange} />
            </TabsContent>
            
            <TabsContent value="style" className="mt-4">
              <StyleEditor styles={template.styles} onChange={handleStylesChange} />
            </TabsContent>
            
            <TabsContent value="watermark" className="mt-4">
              <WatermarkEditor config={watermarkConfig} onChange={handleWatermarkChange} />
            </TabsContent>
            
            <TabsContent value="columns" className="mt-4">
              <ColumnEditor 
                columns={template.columns} 
                onChange={handleColumnsChange}
                availableFields={availableFields}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel - Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Aperçu du document</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {previewData.length} lignes • {template.orientation === 'landscape' ? 'Paysage' : 'Portrait'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] rounded-lg border bg-muted/30 p-4">
                <div className="flex justify-center">
                  <div className={template.orientation === 'landscape' ? 'w-full max-w-4xl' : 'w-full max-w-lg'}>
                    <TemplatePreview
                      template={template}
                      data={previewData}
                      title={reportTitle}
                      subtitle={reportSubtitle}
                      watermarkConfig={watermarkConfig}
                    />
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdvancedReportEditor;
