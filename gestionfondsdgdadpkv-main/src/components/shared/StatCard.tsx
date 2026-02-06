import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "info";
  delay?: number;
}

const variantStyles = {
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]",
  },
  success: {
    iconBg: "bg-success-light",
    iconColor: "text-success",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(var(--success)/0.15)]",
  },
  warning: {
    iconBg: "bg-warning-light",
    iconColor: "text-warning",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(var(--warning)/0.15)]",
  },
  info: {
    iconBg: "bg-info-light",
    iconColor: "text-info",
    glowColor: "group-hover:shadow-[0_0_30px_hsl(var(--info)/0.15)]",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  delay = 0,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -4, 
        transition: { duration: 0.2, ease: "easeOut" } 
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "stat-card group relative overflow-hidden cursor-default",
        styles.glowColor
      )}
    >
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        whileHover={{ translateX: "200%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <motion.p 
            className="text-sm font-medium text-muted-foreground truncate"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.1 }}
          >
            {title}
          </motion.p>
          <motion.p 
            className="mt-2 text-xl sm:text-2xl font-bold text-foreground truncate"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
          >
            {value}
          </motion.p>
          {subtitle && (
            <motion.p 
              className="mt-1 text-xs text-muted-foreground truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
            >
              {subtitle}
            </motion.p>
          )}
          {trend && (
            <motion.div 
              className="mt-2 flex items-center gap-1 flex-wrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.35 }}
            >
              <motion.span
                whileHover={{ scale: 1.1 }}
                className={cn(
                  "text-xs font-medium inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full cursor-default",
                  trend.isPositive 
                    ? "text-success bg-success-light" 
                    : "text-destructive bg-destructive/10"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </motion.span>
              <span className="text-xs text-muted-foreground">vs mois dernier</span>
            </motion.div>
          )}
        </div>
        <motion.div 
          className={cn(
            "p-3 rounded-xl flex-shrink-0", 
            styles.iconBg
          )}
          whileHover={{ scale: 1.15, rotate: 6 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", styles.iconColor)} />
        </motion.div>
      </div>
    </motion.div>
  );
}
