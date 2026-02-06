import { useState, useMemo } from "react";
import { Loader2, FileText, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { useRecettes } from "@/hooks/useRecettes";
import { useDepenses } from "@/hooks/useDepenses";
import { useRubriques } from "@/hooks/useRubriques";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { TableColumnConfig, ConfigurableColumn } from "@/components/shared/TableColumnConfig";
import { exportToPDF, exportToExcel, PDFExportSettings, ExportColumn } from "@/lib/exportUtils";
import { formatMontant } from "@/lib/utils";

const moisNoms = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

interface IMPSummary {
  imp: string;
  libelles: string[];
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
}

// Default columns configuration
const defaultColumns: ConfigurableColumn[] = [
  { key: "imp", header: "IMP", width: 80, visible: true, type: "text", order: 0 },
  { key: "libelles", header: "Libellés", width: 200, visible: true, type: "text", order: 1 },
  { key: "totalRecettes", header: "Total Recettes", width: 100, visible: true, type: "currency", order: 2 },
  { key: "totalDepenses", header: "Total Dépenses", width: 100, visible: true, type: "currency", order: 3 },
  { key: "solde", header: "Solde", width: 100, visible: true, type: "currency", order: 4 },
];

export default function SommairesIMPPage() {
  const now = new Date();
  const [selectedMois, setSelectedMois] = useState(now.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(now.getFullYear());
  const [columns, setColumns] = useState<ConfigurableColumn[]>(defaultColumns);

  const { recettes, isLoading: loadingRecettes } = useRecettes();
  const { depenses, isLoading: loadingDepenses } = useDepenses();
  const { rubriques, isLoading: loadingRubriques } = useRubriques();

  const isLoading = loadingRecettes || loadingDepenses || loadingRubriques;

  // Build IMP summary data
  const summaryData = useMemo(() => {
    if (!rubriques || !recettes || !depenses) return [];

    // Create a map of rubrique_id to IMP and libelle
    const rubriqueMap = new Map<string, { imp: string | null; libelle: string }>();
    rubriques.forEach(r => {
      rubriqueMap.set(r.id, { imp: r.imp, libelle: r.libelle });
    });

    // Filter operations by month/year
    const startDate = new Date(selectedAnnee, selectedMois - 1, 1);
    const endDate = new Date(selectedAnnee, selectedMois, 0);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Group depenses by IMP
    const impTotals = new Map<string, { recettes: number; depenses: number; libelles: Set<string> }>();

    // Process depenses
    (depenses || [])
      .filter(d => d.date_transaction >= startStr && d.date_transaction <= endStr)
      .forEach(d => {
        const rubInfo = rubriqueMap.get(d.rubrique_id);
        const imp = rubInfo?.imp || "NON CLASSÉ";
        const libelle = rubInfo?.libelle || d.motif;
        
        if (!impTotals.has(imp)) {
          impTotals.set(imp, { recettes: 0, depenses: 0, libelles: new Set() });
        }
        const entry = impTotals.get(imp)!;
        entry.depenses += Number(d.montant);
        entry.libelles.add(libelle);
      });

    // Process recettes - they don't have rubrique_id, so we'll group them separately
    const recettesFiltered = (recettes || []).filter(r => r.date_transaction >= startStr && r.date_transaction <= endStr);
    const totalRecettes = recettesFiltered.reduce((sum, r) => sum + Number(r.montant), 0);
    
    // Add recettes as a separate "RECETTES" IMP entry
    if (totalRecettes > 0) {
      const recetteLibelles = new Set(recettesFiltered.map(r => r.motif));
      impTotals.set("RECETTES", { 
        recettes: totalRecettes, 
        depenses: 0, 
        libelles: recetteLibelles 
      });
    }

    // Convert to array and sort
    const result: IMPSummary[] = [];
    impTotals.forEach((value, imp) => {
      result.push({
        imp,
        libelles: Array.from(value.libelles).slice(0, 3),
        totalRecettes: value.recettes,
        totalDepenses: value.depenses,
        solde: value.recettes - value.depenses,
      });
    });

    return result.sort((a, b) => a.imp.localeCompare(b.imp));
  }, [rubriques, recettes, depenses, selectedMois, selectedAnnee]);

  // Calculate totals
  const totals = useMemo(() => {
    return summaryData.reduce(
      (acc, row) => ({
        recettes: acc.recettes + row.totalRecettes,
        depenses: acc.depenses + row.totalDepenses,
        solde: acc.solde + row.solde,
      }),
      { recettes: 0, depenses: 0, solde: 0 }
    );
  }, [summaryData]);

  // Get visible columns sorted by order
  const visibleColumns = useMemo(() => {
    return columns
      .filter(c => c.visible)
      .sort((a, b) => a.order - b.order);
  }, [columns]);

  const getMoisAnnee = () => `${moisNoms[selectedMois - 1]} ${selectedAnnee}`;

  const handlePrint = () => {
    window.print();
  };

  // Prepare export data with raw numbers (formatting done by exportUtils)
  const exportData = useMemo(() => {
    return summaryData.map(row => ({
      imp: row.imp,
      libelles: row.libelles.join(", "),
      totalRecettes: row.totalRecettes,
      totalDepenses: row.totalDepenses,
      solde: row.solde,
    }));
  }, [summaryData]);

  // Get export columns based on visible columns
  const exportColumns: ExportColumn[] = useMemo(() => {
    return visibleColumns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width,
      type: col.type,
    }));
  }, [visibleColumns]);

  const handleExportPDF = (settings?: PDFExportSettings) => {
    exportToPDF({
      data: exportData,
      columns: exportColumns,
      title: `Sommaire par IMP - ${getMoisAnnee()}`,
      filename: `sommaire-imp-${selectedMois}-${selectedAnnee}`,
      pdfSettings: settings,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      data: exportData,
      columns: exportColumns,
      title: `Sommaire par IMP - ${getMoisAnnee()}`,
      filename: `sommaire-imp-${selectedMois}-${selectedAnnee}`,
    });
  };

  // Format display value based on column type
  const getDisplayValue = (row: IMPSummary, key: string): React.ReactNode => {
    switch (key) {
      case "imp":
        return <span className="font-mono font-medium text-primary">{row.imp}</span>;
      case "libelles":
        return (
          <div className="text-sm text-muted-foreground truncate max-w-xs">
            {row.libelles.join(", ")}
            {row.libelles.length === 3 && "..."}
          </div>
        );
      case "totalRecettes":
        return (
          <span className="font-medium text-success">
            {row.totalRecettes > 0 ? formatMontant(row.totalRecettes, { showCurrency: true }) : "-"}
          </span>
        );
      case "totalDepenses":
        return (
          <span className="font-medium text-destructive">
            {row.totalDepenses > 0 ? formatMontant(row.totalDepenses, { showCurrency: true }) : "-"}
          </span>
        );
      case "solde":
        return (
          <span className={`font-bold ${row.solde >= 0 ? "text-success" : "text-destructive"}`}>
            {formatMontant(row.solde, { showCurrency: true })}
          </span>
        );
      default:
        return null;
    }
  };

  // Get footer value for a column
  const getFooterValue = (key: string): React.ReactNode => {
    switch (key) {
      case "imp":
      case "libelles":
        return key === "imp" ? "TOTAUX" : "";
      case "totalRecettes":
        return <span className="text-success">{formatMontant(totals.recettes, { showCurrency: true })}</span>;
      case "totalDepenses":
        return <span className="text-destructive">{formatMontant(totals.depenses, { showCurrency: true })}</span>;
      case "solde":
        return (
          <span className={totals.solde >= 0 ? "text-success" : "text-destructive"}>
            {formatMontant(totals.solde, { showCurrency: true })}
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sommaires par IMP"
        description="Synthèse budgétaire groupée par code IMP"
        actions={
          <div className="flex items-center gap-2">
            <TableColumnConfig 
              columns={columns}
              onColumnsChange={setColumns}
            />
            <ExportButtons
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              previewTitle={`Sommaire par IMP - ${getMoisAnnee()}`}
              previewColumns={exportColumns}
              previewData={exportData}
            />
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mois:</span>
              <Select
                value={selectedMois.toString()}
                onValueChange={(v) => setSelectedMois(parseInt(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moisNoms.map((mois, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {mois}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Année:</span>
              <Select
                value={selectedAnnee.toString()}
                onValueChange={(v) => setSelectedAnnee(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((annee) => (
                    <SelectItem key={annee} value={annee.toString()}>
                      {annee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recettes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {formatMontant(totals.recettes, { showCurrency: true })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatMontant(totals.depenses, { showCurrency: true })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totals.solde >= 0 ? "text-success" : "text-destructive"}`}>
              {formatMontant(totals.solde, { showCurrency: true })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Codes IMP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{summaryData.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Synthèse par Code IMP - {getMoisAnnee()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {visibleColumns.map((col) => (
                    <TableHead 
                      key={col.key} 
                      className={`font-bold ${
                        col.type === 'currency' || col.type === 'number' ? 'text-right' : ''
                      }`}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="text-center text-muted-foreground py-8">
                      Aucune opération trouvée pour cette période
                    </TableCell>
                  </TableRow>
                ) : (
                  summaryData.map((row, index) => (
                    <TableRow key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      {visibleColumns.map((col) => (
                        <TableCell 
                          key={col.key}
                          className={col.type === 'currency' || col.type === 'number' ? 'text-right' : ''}
                        >
                          {getDisplayValue(row, col.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
              {summaryData.length > 0 && (
                <TableFooter>
                  <TableRow className="bg-muted font-bold">
                    {visibleColumns.map((col) => (
                      <TableCell 
                        key={col.key}
                        className={col.type === 'currency' || col.type === 'number' ? 'text-right' : ''}
                      >
                        {getFooterValue(col.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
