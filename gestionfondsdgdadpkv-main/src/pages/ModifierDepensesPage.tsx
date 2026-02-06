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
import { useDepenses, Depense } from "@/hooks/useDepenses";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
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

export default function ModifierDepensesPage() {
  const navigate = useNavigate();
  const { depenses, isLoading, deleteDepense: deleteDepenseMutation } = useDepenses();
  const { isInstructeur, isAdmin, loading: roleLoading } = useLocalUserRole();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
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
          title="Modifier Dépenses"
          description="Rechercher et modifier les dépenses enregistrées"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Seuls les utilisateurs avec le rôle Instructeur ou Administrateur peuvent modifier des dépenses.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filtrage des dépenses
  const filteredDepenses = (depenses || []).filter(depense => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      depense.motif?.toLowerCase().includes(query) ||
      depense.numero_bon?.toString().includes(query) ||
      depense.numero_beo?.toLowerCase().includes(query) ||
      depense.beneficiaire?.toLowerCase().includes(query) ||
      depense.montant?.toString().includes(query)
    );
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
        title="Modifier Dépenses"
        description="Rechercher et modifier les dépenses enregistrées"
      />

      {/* Barre de recherche */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par motif, N° bon, bénéficiaire, montant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => navigate("/depenses/new")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Nouvelle Dépense
        </Button>
      </div>

      {/* Statistiques rapides */}
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
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredDepenses}
          emptyMessage={
            searchQuery
              ? "Aucune dépense trouvée avec ces critères"
              : "Aucune dépense enregistrée"
          }
        />
      )}

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
            type: 'depense' as const,
          }}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}
    </div>
  );
}
