# ===================================
# PINTEYA E-COMMERCE - SCRIPT DE LIMPIEZA DE CACHÉ
# ===================================

Write-Host "🧹 Limpiando caché de desarrollo..." -ForegroundColor Yellow

# Detener procesos de Next.js si están corriendo
Write-Host "Deteniendo procesos de Next.js..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" } | Stop-Process -Force

# Limpiar directorios de caché
$cacheDirs = @(
    ".next",
    "node_modules/.cache",
    ".turbo"
)

foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "Eliminando $dir..." -ForegroundColor Green
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

# Limpiar archivos temporales específicos
$tempFiles = @(
    ".next/trace",
    ".next/cache/webpack/client-development/*.pack.gz",
    ".next/cache/webpack/server-development/*.pack.gz"
)

foreach ($pattern in $tempFiles) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    if ($files) {
        Write-Host "Eliminando archivos temporales: $pattern" -ForegroundColor Green
        $files | Remove-Item -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "✅ Limpieza completada. Ejecuta 'npm run dev' para reiniciar." -ForegroundColor Green
