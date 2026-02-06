# ========================================
# Configuration Tâche Planifiée de Sauvegarde
# Gestion Fonds DGDADPKV
# ========================================

param(
    [string]$BackupTime = "02:00",  # Format HH:mm
    [string]$ScriptPath = ""
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION SAUVEGARDE AUTOMATIQUE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les privilèges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "✗ Ce script doit être exécuté en tant qu'administrateur!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Clic droit sur PowerShell → Exécuter en tant qu'administrateur" -ForegroundColor Yellow
    exit 1
}

# Déterminer le chemin du script de backup
if ([string]::IsNullOrEmpty($ScriptPath)) {
    $ScriptPath = Join-Path $PSScriptRoot "backup-database.ps1"
}

if (-not (Test-Path $ScriptPath)) {
    Write-Host "✗ Script de backup non trouvé: $ScriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Script de backup: $ScriptPath" -ForegroundColor Green

# Configuration de la tâche
$taskName = "Backup Gestion Fonds DGDADPKV"
$taskDescription = "Sauvegarde automatique quotidienne de la base de données"

# Vérifier si la tâche existe déjà
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠ Une tâche avec ce nom existe déjà" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous la supprimer et la recréer? (O/N)"
    if ($response -eq "O" -or $response -eq "o") {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "✓ Ancienne tâche supprimée" -ForegroundColor Green
    } else {
        Write-Host "Annulation..." -ForegroundColor Yellow
        exit 0
    }
}

# Demander les paramètres de configuration
Write-Host ""
Write-Host "Configuration de la sauvegarde:" -ForegroundColor Cyan
Write-Host ""

$dbPassword = Read-Host "Mot de passe PostgreSQL (sera crypté)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
$dbPasswordText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$backupPath = Read-Host "Dossier de sauvegarde (défaut: C:\Backups\GestionFonds)"
if ([string]::IsNullOrEmpty($backupPath)) {
    $backupPath = "C:\Backups\GestionFonds"
}

$nasPath = Read-Host "Chemin NAS optionnel (ex: \\192.168.1.250\Backups) [Entrée pour ignorer]"

$retentionDays = Read-Host "Nombre de jours de rétention (défaut: 30)"
if ([string]::IsNullOrEmpty($retentionDays)) {
    $retentionDays = 30
}

# Construire les arguments du script
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" " +
             "-DBPassword `"$dbPasswordText`" " +
             "-BackupPath `"$backupPath`" " +
             "-RetentionDays $retentionDays"

if (-not [string]::IsNullOrEmpty($nasPath)) {
    $arguments += " -NASPath `"$nasPath`""
}

# Créer l'action
$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument $arguments

# Créer le déclencheur (quotidien)
$trigger = New-ScheduledTaskTrigger `
    -Daily `
    -At $BackupTime

# Créer les paramètres
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -MultipleInstances IgnoreNew

# Créer le principal (utilisateur SYSTEM)
$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Enregistrer la tâche
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Description $taskDescription `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Force | Out-Null
    
    Write-Host ""
    Write-Host "✓ Tâche planifiée créée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Détails de la tâche:" -ForegroundColor Cyan
    Write-Host "  • Nom: $taskName" -ForegroundColor White
    Write-Host "  • Heure d'exécution: $BackupTime" -ForegroundColor White
    Write-Host "  • Fréquence: Quotidienne" -ForegroundColor White
    Write-Host "  • Dossier backup: $backupPath" -ForegroundColor White
    Write-Host "  • Rétention: $retentionDays jours" -ForegroundColor White
    if (-not [string]::IsNullOrEmpty($nasPath)) {
        Write-Host "  • Copie NAS: $nasPath" -ForegroundColor White
    }
    Write-Host ""
    
    # Proposer de tester immédiatement
    $testNow = Read-Host "Voulez-vous tester la sauvegarde maintenant? (O/N)"
    if ($testNow -eq "O" -or $testNow -eq "o") {
        Write-Host ""
        Write-Host "Exécution de la sauvegarde de test..." -ForegroundColor Cyan
        Start-ScheduledTask -TaskName $taskName
        Start-Sleep -Seconds 3
        
        # Vérifier le statut
        $task = Get-ScheduledTask -TaskName $taskName
        $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName
        
        Write-Host ""
        Write-Host "Statut: $($task.State)" -ForegroundColor Yellow
        Write-Host "Dernière exécution: $($taskInfo.LastRunTime)" -ForegroundColor Yellow
        Write-Host "Résultat: $($taskInfo.LastTaskResult)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Vérifiez les logs dans: $backupPath\backup.log" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host ""
    Write-Host "✗ Erreur lors de la création de la tâche:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pour gérer la tâche:" -ForegroundColor Cyan
Write-Host "  • Ouvrir: Planificateur de tâches (taskschd.msc)" -ForegroundColor White
Write-Host "  • Voir: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "  • Exécuter: Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "  • Supprimer: Unregister-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host ""
