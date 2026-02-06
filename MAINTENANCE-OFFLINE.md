# MAINTENANCE & MISES A JOUR HORS-LIGNE
# Gestion Fonds DGDADPKV

## 🔄 WORKFLOW DE MISE A JOUR PRODUCTION LOCALE

Vous pouvez **continuer à développer sur une machine avec Internet** et **déployer les mises à jour sur le réseau local sans Internet**.

---

## 📋 PROCESSUS DE MISE A JOUR (30 minutes)

### Sur la machine de DEVELOPPEMENT (avec Internet)

#### Étape 1 : Faire les modifications
```powershell
# Sur votre machine de dev
cd C:\Users\Congo\Downloads\gestionfondsdgdadpkv-main\gestionfondsdgdadpkv-main

# Faire vos modifications (ajouter features, corriger bugs, etc.)
# ... éditer les fichiers ...

# Tester en local
npm run dev
```

#### Étape 2 : Compiler pour production
```powershell
# Build optimisé
npm run build

# Résultat : dossier "dist" mis à jour
```

#### Étape 3 : Exporter le pack
```powershell
cd ..\scripts

# Créer le pack avec la nouvelle version
.\export-pack-offline.ps1 -ExportPath "C:\Export-Gestion-Fonds-v2"
```

#### Étape 4 : Copier sur clé USB ou partage
```powershell
# Copier le dossier C:\Export-Gestion-Fonds-v2 sur:
# - Une clé USB, OU
# - Un disque dur externe, OU
# - Un dossier partagé en réseau (si accessible avant déploiement)
```

---

### Sur le SERVEUR PRODUCTION (sans Internet)

#### Étape 1 : Arrêter Nginx (trafic interrompu ~10 secondes)
```powershell
cd C:\nginx
.\nginx.exe -s stop
```

#### Étape 2 : Sauvegarder la version actuelle
```powershell
# En cas de besoin de rollback
Copy-Item "C:\GestionFonds\dist" "C:\GestionFonds\dist.backup.v1" -Recurse -Force
```

#### Étape 3 : Copier la nouvelle version
```powershell
# Depuis la clé USB ou partage
Copy-Item "D:\PACK\APPLICATION\dist\*" "C:\GestionFonds\dist" -Recurse -Force

# Si migrations SQL (modifications base de données):
Copy-Item "D:\PACK\APPLICATION\supabase\migrations\*.sql" "C:\GestionFonds\supabase\migrations" -Force
```

#### Étape 4 : Appliquer les migrations (si besoin)
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
$env:PGPASSWORD = "votre_mot_de_passe"

# Tester quelle migration est nouvelle
Get-ChildItem "C:\GestionFonds\supabase\migrations\*.sql"

# Appliquer manuellement si nouvelle migration:
psql -U postgres -d gestion_fonds_dgdadpkv -f "C:\GestionFonds\supabase\migrations\20260207_*.sql"
```

#### Étape 5 : Redémarrer Nginx
```powershell
cd C:\nginx
start nginx

# Attendre 3 secondes
Start-Sleep -Seconds 3

# Vérifier
.\nginx.exe -t
```

#### Étape 6 : Tester la nouvelle version
```powershell
# Test local
Invoke-WebRequest http://localhost -UseBasicParsing | Select-Object StatusCode

# Test accès utilisateur
# Ouvrir: http://192.168.1.X dans un navigateur
```

---

## ⚠️ ROLLBACK EN CAS DE PROBLEME

Si la nouvelle version a un bug :

```powershell
# 1. Arrêter Nginx
cd C:\nginx
.\nginx.exe -s stop

# 2. Restaurer l'ancienne version
Copy-Item "C:\GestionFonds\dist.backup.v1\*" "C:\GestionFonds\dist" -Recurse -Force

# 3. Redémarrer
start nginx

# 4. Investguer le problème
# Voir DEBUGGING.md
```

---

## 🔧 MODIFICATIONS SUR LE SERVEUR (Sans Internet)

### Scénario : Corriger un bug URGENT

Si vous ne pouvez PAS attendre une mise à jour depuis la machine de dev :

#### Option 1 : Modification simple (fichier statique)
```powershell
# Modifier directement dans le dossier dist
# Exemple: corriger du texte, CSS, ou ajouter un message urgent

# Fichier location
C:\GestionFonds\dist\index.html
# OU
C:\GestionFonds\dist\assets\...fichiers...

# Recharger Nginx pour appliquer
cd C:\nginx
.\nginx.exe -s reload

