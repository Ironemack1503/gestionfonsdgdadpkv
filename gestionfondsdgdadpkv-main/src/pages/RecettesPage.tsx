import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit, Trash2, Loader2, Filter, ArrowUpRight, 
  ChevronLeft, ChevronRight, Printer, Calendar, Search,
  TrendingUp, Eye, MoreHorizontal, X, RefreshCw, Download
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useRecettes, Recette } from "@/hooks/useRecettes";
import { printBonRecette, downloadBonRecette } from "@/lib/printBon";
import { useToast } from "@/hooks/use-toast";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
import { exportToPDF, exportToExcel, getRecettesExportConfig, PDFExportSettings } from "@/lib/exportUtils";
import { CreateRecetteDialog, EditRecetteDialog, ViewTransactionDialog } from "@/components/dialogs";

export default function RecettesPage() {
  const { recettes, isLoading, totalCount, page, setPage, totalPages, pageSize, setPageSize, createRecette, updateRecette, deleteRecette, fetchAllForExport } = useRecettes();
  const { canEdit, isAdmin } = useLocalUserRole();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRecette, setSelectedRecette] = useState<Recette | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredRecettes = (recettes || []).filter((r) => {
    const matchesSearch = 
      r.motif.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.provenance.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.numero_bon).includes(searchQuery);
    
    if (dateFilter === "all") return matchesSearch;
    
    const recordDate = new Date(r.date_transaction);
    const today = new Date();
    
    if (dateFilter === "today") {
      return matchesSearch && recordDate.toDateString() === today.toDateString();
    }
    if (dateFilter === "week") {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && recordDate >= weekAgo;
    }
    if (dateFilter === "month") {
      return matchesSearch && 
        recordDate.getMonth() === today.getMonth() && 
        recordDate.getFullYear() === today.getFullYear();
    }
    
    return matchesSearch;
  });

  const handleCreateRecette = async (data: {
    date_transaction: string;
    provenance: string;
    motif: string;
    montant: number;
    montant_lettre: string;
    observation?: string;
    service_id?: string;
  }) => {
    await createRecette.mutateAsync({
      motif: data.motif,
      provenance: data.provenance,
      montant: data.montant,
      montant_lettre: data.montant_lettre,
      observation: data.observation,
    });
    setIsCreateDialogOpen(false);
  };

  const handleUpdateRecette = async (data: Partial<Recette>) => {
    if (!data.id) return;
    await updateRecette.mutateAsync(data as Recette & { id: string });
    setIsEditDialogOpen(false);
    setSelectedRecette(null);
  };

  const handleEditClick = (item: Recette) => {
    setSelectedRecette(item);
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (item: Recette) => {
    setSelectedRecette(item);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) {
      await deleteRecette.mutateAsync(id);
    }
  };

  const handleExportPDF = async (settings?: PDFExportSettings) => {
    setIsExporting(true);
    try {
      const allData = await fetchAllForExport();
      const config = getRecettesExportConfig(allData);
      await exportToPDF({ ...config, pdfSettings: settings });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async (settings?: PDFExportSettings) => {
    setIsExporting(true);
    try {
      const allData = await fetchAllForExport();
      const config = getRecettesExportConfig(allData);
      exportToExcel({ ...config, pdfSettings: settings });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = (item: Recette) => {
    printBonRecette({
      numero_bon: item.numero_bon,
      date: item.date_transaction,
      heure: item.heure,
      motif: item.motif,
      provenance: item.provenance,
      montant: item.montant,
      montant_lettre: item.montant_lettre,
      observation: item.observation,
    });
    toast({
      title: "Impression lancée",
      description: `Bon de recette REC-${String(item.numero_bon).padStart(4, '0')} ouvert dans un nouvel onglet`,
    });
  };

  const handleDownload = (item: Recette) => {
    downloadBonRecette({
      numero_bon: item.numero_bon,
      date: item.date_transaction,
      heure: item.heure,
      motif: item.motif,
      provenance: item.provenance,
      montant: item.montant,
      montant_lettre: item.montant_lettre,
      observation: item.observation,
    });
    toast({
      title: "Téléchargement",
      description: `Bon de recette REC-${String(item.numero_bon).padStart(4, '0')} téléchargé`,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
  };

  const hasActiveFilters = searchQuery || dateFilter !== "all";

  const columns = [
    { 
      key: "numero_bon", 
      header: "N° Bon",
      render: (item: Recette) => (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono text-sm font-semibold bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-1.5 rounded-lg border border-primary/20">
            REC-{String(item.numero_bon).padStart(4, "0")}
          </span>
        </div>
      )
    },
    { 
      key: "date", 
      header: "Date & Heure",
      render: (item: Recette) => (
        <div className="flex flex-col">
          <span className="font-medium">{new Date(item.date_transaction).toLocaleDateString("fr-FR")}</span>
          <span className="text-xs text-muted-foreground">{item.heure.slice(0, 5)}</span>
        </div>
      )
    },
    { 
      key: "motif", 
      header: "Motif",
      render: (item: Recette) => (
        <div className="max-w-[200px]">
          <p className="font-medium truncate">{item.motif}</p>
        </div>
      )
    },
    { 
      key: "provenance", 
      header: "Provenance",
      render: (item: Recette) => (
        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-medium">
          {item.provenance}
        </Badge>
      )
    },
    {
      key: "montant",
      header: "Montant (FC)",
      className: "text-right",
      render: (item: Recette) => (
        <div className="flex items-center justify-end gap-2">
          <motion.div 
            className="flex items-center gap-1.5 bg-success/10 text-success px-3 py-1.5 rounded-lg font-bold"
            whileHover={{ scale: 1.02 }}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+{formatMontant(item.montant)}</span>
          </motion.div>
        </div>
      ),
    },
    ...(canEdit || isAdmin ? [{
      key: "actions",
      header: "Actions",
      render: (item: Recette) => (
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

  const filteredTotal = filteredRecettes.reduce((acc, r) => acc + Number(r.montant), 0);

  return (
    <>
    <div className="page-container space-y-6">
      {/* Header avec actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Gestion des Recettes"
          description="Enregistrez et gérez les entrées de caisse"
          actions={
            <div className="flex flex-wrap gap-3">
              <ExportButtons
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                disabled={totalCount === 0 || isExporting}
                previewTitle="Liste des Recettes"
                previewSubtitle={dateFilter !== "all" ? `Filtre: ${dateFilter}` : undefined}
                previewColumns={[
                  { header: 'N° Bon', key: 'numero_bon', width: 10 },
                  { header: 'Date', key: 'date', width: 12 },
                  { header: 'Heure', key: 'heure', width: 10 },
                  { header: 'Provenance', key: 'provenance', width: 20 },
                  { header: 'Motif', key: 'motif', width: 25 },
                  { header: 'Montant', key: 'montant', width: 15 },
                ]}
                previewData={filteredRecettes}
              />
              {canEdit && (
                <Button 
                  className="gap-2 btn-primary-gradient shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle recette
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
              placeholder="Rechercher par motif, provenance, référence..."
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
        {/* Total recettes */}
        <div className="bg-gradient-to-br from-success/10 via-success/5 to-transparent rounded-2xl border border-success/20 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total recettes (page)</p>
              <p className="text-2xl lg:text-3xl font-bold text-success mt-1">
                {formatMontant(filteredTotal, { showCurrency: true })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
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

        {/* Filtres actifs */}
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
              data={filteredRecettes} 
              emptyMessage="Aucune recette enregistrée"
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
    </div>

      {/* Dialogues */}
      <CreateRecetteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateRecette}
        isLoading={createRecette.isPending}
      />

      <EditRecetteDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        recette={selectedRecette}
        onSave={handleUpdateRecette}
        isLoading={updateRecette.isPending}
      />

      <ViewTransactionDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        transaction={selectedRecette ? {
          ...selectedRecette,
          type: 'recette',
        } : null}
        onPrint={() => selectedRecette && handlePrint(selectedRecette)}
        onDownload={() => selectedRecette && handleDownload(selectedRecette)}
      />
    </>
  );
}
