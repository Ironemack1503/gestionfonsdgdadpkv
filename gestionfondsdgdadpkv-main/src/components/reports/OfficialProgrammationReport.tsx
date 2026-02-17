/**
 * Official Programmation Report Component
 * Formats programmation data as official government document
 * with header, logo, signatures and footer
 */

import { formatMontant } from '@/lib/utils';
import { numberToFrenchWords } from '@/hooks/useReportData';

interface ProgrammationItem {
  numeroOrdre: number;
  designation: string;
  montantPrevu: number;
}

interface OfficialProgrammationReportProps {
  mois: string; // e.g., "DECEMBRE"
  annee: number;
  reference?: string;
  data: ProgrammationItem[];
  signataire1?: {
    titre: string;
    nom: string;
  };
  signataire2?: {
    titre: string;
    nom: string;
  };
  dateSignature?: string;
  lieu?: string;
}

export function OfficialProgrammationReport({
  mois,
  annee,
  reference,
  data,
  signataire1 = {
    titre: "LE SOUS-DIRECTEUR CHARGE DE\nL'ADMINISTRATION ET DES FINANCES",
    nom: "KABOMBO BADIABIABO"
  },
  signataire2 = {
    titre: "LE DIRECTEUR PROVINCIAL",
    nom: "KALALA MASIMANGO"
  },
  dateSignature,
  lieu = "Kinshasa"
}: OfficialProgrammationReportProps) {
  
  const total = data.reduce((sum, item) => sum + item.montantPrevu, 0);
  const totalEnLettres = numberToFrenchWords(Math.floor(total));

  // Format date
  const formattedDate = dateSignature || new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).split('/').join('/');

  const refNumber = reference || `DGDA/3400/DP/KV/SDAF/${annee}`;

  return (
    <div className="official-report bg-white text-black">
      {/* Header */}
      <div className="report-header text-center mb-6">
        <div className="text-sm leading-tight mb-2">
          <p className="font-bold">République Démocratique du Congo</p>
          <p className="font-semibold">Ministère des Finances</p>
          <p className="text-xs">Direction Générale des Douanes et Activités</p>
        </div>
        
        {/* Logo */}
        <div className="flex justify-center my-3">
          <img 
            src="/logo-rdc.svg" 
            alt="Logo RDC" 
            className="w-20 h-24"
            onError={(e) => {
              // Fallback if logo not found
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        
        <div className="text-sm leading-tight mb-4">
          <p className="font-semibold">Direction Provinciale</p>
          <p className="text-xs italic">Kin - Ville</p>
        </div>

        <div className="flex justify-between items-center mb-6 px-4 border-b pb-2">
          <div className="text-left text-xs">
            <span className="font-semibold">{refNumber}</span>
          </div>
          <div className="text-right text-xs">
            <span className="font-semibold">/{annee}</span>
          </div>
        </div>

        <h1 className="text-base font-bold uppercase mb-6">
          PROGRAMMATION DES DEPENSES MOIS DE {mois}/{annee}
        </h1>
      </div>

      {/* Table */}
      <div className="report-table mb-6">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-2 border-black bg-gray-100">
              <th className="border border-black p-2 text-center w-12">N°</th>
              <th className="border border-black p-2 text-left">LIBELLE</th>
              <th className="border border-black p-2 text-right w-32">MONTANT</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border border-black">
                <td className="border border-black p-2 text-center">{item.numeroOrdre}</td>
                <td className="border border-black p-2 text-left">{item.designation}</td>
                <td className="border border-black p-2 text-right whitespace-nowrap">
                  {formatMontant(item.montantPrevu)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-2 border-black bg-gray-100 font-bold">
              <td colSpan={2} className="border border-black p-2 text-right uppercase">
                MONTANT TOTAL
              </td>
              <td className="border border-black p-2 text-right whitespace-nowrap">
                {formatMontant(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Total in words */}
      <div className="mb-8 text-xs italic px-2">
        <p>
          <span className="font-semibold">Nous disons:</span> {totalEnLettres.charAt(0).toUpperCase() + totalEnLettres.slice(1)} francs congolais
        </p>
      </div>

      {/* Footer motto */}
      <div className="text-center text-xs italic mb-6 border-t border-b py-2">
        <p className="font-semibold">Tous mobilisés pour une douane d'action et d'excellence!</p>
      </div>

      {/* Contact info */}
      <div className="text-xs text-center mb-8 contact-info">
        <p>Imprimerie DGDA, Place LE ROYAL, Bd du 30 Juin, Kinshasa/Gombe</p>
        <p>
          <span className="font-semibold">B.P.</span> 8248 KIN I/Tel: (0) 1 503 07 04/Fax: +243 (0) 1 503 07 03 N.I.F : A0703032J
        </p>
        <p>
          <span className="font-semibold">Email:</span> info@douanesrdc.com·bord@douanesrdc.com · 
          <span className="font-semibold"> web:</span> http://www.douanesrdc.cd
        </p>
      </div>

      {/* Signatures */}
      <div className="mt-8 mb-4">
        <div className="text-center text-xs mb-6">
          <p>Fait à {lieu}, le {formattedDate}</p>
        </div>

        <div className="flex justify-between px-8 text-xs">
          <div className="text-center signature-block">
            <p className="font-bold uppercase mb-12 whitespace-pre-line signature-title">
              {signataire1.titre}
            </p>
            <div className="mt-16">
              <p className="font-bold uppercase">{signataire1.nom}</p>
            </div>
          </div>

          <div className="text-center signature-block">
            <p className="font-bold uppercase mb-12 signature-title">
              {signataire2.titre}
            </p>
            <div className="mt-16">
              <p className="font-bold uppercase">{signataire2.nom}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page number */}
      <div className="text-center text-xs mt-8">
        <p>Page 1 de 1</p>
      </div>
    </div>
  );
}
