/**
 * Official Programmation Report Print Page
 * Displays programmation report in official government format
 * Ready for direct printing
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { OfficialProgrammationReport } from '@/components/reports/OfficialProgrammationReport';
import { useReportData } from '@/hooks/useReportData';
import '../components/reports/OfficialReport.css';

const moisNoms = [
  'JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'
];

export default function OfficialProgrammationPrintPage() {
  const navigate = useNavigate();
  const currentDate = new Date();
  
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(currentDate.getFullYear());
  const [reference, setReference] = useState('');
  const [lieu, setLieu] = useState('Kinshasa');
  const [dateSignature, setDateSignature] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Signataires
  const [signataire1Titre, setSignataire1Titre] = useState(
    "LE SOUS-DIRECTEUR CHARGE DE\nL'ADMINISTRATION ET DES FINANCES"
  );
  const [signataire1Nom, setSignataire1Nom] = useState("KABOMBO BADIABIABO");
  const [signataire2Titre, setSignataire2Titre] = useState("LE DIRECTEUR PROVINCIAL");
  const [signataire2Nom, setSignataire2Nom] = useState("KALALA MASIMANGO");

  const { generateProgrammation, isLoading } = useReportData();

  // Generate report data
  const programmationData = useMemo(() => {
    const rawData = generateProgrammation(selectedMois, selectedAnnee);
    return rawData.map(item => ({
      numeroOrdre: item.numeroOrdre,
      designation: item.libelle,
      montantPrevu: item.montant,
    }));
  }, [generateProgrammation, selectedMois, selectedAnnee]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(dateSignature).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Controls - Hidden when printing */}
      <div className="no-print bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/rapports/programmation')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Rapport Officiel de Programmation
              </h1>
            </div>
            
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Panel - Hidden when printing */}
      <div className="no-print container mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Period Selection */}
              <div className="space-y-2">
                <Label htmlFor="mois-select" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Mois
                </Label>
                <select
                  id="mois-select"
                  value={selectedMois}
                  onChange={(e) => setSelectedMois(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  aria-label="Sélectionner le mois"
                >
                  {moisNoms.map((mois, index) => (
                    <option key={index} value={index + 1}>{mois}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Année</Label>
                <Input
                  type="number"
                  value={selectedAnnee}
                  onChange={(e) => setSelectedAnnee(Number(e.target.value))}
                  min={2020}
                  max={2030}
                />
              </div>

              <div className="space-y-2">
                <Label>Référence</Label>
                <Input
                  placeholder="DGDA/3400/DP/KV/SDAF/"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Lieu</Label>
                <Input
                  value={lieu}
                  onChange={(e) => setLieu(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Date de signature</Label>
                <Input
                  type="date"
                  value={dateSignature}
                  onChange={(e) => setDateSignature(e.target.value)}
                />
              </div>

              {/* Signataire 1 */}
              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <Label htmlFor="sig1-titre">Signataire 1 - Titre</Label>
                <textarea
                  id="sig1-titre"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={signataire1Titre}
                  onChange={(e) => setSignataire1Titre(e.target.value)}
                  rows={2}
                  aria-label="Titre du premier signataire"
                />
              </div>

              <div className="space-y-2">
                <Label>Signataire 1 - Nom</Label>
                <Input
                  value={signataire1Nom}
                  onChange={(e) => setSignataire1Nom(e.target.value)}
                />
              </div>

              {/* Signataire 2 */}
              <div className="space-y-2">
                <Label>Signataire 2 - Titre</Label>
                <Input
                  value={signataire2Titre}
                  onChange={(e) => setSignataire2Titre(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Signataire 2 - Nom</Label>
                <Input
                  value={signataire2Nom}
                  onChange={(e) => setSignataire2Nom(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Preview/Print */}
      <div className="official-report-preview-container">
        {isLoading ? (
          <div className="text-center py-12">
            <p>Chargement...</p>
          </div>
        ) : programmationData.length === 0 ? (
          <div className="text-center py-12">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Aucune programmation trouvée pour {moisNoms[selectedMois - 1]} {selectedAnnee}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <OfficialProgrammationReport
            mois={moisNoms[selectedMois - 1]}
            annee={selectedAnnee}
            reference={reference}
            data={programmationData}
            signataire1={{
              titre: signataire1Titre,
              nom: signataire1Nom
            }}
            signataire2={{
              titre: signataire2Titre,
              nom: signataire2Nom
            }}
            dateSignature={formattedDate}
            lieu={lieu}
          />
        )}
      </div>
    </div>
  );
}
