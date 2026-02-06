# Script de Test et Diagnostic Simplifie
# Gestion Fonds DGDADPKV

param(
    [string]$ServerIP = "192.168.1.100",
    [string]$DBName = "gestion_fonds_dgdadpkv",
    [string]$DBUser = "postgres",
    [string]$DBPassword = ""
)

$ErrorActionPreference = "Continue"
$TestsPassed = 0
$TestsFailed = 0
$TestsWarning = 0

function Test-Component {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Message = ""
    )
    
    $color = "White"
    $prefix = ""
    
    switch ($Status) {
        "OK" { 
            $prefix = "[OK]"
            $color = "Green"
            $script:TestsPassed++
        }
        "FAIL" {
            $prefix = "[X]"
            $color = "Red"
            $script:TestsFailed++
        }
        "WARN" {
            $prefix = "[!]"
            $color = "Yellow"
            $script:TestsWarning++
        }
    }
    
    Write-Host "  $prefix " -NoNewline -ForegroundColor $color
    Write-Host "$Name" -NoNewline
    if ($Message) {
        Write-Host " - $Message" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DIAGNOSTIC SYSTEME - GESTION FONDS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. PREREQUIS LOGICIELS
Write-Host "1. PREREQUIS LOGICIELS" -ForegroundColor White
Write-Host ""

# PostgreSQL
try {
    $pgVersion = (psql --version 2>&1) -replace '.*?(\d+\.\d+).*','$1'
    if ([double]$pgVersion -ge 15.0) {
        Test-Component "PostgreSQL" "OK" "Version $pgVersion"
    } else {
        Test-Component "PostgreSQL" "WARN" "Version $pgVersion (recommande: 15+)"
    }
} catch {
    Test-Component "PostgreSQL" "FAIL" "Non installe"
}

# Node.js
try {
    $nodeVersion = (node --version) -replace 'v',''
    $nodeMajor = [int]($nodeVersion -split '\.')[0]
    if ($nodeMajor -ge 18) {
        Test-Component "Node.js" "OK" "Version $nodeVersion"
    } else {
        Test-Component "Node.js" "WARN" "Version $nodeVersion  (recommande: 18+)"
    }
} catch {
    Test-Component "Node.js" "FAIL" "Non installe"
}

# npm
try {
    $npmVersion = (npm --version)
    Test-Component "npm" "OK" "Version $npmVersion"
} catch {
    Test-Component "npm" "FAIL" "Non installe"
}

# Nginx
$nginxPath = "C:\nginx\nginx.exe"
if (Test-Path $nginxPath) {
    Test-Component "Nginx" "OK" "Installe dans C:\nginx"
} else {
    Test-Component "Nginx" "FAIL" "Non trouve dans C:\nginx"
}

Write-Host ""

# 2. RESEAU
Write-Host "2. RESEAU ET CONNECTIVITE" -ForegroundColor White
Write-Host ""

$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
if ($currentIP) {
    if ($currentIP -eq $ServerIP) {
        Test-Component "IP du serveur" "OK" "$currentIP"
    } else {
        Test-Component "IP du serveur" "WARN" "$currentIP (config: $ServerIP)"
    }
} else {
    Test-Component "IP du serveur" "FAIL" "Pas d'IP reseau local detectee"
}

$adapter = Get-NetAdapter | Where-Object {$_.Status -eq 'Up' -and $_.Name -notlike '*Loopback*'} | Select-Object -First 1
if ($adapter) {
    Test-Component "Carte reseau" "OK" "$($adapter.Name) - $($adapter.LinkSpeed)"
} else {
    Test-Component "Carte reseau" "FAIL" "Aucune carte active"
}

Write-Host ""

# 3. PARE-FEU
Write-Host "3. PARE-FEU WINDOWS" -ForegroundColor White
Write-Host ""

$ports = @(
    @{Port=5432; Name="PostgreSQL"},
    @{Port=54321; Name="Supabase"},
    @{Port=80; Name="HTTP"}
)

foreach ($portInfo in $ports) {
    $rules = Get-NetFirewallRule -Direction Inbound -ErrorAction SilentlyContinue | 
             Where-Object {$_.Enabled -eq $true} | 
             Get-NetFirewallPortFilter -ErrorAction SilentlyContinue | 
             Where-Object {$_.LocalPort -eq $portInfo.Port}
    
    if ($rules) {
        Test-Component "Port $($portInfo.Port) ($($portInfo.Name))" "OK" "Autorise"
    } else {
        Test-Component "Port $($portInfo.Port) ($($portInfo.Name))" "WARN" "Pas de regle"
    }
}

Write-Host ""

# 4. SERVICES
Write-Host "4. SERVICES" -ForegroundColor White
Write-Host ""

$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgService) {
    if ($pgService.Status -eq 'Running') {
        Test-Component "Service PostgreSQL" "OK" "En cours d'execution"
    } else {
        Test-Component "Service PostgreSQL" "FAIL" "Arrete"
    }
} else {
    Test-Component "Service PostgreSQL" "FAIL" "Service non trouve"
}

