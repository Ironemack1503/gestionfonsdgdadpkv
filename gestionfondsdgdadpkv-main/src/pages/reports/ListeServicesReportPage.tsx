import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { DataTable } from "@/components/shared/DataTable";
import { useServices } from "@/hooks/useServices";
import { Loader2, Building2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToPDF, exportToExcel, PDFExportSettings } from "@/lib/exportUtils";
import type { Service } from "@/types/database";

export default function ListeServicesReportPage() {
  const { services, isLoading } = useServices();
  const [isExporting, setIsExporting] = useState(false);

  const activeServices = services?.filter(s => s.is_active) || [];
  const inactiveServices = services?.filter(s => !s.is_active) || [];

  const columns = [
    { 
      key: "code", 
      header: "Code",
      render: (item: Service) => (
        <span className="font-mono font-semibold text-primary">{item.code}</span>
      )
    },
    {
      key: "libelle",
      header: "Libellé du Service",
      render: (item: Service) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{item.libelle}</span>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Statut",
      render: (item: Service) => (
        <div className="flex items-center gap-2">
          {item.is_active ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400 font-medium text-sm">Actif</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 dark:text-red-400 font-medium text-sm">Inactif</span>
            </>
          )}
        </div>
      ),
    },
    { 
      key: "created_at", 
      header: "Date création",
      render: (item: Service) => new Date(item.created_at).toLocaleDateString("fr-FR")
    },
  ];

  const handleExportPDF = async (settings?: PDFExportSettings) => {
    if (!services) return;
    setIsExporting(true);
    try {
      const exportData = services.map((s, index) => ({
        numero: index + 1,
        code: s.code,
        libelle: s.libelle,
        statut: s.is_active ? "Actif" : "Inactif",
        date_creation: new Date(s.created_at).toLocaleDateString("fr-FR"),
      }));

      await exportToPDF({
        title: "LISTE DES SERVICES",
        filename: `liste_services_${new Date().toISOString().split('T')[0]}`,
        subtitle: `Total: ${services.length} services dont ${activeServices.length} actifs`,
        columns: [
          { header: 'N°', key: 'numero', width: 10 },
          { header: 'Code', key: 'code', width: 20 },
          { header: 'Libellé', key: 'libelle', width: 50 },
          { header: 'Statut', key: 'statut', width: 15 },
          { header: 'Date création', key: 'date_creation', width: 20 },
        ],
        data: exportData,
        pdfSettings: settings,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async (settings?: PDFExportSettings) => {
    if (!services) return;
    setIsExporting(true);
    try {
      const exportData = services.map((s, index) => ({
        numero: index + 1,
        code: s.code,
        libelle: s.libelle,
        statut: s.is_active ? "Actif" : "Inactif",
        date_creation: new Date(s.created_at).toLocaleDateString("fr-FR"),
      }));

      exportToExcel({
        title: "LISTE DES SERVICES",
        filename: `liste_services_${new Date().toISOString().split('T')[0]}`,
        subtitle: `Total: ${services.length} services dont ${activeServices.length} actifs`,
        columns: [
          { header: 'N°', key: 'numero', width: 10 },
          { header: 'Code', key: 'code', width: 20 },
          { header: 'Libellé', key: 'libelle', width: 50 },
          { header: 'Statut', key: 'statut', width: 15 },
          { header: 'Date création', key: 'date_creation', width: 20 },
        ],
        data: exportData,
        pdfSettings: settings,
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liste des Services"
        description="Rapport des services / provenances enregistrés"
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={!services?.length || isExporting}
            previewTitle="LISTE DES SERVICES"
            previewSubtitle={`Total: ${services?.length || 0} services`}
            previewColumns={[
              { header: 'N°', key: 'numero', width: 10 },
              { header: 'Code', key: 'code', width: 20 },
              { header: 'Libellé', key: 'libelle', width: 50 },
              { header: 'Statut', key: 'statut', width: 15 },
            ]}
            previewData={(services || []).map((s, i) => ({
              numero: i + 1,
              code: s.code,
              libelle: s.libelle,
              statut: s.is_active ? "Actif" : "Inactif",
            }))}
          />
        }
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Actifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeServices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Inactifs</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveServices.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau */}
      <DataTable columns={columns} data={services || []} emptyMessage="Aucun service trouvé" />
    </div>
  );
}
