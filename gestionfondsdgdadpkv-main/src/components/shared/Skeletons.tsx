import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

// Base Skeleton with animation
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "skeleton rounded-md",
        className
      )}
      style={style}
    />
  );
}

// Stat Card Skeleton
export function StatCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div 
      className="stat-card animate-fade-in"
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

// Stats Grid Skeleton
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(count)].map((_, i) => (
        <StatCardSkeleton key={i} delay={i} />
      ))}
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton 
            className={cn(
              "h-5",
              i === 0 ? "w-16" : i === columns - 1 ? "w-20" : "w-full max-w-[150px]"
            )}
          />
        </td>
      ))}
    </tr>
  );
}

// Table Skeleton with header and rows
export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="bg-card border rounded-xl overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton 
                    className="h-4"
                    style={{ 
                      width: `${60 + Math.random() * 40}%`,
                      animationDelay: `${i * 100}ms`
                    }} 
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(rows)].map((_, rowIndex) => (
              <TableRowSkeleton key={rowIndex} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Page Header Skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 animate-fade-in">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 mt-4" />
    </div>
  );
}

// Summary Card Skeleton
export function SummaryCardSkeleton() {
  return (
    <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-lg animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="h-10 w-px bg-border" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <div className="h-10 w-px bg-border" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-full max-w-[300px]" />
      </div>
    </div>
  );
}

// Quick Actions Skeleton
export function QuickActionsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {[...Array(count)].map((_, i) => (
        <div 
          key={i}
          className="flex items-center gap-4 p-4 border rounded-lg animate-fade-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Full Page Loading Skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeaderSkeleton />
      <StatsGridSkeleton count={4} />
      <TableSkeleton columns={5} rows={5} />
    </div>
  );
}

// Card Skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 border rounded-lg bg-card animate-fade-in", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
