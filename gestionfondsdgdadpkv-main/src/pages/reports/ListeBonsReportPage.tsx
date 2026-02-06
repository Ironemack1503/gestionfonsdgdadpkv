import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { DataTable } from "@/components/shared/DataTable";
import { useRecettes } from "@/hooks/useRecettes";
import { useDepenses } from "@/hooks/useDepenses";
import { Loader2, ArrowUpRight, ArrowDownRight, Calendar, Filter, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToPDF, exportToExcel, PDFExportSettings } from "@/lib/exportUtils";
import { formatMontant } from "@/lib/utils";

export default function ListeBonsReportPage() {
  const { recettes, isLoading: loadingRecettes, fetchAllForExport: fetchAllRecettes } = useRecettes();
  const { depenses, isLoading: loadingDepenses, fetchAllForExport: fetchAllDepenses } = useDepenses();
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"recettes" | "depenses">("recettes");
  
  // Filters
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [periodeFilter, setPeriodeFilter] = useState<string>("all");

  // Apply period filter
  const getFilteredData = useMemo(() => {
    const filterByPeriod = (data: any[], dateField: string = 'date_transaction') => {
      let filtered = [...data];
      
      if (dateDebut) {
        filtered = filtered.filter(item => item[dateField] >= dateDebut);
      }
      if (dateFin) {
        filtered = filtered.filter(item => item[dateField] <= dateFin);
      }
      
      if (periodeFilter !== "all") {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        
        if (periodeFilter === "month") {
          filtered = filtered.filter(item => new Date(item[dateField]) >= startOfMonth);
        } else if (periodeFilter === "year") {
          filtered = filtered.filter(item => new Date(item[dateField]) >= startOfYear);
        }
      }
      
      return filtered;
    };

    return {
      recettes: filterByPeriod(recettes || []),
      depenses: filterByPeriod(depenses || []),
    };
  }, [recettes, depenses, dateDebut, dateFin, periodeFilter]);

  const recettesColumns = [
    { 
      key: "numero_bon", 
      header: "N° Bon",
      render: (item: any) => (
        <span className="font-mono text-sm font-semibold bg-primary/10 px-2 py-1 rounded">
          REC-{String(item.numero_bon).padStart(4, "0")}
        </span>
      )
    },
    { 
      key: "date", 
      header: "Date",
      render: (item: any) => new Date(item.date_transaction).toLocaleDateString("fr-FR")
    },
    { key: "heure", header: "Heure", render: (item: any) => item.heure?.slice(0, 5) },
    { key: "provenance", header: "Provenance" },
    { key: "motif", header: "Motif", render: (item: any) => (
      <span className="max-w-[200px] truncate block">{item.motif}</span>
    )},
    {
      key: "montant",
      header: "Montant (FC)",
      render: (item: any) => (
        <div className="flex items-center gap-1 text-green-600 font-bold">
          <ArrowUpRight className="w-4 h-4" />
          +{formatMontant(item.montant)}
        </div>
      ),
    },
  ];

  const depensesColumns = [
    { 
      key: "numero_bon", 
      header: "N° Bon",
      render: (item: any) => (
        <span className="font-mono text-sm font-semibold bg-destructive/10 px-2 py-1 rounded">
          DEP-{String(item.numero_bon).padStart(4, "0")}
        </span>
      )
    },
    { 
      key: "date", 
      header: "Date",
      render: (item: any) => new Date(item.date_transaction).toLocaleDateString("fr-FR")
    },
    { key: "heure", header: "Heure", render: (item: any) => item.heure?.slice(0, 5) },
    { key: "beneficiaire", header: "Bénéficiaire" },
    { 
      key: "rubrique", 
      header: "Rubrique", 
      render: (item: any) => (
        <Badge variant="outline">{item.rubrique?.libelle || "N/A"}</Badge>
      )
    },
    { key: "motif", header: "Motif", render: (item: any) => (
      <span className="max-w-[200px] truncate block">{item.motif}</span>
    )},
    {
      key: "montant",
      header: "Montant (FC)",
      render: (item: any) => (
        <div className="flex items-center gap-1 text-destructive font-bold">
          <ArrowDownRight className="w-4 h-4" />
          -{formatMontant(item.montant)}
        </div>
      ),
    },
  ];

  const handleExportRecettesPDF = async (settings?: PDFExportSettings) => {
    setIsExporting(true);
    try {
      const allData = await fetchAllRecettes();
      const exportData = allData.map((r, index) => ({
        numero: index + 1,
        numero_bon: `REC-${String(r.numero_bon).padStart(4, "0")}`,
        date: new Date(r.date_transaction).toLocaleDateString("fr-FR"),
        heure: r.heure?.slice(0, 5),
        provenance: r.provenance,
        motif: r.motif,
        montant: r.montant,
      }));

      const total = allData.reduce((sum, r) => sum + Number(r.montant), 0);

      await exportToPDF({
        title: "LISTE DES BONS DE RECETTES (ENTRÉES DE CAISSE)",
        filename: `liste_bons_recettes_${new Date().toISOString().split('T')[0]}`,
        subtitle: `Total: ${allData.length} bons - Montant total: ${formatMontant(total)} FC`,
        columns: [
          { header: 'N°', key: 'numero', width: 8 },
          { header: 'N° Bon', key: 'numero_bon', width: 18 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Heure', key: 'heure', width: 10 },
          { header: 'Provenance', key: 'provenance', width: 25 },
          { header: 'Motif', key: 'motif', width: 30 },
          { header: 'Montant (FC)', key: 'montant', width: 20, type: 'currency' },
        ],
        data: exportData,
        pdfSettings: { ...settings, orientation: 'landscape' },
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRecettesExcel = async (settings?: PDFExportSettings) => {
    setIsExporting(true);
    try {
      const allData = await fetchAllRecettes();
      const exportData = allData.map((r, index) => ({
        numero: index + 1,
        numero_bon: `REC-${String(r.numero_bon).padStart(4, "0")}`,
        date: new Date(r.date_transaction).toLocaleDateString("fr-FR"),
        heure: r.heure?.slice(0, 5),
        provenance: r.provenance,
        motif: r.motif,
        montant: r.montant,
      }));

      const total = allData.reduce((sum, r) => sum + Number(r.montant), 0);

      exportToExcel({
        title: "LISTE DES BONS DE RECETTES (ENTRÉES DE CAISSE)",
        filename: `liste_bons_recettes_${new Date().toISOString().split('T')[0]}`,
        subtitle: `Total: ${allData.length} bons - Montant total: ${formatMontant(total)} FC`,
        columns: [
          { header: 'N°', key: 'numero', width: 8 },
          { header: 'N° Bon', key: 'numero_bon', width: 18 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Heure', key: 'heure', width: 10 },
          { header: 'Provenance', key: 'provenance', width: 25 },
          { header: 'Motif', key: 'motif', width: 30 },
          { header: 'Montant (FC)', key: 'montant', width: 20, type: 'currency' },
        ],
        data: exportData,
        pdfSettings: settings,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDepensesPDF = async (settings?: PDFExportSettings) => {
    setIsExporting(true);
    try {
      const allData = await fetchAllDepenses();
      const exportData = allData.map((d, index) => ({
        numero: index + 1,
        numero_bon: `DEP-${String(d.numero_bon).padStart(4, "0")}`,
        date: new Date(d.date_transaction).toLocaleDateString("fr-FR"),
        heure: d.heure?.slice(0, 5),
        beneficiaire: d.beneficiaire,
        rubrique: d.rubrique?.libelle || "N/A",
        motif: d.motif,
        montant: d.montant,
      }));

      const total = allData.reduce((sum, d) => sum + Number(d.montant), 0);

      await exportToPDF({
        title: "LISTE DES BONS DE SORTIES DE CAISSE",
        filename: `liste_bons_depenses_${new Date().toISOString().split('T')[0]}`,
        subtitle: `Total: ${allData.length} bons - Montant total: ${formatMontant(total)} FC`,
        columns: [
          { header: 'N°', key: 'numero', width: 8 },
          { header: 'N° Bon', key: 'numero_bon', width: 18 },
          { header: 'Date', key: 'date', width: 12 },
          { header: 'Bénéficiaire', key: 'beneficiaire', width: 22 },
          { header: 'Rubrique', key: 'rubrique', width: 20 },
          { header: 'Motif', key: 'motif', width: 25 },
          { header: 'Montant (FC)', key: 'montant', width: 18, type: 'currency' },
        ],
        data: exportData,
        pdfSettings: { ...settings, orientation: 'landscape' },
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDepensesExcel = async (settings?: PDFExportSettings) => {
    setIsExporting(true);
    try {
      const allData = await fetchAllDepenses();
      const exportData = allData.map((d, index) => ({
        numero: index + 1,
        numero_bon: `DEP-${String(d.numero_bon).padStart(4, "0")}`,
        date: new Date(d.date_transaction).toLocaleDateString("fr-FR"),
        heure: d.heure?.slice(0, 5),
        beneficiaire: d.beneficiaire,
        rubrique: d.rubrique?.libelle || "N/A",
        motif: d.motif,
        montant: d.montant,
      }));

      const total = allData.reduce((sum, d) => sum + Number(d.montant), 0);

      exportToExcel({
        title: "LISTE DES BONS DE SORTIES DE CAISSE",
        filename: `liste_bons_depenses_${new Date().toISOString().split('T')[0]}`,
        subtitle: `Total: ${allData.length} bons - Montant total: ${formatMontant(total)} FC`,
        columns: [
          { header: 'N°', key: 'numero', width: 8 },
          { header: 'N° Bon', key: 'numero_bon', width: 18 },
          { header: 'Date', key: 'date', width: 12 },
          { header: 'Bénéficiaire', key: 'beneficiaire', width: 22 },
          { header: 'Rubrique', key: 'rubrique', width: 20 },
          { header: 'Motif', key: 'motif', width: 25 },
          { header: 'Montant (FC)', key: 'montant', width: 18, type: 'currency' },
        ],
        data: exportData,
        pdfSettings: settings,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setDateDebut("");
    setDateFin("");
    setPeriodeFilter("all");
  };

  const totalRecettes = getFilteredData.recettes.reduce((sum, r) => sum + Number(r.montant), 0);
  const totalDepenses = getFilteredData.depenses.reduce((sum, d) => sum + Number(d.montant), 0);

  if (loadingRecettes || loadingDepenses) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liste des Bons de Caisse"
        description="Rapport des bons d'entrée et de sortie de caisse"
      />

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres de période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Période prédéfinie</Label>
              <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes périodes</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bons de Recettes</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getFilteredData.recettes.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatMontant(totalRecettes)} FC
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bons de Dépenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getFilteredData.depenses.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatMontant(totalDepenses)} FC
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bons</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getFilteredData.recettes.length + getFilteredData.depenses.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Net</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalRecettes - totalDepenses >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatMontant(totalRecettes - totalDepenses)} FC
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets Recettes / Dépenses */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="recettes" className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Bons de Recettes ({getFilteredData.recettes.length})
            </TabsTrigger>
            <TabsTrigger value="depenses" className="gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Bons de Dépenses ({getFilteredData.depenses.length})
            </TabsTrigger>
          </TabsList>

          {activeTab === "recettes" ? (
            <ExportButtons
              onExportPDF={handleExportRecettesPDF}
              onExportExcel={handleExportRecettesExcel}
              disabled={!getFilteredData.recettes.length || isExporting}
              previewTitle="LISTE DES BONS DE RECETTES"
              previewSubtitle={`Total: ${getFilteredData.recettes.length} bons`}
              previewColumns={[
                { header: 'N° Bon', key: 'numero_bon', width: 18 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Provenance', key: 'provenance', width: 25 },
                { header: 'Montant', key: 'montant', width: 20 },
              ]}
              previewData={getFilteredData.recettes.slice(0, 10).map(r => ({
                numero_bon: `REC-${String(r.numero_bon).padStart(4, "0")}`,
                date: new Date(r.date_transaction).toLocaleDateString("fr-FR"),
                provenance: r.provenance,
                montant: formatMontant(r.montant),
              }))}
            />
          ) : (
            <ExportButtons
              onExportPDF={handleExportDepensesPDF}
              onExportExcel={handleExportDepensesExcel}
              disabled={!getFilteredData.depenses.length || isExporting}
              previewTitle="LISTE DES BONS DE DÉPENSES"
              previewSubtitle={`Total: ${getFilteredData.depenses.length} bons`}
              previewColumns={[
                { header: 'N° Bon', key: 'numero_bon', width: 18 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Bénéficiaire', key: 'beneficiaire', width: 25 },
                { header: 'Montant', key: 'montant', width: 20 },
              ]}
              previewData={getFilteredData.depenses.slice(0, 10).map(d => ({
                numero_bon: `DEP-${String(d.numero_bon).padStart(4, "0")}`,
                date: new Date(d.date_transaction).toLocaleDateString("fr-FR"),
                beneficiaire: d.beneficiaire,
                montant: formatMontant(d.montant),
              }))}
            />
          )}
        </div>

        <TabsContent value="recettes">
          <DataTable 
            columns={recettesColumns} 
            data={getFilteredData.recettes} 
            emptyMessage="Aucun bon de recette trouvé" 
          />
        </TabsContent>

        <TabsContent value="depenses">
          <DataTable 
            columns={depensesColumns} 
            data={getFilteredData.depenses} 
            emptyMessage="Aucun bon de dépense trouvé" 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
