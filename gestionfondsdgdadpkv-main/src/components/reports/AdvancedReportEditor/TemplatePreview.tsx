/**
 * Template Preview Component
 * Live preview of the report template with applied styles
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReportTemplate, TableColumn } from './types';
import { WatermarkConfig } from './WatermarkEditor';
import { formatMontant } from '@/lib/utils';
import dgdaLogo from '@/assets/dgda-logo-new.jpg';

interface TemplatePreviewProps {
  template: ReportTemplate;
  data: Record<string, unknown>[];
  title: string;
  subtitle?: string;
  period?: string;
  watermarkConfig?: WatermarkConfig;
}

export function TemplatePreview({ template, data, title, subtitle, period, watermarkConfig }: TemplatePreviewProps) {
  const formatValue = (value: unknown, type: string): string => {
    if (value === null || value === undefined || value === '') return '';
    
    switch (type) {
      case 'currency':
        return formatMontant(Number(value), { showCurrency: false });
      case 'date':
        if (typeof value === 'string' && value) {
          return new Date(value).toLocaleDateString('fr-FR');
        }
        return String(value);
      case 'number':
        return Number(value).toLocaleString('fr-FR');
      default:
        return String(value);
    }
  };

  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    template.columns.forEach(col => {
      if (col.type === 'currency' || col.type === 'number') {
        result[col.key] = data.reduce((sum, row) => {
          const value = row[col.key];
          return sum + (typeof value === 'number' ? value : Number(value) || 0);
        }, 0);
      }
    });
    return result;
  }, [data, template.columns]);

  const isLandscape = template.orientation === 'landscape';
  
  // Get watermark settings
  const wmConfig = watermarkConfig || template.watermarkConfig;
  const showWatermark = wmConfig?.enabled || !!template.watermark;
  const wmText = wmConfig?.text || template.watermark || 'ORIGINAL';
  const wmOpacity = wmConfig?.opacity || 15;
  const wmFontSize = wmConfig?.fontSize || 60;
  const wmRotation = wmConfig?.rotation || 45;
  const wmColor = wmConfig?.color || '#cccccc';
  const wmPosition = wmConfig?.position || 'diagonal';
  const wmType = wmConfig?.type || 'text';
  const wmImageUrl = wmConfig?.imageUrl;
  const wmImageSize = wmConfig?.imageSize || 40;

  return (
    <Card className={`bg-white shadow-lg overflow-hidden relative ${isLandscape ? 'aspect-[1.414/1]' : 'aspect-[1/1.414]'}`}>
      {/* Watermark overlay */}
      {showWatermark && (
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden z-10"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {wmType === 'image' && wmImageUrl ? (
            // Image watermark
            wmPosition === 'tiled' ? (
              <div 
                className="absolute inset-0"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(4, 1fr)',
                  gap: '20px',
                  padding: '40px',
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-center"
                    style={{
                      transform: `rotate(-${wmRotation}deg)`,
                      opacity: wmOpacity / 100,
                    }}
                  >
                    <img 
                      src={wmImageUrl} 
                      alt="Watermark" 
                      style={{ 
                        width: `${wmImageSize * 0.4}%`,
                        height: 'auto',
                        objectFit: 'contain',
                      }} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div 
                style={{
                  transform: wmPosition === 'diagonal' ? `rotate(-${wmRotation}deg)` : 'none',
                  opacity: wmOpacity / 100,
                }}
              >
                <img 
                  src={wmImageUrl} 
                  alt="Watermark" 
                  style={{ 
                    width: `${wmImageSize}%`,
                    height: 'auto',
                    objectFit: 'contain',
                  }} 
                />
              </div>
            )
          ) : wmPosition === 'tiled' ? (
            // Text watermark - tiled
            <div 
              className="absolute inset-0"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(4, 1fr)',
                gap: '20px',
                padding: '40px',
              }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-center"
                  style={{
                    transform: `rotate(-${wmRotation}deg)`,
                    fontSize: `${wmFontSize * 0.3}px`,
                    fontWeight: 'bold',
                    color: wmColor,
                    opacity: wmOpacity / 100,
                    fontFamily: 'Times New Roman, serif',
                  }}
                >
                  {wmText}
                </div>
              ))}
            </div>
          ) : (
            // Text watermark - center or diagonal
            <div 
              style={{
                transform: wmPosition === 'diagonal' ? `rotate(-${wmRotation}deg)` : 'none',
                fontSize: `${wmFontSize}px`,
                fontWeight: 'bold',
                color: wmColor,
                opacity: wmOpacity / 100,
                fontFamily: 'Times New Roman, serif',
                whiteSpace: 'nowrap',
              }}
            >
              {wmText}
            </div>
          )}
        </div>
      )}
      <ScrollArea className="h-full">
        <CardContent className="p-6" style={{ fontFamily: template.styles.bodyFont, fontSize: `${template.styles.bodySize}pt` }}>
          {/* Header */}
          <div className="border-b-2 pb-4 mb-4" style={{ borderColor: template.styles.accentColor }}>
            <div className="flex items-start gap-4">
              {template.header.showLogo && template.header.logoPosition === 'left' && (
                <img src={dgdaLogo} alt="DGDA" className="w-16 h-16 object-contain" />
              )}
              
              <div className="flex-1 text-center">
                <p className="text-sm italic">{template.header.line1}</p>
                <p className="text-sm font-bold">{template.header.line2}</p>
                <p className="text-sm font-bold">{template.header.line3}</p>
                <p className="text-sm font-bold italic">{template.header.line4}</p>
              </div>
              
              {template.header.showLogo && template.header.logoPosition === 'right' && (
                <img src={dgdaLogo} alt="DGDA" className="w-16 h-16 object-contain" />
              )}
            </div>
            
            {template.header.referenceNumber && (
              <p className="text-xs mt-2 font-medium">
                {template.header.referenceNumber}{period ? `/2024` : ''}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <h1 
              className="font-bold underline uppercase"
              style={{ 
                fontFamily: template.styles.titleFont, 
                fontSize: `${template.styles.titleSize}pt` 
              }}
            >
              {title}
            </h1>
            {subtitle && <p className="text-sm mt-1 italic">{subtitle}</p>}
          </div>

          {/* Table */}
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {template.columns.map((col) => (
                  <th 
                    key={col.id}
                    className="border p-1.5 font-bold"
                    style={{ 
                      borderColor: template.styles.borderColor,
                      textAlign: col.align || 'left',
                      width: col.width ? `${col.width}%` : 'auto',
                    }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 15).map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  style={{ 
                    backgroundColor: rowIndex % 2 === 1 ? template.styles.alternateRowColor : 'transparent'
                  }}
                >
                  {template.columns.map((col) => (
                    <td 
                      key={col.id}
                      className="border p-1"
                      style={{ 
                        borderColor: template.styles.borderColor,
                        textAlign: col.align || (col.type === 'currency' || col.type === 'number' ? 'right' : 'left'),
                      }}
                    >
                      {formatValue(row[col.key], col.type)}
                    </td>
                  ))}
                </tr>
              ))}
              
              {/* Totals row */}
              {template.showTotals && (
                <tr className="font-bold" style={{ backgroundColor: '#e5e7eb' }}>
                  {template.columns.map((col, colIndex) => (
                    <td 
                      key={col.id}
                      className="border p-1"
                      style={{ 
                        borderColor: template.styles.borderColor,
                        textAlign: col.align || (col.type === 'currency' || col.type === 'number' ? 'right' : 'left'),
                      }}
                    >
                      {colIndex === 0 
                        ? 'TOTAL' 
                        : (col.type === 'currency' || col.type === 'number') 
                          ? formatValue(totals[col.key], col.type)
                          : ''
                      }
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>

          {data.length > 15 && (
            <p className="text-center text-xs text-muted-foreground mt-2 italic">
              ... et {data.length - 15} autres lignes
            </p>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-center text-xs" style={{ borderColor: '#e5e7eb' }}>
            <p className="italic text-muted-foreground">{template.footer.slogan}</p>
            <p className="mt-1 text-muted-foreground">{template.footer.address}</p>
            <p className="text-muted-foreground">{template.footer.contact}</p>
            <p className="text-muted-foreground text-[10px]">{template.footer.email}</p>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
