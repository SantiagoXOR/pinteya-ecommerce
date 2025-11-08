# Script para agregar configuración de runtime Node.js a todos los archivos route.ts
# Esto resuelve el problema de Edge Runtime que causa errores de build

Write-Host "Iniciando configuración de runtime Node.js en archivos route.ts..." -ForegroundColor Green

# Obtener todos los archivos route.ts
$routeFiles = Get-ChildItem -Path "src\app\api" -Recurse -Name "route.ts"
$totalFiles = $routeFiles.Count
$processedFiles = 0
$modifiedFiles = 0

Write-Host "Encontrados $totalFiles archivos route.ts" -ForegroundColor Yellow

foreach ($file in $routeFiles) {
    $fullPath = Join-Path "src\app\api" $file
    $processedFiles++
    
    Write-Progress -Activity "Procesando archivos route.ts" -Status "Archivo $processedFiles de $totalFiles" -PercentComplete (($processedFiles / $totalFiles) * 100)
    
    if (Test-Path $fullPath) {
        try {
            # Leer contenido del archivo
            $content = Get-Content $fullPath -Raw -Encoding UTF8
            
            # Verificar si ya tiene configuración de runtime
            if ($content -notmatch "export const runtime") {
                # Agregar configuración de runtime al inicio
                $newContent = "// Configuración para Node.js Runtime`nexport const runtime = 'nodejs';`n`n" + $content
                
                # Escribir el archivo modificado
                Set-Content -Path $fullPath -Value $newContent -Encoding UTF8
                $modifiedFiles++
                Write-Host "✅ Modificado: $file" -ForegroundColor Green
            } else {
                Write-Host "⏭️  Ya configurado: $file" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "❌ Error procesando $file : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Progress -Activity "Procesando archivos route.ts" -Completed

Write-Host "`n=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "Total de archivos procesados: $processedFiles" -ForegroundColor White
Write-Host "Archivos modificados: $modifiedFiles" -ForegroundColor Green
Write-Host "Archivos ya configurados: $($processedFiles - $modifiedFiles)" -ForegroundColor Gray

Write-Host "`n✅ Configuración de runtime completada!" -ForegroundColor Green
Write-Host "Ahora todos los archivos route.ts están configurados para usar Node.js runtime" -ForegroundColor Yellow