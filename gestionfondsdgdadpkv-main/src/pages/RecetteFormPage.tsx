import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, AlertCircle, Search, FileText, DollarSign, Calendar, Eye, Edit, Trash2, Loader2, Plus } from "lucide-react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useRubriques } from "@/hooks/useRubriques";
import { montantEnLettre } from "@/lib/montantEnLettre";
import { supabase } from "@/integrations/supabase/client";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { useRecettes, Recette } from "@/hooks/useRecettes";
import { formatMontant } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EditRecetteDialog, ViewTransactionDialog } from "@/components/dialogs";
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

// Mapping LIBELLE -> IMP (tous les libellés pointent vers 707820 par défaut)
const IMP_PAR_DEFAUT = "707820";

const LIBELLE_SUGGESTIONS = [
  "Solde du 31/10/2025",
  "KV, Fonctionnement BCDC",
  "KV, Fonctionnement Raw Bank",
  "KV, Vente imprimés",
  "DG, Surveillance SEP",
  "KV, PV",
  "KV, Surveillance Bralima",
  "KV, Surveillance Bracongo",
  "KV, Prime STDA",
  "Allocation décès",
];

export default function RecetteFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { rubriques } = useRubriques();
  const { recettes, isLoading, deleteRecette: deleteRecetteMutation } = useRecettes();
  const { isInstructeur, isAdmin, loading: roleLoading } = useLocalUserRole();
  
  const [activeTab, setActiveTab] = useState("create");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPeriod, setSearchPeriod] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedRecette, setSelectedRecette] = useState<Recette | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Détecter si on arrive via /recettes/modifier pour ouvrir l'onglet liste
  useEffect(() => {
    if (location.pathname === '/recettes/modifier') {
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

  const [showLibelleSuggestions, setShowLibelleSuggestions] = useState(false);
  const [libelleMontantLettre, setLibelleMontantLettre] = useState("");

  // Générer automatiquement le N° d'ord au chargement du composant
  useEffect(() => {
    const generateNextNumeroOrd = async () => {
      try {
        // Récupérer toutes les recettes pour trouver le numéro le plus élevé
        const { data, error } = await supabase
          .from('recettes')
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

  // Filtrer les suggestions de libellé
  const filteredSuggestions = useMemo(() => {
    if (!formData.libelle) return LIBELLE_SUGGESTIONS;
    return LIBELLE_SUGGESTIONS.filter(label =>
      label.toLowerCase().includes(formData.libelle.toLowerCase())
    );
  }, [formData.libelle]);

  // Mettre à jour l'IMP quand le libellé change (toujours 707820)
  const handleLibelleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      libelle: value,
      imp: IMP_PAR_DEFAUT,
    }));
    setShowLibelleSuggestions(false);
  };

  // Fermer la liste de suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.libelle-autocomplete-container')) {
        setShowLibelleSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    // TODO: Implémenter la sauvegarde dans les recettes et feuille de caisse
    console.log("Données du formulaire:", {
      ...formData,
      montantEnLettres: libelleMontantLettre,
    });
    
    // Rediriger vers les recettes après enregistrement
    navigate('/recettes');
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
          title="Nouvelle Recette"
          description="Enregistrer une nouvelle recette"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Seuls les utilisateurs avec le rôle Instructeur ou Administrateur peuvent créer des recettes.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filtrage des recettes
  const filteredRecettes = (recettes || []).filter(recette => {
    // Filtre par recherche textuelle
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matchesSearch = (
        recette.motif?.toLowerCase().includes(query) ||
        recette.numero_bon?.toString().includes(query) ||
        recette.numero_beo?.toLowerCase().includes(query) ||
        recette.provenance?.toLowerCase().includes(query) ||
        recette.montant?.toString().includes(query)
      );
    }

    // Filtre par période
    let matchesPeriod = true;
    if (searchPeriod.startDate || searchPeriod.endDate) {
      const recetteDate = recette.date_transaction ? new Date(recette.date_transaction) : null;
      if (recetteDate) {
        if (searchPeriod.startDate) {
          matchesPeriod = matchesPeriod && recetteDate >= new Date(searchPeriod.startDate);
        }
        if (searchPeriod.endDate) {
          matchesPeriod = matchesPeriod && recetteDate <= new Date(searchPeriod.endDate);
        }
      } else {
        matchesPeriod = false;
      }
    }

    return matchesSearch && matchesPeriod;
  });

  const handleEdit = (recette: Recette) => {
    setSelectedRecette(recette);
    setIsEditDialogOpen(true);
  };

  const handleView = (recette: Recette) => {
    setSelectedRecette(recette);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (recette: Recette) => {
    if (recette.id) {
      await deleteRecetteMutation.mutateAsync(recette.id);
    }
  };

  const columns: Column<Recette>[] = [
    {
      key: "date_transaction",
      header: "Date",
      render: (recette) => recette.date_transaction 
        ? format(new Date(recette.date_transaction), "dd/MM/yyyy", { locale: fr })
        : "—",
    },
    {
      key: "numero_bon",
      header: "N° Bon",
      render: (recette) => (
        <Badge variant="outline" className="font-mono">
          {recette.numero_bon || "—"}
        </Badge>
      ),
    },
    {
      key: "numero_beo",
      header: "N° BÉO",
      render: (recette) => (
        <span className="font-mono text-sm">
          {recette.numero_beo || "—"}
        </span>
      ),
    },
    {
      key: "motif",
      header: "Motif",
      render: (recette) => (
        <div className="max-w-xs truncate" title={recette.motif || ""}>
          {recette.motif || "—"}
        </div>
      ),
    },
    {
      key: "provenance",
      header: "Provenance",
      render: (recette) => (
        <div className="max-w-xs truncate" title={recette.provenance || ""}>
          {recette.provenance || "—"}
        </div>
      ),
    },
    {
      key: "montant",
      header: "Montant",
      render: (recette) => (
        <span className="font-semibold text-green-600">
          {recette.montant ? formatMontant(recette.montant) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (recette) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(recette)}
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(recette)}
            disabled={deleteRecetteMutation.isPending}
            title="Modifier"
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleteRecetteMutation.isPending}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette recette ?
                  <br />
                  <strong>N° Bon:</strong> {recette.numero_bon}
                  <br />
                  <strong>Motif:</strong> {recette.motif}
                  <br />
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(recette)}
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
        title="Gestion des Recettes"
        description="Créer de nouvelles recettes et modifier les recettes existantes"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Recette
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <Search className="h-4 w-4" />
            Rechercher & Modifier
          </TabsTrigger>
        </TabsList>

        {/* Onglet Création */}
        <TabsContent value="create" className="space-y-6">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* 4. LIBELLE avec autocomplete */}
                <div className="space-y-2 relative libelle-autocomplete-container">
                  <Label htmlFor="libelle">LIBELLE *</Label>
                  <div className="relative">
                    <Input
                      id="libelle"
                      value={formData.libelle}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, libelle: e.target.value }));
                        setShowLibelleSuggestions(true);
                      }}
                      onFocus={() => setShowLibelleSuggestions(true)}
                      placeholder="Saisie libre ou sélection dans la liste"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLibelleSuggestions(!showLibelleSuggestions)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      title="Afficher la liste des suggestions"
                      aria-label="Afficher la liste des suggestions"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                  {showLibelleSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto mt-1">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleLibelleChange(suggestion);
                          }}
                        >
                          <div className="font-medium text-gray-900">{suggestion}</div>
                          <div className="text-xs text-gray-500 mt-1">IMP: {IMP_PAR_DEFAUT}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Recettes (Montant) */}
                <div className="space-y-2">
                  <Label htmlFor="montant">Recettes (CDF) *</Label>
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

                {/* 6. IMP (défini automatiquement par le LIBELLE) */}
                <div className="space-y-2">
                  <Label htmlFor="imp">Code IMP *</Label>
                  <Input
                    id="imp"
                    value={formData.imp}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Défini automatiquement par le LIBELLE</p>
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
                <Button type="button" variant="outline" onClick={() => navigate('/recettes')} className="gap-2">
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
                    placeholder="Libellé, N° bon, provenance..."
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
                <span className="text-sm">Total recettes</span>
              </div>
              <p className="text-2xl font-bold">{recettes?.length || 0}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Search className="h-4 w-4" />
                <span className="text-sm">Résultats trouvés</span>
              </div>
              <p className="text-2xl font-bold">{filteredRecettes.length}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Montant total</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatMontant(
                  filteredRecettes.reduce((sum, r) => sum + (r.montant || 0), 0)
                )}
              </p>
            </div>
          </div>

          {/* Table des recettes */}
          <DataTable
            columns={columns}
            data={filteredRecettes}
            emptyMessage={
              searchQuery || searchPeriod.startDate || searchPeriod.endDate
                ? "Aucune recette trouvée avec ces critères"
                : "Aucune recette enregistrée"
            }
          />
        </TabsContent>
      </Tabs>

      {/* Dialogues de modification et visualisation */}
      {selectedRecette && isEditDialogOpen && (
        <EditRecetteDialog
          recette={selectedRecette}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={async () => {
            setIsEditDialogOpen(false);
            setSelectedRecette(null);
          }}
        />
      )}
      
      {selectedRecette && isViewDialogOpen && (
        <ViewTransactionDialog
          transaction={{
            ...selectedRecette,
            date_transaction: selectedRecette.date_transaction || selectedRecette.date,
            type: 'recette' as const,
          }}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}
    </div>
  );
}
