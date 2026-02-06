/**
 * Synthèse de Caisse Report Page
 * Comprehensive cash desk synthesis with multiple analysis views
 * Based on Crystal Reports: SYNTHESE_RAPPORTDECAISSE, SYNTHESECAISSE, SYNTHESESORTIEENTREE
 */

import { useState, useMemo } from 'react';
import { Calendar, Loader2, FileText, FileSpreadsheet, FileDown, Printer, TrendingUp, TrendingDown, DollarSign, LayoutGrid, ArrowUpDown, PieChart } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { useReportData, numberToFrenchWords } from '@/hooks/useReportData';
import { exportToPDF, exportToExcel, ExportColumn } from '@/lib/exportUtils';
import { exportToWord, generateTableHTML, generateSummaryHTML } from '@/lib/wordExport';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRubriques } from '@/hooks/useRubriques';
import { useServices } from '@/hooks/useServices';

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

type ViewMode = 'global' | 'entrees' | 'sorties' | 'comparatif';
type PeriodMode = 'mensuel' | 'trimestriel' | 'annuel';

interface SyntheseRubrique {
  code: string;
  libelle: string;
  recettes: number;
  depenses: number;
  solde: number;
  pourcentage: number;
  operations: number;
}

interface SyntheseService {
  code: string;
  libelle: string;
  recettes: number;
  depenses: number;
  solde: number;
  operations: number;
}

interface SyntheseMensuelle {
  mois: string;
  moisNum: number;
  recettes: number;
  depenses: number;
  solde: number;
  soldeCumule: number;
  operations: number;
}

