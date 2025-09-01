# ===== MONITOR DE ARCHIVOS INDEXADOS POR VS CODE =====
# Script para monitorear cuántos archivos está procesando VS Code
# Autor: Sistema de Optimización Pinteya E-commerce
# Fecha: Enero 2025

param(
    [switch]$Detailed,
    [switch]$Continuous,
    [int]$IntervalSeconds = 10
)

function Write-MonitorLog {
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

function Get-ProjectFileCount {
    Write-MonitorLog "Contando archivos del proyecto..." "INFO"
    
    # Contar todos los archivos
    $totalFiles = (Get-ChildItem -Recurse -File | Measure-Object).Count
    
    # Contar archivos excluidos por VS Code
    $excludedPatterns = @(
        "**/node_modules/**",
        "**/.git/**", 
        "**/test-results/**",
        "**/coverage/**",
        "**/__tests__/**",
        "**/e2e/**",
        "**/tests/**",
        "**/docs/**",
        "**/scripts/**"
    )
    
    $excludedCount = 0
    foreach ($pattern in $excludedPatterns) {
        $cleanPattern = $pattern -replace '\*\*/', '' -replace '/\*\*', ''
        if (Test-Path $cleanPattern) {
            $count = (Get-ChildItem -Path $cleanPattern -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
            $excludedCount += $count
            if ($Detailed) {
                Write-MonitorLog "  $cleanPattern`: $count archivos" "INFO"
            }
        }
    }
    
    $indexedFiles = $totalFiles - $excludedCount
    
    return @{
        Total = $totalFiles
        Excluded = $excludedCount  
        Indexed = $indexedFiles
    }
}

function Get-VSCodeProcessInfo {
    Write-MonitorLog "Analizando procesos VS Code..." "INFO"
    
    $vscodeProcesses = Get-Process Code -ErrorAction SilentlyContinue
    
    if (-not $vscodeProcesses) {
        Write-MonitorLog "VS Code no está ejecutándose" "WARN"
        return $null
    }
    
    $totalCPU = 0
    $totalMemory = 0
    $processCount = 0
    
    foreach ($process in $vscodeProcesses) {
        $cpu = $process.CPU
        $memory = [math]::Round($process.WorkingSet / 1MB, 1)
        $totalCPU += $cpu
        $totalMemory += $memory
        $processCount++
        
        if ($Detailed) {
            Write-MonitorLog "  PID $($process.Id): CPU $cpu, RAM ${memory}MB" "INFO"
        }
    }
    
    return @{
        ProcessCount = $processCount
        TotalCPU = $totalCPU
        TotalMemoryMB = $totalMemory
    }
}

function Show-OptimizationRecommendations {
    param($FileStats, $ProcessStats)
    
    Write-MonitorLog "=== RECOMENDACIONES DE OPTIMIZACIÓN ===" "INFO"
    
    if ($FileStats.Indexed -gt 5000) {
        Write-MonitorLog "🚨 CRÍTICO: $($FileStats.Indexed) archivos indexados (>5000)" "CRITICAL"
        Write-MonitorLog "  → Excluir más carpetas en .vscode/settings.json" "WARN"
        Write-MonitorLog "  → Considerar dividir el workspace" "WARN"
    }
    elseif ($FileStats.Indexed -gt 1000) {
        Write-MonitorLog "⚠️  ALTO: $($FileStats.Indexed) archivos indexados (>1000)" "WARN"
        Write-MonitorLog "  → Revisar exclusiones en .vscode/settings.json" "WARN"
    }
    else {
        Write-MonitorLog "✅ ÓPTIMO: $($FileStats.Indexed) archivos indexados (<1000)" "SUCCESS"
    }
    
    if ($ProcessStats -and $ProcessStats.ProcessCount -gt 10) {
        Write-MonitorLog "🚨 CRÍTICO: $($ProcessStats.ProcessCount) procesos VS Code (>10)" "CRITICAL"
        Write-MonitorLog "  → Reiniciar VS Code" "WARN"
        Write-MonitorLog "  → Deshabilitar extensiones pesadas" "WARN"
    }
    
    if ($ProcessStats -and $ProcessStats.TotalMemoryMB -gt 2000) {
        Write-MonitorLog "⚠️  ALTO: $($ProcessStats.TotalMemoryMB)MB RAM usada (>2GB)" "WARN"
        Write-MonitorLog "  → Cerrar pestañas innecesarias" "WARN"
        Write-MonitorLog "  → Configurar límites de memoria" "WARN"
    }
}

function Start-ContinuousMonitoring {
    Write-MonitorLog "Iniciando monitoreo continuo cada $IntervalSeconds segundos..." "INFO"
    Write-MonitorLog "Presiona Ctrl+C para detener" "INFO"
    
    while ($true) {
        Clear-Host
        Write-MonitorLog "=== MONITOR VS CODE - $(Get-Date -Format 'HH:mm:ss') ===" "INFO"
        
        $fileStats = Get-ProjectFileCount
        $processStats = Get-VSCodeProcessInfo
        
        Write-MonitorLog "📁 ARCHIVOS:" "INFO"
        Write-MonitorLog "  Total: $($fileStats.Total)" "INFO"
        Write-MonitorLog "  Excluidos: $($fileStats.Excluded)" "SUCCESS"
        Write-MonitorLog "  Indexados: $($fileStats.Indexed)" "INFO"
        
        if ($processStats) {
            Write-MonitorLog "🖥️  PROCESOS VS CODE:" "INFO"
            Write-MonitorLog "  Procesos: $($processStats.ProcessCount)" "INFO"
            Write-MonitorLog "  CPU Total: $($processStats.TotalCPU)" "INFO"
            Write-MonitorLog "  RAM Total: $($processStats.TotalMemoryMB)MB" "INFO"
        }
        
        Show-OptimizationRecommendations -FileStats $fileStats -ProcessStats $processStats
        
        Start-Sleep -Seconds $IntervalSeconds
    }
}

# Ejecución principal
Write-MonitorLog "=== MONITOR DE ARCHIVOS VS CODE ===" "INFO"

if ($Continuous) {
    Start-ContinuousMonitoring
} else {
    $fileStats = Get-ProjectFileCount
    $processStats = Get-VSCodeProcessInfo
    
    Write-MonitorLog "📁 ESTADÍSTICAS DE ARCHIVOS:" "INFO"
    Write-MonitorLog "  Total en proyecto: $($fileStats.Total)" "INFO"
    Write-MonitorLog "  Excluidos por VS Code: $($fileStats.Excluded)" "SUCCESS"
    Write-MonitorLog "  Indexados por VS Code: $($fileStats.Indexed)" "INFO"
    Write-MonitorLog "  Reducción: $(([math]::Round(($fileStats.Excluded / $fileStats.Total) * 100, 1)))%" "SUCCESS"
    
    if ($processStats) {
        Write-MonitorLog "🖥️  ESTADÍSTICAS DE PROCESOS:" "INFO"
        Write-MonitorLog "  Procesos VS Code: $($processStats.ProcessCount)" "INFO"
        Write-MonitorLog "  CPU Total: $($processStats.TotalCPU)" "INFO"
        Write-MonitorLog "  RAM Total: $($processStats.TotalMemoryMB)MB" "INFO"
    }
    
    Show-OptimizationRecommendations -FileStats $fileStats -ProcessStats $processStats
}

Write-MonitorLog "Monitor completado" "SUCCESS"
