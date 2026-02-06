/**
 * Programmation des Dépenses Report Page
 * Displays monthly expense programming
 * Uses Advanced Report Editor templates for unified export
 */

import { useState, useMemo } from 'react';
import { Calendar, Loader2, FileText, FileSpreadsheet, FileDown, Printer } from 'lucide-react';
import { formatMontant } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useReportData, numberToFrenchWords } from '@/hooks/useReportData';
import { useAdvancedExport } from '@/hooks/useAdvancedExport';

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function ProgrammationReportPage() {
  const currentDate = new Date();
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(currentDate.getFullYear());
  const [exporting, setExporting] = useState(false);
  
  const { generateProgrammation, isLoading } = useReportData();
  const { exportProgrammation } = useAdvancedExport();

  // Generate report data - map to template format
  const programmationData = useMemo(() => {
    const rawData = generateProgrammation(selectedMois, selectedAnnee);
    return rawData.map(item => ({
      numeroOrdre: item.numeroOrdre,
      designation: item.libelle,
      montantPrevu: item.montant,
    }));
  }, [generateProgrammation, selectedMois, selectedAnnee]);

  const getMoisAnnee = () => `${moisNoms[selectedMois - 1]} ${selectedAnnee}`;

  // Calculate total
  const totalMontant = programmationData.reduce((acc, row) => acc + (row.montantPrevu || 0), 0);
  const totalInWords = numberToFrenchWords(Math.floor(totalMontant));

  // Export handlers using Advanced Report Editor format
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportProgrammation(
        'pdf',
        programmationData,
        `Programmation des Dépenses - ${getMoisAnnee()}`,
        `En lettres: ${totalInWords.charAt(0).toUpperCase() + totalInWords.slice(1)} Francs Congolais`
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportProgrammation(
        'excel',
        programmationData,
        `Programmation des Dépenses - ${getMoisAnnee()}`,
        `En lettres: ${totalInWords.charAt(0).toUpperCase() + totalInWords.slice(1)} Francs Congolais`
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportWord = async () => {
    setExporting(true);
    try {
      await exportProgrammation(
        'word',
        programmationData,
        `Programmation des Dépenses - ${getMoisAnnee()}`,
        `En lettres: ${totalInWords.charAt(0).toUpperCase() + totalInWords.slice(1)} Francs Congolais`
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programmation des Dépenses"
        description="État prévisionnel des dépenses mensuelles"
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

      {/* Summary Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Montant Total Programmé</p>
              <p className="text-3xl font-bold text-primary">{formatMontant(totalMontant, { showCurrency: true })}</p>
            </div>
            <div className="text-sm text-muted-foreground italic max-w-md">
              <span className="font-medium">En lettres:</span> {totalInWords.charAt(0).toUpperCase() + totalInWords.slice(1)} Francs Congolais
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Programmation - {getMoisAnnee()}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : programmationData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune programmation pour cette période
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 text-center">N° Ord</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right w-40">Montant (FC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programmationData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/30">
                      <TableCell className="text-center font-mono">{row.numeroOrdre}</TableCell>
                      <TableCell>{row.designation}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(row.montantPrevu)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell colSpan={2} className="text-right">MONTANT TOTAL</TableCell>
                    <TableCell className="text-right text-primary text-lg">{formatMontant(totalMontant)}</TableCell>
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
