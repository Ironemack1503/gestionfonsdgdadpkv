import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSpreadsheet, FileText, Printer, X, Loader2, Eye, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReportSettings, ReportSettings, convertToExportSettings } from "@/hooks/useReportSettings";
import { toast } from "sonner";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import dgdaLogo from "@/assets/dgda-logo-new.jpg";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  onExportPDF: () => void;
  onExportExcel: () => void;
}

// Format currency for display
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'CDF',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date for display
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

// Get cell value with formatting
const getCellValue = (item: Record<string, any>, key: string): string => {
  const value = item[key];
  if (value === null || value === undefined) return '';
  
  if (key === 'date' || key === 'created_at') {
    return formatDate(value);
  }
  
  if (key === 'montant' || key === 'montant_prevu' || key === 'solde_initial' || 
      key === 'total_recettes' || key === 'total_depenses' || key === 'solde_final') {
    return formatCurrency(Number(value));
  }
  
  return String(value);
};

// Helper to convert hex to RGB for background styling
const hexToRgba = (hex: string, alpha: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(59, 130, 246, ${alpha})`;
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
};

// Determine if color is light or dark for text contrast
const isLightColor = (hex: string): boolean => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return false;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

export function ExportPreviewDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  columns,
  data,
  onExportPDF,
  onExportExcel,
}: ExportPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "pdf" | "excel">("pdf");
  const { settings: dbSettings, isLoading } = useReportSettings();

  // Cast settings to ReportSettings if available
  const reportSettings = dbSettings && 'id' in dbSettings ? dbSettings as ReportSettings : null;

  const handleExportPDF = () => {
    onExportPDF();
    onOpenChange(false);
  };

  const handleExportExcel = () => {
    onExportExcel();
    onOpenChange(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate a low-resolution preview PDF
  const handlePreviewPDF = async () => {
    try {
      toast.info("Génération de l'aperçu PDF...");
      
      const previewHeaderColor = reportSettings?.couleur_principale || '#3b82f6';
      const titleTextPreview = reportSettings?.titre_entete || 'Direction Générale des Douanes et Accises';
      const subtitleTextPreview = reportSettings?.sous_titre || 'Rapport Financier';
      const footerTextPreview = reportSettings?.contenu_pied_page || "Tous mobilisés pour une douane d'action et d'excellence !";
      const previewShowWatermark = reportSettings?.filigrane_actif ?? true;
      const previewWatermarkText = reportSettings?.filigrane_texte || 'DGDA';
      const previewOrientation = (reportSettings?.orientation || 'portrait') as 'portrait' | 'landscape';
      
      // Create PDF
      const doc = new jsPDF({
        orientation: previewOrientation,
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Add PREVIEW watermark in red at top
      doc.saveGraphicsState();
      doc.setTextColor(255, 0, 0);
      doc.setFontSize(50);
      doc.setFont('helvetica', 'bold');
      doc.text('APERÇU', pageWidth / 2, 35, { align: 'center' });
      doc.restoreGraphicsState();

      // Add logo
      try {
        const img = new Image();
        img.src = dgdaLogo;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        doc.addImage(img, 'JPEG', 14, 42, 20, 20);
      } catch (e) {
        console.warn('Could not load logo');
      }

      // Header text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 0, 0);
      doc.text('République Démocratique du Congo', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Ministère des Finances', pageWidth / 2, 53, { align: 'center' });
      doc.text(titleTextPreview, pageWidth / 2, 58, { align: 'center' });
      
      const hexResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(previewHeaderColor);
      if (subtitleTextPreview) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        if (hexResult) {
          doc.setTextColor(parseInt(hexResult[1], 16), parseInt(hexResult[2], 16), parseInt(hexResult[3], 16));
        }
        doc.text(subtitleTextPreview, pageWidth / 2, 63, { align: 'center' });
      }

      // Separator line
      if (hexResult) {
        doc.setDrawColor(parseInt(hexResult[1], 16), parseInt(hexResult[2], 16), parseInt(hexResult[3], 16));
      }
      doc.setLineWidth(0.5);
      doc.line(14, 68, pageWidth - 14, 68);

      // Document title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(title, 14, 76);

      if (subtitle) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(subtitle, 14, 82);
      }

      // Generation date
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Aperçu généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, subtitle ? 88 : 82);

      // Prepare table data (limited to first 10 rows for preview)
      const previewData = data.slice(0, 10);
      const tableHeaders = columns.map(col => col.header);
      const tableData = previewData.map(item => 
        columns.map(col => getCellValue(item, col.key))
      );

      // Header color RGB
      const headerRgb: [number, number, number] = hexResult 
        ? [parseInt(hexResult[1], 16), parseInt(hexResult[2], 16), parseInt(hexResult[3], 16)]
        : [59, 130, 246];

      // Add table
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: subtitle ? 93 : 87,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: headerRgb,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { top: 14, right: 14, bottom: 40, left: 14 },
      });

      // Add note about limited data
      if (data.length > 10) {
        const finalY = (doc as any).lastAutoTable?.finalY || 150;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text(`Aperçu limité à 10 lignes sur ${data.length} - Export complet pour toutes les données`, 14, finalY + 8);
      }

      // Add DGDA watermark if enabled
      if (previewShowWatermark) {
        doc.saveGraphicsState();
        doc.setTextColor(230, 230, 230);
        doc.setFontSize(60);
        doc.setFont('helvetica', 'bold');
        doc.text(previewWatermarkText, pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
        doc.restoreGraphicsState();
      }

      // Footer
      const footerY = pageHeight - 25;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(14, footerY - 2, pageWidth - 14, footerY - 2);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(footerTextPreview, pageWidth / 2, footerY + 3, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.text('Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe', pageWidth / 2, footerY + 8, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(255, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('DOCUMENT APERÇU - NON OFFICIEL', pageWidth / 2, footerY + 15, { align: 'center' });

      // Save the preview PDF
      doc.save(`apercu_${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Aperçu PDF téléchargé");
    } catch (error) {
      console.error('Error generating preview PDF:', error);
      toast.error("Erreur lors de la génération de l'aperçu");
    }
  };

  // Get styling from database settings
  const headerColor = reportSettings?.couleur_principale || '#3b82f6';
  const headerTextColor = isLightColor(headerColor) ? '#000000' : '#ffffff';
  const showWatermark = reportSettings?.filigrane_actif ?? true;
  const watermarkText = reportSettings?.filigrane_texte || 'DGDA';
  const titleText = reportSettings?.titre_entete || 'Direction Générale des Douanes et Accises';
  const subtitleText = reportSettings?.sous_titre || 'Rapport Financier';
  const footerText = reportSettings?.contenu_pied_page || "Tous mobilisés pour une douane d'action et d'excellence !";
  const showDate = reportSettings?.afficher_date ?? true;
  const showPageNumber = reportSettings?.afficher_numero_page ?? true;
  const fontFamily = reportSettings?.police === 'times' ? 'Times New Roman, serif' : 
                     reportSettings?.police === 'courier' ? 'Courier New, monospace' : 
                     'Helvetica, Arial, sans-serif';
  const fontSize = reportSettings?.taille_police || 10;
  const logoPosition = reportSettings?.position_logo || 'gauche';
  const orientation = reportSettings?.orientation || 'portrait';

  // Page dimensions based on orientation
  const isLandscape = orientation === 'landscape';
  const pageAspect = isLandscape ? 'aspect-[297/210]' : 'aspect-[210/297]';

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Chargement des paramètres...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Aperçu avant export
          </DialogTitle>
          <DialogDescription>
            Prévisualisation avec les paramètres de mise en forme configurés
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Aperçu données</TabsTrigger>
            <TabsTrigger value="pdf">Aperçu PDF</TabsTrigger>
            <TabsTrigger value="excel">Aperçu Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[500px] rounded-md border">
              <div className="p-4">
                {/* Preview Header */}
                <div className="text-center mb-6 pb-4 border-b">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: hexToRgba(headerColor, 0.1) }}
                    >
                      <span className="font-bold text-lg" style={{ color: headerColor }}>DGDA</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground italic">République Démocratique du Congo</p>
                      <p className="text-sm font-semibold">{titleText}</p>
                    </div>
                  </div>
                </div>

                {/* Document Title */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold">{title}</h2>
                  {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                  {showDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                    </p>
                  )}
                </div>

                {/* Data Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: headerColor, color: headerTextColor }}>
                      <tr>
                        {columns.map((col, idx) => (
                          <th key={idx} className="px-3 py-2 text-left font-semibold">
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 50).map((item, rowIdx) => (
                        <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                          {columns.map((col, colIdx) => (
                            <td key={colIdx} className="px-3 py-2 border-t">
                              {getCellValue(item, col.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 50 && (
                    <div className="p-3 bg-muted/50 text-center text-sm text-muted-foreground border-t">
                      ... et {data.length - 50} autres lignes (affichage limité à 50 lignes)
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm">
                  <strong>Total des enregistrements:</strong> {data.length}
                </div>

                {/* Watermark simulation */}
                {showWatermark && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                    <span className="text-6xl font-bold rotate-[-30deg]" style={{ color: headerColor }}>
                      {watermarkText}
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pdf" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[500px] rounded-md border bg-gray-200">
              <div className="p-6 flex justify-center">
                {/* PDF Page Simulation */}
                <div 
                  className={`bg-white shadow-2xl relative overflow-hidden ${isLandscape ? 'w-full max-w-4xl' : 'w-full max-w-xl'}`}
                  style={{ 
                    fontFamily,
                    minHeight: isLandscape ? '400px' : '600px'
                  }}
                >
                  {/* Watermark */}
                  {showWatermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                      <span 
                        className="text-8xl font-bold rotate-[45deg] opacity-[0.08]"
                        style={{ color: headerColor }}
                      >
                        {watermarkText}
                      </span>
                    </div>
                  )}
                  
                  {/* Header */}
                  <div className="p-4 relative z-10">
                    <div className={`flex items-start gap-4 mb-4 ${logoPosition === 'centre' ? 'flex-col items-center' : ''}`}>
                      {logoPosition === 'gauche' && (
                        <img src={dgdaLogo} alt="DGDA Logo" className="w-14 h-14 object-contain" />
                      )}
                      <div className={`flex-1 ${logoPosition === 'centre' ? 'text-center' : ''}`}>
                        <p className="text-xs italic">République Démocratique du Congo</p>
                        <p className="text-xs font-semibold">Ministère des Finances</p>
                        <p className="text-sm font-bold" style={{ color: headerColor }}>{titleText}</p>
                        {subtitleText && (
                          <p className="text-xs italic" style={{ color: headerColor }}>{subtitleText}</p>
                        )}
                      </div>
                      {logoPosition === 'centre' && (
                        <img src={dgdaLogo} alt="DGDA Logo" className="w-14 h-14 object-contain" />
                      )}
                      {logoPosition === 'droite' && (
                        <img src={dgdaLogo} alt="DGDA Logo" className="w-14 h-14 object-contain" />
                      )}
                    </div>

                    <div className="h-0.5 mb-4" style={{ backgroundColor: headerColor }}></div>

                    {/* Document Title */}
                    <h2 className="text-base font-bold mb-1" style={{ fontSize: `${fontSize + 4}px` }}>{title}</h2>
                    {subtitle && <p className="text-xs text-gray-600 mb-1">{subtitle}</p>}
                    {showDate && (
                      <p className="text-[10px] text-gray-500 italic mb-3">
                        Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                      </p>
                    )}

                    {/* Table preview */}
                    <div className="border rounded text-xs mb-4 overflow-hidden" style={{ fontSize: `${fontSize}px` }}>
                      <table className="w-full">
                        <thead style={{ backgroundColor: headerColor, color: headerTextColor }}>
                          <tr>
                            {columns.map((col, idx) => (
                              <th key={idx} className="px-2 py-1.5 text-left font-semibold">{col.header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.slice(0, 8).map((item, rowIdx) => (
                            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {columns.map((col, colIdx) => (
                                <td key={colIdx} className="px-2 py-1 border-t border-gray-200">
                                  {getCellValue(item, col.key)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {data.length > 8 && (
                        <div className="p-2 text-center text-gray-500 border-t bg-gray-50">
                          ... {data.length - 8} autres lignes
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-gray-50 text-center text-[9px] text-gray-500 z-10">
                    <p className="italic font-medium" style={{ color: headerColor }}>{footerText}</p>
                    <p>Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe</p>
                    <p>B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215</p>
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-200">
                      {showDate && <span>{new Date().toLocaleDateString('fr-FR')}</span>}
                      <span className="flex-1"></span>
                      {showPageNumber && <span>Page 1 sur 1</span>}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="excel" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[500px] rounded-md border bg-white">
              <div className="p-4">
                {/* Excel Simulation */}
                <div className="border rounded-lg overflow-hidden font-mono text-xs" style={{ fontFamily }}>
                  {/* Excel header rows */}
                  <div className="p-3 border-b text-center" style={{ backgroundColor: hexToRgba(headerColor, 0.1) }}>
                    <div className="text-gray-400">═══════════════════════════════════════════════════════════════</div>
                    <div className="font-bold text-lg" style={{ color: headerColor }}>{titleText}</div>
                    <div>{subtitleText}</div>
                    <div className="text-gray-400">═══════════════════════════════════════════════════════════════</div>
                  </div>
                  
                  <div className="p-2 bg-gray-50 border-b">
                    <div className="font-bold">{title}</div>
                    {subtitle && <div className="text-gray-600">{subtitle}</div>}
                    {showDate && (
                      <div className="text-gray-500">
                        Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                      </div>
                    )}
                  </div>

                  {/* Excel table */}
                  <table className="w-full">
                    <thead style={{ backgroundColor: headerColor, color: headerTextColor }}>
                      <tr>
                        <th className="border px-2 py-1 text-left">#</th>
                        {columns.map((col, idx) => (
                          <th key={idx} className="border px-2 py-1 text-left">{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 5).map((item, rowIdx) => (
                        <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : ''} style={rowIdx % 2 !== 0 ? { backgroundColor: hexToRgba(headerColor, 0.05) } : {}}>
                          <td className="border px-2 py-1 text-gray-500">{rowIdx + 1}</td>
                          {columns.map((col, colIdx) => (
                            <td key={colIdx} className="border px-2 py-1">
                              {getCellValue(item, col.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 5 && (
                    <div className="p-2 text-center text-gray-500 border-t">
                      ... {data.length - 5} autres lignes
                    </div>
                  )}

                  {/* Excel footer */}
                  <div className="p-2 bg-gray-100 border-t text-center text-gray-600">
                    <div className="text-gray-400">───────────────────────────────────────────────────────────────</div>
                    <div className="italic" style={{ color: headerColor }}>{footerText}</div>
                    <div>Immeuble DGDA, Place LE ROYAL, Kinshasa/Gombe</div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" onClick={handlePreviewPDF} className="text-amber-600 border-amber-300 hover:bg-amber-50">
            <Download className="h-4 w-4 mr-2" />
            Aperçu PDF
          </Button>
          <Button variant="default" onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700">
            <FileText className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
          <Button variant="default" onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exporter Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
