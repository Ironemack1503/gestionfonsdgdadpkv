import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Shield, Key, Save, ArrowLeft, Trash2, Database as DatabaseIcon } from "lucide-react";
import { clearAllCache, getCacheStats } from "@/hooks/useLocalStorageCache";
import { Database } from "@/integrations/supabase/types";
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

type AppRole = Database["public"]["Enums"]["app_role"];

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

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  created_at: string | null;
  role: AppRole;
}

export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useLocalAuth();
  const { isAdmin, loading: roleLoading } = useLocalUserRole();

  const targetUserId = searchParams.get("userId");
  const isEditingOther = !!targetUserId && targetUserId !== currentUser?.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cacheStats, setCacheStats] = useState(getCacheStats());
  const [clearingCache, setClearingCache] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [targetUserId, currentUser]);

  const fetchProfile = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userIdToFetch = targetUserId || currentUser.id;

      // Récupérer le profil depuis la table profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, created_at")
        .eq("user_id", userIdToFetch)
        .maybeSingle();

      if (profileError) throw profileError;

      // Récupérer le rôle depuis user_roles
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userIdToFetch)
        .maybeSingle();

      if (!profileData) {
        setProfile(null);
        toast({
          title: "Profil introuvable",
          description: "Aucun utilisateur ne correspond à cet identifiant.",
          variant: "destructive",
        });
        return;
      }

      setProfile({
        id: profileData.id,
        user_id: profileData.user_id,
        username: profileData.username,
        full_name: profileData.full_name,
        created_at: profileData.created_at,
        role: roleData?.role || 'observateur',
      });
      setFullName(profileData.full_name || "");
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      // Only admins can edit other users
      if (isEditingOther && !isAdmin) {
        throw new Error("Accès refusé");
      }

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le profil a été mis à jour",
      });

      setProfile({ ...profile, full_name: fullName });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setResettingPassword(true);

      if (!profile) throw new Error("Profil introuvable");

      if (isEditingOther) {
        if (!isAdmin) throw new Error("Accès refusé");

        const { error } = await supabase.auth.resetPasswordForEmail(profile.username);
        if (error) throw error;

        toast({
          title: "Lien envoyé",
          description: "Un email de réinitialisation a été envoyé.",
        });
      } else {
        if (!newPassword || newPassword !== confirmPassword) {
          throw new Error("Les mots de passe ne correspondent pas");
        }

        if (newPassword.length < 6) {
          throw new Error("Le mot de passe doit contenir au moins 6 caractères");
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le mot de passe a été mis à jour",
        });
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réinitialiser le mot de passe",
        variant: "destructive",
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      clearAllCache();
      setCacheStats(getCacheStats());
      toast({
        title: "Cache vidé",
        description: "Le cache local a été vidé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de vider le cache",
        variant: "destructive",
      });
    } finally {
      setClearingCache(false);
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only admins can edit other users
  if (isEditingOther && !isAdmin) {
    navigate("/profile");
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {isEditingOther && (
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <PageHeader
          title={isEditingOther ? "Modifier l'utilisateur" : "Mon Profil"}
          description={
            isEditingOther
              ? `Modifier les informations de ${profile?.full_name || profile?.username}`
              : "Gérez vos informations personnelles"
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations du profil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Modifiez les informations du profil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={profile?.username || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Le nom d'utilisateur ne peut pas être modifié
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Entrez le nom complet"
              />
            </div>

            <div className="space-y-2">
              <Label>Rôle</Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                {profile?.role && (
                  <Badge className={roleColors[profile.role]}>
                    {roleLabels[profile.role]}
                  </Badge>
                )}
              </div>
              {!isEditingOther && (
                <p className="text-xs text-muted-foreground">
                  Contactez un administrateur pour changer votre rôle
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date d'inscription</Label>
              <p className="text-sm text-muted-foreground">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "-"}
              </p>
            </div>

            <Separator />

            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer les modifications
            </Button>
          </CardContent>
        </Card>

        {/* Sécurité - Mot de passe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              {isEditingOther
                ? "Envoyez un lien de réinitialisation à cet utilisateur"
                : "Modifiez votre mot de passe"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingOther ? (
              <p className="text-sm text-muted-foreground">
                Un email de réinitialisation sera envoyé à l'utilisateur sélectionné.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </>
            )}

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={
                    resettingPassword ||
                    (isEditingOther ? !profile?.username : !newPassword || !confirmPassword)
                  }
                >
                  {resettingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  {isEditingOther ? "Envoyer le lien" : "Réinitialiser le mot de passe"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la réinitialisation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir réinitialiser le mot de passe
                    {isEditingOther
                      ? ` de ${profile?.full_name || profile?.username}`
                      : ""}
                    ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetPassword}>
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Données et cache - Seulement pour son propre profil */}
        {!isEditingOther && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="h-5 w-5" />
                Données et cache
              </CardTitle>
              <CardDescription>
                Gérez les données mises en cache localement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Statistiques du cache</Label>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Entrées: {cacheStats.count}</span>
                  <span>Taille: {cacheStats.size}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Le cache local améliore les performances en stockant temporairement les données fréquemment utilisées. 
                Vider le cache peut résoudre certains problèmes d'affichage.
              </p>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={clearingCache || cacheStats.count === 0}
                  >
                    {clearingCache ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Vider le cache
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Vider le cache local</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera toutes les données mises en cache localement. 
                      Les données seront rechargées depuis le serveur lors de votre prochaine visite.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearCache}>
                      Vider le cache
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
