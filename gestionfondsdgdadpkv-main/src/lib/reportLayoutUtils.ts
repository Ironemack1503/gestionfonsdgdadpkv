/**
 * Report Layout Utility Functions
 * 
 * This module provides centralized report formatting utilities that can be used
 * across all PDF and Excel exports in the application. Settings are loaded from
 * the database via the useReportSettings hook.
 */

import { ReportSettings, convertToExportSettings } from "@/hooks/useReportSettings";
import { PDFExportSettings, defaultPDFSettings, ExportOptions } from "@/lib/exportUtils";

/**
 * Converts database report settings to PDF export settings format
 */
export function applyReportSettings(
  dbSettings: ReportSettings | null,
  overrides?: Partial<PDFExportSettings>
): PDFExportSettings {
  if (!dbSettings) {
    return { ...defaultPDFSettings, ...overrides };
  }

  const baseSettings = convertToExportSettings(dbSettings);
  return { ...baseSettings, ...overrides };
}

/**
 * Applies database settings to export options
 */
export function applySettingsToExportOptions(
  options: ExportOptions,
  dbSettings: ReportSettings | null
): ExportOptions {
  return {
    ...options,
    pdfSettings: applyReportSettings(dbSettings, options.pdfSettings),
  };
}

/**
 * Gets header lines from database settings
 */
export function getHeaderLines(dbSettings: ReportSettings | null): string[] {
  if (!dbSettings) {
    return [
      'République Démocratique du Congo',
      'Ministère des Finances',
      'Direction Générale des Douanes et Accises',
      'Direction Provinciale de Kinshasa-Ville',
    ];
  }

  return [
    'République Démocratique du Congo',
    'Ministère des Finances',
    dbSettings.titre_entete,
    dbSettings.sous_titre,
  ];
}

/**
 * Gets footer lines from database settings
 */
export function getFooterLines(dbSettings: ReportSettings | null): string[] {
  if (!dbSettings) {
    return [
      "Tous mobilisés pour une douane d'action et d'excellence !",
      'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
      'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
      'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
    ];
  }

  return [
    dbSettings.contenu_pied_page,
    'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
    'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
    'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
  ];
}

/**
 * Type guard to check if settings are loaded
 */
export function isSettingsLoaded(settings: unknown): settings is ReportSettings {
  return settings !== null && typeof settings === 'object' && 'id' in settings;
}
