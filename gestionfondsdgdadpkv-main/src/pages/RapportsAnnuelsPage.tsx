import { PageHeader } from '@/components/shared/PageHeader';
import { ExportButtons } from '@/components/shared/ExportButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnnualStats, MOIS_LABELS } from '@/hooks/useReportStats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { exportToPDF, exportToExcel, getRapportAnnuelExportConfig, PDFExportSettings } from '@/lib/exportUtils';
import { formatMontant } from '@/lib/utils';

export default function RapportsAnnuelsPage() {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 4;

  const { data: annualStats, isLoading } = useAnnualStats(startYear, currentYear);

  const chartData = annualStats?.map(stat => ({
    name: stat.annee.toString(),
    recettes: stat.totalRecettes,
    depenses: stat.totalDepenses,
    solde: stat.solde,
  })) || [];

  // Calculate cumulative balance over years
  let cumulativeBalance = 0;
  const cumulativeData = annualStats?.map(stat => {
    cumulativeBalance += stat.solde;
    return {
      name: stat.annee.toString(),
      solde: cumulativeBalance,
    };
  }) || [];

  const totalRecettes = annualStats?.reduce((sum, s) => sum + s.totalRecettes, 0) || 0;
  const totalDepenses = annualStats?.reduce((sum, s) => sum + s.totalDepenses, 0) || 0;
  const soldeCumule = totalRecettes - totalDepenses;
  const avgAnnualBalance = annualStats?.length ? soldeCumule / annualStats.length : 0;

  const formatCurrency = (value: number) => formatMontant(value, { showCurrency: true });

  const handleExportPDF = async (settings?: PDFExportSettings) => {
    if (annualStats) {
      const config = getRapportAnnuelExportConfig(annualStats, startYear, currentYear);
      await exportToPDF({ ...config, pdfSettings: settings });
    }
  };

  const handleExportExcel = (settings?: PDFExportSettings) => {
    if (annualStats) {
      const config = getRapportAnnuelExportConfig(annualStats, startYear, currentYear);
      exportToExcel({ ...config, pdfSettings: settings });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports Annuels"
        description={`Comparaison des statistiques sur ${annualStats?.length || 0} années (${startYear} - ${currentYear})`}
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={!annualStats || annualStats.length === 0}
            previewTitle={`Rapport Annuel ${startYear} - ${currentYear}`}
            previewSubtitle={`Comparaison des statistiques sur ${annualStats?.length || 0} années`}
            previewColumns={[
              { header: 'Année', key: 'annee', width: 10 },
              { header: 'Recettes', key: 'recettes', width: 18 },
              { header: 'Dépenses', key: 'depenses', width: 18 },
              { header: 'Solde', key: 'solde', width: 18 },
            ]}
            previewData={annualStats?.map(stat => ({
              annee: stat.annee.toString(),
              recettes: stat.totalRecettes,
              depenses: stat.totalDepenses,
              solde: stat.solde,
            })) || []}
          />
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Recettes (5 ans)"
          value={formatCurrency(totalRecettes)}
          icon={TrendingUp}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Total Dépenses (5 ans)"
          value={formatCurrency(totalDepenses)}
          icon={TrendingDown}
          trend={{ value: 0, isPositive: false }}
        />
        <StatCard
          title="Solde Cumulé"
          value={formatCurrency(soldeCumule)}
          icon={Wallet}
          trend={{ value: 0, isPositive: soldeCumule >= 0 }}
        />
        <StatCard
          title="Moyenne Annuelle"
          value={formatCurrency(avgAnnualBalance)}
          icon={Calendar}
          trend={{ value: 0, isPositive: avgAnnualBalance >= 0 }}
        />
      </div>

      {/* Annual Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Comparaison annuelle des recettes et dépenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="recettes" name="Recettes" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="depenses" name="Dépenses" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Annual Balance Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du solde annuel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="solde" 
                  name="Solde annuel"
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumulative Balance Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Solde cumulé sur les années</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="solde" 
                  name="Solde cumulé"
                  stroke="hsl(var(--chart-4))" 
                  fill="hsl(var(--chart-4))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Annual Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par année</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Année</th>
                  <th className="text-right py-3 px-4 font-medium">Recettes</th>
                  <th className="text-right py-3 px-4 font-medium">Dépenses</th>
                  <th className="text-right py-3 px-4 font-medium">Solde</th>
                  <th className="text-right py-3 px-4 font-medium">Variation</th>
                </tr>
              </thead>
              <tbody>
                {annualStats?.map((stat, index) => {
                  const prevStat = index > 0 ? annualStats[index - 1] : null;
                  const variation = prevStat ? ((stat.solde - prevStat.solde) / Math.abs(prevStat.solde || 1)) * 100 : 0;
                  
                  return (
                    <tr key={stat.annee} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{stat.annee}</td>
                      <td className="py-3 px-4 text-right text-green-600">{formatCurrency(stat.totalRecettes)}</td>
                      <td className="py-3 px-4 text-right text-red-600">{formatCurrency(stat.totalDepenses)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${stat.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(stat.solde)}
                      </td>
                      <td className={`py-3 px-4 text-right ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {index > 0 ? `${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right text-green-600">{formatCurrency(totalRecettes)}</td>
                  <td className="py-3 px-4 text-right text-red-600">{formatCurrency(totalDepenses)}</td>
                  <td className={`py-3 px-4 text-right ${soldeCumule >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(soldeCumule)}
                  </td>
                  <td className="py-3 px-4 text-right">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown per Year */}
      {annualStats?.slice().reverse().map(stat => (
        <Card key={stat.annee}>
          <CardHeader>
            <CardTitle>Détail mensuel {stat.annee}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stat.monthlyData.map(m => ({
                name: MOIS_LABELS[m.mois - 1].substring(0, 3),
                recettes: m.totalRecettes,
                depenses: m.totalDepenses,
              }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="recettes" name="Recettes" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="depenses" name="Dépenses" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
