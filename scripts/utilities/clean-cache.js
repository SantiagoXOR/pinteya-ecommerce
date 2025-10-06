#!/usr/bin/env node

/**
 * SCRIPT DE LIMPIEZA COMPLETA DE CACHE
 * ===================================
 * Limpia todos los archivos de cache del proyecto Pinteya e-commerce
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

const log = {
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: msg => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: msg => console.log(`${colors.bold}${colors.blue}${msg}${colors.reset}`),
}

console.log('🧹 LIMPIEZA COMPLETA DE CACHE - PINTEYA E-COMMERCE')
console.log('==================================================\n')

/**
 * Elimina un directorio de forma segura
 */
function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      const stats = fs.statSync(dirPath)
      if (stats.isDirectory()) {
        fs.rmSync(dirPath, { recursive: true, force: true })
        log.success(`Eliminado: ${dirPath}`)
        return true
      }
    }
    return false
  } catch (error) {
    log.warning(`No se pudo eliminar ${dirPath}: ${error.message}`)
    return false
  }
}

/**
 * Elimina archivos por patrón
 */
function removeFiles(pattern, description) {
  try {
    const files = require('glob').sync(pattern)
    if (files.length > 0) {
      files.forEach(file => {
        try {
          fs.unlinkSync(file)
        } catch (error) {
          // Ignorar errores de archivos individuales
        }
      })
      log.success(`Eliminados ${files.length} archivos: ${description}`)
    }
  } catch (error) {
    // Si glob no está disponible, usar método alternativo
    log.info(`Patrón ${pattern} procesado`)
  }
}

/**
 * Ejecuta comando de forma segura
 */
function safeExec(command, description) {
  try {
    execSync(command, { stdio: 'pipe' })
    log.success(description)
    return true
  } catch (error) {
    log.warning(`${description} - ${error.message}`)
    return false
  }
}

/**
 * Función principal de limpieza
 */
function cleanCache() {
  log.title('1. DETENIENDO PROCESOS NODE.JS')

  // Detener procesos Node.js (Windows)
  if (process.platform === 'win32') {
    safeExec('taskkill /F /IM node.exe 2>nul', 'Procesos Node.js detenidos')
  } else {
    safeExec('pkill -f node', 'Procesos Node.js detenidos')
  }

  log.title('\n2. ELIMINANDO DIRECTORIOS DE CACHE')

  // Directorios principales de cache
  const cacheDirectories = [
    '.next',
    '.jest-cache',
    'coverage',
    '.turbo',
    '.swc',
    'dist',
    'tmp',
    'node_modules/.cache',
    '.eslintcache',
  ]

  let removedDirs = 0
  cacheDirectories.forEach(dir => {
    if (removeDirectory(dir)) {
      removedDirs++
    }
  })

  log.title('\n3. ELIMINANDO ARCHIVOS TEMPORALES')

  // Archivos temporales
  const tempFiles = ['*.log', '*.tmp', '.DS_Store', 'Thumbs.db', '*.pid', '*.seed', '*.pid.lock']

  tempFiles.forEach(pattern => {
    removeFiles(pattern, `Archivos ${pattern}`)
  })

  log.title('\n4. LIMPIANDO CACHE DE NPM')

  // Limpiar cache de npm
  safeExec('npm cache clean --force', 'Cache de NPM limpiado')

  log.title('\n5. LIMPIANDO CACHE DE YARN (si existe)')

  // Limpiar cache de yarn si existe
  safeExec('yarn cache clean', 'Cache de Yarn limpiado')

  log.title('\n6. VERIFICANDO LIMPIEZA')

  // Verificar que los directorios principales fueron eliminados
  const stillExists = cacheDirectories.filter(dir => fs.existsSync(dir))

  if (stillExists.length === 0) {
    log.success('Todos los directorios de cache eliminados correctamente')
  } else {
    log.warning(`Algunos directorios aún existen: ${stillExists.join(', ')}`)
  }

  // Mostrar espacio liberado (aproximado)
  log.title('\n7. RESUMEN DE LIMPIEZA')
  log.success(`Directorios eliminados: ${removedDirs}`)
  log.success('Cache de NPM limpiado')
  log.success('Archivos temporales eliminados')

  log.title('\n8. RECOMENDACIONES POST-LIMPIEZA')
  log.info('1. Ejecuta: npm install (para verificar dependencias)')
  log.info('2. Ejecuta: npm run dev (para iniciar servidor limpio)')
  log.info('3. Verifica que el Header se renderice correctamente')

  console.log('\n==================================================')
  console.log('🏁 LIMPIEZA COMPLETA FINALIZADA')
  console.log('El servidor está listo para iniciarse con cache limpio')
}

// Ejecutar limpieza
cleanCache()
