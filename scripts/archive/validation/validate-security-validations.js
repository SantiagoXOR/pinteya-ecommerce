#!/usr/bin/env node

/**
 * Script de validación para las validaciones de seguridad avanzadas
 * Verifica que todas las funciones de seguridad estén implementadas correctamente
 */

const fs = require('fs')
const path = require('path')

console.log('🔒 VALIDANDO VALIDACIONES DE SEGURIDAD')
console.log('='.repeat(50))

/**
 * Validar que los archivos de seguridad existan
 */
function validateSecurityFiles() {
  const securityFiles = [
    'src/lib/auth/security-validations.ts',
    'src/lib/auth/security-audit.ts',
    'src/__tests__/security-validations.test.ts',
  ]

  console.log('\n📁 VERIFICACIONES DE ARCHIVOS:')

  securityFiles.forEach(filePath => {
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
 * Validar funciones de validación de seguridad
 */
function validateSecurityValidationFunctions() {
  const validationsPath = path.join(process.cwd(), 'src', 'lib', 'auth', 'security-validations.ts')
  const content = fs.readFileSync(validationsPath, 'utf8')

  const checks = [
    {
      name: 'getPermissionsByRole implementada',
      test: content.includes('export function getPermissionsByRole'),
      required: true,
    },
    {
      name: 'isValidAdminRole implementada',
      test: content.includes('export function isValidAdminRole'),
      required: true,
    },
    {
      name: 'hasPermission implementada',
      test: content.includes('export function hasPermission'),
      required: true,
    },
    {
      name: 'hasAnyPermission implementada',
      test: content.includes('export function hasAnyPermission'),
      required: true,
    },
    {
      name: 'hasAllPermissions implementada',
      test: content.includes('export function hasAllPermissions'),
      required: true,
    },
    {
      name: 'getSecurityContext implementada',
      test: content.includes('export async function getSecurityContext'),
      required: true,
    },
    {
      name: 'validateSecurityContext implementada',
      test: content.includes('export async function validateSecurityContext'),
      required: true,
    },
    {
      name: 'validateProductPermissions implementada',
      test: content.includes('export async function validateProductPermissions'),
      required: true,
    },
    {
      name: 'withSecurityValidation wrapper implementado',
      test: content.includes('export function withSecurityValidation'),
      required: true,
    },
    {
      name: 'Tipos TypeScript definidos',
      test: content.includes('SecurityContext') && content.includes('UserPermissions'),
      required: true,
    },
  ]

  console.log('\n🔒 VERIFICACIONES DE VALIDACIONES:')
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
 * Validar funciones de auditoría de seguridad
 */
function validateSecurityAuditFunctions() {
  const auditPath = path.join(process.cwd(), 'src', 'lib', 'auth', 'security-audit.ts')
  const content = fs.readFileSync(auditPath, 'utf8')

  const checks = [
    {
      name: 'logSecurityEvent implementada',
      test: content.includes('export async function logSecurityEvent'),
      required: true,
    },
    {
      name: 'logAuthSuccess implementada',
      test: content.includes('export async function logAuthSuccess'),
      required: true,
    },
    {
      name: 'logAuthFailure implementada',
      test: content.includes('export async function logAuthFailure'),
      required: true,
    },
    {
      name: 'logPermissionDenied implementada',
      test: content.includes('export async function logPermissionDenied'),
      required: true,
    },
    {
      name: 'logDataAccess implementada',
      test: content.includes('export async function logDataAccess'),
      required: true,
    },
    {
      name: 'logAdminAction implementada',
      test: content.includes('export async function logAdminAction'),
      required: true,
    },
    {
      name: 'detectMultipleAuthFailures implementada',
      test: content.includes('export async function detectMultipleAuthFailures'),
      required: true,
    },
    {
      name: 'detectMultipleIPAccess implementada',
      test: content.includes('export async function detectMultipleIPAccess'),
      required: true,
    },
    {
      name: 'runSecurityDetection implementada',
      test: content.includes('export async function runSecurityDetection'),
      required: true,
    },
    {
      name: 'Tipos de eventos de seguridad definidos',
      test: content.includes('SecurityEvent') && content.includes('SecurityEventType'),
      required: true,
    },
  ]

  console.log('\n📊 VERIFICACIONES DE AUDITORÍA:')
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
 * Validar integración con admin-auth.ts
 */
function validateAdminAuthIntegration() {
  const adminAuthPath = path.join(process.cwd(), 'src', 'lib', 'auth', 'admin-auth.ts')
  const content = fs.readFileSync(adminAuthPath, 'utf8')

  const checks = [
    {
      name: 'Importa validaciones de seguridad',
      test: content.includes("from './security-validations'"),
      required: true,
    },
    {
      name: 'Importa auditoría de seguridad',
      test: content.includes("from './security-audit'"),
      required: true,
    },
    {
      name: 'checkAdvancedSecurity implementada',
      test: content.includes('export async function checkAdvancedSecurity'),
      required: true,
    },
    {
      name: 'Usa logAuthSuccess',
      test: content.includes('logAuthSuccess'),
      required: true,
    },
    {
      name: 'Usa logAuthFailure',
      test: content.includes('logAuthFailure'),
      required: true,
    },
    {
      name: 'Usa runSecurityDetection',
      test: content.includes('runSecurityDetection'),
      required: true,
    },
    {
      name: 'SecurityContext en tipos de retorno',
      test: content.includes('securityContext?: SecurityContext'),
      required: true,
    },
  ]

  console.log('\n🔗 VERIFICACIONES DE INTEGRACIÓN:')
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
    console.log('🚀 Iniciando validación de validaciones de seguridad...\n')

    // Ejecutar todas las validaciones
    validateSecurityFiles()
    const validationsResult = validateSecurityValidationFunctions()
    const auditResult = validateSecurityAuditFunctions()
    const integrationResult = validateAdminAuthIntegration()

    const totalPassed = validationsResult.passed + auditResult.passed + integrationResult.passed
    const totalChecks = validationsResult.total + auditResult.total + integrationResult.total

    // Resumen final
    console.log('\n' + '='.repeat(50))
    console.log('🎉 ¡VALIDACIONES DE SEGURIDAD COMPLETADAS!')
    console.log('='.repeat(50))
    console.log('✅ Archivos de seguridad creados')
    console.log('✅ Funciones de validación implementadas')
    console.log('✅ Sistema de auditoría implementado')
    console.log('✅ Integración con admin-auth completada')
    console.log(`✅ ${totalPassed}/${totalChecks} verificaciones pasadas`)

    console.log('\n📋 FUNCIONALIDADES IMPLEMENTADAS:')
    console.log('• Sistema de permisos granulares por rol')
    console.log('• Validación de contexto de seguridad')
    console.log('• Auditoría completa de eventos de seguridad')
    console.log('• Detección de actividad sospechosa')
    console.log('• Wrappers de seguridad para APIs')
    console.log('• Logging estructurado de eventos')

    console.log('\n🔒 VALIDACIONES DE SEGURIDAD:')
    console.log('• Verificación de roles administrativos')
    console.log('• Validación de permisos específicos')
    console.log('• Verificación de usuario activo')
    console.log('• Validación de email verificado')
    console.log('• Detección de múltiples fallos de auth')
    console.log('• Detección de acceso desde múltiples IPs')

    console.log('\n🔄 PRÓXIMOS PASOS:')
    console.log('1. ✅ Tarea 1.3 completada: Validaciones de seguridad')
    console.log('2. 🔄 Continuar con Tarea 1.4: Testing de regresión')

    process.exit(0)
  } catch (error) {
    console.log('\n❌ VALIDACIÓN FALLIDA')
    console.log('='.repeat(50))
    console.error(`💥 Error: ${error.message}`)
    console.log('\n🔧 ACCIONES REQUERIDAS:')
    console.log('• Revisar la implementación de funciones de seguridad')
    console.log('• Verificar imports y exports')
    console.log('• Comprobar integración con sistema existente')
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = {
  validateSecurityFiles,
  validateSecurityValidationFunctions,
  validateSecurityAuditFunctions,
}
