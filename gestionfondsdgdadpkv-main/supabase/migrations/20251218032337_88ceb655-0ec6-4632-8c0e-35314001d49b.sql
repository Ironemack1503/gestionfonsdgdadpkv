-- Make rubrique_id optional in programmations table
ALTER TABLE public.programmations 
ALTER COLUMN rubrique_id DROP NOT NULL;

-- Add numero_ordre column for display ordering within month/year
ALTER TABLE public.programmations
ADD COLUMN numero_ordre integer;

-- Create function to auto-generate numero_ordre
CREATE OR REPLACE FUNCTION public.generate_programmation_numero_ordre()
RETURNS TRIGGER AS $$
DECLARE
  next_numero integer;
BEGIN
  -- Get the next order number for this month/year
  SELECT COALESCE(MAX(numero_ordre), 0) + 1
  INTO next_numero
  FROM public.programmations
  WHERE mois = NEW.mois AND annee = NEW.annee;
  
  NEW.numero_ordre := next_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-generating numero_ordre
CREATE TRIGGER set_programmation_numero_ordre
BEFORE INSERT ON public.programmations
FOR EACH ROW
WHEN (NEW.numero_ordre IS NULL)
EXECUTE FUNCTION public.generate_programmation_numero_ordre();