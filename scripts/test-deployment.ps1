# ========================================
# Script de Test et Diagnostic
# Gestion Fonds DGDADPKV
# Vérifie que tout est correctement installé
# ========================================

param(
    [string]$ServerIP = "192.168.1.100",
    [string]$DBName = "gestion_fonds_dgdadpkv",
    [string]$DBUser = "postgres",
    [string]$DBPassword = ""
)

$ErrorActionPreference = "Continue"
$script:TestsPassed = 0
$script:TestsFailed = 0
$script:TestsWarning = 0

function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Status,  # SUCCESS, FAIL, WARNING
        [string]$Message = ""
    )
    
    $icon = switch ($Status) {
        "SUCCESS" { "[OK]"; $script:TestsPassed++; $color = "Green" }
        "FAIL"    { "[X]"; $script:TestsFailed++; $color = "Red" }
        "WARNING" { "[!]"; $script:TestsWarning++; $color = "Yellow" }
    }
    
    Write-Host "  $icon " -NoNewline -ForegroundColor $color
    Write-Host "$TestName" -NoNewline
    if ($Message) {
        Write-Host " - " -NoNewline -ForegroundColor Gray
        Write-Host $Message -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║        DIAGNOSTIC SYSTÈME - GESTION FONDS DGDADPKV        ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ========================================
# 1. PRÉREQUIS LOGICIELS
# ========================================
Write-Host "┌─ 1. PRÉREQUIS LOGICIELS ────────────────────────────────┐" -ForegroundColor White
Write-Host ""

# PostgreSQL
try {
    $pgVersion = (psql --version 2>&1) -replace '.*?(\d+\.\d+).*','$1'
    if ([double]$pgVersion -ge 15.0) {
        Write-TestResult "PostgreSQL" "SUCCESS" "Version $pgVersion"
    } else {
        Write-TestResult "PostgreSQL" "WARNING" "Version $pgVersion (recommandé: 15+)"
    }
} catch {
    Write-TestResult "PostgreSQL" "FAIL" "Non installé"
}

# Node.js
try {
    $nodeVersion = (node --version) -replace 'v',''
    $nodeMajor = [int]($nodeVersion -split '\.')[0]
    if ($nodeMajor -ge 18) {
        Write-TestResult "Node.js" "SUCCESS" "Version $nodeVersion"
    } else {
        Write-TestResult "Node.js" "WARNING" "Version $nodeVersion (recommandé: 18+)"
    }
} catch {
    Write-TestResult "Node.js" "FAIL" "Non installé"
}

# npm ou bun
try {
    $bunVersion = (bun --version 2>$null)
    if ($bunVersion) {
        Write-TestResult "Gestionnaire de paquets" "SUCCESS" "bun $bunVersion"
    } else {
        throw
    }
} catch {
    try {
        $npmVersion = (npm --version)
        Write-TestResult "Gestionnaire de paquets" "SUCCESS" "npm $npmVersion"
    } catch {
        Write-TestResult "Gestionnaire de paquets" "FAIL" "npm/bun non installé"
    }
}

# Supabase CLI
try {
    $supabaseVersion = (supabase --version 2>&1) -replace '.*?(\d+\.\d+\.\d+).*','$1'
    Write-TestResult "Supabase CLI" "SUCCESS" "Version $supabaseVersion"
} catch {
    Write-TestResult "Supabase CLI" "WARNING" "Non installé (optionnel)"
}

# Nginx
$nginxPath = "C:\nginx\nginx.exe"
if (Test-Path $nginxPath) {
    try {
        $nginxVersion = (& $nginxPath -v 2>&1) -replace '.*?nginx/(\d+\.\d+\.\d+).*','$1'
        Write-TestResult "Nginx" "SUCCESS" "Version $nginxVersion installé"
    } catch {
        Write-TestResult "Nginx" "SUCCESS" "Installé dans C:\nginx"
    }
} else {
    Write-TestResult "Nginx" "FAIL" "Non trouvé dans C:\nginx"
}

Write-Host ""
Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""

# ========================================
# 2. RÉSEAU ET CONNECTIVITÉ
# ========================================
Write-Host "┌─ 2. RÉSEAU ET CONNECTIVITÉ ─────────────────────────────┐" -ForegroundColor White
Write-Host ""

# IP actuelle
$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
if ($currentIP) {
    if ($currentIP -eq $ServerIP) {
        Write-TestResult "IP du serveur" "SUCCESS" "$currentIP (correspond à la config)"
    } else {
        Write-TestResult "IP du serveur" "WARNING" "$currentIP (config: $ServerIP)"
    }
} else {
    Write-TestResult "IP du serveur" "FAIL" "Pas d'IP réseau local détectée"
}

# Interface réseau
$adapter = Get-NetAdapter | Where-Object {$_.Status -eq 'Up' -and $_.Name -notlike '*Loopback*'} | Select-Object -First 1
if ($adapter) {
    Write-TestResult "Carte réseau" "SUCCESS" "$($adapter.Name) - $($adapter.LinkSpeed)"
} else {
    Write-TestResult "Carte réseau" "FAIL" "Aucune carte active"
}

# Test ping localhost
$pingLocal = Test-Connection -ComputerName 127.0.0.1 -Count 1 -Quiet
if ($pingLocal) {
    Write-TestResult "Ping localhost" "SUCCESS"
} else {
    Write-TestResult "Ping localhost" "FAIL"
}

# Test ping IP serveur
if ($currentIP) {
    $pingSelf = Test-Connection -ComputerName $currentIP -Count 1 -Quiet
    if ($pingSelf) {
        Write-TestResult "Ping IP serveur" "SUCCESS"
    } else {
        Write-TestResult "Ping IP serveur" "FAIL"
    }
}

Write-Host ""
Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""

# ========================================
# 3. PARE-FEU
# ========================================
Write-Host "┌─ 3. PARE-FEU WINDOWS ────────────────────────────────────┐" -ForegroundColor White
Write-Host ""

$requiredPorts = @(
    @{Port=5432; Name="PostgreSQL"},
    @{Port=54321; Name="Supabase API"},
    @{Port=80; Name="HTTP"},
    @{Port=443; Name="HTTPS"}
)

foreach ($portInfo in $requiredPorts) {
    $rules = Get-NetFirewallRule -Direction Inbound | 
             Where-Object {$_.Enabled -eq $true} | 
             Get-NetFirewallPortFilter | 
             Where-Object {$_.LocalPort -eq $portInfo.Port}
    
    if ($rules) {
        Write-TestResult "Port $($portInfo.Port) ($($portInfo.Name))" "SUCCESS" "Autorisé"
    } else {
        Write-TestResult "Port $($portInfo.Port) ($($portInfo.Name))" "WARNING" "Pas de règle trouvée"
    }
}

Write-Host ""
Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""

# ========================================
# 4. SERVICES
# ========================================
Write-Host "┌─ 4. SERVICES ────────────────────────────────────────────┐" -ForegroundColor White
Write-Host ""

# PostgreSQL Service
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgService) {
    if ($pgService.Status -eq 'Running') {
        Write-TestResult "Service PostgreSQL" "SUCCESS" "En cours d'execution"
    } else {
        Write-TestResult "Service PostgreSQL" "FAIL" "Arrete (Status: $($pgService.Status))"
    }
} else {
    Write-TestResult "Service PostgreSQL" "FAIL" "Service non trouve"
}

