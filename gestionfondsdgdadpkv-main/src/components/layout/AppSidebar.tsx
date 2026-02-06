import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  LogOut,
  Menu,
  X,
  User,
  FilePlus,
  FileEdit,
  Users,
  Tags,
  Building2,
  FileText,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  ListChecks,
  FileBarChart,
  FileSpreadsheet,
  BookOpen,
  ChevronDown,
  Wallet,
  Settings,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import dgdaLogo from "@/assets/dgda-logo-new.jpg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  adminOnly?: boolean;
  section?: string;
}

interface SectionConfig {
  icon: React.ElementType;
  color: string;
}

const sectionIcons: Record<string, SectionConfig> = {
  Caisse: { icon: Wallet, color: "text-primary" },
  Programmation: { icon: Calendar, color: "text-warning" },
  Rapports: { icon: BarChart3, color: "text-info" },
  Edition: { icon: Settings, color: "text-secondary" },
  Administration: { icon: Shield, color: "text-accent" },
};

// Structure du menu basée sur le VB6 MENUCAISSS et MENUGEN
const menuItems: MenuItem[] = [
  // Section Caisse - Opérations quotidiennes
  {
    title: "Nouvelle Recette",
    icon: FilePlus,
    path: "/recettes/new",
    section: "Caisse",
  },
  {
    title: "Nouvelle Dépense",
    icon: FilePlus,
    path: "/depenses/new",
    section: "Caisse",
  },
  {
    title: "Modifier Recettes",
    icon: FileEdit,
    path: "/recettes/modifier",
    section: "Caisse",
  },
  {
    title: "Modifier Dépenses",
    icon: FileEdit,
    path: "/depenses/modifier",
    section: "Caisse",
  },
  {
    title: "Feuille de Caisse",
    icon: FileSpreadsheet,
    path: "/feuille-caisse",
    section: "Caisse",
  },
  {
    title: "Liste des Bons",
    icon: ListChecks,
    path: "/rapports/liste-bons",
    section: "Caisse",
  },
  // Section Programmation
  {
    title: "Programmation Mensuelle",
    icon: Calendar,
    path: "/programmation",
    section: "Programmation",
  },
  // Section Rapports
  {
    title: "Rapports Mensuels",
    icon: FileBarChart,
    path: "/rapports/mensuels",
    section: "Rapports",
  },
  {
    title: "Rapports Annuels",
    icon: BookOpen,
    path: "/rapports/annuels",
    section: "Rapports",
  },
  {
    title: "Tous les Rapports",
    icon: FileText,
    path: "/rapports",
    section: "Rapports",
  },
  // Section Edition - Configuration
  {
    title: "Utilisateurs",
    icon: Users,
    path: "/utilisateurs",
    section: "Administration",
    adminOnly: true,
  },
  {
    title: "Rubriques",
    icon: Tags,
    path: "/rubriques",
    section: "Edition",
  },
  {
    title: "Services",
    icon: Building2,
    path: "/services",
    section: "Edition",
  },
  // Section Administration
  {
    title: "Tableau de bord",
    icon: LayoutDashboard,
    path: "/dashboard",
    section: "Administration",
  },
  {
    title: "Sécurité",
    icon: Shield,
    path: "/securite",
    section: "Administration",
    adminOnly: true,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useLocalAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter menu items based on role and group by section
  const groupedMenuItems = useMemo(() => {
    const filtered = menuItems.filter((item) => !item.adminOnly || isAdmin);
    const groups: Record<string, MenuItem[]> = {};
    
    filtered.forEach((item) => {
      const section = item.section || 'Autre';
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(item);
    });
    
    return groups;
  }, [isAdmin]);

  // Find which section contains the active route
  const activeSection = useMemo(() => {
    for (const [section, items] of Object.entries(groupedMenuItems)) {
      if (items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))) {
        return section;
      }
    }
    return null;
  }, [location.pathname, groupedMenuItems]);

  // Track open sections - initialize with active section
  const [openSections, setOpenSections] = useState<string[]>(
    activeSection ? [activeSection] : []
  );

  // Update open sections when active route changes
  useEffect(() => {
    if (activeSection && !openSections.includes(activeSection)) {
      setOpenSections(prev => [...prev, activeSection]);
    }
  }, [activeSection]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsMobileOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const getUserInitials = () => {
    const name = user?.full_name || user?.username || '';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };

  const getUserName = () => {
    return user?.full_name || user?.username || 'Utilisateur';
  };

  const getRoleBadgeStyles = () => {
    switch (user?.role) {
      case 'admin':
        return "bg-accent/90 text-accent-foreground";
      case 'instructeur':
        return "bg-secondary/80 text-secondary-foreground";
      default:
        return "bg-sidebar-accent text-sidebar-foreground";
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin': return 'Admin';
      case 'instructeur': return 'Instructeur';
      default: return 'Consultation';
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo & Header */}
      <div className="p-5 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-12 h-12 rounded-xl bg-white/10 p-1 transition-transform duration-300 group-hover:scale-105">
              <img 
                src={dgdaLogo} 
                alt="DGDA Logo" 
                className="w-full h-full rounded-lg object-contain" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-lg tracking-tight">GestCaisse</h1>
            <p className="text-xs text-sidebar-foreground/50">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation with Accordion */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scroll-container">
        <Accordion 
          type="multiple" 
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-2"
        >
          {Object.entries(groupedMenuItems).map(([section, items]) => {
            const sectionConfig = sectionIcons[section] || { icon: FileText, color: "text-muted-foreground" };
            const SectionIcon = sectionConfig.icon;
            const hasActiveItem = items.some(item => isActive(item.path));
            
            return (
              <AccordionItem 
                key={section} 
                value={section}
                className="border-none"
              >
                <AccordionTrigger
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold",
                    "hover:bg-sidebar-accent/50 hover:no-underline transition-all duration-200",
                    "data-[state=open]:bg-sidebar-accent/40",
                    hasActiveItem && "bg-sidebar-accent/30 text-sidebar-foreground"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    "bg-sidebar-accent/40",
                    hasActiveItem && "bg-primary/20"
                  )}>
                    <SectionIcon className={cn("w-4 h-4", sectionConfig.color)} />
                  </div>
                  <span className="flex-1 text-left text-sidebar-foreground/90">
                    {section}
                  </span>
                  {hasActiveItem && (
                    <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                  )}
                </AccordionTrigger>
                
                <AccordionContent className="pt-1 pb-0">
                  <div className="ml-4 pl-4 border-l border-sidebar-border/30 space-y-1">
                    {items.map((item) => (
                      <NavLink
                        key={item.title}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                          "transition-all duration-200",
                          isActive(item.path) 
                            ? "bg-primary/20 text-sidebar-foreground font-medium" 
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                        )}
                      >
                        <item.icon className={cn(
                          "w-4 h-4",
                          isActive(item.path) ? "text-primary" : "text-sidebar-foreground/50"
                        )} />
                        <span className="flex-1">{item.title}</span>
                        {isActive(item.path) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </NavLink>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Message si pas admin */}
        {!isAdmin && (
          <div className="px-4 py-6 text-center mt-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sidebar-accent/30 flex items-center justify-center">
              <User className="w-8 h-8 text-sidebar-foreground/50" />
            </div>
            <p className="text-sm text-sidebar-foreground/70 mb-2">
              Accès limité
            </p>
            <p className="text-xs text-sidebar-foreground/50">
              Contactez un administrateur pour obtenir plus de permissions.
            </p>
          </div>
        )}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent/20">
        <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-sidebar-accent/40 backdrop-blur-sm">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-secondary-foreground">{getUserInitials()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{getUserName()}</p>
              {user?.role && (
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider",
                  getRoleBadgeStyles()
                )}>
                  {getRoleLabel()}
                </span>
              )}
            </div>
            <p className="text-xs text-sidebar-foreground/50 truncate">@{user?.username}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold",
            "bg-sidebar-accent/40 text-sidebar-foreground/80",
            "hover:bg-destructive hover:text-destructive-foreground",
            "transition-all duration-300 group"
          )}
        >
          <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        className={cn(
          "mobile-menu-trigger tap-highlight-none",
          isMobileOpen && "mobile-menu-trigger-open"
        )}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={isMobileOpen}
      >
        <div className="relative w-5 h-5">
          <X className={cn(
            "w-5 h-5 absolute inset-0 transition-all duration-300",
            isMobileOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
          )} />
          <Menu className={cn(
            "w-5 h-5 absolute inset-0 transition-all duration-300",
            isMobileOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
          )} />
        </div>
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mobile-overlay"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar-container",
          !isMobileOpen && "sidebar-hidden"
        )}
        role="navigation"
        aria-label="Navigation principale"
      >
        <SidebarContent />
      </aside>
    </>
  );
}