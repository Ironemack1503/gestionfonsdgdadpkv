# Guide de Déploiement sur une Nouvelle Machine

## 📋 Prérequis à Installer

### 1. Git
- **Télécharger** : https://git-scm.com/download/win
- **Installation** : Suivre l'assistant, garder les options par défaut
- **Vérifier** : Ouvrir un terminal et taper `git --version`

### 2. Bun (Runtime JavaScript rapide)
- **Télécharger** : https://bun.sh/
- **Installation Windows** :
  ```powershell
  powershell -c "irm bun.sh/install.ps1|iex"
  ```
- **Vérifier** : `bun --version`

**Alternative : Node.js**
- Si Bun ne fonctionne pas : https://nodejs.org/
- Choisir la version LTS
- **Vérifier** : `node --version` et `npm --version`

### 3. VS Code (Recommandé)
- **Télécharger** : https://code.visualstudio.com/
- **Extensions utiles** :
  - GitHub Copilot
  - ES7+ React Snippets
  - Tailwind CSS IntelliSense
  - SQLTools

### 4. PostgreSQL (pour Supabase local)
- **Télécharger** : https://www.postgresql.org/download/windows/
- Ou utiliser le script : `scripts/reinstall-postgresql.ps1`

---

## 🚀 Étapes de Déploiement

### Étape 1 : Cloner le Projet

```powershell
# Ouvrir PowerShell et naviguer vers votre dossier de projets
cd C:\Users\VotreNom\Documents

# Cloner le dépôt depuis GitHub
git clone https://github.com/Ironemack1503/gestionfonsdgdadpkv.git

# Entrer dans le dossier du projet
cd gestionfonsdgdadpkv
```

### Étape 2 : Installer les Dépendances

```powershell
# Avec Bun (recommandé - plus rapide)
bun install

# OU avec npm (si Bun non disponible)
npm install
```

Cette commande va télécharger tous les packages nécessaires (React, Vite, Supabase, etc.)

### Étape 3 : Configuration de l'Environnement

#### A. Créer le fichier .env

Créez un fichier `.env` à la racine du projet :

```powershell
# Créer le fichier
New-Item -Path ".env" -ItemType File
```

#### B. Ajouter les variables d'environnement

Ouvrez `.env` et ajoutez :

```env
# Supabase Cloud (Production)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme

# Supabase Local (Développement)
VITE_LOCAL_SUPABASE_URL=http://localhost:54321
VITE_LOCAL_SUPABASE_ANON_KEY=votre_cle_locale

# Mode (local ou cloud)
VITE_USE_LOCAL_SUPABASE=true
```

**🔑 Où trouver vos clés Supabase :**
- Cloud : https://app.supabase.com → Votre projet → Settings → API
- Local : Après démarrage de Supabase local (voir Étape 4)

### Étape 4 : Configuration de Supabase

#### Option A : Supabase Cloud (Recommandé pour démarrer)

1. Aller sur https://app.supabase.com
2. Créer un compte ou se connecter
3. Créer un nouveau projet
4. Copier l'URL et la clé anonyme dans `.env`
5. Exécuter les migrations :

```powershell
# Dans le dossier gestionfondsdgdadpkv-main/supabase/migrations
# Copier le contenu des fichiers .sql et les exécuter dans l'éditeur SQL Supabase
```

#### Option B : Supabase Local (Développement avancé)

```powershell
# Installer Supabase CLI
npm install -g supabase

# Démarrer Supabase en local
cd gestionfondsdgdadpkv-main
supabase start

# Appliquer les migrations
supabase db reset

# Voir les URLs et clés
supabase status
```

### Étape 5 : Lancer l'Application

```powershell
# Avec Bun
bun run dev

# OU avec npm
npm run dev
```

L'application sera disponible sur : **http://localhost:5173**

---

## 🔄 Synchronisation entre Machines

### Sur la Machine d'Origine (Machine 1)

Après avoir fait des modifications :

```powershell
# Voir les fichiers modifiés
git status

# Ajouter tous les fichiers modifiés
git add .

# Créer un commit avec un message descriptif
git commit -m "Description de vos modifications"

# Envoyer vers GitHub
git push
```

### Sur la Nouvelle Machine (Machine 2)

Pour récupérer les dernières modifications :

