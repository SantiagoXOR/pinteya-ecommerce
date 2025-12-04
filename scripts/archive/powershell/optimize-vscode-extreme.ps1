# ===== OPTIMIZACIÓN EXTREMA DE VS CODE =====
# Script para reducir drásticamente el uso de CPU de VS Code
# Autor: Sistema de Optimización Pinteya E-commerce
# Fecha: Enero 2025

param(
    [switch]$Restore,  # Restaurar configuración normal
    [switch]$Verbose
)

# Función para logging
function Write-OptimizationLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    if ($Verbose) {
        $color = switch($Level) {
            "ERROR" { "Red" }
            "WARN" { "Yellow" }
            "SUCCESS" { "Green" }
            default { "White" }
        }
        Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
    }
}

# Función para terminar procesos VS Code innecesarios
function Stop-VSCodeProcesses {
    Write-OptimizationLog "Terminando procesos VS Code innecesarios..." "INFO"
    
    $vscodeProcesses = Get-Process Code -ErrorAction SilentlyContinue
    $killedCount = 0
    
    foreach ($process in $vscodeProcesses) {
        try {
            $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($process.Id)").CommandLine
            
            # Mantener solo el proceso principal y el renderer principal
            if ($commandLine -and (
                $commandLine -match "--type=extensionHost" -or
                $commandLine -match "--type=utility" -or
                $commandLine -match "--type=gpu-process" -or
                $commandLine -match "--type=crashpad-handler"
            )) {
                Stop-Process -Id $process.Id -Force
                Write-OptimizationLog "Terminado proceso VS Code: PID $($process.Id)" "SUCCESS"
                $killedCount++
            }
        }
        catch {
            # Ignorar errores de acceso
        }
    }
    
    Write-OptimizationLog "Procesos VS Code terminados: $killedCount" "SUCCESS"
}

# Función para limpiar cache de VS Code
function Clear-VSCodeCache {
    Write-OptimizationLog "Limpiando cache de VS Code..." "INFO"
    
    $userProfile = $env:USERPROFILE
    $cachePaths = @(
        "$userProfile\AppData\Roaming\Code\User\workspaceStorage",
        "$userProfile\AppData\Roaming\Code\CachedExtensions",
        "$userProfile\AppData\Roaming\Code\logs",
        "$userProfile\AppData\Roaming\Code\CachedData"
    )
    
    foreach ($path in $cachePaths) {
        if (Test-Path $path) {
            try {
                Remove-Item -Path "$path\*" -Recurse -Force -ErrorAction SilentlyContinue
                Write-OptimizationLog "Cache limpiado: $path" "SUCCESS"
            }
            catch {
                Write-OptimizationLog "Error limpiando cache: $path" "WARN"
            }
        }
    }
}

# Función para configurar límites de memoria para VS Code
function Set-VSCodeMemoryLimits {
    Write-OptimizationLog "Configurando límites de memoria para VS Code..." "INFO"
    
    # Crear archivo de configuración de memoria
    $configPath = "$env:USERPROFILE\AppData\Roaming\Code\User\settings.json"
    
    if (Test-Path $configPath) {
        try {
            $settings = Get-Content $configPath | ConvertFrom-Json
            
            # Agregar configuraciones de memoria
            $settings | Add-Member -NotePropertyName "window.memoryLimit" -NotePropertyValue "2048" -Force
            $settings | Add-Member -NotePropertyName "extensions.memoryLimit" -NotePropertyValue "512" -Force
            $settings | Add-Member -NotePropertyName "typescript.tsserver.maxTsServerMemory" -NotePropertyValue "1024" -Force
            
            $settings | ConvertTo-Json -Depth 10 | Set-Content $configPath
            Write-OptimizationLog "Límites de memoria configurados" "SUCCESS"
        }
        catch {
            Write-OptimizationLog "Error configurando límites de memoria" "ERROR"
        }
    }
}

# Función para deshabilitar extensiones pesadas
function Disable-HeavyExtensions {
    Write-OptimizationLog "Deshabilitando extensiones pesadas..." "INFO"
    
    $heavyExtensions = @(
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-eslint",
        "ms-python.python",
        "ms-vscode.cpptools",
        "ms-dotnettools.csharp"
    )
    
    foreach ($extension in $heavyExtensions) {
        try {
            & code --disable-extension $extension
            Write-OptimizationLog "Extensión deshabilitada: $extension" "SUCCESS"
        }
        catch {
            Write-OptimizationLog "Error deshabilitando extensión: $extension" "WARN"
        }
    }
}

# Función para restaurar configuración normal
function Restore-VSCodeConfig {
    Write-OptimizationLog "Restaurando configuración normal de VS Code..." "INFO"
    
    # Restaurar extensiones
    $heavyExtensions = @(
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-eslint"
    )
    
    foreach ($extension in $heavyExtensions) {
        try {
            & code --enable-extension $extension
            Write-OptimizationLog "Extensión habilitada: $extension" "SUCCESS"
        }
        catch {
            Write-OptimizationLog "Error habilitando extensión: $extension" "WARN"
        }
    }
    
    Write-OptimizationLog "Configuración restaurada. Reinicia VS Code." "SUCCESS"
}

# Función para monitorear uso de CPU de VS Code
function Monitor-VSCodeCPU {
    Write-OptimizationLog "Monitoreando uso de CPU de VS Code..." "INFO"
    
    $vscodeProcesses = Get-Process Code -ErrorAction SilentlyContinue
    $totalCPU = 0
    $totalMemory = 0
    
    foreach ($process in $vscodeProcesses) {
        $cpu = $process.CPU
        $memory = [math]::Round($process.WorkingSet / 1MB, 1)
        $totalCPU += $cpu
        $totalMemory += $memory
        
        Write-OptimizationLog "VS Code PID $($process.Id): CPU $cpu, RAM ${memory}MB" "INFO"
    }
    
    Write-OptimizationLog "VS Code TOTAL: CPU $totalCPU, RAM ${totalMemory}MB" "INFO"
}

# Ejecución principal
if ($Restore) {
    Restore-VSCodeConfig
} else {
    Write-OptimizationLog "=== OPTIMIZACIÓN EXTREMA DE VS CODE ===" "INFO"
    
    # Monitorear estado inicial
    Monitor-VSCodeCPU
    
    # Aplicar optimizaciones
    Stop-VSCodeProcesses
    Clear-VSCodeCache
    Set-VSCodeMemoryLimits
    Disable-HeavyExtensions
    
    Write-OptimizationLog "=== OPTIMIZACIÓN COMPLETADA ===" "SUCCESS"
    Write-OptimizationLog "Reinicia VS Code para aplicar todos los cambios" "INFO"
    Write-OptimizationLog "Usa -Restore para volver a la configuración normal" "INFO"
    
    # Monitorear estado final
    Start-Sleep -Seconds 3
    Monitor-VSCodeCPU
}
