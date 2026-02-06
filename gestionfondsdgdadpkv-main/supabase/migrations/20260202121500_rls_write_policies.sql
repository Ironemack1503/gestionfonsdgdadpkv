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
