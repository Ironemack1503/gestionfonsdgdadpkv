# GUIDE DEPLOIEMENT HORS-LIGNE - PRODUCTION LOCALE
# Gestion Fonds DGDADPKV

Ce guide vous permet de déployer l'application sur n'importe quel réseau **SANS INTERNET** en utilisant ce pack.

---

## 📦 CONTENU DU PACK

```
PACK-DEPLOIEMENT-HORS-LIGNE/
├── README.md (ce fichier)
├── APPLICATION/
│   ├── dist/ (application compilée)
│   ├── supabase/
│   │   └── migrations/ (scripts base de données)
│   └── .env.production.local (configuration)
├── INSTALLATEURS/
│   ├── postgresql-18-windows.exe
│   ├── node-v22.13.0-x64.msi
│   └── nginx-1.24.0.zip
├── SCRIPTS/
│   ├── deploy-offline.ps1 (script déploiement)
│   ├── nginx.conf (configuration Nginx)
│   └── README-SCRIPTS.md
└── DOCUMENTATION/
    ├── GUIDE-DEPLOIEMENT-LOCAL.md
    ├── QUICK-START.md
    └── MAINTENANCE.md
```

---

## 🚀 INSTALLATION SUR UN NOUVEAU RÉSEAU (SANS INTERNET)

### Prérequis
- Clé USB avec le pack (au minimum 2 GB)
- Serveur Windows 10/11 ou Windows Server
- Accès administrateur

### Étapes (1h total)

#### 1️⃣ Préparer le serveur
```powershell
# Créer le dossier d'installation
New-Item -ItemType Directory -Path "C:\GestionFonds" -Force
```

#### 2️⃣ Installer PostgreSQL
- Ouvrir : `INSTALLATEURS/postgresql-18-windows.exe`
- Port : 5432
- Mot de passe : 🔐 **NOTEZ-LE**
- Activer pgAdmin 4 : ☑️

#### 3️⃣ Installer Node.js (optionnel si rebuild pas besoin)
- Ouvrir : `INSTALLATEURS/node-v22.13.0-x64.msi`
- Installation standard

#### 4️⃣ Installer Nginx
- Extraire : `INSTALLATEURS/nginx-1.24.0.zip`
- Placer le dossier `nginx` dans `C:\`
- Résultat : `C:\nginx\nginx.exe`

#### 5️⃣ Déployer l'application
```powershell
# Copier le dossier APPLICATION
Copy-Item "D:\PACK\APPLICATION" "C:\GestionFonds" -Recurse -Force

# Copier nginx.conf
Copy-Item "D:\PACK\SCRIPTS\nginx.conf" "C:\nginx\conf\nginx.conf" -Force

# Lancer le script de déploiement
cd C:\GestionFonds
PowerShell -ExecutionPolicy Bypass -File "..\PACK\SCRIPTS\deploy-offline.ps1"
```

#### 6️⃣ Démarrer les services
```powershell
# Nginx
cd C:\nginx
start nginx

# PostgreSQL démarre automatiquement
Get-Service postgresql*
```

#### 7️⃣ Tester l'application
- Ouvrir navigateur : `http://localhost`
- OU depuis un autre poste : `http://192.168.1.X` (IP du serveur)

---

## ⚙️ CONFIGURATION POST-INSTALLATION

### IP Statique du Serveur
Pour que les clients accèdent toujours au même serveur :

**Paramètres Windows → Réseau → Configuration IP statique**
Exemple :
- IP : 192.168.1.100
- Masque : 255.255.255.0
- Passerelle : 192.168.1.1 (votre routeur)

### Mettre à jour Nginx avec la bonne IP
```powershell
# Éditer C:\nginx\conf\nginx.conf
# Ligne 67 : server_name  192.168.1.100 localhost;
# Ligne 73 : root C:/GestionFonds/dist;

# Tester
cd C:\nginx
.\nginx.exe -t

# Recharger
.\nginx.exe -s reload
```

### Créer le compte administrateur initial
1. Accéder à http://192.168.1.100
2. Créer un compte
3. Configurer l'application

---

## 📊 COMMANDES UTILES

### Vérifier l'état
```powershell
# PostgreSQL
Get-Service postgresql*

# Nginx
Get-Process nginx

# Application
Invoke-WebRequest http://localhost
```

