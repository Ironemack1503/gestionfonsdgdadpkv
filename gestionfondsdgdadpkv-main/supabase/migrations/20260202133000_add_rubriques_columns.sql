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
