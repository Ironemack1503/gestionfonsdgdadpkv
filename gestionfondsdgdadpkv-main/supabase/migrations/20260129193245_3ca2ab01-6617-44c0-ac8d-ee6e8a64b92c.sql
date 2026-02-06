-- Add is_default column to report_templates
ALTER TABLE public.report_templates 
ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Create function to ensure only one default template exists
CREATE OR REPLACE FUNCTION public.set_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  -- If this template is being set as default, unset all other defaults
  IF NEW.is_default = true THEN
    UPDATE public.report_templates
    SET is_default = false
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to enforce single default
CREATE TRIGGER ensure_single_default_template
BEFORE INSERT OR UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_single_default_template();

-- Create index for faster default template lookup
CREATE INDEX idx_report_templates_default ON public.report_templates (is_default) WHERE is_default = true;