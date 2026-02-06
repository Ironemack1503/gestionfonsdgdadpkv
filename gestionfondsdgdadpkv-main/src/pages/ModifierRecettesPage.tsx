import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Edit, Trash2, Loader2, Search, AlertCircle, 
  Eye, FileText, Calendar, DollarSign
} from "lucide-react";
import { useRecettes, Recette } from "@/hooks/useRecettes";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
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

export default function ModifierRecettesPage() {
  const navigate = useNavigate();
  const { recettes, isLoading, deleteRecette: deleteRecetteMutation } = useRecettes();
  const { isInstructeur, isAdmin, loading: roleLoading } = useLocalUserRole();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecette, setSelectedRecette] = useState<Recette | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

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
          title="Modifier Recettes"
          description="Rechercher et modifier les recettes enregistrées"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Seuls les utilisateurs avec le rôle Instructeur ou Administrateur peuvent modifier des recettes.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filtrage des recettes
  const filteredRecettes = (recettes || []).filter(recette => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      recette.motif?.toLowerCase().includes(query) ||
      recette.numero_bon?.toString().includes(query) ||
      recette.numero_beo?.toLowerCase().includes(query) ||
      recette.provenance?.toLowerCase().includes(query) ||
      recette.montant?.toString().includes(query)
    );
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
        title="Modifier Recettes"
        description="Rechercher et modifier les recettes enregistrées"
      />

      {/* Barre de recherche */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par libellé, N° bon, provenance, montant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => navigate("/recettes/new")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Nouvelle Recette
        </Button>
      </div>

      {/* Statistiques rapides */}
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
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRecettes}
          emptyMessage={
            searchQuery
              ? "Aucune recette trouvée avec ces critères"
              : "Aucune recette enregistrée"
          }
        />
      )}

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
            type: 'recette' as const,
          }}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}
    </div>
  );
}
