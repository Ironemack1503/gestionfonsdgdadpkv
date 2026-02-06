# ✅ Configuration SQLTools terminée - Guide d'utilisation

## 🔌 Connexion active
Votre connexion **"Supabase Local"** est maintenant configurée.

## 📍 Comment se connecter (si pas encore connecté)

### Méthode 1 : Via la barre latérale
1. Cliquez sur l'icône **SQLTools** dans la barre latérale gauche (icône de base de données)
2. Vous verrez "Supabase Local" dans la liste
3. Cliquez sur l'icône **plug** (⚡) à côté de "Supabase Local"
4. La connexion s'établit → vous verrez l'arborescence des tables

### Méthode 2 : Via la palette de commandes
1. Appuyez sur `Ctrl+Shift+P`
2. Tapez : `SQLTools: Connect`
3. Sélectionnez **"Supabase Local"**

---

## 🎯 Exécuter vos premières requêtes

### Fichiers de test créés :
1. **test-connection.sql** - Tests complets
2. **quick-test.sql** - Test rapide

### Comment exécuter une requête :

1. **Ouvrez un fichier .sql** (test-connection.sql ou quick-test.sql)
2. **Placez le curseur** sur la requête à exécuter (ou sélectionnez-la)
3. **Exécutez** avec une de ces méthodes :
   - ⌨️ **Raccourci** : `Ctrl+E Ctrl+E` (appuyez 2 fois)
   - 🖱️ **Clic droit** → "Run on active connection"
   - 📋 **Palette** : `Ctrl+Shift+P` → "SQLTools: Run"

### Exemple de test rapide :
```sql
SELECT 
  current_database() as database_name,
  current_user as user,
  now() as current_time;
```

---

## 🔍 Explorer la base de données

### Dans la vue SQLTools (barre latérale) :

```
📁 Supabase Local (connecté ✓)
  📁 postgres
    📁 Schemas
      📁 public
        📁 Tables
          📄 rubriques
          📄 recettes
          📄 depenses
          📄 services
          📄 user_roles
          📄 categories
          📄 signataires
          📄 ...
```

### Actions sur les tables :
- **Clic droit sur une table** → Menu contextuel :
  - 📊 **Show Table Records** - Voir les données
  - 📋 **Describe Table** - Structure de la table
  - 📝 **Generate INSERT Query** - Générer INSERT
  - 🔍 **Add Name to Cursor** - Ajouter le nom au curseur

---

## 🚀 Raccourcis clavier utiles

| Action | Raccourci |
|--------|-----------|
| Exécuter la requête | `Ctrl+E Ctrl+E` |
| Exécuter tout le fichier | `Ctrl+E Ctrl+A` |
| Historique des requêtes | `Ctrl+E Ctrl+H` |
| Nouveau fichier SQL | `Ctrl+E Ctrl+N` |
| Liste des connexions | `Ctrl+E Ctrl+C` |
| Bookmarks | `Ctrl+E Ctrl+B` |

---

## 📊 Requêtes utiles pour commencer

### Voir toutes les tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Compter les enregistrements
```sql
SELECT 
  (SELECT COUNT(*) FROM rubriques) as rubriques,
  (SELECT COUNT(*) FROM recettes) as recettes,
  (SELECT COUNT(*) FROM depenses) as depenses,
  (SELECT COUNT(*) FROM user_roles) as utilisateurs;
```

### Voir les utilisateurs
```sql
SELECT username, full_name, role, is_active, last_login_at
FROM user_roles
ORDER BY created_at DESC;
```

---

## ✅ Vérification de connexion

Si vous voyez l'arborescence des tables dans la barre latérale SQLTools, **c'est bon** ! ✓

Si vous avez une erreur de connexion :
1. Vérifiez que Docker Desktop est lancé
2. Vérifiez que le conteneur `supabase_db_*` est actif : `docker ps`
3. Rechargez VS Code : `Ctrl+Shift+P` → "Developer: Reload Window"

---

## 🎉 C'est prêt !

Votre base de données PostgreSQL locale est maintenant accessible directement dans VS Code via SQLTools.

**Prochaines étapes :**
- Explorez vos tables
- Exécutez des requêtes
- Modifiez vos données
- Exportez des résultats

Bon développement ! 🚀
