#!/usr/bin/env python3
"""
Script de limpieza de historial Git para remover credenciales expuestas
"""

import os
import sys
import subprocess
import tempfile
from pathlib import Path

def print_colored(message, color="white"):
    """Imprimir mensaje con color"""
    colors = {
        "red": "\033[91m",
        "green": "\033[92m", 
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "cyan": "\033[96m",
        "white": "\033[97m",
        "reset": "\033[0m"
    }
    print(f"{colors.get(color, colors['white'])}{message}{colors['reset']}")

def check_git_filter_repo():
    """Verificar que git-filter-repo esté instalado"""
    try:
        import git_filter_repo
        return True
    except ImportError:
        return False

def main():
    print_colored("🚨 LIMPIEZA DE CREDENCIALES DEL HISTORIAL GIT", "red")
    print_colored("===============================================", "yellow")
    
    # Verificar git-filter-repo
    if not check_git_filter_repo():
        print_colored("❌ git-filter-repo no está instalado", "red")
        print_colored("📦 Instalar con: pip install git-filter-repo", "yellow")
        sys.exit(1)
    
    print_colored("⚠️  ADVERTENCIA: Este proceso reescribirá el historial de Git", "yellow")
    print_colored("📋 Credenciales que serán removidas:", "cyan")
    print_colored("   - Google OAuth Secrets (GOCSPX-*)", "white")
    print_colored("   - Supabase JWT Tokens (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9*)", "white")
    print_colored("   - MercadoPago Access Tokens (APP_USR-*)", "white")
    print_colored("   - NextAuth Secrets", "white")
    print("")
    
    confirmation = input("¿Continuar? (y/N): ")
    if confirmation.lower() != 'y':
        print_colored("❌ Operación cancelada", "red")
        sys.exit(1)
    
    print_colored("🧹 Iniciando limpieza de credenciales del historial...", "green")
    
    # Credenciales a remover
    replacements = [
        "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==>[GOOGLE_OAUTH_SECRET_REMOVED]",
        "76477973505-tqui6nk4dunjci0t2sta391bd63kl0pu.apps.googleusercontent.com==>[GOOGLE_OAUTH_CLIENT_ID_REMOVED]",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzQxMTIsImV4cCI6MjA2NDkxMDExMn0.4f3FScXKA5xnSUekHWhtautpqejwYupPI15dJ0oatlM==>[SUPABASE_ANON_KEY_REMOVED]",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMzNDExMiwiZXhwIjoyMDY0OTEwMTEyfQ.r-RFBL09kjQtMO3_RrHyh4sqOiaYrkT86knc_bP0c6g==>[SUPABASE_SERVICE_ROLE_KEY_REMOVED]",
        "APP_USR-1666432701165913-062411-afba33f755c88d68ad6b8b6b5b8e8e8e-1666432701==>[MERCADOPAGO_ACCESS_TOKEN_REMOVED]",
        "APP_USR-921414591813674-121116-9d0109c7050807d76606491e8a1711d9-176553735==>[MERCADOPAGO_ACCESS_TOKEN_REMOVED]",
        "L1m+iV4Wi4JKKp97wvqOfkh3tnnsxe7pNnn1asEV7vw===>[NEXTAUTH_SECRET_REMOVED]",
        "sk_live_[STRIPE_SECRET_PATTERN]==>[STRIPE_SECRET_KEY_REMOVED]",
        "pk_live_Y2xlcmsucGludGV5YS5jb20k==>[STRIPE_PUBLIC_KEY_REMOVED]",
        "sk_test_==>[STRIPE_SECRET_KEY_REMOVED]",
        "pk_test_==>[STRIPE_PUBLIC_KEY_REMOVED]",
        "        "whsec_TdGlLw2mxSzdkiBM8M655Lu5/6CWrBdr==>[WEBHOOK_SECRET_REMOVED]",
        "APP_USR-1666432701165913-062411-afba33f755c88d68ad8a435e4b90fc14-452711838==>[MERCADOPAGO_ACCESS_TOKEN_REMOVED]",
        "APP_USR-1fffdd3e-155d-4b1a-93af-8b79b7242962==>[MERCADOPAGO_PUBLIC_KEY_REMOVED]",
        "1666432701165913==>[MERCADOPAGO_CLIENT_ID_REMOVED]",
        "        "kCyTlavw8B2l9zJ7T5IMeR3nOhLOHrTm==>[MERCADOPAGO_CLIENT_SECRET_REMOVED]",
        "pk_live_Y2xlcmsucGludGV5YS5jb20k==>[CLERK_PUBLISHABLE_KEY_REMOVED]",
        "sk_live_[CLERK_SECRET_PATTERN]==>[CLERK_SECRET_KEY_REMOVED]",
        "L1m+iV4Wi4JKKp97wvqOfkh3tnnsxe7pNnn1asEV7vw===>[NEXTAUTH_SECRET_REMOVED]",
        "76477973505-tqui6nk4dunjci0t2sta391bd63kl0pu.apps.googleusercontent.com==>[GOOGLE_CLIENT_ID_REMOVED]",
        "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==>[GOOGLE_CLIENT_SECRET_REMOVED]"""
    ]
    
    # Crear archivo temporal con reemplazos
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        for replacement in replacements:
            f.write(replacement + '\n')
        temp_file = f.name
    
    try:
        print_colored("🔄 Ejecutando git-filter-repo...", "yellow")
        
        # Ejecutar git-filter-repo
        cmd = [
            sys.executable, "-m", "git_filter_repo",
            "--replace-text", temp_file,
            "--force"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print_colored("✅ Limpieza completada exitosamente", "green")
        else:
            print_colored(f"❌ Error durante la limpieza: {result.stderr}", "red")
            sys.exit(1)
            
    except Exception as e:
        print_colored(f"❌ Error ejecutando git-filter-repo: {e}", "red")
        sys.exit(1)
    finally:
        # Limpiar archivo temporal
        try:
            os.unlink(temp_file)
        except:
            pass
    
    print("")
    print_colored("⚠️  IMPORTANTE: El historial ha sido reescrito", "yellow")
    print_colored("📋 Próximos pasos:", "cyan")
    print_colored("   1. Verificar que el repositorio funciona correctamente", "white")
    print_colored("   2. Hacer force push: git push --force-with-lease origin main", "white")
    print_colored("   3. Notificar a otros desarrolladores sobre el cambio de historial", "white")
    print("")
    print_colored("🔄 Para restaurar desde backup si algo sale mal:", "cyan")
    print_colored("   git clone ../pinteya-backup-*.bundle restored-repo", "white")

if __name__ == "__main__":
    main()
