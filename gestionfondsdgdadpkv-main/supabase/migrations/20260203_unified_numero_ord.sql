-- Migration pour créer une séquence unifiée pour le numéro d'ordre (N°d'ord)
-- Cette séquence sera partagée entre recettes et depenses pour la Feuille de Caisse

-- 1. Créer une nouvelle séquence unifiée pour les transactions
CREATE SEQUENCE IF NOT EXISTS transactions_numero_ordre_seq START 1;

-- 2. Fonction pour obtenir le prochain numéro d'ordre
CREATE OR REPLACE FUNCTION get_next_numero_ordre()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('transactions_numero_ordre_seq');
END;
$$ LANGUAGE plpgsql;

-- 3. Modifier les tables pour utiliser la nouvelle séquence
-- Note: On garde les anciennes séquences pour la compatibilité, mais on va basculer progressivement

-- Optionnel: Synchroniser la séquence avec le max des numéros existants
DO $$
DECLARE
  max_recette INTEGER;
  max_depense INTEGER;
  max_numero INTEGER;
BEGIN
  -- Trouver le numéro maximum dans recettes
  SELECT COALESCE(MAX(numero_bon), 0) INTO max_recette FROM recettes;
  
  -- Trouver le numéro maximum dans depenses
  SELECT COALESCE(MAX(numero_bon), 0) INTO max_depense FROM depenses;
  
  -- Prendre le maximum des deux
  max_numero := GREATEST(max_recette, max_depense);
  
  -- Ajuster la séquence pour commencer après le maximum existant
  IF max_numero > 0 THEN
    PERFORM setval('transactions_numero_ordre_seq', max_numero);
  END IF;
END $$;

-- 4. Créer des triggers pour auto-incrémenter le numero_bon avec la séquence unifiée
-- Pour les nouvelles recettes
CREATE OR REPLACE FUNCTION set_recette_numero_ordre()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_bon IS NULL THEN
    NEW.numero_bon := get_next_numero_ordre();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recettes_set_numero_ordre ON recettes;
CREATE TRIGGER recettes_set_numero_ordre
  BEFORE INSERT ON recettes
  FOR EACH ROW
  EXECUTE FUNCTION set_recette_numero_ordre();

-- Pour les nouvelles dépenses
CREATE OR REPLACE FUNCTION set_depense_numero_ordre()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_bon IS NULL THEN
    NEW.numero_bon := get_next_numero_ordre();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS depenses_set_numero_ordre ON depenses;
CREATE TRIGGER depenses_set_numero_ordre
  BEFORE INSERT ON depenses
  FOR EACH ROW
  EXECUTE FUNCTION set_depense_numero_ordre();

-- 5. Modifier les valeurs par défaut pour utiliser la nouvelle séquence
ALTER TABLE recettes ALTER COLUMN numero_bon DROP DEFAULT;
ALTER TABLE depenses ALTER COLUMN numero_bon DROP DEFAULT;

ALTER TABLE recettes ALTER COLUMN numero_bon SET DEFAULT get_next_numero_ordre();
ALTER TABLE depenses ALTER COLUMN numero_bon SET DEFAULT get_next_numero_ordre();

-- Commentaires pour documentation
COMMENT ON SEQUENCE transactions_numero_ordre_seq IS 'Séquence unifiée pour le numéro d''ordre (N°d''ord) des recettes et dépenses dans la Feuille de Caisse';
COMMENT ON FUNCTION get_next_numero_ordre() IS 'Retourne le prochain numéro d''ordre séquentiel pour les transactions';
