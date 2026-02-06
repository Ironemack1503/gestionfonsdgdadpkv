/**
 * Page d'exemples de rapports PDF
 * Génère des PDF avec des données fictives en utilisant l'éditeur de rapports avancé
 */

import { useState } from 'react';
import { FileText, Download, Loader2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FEUILLE_CAISSE_TEMPLATE, 
  SOMMAIRE_TEMPLATE, 
  PROGRAMMATION_TEMPLATE 
} from '@/components/reports/AdvancedReportEditor/templates';
import { 
  exportTemplateToPDF, 
  exportTemplateToExcel, 
  exportTemplateToWord 
} from '@/components/reports/AdvancedReportEditor/exportFunctions';
import { toast } from 'sonner';

// Données fictives pour les exemples
const MOCK_PROGRAMMATION = [
  { numeroOrdre: 1, designation: 'Fournitures de bureau', montantPrevu: 2500000 },
  { numeroOrdre: 2, designation: 'Carburant et lubrifiants', montantPrevu: 8750000 },
  { numeroOrdre: 3, designation: 'Entretien véhicules', montantPrevu: 3200000 },
  { numeroOrdre: 4, designation: 'Frais de mission', montantPrevu: 5600000 },
  { numeroOrdre: 5, designation: 'Télécommunications', montantPrevu: 1850000 },
  { numeroOrdre: 6, designation: 'Eau et électricité', montantPrevu: 2100000 },
  { numeroOrdre: 7, designation: 'Réparations locaux', montantPrevu: 4500000 },
  { numeroOrdre: 8, designation: 'Achats équipements informatiques', montantPrevu: 12000000 },
  { numeroOrdre: 9, designation: 'Formation du personnel', montantPrevu: 3800000 },
  { numeroOrdre: 10, designation: 'Frais de représentation', montantPrevu: 2700000 },
];

const MOCK_FEUILLE_CAISSE = [
  { date: '2026-01-02', numeroOrdre: 'BE001', numeroBeo: 'BEO-2026-001', libelle: 'Approvisionnement caisse centrale', recette: 50000000, depense: 0, imputation: 'APP' },
  { date: '2026-01-03', numeroOrdre: 'BS001', numeroBeo: 'BEO-2026-002', libelle: 'Achat fournitures bureau', recette: 0, depense: 1250000, imputation: 'FRN' },
  { date: '2026-01-05', numeroOrdre: 'BE002', numeroBeo: 'BEO-2026-003', libelle: 'Recette droits de douane', recette: 25000000, depense: 0, imputation: 'DOU' },
  { date: '2026-01-08', numeroOrdre: 'BS002', numeroBeo: 'BEO-2026-004', libelle: 'Paiement carburant véhicules', recette: 0, depense: 3500000, imputation: 'CAR' },
  { date: '2026-01-10', numeroOrdre: 'BS003', numeroBeo: 'BEO-2026-005', libelle: 'Frais mission Lubumbashi', recette: 0, depense: 8500000, imputation: 'MIS' },
  { date: '2026-01-12', numeroOrdre: 'BE003', numeroBeo: 'BEO-2026-006', libelle: 'Recette pénalités contentieux', recette: 15000000, depense: 0, imputation: 'CTX' },
  { date: '2026-01-15', numeroOrdre: 'BS004', numeroBeo: 'BEO-2026-007', libelle: 'Entretien véhicule Toyota', recette: 0, depense: 2800000, imputation: 'ENT' },
  { date: '2026-01-18', numeroOrdre: 'BS005', numeroBeo: 'BEO-2026-008', libelle: 'Facture SNEL électricité', recette: 0, depense: 1500000, imputation: 'EAU' },
  { date: '2026-01-20', numeroOrdre: 'BE004', numeroBeo: 'BEO-2026-009', libelle: 'Recette accises boissons', recette: 18500000, depense: 0, imputation: 'ACC' },
  { date: '2026-01-22', numeroOrdre: 'BS006', numeroBeo: 'BEO-2026-010', libelle: 'Achat ordinateur bureau DAF', recette: 0, depense: 4200000, imputation: 'INF' },
  { date: '2026-01-25', numeroOrdre: 'BS007', numeroBeo: 'BEO-2026-011', libelle: 'Formation agents contrôle', recette: 0, depense: 2500000, imputation: 'FOR' },
  { date: '2026-01-28', numeroOrdre: 'BE005', numeroBeo: 'BEO-2026-012', libelle: 'Recette droits importation', recette: 32000000, depense: 0, imputation: 'DOU' },
];

const MOCK_SOMMAIRE = [
  { article: 'SP', designation: 'Solde précédent', recettes: 0, depenses: 0 },
  { article: 'R', designation: 'Total Recettes du mois', recettes: 140500000, depenses: 0 },
  { article: 'D01', designation: 'Fournitures et consommables', recettes: 0, depenses: 3750000 },
  { article: 'D02', designation: 'Carburant et lubrifiants', recettes: 0, depenses: 7000000 },
  { article: 'D03', designation: 'Entretien et réparations', recettes: 0, depenses: 4300000 },
  { article: 'D04', designation: 'Frais de mission et déplacement', recettes: 0, depenses: 12500000 },
  { article: 'D05', designation: 'Télécommunications', recettes: 0, depenses: 1850000 },
  { article: 'D06', designation: 'Eau et électricité', recettes: 0, depenses: 2100000 },
  { article: 'D07', designation: 'Équipements informatiques', recettes: 0, depenses: 8200000 },
  { article: 'D08', designation: 'Formation et séminaires', recettes: 0, depenses: 4500000 },
  { article: 'D09', designation: 'Frais de représentation', recettes: 0, depenses: 3050000 },
];

