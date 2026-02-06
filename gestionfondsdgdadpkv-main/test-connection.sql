-- Test de connexion PostgreSQL via SQLTools
-- Sélectionnez les lignes et exécutez avec Ctrl+E Ctrl+E

-- 1. Informations de connexion
SELECT 
  current_database() as database_name,
  current_user as current_user,
  version() as postgres_version,
  now() as current_timestamp;

-- 2. Lister toutes les tables de la base
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Vérifier les données dans quelques tables principales
SELECT 'rubriques' as table_name, COUNT(*) as row_count FROM public.rubriques
UNION ALL
SELECT 'recettes', COUNT(*) FROM public.recettes
UNION ALL
SELECT 'depenses', COUNT(*) FROM public.depenses
UNION ALL
SELECT 'services', COUNT(*) FROM public.services
UNION ALL
SELECT 'user_roles', COUNT(*) FROM public.user_roles;

-- 4. Voir les 5 premières rubriques
SELECT * FROM public.rubriques 
ORDER BY code 
LIMIT 5;

-- 5. Voir les utilisateurs
SELECT 
  user_id,
  username,
  full_name,
  role,
  is_active,
  last_login_at
FROM public.user_roles
ORDER BY created_at DESC;

-- 6. Statistiques globales
SELECT 
  (SELECT COUNT(*) FROM public.recettes) as total_recettes,
  (SELECT COUNT(*) FROM public.depenses) as total_depenses,
  (SELECT SUM(montant) FROM public.recettes) as total_montant_recettes,
  (SELECT SUM(montant) FROM public.depenses) as total_montant_depenses,
  (SELECT COUNT(*) FROM public.user_roles WHERE is_active = true) as users_actifs;
