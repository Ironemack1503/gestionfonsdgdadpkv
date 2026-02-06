# 📂 Scripts de Déploiement et Maintenance

Ce dossier contient tous les scripts nécessaires pour déployer et maintenir l'application Gestion Fonds DGDADPKV sur un réseau local.

## 📋 Liste des Scripts

### 🚀 Déploiement

#### `setup-production-local.ps1`
**Setup automatique complet du serveur**

```powershell
# Exécution simple (mode interactif)
.\setup-production-local.ps1

# Avec paramètres
.\setup-production-local.ps1 -ServerIP "192.168.1.100" -DBPassword "MonMotDePasse123"
```

**Fonctionnalités:**
- Vérification des prérequis (PostgreSQL, Node.js)
- Configuration du pare-feu Windows
- Création de la base de données
- Application des migrations SQL
- Installation des dépendances npm/bun
- Build de production
- Génération du fichier `.env.production.local`

**Prérequis:** Droits administrateur Windows

---

### 💾 Sauvegardes

#### `backup-database.ps1`
**Sauvegarde complète de la base de données**

```powershell
# Sauvegarde simple (interactif)
.\backup-database.ps1

# Sauvegarde avec tous les paramètres
.\backup-database.ps1 `
    -DBName "gestion_fonds_dgdadpkv" `
    -DBUser "postgres" `
    -DBPassword "MonMotDePasse" `
    -BackupPath "C:\Backups\GestionFonds" `
    -RetentionDays 30 `
    -NASPath "\\192.168.1.250\Backups"
```

**Fonctionnalités:**
- Sauvegarde au format `.backup` (compressé, format custom PostgreSQL)
- Sauvegarde au format `.sql.gz` (texte SQL compressé)
- Copie automatique vers un NAS (optionnel)
- Nettoyage des sauvegardes anciennes
- Logs détaillés

**Formats de sortie:**
- `gestion_fonds_dgdadpkv_20260206_143022.backup` (pg_dump custom format)
- `gestion_fonds_dgdadpkv_20260206_143022.sql.gz` (SQL compressé)
- `backup.log` (historique des sauvegardes)

---

#### `setup-backup-task.ps1`
**Configuration de la sauvegarde automatique quotidienne**

```powershell
# Configuration interactive
.\setup-backup-task.ps1

# Avec heure personnalisée
.\setup-backup-task.ps1 -BackupTime "03:00"
```

**Fonctionnalités:**
- Création d'une tâche planifiée Windows
- Exécution quotidienne automatique
- Configuration du mot de passe (crypté dans la tâche)
- Test immédiat de la sauvegarde
- Gestion de la rétention et copie NAS

**Prérequis:** Droits administrateur Windows

---

### 📊 Monitoring

#### `monitor-server.ps1`
**Surveillance en temps réel du serveur**

```powershell
# Monitoring simple
.\monitor-server.ps1

# Avec stats DB (nécessite mot de passe)
.\monitor-server.ps1 -DBPassword "MonMotDePasse"

# Rafraîchissement personnalisé
.\monitor-server.ps1 -RefreshInterval 10 -DBPassword "MonMotDePasse"
```

**Affichage:**
- 💻 CPU, RAM, Disque (utilisation en %)
- 🌐 IP du serveur et carte réseau
- 🔧 État des services (PostgreSQL, Nginx, Node.js)
- 🗄️ Statistiques base de données:
  - Nombre de connexions actives
  - Taille de la base
  - Nombre de requêtes en cours
- 📈 Activité web (dernières 60 secondes)

**Utilisation typique:** Laisser tourner dans une fenêtre PowerShell pour surveiller le serveur

---

### ⚙️ Configuration

#### `nginx.conf`
**Configuration Nginx optimisée pour réseau local**

```powershell
# Copier vers Nginx
Copy-Item .\nginx.conf C:\nginx\conf\nginx.conf -Force

# Tester la configuration
cd C:\nginx
.\nginx.exe -t

# Recharger Nginx
.\nginx.exe -s reload
```

**Caractéristiques:**
- Configuration pour serveur Windows
- Compression gzip activée
- Cache intelligents des assets statiques
- Proxy vers Supabase API (port 54321)
- Support WebSocket pour temps réel
- Routing SPA (React Router)
- Logs d'accès et d'erreurs
- Page de santé `/health`

**À personnaliser:**
- `root` → Chemin vers votre dossier `dist`
- `server_name` → IP ou nom de domaine du serveur

---

## 🔄 Workflows Typiques

### Premier Déploiement

```powershell
# 1. Setup complet (ADMINISTRATEUR)
.\scripts\setup-production-local.ps1

# 2. Copier la config Nginx
Copy-Item .\scripts\nginx.conf C:\nginx\conf\nginx.conf

# 3. Démarrer Nginx
cd C:\nginx
start nginx

# 4. Démarrer Supabase
supabase start

# 5. Configurer les sauvegardes (ADMINISTRATEUR)
.\scripts\setup-backup-task.ps1

# 6. Lancer le monitoring
.\scripts\monitor-server.ps1
```

