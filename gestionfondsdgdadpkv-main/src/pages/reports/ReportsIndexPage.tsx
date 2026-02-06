/**
 * Reports Index Page
 * Main entry point for the reporting module with navigation cards
 */

import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  ClipboardList, 
  BarChart3, 
  Calendar, 
  TrendingUp,
  Settings,
  FileSpreadsheet,
  Printer,
  Building2,
  Users,
  Receipt,
  ArrowUpDown,
  AlertTriangle,
  Search,
  PieChart,
  Eye
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReportCard {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  bgColor: string;
}

const reportCards: ReportCard[] = [
  {
    title: 'Feuille de Caisse',
    description: 'État détaillé des opérations de caisse avec solde, recettes, dépenses et balance',
    icon: ClipboardList,
    path: '/rapports/feuille-caisse',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Sommaire',
    description: 'Résumé des opérations groupées par catégorie avec totaux et balances',
    icon: BarChart3,
    path: '/rapports/sommaire',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    title: 'Synthèse de Caisse',
    description: 'Analyse consolidée entrées/sorties avec vues par rubrique, service et évolution mensuelle',
    icon: PieChart,
    path: '/rapports/synthese',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    title: 'Programmation des Dépenses',
    description: 'État prévisionnel des dépenses mensuelles avec montants programmés',
    icon: Calendar,
    path: '/rapports/programmation',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    title: 'États Financiers',
    description: 'Bilan financier avec calcul du bénéfice/déficit et analyse des performances',
    icon: TrendingUp,
    path: '/rapports/etat-financier',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    title: 'Rapport Approvisionnement',
    description: 'Analyse comparative Recettes vs Dépenses avec évolution journalière et par rubrique',
    icon: ArrowUpDown,
    path: '/rapports/approvisionnement',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Rapport Détaillé',
    description: 'Vue complète de toutes les transactions avec filtres avancés et tri',
    icon: Search,
    path: '/rapports/transactions-detail',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    title: 'Rapport Contentieux',
    description: 'Suivi des transactions en litige, anomalies et dossiers en attente de résolution',
    icon: AlertTriangle,
    path: '/rapports/contentieux',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    title: 'Liste des Rubriques',
    description: 'Catégories budgétaires avec statistiques d\'utilisation et totaux par année',
    icon: FileSpreadsheet,
    path: '/rapports/liste-rubriques',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    title: 'Liste des Bons de Caisse',
    description: 'Bons de recettes (entrées) et sorties de caisse avec filtres par période',
    icon: Receipt,
    path: '/rapports/liste-bons',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    title: 'Liste des Services',
    description: 'Services et provenances enregistrés avec statistiques d\'activité',
    icon: Building2,
    path: '/rapports/liste-services',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
  },
  {
    title: 'Liste des Utilisateurs',
    description: 'Comptes utilisateurs du système avec rôles et statuts (Admin uniquement)',
    icon: Users,
    path: '/rapports/liste-utilisateurs',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  {
    title: 'Exemples PDF',
    description: 'Visualisez le rendu des rapports PDF avec des données fictives de démonstration',
    icon: Eye,
    path: '/rapports/exemples-pdf',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
];

export default function ReportsIndexPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports de Caisse"
        description="Module de reporting financier avancé - Génération d'états officiels PDF, Excel et Word"
      />

      {/* Introduction Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Module de Reporting Avancé</h3>
              <p className="text-muted-foreground mb-4">
                Équivalent à SAP Crystal Reports, ce module vous permet de générer des états financiers officiels 
                avec calcul automatique du solde antérieur, formules comptables intégrées, et exports multiformats.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                  <FileText className="w-3 h-3" /> PDF
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                  <FileText className="w-3 h-3" /> Word
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                  <Printer className="w-3 h-3" /> Impression
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((report) => (
          <NavLink key={report.path} to={report.path}>
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50 group cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-lg transition-colors', report.bgColor, 'group-hover:bg-primary/20')}>
                    <report.icon className={cn('w-6 h-6', report.color, 'group-hover:text-primary')} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="px-2 py-0.5 bg-muted rounded">PDF</span>
                  <span className="px-2 py-0.5 bg-muted rounded">Excel</span>
                  <span className="px-2 py-0.5 bg-muted rounded">Word</span>
                </div>
              </CardContent>
            </Card>
          </NavLink>
        ))}
      </div>

      {/* Features Section */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                Calculs Automatiques
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Solde de clôture mois antérieur</li>
                <li>• TOTAL = Somme(Recettes)</li>
                <li>• ENCAISSE = Recettes - Dépenses</li>
                <li>• BALANCE = Solde + Encaisse</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Filtres Avancés
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Période (mois/année)</li>
                <li>• Catégorie de dépenses</li>
                <li>• Utilisateur (à venir)</li>
                <li>• Mode de paiement (à venir)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-info"></span>
                Export Officiel
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Logo institutionnel</li>
                <li>• En-tête personnalisable</li>
                <li>• Pied de page officiel</li>
                <li>• Montant en lettres</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Link */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <NavLink to="/parametres/rapports" className="flex items-center gap-4 group">
            <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <Settings className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h4 className="font-medium group-hover:text-primary transition-colors">Paramètres de mise en forme</h4>
              <p className="text-sm text-muted-foreground">
                Personnalisez le logo, les en-têtes, pieds de page, couleurs et polices de vos rapports
              </p>
            </div>
          </NavLink>
        </CardContent>
      </Card>
    </div>
  );
}