# Nginx Process
$nginxProcess = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
if ($nginxProcess) {
    $nginxCount = ($nginxProcess | Measure-Object).Count
    Write-TestResult "Nginx" "SUCCESS" "$nginxCount processus en cours"
} else {
    Write-TestResult "Nginx" "FAIL" "Non demarre"
}

# Node.js / Supabase
$nodeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcess) {
    $nodeCount = ($nodeProcess | Measure-Object).Count
    Write-TestResult "Node.js / Supabase" "SUCCESS" "$nodeCount processus en cours"
} else {
    Write-TestResult "Node.js / Supabase" "WARNING" "Aucun processus Node.js detecte"
}

Write-Host ""
Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""

# ========================================
# 5. BASE DE DONNÉES
# ========================================
Write-Host "┌─ 5. BASE DE DONNÉES ─────────────────────────────────────┐" -ForegroundColor White
Write-Host ""

if (-not [string]::IsNullOrEmpty($DBPassword)) {
    $env:PGPASSWORD = $DBPassword
}

# Connexion PostgreSQL
try {
    $dbList = psql -U $DBUser -h localhost -t -c "SELECT datname FROM pg_database WHERE datname='$DBName';" 2>$null
    if ($dbList -match $DBName) {
        Write-TestResult "Connexion PostgreSQL" "SUCCESS"
        
        # Base de donnees existe
        Write-TestResult "Base de donnees $DBName" "SUCCESS" "Existe"
        
        # Compter les tables
        $tableCount = psql -U $DBUser -h localhost -d $DBName -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" 2>$null
        if ($tableCount) {
            $tableCount = $tableCount.Trim()
            if ([int]$tableCount -gt 0) {
                Write-TestResult "Tables dans $DBName" "SUCCESS" "$tableCount tables"
            } else {
                Write-TestResult "Tables dans '$DBName'" "WARNING" "Aucune table (migrations non appliquées?)"
            }
        }
        
        # Taille de la base
        $dbSize = psql -U $DBUser -h localhost -t -c "SELECT pg_size_pretty(pg_database_size('$DBName'));" 2>$null
        if ($dbSize) {
            $dbSize = $dbSize.Trim()
            Write-TestResult "Taille DB" "SUCCESS" "$dbSize"
        }
        
    } else {
        Write-TestResult "Connexion PostgreSQL" "SUCCESS"
        Write-TestResult "Base de données '$DBName'" "FAIL" "N'existe pas"
    }
} catch {
    Write-TestResult "Connexion PostgreSQL" "FAIL" "Impossible de se connecter"
}

