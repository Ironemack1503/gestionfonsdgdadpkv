import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LocalProtectedRoute } from "@/components/auth/LocalProtectedRoute";
import { LocalAuthProvider } from "@/contexts/LocalAuthContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import LocalLoginPage from "./pages/LocalLoginPage";
import AdminPage from "./pages/AdminPage";
import UtilisateursPage from "./pages/UtilisateursPage";
import DashboardPage from "./pages/DashboardPage";
import RecettesPage from "./pages/RecettesPage";
import RecetteFormPage from "./pages/RecetteFormPage";
import DepensesPage from "./pages/DepensesPage";
import DepenseFormPage from "./pages/DepenseFormPage";
import RubriquesPage from "./pages/RubriquesPage";
import ServicesPage from "./pages/ServicesPage";
import RapportsPage from "./pages/RapportsPage";
import SecuritePage from "./pages/SecuritePage";
import FeuilleCaissePage from "./pages/FeuilleCaissePage";
import ProgrammationPage from "./pages/ProgrammationPage";
import RapportsMensuelsPage from "./pages/RapportsMensuelsPage";
import RapportsAnnuelsPage from "./pages/RapportsAnnuelsPage";
import NotFound from "./pages/NotFound";

// Report sub-pages
import ReportsIndexPage from "./pages/reports/ReportsIndexPage";
import FeuilleCaisseReportPage from "./pages/reports/FeuilleCaisseReportPage";
import SommaireReportPage from "./pages/reports/SommaireReportPage";
import EtatFinancierPage from "./pages/reports/EtatFinancierPage";
import ProgrammationReportPage from "./pages/reports/ProgrammationReportPage";
import SommairesIMPPage from "./pages/reports/SommairesIMPPage";
import ReportBuilderPage from "./pages/reports/ReportBuilderPage";
import ListeRubriquesReportPage from "./pages/reports/ListeRubriquesReportPage";
import ListeServicesReportPage from "./pages/reports/ListeServicesReportPage";
import ListeUtilisateursReportPage from "./pages/reports/ListeUtilisateursReportPage";
import ListeBonsReportPage from "./pages/reports/ListeBonsReportPage";
import ApprovisionnementReportPage from "./pages/reports/ApprovisionnementReportPage";
import ContentieuxReportPage from "./pages/reports/ContentieuxReportPage";
import TransactionsDetailReportPage from "./pages/reports/TransactionsDetailReportPage";
import SyntheseCaissePage from "./pages/reports/SyntheseCaissePage";
import ExempleRapportsPDFPage from "./pages/reports/ExempleRapportsPDFPage";
import AdvancedReportEditorPage from "./pages/reports/AdvancedReportEditorPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      refetchOnMount: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LocalAuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LocalLoginPage />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />

            {/* Protected routes with layout */}
            <Route
              element={
                <LocalProtectedRoute>
                  <ErrorBoundary>
                    <AppLayout />
                  </ErrorBoundary>
                </LocalProtectedRoute>
              }
            >
              {/* Section Caisse - Opérations quotidiennes */}
              <Route path="/recettes" element={<RecettesPage />} />
              <Route path="/recettes/new" element={<RecetteFormPage />} />
              <Route path="/recettes/modifier" element={<RecetteFormPage />} />
              <Route path="/depenses" element={<DepensesPage />} />
              <Route path="/depenses/new" element={<DepenseFormPage />} />
              <Route path="/depenses/modifier" element={<DepenseFormPage />} />
              <Route path="/feuille-caisse" element={<FeuilleCaissePage />} />
              
              {/* Section Programmation */}
              <Route path="/programmation" element={<ProgrammationPage />} />
              
              {/* Section Rapports - Nouvelle structure */}
              <Route path="/rapports" element={<RapportsPage />} />
              <Route path="/rapports/index" element={<ReportsIndexPage />} />
              <Route path="/rapports/liste-bons" element={<ListeBonsReportPage />} />
              <Route path="/rapports/liste-services" element={<ListeServicesReportPage />} />
              <Route path="/rapports/liste-utilisateurs" element={<ListeUtilisateursReportPage />} />
              <Route path="/rapports/mensuels" element={<RapportsMensuelsPage />} />
              <Route path="/rapports/annuels" element={<RapportsAnnuelsPage />} />
              <Route path="/rapports/feuille-caisse" element={<FeuilleCaisseReportPage />} />
              <Route path="/rapports/sommaire" element={<SommaireReportPage />} />
              <Route path="/rapports/etat-financier" element={<EtatFinancierPage />} />
              <Route path="/rapports/programmation" element={<ProgrammationReportPage />} />
              <Route path="/rapports/sommaires-imp" element={<SommairesIMPPage />} />
              <Route path="/rapports/liste-rubriques" element={<ListeRubriquesReportPage />} />
              <Route path="/rapports/approvisionnement" element={<ApprovisionnementReportPage />} />
              <Route path="/rapports/contentieux" element={<ContentieuxReportPage />} />
              <Route path="/rapports/transactions-detail" element={<TransactionsDetailReportPage />} />
              <Route path="/rapports/synthese" element={<SyntheseCaissePage />} />
              <Route path="/rapports/builder" element={<ReportBuilderPage />} />
              <Route path="/rapports/exemples-pdf" element={<ExempleRapportsPDFPage />} />
              <Route path="/rapports/editeur-avance" element={<AdvancedReportEditorPage />} />
              
              {/* Section Edition - Configuration */}
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/utilisateurs" element={<UtilisateursPage />} />
              <Route path="/rubriques" element={<RubriquesPage />} />
              <Route path="/services" element={<ServicesPage />} />
              
              {/* Section Administration */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/securite" element={<SecuritePage />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LocalAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
