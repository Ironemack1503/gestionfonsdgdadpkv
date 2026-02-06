import { NavLink } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  Download,
  Eye,
  ArrowRight,
  Edit3
} from "lucide-react";

export default function RapportsPage() {
  const reportTypes = [
    {
      title: "Rapport Journalier",
      description: "État des entrées et sorties du jour",
      icon: FileText,
    },
    {
      title: "Rapport Mensuel",
      description: "Synthèse mensuelle des opérations",
      icon: Calendar,
    },
    {
      title: "Liste des Entrées",
      description: "Historique complet des bons d'entrée",
      icon: FileSpreadsheet,
    },
    {
      title: "Liste des Sorties",
      description: "Historique complet des bons de sortie",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Générez et exportez vos rapports de caisse"
      />

      {/* Lien vers l'éditeur avancé */}
      <NavLink to="/rapports/editeur-avance">
        <Card className="p-6 border-l-4 border-l-primary hover:shadow-lg transition-all bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Edit3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Éditeur de Rapports Avancé</h3>
                <p className="text-sm text-muted-foreground">
                  Personnalisez les en-têtes, pieds de page et exportez en PDF, Excel ou Word
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
        </Card>
      </NavLink>

      {/* Lien vers les exemples PDF */}
      <NavLink to="/rapports/exemples-pdf">
        <Card className="p-6 border-l-4 border-l-emerald-500 hover:shadow-lg transition-all bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Exemples de Rapports PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Visualisez le rendu des rapports avec des données fictives de démonstration
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-600" />
          </div>
        </Card>
      </NavLink>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => (
          <Card key={report.title} className="p-6 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <report.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{report.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                <Button size="sm" variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Générer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-2">Fonctionnalités avancées</h3>
        <p className="text-sm text-muted-foreground">
          Les rapports personnalisés, les exports Excel et PDF, ainsi que les filtres avancés 
          seront disponibles une fois les données configurées.
        </p>
      </Card>
    </div>
  );
}
