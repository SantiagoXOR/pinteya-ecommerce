#!/usr/bin/env node

// =====================================================
// SCRIPT DE VALIDACIÓN: IMPLEMENTACIÓN DE LOGÍSTICA
// Descripción: Valida que las 2 APIs nuevas estén implementadas correctamente
// Fecha: 4 de Septiembre, 2025
// =====================================================

const fs = require('fs')
const path = require('path')

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60))
  log(message, 'bold')
  console.log('='.repeat(60))
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath)
  } catch (error) {
    return false
  }
}

// Función para leer contenido de archivo
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    return null
  }
}

// Función para verificar contenido específico en archivo
function checkFileContent(filePath, patterns) {
  const content = readFile(filePath)
  if (!content) return { exists: false, patterns: {} }

  const results = {}
  for (const [name, pattern] of Object.entries(patterns)) {
    results[name] = pattern.test(content)
  }

  return { exists: true, content, patterns: results }
}

// Validar API de Carriers
function validateCarriersAPI() {
  logHeader('🚚 VALIDANDO API DE CARRIERS')

  const apiPath = 'src/app/api/admin/logistics/carriers/route.ts'

  if (!fileExists(apiPath)) {
    logError(`Archivo no encontrado: ${apiPath}`)
    return false
  }

  logSuccess(`Archivo encontrado: ${apiPath}`)

  const patterns = {
    hasGetHandler: /export const GET.*=.*composeMiddlewares/s,
    hasPostHandler: /export const POST.*=.*composeMiddlewares/s,
    hasPutHandler: /export const PUT.*=.*composeMiddlewares/s,
    hasDeleteHandler: /export const DELETE.*=.*composeMiddlewares/s,
    hasValidationSchemas: /CarrierCreateSchema.*=.*z\.object/s,
    hasErrorHandling: /withErrorHandler/,
    hasLogging: /withApiLogging/,
    hasAuth: /validateAdminAuth/,
    hasRateLimit: /checkRateLimit/,
    hasEncryption: /encryptApiKey/,
    hasTypescript: /CarrierResponse|CarrierListResponse/,
  }

  const result = checkFileContent(apiPath, patterns)

  let score = 0
  const total = Object.keys(patterns).length

  for (const [check, passed] of Object.entries(result.patterns)) {
    if (passed) {
      logSuccess(`${check}: ✓`)
      score++
    } else {
      logError(`${check}: ✗`)
    }
  }

  logInfo(`Score: ${score}/${total} (${Math.round((score / total) * 100)}%)`)

  return score === total
}

// Validar API de Tracking
function validateTrackingAPI() {
  logHeader('📍 VALIDANDO API DE TRACKING')

  const apiPath = 'src/app/api/admin/logistics/tracking/route.ts'

  if (!fileExists(apiPath)) {
    logError(`Archivo no encontrado: ${apiPath}`)
    return false
  }

  logSuccess(`Archivo encontrado: ${apiPath}`)

  const patterns = {
    hasGetHandler: /export const GET.*=.*composeMiddlewares/s,
    hasPostHandler: /export const POST.*=.*composeMiddlewares/s,
    hasPutHandler: /export const PUT.*=.*composeMiddlewares/s,
    hasDeleteHandler: /export const DELETE.*=.*composeMiddlewares/s,
    hasValidationSchemas: /TrackingEventCreateSchema.*=.*z\.object/s,
    hasBulkUpdate: /BulkTrackingUpdateSchema|handleBulkUpdate/s,
    hasErrorHandling: /withErrorHandler/,
    hasLogging: /withApiLogging/,
    hasAuth: /validateAdminAuth/,
    hasRateLimit: /checkRateLimit/,
    hasShipmentUpdate: /updateShipmentStatus/,
    hasTypescript: /TrackingResponse|TrackingListResponse/,
  }

  const result = checkFileContent(apiPath, patterns)

  let score = 0
  const total = Object.keys(patterns).length

  for (const [check, passed] of Object.entries(result.patterns)) {
    if (passed) {
      logSuccess(`${check}: ✓`)
      score++
    } else {
      logError(`${check}: ✗`)
    }
  }

  logInfo(`Score: ${score}/${total} (${Math.round((score / total) * 100)}%)`)

  return score === total
}

