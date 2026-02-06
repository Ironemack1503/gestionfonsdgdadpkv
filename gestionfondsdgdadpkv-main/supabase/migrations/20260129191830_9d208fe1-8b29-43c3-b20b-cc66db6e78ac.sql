-- Create report_templates table for saving customized report configurations
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    created_by UUID NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own templates and public templates
DROP POLICY IF EXISTS "Users can view own and public templates" ON public.report_templates;
CREATE POLICY "Users can view own and public templates"
ON public.report_templates
FOR SELECT
USING (created_by = auth.uid() OR is_public = true);

-- Policy: Users can create their own templates
DROP POLICY IF EXISTS "Users can create own templates" ON public.report_templates;
CREATE POLICY "Users can create own templates"
ON public.report_templates
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Policy: Users can update their own templates
DROP POLICY IF EXISTS "Users can update own templates" ON public.report_templates;
CREATE POLICY "Users can update own templates"
ON public.report_templates
FOR UPDATE
USING (created_by = auth.uid());

-- Policy: Users can delete their own templates
DROP POLICY IF EXISTS "Users can delete own templates" ON public.report_templates;
CREATE POLICY "Users can delete own templates"
ON public.report_templates
FOR DELETE
USING (created_by = auth.uid());

-- Service role full access for edge functions
DROP POLICY IF EXISTS "Service role full access on report_templates" ON public.report_templates;
CREATE POLICY "Service role full access on report_templates"
ON public.report_templates
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_report_templates_updated_at ON public.report_templates;
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();