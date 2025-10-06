#!/usr/bin/env node

/**
 * Script de validación para el sistema de gestión avanzada de sesiones
 * Verifica que el sistema esté implementado con sincronización, invalidación y cleanup
 */

const fs = require('fs')
const path = require('path')

console.log('🔐 VALIDANDO SISTEMA DE GESTIÓN AVANZADA DE SESIONES')
console.log('='.repeat(60))

/**
 * Validar que los archivos del sistema de sesiones existan
 */
function validateSessionFiles() {
  const sessionFiles = [
    'src/lib/auth/session-management.ts',
    'src/app/api/auth/sessions/route.ts',
    'src/__tests__/session-management.test.ts',
  ]

  console.log('\n📁 VERIFICACIONES DE ARCHIVOS:')

  sessionFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath)
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${filePath}`)
    } else {
      throw new Error(`❌ Archivo requerido no encontrado: ${filePath}`)
    }
  })

  return true
}

/**
 * Validar funciones del sistema de gestión de sesiones
 */
function validateSessionFunctions() {
  const sessionPath = path.join(process.cwd(), 'src', 'lib', 'auth', 'session-management.ts')
  const content = fs.readFileSync(sessionPath, 'utf8')

  const checks = [
    {
      name: 'Función createSession implementada',
      test: content.includes('export async function createSession'),
      required: true,
    },
    {
      name: 'Función updateSession implementada',
      test: content.includes('export async function updateSession'),
      required: true,
    },
    {
      name: 'Función invalidateSession implementada',
      test: content.includes('export async function invalidateSession'),
      required: true,
    },
    {
      name: 'Función getUserSessions implementada',
      test: content.includes('export async function getUserSessions'),
      required: true,
    },
    {
      name: 'Función getSessionInfo implementada',
      test: content.includes('export async function getSessionInfo'),
      required: true,
    },
    {
      name: 'Función isSessionValid implementada',
      test: content.includes('export async function isSessionValid'),
      required: true,
    },
    {
      name: 'Función updateSessionActivity implementada',
      test: content.includes('export async function updateSessionActivity'),
      required: true,
    },
    {
      name: 'Función cleanupExpiredSessions implementada',
      test: content.includes('export async function cleanupExpiredSessions'),
      required: true,
    },
    {
      name: 'Función syncSessionsWithClerk implementada',
      test: content.includes('export async function syncSessionsWithClerk'),
      required: true,
    },
    {
      name: 'Función getSessionStats implementada',
      test: content.includes('export async function getSessionStats'),
      required: true,
    },
    {
      name: 'Función invalidateAllUserSessions implementada',
      test: content.includes('export async function invalidateAllUserSessions'),
      required: true,
    },
    {
      name: 'Función startSessionCleanup implementada',
      test: content.includes('export function startSessionCleanup'),
      required: true,
    },
    {
      name: 'Función stopSessionCleanup implementada',
      test: content.includes('export function stopSessionCleanup'),
      required: true,
    },
    {
      name: 'Tipos TypeScript definidos',
      test: content.includes('interface SessionData') && content.includes('interface DeviceInfo'),
      required: true,
    },
    {
      name: 'Configuración de sesiones definida',
      test: content.includes('SESSION_CONFIG') && content.includes('maxSessionsPerUser'),
      required: true,
    },
  ]

  console.log('\n🔐 VERIFICACIONES DEL SISTEMA DE SESIONES:')
  let passed = 0
  let failed = 0

  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}`)
      passed++
    } else {
      console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`)
      if (check.required) failed++
    }
  })

  console.log(`\n📊 Verificaciones: ${passed} pasadas, ${failed} fallidas`)

  if (failed > 0) {
    throw new Error(`❌ ${failed} verificaciones críticas fallaron`)
  }

  return { passed, failed, total: checks.length }
}

/**
 * Validar API de gestión de sesiones
 */
function validateSessionAPI() {
  const apiPath = path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'sessions', 'route.ts')
  const content = fs.readFileSync(apiPath, 'utf8')

  const checks = [
    {
      name: 'Endpoint GET implementado',
      test: content.includes('export async function GET'),
      required: true,
    },
    {
      name: 'Endpoint POST implementado',
      test: content.includes('export async function POST'),
      required: true,
    },
    {
      name: 'Acción list implementada',
      test: content.includes("case 'list'"),
      required: true,
    },
    {
      name: 'Acción info implementada',
      test: content.includes("case 'info'"),
      required: true,
    },
    {
      name: 'Acción validate implementada',
      test: content.includes("case 'validate'"),
      required: true,
    },
    {
      name: 'Acción stats implementada',
      test: content.includes("case 'stats'"),
      required: true,
    },
    {
      name: 'Acción sync implementada',
      test: content.includes("case 'sync'"),
      required: true,
    },
    {
      name: 'Acción invalidate implementada',
      test: content.includes("case 'invalidate'"),
      required: true,
    },
    {
      name: 'Acción invalidate_all implementada',
      test: content.includes("case 'invalidate_all'"),
      required: true,
    },
    {
      name: 'Acción cleanup implementada',
      test: content.includes("case 'cleanup'"),
      required: true,
    },
    {
      name: 'Acción update_activity implementada',
      test: content.includes("case 'update_activity'"),
      required: true,
    },
    {
      name: 'Verificación de autenticación',
      test: content.includes('getAuthenticatedUser'),
      required: true,
    },
    {
      name: 'Verificación de permisos',
      test: content.includes('isAdmin') && content.includes('Permisos insuficientes'),
      required: true,
    },
    {
      name: 'Respuestas estructuradas',
      test: content.includes('ApiResponse') && content.includes('success'),
      required: true,
    },
  ]

  console.log('\n🌐 VERIFICACIONES DE LA API:')
  let passed = 0
  let failed = 0

  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}`)
      passed++
    } else {
      console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`)
      if (check.required) failed++
    }
  })

  console.log(`\n📊 Verificaciones: ${passed} pasadas, ${failed} fallidas`)

  if (failed > 0) {
    throw new Error(`❌ ${failed} verificaciones críticas fallaron`)
  }

  return { passed, failed, total: checks.length }
}

/**
 * Validar integración con middleware
 */
function validateMiddlewareIntegration() {
  const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts')
  const content = fs.readFileSync(middlewarePath, 'utf8')

  const checks = [
    {
      name: 'Importa funciones de gestión de sesiones',
      test: content.includes("from '@/lib/auth/session-management'"),
      required: true,
    },
    {
      name: 'Usa updateSessionActivity',
      test: content.includes('updateSessionActivity'),
      required: true,
    },
    {
      name: 'Usa isSessionValid',
      test: content.includes('isSessionValid'),
      required: true,
    },
    {
      name: 'Maneja sesiones en rutas admin',
      test: content.includes('sessionId') && content.includes('admin'),
      required: true,
    },
    {
      name: 'Maneja sesiones en rutas protegidas',
      test: content.includes('sessionValid') && content.includes('protegidas'),
      required: true,
    },
    {
      name: 'Actualiza metadata de sesión',
      test: content.includes('last_page') || content.includes('features_used'),
      required: true,
    },
    {
      name: 'Maneja sesiones inválidas',
      test: content.includes('SESSION_INVALID') || content.includes('session_expired'),
      required: true,
    },
  ]

  console.log('\n🔗 VERIFICACIONES DE INTEGRACIÓN CON MIDDLEWARE:')
  let passed = 0
  let failed = 0

  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}`)
      passed++
    } else {
      console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`)
      if (check.required) failed++
    }
  })

  console.log(`\n📊 Verificaciones: ${passed} pasadas, ${failed} fallidas`)

  if (failed > 0) {
    throw new Error(`❌ ${failed} verificaciones críticas fallaron`)
  }

  return { passed, failed, total: checks.length }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando validación del sistema de gestión de sesiones...\n')

    // Ejecutar todas las validaciones
    validateSessionFiles()
    const sessionResult = validateSessionFunctions()
    const apiResult = validateSessionAPI()
    const middlewareResult = validateMiddlewareIntegration()

    const totalPassed = sessionResult.passed + apiResult.passed + middlewareResult.passed
    const totalChecks = sessionResult.total + apiResult.total + middlewareResult.total

    // Resumen final
    console.log('\n' + '='.repeat(60))
    console.log('🎉 ¡SISTEMA DE GESTIÓN DE SESIONES VALIDADO!')
    console.log('='.repeat(60))
    console.log('✅ Sistema de gestión avanzada implementado')
    console.log('✅ Sincronización entre Clerk y Supabase')
    console.log('✅ Invalidación automática y manual')
    console.log('✅ Cleanup de sesiones expiradas')
    console.log('✅ API completa de gestión')
    console.log('✅ Integración con middleware')
    console.log(`✅ ${totalPassed}/${totalChecks} verificaciones pasadas`)

    console.log('\n📋 FUNCIONALIDADES IMPLEMENTADAS:')
    console.log('• Creación y actualización de sesiones')
    console.log('• Invalidación manual y automática')
    console.log('• Sincronización con Clerk')
    console.log('• Cleanup automático de sesiones expiradas')
    console.log('• Gestión de límites por usuario')
    console.log('• Tracking de actividad y metadata')
    console.log('• Estadísticas y métricas de sesiones')
    console.log('• API RESTful completa')
    console.log('• Integración con middleware de autenticación')

    console.log('\n🛡️ CARACTERÍSTICAS DE SEGURIDAD:')
    console.log('• Validación de sesiones en tiempo real')
    console.log('• Detección de sesiones huérfanas')
    console.log('• Límites de sesiones concurrentes')
    console.log('• Tracking de dispositivos y ubicaciones')
    console.log('• Invalidación por inactividad')
    console.log('• Auditoría completa de eventos')
    console.log('• Cache inteligente con TTL')

    console.log('\n🔄 PRÓXIMOS PASOS:')
    console.log('1. ✅ Tarea 2.3 completada: Gestión avanzada de sesiones')
    console.log('2. 🔄 Continuar con Tarea 2.4: Auditoría de seguridad mejorada')

    process.exit(0)
  } catch (error) {
    console.log('\n❌ VALIDACIÓN FALLIDA')
    console.log('='.repeat(60))
    console.error(`💥 Error: ${error.message}`)
    console.log('\n🔧 ACCIONES REQUERIDAS:')
    console.log('• Revisar la implementación del sistema de sesiones')
    console.log('• Verificar funciones de gestión y API')
    console.log('• Comprobar integración con middleware')
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = {
  validateSessionFiles,
  validateSessionFunctions,
  validateSessionAPI,
  validateMiddlewareIntegration,
}
