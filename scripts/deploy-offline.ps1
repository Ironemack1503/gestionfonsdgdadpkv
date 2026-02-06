# Deploy Offline - Script de Deploiement Hors-Ligne
# Gestion Fonds DGDADPKV
# Pour deployer sur n'importe quel reseau sans Internet

param(
    [string]$ServerIP = "",
    [string]$DBPassword = "",
    [string]$DBName = "gestion_fonds_dgdadpkv",
    [string]$DBUser = "postgres"
)

$ErrorActionPreference = "Continue"
$ProjectPath = Get-Location

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DEPLOIEMENT HORS-LIGNE" -ForegroundColor Cyan
Write-Host "  Gestion Fonds DGDADPKV" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Ajouter PostgreSQL au PATH
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"

# 1. DETECTER IP
Write-Host "[1/6] Detection de la configuration..." -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrEmpty($ServerIP)) {
    $ips = @(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object -ExpandProperty IPAddress)
    
    if ($ips.Count -eq 1) {
        $ServerIP = $ips[0]
        Write-Host "  [OK] IP detectee: $ServerIP" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "  Plusieurs IPs detected:" -ForegroundColor Yellow
        for ($i = 0; $i -lt $ips.Count; $i++) {
            Write-Host "    $($i+1) : $($ips[$i])" -ForegroundColor Gray
        }
        $choice = Read-Host "  Selectionnez l'IP du serveur (numero)"
        $ServerIP = $ips[[int]$choice - 1]
        Write-Host "  [OK] IP selectionnee: $ServerIP" -ForegroundColor Green
    }
}

# 2. DEMANDER MOT DE PASSE
Write-Host ""
Write-Host "[2/6] Configuration base de donnees..." -ForegroundColor Cyan

