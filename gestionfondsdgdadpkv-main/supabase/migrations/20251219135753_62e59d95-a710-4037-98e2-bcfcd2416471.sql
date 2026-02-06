-- Add new columns for detailed header and footer customization
ALTER TABLE public.parametres_mise_en_forme 
ADD COLUMN IF NOT EXISTS ligne_entete_1 TEXT DEFAULT 'République Démocratique du Congo',
ADD COLUMN IF NOT EXISTS ligne_entete_2 TEXT DEFAULT 'Ministère des Finances',
ADD COLUMN IF NOT EXISTS ligne_entete_3 TEXT DEFAULT 'Direction Générale des Douanes et Accises',
ADD COLUMN IF NOT EXISTS ligne_entete_4 TEXT DEFAULT 'Direction Provinciale de Kinshasa-Ville',
ADD COLUMN IF NOT EXISTS ligne_pied_1 TEXT DEFAULT 'Tous mobilisés pour une douane d''action et d''excellence !',
ADD COLUMN IF NOT EXISTS ligne_pied_2 TEXT DEFAULT 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
ADD COLUMN IF NOT EXISTS ligne_pied_3 TEXT DEFAULT 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
ADD COLUMN IF NOT EXISTS ligne_pied_4 TEXT DEFAULT 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
ADD COLUMN IF NOT EXISTS position_tableau TEXT DEFAULT 'gauche',
ADD COLUMN IF NOT EXISTS alignement_contenu TEXT DEFAULT 'gauche',
ADD COLUMN IF NOT EXISTS espacement_tableau INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS couleur_entete_tableau TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS couleur_texte_entete TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS couleur_lignes_alternees TEXT DEFAULT '#f5f7fa';

-- Update existing row with default values
UPDATE public.parametres_mise_en_forme
SET 
  ligne_entete_1 = COALESCE(ligne_entete_1, 'République Démocratique du Congo'),
  ligne_entete_2 = COALESCE(ligne_entete_2, 'Ministère des Finances'),
  ligne_entete_3 = COALESCE(ligne_entete_3, 'Direction Générale des Douanes et Accises'),
  ligne_entete_4 = COALESCE(ligne_entete_4, 'Direction Provinciale de Kinshasa-Ville'),
  ligne_pied_1 = COALESCE(ligne_pied_1, 'Tous mobilisés pour une douane d''action et d''excellence !'),
  ligne_pied_2 = COALESCE(ligne_pied_2, 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe'),
  ligne_pied_3 = COALESCE(ligne_pied_3, 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215'),
  ligne_pied_4 = COALESCE(ligne_pied_4, 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd'),
  position_tableau = COALESCE(position_tableau, 'gauche'),
  alignement_contenu = COALESCE(alignement_contenu, 'gauche'),
  espacement_tableau = COALESCE(espacement_tableau, 10),
  couleur_entete_tableau = COALESCE(couleur_entete_tableau, '#3b82f6'),
  couleur_texte_entete = COALESCE(couleur_texte_entete, '#ffffff'),
  couleur_lignes_alternees = COALESCE(couleur_lignes_alternees, '#f5f7fa');