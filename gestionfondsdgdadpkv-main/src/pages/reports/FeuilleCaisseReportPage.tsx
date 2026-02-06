/**
 * Feuille de Caisse Report Page
 * Displays detailed cash sheet with all transactions
 * Supports filtering by: type (All/Recettes/Dépenses), service, rubrique
 * Based on Crystal Reports: RAPPORTCAISSE, RAPPORTCAISSEREC, RAPPORTCAISSEDEP, 
 * RAPPORTCAISSETYP, RAPPORTDECAISSEPARSERVICE
 * Uses Advanced Report Editor templates for unified export
 */

import { useState, useMemo } from 'react';
import { Calendar, Loader2, FileText, FileSpreadsheet, FileDown, Printer, Filter, Building2, Tag, X } from 'lucide-react';
import { formatMontant } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useReportData, numberToFrenchWords } from '@/hooks/useReportData';
import { useAdvancedExport } from '@/hooks/useAdvancedExport';
import { exportToPDF, exportToExcel, ExportColumn } from '@/lib/exportUtils';
import { exportToWord, generateTableHTML, generateSummaryHTML } from '@/lib/wordExport';
import { useReportSettings } from '@/hooks/useReportSettings';
import { useServices } from '@/hooks/useServices';
import { useRubriques } from '@/hooks/useRubriques';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

type FilterType = 'all' | 'recettes' | 'depenses';

