# 🚀 Guide de Déploiement sur Réseau Local

## 📋 Table des Matières
1. [Prérequis](#prérequis)
2. [Installation du Serveur](#installation-du-serveur)
3. [Configuration Réseau](#configuration-réseau)
4. [Déploiement de l'Application](#déploiement-de-lapplication)
5. [Configuration des Clients](#configuration-des-clients)
6. [Sécurité et Sauvegardes](#sécurité-et-sauvegardes)
7. [Maintenance](#maintenance)

---

## 1. 🔧 Prérequis

### Matériel Serveur (Minimum)
- **CPU**: 4 cœurs (Intel i5 / AMD Ryzen 5)
- **RAM**: 8 GB (16 GB recommandé)
- **Disque**: 256 GB SSD
- **Réseau**: Carte Ethernet 1 Gbps
- **OS**: Windows 10/11 Pro ou Windows Server 2019+

### Matériel Clients
- **CPU**: Dual-core
- **RAM**: 4 GB
- **Navigateur**: Chrome 90+, Edge 90+, Firefox 88+

### Logiciels à Télécharger
1. ✅ **PostgreSQL 15+**: https://www.postgresql.org/download/windows/
2. ✅ **Node.js 18+ LTS**: https://nodejs.org/
3. ✅ **Nginx for Windows**: https://nginx.org/en/download.html
4. ✅ **Git**: https://git-scm.com/download/win (optionnel)

---

## 2. 💻 Installation du Serveur

### Étape A: Installation PostgreSQL

```powershell
# 1. Télécharger PostgreSQL 15 depuis le site officiel
# 2. Lancer l'installateur
# 3. Configurer le mot de passe du superuser "postgres"
# 4. Port par défaut: 5432
# 5. Cocher pgAdmin 4

# Après installation, vérifier:
psql --version
```

**Configuration PostgreSQL** (`C:\Program Files\PostgreSQL\15\data\postgresql.conf`):
```ini
# Connexions réseau
listen_addresses = '*'          # Écouter sur toutes les interfaces
max_connections = 100           # Nombre maximum de connexions

# Performance
shared_buffers = 256MB          # Mémoire partagée
effective_cache_size = 2GB      # Cache effectif
work_mem = 4MB                  # Mémoire de travail
maintenance_work_mem = 64MB     # Maintenance
```

**Fichier `pg_hba.conf`** - Autoriser les connexions réseau local:
```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
host    all             all             192.168.1.0/24          scram-sha-256
```

Redémarrer PostgreSQL:
```powershell
# Via Services Windows ou:
Restart-Service postgresql-x64-15
```

### Étape B: Installation Node.js

```powershell
# 1. Télécharger Node.js 18 LTS
# 2. Installer avec les options par défaut
# 3. Vérifier l'installation:
node --version
npm --version
```

### Étape C: Installation Supabase CLI

```powershell
# Installer Supabase CLI globalement
npm install -g supabase

# Vérifier l'installation
supabase --version
```

### Étape D: Installation Nginx

```powershell
# 1. Télécharger Nginx for Windows
# 2. Extraire dans C:\nginx
# 3. Tester:
cd C:\nginx
.\nginx.exe -t
```

---

## 3. 🌐 Configuration Réseau

### Configuration IP Statique du Serveur

**Windows GUI:**
1. Panneau de configuration → Réseau et Internet
2. Centre Réseau et partage → Modifier les paramètres de la carte
3. Clic droit sur carte réseau → Propriétés
4. IPv4 → Propriétés → Configuration:
   - **IP**: `192.168.1.100`
   - **Masque**: `255.255.255.0`
   - **Passerelle**: `192.168.1.1` (votre routeur)
   - **DNS**: `192.168.1.1` ou `8.8.8.8`

**PowerShell (alternatif):**
```powershell
# Adapter le nom de l'interface réseau
$InterfaceAlias = "Ethernet"
$IPAddress = "192.168.1.100"
$PrefixLength = 24
$DefaultGateway = "192.168.1.1"

New-NetIPAddress -InterfaceAlias $InterfaceAlias `
                 -IPAddress $IPAddress `
                 -PrefixLength $PrefixLength `
                 -DefaultGateway $DefaultGateway

Set-DnsClientServerAddress -InterfaceAlias $InterfaceAlias `
                            -ServerAddresses "192.168.1.1","8.8.8.8"
```

### Configuration Pare-feu Windows

```powershell
# Autoriser PostgreSQL
New-NetFirewallRule -DisplayName "PostgreSQL Server" `
                    -Direction Inbound `
                    -Action Allow `
                    -Protocol TCP `
                    -LocalPort 5432

# Autoriser Supabase API
New-NetFirewallRule -DisplayName "Supabase API" `
                    -Direction Inbound `
                    -Action Allow `
                    -Protocol TCP `
                    -LocalPort 54321

# Autoriser HTTP
New-NetFirewallRule -DisplayName "HTTP Web Server" `
                    -Direction Inbound `
                    -Action Allow `
                    -Protocol TCP `
                    -LocalPort 80

# Autoriser HTTPS
New-NetFirewallRule -DisplayName "HTTPS Web Server" `
                    -Direction Inbound `
                    -Action Allow `
                    -Protocol TCP `
                    -LocalPort 443
```

### Nom DNS Local (Optionnel)

**Option 1: Fichier hosts sur chaque client**
```
C:\Windows\System32\drivers\etc\hosts

192.168.1.100    gestion-fonds.local
```

**Option 2: DNS local sur routeur** (recommandé)
- Configurer un enregistrement A dans le routeur pointant vers `192.168.1.100`

---

## 4. 📦 Déploiement de l'Application

### Étape 1: Préparer le Projet

```powershell
# Naviguer vers le projet
cd C:\Users\Congo\Downloads\gestionfondsdgdadpkv-main

# Installer les dépendances
npm install

# OU avec bun
bun install
```

### Étape 2: Configurer Supabase Local

Exécuter le script de setup automatique:
```powershell
.\scripts\setup-production-local.ps1
```

OU manuellement:

```powershell
# Créer la base de données
$env:PGPASSWORD="votre_mot_de_passe"
createdb -U postgres -h localhost gestion_fonds_dgdadpkv

# Appliquer les migrations
psql -U postgres -h localhost -d gestion_fonds_dgdadpkv -f .\supabase\migrations\*.sql

# OU via Supabase CLI
supabase db push
```

### Étape 3: Configuration Variables d'Environnement

Créer `.env.production.local`:
```env
# URL de l'API Supabase (IP du serveur)
VITE_SUPABASE_URL=http://192.168.1.100:54321
VITE_SUPABASE_ANON_KEY=votre_anon_key_supabase

# Configuration base de données
DATABASE_URL=postgresql://postgres:mot_de_passe@192.168.1.100:5432/gestion_fonds_dgdadpkv

# Mode production
NODE_ENV=production
```

### Étape 4: Build de Production

```powershell
# Build optimisé
npm run build

# Le résultat sera dans le dossier "dist"
```

### Étape 5: Configuration Nginx

Fichier `C:\nginx\conf\nginx.conf`:
```nginx
worker_processes  4;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # Serveur principal
    server {
        listen       80;
        server_name  192.168.1.100 gestion-fonds.local;
        
        root   C:/Users/Congo/Downloads/gestionfondsdgdadpkv-main/dist;
        index  index.html;
        
        # Cache statique
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Proxy vers Supabase API
        location /api/ {
            proxy_pass http://127.0.0.1:54321/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        # SPA routing - rediriger vers index.html
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Logs
        access_log  logs/access.log;
        error_log   logs/error.log;
    }
}
```

### Étape 6: Démarrer les Services

```powershell
# 1. Démarrer Supabase
supabase start

# 2. Démarrer Nginx
cd C:\nginx
start nginx

# Vérifier que Nginx tourne
.\nginx.exe -t
tasklist /FI "IMAGENAME eq nginx.exe"
```

### Étape 7: Créer des Services Windows (Optionnel)

Pour que tout démarre automatiquement au boot:

```powershell
# Installer NSSM (Non-Sucking Service Manager)
# Télécharger depuis https://nssm.cc/download

# Créer service pour Supabase
nssm install SupabaseLocal "C:\Program Files\nodejs\supabase.cmd" "start"
nssm set SupabaseLocal AppDirectory "C:\Users\Congo\Downloads\gestionfondsdgdadpkv-main"
nssm start SupabaseLocal

# Créer service pour Nginx
nssm install NginxWeb "C:\nginx\nginx.exe"
nssm set NginxWeb AppDirectory "C:\nginx"
nssm start NginxWeb
```

---

## 5. 👥 Configuration des Clients

### Sur Chaque Poste Client:

1. **Tester la connectivité**:
   ```cmd
   ping 192.168.1.100
   ```

2. **Ouvrir le navigateur** (Chrome/Edge recommandé):
   ```
   http://192.168.1.100
   ```
   OU avec DNS:
   ```
   http://gestion-fonds.local
   ```

3. **Premier utilisateur**:
   - Créer le compte admin via l'interface
   - OU insérer directement en base via pgAdmin

### Raccourci Bureau (Optionnel)

Créer un fichier `Gestion Fonds.url`:
```ini
[InternetShortcut]
URL=http://192.168.1.100
IconIndex=0
IconFile=C:\Windows\System32\SHELL32.dll
```

---

## 6. 🔒 Sécurité et Sauvegardes

### Sécurité

**PostgreSQL**:
```sql
-- Créer un utilisateur applicatif (pas le superuser)
CREATE USER app_user WITH PASSWORD 'mot_de_passe_fort';
GRANT ALL PRIVILEGES ON DATABASE gestion_fonds_dgdadpkv TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

**Politique de mots de passe**:
- Minimum 12 caractères
- Majuscules + minuscules + chiffres + symboles
- Renouvellement tous les 90 jours

### Sauvegardes Automatiques

Script `scripts\backup-database.ps1`:
```powershell
# Voir le fichier créé séparément
```

**Tâche planifiée Windows**:
```powershell
# Créer une sauvegarde quotidienne à 2h du matin
$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument '-File "C:\Users\Congo\Downloads\gestionfondsdgdadpkv-main\scripts\backup-database.ps1"'

$trigger = New-ScheduledTaskTrigger -Daily -At 2am

Register-ScheduledTask `
    -TaskName "Backup Gestion Fonds" `
    -Action $action `
    -Trigger $trigger `
    -User "SYSTEM" `
    -RunLevel Highest
```

### Sauvegarde sur NAS

```powershell
# Copier les backups vers un NAS
$source = "C:\Backups\GestionFonds"
$destination = "\\192.168.1.250\Backups\GestionFonds"

robocopy $source $destination /MIR /Z /R:3 /W:5 /LOG:"C:\Logs\backup-sync.log"
```

---

## 7. 🔧 Maintenance

### Commandes Utiles

**Redémarrer Nginx**:
```powershell
cd C:\nginx
.\nginx.exe -s reload  # Recharger config
.\nginx.exe -s stop    # Arrêter
start nginx            # Démarrer
```

**Redémarrer PostgreSQL**:
```powershell
Restart-Service postgresql-x64-15
```

**Vérifier les logs**:
```powershell
# Nginx
Get-Content C:\nginx\logs\error.log -Tail 50

# PostgreSQL
Get-Content "C:\Program Files\PostgreSQL\15\data\log\*.log" -Tail 50
```

**Surveiller les connexions actives**:
```sql
SELECT 
    datname, 
    usename, 
    client_addr, 
    state,
    query_start
FROM pg_stat_activity
WHERE datname = 'gestion_fonds_dgdadpkv';
```

### Monitoring Performance

**Script de surveillance** `scripts\monitor-server.ps1`:
```powershell
while ($true) {
    Clear-Host
    Write-Host "=== MONITORING SERVEUR GESTION FONDS ===" -ForegroundColor Cyan
    Write-Host ""
    
    # CPU
    $cpu = Get-Counter '\Processor(_Total)\% Processor Time' | 
           Select-Object -ExpandProperty CounterSamples | 
           Select-Object -ExpandProperty CookedValue
    Write-Host "CPU: $([math]::Round($cpu, 2))%" -ForegroundColor Yellow
    
    # RAM
    $ram = Get-Counter '\Memory\Available MBytes' | 
           Select-Object -ExpandProperty CounterSamples | 
           Select-Object -ExpandProperty CookedValue
    Write-Host "RAM Disponible: $([math]::Round($ram, 0)) MB" -ForegroundColor Yellow
    
    # Nginx
    $nginx = Get-Process nginx -ErrorAction SilentlyContinue
    if ($nginx) {
        Write-Host "Nginx: ✓ ACTIF" -ForegroundColor Green
    } else {
        Write-Host "Nginx: ✗ INACTIF" -ForegroundColor Red
    }
    
    # PostgreSQL
    $postgres = Get-Service postgresql-x64-15 -ErrorAction SilentlyContinue
    if ($postgres.Status -eq 'Running') {
        Write-Host "PostgreSQL: ✓ ACTIF" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL: ✗ INACTIF" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 5
}
```

### Mises à jour

```powershell
# 1. Backup complet avant mise à jour
.\scripts\backup-database.ps1

# 2. Arrêter les services
cd C:\nginx
.\nginx.exe -s stop

# 3. Mettre à jour le code
git pull  # Si utilisation de Git
npm install
npm run build

# 4. Appliquer les nouvelles migrations
supabase db push

# 5. Redémarrer
start nginx
```

---

## 📊 Tableau de Diagnostic Rapide

| Problème | Commande de Vérification | Solution |
|----------|--------------------------|----------|
| Site inaccessible | `ping 192.168.1.100` | Vérifier IP/Pare-feu |
| Erreur 502 | `.\nginx.exe -t` | Vérifier config Nginx |
| Erreur connexion DB | `psql -U postgres -h 192.168.1.100` | Vérifier PostgreSQL/pg_hba.conf |
| Lenteur | `scripts\monitor-server.ps1` | Vérifier RAM/CPU |

---

## 📞 Support

Pour toute assistance:
1. Consulter les logs (Nginx, PostgreSQL)
2. Vérifier le monitoring
3. Consulter ce guide
4. Contacter l'administrateur système

---

**Version du Guide**: 1.0
**Date**: Février 2026
**Auteur**: Direction Générale d'Appui au Développement des Provinces - RDC
