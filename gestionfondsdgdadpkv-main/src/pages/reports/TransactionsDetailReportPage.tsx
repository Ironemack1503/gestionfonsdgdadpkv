/**
 * Transactions Detail Report Page
 * Vue détaillée de toutes les transactions avec filtres avancés et synthèse
 * Basé sur Crystal Reports: RAPDET, RDETCAISSE, RDETCAISSESYNTHESE
 */

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Filter, Search, ArrowUpDown, TrendingUp, TrendingDown, BarChart3, List, PieChart } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ExportButtons } from '@/components/shared/ExportButtons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useRecettes } from '@/hooks/useRecettes';
import { useDepenses } from '@/hooks/useDepenses';
import { useRubriques } from '@/hooks/useRubriques';
import { useServices } from '@/hooks/useServices';
import { formatMontant } from '@/lib/utils';
import { exportToPDF, exportToExcel, PDFExportSettings } from '@/lib/exportUtils';

interface TransactionDetail {
  id: string;
  date: string;
  dateFormatted: string;
  heure: string;
  type: 'recette' | 'depense';
  numero: string;
  numeroBEO: string;
  libelle: string;
  beneficiaire: string;
  montant: number;
  montantLettre: string;
  rubrique?: string;
  rubriqueCod?: string;
  serviceId?: string;
  serviceName?: string;
  observation: string;
}

interface SynthesisRow {
  code: string;
  libelle: string;
  recettes: number;
  depenses: number;
  solde: number;
  count: number;
}

type SortField = 'date' | 'numero' | 'montant' | 'type';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'detail' | 'synthese-rubrique' | 'synthese-service' | 'synthese-jour';