$nginxProcess = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
if ($nginxProcess) {
    Test-Component "Nginx" "OK" "En cours"
} else {
    Test-Component "Nginx" "WARN" "Non demarre"
}

$nodeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcess) {
    Test-Component "Node.js / Supabase" "OK" "En cours"
} else {
    Test-Component "Node.js / Supabase" "WARN" "Non demarre"
}

Write-Host ""

# 5. BASE DE DONNEES
Write-Host "5. BASE DE DONNEES" -ForegroundColor White
Write-Host ""

if (-not [string]::IsNullOrEmpty($DBPassword)) {
    $env:PGPASSWORD = $DBPassword
}

try {
    $dbList = psql -U $DBUser -h localhost -t -c "SELECT datname FROM pg_database WHERE datname='$DBName';" 2>$null
    if ($dbList -match $DBName) {
        Test-Component "Connexion PostgreSQL" "OK"
        Test-Component "Base de donnees $DBName" "OK" "Existe"
        
        $tableCount = psql -U $DBUser -h localhost -d $DBName -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" 2>$null
        if ($tableCount) {
            $tableCount = $tableCount.Trim()
            if ([int]$tableCount -gt 0) {
                Test-Component "Tables" "OK" "$tableCount tables"
            } else {
                Test-Component "Tables" "WARN" "Aucune table"
            }
        }
    } else {
        Test-Component "Connexion PostgreSQL" "OK"
        Test-Component "Base de donnees $DBName" "FAIL" "N'existe pas"
    }
} catch {
    Test-Component "Connexion PostgreSQL" "FAIL" "Impossible de se connecter"
}

Write-Host ""

# 6. FICHIERS PROJET
Write-Host "6. FICHIERS PROJET" -ForegroundColor White
Write-Host ""

$projectRoot = Split-Path $PSScriptRoot -Parent

if (Test-Path (Join-Path $projectRoot "package.json")) {
    Test-Component "package.json" "OK"
} else {
    Test-Component "package.json" "FAIL"
}

if (Test-Path (Join-Path $projectRoot "node_modules")) {
    Test-Component "node_modules" "OK" "Dependances installees"
} else {
    Test-Component "node_modules" "FAIL" "Dependances manquantes"
}

if (Test-Path (Join-Path $projectRoot "dist")) {
    Test-Component "Build (dist)" "OK" "Build existe"
} else {
    Test-Component "Build (dist)" "WARN" "Pas de build"
}

if (Test-Path (Join-Path $projectRoot ".env.production.local")) {
    Test-Component ".env.production.local" "OK"
} else {
    Test-Component ".env.production.local" "WARN" "Non cree"
}

Write-Host ""

# RESUME
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Tests reussis:     " -NoNewline
Write-Host "$TestsPassed" -ForegroundColor Green

Write-Host "  Avertissements:    " -NoNewline
Write-Host "$TestsWarning" -ForegroundColor Yellow

Write-Host "  Echecs:            " -NoNewline
Write-Host "$TestsFailed" -ForegroundColor Red

Write-Host ""

if ($TestsFailed -gt 0) {
    Write-Host "[X] ATTENTION: Des elements essentiels sont manquants!" -ForegroundColor Red
    Write-Host ""
    Write-Host "PROCHAINE ETAPE: Installez les prerequis manquants" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Node.js: https://nodejs.org/" -ForegroundColor White
    Write-Host "  3. Nginx: https://nginx.org/en/download.html" -ForegroundColor White
} elseif ($TestsWarning -gt 3) {
    Write-Host "[!] Configuration incomplete" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "PROCHAINE ETAPE: Executez le setup automatique" -ForegroundColor Yellow
    Write-Host "  .\scripts\setup-production-local.ps1" -ForegroundColor White
} else {
    Write-Host "[OK] Configuration correcte!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PROCHAINE ETAPE: Demarrer les services" -ForegroundColor Cyan
    Write-Host "  URL: http://$currentIP" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""

$env:PGPASSWORD = $null
