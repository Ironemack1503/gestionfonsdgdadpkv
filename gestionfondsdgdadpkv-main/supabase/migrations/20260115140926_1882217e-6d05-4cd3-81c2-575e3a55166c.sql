-- Add BEO and IMP fields to rubriques table
ALTER TABLE public.rubriques 
ADD COLUMN IF NOT EXISTS no_beo TEXT,
ADD COLUMN IF NOT EXISTS imp TEXT;

-- Create index for faster grouping by IMP
CREATE INDEX IF NOT EXISTS idx_rubriques_imp ON public.rubriques(imp);
CREATE INDEX IF NOT EXISTS idx_rubriques_no_beo ON public.rubriques(no_beo);