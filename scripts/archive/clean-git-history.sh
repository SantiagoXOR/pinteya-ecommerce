#!/bin/bash

# ===================================
# SCRIPT DE LIMPIEZA DE HISTORIAL GIT
# ===================================
# 
# ⚠️ ADVERTENCIA: Este script reescribe el historial de Git
# Solo ejecutar si es absolutamente necesario
# Hacer backup antes de ejecutar
#
# ===================================

echo "🚨 LIMPIEZA DE CREDENCIALES DEL HISTORIAL GIT"
echo "=============================================="

# Verificar que git-filter-repo esté instalado
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo no está instalado"
    echo "📦 Instalar con: pip install git-filter-repo"
    exit 1
fi

echo "⚠️  ADVERTENCIA: Este proceso reescribirá el historial de Git"
echo "📋 Credenciales que serán removidas:"
echo "   - Google OAuth Secrets (GOCSPX-*)"
echo "   - Supabase JWT Tokens (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9*)"
echo "   - MercadoPago Access Tokens (APP_USR-*)"
echo "   - NextAuth Secrets"
echo ""
read -p "¿Continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Crear backup
echo "📦 Creando backup del repositorio..."
git bundle create ../pinteya-backup-$(date +%Y%m%d-%H%M%S).bundle --all

# Limpiar credenciales específicas
echo "🧹 Limpiando credenciales del historial..."

# Google OAuth
git filter-repo --replace-text <(echo "[GOOGLE_OAUTH_SECRET_REMOVED]==>[GOOGLE_OAUTH_SECRET_REMOVED]")
git filter-repo --replace-text <(echo "[GOOGLE_OAUTH_CLIENT_ID_REMOVED]==>[GOOGLE_OAUTH_CLIENT_ID_REMOVED]")

# Supabase
git filter-repo --replace-text <(echo "[SUPABASE_ANON_KEY_REMOVED]==>[SUPABASE_ANON_KEY_REMOVED]")
git filter-repo --replace-text <(echo "[SUPABASE_SERVICE_ROLE_KEY_REMOVED]==>[SUPABASE_SERVICE_ROLE_KEY_REMOVED]")

# MercadoPago
git filter-repo --replace-text <(echo "[MERCADOPAGO_ACCESS_TOKEN_REMOVED]==>[MERCADOPAGO_ACCESS_TOKEN_REMOVED]")
git filter-repo --replace-text <(echo "[MERCADOPAGO_ACCESS_TOKEN_REMOVED]==>[MERCADOPAGO_ACCESS_TOKEN_REMOVED]")

# NextAuth
git filter-repo --replace-text <(echo "[NEXTAUTH_SECRET_REMOVED]==>[NEXTAUTH_SECRET_REMOVED]")

echo "✅ Limpieza completada"
echo "⚠️  IMPORTANTE: El historial ha sido reescrito"
echo "📋 Próximos pasos:"
echo "   1. Verificar que el repositorio funciona correctamente"
echo "   2. Hacer force push: git push --force-with-lease origin main"
echo "   3. Notificar a otros desarrolladores sobre el cambio de historial"
echo ""
echo "🔄 Para restaurar desde backup si algo sale mal:"
echo "   git clone ../pinteya-backup-*.bundle restored-repo"