if ([string]::IsNullOrEmpty($DBPassword)) {
    Write-Host "  Mot de passe PostgreSQL requis" -ForegroundColor Yellow
    $securePassword = Read-Host "  Entrez le mot de passe" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $DBPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

$env:PGPASSWORD = $DBPassword
Write-Host "  [OK] Credentiels configures" -ForegroundColor Green

# 3. CREER/RECRCER BASE DE DONNEES
Write-Host ""
Write-Host "[3/6] Creation base de donnees..." -ForegroundColor Cyan

try {
    $dbExists = psql -U $DBUser -h localhost -t -c "SELECT 1 FROM pg_database WHERE datname='$DBName'" 2>$null
    
    if ($dbExists -match "1") {
        Write-Host "  [!] Base '$DBName' existe" -ForegroundColor Yellow
        $response = Read-Host "  Voulez-vous la recreer? (O/N)"
        if ($response -eq "O" -or $response -eq "o") {
            psql -U $DBUser -h localhost -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DBName' AND pid <> pg_backend_pid();" 2>$null | Out-Null
            dropdb -U $DBUser -h localhost $DBName 2>$null
            createdb -U $DBUser -h localhost $DBName 2>$null
            Write-Host "  [OK] Base recreee" -ForegroundColor Green
        } else {
            Write-Host "  [OK] Base conservee" -ForegroundColor Green
        }
    } else {
        createdb -U $DBUser -h localhost $DBName 2>$null
        Write-Host "  [OK] Base creee" -ForegroundColor Green
    }
} catch {
    Write-Host "  [X] Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Assurez-vous que PostgreSQL est demarrre!" -ForegroundColor Yellow
    exit 1
}

# 4. APPLIQUER MIGRATIONS
Write-Host ""
Write-Host "[4/6] Application des migrations SQL..." -ForegroundColor Cyan

$migrationsPath = Join-Path $ProjectPath "supabase\migrations"
if (Test-Path $migrationsPath) {
    $migrationFiles = Get-ChildItem $migrationsPath -Filter "*.sql" | Sort-Object Name
    
    if ($migrationFiles.Count -gt 0) {
        Write-Host "  $($migrationFiles.Count) migrations trouvees" -ForegroundColor Gray
        
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
    Write-Host "  [!] Dossier supabase/migrations non trouve" -ForegroundColor Yellow
}

# 5. CREER FICHIER .env
Write-Host ""
Write-Host "[5/6] Configuration environnement..." -ForegroundColor Cyan

$envContent = @"
# Configuration Production Hors-Ligne
# Generee le $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

VITE_SUPABASE_URL=http://${ServerIP}:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

DATABASE_URL=postgresql://${DBUser}:${DBPassword}@${ServerIP}:5432/${DBName}

NODE_ENV=production
VITE_LOCAL_MODE=true
VITE_SERVER_IP=${ServerIP}
"@

$envFile = Join-Path $ProjectPath ".env.production.local"
$envContent | Out-File -FilePath $envFile -Encoding UTF8 -Force
Write-Host "  [OK] Fichier .env cree" -ForegroundColor Green

# 6. CONFIGURATION NGINX
Write-Host ""
Write-Host "[6/6] Configuration Nginx..." -ForegroundColor Cyan

$nginxConfPath = "C:\nginx\conf\nginx.conf"
if (Test-Path $nginxConfPath) {
    # Remplacer les chemins
    $content = Get-Content $nginxConfPath -Raw
    
    # Mettre a jour le chemin du projet
    $distPath = $ProjectPath -replace '\\', '/'
    $content = $content -replace 'root\s+C:/Users/Congo/Downloads/gestionfondsdgdadpkv-main/gestionfondsdgdadpkv-main/dist;', "root   $distPath/dist;"
    
    # Mettre a jour l'IP
    $content = $content -replace 'server_name\s+\d+\.\d+\.\d+\.\d+', "server_name  $ServerIP"
    
    # Sauvegarder
    $content | Set-Content $nginxConfPath -Encoding UTF8 -Force
    
    # Tester
    $result = & C:\nginx\nginx.exe -t 2>&1
    if ($result -match "successful") {
        Write-Host "  [OK] Configuration Nginx validee" -ForegroundColor Green
    } else {
        Write-Host "  [!] Erreur config Nginx - verifier manuellement" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [!] Nginx non trouve dans C:\nginx" -ForegroundColor Yellow
}

# RESUME
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  DEPLOIEMENT TERMINE !" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Write-Host "CONFIGURATION APPLIQUEE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  IP Serveur:         $ServerIP" -ForegroundColor White
Write-Host "  Base de donnees:    $DBName" -ForegroundColor White
Write-Host "  Dossier projet:     $ProjectPath" -ForegroundColor White
Write-Host "  Build (dist):       $ProjectPath\dist" -ForegroundColor White
Write-Host ""

Write-Host "ETAPES SUIVANTES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Demarrer les services:" -ForegroundColor White
Write-Host "   cd C:\nginx" -ForegroundColor Gray
Write-Host "   start nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "   Le service PostgreSQL devrait deja etre actif" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Acceder a l'application:" -ForegroundColor White
Write-Host "   http://$ServerIP" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Creer le compte administrateur initial" -ForegroundColor White
Write-Host ""

Write-Host "COMMANDES UTILES:" -ForegroundColor Gray
Write-Host ""
Write-Host "   Tester config Nginx:" -ForegroundColor Gray
Write-Host "   cd C:\nginx; .\nginx.exe -t" -ForegroundColor Gray
Write-Host ""
Write-Host "   Redemarrer Nginx:" -ForegroundColor Gray
Write-Host "   C:\nginx\nginx.exe -s stop; start C:\nginx\nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "   Sauvegarde DB:" -ForegroundColor Gray
Write-Host '   $env:PGPASSWORD="motdepasse"; pg_dump -U postgres gestion_fonds_dgdadpkv > backup.sql' -ForegroundColor Gray
Write-Host ""

Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Nettoyer
$env:PGPASSWORD = $null
