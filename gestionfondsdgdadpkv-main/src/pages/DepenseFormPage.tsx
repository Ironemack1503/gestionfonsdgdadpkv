import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Save, X, AlertCircle, Search, FileText, DollarSign, Calendar, Eye, Edit, Trash2, Loader2, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { montantEnLettre } from "@/lib/montantEnLettre";
import { supabase } from "@/integrations/supabase/client";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { useDepenses, Depense } from "@/hooks/useDepenses";
import { formatMontant } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EditDepenseDialog, ViewTransactionDialog } from "@/components/dialogs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Liste des codes IMP disponibles
const CODE_IMP_OPTIONS = [
  { libelle: "Aticles alimentaires", code: "604130" },
  { libelle: "Carburant et lubrifiant", code: "604210" },
  { libelle: "Produits d'entrettien", code: "604300" },
  { libelle: "Fournitures de bureau", code: "604710" },
  { libelle: "Consommables informatiques", code: "604720" },
  { libelle: "Eau", code: "605100" },
  { libelle: "Electricité", code: "605200" },
  { libelle: "Déplacement", code: "618120" },
  { libelle: "Loyers laucaux et Bureaux de service", code: "622210" },
  { libelle: "Entretien, réparations et maintenance", code: "624000" },
  { libelle: "Abonnements", code: "626530" },
  { libelle: "Frais de communications et télécommunication", code: "628100" },
  { libelle: "Frais bancaire", code: "631000" },
  { libelle: "Paiement prime contentieuse", code: "632540" },
  { libelle: "Frais de médicaux", code: "632831" },
  { libelle: "Frais de gardiennage et sécurité", code: "632840" },
  { libelle: "Frais d'impression, reproduction et reluire", code: "632860" },
  { libelle: "Frais de mission intérieur", code: "638410" },
  { libelle: "Autres charges", code: "659800" },
  { libelle: "Prime du comptable", code: "661257" },
  { libelle: "Collations", code: "663841" },
  { libelle: "Frais funéraires et assistance deuil", code: "668340" },
  { libelle: "Prime de surveillance SEP", code: "661272" },
  { libelle: "Fonctionnement ZES", code: "000000" },
  { libelle: "Fonctionnement délégation syndicale", code: "000000" },
  { libelle: "Fonctionnement bureau B/Ngobila", code: "000000" },
  { libelle: "Fonctionnement sec DP", code: "000000" },
  { libelle: "Fonctionnement unité genre", code: "000000" },
  { libelle: "Fonctionnement bureau SEP", code: "000000" },
  { libelle: "Fonctionnement bureau TCPK", code: "000000" },
  { libelle: "Fonctionnement bureau Nocafex", code: "000000" },
  { libelle: "Fonctionnement bureau Lerexcom", code: "000000" },
  { libelle: "Fonctionnement bureau GU", code: "000000" },
  { libelle: "Service ext", code: "000000" },
  { libelle: "Salubrité", code: "000000" },
  { libelle: "Plomberie", code: "000000" },
  { libelle: "Manutention", code: "000000" },
  { libelle: "Prêt accordé", code: "000000" },
  { libelle: "Achat serrure, pendule", code: "000000" },
  { libelle: "Prime STDA", code: "000000" },
  { libelle: "Prime Bralima", code: "000000" },
  { libelle: "Prime Bracongo", code: "000000" },
  { libelle: "Motivation aux aviseurs", code: "000000" },
  { libelle: "Elaboration rapport de paie", code: "000000" },
];

