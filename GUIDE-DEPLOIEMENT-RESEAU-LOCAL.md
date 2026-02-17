# Guide de Déploiement Réseau Local avec Accès Hors Ligne

## 📋 Vue d'ensemble

Ce guide vous permet de déployer l'application **Gestion de Fonds DGDAD PKV** sur votre réseau local pour permettre l'accès depuis plusieurs machines sans nécessiter une connexion Internet.

## 🎯 Architecture

```
Serveur (Machine Principale)
├── Application React (Port 5173 ou 80)
├── PostgreSQL (Port 5432)  
└── Supabase Local (Port 54321)

Clients (Machines du réseau)
└── Navigateur Web → http://IP-SERVEUR:5173
```

## 📦 Prérequis

### Sur la Machine Serveur

1. **Système d'exploitation** : Windows 10/11
2. **RAM** : Minimum 4 GB (8 GB recommandé)
3. **Espace disque** : 5 GB minimum
4. **Logiciels** :
   - Git
   - Node.js (v18+) ou Bun
   - PostgreSQL 15+
   - Supabase CLI (optionnel, pour mode avancé)

### Sur les Machines Clientes

- Navigateur web moderne (Chrome, Firefox, Edge)
- Connexion au même réseau local que le serveur

## 🚀 Étape 1 : Configuration du Serveur

### 1.1 Installation des prérequis

```powershell
# Vérifier les installations
git --version
node --version  # ou bun --version
psql --version
```

### 1.2 Cloner et configurer le projet

```powershell
# Cloner depuis GitHub
git clone https://github.com/Ironemack1503/gestionfonsdgdadpkv.git
cd gestionfonsdgdadpkv

# Installer les dépendances
npm install
# ou avec Bun (plus rapide)
bun install
```

### 1.3 Configuration de la base de données

#### Option A : PostgreSQL Local (Recommandé pour hors ligne)

```powershell
# Créer la base de données
psql -U postgres
CREATE DATABASE gestion_fonds;
\q

# Appliquer les migrations
cd gestionfondsdgdadpkv-main/supabase/migrations
psql -U postgres -d gestion_fonds -f 20240101000000_initial_schema.sql
```

#### Option B : Supabase Local

```powershell
# Installer Supabase CLI
npm install -g supabase

# Démarrer Supabase
cd gestionfondsdgdadpkv-main
supabase start

# Noter l'URL et la clé API affichées
```

### 1.4 Configuration de l'environnement

Créez le fichier `.env` dans `gestionfondsdgdadpkv-main/` :

```env
# Mode local
VITE_USE_LOCAL_SUPABASE=true

# PostgreSQL Direct (Option A)
VITE_DATABASE_URL=postgresql://postgres:votre_password@localhost:5432/gestion_fonds

# Ou Supabase Local (Option B)
VITE_LOCAL_SUPABASE_URL=http://127.0.0.1:54321
VITE_LOCAL_SUPABASE_ANON_KEY=votre_cle_locale_anon

# Configuration réseau
VITE_HOST=0.0.0.0
VITE_PORT=5173
```

### 1.5 Obtenir l'adresse IP du serveur

```powershell
# Windows
ipconfig

# Chercher "Adresse IPv4" (ex: 192.168.1.100)
```

Notez cette adresse IP, vous en aurez besoin pour les clients.

## 🌐 Étape 2 : Démarrer le serveur

### 2.1 Lancer l'application

```powershell
cd gestionfondsdgdadpkv-main

# Avec npm
npm run dev -- --host 0.0.0.0 --port 5173

# Ou avec Bun
bun run dev --host 0.0.0.0 --port 5173
```

L'application sera accessible sur :
- **Serveur local** : `http://localhost:5173`
- **Réseau** : `http://192.168.1.100:5173` (remplacez par votre IP)

### 2.2 Configuration du pare-feu Windows

```powershell
# Autoriser le port 5173
New-NetFirewallRule -DisplayName "Gestion Fonds - Port 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Autoriser PostgreSQL si nécessaire
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
```

## 💻 Étape 3 : Accès depuis les Clients

### 3.1 Configuration DNS local (Optionnel)

Pour faciliter l'accès, vous pouvez créer un nom de domaine local.

Sur **chaque machine cliente**, éditez le fichier hosts :

**Windows** : `C:\Windows\System32\drivers\etc\hosts`

Ajoutez la ligne :
```
192.168.1.100   gestion-fonds.local
```

Maintenant vous pouvez accéder via : `http://gestion-fonds.local:5173`

### 3.2 Accès direct par IP

Sur n'importe quelle machine du réseau, ouvrez un navigateur et allez à :

```
http://192.168.1.100:5173
```

Remplacez `192.168.1.100` par l'IP de votre serveur.

## 🔒 Étape 4 : Configuration pour Production (Port 80)

Pour un accès sans avoir à spécifier le port, utilisez Nginx ou configurez le port 80.

### Option A : Avec Nginx (Recommandé)

```powershell
# Installer Nginx pour Windows
# Télécharger depuis https://nginx.org/en/download.html

# Configuration nginx.conf
server {
    listen 80;
    server_name 192.168.1.100 gestion-fonds.local;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Démarrer Nginx
nginx.exe
```

Accès maintenant possible via : `http://192.168.1.100` ou `http://gestion-fonds.local`

### Option B : Build et serveur de production

```powershell
# Build l'application
cd gestionfondsdgdadpkv-main
npm run build

# Servir les fichiers statiques avec un serveur simple
npx serve -s dist -l 80

# Ou utiliser http-server
npm install -g http-server
http-server dist -p 80
```

## 🔧 Étape 5 : Configuration Hors Ligne

### 5.1 Mode 100% Hors Ligne

