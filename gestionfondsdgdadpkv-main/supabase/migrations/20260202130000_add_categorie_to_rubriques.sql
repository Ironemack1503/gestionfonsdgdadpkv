-- Add missing categorie column to rubriques
ALTER TABLE public.rubriques
ADD COLUMN IF NOT EXISTS categorie TEXT;
