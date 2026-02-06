# ========================================
# Script de Monitoring Serveur en Temps Réel
# Gestion Fonds DGDADPKV
# ========================================

param(
    [int]$RefreshInterval = 5,  # Secondes entre chaque rafraîchissement
    [string]$DBName = "gestion_fonds_dgdadpkv",
    [string]$DBUser = "postgres",
    [string]$DBPassword = ""
)

function Get-ColorForValue {
    param([double]$Value, [double]$Warning = 70, [double]$Critical = 90)
    
    if ($Value -ge $Critical) { return "Red" }
    elseif ($Value -ge $Warning) { return "Yellow" }
    else { return "Green" }
}

function Get-ServiceStatus {
    param([string]$ServiceName)
    
    $service = Get-Service $ServiceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        return @{Status = "✓ ACTIF"; Color = "Green"}
    } else {
        return @{Status = "✗ INACTIF"; Color = "Red"}
    }
}

function Get-ProcessStatus {
    param([string]$ProcessName)
    
    $process = Get-Process $ProcessName -ErrorAction SilentlyContinue
    if ($process) {
        $cpu = ($process | Measure-Object -Property CPU -Sum).Sum
        $mem = ($process | Measure-Object -Property WorkingSet -Sum).Sum / 1MB
        return @{
            Status = "✓ ACTIF"
            Color = "Green"
            CPU = [math]::Round($cpu, 2)
            Memory = [math]::Round($mem, 0)
        }
    } else {
        return @{Status = "✗ INACTIF"; Color = "Red"; CPU = 0; Memory = 0}
    }
}

# Mot de passe DB si fourni
if (-not [string]::IsNullOrEmpty($DBPassword)) {
    $env:PGPASSWORD = $DBPassword
}

Write-Host "Monitoring démarré - Appuyez sur Ctrl+C pour quitter" -ForegroundColor Cyan
Write-Host "Rafraîchissement toutes les $RefreshInterval secondes" -ForegroundColor Gray
Write-Host ""