export default function SyntheseCaissePage() {
  const currentDate = new Date();
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(currentDate.getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [periodMode, setPeriodMode] = useState<PeriodMode>('mensuel');
  
  const { isLoading, recettes, depenses } = useReportData();
  const { rubriques } = useRubriques();
  const { services } = useServices();

  // Calculate date range based on period mode
  const { dateDebut, dateFin } = useMemo(() => {
    if (periodMode === 'annuel') {
      return {
        dateDebut: `${selectedAnnee}-01-01`,
        dateFin: `${selectedAnnee}-12-31`
      };
    } else if (periodMode === 'trimestriel') {
      const trimestre = Math.ceil(selectedMois / 3);
      const moisDebut = (trimestre - 1) * 3 + 1;
      const moisFin = trimestre * 3;
      const lastDay = new Date(selectedAnnee, moisFin, 0).getDate();
      return {
        dateDebut: `${selectedAnnee}-${String(moisDebut).padStart(2, '0')}-01`,
        dateFin: `${selectedAnnee}-${String(moisFin).padStart(2, '0')}-${lastDay}`
      };
    } else {
      const debut = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedAnnee, selectedMois, 0).getDate();
      const fin = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-${lastDay}`;
      return { dateDebut: debut, dateFin: fin };
    }
  }, [selectedMois, selectedAnnee, periodMode]);

  // Fetch previous period balance
  const { data: soldePrecedent = 0, isLoading: loadingBalance } = useQuery({
    queryKey: ['synthese-previous-balance', periodMode, selectedMois, selectedAnnee],
    queryFn: async () => {
      let startDate: string;
      let endDate: string;

      if (periodMode === 'annuel') {
        const prevYear = selectedAnnee - 1;
        startDate = `${prevYear}-01-01`;
        endDate = `${prevYear}-12-31`;
      } else if (periodMode === 'trimestriel') {
        const trimestre = Math.ceil(selectedMois / 3);
        if (trimestre === 1) {
          // Previous year Q4
          startDate = `${selectedAnnee - 1}-10-01`;
          endDate = `${selectedAnnee - 1}-12-31`;
        } else {
          const prevTrimestre = trimestre - 1;
          const moisDebut = (prevTrimestre - 1) * 3 + 1;
          const moisFin = prevTrimestre * 3;
          const lastDay = new Date(selectedAnnee, moisFin, 0).getDate();
          startDate = `${selectedAnnee}-${String(moisDebut).padStart(2, '0')}-01`;
          endDate = `${selectedAnnee}-${String(moisFin).padStart(2, '0')}-${lastDay}`;
        }
      } else {
        let prevMois = selectedMois - 1;
        let prevAnnee = selectedAnnee;
        if (prevMois === 0) {
          prevMois = 12;
          prevAnnee = selectedAnnee - 1;
        }
        startDate = `${prevAnnee}-${String(prevMois).padStart(2, '0')}-01`;
        const lastDayPrev = new Date(prevAnnee, prevMois, 0).getDate();
        endDate = `${prevAnnee}-${String(prevMois).padStart(2, '0')}-${lastDayPrev}`;
      }

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
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter data for period
  const filteredRecettes = useMemo(() => 
    recettes.filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin),
    [recettes, dateDebut, dateFin]
  );

  const filteredDepenses = useMemo(() => 
    depenses.filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin),
    [depenses, dateDebut, dateFin]
  );

  // Global totals
  const totals = useMemo(() => {
    const totalRecettes = filteredRecettes.reduce((acc, r) => acc + Number(r.montant), 0);
    const totalDepenses = filteredDepenses.reduce((acc, d) => acc + Number(d.montant), 0);
    return {
      recettes: totalRecettes,
      depenses: totalDepenses,
      solde: totalRecettes - totalDepenses,
      balance: soldePrecedent + totalRecettes - totalDepenses,
      operationsRecettes: filteredRecettes.length,
      operationsDepenses: filteredDepenses.length,
      totalOperations: filteredRecettes.length + filteredDepenses.length
    };
  }, [filteredRecettes, filteredDepenses, soldePrecedent]);

  // Synthesis by rubrique
  const syntheseRubriques = useMemo((): SyntheseRubrique[] => {
    const rubriquesMap = new Map<string, SyntheseRubrique>();

    // Add recettes (no rubrique)
    const totalRec = filteredRecettes.reduce((acc, r) => acc + Number(r.montant), 0);
    if (totalRec > 0) {
      rubriquesMap.set('RECETTES', {
        code: 'R',
        libelle: 'Total Recettes (Entrées)',
        recettes: totalRec,
        depenses: 0,
        solde: totalRec,
        pourcentage: 100,
        operations: filteredRecettes.length
      });
    }

    // Add depenses by rubrique
    filteredDepenses.forEach(d => {
      const code = d.rubrique?.code || 'AUTRE';
      const libelle = d.rubrique?.libelle || 'Autres dépenses';
      const existing = rubriquesMap.get(code) || { 
        code, libelle, recettes: 0, depenses: 0, solde: 0, pourcentage: 0, operations: 0 
      };
      existing.depenses += Number(d.montant);
      existing.solde = existing.recettes - existing.depenses;
      existing.operations += 1;
      rubriquesMap.set(code, existing);
    });

    // Calculate percentages
    const totalDep = totals.depenses;
    rubriquesMap.forEach((value, key) => {
      if (key !== 'RECETTES' && totalDep > 0) {
        value.pourcentage = (value.depenses / totalDep) * 100;
      }
    });

    return Array.from(rubriquesMap.values()).sort((a, b) => b.depenses - a.depenses);
  }, [filteredRecettes, filteredDepenses, totals.depenses]);

  // Synthesis by service
  const syntheseServices = useMemo((): SyntheseService[] => {
    const servicesMap = new Map<string, SyntheseService>();

    // Recettes by service/provenance
    filteredRecettes.forEach(r => {
      const code = r.service?.code || r.provenance || 'DIVERS';
      const libelle = r.service?.libelle || r.provenance || 'Divers';
      const existing = servicesMap.get(code) || { 
        code, libelle, recettes: 0, depenses: 0, solde: 0, operations: 0 
      };
      existing.recettes += Number(r.montant);
      existing.solde = existing.recettes - existing.depenses;
      existing.operations += 1;
      servicesMap.set(code, existing);
    });

    // Depenses by service
    filteredDepenses.forEach(d => {
      const code = d.service?.code || 'DIVERS';
      const libelle = d.service?.libelle || 'Divers';
      const existing = servicesMap.get(code) || { 
        code, libelle, recettes: 0, depenses: 0, solde: 0, operations: 0 
      };
      existing.depenses += Number(d.montant);
      existing.solde = existing.recettes - existing.depenses;
      existing.operations += 1;
      servicesMap.set(code, existing);
    });

    return Array.from(servicesMap.values()).sort((a, b) => b.solde - a.solde);
  }, [filteredRecettes, filteredDepenses]);

  // Monthly breakdown (for annual view)
  const syntheseMensuelle = useMemo((): SyntheseMensuelle[] => {
    let soldeCumule = soldePrecedent;
    
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
      
      const solde = monthRecettes - monthDepenses;
      soldeCumule += solde;
      
      return {
        mois: moisNom,
        moisNum: mois,
        recettes: monthRecettes,
        depenses: monthDepenses,
        solde,
        soldeCumule,
        operations: recettes.filter(r => r.date_transaction >= debut && r.date_transaction <= fin).length +
                   depenses.filter(d => d.date_transaction >= debut && d.date_transaction <= fin).length
      };
    });
  }, [recettes, depenses, selectedAnnee, soldePrecedent]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR');
  
  const getPeriodLabel = () => {
    if (periodMode === 'annuel') {
      return `Année ${selectedAnnee}`;
    } else if (periodMode === 'trimestriel') {
      const trimestre = Math.ceil(selectedMois / 3);
      return `T${trimestre} ${selectedAnnee}`;
    }
    return `${moisNoms[selectedMois - 1]} ${selectedAnnee}`;
  };

  const getViewLabel = () => {
    switch(viewMode) {
      case 'entrees': return 'Synthèse des Entrées';
      case 'sorties': return 'Synthèse des Sorties';
      case 'comparatif': return 'Comparatif Entrées/Sorties';
      default: return 'Synthèse Globale';
    }
  };

  // Export handlers
  const handleExportPDF = async () => {
    const columns: ExportColumn[] = [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Libellé', key: 'libelle', width: 40 },
      { header: 'Recettes (FC)', key: 'recettes', width: 20 },
      { header: 'Dépenses (FC)', key: 'depenses', width: 20 },
      { header: 'Solde', key: 'solde', width: 20 },
      { header: '%', key: 'pourcentage', width: 10 },
    ];

    await exportToPDF({
      title: `${getViewLabel()} - ${getPeriodLabel()}`,
      filename: `synthese_caisse_${periodMode}_${selectedAnnee}`,
      subtitle: `Période: ${formatDate(dateDebut)} au ${formatDate(dateFin)} | Balance: ${formatMontant(totals.balance, { showCurrency: true })}`,
      columns,
      data: syntheseRubriques.map(r => ({
        ...r,
        pourcentage: `${r.pourcentage.toFixed(1)}%`
      })),
    });
  };

  const handleExportExcel = () => {
    const columns: ExportColumn[] = [
      { header: 'Code', key: 'code', width: 12 },
      { header: 'Libellé', key: 'libelle', width: 35 },
      { header: 'Recettes (FC)', key: 'recettes', width: 18 },
      { header: 'Dépenses (FC)', key: 'depenses', width: 18 },
      { header: 'Solde', key: 'solde', width: 18 },
      { header: '% Dépenses', key: 'pourcentage', width: 12 },
      { header: 'Opérations', key: 'operations', width: 12 },
    ];

    exportToExcel({
      title: `${getViewLabel()} - ${getPeriodLabel()}`,
      filename: `synthese_caisse_${periodMode}_${selectedAnnee}`,
      subtitle: `Balance: ${numberToFrenchWords(Math.floor(Math.abs(totals.balance)))} Francs Congolais`,
      columns,
      data: syntheseRubriques,
    });
  };

  const handleExportWord = () => {
    const tableColumns = [
      { header: 'Code', key: 'code', type: 'text' as const },
      { header: 'Libellé', key: 'libelle', type: 'text' as const },
      { header: 'Recettes', key: 'recettes', type: 'currency' as const },
      { header: 'Dépenses', key: 'depenses', type: 'currency' as const },
      { header: 'Solde', key: 'solde', type: 'currency' as const },
    ];

    const summaryHTML = generateSummaryHTML([
      { label: 'Total Recettes', value: totals.recettes, type: 'success' },
      { label: 'Total Dépenses', value: totals.depenses, type: 'danger' },
      { label: 'Solde Période', value: totals.solde, type: 'info' },
      { label: 'Balance Finale', value: totals.balance, type: 'info' },
    ]);

    const tableHTML = generateTableHTML(tableColumns, syntheseRubriques, {
      showTotals: true,
      totalsLabel: 'TOTAUX',
      totalsColumns: ['recettes', 'depenses', 'solde'],
    });

    exportToWord({
      title: `${getViewLabel()} - ${getPeriodLabel()}`,
      filename: `synthese_caisse_${periodMode}_${selectedAnnee}`,
      content: `
        <div class="subtitle">Période: ${formatDate(dateDebut)} au ${formatDate(dateFin)}</div>
        ${summaryHTML}
        ${tableHTML}
        <div class="montant-lettres">
          <strong>Balance en lettres:</strong> ${numberToFrenchWords(Math.floor(Math.abs(totals.balance)))} Francs Congolais
        </div>
      `,
    });
  };

  const loading = isLoading || loadingBalance;

  // Calculate ratios for visual indicators
  const recettesRatio = totals.recettes + totals.depenses > 0 
    ? (totals.recettes / (totals.recettes + totals.depenses)) * 100 
    : 50;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Synthèse de Caisse"
        description="Analyse consolidée des opérations de caisse avec vues multidimensionnelles"
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
            {/* Period Mode */}
            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={periodMode} onValueChange={(v) => setPeriodMode(v as PeriodMode)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensuel">Mensuel</SelectItem>
                  <SelectItem value="trimestriel">Trimestriel</SelectItem>
                  <SelectItem value="annuel">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodMode !== 'annuel' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {periodMode === 'trimestriel' ? 'Trimestre' : 'Mois'}
                </Label>
                <select
                  value={selectedMois}
                  onChange={(e) => setSelectedMois(Number(e.target.value))}
                  className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {periodMode === 'trimestriel' ? (
                    <>
                      <option value={1}>T1 (Jan-Mar)</option>
                      <option value={4}>T2 (Avr-Juin)</option>
                      <option value={7}>T3 (Juil-Sep)</option>
                      <option value={10}>T4 (Oct-Déc)</option>
                    </>
                  ) : (
                    moisNoms.map((mois, index) => (
                      <option key={index} value={index + 1}>{mois}</option>
                    ))
                  )}
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

            {/* View Mode */}
            <div className="space-y-2">
              <Label>Vue</Label>
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    <span className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4" />
                      Globale
                    </span>
                  </SelectItem>
                  <SelectItem value="entrees">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      Entrées
                    </span>
                  </SelectItem>
                  <SelectItem value="sorties">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-destructive" />
                      Sorties
                    </span>
                  </SelectItem>
                  <SelectItem value="comparatif">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-info" />
                      Comparatif
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solde Précédent</p>
                <p className="text-2xl font-bold">{formatMontant(soldePrecedent, { showCurrency: true })}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Recettes</p>
                <p className="text-2xl font-bold text-success">{formatMontant(totals.recettes, { showCurrency: true })}</p>
                <p className="text-xs text-muted-foreground mt-1">{totals.operationsRecettes} opérations</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Dépenses</p>
                <p className="text-2xl font-bold text-destructive">{formatMontant(totals.depenses, { showCurrency: true })}</p>
                <p className="text-xs text-muted-foreground mt-1">{totals.operationsDepenses} opérations</p>
              </div>
              <TrendingDown className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Balance Finale</p>
                <p className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
                  {formatMontant(totals.balance, { showCurrency: true })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Solde période: {formatMontant(totals.solde)}
                </p>
              </div>
              <PieChart className="w-8 h-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recettes vs Dépenses Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-success font-medium">Recettes: {recettesRatio.toFixed(1)}%</span>
              <span className="text-destructive font-medium">Dépenses: {(100 - recettesRatio).toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-destructive/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-500"
                style={{ width: `${recettesRatio}%` }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {totals.totalOperations} opérations sur la période
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="rubriques" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rubriques">
            Par Rubrique
            <Badge variant="secondary" className="ml-2">{syntheseRubriques.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="services">
            Par Service
            <Badge variant="outline" className="ml-2">{syntheseServices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="evolution">
            Évolution Mensuelle
            <Badge variant="outline" className="ml-2">12</Badge>
          </TabsTrigger>
        </TabsList>

        {/* By Rubrique Tab */}
        <TabsContent value="rubriques">
          <Card>
            <CardHeader>
              <CardTitle>{getViewLabel()} par Rubrique - {getPeriodLabel()}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : syntheseRubriques.length === 0 ? (
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
                        <TableHead className="text-right">Solde</TableHead>
                        <TableHead className="w-32">% Dépenses</TableHead>
                        <TableHead className="text-center">Ops</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syntheseRubriques.map((row, index) => (
                        <TableRow key={index} className={row.code === 'R' ? 'bg-success/5' : ''}>
                          <TableCell className="font-mono font-medium">{row.code}</TableCell>
                          <TableCell>{row.libelle}</TableCell>
                          <TableCell className="text-right text-success">
                            {row.recettes > 0 ? formatMontant(row.recettes) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {row.depenses > 0 ? formatMontant(row.depenses) : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${row.solde >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatMontant(row.solde)}
                          </TableCell>
                          <TableCell>
                            {row.code !== 'R' && (
                              <div className="flex items-center gap-2">
                                <Progress value={row.pourcentage} className="h-2" />
                                <span className="text-xs w-12 text-right">{row.pourcentage.toFixed(1)}%</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{row.operations}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted font-bold">
                        <TableCell colSpan={2}>TOTAUX</TableCell>
                        <TableCell className="text-right text-success">{formatMontant(totals.recettes)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatMontant(totals.depenses)}</TableCell>
                        <TableCell className={`text-right ${totals.solde >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatMontant(totals.solde)}
                        </TableCell>
                        <TableCell>100%</TableCell>
                        <TableCell className="text-center">{totals.totalOperations}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Service Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>{getViewLabel()} par Service - {getPeriodLabel()}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : syntheseServices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune donnée pour cette période
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Service / Provenance</TableHead>
                        <TableHead className="text-right">Recettes (FC)</TableHead>
                        <TableHead className="text-right">Dépenses (FC)</TableHead>
                        <TableHead className="text-right">Solde</TableHead>
                        <TableHead className="text-center">Opérations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syntheseServices.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono font-medium">{row.code}</TableCell>
                          <TableCell>{row.libelle}</TableCell>
                          <TableCell className="text-right text-success">
                            {row.recettes > 0 ? formatMontant(row.recettes) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {row.depenses > 0 ? formatMontant(row.depenses) : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${row.solde >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatMontant(row.solde)}
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
                        <TableCell className="text-right text-success">{formatMontant(totals.recettes)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatMontant(totals.depenses)}</TableCell>
                        <TableCell className={`text-right ${totals.solde >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatMontant(totals.solde)}
                        </TableCell>
                        <TableCell className="text-center">{totals.totalOperations}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Evolution Tab */}
        <TabsContent value="evolution">
          <Card>
            <CardHeader>
              <CardTitle>Évolution Mensuelle - {selectedAnnee}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Solde cumulé en lettres: <span className="font-medium">{numberToFrenchWords(Math.floor(Math.abs(totals.balance)))} Francs Congolais</span>
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mois</TableHead>
                      <TableHead className="text-right">Recettes (FC)</TableHead>
                      <TableHead className="text-right">Dépenses (FC)</TableHead>
                      <TableHead className="text-right">Solde Mensuel</TableHead>
                      <TableHead className="text-right">Solde Cumulé</TableHead>
                      <TableHead className="text-center">Opérations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syntheseMensuelle.map((month, index) => (
                      <TableRow 
                        key={index} 
                        className={month.moisNum === selectedMois && periodMode === 'mensuel' ? 'bg-primary/5' : ''}
                      >
                        <TableCell className="font-medium">{month.mois}</TableCell>
                        <TableCell className="text-right text-success">
                          {month.recettes > 0 ? formatMontant(month.recettes) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {month.depenses > 0 ? formatMontant(month.depenses) : '-'}
                        </TableCell>
                        <TableCell className={`text-right ${month.solde >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatMontant(month.solde)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${month.soldeCumule >= 0 ? 'text-info' : 'text-destructive'}`}>
                          {formatMontant(month.soldeCumule)}
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
                        {formatMontant(syntheseMensuelle.reduce((acc, m) => acc + m.recettes, 0))}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {formatMontant(syntheseMensuelle.reduce((acc, m) => acc + m.depenses, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMontant(syntheseMensuelle.reduce((acc, m) => acc + m.solde, 0))}
                      </TableCell>
                      <TableCell className={`text-right ${totals.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
                        {formatMontant(totals.balance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge>{syntheseMensuelle.reduce((acc, m) => acc + m.operations, 0)}</Badge>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
