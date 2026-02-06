import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuditLogs, tableNameLabels, actionLabels } from "@/hooks/useAuditLog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const AuditPage = () => {
  const [selectedTable, setSelectedTable] = useState<string>("all");
  const { auditLogs, isLoading } = useAuditLogs(selectedTable === "all" ? undefined : selectedTable);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "INSERT":
        return "default";
      case "UPDATE":
        return "secondary";
      case "DELETE":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatJsonData = (data: Record<string, unknown> | null) => {
    if (!data) return "—";
    return JSON.stringify(data, null, 2);
  };

  const getRecordSummary = (log: typeof auditLogs[0]) => {
    const data = log.new_data || log.old_data;
    if (!data) return log.record_id.slice(0, 8);
    
    // Try to find a meaningful identifier
    if (data.numero_bon) return `Bon n°${data.numero_bon}`;
    if (data.code) return data.code as string;
    if (data.libelle) return (data.libelle as string).slice(0, 30);
    if (data.designation) return (data.designation as string).slice(0, 30);
    if (data.motif) return (data.motif as string).slice(0, 30);
    
    return log.record_id.slice(0, 8);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique d'audit"
        description="Traçabilité de toutes les modifications effectuées dans le système"
      />

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtrer par :</span>
        </div>
        <Select value={selectedTable} onValueChange={setSelectedTable}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les tables" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les tables</SelectItem>
            <SelectItem value="recettes">Recettes</SelectItem>
            <SelectItem value="depenses">Dépenses</SelectItem>
            <SelectItem value="rubriques">Rubriques</SelectItem>
            <SelectItem value="programmations">Programmations</SelectItem>
            <SelectItem value="feuilles_caisse">Feuilles de caisse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun historique</h3>
          <p className="text-muted-foreground">
            Les modifications seront enregistrées ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Heure</th>
                  <th>Table</th>
                  <th>Action</th>
                  <th>Enregistrement</th>
                  <th>Utilisateur</th>
                  <th>Champs modifiés</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                    </td>
                    <td>
                      <Badge variant="outline">
                        {tableNameLabels[log.table_name] || log.table_name}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </td>
                    <td className="max-w-[150px] truncate" title={log.record_id}>
                      {getRecordSummary(log)}
                    </td>
                    <td className="max-w-[200px] truncate">
                      {log.user_email || "—"}
                    </td>
                    <td>
                      {log.changed_fields && log.changed_fields.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {log.changed_fields.slice(0, 3).map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {log.changed_fields.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{log.changed_fields.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Voir
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              Détails de la modification
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Date :</span>{" "}
                                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                              </div>
                              <div>
                                <span className="font-medium">Utilisateur :</span>{" "}
                                {log.user_email || "—"}
                              </div>
                              <div>
                                <span className="font-medium">Table :</span>{" "}
                                {tableNameLabels[log.table_name] || log.table_name}
                              </div>
                              <div>
                                <span className="font-medium">Action :</span>{" "}
                                <Badge variant={getActionBadgeVariant(log.action)}>
                                  {actionLabels[log.action]}
                                </Badge>
                              </div>
                            </div>

                            {log.action !== "INSERT" && log.old_data && (
                              <div>
                                <h4 className="font-medium mb-2">Données avant modification :</h4>
                                <ScrollArea className="h-[150px] rounded border bg-muted p-3">
                                  <pre className="text-xs whitespace-pre-wrap">
                                    {formatJsonData(log.old_data)}
                                  </pre>
                                </ScrollArea>
                              </div>
                            )}

                            {log.action !== "DELETE" && log.new_data && (
                              <div>
                                <h4 className="font-medium mb-2">
                                  {log.action === "INSERT" ? "Données créées :" : "Données après modification :"}
                                </h4>
                                <ScrollArea className="h-[150px] rounded border bg-muted p-3">
                                  <pre className="text-xs whitespace-pre-wrap">
                                    {formatJsonData(log.new_data)}
                                  </pre>
                                </ScrollArea>
                              </div>
                            )}

                            {log.changed_fields && log.changed_fields.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Champs modifiés :</h4>
                                <div className="flex flex-wrap gap-2">
                                  {log.changed_fields.map((field) => (
                                    <Badge key={field} variant="secondary">
                                      {field}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
