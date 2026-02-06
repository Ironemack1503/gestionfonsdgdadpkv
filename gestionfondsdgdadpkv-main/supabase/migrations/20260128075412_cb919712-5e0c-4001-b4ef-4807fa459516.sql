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