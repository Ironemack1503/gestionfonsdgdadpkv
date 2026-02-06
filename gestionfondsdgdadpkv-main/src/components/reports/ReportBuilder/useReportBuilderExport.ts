/**
 * useReportBuilderExport Hook
 * Handles export functionality for the Report Builder with configured settings
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useReportSettings, convertToExportSettings, ReportSettings } from '@/hooks/useReportSettings';
import { exportToPDF, exportToExcel, ExportColumn, PDFExportSettings } from '@/lib/exportUtils';
import { exportToWord, generateTableHTML, generateSummaryHTML } from '@/lib/wordExport';
import { ReportConfig, ReportField, CalculatedField } from './types';


interface ExportData {
  config: ReportConfig;
  data: Record<string, unknown>[];
  totals: Record<string, number>;
  title?: string;
  subtitle?: string;
}

export function useReportBuilderExport() {
  const { toast } = useToast();
  const { settings: dbSettings, isLoading: settingsLoading } = useReportSettings();

  // Convert ReportField to ExportColumn
  const convertToExportColumns = useCallback((fields: ReportField[]): ExportColumn[] => {
    return fields
      .filter(f => f.isVisible)
      .map(field => ({
        header: field.label,
        key: field.name,
        width: field.width || (field.type === 'currency' ? 15 : field.type === 'date' ? 12 : 20),
      }));
  }, []);

  // Get PDF settings from database
  const getPDFSettings = useCallback((): PDFExportSettings => {
    if (!dbSettings) {
      return {
        useDefaultLogo: true,
        showLogo: true,
        headerColor: '#3b82f6',
        headerTextColor: '#ffffff',
        alternateRowColor: '#f5f7fa',
        borderColor: '#e5e7eb',
        orientation: 'landscape',
        fontSize: 9,
        margins: 'normal',
        showWatermark: true,
        showFooter: true,
        showGenerationDate: true,
        customHeaderLine1: 'République Démocratique du Congo',
        customHeaderLine2: 'Ministère des Finances',
        customHeaderLine3: 'Direction Générale des Douanes et Accises',
        customHeaderLine4: 'Direction Provinciale de Kinshasa-Ville',
        useCustomHeader: true,
        customFooterLine1: "Tous mobilisés pour une douane d'action et d'excellence !",
        customFooterLine2: 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
        customFooterLine3: 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
        customFooterLine4: 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
        useCustomFooter: true,
      };
    }
    return convertToExportSettings(dbSettings as ReportSettings);
  }, [dbSettings]);

  // Get header/footer lines
  const getHeaderLines = useCallback((): string[] => {
    if (!dbSettings) {
      return [
        'République Démocratique du Congo',
        'Ministère des Finances',
        'Direction Générale des Douanes et Accises',
        'Direction Provinciale de Kinshasa-Ville',
      ];
    }
    const s = dbSettings as ReportSettings;
    return [
      s.ligne_entete_1 || 'République Démocratique du Congo',
      s.ligne_entete_2 || 'Ministère des Finances',
      s.ligne_entete_3 || 'Direction Générale des Douanes et Accises',
      s.ligne_entete_4 || 'Direction Provinciale de Kinshasa-Ville',
    ].filter(Boolean);
  }, [dbSettings]);

  const getFooterLines = useCallback((): string[] => {
    if (!dbSettings) {
      return [
        "Tous mobilisés pour une douane d'action et d'excellence !",
        'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
        'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
        'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
      ];
    }
    const s = dbSettings as ReportSettings;
    return [
      s.ligne_pied_1 || "Tous mobilisés pour une douane d'action et d'excellence !",
      s.ligne_pied_2 || 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
      s.ligne_pied_3 || 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
      s.ligne_pied_4 || 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
    ].filter(Boolean);
  }, [dbSettings]);

  // Format cell value for export
  const formatCellValue = useCallback((value: unknown, field: ReportField): string | number => {
    if (value === null || value === undefined) return '';
    
    switch (field.type) {
      case 'currency':
        return typeof value === 'number' ? value : Number(value) || 0;
      case 'number':
        return typeof value === 'number' ? value : Number(value) || 0;
      case 'date':
        return new Date(String(value)).toLocaleDateString('fr-FR');
      default:
        return String(value);
    }
  }, []);

  // Prepare data for export
  const prepareExportData = useCallback((
    config: ReportConfig,
    data: Record<string, unknown>[]
  ): Record<string, unknown>[] => {
    const visibleFields = config.selectedFields.filter(f => f.isVisible);
    
    return data.map(row => {
      const exportRow: Record<string, unknown> = {};
      visibleFields.forEach(field => {
        exportRow[field.name] = formatCellValue(row[field.name], field);
      });
      return exportRow;
    });
  }, [formatCellValue]);

  // Add totals row to data
  const addTotalsRow = useCallback((
    data: Record<string, unknown>[],
    config: ReportConfig,
    totals: Record<string, number>
  ): Record<string, unknown>[] => {
    if (!config.showTotals) return data;

    const visibleFields = config.selectedFields.filter(f => f.isVisible);
    const totalsRow: Record<string, unknown> = {};
    
    visibleFields.forEach((field, index) => {
      if (index === 0) {
        totalsRow[field.name] = 'TOTAL GÉNÉRAL';
      } else if (field.type === 'currency' || field.type === 'number') {
        totalsRow[field.name] = totals[field.id] || 0;
      } else {
        totalsRow[field.name] = '';
      }
    });

    return [...data, totalsRow];
  }, []);

  // Export to PDF
  const handleExportPDF = useCallback(async ({ config, data, totals, title, subtitle }: ExportData) => {
    try {
      const columns = convertToExportColumns(config.selectedFields);
      const preparedData = prepareExportData(config, data);
      const dataWithTotals = addTotalsRow(preparedData, config, totals);
      const pdfSettings = getPDFSettings();

      await exportToPDF({
        title: title || config.name || 'Rapport Personnalisé',
        filename: `rapport_${new Date().toISOString().split('T')[0]}`,
        columns,
        data: dataWithTotals,
        subtitle: subtitle || `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
        pdfSettings: {
          ...pdfSettings,
          orientation: 'landscape', // Report builder defaults to landscape
        },
        headerLines: getHeaderLines(),
        footerLines: getFooterLines(),
      });

      toast({
        title: 'Export PDF réussi',
        description: 'Le rapport a été téléchargé avec succès.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible de générer le PDF.',
        variant: 'destructive',
      });
    }
  }, [convertToExportColumns, prepareExportData, addTotalsRow, getPDFSettings, getHeaderLines, getFooterLines, toast]);

  // Export to Excel
  const handleExportExcel = useCallback(({ config, data, totals, title, subtitle }: ExportData) => {
    try {
      const columns = convertToExportColumns(config.selectedFields);
      const preparedData = prepareExportData(config, data);
      const dataWithTotals = addTotalsRow(preparedData, config, totals);
      const pdfSettings = getPDFSettings();

      exportToExcel({
        title: title || config.name || 'Rapport Personnalisé',
        filename: `rapport_${new Date().toISOString().split('T')[0]}`,
        columns,
        data: dataWithTotals,
        subtitle: subtitle || `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
        pdfSettings,
        headerLines: getHeaderLines(),
        footerLines: getFooterLines(),
      });

      toast({
        title: 'Export Excel réussi',
        description: 'Le rapport a été téléchargé avec succès.',
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible de générer le fichier Excel.',
        variant: 'destructive',
      });
    }
  }, [convertToExportColumns, prepareExportData, addTotalsRow, getPDFSettings, getHeaderLines, getFooterLines, toast]);

  // Export to Word
  const handleExportWord = useCallback(({ config, data, totals, title, subtitle }: ExportData) => {
    try {
      const visibleFields = config.selectedFields.filter(f => f.isVisible);
      const preparedData = prepareExportData(config, data);
      const dataWithTotals = addTotalsRow(preparedData, config, totals);
      const pdfSettings = getPDFSettings();

      // Convert fields to table columns format
      const tableColumns = visibleFields.map(field => ({
        header: field.label,
        key: field.name,
        type: field.type as 'text' | 'currency' | 'date' | 'number',
        align: field.type === 'currency' || field.type === 'number' ? 'right' as const : 'left' as const,
      }));

      // Generate table HTML
      const tableHTML = generateTableHTML(
        tableColumns,
        dataWithTotals,
        {
          showTotals: false, // Already included in data
        }
      );

      // Generate summary HTML for calculated fields
      let summaryHTML = '';
      if (config.calculatedFields.length > 0) {
        const summaryItems = config.calculatedFields.map(calc => ({
          label: calc.label,
          value: totals[calc.id] || totals[calc.sourceField || ''] || 0,
          type: 'info' as const,
        }));
        summaryHTML = generateSummaryHTML(summaryItems);
      }

      // Combine content
      const content = `
        ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
        ${summaryHTML}
        ${tableHTML}
      `;

      exportToWord({
        title: title || config.name || 'Rapport Personnalisé',
        filename: `rapport_${new Date().toISOString().split('T')[0]}`,
        content,
        settings: pdfSettings,
        headerLines: getHeaderLines(),
        footerLines: getFooterLines(),
      });

      toast({
        title: 'Export Word réussi',
        description: 'Le rapport a été téléchargé avec succès.',
      });
    } catch (error) {
      console.error('Word export error:', error);
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible de générer le fichier Word.',
        variant: 'destructive',
      });
    }
  }, [prepareExportData, addTotalsRow, getPDFSettings, getHeaderLines, getFooterLines, toast]);

  // Export to CSV
  const handleExportCSV = useCallback(({ config, data, totals, title }: ExportData) => {
    try {
      const visibleFields = config.selectedFields.filter(f => f.isVisible);
      const preparedData = prepareExportData(config, data);
      const dataWithTotals = addTotalsRow(preparedData, config, totals);

      // Create CSV content
      const headers = visibleFields.map(f => f.label);
      const rows = dataWithTotals.map(row =>
        visibleFields.map(field => {
          const value = row[field.name];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return String(value);
        })
      );

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'rapport'}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export CSV réussi',
        description: 'Le rapport a été téléchargé avec succès.',
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible de générer le fichier CSV.',
        variant: 'destructive',
      });
    }
  }, [prepareExportData, addTotalsRow, toast]);

  return {
    handleExportPDF,
    handleExportExcel,
    handleExportWord,
    handleExportCSV,
    settingsLoading,
    dbSettings,
  };
}
