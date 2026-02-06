import { useUserManagementAudit, actionTypeLabels, roleLabels } from "@/hooks/useUserManagementAudit";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, UserMinus, Shield, History } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const actionIcons: Record<string, React.ReactNode> = {
  CREATE_USER: <UserPlus className="h-4 w-4 text-green-500" />,
  DELETE_USER: <UserMinus className="h-4 w-4 text-destructive" />,
  UPDATE_ROLE: <Shield className="h-4 w-4 text-primary" />,
};

const actionColors: Record<string, string> = {
  CREATE_USER: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DELETE_USER: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  UPDATE_ROLE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export function UserManagementHistory() {
  const { auditLogs, isLoading } = useUserManagementAudit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <History className="h-12 w-12 mb-4 opacity-50" />
        <p>Aucun historique d'actions disponible</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Date</TableHead>
            <TableHead className="w-[160px]">Action</TableHead>
            <TableHead>Utilisateur cible</TableHead>
            <TableHead>Détails</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auditLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {actionIcons[log.action_type]}
                  <Badge className={actionColors[log.action_type] || "bg-muted"}>
                    {actionTypeLabels[log.action_type] || log.action_type}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {log.target_user_email || "—"}
              </TableCell>
              <TableCell className="text-sm">
                {log.action_type === "UPDATE_ROLE" && log.old_value && log.new_value && (
                  <span>
                    {roleLabels[log.old_value] || log.old_value} → {roleLabels[log.new_value] || log.new_value}
                  </span>
                )}
                {log.action_type === "CREATE_USER" && log.new_value && (
                  <span>Rôle: {roleLabels[log.new_value] || log.new_value}</span>
                )}
                {log.action_type === "DELETE_USER" && (
                  <span className="text-muted-foreground">Compte supprimé</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
