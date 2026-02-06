/**
 * Contentieux Report Page
 * Rapport des transactions en litige ou anomalies
 * Basé sur les Crystal Reports: RAPCONT, RAPCONT2, RAPCONTDAT
 */

import { useState, useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, CheckCircle, Clock, XCircle, Filter, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ExportButtons } from '@/components/shared/ExportButtons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRecettes } from '@/hooks/useRecettes';
import { useDepenses } from '@/hooks/useDepenses';
import { formatMontant } from '@/lib/utils';
import { exportToPDF, exportToExcel, PDFExportSettings } from '@/lib/exportUtils';

type ContentieuxStatus = 'en_attente' | 'en_cours' | 'resolu' | 'annule';
type ContentieuxType = 'anomalie' | 'doublon' | 'ecart' | 'litige';

interface ContentieuxItem {
  id: string;
  date: string;
  dateFormatted: string;
  type: 'recette' | 'depense';
  numero: string;
  libelle: string;
  montant: number;
  status: ContentieuxStatus;
  motifContentieux: ContentieuxType;
  description: string;
  dateDetection: string;
  responsable?: string;
}

export default function ContentieuxReportPage() {
  const [dateDebut, setDateDebut] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [dateFin, setDateFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterStatus, setFilterStatus] = useState<ContentieuxStatus | 'tous'>('tous');
  const [filterType, setFilterType] = useState<ContentieuxType | 'tous'>('tous');

  const { recettes, isLoading: loadingRecettes } = useRecettes();
  const { depenses, isLoading: loadingDepenses } = useDepenses();

  // Generate contentieux data from transactions with anomalies
  // In a real app, this would come from a dedicated contentieux table
  const contentieuxData = useMemo((): ContentieuxItem[] => {
    const items: ContentieuxItem[] = [];

    // Detect potential anomalies in recettes
    recettes
      .filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin)
      .forEach(r => {
        // Check for missing observation (potential incomplete record)
        if (!r.observation && Number(r.montant) > 1000000) {
          items.push({
            id: r.id,
            date: r.date_transaction,
            dateFormatted: format(new Date(r.date_transaction), 'dd/MM/yyyy'),
            type: 'recette',
            numero: `REC-${String(r.numero_bon).padStart(4, '0')}`,
            libelle: r.motif,
            montant: Number(r.montant),
            status: 'en_attente',
            motifContentieux: 'anomalie',
            description: 'Recette importante sans observation',
            dateDetection: format(new Date(), 'yyyy-MM-dd'),
          });
        }
      });

    // Detect potential anomalies in depenses
    depenses
      .filter(d => d.date_transaction >= dateDebut && d.date_transaction <= dateFin)
      .forEach(d => {
        // Check for missing rubrique
        if (!d.rubrique_id) {
          items.push({
            id: d.id,
            date: d.date_transaction,
            dateFormatted: format(new Date(d.date_transaction), 'dd/MM/yyyy'),
            type: 'depense',
            numero: `DEP-${String(d.numero_bon).padStart(4, '0')}`,
            libelle: d.motif,
            montant: Number(d.montant),
            status: 'en_attente',
            motifContentieux: 'anomalie',
            description: 'Dépense sans rubrique budgétaire',
            dateDetection: format(new Date(), 'yyyy-MM-dd'),
          });
        }
      });

    // Check for potential duplicates in recettes
    const recettesByAmount = new Map<string, typeof recettes>();
    recettes
      .filter(r => r.date_transaction >= dateDebut && r.date_transaction <= dateFin)
      .forEach(r => {
        const key = `${r.montant}-${r.provenance}`;
        const existing = recettesByAmount.get(key) || [];
        existing.push(r);
        recettesByAmount.set(key, existing);
      });

    recettesByAmount.forEach((group) => {
      if (group.length > 1) {
        group.slice(1).forEach(r => {
          items.push({
            id: r.id,
            date: r.date_transaction,
            dateFormatted: format(new Date(r.date_transaction), 'dd/MM/yyyy'),
            type: 'recette',
            numero: `REC-${String(r.numero_bon).padStart(4, '0')}`,
            libelle: r.motif,
            montant: Number(r.montant),
            status: 'en_cours',
            motifContentieux: 'doublon',
            description: `Doublon potentiel: même montant et provenance`,
            dateDetection: format(new Date(), 'yyyy-MM-dd'),
          });
        });
      }
    });

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [recettes, depenses, dateDebut, dateFin]);

  // Filter contentieux
  const filteredContentieux = useMemo(() => {
    return contentieuxData.filter(item => {
      if (filterStatus !== 'tous' && item.status !== filterStatus) return false;
      if (filterType !== 'tous' && item.motifContentieux !== filterType) return false;
      return true;
    });
  }, [contentieuxData, filterStatus, filterType]);

  // Summary stats
  const summary = useMemo(() => {
    const total = contentieuxData.length;
    const enAttente = contentieuxData.filter(i => i.status === 'en_attente').length;
    const enCours = contentieuxData.filter(i => i.status === 'en_cours').length;
    const resolus = contentieuxData.filter(i => i.status === 'resolu').length;
    const montantTotal = contentieuxData.reduce((acc, i) => acc + i.montant, 0);

    return { total, enAttente, enCours, resolus, montantTotal };
  }, [contentieuxData]);

  // Status badge helper
  const getStatusBadge = (status: ContentieuxStatus) => {
    switch (status) {
      case 'en_attente':
        return <Badge variant="secondary" className="bg-warning/20 text-warning"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case 'en_cours':
        return <Badge variant="secondary" className="bg-info/20 text-info"><AlertTriangle className="w-3 h-3 mr-1" /> En cours</Badge>;
      case 'resolu':
        return <Badge variant="secondary" className="bg-success/20 text-success"><CheckCircle className="w-3 h-3 mr-1" /> Résolu</Badge>;
      case 'annule':
        return <Badge variant="secondary" className="bg-destructive/20 text-destructive"><XCircle className="w-3 h-3 mr-1" /> Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Type badge helper
  const getTypeBadge = (type: ContentieuxType) => {
    switch (type) {
      case 'anomalie':
        return <Badge variant="outline" className="border-warning text-warning">Anomalie</Badge>;
      case 'doublon':
        return <Badge variant="outline" className="border-info text-info">Doublon</Badge>;
      case 'ecart':
        return <Badge variant="outline" className="border-destructive text-destructive">Écart</Badge>;
      case 'litige':
        return <Badge variant="outline" className="border-primary text-primary">Litige</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Export functions
  const exportColumns = [
    { header: 'Date', key: 'dateFormatted', width: 12 },
    { header: 'N° Bon', key: 'numero', width: 14 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Libellé', key: 'libelle', width: 25 },
    { header: 'Montant (FC)', key: 'montant', width: 18, type: 'currency' as const },
    { header: 'Motif', key: 'motifContentieux', width: 12 },
    { header: 'Statut', key: 'status', width: 12 },
    { header: 'Description', key: 'description', width: 30 },
  ];

  const handleExportPDF = (settings?: PDFExportSettings) => {
    exportToPDF({
      title: 'Rapport des Contentieux',
      filename: `rapport_contentieux_${format(new Date(), 'yyyyMMdd')}`,
      subtitle: `Période: du ${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')} - ${filteredContentieux.length} dossiers`,
      columns: exportColumns,
      data: filteredContentieux,
      pdfSettings: settings,
    });
  };

  const handleExportExcel = (settings?: PDFExportSettings) => {
    exportToExcel({
      title: 'Rapport des Contentieux',
      filename: `rapport_contentieux_${format(new Date(), 'yyyyMMdd')}`,
      subtitle: `Période: du ${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')}`,
      columns: exportColumns,
      data: filteredContentieux,
      pdfSettings: settings,
    });
  };

  const isLoading = loadingRecettes || loadingDepenses;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport des Contentieux"
        description="Suivi des transactions en litige, anomalies et dossiers en attente de résolution"
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={isLoading}
            previewTitle="Rapport des Contentieux"
            previewSubtitle={`Période: ${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')}`}
            previewColumns={exportColumns}
            previewData={filteredContentieux}
          />
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="resolu">Résolu</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les types</SelectItem>
                  <SelectItem value="anomalie">Anomalie</SelectItem>
                  <SelectItem value="doublon">Doublon</SelectItem>
                  <SelectItem value="ecart">Écart</SelectItem>
                  <SelectItem value="litige">Litige</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-warning">{summary.enAttente}</p>
                <p className="text-xs text-muted-foreground">dossiers</p>
              </div>
              <Clock className="w-8 h-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold text-info">{summary.enCours}</p>
                <p className="text-xs text-muted-foreground">dossiers</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-info/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Résolus</p>
                <p className="text-2xl font-bold text-success">{summary.resolus}</p>
                <p className="text-xs text-muted-foreground">dossiers</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold text-primary">{formatMontant(summary.montantTotal)}</p>
                <p className="text-xs text-muted-foreground">{summary.total} dossiers</p>
              </div>
              <FileText className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des contentieux ({filteredContentieux.length})</CardTitle>
          <CardDescription>
            Transactions avec anomalies, doublons potentiels ou en litige
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>N° Bon</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContentieux.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success opacity-50" />
                    Aucun contentieux détecté sur cette période
                  </TableCell>
                </TableRow>
              ) : (
                filteredContentieux.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.dateFormatted}</TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'recette' ? 'default' : 'secondary'}>
                        {item.numero}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.type === 'recette' ? 'Recette' : 'Dépense'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.libelle}>
                      {item.libelle}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(item.montant)}
                    </TableCell>
                    <TableCell>{getTypeBadge(item.motifContentieux)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
