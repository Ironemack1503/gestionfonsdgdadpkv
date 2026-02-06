/**
 * Hook for using Advanced Report Editor templates in reports
 * Provides unified export functions across all report pages
 */

import { useCallback } from 'react';
import { 
  ReportTemplate, 
  TableColumn 
} from '@/components/reports/AdvancedReportEditor/types';
import { 
  FEUILLE_CAISSE_TEMPLATE, 
  SOMMAIRE_TEMPLATE, 
  PROGRAMMATION_TEMPLATE 
} from '@/components/reports/AdvancedReportEditor/templates';
import { 
  exportTemplateToPDF, 
  exportTemplateToExcel, 
  exportTemplateToWord 
} from '@/components/reports/AdvancedReportEditor/exportFunctions';
import { toast } from 'sonner';

export type ReportType = 'feuille_caisse' | 'sommaire' | 'programmation' | 'custom';
export type ExportFormat = 'pdf' | 'excel' | 'word';

interface ExportOptions {
  title: string;
  subtitle?: string;
  data: Record<string, unknown>[];
  reportType?: ReportType;
  customTemplate?: ReportTemplate;
  customColumns?: TableColumn[];
}

// Get the default template for a report type
function getDefaultTemplate(reportType: ReportType): ReportTemplate {
  switch (reportType) {
    case 'feuille_caisse':
      return FEUILLE_CAISSE_TEMPLATE;
    case 'sommaire':
      return SOMMAIRE_TEMPLATE;
    case 'programmation':
      return PROGRAMMATION_TEMPLATE;
    default:
      return FEUILLE_CAISSE_TEMPLATE;
  }
}

export function useAdvancedExport() {
  const exportReport = useCallback(async (
    format: ExportFormat,
    options: ExportOptions
  ): Promise<void> => {
    const { title, subtitle, data, reportType = 'feuille_caisse', customTemplate, customColumns } = options;
    
    // Get the template (custom or default)
    let template = customTemplate || getDefaultTemplate(reportType);
    
    // Apply custom columns if provided
    if (customColumns) {
      template = { ...template, columns: customColumns };
    }
    
    try {
      switch (format) {
        case 'pdf':
          await exportTemplateToPDF(template, data, title, subtitle);
          break;
        case 'excel':
          exportTemplateToExcel(template, data, title, subtitle);
          break;
        case 'word':
          exportTemplateToWord(template, data, title, subtitle);
          break;
      }
      
      toast.success(`Export ${format.toUpperCase()} généré avec succès !`);
    } catch (error) {
      console.error(`Export ${format} error:`, error);
      toast.error(`Erreur lors de la génération du ${format.toUpperCase()}`);
      throw error;
    }
  }, []);

  const exportFeuilleCaisse = useCallback(async (
    format: ExportFormat,
    data: Record<string, unknown>[],
    title: string,
    subtitle?: string
  ) => {
    return exportReport(format, {
      title,
      subtitle,
      data,
      reportType: 'feuille_caisse',
    });
  }, [exportReport]);

  const exportSommaire = useCallback(async (
    format: ExportFormat,
    data: Record<string, unknown>[],
    title: string,
    subtitle?: string
  ) => {
    return exportReport(format, {
      title,
      subtitle,
      data,
      reportType: 'sommaire',
    });
  }, [exportReport]);

  const exportProgrammation = useCallback(async (
    format: ExportFormat,
    data: Record<string, unknown>[],
    title: string,
    subtitle?: string
  ) => {
    return exportReport(format, {
      title,
      subtitle,
      data,
      reportType: 'programmation',
    });
  }, [exportReport]);

  const exportCustom = useCallback(async (
    format: ExportFormat,
    template: ReportTemplate,
    data: Record<string, unknown>[],
    title: string,
    subtitle?: string
  ) => {
    return exportReport(format, {
      title,
      subtitle,
      data,
      customTemplate: template,
    });
  }, [exportReport]);

  return {
    exportReport,
    exportFeuilleCaisse,
    exportSommaire,
    exportProgrammation,
    exportCustom,
    // Templates for direct access
    templates: {
      feuilleCaisse: FEUILLE_CAISSE_TEMPLATE,
      sommaire: SOMMAIRE_TEMPLATE,
      programmation: PROGRAMMATION_TEMPLATE,
    },
  };
}