```powershell
# Se placer dans le dossier du projet
cd C:\Users\VotreNom\Documents\gestionfonsdgdadpkv

# Récupérer les changements
git pull

# Réinstaller les dépendances si package.json a changé
bun install
# ou
npm install

# Relancer l'application
bun run dev
```

---

## 🛠️ Commandes Git Essentielles

```powershell
# Voir l'état actuel
git status

# Voir l'historique des commits
git log --oneline

# Créer une nouvelle branche
git checkout -b nom-de-la-branche

# Changer de branche
git checkout main

# Fusionner une branche
git merge nom-de-la-branche

# Voir les branches
git branch

# Annuler les modifications non commités
git restore .

# Voir les différences
git diff
```

---

## 📦 Scripts Utiles Disponibles

Dans le dossier `scripts/`, plusieurs scripts PowerShell sont disponibles :

```powershell
# Configuration simple de production locale
.\scripts\setup-simple.ps1

# Configuration complète avec PostgreSQL
.\scripts\setup-production-local.ps1

# Créer une sauvegarde de la base de données
.\scripts\backup-database.ps1

# Tester le déploiement
.\scripts\test-deployment-simple.ps1

# Monitorer le serveur
.\scripts\monitor-server.ps1
```

---

## 🐛 Résolution de Problèmes Courants

### Erreur : "bun: command not found"
```powershell
# Réinstaller Bun
powershell -c "irm bun.sh/install.ps1|iex"

# Ou utiliser npm à la place
npm install
npm run dev
```

### Erreur : "Port 5173 already in use"
```powershell
# Tuer le processus sur le port 5173
netstat -ano | findstr :5173
taskkill /PID <numéro_du_PID> /F
```

### Erreur : "Cannot connect to Supabase"
- Vérifier que les clés dans `.env` sont correctes
- Vérifier que Supabase local est démarré (`supabase status`)
- Vérifier l'URL (http://localhost:54321 pour local)

### Erreur : "Module not found"
```powershell
# Supprimer node_modules et réinstaller
Remove-Item -Recurse -Force node_modules
bun install
```

---

## 📝 Workflow Recommandé

### Développement Quotidien

1. **Matin** : Récupérer les dernières modifications
   ```powershell
   git pull
   bun install
   ```

2. **Pendant le dev** : Tester localement
   ```powershell
   bun run dev
   ```

3. **Soir** : Sauvegarder votre travail
   ```powershell
   git add .
   git commit -m "Description du travail effectué"
   git push
   ```

### Avant de Modifier du Code

```powershell
# Toujours partir de la dernière version
git pull

# Créer une branche pour votre fonctionnalité
git checkout -b feature/ma-nouvelle-fonctionnalite

# Travailler sur votre branche
# ... modifications ...

# Commiter régulièrement
git add .
git commit -m "Ajout de la fonctionnalité X"

# Pousser votre branche
git push -u origin feature/ma-nouvelle-fonctionnalite
```

---

## 🔐 Sécurité

### Fichiers à NE JAMAIS Commiter

Le fichier `.gitignore` protège déjà ces fichiers :
- `.env` (contient vos clés secrètes)
- `node_modules/` (trop volumineux)
- `dist/` (code compilé)
- Fichiers de base de données locales

### Bonnes Pratiques

- ✅ Ne jamais partager vos clés API publiquement
- ✅ Utiliser des clés différentes pour dev et production
- ✅ Faire des commits réguliers avec des messages clairs
- ✅ Tester avant de pousser vers GitHub
- ✅ Faire des sauvegardes régulières de la base de données

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifier ce guide de résolution de problèmes
2. Consulter les autres guides :
   - `QUICK-START.md` : Démarrage rapide
   - `GUIDE-DEPLOIEMENT-LOCAL.md` : Déploiement local détaillé
   - `INSTALLATION-ETAPES.md` : Étapes d'installation complètes
3. Vérifier les logs d'erreur dans la console
4. Consulter la documentation Supabase : https://supabase.com/docs

---

## ✅ Checklist de Démarrage

- [ ] Git installé et configuré
- [ ] Bun ou Node.js installé
- [ ] Projet cloné depuis GitHub
- [ ] Dépendances installées (`bun install`)
- [ ] Fichier `.env` créé et configuré
- [ ] Supabase configuré (cloud ou local)
- [ ] Application démarre sans erreur (`bun run dev`)
- [ ] Accès à http://localhost:5173

---

**🎉 Vous êtes prêt à développer !**

Pour toute question, consultez les autres guides dans le dossier racine du projet.
