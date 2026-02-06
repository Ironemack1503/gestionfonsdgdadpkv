# GUIDE D'INSTALLATION RAPIDE - DEPLOIEMENT RESEAU LOCAL

## ETAPE 1: Installer PostgreSQL

### Telechargement
1. Allez sur: https://www.postgresql.org/download/windows/
2. Telechargez PostgreSQL 15 ou 16 (version Windows x86-64)
3. Lancez l'installateur

### Installation
1. Cliquez "Next" jusqu'a "Select Components"
2. Assurez-vous que ces composants sont coches:
   - PostgreSQL Server
   - pgAdmin 4
   - Command Line Tools
3. Port par defaut: 5432 (NE PAS CHANGER)
4. IMPORTANT: Choisissez un mot de passe FORT et NOTEZ-LE!
   Exemple: GestionFonds2026!
5. Terminez l'installation

### Verification
Ouvrez PowerShell et tapez:
```powershell
psql --version
```
Vous devriez voir: "psql (PostgreSQL) 15.x"

---

## ETAPE 2: Installer Nginx

### Telechargement
1. Allez sur: https://nginx.org/en/download.html
2. Telechargez la version "Stable" pour Windows
   Exemple: nginx-1.24.0.zip

### Installation
1. Extrayez le fichier ZIP
2. Copiez le dossier extrait vers C:\nginx
3. Vous devriez avoir: C:\nginx\nginx.exe

### Verification
```powershell
cd C:\nginx
.\nginx.exe -v
```
Vous devriez voir: "nginx version: nginx/1.24.0"

---

## ETAPE 3: Configurer l'IP Statique (Optionnel mais Recommande)

### Pourquoi?
Pour que les clients puissent toujours acceder au serveur a la meme adresse

### Comment?
1. Ouvrir: Parametres Windows > Reseau et Internet > Ethernet
2. Clic sur votre connexion
3. Clic sur "Modifier les options de l'adaptateur"
4. Clic droit sur votre carte > Proprietes
5. Double-clic sur "Protocole Internet version 4 (TCP/IPv4)"
6. Cocher "Utiliser l'adresse IP suivante"
7. Entrer:
   - Adresse IP: 192.168.1.100
   - Masque: 255.255.255.0
   - Passerelle: 192.168.1.1 (votre routeur)
   - DNS: 192.168.1.1
8. OK > OK

OU gardez votre IP actuelle (192.168.1.131) et utilisez-la partout

---

## ETAPE 4: Setup Automatique

Une fois PostgreSQL et Nginx installes, executez:

```powershell
# OUVRIR POWERSHELL EN TANT QU'ADMINISTRATEUR
cd C:\Users\Congo\Downloads\gestionfondsdgdadpkv-main

# Executer le setup
.\scripts\setup-production-local.ps1
```

Le script va vous demander:
- Mot de passe PostgreSQL
- Confirmer l'IP du serveur
- (Optionnel) Appliquer les donnees de test

---

## ETAPE 5: Verifier le Deploiement

```powershell
# Relancer le diagnostic
.\scripts\test-deployment-simple.ps1

# Tout devrait etre [OK] en vert!
```

---

## ETAPE 6: Demarrer l'Application

```powershell
# 1. Copier la config Nginx
Copy-Item .\scripts\nginx.conf C:\nginx\conf\nginx.conf -Force

# 2. Demarrer Nginx
cd C:\nginx
start nginx

# 3. Demarrer Supabase (si utilise)
cd C:\Users\Congo\Downloads\gestionfondsdgdadpkv-main
supabase start

# 4. Ouvrir dans le navigateur
# http://192.168.1.131  (ou votre IP)
```

---

## ETAPE 7: Configurer les Sauvegardes

```powershell
# OUVRIR POWERSHELL EN TANT QU'ADMINISTRATEUR
.\scripts\setup-backup-task.ps1
```

---

## DEPANNAGE RAPIDE

### PostgreSQL ne demarre pas
```powershell
Get-Service postgresql*
Restart-Service postgresql-x64-15
```

### Nginx ne demarre pas
```powershell
cd C:\nginx
.\nginx.exe -t    # Tester la config
.\nginx.exe -s stop   # Arreter
start nginx       # Demarrer
```

### Site inaccessible
1. Verifier l'IP: `ipconfig`
2. Tester: `ping 192.168.1.131`
3. Verifier pare-feu Windows
4. Voir les logs: `C:\nginx\logs\error.log`

---

## PROCHAINES ETAPES APRES INSTALLATION

1. **Creer un utilisateur admin** via l'interface web
2. **Configurer les parametres** de l'application
3. **Former les utilisateurs** sur les postes clients
4. **Tester les sauvegardes** regulierement
5. **Surveiller** avec le script de monitoring

---

Pour toute question, consultez:
- GUIDE-DEPLOIEMENT-LOCAL.md (guide complet)
- QUICK-START.md (reference rapide)
