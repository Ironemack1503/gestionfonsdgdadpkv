/**
 * État Financier (État de Résultat) Report Page
 * Displays financial statement with profit/loss calculation
 * Enhanced with legacy Crystal Report format options (Etat1.rpt, FCAISSE.rpt)
 */

import { useState, useMemo } from 'react';
import { Calendar, Loader2, FileText, FileSpreadsheet, FileDown, Printer, TrendingUp, TrendingDown, Wallet, Scale, Settings2, LayoutGrid, Table2 } from 'lucide-react';
import { formatMontant } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useReportData, numberToFrenchWords } from '@/hooks/useReportData';
import { exportToPDF, exportToExcel, ExportColumn, PDFExportSettings, defaultPDFSettings } from '@/lib/exportUtils';
import { exportToWord, generateTableHTML, generateSummaryHTML } from '@/lib/wordExport';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

type ViewMode = 'cards' | 'table';

export default function EtatFinancierPage() {
  const currentDate = new Date();
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(currentDate.getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showDetails, setShowDetails] = useState(true);
  
  // PDF export settings
  const [pdfSettings, setPdfSettings] = useState<Partial<PDFExportSettings>>({
    orientation: 'portrait',
    showWatermark: true,
    showFooter: true,
    showGenerationDate: true,
  });
  
  const { calculateEtatResultat, recettes, depenses, isLoading } = useReportData();

  // Calculate date range
  const dateDebut = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-01`;
  const lastDay = new Date(selectedAnnee, selectedMois, 0).getDate();
  const dateFin = `${selectedAnnee}-${String(selectedMois).padStart(2, '0')}-${lastDay}`;

  // Fetch previous month balance
  const { data: soldePrecedent = 0, isLoading: loadingBalance } = useQuery({
    queryKey: ['previous-month-balance-etat', selectedMois, selectedAnnee],
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
  const etatResultat = useMemo(() => {
    return calculateEtatResultat({ dateDebut, dateFin }, soldePrecedent);
  }, [calculateEtatResultat, dateDebut, dateFin, soldePrecedent]);

  // Filtered data for display
  const filteredRecettes = useMemo(() => 
    (recettes || []).filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin),
    [recettes, dateDebut, dateFin]
  );

  const filteredDepenses = useMemo(() => 
    (depenses || []).filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin),
    [depenses, dateDebut, dateFin]
  );

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR');
  const getMoisAnnee = () => `${moisNoms[selectedMois - 1]} ${selectedAnnee}`;

  // Determine if profit or deficit
  const isProfitable = etatResultat.beneficeDeficit >= 0;
  const balanceWords = numberToFrenchWords(Math.floor(Math.abs(etatResultat.balance)));

  // Build financial statement data - Format Legacy compatible
  const etatData = [
    { code: 'SP', designation: 'Solde de clôture mois antérieur', debit: 0, credit: soldePrecedent, type: 'report' },
    { code: 'R', designation: 'Total des Recettes du mois', debit: 0, credit: etatResultat.totalRecettes, type: 'recette' },
    { code: 'D', designation: 'Total des Dépenses du mois', debit: etatResultat.totalDepenses, credit: 0, type: 'depense' },
    { code: isProfitable ? 'B' : 'DF', designation: isProfitable ? 'Bénéfice (Excédent)' : 'Déficit', debit: isProfitable ? 0 : Math.abs(etatResultat.beneficeDeficit), credit: isProfitable ? etatResultat.beneficeDeficit : 0, type: isProfitable ? 'benefice' : 'deficit' },
    { code: 'E', designation: 'Encaisse (Recettes - Dépenses)', debit: etatResultat.encaisse < 0 ? Math.abs(etatResultat.encaisse) : 0, credit: etatResultat.encaisse >= 0 ? etatResultat.encaisse : 0, type: 'encaisse' },
    { code: 'BF', designation: 'Balance Finale', debit: etatResultat.balance < 0 ? Math.abs(etatResultat.balance) : 0, credit: etatResultat.balance >= 0 ? etatResultat.balance : 0, type: 'balance' },
  ];

  // Simple data for exports
  const simpleEtatData = [
    { designation: 'Solde de clôture mois antérieur', montant: soldePrecedent },
    { designation: 'Total des Recettes du mois', montant: etatResultat.totalRecettes },
    { designation: 'Total des Dépenses du mois', montant: etatResultat.totalDepenses },
    { designation: isProfitable ? 'Bénéfice (Excédent)' : 'Déficit', montant: etatResultat.beneficeDeficit },
    { designation: 'Encaisse (Recettes - Dépenses)', montant: etatResultat.encaisse },
    { designation: 'Balance Finale', montant: etatResultat.balance },
  ];

  // Export handlers
  const handleExportPDF = async () => {
    const columns: ExportColumn[] = [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Désignation', key: 'designation', width: 60 },
      { header: 'Débit (FC)', key: 'debit', width: 25, type: 'currency' },
      { header: 'Crédit (FC)', key: 'credit', width: 25, type: 'currency' },
    ];

    await exportToPDF({
      title: `État de Résultat - ${getMoisAnnee()}`,
      filename: `etat_resultat_${moisNoms[selectedMois - 1].toLowerCase()}_${selectedAnnee}`,
      subtitle: `Période: ${formatDate(dateDebut)} au ${formatDate(dateFin)} | Balance: ${balanceWords} Francs Congolais`,
      columns,
      data: etatData,
      pdfSettings: {
        ...defaultPDFSettings,
        ...pdfSettings,
      },
    });
  };

  const handleExportExcel = () => {
    const columns: ExportColumn[] = [
      { header: 'Code', key: 'code', width: 10 },
      { header: 'Désignation', key: 'designation', width: 50 },
      { header: 'Débit (FC)', key: 'debit', width: 25, type: 'currency' },
      { header: 'Crédit (FC)', key: 'credit', width: 25, type: 'currency' },
    ];

    exportToExcel({
      title: `État de Résultat - ${getMoisAnnee()}`,
      filename: `etat_resultat_${moisNoms[selectedMois - 1].toLowerCase()}_${selectedAnnee}`,
      subtitle: `Balance en lettres: ${balanceWords} Francs Congolais`,
      columns,
      data: etatData,
    });
  };

  const handleExportWord = () => {
    const tableColumns = [
      { header: 'Code', key: 'code', type: 'text' as const },
      { header: 'Désignation', key: 'designation', type: 'text' as const },
      { header: 'Débit (FC)', key: 'debit', type: 'currency' as const },
      { header: 'Crédit (FC)', key: 'credit', type: 'currency' as const },
    ];

    const summaryHTML = generateSummaryHTML([
      { label: 'Total Recettes', value: etatResultat.totalRecettes, type: 'success' },
      { label: 'Total Dépenses', value: etatResultat.totalDepenses, type: 'danger' },
      { label: isProfitable ? 'Bénéfice' : 'Déficit', value: Math.abs(etatResultat.beneficeDeficit), type: isProfitable ? 'success' : 'danger' },
      { label: 'Balance', value: etatResultat.balance, type: 'info' },
    ]);

    const tableHTML = generateTableHTML(tableColumns, etatData);

    const conclusion = `<div class="montant-lettres">
      <strong>Résultat:</strong> ${isProfitable ? 'Bénéfice' : 'Déficit'} de 
      ${numberToFrenchWords(Math.floor(Math.abs(etatResultat.beneficeDeficit)))} Francs Congolais.
      <br/>
      <strong>Balance finale:</strong> ${balanceWords} Francs Congolais.
    </div>`;

    exportToWord({
      title: `État de Résultat - ${getMoisAnnee()}`,
      filename: `etat_resultat_${moisNoms[selectedMois - 1].toLowerCase()}_${selectedAnnee}`,
      content: `
        <div class="subtitle">Période: ${formatDate(dateDebut)} au ${formatDate(dateFin)}</div>
        ${summaryHTML}
        ${tableHTML}
        ${conclusion}
      `,
    });
  };

  const loading = isLoading || loadingBalance;

  return (
    <div className="space-y-6">
      <PageHeader
        title="État de Résultat"
        description="Bilan financier et analyse des performances"
        actions={
          <div className="flex gap-2 flex-wrap">
            {/* View toggle */}
            <div className="flex border rounded-md">
              <Button 
                variant={viewMode === 'cards' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-r-none"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                <Table2 className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Export options */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="w-4 h-4 mr-2" />
                  Options
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Options d'export PDF</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="orientation">Orientation</Label>
                      <Select
                        value={pdfSettings.orientation}
                        onValueChange={(v) => setPdfSettings({ ...pdfSettings, orientation: v as 'portrait' | 'landscape' })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Paysage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="watermark">Filigrane DGDA</Label>
                      <Switch
                        id="watermark"
                        checked={pdfSettings.showWatermark}
                        onCheckedChange={(v) => setPdfSettings({ ...pdfSettings, showWatermark: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="footer">Pied de page</Label>
                      <Switch
                        id="footer"
                        checked={pdfSettings.showFooter}
                        onCheckedChange={(v) => setPdfSettings({ ...pdfSettings, showFooter: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="date">Date de génération</Label>
                      <Switch
                        id="date"
                        checked={pdfSettings.showGenerationDate}
                        onCheckedChange={(v) => setPdfSettings({ ...pdfSettings, showGenerationDate: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="details">Afficher formules</Label>
                      <Switch
                        id="details"
                        checked={showDetails}
                        onCheckedChange={setShowDetails}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
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
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Mois
              </Label>
              <select
                value={selectedMois}
                onChange={(e) => setSelectedMois(Number(e.target.value))}
                className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                className="w-28"
                min={2020}
                max={2030}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-success">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Recettes</p>
                    <p className="text-xl font-bold text-success">{formatMontant(etatResultat.totalRecettes, { showCurrency: true })}</p>
                    <p className="text-xs text-muted-foreground">{filteredRecettes.length} opérations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-destructive">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Dépenses</p>
                    <p className="text-xl font-bold text-destructive">{formatMontant(etatResultat.totalDepenses, { showCurrency: true })}</p>
                    <p className="text-xs text-muted-foreground">{filteredDepenses.length} opérations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${isProfitable ? 'border-l-success' : 'border-l-destructive'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isProfitable ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <Wallet className={`w-5 h-5 ${isProfitable ? 'text-success' : 'text-destructive'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isProfitable ? 'Bénéfice' : 'Déficit'}</p>
                    <p className={`text-xl font-bold ${isProfitable ? 'text-success' : 'text-destructive'}`}>
                      {formatMontant(Math.abs(etatResultat.beneficeDeficit), { showCurrency: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-info">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-info/10">
                    <Scale className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance Finale</p>
                    <p className={`text-xl font-bold ${etatResultat.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
                      {formatMontant(etatResultat.balance, { showCurrency: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Statement */}
          <Card>
            <CardHeader>
              <CardTitle>État de Résultat - {getMoisAnnee()}</CardTitle>
              <CardDescription>
                Période: {formatDate(dateDebut)} au {formatDate(dateFin)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'cards' ? (
                <div className="space-y-4">
                  {/* Report section */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Solde de clôture mois antérieur</span>
                      <span className="font-bold text-lg">{formatMontant(soldePrecedent, { showCurrency: true })}</span>
                    </div>
                  </div>

                  {/* Recettes */}
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-success" />
                        <span className="font-medium">Total des Recettes</span>
                      </div>
                      <span className="font-bold text-lg text-success">+ {formatMontant(etatResultat.totalRecettes, { showCurrency: true })}</span>
                    </div>
                  </div>

                  {/* Depenses */}
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-destructive" />
                        <span className="font-medium">Total des Dépenses</span>
                      </div>
                      <span className="font-bold text-lg text-destructive">- {formatMontant(etatResultat.totalDepenses, { showCurrency: true })}</span>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t-2 border-dashed" />

                  {/* Encaisse */}
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">Encaisse (Recettes - Dépenses)</span>
                        {showDetails && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Formule: Somme(Recettes) - Somme(Dépenses) = {formatMontant(etatResultat.totalRecettes)} - {formatMontant(etatResultat.totalDepenses)}
                          </p>
                        )}
                      </div>
                      <span className={`font-bold text-lg ${etatResultat.encaisse >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatMontant(etatResultat.encaisse, { showCurrency: true })}
                      </span>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">Balance Finale</span>
                        {showDetails && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Formule: Solde Précédent + Encaisse = {formatMontant(soldePrecedent)} + {formatMontant(etatResultat.encaisse)}
                          </p>
                        )}
                      </div>
                      <span className={`font-bold text-xl ${etatResultat.balance >= 0 ? 'text-info' : 'text-destructive'}`}>
                        {formatMontant(etatResultat.balance, { showCurrency: true })}
                      </span>
                    </div>
                  </div>

                  {/* Balance in words */}
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Balance en lettres:</strong> {balanceWords.charAt(0).toUpperCase() + balanceWords.slice(1)} Francs Congolais
                      {etatResultat.balance < 0 && ' (déficit)'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Table View - Legacy format */
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Code</TableHead>
                        <TableHead>Désignation</TableHead>
                        <TableHead className="text-right w-40">Débit (FC)</TableHead>
                        <TableHead className="text-right w-40">Crédit (FC)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {etatData.map((row, index) => (
                        <TableRow 
                          key={index} 
                          className={
                            row.type === 'balance' ? 'bg-info/10 font-bold' :
                            row.type === 'benefice' ? 'bg-success/10' :
                            row.type === 'deficit' ? 'bg-destructive/10' :
                            row.type === 'report' ? 'bg-muted/50' :
                            'hover:bg-muted/30'
                          }
                        >
                          <TableCell className="font-mono">{row.code}</TableCell>
                          <TableCell>{row.designation}</TableCell>
                          <TableCell className="text-right text-destructive">
                            {row.debit > 0 ? formatMontant(row.debit) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-success">
                            {row.credit > 0 ? formatMontant(row.credit) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted font-bold">
                        <TableCell colSpan={2}>TOTAUX</TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatMontant(etatData.reduce((sum, r) => sum + r.debit, 0))}
                        </TableCell>
                        <TableCell className="text-right text-success">
                          {formatMontant(etatData.reduce((sum, r) => sum + r.credit, 0))}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  
                  {/* Balance in words */}
                  <div className="p-4 bg-muted rounded-lg mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Balance en lettres:</strong> {balanceWords.charAt(0).toUpperCase() + balanceWords.slice(1)} Francs Congolais
                      {etatResultat.balance < 0 && ' (déficit)'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}