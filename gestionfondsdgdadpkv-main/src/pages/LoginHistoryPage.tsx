import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, Monitor, User, Mail, Clock } from 'lucide-react';
import { useLoginHistory } from '@/hooks/useLoginHistory';
import { useLocalAuth } from '@/contexts/LocalAuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface LoginEntry {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

const LoginHistoryPage = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useLocalAuth();
  const { loginHistory, isLoading } = useLoginHistory();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, roleLoading, navigate]);

  const formatUserAgent = (ua: string | null) => {
    if (!ua) return 'Inconnu';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Autre';
  };

  const columns: Column<LoginEntry>[] = [
    {
      key: 'user_name',
      header: 'Utilisateur',
      render: (entry) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{entry.user_name || 'Non défini'}</span>
        </div>
      ),
    },
    {
      key: 'user_email',
      header: 'Email',
      render: (entry) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{entry.user_email || '-'}</span>
        </div>
      ),
    },
    {
      key: 'login_at',
      header: 'Date de connexion',
      render: (entry) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(entry.login_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
        </div>
      ),
    },
    {
      key: 'user_agent',
      header: 'Navigateur',
      render: (entry) => (
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">{formatUserAgent(entry.user_agent)}</Badge>
        </div>
      ),
    },
  ];

  if (roleLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal des connexions"
        description="Historique de toutes les connexions utilisateurs"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des connexions
            <Badge variant="secondary" className="ml-2">
              {loginHistory.length} entrées
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={loginHistory}
              emptyMessage="Aucune connexion enregistrée"
              pageSize={15}
              showPagination
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginHistoryPage;
