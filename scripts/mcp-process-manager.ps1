# ===== GESTOR DE PROCESOS MCP ENTERPRISE =====
# Script para monitorear, limpiar y limitar procesos MCP duplicados
# Autor: Sistema de Optimización Pinteya E-commerce
# Fecha: Enero 2025

param(
    [string]$Action = "monitor",  # monitor, cleanup, status, kill-all
    [int]$MaxInstances = 1,       # Máximo de instancias por servidor MCP
    [int]$MaxMemoryMB = 100,      # Límite de memoria por proceso (MB)
    [switch]$Verbose
)

# Configuración
$CONFIG_FILE = ".mcp-config.json"
$LOG_FILE = ".mcp-logs.json"

# Función para logging
function Write-MCPLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = @{
        timestamp = $timestamp
        level = $Level
        message = $Message
    }
    
    if ($Verbose) {
        Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $(
            switch($Level) {
                "ERROR" { "Red" }
                "WARN" { "Yellow" }
                "SUCCESS" { "Green" }
                default { "White" }
            }
        )
    }
    
    # Agregar al archivo de log
    $logEntry | ConvertTo-Json -Compress | Add-Content -Path $LOG_FILE
}

# Función para obtener procesos MCP
function Get-MCPProcesses {
    $mcpProcesses = @()
    
    # Buscar procesos Node.js con comandos MCP
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    
    foreach ($process in $nodeProcesses) {
        try {
            $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($process.Id)").CommandLine
            
            if ($commandLine -and ($commandLine -match "mcp|context7|playwright|supabase|sequential-thinking|filesystem")) {
                $mcpType = "unknown"
                
                # Identificar tipo de servidor MCP
                if ($commandLine -match "context7") { $mcpType = "context7" }
                elseif ($commandLine -match "playwright") { $mcpType = "playwright" }
                elseif ($commandLine -match "supabase") { $mcpType = "supabase" }
                elseif ($commandLine -match "sequential-thinking") { $mcpType = "sequential-thinking" }
                elseif ($commandLine -match "filesystem") { $mcpType = "filesystem" }
                
                $mcpProcesses += [PSCustomObject]@{
                    Id = $process.Id
                    Name = $process.ProcessName
                    Type = $mcpType
                    MemoryMB = [math]::Round($process.WorkingSet / 1MB, 1)
                    CPU = $process.CPU
                    StartTime = $process.StartTime
                    CommandLine = $commandLine
                }
            }
        }
        catch {
            # Ignorar errores de acceso a procesos
        }
    }
    
    return $mcpProcesses
}

# Función para mostrar estado
function Show-MCPStatus {
    Write-MCPLog "=== ESTADO ACTUAL DE PROCESOS MCP ===" "INFO"
    
    $processes = Get-MCPProcesses
    $groupedProcesses = $processes | Group-Object Type
    
    foreach ($group in $groupedProcesses) {
        $count = $group.Count
        $totalMemory = ($group.Group | Measure-Object MemoryMB -Sum).Sum
        
        Write-MCPLog "Tipo: $($group.Name) | Instancias: $count | Memoria Total: ${totalMemory}MB" "INFO"
        
        foreach ($proc in $group.Group) {
            Write-MCPLog "  - PID: $($proc.Id) | Memoria: $($proc.MemoryMB)MB | Inicio: $($proc.StartTime)" "INFO"
        }
    }
    
    $totalProcesses = $processes.Count
    $totalMemory = ($processes | Measure-Object MemoryMB -Sum).Sum
    
    Write-MCPLog "TOTAL: $totalProcesses procesos | ${totalMemory}MB memoria" "INFO"
}

# Función para limpiar procesos duplicados
function Clear-MCPProcesses {
    Write-MCPLog "Iniciando limpieza de procesos MCP duplicados..." "INFO"
    
    $processes = Get-MCPProcesses
    $groupedProcesses = $processes | Group-Object Type
    $killedCount = 0
    
    foreach ($group in $groupedProcesses) {
        if ($group.Count -gt $MaxInstances) {
            Write-MCPLog "Tipo '$($group.Name)' tiene $($group.Count) instancias (máximo: $MaxInstances)" "WARN"
            
            # Ordenar por tiempo de inicio (mantener el más reciente)
            $sortedProcesses = $group.Group | Sort-Object StartTime
            $toKill = $sortedProcesses | Select-Object -First ($group.Count - $MaxInstances)
            
            foreach ($proc in $toKill) {
                try {
                    Stop-Process -Id $proc.Id -Force
                    Write-MCPLog "Terminado proceso duplicado: PID $($proc.Id) ($($proc.Type))" "SUCCESS"
                    $killedCount++
                }
                catch {
                    Write-MCPLog "Error terminando proceso PID $($proc.Id): $($_.Exception.Message)" "ERROR"
                }
            }
        }
        
        # Verificar límites de memoria
        foreach ($proc in $group.Group) {
            if ($proc.MemoryMB -gt $MaxMemoryMB) {
                try {
                    Stop-Process -Id $proc.Id -Force
                    Write-MCPLog "Terminado proceso por exceso de memoria: PID $($proc.Id) ($($proc.MemoryMB)MB > ${MaxMemoryMB}MB)" "SUCCESS"
                    $killedCount++
                }
                catch {
                    Write-MCPLog "Error terminando proceso por memoria PID $($proc.Id): $($_.Exception.Message)" "ERROR"
                }
            }
        }
    }
    
    Write-MCPLog "Limpieza completada. Procesos terminados: $killedCount" "SUCCESS"
}

# Función para terminar todos los procesos MCP
function Stop-AllMCPProcesses {
    Write-MCPLog "Terminando TODOS los procesos MCP..." "WARN"
    
    $processes = Get-MCPProcesses
    $killedCount = 0
    
    foreach ($proc in $processes) {
        try {
            Stop-Process -Id $proc.Id -Force
            Write-MCPLog "Terminado proceso: PID $($proc.Id) ($($proc.Type))" "SUCCESS"
            $killedCount++
        }
        catch {
            Write-MCPLog "Error terminando proceso PID $($proc.Id): $($_.Exception.Message)" "ERROR"
        }
    }
    
    Write-MCPLog "Terminados $killedCount procesos MCP" "SUCCESS"
}

# Función para monitoreo continuo
function Start-MCPMonitoring {
    Write-MCPLog "Iniciando monitoreo continuo de procesos MCP..." "INFO"
    Write-MCPLog "Presiona Ctrl+C para detener el monitoreo" "INFO"
    
    try {
        while ($true) {
            $processes = Get-MCPProcesses
            $totalMemory = ($processes | Measure-Object MemoryMB -Sum).Sum
            
            if ($processes.Count -gt 5 -or $totalMemory -gt 500) {
                Write-MCPLog "Límites excedidos: $($processes.Count) procesos, ${totalMemory}MB memoria" "WARN"
                Clear-MCPProcesses
            }
            
            Start-Sleep -Seconds 30
        }
    }
    catch {
        Write-MCPLog "Monitoreo detenido" "INFO"
    }
}

# Ejecución principal
switch ($Action.ToLower()) {
    "status" {
        Show-MCPStatus
    }
    "cleanup" {
        Clear-MCPProcesses
        Show-MCPStatus
    }
    "kill-all" {
        Stop-AllMCPProcesses
        Show-MCPStatus
    }
    "monitor" {
        Start-MCPMonitoring
    }
    default {
        Write-MCPLog "Acción no válida. Usar: status, cleanup, kill-all, monitor" "ERROR"
        exit 1
    }
}
