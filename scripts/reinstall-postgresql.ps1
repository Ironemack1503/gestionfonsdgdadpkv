# ============================================================================
# REINSTALLATION COMPLETE POSTGRESQL
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REINSTALLATION POSTGRESQL 18" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Arrêter tous les processus
Write-Host "[1/6] Arret des processus PostgreSQL..." -ForegroundColor Yellow
Get-Process postgres -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "      OK" -ForegroundColor Green

# 2. Sauvegarder les scripts SQL existants
Write-Host "[2/6] Sauvegarde des scripts SQL..." -ForegroundColor Yellow
$backupDir = "C:\temp\postgres_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
Copy-Item "C:\Users\Congo\Downloads\gestionfondsdgdadpkv-main\gestionfondsdgdadpkv-main\supabase\migrations\*" -Destination $backupDir -Force -ErrorAction SilentlyContinue
Write-Host "      Sauvegarde dans: $backupDir" -ForegroundColor Gray
Write-Host "      OK" -ForegroundColor Green

# 3. Supprimer le répertoire data
Write-Host "[3/6] Suppression du repertoire data corrompu..." -ForegroundColor Yellow
Remove-Item "C:\Program Files\PostgreSQL\18\data" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -Path "C:\Program Files\PostgreSQL\18\data" -ItemType Directory -Force | Out-Null
Write-Host "      OK" -ForegroundColor Green

# 4. Initialiser nouvelle base de données
Write-Host "[4/6] Initialisation nouvelle base de donnees..." -ForegroundColor Yellow
Write-Host "      Mot de passe par defaut: admin123" -ForegroundColor Gray

# Créer fichier mot de passe
$passwordFile = "C:\temp\pgpass_init.txt"
"admin123" | Out-File -FilePath $passwordFile -Encoding ASCII -NoNewline

# Initialiser
$initResult = &'C:\Program Files\PostgreSQL\18\bin\initdb.exe' `
    -D "C:\Program Files\PostgreSQL\18\data" `
    -U postgres `
    --pwfile=$passwordFile `
    --encoding=UTF8 `
    --locale=C `
    -A md5 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "      OK Base initialisee" -ForegroundColor Green
} else {
    Write-Host "      ERREUR lors de l'initialisation" -ForegroundColor Red
    Write-Host $initResult
    exit 1
}

# Nettoyer le fichier mot de passe
Remove-Item $passwordFile -Force -ErrorAction SilentlyContinue

# 5. Configurer pg_hba.conf pour réseau local
Write-Host "[5/6] Configuration acces reseau..." -ForegroundColor Yellow
$pgHbaPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$pgHbaContent = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
host    all             all             192.168.1.0/24          md5
"@
$pgHbaContent | Out-File -FilePath $pgHbaPath -Encoding UTF8
Write-Host "      OK Acces reseau configure" -ForegroundColor Green

# Configurer postgresql.conf
Write-Host "      Configuration postgresql.conf..." -ForegroundColor Gray
$pgConfPath = "C:\Program Files\PostgreSQL\18\data\postgresql.conf"
$confContent = Get-Content $pgConfPath
$confContent = $confContent -replace "#listen_addresses = 'localhost'", "listen_addresses = '*'"
$confContent = $confContent -replace "#port = 5432", "port = 5432"
$confContent | Set-Content $pgConfPath
Write-Host "      OK" -ForegroundColor Green

# 6. Démarrer PostgreSQL
Write-Host "[6/6] Demarrage PostgreSQL..." -ForegroundColor Yellow
$startResult = &'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' `
    -D "C:\Program Files\PostgreSQL\18\data" `
    -l "C:\temp\postgresql_startup.log" `
    start 2>&1

Start-Sleep -Seconds 5

# Test connexion
$env:PGPASSWORD = "admin123"
$testResult = &'C:\Program Files\PostgreSQL\18\bin\psql.exe' `
    -U postgres `
    -h localhost `
    -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "      OK PostgreSQL demarre et accessible" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SUCCES - PostgreSQL reinstalle" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "IDENTIFIANTS:" -ForegroundColor Cyan
    Write-Host "  User: postgres" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "PROCHAINE ETAPE:" -ForegroundColor Yellow
    Write-Host "  1. Executer: .\scripts\setup-simple.ps1" -ForegroundColor White
    Write-Host "  2. Utiliser le mot de passe: admin123" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "      ERREUR connexion" -ForegroundColor Red
    Write-Host $testResult
    exit 1
}
