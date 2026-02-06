import { useState } from "react";
import { Plus, Search, Edit, Trash2, Building2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useServices } from "@/hooks/useServices";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
import type { Service } from "@/types/database";

export default function ServicesPage() {
  const { services, isLoading, createService, updateService, deleteService } = useServices();
  const { isAdmin } = useLocalUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    libelle: "",
  });

  const filteredServices = (services || []).filter(
    (s) =>
      s.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = (services || []).filter(s => s.is_active).length;

  const resetForm = () => {
    setFormData({ code: "", libelle: "" });
    setEditingService(null);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      code: service.code,
      libelle: service.libelle,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingService) {
      await updateService.mutateAsync({
        id: editingService.id,
        code: formData.code,
        libelle: formData.libelle,
      });
    } else {
      await createService.mutateAsync({
        code: formData.code,
        libelle: formData.libelle,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleToggleActive = async (service: Service) => {
    await updateService.mutateAsync({
      id: service.id,
      is_active: !service.is_active,
    });
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteService.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const columns = [
    { 
      key: "code", 
      header: "Code",
      render: (item: Service) => (
        <span className="font-mono font-semibold text-primary">{item.code}</span>
      )
    },
    {
      key: "libelle",
      header: "Libellé du Service",
      render: (item: Service) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{item.libelle}</span>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Statut",
      render: (item: Service) => (
        <div className="flex items-center gap-2">
          {item.is_active ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400 font-medium text-sm">Actif</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 dark:text-red-400 font-medium text-sm">Inactif</span>
            </>
          )}
        </div>
      ),
    },
    { 
      key: "created_at", 
      header: "Créé le",
      render: (item: Service) => new Date(item.created_at).toLocaleDateString("fr-FR")
    },
    ...(isAdmin ? [{
      key: "actions",
      header: "Actions",
      render: (item: Service) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={item.is_active}
            onCheckedChange={() => handleToggleActive(item)}
            className="data-[state=checked]:bg-green-500"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => openEditDialog(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive"
            onClick={() => setDeleteConfirmId(item.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Services"
        description="Services / Provenances des entrées de caisse"
        actions={
          isAdmin ? (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingService ? "Modifier le Service" : "Créer un Service"}</DialogTitle>
                  <DialogDescription>
                    {editingService ? "Modifiez les informations du service" : "Les services identifient la provenance des recettes"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code du Service *</Label>
                    <Input
                      id="code"
                      placeholder="Ex: SRV-001"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">Code unique pour identifier le service</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="libelle">Libellé du Service *</Label>
                    <Input
                      id="libelle"
                      placeholder="Ex: Direction des Ressources Humaines"
                      value={formData.libelle}
                      onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                      required
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">Nom complet du service</p>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createService.isPending || updateService.isPending}>
                      {(createService.isPending || updateService.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingService ? "Mettre à jour" : "Créer le service"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par code ou libellé..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 p-4 bg-accent rounded-lg">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <span className="font-semibold">{(services ?? []).length}</span>
          <span className="text-muted-foreground">services au total</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="font-semibold">{activeCount}</span>
          <span className="text-muted-foreground">actifs</span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={filteredServices} emptyMessage="Aucun service créé" />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.
              Un service ne peut être supprimé que s'il n'est lié à aucune transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
