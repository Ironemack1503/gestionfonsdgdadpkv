-- Combined migrations generated 2026-02-02T02:32:53

-- BEGIN: 20251217101912_c7bda6ad-e248-4beb-bd7d-068e6f8aaac0.sql

-- Minimal auth helper functions for early migrations
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT _user_id IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT _user_id IS NOT NULL
$$;

-- Base role enum used by policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'instructeur', 'observateur');
    END IF;
END $$;

-- Create rubriques (expense categories) table
CREATE TABLE public.rubriques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    libelle TEXT NOT NULL,
    categorie TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create recettes (receipts) table
CREATE TABLE public.recettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_bon SERIAL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    heure TIME NOT NULL DEFAULT CURRENT_TIME,
    motif TEXT NOT NULL,
    provenance TEXT NOT NULL,
    montant NUMERIC(15, 2) NOT NULL CHECK (montant >= 0),
    montant_lettre TEXT,
    observation TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create depenses (expenses) table
CREATE TABLE public.depenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_bon SERIAL,
    rubrique_id UUID NOT NULL REFERENCES public.rubriques(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    heure TIME NOT NULL DEFAULT CURRENT_TIME,
    beneficiaire TEXT NOT NULL,
    motif TEXT NOT NULL,
    montant NUMERIC(15, 2) NOT NULL CHECK (montant >= 0),
    montant_lettre TEXT,
    observation TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create programmations (monthly planning) table
CREATE TABLE public.programmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
    annee INTEGER NOT NULL CHECK (annee >= 2020),
    rubrique_id UUID NOT NULL REFERENCES public.rubriques(id),
    designation TEXT NOT NULL,
    montant_prevu NUMERIC(15, 2) NOT NULL CHECK (montant_prevu >= 0),
    montant_lettre TEXT,
    is_validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(mois, annee, rubrique_id)
);

-- Create feuilles_caisse (cash sheets) table for daily summaries
CREATE TABLE public.feuilles_caisse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    solde_initial NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_recettes NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_depenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
    solde_final NUMERIC(15, 2) GENERATED ALWAYS AS (solde_initial + total_recettes - total_depenses) STORED,
    is_closed BOOLEAN DEFAULT false,
    closed_by UUID REFERENCES auth.users(id),
    closed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feuilles_caisse ENABLE ROW LEVEL SECURITY;

