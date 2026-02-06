-- Promouvoir l'utilisateur "Administrateur" au rang d'admin
DO $$
BEGIN
	IF to_regclass('public.user_roles') IS NOT NULL THEN
		UPDATE public.user_roles 
		SET role = 'admin'::app_role 
		WHERE user_id = 'f7db4131-2d3f-4781-a528-aa6c1eafc79a';
	END IF;
END $$;