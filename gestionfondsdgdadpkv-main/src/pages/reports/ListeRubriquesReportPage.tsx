/**
 * Liste des Rubriques Report Page
 * Displays and exports the list of budget categories (rubriques)
 * Based on legacy Crystal Report: Liste_des_Rubriques.rpt
 */

import { useState, useMemo } from 'react';
import { Loader2, FileText, FileSpreadsheet, Printer, Search, Filter, Check, X } from 'lucide-react';
import { formatMontant } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { exportToPDF, exportToExcel, ExportColumn } from '@/lib/exportUtils';
import { useRubriques } from '@/hooks/useRubriques';
import { useDepenses } from '@/hooks/useDepenses';

export default function ListeRubriquesReportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [selectedAnnee, setSelectedAnnee] = useState(new Date().getFullYear());
  
  const { rubriques, isLoading: loadingRubriques } = useRubriques();
  const { depenses, isLoading: loadingDepenses } = useDepenses();

  // Calculate stats per rubrique
  const rubriquesWithStats = useMemo(() => {
    if (!rubriques || !depenses) return [];

    const yearStart = `${selectedAnnee}-01-01`;
    const yearEnd = `${selectedAnnee}-12-31`;
    const yearDepenses = depenses.filter(
      d => d.date_transaction >= yearStart && d.date_transaction <= yearEnd
    );

    return rubriques
      .filter(r => !showInactiveOnly || !r.is_active)
      .filter(r => 
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.libelle.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(rubrique => {
        const rubriqueDepenses = yearDepenses.filter(d => d.rubrique_id === rubrique.id);
        const totalDepenses = rubriqueDepenses.reduce((sum, d) => sum + Number(d.montant), 0);
        const nombreOperations = rubriqueDepenses.length;

        return {
          ...rubrique,
          totalDepenses,
          nombreOperations,
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [rubriques, depenses, searchTerm, showInactiveOnly, selectedAnnee]);

  // Totals
  const totalGeneral = rubriquesWithStats.reduce((sum, r) => sum + r.totalDepenses, 0);
  const totalOperations = rubriquesWithStats.reduce((sum, r) => sum + r.nombreOperations, 0);
  const activeCount = rubriquesWithStats.filter(r => r.is_active).length;
  const inactiveCount = rubriquesWithStats.filter(r => !r.is_active).length;

  // Export handlers
  const handleExportPDF = async () => {
    const columns: ExportColumn[] = [
      { header: 'Code', key: 'code', width: 20 },
      { header: 'Libellé', key: 'libelle', width: 50 },
      { header: 'Statut', key: 'statut', width: 15 },
      { header: 'Nb. Opérations', key: 'nombreOperations', width: 20 },
      { header: 'Total Dépenses', key: 'totalDepenses', width: 25, type: 'currency' },
    ];

    const data = rubriquesWithStats.map(r => ({
      code: r.code,
      libelle: r.libelle,
      statut: r.is_active ? 'Actif' : 'Inactif',
      nombreOperations: r.nombreOperations,
      totalDepenses: r.totalDepenses,
    }));

    await exportToPDF({
      title: `Liste des Rubriques - ${selectedAnnee}`,
      filename: `liste_rubriques_${selectedAnnee}`,
      subtitle: `Total: ${rubriquesWithStats.length} rubriques | ${totalOperations} opérations | ${formatMontant(totalGeneral, { showCurrency: true })}`,
      columns,
      data,
    });
  };

  const handleExportExcel = () => {
    const columns: ExportColumn[] = [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Libellé', key: 'libelle', width: 40 },
      { header: 'Statut', key: 'statut', width: 12 },
      { header: 'Nb. Opérations', key: 'nombreOperations', width: 15, type: 'number' },
      { header: 'Total Dépenses (FC)', key: 'totalDepenses', width: 20, type: 'currency' },
      { header: 'Date Création', key: 'created_at', width: 15, type: 'date' },
    ];

    const data = rubriquesWithStats.map(r => ({
      code: r.code,
      libelle: r.libelle,
      statut: r.is_active ? 'Actif' : 'Inactif',
      nombreOperations: r.nombreOperations,
      totalDepenses: r.totalDepenses,
      created_at: r.created_at,
    }));

    exportToExcel({
      title: `Liste des Rubriques - ${selectedAnnee}`,
      filename: `liste_rubriques_${selectedAnnee}`,
      subtitle: `Total: ${rubriquesWithStats.length} rubriques | ${formatMontant(totalGeneral, { showCurrency: true })}`,
      columns,
      data,
    });
  };

  const loading = loadingRubriques || loadingDepenses;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liste des Rubriques"
        description="Catégories budgétaires et statistiques d'utilisation"
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
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Rechercher
              </Label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Code ou libellé..."
                className="max-w-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Année de référence</Label>
              <Input
                type="number"
                value={selectedAnnee}
                onChange={(e) => setSelectedAnnee(Number(e.target.value))}
                className="w-28"
                min={2020}
                max={2030}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="showInactive"
                checked={showInactiveOnly}
                onCheckedChange={(checked) => setShowInactiveOnly(checked as boolean)}
              />
              <Label htmlFor="showInactive" className="cursor-pointer flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Inactifs uniquement
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Rubriques</p>
            <p className="text-2xl font-bold">{rubriquesWithStats.length}</p>
            <p className="text-xs text-muted-foreground">
              {activeCount} actives, {inactiveCount} inactives
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Rubriques Actives</p>
            <p className="text-2xl font-bold text-success">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Opérations {selectedAnnee}</p>
            <p className="text-2xl font-bold text-info">{totalOperations}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Dépenses {selectedAnnee}</p>
            <p className="text-2xl font-bold text-destructive">
              {formatMontant(totalGeneral, { showCurrency: true })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rubriques Budgétaires</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : rubriquesWithStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune rubrique trouvée
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-center w-24">Statut</TableHead>
                    <TableHead className="text-right w-32">Nb. Opérations</TableHead>
                    <TableHead className="text-right w-40">Total Dépenses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rubriquesWithStats.map((rubrique) => (
                    <TableRow key={rubrique.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">{rubrique.code}</TableCell>
                      <TableCell>{rubrique.libelle}</TableCell>
                      <TableCell className="text-center">
                        {rubrique.is_active ? (
                          <Badge variant="outline" className="gap-1 text-success border-success">
                            <Check className="w-3 h-3" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground border-muted-foreground">
                            <X className="w-3 h-3" />
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{rubrique.nombreOperations}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {formatMontant(rubrique.totalDepenses, { showCurrency: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={3}>TOTAL</TableCell>
                    <TableCell className="text-right">{totalOperations}</TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatMontant(totalGeneral, { showCurrency: true })}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
