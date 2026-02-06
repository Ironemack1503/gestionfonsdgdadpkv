# ========================================
# Script de Setup Production pour Réseau Local
# Gestion Fonds DGDADPKV
# ========================================

param(
    [string]$ServerIP = "192.168.1.100",
    [string]$DBPassword = "",
    [string]$DBName = "gestion_fonds_dgdadpkv",
    [string]$DBUser = "postgres"
)

$ErrorActionPreference = "Stop"

# Couleurs pour l'affichage
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "✗ $args" -ForegroundColor Red }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SETUP PRODUCTION RÉSEAU LOCAL" -ForegroundColor Cyan
Write-Host "   Gestion Fonds DGDADPKV" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# 1. VÉRIFICATION DES PRÉREQUIS
# ========================================
Write-Info "Étape 1/8: Vérification des prérequis..."

# Vérifier PostgreSQL
try {
    $pgVersion = psql --version
    Write-Success "PostgreSQL installé: $pgVersion"
} catch {
    Write-Error "PostgreSQL non installé!"
    Write-Host "Téléchargez depuis: https://www.postgresql.org/download/windows/"
    exit 1
}

# Vérifier Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js installé: $nodeVersion"
} catch {
    Write-Error "Node.js non installé!"
    Write-Host "Téléchargez depuis: https://nodejs.org/"
    exit 1
}

# Vérifier npm ou bun
$packageManager = "npm"
try {
    bun --version | Out-Null
    $packageManager = "bun"
    Write-Success "Gestionnaire de paquets: bun"
} catch {
    try {
        npm --version | Out-Null
        Write-Success "Gestionnaire de paquets: npm"
    } catch {
        Write-Error "Aucun gestionnaire de paquets trouvé!"
        exit 1
    }
}

