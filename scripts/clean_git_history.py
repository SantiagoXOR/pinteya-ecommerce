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
    
    # Credenciales a remover - PATRONES FICTICIOS SEGUROS
    replacements = [
        "GOCSPX-EXAMPLE_PATTERN_SAFE==>[GOOGLE_OAUTH_SECRET_REMOVED]",
        "EXAMPLE_GOOGLE_CLIENT_ID_PATTERN==>[GOOGLE_OAUTH_CLIENT_ID_REMOVED]",
        "sb_publishable_EXAMPLE_PATTERN==>[SUPABASE_ANON_KEY_REMOVED]",
        "sb_secret_EXAMPLE_PATTERN==>[SUPABASE_SERVICE_ROLE_KEY_REMOVED]",
        "EXAMPLE_SUPABASE_ANON_KEY_PATTERN==>[SUPABASE_ANON_KEY_REMOVED]",
        "EXAMPLE_SUPABASE_SERVICE_ROLE_KEY_PATTERN==>[SUPABASE_SERVICE_ROLE_KEY_REMOVED]",
        "APP_USR-EXAMPLE123456789-EXAMPLE-EXAMPLE123456789EXAMPLE-EXAMPLE123==>[MERCADOPAGO_ACCESS_TOKEN_REMOVED]",
        "APP_USR-EXAMPLE987654321-EXAMPLE-EXAMPLE987654321EXAMPLE-EXAMPLE987==>[MERCADOPAGO_ACCESS_TOKEN_REMOVED]",
        "EXAMPLE_NEXTAUTH_SECRET_PATTERN_SAFE==>[NEXTAUTH_SECRET_REMOVED]",
        "sk_live_EXAMPLE_STRIPE_SECRET_PATTERN==>[STRIPE_SECRET_KEY_REMOVED]",
        "pk_live_EXAMPLE_STRIPE_PUBLIC_PATTERN==>[STRIPE_PUBLIC_KEY_REMOVED]",
        "sk_test_EXAMPLE_STRIPE_TEST_SECRET==>[STRIPE_SECRET_KEY_REMOVED]",
        "pk_test_EXAMPLE_STRIPE_TEST_PUBLIC==>[STRIPE_PUBLIC_KEY_REMOVED]",
        "whsec_EXAMPLE_WEBHOOK_SECRET_PATTERN==>[WEBHOOK_SECRET_REMOVED]",
        "APP_USR-EXAMPLE111222333-EXAMPLE-EXAMPLE111222333EXAMPLE-EXAMPLE111==>[MERCADOPAGO_ACCESS_TOKEN_REMOVED]",
        "APP_USR-EXAMPLEaaaa-bbbb-cccc-dddd-EXAMPLEeeee==>[MERCADOPAGO_PUBLIC_KEY_REMOVED]",
        "EXAMPLE123456789==>[MERCADOPAGO_CLIENT_ID_REMOVED]",
        "EXAMPLE_CLIENT_SECRET_PATTERN_SAFE==>[MERCADOPAGO_CLIENT_SECRET_REMOVED]",
        "pk_live_EXAMPLE_CLERK_PUBLIC_PATTERN==>[CLERK_PUBLISHABLE_KEY_REMOVED]",
        "sk_live_EXAMPLE_CLERK_SECRET_PATTERN==>[CLERK_SECRET_KEY_REMOVED]",
        "EXAMPLE_NEXTAUTH_SECRET_PATTERN_SAFE_2==>[NEXTAUTH_SECRET_REMOVED]",
        "EXAMPLE123456789-EXAMPLE_GOOGLE_CLIENT_ID.apps.googleusercontent.com==>[GOOGLE_CLIENT_ID_REMOVED]",
        "GOCSPX-EXAMPLE_GOOGLE_CLIENT_SECRET_PATTERN==>[GOOGLE_CLIENT_SECRET_REMOVED]"
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
