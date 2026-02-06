/**
 * ReportBuilder Main Component
 * Complete drag-drop report builder with formulas and groupings
 */

import { useState, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Printer,
  RotateCcw,
  Search,
  Loader2,
  Settings
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DraggableField } from './DraggableField';
import { DroppableCanvas } from './DroppableCanvas';
import { FormulaEditor } from './FormulaEditor';
import { GroupingEditor } from './GroupingEditor';
import { ReportPreview } from './ReportPreview';
import { TemplateManager } from './TemplateManager';
import { LivePDFPreview } from './LivePDFPreview';
import { useReportBuilderExport } from './useReportBuilderExport';
import {
  ReportConfig,
  ReportField,
  CalculatedField,
  ReportGrouping,
  AVAILABLE_FIELDS,
  DEFAULT_FORMULAS,
} from './types';
import { useRecettes } from '@/hooks/useRecettes';
import { useDepenses } from '@/hooks/useDepenses';
import { useProgrammations } from '@/hooks/useProgrammations';
import { useToast } from '@/hooks/use-toast';

const initialConfig: ReportConfig = {
  id: '',
  name: 'Nouveau Rapport',
  description: '',
  selectedFields: [],
  calculatedFields: [],
  groupings: [],
  filters: [],
  showTotals: true,
  showSubtotals: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function ReportBuilder() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>(initialConfig);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('fields');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>(undefined);

  // Load a template configuration
  const handleLoadTemplate = useCallback((loadedConfig: ReportConfig) => {
    setConfig(loadedConfig);
    toast({ title: 'Modèle chargé', description: `"${loadedConfig.name}" a été chargé` });
  }, [toast]);

  // Export hook with settings
  const { 
    handleExportPDF, 
    handleExportExcel, 
    handleExportWord, 
    handleExportCSV,
    settingsLoading 
  } = useReportBuilderExport();

  // Data sources
  const { recettes, isLoading: loadingRecettes, fetchAllForExport: fetchRecettes } = useRecettes();
  const { depenses, isLoading: loadingDepenses, fetchAllForExport: fetchDepenses } = useDepenses();
  const { programmations, isLoading: loadingProg } = useProgrammations();

  const isLoading = loadingRecettes || loadingDepenses || loadingProg;

  // Filter available fields by search
  const filteredFields = useMemo(() => {
    if (!searchQuery) return AVAILABLE_FIELDS;
    const query = searchQuery.toLowerCase();
    return AVAILABLE_FIELDS.filter(
      f => f.label.toLowerCase().includes(query) || f.source.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group fields by source
  const groupedFields = useMemo(() => {
    const groups: Record<string, ReportField[]> = {
      recettes: [],
      depenses: [],
      programmations: [],
    };
    filteredFields.forEach(field => {
      if (groups[field.source]) {
        groups[field.source].push(field);
      }
    });
    return groups;
  }, [filteredFields]);

  // Combine data for preview
  const previewData = useMemo(() => {
    // For simplicity, combine all data sources
    // In a real scenario, you'd join based on selected fields
    const combined: Record<string, unknown>[] = [];
    
    // Add null checks to prevent errors when data is loading
    if (recettes && Array.isArray(recettes)) {
      recettes.forEach(r => {
        combined.push({
          ...r,
          type: 'recette',
          category: 'Recettes',
        });
      });
    }
    
    if (depenses && Array.isArray(depenses)) {
      depenses.forEach(d => {
        combined.push({
          ...d,
          type: 'depense',
          category: d.rubrique?.libelle || 'Dépenses',
          rubrique: d.rubrique?.libelle,
        });
      });
    }
    
    return combined.slice(0, 50); // Limit for preview
  }, [recettes, depenses]);

  // Field handlers
  const handleFieldDrop = useCallback((field: ReportField) => {
    setConfig(prev => ({
      ...prev,
      selectedFields: [...prev.selectedFields, { ...field }],
      updatedAt: new Date(),
    }));
  }, []);

  const handleFieldRemove = useCallback((fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.filter(f => f.id !== fieldId),
      updatedAt: new Date(),
    }));
  }, []);

  const handleFieldToggleVisibility = useCallback((fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.map(f =>
        f.id === fieldId ? { ...f, isVisible: !f.isVisible } : f
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const handleFieldReorder = useCallback((dragIndex: number, dropIndex: number) => {
    setConfig(prev => {
      const newFields = [...prev.selectedFields];
      const [removed] = newFields.splice(dragIndex, 1);
      newFields.splice(dropIndex, 0, removed);
      return {
        ...prev,
        selectedFields: newFields,
        updatedAt: new Date(),
      };
    });
  }, []);

  // Formula handlers
  const handleAddFormula = useCallback((formula: CalculatedField) => {
    setConfig(prev => ({
      ...prev,
      calculatedFields: [...prev.calculatedFields, formula],
      updatedAt: new Date(),
    }));
  }, []);

  const handleRemoveFormula = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      calculatedFields: prev.calculatedFields.filter(f => f.id !== id),
      updatedAt: new Date(),
    }));
  }, []);

  const handleAddDefaultFormulas = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      calculatedFields: [...DEFAULT_FORMULAS],
      updatedAt: new Date(),
    }));
    toast({ title: 'Formules ajoutées', description: 'TOTAL, ENCAISSE et BALANCE ont été ajoutés' });
  }, [toast]);

  // Grouping handlers
  const handleAddGrouping = useCallback((grouping: ReportGrouping) => {
    setConfig(prev => ({
      ...prev,
      groupings: [...prev.groupings, grouping],
      updatedAt: new Date(),
    }));
  }, []);

  const handleRemoveGrouping = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      groupings: prev.groupings.filter(g => g.id !== id),
      updatedAt: new Date(),
    }));
  }, []);

  const handleToggleGroupingExpanded = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      groupings: prev.groupings.map(g =>
        g.id === id ? { ...g, isExpanded: !g.isExpanded } : g
      ),
    }));
  }, []);

  const handleToggleGroupingSubtotal = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      groupings: prev.groupings.map(g =>
        g.id === id ? { ...g, showSubtotal: !g.showSubtotal } : g
      ),
      updatedAt: new Date(),
    }));
  }, []);

  // Reset config
  const handleReset = useCallback(() => {
    setConfig(initialConfig);
    toast({ title: 'Réinitialisé', description: 'Le constructeur a été réinitialisé' });
  }, [toast]);

  // Refresh preview data
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([fetchRecettes(), fetchDepenses()]);
      toast({ title: 'Actualisé', description: 'Les données ont été mises à jour' });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'actualiser les données', variant: 'destructive' });
    }
  }, [fetchRecettes, fetchDepenses, toast]);

  // Calculate totals for export
  const calculatedTotals = useMemo(() => {
    const result: Record<string, number> = {};
    const visibleFields = config.selectedFields.filter(f => f.isVisible);
    
    visibleFields.forEach(field => {
      if (field.type === 'currency' || field.type === 'number') {
        result[field.id] = previewData.reduce((sum, row) => {
          const value = row[field.name];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
      }
    });
    
    // Add calculated field totals
    config.calculatedFields.forEach(calc => {
      if (calc.formula === 'sum' && calc.sourceField) {
        const sourceField = visibleFields.find(f => f.id === calc.sourceField);
        if (sourceField) {
          result[calc.id] = result[sourceField.id] || 0;
        }
      } else if (calc.id === 'total_recettes') {
        result[calc.id] = recettes.reduce((sum, r) => sum + r.montant, 0);
      } else if (calc.id === 'total_depenses') {
        result[calc.id] = depenses.reduce((sum, d) => sum + d.montant, 0);
      } else if (calc.id === 'encaisse') {
        const totalRecettes = recettes.reduce((sum, r) => sum + r.montant, 0);
        const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
        result[calc.id] = totalRecettes - totalDepenses;
      } else if (calc.id === 'balance') {
        const totalRecettes = recettes.reduce((sum, r) => sum + r.montant, 0);
        const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
        result[calc.id] = totalRecettes - totalDepenses; // Simplified
      }
    });
    
    return result;
  }, [config.selectedFields, config.calculatedFields, previewData, recettes, depenses]);

  // Export handlers
  const onExportPDF = useCallback(async () => {
    if (config.selectedFields.filter(f => f.isVisible).length === 0) {
      toast({ title: 'Attention', description: 'Ajoutez des colonnes au rapport avant d\'exporter', variant: 'destructive' });
      return;
    }
    setIsExporting('pdf');
    try {
      await handleExportPDF({
        config,
        data: previewData,
        totals: calculatedTotals,
        title: config.name || 'Rapport Personnalisé',
        subtitle: `Période: ${new Date().toLocaleDateString('fr-FR')}`,
      });
    } finally {
      setIsExporting(null);
    }
  }, [config, previewData, calculatedTotals, handleExportPDF, toast]);

  const onExportExcel = useCallback(() => {
    if (config.selectedFields.filter(f => f.isVisible).length === 0) {
      toast({ title: 'Attention', description: 'Ajoutez des colonnes au rapport avant d\'exporter', variant: 'destructive' });
      return;
    }
    setIsExporting('excel');
    try {
      handleExportExcel({
        config,
        data: previewData,
        totals: calculatedTotals,
        title: config.name || 'Rapport Personnalisé',
        subtitle: `Période: ${new Date().toLocaleDateString('fr-FR')}`,
      });
    } finally {
      setIsExporting(null);
    }
  }, [config, previewData, calculatedTotals, handleExportExcel, toast]);

  const onExportWord = useCallback(() => {
    if (config.selectedFields.filter(f => f.isVisible).length === 0) {
      toast({ title: 'Attention', description: 'Ajoutez des colonnes au rapport avant d\'exporter', variant: 'destructive' });
      return;
    }
    setIsExporting('word');
    try {
      handleExportWord({
        config,
        data: previewData,
        totals: calculatedTotals,
        title: config.name || 'Rapport Personnalisé',
        subtitle: `Période: ${new Date().toLocaleDateString('fr-FR')}`,
      });
    } finally {
      setIsExporting(null);
    }
  }, [config, previewData, calculatedTotals, handleExportWord, toast]);

  const onExportCSV = useCallback(() => {
    if (config.selectedFields.filter(f => f.isVisible).length === 0) {
      toast({ title: 'Attention', description: 'Ajoutez des colonnes au rapport avant d\'exporter', variant: 'destructive' });
      return;
    }
    setIsExporting('csv');
    try {
      handleExportCSV({
        config,
        data: previewData,
        totals: calculatedTotals,
        title: config.name || 'Rapport Personnalisé',
      });
    } finally {
      setIsExporting(null);
    }
  }, [config, previewData, calculatedTotals, handleExportCSV, toast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Constructeur de Rapport</h2>
            <p className="text-sm text-muted-foreground">
              Glissez-déposez les champs pour créer votre rapport personnalisé
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              Imprimer
            </Button>
            <NavLink to="/parametres/rapports">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Paramètres
              </Button>
            </NavLink>
            <TemplateManager
              currentConfig={config}
              onLoadTemplate={handleLoadTemplate}
              currentTemplateId={currentTemplateId}
              onTemplateIdChange={setCurrentTemplateId}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Fields & Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Champs disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un champ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Fields by source */}
                <Tabs defaultValue="recettes" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="recettes" className="text-xs">
                      Recettes
                    </TabsTrigger>
                    <TabsTrigger value="depenses" className="text-xs">
                      Dépenses
                    </TabsTrigger>
                    <TabsTrigger value="programmations" className="text-xs">
                      Prog.
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="recettes">
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2 pr-4">
                        {groupedFields.recettes.map(field => (
                          <DraggableField
                            key={field.id}
                            field={field}
                            isSelected={config.selectedFields.some(f => f.id === field.id)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="depenses">
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2 pr-4">
                        {groupedFields.depenses.map(field => (
                          <DraggableField
                            key={field.id}
                            field={field}
                            isSelected={config.selectedFields.some(f => f.id === field.id)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="programmations">
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2 pr-4">
                        {groupedFields.programmations.map(field => (
                          <DraggableField
                            key={field.id}
                            field={field}
                            isSelected={config.selectedFields.some(f => f.id === field.id)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Drop zone */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Colonnes du rapport</CardTitle>
              </CardHeader>
              <CardContent>
                <DroppableCanvas
                  selectedFields={config.selectedFields}
                  onFieldDrop={handleFieldDrop}
                  onFieldRemove={handleFieldRemove}
                  onFieldToggleVisibility={handleFieldToggleVisibility}
                  onFieldReorder={handleFieldReorder}
                />
              </CardContent>
            </Card>

            {/* Formulas */}
            <FormulaEditor
              calculatedFields={config.calculatedFields}
              onAddFormula={handleAddFormula}
              onRemoveFormula={handleRemoveFormula}
              onAddDefaultFormulas={handleAddDefaultFormulas}
            />

            {/* Groupings */}
            <GroupingEditor
              groupings={config.groupings}
              showTotals={config.showTotals}
              showSubtotals={config.showSubtotals}
              onAddGrouping={handleAddGrouping}
              onRemoveGrouping={handleRemoveGrouping}
              onToggleGroupingExpanded={handleToggleGroupingExpanded}
              onToggleGroupingSubtotal={handleToggleGroupingSubtotal}
              onToggleTotals={(show) => setConfig(prev => ({ ...prev, showTotals: show }))}
              onToggleSubtotals={(show) => setConfig(prev => ({ ...prev, showSubtotals: show }))}
            />
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2">
            <ReportPreview
              config={config}
              data={previewData}
              isLoading={isLoading}
              onRefresh={handleRefresh}
            />

            {/* Live PDF Preview */}
            <LivePDFPreview
              config={config}
              data={previewData}
              totals={calculatedTotals}
            />

            {/* Export options */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Exporter le rapport
                  </span>
                  {settingsLoading && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Chargement paramètres...
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="default" 
                    className="flex-1 sm:flex-none"
                    onClick={onExportPDF}
                    disabled={isExporting !== null || config.selectedFields.filter(f => f.isVisible).length === 0}
                  >
                    {isExporting === 'pdf' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none"
                    onClick={onExportExcel}
                    disabled={isExporting !== null || config.selectedFields.filter(f => f.isVisible).length === 0}
                  >
                    {isExporting === 'excel' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none"
                    onClick={onExportWord}
                    disabled={isExporting !== null || config.selectedFields.filter(f => f.isVisible).length === 0}
                  >
                    {isExporting === 'word' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Word
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none"
                    onClick={onExportCSV}
                    disabled={isExporting !== null || config.selectedFields.filter(f => f.isVisible).length === 0}
                  >
                    {isExporting === 'csv' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    CSV
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Les exports utilisent les paramètres de mise en forme configurés dans{' '}
                  <NavLink to="/parametres/rapports" className="text-primary hover:underline">
                    Paramètres → Mise en forme des rapports
                  </NavLink>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default ReportBuilder;
