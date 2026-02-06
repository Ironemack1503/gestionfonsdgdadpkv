import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  duration: 0.25,
};

// Route names mapping - Based on VB6 MENUCAISSS/MENUGEN structure
const routeNames: Record<string, string> = {
  // Section Caisse
  "/recettes": "Entrées",
  "/recettes/new": "Nouvelle Entrée",
  "/depenses": "Sorties",
  "/depenses/new": "Nouvelle Sortie",
  "/feuille-caisse": "Feuille de Caisse",
  // Section Programmation
  "/programmation": "Programmation Mensuelle",
  // Section Rapports
  "/rapports": "Rapports",
  "/rapports/index": "Liste des Bons",
  "/rapports/liste-bons": "Liste des Bons",
  "/rapports/mensuels": "Rapports Mensuels",
  "/rapports/annuels": "Rapports Annuels",
  "/rapports/feuille-caisse": "Feuille de Caisse",
  "/rapports/sommaire": "Sommaire",
  "/rapports/etat-financier": "État Financier",
  "/rapports/programmation": "Programmation",
  "/rapports/sommaires-imp": "Sommaires IMP",
  "/rapports/builder": "Constructeur de Rapports",
  // Section Edition
  "/admin": "Utilisateurs",
  "/utilisateurs": "Gestion des Utilisateurs",
  "/rubriques": "Rubriques",
  "/services": "Services",
  // Section Administration
  "/dashboard": "Tableau de bord",
  "/securite": "Sécurité",
};

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const currentPageName = routeNames[currentPath] || "Page";

  // Navigation history for back button
  const canGoBack = window.history.length > 1 && currentPath !== "/dashboard";

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <main className="flex-1 lg:ml-72 overflow-auto scroll-smooth">
        {/* Header with Breadcrumb */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/60 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Back Button & Breadcrumb */}
              <div className="flex items-center gap-3">
                {canGoBack && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="h-9 w-9 rounded-lg border border-border/50 hover:bg-secondary/10 hover:border-secondary/30"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                
                <nav className="breadcrumb" aria-label="Breadcrumb">
                  <Link
                    to="/dashboard"
                    className="breadcrumb-item"
                  >
                    <Home className="w-4 h-4" />
                    <span className="hidden sm:inline">Accueil</span>
                  </Link>
                  
                  <ChevronRight className="breadcrumb-separator w-4 h-4" />
                  <span className="breadcrumb-current">{currentPageName}</span>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="p-4 sm:p-6 lg:p-8"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
