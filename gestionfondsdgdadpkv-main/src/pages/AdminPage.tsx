import { useState } from "react";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { useLocalUserManagement, LocalUser } from "@/hooks/useLocalUserManagement";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, Users, UserPlus, Trash2, History, Pencil, LockOpen, Key, UserX, UserCheck, Activity } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { UserManagementHistory } from "@/components/admin/UserManagementHistory";
import { LoginAuditLog } from "@/components/admin/LoginAuditLog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type AppRole = Database['public']['Enums']['app_role'];

const roleLabels: Record<AppRole, string> = {
  admin: "Administrateur",
  instructeur: "Instructeur",
  observateur: "Observateur",
};

const roleColors: Record<AppRole, string> = {
  admin: "bg-destructive text-destructive-foreground",
  instructeur: "bg-primary text-primary-foreground",
  observateur: "bg-muted text-muted-foreground",
};

// Username validation regex: only letters, numbers, and underscores
const usernameRegex = /^[a-z0-9_]+$/;
const isValidUsername = (username: string) => usernameRegex.test(username);

export default function AdminPage() {
  const { 
    users, 
    loading, 
    actionLoading, 
    createUser, 
    updateUser, 
    resetPassword, 
    unlockUser, 
    deleteUser 
  } = useLocalUserManagement();
  const { user: currentUser, isAdmin, loading: roleLoading } = useLocalAuth();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null);
  
  // Create form
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("observateur");
  
  // Edit form
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("observateur");
  

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const handleCreateUser = async () => {
    if (!newUsername || !newUserPassword) return;
    
    try {
      await createUser(newUsername, newUserPassword, newUserFullName, newUserRole);
      setIsCreateDialogOpen(false);
      setNewUsername("");
      setNewUserPassword("");
      setNewUserFullName("");
      setNewUserRole("observateur");
    } catch (e) {
      // Error handled by hook
    }
  };

  const openEditDialog = (user: LocalUser) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditFullName(user.full_name || "");
    setEditRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUser(selectedUser.id, editUsername, editFullName, editRole);
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (e) {
      // Error handled by hook
    }
  };

  const openResetPasswordDialog = (user: LocalUser) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser?.username) return;
    
    try {
      await resetPassword(selectedUser.username);
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleToggleActive = async (user: LocalUser) => {
    try {
      await updateUser(user.id, undefined, undefined, undefined, !user.is_active);
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleUnlock = async (userId: string) => {
    try {
      await unlockUser(userId);
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
    } catch (e) {
      // Error handled by hook
    }
  };

  const isUserLocked = (user: LocalUser) => {
    return user.is_locked;
  };

  const columns = [
    {
      key: "username",
      header: "Utilisateur",
      render: (user: LocalUser) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{user.username}</span>
        </div>
      ),
    },
    {
      key: "full_name",
      header: "Nom complet",
      render: (user: LocalUser) => user.full_name || "-",
    },
    {
      key: "role",
      header: "Rôle",
      render: (user: LocalUser) => (
        <Badge className={roleColors[user.role]}>
          {roleLabels[user.role]}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (user: LocalUser) => {
        if (!user.is_active) {
          return <Badge variant="destructive">Désactivé</Badge>;
        }
        if (isUserLocked(user)) {
          return <Badge variant="secondary" className="bg-orange-500 text-white">Verrouillé</Badge>;
        }
        return <Badge variant="default" className="bg-green-500">Actif</Badge>;
      },
    },
    {
      key: "last_login",
      header: "Dernière connexion",
      render: (user: LocalUser) => 
        user.last_login_at 
          ? format(new Date(user.last_login_at), "dd MMM yyyy HH:mm", { locale: fr })
          : "Jamais",
    },
    {
      key: "created_at",
      header: "Créé le",
      render: (user: LocalUser) => 
        user.created_at 
          ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: fr })
          : "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (user: LocalUser) => {
        const isCurrentUser = user.id === currentUser?.id;
        
        return (
          <div className="flex items-center gap-1">
            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditDialog(user)}
              title="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            {/* Reset Password */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openResetPasswordDialog(user)}
              title="Réinitialiser le mot de passe"
            >
              <Key className="h-4 w-4" />
            </Button>
            
            {/* Unlock (if locked) */}
            {isUserLocked(user) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUnlock(user.id)}
                title="Déverrouiller"
                className="text-orange-500 hover:text-orange-600"
              >
                <LockOpen className="h-4 w-4" />
              </Button>
            )}
            
            {/* Toggle Active */}
            {!isCurrentUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToggleActive(user)}
                title={user.is_active ? "Désactiver" : "Activer"}
                className={user.is_active ? "text-orange-500 hover:text-orange-600" : "text-green-500 hover:text-green-600"}
              >
                {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </Button>
            )}
            
            {/* Delete */}
            {!isCurrentUser && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Supprimer l'utilisateur"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.username}</strong> ?
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration des utilisateurs"
        description="Gérez les comptes utilisateurs et leurs droits d'accès"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Shield className="h-4 w-4" />
            <span className="text-sm">Administrateurs</span>
          </div>
          <p className="text-2xl font-bold">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Instructeurs</span>
          </div>
          <p className="text-2xl font-bold">
            {users.filter(u => u.role === 'instructeur').length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <UserX className="h-4 w-4" />
            <span className="text-sm">Désactivés</span>
          </div>
          <p className="text-2xl font-bold text-destructive">
            {users.filter(u => !u.is_active).length}
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="login-audit" className="gap-2">
            <Activity className="h-4 w-4" />
            Journal des connexions
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Actions admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="bg-muted/50 border rounded-lg p-4 flex-1 mr-4">
              <h3 className="font-medium mb-2">Niveaux d'accès</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Administrateur:</strong> Accès complet - gestion des utilisateurs, création/modification/suppression de toutes les données</li>
                <li><strong>Instructeur:</strong> Création et modification des recettes, dépenses, rubriques et programmations</li>
                <li><strong>Observateur:</strong> Consultation uniquement - aucune modification possible</li>
              </ul>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Créer un utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour créer un compte utilisateur.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur *</Label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="jean_dupont"
                      required
                    />
                    {newUsername && !isValidUsername(newUsername) && (
                      <p className="text-sm text-destructive">
                        Lettres minuscules, chiffres et underscores uniquement
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet</Label>
                    <Input
                      id="fullName"
                      value={newUserFullName}
                      onChange={(e) => setNewUserFullName(e.target.value)}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={newUserRole} onValueChange={(value: AppRole) => setNewUserRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="instructeur">Instructeur</SelectItem>
                        <SelectItem value="observateur">Observateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateUser} 
                    disabled={!newUsername || !isValidUsername(newUsername) || !newUserPassword || actionLoading}
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              emptyMessage="Aucun utilisateur trouvé"
            />
          )}
        </TabsContent>

        <TabsContent value="login-audit">
          <LoginAuditLog />
        </TabsContent>

        <TabsContent value="history">
          <UserManagementHistory />
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifier les informations de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editUsername">Nom d'utilisateur</Label>
              <Input
                id="editUsername"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                placeholder="nom_utilisateur"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Le nom d'utilisateur ne peut pas être modifié
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFullName">Nom complet</Label>
              <Input
                id="editFullName"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Rôle</Label>
              <Select value={editRole} onValueChange={(value: AppRole) => setEditRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="instructeur">Instructeur</SelectItem>
                  <SelectItem value="observateur">Observateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateUser} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un lien de réinitialisation</DialogTitle>
            <DialogDescription>
              Un email de réinitialisation sera envoyé à <strong>{selectedUser?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={!selectedUser || actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Envoyer le lien
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