export default function FeuilleCaisseReportPage() {
  const currentDate = new Date();
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(currentDate.getFullYear());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [selectedRubriqueId, setSelectedRubriqueId] = useState<string>('all');
  const [groupByRubrique, setGroupByRubrique] = useState(false);
  
  const { generateFeuilleCaisse, calculateEtatResultat, isLoading, recettes, depenses } = useReportData();
  const { settings: reportSettings } = useReportSettings();
  const { services, isLoading: loadingServices } = useServices();
  const { rubriques, isLoading: loadingRubriques } = useRubriques();

  // Calculate date range from month/year
  const dateDebut = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-01`;
  const lastDay = new Date(selectedAnnee, selectedMois, 0).getDate();
  const dateFin = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-${lastDay}`;

  // Fetch previous month balance
  const { data: soldePrecedent = 0, isLoading: loadingBalance } = useQuery({
    queryKey: ['previous-month-balance', selectedMois, selectedAnnee],
    queryFn: async () => {
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
        .gte('date', startDate)
        .lte('date', endDate);

      const { data: prevDepenses } = await supabase
        .from('depenses')
        .select('montant')
        .gte('date', startDate)
        .lte('date', endDate);

      const totalRecettes = (prevRecettes || []).reduce((acc, r) => acc + Number(r.montant), 0);
      const totalDepenses = (prevDepenses || []).reduce((acc, d) => acc + Number(d.montant), 0);

      return totalRecettes - totalDepenses;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Generate report data
  const feuilleCaisseData = useMemo(() => {
    return generateFeuilleCaisse({ dateDebut, dateFin }, soldePrecedent);
  }, [generateFeuilleCaisse, dateDebut, dateFin, soldePrecedent]);

  const etatResultat = useMemo(() => {
    return calculateEtatResultat({ dateDebut, dateFin }, soldePrecedent);
  }, [calculateEtatResultat, dateDebut, dateFin, soldePrecedent]);

  // Filter data based on selected type, service, and rubrique
  const filteredData = useMemo(() => {
    let data = feuilleCaisseData;
    
    // Filter by type
    if (filterType === 'recettes') {
      data = data.filter(row => row.recette > 0);
    } else if (filterType === 'depenses') {
      data = data.filter(row => row.depense > 0);
    }
    
    // Filter by service - need to look at original recettes/depenses data
    if (selectedServiceId !== 'all') {
      const recetteIds = recettes
        .filter(r => r.service_id === selectedServiceId)
        .map(r => r.id);
      const depenseIds = depenses
        .filter(d => d.service_id === selectedServiceId)
        .map(d => d.id);
      const validIds = new Set([...recetteIds, ...depenseIds]);
      data = data.filter(row => validIds.has(row.id));
    }
    
    // Filter by rubrique (only affects depenses)
    if (selectedRubriqueId !== 'all') {
      const depenseIds = depenses
        .filter(d => d.rubrique_id === selectedRubriqueId)
        .map(d => d.id);
      const validDepenseIds = new Set(depenseIds);
      // Keep recettes but filter depenses
      data = data.filter(row => row.recette > 0 || validDepenseIds.has(row.id));
    }
    
    return data;
  }, [feuilleCaisseData, filterType, selectedServiceId, selectedRubriqueId, recettes, depenses]);

  // Group data by rubrique if enabled
  const groupedData = useMemo(() => {
    if (!groupByRubrique) return null;
    
    const groups = new Map<string, { 
      rubrique: string; 
      rubriqueName: string;
      rows: typeof filteredData;
      totalRecettes: number;
      totalDepenses: number;
    }>();
    
    filteredData.forEach(row => {
      // Find the original depense to get rubrique
      const depense = depenses.find(d => d.id === row.id);
      const recette = recettes.find(r => r.id === row.id);
      
      let rubriqueCode = 'REC';
      let rubriqueName = 'Recettes';
      
      if (depense && depense.rubrique) {
        rubriqueCode = depense.rubrique.code;
        rubriqueName = depense.rubrique.libelle;
      } else if (recette) {
        rubriqueCode = 'REC';
        rubriqueName = 'Recettes';
      }
      
      if (!groups.has(rubriqueCode)) {
        groups.set(rubriqueCode, {
          rubrique: rubriqueCode,
          rubriqueName,
          rows: [],
          totalRecettes: 0,
          totalDepenses: 0,
        });
      }
      
      const group = groups.get(rubriqueCode)!;
      group.rows.push(row);
      group.totalRecettes += row.recette;
      group.totalDepenses += row.depense;
    });
    
    return Array.from(groups.values()).sort((a, b) => a.rubrique.localeCompare(b.rubrique));
  }, [filteredData, groupByRubrique, depenses, recettes]);

  // Calculate filtered totals
  const filteredTotals = useMemo(() => {
    const totalRecettes = filteredData.reduce((acc, row) => acc + (row.recette || 0), 0);
    const totalDepenses = filteredData.reduce((acc, row) => acc + (row.depense || 0), 0);
    return {
      totalRecettes,
      totalDepenses,
      encaisse: totalRecettes - totalDepenses,
      balance: soldePrecedent + totalRecettes - totalDepenses,
    };
  }, [filteredData, soldePrecedent]);

  // Get title based on filters
  const getReportTitle = () => {
    let title = '';
    switch (filterType) {
      case 'recettes':
        title = `Rapport des Recettes de Caisse`;
        break;
      case 'depenses':
        title = `Rapport des Dépenses de Caisse`;
        break;
      default:
        title = `Feuille de Caisse`;
    }
    
    if (selectedServiceId !== 'all') {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        title += ` - Service: ${service.libelle}`;
      }
    }
    
    if (selectedRubriqueId !== 'all') {
      const rubrique = rubriques.find(r => r.id === selectedRubriqueId);
      if (rubrique) {
        title += ` - Rubrique: ${rubrique.libelle}`;
      }
    }
    
    return `${title} - ${getMoisAnnee()}`;
  };

  const getFilterLabel = () => {
    const parts: string[] = [];
    
    switch (filterType) {
      case 'recettes':
        parts.push('Recettes uniquement');
        break;
      case 'depenses':
        parts.push('Dépenses uniquement');
        break;
      default:
        parts.push('Toutes les opérations');
    }
    
    if (selectedServiceId !== 'all') {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) parts.push(`Service: ${service.code}`);
    }
    
    if (selectedRubriqueId !== 'all') {
      const rubrique = rubriques.find(r => r.id === selectedRubriqueId);
      if (rubrique) parts.push(`Rubrique: ${rubrique.code}`);
    }
    
    if (groupByRubrique) {
      parts.push('Groupé par rubrique');
    }
    
    return parts.join(' | ');
  };

  const hasActiveFilters = selectedServiceId !== 'all' || selectedRubriqueId !== 'all' || groupByRubrique;

  const clearFilters = () => {
    setSelectedServiceId('all');
    setSelectedRubriqueId('all');
    setGroupByRubrique(false);
  };

  // Format date for display
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR');
  const getMoisAnnee = () => `${moisNoms[selectedMois - 1]} ${selectedAnnee}`;

  // Export handlers
  const handleExportPDF = async () => {
    const columns: ExportColumn[] = filterType === 'all' 
      ? [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'N° Ordre', key: 'numeroOrdre', width: 12 },
          { header: 'N° BEO', key: 'numeroBEO', width: 15 },
          { header: 'Libellé', key: 'libelle', width: 40 },
          { header: 'Recette', key: 'recette', width: 18 },
          { header: 'Dépense', key: 'depense', width: 18 },
          { header: 'Solde', key: 'balance', width: 18 },
        ]
      : filterType === 'recettes'
      ? [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'N° Bon', key: 'numeroOrdre', width: 12 },
          { header: 'N° BEO', key: 'numeroBEO', width: 18 },
          { header: 'Provenance', key: 'libelle', width: 45 },
          { header: 'Montant (FC)', key: 'recette', width: 25 },
        ]
      : [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'N° Bon', key: 'numeroOrdre', width: 12 },
          { header: 'N° BEO', key: 'numeroBEO', width: 18 },
          { header: 'Bénéficiaire', key: 'libelle', width: 45 },
          { header: 'Montant (FC)', key: 'depense', width: 25 },
        ];

    const exportData = filterType === 'all'
      ? [
          {
            date: formatDate(dateDebut),
            numeroOrdre: '-',
            numeroBEO: 'REPORT',
            libelle: 'Solde de clôture mois antérieur',
            recette: soldePrecedent > 0 ? soldePrecedent : '',
            depense: soldePrecedent < 0 ? Math.abs(soldePrecedent) : '',
            balance: soldePrecedent,
          },
          ...filteredData.map(row => ({
            ...row,
            date: formatDate(row.date),
            recette: row.recette || '',
            depense: row.depense || '',
          })),
        ]
      : filteredData.map(row => ({
          ...row,
          date: formatDate(row.date),
          recette: row.recette || 0,
          depense: row.depense || 0,
        }));

    const subtitle = `Période: ${formatDate(dateDebut)} au ${formatDate(dateFin)} | ${getFilterLabel()}`;

    await exportToPDF({
      title: getReportTitle(),
      filename: `rapport_caisse_${filterType}_${moisNoms[selectedMois - 1].toLowerCase()}_${selectedAnnee}`,
      subtitle,
      columns,
      data: exportData,
    });
  };

  const handleExportExcel = () => {
    const columns: ExportColumn[] = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'N° Ordre', key: 'numeroOrdre', width: 10 },
      { header: 'N° BEO', key: 'numeroBEO', width: 15 },
      { header: 'Libellé', key: 'libelle', width: 40 },
      { header: 'Recette (FC)', key: 'recette', width: 18 },
      { header: 'Dépense (FC)', key: 'depense', width: 18 },
      { header: 'IMP', key: 'imp', width: 8 },
      { header: 'Total', key: 'total', width: 18 },
      { header: 'Caisse', key: 'caisse', width: 18 },
      { header: 'Balance', key: 'balance', width: 18 },
    ];

    const dataWithSolde = [
      {
        date: formatDate(dateDebut),
        numeroOrdre: '-',
        numeroBEO: 'REPORT',
        libelle: 'Solde de clôture mois antérieur',
        recette: soldePrecedent,
        depense: 0,
        imp: 'SP',
        total: soldePrecedent,
        caisse: soldePrecedent,
        balance: soldePrecedent,
      },
      ...filteredData.map(row => ({
        ...row,
        date: formatDate(row.date),
      })),
    ];

    exportToExcel({
      title: getReportTitle(),
      filename: `rapport_caisse_${filterType}_${moisNoms[selectedMois - 1].toLowerCase()}_${selectedAnnee}`,
      subtitle: `${getFilterLabel()} | Solde en lettres: ${numberToFrenchWords(Math.floor(filteredTotals.balance))} Francs Congolais`,
      columns,
      data: dataWithSolde,
    });
  };

  const handleExportWord = () => {
    const tableColumns = [
      { header: 'Date', key: 'date', type: 'text' as const },
      { header: 'N° Ordre', key: 'numeroOrdre', type: 'number' as const, align: 'center' as const },
      { header: 'N° BEO', key: 'numeroBEO', type: 'text' as const },
      { header: 'Libellé', key: 'libelle', type: 'text' as const },
      { header: 'Recette', key: 'recette', type: 'currency' as const },
      { header: 'Dépense', key: 'depense', type: 'currency' as const },
      { header: 'Balance', key: 'balance', type: 'currency' as const },
    ];

    const dataWithSolde = filterType === 'all'
      ? [
          {
            date: formatDate(dateDebut),
            numeroOrdre: '-',
            numeroBEO: 'REPORT',
            libelle: 'Solde de clôture mois antérieur',
            recette: soldePrecedent > 0 ? soldePrecedent : 0,
            depense: 0,
            balance: soldePrecedent,
          },
          ...filteredData.map(row => ({
            ...row,
            date: formatDate(row.date),
          })),
        ]
      : filteredData.map(row => ({
          ...row,
          date: formatDate(row.date),
        }));

    const summaryHTML = generateSummaryHTML([
      { label: 'Total Recettes', value: filteredTotals.totalRecettes, type: 'success' },
      { label: 'Total Dépenses', value: filteredTotals.totalDepenses, type: 'danger' },
      { label: 'Encaisse', value: filteredTotals.encaisse, type: filteredTotals.encaisse >= 0 ? 'success' : 'danger' },
      { label: 'Balance', value: filteredTotals.balance, type: 'info' },
    ]);

    const tableHTML = generateTableHTML(tableColumns, dataWithSolde, {
      showTotals: true,
      totalsLabel: 'TOTAUX',
      totalsColumns: ['recette', 'depense'],
    });

    const montantLettres = `<div class="montant-lettres">
      <strong>Solde en lettres:</strong> ${numberToFrenchWords(Math.floor(Math.abs(filteredTotals.balance)))} Francs Congolais
      ${filteredTotals.balance < 0 ? '(déficit)' : ''}
    </div>`;

    exportToWord({
      title: getReportTitle(),
      filename: `rapport_caisse_${filterType}_${moisNoms[selectedMois - 1].toLowerCase()}_${selectedAnnee}`,
      content: `
        <div class="subtitle">Période: ${formatDate(dateDebut)} au ${formatDate(dateFin)} - ${getFilterLabel()}</div>
        ${summaryHTML}
        ${tableHTML}
        ${montantLettres}
      `,
    });
  };

  const loading = isLoading || loadingBalance || loadingServices || loadingRubriques;

  // Render grouped table
  const renderGroupedTable = () => {
    if (!groupedData || groupedData.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Aucune opération pour cette période
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {groupedData.map((group) => (
          <Card key={group.rubrique} className="overflow-hidden">
            <CardHeader className="bg-muted/50 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{group.rubrique}</Badge>
                  <span className="font-medium">{group.rubriqueName}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {group.totalRecettes > 0 && (
                    <span className="text-success">
                      Recettes: {formatMontant(group.totalRecettes)}
                    </span>
                  )}
                  {group.totalDepenses > 0 && (
                    <span className="text-destructive">
                      Dépenses: {formatMontant(group.totalDepenses)}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">N° Bon</TableHead>
                    <TableHead>N° BEO</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Montant (FC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell className="text-center font-medium">
                        {row.recette > 0 ? `REC-${row.numeroOrdre}` : `DEP-${row.numeroOrdre}`}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.numeroBEO}</TableCell>
                      <TableCell>{row.libelle}</TableCell>
                      <TableCell className={`text-right font-medium ${row.recette > 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatMontant(row.recette > 0 ? row.recette : row.depense)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render the transactions table
  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (groupByRubrique) {
      return renderGroupedTable();
    }

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Aucune opération pour cette période
          {hasActiveFilters && (
            <div className="mt-2">
              <Button variant="link" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Different table layouts based on filter type
    if (filterType === 'recettes') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">N° Bon</TableHead>
                <TableHead>N° BEO</TableHead>
                <TableHead>Provenance / Motif</TableHead>
                <TableHead className="text-right">Montant (FC)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell className="text-center font-medium">REC-{row.numeroOrdre}</TableCell>
                  <TableCell className="font-mono text-sm">{row.numeroBEO}</TableCell>
                  <TableCell>{row.libelle}</TableCell>
                  <TableCell className="text-right text-success font-medium">
                    {formatMontant(row.recette)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-success/10 font-bold">
                <TableCell colSpan={4}>TOTAL DES RECETTES</TableCell>
                <TableCell className="text-right text-success">
                  {formatMontant(filteredTotals.totalRecettes)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      );
    }

    if (filterType === 'depenses') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">N° Bon</TableHead>
                <TableHead>N° BEO</TableHead>
                <TableHead>Bénéficiaire / Motif</TableHead>
                <TableHead className="text-right">Montant (FC)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell className="text-center font-medium">DEP-{row.numeroOrdre}</TableCell>
                  <TableCell className="font-mono text-sm">{row.numeroBEO}</TableCell>
                  <TableCell>{row.libelle}</TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    {formatMontant(row.depense)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-destructive/10 font-bold">
                <TableCell colSpan={4}>TOTAL DES DÉPENSES</TableCell>
                <TableCell className="text-right text-destructive">
                  {formatMontant(filteredTotals.totalDepenses)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      );
    }

    // Default: All transactions
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">N° Ordre</TableHead>
              <TableHead>N° BEO</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead className="text-right">Recette (FC)</TableHead>
              <TableHead className="text-right">Dépense (FC)</TableHead>
              <TableHead className="text-center">IMP</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Caisse</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Solde precedent row */}
            <TableRow className="bg-muted/50 font-medium">
              <TableCell>{formatDate(dateDebut)}</TableCell>
              <TableCell className="text-center">-</TableCell>
              <TableCell>REPORT</TableCell>
              <TableCell>Solde de clôture mois antérieur</TableCell>
              <TableCell className="text-right text-success">
                {soldePrecedent > 0 ? formatMontant(soldePrecedent) : '-'}
              </TableCell>
              <TableCell className="text-right text-destructive">-</TableCell>
              <TableCell className="text-center">SP</TableCell>
              <TableCell className="text-right">{formatMontant(soldePrecedent)}</TableCell>
              <TableCell className="text-right">{formatMontant(soldePrecedent)}</TableCell>
              <TableCell className="text-right font-bold">{formatMontant(soldePrecedent)}</TableCell>
            </TableRow>
            {filteredData.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30">
                <TableCell>{formatDate(row.date)}</TableCell>
                <TableCell className="text-center">{row.numeroOrdre}</TableCell>
                <TableCell className="font-mono text-sm">{row.numeroBEO}</TableCell>
                <TableCell>{row.libelle}</TableCell>
                <TableCell className="text-right text-success">
                  {row.recette > 0 ? formatMontant(row.recette) : '-'}
                </TableCell>
                <TableCell className="text-right text-destructive">
                  {row.depense > 0 ? formatMontant(row.depense) : '-'}
                </TableCell>
                <TableCell className="text-center">{row.imp}</TableCell>
                <TableCell className="text-right">{formatMontant(row.total)}</TableCell>
                <TableCell className="text-right">{formatMontant(row.caisse)}</TableCell>
                <TableCell className="text-right font-bold">{formatMontant(row.balance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted font-bold">
              <TableCell colSpan={4}>TOTAUX</TableCell>
              <TableCell className="text-right text-success">
                {formatMontant(filteredTotals.totalRecettes)}
              </TableCell>
              <TableCell className="text-right text-destructive">
                {formatMontant(filteredTotals.totalDepenses)}
              </TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">
                {formatMontant(filteredTotals.encaisse)}
              </TableCell>
              <TableCell></TableCell>
              <TableCell className={`text-right ${filteredTotals.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
                {formatMontant(filteredTotals.balance)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport Feuille de Caisse"
        description="État détaillé des opérations de caisse avec options de filtrage avancées"
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Period Filters */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Mois
              </Label>
              <select
                value={selectedMois}
                onChange={(e) => setSelectedMois(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {moisNoms.map((mois, index) => (
                  <option key={index} value={index + 1}>{mois}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Année</Label>
              <Input
                type="number"
                value={selectedAnnee}
                onChange={(e) => setSelectedAnnee(Number(e.target.value))}
                className="w-full"
                min={2020}
                max={2030}
              />
            </div>

            {/* Service Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Service
              </Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les services</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.code} - {service.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rubrique Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Rubrique
              </Label>
              <Select value={selectedRubriqueId} onValueChange={setSelectedRubriqueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les rubriques" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les rubriques</SelectItem>
                  {rubriques.map((rubrique) => (
                    <SelectItem key={rubrique.id} value={rubrique.id}>
                      {rubrique.code} - {rubrique.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group by Rubrique Toggle */}
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  id="group-rubrique"
                  checked={groupByRubrique}
                  onCheckedChange={setGroupByRubrique}
                />
                <Label htmlFor="group-rubrique" className="text-sm font-normal cursor-pointer">
                  Grouper par rubrique
                </Label>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Filtres actifs:</span>
              <div className="flex flex-wrap gap-2">
                {selectedServiceId !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Service: {services.find(s => s.id === selectedServiceId)?.code}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedServiceId('all')} />
                  </Badge>
                )}
                {selectedRubriqueId !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Rubrique: {rubriques.find(r => r.id === selectedRubriqueId)?.code}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedRubriqueId('all')} />
                  </Badge>
                )}
                {groupByRubrique && (
                  <Badge variant="secondary" className="gap-1">
                    Groupé par rubrique
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setGroupByRubrique(false)} />
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-2">
                Tout effacer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Encaisse</p>
            <p className={`text-xl font-bold ${etatResultat.encaisse >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatMontant(etatResultat.encaisse, { showCurrency: true })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className={`text-xl font-bold ${etatResultat.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
              {formatMontant(etatResultat.balance, { showCurrency: true })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>{getReportTitle()}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Solde en lettres: <span className="font-medium">{numberToFrenchWords(Math.floor(Math.abs(filteredTotals.balance)))} Francs Congolais</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>{filteredData.length} opération(s)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Toutes ({feuilleCaisseData.length})
              </TabsTrigger>
              <TabsTrigger value="recettes" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                Recettes ({feuilleCaisseData.filter(r => r.recette > 0).length})
              </TabsTrigger>
              <TabsTrigger value="depenses" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive"></span>
                Dépenses ({feuilleCaisseData.filter(r => r.depense > 0).length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={filterType} className="mt-0">
              {renderTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