Write-Host ""
Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""

# ========================================
# 6. FICHIERS ET STRUCTURE
# ========================================
Write-Host "┌─ 6. FICHIERS ET STRUCTURE ──────────────────────────────┐" -ForegroundColor White
Write-Host ""

$projectRoot = Split-Path $PSScriptRoot -Parent

# Package.json
$packageJson = Join-Path $projectRoot "package.json"
if (Test-Path $packageJson) {
    Write-TestResult "package.json" "SUCCESS"
} else {
    Write-TestResult "package.json" "FAIL" "Fichier manquant"
}

# node_modules
$nodeModules = Join-Path $projectRoot "node_modules"
if (Test-Path $nodeModules) {
    $modulesCount = (Get-ChildItem $nodeModules -Directory | Measure-Object).Count
    Write-TestResult "node_modules" "SUCCESS" "$modulesCount modules"
} else {
    Write-TestResult "node_modules" "FAIL" "Dépendances non installées"
}

# Build dist
$distFolder = Join-Path $projectRoot "dist"
if (Test-Path $distFolder) {
    $distFiles = Get-ChildItem $distFolder -Recurse -File
    $distSize = ($distFiles | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-TestResult "Build (dist)" "SUCCESS" "$($distFiles.Count) fichiers ($([math]::Round($distSize, 2)) MB)"
} else {
    Write-TestResult "Build (dist)" "WARNING" "Pas de build (exécuter: npm run build)"
}

# Migrations SQL
$migrationsFolder = Join-Path $projectRoot "supabase\migrations"
if (Test-Path $migrationsFolder) {
    $migrationFiles = Get-ChildItem $migrationsFolder -Filter "*.sql"
    Write-TestResult "Migrations SQL" "SUCCESS" "$($migrationFiles.Count) fichiers"
} else {
    Write-TestResult "Migrations SQL" "WARNING" "Dossier migrations non trouvé"
}

# .env
$envFile = Join-Path $projectRoot ".env.production.local"
if (Test-Path $envFile) {
    Write-TestResult "Fichier .env.production.local" "SUCCESS"
} else {
    Write-TestResult "Fichier .env.production.local" "WARNING" "Non créé"
}

# Nginx config
$nginxConf = "C:\nginx\conf\nginx.conf"
if (Test-Path $nginxConf) {
    Write-TestResult "Configuration Nginx" "SUCCESS"
} else {
    Write-TestResult "Configuration Nginx" "WARNING" "Config par défaut"
}

Write-Host ""
Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""

# ========================================
# 7. CONNECTIVITÉ WEB
# ========================================
Write-Host "┌─ 7. CONNECTIVITÉ WEB (OPTIONNEL) ───────────────────────┐" -ForegroundColor White
Write-Host ""

# Test HTTP localhost
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-TestResult "HTTP localhost" "SUCCESS" "Code $($response.StatusCode)"
    } else {
        Write-TestResult "HTTP localhost" "WARNING" "Code $($response.StatusCode)"
    }
} catch {
    Write-TestResult "HTTP localhost" "WARNING" "Pas de réponse (Nginx démarré?)"
}

