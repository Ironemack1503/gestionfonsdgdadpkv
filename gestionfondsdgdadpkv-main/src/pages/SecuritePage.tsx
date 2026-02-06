import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Activity, 
  History,
  Lock 
} from "lucide-react";
import { LoginAuditLog } from "@/components/admin/LoginAuditLog";
import { UserManagementHistory } from "@/components/admin/UserManagementHistory";

export default function SecuritePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sécurité"
        description="Surveillez les connexions et l'activité du système"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="font-semibold text-green-500">Sécurisé</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connexions (24h)</p>
              <p className="font-semibold">--</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Échecs</p>
              <p className="font-semibold">--</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections" className="gap-2">
            <Activity className="w-4 h-4" />
            Connexions
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-2">
            <History className="w-4 h-4" />
            Actions admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <LoginAuditLog />
        </TabsContent>

        <TabsContent value="actions">
          <UserManagementHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
