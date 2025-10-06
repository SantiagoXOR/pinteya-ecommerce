#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - SOLUCIONADOR DE ERRORES SERVER ACTION
 * Soluciona el error "Failed to find Server Action" en Next.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 SOLUCIONADOR DE ERRORES SERVER ACTION - PINTEYA E-COMMERCE')
console.log('Solucionando error: Failed to find Server Action\n')

// Configuración
const config = {
  nextDir: '.next',
  cacheDir: '.next/cache',
  buildDir: '.next/static',
  nodeModulesDir: 'node_modules/.cache',
  vercelDir: '.vercel',
}

/**
 * Limpia todos los caches de Next.js
 */
function clearNextCache() {
  console.log('🧹 Limpiando cache de Next.js...')

  const cacheDirs = [config.nextDir, config.nodeModulesDir, config.vercelDir]

  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true })
        console.log(`✅ Eliminado: ${dir}`)
      } catch (error) {
        console.warn(`⚠️  No se pudo eliminar ${dir}: ${error.message}`)
      }
    } else {
      console.log(`ℹ️  No existe: ${dir}`)
    }
  })
}

/**
 * Reinstala dependencias
 */
function reinstallDependencies() {
  console.log('\n📦 Reinstalando dependencias...')

  try {
    // Eliminar node_modules y package-lock.json
    if (fs.existsSync('node_modules')) {
      console.log('🗑️  Eliminando node_modules...')
      fs.rmSync('node_modules', { recursive: true, force: true })
    }

    if (fs.existsSync('package-lock.json')) {
      console.log('🗑️  Eliminando package-lock.json...')
      fs.unlinkSync('package-lock.json')
    }

    // Reinstalar
    console.log('⬇️  Instalando dependencias...')
    execSync('npm install', { stdio: 'inherit' })

    console.log('✅ Dependencias reinstaladas correctamente')
  } catch (error) {
    console.error('❌ Error reinstalando dependencias:', error.message)
  }
}

/**
 * Verifica configuración de Next.js
 */
function verifyNextConfig() {
  console.log('\n🔍 Verificando configuración de Next.js...')

  const nextConfigPath = 'next.config.js'
  if (!fs.existsSync(nextConfigPath)) {
    console.warn('⚠️  next.config.js no encontrado')
    return
  }

  const content = fs.readFileSync(nextConfigPath, 'utf8')

  // Verificar configuraciones problemáticas
  const issues = []

  if (content.includes('experimental')) {
    issues.push('Configuración experimental detectada')
  }

  if (content.includes('serverActions')) {
    issues.push('Configuración de serverActions detectada')
  }

  if (issues.length > 0) {
    console.log('⚠️  Posibles problemas en next.config.js:')
    issues.forEach(issue => console.log(`   - ${issue}`))
  } else {
    console.log('✅ Configuración de Next.js parece correcta')
  }
}

/**
 * Crea un build limpio
 */
function createCleanBuild() {
  console.log('\n🏗️  Creando build limpio...')

  try {
    console.log('🔨 Ejecutando build...')
    execSync('npm run build', { stdio: 'inherit' })
    console.log('✅ Build completado exitosamente')
  } catch (error) {
    console.error('❌ Error en el build:', error.message)
    throw error
  }
}

/**
 * Verifica variables de entorno
 */
function verifyEnvironmentVariables() {
  console.log('\n🌍 Verificando variables de entorno...')

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ]

  const missing = []

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  })

  if (missing.length > 0) {
    console.warn('⚠️  Variables de entorno faltantes:')
    missing.forEach(varName => console.log(`   - ${varName}`))
  } else {
    console.log('✅ Variables de entorno principales configuradas')
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando proceso de solución...\n')

    // Paso 1: Verificar variables de entorno
    verifyEnvironmentVariables()

    // Paso 2: Verificar configuración
    verifyNextConfig()

    // Paso 3: Limpiar cache
    clearNextCache()

    // Paso 4: Reinstalar dependencias (opcional)
    const shouldReinstall = process.argv.includes('--reinstall')
    if (shouldReinstall) {
      reinstallDependencies()
    }

    // Paso 5: Build limpio
    createCleanBuild()

    console.log('\n✅ PROCESO COMPLETADO EXITOSAMENTE!')
    console.log('\n📋 Próximos pasos:')
    console.log('1. Ejecuta: npm run dev')
    console.log('2. Verifica que la aplicación funcione localmente')
    console.log('3. Si funciona, haz deploy a Vercel')
    console.log('4. Si el problema persiste, ejecuta con --reinstall')
  } catch (error) {
    console.error('\n❌ ERROR EN EL PROCESO:', error.message)
    console.log('\n🔧 Soluciones adicionales:')
    console.log('1. Ejecuta: npm run fix-server-action -- --reinstall')
    console.log('2. Verifica que no haya Server Actions huérfanas')
    console.log('3. Revisa los logs de Vercel para más detalles')
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = {
  clearNextCache,
  reinstallDependencies,
  verifyNextConfig,
  createCleanBuild,
  verifyEnvironmentVariables,
}
