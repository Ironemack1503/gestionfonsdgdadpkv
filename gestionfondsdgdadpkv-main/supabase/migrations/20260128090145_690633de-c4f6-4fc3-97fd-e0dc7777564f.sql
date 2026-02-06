-- Create programmations table for monthly budget planning
CREATE TABLE IF NOT EXISTS public.programmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ordre INTEGER,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL,
  rubrique_id UUID REFERENCES public.rubriques(id),
  designation TEXT NOT NULL,
  montant_prevu NUMERIC NOT NULL DEFAULT 0,
  montant_lettre TEXT,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Service role full access on programmations" ON public.programmations;
CREATE POLICY "Service role full access on programmations"
  ON public.programmations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_programmations_mois_annee ON public.programmations(annee DESC, mois DESC);
CREATE INDEX IF NOT EXISTS idx_programmations_rubrique ON public.programmations(rubrique_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_programmations_updated_at ON public.programmations;
CREATE TRIGGER update_programmations_updated_at
  BEFORE UPDATE ON public.programmations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();