Pour fonctionner sans Internet :

1. **Base de données locale** : PostgreSQL installé localement ✅
2. **Authentification locale** : L'application utilise `LocalAuthContext` ✅
3. **Aucune dépendance cloud** : Pas d'appels API externes ✅

### 5.2 Vérification du mode hors ligne

Dans le fichier `.env` :

```env
VITE_USE_LOCAL_SUPABASE=true
VITE_OFFLINE_MODE=true
```

### 5.3 Initialisation du compte admin

Au premier démarrage, créez le compte administrateur :

```sql
-- Exécuter dans PostgreSQL
INSERT INTO users (email, encrypted_password, role, full_name)
VALUES (
  'admin@local.com',
  '$2a$10$...',  -- Hash bcrypt du mot de passe
  'admin',
  'Administrateur'
);
```

Ou utilisez le script fourni :

```powershell
cd gestionfondsdgdadpkv-main
node scripts/create-admin.js
```

## 📊 Fonctionnalités du Rapport Officiel

### Accès au rapport de programmation officiel

1. Connectez-vous à l'application
2. Allez dans **Rapports** → **Programmation des Dépenses**
3. Cliquez sur **"Rapport Officiel"**
4. Configurez :
   - Mois et année
   - Référence du document
   - Signataires
   - Date et lieu
5. Cliquez sur **"Imprimer"** pour générer le PDF

### Format du rapport

Le rapport généré respecte le format officiel :
- ✅ En-tête avec logo de la RDC
- ✅ Informations du ministère
- ✅ Tableau des dépenses programmées
- ✅ Total en chiffres et en lettres
- ✅ Signatures des responsables
- ✅ Pied de page avec coordonnées

## 🛠️ Maintenance et Dépannage

### Problèmes courants

#### 1. Impossible d'accéder depuis une autre machine

```powershell
# Vérifier que le serveur écoute sur 0.0.0.0
netstat -an | findstr :5173

# Vérifier le pare-feu
Get-NetFirewallRule -DisplayName "*Gestion*"
```

#### 2. Erreur "Connection refused"

- Vérifiez que le serveur est démarré
- Vérifiez l'IP du serveur avec `ipconfig`
- Testez avec `ping 192.168.1.100` depuis le client

#### 3. Base de données inaccessible

```powershell
# Redémarrer PostgreSQL
Restart-Service postgresql-x64-15

# Vérifier l'état
Get-Service postgresql*
```

## 🔄 Scripts de Démarrage Automatique

### Créer un script de démarrage

Créez `start-server.ps1` :

```powershell
# start-server.ps1
$ErrorActionPreference = "Stop"

Write-Host "Démarrage du serveur Gestion Fonds..." -ForegroundColor Green

# Démarrer PostgreSQL
Start-Service postgresql-x64-15

# Attendre que PostgreSQL soit prêt  
Start-Sleep -Seconds 3

# Démarrer l'application
cd C:\chemin\vers\gestionfonsdgdadpkv\gestionfondsdgdadpkv-main
npm run dev -- --host 0.0.0.0 --port 5173
```

### Créer une tâche planifiée (démarrage automatique)

```powershell
# Créer une tâche qui démarre au démarrage de Windows
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\chemin\vers\start-server.ps1"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "GestionFondsServer" -Action $action -Trigger $trigger -Principal $principal -Description "Démarre automatiquement le serveur Gestion Fonds"
```

## 📱 Accès Mobile

Les appareils mobiles (téléphones, tablettes) connectés au même réseau WiFi peuvent également accéder à l'application :

```
http://192.168.1.100:5173
```

L'interface est responsive et s'adapte aux écrans mobiles.

## 🔐 Sécurité

### Recommandations pour un réseau local

1. **Pare-feu** : N'ouvrez que les ports nécessaires
2. **Mots de passe forts** : Pour PostgreSQL et les comptes admin
3. **Sauvegardes** : Sauvegardez régulièrement la base de données
4. **Accès limité** : Utilisez des rôles utilisateur appropriés

### Script de sauvegarde automatique

```powershell
# backup.ps1
$date = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backup_path = "C:\Backups\gestion_fonds_$date.sql"

pg_dump -U postgres -d gestion_fonds -f $backup_path

Write-Host "Sauvegarde créée : $backup_path"
```

Planifiez cette tâche quotidiennement avec le Planificateur de tâches Windows.

## 📚 Ressources Complémentaires

- **Guide d'installation** : `INSTALLATION-ETAPES.md`
- **Déploiement local** : `GUIDE-DEPLOIEMENT-LOCAL.md`
- **Nouvelle machine** : `GUIDE-DEPLOIEMENT-NOUVELLE-MACHINE.md`
- **Maintenance hors ligne** : `MAINTENANCE-OFFLINE.md`

## ✅ Checklist de Déploiement

- [ ] Serveur configuré avec IP statique
- [ ] PostgreSQL installé et configuré
- [ ] Application clonée et dépendances installées
- [ ] Fichier `.env` configuré
- [ ] Migrations de base de données appliquées
- [ ] Pare-feu configuré
- [ ] Serveur démarre sur 0.0.0.0
- [ ] Accès testé depuis une autre machine
- [ ] Compte administrateur créé
- [ ] Sauvegarde automatique configurée
- [ ] Script de démarrage automatique (optionnel)

## 🆘 Support

En cas de problème :
1. Consultez les logs de l'application
2. Vérifiez les logs PostgreSQL : `C:\Program Files\PostgreSQL\15\data\log`
3. Testez la connectivité réseau
4. Vérifiez les permissions dans la base de données

---

**🎉 Votre application est maintenant accessible sur tout votre réseau local, même sans Internet !**

Pour toute question, consultez les autres guides dans le dossier racine du projet.
