import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Receipt,
  CreditCard,
  ClipboardList,
  FileText,
  FolderOpen,
  Plus,
  Eye,
  Printer
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { AlertBanner } from "@/components/alerts/AlertBanner";
import { useAlertChecker } from "@/hooks/useAlertChecker";
import { cn, formatMontant } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export default function DashboardPage() {
  const { stats, isLoading } = useDashboardStats();
  
  useAlertChecker();

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Quick access operations
  const quickOperations = [
    {
      to: "/caisse/recettes",
      icon: ArrowUpRight,
      title: "Nouvelle recette",
      description: "Enregistrer une entrée de fonds",
      variant: "success" as const,
    },
    {
      to: "/caisse/depenses",
      icon: ArrowDownRight,
      title: "Nouvelle dépense",
      description: "Enregistrer une sortie de fonds",
      variant: "destructive" as const,
    },
    {
      to: "/caisse/feuille",
      icon: ClipboardList,
      title: "Feuille de caisse",
      description: "Consulter l'état du jour",
      variant: "primary" as const,
    },
    {
      to: "/caisse/programmation",
      icon: Calendar,
      title: "Programmation",
      description: "Planifier les dépenses",
      variant: "accent" as const,
    },
  ];

  // Quick access reports
  const quickReports = [
    {
      to: "/rapports/mensuel",
      icon: FileText,
      title: "Rapport mensuel",
    },
    {
      to: "/rapports/annuel",
      icon: TrendingUp,
      title: "Rapport annuel",
    },
    {
      to: "/caisse/rubriques",
      icon: FolderOpen,
      title: "Rubriques",
    },
  ];

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case "success":
        return {
          bg: "bg-success/10 hover:bg-success/15",
          icon: "icon-container-success",
          border: "border-success/20 hover:border-success/40",
        };
      case "destructive":
        return {
          bg: "bg-destructive/10 hover:bg-destructive/15",
          icon: "bg-gradient-to-br from-destructive to-destructive/70 text-destructive-foreground shadow-md",
          border: "border-destructive/20 hover:border-destructive/40",
        };
      case "primary":
        return {
          bg: "bg-primary/10 hover:bg-primary/15",
          icon: "icon-container-primary",
          border: "border-primary/20 hover:border-primary/40",
        };
      case "accent":
        return {
          bg: "bg-accent/20 hover:bg-accent/30",
          icon: "icon-container-accent",
          border: "border-accent/30 hover:border-accent/50",
        };
      default:
        return {
          bg: "bg-secondary/10 hover:bg-secondary/15",
          icon: "icon-container-secondary",
          border: "border-secondary/20 hover:border-secondary/40",
        };
    }
  };

  return (
    <motion.div 
      className="page-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AlertBanner />
      
      {/* Header */}
      <motion.div variants={itemVariants} className="page-header">
        <div>
          <h1 className="page-title gradient-text">Tableau de bord</h1>
          <p className="page-subtitle flex items-center gap-2 mt-2">
            <Calendar className="w-4 h-4" />
            {today}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild className="gap-2 rounded-xl border-2 hover:border-success/50 hover:bg-success/5">
            <Link to="/caisse/recettes">
              <ArrowUpRight className="w-4 h-4 text-success" />
              <span className="hidden sm:inline">Nouvelle</span> Recette
            </Link>
          </Button>
          <Button asChild className="btn-primary-gradient gap-2 rounded-xl">
            <Link to="/caisse/depenses">
              <ArrowDownRight className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle</span> Dépense
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <motion.div variants={itemVariants}>
        <div className="dashboard-grid">
          {/* Solde de caisse - Highlighted */}
          <motion.div 
            className="card-highlight sm:col-span-2 lg:col-span-1"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium opacity-80">Solde de caisse</p>
                  <p className="text-xs opacity-60">Total actuel disponible</p>
                </div>
              </div>
              {isLoading ? (
                <div className="skeleton h-10 w-40 rounded-lg bg-white/20" />
              ) : (
                <p className="amount-large text-white">
                  {formatMontant(stats.soldeCaisse, { showCurrency: true })}
                </p>
              )}
            </div>
            <div className="absolute top-4 right-4 opacity-10">
              <Wallet className="w-24 h-24" />
            </div>
          </motion.div>

          {/* Recettes du mois */}
          <motion.div 
            className="stat-card group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="icon-container-success group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="status-badge status-badge-success">
                <ArrowUpRight className="w-3 h-3" />
                Entrées
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Recettes du mois</p>
            {isLoading ? (
              <div className="skeleton h-8 w-32 rounded" />
            ) : (
              <p className="text-2xl font-bold text-success tabular-nums">
                +{formatMontant(stats.recettesMois)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">FC ce mois</p>
          </motion.div>

          {/* Dépenses du mois */}
          <motion.div 
            className="stat-card group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-destructive to-destructive/70 text-destructive-foreground w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <TrendingDown className="w-5 h-5" />
              </div>
              <span className="status-badge status-badge-error">
                <ArrowDownRight className="w-3 h-3" />
                Sorties
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Dépenses du mois</p>
            {isLoading ? (
              <div className="skeleton h-8 w-32 rounded" />
            ) : (
              <p className="text-2xl font-bold text-destructive tabular-nums">
                -{formatMontant(stats.depensesMois)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">FC ce mois</p>
          </motion.div>

          {/* Programmation restante */}
          <motion.div 
            className="stat-card group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="icon-container-accent group-hover:scale-110 transition-transform">
                <PiggyBank className="w-5 h-5" />
              </div>
              <span className="status-badge status-badge-warning">
                Budget
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Programmation restante</p>
            {isLoading ? (
              <div className="skeleton h-8 w-32 rounded" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">
                {formatMontant(stats.programmationRestante)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">FC disponible</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Operations */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 shadow-card overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardTitle className="flex items-center gap-3">
              <div className="icon-container-primary">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg">Opérations rapides</span>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">Accès direct aux fonctions principales</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickOperations.map((op, index) => {
                const styles = getVariantStyles(op.variant);
                return (
                  <motion.div
                    key={op.to}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={op.to}
                      className={cn(
                        "flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-300",
                        styles.bg,
                        styles.border
                      )}
                    >
                      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-4", styles.icon)}>
                        <op.icon className="w-7 h-7" />
                      </div>
                      <h3 className="font-semibold text-foreground">{op.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{op.description}</p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions & Quick Reports */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={itemVariants}
      >
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 border-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="icon-container-secondary">
                <Receipt className="w-5 h-5" />
              </div>
              <span>Dernières opérations</span>
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to="/caisse/feuille">
                <Eye className="w-4 h-4" />
                Voir tout
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : stats.recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Wallet className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">Aucune opération récente</p>
                <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
                  Commencez par ajouter une recette ou une dépense pour voir l'historique ici
                </p>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" size="sm" asChild className="gap-2 rounded-xl">
                    <Link to="/caisse/recettes">
                      <ArrowUpRight className="w-4 h-4 text-success" />
                      Recette
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="btn-primary-gradient gap-2 rounded-xl">
                    <Link to="/caisse/depenses">
                      <ArrowDownRight className="w-4 h-4" />
                      Dépense
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.slice(0, 5).map((tx, index) => (
                  <motion.div
                    key={tx.reference}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      tx.type === "Recette" 
                        ? "bg-success/10 text-success" 
                        : "bg-destructive/10 text-destructive"
                    )}>
                      {tx.type === "Recette" ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{tx.motif}</p>
                      <p className="text-xs text-muted-foreground">{tx.date} • {tx.reference}</p>
                    </div>
                    <p className={cn(
                      "font-bold tabular-nums text-sm",
                      tx.type === "Recette" ? "text-success" : "text-destructive"
                    )}>
                      {tx.type === "Recette" ? "+" : "-"}{formatMontant(Math.abs(tx.montant))}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Reports & Actions */}
        <Card className="border-2 shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="icon-container-accent">
                <FileText className="w-5 h-5" />
              </div>
              <span>Accès rapide</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickReports.map((report, index) => (
              <motion.div
                key={report.to}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 6 }}
              >
                <Link
                  to={report.to}
                  className="quick-action-link"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                    <report.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium flex-1">{report.title}</span>
                  <span className="text-muted-foreground/50">→</span>
                </Link>
              </motion.div>
            ))}

            <div className="pt-4 border-t mt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" asChild className="gap-2 rounded-xl h-auto py-3">
                  <Link to="/caisse/feuille" className="flex flex-col items-center text-center">
                    <Eye className="w-4 h-4 mb-1" />
                    <span className="text-xs">Consulter</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="gap-2 rounded-xl h-auto py-3 btn-accent-gradient border-0">
                  <Link to="/rapports/caisse" className="flex flex-col items-center text-center">
                    <Printer className="w-4 h-4 mb-1" />
                    <span className="text-xs">Imprimer</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
