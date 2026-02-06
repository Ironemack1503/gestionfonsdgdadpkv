import { useState, useMemo } from "react";
import { useLoginAttempts, LoginAttempt } from "@/hooks/useLoginAttempts";
import { useLocalUserManagement } from "@/hooks/useLocalUserManagement";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, History, Filter, RefreshCw, Monitor, Calendar, User, FileText, FileSpreadsheet } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { exportToPDF, exportToExcel, ExportOptions, PDFExportSettings, defaultPDFSettings } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

const formatUserAgent = (ua: string | null) => {
  if (!ua) return 'Inconnu';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Autre';
};

export function LoginAuditLog() {
  const { users } = useLocalUserManagement();
  const { toast } = useToast();
  
  // Filters state
  const [selectedUsername, setSelectedUsername] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7days");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  // Calculate dates based on range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = endOfDay(now);

    switch (dateRange) {
      case "today":
        start = startOfDay(now);
        break;
      case "7days":
        start = startOfDay(subDays(now, 7));
        break;
      case "30days":
        start = startOfDay(subDays(now, 30));
        break;
      case "90days":
        start = startOfDay(subDays(now, 90));
        break;
      case "custom":
        start = customStartDate ? startOfDay(new Date(customStartDate)) : null;
        end = customEndDate ? endOfDay(new Date(customEndDate)) : null;
        break;
      case "all":
      default:
        start = null;
        end = null;
        break;
    }

    return { startDate: start, endDate: end };
  }, [dateRange, customStartDate, customEndDate]);

  const successOnly = useMemo(() => {
    if (statusFilter === "success") return true;
    if (statusFilter === "failed") return false;
    return null;
  }, [statusFilter]);

  const { attempts, isLoading, refetch } = useLoginAttempts({
    username: selectedUsername !== "all" ? selectedUsername : undefined,
    startDate,
    endDate,
    successOnly,
  });

  // Stats
  const stats = useMemo(() => {
    const total = attempts.length;
    const successful = attempts.filter(a => a.success).length;
    const failed = total - successful;
    const uniqueUsers = new Set(attempts.map(a => a.username)).size;
    
    return { total, successful, failed, uniqueUsers };
  }, [attempts]);

  // Export configuration
  const getExportConfig = (): ExportOptions => {
    const dateRangeLabel = dateRange === "today" 
      ? "Aujourd'hui"
      : dateRange === "7days" 
        ? "7 derniers jours"
        : dateRange === "30days"
          ? "30 derniers jours"
          : dateRange === "90days"
            ? "90 derniers jours"
            : dateRange === "custom" && customStartDate && customEndDate
              ? `Du ${format(new Date(customStartDate), "dd/MM/yyyy")} au ${format(new Date(customEndDate), "dd/MM/yyyy")}`
              : "Tout l'historique";

    const statusLabel = statusFilter === "success" 
      ? " - Connexions réussies uniquement"
      : statusFilter === "failed"
        ? " - Connexions échouées uniquement"
        : "";

    const userLabel = selectedUsername !== "all" 
      ? ` - Utilisateur: ${selectedUsername}`
      : "";

    return {
      title: "Journal des tentatives de connexion",
      filename: `journal_connexions_${format(new Date(), "yyyy-MM-dd_HH-mm")}`,
      subtitle: `Période: ${dateRangeLabel}${statusLabel}${userLabel} | Total: ${stats.total} | Réussies: ${stats.successful} | Échouées: ${stats.failed}`,
      columns: [
        { header: "Date/Heure", key: "formatted_date", width: 25 },
        { header: "Utilisateur", key: "username", width: 20 },
        { header: "Statut", key: "status_label", width: 15 },
        { header: "Raison", key: "failure_reason", width: 30 },
        { header: "Navigateur", key: "browser", width: 15 },
        { header: "Adresse IP", key: "ip_address", width: 20 },
      ],
      data: attempts.map(attempt => ({
        ...attempt,
        formatted_date: attempt.created_at 
          ? format(new Date(attempt.created_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })
          : "-",
        status_label: attempt.success ? "Succès" : "Échec",
        browser: formatUserAgent(attempt.user_agent),
        failure_reason: attempt.failure_reason || "-",
        ip_address: attempt.ip_address || "-",
        username: attempt.username || "Inconnu",
      })),
    };
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const config = getExportConfig();
      await exportToPDF(config);
      toast({
        title: "Export réussi",
        description: "Le fichier PDF a été téléchargé.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le fichier PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const config = getExportConfig();
      exportToExcel(config);
      toast({
        title: "Export réussi",
        description: "Le fichier Excel a été téléchargé.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le fichier Excel.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <History className="h-4 w-4" />
              <span className="text-sm">Total tentatives</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Réussies</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Échouées</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              <span className="text-sm">Utilisateurs uniques</span>
            </div>
            <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Username filter */}
            <div className="space-y-2">
              <Label>Utilisateur</Label>
              <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les utilisateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.username}>
                      {user.username} {user.full_name && `(${user.full_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range filter */}
            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="7days">7 derniers jours</SelectItem>
                  <SelectItem value="30days">30 derniers jours</SelectItem>
                  <SelectItem value="90days">90 derniers jours</SelectItem>
                  <SelectItem value="custom">Période personnalisée</SelectItem>
                  <SelectItem value="all">Tout l'historique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status filter */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="success">Réussies uniquement</SelectItem>
                  <SelectItem value="failed">Échouées uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh button */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleRefresh} variant="outline" className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Custom date inputs */}
          {dateRange === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de début
                </Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de fin
                </Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Journal des tentatives de connexion
              <Badge variant="secondary" className="ml-2">
                {attempts.length} entrées
              </Badge>
            </CardTitle>
            
            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPDF}
                disabled={isExporting || attempts.length === 0}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 text-destructive" />
                )}
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportExcel}
                disabled={attempts.length === 0}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucune tentative de connexion trouvée</p>
              <p className="text-sm">Modifiez les filtres pour voir plus de résultats</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date/Heure</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="w-[100px]">Statut</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Navigateur</TableHead>
                    <TableHead>Adresse IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {attempt.created_at && format(new Date(attempt.created_at), "dd MMM yyyy HH:mm:ss", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {attempt.username || "Inconnu"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {attempt.success ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Succès
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 gap-1">
                            <XCircle className="h-3 w-3" />
                            Échec
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {attempt.failure_reason || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">{formatUserAgent(attempt.user_agent)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {attempt.ip_address || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
