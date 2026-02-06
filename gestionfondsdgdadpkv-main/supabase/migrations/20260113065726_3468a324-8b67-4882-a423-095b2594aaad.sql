-- Create table for report templates
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_public BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates and public templates
CREATE POLICY "Users can view own and public templates"
ON public.report_templates
FOR SELECT
USING (auth.uid() = created_by OR is_public = true);

-- Users can create their own templates
CREATE POLICY "Users can create own templates"
ON public.report_templates
FOR INSERT
WITH CHECK (auth.uid() = created_by AND has_any_role(auth.uid()));

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
ON public.report_templates
FOR UPDATE
USING (auth.uid() = created_by);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
ON public.report_templates
FOR DELETE
USING (auth.uid() = created_by);

-- Admin can manage all templates
CREATE POLICY "Admin can manage all templates"
ON public.report_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();