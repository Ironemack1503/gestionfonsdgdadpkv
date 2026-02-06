# Setup Production Local - Version Simplifiee
# Gestion Fonds DGDADPKV

param(
    [string]$ServerIP = "192.168.1.131",
    [string]$DBPassword = "",
    [string]$DBName = "gestion_fonds_dgdadpkv",
    [string]$DBUser = "postgres"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SETUP PRODUCTION RESEAU LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ajouter PostgreSQL au PATH
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"

# 1. VERIFICATION DES PREREQUIS
Write-Host "[1/7] Verification des prerequis..." -ForegroundColor Cyan

try {
    psql --version | Out-Null
    Write-Host "  [OK] PostgreSQL" -ForegroundColor Green
} catch {
    Write-Host "  [X] PostgreSQL manquant!" -ForegroundColor Red
    exit 1
}

try {
    node --version | Out-Null
    Write-Host "  [OK] Node.js" -ForegroundColor Green
} catch {
    Write-Host "  [X] Node.js manquant!" -ForegroundColor Red
    exit 1
}

if (Test-Path "C:\nginx\nginx.exe") {
    Write-Host "  [OK] Nginx" -ForegroundColor Green
} else {
    Write-Host "  [X] Nginx manquant!" -ForegroundColor Red
    exit 1
}

# 2. MOT DE PASSE
Write-Host ""
Write-Host "[2/7] Configuration base de donnees..." -ForegroundColor Cyan

if ([string]::IsNullOrEmpty($DBPassword)) {
    $securePassword = Read-Host "Entrez mot de passe PostgreSQL" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $DBPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

$env:PGPASSWORD = $DBPassword

# 3. CONFIGURATION PARE-FEU
Write-Host ""
Write-Host "[3/7] Configuration du pare-feu..." -ForegroundColor Cyan

$firewallRules = @(
    @{Name="PostgreSQL Server Gestion Fonds"; Port=5432},
    @{Name="Supabase API Gestion Fonds"; Port=54321},
    @{Name="HTTP Web Gestion Fonds"; Port=80}
)

foreach ($rule in $firewallRules) {
    $existingRule = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existingRule) {
        Write-Host "  [OK] Regle existe: $($rule.Name)" -ForegroundColor Gray
    } else {
        try {
            New-NetFirewallRule -DisplayName $rule.Name `
                                -Direction Inbound `
                                -Action Allow `
                                -Protocol TCP `
                                -LocalPort $rule.Port `
                                -ErrorAction Stop | Out-Null
            Write-Host "  [OK] Regle creee: $($rule.Name)" -ForegroundColor Green
        } catch {
            Write-Host "  [!] Non-admin: Impossible de creer regle $($rule.Name)" -ForegroundColor Yellow
        }
    }
}

# 4. CREER LA BASE DE DONNEES
Write-Host ""
Write-Host "[4/7] Creation de la base de donnees..." -ForegroundColor Cyan

$dbExists = psql -U $DBUser -h localhost -tc "SELECT 1 FROM pg_database WHERE datname='$DBName'" 2>$null

if ($dbExists -match "1") {
    Write-Host "  [!] Base '$DBName' existe deja" -ForegroundColor Yellow
    $response = Read-Host "  Supprimer et recreer? (O/N)"
    if ($response -eq "O" -or $response -eq "o") {
        psql -U $DBUser -h localhost -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DBName' AND pid <> pg_backend_pid();" 2>$null | Out-Null
        dropdb -U $DBUser -h localhost $DBName 2>$null
        createdb -U $DBUser -h localhost $DBName
        Write-Host "  [OK] Base recreee" -ForegroundColor Green
    }
} else {
    createdb -U $DBUser -h localhost $DBName
    Write-Host "  [OK] Base '$DBName' creee" -ForegroundColor Green
}

# 5. APPLIQUER LES MIGRATIONS
Write-Host ""
Write-Host "[5/7] Application des migrations SQL..." -ForegroundColor Cyan

$migrationsPath = Join-Path $PSScriptRoot "..\supabase\migrations"
if (Test-Path $migrationsPath) {
    $migrationFiles = Get-ChildItem $migrationsPath -Filter "*.sql" | Sort-Object Name
    
    if ($migrationFiles.Count -gt 0) {
        foreach ($migration in $migrationFiles) {
            try {
                psql -U $DBUser -h localhost -d $DBName -f $migration.FullName -q 2>$null
                Write-Host "  [OK] $($migration.Name)" -ForegroundColor Green
            } catch {
                Write-Host "  [!] Erreur: $($migration.Name)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  [!] Aucune migration trouvee" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [!] Dossier migrations non trouve" -ForegroundColor Yellow
}

# 6. INSTALLER LES DEPENDANCES
Write-Host ""
Write-Host "[6/7] Installation des dependances..." -ForegroundColor Cyan

$projectRoot = Split-Path $PSScriptRoot -Parent
Push-Location $projectRoot

if (Test-Path "package.json") {
    Write-Host "  Installation en cours (peut prendre 2-5 min)..." -ForegroundColor Gray
    npm install 2>&1 | Out-Null
    Write-Host "  [OK] Dependances installees" -ForegroundColor Green
} else {
    Write-Host "  [X] package.json non trouve!" -ForegroundColor Red
}

# 7. BUILD DE PRODUCTION
Write-Host ""
Write-Host "[7/7] Build de production..." -ForegroundColor Cyan

Write-Host "  Build en cours (peut prendre 1-3 min)..." -ForegroundColor Gray
npm run build 2>&1 | Out-Null

if (Test-Path "dist") {
    Write-Host "  [OK] Build termine" -ForegroundColor Green
} else {
    Write-Host "  [X] Build echoue!" -ForegroundColor Red
}

# CREER FICHIER .env
$envContent = @"
# Configuration Production Reseau Local
# Genere le $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

VITE_SUPABASE_URL=http://${ServerIP}:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

DATABASE_URL=postgresql://${DBUser}:${DBPassword}@${ServerIP}:5432/${DBName}

NODE_ENV=production
VITE_LOCAL_MODE=true
VITE_SERVER_IP=${ServerIP}
"@

$envFile = Join-Path $projectRoot ".env.production.local"
$envContent | Out-File -FilePath $envFile -Encoding UTF8
Write-Host "  [OK] Fichier .env cree" -ForegroundColor Green

Pop-Location

# NETTOYER
$env:PGPASSWORD = $null

# RESUME
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   SETUP TERMINE AVEC SUCCES!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "RESUME DE LA CONFIGURATION:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  - IP Serveur:       $ServerIP" -ForegroundColor White
Write-Host "  - Base de donnees:  $DBName" -ForegroundColor White
Write-Host "  - PostgreSQL Port:  5432" -ForegroundColor White
Write-Host "  - Build:            dist/" -ForegroundColor White
Write-Host ""

Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copier la config Nginx:" -ForegroundColor White
Write-Host "   Copy-Item .\scripts\nginx.conf C:\nginx\conf\nginx.conf" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Demarrer Nginx:" -ForegroundColor White
Write-Host "   cd C:\nginx" -ForegroundColor Gray
Write-Host "   start nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Acceder a l'application:" -ForegroundColor White
Write-Host "   http://$ServerIP" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. (Optionnel) Configurer sauvegardes:" -ForegroundColor White
Write-Host "   .\scripts\setup-backup-task.ps1" -ForegroundColor Gray
Write-Host ""

Write-Host "[OK] Setup termine!" -ForegroundColor Green