---

### Sauvegarde Manuelle

```powershell
# Sauvegarde interactive
.\scripts\backup-database.ps1

# Sauvegarde scriptée (ex: avant une mise à jour)
.\scripts\backup-database.ps1 `
    -DBPassword $env:DB_PASSWORD `
    -BackupPath "C:\Backups\BeforeMigration" `
    -RetentionDays 90
```

---

### Restauration d'une Sauvegarde

```powershell
# 1. Arrêter les services
cd C:\nginx
.\nginx.exe -s stop
supabase stop

# 2. Restaurer depuis un backup custom format
$env:PGPASSWORD = "MonMotDePasse"
pg_restore -U postgres -d gestion_fonds_dgdadpkv -c "C:\Backups\GestionFonds\gestion_fonds_dgdadpkv_20260206_143022.backup"

# OU depuis un fichier SQL
gunzip -c "C:\Backups\GestionFonds\gestion_fonds_dgdadpkv_20260206_143022.sql.gz" | psql -U postgres -d gestion_fonds_dgdadpkv

# 3. Redémarrer
cd C:\nginx
start nginx
supabase start
```

---

### Mise à Jour de l'Application

```powershell
# 1. Backup de sécurité
.\scripts\backup-database.ps1

# 2. Arrêter les services
cd C:\nginx
.\nginx.exe -s stop

# 3. Mettre à jour le code
git pull  # ou copier les nouveaux fichiers
npm install

# 4. Appliquer nouvelles migrations
supabase db push

# 5. Rebuild
npm run build

# 6. Redémarrer
start nginx
supabase start

# 7. Vérifier le monitoring
.\scripts\monitor-server.ps1
```

---

## 🛠️ Personnalisation

### Modifier les Chemins par Défaut

**Dans `setup-production-local.ps1`:**
```powershell
param(
    [string]$ServerIP = "192.168.1.100",  # ← Votre IP
    [string]$DBName = "gestion_fonds_dgdadpkv"  # ← Votre nom de DB
)
```

**Dans `backup-database.ps1`:**
```powershell
param(
    [string]$BackupPath = "D:\Backups",  # ← Votre chemin de sauvegarde
    [int]$RetentionDays = 60  # ← Votre rétention
)
```

**Dans `nginx.conf`:**
```nginx
# Ligne 82
root   D:/MonProjet/dist;  # ← Votre chemin build
```

---

## 🔐 Sécurité

### Bonnes Pratiques

1. **Mots de passe:**
   - Utilisez des mots de passe forts (12+ caractères)
   - Ne hardcodez JAMAIS les mots de passe dans les scripts
   - Utilisez des variables d'environnement ou saisie interactive

2. **Pare-feu:**
   - Les scripts configurent automatiquement le pare-feu Windows
   - Vérifiez que seul le réseau local (192.168.x.x) a accès

3. **Sauvegardes:**
   - Stockez les sauvegardes sur un support différent du serveur
   - Testez régulièrement la restauration
   - Chiffrez les sauvegardes si données sensibles

4. **Logs:**
   - Consultez régulièrement les logs Nginx et PostgreSQL
   - Activez l'audit dans PostgreSQL si nécessaire

---

## 📝 Logs et Diagnostics

### Emplacements des Logs

```powershell
# Nginx
Get-Content C:\nginx\logs\access.log -Tail 50 -Wait
Get-Content C:\nginx\logs\error.log -Tail 50 -Wait

# PostgreSQL
Get-Content "C:\Program Files\PostgreSQL\15\data\log\postgresql-*.log" -Tail 50

# Sauvegardes
Get-Content C:\Backups\GestionFonds\backup.log -Tail 50

# Windows Events (services)
Get-EventLog -LogName System -Source "Service Control Manager" -Newest 20
```

---

## 🆘 Support

### Problèmes Courants

**Script bloqué par la politique d'exécution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Erreur "Accès refusé" sur pare-feu:**
```powershell
# Exécuter PowerShell en tant qu'ADMINISTRATEUR
```

**PostgreSQL ne démarre pas:**
```powershell
# Vérifier les logs
Get-Content "C:\Program Files\PostgreSQL\15\data\log\*.log" -Tail 30

# Vérifier le service
Get-Service postgresql*
Restart-Service postgresql-x64-15
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez:
- **`../GUIDE-DEPLOIEMENT-LOCAL.md`** - Guide complet de déploiement
- **`../QUICK-START.md`** - Guide de démarrage rapide

---

**Auteur:** Direction Générale d'Appui au Développement des Provinces - RDC
**Version:** 1.0
**Date:** Février 2026
