# ===================================
# SCRIPT DE LIMPIEZA DE HISTORIAL GIT
# ===================================
# 
# ⚠️ ADVERTENCIA: Este script reescribe el historial de Git
# Solo ejecutar si es absolutamente necesario
# Hacer backup antes de ejecutar
#
# ===================================

Write-Host "🚨 LIMPIEZA DE CREDENCIALES DEL HISTORIAL GIT" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Yellow

# Verificar que git-filter-repo esté instalado
try {
    python -c "import git_filter_repo" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ git-filter-repo no está instalado" -ForegroundColor Red
        Write-Host "📦 Instalar con: pip install git-filter-repo" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ git-filter-repo no está instalado" -ForegroundColor Red
    Write-Host "📦 Instalar con: pip install git-filter-repo" -ForegroundColor Yellow
    exit 1
}

Write-Host "⚠️  ADVERTENCIA: Este proceso reescribirá el historial de Git" -ForegroundColor Yellow
Write-Host "📋 Credenciales que serán removidas:" -ForegroundColor Cyan
Write-Host "   - Google OAuth Secrets (GOCSPX-*)" -ForegroundColor White
Write-Host "   - Supabase JWT Tokens (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9*)" -ForegroundColor White
Write-Host "   - MercadoPago Access Tokens (APP_USR-*)" -ForegroundColor White
Write-Host "   - NextAuth Secrets" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "¿Continuar? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 1
}

Write-Host "🧹 Iniciando limpieza de credenciales del historial..." -ForegroundColor Green

# Crear archivo temporal con reemplazos
$replacementLines = @(
    "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==>[GOOGLE_OAUTH_SECRET_REMOVED]",
    "76477973505-tqui6nk4dunjci0t2sta391bd63kl0pu.apps.googleusercontent.com==>[GOOGLE_OAUTH_CLIENT_ID_REMOVED]",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzQxMTIsImV4cCI6MjA2NDkxMDExMn0.4f3FScXKA5xnSUekHWhtautpqejwYupPI15dJ0oatlM==>[SUPABASE_ANON_KEY_REMOVED]",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMzNDExMiwiZXhwIjoyMDY0OTEwMTEyfQ.r-RFBL09kjQtMO3_RrHyh4sqOiaYrkT86knc_bP0c6g==>[SUPABASE_SERVICE_ROLE_KEY_REMOVED]",
    "APP_USR-[PATTERN_REMOVED]==>[MERCADOPAGO_ACCESS_TOKEN_REMOVED]",
    "APP_USR-[PATTERN_REMOVED]==>[MERCADOPAGO_ACCESS_TOKEN_REMOVED]",
    "L1m+iV4Wi4JKKp97wvqOfkh3tnnsxe7pNnn1asEV7vw===>[NEXTAUTH_SECRET_REMOVED]"
)

$replacementLines | Out-File -FilePath "temp_replacements.txt" -Encoding UTF8

# Ejecutar git-filter-repo
try {
    Write-Host "🔄 Ejecutando git-filter-repo..." -ForegroundColor Yellow
    python -m git_filter_repo --replace-text temp_replacements.txt --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Limpieza completada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error durante la limpieza" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error ejecutando git-filter-repo: $_" -ForegroundColor Red
    exit 1
} finally {
    # Limpiar archivo temporal
    if (Test-Path "temp_replacements.txt") {
        Remove-Item "temp_replacements.txt"
    }
}

Write-Host ""
Write-Host "⚠️  IMPORTANTE: El historial ha sido reescrito" -ForegroundColor Yellow
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Verificar que el repositorio funciona correctamente" -ForegroundColor White
Write-Host "   2. Hacer force push: git push --force-with-lease origin main" -ForegroundColor White
Write-Host "   3. Notificar a otros desarrolladores sobre el cambio de historial" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Para restaurar desde backup si algo sale mal:" -ForegroundColor Cyan
Write-Host "   git clone ../pinteya-backup-*.bundle restored-repo" -ForegroundColor White
