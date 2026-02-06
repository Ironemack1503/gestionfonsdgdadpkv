-- Create table for report formatting settings
CREATE TABLE public.parametres_mise_en_forme (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  titre_entete TEXT DEFAULT 'DIRECTION GÉNÉRALE DES DOUANES ET ACCISES',
  sous_titre TEXT DEFAULT 'Rapport Financier',
  contenu_pied_page TEXT DEFAULT 'DGDA - Document officiel',
  afficher_numero_page BOOLEAN DEFAULT true,
  afficher_date BOOLEAN DEFAULT true,
  afficher_nom_institution BOOLEAN DEFAULT true,
  police TEXT DEFAULT 'helvetica',
  taille_police INTEGER DEFAULT 10,
  couleur_principale TEXT DEFAULT '#1e40af',
  marges_haut NUMERIC DEFAULT 15,
  marges_bas NUMERIC DEFAULT 15,
  marges_gauche NUMERIC DEFAULT 10,
  marges_droite NUMERIC DEFAULT 10,
  orientation TEXT DEFAULT 'portrait',
  position_logo TEXT DEFAULT 'gauche',
  filigrane_actif BOOLEAN DEFAULT true,
  filigrane_texte TEXT DEFAULT 'DGDA',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.parametres_mise_en_forme ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view report settings" 
ON public.parametres_mise_en_forme 
FOR SELECT 
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and Instructeur can update report settings" 
ON public.parametres_mise_en_forme 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

CREATE POLICY "Admin can insert report settings" 
ON public.parametres_mise_en_forme 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete report settings" 
ON public.parametres_mise_en_forme 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_parametres_mise_en_forme_updated_at
BEFORE UPDATE ON public.parametres_mise_en_forme
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.parametres_mise_en_forme (
  titre_entete,
  sous_titre,
  contenu_pied_page,
  afficher_numero_page,
  afficher_date,
  afficher_nom_institution,
  police,
  taille_police,
  couleur_principale,
  marges_haut,
  marges_bas,
  marges_gauche,
  marges_droite,
  orientation,
  position_logo,
  filigrane_actif,
  filigrane_texte
) VALUES (
  'DIRECTION GÉNÉRALE DES DOUANES ET ACCISES',
  'Rapport Financier',
  'DGDA - Document officiel',
  true,
  true,
  true,
  'helvetica',
  10,
  '#1e40af',
  15,
  15,
  10,
  10,
  'portrait',
  'gauche',
  true,
  'DGDA'
);