# Les utilisateurs actualisent la page (F5)
```

#### Option 2 : Modification de configuration
```powershell
# Editer le fichier .env
# C:\GestionFonds\.env.production.local

# Exemple: IP serveur, port, etc.

# Recharger Nginx
cd C:\nginx
.\nginx.exe -s reload
```

#### Option 3 : Modification complète (rebuild needed)
```powershell
# Si vous avez Node.js sur le serveur:
# (Non recommandé en production!)

cd C:\GestionFonds
npm run build

# Sinon, attendre la prochaine mise à jour depuis la dev machine
```

---

## 📊 MONITORING DES MISES A JOUR

### Avant mise à jour : Sauvegarder l'état
```powershell
# Sauvegarde complète avant toute modification
$env:PGPASSWORD = "motdepasse"
pg_dump -U postgres -F c gestion_fonds_dgdadpkv > "C:\Backups\avant-maj-v2.backup"
```

### Pendant mise à jour : Vérifier l'application
```powershell
# Script de test automatique
while($true) {
    $response = Invoke-WebRequest http://localhost -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Application accessible" -ForegroundColor Green
    } else {
        Write-Host "[X] Application inaccessible" -ForegroundColor Red
    }
    Start-Sleep -Seconds 30
}
```

### Après mise à jour : Vérifier les logs
```powershell
# Consulter les logs Nginx
Get-Content "C:\nginx\logs\error.log" -Tail 50

# PostgreSQL
Get-Content "C:\Program Files\PostgreSQL\18\data\log\*.log" -Tail 50
```

---

## 🎯 CHECKLIST MISE A JOUR

- [ ] Sauvegarder base de données
- [ ] Copier nouveau pack sur serveur
- [ ] Créer backup du dossier dist
- [ ] Arrêter Nginx proprement
- [ ] Copier les nouveaux fichiers
- [ ] Appliquer migrations SQL (si applicable)
- [ ] Redémarrer Nginx
- [ ] Tester depuis le poste client
- [ ] Vérifier les logs d'erreur
- [ ] Documenter la modification

---

## 🚀 WORKFLOW RECOMMANDÉ

### Setup initial (ce que vous avez fait)
```
1. Installer logiciels (PostgreSQL, Nginx)
2. Créer le pack hors-ligne
3. Déployer sur réseau local
```

### Mises à jour (tous les X mois)
```
1. Développer + tester en local
2. Compiler (npm run build)
3. Créer nouveau pack (export-pack-offline.ps1)
4. Transférer sur serveur (USB/partage)
5. Déployer (arrêter, copier, redémarrer, tester)
```

### Corrections urgentes (si nécessaire)
```
1. Modifier dist/ directement OU
2. Sauvegarder→redéployer depuis backup
```

---

## 📋 VERSIONNING

Garder trace des versions :

```powershell
# Créer un fichier de version
$version = @{
    Version = "1.0.0"
    DeployedAt = Get-Date
    Changes = @(
        "Initial deployment"
        "PostgreSQL 18"
        "Nginx 1.24"
    )
    NextMaintenance = (Get-Date).AddMonths(3)
}

$version | ConvertTo-Json | Out-File "C:\GestionFonds\VERSION.json"

# Afficher la version actuelle
Get-Content "C:\GestionFonds\VERSION.json"
```

---

## 🔐 SÉCURITÉ MISES A JOUR

### Avant chaque mise à jour
- [ ] Vérifier source des fichiers (d'où viennent-ils ?)
- [ ] Vérifier les signatures de fichiers si disponible
- [ ] Tester sur une copie avant mise en production
- [ ] Vérifier qu'aucun malware n'a altéré les fichiers

### Après mise à jour
- [ ] Vérifier que seuls les fichiers attendus ont changé
- [ ] Auditer les logs pour activités suspectes
- [ ] Relancer scan antivirus si applicable

---

## 📞 SUPPORT HORS-LIGNE

### Quand vous ne pouvez pas accéder à Internet
- Consultez la documentation locale (PDF imprimé)
- Vérifiez les logs sur le serveur
- Testez les connections reseau
- Vérifiez l'espace disque

### Fichiers de reference
```
C:\GestionFonds\DEPLOIEMENT-HORS-LIGNE.md
C:\GestionFonds\GUIDE-DEPLOIEMENT-LOCAL.md
C:\GestionFonds\QUICK-START.md
```

---

**Continuité des modifications + Autonomie du réseau local = Production robuste !**

Vous pouvez maintenant développer, tester, et déployer en production locale sans dépendre d'Internet ! 🚀
