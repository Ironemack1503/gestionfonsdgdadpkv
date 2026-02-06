-- Test rapide de connexion
SELECT 
  current_database() as database_name,
  current_user as current_user,
  version() as postgres_version;