-- RLS Policies for RUBRIQUES (admin can manage, all authenticated can view)
CREATE POLICY "Authenticated users can view rubriques" ON public.rubriques
    FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin can insert rubriques" ON public.rubriques
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update rubriques" ON public.rubriques
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete rubriques" ON public.rubriques
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for RECETTES (admin/instructeur can manage, all can view)
CREATE POLICY "Authenticated users can view recettes" ON public.recettes
    FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and Instructeur can create recettes" ON public.recettes
    FOR INSERT WITH CHECK (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Admin and Instructeur can update recettes" ON public.recettes
    FOR UPDATE USING (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Only admin can delete recettes" ON public.recettes
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for DEPENSES (admin/instructeur can manage, all can view)
CREATE POLICY "Authenticated users can view depenses" ON public.depenses
    FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and Instructeur can create depenses" ON public.depenses
    FOR INSERT WITH CHECK (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Admin and Instructeur can update depenses" ON public.depenses
    FOR UPDATE USING (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Only admin can delete depenses" ON public.depenses
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for PROGRAMMATIONS (admin can manage, all can view)
CREATE POLICY "Authenticated users can view programmations" ON public.programmations
    FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin can create programmations" ON public.programmations
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update programmations" ON public.programmations
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete programmations" ON public.programmations
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for FEUILLES_CAISSE (admin/instructeur can manage, all can view)
CREATE POLICY "Authenticated users can view feuilles_caisse" ON public.feuilles_caisse
    FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and Instructeur can create feuilles_caisse" ON public.feuilles_caisse
    FOR INSERT WITH CHECK (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Admin and Instructeur can update feuilles_caisse" ON public.feuilles_caisse
    FOR UPDATE USING (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Only admin can delete feuilles_caisse" ON public.feuilles_caisse
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_rubriques_updated_at
    BEFORE UPDATE ON public.rubriques
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recettes_updated_at
    BEFORE UPDATE ON public.recettes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_depenses_updated_at
    BEFORE UPDATE ON public.depenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programmations_updated_at
    BEFORE UPDATE ON public.programmations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feuilles_caisse_updated_at
    BEFORE UPDATE ON public.feuilles_caisse
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_recettes_date ON public.recettes(date);
CREATE INDEX idx_recettes_user_id ON public.recettes(user_id);
CREATE INDEX idx_depenses_date ON public.depenses(date);
CREATE INDEX idx_depenses_rubrique_id ON public.depenses(rubrique_id);
CREATE INDEX idx_depenses_user_id ON public.depenses(user_id);
CREATE INDEX idx_programmations_mois_annee ON public.programmations(mois, annee);
CREATE INDEX idx_feuilles_caisse_date ON public.feuilles_caisse(date);

-- END: 20251217101912_c7bda6ad-e248-4beb-bd7d-068e6f8aaac0.sql


-- BEGIN: 20251217104608_66a0236c-0a59-413c-9fdd-08d694df5e0d.sql

-- Ensure app_role type exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'instructeur', 'observateur');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT _user_id IS NOT NULL
$$;

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID NOT NULL,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users with roles can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (has_any_role(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- END: 20251217104608_66a0236c-0a59-413c-9fdd-08d694df5e0d.sql


-- BEGIN: 20251217105826_2acc1035-1d05-44fc-9ba5-53c465340c00.sql

-- Table pour les paramètres d'alertes (configurés par l'admin)
CREATE TABLE public.alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value NUMERIC NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les alertes générées
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'solde_bas', 'depassement_budget', 'depense_importante'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  related_record_id UUID,
  related_table TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policies for alert_settings
CREATE POLICY "Authenticated users can view alert settings"
ON public.alert_settings FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Only admin can manage alert settings"
ON public.alert_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for alerts
CREATE POLICY "Authenticated users can view alerts"
ON public.alerts FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and instructeur can manage alerts"
ON public.alerts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

-- Insert default settings
INSERT INTO public.alert_settings (setting_key, setting_value, description) VALUES
  ('seuil_solde_bas', 100000, 'Seuil de solde bas en francs'),
  ('seuil_depense_importante', 500000, 'Seuil pour une dépense importante en francs'),
  ('pourcentage_depassement_budget', 80, 'Pourcentage de la programmation à partir duquel alerter');

-- Trigger for updated_at
CREATE TRIGGER update_alert_settings_updated_at
BEFORE UPDATE ON public.alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- END: 20251217105826_2acc1035-1d05-44fc-9ba5-53c465340c00.sql


-- BEGIN: 20251217133852_800e3957-6f2f-470f-87da-1212dae7844b.sql

-- Promouvoir l'utilisateur "Administrateur" au rang d'admin
DO $$
BEGIN
	IF to_regclass('public.user_roles') IS NOT NULL THEN
		UPDATE public.user_roles 
		SET role = 'admin'::app_role 
		WHERE user_id = 'f7db4131-2d3f-4781-a528-aa6c1eafc79a';
	END IF;
END $$;

-- END: 20251217133852_800e3957-6f2f-470f-87da-1212dae7844b.sql


-- BEGIN: 20251217160908_206a1fb7-4414-450c-9f63-6d59f3e44b40.sql

-- Create login_history table
CREATE TABLE public.login_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    user_email text,
    user_name text,
    login_at timestamp with time zone NOT NULL DEFAULT now(),
    ip_address text,
    user_agent text
);

-- Enable RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view login history
CREATE POLICY "Admins can view login history"
ON public.login_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert their own login record
CREATE POLICY "Users can insert their own login"
ON public.login_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_login_at ON public.login_history(login_at DESC);

-- END: 20251217160908_206a1fb7-4414-450c-9f63-6d59f3e44b40.sql


-- BEGIN: 20251218032337_88ceb655-0ec6-4632-8c0e-35314001d49b.sql

-- Make rubrique_id optional in programmations table
ALTER TABLE public.programmations 
ALTER COLUMN rubrique_id DROP NOT NULL;

-- Add numero_ordre column for display ordering within month/year
ALTER TABLE public.programmations
ADD COLUMN numero_ordre integer;

-- Create function to auto-generate numero_ordre
CREATE OR REPLACE FUNCTION public.generate_programmation_numero_ordre()
RETURNS TRIGGER AS $$
DECLARE
  next_numero integer;
BEGIN
  -- Get the next order number for this month/year
  SELECT COALESCE(MAX(numero_ordre), 0) + 1
  INTO next_numero
  FROM public.programmations
  WHERE mois = NEW.mois AND annee = NEW.annee;
  
  NEW.numero_ordre := next_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-generating numero_ordre
CREATE TRIGGER set_programmation_numero_ordre
BEFORE INSERT ON public.programmations
FOR EACH ROW
WHEN (NEW.numero_ordre IS NULL)
EXECUTE FUNCTION public.generate_programmation_numero_ordre();

-- END: 20251218032337_88ceb655-0ec6-4632-8c0e-35314001d49b.sql


-- BEGIN: 20251218042159_ee8d9ba3-466a-45e6-b29e-8b55c0f8001d.sql

-- Enable realtime for recettes table
ALTER TABLE public.recettes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recettes;

-- Enable realtime for depenses table
ALTER TABLE public.depenses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.depenses;

-- END: 20251218042159_ee8d9ba3-466a-45e6-b29e-8b55c0f8001d.sql


-- BEGIN: 20251218042353_8b6388f5-5460-47bc-b553-b072acdffd1a.sql

-- Enable realtime for programmations table
ALTER TABLE public.programmations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.programmations;

-- END: 20251218042353_8b6388f5-5460-47bc-b553-b072acdffd1a.sql


-- BEGIN: 20251218042452_4343f4a5-32a4-4b58-8098-65e3e2476c67.sql

-- Enable realtime for rubriques table
ALTER TABLE public.rubriques REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rubriques;

-- Enable realtime for feuilles_caisse table
ALTER TABLE public.feuilles_caisse REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feuilles_caisse;

-- END: 20251218042452_4343f4a5-32a4-4b58-8098-65e3e2476c67.sql


-- BEGIN: 20251218135034_eea12df7-1ae3-4485-832d-a4f2063bf92a.sql

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can create programmations" ON public.programmations;
DROP POLICY IF EXISTS "Admin can update programmations" ON public.programmations;
DROP POLICY IF EXISTS "Admin can delete programmations" ON public.programmations;

-- Create new policies allowing both admin and instructeur
CREATE POLICY "Admin and Instructeur can create programmations" 
ON public.programmations 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

CREATE POLICY "Admin and Instructeur can update programmations" 
ON public.programmations 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

CREATE POLICY "Admin and Instructeur can delete programmations" 
ON public.programmations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

-- END: 20251218135034_eea12df7-1ae3-4485-832d-a4f2063bf92a.sql


-- BEGIN: 20251219113139_94273874-1de6-4732-9ba4-1fd0d8e3b9b3.sql

-- Create table for report formatting settings
CREATE TABLE public.parametres_mise_en_forme (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  titre_entete TEXT DEFAULT 'DIRECTION GÉNÉRALE DES DOUANES ET ACCISES',
  sous_titre TEXT DEFAULT 'Rapport Financier',
  contenu_pied_page TEXT DEFAULT 'DGDA - Document officiel',
  afficher_numero_page BOOLEAN DEFAULT true,
  afficher_date BOOLEAN DEFAULT true,
  afficher_nom_institution BOOLEAN DEFAULT true,
  police TEXT DEFAULT 'helvetica',
  taille_police INTEGER DEFAULT 10,
  couleur_principale TEXT DEFAULT '#1e40af',
  marges_haut NUMERIC DEFAULT 15,
  marges_bas NUMERIC DEFAULT 15,
  marges_gauche NUMERIC DEFAULT 10,
  marges_droite NUMERIC DEFAULT 10,
  orientation TEXT DEFAULT 'portrait',
  position_logo TEXT DEFAULT 'gauche',
  filigrane_actif BOOLEAN DEFAULT true,
  filigrane_texte TEXT DEFAULT 'DGDA',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.parametres_mise_en_forme ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view report settings" 
ON public.parametres_mise_en_forme 
FOR SELECT 
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and Instructeur can update report settings" 
ON public.parametres_mise_en_forme 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

CREATE POLICY "Admin can insert report settings" 
ON public.parametres_mise_en_forme 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete report settings" 
ON public.parametres_mise_en_forme 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_parametres_mise_en_forme_updated_at
BEFORE UPDATE ON public.parametres_mise_en_forme
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.parametres_mise_en_forme (
  titre_entete,
  sous_titre,
  contenu_pied_page,
  afficher_numero_page,
  afficher_date,
  afficher_nom_institution,
  police,
  taille_police,
  couleur_principale,
  marges_haut,
  marges_bas,
  marges_gauche,
  marges_droite,
  orientation,
  position_logo,
  filigrane_actif,
  filigrane_texte
) VALUES (
  'DIRECTION GÉNÉRALE DES DOUANES ET ACCISES',
  'Rapport Financier',
  'DGDA - Document officiel',
  true,
  true,
  true,
  'helvetica',
  10,
  '#1e40af',
  15,
  15,
  10,
  10,
  'portrait',
  'gauche',
  true,
  'DGDA'
);

-- END: 20251219113139_94273874-1de6-4732-9ba4-1fd0d8e3b9b3.sql


-- BEGIN: 20251219135753_62e59d95-a710-4037-98e2-bcfcd2416471.sql

-- Add new columns for detailed header and footer customization
ALTER TABLE public.parametres_mise_en_forme 
ADD COLUMN IF NOT EXISTS ligne_entete_1 TEXT DEFAULT 'République Démocratique du Congo',
ADD COLUMN IF NOT EXISTS ligne_entete_2 TEXT DEFAULT 'Ministère des Finances',
ADD COLUMN IF NOT EXISTS ligne_entete_3 TEXT DEFAULT 'Direction Générale des Douanes et Accises',
ADD COLUMN IF NOT EXISTS ligne_entete_4 TEXT DEFAULT 'Direction Provinciale de Kinshasa-Ville',
ADD COLUMN IF NOT EXISTS ligne_pied_1 TEXT DEFAULT 'Tous mobilisés pour une douane d''action et d''excellence !',
ADD COLUMN IF NOT EXISTS ligne_pied_2 TEXT DEFAULT 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
ADD COLUMN IF NOT EXISTS ligne_pied_3 TEXT DEFAULT 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
ADD COLUMN IF NOT EXISTS ligne_pied_4 TEXT DEFAULT 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
ADD COLUMN IF NOT EXISTS position_tableau TEXT DEFAULT 'gauche',
ADD COLUMN IF NOT EXISTS alignement_contenu TEXT DEFAULT 'gauche',
ADD COLUMN IF NOT EXISTS espacement_tableau INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS couleur_entete_tableau TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS couleur_texte_entete TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS couleur_lignes_alternees TEXT DEFAULT '#f5f7fa';

-- Update existing row with default values
UPDATE public.parametres_mise_en_forme
SET 
  ligne_entete_1 = COALESCE(ligne_entete_1, 'République Démocratique du Congo'),
  ligne_entete_2 = COALESCE(ligne_entete_2, 'Ministère des Finances'),
  ligne_entete_3 = COALESCE(ligne_entete_3, 'Direction Générale des Douanes et Accises'),
  ligne_entete_4 = COALESCE(ligne_entete_4, 'Direction Provinciale de Kinshasa-Ville'),
  ligne_pied_1 = COALESCE(ligne_pied_1, 'Tous mobilisés pour une douane d''action et d''excellence !'),
  ligne_pied_2 = COALESCE(ligne_pied_2, 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe'),
  ligne_pied_3 = COALESCE(ligne_pied_3, 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215'),
  ligne_pied_4 = COALESCE(ligne_pied_4, 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd'),
  position_tableau = COALESCE(position_tableau, 'gauche'),
  alignement_contenu = COALESCE(alignement_contenu, 'gauche'),
  espacement_tableau = COALESCE(espacement_tableau, 10),
  couleur_entete_tableau = COALESCE(couleur_entete_tableau, '#3b82f6'),
  couleur_texte_entete = COALESCE(couleur_texte_entete, '#ffffff'),
  couleur_lignes_alternees = COALESCE(couleur_lignes_alternees, '#f5f7fa');

-- END: 20251219135753_62e59d95-a710-4037-98e2-bcfcd2416471.sql


-- BEGIN: 20260111233230_22291fb3-1ef6-4ece-8dee-37f1ca4ae990.sql

-- Remove the policy that allows admins to view all profiles
-- This is being replaced by secure edge function access
DO $$
BEGIN
	IF to_regclass('public.profiles') IS NOT NULL THEN
		DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

		-- Add a comment explaining the security model
		COMMENT ON TABLE public.profiles IS 'User profiles table. Email access for admins is handled through the manage-users edge function for security. Direct table access only allows users to see their own profile.';
	END IF;
END $$;

-- END: 20260111233230_22291fb3-1ef6-4ece-8dee-37f1ca4ae990.sql


-- BEGIN: 20260113065726_3468a324-8b67-4882-a423-095b2594aaad.sql

-- Create table for report templates
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_public BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates and public templates
CREATE POLICY "Users can view own and public templates"
ON public.report_templates
FOR SELECT
USING (auth.uid() = created_by OR is_public = true);

-- Users can create their own templates
CREATE POLICY "Users can create own templates"
ON public.report_templates
FOR INSERT
WITH CHECK (auth.uid() = created_by AND has_any_role(auth.uid()));

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
ON public.report_templates
FOR UPDATE
USING (auth.uid() = created_by);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
ON public.report_templates
FOR DELETE
USING (auth.uid() = created_by);

-- Admin can manage all templates
CREATE POLICY "Admin can manage all templates"
ON public.report_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- END: 20260113065726_3468a324-8b67-4882-a423-095b2594aaad.sql


-- BEGIN: 20260113081150_3f7a3d30-fdee-4676-9062-b5453b681fde.sql

-- Create enum for user roles (keep existing app_role enum but extend for new system)
-- Note: We already have app_role enum with 'admin', 'instructeur', 'observateur'
-- We'll map: administrateur -> admin, instructeur -> instructeur, consultation -> observateur

-- Create the custom users table for local authentication
CREATE TABLE public.local_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'observateur',
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_protected BOOLEAN DEFAULT false, -- Prevents deletion of predefined accounts
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create session tokens table for managing user sessions
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.local_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create login attempts log for security auditing
CREATE TABLE public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50),
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.local_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create function to check if current session user has a specific role
CREATE OR REPLACE FUNCTION public.get_session_user_id(session_token TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT user_id 
    FROM public.user_sessions 
    WHERE token = session_token 
      AND expires_at > now()
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_session_user_role(session_token TEXT)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT lu.role 
    FROM public.local_users lu
    INNER JOIN public.user_sessions us ON lu.id = us.user_id
    WHERE us.token = session_token 
      AND us.expires_at > now()
      AND lu.is_active = true
    LIMIT 1
$$;

-- RLS Policies for local_users
-- Allow edge functions (service role) to manage all users
CREATE POLICY "Service role can manage all users"
ON public.local_users
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for user_sessions
CREATE POLICY "Service role can manage sessions"
ON public.user_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for login_attempts (read-only for auditing, insert allowed)
CREATE POLICY "Service role can manage login attempts"
ON public.login_attempts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_local_users_username ON public.local_users(username);
CREATE INDEX idx_local_users_is_active ON public.local_users(is_active);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(token);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX idx_login_attempts_username ON public.login_attempts(username);
CREATE INDEX idx_login_attempts_created ON public.login_attempts(created_at);

-- Create trigger for updating updated_at
CREATE TRIGGER update_local_users_updated_at
BEFORE UPDATE ON public.local_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- END: 20260113081150_3f7a3d30-fdee-4676-9062-b5453b681fde.sql


-- BEGIN: 20260113140748_48117b2c-a88d-4177-b077-73ee7aa0de04.sql

-- Drop existing policies for programmations
DROP POLICY IF EXISTS "Admin and Instructeur can create programmations" ON public.programmations;
DROP POLICY IF EXISTS "Admin and Instructeur can delete programmations" ON public.programmations;
DROP POLICY IF EXISTS "Admin and Instructeur can update programmations" ON public.programmations;
DROP POLICY IF EXISTS "Authenticated users can view programmations" ON public.programmations;

-- Create a helper function to check role from session token stored in request headers
CREATE OR REPLACE FUNCTION public.get_local_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT lu.role 
    FROM public.local_users lu
    INNER JOIN public.user_sessions us ON lu.id = us.user_id
    WHERE us.expires_at > now()
      AND lu.is_active = true
    ORDER BY us.created_at DESC
    LIMIT 1
$$;

-- Create new RLS policies that allow all authenticated local users
-- Since we're using local auth, we'll use a simpler approach with permissive policies
-- The actual role checking is done in the application layer

-- Allow SELECT for all (application handles auth)
CREATE POLICY "Allow select programmations"
ON public.programmations
FOR SELECT
USING (true);

-- Allow INSERT for all (application handles role checking)
CREATE POLICY "Allow insert programmations"
ON public.programmations
FOR INSERT
WITH CHECK (true);

-- Allow UPDATE for all (application handles role checking)
CREATE POLICY "Allow update programmations"
ON public.programmations
FOR UPDATE
USING (true);

-- Allow DELETE for all (application handles role checking)
CREATE POLICY "Allow delete programmations"
ON public.programmations
FOR DELETE
USING (true);

-- END: 20260113140748_48117b2c-a88d-4177-b077-73ee7aa0de04.sql


-- BEGIN: 20260113141810_a3895bef-fe87-4c70-b230-45260a36d182.sql

-- Drop existing policies for recettes
DROP POLICY IF EXISTS "Admin and Instructeur can create recettes" ON public.recettes;
DROP POLICY IF EXISTS "Admin and Instructeur can update recettes" ON public.recettes;
DROP POLICY IF EXISTS "Authenticated users can view recettes" ON public.recettes;
DROP POLICY IF EXISTS "Only admin can delete recettes" ON public.recettes;

-- Create new permissive RLS policies for recettes (security handled by edge function)
CREATE POLICY "Allow select recettes"
ON public.recettes
FOR SELECT
USING (true);

CREATE POLICY "Allow insert recettes"
ON public.recettes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update recettes"
ON public.recettes
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete recettes"
ON public.recettes
FOR DELETE
USING (true);

-- Drop existing policies for depenses
DROP POLICY IF EXISTS "Admin and Instructeur can create depenses" ON public.depenses;
DROP POLICY IF EXISTS "Admin and Instructeur can update depenses" ON public.depenses;
DROP POLICY IF EXISTS "Authenticated users can view depenses" ON public.depenses;
DROP POLICY IF EXISTS "Only admin can delete depenses" ON public.depenses;

-- Create new permissive RLS policies for depenses (security handled by edge function)
CREATE POLICY "Allow select depenses"
ON public.depenses
FOR SELECT
USING (true);

CREATE POLICY "Allow insert depenses"
ON public.depenses
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update depenses"
ON public.depenses
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete depenses"
ON public.depenses
FOR DELETE
USING (true);

-- END: 20260113141810_a3895bef-fe87-4c70-b230-45260a36d182.sql


-- BEGIN: 20260113142319_c4d9de96-6d75-408b-b3fc-ec4a855b83fa.sql

-- Drop existing policies for rubriques
DROP POLICY IF EXISTS "Admin can delete rubriques" ON public.rubriques;
DROP POLICY IF EXISTS "Admin can insert rubriques" ON public.rubriques;
DROP POLICY IF EXISTS "Admin can update rubriques" ON public.rubriques;
DROP POLICY IF EXISTS "Authenticated users can view rubriques" ON public.rubriques;

-- Create new permissive RLS policies for rubriques (security handled by edge function)
CREATE POLICY "Allow select rubriques"
ON public.rubriques
FOR SELECT
USING (true);

CREATE POLICY "Allow insert rubriques"
ON public.rubriques
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update rubriques"
ON public.rubriques
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete rubriques"
ON public.rubriques
FOR DELETE
USING (true);

-- Drop existing policies for feuilles_caisse
DROP POLICY IF EXISTS "Admin and Instructeur can create feuilles_caisse" ON public.feuilles_caisse;
DROP POLICY IF EXISTS "Admin and Instructeur can update feuilles_caisse" ON public.feuilles_caisse;
DROP POLICY IF EXISTS "Authenticated users can view feuilles_caisse" ON public.feuilles_caisse;
DROP POLICY IF EXISTS "Only admin can delete feuilles_caisse" ON public.feuilles_caisse;

-- Create new permissive RLS policies for feuilles_caisse (security handled by edge function)
CREATE POLICY "Allow select feuilles_caisse"
ON public.feuilles_caisse
FOR SELECT
USING (true);

CREATE POLICY "Allow insert feuilles_caisse"
ON public.feuilles_caisse
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update feuilles_caisse"
ON public.feuilles_caisse
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete feuilles_caisse"
ON public.feuilles_caisse
FOR DELETE
USING (true);

-- END: 20260113142319_c4d9de96-6d75-408b-b3fc-ec4a855b83fa.sql


-- BEGIN: 20260113143035_bc6dc1ef-9e7f-41b8-9c32-d8c133533be6.sql

-- Drop all foreign key constraints pointing to auth.users for tables that use local auth
-- We won't recreate them to avoid conflicts between auth.users and local_users

-- programmations
ALTER TABLE public.programmations DROP CONSTRAINT IF EXISTS programmations_user_id_fkey;
ALTER TABLE public.programmations DROP CONSTRAINT IF EXISTS programmations_validated_by_fkey;

-- recettes
ALTER TABLE public.recettes DROP CONSTRAINT IF EXISTS recettes_user_id_fkey;

-- depenses
ALTER TABLE public.depenses DROP CONSTRAINT IF EXISTS depenses_user_id_fkey;

-- feuilles_caisse
ALTER TABLE public.feuilles_caisse DROP CONSTRAINT IF EXISTS feuilles_caisse_user_id_fkey;
ALTER TABLE public.feuilles_caisse DROP CONSTRAINT IF EXISTS feuilles_caisse_closed_by_fkey;

-- audit_logs - drop if exists
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- END: 20260113143035_bc6dc1ef-9e7f-41b8-9c32-d8c133533be6.sql


-- BEGIN: 20260115140926_1882217e-6d05-4cd3-81c2-575e3a55166c.sql

-- Add BEO and IMP fields to rubriques table
ALTER TABLE public.rubriques 
ADD COLUMN IF NOT EXISTS no_beo TEXT,
ADD COLUMN IF NOT EXISTS imp TEXT;

-- Create index for faster grouping by IMP
CREATE INDEX IF NOT EXISTS idx_rubriques_imp ON public.rubriques(imp);
CREATE INDEX IF NOT EXISTS idx_rubriques_no_beo ON public.rubriques(no_beo);

-- END: 20260115140926_1882217e-6d05-4cd3-81c2-575e3a55166c.sql


-- BEGIN: 20260128075333_537e68ac-e9c6-4ba5-b58b-e06b7b5e6525.sql

-- Créer les types ENUM pour l'application
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'instructeur', 'observateur');
    END IF;
END $$;
CREATE TYPE public.transaction_type AS ENUM ('recette', 'depense');
CREATE TYPE public.transaction_status AS ENUM ('brouillon', 'valide', 'archive');

-- Table des rôles utilisateurs (sécurité)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'observateur',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    libelle VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des rubriques (catégories de dépenses)
CREATE TABLE IF NOT EXISTS public.rubriques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    libelle VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des recettes (entrées de caisse)
CREATE TABLE IF NOT EXISTS public.recettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_bon SERIAL NOT NULL,
    numero_beo VARCHAR(50),
    date_transaction DATE NOT NULL DEFAULT CURRENT_DATE,
    heure TIME NOT NULL DEFAULT CURRENT_TIME,
    motif TEXT NOT NULL,
    provenance VARCHAR(200) NOT NULL,
    montant DECIMAL(15, 2) NOT NULL CHECK (montant > 0),
    montant_lettre TEXT,
    observation TEXT,
    solde_avant DECIMAL(15, 2),
    solde_apres DECIMAL(15, 2),
    service_id UUID REFERENCES public.services(id),
    user_id UUID NOT NULL,
    statut transaction_status NOT NULL DEFAULT 'brouillon',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des dépenses (sorties de caisse)
CREATE TABLE IF NOT EXISTS public.depenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_bon SERIAL NOT NULL,
    numero_beo VARCHAR(50),
    date_transaction DATE NOT NULL DEFAULT CURRENT_DATE,
    heure TIME NOT NULL DEFAULT CURRENT_TIME,
    beneficiaire VARCHAR(200) NOT NULL,
    motif TEXT NOT NULL,
    montant DECIMAL(15, 2) NOT NULL CHECK (montant > 0),
    montant_lettre TEXT,
    observation TEXT,
    solde_avant DECIMAL(15, 2),
    solde_apres DECIMAL(15, 2),
    rubrique_id UUID REFERENCES public.rubriques(id),
    service_id UUID REFERENCES public.services(id),
    user_id UUID NOT NULL,
    statut transaction_status NOT NULL DEFAULT 'brouillon',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des feuilles de caisse journalières
CREATE TABLE IF NOT EXISTS public.feuilles_caisse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_feuille DATE NOT NULL UNIQUE,
    solde_initial DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_recettes DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_depenses DECIMAL(15, 2) NOT NULL DEFAULT 0,
    solde_final DECIMAL(15, 2) NOT NULL DEFAULT 0,
    is_cloturee BOOLEAN NOT NULL DEFAULT false,
    cloturee_par UUID,
    cloturee_at TIMESTAMPTZ,
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des signatures (triple signature)
CREATE TABLE IF NOT EXISTS public.signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type transaction_type NOT NULL,
    transaction_id UUID NOT NULL,
    type_signature VARCHAR(20) NOT NULL CHECK (type_signature IN ('COMPT', 'DAF', 'DP')),
    user_id UUID NOT NULL,
    signature_hash TEXT,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (transaction_id, type_signature)
);

-- Table d'audit/historique
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des paramètres système
CREATE TABLE IF NOT EXISTS public.parametres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cle VARCHAR(50) NOT NULL UNIQUE,
    valeur TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feuilles_caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier les rôles (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fonction pour vérifier si l'utilisateur peut éditer
CREATE OR REPLACE FUNCTION public.can_edit(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'instructeur')
  )
$$;

-- Nettoyage des politiques existantes (idempotence)
DO $$
BEGIN
    -- user_roles
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles';

    -- profiles
    EXECUTE 'DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles';

    -- services
    EXECUTE 'DROP POLICY IF EXISTS "Everyone can view services" ON public.services';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage services" ON public.services';

    -- rubriques
    EXECUTE 'DROP POLICY IF EXISTS "Everyone can view rubriques" ON public.rubriques';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage rubriques" ON public.rubriques';

    -- recettes
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view recettes" ON public.recettes';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can create recettes" ON public.recettes';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can update recettes" ON public.recettes';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete recettes" ON public.recettes';

    -- depenses
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view depenses" ON public.depenses';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can create depenses" ON public.depenses';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can update depenses" ON public.depenses';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete depenses" ON public.depenses';

    -- feuilles_caisse
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view feuilles" ON public.feuilles_caisse';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can manage feuilles" ON public.feuilles_caisse';

    -- signatures
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view signatures" ON public.signatures';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can create signatures" ON public.signatures';

    -- audit_logs
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs';
END $$;

-- Politiques RLS pour user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour services
CREATE POLICY "Everyone can view services"
ON public.services FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour rubriques
CREATE POLICY "Everyone can view rubriques"
ON public.rubriques FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage rubriques"
ON public.rubriques FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour recettes
CREATE POLICY "Authenticated users can view recettes"
ON public.recettes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Editors can create recettes"
ON public.recettes FOR INSERT
TO authenticated
WITH CHECK (public.can_edit(auth.uid()));

CREATE POLICY "Editors can update recettes"
ON public.recettes FOR UPDATE
TO authenticated
USING (public.can_edit(auth.uid()));

CREATE POLICY "Admins can delete recettes"
ON public.recettes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour depenses
CREATE POLICY "Authenticated users can view depenses"
ON public.depenses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Editors can create depenses"
ON public.depenses FOR INSERT
TO authenticated
WITH CHECK (public.can_edit(auth.uid()));

CREATE POLICY "Editors can update depenses"
ON public.depenses FOR UPDATE
TO authenticated
USING (public.can_edit(auth.uid()));

CREATE POLICY "Admins can delete depenses"
ON public.depenses FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour feuilles_caisse
CREATE POLICY "Authenticated users can view feuilles"
ON public.feuilles_caisse FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Editors can manage feuilles"
ON public.feuilles_caisse FOR ALL
TO authenticated
USING (public.can_edit(auth.uid()));

-- Politiques RLS pour signatures
CREATE POLICY "Authenticated users can view signatures"
ON public.signatures FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Editors can create signatures"
ON public.signatures FOR INSERT
TO authenticated
WITH CHECK (public.can_edit(auth.uid()));

-- Politiques RLS pour audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politiques RLS pour parametres
CREATE POLICY "Everyone can view parametres"
ON public.parametres FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage parametres"
ON public.parametres FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DO $$
BEGIN
    EXECUTE 'DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles';
    EXECUTE 'DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles';
    EXECUTE 'DROP TRIGGER IF EXISTS update_services_updated_at ON public.services';
    EXECUTE 'DROP TRIGGER IF EXISTS update_rubriques_updated_at ON public.rubriques';
    EXECUTE 'DROP TRIGGER IF EXISTS update_recettes_updated_at ON public.recettes';
    EXECUTE 'DROP TRIGGER IF EXISTS update_depenses_updated_at ON public.depenses';
    EXECUTE 'DROP TRIGGER IF EXISTS update_feuilles_caisse_updated_at ON public.feuilles_caisse';
    EXECUTE 'DROP TRIGGER IF EXISTS update_parametres_updated_at ON public.parametres';
END $$;

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rubriques_updated_at
    BEFORE UPDATE ON public.rubriques
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recettes_updated_at
    BEFORE UPDATE ON public.recettes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_depenses_updated_at
    BEFORE UPDATE ON public.depenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feuilles_caisse_updated_at
    BEFORE UPDATE ON public.feuilles_caisse
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parametres_updated_at
    BEFORE UPDATE ON public.parametres
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les services par défaut
INSERT INTO public.services (code, libelle) VALUES
('DGDA-KIN', 'Direction Provinciale Kinshasa-Ville'),
('CONTENTIEUX', 'Service Contentieux'),
('RECETTES', 'Service des Recettes'),
('ADMIN', 'Administration Générale')
ON CONFLICT (code) DO NOTHING;

-- Insérer les rubriques par défaut
INSERT INTO public.rubriques (code, libelle) VALUES
('RUB-001', 'Fournitures de bureau'),
('RUB-002', 'Carburant et lubrifiant'),
('RUB-003', 'Entretien et réparation'),
('RUB-004', 'Communication'),
('RUB-005', 'Déplacements et missions'),
('RUB-006', 'Frais divers');

-- Insérer les paramètres par défaut
INSERT INTO public.parametres (cle, valeur, description) VALUES
('nom_institution', 'Direction Générale des Douanes et Accises', 'Nom complet de l''institution'),
('direction_provinciale', 'Direction Provinciale Kinshasa-Ville', 'Nom de la direction provinciale'),
('devise', 'FC', 'Symbole de la devise'),
('devise_nom', 'Francs Congolais', 'Nom complet de la devise'),
('solde_initial', '0', 'Solde initial de la caisse');

-- END: 20260128075333_537e68ac-e9c6-4ba5-b58b-e06b7b5e6525.sql


-- BEGIN: 20260128075412_cb919712-5e0c-4001-b4ef-4807fa459516.sql

-- Corriger la fonction update_updated_at_column avec search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Supprimer la politique trop permissive pour audit_logs INSERT
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;

-- Créer une politique plus restrictive - seuls les utilisateurs authentifiés peuvent créer des logs
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- END: 20260128075412_cb919712-5e0c-4001-b4ef-4807fa459516.sql


-- BEGIN: 20260128080650_d3b0b64b-fae4-484e-a39e-3aeafd422ec8.sql

-- Table pour les utilisateurs locaux (authentification sans Supabase Auth)
CREATE TABLE IF NOT EXISTS public.local_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'observateur' CHECK (role IN ('admin', 'instructeur', 'observateur')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_protected BOOLEAN NOT NULL DEFAULT false,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les sessions utilisateur
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.local_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les tentatives de connexion
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address VARCHAR(50),
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_local_users_username ON public.local_users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON public.login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON public.login_attempts(created_at DESC);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_local_users_updated_at ON public.local_users;
CREATE TRIGGER update_local_users_updated_at
  BEFORE UPDATE ON public.local_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS pour local_users (service role uniquement via edge function)
ALTER TABLE public.local_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policies: seulement service role peut accéder (via edge function)
DROP POLICY IF EXISTS "Service role full access on local_users" ON public.local_users;
DROP POLICY IF EXISTS "Service role full access on user_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Service role full access on login_attempts" ON public.login_attempts;

CREATE POLICY "Service role full access on local_users" ON public.local_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on user_sessions" ON public.user_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on login_attempts" ON public.login_attempts
  FOR ALL USING (true) WITH CHECK (true);

-- END: 20260128080650_d3b0b64b-fae4-484e-a39e-3aeafd422ec8.sql


-- BEGIN: 20260128090145_690633de-c4f6-4fc3-97fd-e0dc7777564f.sql

-- Create programmations table for monthly budget planning
CREATE TABLE IF NOT EXISTS public.programmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ordre INTEGER,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL,
  rubrique_id UUID REFERENCES public.rubriques(id),
  designation TEXT NOT NULL,
  montant_prevu NUMERIC NOT NULL DEFAULT 0,
  montant_lettre TEXT,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Service role full access on programmations" ON public.programmations;
CREATE POLICY "Service role full access on programmations"
  ON public.programmations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_programmations_mois_annee ON public.programmations(annee DESC, mois DESC);
CREATE INDEX IF NOT EXISTS idx_programmations_rubrique ON public.programmations(rubrique_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_programmations_updated_at ON public.programmations;
CREATE TRIGGER update_programmations_updated_at
  BEFORE UPDATE ON public.programmations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- END: 20260128090145_690633de-c4f6-4fc3-97fd-e0dc7777564f.sql


-- BEGIN: 20260129191830_9d208fe1-8b29-43c3-b20b-cc66db6e78ac.sql

-- Create report_templates table for saving customized report configurations
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    created_by UUID NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own templates and public templates
DROP POLICY IF EXISTS "Users can view own and public templates" ON public.report_templates;
CREATE POLICY "Users can view own and public templates"
ON public.report_templates
FOR SELECT
USING (created_by = auth.uid() OR is_public = true);

-- Policy: Users can create their own templates
DROP POLICY IF EXISTS "Users can create own templates" ON public.report_templates;
CREATE POLICY "Users can create own templates"
ON public.report_templates
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Policy: Users can update their own templates
DROP POLICY IF EXISTS "Users can update own templates" ON public.report_templates;
CREATE POLICY "Users can update own templates"
ON public.report_templates
FOR UPDATE
USING (created_by = auth.uid());

-- Policy: Users can delete their own templates
DROP POLICY IF EXISTS "Users can delete own templates" ON public.report_templates;
CREATE POLICY "Users can delete own templates"
ON public.report_templates
FOR DELETE
USING (created_by = auth.uid());

-- Service role full access for edge functions
DROP POLICY IF EXISTS "Service role full access on report_templates" ON public.report_templates;
CREATE POLICY "Service role full access on report_templates"
ON public.report_templates
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_report_templates_updated_at ON public.report_templates;
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- END: 20260129191830_9d208fe1-8b29-43c3-b20b-cc66db6e78ac.sql


-- BEGIN: 20260129193245_3ca2ab01-6617-44c0-ac8d-ee6e8a64b92c.sql

-- Add is_default column to report_templates
ALTER TABLE public.report_templates 
ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Create function to ensure only one default template exists
CREATE OR REPLACE FUNCTION public.set_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  -- If this template is being set as default, unset all other defaults
  IF NEW.is_default = true THEN
    UPDATE public.report_templates
    SET is_default = false
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to enforce single default
CREATE TRIGGER ensure_single_default_template
BEFORE INSERT OR UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_single_default_template();

-- Create index for faster default template lookup
CREATE INDEX idx_report_templates_default ON public.report_templates (is_default) WHERE is_default = true;

-- END: 20260129193245_3ca2ab01-6617-44c0-ac8d-ee6e8a64b92c.sql


-- BEGIN: 20260202120000_public_read_policies.sql

-- Public read-only policies for anonymous access
-- This allows direct Supabase reads without Edge Functions (no token) for specific tables.
DO $$
BEGIN
  IF to_regclass('public.rubriques') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view rubriques" ON public.rubriques
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.recettes') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view recettes" ON public.recettes
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.depenses') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view depenses" ON public.depenses
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.programmations') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view programmations" ON public.programmations
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.feuilles_caisse') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view feuilles_caisse" ON public.feuilles_caisse
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.services') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view services" ON public.services
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.categories') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view categories" ON public.categories
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.signataires') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view signataires" ON public.signataires
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- END: 20260202120000_public_read_policies.sql


-- BEGIN: 20260202121500_rls_write_policies.sql

-- RLS write policies using app roles
-- Requires authenticated users with proper roles in user_roles table
DO $$
BEGIN
  -- Rubriques
  IF to_regclass('public.rubriques') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin can insert rubriques" ON public.rubriques
        FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can update rubriques" ON public.rubriques
        FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can delete rubriques" ON public.rubriques
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Services
  IF to_regclass('public.services') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin can insert services" ON public.services
        FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can update services" ON public.services
        FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can delete services" ON public.services
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Recettes
  IF to_regclass('public.recettes') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin and Instructeur can create recettes" ON public.recettes
        FOR INSERT TO authenticated WITH CHECK (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin and Instructeur can update recettes" ON public.recettes
        FOR UPDATE TO authenticated USING (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Only admin can delete recettes" ON public.recettes
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Depenses
  IF to_regclass('public.depenses') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin and Instructeur can create depenses" ON public.depenses
        FOR INSERT TO authenticated WITH CHECK (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin and Instructeur can update depenses" ON public.depenses
        FOR UPDATE TO authenticated USING (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Only admin can delete depenses" ON public.depenses
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Programmations
  IF to_regclass('public.programmations') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin can create programmations" ON public.programmations
        FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can update programmations" ON public.programmations
        FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can delete programmations" ON public.programmations
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Feuilles de caisse
  IF to_regclass('public.feuilles_caisse') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin and Instructeur can create feuilles_caisse" ON public.feuilles_caisse
        FOR INSERT TO authenticated WITH CHECK (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin and Instructeur can update feuilles_caisse" ON public.feuilles_caisse
        FOR UPDATE TO authenticated USING (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Only admin can delete feuilles_caisse" ON public.feuilles_caisse
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- END: 20260202121500_rls_write_policies.sql


-- BEGIN: 20260202124000_local_auth_rls.sql

-- Local auth RLS: use session token from request header (x-session-token)

-- Helper: read token from request headers
CREATE OR REPLACE FUNCTION public.get_request_session_token()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(
    (COALESCE(current_setting('request.headers', true), '{}')::jsonb ->> 'x-session-token'),
    ''
  )
$$;

-- Helper: current local user id (from user_sessions)
CREATE OR REPLACE FUNCTION public.local_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_session_user_id(public.get_request_session_token())
$$;

-- Helper: current local user role (from local_users)
CREATE OR REPLACE FUNCTION public.local_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_session_user_role(public.get_request_session_token())
$$;

-- Helper: is local user authenticated
CREATE OR REPLACE FUNCTION public.is_local_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.local_user_id() IS NOT NULL
$$;

DO $$
BEGIN
  -- Drop public/legacy policies if they exist
  IF to_regclass('public.rubriques') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view rubriques" ON public.rubriques';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view rubriques" ON public.rubriques';
  END IF;
  IF to_regclass('public.recettes') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view recettes" ON public.recettes';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view recettes" ON public.recettes';
  END IF;
  IF to_regclass('public.depenses') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view depenses" ON public.depenses';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view depenses" ON public.depenses';
  END IF;
  IF to_regclass('public.programmations') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view programmations" ON public.programmations';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view programmations" ON public.programmations';
  END IF;
  IF to_regclass('public.feuilles_caisse') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view feuilles_caisse" ON public.feuilles_caisse';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view feuilles_caisse" ON public.feuilles_caisse';
  END IF;
  IF to_regclass('public.services') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view services" ON public.services';
  END IF;
  IF to_regclass('public.categories') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view categories" ON public.categories';
  END IF;
  IF to_regclass('public.signataires') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view signataires" ON public.signataires';
  END IF;
END $$;

DO $$
BEGIN
  -- SELECT policies for local auth
  IF to_regclass('public.rubriques') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view rubriques" ON public.rubriques FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin can insert rubriques" ON public.rubriques FOR INSERT WITH CHECK (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can update rubriques" ON public.rubriques FOR UPDATE USING (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can delete rubriques" ON public.rubriques FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.services') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view services" ON public.services FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin can insert services" ON public.services FOR INSERT WITH CHECK (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can update services" ON public.services FOR UPDATE USING (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can delete services" ON public.services FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.recettes') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view recettes" ON public.recettes FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can create recettes" ON public.recettes FOR INSERT WITH CHECK (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can update recettes" ON public.recettes FOR UPDATE USING (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin can delete recettes" ON public.recettes FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.depenses') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view depenses" ON public.depenses FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can create depenses" ON public.depenses FOR INSERT WITH CHECK (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can update depenses" ON public.depenses FOR UPDATE USING (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin can delete depenses" ON public.depenses FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.programmations') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view programmations" ON public.programmations FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin can create programmations" ON public.programmations FOR INSERT WITH CHECK (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can update programmations" ON public.programmations FOR UPDATE USING (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can delete programmations" ON public.programmations FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.feuilles_caisse') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view feuilles_caisse" ON public.feuilles_caisse FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can create feuilles_caisse" ON public.feuilles_caisse FOR INSERT WITH CHECK (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can update feuilles_caisse" ON public.feuilles_caisse FOR UPDATE USING (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin can delete feuilles_caisse" ON public.feuilles_caisse FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.categories') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view categories" ON public.categories FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin can insert categories" ON public.categories FOR INSERT WITH CHECK (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can update categories" ON public.categories FOR UPDATE USING (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can delete categories" ON public.categories FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.signataires') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view signataires" ON public.signataires FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin can insert signataires" ON public.signataires FOR INSERT WITH CHECK (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can update signataires" ON public.signataires FOR UPDATE USING (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can delete signataires" ON public.signataires FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;
END $$;

-- END: 20260202124000_local_auth_rls.sql


-- BEGIN: 20260202130000_add_categorie_to_rubriques.sql

-- Add missing categorie column to rubriques
ALTER TABLE public.rubriques
ADD COLUMN IF NOT EXISTS categorie TEXT;

-- END: 20260202130000_add_categorie_to_rubriques.sql


-- BEGIN: 20260202133000_add_rubriques_columns.sql

-- Add missing columns to rubriques to match application needs
ALTER TABLE public.rubriques
  ADD COLUMN IF NOT EXISTS categorie TEXT,
  ADD COLUMN IF NOT EXISTS no_beo TEXT,
  ADD COLUMN IF NOT EXISTS imp TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS imputation TEXT,
  ADD COLUMN IF NOT EXISTS categorie_id UUID,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Ensure foreign key on categorie_id if categories table exists
DO $$
BEGIN
  IF to_regclass('public.categories') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.rubriques
        ADD CONSTRAINT rubriques_categorie_id_fkey
        FOREIGN KEY (categorie_id) REFERENCES public.categories(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- END: 20260202133000_add_rubriques_columns.sql


-- BEGIN: 20260202134000_refresh_schema_cache.sql

-- Refresh PostgREST schema cache so new columns are visible
NOTIFY pgrst, 'reload schema';

-- END: 20260202134000_refresh_schema_cache.sql

