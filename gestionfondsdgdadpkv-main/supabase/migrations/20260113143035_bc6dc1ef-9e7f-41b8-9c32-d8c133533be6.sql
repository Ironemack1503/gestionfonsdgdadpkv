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