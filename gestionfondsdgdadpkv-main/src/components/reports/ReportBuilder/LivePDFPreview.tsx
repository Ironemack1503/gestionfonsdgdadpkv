/**
 * LivePDFPreview Component
 * Real-time PDF preview that updates dynamically as the report configuration changes
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Loader2,
  FileText,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReportSettings, convertToExportSettings, ReportSettings } from '@/hooks/useReportSettings';
import type { ReportConfig, ReportField } from './types';
import dgdaLogo from '@/assets/dgda-logo-new.jpg';

interface LivePDFPreviewProps {
  config: ReportConfig;
  data: Record<string, unknown>[];
  totals: Record<string, number>;
}

export function LivePDFPreview({ config, data, totals }: LivePDFPreviewProps) {
  const { settings: dbSettings, isLoading: settingsLoading } = useReportSettings();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Get visible fields
  const visibleFields = useMemo(() => 
    config.selectedFields.filter(f => f.isVisible), 
    [config.selectedFields]
  );

  // Get settings with normalized property names
  const getSettings = useCallback(() => {
    if (!dbSettings) {
      return {
        couleur_entete_tableau: '#3b82f6',
        couleur_texte_entete: '#ffffff',
        couleur_lignes_alternees: '#f5f7fa',
        orientation: 'landscape' as const,
        taille_police: 9,
        filigrane_actif: true,
        filigrane_texte: 'DGDA',
        ligne_entete_1: 'République Démocratique du Congo',
        ligne_entete_2: 'Ministère des Finances',
        ligne_entete_3: 'Direction Générale des Douanes et Accises',
        ligne_entete_4: 'Direction Provinciale de Kinshasa-Ville',
        ligne_pied_1: "Tous mobilisés pour une douane d'action et d'excellence !",
        ligne_pied_2: 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
        ligne_pied_3: 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
        ligne_pied_4: 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
      };
    }
    return dbSettings as ReportSettings;
  }, [dbSettings]);

  // Format cell value
  const formatCellValue = useCallback((value: unknown, field: ReportField): string => {
    if (value === null || value === undefined) return '';
    
    switch (field.type) {
      case 'currency':
        return typeof value === 'number' 
          ? new Intl.NumberFormat('fr-CD', { style: 'decimal', minimumFractionDigits: 2 }).format(value) + ' FC'
          : '';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('fr-FR') : String(value);
      case 'date':
        return new Date(String(value)).toLocaleDateString('fr-FR');
      default:
        return String(value);
    }
  }, []);

  // Generate PDF blob
  const generatePDF = useCallback(async () => {
    if (visibleFields.length === 0) {
      setPdfUrl(null);
      return;
    }

    setIsGenerating(true);

    try {
      const settings = getSettings();
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 15;

      // Add logo
      try {
        doc.addImage(dgdaLogo, 'JPEG', 10, 8, 25, 25);
      } catch (e) {
        console.warn('Could not add logo:', e);
      }

      // Header lines
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const headerLines = [
        settings.ligne_entete_1 || 'République Démocratique du Congo',
        settings.ligne_entete_2 || 'Ministère des Finances',
        settings.ligne_entete_3 || 'Direction Générale des Douanes et Accises',
        settings.ligne_entete_4 || 'Direction Provinciale de Kinshasa-Ville',
      ];
      
      headerLines.forEach((line, i) => {
        doc.text(line, pageWidth / 2, yPos + (i * 5), { align: 'center' });
      });
      yPos += 25;

      // Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(config.name || 'Rapport Personnalisé', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      // Date
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Table
      const tableHeaders = visibleFields.map(f => f.label);
      const tableData = data.slice(0, 20).map(row => 
        visibleFields.map(field => formatCellValue(row[field.name], field))
      );

      // Add totals row if enabled
      if (config.showTotals && tableData.length > 0) {
        const totalsRow = visibleFields.map((field, idx) => {
          if (idx === 0) return 'TOTAL';
          if (field.type === 'currency' || field.type === 'number') {
            const total = totals[field.id] || 0;
            return formatCellValue(total, field);
          }
          return '';
        });
        tableData.push(totalsRow);
      }

      // Parse header color
      const headerColor = settings.couleur_entete_tableau || '#3b82f6';
      const headerRGB = hexToRgb(headerColor);
      const alternateColor = settings.couleur_lignes_alternees || '#f5f7fa';
      const alternateRGB = hexToRgb(alternateColor);

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: yPos,
        margin: { left: 10, right: 10 },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: headerRGB,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: alternateRGB,
        },
        columnStyles: visibleFields.reduce((acc, field, idx) => {
          if (field.type === 'currency' || field.type === 'number') {
            acc[idx] = { halign: 'right' };
          }
          return acc;
        }, {} as Record<number, { halign: 'right' | 'left' | 'center' }>),
      });

      // Footer
      const footerY = pageHeight - 20;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      
      const footerLines = [
        settings.ligne_pied_1 || "Tous mobilisés pour une douane d'action et d'excellence !",
        settings.ligne_pied_2 || 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
      ];
      
      footerLines.forEach((line, i) => {
        doc.text(line, pageWidth / 2, footerY + (i * 4), { align: 'center' });
      });

      // Page number
      doc.text(`Page 1`, pageWidth - 15, pageHeight - 10, { align: 'right' });

      // Watermark
      if (settings.filigrane_actif !== false) {
        doc.setFontSize(50);
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'bold');
        doc.text(settings.filigrane_texte || 'DGDA', pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: 45,
        });
        doc.setTextColor(0, 0, 0);
      }

      // Generate blob URL
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      // Clean up previous URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      setPdfUrl(url);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error generating PDF preview:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [config, visibleFields, data, totals, getSettings, formatCellValue, pdfUrl]);

  // Debounced PDF generation
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      generatePDF();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [config, data, totals, isVisible, dbSettings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  // Helper to convert hex to RGB
  function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [59, 130, 246]; // Default blue
  }

  if (!isVisible) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Aperçu PDF
            </span>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(true)}>
              <Eye className="w-4 h-4 mr-1" />
              Afficher
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Aperçu PDF en temps réel
              {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              {lastUpdate && !isGenerating && (
                <Badge variant="outline" className="text-xs font-normal">
                  Mis à jour {lastUpdate.toLocaleTimeString('fr-FR')}
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={generatePDF}
                disabled={isGenerating}
                title="Actualiser"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsExpanded(true)}
                title="Plein écran"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsVisible(false)}
                title="Masquer"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibleFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">Ajoutez des colonnes pour voir l'aperçu PDF</p>
            </div>
          ) : settingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : pdfUrl ? (
            <div className="space-y-3">
              {/* Zoom controls */}
              <div className="flex items-center gap-3 pb-2 border-b">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Slider
                  value={[zoom]}
                  min={50}
                  max={150}
                  step={10}
                  onValueChange={([value]) => setZoom(value)}
                  className="w-32"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">{zoom}%</span>
              </div>
              
              {/* PDF iframe */}
              <div 
                className="border rounded-lg overflow-hidden bg-muted/30"
                style={{ height: '400px' }}
              >
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', width: `${10000 / zoom}%`, height: `${10000 / zoom}%` }}
                  title="Aperçu PDF"
                />
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Aperçu limité aux 20 premières lignes • Le PDF final contiendra toutes les données
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full screen dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Aperçu PDF - {config.name || 'Rapport Personnalisé'}
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={generatePDF}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <Minimize2 className="w-4 h-4 mr-1" />
                  Réduire
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {pdfUrl && (
            <div className="flex-1 min-h-0 mt-4">
              <iframe
                src={pdfUrl}
                className="w-full h-[calc(95vh-120px)] border rounded-lg"
                title="Aperçu PDF plein écran"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
