// Types pour la base de données de gestion de caisse

export type AppRole = 'admin' | 'instructeur' | 'observateur';
export type TransactionType = 'recette' | 'depense';
export type TransactionStatus = 'brouillon' | 'valide' | 'archive';
export type SignatureType = 'COMPT' | 'DAF' | 'DP';

export interface Service {
  id: string;
  code: string;
  libelle: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rubrique {
  id: string;
  code: string;
  libelle: string;
  type?: string | null;
  imputation?: string | null;
  no_beo?: string | null;
  imp?: string | null;
  categorie_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  categorie?: Category | null;
}

export interface Category {
  id: string;
  code: string;
  libelle: string;
  type?: string | null;
  numero_ordre?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contentieux {
  id: string;
  code: string;
  libelle: string;
  numero_ordre: number;
  code_rubrique?: string | null;
  rubrique_id?: string | null;
  montant?: number | null;
  created_at: string;
  updated_at: string;
  // Relations
  rubrique?: Rubrique | null;
}

export interface Signataire {
  id: string;
  matricule: string;
  nom: string;
  grade?: string | null;
  fonction?: string | null;
  type_signature?: 'COMPT' | 'DAF' | 'DP' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Repartition {
  id: string;
  numero_ordre: number;
  numero_repartition: string;
  date_repartition: string;
  montant: number;
  montant_lettre?: string | null;
  service_id?: string | null;
  observation?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Relations
  service?: Service | null;
}

export interface SommaireSauvegarde {
  id: string;
  numero_sommaire: number;
  code?: string | null;
  libelle: string;
  montant?: number | null;
  montant_lettre?: string | null;
  categorie_id?: string | null;
  mois?: number | null;
  annee?: number | null;
  mois_annee?: string | null;
  signature_compt: boolean;
  signature_daf: boolean;
  signature_dp: boolean;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  categorie?: Category | null;
}

export interface Recette {
  id: string;
  numero_bon: number;
  numero_beo?: string | null;
  date_transaction: string;
  heure: string;
  motif: string;
  provenance: string;
  montant: number;
  montant_lettre?: string | null;
  observation?: string | null;
  solde_avant?: number | null;
  solde_apres?: number | null;
  service_id?: string | null;
  rubrique_id?: string | null;
  user_id: string;
  statut: TransactionStatus;
  // Nouveaux champs mois/année
  mois?: number | null;
  annee?: number | null;
  mois_annee?: string | null;
  mois_lettre?: string | null;
  // Triple signature
  signature_compt?: boolean | null;
  signature_daf?: boolean | null;
  signature_dp?: boolean | null;
  created_at: string;
  updated_at: string;
  // Relations
  service?: Service | null;
  rubrique?: Rubrique | null;
}

export interface Depense {
  id: string;
  numero_bon: number;
  numero_beo?: string | null;
  date_transaction: string;
  heure: string;
  beneficiaire: string;
  motif: string;
  montant: number;
  montant_lettre?: string | null;
  observation?: string | null;
  solde_avant?: number | null;
  solde_apres?: number | null;
  rubrique_id?: string | null;
  service_id?: string | null;
  user_id: string;
  statut: TransactionStatus;
  // Nouveaux champs mois/année
  mois?: number | null;
  annee?: number | null;
  mois_annee?: string | null;
  mois_lettre?: string | null;
  // Triple signature
  signature_compt?: boolean | null;
  signature_daf?: boolean | null;
  signature_dp?: boolean | null;
  // Code contentieux
  code_contentieux?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  rubrique?: Rubrique | null;
  service?: Service | null;
}

export interface FeuilleCaisse {
  id: string;
  date_feuille: string;
  solde_initial: number;
  total_recettes: number;
  total_depenses: number;
  solde_final: number;
  is_cloturee: boolean;
  cloturee_par?: string | null;
  cloturee_at?: string | null;
  observations?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Signature {
  id: string;
  transaction_type: TransactionType;
  transaction_id: string;
  type_signature: SignatureType;
  user_id: string;
  signature_hash?: string | null;
  signed_at: string;
}

export interface Parametre {
  id: string;
  cle: string;
  valeur: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name?: string | null;
  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  user_id?: string | null;
  user_email?: string | null;
  ip_address?: string | null;
  changed_fields?: string[] | null;
  created_at: string;
}

// Stats du dashboard
export interface DashboardStats {
  soldeActuel: number;
  recettesJour: number;
  depensesJour: number;
  recettesMois: number;
  depensesMois: number;
  nombreRecettes: number;
  nombreDepenses: number;
  transactionsEnAttente: number;
}

// Filtres de recherche
export interface TransactionFilters {
  dateDebut?: string;
  dateFin?: string;
  type?: TransactionType | 'tous';
  numeroBeo?: string;
  beneficiaire?: string;
  montantMin?: number;
  montantMax?: number;
  rubriqueId?: string;
  serviceId?: string;
  statut?: TransactionStatus | 'tous';
}
