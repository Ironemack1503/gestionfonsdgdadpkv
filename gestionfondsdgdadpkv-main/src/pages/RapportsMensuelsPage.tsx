import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ExportButtons } from '@/components/shared/ExportButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMonthlyStats, useRubriqueStats, MOIS_LABELS } from '@/hooks/useReportStats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { exportToPDF, exportToExcel, getRapportMensuelExportConfig, PDFExportSettings } from '@/lib/exportUtils';
import { formatMontant } from '@/lib/utils';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function RapportsMensuelsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: monthlyStats, isLoading: isLoadingMonthly } = useMonthlyStats(selectedYear);
  const { data: rubriqueStats, isLoading: isLoadingRubriques } = useRubriqueStats(selectedYear);

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const chartData = monthlyStats?.map(stat => ({
    name: MOIS_LABELS[stat.mois - 1].substring(0, 3),
    mois: MOIS_LABELS[stat.mois - 1],
    recettes: stat.totalRecettes,
    depenses: stat.totalDepenses,
    solde: stat.solde,
  })) || [];

  const pieData = rubriqueStats?.slice(0, 5).map(r => ({
    name: r.libelle,
    value: r.total,
  })) || [];

  const totalRecettes = monthlyStats?.reduce((sum, s) => sum + s.totalRecettes, 0) || 0;
  const totalDepenses = monthlyStats?.reduce((sum, s) => sum + s.totalDepenses, 0) || 0;
  const soldeAnnuel = totalRecettes - totalDepenses;

  const formatCurrency = (value: number) => formatMontant(value, { showCurrency: true });

  const handleExportPDF = async (settings?: PDFExportSettings) => {
    if (monthlyStats) {
      const config = getRapportMensuelExportConfig(monthlyStats, selectedYear);
      await exportToPDF({ ...config, pdfSettings: settings });
    }
  };

  const handleExportExcel = (settings?: PDFExportSettings) => {
    if (monthlyStats) {
      const config = getRapportMensuelExportConfig(monthlyStats, selectedYear);
      exportToExcel({ ...config, pdfSettings: settings });
    }
  };

  if (isLoadingMonthly) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports Mensuels"
        description={`Statistiques et graphiques pour l'année ${selectedYear}`}
        actions={
          <ExportButtons
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={!monthlyStats || monthlyStats.length === 0}
            previewTitle={`Rapport Mensuel ${selectedYear}`}
            previewSubtitle={`Statistiques mensuelles de l'année ${selectedYear}`}
            previewColumns={[
              { header: 'Mois', key: 'mois', width: 15 },
              { header: 'Recettes', key: 'recettes', width: 18 },
              { header: 'Dépenses', key: 'depenses', width: 18 },
              { header: 'Solde', key: 'solde', width: 18 },
            ]}
            previewData={monthlyStats?.map(stat => ({
              mois: MOIS_LABELS[stat.mois - 1],
              recettes: stat.totalRecettes,
              depenses: stat.totalDepenses,
              solde: stat.solde,
            })) || []}
          />
        }
      />

      <div className="flex items-center gap-4">
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sélectionner l'année" />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Recettes"
          value={formatCurrency(totalRecettes)}
          icon={TrendingUp}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Total Dépenses"
          value={formatCurrency(totalDepenses)}
          icon={TrendingDown}
          trend={{ value: 0, isPositive: false }}
        />
        <StatCard
          title="Solde Annuel"
          value={formatCurrency(soldeAnnuel)}
          icon={Wallet}
          trend={{ value: 0, isPositive: soldeAnnuel >= 0 }}
        />
      </div>

      {/* Monthly Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle des recettes et dépenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => chartData.find(d => d.name === label)?.mois || label}
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
        {/* Balance Evolution Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du solde mensuel</CardTitle>
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
                  name="Solde"
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-3))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expenses by Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des dépenses par rubrique</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRubriques ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Mois</th>
                  <th className="text-right py-3 px-4 font-medium">Recettes</th>
                  <th className="text-right py-3 px-4 font-medium">Dépenses</th>
                  <th className="text-right py-3 px-4 font-medium">Solde</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats?.map(stat => (
                  <tr key={stat.mois} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{MOIS_LABELS[stat.mois - 1]}</td>
                    <td className="py-3 px-4 text-right text-green-600">{formatCurrency(stat.totalRecettes)}</td>
                    <td className="py-3 px-4 text-right text-red-600">{formatCurrency(stat.totalDepenses)}</td>
                    <td className={`py-3 px-4 text-right font-medium ${stat.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stat.solde)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right text-green-600">{formatCurrency(totalRecettes)}</td>
                  <td className="py-3 px-4 text-right text-red-600">{formatCurrency(totalDepenses)}</td>
                  <td className={`py-3 px-4 text-right ${soldeAnnuel >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(soldeAnnuel)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
