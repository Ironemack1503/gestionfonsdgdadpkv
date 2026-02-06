/**
 * Report Builder Page
 * Main page for the drag-drop report builder
 */

import { PageHeader } from '@/components/shared/PageHeader';
import ReportBuilder from '@/components/reports/ReportBuilder';

export default function ReportBuilderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Constructeur de Rapports"
        description="Créez des rapports personnalisés avec glisser-déposer, formules et regroupements dynamiques"
      />
      
      <ReportBuilder />
    </div>
  );
}
