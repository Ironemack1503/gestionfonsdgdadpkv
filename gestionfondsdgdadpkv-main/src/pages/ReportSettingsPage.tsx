import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subWeeks, subMonths, startOfWeek, endOfWeek, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useReportSettings, ReportSettings, defaultReportSettings, convertToExportSettings } from "@/hooks/useReportSettings";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
import { useRecettes } from "@/hooks/useRecettes";
import { useDepenses } from "@/hooks/useDepenses";
import { useProgrammations } from "@/hooks/useProgrammations";
import { useMonthlyStats, useRubriqueStats, MOIS_LABELS } from "@/hooks/useReportStats";
import { LivePDFPreview } from "@/components/reports/LivePDFPreview";
import { 
  exportToPDF, 
  exportToExcel,
  getRecettesExportConfig,
  getDepensesExportConfig,
  getProgrammationsExportConfig,
  getRapportMensuelExportConfig,
} from "@/lib/exportUtils";
import { 
  FileText, 
  Save, 
  RotateCcw, 
  Eye, 
  Image, 
  Type, 
  Layout, 
  Palette,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileDown,
  Landmark,
  Sparkles,
  Minimize2,
  Receipt,
  CreditCard,
  Calendar,
  BarChart3,
  Download,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  FileSearch,
  CalendarIcon,
  X,
  Columns,
  Check,
  GripVertical
} from "lucide-react";
import { toast } from "sonner";
import { formatMontant, cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

// Types de rapports disponibles
const REPORT_TYPES = [
  { id: 'recettes', name: 'Recettes', icon: Receipt, description: 'Liste des recettes enregistrées' },
  { id: 'depenses', name: 'Dépenses', icon: CreditCard, description: 'Liste des dépenses effectuées' },
  { id: 'programmations', name: 'Programmations', icon: Calendar, description: 'Programmations budgétaires' },
  { id: 'mensuel', name: 'Rapport Mensuel', icon: BarChart3, description: 'Statistiques mensuelles' },
];

// Composant d'aperçu PDF miniature
interface PDFPreviewProps {
  settings: Omit<ReportSettings, 'id' | 'created_at' | 'updated_at' | 'updated_by'>;
}

const PDFPreviewMini = ({ settings }: PDFPreviewProps) => {
  const isLandscape = settings.orientation === 'landscape';
  const pageWidth = isLandscape ? 200 : 150;
  const pageHeight = isLandscape ? 150 : 200;
  
  return (
    <div 
      className="bg-white rounded shadow-lg border overflow-hidden"
      style={{ 
        width: pageWidth, 
        height: pageHeight,
        fontFamily: settings.police === 'times' ? 'Times New Roman, serif' : 
                   settings.police === 'courier' ? 'Courier New, monospace' : 'Helvetica, sans-serif'
      }}
    >
      {/* En-tête */}
      <div 
        className="text-white text-center py-2 px-2"
        style={{ backgroundColor: settings.couleur_principale }}
      >
        <div className="flex items-center justify-center gap-1">
          {settings.position_logo === 'gauche' && (
            <div className="w-4 h-4 bg-white/30 rounded flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[6px] font-bold truncate leading-tight">
              {settings.titre_entete || 'TITRE'}
            </p>
            {settings.sous_titre && (
              <p className="text-[5px] opacity-80 truncate leading-tight">
                {settings.sous_titre}
              </p>
            )}
          </div>
          {settings.position_logo === 'droite' && (
            <div className="w-4 h-4 bg-white/30 rounded flex-shrink-0" />
          )}
        </div>
        {settings.position_logo === 'centre' && (
          <div className="w-4 h-4 bg-white/30 rounded mx-auto mt-1" />
        )}
      </div>
      
      {/* Corps du document avec filigrane */}
      <div 
        className="relative flex-1 p-2"
        style={{ 
          paddingTop: `${Math.max(4, settings.marges_haut / 3)}px`,
          paddingBottom: `${Math.max(4, settings.marges_bas / 3)}px`,
          paddingLeft: `${Math.max(4, settings.marges_gauche / 2)}px`,
          paddingRight: `${Math.max(4, settings.marges_droite / 2)}px`,
          height: pageHeight - 50
        }}
      >
        {/* Filigrane */}
        {settings.filigrane_actif && settings.filigrane_texte && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
          >
            <span 
              className="text-[14px] font-bold opacity-10 transform -rotate-45 whitespace-nowrap"
              style={{ color: settings.couleur_principale }}
            >
              {settings.filigrane_texte}
            </span>
          </div>
        )}
        
        {/* Contenu simulé */}
        <div className="space-y-1.5 relative z-10">
          <div className="h-1.5 bg-gray-200 rounded w-3/4" />
          <div className="h-1 bg-gray-100 rounded w-full" />
          <div className="h-1 bg-gray-100 rounded w-5/6" />
          <div className="h-1 bg-gray-100 rounded w-full" />
          <div className="h-1 bg-gray-100 rounded w-2/3" />
          <div className="mt-2 border border-gray-200 rounded p-1">
            <div className="h-1 bg-gray-200 rounded w-full mb-0.5" />
            <div className="h-1 bg-gray-100 rounded w-full" />
            <div className="h-1 bg-gray-100 rounded w-full" />
          </div>
        </div>
      </div>
      
      {/* Pied de page */}
      <div 
        className="text-[5px] text-center py-1 px-1 border-t bg-gray-50"
        style={{ color: settings.couleur_principale }}
      >
        <div className="flex justify-between items-center">
          <span className="truncate flex-1 text-left opacity-70">
            {settings.contenu_pied_page || 'Pied de page'}
          </span>
          <div className="flex gap-1 text-[4px] opacity-50">
            {settings.afficher_date && <span>19/12/2025</span>}
            {settings.afficher_numero_page && <span>Page 1</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant d'aperçu des données du rapport
interface ReportDataPreviewProps {
  reportType: string;
  data: any[];
  isLoading: boolean;
}

const ReportDataPreview = ({ reportType, data, isLoading }: ReportDataPreviewProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune donnée disponible pour ce rapport
      </div>
    );
  }

  const previewData = data.slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground mb-2">
        Aperçu des {Math.min(5, data.length)} premières lignes sur {data.length} total
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-muted">
            <tr>
              {reportType === 'recettes' && (
                <>
                  <th className="px-2 py-1.5 text-left">N° Bon</th>
                  <th className="px-2 py-1.5 text-left">Date</th>
                  <th className="px-2 py-1.5 text-left">Provenance</th>
                  <th className="px-2 py-1.5 text-right">Montant</th>
                </>
              )}
              {reportType === 'depenses' && (
                <>
                  <th className="px-2 py-1.5 text-left">N° Bon</th>
                  <th className="px-2 py-1.5 text-left">Date</th>
                  <th className="px-2 py-1.5 text-left">Bénéficiaire</th>
                  <th className="px-2 py-1.5 text-right">Montant</th>
                </>
              )}
              {reportType === 'programmations' && (
                <>
                  <th className="px-2 py-1.5 text-left">N°</th>
                  <th className="px-2 py-1.5 text-left">Désignation</th>
                  <th className="px-2 py-1.5 text-left">Mois</th>
                  <th className="px-2 py-1.5 text-right">Montant</th>
                </>
              )}
              {reportType === 'mensuel' && (
                <>
                  <th className="px-2 py-1.5 text-left">Mois</th>
                  <th className="px-2 py-1.5 text-right">Recettes</th>
                  <th className="px-2 py-1.5 text-right">Dépenses</th>
                  <th className="px-2 py-1.5 text-right">Solde</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {previewData.map((item: any, index: number) => (
              <tr key={index} className="border-t hover:bg-muted/50">
                {reportType === 'recettes' && (
                  <>
                    <td className="px-2 py-1.5">{item.numero_bon}</td>
                    <td className="px-2 py-1.5">{new Date(item.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-2 py-1.5 truncate max-w-[100px]">{item.provenance}</td>
                    <td className="px-2 py-1.5 text-right font-medium text-green-600">
                      {formatMontant(item.montant, { showCurrency: true })}
                    </td>
                  </>
                )}
                {reportType === 'depenses' && (
                  <>
                    <td className="px-2 py-1.5">{item.numero_bon}</td>
                    <td className="px-2 py-1.5">{new Date(item.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-2 py-1.5 truncate max-w-[100px]">{item.beneficiaire}</td>
                    <td className="px-2 py-1.5 text-right font-medium text-red-600">
                      {formatMontant(item.montant, { showCurrency: true })}
                    </td>
                  </>
                )}
                {reportType === 'programmations' && (
                  <>
                    <td className="px-2 py-1.5">{item.numero_ordre}</td>
                    <td className="px-2 py-1.5 truncate max-w-[120px]">{item.designation}</td>
                    <td className="px-2 py-1.5">{MOIS_LABELS[item.mois - 1]?.substring(0, 3)}</td>
                    <td className="px-2 py-1.5 text-right font-medium">
                      {formatMontant(item.montant_prevu, { showCurrency: true })}
                    </td>
                  </>
                )}
                {reportType === 'mensuel' && (
                  <>
                    <td className="px-2 py-1.5">{MOIS_LABELS[item.mois - 1]}</td>
                    <td className="px-2 py-1.5 text-right text-green-600">
                      {formatMontant(item.totalRecettes, { showCurrency: true })}
                    </td>
                    <td className="px-2 py-1.5 text-right text-red-600">
                      {formatMontant(item.totalDepenses, { showCurrency: true })}
                    </td>
                    <td className={`px-2 py-1.5 text-right font-medium ${item.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatMontant(item.solde, { showCurrency: true })}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FONT_OPTIONS = [
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'times', label: 'Times New Roman' },
  { value: 'courier', label: 'Courier' },
];

const ORIENTATION_OPTIONS = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Paysage' },
];

// Modèles prédéfinis
type ReportTemplate = Omit<ReportSettings, 'id' | 'created_at' | 'updated_at' | 'updated_by'>;

const REPORT_TEMPLATES: { id: string; name: string; description: string; icon: React.ReactNode; settings: ReportTemplate }[] = [
  {
    id: 'institutionnel',
    name: 'Institutionnel',
    description: 'Style formel et officiel',
    icon: <Landmark className="w-5 h-5" />,
    settings: {
      logo_url: null,
      titre_entete: 'DIRECTION GÉNÉRALE DES DOUANES ET ACCISES',
      sous_titre: 'Rapport Officiel',
      contenu_pied_page: 'DGDA - Document officiel - Confidentiel',
      afficher_numero_page: true,
      afficher_date: true,
      afficher_nom_institution: true,
      police: 'times',
      taille_police: 11,
      couleur_principale: '#1e3a5f',
      marges_haut: 20,
      marges_bas: 20,
      marges_gauche: 15,
      marges_droite: 15,
      orientation: 'portrait',
      position_logo: 'gauche',
      filigrane_actif: true,
      filigrane_texte: 'DGDA OFFICIEL',
      ligne_entete_1: 'République Démocratique du Congo',
      ligne_entete_2: 'Ministère des Finances',
      ligne_entete_3: 'Direction Générale des Douanes et Accises',
      ligne_entete_4: 'Direction Provinciale de Kinshasa-Ville',
      ligne_pied_1: "Tous mobilisés pour une douane d'action et d'excellence !",
      ligne_pied_2: 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
      ligne_pied_3: 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
      ligne_pied_4: 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
      position_tableau: 'gauche',
      alignement_contenu: 'gauche',
      espacement_tableau: 10,
      couleur_entete_tableau: '#1e3a5f',
      couleur_texte_entete: '#ffffff',
      couleur_lignes_alternees: '#f0f4f8',
    }
  },
  {
    id: 'moderne',
    name: 'Moderne',
    description: 'Design épuré',
    icon: <Sparkles className="w-5 h-5" />,
    settings: {
      logo_url: null,
      titre_entete: 'DGDA',
      sous_titre: 'Rapport Financier',
      contenu_pied_page: 'Direction Générale des Douanes et Accises',
      afficher_numero_page: true,
      afficher_date: true,
      afficher_nom_institution: false,
      police: 'helvetica',
      taille_police: 10,
      couleur_principale: '#2563eb',
      marges_haut: 15,
      marges_bas: 15,
      marges_gauche: 12,
      marges_droite: 12,
      orientation: 'portrait',
      position_logo: 'centre',
      filigrane_actif: false,
      filigrane_texte: '',
      ligne_entete_1: 'République Démocratique du Congo',
      ligne_entete_2: 'Ministère des Finances',
      ligne_entete_3: 'DGDA',
      ligne_entete_4: 'Rapport Financier',
      ligne_pied_1: "Tous mobilisés pour une douane d'action et d'excellence !",
      ligne_pied_2: 'Kinshasa/Gombe',
      ligne_pied_3: 'Tél. : +243(0) 818 968 481',
      ligne_pied_4: 'www.douanes.gouv.cd',
      position_tableau: 'centre',
      alignement_contenu: 'centre',
      espacement_tableau: 12,
      couleur_entete_tableau: '#2563eb',
      couleur_texte_entete: '#ffffff',
      couleur_lignes_alternees: '#eff6ff',
    }
  },
  {
    id: 'minimaliste',
    name: 'Minimaliste',
    description: 'Style simple',
    icon: <Minimize2 className="w-5 h-5" />,
    settings: {
      logo_url: null,
      titre_entete: 'Rapport',
      sous_titre: '',
      contenu_pied_page: '',
      afficher_numero_page: true,
      afficher_date: false,
      afficher_nom_institution: false,
      police: 'helvetica',
      taille_police: 9,
      couleur_principale: '#374151',
      marges_haut: 10,
      marges_bas: 10,
      marges_gauche: 10,
      marges_droite: 10,
      orientation: 'portrait',
      position_logo: 'gauche',
      filigrane_actif: false,
      filigrane_texte: '',
      ligne_entete_1: 'RDC',
      ligne_entete_2: 'Ministère des Finances',
      ligne_entete_3: 'DGDA',
      ligne_entete_4: '',
      ligne_pied_1: '',
      ligne_pied_2: '',
      ligne_pied_3: '',
      ligne_pied_4: '',
      position_tableau: 'gauche',
      alignement_contenu: 'gauche',
      espacement_tableau: 8,
      couleur_entete_tableau: '#374151',
      couleur_texte_entete: '#ffffff',
      couleur_lignes_alternees: '#f9fafb',
    }
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ReportSettingsPage() {
  const { settings, isLoading, updateSettings, resetSettings, isUpdating, isResetting } = useReportSettings();
  const { isAdmin, role } = useLocalUserRole();
  const canEdit = isAdmin || role === 'instructeur';
  
  const [localSettings, setLocalSettings] = useState<Partial<ReportSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedReport, setSelectedReport] = useState('recettes');
  const [isExporting, setIsExporting] = useState(false);
  const currentYear = new Date().getFullYear();
  const queryClient = useQueryClient();

  // États pour le filtre par date
  const [dateDebut, setDateDebut] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dateFin, setDateFin] = useState<Date | undefined>(endOfMonth(new Date()));
  const [filterEnabled, setFilterEnabled] = useState(false);

  // États pour la sélection des colonnes
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // Hooks pour les données des rapports
  const { recettes, isLoading: isLoadingRecettes } = useRecettes();
  const { depenses, isLoading: isLoadingDepenses } = useDepenses();
  const { programmations, isLoading: isLoadingProgrammations } = useProgrammations();
  const { data: monthlyStats, isLoading: isLoadingMonthly } = useMonthlyStats(currentYear);

  // Fonction pour filtrer les données par date
  const filterDataByDate = useMemo(() => {
    if (!filterEnabled || !dateDebut || !dateFin) {
      return (data: any[]) => data;
    }

    return (data: any[]) => {
      return data.filter((item: any) => {
        const itemDate = item.date ? parseISO(item.date) : null;
        if (!itemDate) return true;
        return isWithinInterval(itemDate, { start: dateDebut, end: dateFin });
      });
    };
  }, [filterEnabled, dateDebut, dateFin]);

  // Fonction pour filtrer les données mensuelles par mois
  const filterMonthlyDataByDate = useMemo(() => {
    if (!filterEnabled || !dateDebut || !dateFin) {
      return (data: any[]) => data;
    }

    const startMonth = dateDebut.getMonth() + 1;
    const endMonth = dateFin.getMonth() + 1;

    return (data: any[]) => {
      return data.filter((item: any) => {
        return item.mois >= startMonth && item.mois <= endMonth;
      });
    };
  }, [filterEnabled, dateDebut, dateFin]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Définition des colonnes disponibles par type de rapport
  const getAllColumns = useMemo(() => {
    const columns: Record<string, { header: string; key: string; type: 'text' | 'date' | 'currency' | 'number' }[]> = {
      recettes: [
        { header: 'N° Bon', key: 'numero_bon', type: 'text' },
        { header: 'Date', key: 'date', type: 'date' },
        { header: 'Heure', key: 'heure', type: 'text' },
        { header: 'Provenance', key: 'provenance', type: 'text' },
        { header: 'Motif', key: 'motif', type: 'text' },
        { header: 'Montant', key: 'montant', type: 'currency' },
        { header: 'Montant en lettres', key: 'montant_lettre', type: 'text' },
        { header: 'Observation', key: 'observation', type: 'text' },
      ],
      depenses: [
        { header: 'N° Bon', key: 'numero_bon', type: 'text' },
        { header: 'Date', key: 'date', type: 'date' },
        { header: 'Heure', key: 'heure', type: 'text' },
        { header: 'Bénéficiaire', key: 'beneficiaire', type: 'text' },
        { header: 'Motif', key: 'motif', type: 'text' },
        { header: 'Montant', key: 'montant', type: 'currency' },
        { header: 'Montant en lettres', key: 'montant_lettre', type: 'text' },
        { header: 'Observation', key: 'observation', type: 'text' },
      ],
      programmations: [
        { header: 'N°', key: 'numero_ordre', type: 'number' },
        { header: 'Désignation', key: 'designation', type: 'text' },
        { header: 'Mois', key: 'mois', type: 'number' },
        { header: 'Année', key: 'annee', type: 'number' },
        { header: 'Montant Prévu', key: 'montant_prevu', type: 'currency' },
        { header: 'Montant en lettres', key: 'montant_lettre', type: 'text' },
      ],
      mensuel: [
        { header: 'Mois', key: 'mois', type: 'number' },
        { header: 'Total Recettes', key: 'totalRecettes', type: 'currency' },
        { header: 'Total Dépenses', key: 'totalDepenses', type: 'currency' },
        { header: 'Solde', key: 'solde', type: 'currency' },
      ],
    };
    return columns;
  }, []);

  // Réinitialiser les colonnes sélectionnées quand le rapport change
  useEffect(() => {
    const reportColumns = getAllColumns[selectedReport] || [];
    // Par défaut, sélectionner les colonnes principales (5 premières)
    const defaultCols = reportColumns.slice(0, 5).map(c => c.key);
    setSelectedColumns(defaultCols);
  }, [selectedReport, getAllColumns]);

  const handleChange = (key: keyof ReportSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les droits pour modifier ces paramètres");
      return;
    }
    updateSettings(localSettings as any);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les droits pour modifier ces paramètres");
      return;
    }
    resetSettings();
    setLocalSettings(defaultReportSettings as ReportSettings);
    setHasChanges(false);
  };

  const handleApplyTemplate = (templateId: string) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les droits pour modifier ces paramètres");
      return;
    }
    const template = REPORT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setLocalSettings(prev => ({ ...prev, ...template.settings }));
      setHasChanges(true);
      toast.success(`Modèle "${template.name}" appliqué. N'oubliez pas d'enregistrer.`);
    }
  };

  const handleRefreshData = () => {
    switch (selectedReport) {
      case 'recettes':
        queryClient.invalidateQueries({ queryKey: ['recettes'] });
        break;
      case 'depenses':
        queryClient.invalidateQueries({ queryKey: ['depenses'] });
        break;
      case 'programmations':
        queryClient.invalidateQueries({ queryKey: ['programmations'] });
        break;
      case 'mensuel':
        queryClient.invalidateQueries({ queryKey: ['monthly-stats'] });
        break;
    }
    toast.success('Données actualisées');
  };

  const getExportConfig = () => {
    switch (selectedReport) {
      case 'recettes':
        return getRecettesExportConfig(recettes || []);
      case 'depenses':
        return getDepensesExportConfig(depenses || []);
      case 'programmations':
        return getProgrammationsExportConfig(programmations || []);
      case 'mensuel':
        return getRapportMensuelExportConfig(monthlyStats || [], currentYear);
      default:
        return null;
    }
  };

  const handleExportPDF = async () => {
    const config = getExportConfig();
    if (!config) return;

    setIsExporting(true);
    try {
      const pdfSettings = convertToExportSettings(localSettings as ReportSettings);
      await exportToPDF({ ...config, pdfSettings });
      toast.success('PDF exporté avec succès');
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    const config = getExportConfig();
    if (!config) return;

    try {
      const pdfSettings = convertToExportSettings(localSettings as ReportSettings);
      exportToExcel({ ...config, pdfSettings });
      toast.success('Excel exporté avec succès');
    } catch (error) {
      toast.error("Erreur lors de l'export Excel");
    }
  };

  const getCurrentData = () => {
    switch (selectedReport) {
      case 'recettes':
        return { data: filterDataByDate(recettes || []), isLoading: isLoadingRecettes };
      case 'depenses':
        return { data: filterDataByDate(depenses || []), isLoading: isLoadingDepenses };
      case 'programmations':
        return { data: programmations || [], isLoading: isLoadingProgrammations }; // Pas de date sur programmations
      case 'mensuel':
        return { data: filterMonthlyDataByDate(monthlyStats || []), isLoading: isLoadingMonthly };
      default:
        return { data: [], isLoading: false };
    }
  };

  const getPreviewColumns = () => {
    const allCols = getAllColumns[selectedReport] || [];
    if (selectedColumns.length === 0) return allCols;
    return allCols.filter(col => selectedColumns.includes(col.key));
  };

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnKey)) {
        // Ne pas permettre de désélectionner toutes les colonnes
        if (prev.length === 1) return prev;
        return prev.filter(k => k !== columnKey);
      }
      return [...prev, columnKey];
    });
  };

  const handleSelectAllColumns = () => {
    const allCols = getAllColumns[selectedReport] || [];
    setSelectedColumns(allCols.map(c => c.key));
  };

  const handleSelectDefaultColumns = () => {
    const allCols = getAllColumns[selectedReport] || [];
    setSelectedColumns(allCols.slice(0, 5).map(c => c.key));
  };

  // Drag-and-drop handlers pour réorganiser les colonnes
  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetKey) {
      setDraggedColumn(null);
      return;
    }

    setSelectedColumns(prev => {
      const allCols = getAllColumns[selectedReport] || [];
      const allKeys = allCols.map(c => c.key);
      
      // Créer un nouvel ordre basé sur toutes les colonnes
      const newOrder = [...allKeys];
      const draggedIndex = newOrder.indexOf(draggedColumn);
      const targetIndex = newOrder.indexOf(targetKey);
      
      // Réorganiser
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumn);
      
      // Filtrer pour garder uniquement les colonnes sélectionnées dans le nouvel ordre
      return newOrder.filter(key => prev.includes(key));
    });
    
    setDraggedColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentData = getCurrentData();
  const selectedReportInfo = REPORT_TYPES.find(r => r.id === selectedReport);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <PageHeader
        title="Mise en forme des rapports"
        description="Configurez et exportez vos rapports directement"
      />

      {/* Section sélection de rapport et actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Sélection du rapport
            </CardTitle>
            <CardDescription>
              Choisissez un rapport pour le prévisualiser et l'exporter avec vos paramètres
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélecteur de rapport */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {REPORT_TYPES.map((report) => {
                const Icon = report.icon;
                const isSelected = selectedReport === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                        {report.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Filtre par date */}
            {selectedReport !== 'programmations' && (
              <div className="flex flex-wrap items-end gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Switch
                    id="filter-enabled"
                    checked={filterEnabled}
                    onCheckedChange={setFilterEnabled}
                  />
                  <Label htmlFor="filter-enabled" className="text-sm font-medium cursor-pointer">
                    Filtrer par période
                  </Label>
                </div>

                {filterEnabled && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Du</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-[140px] justify-start text-left font-normal",
                              !dateDebut && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateDebut ? format(dateDebut, "dd/MM/yyyy") : "Début"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateDebut}
                            onSelect={setDateDebut}
                            initialFocus
                            className="pointer-events-auto"
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Au</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-[140px] justify-start text-left font-normal",
                              !dateFin && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFin ? format(dateFin, "dd/MM/yyyy") : "Fin"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateFin}
                            onSelect={setDateFin}
                            initialFocus
                            className="pointer-events-auto"
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          setDateDebut(today);
                          setDateFin(today);
                        }}
                        className="text-xs h-7 px-2"
                      >
                        Aujourd'hui
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          setDateDebut(subDays(today, 7));
                          setDateFin(today);
                        }}
                        className="text-xs h-7 px-2"
                      >
                        7 derniers jours
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          setDateDebut(subDays(today, 30));
                          setDateFin(today);
                        }}
                        className="text-xs h-7 px-2"
                      >
                        30 derniers jours
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateDebut(startOfMonth(new Date()));
                          setDateFin(endOfMonth(new Date()));
                        }}
                        className="text-xs h-7 px-2"
                      >
                        Ce mois
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const lastMonth = subMonths(new Date(), 1);
                          setDateDebut(startOfMonth(lastMonth));
                          setDateFin(endOfMonth(lastMonth));
                        }}
                        className="text-xs h-7 px-2"
                      >
                        Mois dernier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateDebut(startOfQuarter(new Date()));
                          setDateFin(endOfQuarter(new Date()));
                        }}
                        className="text-xs h-7 px-2"
                      >
                        Ce trimestre
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateDebut(startOfYear(new Date()));
                          setDateFin(endOfYear(new Date()));
                        }}
                        className="text-xs h-7 px-2"
                      >
                        Cette année
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFilterEnabled(false)}
                      className="h-7 w-7"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Sélection des colonnes */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Columns className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Colonnes à afficher</Label>
                  <Badge variant="outline" className="text-xs">
                    {selectedColumns.length}/{(getAllColumns[selectedReport] || []).length}
                  </Badge>
                  <span className="text-xs text-muted-foreground">(glisser pour réorganiser)</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllColumns}
                    className="text-xs h-7 px-2"
                  >
                    Toutes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectDefaultColumns}
                    className="text-xs h-7 px-2"
                  >
                    Par défaut
                  </Button>
                </div>
              </div>
              
              {/* Colonnes sélectionnées (réorganisables) */}
              {selectedColumns.length > 0 && (
                <div className="mb-2">
                  <Label className="text-xs text-muted-foreground mb-1 block">Ordre d'affichage :</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedColumns.map((columnKey, index) => {
                      const column = (getAllColumns[selectedReport] || []).find(c => c.key === columnKey);
                      if (!column) return null;
                      return (
                        <div
                          key={column.key}
                          draggable
                          onDragStart={(e) => handleDragStart(e, column.key)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, column.key)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md border cursor-grab transition-all text-xs select-none",
                            "bg-primary/10 border-primary text-primary",
                            draggedColumn === column.key && "opacity-50 scale-95",
                            draggedColumn && draggedColumn !== column.key && "border-dashed"
                          )}
                        >
                          <GripVertical className="h-3 w-3 text-primary/50" />
                          <span className="font-medium text-[10px] text-primary/60 mr-1">{index + 1}.</span>
                          <span>{column.header}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleColumnToggle(column.key);
                            }}
                            className="ml-1 hover:bg-primary/20 rounded p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colonnes disponibles (non sélectionnées) */}
              {(() => {
                const unselectedCols = (getAllColumns[selectedReport] || []).filter(c => !selectedColumns.includes(c.key));
                if (unselectedCols.length === 0) return null;
                return (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Colonnes disponibles :</Label>
                    <div className="flex flex-wrap gap-2">
                      {unselectedCols.map((column) => (
                        <div
                          key={column.key}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md border cursor-pointer transition-colors text-xs bg-background border-border hover:bg-muted"
                          onClick={() => handleColumnToggle(column.key)}
                        >
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => handleColumnToggle(column.key)}
                            className="h-3 w-3"
                          />
                          <span>{column.header}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Aperçu des données et actions d'export */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {selectedReportInfo && <selectedReportInfo.icon className="w-5 h-5 text-primary" />}
                  <span className="font-medium">{selectedReportInfo?.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {currentData.data.length} enregistrements
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleRefreshData}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportExcel}
                    disabled={currentData.data.length === 0}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    Excel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleExportPDF}
                    disabled={currentData.data.length === 0 || isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-1" />
                    )}
                    PDF
                  </Button>
                </div>
              </div>
              <ReportDataPreview 
                reportType={selectedReport} 
                data={currentData.data} 
                isLoading={currentData.isLoading} 
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Layout en 2 colonnes: Paramètres et Aperçu */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne paramètres */}
        <div className="lg:col-span-2 space-y-4">
          {/* Actions de sauvegarde */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isUpdating || !canEdit}
              className="gap-2"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer les paramètres
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReset}
              disabled={isResetting || !canEdit}
              className="gap-2"
              size="sm"
            >
              {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Réinitialiser
            </Button>
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Modifications non enregistrées
              </Badge>
            )}
          </motion.div>

          {!canEdit && (
            <motion.div variants={itemVariants}>
              <Card className="border-warning bg-warning/10">
                <CardContent className="py-3">
                  <p className="text-sm text-warning-foreground">
                    Seuls les administrateurs et instructeurs peuvent modifier les paramètres.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Modèles rapides */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Modèles rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {REPORT_TEMPLATES.map((template) => (
                    <HoverCard key={template.id} openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyTemplate(template.id)}
                          disabled={!canEdit}
                          className="gap-2"
                        >
                          {template.icon}
                          {template.name}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent side="bottom" className="w-auto p-3">
                        <PDFPreviewMini settings={template.settings} />
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Onglets de configuration */}
          <Tabs defaultValue="header" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="header" className="gap-1 text-xs">
                <Type className="w-3 h-3" />
                En-tête
              </TabsTrigger>
              <TabsTrigger value="footer" className="gap-1 text-xs">
                <FileDown className="w-3 h-3" />
                Pied
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-1 text-xs">
                <Layout className="w-3 h-3" />
                Tableau
              </TabsTrigger>
              <TabsTrigger value="style" className="gap-1 text-xs">
                <Palette className="w-3 h-3" />
                Style
              </TabsTrigger>
              <TabsTrigger value="layout" className="gap-1 text-xs">
                <Image className="w-3 h-3" />
                Page
              </TabsTrigger>
            </TabsList>

            {/* Header Tab - Detailed header lines */}
            <TabsContent value="header">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Configuration de l'en-tête du document</CardTitle>
                  <CardDescription className="text-xs">
                    Personnalisez les 4 lignes d'en-tête qui apparaissent sur chaque rapport
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Logo settings */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>URL du logo (optionnel)</Label>
                      <Input
                        placeholder="https://exemple.com/logo.png"
                        value={localSettings.logo_url || ''}
                        onChange={(e) => handleChange('logo_url', e.target.value || null)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position du logo</Label>
                      <Select
                        value={localSettings.position_logo || 'gauche'}
                        onValueChange={(value) => handleChange('position_logo', value)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gauche">
                            <div className="flex items-center gap-2">
                              <AlignLeft className="w-4 h-4" />
                              Gauche
                            </div>
                          </SelectItem>
                          <SelectItem value="centre">
                            <div className="flex items-center gap-2">
                              <AlignCenter className="w-4 h-4" />
                              Centre
                            </div>
                          </SelectItem>
                          <SelectItem value="droite">
                            <div className="flex items-center gap-2">
                              <AlignRight className="w-4 h-4" />
                              Droite
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* 4 Header Lines */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Lignes d'en-tête (éditables)</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Ligne 1:</span>
                        <Input
                          placeholder="République Démocratique du Congo"
                          value={localSettings.ligne_entete_1 || ''}
                          onChange={(e) => handleChange('ligne_entete_1', e.target.value)}
                          disabled={!canEdit}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Ligne 2:</span>
                        <Input
                          placeholder="Ministère des Finances"
                          value={localSettings.ligne_entete_2 || ''}
                          onChange={(e) => handleChange('ligne_entete_2', e.target.value)}
                          disabled={!canEdit}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Ligne 3:</span>
                        <Input
                          placeholder="Direction Générale des Douanes et Accises"
                          value={localSettings.ligne_entete_3 || ''}
                          onChange={(e) => handleChange('ligne_entete_3', e.target.value)}
                          disabled={!canEdit}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Ligne 4:</span>
                        <Input
                          placeholder="Direction Provinciale de Kinshasa-Ville"
                          value={localSettings.ligne_entete_4 || ''}
                          onChange={(e) => handleChange('ligne_entete_4', e.target.value)}
                          disabled={!canEdit}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Legacy fields for compatibility */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Titre principal (rapport)</Label>
                      <Input
                        placeholder="DIRECTION GÉNÉRALE DES DOUANES ET ACCISES"
                        value={localSettings.titre_entete || ''}
                        onChange={(e) => handleChange('titre_entete', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sous-titre</Label>
                      <Input
                        placeholder="Rapport Financier"
                        value={localSettings.sous_titre || ''}
                        onChange={(e) => handleChange('sous_titre', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Footer Tab - Detailed footer lines */}
            <TabsContent value="footer">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Configuration du pied de page</CardTitle>
                  <CardDescription className="text-xs">
                    Personnalisez les 4 lignes de pied de page qui apparaissent sur chaque rapport
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 4 Footer Lines */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Lignes de pied de page (éditables)</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Ligne 1:</span>
                        <Input
                          placeholder="Slogan ou devise"
                          value={localSettings.ligne_pied_1 || ''}
                          onChange={(e) => handleChange('ligne_pied_1', e.target.value)}
                          disabled={!canEdit}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Ligne 2:</span>
                        <Input
                          placeholder="Adresse"
                          value={localSettings.ligne_pied_2 || ''}
                          onChange={(e) => handleChange('ligne_pied_2', e.target.value)}
                          disabled={!canEdit}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Ligne 3:</span>
                        <Input
                          placeholder="Téléphone / BP"
                          value={localSettings.ligne_pied_3 || ''}
                          onChange={(e) => handleChange('ligne_pied_3', e.target.value)}
                          disabled={!canEdit}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Ligne 4:</span>
                        <Input
                          placeholder="Email / Site web"
                          value={localSettings.ligne_pied_4 || ''}
                          onChange={(e) => handleChange('ligne_pied_4', e.target.value)}
                          disabled={!canEdit}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Footer options */}
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                      <Label htmlFor="show-page-number" className="text-sm">N° de page</Label>
                      <Switch
                        id="show-page-number"
                        checked={localSettings.afficher_numero_page ?? true}
                        onCheckedChange={(checked) => handleChange('afficher_numero_page', checked)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                      <Label htmlFor="show-date" className="text-sm">Date</Label>
                      <Switch
                        id="show-date"
                        checked={localSettings.afficher_date ?? true}
                        onCheckedChange={(checked) => handleChange('afficher_date', checked)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                      <Label htmlFor="show-institution" className="text-sm">Institution</Label>
                      <Switch
                        id="show-institution"
                        checked={localSettings.afficher_nom_institution ?? true}
                        onCheckedChange={(checked) => handleChange('afficher_nom_institution', checked)}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Table Tab - Table positioning and content alignment */}
            <TabsContent value="table">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Position et style du tableau</CardTitle>
                  <CardDescription className="text-xs">
                    Configurez la position du tableau et l'alignement du contenu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Position du tableau</Label>
                      <Select
                        value={localSettings.position_tableau || 'gauche'}
                        onValueChange={(value) => handleChange('position_tableau', value)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gauche">
                            <div className="flex items-center gap-2">
                              <AlignLeft className="w-4 h-4" />
                              Aligné à gauche
                            </div>
                          </SelectItem>
                          <SelectItem value="centre">
                            <div className="flex items-center gap-2">
                              <AlignCenter className="w-4 h-4" />
                              Centré
                            </div>
                          </SelectItem>
                          <SelectItem value="droite">
                            <div className="flex items-center gap-2">
                              <AlignRight className="w-4 h-4" />
                              Aligné à droite
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Alignement du contenu</Label>
                      <Select
                        value={localSettings.alignement_contenu || 'gauche'}
                        onValueChange={(value) => handleChange('alignement_contenu', value)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gauche">
                            <div className="flex items-center gap-2">
                              <AlignLeft className="w-4 h-4" />
                              Texte à gauche
                            </div>
                          </SelectItem>
                          <SelectItem value="centre">
                            <div className="flex items-center gap-2">
                              <AlignCenter className="w-4 h-4" />
                              Texte centré
                            </div>
                          </SelectItem>
                          <SelectItem value="droite">
                            <div className="flex items-center gap-2">
                              <AlignRight className="w-4 h-4" />
                              Texte à droite
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Espacement après le titre (mm)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      value={localSettings.espacement_tableau || 10}
                      onChange={(e) => handleChange('espacement_tableau', parseInt(e.target.value))}
                      disabled={!canEdit}
                      className="w-32"
                    />
                  </div>

                  <Separator />

                  {/* Table colors */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Couleurs du tableau</Label>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-xs">En-tête du tableau</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={localSettings.couleur_entete_tableau || '#3b82f6'}
                            onChange={(e) => handleChange('couleur_entete_tableau', e.target.value)}
                            className="w-12 h-8 p-1 cursor-pointer"
                            disabled={!canEdit}
                          />
                          <Input
                            type="text"
                            value={localSettings.couleur_entete_tableau || '#3b82f6'}
                            onChange={(e) => handleChange('couleur_entete_tableau', e.target.value)}
                            className="flex-1 text-xs"
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Texte en-tête</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={localSettings.couleur_texte_entete || '#ffffff'}
                            onChange={(e) => handleChange('couleur_texte_entete', e.target.value)}
                            className="w-12 h-8 p-1 cursor-pointer"
                            disabled={!canEdit}
                          />
                          <Input
                            type="text"
                            value={localSettings.couleur_texte_entete || '#ffffff'}
                            onChange={(e) => handleChange('couleur_texte_entete', e.target.value)}
                            className="flex-1 text-xs"
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Lignes alternées</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="color"
                            value={localSettings.couleur_lignes_alternees || '#f5f7fa'}
                            onChange={(e) => handleChange('couleur_lignes_alternees', e.target.value)}
                            className="w-12 h-8 p-1 cursor-pointer"
                            disabled={!canEdit}
                          />
                          <Input
                            type="text"
                            value={localSettings.couleur_lignes_alternees || '#f5f7fa'}
                            onChange={(e) => handleChange('couleur_lignes_alternees', e.target.value)}
                            className="flex-1 text-xs"
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Style Tab */}
            <TabsContent value="style">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Police</Label>
                      <Select
                        value={localSettings.police || 'helvetica'}
                        onValueChange={(value) => handleChange('police', value)}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(font => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Taille de police</Label>
                      <Input
                        type="number"
                        min={8}
                        max={16}
                        value={localSettings.taille_police || 10}
                        onChange={(e) => handleChange('taille_police', parseInt(e.target.value))}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur principale</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="color"
                        value={localSettings.couleur_principale || '#1e40af'}
                        onChange={(e) => handleChange('couleur_principale', e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                        disabled={!canEdit}
                      />
                      <Input
                        type="text"
                        value={localSettings.couleur_principale || '#1e40af'}
                        onChange={(e) => handleChange('couleur_principale', e.target.value)}
                        className="flex-1"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                      <Label htmlFor="watermark-active" className="text-sm">Filigrane</Label>
                      <Switch
                        id="watermark-active"
                        checked={localSettings.filigrane_actif ?? true}
                        onCheckedChange={(checked) => handleChange('filigrane_actif', checked)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte du filigrane</Label>
                      <Input
                        placeholder="DGDA"
                        value={localSettings.filigrane_texte || ''}
                        onChange={(e) => handleChange('filigrane_texte', e.target.value)}
                        disabled={!canEdit || !localSettings.filigrane_actif}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Orientation</Label>
                    <Select
                      value={localSettings.orientation || 'portrait'}
                      onValueChange={(value) => handleChange('orientation', value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORIENTATION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marges (mm)</Label>
                    <div className="grid gap-3 grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Haut</Label>
                        <Input
                          type="number"
                          min={5}
                          max={50}
                          value={localSettings.marges_haut || 15}
                          onChange={(e) => handleChange('marges_haut', parseFloat(e.target.value))}
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Bas</Label>
                        <Input
                          type="number"
                          min={5}
                          max={50}
                          value={localSettings.marges_bas || 15}
                          onChange={(e) => handleChange('marges_bas', parseFloat(e.target.value))}
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Gauche</Label>
                        <Input
                          type="number"
                          min={5}
                          max={50}
                          value={localSettings.marges_gauche || 10}
                          onChange={(e) => handleChange('marges_gauche', parseFloat(e.target.value))}
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Droite</Label>
                        <Input
                          type="number"
                          min={5}
                          max={50}
                          value={localSettings.marges_droite || 10}
                          onChange={(e) => handleChange('marges_droite', parseFloat(e.target.value))}
                          disabled={!canEdit}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Colonne aperçu PDF en temps réel */}
        <div className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="sticky top-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileSearch className="w-4 h-4" />
                  Aperçu PDF en direct
                </CardTitle>
                <CardDescription className="text-xs">
                  Le PDF se met à jour automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LivePDFPreview 
                  settings={localSettings} 
                  data={currentData.data}
                  columns={getPreviewColumns()}
                  reportTitle={selectedReportInfo?.name || 'Aperçu du Rapport'}
                  isLoading={currentData.isLoading}
                  onExportFullPDF={handleExportPDF}
                  isExportingFull={isExporting}
                />
              </CardContent>
              <div className="px-6 pb-4">
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Police:</span>
                    <span className="font-medium text-foreground">{localSettings.police || 'helvetica'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Orientation:</span>
                    <span className="font-medium text-foreground">{localSettings.orientation || 'portrait'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tableau:</span>
                    <span className="font-medium text-foreground">{localSettings.position_tableau || 'gauche'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filigrane:</span>
                    <span className="font-medium text-foreground">
                      {localSettings.filigrane_actif ? 'Oui' : 'Non'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
          
          {/* Mini preview for quick reference */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  Mini aperçu
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <PDFPreviewMini settings={localSettings as ReportTemplate} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
