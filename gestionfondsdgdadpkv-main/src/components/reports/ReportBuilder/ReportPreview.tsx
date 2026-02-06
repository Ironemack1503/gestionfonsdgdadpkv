/**
 * ReportPreview Component
 * Live preview of the report being built
 */

import { useMemo } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReportConfig, ReportField, CalculatedField, ReportGrouping } from './types';
import { cn } from '@/lib/utils';

interface ReportPreviewProps {
  config: ReportConfig;
  data: Record<string, unknown>[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ReportPreview({ config, data, isLoading, onRefresh }: ReportPreviewProps) {
  const visibleFields = useMemo(
    () => config.selectedFields.filter(f => f.isVisible),
    [config.selectedFields]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    
    visibleFields.forEach(field => {
      if (field.type === 'currency' || field.type === 'number') {
        result[field.id] = data.reduce((sum, row) => {
          const value = row[field.name];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
      }
    });
    
    // Add calculated field totals
    config.calculatedFields.forEach(calc => {
      if (calc.formula === 'sum' && calc.sourceField) {
        const sourceField = visibleFields.find(f => f.id === calc.sourceField);
        if (sourceField) {
          result[calc.id] = result[sourceField.id] || 0;
        }
      }
    });
    
    return result;
  }, [visibleFields, data, config.calculatedFields]);

  // Group data if groupings are defined
  const groupedData = useMemo(() => {
    if (config.groupings.length === 0) return { ungrouped: data };
    
    const groups: Record<string, Record<string, unknown>[]> = {};
    const firstGrouping = config.groupings[0];
    
    data.forEach(row => {
      const groupKey = String(row[firstGrouping.field] || 'Non défini');
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(row);
    });
    
    return groups;
  }, [data, config.groupings]);

  const formatValue = (value: unknown, type: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return typeof value === 'number' 
          ? value.toLocaleString('fr-FR', { style: 'currency', currency: 'CDF' })
          : '-';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('fr-FR') : '-';
      case 'date':
        return value instanceof Date 
          ? value.toLocaleDateString('fr-FR')
          : String(value);
      default:
        return String(value);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Aperçu du rapport
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-1', isLoading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {visibleFields.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Aucune colonne sélectionnée</p>
            <p className="text-sm">Glissez des champs depuis la liste pour construire votre rapport</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[500px] rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  {visibleFields.map(field => (
                    <TableHead key={field.id} className="whitespace-nowrap">
                      {field.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedData).map(([groupKey, rows]) => (
                  <>
                    {config.groupings.length > 0 && (
                      <TableRow key={`group-${groupKey}`} className="bg-accent/30">
                        <TableCell
                          colSpan={visibleFields.length}
                          className="font-semibold"
                        >
                          {config.groupings[0]?.label}: {groupKey}
                        </TableCell>
                      </TableRow>
                    )}
                    {(rows as Record<string, unknown>[]).slice(0, 10).map((row, idx) => (
                      <TableRow key={idx}>
                        {visibleFields.map(field => (
                          <TableCell key={field.id} className="whitespace-nowrap">
                            {formatValue(row[field.name], field.type)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {config.showSubtotals && config.groupings[0]?.showSubtotal && (
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell>Sous-total {groupKey}</TableCell>
                        {visibleFields.slice(1).map(field => (
                          <TableCell key={field.id}>
                            {field.type === 'currency' || field.type === 'number'
                              ? formatValue(
                                  (rows as Record<string, unknown>[]).reduce(
                                    (sum, r) => sum + (typeof r[field.name] === 'number' ? (r[field.name] as number) : 0),
                                    0
                                  ),
                                  field.type
                                )
                              : ''
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    )}
                  </>
                ))}
                
                {/* Totals row */}
                {config.showTotals && (
                  <TableRow className="bg-primary/10 font-bold border-t-2">
                    <TableCell>TOTAL GÉNÉRAL</TableCell>
                    {visibleFields.slice(1).map(field => (
                      <TableCell key={field.id}>
                        {totals[field.id] !== undefined
                          ? formatValue(totals[field.id], field.type)
                          : ''
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {data.length > 10 && (
              <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30 border-t">
                Affichage limité à 10 lignes par groupe. Le rapport complet contiendra {data.length} lignes.
              </div>
            )}
          </div>
        )}
        
        {/* Calculated fields summary */}
        {config.calculatedFields.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium mb-3">Champs calculés</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {config.calculatedFields.map(calc => (
                <div key={calc.id} className="text-center p-2 bg-background rounded">
                  <p className="text-xs text-muted-foreground">{calc.label}</p>
                  <p className="text-lg font-bold text-primary">
                    {totals[calc.id] !== undefined
                      ? totals[calc.id].toLocaleString('fr-FR', { style: 'currency', currency: 'CDF' })
                      : 'N/A'
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
