# 🚀 Guide de Démarrage Rapide - Déploiement Réseau Local

## ⚡ Installation en 5 Étapes

### 📋 Avant de Commencer

**Téléchargements nécessaires:**
1. PostgreSQL 15+: https://www.postgresql.org/download/windows/
2. Node.js 18 LTS: https://nodejs.org/
3. Nginx for Windows: https://nginx.org/en/download.html

---

### Étape 1️⃣: Installer PostgreSQL et Node.js

```powershell
# 1. Installer PostgreSQL avec pgAdmin
#    - Mot de passe: NOTEZ-LE!
#    - Port: 5432 (par défaut)

# 2. Installer Node.js (toutes les options par défaut)

# 3. Vérifier les installations
psql --version
node --version
npm --version
```

---

### Étape 2️⃣: Configuration Automatique

```powershell
# Ouvrir PowerShell en tant qu'ADMINISTRATEUR dans le dossier du projet
cd C:\Users\Congo\Downloads\gestionfondsdgdadpkv-main

# Exécuter le script de setup
.\scripts\setup-production-local.ps1

# Le script va vous demander:
# - Mot de passe PostgreSQL
# - Confirmation de l'IP du serveur
# - Application des données de test (optionnel)
```

**Ce script fait:**
- ✅ Vérification des prérequis
- ✅ Configuration du pare-feu Windows
- ✅ Création de la base de données
- ✅ Application des migrations
- ✅ Installation des dépendances npm
- ✅ Build de production
- ✅ Création du fichier .env

---

### Étape 3️⃣: Installer et Configurer Nginx

```powershell
# 1. Télécharger Nginx for Windows
# 2. Extraire dans C:\nginx

# 3. Copier la configuration
Copy-Item .\scripts\nginx.conf C:\nginx\conf\nginx.conf -Force

# 4. Tester la configuration
cd C:\nginx
.\nginx.exe -t

# 5. Démarrer Nginx
start nginx

# Vérifier que Nginx tourne
tasklist /FI "IMAGENAME eq nginx.exe"
```

---

### Étape 4️⃣: Démarrer Supabase

```powershell
# Dans le dossier du projet
cd C:\Users\Congo\Downloads\gestionfondsdgdadpkv-main

# Démarrer Supabase en mode production
supabase start

# OU si vous voulez attacher à une base existante
supabase db start
```

---

### Étape 5️⃣: Tester l'Application

Ouvrir un navigateur sur **N'IMPORTE QUEL** poste du réseau:

```
http://192.168.1.100
```

**Première connexion:**
- Créer un compte administrateur
- Se connecter
- Configurer les paramètres de base

---

## 📊 Monitoring et Maintenance

### Surveiller le Serveur en Temps Réel

```powershell
# Ouvrir le monitoring dans une fenêtre PowerShell
.\scripts\monitor-server.ps1

# Avec mot de passe DB pour stats complètes
.\scripts\monitor-server.ps1 -DBPassword "votre_mot_de_passe"
```

**Affiche:**
- 💻 CPU, RAM, Disque
- 🔧 État des services (PostgreSQL, Nginx, Supabase)
- 🗄️ Statistiques base de données
- 🌐 Activité web en temps réel

---

### Configurer les Sauvegardes Automatiques

```powershell
# Exécuter EN TANT QU'ADMINISTRATEUR
.\scripts\setup-backup-task.ps1

# Le script va:
# - Créer une tâche planifiée quotidienne (2h du matin)
# - Configurer la rétention (30 jours par défaut)
# - (Optionnel) Copie vers un NAS
# - Tester la sauvegarde immédiatement
```

**Sauvegarde manuelle:**
```powershell
.\scripts\backup-database.ps1 -DBPassword "votre_mot_de_passe"
```

---

## 🔧 Commandes Utiles

### Nginx

```powershell
cd C:\nginx

# Démarrer
start nginx

# Recharger la configuration (sans interruption)
.\nginx.exe -s reload

# Arrêter proprement
.\nginx.exe -s quit

# Arrêter immédiatement
.\nginx.exe -s stop

# Tester la configuration
.\nginx.exe -t

# Voir les logs
Get-Content .\logs\error.log -Tail 50 -Wait
Get-Content .\logs\access.log -Tail 50 -Wait
```

### PostgreSQL

```powershell
# Se connecter à la base
psql -U postgres -d gestion_fonds_dgdadpkv

# Lister les tables
psql -U postgres -d gestion_fonds_dgdadpkv -c "\dt"

# Voir les connexions actives
psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Redémarrer le service
Restart-Service postgresql-x64-15
```

### Supabase

```powershell
# Démarrer
supabase start

# Arrêter
supabase stop

# Voir le statut
supabase status

# Appliquer les migrations
supabase db push

# Voir les logs
supabase logs
```

---

## 🚨 Dépannage Rapide

### Problème: Site inaccessible

