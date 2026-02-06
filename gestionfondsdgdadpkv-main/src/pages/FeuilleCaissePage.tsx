import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Printer, ArrowUpRight, ArrowDownRight, Calendar, Loader2, 
  TrendingUp, TrendingDown, Wallet, FileText, Filter,
  ChevronDown, ChevronUp, RefreshCw, Download, Eye
} from "lucide-react";
import { formatMontant } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRecettes } from "@/hooks/useRecettes";
import { useDepenses } from "@/hooks/useDepenses";
import { exportToPDF, exportToExcel, getFeuilleCaisseExportConfig, PDFExportSettings } from "@/lib/exportUtils";
import { sortOperationsWithSoldeFirst } from "@/lib/rubriquesSortUtils";

interface Operation {
  id: string;
  date: string;
  heure: string;
  reference: string;
  type: "recette" | "depense";
  designation: string;
  recette: number | null;
  depense: number | null;
}

export default function FeuilleCaissePage() {
  const { recettes, isLoading: loadingRecettes } = useRecettes();
  const { depenses, isLoading: loadingDepenses } = useDepenses();
  
  const [dateDebut, setDateDebut] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [dateFin, setDateFin] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
  });
  const [showFilters, setShowFilters] = useState(false);

  const isLoading = loadingRecettes || loadingDepenses;

  // Combine and filter operations
  const operations: Operation[] = sortOperationsWithSoldeFirst([
    ...(recettes || [])
      .filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin)
      .map(r => ({
        id: r.id,
        date: r.date_transaction,
        heure: r.heure,
        reference: `REC-${String(r.numero_bon).padStart(4, '0')}`,
        type: 'recette' as const,
        designation: `${r.motif} - ${r.provenance}`,
        recette: Number(r.montant),
        depense: null,
      })),
    ...(depenses || [])
      .filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin)
      .map(d => ({
        id: d.id,
        date: d.date_transaction,
        heure: d.heure,
        reference: `DEP-${String(d.numero_bon).padStart(4, '0')}`,
        type: 'depense' as const,
        designation: `${d.motif} - ${d.beneficiaire}`,
        recette: null,
        depense: Number(d.montant),
      })),
  ].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.heure.localeCompare(b.heure);
  }));

  // Calculate running balance
  const operationsWithSolde = operations.reduce<(Operation & { solde: number })[]>((acc, op, index) => {
    const previousSolde = index > 0 ? acc[index - 1].solde : 0;
    const solde = previousSolde + (op.recette || 0) - (op.depense || 0);
    return [...acc, { ...op, solde }];
  }, []);

  const totalRecettes = operations.reduce((acc, op) => acc + (op.recette || 0), 0);
  const totalDepenses = operations.reduce((acc, op) => acc + (op.depense || 0), 0);
  const soldeActuel = totalRecettes - totalDepenses;
  const nombreOperations = operations.length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatDateLong = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getMoisAnnee = () => {
    const date = new Date(dateDebut);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const getPeriodeLabel = () => {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    if (debut.getMonth() === fin.getMonth() && debut.getFullYear() === fin.getFullYear()) {
      return getMoisAnnee();
    }
    return `${formatDate(dateDebut)} - ${formatDate(dateFin)}`;
  };

  const setCurrentMonth = () => {
    const now = new Date();
    setDateDebut(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
    setDateFin(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`);
  };

  const setCurrentWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    setDateDebut(monday.toISOString().split('T')[0]);
    setDateFin(sunday.toISOString().split('T')[0]);
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateDebut(today);
    setDateFin(today);
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Feuille de Caisse"
          description="Vue détaillée des opérations de caisse avec solde progressif"
          actions={
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer className="w-4 h-4" />
                Imprimer
              </Button>
              <ExportButtons
                onExportPDF={async (settings?: PDFExportSettings) => {
                  const filteredRecettes = (recettes || []).filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin);
                  const filteredDepenses = (depenses || []).filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin);
                  const config = getFeuilleCaisseExportConfig(
                    filteredRecettes,
                    filteredDepenses.map(d => ({ ...d, rubrique_libelle: d.rubrique?.libelle || 'N/A' })),
                    { soldeInitial: 0, totalRecettes, totalDepenses, soldeFinal: soldeActuel },
                    dateDebut
                  );
                  await exportToPDF({ ...config, pdfSettings: settings });
                }}
                onExportExcel={(settings) => {
                  const filteredRecettes = (recettes || []).filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin);
                  const filteredDepenses = (depenses || []).filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin);
                  const config = getFeuilleCaisseExportConfig(
                    filteredRecettes,
                    filteredDepenses.map(d => ({ ...d, rubrique_libelle: d.rubrique?.libelle || 'N/A' })),
                    { soldeInitial: 0, totalRecettes, totalDepenses, soldeFinal: soldeActuel },
                    dateDebut
                  );
                  exportToExcel({ ...config, pdfSettings: settings });
                }}
                disabled={operations.length === 0}
                previewTitle="Feuille de Caisse"
                previewSubtitle={`Période: ${formatDate(dateDebut)} - ${formatDate(dateFin)}`}
                previewColumns={[
                  { header: 'Date', key: 'date', width: 12 },
                  { header: 'Référence', key: 'reference', width: 12 },
                  { header: 'Désignation', key: 'designation', width: 30 },
                  { header: 'Recette', key: 'recette', width: 15 },
                  { header: 'Dépense', key: 'depense', width: 15 },
                  { header: 'Solde', key: 'solde', width: 15 },
                ]}
                previewData={operationsWithSolde.map(op => ({
                  ...op,
                  recette: op.recette || '',
                  depense: op.depense || '',
                }))}
              />
            </div>
          }
        />
      </motion.div>

      {/* Filtres de période */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-card rounded-2xl border shadow-sm overflow-hidden"
      >
        <div className="p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          {/* Quick filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">Période rapide:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={setToday}
              className="text-xs"
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={setCurrentWeek}
              className="text-xs"
            >
              Cette semaine
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={setCurrentMonth}
              className="text-xs"
            >
              Ce mois
            </Button>
          </div>

          <div className="hidden lg:block h-8 w-px bg-border" />

          {/* Date inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-36 h-8 border-0 bg-transparent p-0 focus:ring-0"
              />
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-36 h-8 border-0 bg-transparent p-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Period badge */}
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-medium px-3 py-1.5">
            <FileText className="w-4 h-4 mr-2" />
            {getPeriodeLabel()}
          </Badge>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Recettes */}
        <motion.div 
          className="bg-gradient-to-br from-success/10 via-success/5 to-transparent rounded-2xl border border-success/20 p-5 hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Total Recettes</p>
              <p className="text-2xl lg:text-3xl font-bold text-success">
                +{formatMontant(totalRecettes)}
              </p>
              <p className="text-xs text-muted-foreground">
                {operations.filter(o => o.type === 'recette').length} opération(s)
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </div>
        </motion.div>

        {/* Total Dépenses */}
        <motion.div 
          className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent rounded-2xl border border-destructive/20 p-5 hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Total Dépenses</p>
              <p className="text-2xl lg:text-3xl font-bold text-destructive">
                -{formatMontant(totalDepenses)}
              </p>
              <p className="text-xs text-muted-foreground">
                {operations.filter(o => o.type === 'depense').length} opération(s)
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </motion.div>

        {/* Solde Période */}
        <motion.div 
          className={`bg-gradient-to-br ${soldeActuel >= 0 ? 'from-primary/10 via-primary/5' : 'from-warning/10 via-warning/5'} to-transparent rounded-2xl border ${soldeActuel >= 0 ? 'border-primary/20' : 'border-warning/20'} p-5 hover:shadow-lg transition-all duration-300`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Solde Période</p>
              <p className={`text-2xl lg:text-3xl font-bold ${soldeActuel >= 0 ? 'text-primary' : 'text-warning'}`}>
                {soldeActuel >= 0 ? '+' : ''}{formatMontant(soldeActuel)}
              </p>
              <p className="text-xs text-muted-foreground">
                {soldeActuel >= 0 ? 'Excédent' : 'Déficit'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${soldeActuel >= 0 ? 'bg-primary/20' : 'bg-warning/20'} flex items-center justify-center`}>
              <Wallet className={`w-6 h-6 ${soldeActuel >= 0 ? 'text-primary' : 'text-warning'}`} />
            </div>
          </div>
        </motion.div>

        {/* Nombre opérations */}
        <motion.div 
          className="bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent rounded-2xl border border-secondary/20 p-5 hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Opérations</p>
              <p className="text-2xl lg:text-3xl font-bold text-secondary">
                {nombreOperations}
              </p>
              <p className="text-xs text-muted-foreground">
                mouvements de caisse
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Table des opérations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-card rounded-2xl border shadow-sm overflow-hidden"
      >
        {/* Table header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Feuille de Caisse - {getMoisAnnee()}
            </h3>
            <p className="text-sm text-muted-foreground">
              DGDA • Bureau Comptable • GestCaisse
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {nombreOperations} enregistrement(s)
          </Badge>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">Chargement des opérations...</p>
          </div>
        ) : operationsWithSolde.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
              <FileText className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Aucune opération</p>
              <p className="text-sm text-muted-foreground">Aucune opération enregistrée pour cette période</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Référence</TableHead>
                  <TableHead className="font-semibold">Désignation</TableHead>
                  <TableHead className="text-right font-semibold text-success">
                    <div className="flex items-center justify-end gap-1">
                      <ArrowUpRight className="w-4 h-4" />
                      Recettes (FC)
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-semibold text-destructive">
                    <div className="flex items-center justify-end gap-1">
                      <ArrowDownRight className="w-4 h-4" />
                      Dépenses (FC)
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-semibold">Solde (FC)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {operationsWithSolde.map((op, index) => (
                    <motion.tr
                      key={op.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="group hover:bg-muted/30 transition-colors border-b"
                    >
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDateLong(op.date)}</span>
                          <span className="text-xs text-muted-foreground">{op.heure.slice(0, 5)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge 
                          variant="outline" 
                          className={`font-mono ${
                            op.type === 'recette' 
                              ? 'bg-success/10 border-success/30 text-success' 
                              : 'bg-destructive/10 border-destructive/30 text-destructive'
                          }`}
                        >
                          {op.reference}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 max-w-[300px]">
                        <p className="truncate">{op.designation}</p>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {op.recette ? (
                          <motion.span 
                            className="inline-flex items-center gap-1 font-semibold text-success bg-success/10 px-2 py-1 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            +{formatMontant(op.recette)}
                          </motion.span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {op.depense ? (
                          <motion.span 
                            className="inline-flex items-center gap-1 font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                          >
                            <ArrowDownRight className="w-3 h-3" />
                            -{formatMontant(op.depense)}
                          </motion.span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <span className={`font-bold ${op.solde >= 0 ? 'text-primary' : 'text-warning'}`}>
                          {formatMontant(op.solde)}
                        </span>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
              <TableFooter className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                <TableRow className="border-t-2 border-primary/20">
                  <TableCell colSpan={3} className="font-bold text-lg">
                    TOTAUX PÉRIODE
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-lg text-success bg-success/10 px-3 py-1.5 rounded-lg inline-block">
                      +{formatMontant(totalRecettes)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-lg text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg inline-block">
                      -{formatMontant(totalDepenses)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold text-lg ${soldeActuel >= 0 ? 'text-primary bg-primary/10' : 'text-warning bg-warning/10'} px-3 py-1.5 rounded-lg inline-block`}>
                      {soldeActuel >= 0 ? '+' : ''}{formatMontant(soldeActuel)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}

        {/* Footer legend */}
        {operationsWithSolde.length > 0 && (
          <div className="p-4 border-t bg-muted/20 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span>Recettes (entrées)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>Dépenses (sorties)</span>
            </div>
            <div className="flex-1" />
            <span>
              Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
