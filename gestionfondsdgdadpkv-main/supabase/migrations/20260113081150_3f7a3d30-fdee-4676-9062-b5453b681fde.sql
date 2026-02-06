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