/**
 * Sommaire Report Page
 * Displays summary of cash operations grouped by category
 * With monthly/annual views, filtering, and synthesis modes
 * Uses Advanced Report Editor templates for unified export
 */

import { useState, useMemo } from 'react';
import { Calendar, Loader2, FileText, FileSpreadsheet, FileDown, Printer, LayoutGrid, List, Filter, X } from 'lucide-react';
import { formatMontant } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useReportData, numberToFrenchWords } from '@/hooks/useReportData';
import { useAdvancedExport } from '@/hooks/useAdvancedExport';
import { exportToPDF, exportToExcel, ExportColumn } from '@/lib/exportUtils';
import { exportToWord, generateTableHTML, generateSummaryHTML } from '@/lib/wordExport';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRubriques } from '@/hooks/useRubriques';
import { sortRubriquesWithSoldeFirst } from '@/lib/rubriquesSortUtils';

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

type ViewMode = 'mensuel' | 'annuel';
type DisplayMode = 'detail' | 'synthese';

export default function SommaireReportPage() {
  const currentDate = new Date();
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(currentDate.getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('mensuel');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('detail');
  const [selectedRubrique, setSelectedRubrique] = useState<string>('all');
  const [showSoldeDetails, setShowSoldeDetails] = useState(true);
  
  const { generateSommaire, calculateEtatResultat, isLoading, recettes, depenses } = useReportData();
  const { rubriques } = useRubriques();

  // Calculate date range based on view mode
  const { dateDebut, dateFin } = useMemo(() => {
    if (viewMode === 'mensuel') {
      const debut = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedAnnee, selectedMois, 0).getDate();
      const fin = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-${lastDay}`;
      return { dateDebut: debut, dateFin: fin };
    } else {
      // Annual view: January to selected month or full year
      return {
        dateDebut: `${selectedAnnee}-01-01`,
        dateFin: `${selectedAnnee}-12-31`
      };
    }
  }, [selectedMois, selectedAnnee, viewMode]);

  // Fetch previous period balance
  const { data: soldePrecedent = 0, isLoading: loadingBalance } = useQuery({
    queryKey: ['previous-period-balance-sommaire', viewMode, selectedMois, selectedAnnee],
    queryFn: async () => {
      if (viewMode === 'annuel') {
        // For annual, get balance from previous year
        const prevYear = selectedAnnee - 1;
        const { data: prevRecettes } = await supabase
          .from('recettes')
          .select('montant')
          .gte('date_transaction', `${prevYear}-01-01`)
          .lte('date_transaction', `${prevYear}-12-31`);

        const { data: prevDepenses } = await supabase
          .from('depenses')
          .select('montant')
          .gte('date_transaction', `${prevYear}-01-01`)
          .lte('date_transaction', `${prevYear}-12-31`);

        const totalRecettes = (prevRecettes || []).reduce((acc, r) => acc + Number(r.montant), 0);
        const totalDepenses = (prevDepenses || []).reduce((acc, d) => acc + Number(d.montant), 0);
        return totalRecettes - totalDepenses;
      } else {
        // Monthly balance
        let prevMois = selectedMois - 1;
        let prevAnnee = selectedAnnee;
        if (prevMois === 0) {
          prevMois = 12;
          prevAnnee = selectedAnnee - 1;
        }

        const startDate = `${prevAnnee}-${String(prevMois).padStart(2, '0')}-01`;
        const lastDayPrev = new Date(prevAnnee, prevMois, 0).getDate();
        const endDate = `${prevAnnee}-${String(prevMois).padStart(2, '0')}-${lastDayPrev}`;

        const { data: prevRecettes } = await supabase
          .from('recettes')
          .select('montant')
          .gte('date_transaction', startDate)
          .lte('date_transaction', endDate);

        const { data: prevDepenses } = await supabase
          .from('depenses')
          .select('montant')
          .gte('date_transaction', startDate)
          .lte('date_transaction', endDate);

        const totalRecettes = (prevRecettes || []).reduce((acc, r) => acc + Number(r.montant), 0);
        const totalDepenses = (prevDepenses || []).reduce((acc, d) => acc + Number(d.montant), 0);
        return totalRecettes - totalDepenses;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Generate sommaire data with optional rubrique filter
  const sommaireData = useMemo(() => {
    const baseData = generateSommaire({ dateDebut, dateFin }, soldePrecedent);
    
    if (selectedRubrique === 'all') {
      return baseData;
    }
    
    // Filter by selected rubrique
    return baseData.filter(row => 
      row.imp === 'SP' || row.imp === 'R' || row.imp === selectedRubrique
    );
  }, [generateSommaire, dateDebut, dateFin, soldePrecedent, selectedRubrique]);

  // Generate annual breakdown by month for annual view
  const annualBreakdown = useMemo(() => {
    if (viewMode !== 'annuel') return [];
    
    return moisNoms.map((moisNom, index) => {
      const mois = index + 1;
      const debut = `${selectedAnnee}-${String(mois).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedAnnee, mois, 0).getDate();
      const fin = `${selectedAnnee}-${String(mois).padStart(2, '0')}-${lastDay}`;
      
      const monthRecettes = recettes
        .filter(r => r.date_transaction >= debut && r.date_transaction <= fin)
        .reduce((acc, r) => acc + Number(r.montant), 0);
      
      const monthDepenses = depenses
        .filter(d => d.date_transaction >= debut && d.date_transaction <= fin)
        .reduce((acc, d) => acc + Number(d.montant), 0);
      
      return {
        mois: moisNom,
        recettes: monthRecettes,
        depenses: monthDepenses,
        solde: monthRecettes - monthDepenses,
        operations: recettes.filter(r => r.date_transaction >= debut && r.date_transaction <= fin).length +
                   depenses.filter(d => d.date_transaction >= debut && d.date_transaction <= fin).length
      };
    });
  }, [viewMode, selectedAnnee, recettes, depenses]);

  // Synthesis by rubrique for synthesis mode
  const syntheseData = useMemo(() => {
    if (displayMode !== 'synthese') return [];
    
    const filteredRecettes = recettes.filter(r => 
      r.date_transaction >= dateDebut && r.date_transaction <= dateFin
    );
    const filteredDepenses = depenses.filter(d => 
      d.date_transaction >= dateDebut && d.date_transaction <= dateFin
    );

    // Group by rubrique
    const rubriquesMap = new Map<string, { 
      code: string; 
      libelle: string; 
      recettes: number; 
      depenses: number;
      operations: number;
    }>();

    // Recettes (no rubrique, so group under "RECETTES")
    const totalRecettes = filteredRecettes.reduce((acc, r) => acc + Number(r.montant), 0);
    if (totalRecettes > 0) {
      rubriquesMap.set('RECETTES', {
        code: 'R',
        libelle: 'Total Recettes',
        recettes: totalRecettes,
        depenses: 0,
        operations: filteredRecettes.length
      });
    }

    // Depenses by rubrique
    filteredDepenses.forEach(d => {
      const code = d.rubrique?.code || 'AUTRE';
      const libelle = d.rubrique?.libelle || 'Autres';
      const existing = rubriquesMap.get(code) || { 
        code, 
        libelle, 
        recettes: 0, 
        depenses: 0,
        operations: 0 
      };
      existing.depenses += Number(d.montant);
      existing.operations += 1;
      rubriquesMap.set(code, existing);
    });

    return Array.from(rubriquesMap.values())
      .sort((a, b) => {
        // Utiliser le tri qui place "Solde du mois (antérieur)" en premier
        const aIsSolde = a.libelle.includes('Solde du mois (antérieur)');
        const bIsSolde = b.libelle.includes('Solde du mois (antérieur)');
        
        if (aIsSolde && !bIsSolde) return -1;
        if (!aIsSolde && bIsSolde) return 1;
        
        return a.code.localeCompare(b.code);
      });
  }, [displayMode, recettes, depenses, dateDebut, dateFin]);

  const etatResultat = useMemo(() => {
    return calculateEtatResultat({ dateDebut, dateFin }, soldePrecedent);
  }, [calculateEtatResultat, dateDebut, dateFin, soldePrecedent]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR');
  const getPeriodLabel = () => {
    if (viewMode === 'annuel') {
      return `Année ${selectedAnnee}`;
    }
    return `${moisNoms[selectedMois - 1]} ${selectedAnnee}`;
  };

  // Totals
  const totalRecettes = sommaireData.reduce((acc, row) => acc + row.recettes, 0);
  const totalDepenses = sommaireData.reduce((acc, row) => acc + row.depenses, 0);
  const totalGeneral = sommaireData.reduce((acc, row) => acc + row.total, 0);

  // Export handlers
  const getExportTitle = () => {
    const modeLabel = viewMode === 'annuel' ? 'Annuel' : 'Mensuel';
    const displayLabel = displayMode === 'synthese' ? ' (Synthèse)' : '';
    return `Sommaire ${modeLabel} - ${getPeriodLabel()}${displayLabel}`;
  };

  const handleExportPDF = async () => {
    const columns: ExportColumn[] = displayMode === 'synthese' ? [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Libellé', key: 'libelle', width: 40 },
      { header: 'Recettes', key: 'recettes', width: 25 },
      { header: 'Dépenses', key: 'depenses', width: 25 },
      { header: 'Opérations', key: 'operations', width: 15 },
    ] : [
      { header: 'IMP', key: 'imp', width: 15 },
      { header: 'Désignation', key: 'designation', width: 50 },
      { header: 'Recettes', key: 'recettes', width: 20 },
      { header: 'Dépenses', key: 'depenses', width: 20 },
      { header: 'Total', key: 'total', width: 20 },
      { header: 'Caisse', key: 'caisse', width: 20 },
      { header: 'Balance', key: 'balance', width: 20 },
    ];

    const data = displayMode === 'synthese' 
      ? syntheseData.map(s => ({ ...s, imp: s.code, designation: s.libelle, total: s.recettes - s.depenses, caisse: 0, balance: 0 }))
      : sommaireData;
    const filename = `sommaire_${viewMode}_${selectedAnnee}${viewMode === 'mensuel' ? `_${moisNoms[selectedMois - 1].toLowerCase()}` : ''}`;

    await exportToPDF({
      title: getExportTitle(),
      filename,
      subtitle: `Période: ${formatDate(dateDebut)} au ${formatDate(dateFin)} | Solde: ${numberToFrenchWords(Math.floor(Math.abs(etatResultat.balance)))} Francs Congolais`,
      columns,
      data: displayMode === 'synthese' ? syntheseData : sommaireData,
    });
  };

  const handleExportExcel = () => {
    const columns: ExportColumn[] = displayMode === 'synthese' ? [
      { header: 'Code', key: 'code', width: 12 },
      { header: 'Libellé', key: 'libelle', width: 40 },
      { header: 'Recettes (FC)', key: 'recettes', width: 18 },
      { header: 'Dépenses (FC)', key: 'depenses', width: 18 },
      { header: 'Opérations', key: 'operations', width: 12 },
    ] : [
      { header: 'IMP', key: 'imp', width: 10 },
      { header: 'Désignation', key: 'designation', width: 40 },
      { header: 'Recettes (FC)', key: 'recettes', width: 18 },
      { header: 'Dépenses (FC)', key: 'depenses', width: 18 },
      { header: 'Total', key: 'total', width: 18 },
      { header: 'Caisse', key: 'caisse', width: 18 },
      { header: 'Balance', key: 'balance', width: 18 },
    ];

    const filename = `sommaire_${viewMode}_${selectedAnnee}${viewMode === 'mensuel' ? `_${moisNoms[selectedMois - 1].toLowerCase()}` : ''}`;

    exportToExcel({
      title: getExportTitle(),
      filename,
      subtitle: `Solde en lettres: ${numberToFrenchWords(Math.floor(Math.abs(etatResultat.balance)))} Francs Congolais`,
      columns,
      data: displayMode === 'synthese' ? syntheseData : sommaireData,
    });
  };

  const handleExportWord = () => {
    const tableColumns = displayMode === 'synthese' ? [
      { header: 'Code', key: 'code', type: 'text' as const },
      { header: 'Libellé', key: 'libelle', type: 'text' as const },
      { header: 'Recettes', key: 'recettes', type: 'currency' as const },
      { header: 'Dépenses', key: 'depenses', type: 'currency' as const },
      { header: 'Opérations', key: 'operations', type: 'number' as const },
    ] : [
      { header: 'IMP', key: 'imp', type: 'text' as const },
      { header: 'Désignation', key: 'designation', type: 'text' as const },
      { header: 'Recettes', key: 'recettes', type: 'currency' as const },
      { header: 'Dépenses', key: 'depenses', type: 'currency' as const },
      { header: 'Total', key: 'total', type: 'currency' as const },
      { header: 'Caisse', key: 'caisse', type: 'currency' as const },
      { header: 'Balance', key: 'balance', type: 'currency' as const },
    ];

    const summaryHTML = generateSummaryHTML([
      { label: 'Total Recettes', value: totalRecettes, type: 'success' },
      { label: 'Total Dépenses', value: totalDepenses, type: 'danger' },
      { label: 'Balance Finale', value: etatResultat.balance, type: 'info' },
    ]);

    const exportData = displayMode === 'synthese' 
      ? syntheseData.map(s => ({ 
          imp: s.code, 
          designation: s.libelle, 
          recettes: s.recettes, 
          depenses: s.depenses, 
          total: s.recettes - s.depenses, 
          caisse: 0, 
          balance: 0,
          operations: s.operations 
        }))
      : sommaireData;

    const tableHTML = generateTableHTML(
      tableColumns, 
      exportData as any, 
      {
        showTotals: true,
        totalsLabel: 'TOTAUX',
        totalsColumns: ['recettes', 'depenses', displayMode === 'synthese' ? 'operations' : 'total'],
      }
    );

    const montantLettres = `<div class="montant-lettres">
      <strong>Solde en lettres:</strong> ${numberToFrenchWords(Math.floor(Math.abs(etatResultat.balance)))} Francs Congolais
    </div>`;

    const filename = `sommaire_${viewMode}_${selectedAnnee}${viewMode === 'mensuel' ? `_${moisNoms[selectedMois - 1].toLowerCase()}` : ''}`;

    exportToWord({
      title: getExportTitle(),
      filename,
      content: `
        <div class="subtitle">Période: ${formatDate(dateDebut)} au ${formatDate(dateFin)}</div>
        ${summaryHTML}
        ${tableHTML}
        ${montantLettres}
      `,
    });
  };

  const loading = isLoading || loadingBalance;

  // Clear filter
  const clearRubriqueFilter = () => setSelectedRubrique('all');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport Sommaire"
        description="Résumé des opérations par catégorie"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportWord}>
              <FileDown className="w-4 h-4 mr-2" />
              Word
            </Button>
          </div>
        }
      />

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Period Selection */}
            <div className="space-y-2">
              <Label>Mode de visualisation</Label>
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensuel">Mensuel</SelectItem>
                  <SelectItem value="annuel">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {viewMode === 'mensuel' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Mois
                </Label>
                <select
                  value={selectedMois}
                  onChange={(e) => setSelectedMois(Number(e.target.value))}
                  className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  aria-label="Sélectionner le mois"
                >
                  {moisNoms.map((mois, index) => (
                    <option key={index} value={index + 1}>{mois}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Année</Label>
              <Input
                type="number"
                value={selectedAnnee}
                onChange={(e) => setSelectedAnnee(Number(e.target.value))}
                className="w-28"
                min={2020}
                max={2030}
              />
            </div>

            {/* Display Mode */}
            <div className="space-y-2">
              <Label>Affichage</Label>
              <div className="flex gap-1">
                <Button
                  variant={displayMode === 'detail' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDisplayMode('detail')}
                >
                  <List className="w-4 h-4 mr-1" />
                  Détail
                </Button>
                <Button
                  variant={displayMode === 'synthese' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDisplayMode('synthese')}
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  Synthèse
                </Button>
              </div>
            </div>

            {/* Rubrique Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Rubrique
              </Label>
              <Select value={selectedRubrique} onValueChange={setSelectedRubrique}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes les rubriques" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les rubriques</SelectItem>
                  {rubriques.map(r => (
                    <SelectItem key={r.id} value={r.code}>{r.code} - {r.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show Solde Details Toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <Switch
                checked={showSoldeDetails}
                onCheckedChange={setShowSoldeDetails}
                id="show-solde"
              />
              <Label htmlFor="show-solde" className="text-sm">Détails solde</Label>
            </div>
          </div>

          {/* Active Filters */}
          {selectedRubrique !== 'all' && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Badge variant="secondary" className="flex items-center gap-1">
                Rubrique: {selectedRubrique}
                <button 
                  onClick={clearRubriqueFilter} 
                  className="ml-1 hover:text-destructive"
                  aria-label="Effacer le filtre de rubrique"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {showSoldeDetails && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-muted-foreground">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Solde Précédent</p>
              <p className="text-xl font-bold">{formatMontant(soldePrecedent, { showCurrency: true })}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Recettes</p>
              <p className="text-xl font-bold text-success">{formatMontant(etatResultat.totalRecettes, { showCurrency: true })}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Dépenses</p>
              <p className="text-xl font-bold text-destructive">{formatMontant(etatResultat.totalDepenses, { showCurrency: true })}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-warning">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Encaisse Période</p>
              <p className={`text-xl font-bold ${etatResultat.encaisse >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatMontant(etatResultat.encaisse, { showCurrency: true })}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-info">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Balance Finale</p>
              <p className={`text-xl font-bold ${etatResultat.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
                {formatMontant(etatResultat.balance, { showCurrency: true })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content - Tabs for Annual View */}
      {viewMode === 'annuel' ? (
        <Tabs defaultValue="synthese" className="space-y-4">
          <TabsList>
            <TabsTrigger value="synthese">
              Synthèse Annuelle
              <Badge variant="secondary" className="ml-2">{selectedAnnee}</Badge>
            </TabsTrigger>
            <TabsTrigger value="mensuel">
              Détail par Mois
              <Badge variant="outline" className="ml-2">12</Badge>
            </TabsTrigger>
            <TabsTrigger value="rubriques">
              Par Rubrique
              <Badge variant="outline" className="ml-2">{syntheseData.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="synthese">
            <Card>
              <CardHeader>
                <CardTitle>Sommaire Annuel - {selectedAnnee}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Solde en lettres: <span className="font-medium">{numberToFrenchWords(Math.floor(Math.abs(etatResultat.balance)))} Francs Congolais</span>
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">IMP</TableHead>
                          <TableHead>Désignation</TableHead>
                          <TableHead className="text-right">Recettes (FC)</TableHead>
                          <TableHead className="text-right">Dépenses (FC)</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sommaireData.map((row, index) => (
                          <TableRow key={index} className={row.imp === 'SP' ? 'bg-muted/50 font-medium' : 'hover:bg-muted/30'}>
                            <TableCell className="font-mono">{row.imp}</TableCell>
                            <TableCell>{row.designation}</TableCell>
                            <TableCell className="text-right text-success">
                              {row.recettes > 0 ? formatMontant(row.recettes) : '-'}
                            </TableCell>
                            <TableCell className="text-right text-destructive">
                              {row.depenses > 0 ? formatMontant(row.depenses) : '-'}
                            </TableCell>
                            <TableCell className="text-right">{formatMontant(row.total)}</TableCell>
                            <TableCell className="text-right font-bold">{formatMontant(row.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow className="bg-muted font-bold">
                          <TableCell colSpan={2}>TOTAUX ANNUELS</TableCell>
                          <TableCell className="text-right text-success">{formatMontant(etatResultat.totalRecettes)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatMontant(etatResultat.totalDepenses)}</TableCell>
                          <TableCell className="text-right">{formatMontant(etatResultat.encaisse)}</TableCell>
                          <TableCell className={`text-right ${etatResultat.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
                            {formatMontant(etatResultat.balance)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mensuel">
            <Card>
              <CardHeader>
                <CardTitle>Répartition Mensuelle - {selectedAnnee}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mois</TableHead>
                        <TableHead className="text-right">Recettes (FC)</TableHead>
                        <TableHead className="text-right">Dépenses (FC)</TableHead>
                        <TableHead className="text-right">Solde</TableHead>
                        <TableHead className="text-center">Opérations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {annualBreakdown.map((month, index) => (
                        <TableRow key={index} className={month.operations === 0 ? 'text-muted-foreground' : ''}>
                          <TableCell className="font-medium">{month.mois}</TableCell>
                          <TableCell className="text-right text-success">
                            {month.recettes > 0 ? formatMontant(month.recettes) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {month.depenses > 0 ? formatMontant(month.depenses) : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${month.solde >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatMontant(month.solde)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={month.operations > 0 ? 'secondary' : 'outline'}>
                              {month.operations}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted font-bold">
                        <TableCell>TOTAL ANNUEL</TableCell>
                        <TableCell className="text-right text-success">
                          {formatMontant(annualBreakdown.reduce((acc, m) => acc + m.recettes, 0))}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatMontant(annualBreakdown.reduce((acc, m) => acc + m.depenses, 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMontant(annualBreakdown.reduce((acc, m) => acc + m.solde, 0))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge>{annualBreakdown.reduce((acc, m) => acc + m.operations, 0)}</Badge>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rubriques">
            <Card>
              <CardHeader>
                <CardTitle>Synthèse par Rubrique - {selectedAnnee}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="text-right">Recettes (FC)</TableHead>
                        <TableHead className="text-right">Dépenses (FC)</TableHead>
                        <TableHead className="text-center">Opérations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syntheseData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono font-medium">{row.code}</TableCell>
                          <TableCell>{row.libelle}</TableCell>
                          <TableCell className="text-right text-success">
                            {row.recettes > 0 ? formatMontant(row.recettes) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {row.depenses > 0 ? formatMontant(row.depenses) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{row.operations}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted font-bold">
                        <TableCell colSpan={2}>TOTAUX</TableCell>
                        <TableCell className="text-right text-success">
                          {formatMontant(syntheseData.reduce((acc, r) => acc + r.recettes, 0))}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatMontant(syntheseData.reduce((acc, r) => acc + r.depenses, 0))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge>{syntheseData.reduce((acc, r) => acc + r.operations, 0)}</Badge>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* Monthly View - Single Table */
        <Card>
          <CardHeader>
            <CardTitle>
              {displayMode === 'synthese' ? 'Synthèse' : 'Sommaire'} - {getPeriodLabel()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Solde en lettres: <span className="font-medium">{numberToFrenchWords(Math.floor(Math.abs(etatResultat.balance)))} Francs Congolais</span>
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : displayMode === 'synthese' ? (
              /* Synthese Mode */
              syntheseData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune donnée pour cette période
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="text-right">Recettes (FC)</TableHead>
                        <TableHead className="text-right">Dépenses (FC)</TableHead>
                        <TableHead className="text-center">Opérations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syntheseData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono font-medium">{row.code}</TableCell>
                          <TableCell>{row.libelle}</TableCell>
                          <TableCell className="text-right text-success">
                            {row.recettes > 0 ? formatMontant(row.recettes) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {row.depenses > 0 ? formatMontant(row.depenses) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{row.operations}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted font-bold">
                        <TableCell colSpan={2}>TOTAUX</TableCell>
                        <TableCell className="text-right text-success">
                          {formatMontant(syntheseData.reduce((acc, r) => acc + r.recettes, 0))}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatMontant(syntheseData.reduce((acc, r) => acc + r.depenses, 0))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge>{syntheseData.reduce((acc, r) => acc + r.operations, 0)}</Badge>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )
            ) : (
              /* Detail Mode */
              sommaireData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune donnée pour cette période
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">IMP</TableHead>
                        <TableHead>Désignation</TableHead>
                        <TableHead className="text-right">Recettes (FC)</TableHead>
                        <TableHead className="text-right">Dépenses (FC)</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Caisse</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sommaireData.map((row, index) => (
                        <TableRow key={index} className={row.imp === 'SP' ? 'bg-muted/50 font-medium' : 'hover:bg-muted/30'}>
                          <TableCell className="font-mono">{row.imp}</TableCell>
                          <TableCell>{row.designation}</TableCell>
                          <TableCell className="text-right text-success">
                            {row.recettes > 0 ? formatMontant(row.recettes) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {row.depenses > 0 ? formatMontant(row.depenses) : '-'}
                          </TableCell>
                          <TableCell className="text-right">{formatMontant(row.total)}</TableCell>
                          <TableCell className="text-right">{formatMontant(row.caisse)}</TableCell>
                          <TableCell className="text-right font-bold">{formatMontant(row.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted font-bold">
                        <TableCell colSpan={2}>TOTAUX</TableCell>
                        <TableCell className="text-right text-success">{formatMontant(totalRecettes)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatMontant(totalDepenses)}</TableCell>
                        <TableCell className="text-right">{formatMontant(totalGeneral)}</TableCell>
                        <TableCell></TableCell>
                        <TableCell className={`text-right ${etatResultat.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
                          {formatMontant(etatResultat.balance)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
