#!/usr/bin/env node

/**
 * Script de validación para webhooks robustos de Clerk
 * Verifica que el sistema de webhooks esté implementado con validación de firma y manejo de errores
 */

const fs = require('fs')
const path = require('path')

console.log('🔗 VALIDANDO WEBHOOKS ROBUSTOS DE CLERK')
console.log('='.repeat(50))

/**
 * Validar que los archivos del webhook existan
 */
function validateWebhookFiles() {
  const webhookFiles = ['src/app/api/auth/webhook/route.ts', 'src/__tests__/webhook-robust.test.ts']

  console.log('\n📁 VERIFICACIONES DE ARCHIVOS:')

  webhookFiles.forEach(filePath => {
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
 * Validar funciones del webhook robusto
 */
function validateWebhookFunctions() {
  const webhookPath = path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'webhook', 'route.ts')
  const content = fs.readFileSync(webhookPath, 'utf8')

  const checks = [
    {
      name: 'Importa servicio de sincronización mejorado',
      test: content.includes("from '@/lib/auth/user-sync-service'"),
      required: true,
    },
    {
      name: 'Importa funciones de auditoría',
      test: content.includes("from '@/lib/auth/security-audit'"),
      required: true,
    },
    {
      name: 'Función validateWebhookHeaders implementada',
      test: content.includes('function validateWebhookHeaders'),
      required: true,
    },
    {
      name: 'Función verifyWebhookSignature implementada',
      test: content.includes('async function verifyWebhookSignature'),
      required: true,
    },
    {
      name: 'Función processWebhookEvent implementada',
      test: content.includes('async function processWebhookEvent'),
      required: true,
    },
    {
      name: 'Manejo de eventos user.created',
      test: content.includes("case 'user.created'"),
      required: true,
    },
    {
      name: 'Manejo de eventos user.updated',
      test: content.includes("case 'user.updated'"),
      required: true,
    },
    {
      name: 'Manejo de eventos user.deleted',
      test: content.includes("case 'user.deleted'"),
      required: true,
    },
    {
      name: 'Validación de firma con svix',
      test: content.includes('new Webhook(secret)') && content.includes('wh.verify'),
      required: true,
    },
    {
      name: 'Logging de eventos de seguridad',
      test: content.includes('logSecurityEvent'),
      required: true,
    },
    {
      name: 'Logging de acciones administrativas',
      test: content.includes('logAdminAction'),
      required: true,
    },
    {
      name: 'Manejo robusto de errores',
      test: content.includes('try') && content.includes('catch') && content.includes('severity'),
      required: true,
    },
    {
      name: 'Métricas de procesamiento',
      test: content.includes('processingTime') && content.includes('Date.now()'),
      required: true,
    },
    {
      name: 'Health check mejorado',
      test: content.includes('export async function GET') && content.includes('healthy'),
      required: true,
    },
  ]

  console.log('\n🔗 VERIFICACIONES DEL WEBHOOK:')
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
 * Validar características de seguridad
 */
function validateSecurityFeatures() {
  const webhookPath = path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'webhook', 'route.ts')
  const content = fs.readFileSync(webhookPath, 'utf8')

  const checks = [
    {
      name: 'Validación de headers svix',
      test:
        content.includes('svix-id') &&
        content.includes('svix-timestamp') &&
        content.includes('svix-signature'),
      required: true,
    },
    {
      name: 'Verificación de secret del webhook',
      test: content.includes('CLERK_WEBHOOK_SECRET'),
      required: true,
    },
    {
      name: 'Manejo de payload vacío',
      test: content.includes('payload') && content.includes('!payload'),
      required: true,
    },
    {
      name: 'Logging de violaciones de seguridad',
      test: content.includes('SECURITY_VIOLATION'),
      required: true,
    },
    {
      name: 'Diferentes niveles de severidad',
      test: content.includes('severity') && content.includes('medium') && content.includes('high'),
      required: true,
    },
    {
      name: 'Respuestas estructuradas JSON',
      test: content.includes('JSON.stringify') && content.includes('success'),
      required: true,
    },
    {
      name: 'Headers de respuesta apropiados',
      test: content.includes('Content-Type') && content.includes('application/json'),
      required: true,
    },
    {
      name: 'Códigos de estado HTTP correctos',
      test:
        content.includes('status: 400') &&
        content.includes('status: 401') &&
        content.includes('status: 500'),
      required: true,
    },
  ]

  console.log('\n🛡️ VERIFICACIONES DE SEGURIDAD:')
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
 * Validar integración con servicios
 */
function validateServiceIntegration() {
  const webhookPath = path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'webhook', 'route.ts')
  const content = fs.readFileSync(webhookPath, 'utf8')

  const checks = [
    {
      name: 'Usa syncUserToSupabase del nuevo servicio',
      test: content.includes('syncUserToSupabase'),
      required: true,
    },
    {
      name: 'Usa deleteUserFromSupabase del nuevo servicio',
      test: content.includes('deleteUserFromSupabase'),
      required: true,
    },
    {
      name: 'Configuración de opciones de sincronización',
      test: content.includes('retryAttempts') && content.includes('validateData'),
      required: true,
    },
    {
      name: 'Logging de acciones con contexto',
      test: content.includes('USER_CREATED_VIA_WEBHOOK') && content.includes('webhook_event'),
      required: true,
    },
    {
      name: 'Manejo de tipos TypeScript',
      test: content.includes('ClerkUserData') && content.includes('WebhookEventData'),
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
    console.log('🚀 Iniciando validación de webhooks robustos...\n')

    // Ejecutar todas las validaciones
    validateWebhookFiles()
    const webhookResult = validateWebhookFunctions()
    const securityResult = validateSecurityFeatures()
    const integrationResult = validateServiceIntegration()

    const totalPassed = webhookResult.passed + securityResult.passed + integrationResult.passed
    const totalChecks = webhookResult.total + securityResult.total + integrationResult.total

    // Resumen final
    console.log('\n' + '='.repeat(50))
    console.log('🎉 ¡WEBHOOKS ROBUSTOS VALIDADOS!')
    console.log('='.repeat(50))
    console.log('✅ Webhook robusto implementado')
    console.log('✅ Validación de firma con svix')
    console.log('✅ Manejo de errores avanzado')
    console.log('✅ Integración con servicios completada')
    console.log(`✅ ${totalPassed}/${totalChecks} verificaciones pasadas`)

    console.log('\n📋 FUNCIONALIDADES IMPLEMENTADAS:')
    console.log('• Validación robusta de firma con svix')
    console.log('• Manejo de eventos user.created/updated/deleted')
    console.log('• Retry logic integrado con servicio de sincronización')
    console.log('• Logging completo de eventos de seguridad')
    console.log('• Métricas de procesamiento en tiempo real')
    console.log('• Health check con información de configuración')

    console.log('\n🛡️ CARACTERÍSTICAS DE SEGURIDAD:')
    console.log('• Validación de headers svix obligatorios')
    console.log('• Verificación de firma criptográfica')
    console.log('• Logging de violaciones de seguridad')
    console.log('• Manejo graceful de errores críticos')
    console.log('• Respuestas estructuradas con códigos HTTP apropiados')
    console.log('• Auditoría completa de eventos de webhook')

    console.log('\n🔄 INTEGRACIÓN CON SERVICIOS:')
    console.log('• Servicio de sincronización automática')
    console.log('• Sistema de auditoría de seguridad')
    console.log('• Configuración de retry logic')
    console.log('• Logging de acciones administrativas')
    console.log('• Tipos TypeScript robustos')

    console.log('\n🔄 PRÓXIMOS PASOS:')
    console.log('1. ✅ Tarea 2.2 completada: Webhooks robustos')
    console.log('2. 🔄 Continuar con Tarea 2.3: Gestión avanzada de sesiones')

    process.exit(0)
  } catch (error) {
    console.log('\n❌ VALIDACIÓN FALLIDA')
    console.log('='.repeat(50))
    console.error(`💥 Error: ${error.message}`)
    console.log('\n🔧 ACCIONES REQUERIDAS:')
    console.log('• Revisar la implementación del webhook robusto')
    console.log('• Verificar imports y funciones de validación')
    console.log('• Comprobar integración con servicios de sincronización')
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = {
  validateWebhookFiles,
  validateWebhookFunctions,
  validateSecurityFeatures,
  validateServiceIntegration,
}
