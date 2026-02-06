import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit, Trash2, Loader2, Filter, ArrowDownRight, 
  ChevronLeft, ChevronRight, Printer, Calendar, Search,
  TrendingDown, Eye, MoreHorizontal, X, RefreshCw, Tag, Download
} from "lucide-react";
import { formatMontant } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDepenses, Depense } from "@/hooks/useDepenses";
import { useRubriques } from "@/hooks/useRubriques";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
import { printBonDepense, downloadBonDepense } from "@/lib/printBon";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, exportToExcel, getDepensesExportConfig, PDFExportSettings } from "@/lib/exportUtils";
import { CreateDepenseDialog, EditDepenseDialog, ViewTransactionDialog } from "@/components/dialogs";

export default function DepensesPage() {
  const { depenses, isLoading, totalCount, page, setPage, totalPages, pageSize, setPageSize, createDepense, updateDepense, deleteDepense, fetchAllForExport } = useDepenses();
  const { rubriques } = useRubriques();
  const { canEdit, isAdmin } = useLocalUserRole();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [rubriqueFilter, setRubriqueFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredDepenses = depenses.filter((d) => {
    const matchesSearch = 
      d.motif.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.beneficiaire.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.rubrique?.libelle || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRubrique = rubriqueFilter === "all" || d.rubrique_id === rubriqueFilter;
    
    if (dateFilter === "all") return matchesSearch && matchesRubrique;
    
    const recordDate = new Date(d.date_transaction);
    const today = new Date();
    
    if (dateFilter === "today") {
      return matchesSearch && matchesRubrique && recordDate.toDateString() === today.toDateString();
    }
    if (dateFilter === "week") {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && matchesRubrique && recordDate >= weekAgo;
    }
    if (dateFilter === "month") {
      return matchesSearch && matchesRubrique && 
        recordDate.getMonth() === today.getMonth() && 
        recordDate.getFullYear() === today.getFullYear();
    }
    
    return matchesSearch && matchesRubrique;
  });

  const handleCreateDepense = async (data: {
    date_transaction: string;
    rubrique_id: string;
    beneficiaire: string;
    motif: string;
    montant: number;
    montant_lettre: string;
    observation?: string;
  }) => {
    await createDepense.mutateAsync({
      rubrique_id: data.rubrique_id,
      beneficiaire: data.beneficiaire,
      motif: data.motif,
      montant: data.montant,
      montant_lettre: data.montant_lettre,
      observation: data.observation,
    });
    setIsCreateDialogOpen(false);
  };

  const handleUpdateDepense = async (data: Partial<Depense>) => {
    if (!data.id) return;
    await updateDepense.mutateAsync(data as Depense & { id: string });
    setIsEditDialogOpen(false);
    setSelectedDepense(null);
  };

  const handleEditClick = (item: Depense) => {
    setSelectedDepense(item);
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (item: Depense) => {
    setSelectedDepense(item);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) {
      await deleteDepense.mutateAsync(id);
    }
  };

  const handleExportPDF = async (settings?: PDFExportSettings) => {
    setIsExporting(true);
    try {
      const allData = await fetchAllForExport();
      const dataWithRubrique = allData.map(d => ({
        ...d,
        rubrique_libelle: d.rubrique?.libelle || 'N/A',
      }));
      const config = getDepensesExportConfig(dataWithRubrique);
      await exportToPDF({ ...config, pdfSettings: settings });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async (settings?: PDFExportSettings) => {
    setIsExporting(true);
    try {
      const allData = await fetchAllForExport();
      const dataWithRubrique = allData.map(d => ({
        ...d,
        rubrique_libelle: d.rubrique?.libelle || 'N/A',
      }));
      const config = getDepensesExportConfig(dataWithRubrique);
      exportToExcel({ ...config, pdfSettings: settings });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = (item: Depense) => {
    printBonDepense({
      numero_bon: item.numero_bon,
      date: item.date_transaction,
      heure: item.heure,
      motif: item.motif,
      beneficiaire: item.beneficiaire,
      montant: item.montant,
      montant_lettre: item.montant_lettre,
      observation: item.observation,
      rubrique: item.rubrique,
    });
    toast({
      title: "Impression lancée",
      description: `Bon de dépense DEP-${String(item.numero_bon).padStart(4, '0')} ouvert dans un nouvel onglet`,
    });
  };

  const handleDownload = (item: Depense) => {
    downloadBonDepense({
      numero_bon: item.numero_bon,
      date: item.date_transaction,
      heure: item.heure,
      motif: item.motif,
      beneficiaire: item.beneficiaire,
      montant: item.montant,
      montant_lettre: item.montant_lettre,
      observation: item.observation,
      rubrique: item.rubrique,
    });
    toast({
      title: "Téléchargement",
      description: `Bon de dépense DEP-${String(item.numero_bon).padStart(4, '0')} téléchargé`,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setRubriqueFilter("all");
  };

  const hasActiveFilters = searchQuery || dateFilter !== "all" || rubriqueFilter !== "all";

  const columns = [
    { 
      key: "numero_bon", 
      header: "N° Dépense",
      render: (item: Depense) => (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="font-mono text-sm font-semibold bg-gradient-to-r from-destructive/10 to-destructive/5 px-3 py-1.5 rounded-lg border border-destructive/20">
            DEP-{String(item.numero_bon).padStart(4, "0")}
          </span>
        </div>
      )
    },
    { 
      key: "date", 
      header: "Date & Heure",
      render: (item: Depense) => (
        <div className="flex flex-col">
          <span className="font-medium">{new Date(item.date_transaction).toLocaleDateString("fr-FR")}</span>
          <span className="text-xs text-muted-foreground">{item.heure.slice(0, 5)}</span>
        </div>
      )
    },
    {
      key: "rubrique",
      header: "Rubrique",
      render: (item: Depense) => (
        <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 hover:bg-secondary/30">
          <Tag className="w-3 h-3 mr-1" />
          {item.rubrique?.libelle || "N/A"}
        </Badge>
      ),
    },
    { 
      key: "beneficiaire", 
      header: "Bénéficiaire",
      render: (item: Depense) => (
        <div className="max-w-[150px]">
          <p className="font-medium truncate">{item.beneficiaire}</p>
        </div>
      )
    },
    { 
      key: "motif", 
      header: "Motif",
      render: (item: Depense) => (
        <div className="max-w-[200px]">
          <p className="text-sm truncate text-muted-foreground">{item.motif}</p>
        </div>
      )
    },
    {
      key: "montant",
      header: "Montant (FC)",
      className: "text-right",
      render: (item: Depense) => (
        <div className="flex items-center justify-end gap-2">
          <motion.div 
            className="flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg font-bold"
            whileHover={{ scale: 1.02 }}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>-{formatMontant(item.montant)}</span>
          </motion.div>
        </div>
      ),
    },
    ...(canEdit || isAdmin ? [{
      key: "actions",
      header: "Actions",
      render: (item: Depense) => (
        <div className="flex items-center justify-end gap-1">
          <TooltipProvider>
            {/* Bouton Voir - Bleu principal */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  onClick={() => handleViewClick(item)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voir détails</TooltipContent>
            </Tooltip>

            {/* Bouton Modifier - Bleu clair (secondary) */}
            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-secondary hover:bg-secondary/10 hover:text-secondary transition-all duration-200"
                    onClick={() => handleEditClick(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Modifier</TooltipContent>
              </Tooltip>
            )}

            {/* Bouton Imprimer - Or (accent) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-accent hover:bg-accent/10 hover:text-accent transition-all duration-200"
                  onClick={() => handlePrint(item)}
                >
                  <Printer className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Imprimer</TooltipContent>
            </Tooltip>

            {/* Bouton Supprimer - Rouge (destructive) */}
            {isAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Supprimer</TooltipContent>
              </Tooltip>
            )}

            {/* Menu déroulant pour plus d'actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="gap-2" onClick={() => handleViewClick(item)}>
                  <Eye className="w-4 h-4" /> Voir détails
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem className="gap-2 text-secondary" onClick={() => handleEditClick(item)}>
                    <Edit className="w-4 h-4" /> Modifier
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="gap-2 text-accent" onClick={() => handlePrint(item)}>
                  <Printer className="w-4 h-4" /> Imprimer bon
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => handleDownload(item)}>
                  <Download className="w-4 h-4" /> Télécharger PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem 
                    className="gap-2 text-destructive focus:text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>
      ),
    }] : []),
  ];

  const filteredTotal = filteredDepenses.reduce((acc, d) => acc + Number(d.montant), 0);

  return (
    <div className="page-container space-y-6">
      {/* Header avec actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Gestion des Dépenses"
          description="Enregistrez et gérez les sorties de caisse"
          actions={
            <div className="flex flex-wrap gap-3">
              <ExportButtons
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                disabled={totalCount === 0 || isExporting}
                previewTitle="Liste des Dépenses"
                previewSubtitle={dateFilter !== "all" || rubriqueFilter !== "all" ? `Filtres appliqués` : undefined}
                previewColumns={[
                  { header: 'N° Bon', key: 'numero_bon', width: 10 },
                  { header: 'Date', key: 'date', width: 12 },
                  { header: 'Bénéficiaire', key: 'beneficiaire', width: 20 },
                  { header: 'Motif', key: 'motif', width: 25 },
                  { header: 'Rubrique', key: 'rubrique_libelle', width: 20 },
                  { header: 'Montant', key: 'montant', width: 15 },
                ]}
                previewData={filteredDepenses.map(d => ({
                  ...d,
                  rubrique_libelle: d.rubrique?.libelle || 'N/A',
                }))}
              />
              {canEdit && (
                <Button 
                  className="gap-2 bg-destructive hover:bg-destructive/90 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle dépense
                </Button>
              )}
            </div>
          }
        />
      </motion.div>

      {/* Barre de recherche et filtres avancés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-card rounded-2xl border shadow-sm p-4"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par motif, bénéficiaire, rubrique..."
              className="pl-10 bg-muted/30 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px] border-0 bg-transparent h-8 focus:ring-0">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes dates</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Select value={rubriqueFilter} onValueChange={setRubriqueFilter}>
                <SelectTrigger className="w-[160px] border-0 bg-transparent h-8 focus:ring-0">
                  <SelectValue placeholder="Rubrique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes rubriques</SelectItem>
                  {rubriques.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filtres avancés
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
                Effacer
              </Button>
            )}
          </div>
        </div>

        {/* Filtres avancés extensibles */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date début</Label>
                  <Input type="date" className="bg-muted/30 border-0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date fin</Label>
                  <Input type="date" className="bg-muted/30 border-0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Montant min - max</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Min" className="bg-muted/30 border-0" />
                    <Input type="number" placeholder="Max" className="bg-muted/30 border-0" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cartes de résumé */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Total dépenses */}
        <div className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent rounded-2xl border border-destructive/20 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total dépenses (page)</p>
              <p className="text-2xl lg:text-3xl font-bold text-destructive mt-1">
                {formatMontant(filteredTotal, { showCurrency: true })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </div>

        {/* Total enregistrements */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total enregistrements</p>
              <p className="text-2xl lg:text-3xl font-bold text-primary mt-1">{totalCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Filter className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Page actuelle */}
        <div className="bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent rounded-2xl border border-secondary/20 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Page actuelle</p>
              <p className="text-2xl lg:text-3xl font-bold text-secondary mt-1">{page} / {totalPages}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tableau */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        {isLoading ? (
          <TableSkeleton columns={6} rows={5} />
        ) : (
          <>
            <DataTable 
              columns={columns} 
              data={filteredDepenses} 
              emptyMessage="Aucune dépense enregistrée"
              pageSize={100}
            />
            
            {/* Pagination serveur */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 px-2 gap-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Page <span className="font-semibold text-foreground">{page}</span> sur{" "}
                  <span className="font-semibold text-foreground">{totalPages}</span>{" "}
                  ({totalCount} enregistrements)
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Afficher</span>
                  <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger className="w-[80px] h-8 bg-muted/30 border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="gap-1"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Dialogues */}
      <CreateDepenseDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateDepense}
        isLoading={createDepense.isPending}
      />

      <EditDepenseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        depense={selectedDepense}
        onSave={handleUpdateDepense}
        isLoading={updateDepense.isPending}
      />

      <ViewTransactionDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        transaction={selectedDepense ? {
          ...selectedDepense,
          type: 'depense',
        } : null}
        onPrint={() => selectedDepense && handlePrint(selectedDepense)}
        onDownload={() => selectedDepense && handleDownload(selectedDepense)}
      />
    </div>
  );
}
