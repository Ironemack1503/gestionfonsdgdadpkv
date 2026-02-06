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