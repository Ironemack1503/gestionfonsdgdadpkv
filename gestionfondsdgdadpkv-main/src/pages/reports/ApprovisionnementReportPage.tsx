/**
 * Approvisionnement Report Page
 * Rapport comparatif Recettes vs Dépenses avec analyse
 * Basé sur les Crystal Reports: RAPAPPROVENTEDAT, RAPAPPROVENTEREC, RAPAPPROVENTEDEP
 */

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, ArrowUpDown, Filter, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ExportButtons } from '@/components/shared/ExportButtons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRecettes } from '@/hooks/useRecettes';
import { useDepenses } from '@/hooks/useDepenses';
import { formatMontant } from '@/lib/utils';
import { exportToPDF, exportToExcel, PDFExportSettings } from '@/lib/exportUtils';

interface ComparativeRow {
  date: string;
  dateFormatted: string;
  recettes: number;
  depenses: number;
  solde: number;
  cumul: number;
}

interface RubriqueComparison {
  code: string;
  libelle: string;
  prevu: number;
  realise: number;
  ecart: number;
  tauxExecution: number;
}

export default function ApprovisionnementReportPage() {
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'journalier' | 'mensuel' | 'rubrique'>('journalier');
  const [dateDebut, setDateDebut] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateFin, setDateFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { recettes, isLoading: loadingRecettes } = useRecettes();
  const { depenses, isLoading: loadingDepenses } = useDepenses();

  // Filtered data based on period
  const filteredRecettes = useMemo(() => {
    return recettes.filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin);
  }, [recettes, dateDebut, dateFin]);

  const filteredDepenses = useMemo(() => {
    return depenses.filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin);
  }, [depenses, dateDebut, dateFin]);

  // Daily comparative data
  const dailyData = useMemo((): ComparativeRow[] => {
    const dateMap = new Map<string, { recettes: number; depenses: number }>();

    // Process recettes
    filteredRecettes.forEach(r => {
      const existing = dateMap.get(r.date_transaction) || { recettes: 0, depenses: 0 };
      existing.recettes += Number(r.montant);
      dateMap.set(r.date_transaction, existing);
    });

    // Process depenses
    filteredDepenses.forEach(d => {
      const existing = dateMap.get(d.date_transaction) || { recettes: 0, depenses: 0 };
      existing.depenses += Number(d.montant);
      dateMap.set(d.date_transaction, existing);
    });

    // Sort by date and calculate cumulative
    const sortedDates = Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    let cumul = 0;

    return sortedDates.map(([date, values]) => {
      const solde = values.recettes - values.depenses;
      cumul += solde;
      return {
        date,
        dateFormatted: format(new Date(date), 'dd/MM/yyyy', { locale: fr }),
        recettes: values.recettes,
        depenses: values.depenses,
        solde,
        cumul,
      };
    });
  }, [filteredRecettes, filteredDepenses]);

  // Rubrique comparison (for budget vs realized)
  const rubriqueData = useMemo((): RubriqueComparison[] => {
    const rubriqueMap = new Map<string, RubriqueComparison>();

    filteredDepenses.forEach(d => {
      const code = d.rubrique?.code || 'AUTRE';
      const libelle = d.rubrique?.libelle || 'Autres dépenses';
      const existing = rubriqueMap.get(code) || { 
        code, 
        libelle, 
        prevu: 0, 
        realise: 0, 
        ecart: 0, 
        tauxExecution: 0 
      };
      existing.realise += Number(d.montant);
      rubriqueMap.set(code, existing);
    });

    return Array.from(rubriqueMap.values()).map(item => ({
      ...item,
      ecart: item.prevu - item.realise,
      tauxExecution: item.prevu > 0 ? (item.realise / item.prevu) * 100 : 0,
    }));
  }, [filteredDepenses]);

  // Summary statistics
  const summary = useMemo(() => {
    const totalRecettes = filteredRecettes.reduce((acc, r) => acc + Number(r.montant), 0);
    const totalDepenses = filteredDepenses.reduce((acc, d) => acc + Number(d.montant), 0);
    const soldeNet = totalRecettes - totalDepenses;
    const ratio = totalRecettes > 0 ? (totalDepenses / totalRecettes) * 100 : 0;

    return {
      totalRecettes,
      totalDepenses,
      soldeNet,
      ratio,
      nbRecettes: filteredRecettes.length,
      nbDepenses: filteredDepenses.length,
    };
  }, [filteredRecettes, filteredDepenses]);

  // Update period when month/year changes
  const handlePeriodChange = (newMois: number, newAnnee: number) => {
    setMois(newMois);
    setAnnee(newAnnee);
    const date = new Date(newAnnee, newMois - 1, 1);
    setDateDebut(format(startOfMonth(date), 'yyyy-MM-dd'));
    setDateFin(format(endOfMonth(date), 'yyyy-MM-dd'));
  };

  // Export functions
  const getExportColumns = () => {
    if (viewMode === 'journalier') {
      return [
        { header: 'Date', key: 'dateFormatted', width: 15 },
        { header: 'Recettes (FC)', key: 'recettes', width: 20, type: 'currency' as const },
        { header: 'Dépenses (FC)', key: 'depenses', width: 20, type: 'currency' as const },
        { header: 'Solde Jour (FC)', key: 'solde', width: 18, type: 'currency' as const },
        { header: 'Cumul (FC)', key: 'cumul', width: 20, type: 'currency' as const },
      ];
    }
    return [
      { header: 'Code', key: 'code', width: 12 },
      { header: 'Rubrique', key: 'libelle', width: 30 },
      { header: 'Prévu (FC)', key: 'prevu', width: 18, type: 'currency' as const },
      { header: 'Réalisé (FC)', key: 'realise', width: 18, type: 'currency' as const },
      { header: 'Écart (FC)', key: 'ecart', width: 18, type: 'currency' as const },
      { header: 'Taux (%)', key: 'tauxExecution', width: 12, type: 'number' as const },
    ];
  };

  const handleExportPDF = (settings?: PDFExportSettings) => {
    const data = viewMode === 'journalier' ? dailyData : rubriqueData;
    const title = viewMode === 'journalier' 
      ? 'Rapport Approvisionnement - Vue Journalière' 
      : 'Rapport Approvisionnement - Par Rubrique';
    
    exportToPDF({
      title,
      filename: `rapport_approvisionnement_${format(new Date(), 'yyyyMMdd')}`,
      subtitle: `Période: du ${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')}`,
      columns: getExportColumns(),
      data,
      pdfSettings: settings,
    });
  };

  const handleExportExcel = (settings?: PDFExportSettings) => {
    const data = viewMode === 'journalier' ? dailyData : rubriqueData;
    exportToExcel({
      title: `Rapport Approvisionnement - ${viewMode === 'journalier' ? 'Vue Journalière' : 'Par Rubrique'}`,
      filename: `rapport_approvisionnement_${format(new Date(), 'yyyyMMdd')}`,
      subtitle: `Période: du ${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')}`,
      columns: getExportColumns(),
      data,
      pdfSettings: settings,
    });
  };

  const isLoading = loadingRecettes || loadingDepenses;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport Approvisionnement"
        description="Analyse comparative des recettes et dépenses avec évolution journalière"
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={isLoading}
            previewTitle={`Rapport Approvisionnement - ${viewMode}`}
            previewSubtitle={`Période: du ${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')}`}
            previewColumns={getExportColumns()}
            previewData={viewMode === 'journalier' ? dailyData : rubriqueData}
          />
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres de période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Mois</Label>
              <Select value={String(mois)} onValueChange={(v) => handlePeriodChange(Number(v), annee)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {format(new Date(2024, i, 1), 'MMMM', { locale: fr })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Année</Label>
              <Select value={String(annee)} onValueChange={(v) => handlePeriodChange(mois, Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => 2024 + i).map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date début</Label>
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Recettes</p>
                <p className="text-2xl font-bold text-success">{formatMontant(summary.totalRecettes)}</p>
                <p className="text-xs text-muted-foreground">{summary.nbRecettes} opérations</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Dépenses</p>
                <p className="text-2xl font-bold text-destructive">{formatMontant(summary.totalDepenses)}</p>
                <p className="text-xs text-muted-foreground">{summary.nbDepenses} opérations</p>
              </div>
              <TrendingDown className="w-8 h-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${summary.soldeNet >= 0 ? 'border-l-primary' : 'border-l-warning'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solde Net</p>
                <p className={`text-2xl font-bold ${summary.soldeNet >= 0 ? 'text-primary' : 'text-warning'}`}>
                  {formatMontant(summary.soldeNet)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.soldeNet >= 0 ? 'Excédent' : 'Déficit'}
                </p>
              </div>
              {summary.soldeNet >= 0 ? (
                <TrendingUp className="w-8 h-8 text-primary/50" />
              ) : (
                <TrendingDown className="w-8 h-8 text-warning/50" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ratio Dép./Rec.</p>
                <p className="text-2xl font-bold">{summary.ratio.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  {summary.ratio <= 100 ? 'Équilibré' : 'Attention'}
                </p>
              </div>
              <ArrowUpDown className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <Card>
        <CardHeader>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="journalier">Vue Journalière</TabsTrigger>
              <TabsTrigger value="rubrique">Par Rubrique</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {viewMode === 'journalier' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Recettes</TableHead>
                  <TableHead className="text-right">Dépenses</TableHead>
                  <TableHead className="text-right">Solde Jour</TableHead>
                  <TableHead className="text-right">Cumul</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      Aucune opération sur cette période
                    </TableCell>
                  </TableRow>
                ) : (
                  dailyData.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="font-medium">{row.dateFormatted}</TableCell>
                      <TableCell className="text-right text-success">
                        {row.recettes > 0 ? formatMontant(row.recettes) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {row.depenses > 0 ? formatMontant(row.depenses) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${row.solde >= 0 ? 'text-primary' : 'text-warning'}`}>
                        {formatMontant(row.solde)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${row.cumul >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatMontant(row.cumul)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Rubrique</TableHead>
                  <TableHead className="text-right">Réalisé</TableHead>
                  <TableHead className="text-right">% du Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubriqueData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      Aucune dépense sur cette période
                    </TableCell>
                  </TableRow>
                ) : (
                  rubriqueData.map((row) => (
                    <TableRow key={row.code}>
                      <TableCell>
                        <Badge variant="outline">{row.code}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{row.libelle}</TableCell>
                      <TableCell className="text-right">{formatMontant(row.realise)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {((row.realise / summary.totalDepenses) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
