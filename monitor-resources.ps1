# Script de Monitoreo de Recursos
# Ejecutar: .\monitor-resources.ps1

Write-Host "=== MONITOREO DE RECURSOS PINTEYA E-COMMERCE ===" -ForegroundColor Green

while ($true) {
    Clear-Host
    Write-Host "=== $(Get-Date -Format 'HH:mm:ss') ===" -ForegroundColor Yellow
    
    # Antimalware Service
    $defender = Get-Process MsMpEng -ErrorAction SilentlyContinue
    if ($defender) {
        $defenderCPU = [math]::Round($defender.CPU, 2)
        $defenderMem = [math]::Round($defender.WorkingSet / 1MB, 1)
        Write-Host "🛡️  Defender: CPU $defenderCPU% | RAM ${defenderMem}MB" -ForegroundColor Red
    }
    
    # Visual Studio Code
    $vscode = Get-Process Code -ErrorAction SilentlyContinue
    if ($vscode) {
        $vscodeMem = [math]::Round(($vscode | Measure-Object WorkingSet -Sum).Sum / 1MB, 1)
        Write-Host "💻 VSCode: RAM ${vscodeMem}MB | Procesos: $($vscode.Count)" -ForegroundColor Blue
    }
    
    # Node.js
    $node = Get-Process node -ErrorAction SilentlyContinue
    if ($node) {
        $nodeMem = [math]::Round(($node | Measure-Object WorkingSet -Sum).Sum / 1MB, 1)
        Write-Host "🟢 Node.js: RAM ${nodeMem}MB | Procesos: $($node.Count)" -ForegroundColor Green
    }
    
    # Memoria Total del Sistema
    $totalMem = Get-CimInstance Win32_OperatingSystem
    $usedMem = [math]::Round(($totalMem.TotalVisibleMemorySize - $totalMem.FreePhysicalMemory) / 1MB, 1)
    $totalMemGB = [math]::Round($totalMem.TotalVisibleMemorySize / 1MB, 1)
    $memPercent = [math]::Round(($usedMem / $totalMemGB) * 100, 1)
    
    Write-Host "📊 Sistema: ${usedMem}GB / ${totalMemGB}GB (${memPercent}%)" -ForegroundColor Cyan
    
    Write-Host "`nPresiona Ctrl+C para salir..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}
