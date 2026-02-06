# Migration locale (SQL pur)

## Fichier à exécuter
- Utiliser **scripts/migrate-local-no-localauth.sql** (sans local-auth RLS).

## Étapes (pgAdmin ou client SQL)
1) Créer une base PostgreSQL locale (ex. `gestioncaisse_local`).
2) Ouvrir l’éditeur SQL, charger le fichier ci-dessus et **exécuter**.
3) Vérifier :
   - Tables : `rubriques`, `recettes`, `depenses`, `services`, `profiles`, `user_roles`, etc.
   - Fonctions : `update_updated_at_column`, `has_role`, `has_any_role`.
   - RLS : policies sur les tables sensibles.

## Vérifications rapides
- `SELECT * FROM public.rubriques LIMIT 5;`
- `SELECT * FROM public.services LIMIT 5;`
- `SELECT * FROM public.user_roles LIMIT 5;`

## Notes
- Ce mode n’utilise **aucune** Edge Function ni token.
- Pour des données de test, crée un fichier seed séparé et exécute-le après la migration.