# Demander le mot de passe DB si non fourni
if ([string]::IsNullOrEmpty($DBPassword)) {
    $securePassword = Read-Host "Entrez le mot de passe PostgreSQL" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $DBPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# ========================================
# 2. CONFIGURATION RÉSEAU
# ========================================
Write-Info "Étape 2/8: Configuration réseau..."

# Obtenir l'IP actuelle
$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress

if ($currentIP -ne $ServerIP) {
    Write-Warning "IP actuelle: $currentIP"
    Write-Warning "IP configurée: $ServerIP"
    $response = Read-Host "Voulez-vous continuer avec l'IP actuelle? (O/N)"
    if ($response -eq "O" -or $response -eq "o") {
        $ServerIP = $currentIP
        Write-Info "Utilisation de l'IP: $ServerIP"
    }
}

Write-Success "IP du serveur: $ServerIP"

# ========================================
# 3. CONFIGURATION PARE-FEU
# ========================================
Write-Info "Étape 3/8: Configuration du pare-feu..."

$firewallRules = @(
    @{Name="PostgreSQL Server"; Port=5432},
    @{Name="Supabase API"; Port=54321},
    @{Name="HTTP Web Server"; Port=80},
    @{Name="HTTPS Web Server"; Port=443}
)

foreach ($rule in $firewallRules) {
    $existingRule = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existingRule) {
        Write-Success "Règle pare-feu existe déjà: $($rule.Name)"
    } else {
        try {
            New-NetFirewallRule -DisplayName $rule.Name `
                                -Direction Inbound `
                                -Action Allow `
                                -Protocol TCP `
                                -LocalPort $rule.Port `
                                -ErrorAction Stop | Out-Null
            Write-Success "Règle pare-feu créée: $($rule.Name) (Port $($rule.Port))"
        } catch {
            Write-Warning "Impossible de créer la règle: $($rule.Name) - Exécutez en tant qu'administrateur"
        }
    }
}

# ========================================
# 4. CRÉATION BASE DE DONNÉES
# ========================================
Write-Info "Étape 4/8: Configuration de la base de données..."

$env:PGPASSWORD = $DBPassword

# Vérifier si la base existe
$dbExists = psql -U $DBUser -h localhost -tc "SELECT 1 FROM pg_database WHERE datname='$DBName'" 2>$null

if ($dbExists -match "1") {
    Write-Warning "La base de données '$DBName' existe déjà"
    $response = Read-Host "Voulez-vous la supprimer et la recréer? (O/N)"
    if ($response -eq "O" -or $response -eq "o") {
        # Terminer les connexions actives
        psql -U $DBUser -h localhost -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DBName' AND pid <> pg_backend_pid();" 2>$null
        dropdb -U $DBUser -h localhost $DBName 2>$null
        Write-Success "Base de données supprimée"
    } else {
        Write-Info "Conservation de la base existante"
        $skipDBCreation = $true
    }
}

if (-not $skipDBCreation) {
    createdb -U $DBUser -h localhost $DBName
    Write-Success "Base de données '$DBName' créée"
}

# ========================================
# 5. APPLIQUER LES MIGRATIONS
# ========================================
Write-Info "Étape 5/8: Application des migrations..."

$migrationsPath = Join-Path $PSScriptRoot "..\supabase\migrations"
$migrationFiles = Get-ChildItem $migrationsPath -Filter "*.sql" | Sort-Object Name

if ($migrationFiles.Count -eq 0) {
    Write-Warning "Aucune migration trouvée dans $migrationsPath"
} else {
    foreach ($migration in $migrationFiles) {
        try {
            psql -U $DBUser -h localhost -d $DBName -f $migration.FullName -q
            Write-Success "Migration appliquée: $($migration.Name)"
        } catch {
            Write-Error "Erreur lors de l'application de: $($migration.Name)"
            Write-Host $_.Exception.Message
        }
    }
}

# Appliquer les seeds si demandé
$applySeed = Read-Host "Voulez-vous appliquer les données de seed? (O/N)"
if ($applySeed -eq "O" -or $applySeed -eq "o") {
    $seedFile = Join-Path $PSScriptRoot "seed-local.sql"
    if (Test-Path $seedFile) {
        psql -U $DBUser -h localhost -d $DBName -f $seedFile
        Write-Success "Données de seed appliquées"
    } else {
        Write-Warning "Fichier seed-local.sql non trouvé"
    }
}

# ========================================
# 6. INSTALLATION DES DÉPENDANCES
# ========================================
Write-Info "Étape 6/8: Installation des dépendances..."

$projectRoot = Split-Path $PSScriptRoot -Parent
Push-Location $projectRoot

if ($packageManager -eq "bun") {
    bun install
} else {
    npm install
}

Write-Success "Dépendances installées"

# ========================================
# 7. CONFIGURATION ENVIRONNEMENT
# ========================================
Write-Info "Étape 7/8: Configuration des variables d'environnement..."

# Créer le fichier .env.production.local
$envContent = @"
# Configuration Production Réseau Local
# Généré automatiquement le $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# URL du serveur
VITE_SUPABASE_URL=http://${ServerIP}:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Base de données
DATABASE_URL=postgresql://${DBUser}:${DBPassword}@${ServerIP}:5432/${DBName}

# Mode production
NODE_ENV=production

# JWT Secret (IMPORTANT: Changer en production)
JWT_SECRET=super-secret-jwt-token-changez-moi-en-production

# Configuration locale
VITE_LOCAL_MODE=true
VITE_SERVER_IP=${ServerIP}
"@

$envFile = Join-Path $projectRoot ".env.production.local"
$envContent | Out-File -FilePath $envFile -Encoding UTF8
Write-Success "Fichier .env.production.local créé"

# ========================================
# 8. BUILD DE PRODUCTION
# ========================================
Write-Info "Étape 8/8: Build de production..."

if ($packageManager -eq "bun") {
    bun run build
} else {
    npm run build
}

Write-Success "Build de production terminé"

$distPath = Join-Path $projectRoot "dist"
Write-Info "Fichiers générés dans: $distPath"

Pop-Location

# ========================================
# RÉSUMÉ & PROCHAINES ÉTAPES
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   SETUP TERMINÉ AVEC SUCCÈS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 RÉSUMÉ DE LA CONFIGURATION:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  • IP Serveur:           $ServerIP" -ForegroundColor White
Write-Host "  • Base de données:      $DBName" -ForegroundColor White
Write-Host "  • PostgreSQL Port:      5432" -ForegroundColor White
Write-Host "  • Supabase API Port:    54321" -ForegroundColor White
Write-Host "  • Dossier build:        $distPath" -ForegroundColor White
Write-Host ""

Write-Host "🚀 PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Démarrer Supabase:" -ForegroundColor White
Write-Host "   supabase start" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Installer et configurer Nginx:" -ForegroundColor White
Write-Host "   - Télécharger: https://nginx.org/en/download.html" -ForegroundColor Gray
Write-Host "   - Extraire dans C:\nginx" -ForegroundColor Gray
Write-Host "   - Copier: .\scripts\nginx.conf vers C:\nginx\conf\" -ForegroundColor Gray
Write-Host "   - Démarrer: cd C:\nginx && start nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Créer un utilisateur admin:" -ForegroundColor White
Write-Host "   - Via l'interface web: http://$ServerIP" -ForegroundColor Gray
Write-Host "   - Ou via SQL avec pgAdmin" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Configurer les clients:" -ForegroundColor White
Write-Host "   - URL d'accès: http://$ServerIP" -ForegroundColor Gray
Write-Host "   - Navigateurs: Chrome, Edge, Firefox (dernières versions)" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Configurer les sauvegardes:" -ForegroundColor White
Write-Host "   .\scripts\setup-backup-task.ps1" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 DOCUMENTATION:" -ForegroundColor Cyan
Write-Host "   Consultez GUIDE-DEPLOIEMENT-LOCAL.md pour plus de détails" -ForegroundColor White
Write-Host ""

Write-Host "✓ Setup terminé!" -ForegroundColor Green