### Arrêter et redémarrer
```powershell
# Arrêter Nginx
cd C:\nginx
.\nginx.exe -s stop

# Redémarrer Nginx
start nginx

# Redémarrer PostgreSQL
Restart-Service postgresql-x64-18
```

### Sauvegardes
```powershell
# Backup manuel
$env:PGPASSWORD="votremotdepasse"
pg_dump -U postgres gestion_fonds_dgdadpkv -F c -b > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').backup
```

---

## 🔒 SÉCURITÉ EN HORS-LIGNE

### Points recommandés
1. **Pare-feu Windows** : Autoriser ports 80, 5432 (administrateur seulement)
2. **Mots de passe forts** : PostgreSQL (12+ caractères, spéciaux)
3. **Accès physique** : Contrôler qui a accès au serveur
4. **Sauvegardes régulières** : Chaque semaine minimum
5. **Log d'accès** : Consulter les logs Nginx régulièrement

### Accès administrateur
Seul le serveur peut accéder à pgAdmin :
```
http://localhost:5050
```

---

## 🆘 DÉPANNAGE

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Site inaccessible | Nginx arrêté | `cd C:\nginx; start nginx` |
| Erreur DB | PostgreSQL arrêté | `Restart-Service postgresql*` |
| Port 80 occupé | Autre service | Vérifier `netstat -ano \| findstr 80` |
| Lenteur | RAM insuffisante | Vérifier `Get-Process` |

---

## 📞 SUPPORT SANS INTERNET

### Fichiers de reference
- `GUIDE-DEPLOIEMENT-LOCAL.md` : Guide complet (imprimer si besoin)
- `QUICK-START.md` : Démarrage rapide
- `scripts/README-SCRIPTS.md` : Documentation des scripts

### Problèmes courants (voir GUIDE)
- Configuration IP
- Contrôle d'accès réseau
- Augmentation des ressources (RAM, disque)
- Migration vers un nouveau serveur

---

## 🔄 MIGRATIONS & MISES À JOUR

### Appliquer les migrations SQL
```powershell
$env:PGPASSWORD="motdepasse"

# Lecture des scripts dans supabase/migrations
Get-ChildItem "C:\GestionFonds\supabase\migrations\*.sql" | ForEach-Object {
    psql -U postgres -d gestion_fonds_dgdadpkv -f $_.FullName
    Write-Host "Migration appliquee: $($_.Name)"
}
```

### Deployer une nouvelle version
1. Remplacer le dossier `dist` avec la nouvelle version
2. Recharger Nginx : `C:\nginx\nginx.exe -s reload`
3. Les utilisateurs auront la version mise à jour au prochain F5

---

## 📈 PERFORMANCE & MONITORING

### Surveiller en temps réel
```powershell
# CPU, RAM, disque
while($true) {
    Clear-Host
    Get-Counter '\Processor(_Total)\% Processor Time' | Select-Object -ExpandProperty CounterSamples | Select-Object CookedValue
    Get-Counter '\Memory\Available MBytes' | Select-Object -ExpandProperty CounterSamples | Select-Object CookedValue
    Get-Process nginx, postgres* | Select processoraffinity, workingset
    Start-Sleep 2
}
```

### Optimiser pour 50+ utilisateurs
- Augmenter `max_connections` dans PostgreSQL
- Augmenter buffer Nginx
- Vérifier les logs pour les requêtes lentes
- Considérer upgrade des ressources serveur

---

## ✅ CHECKLIST POST-DÉPLOIEMENT

- [ ] PostgreSQL démarre automatiquement au boot
- [ ] Nginx démarre automatiquement au boot
- [ ] Configuration IP statique
- [ ] Pare-feu Windows configuré (ou désactivé en réseau interne)
- [ ] Compte admin créé
- [ ] Test accès depuis un autre poste
- [ ] Sauvegardes manuelles testées
- [ ] Documentation imprimée ou accessible offline
- [ ] Formation utilisateurs complétée
- [ ] Numéro support / contact IT noté

---

**Version** : 1.0  
**Date** : Février 2026  
**Statut** : Production Locale - Hors-Ligne  
**Autonomie** : 100% (pas Internet requis après installation)

---

Pour mettre à jour ce pack : Copiez le nouveau dossier `dist` et relancez deploy-offline.ps1
