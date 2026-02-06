/**
 * Dialogue du sommaire annuel des recettes/dépenses
 * Basé sur SOMMAIEANNEE.frm et SOMMEANNUELLE.frm du système VB6
 * Affiche le récapitulatif par type (sources de recettes ou catégories de dépenses)
 */
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  X, FileSpreadsheet, FileDown, Calendar, 
  TrendingUp, TrendingDown, PieChart,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { formatMontant } from "@/lib/utils";
import { exportToExcel } from "@/lib/exportUtils";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SommaireItem {
  code: string;
  libelle: string;
  montant: number;
}

interface SommaireAnnuelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'recettes' | 'depenses';
  data: SommaireItem[];
  annee: number;
  isLoading?: boolean;
}

const currentYear = new Date().getFullYear();
const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

export function SommaireAnnuelDialog({
  open,
  onOpenChange,
  type,
  data,
  annee: initialAnnee,
  isLoading = false,
}: SommaireAnnuelDialogProps) {
  const [selectedAnnee, setSelectedAnnee] = useState(String(initialAnnee));

  const isRecette = type === 'recettes';
  const typeLabel = isRecette ? 'Recettes' : 'Dépenses';
  const TrendIcon = isRecette ? TrendingUp : TrendingDown;
  const ArrowIcon = isRecette ? ArrowUpRight : ArrowDownRight;
  const typeColor = isRecette ? 'success' : 'destructive';

  // Calculate totals
  const total = useMemo(() => {
    return data.reduce((acc, item) => acc + item.montant, 0);
  }, [data]);

  // Sort by amount descending
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.montant - a.montant);
  }, [data]);

  // Calculate percentage for each item
  const dataWithPercentage = useMemo(() => {
    return sortedData.map(item => ({
      ...item,
      pourcentage: total > 0 ? ((item.montant / total) * 100).toFixed(1) : '0',
    }));
  }, [sortedData, total]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(14);
    doc.setFont('times', 'bold');
    doc.text(`SOMMAIRE ANNUEL DES ${typeLabel.toUpperCase()} - ${selectedAnnee}`, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('DIRECTION GENERALE DES DOUANES ET ACCISES', pageWidth / 2, 28, { align: 'center' });
    doc.text('Direction Provinciale Kinshasa-Ville', pageWidth / 2, 34, { align: 'center' });

    // Table
    const tableData = dataWithPercentage.map((item, idx) => [
      String(idx + 1),
      item.code,
      item.libelle,
      formatMontant(item.montant) + ' FC',
      item.pourcentage + '%',
    ]);

    autoTable(doc, {
      head: [['N°', 'Code', 'Libellé', 'Montant', '%']],
      body: tableData,
      foot: [['', '', 'TOTAL', formatMontant(total) + ' FC', '100%']],
      startY: 42,
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 9,
      },
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [240, 240, 240],
        fontStyle: 'bold',
      },
    });

    doc.save(`sommaire_${type}_${selectedAnnee}.pdf`);
  };

  const handleExportExcel = () => {
    const exportData = dataWithPercentage.map((item, idx) => ({
      numero: idx + 1,
      code: item.code,
      libelle: item.libelle,
      montant: item.montant,
      pourcentage: item.pourcentage + '%',
    }));

    // Add total row
    exportData.push({
      numero: '' as any,
      code: '',
      libelle: 'TOTAL',
      montant: total,
      pourcentage: '100%',
    });

    exportToExcel({
      title: `Sommaire Annuel des ${typeLabel} - ${selectedAnnee}`,
      filename: `sommaire_${type}_${selectedAnnee}`,
      columns: [
        { header: 'N°', key: 'numero', width: 8 },
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Libellé', key: 'libelle', width: 40 },
        { header: 'Montant (FC)', key: 'montant', width: 20 },
        { header: '%', key: 'pourcentage', width: 10 },
      ],
      data: exportData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PieChart className={`w-5 h-5 text-${typeColor}`} />
            Sommaire Annuel des {typeLabel}
          </DialogTitle>
          <DialogDescription>
            Récapitulatif par {isRecette ? 'source de provenance' : 'rubrique budgétaire'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélecteur d'année */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Label>Année</Label>
            </div>
            <Select value={selectedAnnee} onValueChange={setSelectedAnnee}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total en vedette */}
          <div className={`p-6 rounded-xl border-2 border-${typeColor}/30 bg-${typeColor}/5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendIcon className={`w-8 h-8 text-${typeColor}`} />
                <div>
                  <p className="text-sm text-muted-foreground">Total {typeLabel}</p>
                  <p className={`text-2xl font-bold text-${typeColor}`}>
                    {formatMontant(total)} FC
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {data.length} {isRecette ? 'sources' : 'rubriques'}
              </Badge>
            </div>
          </div>

          {/* Tableau des données */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">N°</TableHead>
                  <TableHead className="w-24">Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right w-40">Montant</TableHead>
                  <TableHead className="text-right w-20">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataWithPercentage.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucune donnée pour l'année sélectionnée
                    </TableCell>
                  </TableRow>
                ) : (
                  dataWithPercentage.map((item, idx) => (
                    <TableRow key={item.code}>
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {item.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.libelle}</TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 text-${typeColor} font-semibold`}>
                          <ArrowIcon className="w-3 h-3" />
                          {formatMontant(item.montant)} FC
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">{item.pourcentage}%</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {dataWithPercentage.length > 0 && (
                <TableFooter>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={3} className="font-bold text-right">
                      TOTAL GÉNÉRAL
                    </TableCell>
                    <TableCell className={`text-right font-bold text-${typeColor}`}>
                      {formatMontant(total)} FC
                    </TableCell>
                    <TableCell className="text-right font-bold">100%</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportExcel}
            className="text-success hover:bg-success/10"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button
            type="button"
            onClick={handleExportPDF}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