export default function TransactionsDetailReportPage() {
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [dateDebut, setDateDebut] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateFin, setDateFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filterType, setFilterType] = useState<'tous' | 'recette' | 'depense'>('tous');
  const [filterRubrique, setFilterRubrique] = useState<string>('tous');
  const [filterService, setFilterService] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('detail');

  const { recettes, isLoading: loadingRecettes } = useRecettes();
  const { depenses, isLoading: loadingDepenses } = useDepenses();
  const { rubriques } = useRubriques();
  const { services } = useServices();

  // Combine and format all transactions
  const allTransactions = useMemo((): TransactionDetail[] => {
    const transactions: TransactionDetail[] = [];

    // Add recettes
    recettes
      .filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin)
      .forEach(r => {
        transactions.push({
          id: r.id,
          date: r.date_transaction,
          dateFormatted: format(new Date(r.date_transaction), 'dd/MM/yyyy'),
          heure: r.heure || '-',
          type: 'recette',
          numero: String(r.numero_bon).padStart(4, '0'),
          numeroBEO: r.numero_beo || '-',
          libelle: r.motif,
          beneficiaire: r.provenance,
          montant: Number(r.montant),
          montantLettre: r.montant_lettre || '-',
          serviceId: r.service_id || undefined,
          serviceName: r.service?.libelle,
          observation: r.observation || '-',
        });
      });

    // Add depenses
    depenses
      .filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin)
      .forEach(d => {
        transactions.push({
          id: d.id,
          date: d.date_transaction,
          dateFormatted: format(new Date(d.date_transaction), 'dd/MM/yyyy'),
          heure: d.heure || '-',
          type: 'depense',
          numero: String(d.numero_bon).padStart(4, '0'),
          numeroBEO: d.numero_beo || '-',
          libelle: d.motif,
          beneficiaire: d.beneficiaire,
          montant: Number(d.montant),
          montantLettre: d.montant_lettre || '-',
          rubrique: d.rubrique?.libelle,
          rubriqueCod: d.rubrique?.code,
          serviceId: d.service_id || undefined,
          serviceName: d.service?.libelle,
          observation: d.observation || '-',
        });
      });

    return transactions;
  }, [recettes, depenses, dateDebut, dateFin]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = allTransactions;

    // Filter by type
    if (filterType !== 'tous') {
      result = result.filter(t => t.type === filterType);
    }

    // Filter by rubrique (only for depenses)
    if (filterRubrique !== 'tous') {
      result = result.filter(t => t.rubriqueCod === filterRubrique);
    }

    // Filter by service
    if (filterService !== 'tous') {
      result = result.filter(t => t.serviceId === filterService);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.libelle.toLowerCase().includes(term) ||
        t.beneficiaire.toLowerCase().includes(term) ||
        t.numero.includes(term) ||
        t.numeroBEO.toLowerCase().includes(term)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'numero':
          comparison = a.numero.localeCompare(b.numero);
          break;
        case 'montant':
          comparison = a.montant - b.montant;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [allTransactions, filterType, filterRubrique, filterService, searchTerm, sortField, sortOrder]);

  // Synthesis by rubrique
  const synthesisByRubrique = useMemo((): SynthesisRow[] => {
    const groups = new Map<string, SynthesisRow>();

    // Add recettes group
    const recettesData = filteredTransactions.filter(t => t.type === 'recette');
    if (recettesData.length > 0) {
      const totalRecettes = recettesData.reduce((acc, t) => acc + t.montant, 0);
      groups.set('REC', {
        code: 'REC',
        libelle: 'Recettes (Entrées)',
        recettes: totalRecettes,
        depenses: 0,
        solde: totalRecettes,
        count: recettesData.length,
      });
    }

    // Group depenses by rubrique
    filteredTransactions
      .filter(t => t.type === 'depense')
      .forEach(t => {
        const code = t.rubriqueCod || 'AUTRE';
        const libelle = t.rubrique || 'Autres dépenses';
        
        if (!groups.has(code)) {
          groups.set(code, {
            code,
            libelle,
            recettes: 0,
            depenses: 0,
            solde: 0,
            count: 0,
          });
        }
        
        const group = groups.get(code)!;
        group.depenses += t.montant;
        group.solde = group.recettes - group.depenses;
        group.count += 1;
      });

    return Array.from(groups.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [filteredTransactions]);

  // Synthesis by service
  const synthesisByService = useMemo((): SynthesisRow[] => {
    const groups = new Map<string, SynthesisRow>();

    filteredTransactions.forEach(t => {
      const code = t.serviceId || 'AUTRE';
      const libelle = t.serviceName || 'Sans service';
      
      if (!groups.has(code)) {
        groups.set(code, {
          code,
          libelle,
          recettes: 0,
          depenses: 0,
          solde: 0,
          count: 0,
        });
      }
      
      const group = groups.get(code)!;
      if (t.type === 'recette') {
        group.recettes += t.montant;
      } else {
        group.depenses += t.montant;
      }
      group.solde = group.recettes - group.depenses;
      group.count += 1;
    });

    return Array.from(groups.values()).sort((a, b) => b.solde - a.solde);
  }, [filteredTransactions]);

  // Synthesis by day
  const synthesisByDay = useMemo((): SynthesisRow[] => {
    const groups = new Map<string, SynthesisRow>();

    filteredTransactions.forEach(t => {
      const code = t.date;
      const libelle = format(parseISO(t.date), 'EEEE dd MMMM yyyy', { locale: fr });
      
      if (!groups.has(code)) {
        groups.set(code, {
          code,
          libelle,
          recettes: 0,
          depenses: 0,
          solde: 0,
          count: 0,
        });
      }
      
      const group = groups.get(code)!;
      if (t.type === 'recette') {
        group.recettes += t.montant;
      } else {
        group.depenses += t.montant;
      }
      group.solde = group.recettes - group.depenses;
      group.count += 1;
    });

    return Array.from(groups.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [filteredTransactions]);

  // Summary stats
  const summary = useMemo(() => {
    const totalRecettes = filteredTransactions
      .filter(t => t.type === 'recette')
      .reduce((acc, t) => acc + t.montant, 0);
    const totalDepenses = filteredTransactions
      .filter(t => t.type === 'depense')
      .reduce((acc, t) => acc + t.montant, 0);
    const nbRecettes = filteredTransactions.filter(t => t.type === 'recette').length;
    const nbDepenses = filteredTransactions.filter(t => t.type === 'depense').length;

    return {
      totalRecettes,
      totalDepenses,
      soldeNet: totalRecettes - totalDepenses,
      nbRecettes,
      nbDepenses,
      total: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Handle period change
  const handlePeriodChange = (newMois: number, newAnnee: number) => {
    setMois(newMois);
    setAnnee(newAnnee);
    const date = new Date(newAnnee, newMois - 1, 1);
    setDateDebut(format(startOfMonth(date), 'yyyy-MM-dd'));
    setDateFin(format(endOfMonth(date), 'yyyy-MM-dd'));
  };

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Export configuration
  const exportColumns = [
    { header: 'Date', key: 'dateFormatted', width: 12 },
    { header: 'Heure', key: 'heure', width: 8 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'N° Bon', key: 'numero', width: 10 },
    { header: 'N° BEO', key: 'numeroBEO', width: 12 },
    { header: 'Libellé', key: 'libelle', width: 25 },
    { header: 'Bénéficiaire/Provenance', key: 'beneficiaire', width: 20 },
    { header: 'Montant (FC)', key: 'montant', width: 18, type: 'currency' as const },
    { header: 'Rubrique', key: 'rubrique', width: 18 },
    { header: 'Service', key: 'serviceName', width: 15 },
    { header: 'Observation', key: 'observation', width: 25 },
  ];

  const synthesisColumns = [
    { header: 'Code', key: 'code', width: 15 },
    { header: 'Désignation', key: 'libelle', width: 35 },
    { header: 'Recettes (FC)', key: 'recettes', width: 20, type: 'currency' as const },
    { header: 'Dépenses (FC)', key: 'depenses', width: 20, type: 'currency' as const },
    { header: 'Solde (FC)', key: 'solde', width: 20, type: 'currency' as const },
    { header: 'Opérations', key: 'count', width: 12 },
  ];

  const handleExportPDF = (settings?: PDFExportSettings) => {
    const isDetail = viewMode === 'detail';
    const columns = isDetail ? exportColumns : synthesisColumns;
    const data = isDetail 
      ? filteredTransactions.map(t => ({
          ...t,
          type: t.type === 'recette' ? 'Recette' : 'Dépense',
        }))
      : viewMode === 'synthese-rubrique' 
        ? synthesisByRubrique 
        : viewMode === 'synthese-service' 
          ? synthesisByService 
          : synthesisByDay;

    const title = isDetail 
      ? 'Rapport Détaillé des Transactions' 
      : viewMode === 'synthese-rubrique'
        ? 'Synthèse par Rubrique'
        : viewMode === 'synthese-service'
          ? 'Synthèse par Service'
          : 'Synthèse par Jour';

    exportToPDF({
      title,
      filename: `rapport_${viewMode}_${format(new Date(), 'yyyyMMdd')}`,
      subtitle: `Période: du ${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')} - ${data.length} ${isDetail ? 'transactions' : 'lignes'}`,
      columns,
      data,
      pdfSettings: { ...settings, orientation: isDetail ? 'landscape' : 'portrait' },
    });
  };

  const handleExportExcel = (settings?: PDFExportSettings) => {
    const isDetail = viewMode === 'detail';
    const columns = isDetail ? exportColumns : synthesisColumns;
    const data = isDetail 
      ? filteredTransactions.map(t => ({
          ...t,
          type: t.type === 'recette' ? 'Recette' : 'Dépense',
        }))
      : viewMode === 'synthese-rubrique' 
        ? synthesisByRubrique 
        : viewMode === 'synthese-service' 
          ? synthesisByService 
          : synthesisByDay;

    const title = isDetail 
      ? 'Rapport Détaillé des Transactions' 
      : viewMode === 'synthese-rubrique'
        ? 'Synthèse par Rubrique'
        : viewMode === 'synthese-service'
          ? 'Synthèse par Service'
          : 'Synthèse par Jour';

    exportToExcel({
      title,
      filename: `rapport_${viewMode}_${format(new Date(), 'yyyyMMdd')}`,
      subtitle: `Période: du ${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')}`,
      columns,
      data,
      pdfSettings: settings,
    });
  };

  const isLoading = loadingRecettes || loadingDepenses;

  // Render synthesis table
  const renderSynthesisTable = (data: SynthesisRow[], typeLabel: string) => {
    const totals = data.reduce((acc, row) => ({
      recettes: acc.recettes + row.recettes,
      depenses: acc.depenses + row.depenses,
      solde: acc.solde + row.solde,
      count: acc.count + row.count,
    }), { recettes: 0, depenses: 0, solde: 0, count: 0 });

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>{typeLabel}</TableHead>
              <TableHead className="text-right">Recettes (FC)</TableHead>
              <TableHead className="text-right">Dépenses (FC)</TableHead>
              <TableHead className="text-right">Solde (FC)</TableHead>
              <TableHead className="text-center">Opérations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  Aucune donnée à afficher
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.code}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{row.code}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{row.libelle}</TableCell>
                  <TableCell className="text-right text-success">
                    {row.recettes > 0 ? formatMontant(row.recettes) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {row.depenses > 0 ? formatMontant(row.depenses) : '-'}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${row.solde >= 0 ? 'text-primary' : 'text-warning'}`}>
                    {formatMontant(row.solde)}
                  </TableCell>
                  <TableCell className="text-center">{row.count}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {data.length > 0 && (
            <TableFooter>
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={2}>TOTAUX</TableCell>
                <TableCell className="text-right text-success">{formatMontant(totals.recettes)}</TableCell>
                <TableCell className="text-right text-destructive">{formatMontant(totals.depenses)}</TableCell>
                <TableCell className={`text-right ${totals.solde >= 0 ? 'text-primary' : 'text-warning'}`}>
                  {formatMontant(totals.solde)}
                </TableCell>
                <TableCell className="text-center">{totals.count}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport Détaillé des Transactions"
        description="Vue complète et synthèse des opérations avec filtres avancés"
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={isLoading}
            previewTitle="Rapport Détaillé des Transactions"
            previewSubtitle={`${filteredTransactions.length} transactions`}
            previewColumns={exportColumns.slice(0, 8)}
            previewData={filteredTransactions.slice(0, 50).map(t => ({
              ...t,
              type: t.type === 'recette' ? 'Recette' : 'Dépense',
            }))}
          />
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              <Label>Type</Label>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes les opérations</SelectItem>
                  <SelectItem value="recette">Recettes uniquement</SelectItem>
                  <SelectItem value="depense">Dépenses uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rubrique</Label>
              <Select value={filterRubrique} onValueChange={setFilterRubrique}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes les rubriques</SelectItem>
                  {rubriques.map((r) => (
                    <SelectItem key={r.id} value={r.code}>
                      {r.code} - {r.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les services</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} - {s.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Libellé, bénéficiaire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
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
                <p className="text-xs text-muted-foreground">{summary.soldeNet >= 0 ? 'Excédent' : 'Déficit'}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total opérations</p>
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-xs text-muted-foreground">sur la période</p>
              </div>
              <ArrowUpDown className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Données</CardTitle>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="detail" className="flex items-center gap-1">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Détail</span>
                </TabsTrigger>
                <TabsTrigger value="synthese-rubrique" className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Rubriques</span>
                </TabsTrigger>
                <TabsTrigger value="synthese-service" className="flex items-center gap-1">
                  <PieChart className="w-4 h-4" />
                  <span className="hidden sm:inline">Services</span>
                </TabsTrigger>
                <TabsTrigger value="synthese-jour" className="flex items-center gap-1">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Jours</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          {viewMode === 'detail' && (
            <>
              <CardDescription className="mb-4">
                Liste détaillée des transactions - Cliquez sur les en-têtes pour trier
              </CardDescription>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('date')}>
                          Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                      </TableHead>
                      <TableHead>Heure</TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('type')}>
                          Type {sortField === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('numero')}>
                          N° Bon {sortField === 'numero' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                      </TableHead>
                      <TableHead>N° BEO</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Bénéficiaire</TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort('montant')}>
                          Montant {sortField === 'montant' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                      </TableHead>
                      <TableHead>Rubrique</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Observation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          Aucune transaction trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.slice(0, 100).map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.dateFormatted}</TableCell>
                          <TableCell className="text-muted-foreground">{t.heure}</TableCell>
                          <TableCell>
                            <Badge variant={t.type === 'recette' ? 'default' : 'secondary'}>
                              {t.type === 'recette' ? 'REC' : 'DEP'}
                            </Badge>
                          </TableCell>
                          <TableCell>{t.numero}</TableCell>
                          <TableCell className="text-muted-foreground">{t.numeroBEO}</TableCell>
                          <TableCell className="max-w-[150px] truncate" title={t.libelle}>
                            {t.libelle}
                          </TableCell>
                          <TableCell className="max-w-[120px] truncate" title={t.beneficiaire}>
                            {t.beneficiaire}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${t.type === 'recette' ? 'text-success' : 'text-destructive'}`}>
                            {formatMontant(t.montant)}
                          </TableCell>
                          <TableCell>
                            {t.rubriqueCod ? (
                              <Badge variant="outline" className="text-xs">{t.rubriqueCod}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {t.serviceName || '-'}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-muted-foreground" title={t.observation}>
                            {t.observation}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {filteredTransactions.length > 100 && (
                  <div className="text-center py-4 text-muted-foreground">
                    Affichage limité à 100 lignes. Exportez pour voir toutes les données.
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === 'synthese-rubrique' && (
            <>
              <CardDescription className="mb-4">
                Synthèse des opérations groupées par rubrique budgétaire
              </CardDescription>
              {renderSynthesisTable(synthesisByRubrique, 'Rubrique')}
            </>
          )}

          {viewMode === 'synthese-service' && (
            <>
              <CardDescription className="mb-4">
                Synthèse des opérations groupées par service/provenance
              </CardDescription>
              {renderSynthesisTable(synthesisByService, 'Service')}
            </>
          )}

          {viewMode === 'synthese-jour' && (
            <>
              <CardDescription className="mb-4">
                Synthèse des opérations groupées par jour
              </CardDescription>
              {renderSynthesisTable(synthesisByDay, 'Jour')}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
