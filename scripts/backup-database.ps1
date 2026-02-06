# ========================================
# Script de Sauvegarde Base de Données
# Gestion Fonds DGDADPKV
# ========================================

param(
    [string]$DBName = "gestion_fonds_dgdadpkv",
    [string]$DBUser = "postgres",
    [string]$DBPassword = "",
    [string]$BackupPath = "C:\Backups\GestionFonds",
    [int]$RetentionDays = 30,
    [string]$NASPath = ""  # Optionnel: chemin UNC vers NAS
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    
    # Log dans un fichier
    $logFile = Join-Path $BackupPath "backup.log"
    $logMessage | Out-File -FilePath $logFile -Append -Encoding UTF8
}

# ========================================
# DÉBUT DU SCRIPT
# ========================================
Write-Log "=== DÉMARRAGE SAUVEGARDE BASE DE DONNÉES ===" "INFO"

# Créer le dossier de backup s'il n'existe pas
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    Write-Log "Dossier de backup créé: $BackupPath" "INFO"
}

# Demander le mot de passe si non fourni
if ([string]::IsNullOrEmpty($DBPassword)) {
    Write-Host "Mot de passe requis pour PostgreSQL"
    $securePassword = Read-Host "Entrez le mot de passe" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $DBPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Définir la variable d'environnement pour le mot de passe
$env:PGPASSWORD = $DBPassword

# Nom du fichier de backup avec timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "${DBName}_${timestamp}.backup"
$backupFilePath = Join-Path $BackupPath $backupFileName

Write-Log "Début de la sauvegarde de '$DBName'..." "INFO"
Write-Log "Fichier de destination: $backupFilePath" "INFO"

# ========================================
# SAUVEGARDE AVEC PG_DUMP
# ========================================
try {
    # Format custom pour compression et restauration flexible
    $pgDumpArgs = @(
        "-U", $DBUser,
        "-h", "localhost",
        "-F", "c",  # Format custom (compressed)
        "-b",       # Include large objects
        "-v",       # Verbose
        "-f", $backupFilePath,
        $DBName
    )
    
    $startTime = Get-Date
    & pg_dump $pgDumpArgs 2>&1 | ForEach-Object { Write-Log $_ "DEBUG" }
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    # Vérifier que le fichier a été créé
    if (Test-Path $backupFilePath) {
        $fileSize = (Get-Item $backupFilePath).Length / 1MB
        Write-Log "Sauvegarde terminée avec succès!" "SUCCESS"
        Write-Log "Taille: $([math]::Round($fileSize, 2)) MB" "INFO"
        Write-Log "Durée: $([math]::Round($duration, 2)) secondes" "INFO"
    } else {
        throw "Le fichier de backup n'a pas été créé"
    }
    
} catch {
    Write-Log "ERREUR lors de la sauvegarde: $($_.Exception.Message)" "ERROR"
    exit 1
}

# ========================================
# SAUVEGARDE ADDITIONNELLE EN SQL
# ========================================
Write-Log "Création d'une sauvegarde SQL (format texte)..." "INFO"
$sqlBackupFileName = "${DBName}_${timestamp}.sql"
$sqlBackupFilePath = Join-Path $BackupPath $sqlBackupFileName

try {
    $pgDumpSqlArgs = @(
        "-U", $DBUser,
        "-h", "localhost",
        "-f", $sqlBackupFilePath,
        $DBName
    )
    
    & pg_dump $pgDumpSqlArgs 2>&1 | Out-Null
    
    # Compresser le fichier SQL
    $sqlGzFilePath = "$sqlBackupFilePath.gz"
    
    # Utiliser 7-Zip si disponible, sinon Compress-Archive
    if (Get-Command 7z -ErrorAction SilentlyContinue) {
        & 7z a -tgzip $sqlGzFilePath $sqlBackupFilePath | Out-Null
    } else {
        Compress-Archive -Path $sqlBackupFilePath -DestinationPath "$sqlBackupFilePath.zip" -Force
        Rename-Item "$sqlBackupFilePath.zip" "$sqlBackupFilePath.gz" -Force
    }
    
    # Supprimer le fichier SQL non compressé
    Remove-Item $sqlBackupFilePath -Force
    
    $sqlFileSize = (Get-Item $sqlGzFilePath).Length / 1MB
    Write-Log "Sauvegarde SQL compressée: $([math]::Round($sqlFileSize, 2)) MB" "INFO"
    
} catch {
    Write-Log "Avertissement: Impossible de créer la sauvegarde SQL: $($_.Exception.Message)" "WARN"
}

# ========================================
# COPIE VERS NAS (SI CONFIGURÉ)
# ========================================
if (-not [string]::IsNullOrEmpty($NASPath)) {
    Write-Log "Copie vers le NAS: $NASPath" "INFO"
    
    try {
        # Créer le dossier sur le NAS s'il n'existe pas
        if (-not (Test-Path $NASPath)) {
            New-Item -ItemType Directory -Path $NASPath -Force | Out-Null
        }
        
        # Copier les fichiers de backup
        Copy-Item $backupFilePath -Destination $NASPath -Force
        if (Test-Path $sqlGzFilePath) {
            Copy-Item $sqlGzFilePath -Destination $NASPath -Force
        }
        
        Write-Log "Copie vers NAS terminée" "SUCCESS"
        
    } catch {
        Write-Log "ERREUR lors de la copie vers NAS: $($_.Exception.Message)" "ERROR"
    }
}

# ========================================
# NETTOYAGE DES ANCIENNES SAUVEGARDES
# ========================================
Write-Log "Nettoyage des sauvegardes de plus de $RetentionDays jours..." "INFO"

$cutoffDate = (Get-Date).AddDays(-$RetentionDays)
$oldBackups = Get-ChildItem $BackupPath -Filter "${DBName}_*.backup" | 
              Where-Object { $_.LastWriteTime -lt $cutoffDate }

$deletedCount = 0
foreach ($oldBackup in $oldBackups) {
    try {
        Remove-Item $oldBackup.FullName -Force
        Write-Log "Supprimé: $($oldBackup.Name)" "INFO"
        $deletedCount++
        
        # Supprimer aussi le .sql.gz correspondant
        $sqlGzFile = $oldBackup.FullName -replace '\.backup$', '.sql.gz'
        if (Test-Path $sqlGzFile) {
            Remove-Item $sqlGzFile -Force
        }
        
    } catch {
        Write-Log "Impossible de supprimer: $($oldBackup.Name)" "WARN"
    }
}

Write-Log "$deletedCount anciennes sauvegardes supprimées" "INFO"

# ========================================
# STATISTIQUES FINALES
# ========================================
$allBackups = Get-ChildItem $BackupPath -Filter "${DBName}_*.backup"
$totalSize = ($allBackups | Measure-Object -Property Length -Sum).Sum / 1GB

Write-Log "=== STATISTIQUES ===" "INFO"
Write-Log "Nombre total de backups: $($allBackups.Count)" "INFO"
Write-Log "Espace utilisé: $([math]::Round($totalSize, 2)) GB" "INFO"
Write-Log "=== FIN DE LA SAUVEGARDE ===" "INFO"

# Nettoyer la variable d'environnement
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "✓ Sauvegarde terminée avec succès!" -ForegroundColor Green
Write-Host "  Fichier: $backupFileName" -ForegroundColor Cyan
Write-Host "  Emplacement: $BackupPath" -ForegroundColor Cyan
