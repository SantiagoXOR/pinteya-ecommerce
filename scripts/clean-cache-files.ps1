# ===== LIMPIEZA AUTOMÁTICA DE ARCHIVOS CACHE =====
# Script para eliminar archivos cache que causan sobrecarga en VS Code
# Autor: Sistema de Optimización Pinteya E-commerce
# Fecha: Enero 2025

param(
    [switch]$DryRun,    # Solo mostrar qué se eliminaría
    [switch]$Verbose,   # Mostrar detalles
    [switch]$Force      # Forzar eliminación sin confirmación
)

function Write-CleanLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    $color = switch($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "CRITICAL" { "Magenta" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Get-FolderSize {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        return 0
    }
    
    try {
        $size = (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | 
                Measure-Object -Property Length -Sum).Sum
        return [math]::Round($size / 1MB, 2)
    }
    catch {
        return 0
    }
}

function Get-FileCount {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        return 0
    }
    
    try {
        return (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | 
               Measure-Object).Count
    }
    catch {
        return 0
    }
}

function Remove-CacheFolder {
    param([string]$Path, [string]$Description)
    
    if (-not (Test-Path $Path)) {
        if ($Verbose) {
            Write-CleanLog "No existe: $Description ($Path)" "INFO"
        }
        return @{ Removed = $false; Files = 0; SizeMB = 0 }
    }
    
    $fileCount = Get-FileCount -Path $Path
    $sizeMB = Get-FolderSize -Path $Path
    
    if ($fileCount -eq 0) {
        if ($Verbose) {
            Write-CleanLog "Vacío: $Description ($Path)" "INFO"
        }
        return @{ Removed = $false; Files = 0; SizeMB = 0 }
    }
    
    Write-CleanLog "$Description`: $fileCount archivos, ${sizeMB}MB" "INFO"
    
    if ($DryRun) {
        Write-CleanLog "DRY RUN: Se eliminaría $Description" "WARN"
        return @{ Removed = $false; Files = $fileCount; SizeMB = $sizeMB }
    }
    
    try {
        Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
        Write-CleanLog "✅ Eliminado: $Description ($fileCount archivos, ${sizeMB}MB)" "SUCCESS"
        return @{ Removed = $true; Files = $fileCount; SizeMB = $sizeMB }
    }
    catch {
        Write-CleanLog "❌ Error eliminando $Description`: $($_.Exception.Message)" "ERROR"
        return @{ Removed = $false; Files = 0; SizeMB = 0 }
    }
}

# Definir carpetas cache a limpiar
$cacheFolders = @(
    @{ Path = ".jest-cache"; Description = "Jest Cache" },
    @{ Path = "jest-cache"; Description = "Jest Cache Alt" },
    @{ Path = ".cache"; Description = "General Cache" },
    @{ Path = "cache"; Description = "Cache Folder" },
    @{ Path = ".npm"; Description = "NPM Cache" },
    @{ Path = ".yarn"; Description = "Yarn Cache" },
    @{ Path = ".pnpm"; Description = "PNPM Cache" },
    @{ Path = "node_modules/.cache"; Description = "Node Modules Cache" },
    @{ Path = ".next/cache"; Description = "Next.js Cache" },
    @{ Path = "dist/cache"; Description = "Dist Cache" },
    @{ Path = "test-results"; Description = "Test Results" },
    @{ Path = "playwright-report"; Description = "Playwright Reports" },
    @{ Path = "coverage"; Description = "Coverage Reports" },
    @{ Path = "logs"; Description = "Log Files" },
    @{ Path = "tmp"; Description = "Temp Files" },
    @{ Path = "temp"; Description = "Temporary Files" }
)

# Archivos específicos a limpiar
$cacheFiles = @(
    @{ Pattern = "*.log"; Description = "Log Files" },
    @{ Pattern = "*.cache"; Description = "Cache Files" },
    @{ Pattern = "haste-map-*"; Description = "Haste Map Files" },
    @{ Pattern = "perf-cache-*"; Description = "Performance Cache" },
    @{ Pattern = "*.tsbuildinfo"; Description = "TypeScript Build Info" }
)

Write-CleanLog "=== LIMPIEZA DE ARCHIVOS CACHE ===" "INFO"

if ($DryRun) {
    Write-CleanLog "MODO DRY RUN - Solo mostrando qué se eliminaría" "WARN"
}

# Estadísticas iniciales
$initialFiles = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
Write-CleanLog "Archivos totales antes de limpieza: $initialFiles" "INFO"

# Contadores
$totalFilesRemoved = 0
$totalSizeMB = 0
$foldersProcessed = 0

# Limpiar carpetas
Write-CleanLog "Limpiando carpetas cache..." "INFO"
foreach ($folder in $cacheFolders) {
    $result = Remove-CacheFolder -Path $folder.Path -Description $folder.Description
    if ($result.Removed) {
        $totalFilesRemoved += $result.Files
        $totalSizeMB += $result.SizeMB
        $foldersProcessed++
    }
}

# Limpiar archivos específicos
Write-CleanLog "Limpiando archivos cache específicos..." "INFO"
foreach ($filePattern in $cacheFiles) {
    try {
        $files = Get-ChildItem -Recurse -File -Name $filePattern.Pattern -ErrorAction SilentlyContinue
        if ($files) {
            $fileCount = ($files | Measure-Object).Count
            Write-CleanLog "$($filePattern.Description): $fileCount archivos encontrados" "INFO"
            
            if (-not $DryRun) {
                $files | ForEach-Object { 
                    Remove-Item -Path $_ -Force -ErrorAction SilentlyContinue 
                }
                Write-CleanLog "✅ Eliminados: $($filePattern.Description)" "SUCCESS"
                $totalFilesRemoved += $fileCount
            } else {
                Write-CleanLog "DRY RUN: Se eliminarían $fileCount archivos de $($filePattern.Description)" "WARN"
            }
        }
    }
    catch {
        Write-CleanLog "Error procesando $($filePattern.Description): $($_.Exception.Message)" "ERROR"
    }
}

# Estadísticas finales
if (-not $DryRun) {
    $finalFiles = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
    $filesReduced = $initialFiles - $finalFiles
    
    Write-CleanLog "=== RESUMEN DE LIMPIEZA ===" "SUCCESS"
    Write-CleanLog "Archivos antes: $initialFiles" "INFO"
    Write-CleanLog "Archivos después: $finalFiles" "INFO"
    Write-CleanLog "Archivos eliminados: $filesReduced" "SUCCESS"
    Write-CleanLog "Tamaño liberado: ${totalSizeMB}MB" "SUCCESS"
    Write-CleanLog "Carpetas procesadas: $foldersProcessed" "INFO"
    
    if ($filesReduced -gt 1000) {
        Write-CleanLog "🎉 EXCELENTE: Reducción significativa de archivos" "SUCCESS"
    } elseif ($filesReduced -gt 100) {
        Write-CleanLog "✅ BUENO: Reducción moderada de archivos" "SUCCESS"
    } else {
        Write-CleanLog "ℹ️  MÍNIMO: Pocos archivos eliminados" "INFO"
    }
} else {
    Write-CleanLog "=== RESUMEN DRY RUN ===" "WARN"
    Write-CleanLog "Archivos que se eliminarían: $totalFilesRemoved" "WARN"
    Write-CleanLog "Tamaño que se liberaría: ${totalSizeMB}MB" "WARN"
    Write-CleanLog "Ejecuta sin -DryRun para aplicar cambios" "INFO"
}

Write-CleanLog "Limpieza completada" "SUCCESS"
