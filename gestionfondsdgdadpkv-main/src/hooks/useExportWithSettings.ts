/**
 * Hook for exporting data with database-configured report settings
 * 
 * This hook automatically applies the report formatting settings from the database
 * to all PDF and Excel exports.
 */

import { useReportSettings, convertToExportSettings, ReportSettings } from "@/hooks/useReportSettings";
import { 
  exportToPDF, 
  exportToExcel, 
  ExportOptions, 
  PDFExportSettings,
  defaultPDFSettings 
} from "@/lib/exportUtils";

export interface UseExportWithSettingsReturn {
  exportPDF: (options: ExportOptions, overrideSettings?: Partial<PDFExportSettings>) => Promise<void>;
  exportExcel: (options: ExportOptions, overrideSettings?: Partial<PDFExportSettings>) => void;
  settings: ReportSettings | null;
  isLoading: boolean;
  getAppliedSettings: (overrides?: Partial<PDFExportSettings>) => PDFExportSettings;
}

/**
 * Merges database settings with any overrides
 */
function mergeSettings(
  dbSettings: ReportSettings | null,
  overrides?: Partial<PDFExportSettings>
): PDFExportSettings {
  if (!dbSettings) {
    return { ...defaultPDFSettings, ...overrides };
  }

  const baseSettings = convertToExportSettings(dbSettings);
  return { ...baseSettings, ...overrides };
}

export function useExportWithSettings(): UseExportWithSettingsReturn {
  const { settings, isLoading } = useReportSettings();

  const getAppliedSettings = (overrides?: Partial<PDFExportSettings>): PDFExportSettings => {
    return mergeSettings(settings as ReportSettings | null, overrides);
  };

  const exportPDF = async (
    options: ExportOptions,
    overrideSettings?: Partial<PDFExportSettings>
  ): Promise<void> => {
    const appliedSettings = mergeSettings(
      settings as ReportSettings | null,
      { ...options.pdfSettings, ...overrideSettings }
    );

    await exportToPDF({
      ...options,
      pdfSettings: appliedSettings,
    });
  };

  const exportExcel = (
    options: ExportOptions,
    overrideSettings?: Partial<PDFExportSettings>
  ): void => {
    const appliedSettings = mergeSettings(
      settings as ReportSettings | null,
      { ...options.pdfSettings, ...overrideSettings }
    );

    exportToExcel({
      ...options,
      pdfSettings: appliedSettings,
    });
  };

  return {
    exportPDF,
    exportExcel,
    settings: settings as ReportSettings | null,
    isLoading,
    getAppliedSettings,
  };
}
