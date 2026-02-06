import { useState } from "react";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useLocalUserManagement, LocalUser } from "@/hooks/useLocalUserManagement";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, UserPlus, Trash2, History, Pencil, LockOpen, Key, UserX, UserCheck, Activity, LayoutGrid, LayoutList } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

export default function UtilisateursPage() {
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
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  const [searchQuery, setSearchQuery] = useState("");
  
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

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUser(
        selectedUser.id,
        editUsername,
        editFullName,
        editRole
      );
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!selectedUser || !newPassword) return;
    
    try {
      // Note: resetPassword uses email-based password reset via Supabase
      const email = selectedUser.username.includes('@') 
        ? selectedUser.username 
        : `${selectedUser.username}@local.test`;
      await resetPassword(email);
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleUnlockUser = async (userId: string) => {
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

  const columns: Column<LocalUser>[] = [
    {
      key: "username",
      header: "Nom d'utilisateur",
      render: (user: LocalUser) => {
        const isCurrentUser = user.id === currentUser?.id;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.username}</span>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">Vous</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "full_name",
      header: "Nom complet",
      render: (user: LocalUser) => user.full_name || <span className="text-muted-foreground">—</span>,
    },
    {
      key: "role",
      header: "Rôle",
      render: (user: LocalUser) => {
        const role = user.role as AppRole;
        return (
          <Badge className={roleColors[role]}>
            {roleLabels[role]}
          </Badge>
        );
      },
    },
    {
      key: "is_locked",
      header: "Statut",
      render: (user: LocalUser) => {
        const isLocked = user.is_locked;
        const isActive = user.is_active;
        
        if (!isActive) {
          return (
            <Badge variant="outline" className="gap-1">
              <UserX className="h-3 w-3" />
              Inactif
            </Badge>
          );
        }
        
        if (isLocked) {
          return (
            <Badge variant="destructive" className="gap-1">
              <Key className="h-3 w-3" />
              Verrouillé
            </Badge>
          );
        }
        
        return (
          <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
            <UserCheck className="h-3 w-3" />
            Actif
          </Badge>
        );
      },
    },
    {
      key: "failed_login_attempts",
      header: "Tentatives échouées",
      render: (user: LocalUser) => {
        const attempts = user.failed_login_attempts || 0;
        return (
          <span className={attempts >= 3 ? "text-destructive font-medium" : ""}>
            {attempts}
          </span>
        );
      },
    },
    {
      key: "last_login_at",
      header: "Dernière connexion",
      render: (user: LocalUser) => {
        const lastLogin = user.last_login_at;
        if (!lastLogin) return <span className="text-muted-foreground">Jamais</span>;
        return format(new Date(lastLogin), "dd/MM/yyyy HH:mm", { locale: fr });
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (user: LocalUser) => {
        const isCurrentUser = user.id === currentUser?.id;
        
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(user)}
              disabled={actionLoading}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(user)}
                  disabled={actionLoading}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                  <DialogDescription>
                    Définir un nouveau mot de passe pour {user.username}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleResetPassword(formData.get("newPassword") as string);
                }}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Réinitialiser
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            {user.is_locked && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnlockUser(user.id)}
                disabled={actionLoading}
              >
                <LockOpen className="h-4 w-4" />
              </Button>
            )}
            
            {!isCurrentUser && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
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
                      Supprimer
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

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render user in list view
  const renderUserCard = (user: LocalUser) => {
    const isCurrentUser = user.id === currentUser?.id;
    const role = user.role as AppRole;
    
    return (
      <Card key={user.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{user.username}</h3>
                {isCurrentUser && (
                  <Badge variant="outline" className="text-xs">Vous</Badge>
                )}
              </div>
              {user.full_name && (
                <p className="text-sm text-muted-foreground">{user.full_name}</p>
              )}
            </div>
            <Badge className={roleColors[role]}>
              {roleLabels[role]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Section */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut:</span>
            <div>
              {!user.is_active ? (
                <Badge variant="outline" className="gap-1">
                  <UserX className="h-3 w-3" />
                  Inactif
                </Badge>
              ) : user.is_locked ? (
                <Badge variant="destructive" className="gap-1">
                  <Key className="h-3 w-3" />
                  Verrouillé
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                  <UserCheck className="h-3 w-3" />
                  Actif
                </Badge>
              )}
            </div>
          </div>

          {/* Failed Attempts */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tentatives échouées:</span>
            <span className={`font-medium ${(user.failed_login_attempts || 0) >= 3 ? "text-destructive" : ""}`}>
              {user.failed_login_attempts || 0}
            </span>
          </div>

          {/* Last Login */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Dernière connexion:</span>
            <span className="text-sm">
              {user.last_login_at 
                ? format(new Date(user.last_login_at), "dd/MM/yyyy HH:mm", { locale: fr })
                : <span className="text-muted-foreground">Jamais</span>
              }
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditDialog(user)}
              disabled={actionLoading}
              className="flex-1"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(user)}
                  disabled={actionLoading}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                  <DialogDescription>
                    Définir un nouveau mot de passe pour {user.username}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleResetPassword(formData.get("newPassword") as string);
                }}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor={`newPassword-${user.id}`}>Nouveau mot de passe</Label>
                      <Input
                        id={`newPassword-${user.id}`}
                        name="newPassword"
                        type="password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Réinitialiser
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            {user.is_locked && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnlockUser(user.id)}
                disabled={actionLoading}
              >
                <LockOpen className="h-4 w-4" />
              </Button>
            )}
            
            {!isCurrentUser && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
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
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Créer et gérer les utilisateurs de l'application"
      />

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Activity className="h-4 w-4" />
            Audit des connexions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {users.length} utilisateur(s)
              </div>
              
              {/* View Mode Toggle */}
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "table" | "list")}>
                <ToggleGroupItem value="table" aria-label="Vue tableau">
                  <LayoutList className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Vue liste">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
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
                    Remplissez les informations pour créer un nouveau compte utilisateur
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur *</Label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                      placeholder="ex: jdupont"
                      required
                    />
                    {newUsername && !isValidUsername(newUsername) && (
                      <p className="text-xs text-destructive">
                        Utilisez uniquement des lettres minuscules, chiffres et underscores
                      </p>
                    )}
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
                      minLength={6}
                    />
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
                    <Label htmlFor="role">Rôle *</Label>
                    <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as AppRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="observateur">
                          <div className="flex items-center gap-2">
                            <Badge className={roleColors.observateur}>Observateur</Badge>
                            <span className="text-xs text-muted-foreground">Lecture seule</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="instructeur">
                          <div className="flex items-center gap-2">
                            <Badge className={roleColors.instructeur}>Instructeur</Badge>
                            <span className="text-xs text-muted-foreground">Lecture et édition</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Badge className={roleColors.admin}>Administrateur</Badge>
                            <span className="text-xs text-muted-foreground">Tous les droits</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={!newUsername || !newUserPassword || !isValidUsername(newUsername) || actionLoading}
                  >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search Bar */}
          {viewMode === "list" && (
            <div className="w-full max-w-md">
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Table View */}
          {viewMode === "table" ? (
            <DataTable
              columns={columns}
              data={users}
            />
          ) : (
            /* List View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  {searchQuery ? "Aucun utilisateur trouvé" : "Aucun utilisateur"}
                </div>
              ) : (
                filteredUsers.map(renderUserCard)
              )}
            </div>
          )}

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
                  <Label htmlFor="editUsername">Nom d'utilisateur *</Label>
                  <Input
                    id="editUsername"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editFullName">Nom complet</Label>
                  <Input
                    id="editFullName"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editRole">Rôle *</Label>
                  <Select value={editRole} onValueChange={(value) => setEditRole(value as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="observateur">
                        <Badge className={roleColors.observateur}>Observateur</Badge>
                      </SelectItem>
                      <SelectItem value="instructeur">
                        <Badge className={roleColors.instructeur}>Instructeur</Badge>
                      </SelectItem>
                      <SelectItem value="admin">
                        <Badge className={roleColors.admin}>Administrateur</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleEditUser} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="history">
          <UserManagementHistory />
        </TabsContent>

        <TabsContent value="audit">
          <LoginAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
