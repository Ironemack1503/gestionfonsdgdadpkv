-- Table pour les paramètres d'alertes (configurés par l'admin)
CREATE TABLE public.alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value NUMERIC NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les alertes générées
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'solde_bas', 'depassement_budget', 'depense_importante'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  related_record_id UUID,
  related_table TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policies for alert_settings
CREATE POLICY "Authenticated users can view alert settings"
ON public.alert_settings FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Only admin can manage alert settings"
ON public.alert_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for alerts
CREATE POLICY "Authenticated users can view alerts"
ON public.alerts FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and instructeur can manage alerts"
ON public.alerts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

-- Insert default settings
INSERT INTO public.alert_settings (setting_key, setting_value, description) VALUES
  ('seuil_solde_bas', 100000, 'Seuil de solde bas en francs'),
  ('seuil_depense_importante', 500000, 'Seuil pour une dépense importante en francs'),
  ('pourcentage_depassement_budget', 80, 'Pourcentage de la programmation à partir duquel alerter');

-- Trigger for updated_at
CREATE TRIGGER update_alert_settings_updated_at
BEFORE UPDATE ON public.alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();