# Test HTTP IP serveur
if ($currentIP) {
    try {
        $response = Invoke-WebRequest -Uri "http://$currentIP" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-TestResult "HTTP $currentIP" "SUCCESS" "Code $($response.StatusCode)"
        } else {
            Write-TestResult "HTTP $currentIP" "WARNING" "Code $($response.StatusCode)"
        }
    } catch {
        Write-TestResult "HTTP $currentIP" "WARNING" "Pas de réponse"
    }
}

# Test Supabase API
try {
    $response = Invoke-WebRequest -Uri "http://localhost:54321/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-TestResult "Supabase API (54321)" "SUCCESS" "En ligne"
} catch {
    Write-TestResult "Supabase API (54321)" "WARNING" "Pas de réponse (supabase start?)"
}

Write-Host ""
Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""

# ========================================
# RÉSUMÉ
# ========================================
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                        RÉSUMÉ                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Tests réussis:     " -NoNewline
Write-Host "$script:TestsPassed" -ForegroundColor Green

Write-Host "  Avertissements:    " -NoNewline
Write-Host "$script:TestsWarning" -ForegroundColor Yellow

Write-Host "  Échecs:            " -NoNewline
Write-Host "$script:TestsFailed" -ForegroundColor Red

Write-Host ""

# Recommandations
if ($script:TestsFailed -gt 0) {
    Write-Host "[X] ATTENTION: Des elements essentiels sont manquants!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Recommandations:" -ForegroundColor Yellow
    Write-Host "  1. Installez les prerequis manquants" -ForegroundColor White
    Write-Host "  2. Executez le script de setup: .\scripts\setup-production-local.ps1" -ForegroundColor White
    Write-Host "  3. Consultez GUIDE-DEPLOIEMENT-LOCAL.md" -ForegroundColor White
} elseif ($script:TestsWarning -gt 3) {
    Write-Host "[!] Configuration incomplete" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions suggerees:" -ForegroundColor Yellow
    Write-Host "  - Demarrer les services manquants" -ForegroundColor White
    Write-Host "  - Creer un build de production: npm run build" -ForegroundColor White
    Write-Host "  - Configurer les variables d'environnement" -ForegroundColor White
} else {
    Write-Host "[OK] Configuration correcte!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "  - Acceder a l'application: http://$currentIP" -ForegroundColor White
    Write-Host "  - Lancer le monitoring: .\scripts\monitor-server.ps1" -ForegroundColor White
    Write-Host "  - Configurer les sauvegardes: .\scripts\setup-backup-task.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Nettoyer
$env:PGPASSWORD = $null
