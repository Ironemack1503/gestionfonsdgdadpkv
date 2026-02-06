import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback, memo } from "react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  showPagination?: boolean;
}

function DataTableComponent<T extends { id: string | number }>({
  columns,
  data,
  emptyMessage = "Aucune donnée disponible",
  onRowClick,
  pageSize = 10,
  showPagination = true,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = useMemo(() => Math.ceil(data.length / pageSize), [data.length, pageSize]);
  
  const paginatedData = useMemo(() => {
    if (!showPagination || data.length <= pageSize) return data;
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize, showPagination]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(prev => Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const goToFirst = useCallback(() => goToPage(1), [goToPage]);
  const goToPrev = useCallback(() => setCurrentPage(p => Math.max(1, p - 1)), []);
  const goToNext = useCallback(() => setCurrentPage(p => Math.min(totalPages, p + 1)), [totalPages]);
  const goToLast = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={String(column.key)} 
                  className={cn(
                    column.className,
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIndex) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "table-row-animated animate-fade-in-up",
                    onRowClick && "cursor-pointer"
                  )}
                  style={{ animationDelay: `${rowIndex * 30}ms`, animationFillMode: 'both' }}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className={column.className}>
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {showPagination && data.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Affichage {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, data.length)} sur {data.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToFirst}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToPrev}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToNext}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToLast}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export memoized component
export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;
