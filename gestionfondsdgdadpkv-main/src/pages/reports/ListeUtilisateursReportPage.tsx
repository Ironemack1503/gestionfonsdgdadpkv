import { useState } from "react";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { DataTable } from "@/components/shared/DataTable";
import { useLocalUserManagement, LocalUser } from "@/hooks/useLocalUserManagement";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Loader2, Users, Shield, UserX, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToPDF, exportToExcel, PDFExportSettings } from "@/lib/exportUtils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Database } from "@/integrations/supabase/types";

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

export default function ListeUtilisateursReportPage() {
  const { users, loading } = useLocalUserManagement();
  const { isAdmin, loading: roleLoading } = useLocalAuth();
  const [isExporting, setIsExporting] = useState(false);

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const activeUsers = users.filter(u => u.is_active);
  const adminUsers = users.filter(u => u.role === 'admin');
  const instructeurUsers = users.filter(u => u.role === 'instructeur');

  const isUserLocked = (user: LocalUser) => {
    return user.locked_until && new Date(user.locked_until) > new Date();
  };

  const columns = [
    {
      key: "username",
      header: "Utilisateur",
      render: (user: LocalUser) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{user.username}</span>
          {user.is_protected && (
            <Badge variant="outline" className="text-xs">
              Protégé
            </Badge>
          )}
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
  ];

  const handleExportPDF = async (settings?: PDFExportSettings) => {
    setIsExporting(true);
    try {
      const exportData = users.map((u, index) => ({
        numero: index + 1,
        username: u.username,
        full_name: u.full_name || "-",
        role: roleLabels[u.role],
        statut: !u.is_active ? "Désactivé" : (isUserLocked(u) ? "Verrouillé" : "Actif"),
        derniere_connexion: u.last_login_at 
          ? format(new Date(u.last_login_at), "dd/MM/yyyy HH:mm", { locale: fr })
          : "Jamais",
        date_creation: u.created_at 
          ? format(new Date(u.created_at), "dd/MM/yyyy", { locale: fr })
          : "-",
      }));

      await exportToPDF({
        title: "LISTE DES UTILISATEURS",
        filename: `liste_utilisateurs_${new Date().toISOString().split('T')[0]}`,
        subtitle: `Total: ${users.length} utilisateurs - Actifs: ${activeUsers.length} - Admins: ${adminUsers.length} - Instructeurs: ${instructeurUsers.length}`,
        columns: [
          { header: 'N°', key: 'numero', width: 8 },
          { header: 'Utilisateur', key: 'username', width: 20 },
          { header: 'Nom complet', key: 'full_name', width: 25 },
          { header: 'Rôle', key: 'role', width: 18 },
          { header: 'Statut', key: 'statut', width: 12 },
          { header: 'Dernière connexion', key: 'derniere_connexion', width: 22 },
          { header: 'Date création', key: 'date_creation', width: 15 },
        ],
        data: exportData,
        pdfSettings: { ...settings, orientation: 'landscape' },
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async (settings?: PDFExportSettings) => {
    setIsExporting(true);
    try {
      const exportData = users.map((u, index) => ({
        numero: index + 1,
        username: u.username,
        full_name: u.full_name || "-",
        role: roleLabels[u.role],
        statut: !u.is_active ? "Désactivé" : (isUserLocked(u) ? "Verrouillé" : "Actif"),
        derniere_connexion: u.last_login_at 
          ? format(new Date(u.last_login_at), "dd/MM/yyyy HH:mm", { locale: fr })
          : "Jamais",
        date_creation: u.created_at 
          ? format(new Date(u.created_at), "dd/MM/yyyy", { locale: fr })
          : "-",
      }));

      exportToExcel({
        title: "LISTE DES UTILISATEURS",
        filename: `liste_utilisateurs_${new Date().toISOString().split('T')[0]}`,
        subtitle: `Total: ${users.length} utilisateurs - Actifs: ${activeUsers.length} - Admins: ${adminUsers.length} - Instructeurs: ${instructeurUsers.length}`,
        columns: [
          { header: 'N°', key: 'numero', width: 8 },
          { header: 'Utilisateur', key: 'username', width: 20 },
          { header: 'Nom complet', key: 'full_name', width: 25 },
          { header: 'Rôle', key: 'role', width: 18 },
          { header: 'Statut', key: 'statut', width: 12 },
          { header: 'Dernière connexion', key: 'derniere_connexion', width: 22 },
          { header: 'Date création', key: 'date_creation', width: 15 },
        ],
        data: exportData,
        pdfSettings: settings,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liste des Utilisateurs"
        description="Rapport des comptes utilisateurs du système"
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={!users.length || isExporting}
            previewTitle="LISTE DES UTILISATEURS"
            previewSubtitle={`Total: ${users.length} utilisateurs`}
            previewColumns={[
              { header: 'N°', key: 'numero', width: 8 },
              { header: 'Utilisateur', key: 'username', width: 20 },
              { header: 'Nom complet', key: 'full_name', width: 25 },
              { header: 'Rôle', key: 'role', width: 18 },
              { header: 'Statut', key: 'statut', width: 12 },
            ]}
            previewData={users.map((u, i) => ({
              numero: i + 1,
              username: u.username,
              full_name: u.full_name || "-",
              role: roleLabels[u.role],
              statut: !u.is_active ? "Désactivé" : (isUserLocked(u) ? "Verrouillé" : "Actif"),
            }))}
          />
        }
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructeurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructeurUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Désactivés</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {users.length - activeUsers.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau */}
      <DataTable columns={columns} data={users} emptyMessage="Aucun utilisateur trouvé" />
    </div>
  );
}
