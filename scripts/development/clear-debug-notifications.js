#!/usr/bin/env node

// ===================================
// SCRIPT: Limpiar Notificaciones de Debug
// Descripción: Elimina sistemas de debugging que causan notificaciones persistentes
// ===================================

const fs = require('fs')
const path = require('path')

console.log('🧹 Iniciando limpieza de notificaciones de debug...\n')

// ===================================
// FUNCIONES DE LIMPIEZA
// ===================================

/**
 * Limpiar caché de Jest que puede contener código de debugging
 */
function clearJestCache() {
  const jestCacheDir = path.join(process.cwd(), '.jest-cache')

  if (fs.existsSync(jestCacheDir)) {
    console.log('🗑️  Eliminando caché de Jest...')
    try {
      fs.rmSync(jestCacheDir, { recursive: true, force: true })
      console.log('✅ Caché de Jest eliminado')
    } catch (error) {
      console.log('⚠️  Error eliminando caché de Jest (puede estar en uso):', error.message)
    }
  } else {
    console.log('ℹ️  No se encontró caché de Jest')
  }
}

/**
 * Limpiar caché de Next.js
 */
function clearNextCache() {
  const nextCacheDir = path.join(process.cwd(), '.next')

  if (fs.existsSync(nextCacheDir)) {
    console.log('🗑️  Eliminando caché de Next.js...')
    fs.rmSync(nextCacheDir, { recursive: true, force: true })
    console.log('✅ Caché de Next.js eliminado')
  } else {
    console.log('ℹ️  No se encontró caché de Next.js')
  }
}

/**
 * Limpiar caché de node_modules
 */
function clearNodeModulesCache() {
  const cacheDir = path.join(process.cwd(), 'node_modules', '.cache')

  if (fs.existsSync(cacheDir)) {
    console.log('🗑️  Eliminando caché de node_modules...')
    fs.rmSync(cacheDir, { recursive: true, force: true })
    console.log('✅ Caché de node_modules eliminado')
  } else {
    console.log('ℹ️  No se encontró caché de node_modules')
  }
}

/**
 * Verificar y deshabilitar debugging en providers
 */
function disableProviderDebugging() {
  const providersPath = path.join(process.cwd(), 'src', 'app', 'providers.tsx')

  if (fs.existsSync(providersPath)) {
    console.log('🔧 Verificando debugging en providers...')

    let content = fs.readFileSync(providersPath, 'utf8')

    // Comentar logs de debug
    const debugLogPattern = /console\.log\('🔧 PROVIDERS DEBUG:'/g
    if (debugLogPattern.test(content)) {
      content = content.replace(
        /console\.log\('🔧 PROVIDERS DEBUG:'[\s\S]*?\}\);/g,
        "// console.log('🔧 PROVIDERS DEBUG:', { ... }); // Debugging deshabilitado"
      )

      fs.writeFileSync(providersPath, content)
      console.log('✅ Debugging en providers deshabilitado')
    } else {
      console.log('ℹ️  No se encontró debugging activo en providers')
    }
  }
}

/**
 * Verificar notificaciones del navegador
 */
function checkBrowserNotifications() {
  console.log('🔍 Verificando configuración de notificaciones del navegador...')

  const logisticsWebSocketPath = path.join(
    process.cwd(),
    'src',
    'lib',
    'websockets',
    'logistics-websocket.ts'
  )

  if (fs.existsSync(logisticsWebSocketPath)) {
    const content = fs.readFileSync(logisticsWebSocketPath, 'utf8')

    if (content.includes('new Notification(')) {
      console.log('⚠️  Se encontraron notificaciones del navegador en logistics-websocket.ts')
      console.log('   Estas pueden estar causando las notificaciones persistentes')
      console.log('   Considera deshabilitar las notificaciones en desarrollo')
    }
  }
}

// ===================================
// EJECUCIÓN PRINCIPAL
// ===================================

async function main() {
  try {
    console.log('🎯 Objetivo: Eliminar notificaciones de debugging persistentes\n')

    // Limpiar cachés
    clearJestCache()
    clearNextCache()
    clearNodeModulesCache()

    console.log('')

    // Deshabilitar debugging
    disableProviderDebugging()

    console.log('')

    // Verificar notificaciones
    checkBrowserNotifications()

    console.log('\n🎉 Limpieza completada!')
    console.log('\n📋 Próximos pasos:')
    console.log('1. Ejecuta: npm run dev')
    console.log('2. Verifica que las notificaciones hayan desaparecido')
    console.log('3. Si persisten, revisa la consola del navegador para más pistas')
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { main }
