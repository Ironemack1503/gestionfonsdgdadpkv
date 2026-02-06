import { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";
import dgdaLogo from "@/assets/dgda-logo-new.jpg";
import { ReportSettings } from "@/hooks/useReportSettings";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMontant } from "@/lib/utils";

export interface PreviewColumn {
  header: string;
  key: string;
  type?: 'text' | 'date' | 'currency' | 'number';
}

interface LivePDFPreviewProps {
  settings: Partial<ReportSettings>;
  data: any[];
  columns: PreviewColumn[];
  reportTitle: string;
  subtitle?: string;
  isLoading?: boolean;
  onExportFullPDF?: () => void;
  isExportingFull?: boolean;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [59, 130, 246];
};

const formatCellValue = (value: any, type?: string): string => {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString('fr-FR');
    case 'currency':
      return formatMontant(Number(value), { showCurrency: true });
    case 'number':
      return new Intl.NumberFormat('fr-FR').format(Number(value));
    default:
      return String(value);
  }
};

export function LivePDFPreview({ 
  settings, 
  data, 
  columns, 
  reportTitle, 
  subtitle,
  isLoading: dataLoading,
  onExportFullPDF,
  isExportingFull = false
}: LivePDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const generatePDF = useCallback(async () => {
    if (!data || data.length === 0) {
      setPdfUrl(null);
      return;
    }

    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation: (settings.orientation as 'portrait' | 'landscape') || 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.width;

      // Load and add logo
      const img = new Image();
      img.src = settings.logo_url || dgdaLogo;
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      try {
        const logoX = settings.position_logo === 'droite' ? pageWidth - 39 : 
                      settings.position_logo === 'centre' ? (pageWidth - 25) / 2 : 14;
        doc.addImage(img, 'JPEG', logoX, 8, 25, 25);
      } catch (e) {
        console.warn('Could not load logo');
      }

      // Header lines
      const line1 = settings.ligne_entete_1 || 'République Démocratique du Congo';
      const line2 = settings.ligne_entete_2 || 'Ministère des Finances';
      const line3 = settings.ligne_entete_3 || settings.titre_entete || 'Direction Générale des Douanes et Accises';
      const line4 = settings.ligne_entete_4 || settings.sous_titre || 'Direction Provinciale de Kinshasa-Ville';

      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 0, 0);
      doc.text(line1, pageWidth / 2, 12, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(line2, pageWidth / 2, 17, { align: 'center' });
      doc.text(line3, pageWidth / 2, 22, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bolditalic');
      doc.text(line4, pageWidth / 2, 29, { align: 'center' });
      
      // Header line with custom color
      const headerRgb = hexToRgb(settings.couleur_principale || '#1e40af');
      doc.setDrawColor(headerRgb[0], headerRgb[1], headerRgb[2]);
      doc.setLineWidth(0.8);
      doc.line(14, 36, pageWidth - 14, 36);

      // Title
      let currentY = 42;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      
      const titleX = settings.position_tableau === 'droite' ? pageWidth - 14 :
                     settings.position_tableau === 'centre' ? pageWidth / 2 : 14;
      const titleAlign = settings.position_tableau === 'droite' ? 'right' :
                         settings.position_tableau === 'centre' ? 'center' : 'left';
      doc.text(reportTitle, titleX, currentY + 6, { align: titleAlign as any });

      // Subtitle
      if (subtitle) {
        currentY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, 14, currentY + 6);
      }

      // Generation date
      if (settings.afficher_date !== false) {
        currentY += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, currentY + 6);
        doc.setTextColor(0, 0, 0);
      }

      // Data count
      currentY += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`${data.length} enregistrement(s)`, 14, currentY + 6);
      doc.setTextColor(0, 0, 0);

      // Table
      const tableColorRgb = hexToRgb(settings.couleur_entete_tableau || settings.couleur_principale || '#3b82f6');
      const textColorRgb = hexToRgb(settings.couleur_texte_entete || '#ffffff');
      const altRowColorRgb = hexToRgb(settings.couleur_lignes_alternees || '#f5f7fa');

      // Use only first 10 rows for preview to keep it fast
      const previewData = data.slice(0, 10);
      
      const tableData = previewData.map(item => 
        columns.map(col => formatCellValue(item[col.key], col.type))
      );

      const halign = settings.alignement_contenu === 'droite' ? 'right' :
                     settings.alignement_contenu === 'centre' ? 'center' : 'left';

      autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: tableData,
        startY: currentY + (settings.espacement_tableau || 10) + 4,
        styles: {
          fontSize: settings.taille_police || 9,
          cellPadding: 3,
          halign: halign as any,
        },
        headStyles: {
          fillColor: tableColorRgb,
          textColor: textColorRgb,
          fontStyle: 'bold',
          halign: halign as any,
        },
        alternateRowStyles: {
          fillColor: altRowColorRgb,
        },
        margin: { 
          top: 14,
          right: settings.marges_droite || 14,
          bottom: 40,
          left: settings.marges_gauche || 14,
        },
      });

      // Show truncation notice if data was cut
      if (data.length > 10) {
        const finalY = (doc as any).lastAutoTable?.finalY || currentY + 100;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text(`... et ${data.length - 10} autres enregistrements (aperçu limité à 10 lignes)`, 14, finalY + 6);
      }

      // Watermark
      if (settings.filigrane_actif && settings.filigrane_texte) {
        const pageHeight = doc.internal.pageSize.height;
        doc.saveGraphicsState();
        doc.setTextColor(220, 220, 220);
        doc.setFontSize(60);
        doc.setFont('helvetica', 'bold');
        doc.text(settings.filigrane_texte, pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: 45,
        });
        doc.restoreGraphicsState();
      }

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      const footerY = pageHeight - 32;
      
      const footerLine1 = settings.ligne_pied_1 || "Tous mobilisés pour une douane d'action et d'excellence !";
      const footerLine2 = settings.ligne_pied_2 || 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe';
      const footerLine3 = settings.ligne_pied_3 || 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481';
      const footerLine4 = settings.ligne_pied_4 || 'Email : info@douane.gouv.cd - Web : https://www.douanes.gouv.cd';

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(14, footerY - 2, pageWidth - 14, footerY - 2);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      
      doc.text(footerLine1, pageWidth / 2, footerY + 2, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text(footerLine2, pageWidth / 2, footerY + 7, { align: 'center' });
      doc.text(footerLine3, pageWidth / 2, footerY + 12, { align: 'center' });
      doc.setFontSize(6);
      doc.text(footerLine4, pageWidth / 2, footerY + 17, { align: 'center' });

      // Page number
      if (settings.afficher_numero_page !== false) {
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text('Page 1 sur 1', pageWidth / 2, footerY + 24, { align: 'center' });
      }

      // Generate blob URL
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      // Revoke previous URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [settings, data, columns, reportTitle, subtitle]);

  // Debounced regeneration
  useEffect(() => {
    const timeout = setTimeout(() => {
      generatePDF();
    }, 500);

    return () => clearTimeout(timeout);
  }, [settings, data, columns, reportTitle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  const handleDownloadPreview = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `apercu_${reportTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      link.click();
    }
  };

  const isLoading = dataLoading || isGenerating;
  const hasNoData = !data || data.length === 0;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={generatePDF} disabled={isLoading || hasNoData}>
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownloadPreview} disabled={!pdfUrl} title="Télécharger l'aperçu">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)} disabled={!pdfUrl}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Export full PDF button */}
      {onExportFullPDF && (
        <Button 
          className="w-full" 
          onClick={onExportFullPDF} 
          disabled={isLoading || hasNoData || isExportingFull}
        >
          {isExportingFull ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Télécharger le PDF complet ({data?.length || 0} enregistrements)
            </>
          )}
        </Button>
      )}

      {/* PDF Preview */}
      <div className="border rounded-lg bg-muted/50 overflow-hidden relative" style={{ height: 400 }}>
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {hasNoData && !isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Aucune donnée disponible pour l'aperçu
          </div>
        ) : pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', width: `${10000 / zoom}%`, height: `${10000 / zoom}%` }}
            title="PDF Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Génération de l'aperçu...
          </div>
        )}
      </div>

      {/* Data info */}
      {data && data.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Aperçu avec {Math.min(data.length, 10)} sur {data.length} enregistrements
        </div>
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Aperçu PDF - {reportTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0">
            {pdfUrl && (
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border rounded"
                style={{ minHeight: 'calc(90vh - 100px)' }}
                title="PDF Preview Fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
