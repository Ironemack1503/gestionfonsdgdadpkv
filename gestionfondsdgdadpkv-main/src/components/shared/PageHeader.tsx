import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          {badge && (
            <span className="badge-secure mb-2 inline-flex">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {badge}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
