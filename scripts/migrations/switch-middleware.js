#!/usr/bin/env node

/**
 * SCRIPT PARA CAMBIAR MIDDLEWARE SEGÚN ENTORNO
 *
 * Este script permite cambiar entre el middleware de producción
 * y el middleware de testing de forma automática.
 */

const fs = require('fs')
const path = require('path')

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue')
}

// Rutas de archivos
const MIDDLEWARE_PROD = 'middleware.ts'
const MIDDLEWARE_TEST = 'middleware.test.ts'
const MIDDLEWARE_BACKUP = 'middleware.backup.ts'

/**
 * Verifica si un archivo existe
 */
function fileExists(filePath) {
  return fs.existsSync(filePath)
}

/**
 * Crea backup del middleware actual
 */
function createBackup() {
  if (fileExists(MIDDLEWARE_PROD)) {
    fs.copyFileSync(MIDDLEWARE_PROD, MIDDLEWARE_BACKUP)
    logSuccess(`Backup creado: ${MIDDLEWARE_BACKUP}`)
    return true
  }
  return false
}

/**
 * Restaura backup del middleware
 */
function restoreBackup() {
  if (fileExists(MIDDLEWARE_BACKUP)) {
    fs.copyFileSync(MIDDLEWARE_BACKUP, MIDDLEWARE_PROD)
    logSuccess(`Backup restaurado: ${MIDDLEWARE_PROD}`)
    return true
  }
  logWarning('No se encontró backup para restaurar')
  return false
}

/**
 * Cambia a middleware de testing
 */
function switchToTest() {
  log('\n🧪 CAMBIANDO A MIDDLEWARE DE TESTING', 'bright')
  log('='.repeat(50), 'cyan')

  try {
    // Crear backup del middleware actual
    if (fileExists(MIDDLEWARE_PROD)) {
      createBackup()
    }

    // Verificar que existe el middleware de testing
    if (!fileExists(MIDDLEWARE_TEST)) {
      throw new Error(`No se encontró el middleware de testing: ${MIDDLEWARE_TEST}`)
    }

    // Copiar middleware de testing
    fs.copyFileSync(MIDDLEWARE_TEST, MIDDLEWARE_PROD)
    logSuccess(`Middleware de testing activado: ${MIDDLEWARE_PROD}`)

    // Configurar variables de entorno
    process.env.NODE_ENV = 'test'
    process.env.PLAYWRIGHT_TEST = 'true'

    logInfo('Variables de entorno configuradas para testing')
    logSuccess('🎭 Middleware de testing activado correctamente')

    return true
  } catch (error) {
    logError(`Error cambiando a middleware de testing: ${error.message}`)
    return false
  }
}

/**
 * Cambia a middleware de producción
 */
function switchToProduction() {
  log('\n🏭 CAMBIANDO A MIDDLEWARE DE PRODUCCIÓN', 'bright')
  log('='.repeat(50), 'cyan')

  try {
    // Restaurar backup si existe
    if (fileExists(MIDDLEWARE_BACKUP)) {
      restoreBackup()
      logSuccess('🔒 Middleware de producción restaurado')
    } else {
      logWarning('No se encontró backup, el middleware actual se mantendrá')
    }

    // Limpiar variables de entorno de testing
    delete process.env.PLAYWRIGHT_TEST
    if (process.env.NODE_ENV === 'test') {
      process.env.NODE_ENV = 'development'
    }

    logInfo('Variables de entorno de testing limpiadas')
    logSuccess('🏭 Middleware de producción activado correctamente')

    return true
  } catch (error) {
    logError(`Error cambiando a middleware de producción: ${error.message}`)
    return false
  }
}

/**
 * Muestra el estado actual del middleware
 */
function showStatus() {
  log('\n📊 ESTADO ACTUAL DEL MIDDLEWARE', 'bright')
  log('='.repeat(40), 'cyan')

  // Verificar archivos
  logInfo(`Middleware principal: ${fileExists(MIDDLEWARE_PROD) ? '✅ Existe' : '❌ No existe'}`)
  logInfo(`Middleware de testing: ${fileExists(MIDDLEWARE_TEST) ? '✅ Existe' : '❌ No existe'}`)
  logInfo(`Backup disponible: ${fileExists(MIDDLEWARE_BACKUP) ? '✅ Existe' : '❌ No existe'}`)

  // Verificar variables de entorno
  const nodeEnv = process.env.NODE_ENV || 'undefined'
  const playwrightTest = process.env.PLAYWRIGHT_TEST || 'undefined'

  log('\n🔧 Variables de entorno:', 'blue')
  logInfo(`NODE_ENV: ${nodeEnv}`)
  logInfo(`PLAYWRIGHT_TEST: ${playwrightTest}`)

  // Determinar modo actual
  if (playwrightTest === 'true' || nodeEnv === 'test') {
    log('\n🧪 MODO ACTUAL: TESTING', 'yellow')
  } else {
    log('\n🏭 MODO ACTUAL: PRODUCCIÓN', 'green')
  }
}

/**
 * Muestra ayuda
 */
function showHelp() {
  log('\n🔧 SCRIPT DE CAMBIO DE MIDDLEWARE', 'bright')
  log('='.repeat(40), 'cyan')
  log('\nUso: node scripts/switch-middleware.js [comando]', 'blue')
  log('\nComandos disponibles:', 'yellow')
  log('  test        Cambiar a middleware de testing')
  log('  prod        Cambiar a middleware de producción')
  log('  production  Alias para prod')
  log('  status      Mostrar estado actual')
  log('  help        Mostrar esta ayuda')
  log('\nEjemplos:', 'yellow')
  log('  node scripts/switch-middleware.js test')
  log('  node scripts/switch-middleware.js prod')
  log('  node scripts/switch-middleware.js status')
}

/**
 * Función principal
 */
function main() {
  const command = process.argv[2]

  if (!command) {
    showHelp()
    return
  }

  switch (command.toLowerCase()) {
    case 'test':
    case 'testing':
      switchToTest()
      break

    case 'prod':
    case 'production':
      switchToProduction()
      break

    case 'status':
    case 'info':
      showStatus()
      break

    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break

    default:
      logError(`Comando desconocido: ${command}`)
      showHelp()
      process.exit(1)
  }
}

// Ejecutar script
main()
