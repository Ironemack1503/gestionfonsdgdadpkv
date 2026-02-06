# Export Pack Deploiement Hors-Ligne
# Cree un package complet pret a etre deploye sur n'importe quel reseau sans Internet

param(
    [string]$ExportPath = "C:\Export-Gestion-Fonds",
    [switch]$IncludeInstallers = $false
)

$ErrorActionPreference = "Stop"
$ProjectPath = Get-Location

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  CREATION PACK DEPLOIEMENT HORS-LIGNE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Creer la structure
Write-Host "[1/5] Creation de la structure..." -ForegroundColor Cyan

$folders = @(
    "$ExportPath\APPLICATION\dist",
    "$ExportPath\APPLICATION\supabase\migrations",
    "$ExportPath\SCRIPTS",
    "$ExportPath\INSTALLATEURS",
    "$ExportPath\DOCUMENTATION"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

Write-Host "  [OK] Dossiers crees" -ForegroundColor Green

# Copier l'application
Write-Host ""
Write-Host "[2/5] Copie de l'application..." -ForegroundColor Cyan

if (Test-Path "dist") {
    Copy-Item "dist\*" "$ExportPath\APPLICATION\dist" -Recurse -Force
    Write-Host "  [OK] Build (dist) copie" -ForegroundColor Green
} else {
    Write-Host "  [!] Dossier dist non trouve" -ForegroundColor Yellow
}

if (Test-Path "supabase\migrations") {
    Copy-Item "supabase\migrations\*" "$ExportPath\APPLICATION\supabase\migrations" -Recurse -Force
    Write-Host "  [OK] Migrations SQL copiees" -ForegroundColor Green
}

# Copier .env
if (Test-Path ".env.production.local") {
    Copy-Item ".env.production.local" "$ExportPath\APPLICATION\.env.production.local" -Force
    Write-Host "  [OK] Fichier .env copie" -ForegroundColor Green
}

# Copier les scripts
Write-Host ""
Write-Host "[3/5] Copie des scripts..." -ForegroundColor Cyan

Copy-Item "nginx.conf" "$ExportPath\SCRIPTS\nginx.conf" -Force -ErrorAction SilentlyContinue
Copy-Item "scripts\deploy-offline.ps1" "$ExportPath\SCRIPTS\deploy-offline.ps1" -Force -ErrorAction SilentlyContinue
Copy-Item "scripts\monitor-server.ps1" "$ExportPath\SCRIPTS\monitor-server.ps1" -Force -ErrorAction SilentlyContinue
Copy-Item "scripts\backup-database.ps1" "$ExportPath\SCRIPTS\backup-database.ps1" -Force -ErrorAction SilentlyContinue

Write-Host "  [OK] Scripts copies" -ForegroundColor Green

# Copier la documentation
Write-Host ""
Write-Host "[4/5] Copie de la documentation..." -ForegroundColor Cyan

Copy-Item "..\DEPLOIEMENT-HORS-LIGNE.md" "$ExportPath\DOCUMENTATION\DEPLOIEMENT-HORS-LIGNE.md" -Force -ErrorAction SilentlyContinue
Copy-Item "..\GUIDE-DEPLOIEMENT-LOCAL.md" "$ExportPath\DOCUMENTATION\GUIDE-DEPLOIEMENT-LOCAL.md" -Force -ErrorAction SilentlyContinue
Copy-Item "..\QUICK-START.md" "$ExportPath\DOCUMENTATION\QUICK-START.md" -Force -ErrorAction SilentlyContinue

# Creer un README au demarrage
@"
PACK DEPLOIEMENT HORS-LIGNE
Gestion Fonds DGDADPKV

CONTENU:
- APPLICATION/     : Application compilee + migrations
- SCRIPTS/         : Scripts de deploiement et configuration
- INSTALLATEURS/   : Exécutables (PostgreSQL, Node.js, Nginx) [optionnel]
- DOCUMENTATION/   : Guides complets

DEMARRAGE RAPIDE:
1. Installer PostgreSQL + Nginx
2. Executer: SCRIPTS\deploy-offline.ps1
3. Demarrer: cd C:\nginx; start nginx
4. Acceder: http://192.168.1.X

POUR PLUS DE DETAILS:
Voir DOCUMENTATION\DEPLOIEMENT-HORS-LIGNE.md

Date creation: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@ | Out-File "$ExportPath\README.txt" -Encoding ASCII

Write-Host "  [OK] Documentation copiee" -ForegroundColor Green

# Creer un fichier INDEX
Write-Host ""
Write-Host "[5/5] Creation du manifest..." -ForegroundColor Cyan

$manifest = @{
    CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Version = "1.0"
    Application = "Gestion Fonds DGDADPKV"
    Environment = "Production Hors-Ligne"
    Contents = @{
        "APPLICATION/dist" = "Application compilee (prête a servir)"
        "APPLICATION/supabase/migrations" = "Scripts de base de donnees"
        "SCRIPTS/deploy-offline.ps1" = "Script de deploiement automatique"
        "SCRIPTS/nginx.conf" = "Configuration Nginx"
        "SCRIPTS/monitor-server.ps1" = "Monitoring temps reel"
        "SCRIPTS/backup-database.ps1" = "Sauvegarde base de donnees"
        "DOCUMENTATION/" = "Guides complets (lire avant de deployer)"
    }
    Requirements = @{
        "PostgreSQL" = "15 ou 18 (Windows x64)"
        "Nginx" = "1.24+ (Windows x64)"
        "RAM" = "4GB minimum (8GB recommande)"
        "Disque" = "1GB minimum"
        "Windows" = "10 ou 11 (ou Windows Server 2019+)"
    }
    FirstSteps = @(
        "1. Installer PostgreSQL (port 5432)"
        "2. Installer Nginx (extraire dans C:\nginx)"
        "3. Copier APPLICATION/ dans C:\GestionFonds"
        "4. Executer: PowerShell -ExecutionPolicy Bypass -File SCRIPTS\deploy-offline.ps1"
        "5. Demarrer Nginx: cd C:\nginx; start nginx"
        "6. Acceder a: http://192.168.1.X"
    ]
} | ConvertTo-Json

$manifest | Out-File "$ExportPath\MANIFEST.json" -Encoding UTF8

Write-Host "  [OK] Manifest cree" -ForegroundColor Green

# RESUME
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  PACK CREE AVEC SUCCES !" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Write-Host "LOCATION: $ExportPath" -ForegroundColor Cyan
Write-Host ""

# Calculer la taille
$size = Get-ChildItem $ExportPath -Recurse | Measure-Object -Property Length -Sum
$sizeMB = [math]::Round($size.Sum / 1MB, 2)

Write-Host "TAILLE DU PACK: $sizeMB MB" -ForegroundColor Yellow
Write-Host ""

Write-Host "CONTENU:" -ForegroundColor White
Get-ChildItem $ExportPath -Recurse -Directory | ForEach-Object {
    $indent = "  " + ("  " * ($_.FullName.Split('\').Count - $ExportPath.Split('\').Count - 1))
    Write-Host "$indent📁 $($_.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "FICHIERS:" -ForegroundColor White

Get-ChildItem $ExportPath -Recurse -File | ForEach-Object {
    $indent = "  " + ("  " * ($_.DirectoryName.Split('\').Count - $ExportPath.Split('\').Count))
    $icon = switch($_.Extension) {
        ".sql" { "🗄️" }
        ".conf" { "⚙️" }
        ".ps1" { "🔧" }
        ".md" { "📄" }
        ".html" { "🌐" }
        default { "📄" }
    }
    Write-Host "$indent$icon $($_.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copier ce pack sur une clé USB ou dossier partage" -ForegroundColor White
Write-Host "2. Sur un nouveau reseau:" -ForegroundColor White
Write-Host "   - Installer PostgreSQL + Nginx" -ForegroundColor Gray
Write-Host "   - Copier APPLICATION/ dans C:\GestionFonds" -ForegroundColor Gray
Write-Host "   - Executer deploy-offline.ps1" -ForegroundColor Gray
Write-Host ""

Write-Host "OPTION - Inclure les installateurs:" -ForegroundColor Yellow
if ($IncludeInstallers) {
    Write-Host "  Ajouter les fichiers .exe/.msi dans INSTALLATEURS/" -ForegroundColor Gray
    Write-Host "  (PostgreSQL, Node.js, Nginx)" -ForegroundColor Gray
} else {
    Write-Host "  Vous pouvez copier les installateurs manuellement" -ForegroundColor Gray
    Write-Host "  si vous voulez un pack 100% autonome" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pack pret a etre deploye sur n'importe quel reseau!" -ForegroundColor Green
Write-Host "Pas de connexion Internet requise apres l'installation" -ForegroundColor Green
Write-Host ""