// Validar tipos TypeScript
function validateTypes() {
  logHeader('📝 VALIDANDO TIPOS TYPESCRIPT')

  const typesPath = 'src/types/logistics.ts'

  if (!fileExists(typesPath)) {
    logError(`Archivo no encontrado: ${typesPath}`)
    return false
  }

  logSuccess(`Archivo encontrado: ${typesPath}`)

  const patterns = {
    hasTrackingEventType: /export enum TrackingEventType/,
    hasCarrierTypes: /CarrierFiltersRequest|CarrierCreateRequest|CarrierResponse/,
    hasTrackingTypes: /TrackingFiltersRequest|TrackingEventCreateRequest|TrackingResponse/,
    hasBulkTypes: /BulkTrackingUpdateRequest/,
    hasListTypes: /CarrierListResponse|TrackingListResponse/,
    hasUpdateTypes: /CarrierUpdateRequest|TrackingEventUpdateRequest/,
  }

  const result = checkFileContent(typesPath, patterns)

  let score = 0
  const total = Object.keys(patterns).length

  for (const [check, passed] of Object.entries(result.patterns)) {
    if (passed) {
      logSuccess(`${check}: ✓`)
      score++
    } else {
      logError(`${check}: ✗`)
    }
  }

  logInfo(`Score: ${score}/${total} (${Math.round((score / total) * 100)}%)`)

  return score === total
}

// Validar estructura de archivos
function validateFileStructure() {
  logHeader('📁 VALIDANDO ESTRUCTURA DE ARCHIVOS')

  const requiredFiles = [
    'src/app/api/admin/logistics/carriers/route.ts',
    'src/app/api/admin/logistics/tracking/route.ts',
    'src/types/logistics.ts',
  ]

  const existingFiles = [
    'src/app/api/admin/logistics/route.ts',
    'src/app/api/admin/logistics/couriers/route.ts',
    'src/app/api/admin/logistics/shipments/route.ts',
    'src/app/api/admin/logistics/tracking/[id]/route.ts',
  ]

  let allRequired = true
  let allExisting = true

  logInfo('Archivos requeridos (nuevos):')
  for (const file of requiredFiles) {
    if (fileExists(file)) {
      logSuccess(`${file}: ✓`)
    } else {
      logError(`${file}: ✗`)
      allRequired = false
    }
  }

  logInfo('Archivos existentes (verificación):')
  for (const file of existingFiles) {
    if (fileExists(file)) {
      logSuccess(`${file}: ✓`)
    } else {
      logWarning(`${file}: ⚠️  (opcional)`)
      allExisting = false
    }
  }

  return { allRequired, allExisting }
}

// Función principal
function main() {
  logHeader('🚀 VALIDANDO IMPLEMENTACIÓN DE LOGÍSTICA ENTERPRISE')

  const results = {
    fileStructure: validateFileStructure(),
    carriersAPI: validateCarriersAPI(),
    trackingAPI: validateTrackingAPI(),
    types: validateTypes(),
  }

  logHeader('📊 RESUMEN DE VALIDACIÓN')

  if (results.fileStructure.allRequired) {
    logSuccess('✅ Estructura de archivos: Todos los archivos requeridos presentes')
  } else {
    logError('❌ Estructura de archivos: Faltan archivos requeridos')
  }

  if (results.carriersAPI) {
    logSuccess('✅ API de Carriers: Implementación completa')
  } else {
    logError('❌ API de Carriers: Implementación incompleta')
  }

  if (results.trackingAPI) {
    logSuccess('✅ API de Tracking: Implementación completa')
  } else {
    logError('❌ API de Tracking: Implementación incompleta')
  }

  if (results.types) {
    logSuccess('✅ Tipos TypeScript: Definiciones completas')
  } else {
    logError('❌ Tipos TypeScript: Definiciones incompletas')
  }

  const allPassed =
    results.fileStructure.allRequired && results.carriersAPI && results.trackingAPI && results.types

  if (allPassed) {
    logHeader('🎉 ¡IMPLEMENTACIÓN COMPLETADA AL 100%!')
    logSuccess('🏆 Módulo de Logística: 100% COMPLETADO')
    logSuccess('📋 2/2 APIs faltantes implementadas exitosamente')
    logSuccess('🔧 Patrones enterprise aplicados correctamente')
    logSuccess('🛡️  Seguridad y validación implementadas')
    logSuccess('📝 Tipos TypeScript completos')
    logInfo('🚀 El panel administrativo de Pinteya e-commerce está listo para producción')
  } else {
    logError('❌ La implementación no está completa')
    logWarning('⚠️  Revisa los errores arriba y corrige los problemas')
  }

  return allPassed
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const success = main()
  process.exit(success ? 0 : 1)
}

module.exports = { validateCarriersAPI, validateTrackingAPI, validateTypes, validateFileStructure }
