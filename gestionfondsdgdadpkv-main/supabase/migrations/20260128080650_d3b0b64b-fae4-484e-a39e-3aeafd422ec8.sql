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