#!/usr/bin/env node

/**
 * Setup Script: Configurar Tests de MercadoPago
 * 
 * Este script instala las dependencias necesarias y configura
 * el entorno para ejecutar los tests locales
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function runCommand(command, description) {
  console.log(`📦 ${description}...`)
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} completado`)
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message)
    throw error
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath)
}

function createEnvExample() {
  const envExample = `# Variables de entorno necesarias para el test
# Copia este archivo a .env.local y configura tus valores

# Base de datos Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key_aqui

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-tu_access_token_aqui
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-tu_public_key_aqui

# WhatsApp
WHATSAPP_BUSINESS_NUMBER=5493513411796

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth
NEXTAUTH_SECRET=tu_nextauth_secret_aqui
NEXTAUTH_URL=http://localhost:3000
`

  if (!checkFileExists('.env.local')) {
    console.log('📝 Creando archivo .env.local de ejemplo...')
    fs.writeFileSync('.env.local', envExample)
    console.log('✅ Archivo .env.local creado')
    console.log('⚠️  IMPORTANTE: Configura las variables de entorno en .env.local')
  } else {
    console.log('✅ Archivo .env.local ya existe')
  }
}

function createTestPackageJson() {
  const packageJson = {
    "name": "mercadopago-whatsapp-test",
    "version": "1.0.0",
    "description": "Tests para funcionalidad de WhatsApp con MercadoPago",
    "scripts": {
      "test:whatsapp": "node test-whatsapp-message.js",
      "test:mercadopago": "node test-mercadopago-whatsapp.js",
      "test:all": "node run-mercadopago-test.js",
      "setup": "node setup-test.js"
    },
    "dependencies": {
      "node-fetch": "^2.6.7"
    },
    "devDependencies": {}
  }

  if (!checkFileExists('package-test.json')) {
    console.log('📝 Creando package-test.json...')
    fs.writeFileSync('package-test.json', JSON.stringify(packageJson, null, 2))
    console.log('✅ package-test.json creado')
  }
}

async function setupTests() {
  console.log('🔧 CONFIGURANDO TESTS DE MERCADOPAGO WHATSAPP')
  console.log('=' .repeat(60))

  try {
    // Verificar que estamos en el directorio correcto
    if (!checkFileExists('package.json')) {
      throw new Error('No se encontró package.json. Ejecuta este script desde la raíz del proyecto.')
    }

    // Crear archivos de configuración
    createEnvExample()
    createTestPackageJson()

    // Instalar dependencias de test
    console.log('\n📦 Instalando dependencias de test...')
    runCommand('npm install node-fetch@2.6.7', 'Instalando node-fetch')

    // Verificar archivos de test
    const testFiles = [
      'test-whatsapp-message.js',
      'test-mercadopago-whatsapp.js', 
      'run-mercadopago-test.js'
    ]

    console.log('\n📋 Verificando archivos de test...')
    testFiles.forEach(file => {
      if (checkFileExists(file)) {
        console.log(`✅ ${file} existe`)
      } else {
        console.log(`❌ ${file} no encontrado`)
      }
    })

    console.log('\n🎉 CONFIGURACIÓN COMPLETADA')
    console.log('=' .repeat(60))
    console.log('📋 Próximos pasos:')
    console.log('   1. Configurar variables de entorno en .env.local')
    console.log('   2. Ejecutar: npm run dev (en otra terminal)')
    console.log('   3. Ejecutar: node run-mercadopago-test.js')
    console.log('\n🔧 Comandos disponibles:')
    console.log('   - node test-whatsapp-message.js     # Test solo de mensaje')
    console.log('   - node test-mercadopago-whatsapp.js # Test completo con API')
    console.log('   - node run-mercadopago-test.js      # Test completo con servidor')

  } catch (error) {
    console.error('\n❌ ERROR EN LA CONFIGURACIÓN:')
    console.error('   - Mensaje:', error.message)
    console.error('   - Stack:', error.stack)
    
    console.log('\n🔧 Soluciones:')
    console.log('   1. Ejecutar desde la raíz del proyecto')
    console.log('   2. Verificar que Node.js esté instalado')
    console.log('   3. Verificar permisos de escritura')
  }
}

// Ejecutar setup
if (require.main === module) {
  setupTests()
}

module.exports = { setupTests }
