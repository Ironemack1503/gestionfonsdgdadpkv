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