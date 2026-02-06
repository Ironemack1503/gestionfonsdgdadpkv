# Réorganisation du Formulaire des Rubriques

## Modifications apportées

### 1. Réorganisation du formulaire (RubriquesPage.tsx)

Le formulaire de création/modification des rubriques a été réorganisé selon la nouvelle structure :

#### Ordre des champs :
1. **Code IMP (6 chiffres)** * - Champ obligatoire
   - Validation stricte : exactement 6 chiffres numériques
   - Peut être utilisé plusieurs fois avec des désignations différentes
   - Auto-génération du code interne si non renseigné : `RUB-{Code IMP}`

2. **Désignations** * - Champ obligatoire
   - Nom de la rubrique
   - Doit être unique pour un même Code IMP

3. **Types** * - Champ obligatoire
   - Recettes ou Dépenses
   - Valeur par défaut : Recettes

4. **Champs supplémentaires** (optionnels)
   - Code interne : Code personnalisé (auto-généré si vide)
   - N° BEO : Numéro de bon d'engagement

### 2. Validation du formulaire

- **Code IMP** : Validation stricte à 6 chiffres (pattern: `\d{6}`)
- **Unicité** : Vérification que la combinaison (Code IMP + Désignation) est unique
- Messages d'erreur clairs en cas de validation échouée

### 3. Rubrique spéciale "Solde du mois (antérieur)"

#### Création automatique (useSoldeMoisAnterieurs.ts)
- Nouvelle rubrique créée automatiquement au début de chaque mois
- Format du libellé : `"Solde du mois (antérieur) - {Mois Année}"`
- Code IMP spécial : `000000`
- Code interne : `SOLDE-ANT`
- Type : Recette

#### Protection contre modification/suppression
- Impossible de modifier la rubrique spéciale
- Impossible de supprimer la rubrique spéciale
- Messages d'erreur explicites si tentative

#### Affichage visuel distinctif
- Icône en couleur jaune
- Badge "Auto" pour indiquer la création automatique
- Texte en gras avec couleur jaune

### 4. Tri des rubriques (rubriquesSortUtils.ts)

Nouvelles fonctions utilitaires pour garantir l'ordre d'affichage :

```typescript
// Vérifie si une rubrique est "Solde du mois (antérieur)"
isSoldeMoisAnterieurs(rubrique)

// Trie les rubriques en plaçant le solde en premier
sortRubriquesWithSoldeFirst(rubriques)

// Trie les opérations en plaçant le solde en premier
sortOperationsWithSoldeFirst(operations)
```

#### Application du tri :
- **RubriquesPage** : Liste des rubriques triée
- **SommaireReportPage** : Synthèse des rubriques triée
- Garantit que "Solde du mois (antérieur)" apparaît toujours en première ligne

### 5. Restrictions administrateur

#### Contrôles renforcés :
- Seuls les administrateurs peuvent créer des rubriques
- Seuls les administrateurs peuvent modifier des rubriques
- Seuls les administrateurs peuvent supprimer des rubriques
- Message d'information pour les utilisateurs non-admin

#### Vérification de rôle :
- Utilisation de `useLocalUserRole()` hook
- Boutons conditionnellement affichés/masqués selon le rôle

## Fichiers modifiés

1. **src/pages/RubriquesPage.tsx**
   - Réorganisation du formulaire
   - Ajout de la validation Code IMP
   - Intégration du hook `useSoldeMoisAnterieurs`
   - Protection de la rubrique spéciale
   - Message pour utilisateurs non-admin

2. **src/hooks/useSoldeMoisAnterieurs.ts** (NOUVEAU)
   - Hook pour gérer la création automatique
   - Vérification mensuelle de l'existence de la rubrique
   - Création automatique si absente
   - Génération du libellé avec la date

3. **src/lib/rubriquesSortUtils.ts** (NOUVEAU)
   - Fonctions utilitaires de tri
   - Détection de la rubrique spéciale
   - Tri prioritaire pour "Solde du mois (antérieur)"

4. **src/pages/reports/SommaireReportPage.tsx**
   - Import de `sortRubriquesWithSoldeFirst`
   - Application du tri dans la synthèse

## Utilisation

### Pour les administrateurs :

1. **Créer une rubrique standard :**
   - Code IMP : 6 chiffres (ex: 123456)
   - Désignations : Nom descriptif (ex: "Fournitures de bureau")
   - Types : Recettes ou Dépenses

2. **Réutiliser un Code IMP :**
   - Possible si la désignation est différente
   - Exemple : 123456 avec "Fournitures de bureau" et "Fournitures informatiques"

3. **Rubrique "Solde du mois (antérieur)" :**
   - Créée automatiquement chaque mois
   - Apparaît en première position dans les listes
   - Ne peut pas être modifiée ou supprimée

### Pour les utilisateurs non-admin :

- Consultation seule des rubriques
- Pas d'accès aux boutons de création/modification/suppression
- Message d'information visible sur la page

## Notes techniques

- La rubrique spéciale utilise le Code IMP `000000` (réservé)
- Le code interne `SOLDE-ANT` est également réservé
- Le tri est appliqué automatiquement dans tous les rapports
- La validation du formulaire empêche les doublons (Code IMP + Désignation)
- Hot Module Replacement (HMR) fonctionne correctement avec ces modifications

## Tests recommandés

1. ✅ Créer une rubrique avec un Code IMP à 6 chiffres
2. ✅ Tenter de créer une rubrique avec un Code IMP invalide (< 6 ou > 6 chiffres)
3. ✅ Créer deux rubriques avec le même Code IMP mais des désignations différentes
4. ✅ Tenter de créer deux rubriques avec le même Code IMP et la même désignation
5. ✅ Vérifier la création automatique de "Solde du mois (antérieur)"
6. ✅ Tenter de modifier la rubrique "Solde du mois (antérieur)"
7. ✅ Tenter de supprimer la rubrique "Solde du mois (antérieur)"
8. ✅ Vérifier que la rubrique spéciale apparaît en premier dans la liste
9. ✅ Vérifier que les utilisateurs non-admin ne peuvent pas créer de rubriques
10. ✅ Vérifier le tri dans le rapport Sommaire

## Dépendances

Aucune nouvelle dépendance externe ajoutée. Toutes les modifications utilisent les bibliothèques existantes du projet.