```powershell
# 1. Vérifier la connectivité
ping 192.168.1.100

# 2. Vérifier Nginx
cd C:\nginx
tasklist /FI "IMAGENAME eq nginx.exe"

# 3. Vérifier les logs
Get-Content C:\nginx\logs\error.log -Tail 20

# 4. Redémarrer Nginx
.\nginx.exe -s stop
start nginx
```

### Problème: Erreur 502 Bad Gateway

```powershell
# Vérifier que Supabase tourne
supabase status

# Redémarrer Supabase
supabase stop
supabase start

# Vérifier la config Nginx
cd C:\nginx
.\nginx.exe -t
```

### Problème: Erreur de connexion à la base

```powershell
# 1. Vérifier PostgreSQL
Get-Service postgresql*

# 2. Tester la connexion
psql -U postgres -h localhost

# 3. Vérifier pg_hba.conf
notepad "C:\Program Files\PostgreSQL\15\data\pg_hba.conf"

# Doit contenir:
# host    all    all    192.168.1.0/24    scram-sha-256

# 4. Redémarrer PostgreSQL
Restart-Service postgresql-x64-15
```

### Problème: Application lente

```powershell
# Lancer le monitoring
.\scripts\monitor-server.ps1

# Vérifier:
# - CPU > 80% → Ajouter plus de ressources
# - RAM > 90% → Fermer applications inutiles
# - Connexions DB > 50 → Investiguer requêtes lentes
```

---

## 🔒 Sécurité

### Changer les Mots de Passe par Défaut

```sql
-- Se connecter à PostgreSQL
psql -U postgres -d gestion_fonds_dgdadpkv

-- Créer un utilisateur applicatif
CREATE USER app_gestionfonds WITH PASSWORD 'mot_de_passe_fort_123!';
GRANT ALL PRIVILEGES ON DATABASE gestion_fonds_dgdadpkv TO app_gestionfonds;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_gestionfonds;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_gestionfonds;

-- Changer le mot de passe postgres
ALTER USER postgres WITH PASSWORD 'nouveau_mot_de_passe_fort';
```

### Configurer le Pare-feu

```powershell
# Voir toutes les règles
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*PostgreSQL*" -or $_.DisplayName -like "*Nginx*"}

# Désactiver l'accès depuis l'extérieur du réseau local
# (Déjà configuré par le script setup-production-local.ps1)
```

---

## 📱 Configuration des Clients

### Sur Chaque Poste Client

**Option 1: Utiliser l'IP directement**
```
http://192.168.1.100
```

**Option 2: Utiliser un nom de domaine local**

1. Ouvrir le Bloc-notes **EN TANT QU'ADMINISTRATEUR**
2. Ouvrir: `C:\Windows\System32\drivers\etc\hosts`
3. Ajouter la ligne:
   ```
   192.168.1.100    gestion-fonds.local
   ```
4. Sauvegarder
5. Accéder via: `http://gestion-fonds.local`

**Option 3: Créer un raccourci bureau**

Créer un fichier `Gestion Fonds.url` avec ce contenu:
```ini
[InternetShortcut]
URL=http://192.168.1.100
```

---

## 📈 Mises à Jour

```powershell
# 1. TOUJOURS faire un backup avant
.\scripts\backup-database.ps1 -DBPassword "votre_mdp"

# 2. Arrêter les services
cd C:\nginx
.\nginx.exe -s stop

# 3. Récupérer les nouvelles versions
# (via Git, USB, ou téléchargement)

# 4. Installer les dépendances
npm install

# 5. Appliquer les nouvelles migrations
supabase db push

# 6. Rebuild
npm run build

# 7. Redémarrer
start nginx
supabase start
```

---

## 📞 Checklist Quotidienne Administrateur

- [ ] Vérifier le monitoring (`.\scripts\monitor-server.ps1`)
- [ ] Vérifier que la sauvegarde nocturne a réussi
- [ ] Consulter les logs d'erreur Nginx
- [ ] Vérifier l'espace disque disponible
- [ ] Tester l'accès depuis un poste client

---

## 📚 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `GUIDE-DEPLOIEMENT-LOCAL.md` | Guide complet détaillé |
| `scripts/setup-production-local.ps1` | Setup automatique initial |
| `scripts/backup-database.ps1` | Script de sauvegarde |
| `scripts/setup-backup-task.ps1` | Configurer sauvegarde auto |
| `scripts/monitor-server.ps1` | Monitoring temps réel |
| `scripts/nginx.conf` | Configuration Nginx |
| `.env.production.local` | Variables d'environnement |

---

## ✅ Validation du Déploiement

**Tester ces points:**

1. ✅ Accès à l'application depuis le serveur: `http://localhost`
2. ✅ Accès depuis un autre poste: `http://192.168.1.100`
3. ✅ Connexion utilisateur fonctionne
4. ✅ Création d'une dépense/recette
5. ✅ Génération d'un rapport
6. ✅ Export Excel/PDF
7. ✅ Sauvegarde manuelle réussit
8. ✅ Monitoring affiche toutes les stats

---

**Support:** Consultez `GUIDE-DEPLOIEMENT-LOCAL.md` pour plus de détails

**Version:** 1.0 - Février 2026
