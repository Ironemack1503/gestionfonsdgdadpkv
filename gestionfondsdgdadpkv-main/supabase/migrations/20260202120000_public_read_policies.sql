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
