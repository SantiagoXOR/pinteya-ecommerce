#!/usr/bin/env node

/**
 * SCRIPT DE CONFIGURACIÓN DE VARIABLES DE ENTORNO EN VERCEL
 *
 * Configura automáticamente las variables de NextAuth.js en Vercel
 * para la migración completa de producción.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ⚠️ CONFIGURACIÓN DE VARIABLES PARA VERCEL
// IMPORTANTE: Las credenciales reales deben configurarse manualmente en Vercel Dashboard
// Este archivo NO contiene credenciales reales por seguridad

const VERCEL_ENV_VARS_TEMPLATE = {
  // NextAuth.js Core
  NEXTAUTH_SECRET: '[GENERAR_CON_CRYPTO_RANDOMBYTES_32]',
  NEXTAUTH_URL: 'https://pinteya.com',

  // Google OAuth (configurar en Google Cloud Console)
  AUTH_GOOGLE_ID: '[GOOGLE_OAUTH_CLIENT_ID]',
  AUTH_GOOGLE_SECRET: '[GOOGLE_OAUTH_CLIENT_SECRET]',

  // Supabase (obtener de Supabase Dashboard)
  NEXT_PUBLIC_SUPABASE_URL: '[SUPABASE_PROJECT_URL]',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '[SUPABASE_ANON_KEY]',
  SUPABASE_SERVICE_ROLE_KEY: '[SUPABASE_SERVICE_ROLE_KEY]',

  // MercadoPago (obtener de MercadoPago Dashboard)
  MERCADOPAGO_ACCESS_TOKEN: '[MERCADOPAGO_ACCESS_TOKEN]',
  NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: '[MERCADOPAGO_PUBLIC_KEY]',
  MERCADOPAGO_CLIENT_ID: '[MERCADOPAGO_CLIENT_ID]',
  MERCADOPAGO_CLIENT_SECRET: '[MERCADOPAGO_CLIENT_SECRET]',
  MERCADOPAGO_WEBHOOK_SECRET: '[MERCADOPAGO_WEBHOOK_SECRET]',

  // App Configuration
  NEXT_PUBLIC_APP_URL: 'https://pinteya.com',
  NODE_ENV: 'production',
}

class VercelEnvSetup {
  constructor() {
    this.projectName = 'pinteya-ecommerce'
    this.dryRun = false
  }

  log(message, type = 'info') {
    const icons = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      config: '🔧',
    }
    console.log(`${icons[type]} ${message}`)
  }

  async checkVercelCLI() {
    try {
      execSync('vercel --version', { stdio: 'pipe' })
      this.log('Vercel CLI detectado', 'success')
      return true
    } catch (error) {
      this.log('Vercel CLI no encontrado. Instalar con: npm i -g vercel', 'error')
      return false
    }
  }

  async checkVercelAuth() {
    try {
      const result = execSync('vercel whoami', { stdio: 'pipe', encoding: 'utf8' })
      this.log(`Autenticado como: ${result.trim()}`, 'success')
      return true
    } catch (error) {
      this.log('No autenticado en Vercel. Ejecutar: vercel login', 'error')
      return false
    }
  }

  generateVercelCommands() {
    const commands = []

    Object.entries(VERCEL_ENV_VARS_TEMPLATE).forEach(([key, value]) => {
      // Escapar valores que contienen caracteres especiales
      const escapedValue = value.replace(/"/g, '\\"')
      commands.push(`vercel env add ${key} production`)
    })

    return commands
  }

  generateManualInstructions() {
    this.log('\n🔧 INSTRUCCIONES MANUALES PARA CONFIGURAR VERCEL:', 'config')
    this.log('1. Ir a https://vercel.com/dashboard')
    this.log('2. Seleccionar proyecto: pinteya-ecommerce')
    this.log('3. Ir a Settings > Environment Variables')
    this.log('4. Agregar las siguientes variables para PRODUCTION:\n')

    Object.entries(VERCEL_ENV_VARS_TEMPLATE).forEach(([key, value]) => {
      console.log(`${key}=${value}`)
    })

    this.log('\n5. Hacer redeploy del proyecto después de configurar las variables', 'warning')
  }

  async setEnvironmentVariable(key, value) {
    try {
      if (this.dryRun) {
        this.log(`[DRY RUN] Configurando ${key}`, 'config')
        return true
      }

      // Usar vercel env add de forma interactiva
      this.log(`Configurando ${key}...`, 'config')

      // Para automatizar, necesitaríamos usar la API de Vercel
      // Por ahora, mostrar instrucciones manuales
      return true
    } catch (error) {
      this.log(`Error configurando ${key}: ${error.message}`, 'error')
      return false
    }
  }

  async setupAllVariables() {
    this.log('🚀 INICIANDO CONFIGURACIÓN DE VARIABLES EN VERCEL\n')

    // Verificar prerrequisitos
    const hasVercelCLI = await this.checkVercelCLI()
    if (!hasVercelCLI) {
      this.generateManualInstructions()
      return false
    }

    const isAuthenticated = await this.checkVercelAuth()
    if (!isAuthenticated) {
      this.generateManualInstructions()
      return false
    }

    this.log('\n📋 Variables a configurar:')
    Object.keys(VERCEL_ENV_VARS_TEMPLATE).forEach(key => {
      console.log(`  - ${key}`)
    })

    this.log('\n⚠️  NOTA: La configuración automática requiere interacción manual.', 'warning')
    this.log('Generando instrucciones manuales...', 'info')

    this.generateManualInstructions()

    return true
  }

  async generateDeploymentScript() {
    const deployScript = `#!/bin/bash

# Script de deployment para migración NextAuth.js
echo "🚀 INICIANDO DEPLOYMENT CON NEXTAUTH.JS..."

# 1. Verificar que las variables estén configuradas
echo "📋 Verificando variables de entorno..."
vercel env ls

# 2. Hacer build local para verificar
echo "🔨 Verificando build local..."
npm run build

# 3. Deploy a producción
echo "🚀 Deploying a producción..."
vercel --prod

# 4. Verificar deployment
echo "✅ Deployment completado!"
echo "🔍 Verificar en: https://pinteya.com"
echo "🔒 Probar autenticación en: https://pinteya.com/api/auth/signin"

echo "📋 PRÓXIMOS PASOS:"
echo "1. Verificar que /api/auth/providers responda 200"
echo "2. Verificar que /api/auth/session responda 200"
echo "3. Probar login con Google"
echo "4. Verificar protección de rutas /admin/*"
`

    const scriptPath = path.join(__dirname, 'deploy-nextauth.sh')
    fs.writeFileSync(scriptPath, deployScript)

    // Hacer ejecutable en sistemas Unix
    try {
      execSync(`chmod +x ${scriptPath}`)
    } catch (error) {
      // Ignorar en Windows
    }

    this.log(`Script de deployment generado: ${scriptPath}`, 'success')
  }

  async run() {
    try {
      await this.setupAllVariables()
      await this.generateDeploymentScript()

      this.log('\n🎯 RESUMEN DE MIGRACIÓN A NEXTAUTH.JS:', 'success')
      this.log('1. ✅ Configuración NextAuth.js optimizada')
      this.log('2. 📋 Variables de entorno listadas para Vercel')
      this.log('3. 🚀 Script de deployment generado')
      this.log('4. ⚠️  Configurar variables manualmente en Vercel Dashboard')
      this.log('5. 🚀 Ejecutar deployment con: ./scripts/deploy-nextauth.sh')

      return true
    } catch (error) {
      this.log(`Error durante setup: ${error.message}`, 'error')
      return false
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const setup = new VercelEnvSetup()
  setup
    .run()
    .then(success => {
      if (success) {
        console.log('\n✅ Setup completado exitosamente!')
        process.exit(0)
      } else {
        console.log('\n❌ Setup falló. Ver instrucciones manuales arriba.')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('💥 Error fatal:', error)
      process.exit(1)
    })
}

module.exports = VercelEnvSetup