type ExportFormat = 'pdf' | 'excel' | 'word';

export default function ExempleRapportsPDFPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (reportType: string, format: ExportFormat) => {
    setLoading(`${reportType}-${format}`);
    try {
      const moisAnnee = 'Janvier 2026';
      
      switch (reportType) {
        case 'programmation': {
          const title = `Programmation des Dépenses - ${moisAnnee}`;
          const subtitle = 'Période du 01/01/2026 au 31/01/2026';
          
          if (format === 'pdf') {
            await exportTemplateToPDF(PROGRAMMATION_TEMPLATE, MOCK_PROGRAMMATION, title, subtitle);
          } else if (format === 'excel') {
            exportTemplateToExcel(PROGRAMMATION_TEMPLATE, MOCK_PROGRAMMATION, title, subtitle);
          } else {
            exportTemplateToWord(PROGRAMMATION_TEMPLATE, MOCK_PROGRAMMATION, title, subtitle);
          }
          break;
        }
        case 'feuilleCaisse': {
          const title = `Feuille de Caisse - ${moisAnnee}`;
          const subtitle = 'Période du 01/01/2026 au 31/01/2026';
          
          if (format === 'pdf') {
            await exportTemplateToPDF(FEUILLE_CAISSE_TEMPLATE, MOCK_FEUILLE_CAISSE, title, subtitle);
          } else if (format === 'excel') {
            exportTemplateToExcel(FEUILLE_CAISSE_TEMPLATE, MOCK_FEUILLE_CAISSE, title, subtitle);
          } else {
            exportTemplateToWord(FEUILLE_CAISSE_TEMPLATE, MOCK_FEUILLE_CAISSE, title, subtitle);
          }
          break;
        }
        case 'sommaire': {
          const title = `Rapport Sommaire Mensuel - ${moisAnnee}`;
          const subtitle = 'Période du 01/01/2026 au 31/01/2026';
          
          if (format === 'pdf') {
            await exportTemplateToPDF(SOMMAIRE_TEMPLATE, MOCK_SOMMAIRE, title, subtitle);
          } else if (format === 'excel') {
            exportTemplateToExcel(SOMMAIRE_TEMPLATE, MOCK_SOMMAIRE, title, subtitle);
          } else {
            exportTemplateToWord(SOMMAIRE_TEMPLATE, MOCK_SOMMAIRE, title, subtitle);
          }
          break;
        }
      }

      toast.success(`Export ${format.toUpperCase()} généré avec succès !`);
    } catch (error) {
      toast.error(`Erreur lors de la génération du ${format.toUpperCase()}`);
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const reportExamples = [
    {
      id: 'programmation',
      title: 'Programmation Mensuelle',
      description: 'État prévisionnel des dépenses avec libellés et montants programmés par rubrique',
      icon: FileText,
      color: 'bg-blue-500',
      stats: { items: MOCK_PROGRAMMATION.length, total: '47 000 000 FC' },
    },
    {
      id: 'feuilleCaisse',
      title: 'Feuille de Caisse',
      description: 'Détail chronologique de toutes les opérations de caisse avec suivi du solde',
      icon: FileText,
      color: 'bg-emerald-500',
      stats: { items: MOCK_FEUILLE_CAISSE.length, total: '116 250 000 FC' },
    },
    {
      id: 'sommaire',
      title: 'Sommaire Mensuel',
      description: 'Synthèse des recettes et dépenses par catégorie avec calcul de la balance',
      icon: FileText,
      color: 'bg-amber-500',
      stats: { items: MOCK_SOMMAIRE.length, total: '93 250 000 FC' },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exemples de Rapports"
        description="Visualisez le rendu des rapports avec des données fictives de démonstration"
        actions={
          <Button 
            onClick={() => navigate('/rapports/editeur-avance')}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Éditeur Avancé
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportExamples.map((report) => (
          <Card key={report.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${report.color} text-white`}>
                  <report.icon className="w-5 h-5" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  Exemple
                </Badge>
              </div>
              <CardTitle className="mt-3">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Lignes:</span>
                  <span className="ml-2 font-medium">{report.stats.items}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-2 font-medium text-primary">{report.stats.total}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  size="sm"
                  onClick={() => handleExport(report.id, 'pdf')}
                  disabled={loading !== null}
                  className="w-full"
                >
                  {loading === `${report.id}-pdf` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </>
                  )}
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(report.id, 'excel')}
                  disabled={loading !== null}
                  className="w-full"
                >
                  {loading === `${report.id}-excel` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-3 h-3 mr-1" />
                      Excel
                    </>
                  )}
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(report.id, 'word')}
                  disabled={loading !== null}
                  className="w-full"
                >
                  {loading === `${report.id}-word` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-3 h-3 mr-1" />
                      Word
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <Card className="border-l-4 border-l-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Settings className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Personnalisation avancée</h4>
              <p className="text-sm text-muted-foreground">
                Utilisez l'<strong>Éditeur de Rapports Avancé</strong> pour personnaliser entièrement la mise en forme des documents :
                en-têtes institutionnels, filigranes, colonnes, styles et exports multi-formats.
              </p>
              <Button 
                variant="link" 
                className="px-0 mt-2"
                onClick={() => navigate('/rapports/editeur-avance')}
              >
                Accéder à l'éditeur avancé →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
