# Script para actualizar importaciones de auth
Write-Host "Actualizando importaciones de auth..." -ForegroundColor Green

$projectRoot = "C:\Users\marti\Desktop\DESARROLLOSW\BOILERPLATTE E-COMMERCE"
$srcPath = Join-Path $projectRoot "src"

# Buscar archivos que importan desde @/auth
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.ts", "*.tsx" | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*\.next*" 
}

$processedCount = 0
$modifiedCount = 0

foreach ($file in $files) {
    $fullPath = $file.FullName
    $content = Get-Content $fullPath -Raw -ErrorAction SilentlyContinue
    
    if ($content -and $content -match "from\s+['""]@/auth['""]") {
        $processedCount++
        
        # Reemplazar importación de @/auth por @/lib/auth/config
        $newContent = $content -replace "from\s+['""]@/auth['""]", "from '@/lib/auth/config'"
        
        if ($newContent -ne $content) {
            Set-Content -Path $fullPath -Value $newContent -NoNewline
            $modifiedCount++
            Write-Host "Modificado: $($file.Name)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nResumen:" -ForegroundColor Green
Write-Host "Archivos procesados: $processedCount" -ForegroundColor White
Write-Host "Archivos modificados: $modifiedCount" -ForegroundColor White
Write-Host "Configuración de auth actualizada completamente." -ForegroundColor Green