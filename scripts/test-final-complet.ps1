# ============================================================================
# TEST FINAL COMPLET - Validation de l infrastructure
# ============================================================================

Write-Host "======================================================================"
Write-Host "   TEST FINAL - Validation complete du deploiement            "
Write-Host "======================================================================"
Write-Host ""

$results = @{
    "PostgreSQL Service" = $false
    "PostgreSQL Port 5432" = $false
    "Nginx Process" = $false
    "Nginx Port 80" = $false
    "Database Accessible" = $false
    "HTTP Response 200" = $false
    "Build Exists" = $false
    "Config Files" = $false
}

# 1. Verifier PostgreSQL
Write-Host "TEST 1/8 PostgreSQL Service..." -ForegroundColor Gray
try {
    $postgresService = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
    if ($postgresService -and $postgresService.Status -eq "Running") {
        Write-Host "  OK PostgreSQL demarrE (State: $($postgresService.Status))" -ForegroundColor Green
        $results["PostgreSQL Service"] = $true
    } else {
        Write-Host "  X PostgreSQL ne fonctionne pas" -ForegroundColor Red
    }
} catch {
    Write-Host "  ! Erreur verification PostgreSQL: $_" -ForegroundColor Yellow
}

# 2. Verifier port PostgreSQL
Write-Host "TEST 2/8 Connectivite PostgreSQL (port 5432)..." -ForegroundColor Gray
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 5432)
    if ($tcpClient.Connected) {
        Write-Host "  OK Port 5432 accessible" -ForegroundColor Green
        $results["PostgreSQL Port 5432"] = $true
        $tcpClient.Close()
    }
} catch {
    Write-Host "  X Port 5432 inaccessible" -ForegroundColor Red
}

# 3. Verifier Nginx Process
Write-Host "TEST 3/8 Nginx Process..." -ForegroundColor Gray
try {
    $nginxProc = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
    if ($nginxProc) {
        Write-Host "  OK Nginx actif (PID: $($nginxProc.Id))" -ForegroundColor Green
        $results["Nginx Process"] = $true
    } else {
        Write-Host "  X Nginx ne fonctionne pas" -ForegroundColor Red
    }
} catch {
    Write-Host "  ! Erreur processus Nginx: $_" -ForegroundColor Yellow
}

# 4. Verifier port Nginx
Write-Host "TEST 4/8 Connectivite Nginx (port 80)..." -ForegroundColor Gray
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 80)
    if ($tcpClient.Connected) {
        Write-Host "  OK Port 80 accessible" -ForegroundColor Green
        $results["Nginx Port 80"] = $true
        $tcpClient.Close()
    }
} catch {
    Write-Host "  X Port 80 inaccessible" -ForegroundColor Red
}

# 5. Verifier base de donnees
Write-Host "TEST 5/8 Accessibilite Base de Donnees..." -ForegroundColor Gray
try {
    $env:PGPASSWORD="congo"
    $output = psql -U postgres -h localhost -d gestion_fonds_dgdadpkv -c "SELECT count(*) FROM information_schema.tables;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK Base de donnees accessible" -ForegroundColor Green
        $results["Database Accessible"] = $true
    } else {
        Write-Host "  X Base de donnees inaccessible" -ForegroundColor Red
    }
} catch {
    Write-Host "  ! Erreur base de donnees: $_" -ForegroundColor Yellow
}

# 6. Verifier HTTP 200
Write-Host "TEST 6/8 Reponse HTTP Application..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  OK Application repond HTTP 200" -ForegroundColor Green
        Write-Host "    Taille: $($response.RawContentLength) bytes" -ForegroundColor Gray
        $results["HTTP Response 200"] = $true
    } else {
        Write-Host "  X Reponse HTTP: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ! Erreur requete HTTP: $_" -ForegroundColor Yellow
}

# 7. Verifier Build
Write-Host "TEST 7/8 Build Production..." -ForegroundColor Gray
$buildPath = ".\dist"
if (Test-Path $buildPath) {
    $fileCount = (Get-ChildItem -Path $buildPath -Recurse | Measure-Object).Count
    Write-Host "  OK Build present ($fileCount fichiers)" -ForegroundColor Green
    $results["Build Exists"] = $true
} else {
    Write-Host "  X Build introuvable" -ForegroundColor Red
}

# 8. Verifier fichiers config
Write-Host "TEST 8/8 Fichiers Configuration..." -ForegroundColor Gray
$configOK = $true
$configFiles = @{
    ".env.production.local" = ".\.env.production.local"
    "nginx.conf" = "C:\nginx\conf\nginx.conf"
}

foreach ($name in $configFiles.Keys) {
    if (Test-Path $configFiles[$name]) {
        Write-Host "  OK $name existe" -ForegroundColor Green
    } else {
        Write-Host "  X $name manquant" -ForegroundColor Red
        $configOK = $false
    }
}
$results["Config Files"] = $configOK

# Resume final
Write-Host ""
Write-Host "======================================================================"
Write-Host "   RESUME DES TESTS                                           "
Write-Host "======================================================================"
Write-Host ""

$successCount = ($results.Values | Where-Object { $_ -eq $true }).Count
$totalCount = $results.Count

foreach ($test in $results.Keys) {
    $status = if ($results[$test]) { "OK" } else { "X" }
    $color = if ($results[$test]) { "Green" } else { "Red" }
    Write-Host "  $status $test" -ForegroundColor $color
}

Write-Host ""
Write-Host "======================================================================"
Write-Host "  Resultat: $successCount/$totalCount tests reussis" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host "======================================================================"

if ($successCount -eq $totalCount) {
    Write-Host ""
    Write-Host "======================================================================"
    Write-Host "  OK TOUS LES TESTS REUSSIS - APP OPERATIONNELLE                 "
    Write-Host "                                                                   "
    Write-Host "  Acces via: http://192.168.1.131 (ou http://localhost)           "
    Write-Host "  Creez un compte administrateur via l interface web!             "
    Write-Host "======================================================================"
    exit 0
} else {
    Write-Host ""
    Write-Host "  ! Certains tests ont echoue - Consultez les details ci-dessus"
    exit 1
}
