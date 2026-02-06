-- Vérifier s'il y a des recettes dans la table
SELECT COUNT(*) as total_recettes FROM recettes;

-- Désactiver temporairement le RLS pour tester
ALTER TABLE recettes DISABLE ROW LEVEL SECURITY;
ALTER TABLE depenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE feuille_caisse DISABLE ROW LEVEL SECURITY;

-- Créer des politiques permissives pour l'accès anonyme (pour le développement local)
DROP POLICY IF EXISTS "Allow anonymous read access" ON recettes;
CREATE POLICY "Allow anonymous read access" ON recettes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert" ON recettes;
CREATE POLICY "Allow anonymous insert" ON recettes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update" ON recettes;
CREATE POLICY "Allow anonymous update" ON recettes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete" ON recettes;
CREATE POLICY "Allow anonymous delete" ON recettes FOR DELETE USING (true);

-- Même chose pour les dépenses
DROP POLICY IF EXISTS "Allow anonymous read access" ON depenses;
CREATE POLICY "Allow anonymous read access" ON depenses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert" ON depenses;
CREATE POLICY "Allow anonymous insert" ON depenses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update" ON depenses;
CREATE POLICY "Allow anonymous update" ON depenses FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete" ON depenses;
CREATE POLICY "Allow anonymous delete" ON depenses FOR DELETE USING (true);

-- Vérifier à nouveau
SELECT 'Recettes:', COUNT(*) FROM recettes;
SELECT 'Dépenses:', COUNT(*) FROM depenses;