export default function DepenseFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { depenses, isLoading, deleteDepense: deleteDepenseMutation } = useDepenses();
  const { isInstructeur, isAdmin, loading: roleLoading } = useLocalUserRole();
  
  const [activeTab, setActiveTab] = useState("create");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPeriod, setSearchPeriod] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Détecter si on arrive via /depenses/modifier pour ouvrir l'onglet liste
  useEffect(() => {
    if (location.pathname === '/depenses/modifier') {
      setActiveTab('list');
    }
  }, [location.pathname]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    numeroOrd: "",
    numeroBEO: "",
    libelle: "",
    montant: "",
    imp: "",
  });

  const [libelleMontantLettre, setLibelleMontantLettre] = useState("");
  const [impMode, setImpMode] = useState<"select" | "manual">("select");

  // Générer automatiquement le N° d'ord au chargement du composant
  useEffect(() => {
    const generateNextNumeroOrd = async () => {
      try {
        // Récupérer toutes les dépenses pour trouver le numéro le plus élevé
        const { data, error } = await supabase
          .from('depenses')
          .select('numero_bon')
          .order('numero_bon', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Erreur lors de la récupération du dernier N° d\'ord:', error);
          setFormData(prev => ({ ...prev, numeroOrd: "0001" }));
          return;
        }

        let nextNumero = 1;
        if (data && data.length > 0 && (data as any)[0].numero_bon) {
          const lastNumero = parseInt((data as any)[0].numero_bon.toString(), 10);
          nextNumero = lastNumero + 1;
        }

        // Formater avec 4 chiffres
        const formattedNumero = nextNumero.toString().padStart(4, '0');
        setFormData(prev => ({ ...prev, numeroOrd: formattedNumero }));
      } catch (err) {
        console.error('Erreur:', err);
        setFormData(prev => ({ ...prev, numeroOrd: "0001" }));
      }
    };

    generateNextNumeroOrd();
  }, []);

  // Gérer le changement de mode IMP
  const handleImpModeChange = (mode: "select" | "manual") => {
    setImpMode(mode);
    if (mode === "manual") {
      setFormData(prev => ({ ...prev, imp: "" }));
    }
  };

  // Mettre à jour le montant en lettres
  const handleMontantChange = (value: string) => {
    setFormData(prev => ({ ...prev, montant: value }));
    const montantNum = parseFloat(value);
    if (!isNaN(montantNum) && montantNum > 0) {
      setLibelleMontantLettre(montantEnLettre(montantNum));
    } else {
      setLibelleMontantLettre("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.date || !formData.libelle || !formData.montant || !formData.imp) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // TODO: Implémenter la sauvegarde dans les dépenses et feuille de caisse
    console.log("Données du formulaire:", {
      ...formData,
      montantEnLettres: libelleMontantLettre,
    });
    
    // Rediriger vers les dépenses après enregistrement
    navigate('/depenses');
  };

  // Vérification des droits d'accès
  if (roleLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isInstructeur && !isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Nouvelle Dépense"
          description="Enregistrer une nouvelle dépense"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Seuls les utilisateurs avec le rôle Instructeur ou Administrateur peuvent créer des dépenses.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filtrage des dépenses
  const filteredDepenses = (depenses || []).filter(depense => {
    // Filtre par recherche textuelle
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matchesSearch = (
        depense.motif?.toLowerCase().includes(query) ||
        depense.numero_bon?.toString().includes(query) ||
        depense.numero_beo?.toLowerCase().includes(query) ||
        depense.beneficiaire?.toLowerCase().includes(query) ||
        depense.montant?.toString().includes(query)
      );
    }

    // Filtre par période
    let matchesPeriod = true;
    if (searchPeriod.startDate || searchPeriod.endDate) {
      const depenseDate = depense.date_transaction ? new Date(depense.date_transaction) : null;
      if (depenseDate) {
        if (searchPeriod.startDate) {
          matchesPeriod = matchesPeriod && depenseDate >= new Date(searchPeriod.startDate);
        }
        if (searchPeriod.endDate) {
          matchesPeriod = matchesPeriod && depenseDate <= new Date(searchPeriod.endDate);
        }
      } else {
        matchesPeriod = false;
      }
    }

    return matchesSearch && matchesPeriod;
  });

  const handleEdit = (depense: Depense) => {
    setSelectedDepense(depense);
    setIsEditDialogOpen(true);
  };

  const handleView = (depense: Depense) => {
    setSelectedDepense(depense);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (depense: Depense) => {
    if (depense.id) {
      await deleteDepenseMutation.mutateAsync(depense.id);
    }
  };

  const columns: Column<Depense>[] = [
    {
      key: "date_transaction",
      header: "Date",
      render: (depense) => depense.date_transaction 
        ? format(new Date(depense.date_transaction), "dd/MM/yyyy", { locale: fr })
        : "—",
    },
    {
      key: "numero_bon",
      header: "N° Bon",
      render: (depense) => (
        <Badge variant="outline" className="font-mono">
          {depense.numero_bon || "—"}
        </Badge>
      ),
    },
    {
      key: "numero_beo",
      header: "N° BÉO",
      render: (depense) => (
        <span className="font-mono text-sm">
          {depense.numero_beo || "—"}
        </span>
      ),
    },
    {
      key: "motif",
      header: "Motif",
      render: (depense) => (
        <div className="max-w-xs truncate" title={depense.motif || ""}>
          {depense.motif || "—"}
        </div>
      ),
    },
    {
      key: "beneficiaire",
      header: "Bénéficiaire",
      render: (depense) => (
        <div className="max-w-xs truncate" title={depense.beneficiaire || ""}>
          {depense.beneficiaire || "—"}
        </div>
      ),
    },
    {
      key: "montant",
      header: "Montant",
      render: (depense) => (
        <span className="font-semibold text-red-600">
          {depense.montant ? formatMontant(depense.montant) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (depense) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(depense)}
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(depense)}
            disabled={deleteDepenseMutation.isPending}
            title="Modifier"
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleteDepenseMutation.isPending}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette dépense ?
                  <br />
                  <strong>N° Bon:</strong> {depense.numero_bon}
                  <br />
                  <strong>Motif:</strong> {depense.motif}
                  <br />
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(depense)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Dépenses"
        description="Créer de nouvelles dépenses et modifier les dépenses existantes"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Dépense
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <Search className="h-4 w-4" />
            Rechercher & Modifier
          </TabsTrigger>
        </TabsList>

        {/* Onglet Création */}
        <TabsContent value="create" className="space-y-6">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">{/* Le reste du formulaire continue... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Date d'enregistrement */}
            <div className="space-y-2">
              <Label htmlFor="date">Date d'enregistrement *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            {/* 2. N°BEO */}
            <div className="space-y-2">
              <Label htmlFor="numeroBEO">N°BEO (4 chiffres)</Label>
              <Input
                id="numeroBEO"
                value={formData.numeroBEO}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormData(prev => ({ ...prev, numeroBEO: value }));
                }}
                placeholder="0000"
                maxLength={4}
              />
            </div>

            {/* 3. N°d'ord - Auto-généré */}
            <div className="space-y-2">
              <Label htmlFor="numeroOrd">N°d'ord (Auto) *</Label>
              <Input
                id="numeroOrd"
                value={formData.numeroOrd}
                disabled
                className="bg-gray-100 font-mono text-center"
              />
              <p className="text-xs text-gray-500">Numérotation automatique en ordre croissant</p>
            </div>

            {/* 4. LIBELLE - Saisie libre */}
            <div className="space-y-2">
              <Label htmlFor="libelle">LIBELLE *</Label>
              <Input
                id="libelle"
                value={formData.libelle}
                onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
                placeholder="Saisie libre du LIBELLE"
                required
              />
            </div>

            {/* 5. Dépenses (Montant) */}
            <div className="space-y-2">
              <Label htmlFor="montant">Dépenses (CDF) *</Label>
              <Input
                id="montant"
                type="number"
                value={formData.montant}
                onChange={(e) => handleMontantChange(e.target.value)}
                placeholder="0"
                className="text-right font-mono"
                required
              />
            </div>

            {/* 6. Code IMP - Sélection ou saisie manuelle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="imp">Code IMP *</Label>
                <button
                  type="button"
                  onClick={() => handleImpModeChange(impMode === "select" ? "manual" : "select")}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {impMode === "select" ? "Saisie manuelle" : "Sélectionner dans la liste"}
                </button>
              </div>
              {impMode === "select" ? (
                <Select
                  value={formData.imp}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, imp: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un code IMP" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {CODE_IMP_OPTIONS.map((option) => (
                      <SelectItem key={option.code + option.libelle} value={option.code}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.code}</span>
                          <span className="text-xs text-gray-500">{option.libelle}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="imp"
                  value={formData.imp}
                  onChange={(e) => setFormData(prev => ({ ...prev, imp: e.target.value }))}
                  placeholder="Saisir le code IMP"
                  className="font-mono"
                  required
                />
              )}
              <p className="text-xs text-gray-500">Saisie libre ou sélection dans la liste</p>
            </div>
          </div>

          {/* 7. Montant en lettres */}
          {libelleMontantLettre && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
              <Label>Montant en lettres</Label>
              <p className="text-sm font-medium text-blue-900">{libelleMontantLettre}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate('/depenses')} className="gap-2">
              <X className="w-4 h-4" />
              Annuler
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="w-4 h-4" />
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>
        </TabsContent>

        {/* Onglet Recherche & Modification */}
        <TabsContent value="list" className="space-y-6">
          {/* Filtres de recherche */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Recherche textuelle</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Libellé, N° bon, bénéficiaire..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Date début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={searchPeriod.startDate}
                  onChange={(e) => setSearchPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Date fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={searchPeriod.endDate}
                  onChange={(e) => setSearchPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {(searchQuery || searchPeriod.startDate || searchPeriod.endDate) && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchPeriod({ startDate: "", endDate: "" });
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </Card>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Total dépenses</span>
              </div>
              <p className="text-2xl font-bold">{depenses?.length || 0}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Search className="h-4 w-4" />
                <span className="text-sm">Résultats trouvés</span>
              </div>
              <p className="text-2xl font-bold">{filteredDepenses.length}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Montant total</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatMontant(
                  filteredDepenses.reduce((sum, d) => sum + (d.montant || 0), 0)
                )}
              </p>
            </div>
          </div>

          {/* Table des dépenses */}
          <DataTable
            columns={columns}
            data={filteredDepenses}
            emptyMessage={
              searchQuery || searchPeriod.startDate || searchPeriod.endDate
                ? "Aucune dépense trouvée avec ces critères"
                : "Aucune dépense enregistrée"
            }
          />
        </TabsContent>
      </Tabs>

      {/* Dialogues de modification et visualisation */}
      {selectedDepense && isEditDialogOpen && (
        <EditDepenseDialog
          depense={selectedDepense}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={async () => {
            setIsEditDialogOpen(false);
            setSelectedDepense(null);
          }}
        />
      )}
      
      {selectedDepense && isViewDialogOpen && (
        <ViewTransactionDialog
          transaction={{
            ...selectedDepense,
            date_transaction: selectedDepense.date_transaction || selectedDepense.date,
            type: 'depense' as const,
          }}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}
    </div>
  );
}