while ($true) {
    try {
        Clear-Host
        
        $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        # ========================================
        # HEADER
        # ========================================
        Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
        Write-Host "║    MONITORING SERVEUR - GESTION FONDS DGDADPKV             ║" -ForegroundColor Cyan
        Write-Host "║    $now                                       ║" -ForegroundColor Cyan
        Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
        Write-Host ""
        
        # ========================================
        # SYSTÈME
        # ========================================
        Write-Host "┌─ SYSTÈME ────────────────────────────────────────────────┐" -ForegroundColor White
        
        # CPU
        $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue | 
               Select-Object -ExpandProperty CounterSamples | 
               Select-Object -ExpandProperty CookedValue
        $cpuColor = Get-ColorForValue -Value $cpu
        Write-Host "  CPU:           " -NoNewline
        Write-Host "$([math]::Round($cpu, 1))%" -ForegroundColor $cpuColor
        
        # RAM
        $totalRAM = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB
        $availableRAM = Get-Counter '\Memory\Available MBytes' -ErrorAction SilentlyContinue | 
                        Select-Object -ExpandProperty CounterSamples | 
                        Select-Object -ExpandProperty CookedValue
        $usedRAM = $totalRAM - ($availableRAM / 1024)
        $ramPercent = ($usedRAM / $totalRAM) * 100
        $ramColor = Get-ColorForValue -Value $ramPercent
        Write-Host "  RAM:           " -NoNewline
        Write-Host "$([math]::Round($usedRAM, 1)) / $([math]::Round($totalRAM, 1)) GB ($([math]::Round($ramPercent, 1))%)" -ForegroundColor $ramColor
        
        # Disque
        $disk = Get-PSDrive C | Select-Object Used, Free
        $totalDisk = ($disk.Used + $disk.Free) / 1GB
        $usedDisk = $disk.Used / 1GB
        $diskPercent = ($usedDisk / $totalDisk) * 100
        $diskColor = Get-ColorForValue -Value $diskPercent
        Write-Host "  Disque C:      " -NoNewline
        Write-Host "$([math]::Round($usedDisk, 1)) / $([math]::Round($totalDisk, 1)) GB ($([math]::Round($diskPercent, 1))%)" -ForegroundColor $diskColor
        
        # Réseau
        $networkAdapters = Get-NetAdapter | Where-Object {$_.Status -eq 'Up' -and $_.Name -notlike '*Loopback*'}
        if ($networkAdapters) {
            $mainAdapter = $networkAdapters[0]
            $ip = (Get-NetIPAddress -InterfaceIndex $mainAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
            Write-Host "  IP:            " -NoNewline
            Write-Host "$ip" -ForegroundColor Green
            Write-Host "  Carte réseau:  " -NoNewline
            Write-Host "$($mainAdapter.Name) [$($mainAdapter.LinkSpeed)]" -ForegroundColor Green
        }
        
        Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
        Write-Host ""
        
        # ========================================
        # SERVICES
        # ========================================
        Write-Host "┌─ SERVICES ───────────────────────────────────────────────┐" -ForegroundColor White
        
        # PostgreSQL
        $pgStatus = Get-ServiceStatus -ServiceName "postgresql*"
        Write-Host "  PostgreSQL:    " -NoNewline
        Write-Host $pgStatus.Status -ForegroundColor $pgStatus.Color
        
        # Nginx
        $nginxStatus = Get-ProcessStatus -ProcessName "nginx"
        Write-Host "  Nginx:         " -NoNewline
        Write-Host $nginxStatus.Status -ForegroundColor $nginxStatus.Color
        if ($nginxStatus.Status -eq "✓ ACTIF") {
            Write-Host "                 CPU: $($nginxStatus.CPU)s | RAM: $($nginxStatus.Memory) MB" -ForegroundColor Gray
        }
        
        # Node.js (Supabase)
        $nodeStatus = Get-ProcessStatus -ProcessName "node"
        Write-Host "  Supabase:      " -NoNewline
        Write-Host $nodeStatus.Status -ForegroundColor $nodeStatus.Color
        if ($nodeStatus.Status -eq "✓ ACTIF") {
            Write-Host "                 CPU: $($nodeStatus.CPU)s | RAM: $($nodeStatus.Memory) MB" -ForegroundColor Gray
        }
        
        Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
        Write-Host ""
        
        # ========================================
        # BASE DE DONNÉES
        # ========================================
        Write-Host "┌─ BASE DE DONNÉES ────────────────────────────────────────┐" -ForegroundColor White
        
        if ($pgStatus.Status -eq "✓ ACTIF") {
            try {
                # Nombre de connexions actives
                $connQuery = "SELECT count(*) FROM pg_stat_activity WHERE datname='$DBName';"
                $activeConn = psql -U $DBUser -h localhost -t -c $connQuery 2>$null
                if ($activeConn) {
                    $activeConn = $activeConn.Trim()
                    Write-Host "  Connexions:    " -NoNewline
                    Write-Host "$activeConn actives" -ForegroundColor $(if ([int]$activeConn -gt 50) {"Yellow"} else {"Green"})
                }
                
                # Taille de la base
                $sizeQuery = "SELECT pg_size_pretty(pg_database_size('$DBName'));"
                $dbSize = psql -U $DBUser -h localhost -t -c $sizeQuery 2>$null
                if ($dbSize) {
                    $dbSize = $dbSize.Trim()
                    Write-Host "  Taille DB:     " -NoNewline
                    Write-Host "$dbSize" -ForegroundColor Cyan
                }
                
                # Nombre de tables
                $tablesQuery = "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"
                $tablesCount = psql -U $DBUser -h localhost -d $DBName -t -c $tablesQuery 2>$null
                if ($tablesCount) {
                    $tablesCount = $tablesCount.Trim()
                    Write-Host "  Tables:        " -NoNewline
                    Write-Host "$tablesCount" -ForegroundColor Cyan
                }
                
                # Requêtes actives
                $queriesQuery = "SELECT count(*) FROM pg_stat_activity WHERE datname='$DBName' AND state='active' AND query NOT LIKE '%pg_stat_activity%';"
                $activeQueries = psql -U $DBUser -h localhost -t -c $queriesQuery 2>$null
                if ($activeQueries) {
                    $activeQueries = $activeQueries.Trim()
                    Write-Host "  Requêtes:      " -NoNewline
                    Write-Host "$activeQueries en cours" -ForegroundColor $(if ([int]$activeQueries -gt 10) {"Yellow"} else {"Green"})
                }
                
            } catch {
                Write-Host "  ⚠ Impossible de récupérer les stats DB" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ⚠ PostgreSQL non accessible" -ForegroundColor Red
        }
        
        Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
        Write-Host ""
        
        # ========================================
        # ACTIVITÉ WEB
        # ========================================
        Write-Host "┌─ ACTIVITÉ WEB (dernières 60 secondes) ──────────────────┐" -ForegroundColor White
        
        $nginxLogPath = "C:\nginx\logs\access.log"
        if (Test-Path $nginxLogPath) {
            try {
                $recentLogs = Get-Content $nginxLogPath -Tail 100 -ErrorAction SilentlyContinue
                $oneMinuteAgo = (Get-Date).AddSeconds(-60)
                
                $recentRequests = $recentLogs | Where-Object {
                    if ($_ -match '\[([^\]]+)\]') {
                        $logDate = [DateTime]::ParseExact($matches[1], 'dd/MMM/yyyy:HH:mm:ss zzz', $null)
                        $logDate -gt $oneMinuteAgo
                    }
                }
                
                Write-Host "  Requêtes:      " -NoNewline
                Write-Host "$($recentRequests.Count)" -ForegroundColor Cyan
                
                # Codes de statut
                $statusCodes = $recentRequests | ForEach-Object {
                    if ($_ -match '" (\d{3}) ') {
                        $matches[1]
                    }
                } | Group-Object | Sort-Object Count -Descending
                
                if ($statusCodes) {
                    Write-Host "  Statuts:       " -NoNewline
                    $statusCodes | ForEach-Object {
                        $color = if ($_.Name -match '^2') {"Green"} elseif ($_.Name -match '^3') {"Cyan"} elseif ($_.Name -match '^4') {"Yellow"} else {"Red"}
                        Write-Host "$($_.Name): $($_.Count) " -ForegroundColor $color -NoNewline
                    }
                    Write-Host ""
                }
                
            } catch {
                Write-Host "  ⚠ Logs non disponibles" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ⚠ Fichier de log introuvable" -ForegroundColor Yellow
        }
        
        Write-Host "└──────────────────────────────────────────────────────────┘" -ForegroundColor White
        Write-Host ""
        
        # ========================================
        # FOOTER
        # ========================================
        Write-Host "Rafraîchissement dans $RefreshInterval secondes... (Ctrl+C pour quitter)" -ForegroundColor Gray
        
        Start-Sleep -Seconds $RefreshInterval
        
    } catch {
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds $RefreshInterval
    }
}
