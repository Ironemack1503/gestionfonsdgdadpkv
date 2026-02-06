import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Users, 
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  Eye
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLoginAttempts, type LoginAttempt } from '@/hooks/useLoginAttempts';
import { useAuditLogs, tableNameLabels, actionLabels } from '@/hooks/useAuditLog';
import type { AuditLog } from '@/types/database';
import { useLocalAuth } from '@/contexts/LocalAuthContext';
import { useLocalUserRole } from '@/hooks/useLocalUserRole';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

// Helper to parse user agent
function formatUserAgent(ua: string | null): string {
  if (!ua) return 'Inconnu';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Autre';
}

export default function SecurityDashboardPage() {
  const navigate = useNavigate();
  const { isAdmin } = useLocalAuth();
  const { role, loading: roleLoading } = useLocalUserRole();
  const [dateRange, setDateRange] = useState('7');

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const days = parseInt(dateRange);
    return {
      startDate: startOfDay(subDays(new Date(), days)),
      endDate: endOfDay(new Date())
    };
  }, [dateRange]);

  // Fetch data
  const { attempts, isLoading: attemptsLoading } = useLoginAttempts({
    startDate,
    endDate
  });

  const { auditLogs, isLoading: auditLoading } = useAuditLogs();

  // Calculate login statistics
  const loginStats = useMemo(() => {
    const total = attempts.length;
    const successful = attempts.filter(a => a.success).length;
    const failed = total - successful;
    const uniqueUsers = new Set(attempts.map(a => a.username)).size;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    return { total, successful, failed, uniqueUsers, successRate };
  }, [attempts]);

  // Daily login data for chart
  const dailyLoginData = useMemo(() => {
    const days = parseInt(dateRange);
    const data: { date: string; success: number; failed: number }[] = [];

    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayAttempts = attempts.filter(a => 
        a.created_at && format(new Date(a.created_at), 'yyyy-MM-dd') === dateStr
      );

      data.push({
        date: format(date, 'dd/MM', { locale: fr }),
        success: dayAttempts.filter(a => a.success).length,
        failed: dayAttempts.filter(a => !a.success).length
      });
    }

    return data;
  }, [attempts, dateRange]);

  // Browser distribution for pie chart
  const browserData = useMemo(() => {
    const browsers: Record<string, number> = {};
    attempts.forEach(a => {
      const browser = formatUserAgent(a.user_agent);
      browsers[browser] = (browsers[browser] || 0) + 1;
    });

    return Object.entries(browsers).map(([name, value]) => ({ name, value }));
  }, [attempts]);

  // Recent failed attempts
  const recentFailedAttempts = useMemo(() => {
    return attempts
      .filter(a => !a.success)
      .slice(0, 5);
  }, [attempts]);

  // Audit logs by action type
  const auditByAction = useMemo(() => {
    const actions: Record<string, number> = {};
    auditLogs.forEach(log => {
      const action = log.action;
      actions[action] = (actions[action] || 0) + 1;
    });

    return Object.entries(actions).map(([name, value]) => ({
      name: actionLabels[name] || name,
      value
    }));
  }, [auditLogs]);

  // Audit logs by table
  const auditByTable = useMemo(() => {
    const tables: Record<string, number> = {};
    auditLogs.forEach(log => {
      const table = log.table_name;
      tables[table] = (tables[table] || 0) + 1;
    });

    return Object.entries(tables).map(([name, value]) => ({
      name: tableNameLabels[name] || name,
      value
    }));
  }, [auditLogs]);

  // Check admin access
  if (roleLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin && role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  const isLoading = attemptsLoading || auditLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Tableau de bord sécurité"
          description="Vue d'ensemble des activités de sécurité du système"
        />
        
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="14">14 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tentatives totales
            </CardTitle>
            <Shield className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold text-primary">{loginStats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sur les {dateRange} derniers jours
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connexions réussies
            </CardTitle>
            <ShieldCheck className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold text-success">{loginStats.successful}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Taux de réussite: {loginStats.successRate}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tentatives échouées
            </CardTitle>
            <ShieldX className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold text-destructive">{loginStats.failed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {loginStats.failed > 10 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Activité suspecte
                    </span>
                  )}
                  {loginStats.failed <= 10 && 'Niveau normal'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilisateurs uniques
            </CardTitle>
            <Users className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold text-secondary">{loginStats.uniqueUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comptes actifs
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tentatives de connexion
            </CardTitle>
            <CardDescription>
              Évolution quotidienne des connexions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyLoginData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="success" 
                    name="Réussies"
                    stackId="1"
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success)/0.5)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="failed" 
                    name="Échouées"
                    stackId="1"
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive)/0.5)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Répartition par navigateur
            </CardTitle>
            <CardDescription>
              Navigateurs utilisés pour les connexions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : browserData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={browserData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {browserData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="failed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="failed" className="gap-2">
            <ShieldX className="h-4 w-4" />
            Tentatives échouées
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Clock className="h-4 w-4" />
            Actions récentes
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Activity className="h-4 w-4" />
            Statistiques audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="failed">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dernières tentatives échouées</CardTitle>
                <CardDescription>
                  Connexions ayant échoué récemment
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/login-history')}>
                <Eye className="h-4 w-4 mr-2" />
                Voir tout
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentFailedAttempts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune tentative échouée récente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Navigateur</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFailedAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="text-sm">
                          {attempt.created_at 
                            ? format(new Date(attempt.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                            : '-'}
                        </TableCell>
                        <TableCell className="font-medium">{attempt.username || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">
                            {attempt.failure_reason || 'Échec authentification'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatUserAgent(attempt.user_agent)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {attempt.ip_address || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Actions récentes</CardTitle>
                <CardDescription>
                  Dernières modifications dans le système
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/audit')}>
                <Eye className="h-4 w-4 mr-2" />
                Voir tout
              </Button>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune action récente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Champs modifiés</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tableNameLabels[log.table_name] || log.table_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              log.action === 'INSERT' ? 'default' :
                              log.action === 'UPDATE' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {actionLabels[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.user_email || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.changed_fields?.join(', ') || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions par type</CardTitle>
                <CardDescription>
                  Répartition des opérations effectuées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : auditByAction.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={auditByAction}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" name="Nombre" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions par table</CardTitle>
                <CardDescription>
                  Tables les plus modifiées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : auditByTable.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={auditByTable} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" name="Modifications" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
