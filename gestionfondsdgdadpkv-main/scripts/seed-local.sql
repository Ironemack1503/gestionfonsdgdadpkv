-- Seed local minimal (sans dépendance auth.users)

-- Services
INSERT INTO public.services (code, libelle, is_active)
VALUES
  ('SRV-01', 'Service Comptabilité', true),
  ('SRV-02', 'Service Finances', true)
ON CONFLICT (code) DO NOTHING;

-- Rubriques (created_by NULL)
INSERT INTO public.rubriques (code, libelle, categorie, imp, no_beo, is_active, created_by)
VALUES
  ('RUB-REC-001', 'Recette principale', 'Recette', '100001', '', true, NULL),
  ('RUB-DEP-001', 'Dépense principale', 'Dépense', '200001', '', true, NULL)
ON CONFLICT (code) DO NOTHING;
