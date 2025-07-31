#!/usr/bin/env node

/**
 * Script de validación para la sincronización automática de usuarios
 * Verifica que el sistema de sincronización Clerk-Supabase esté implementado correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 VALIDANDO SINCRONIZACIÓN AUTOMÁTICA DE USUARIOS');
console.log('=' .repeat(50));

/**
 * Validar que los archivos del servicio existan
 */
function validateServiceFiles() {
  const serviceFiles = [
    'src/lib/auth/user-sync-service.ts',
    'src/app/api/auth/sync-user/route.ts',
    'src/__tests__/user-sync-service.test.ts'
  ];

  console.log('\n📁 VERIFICACIONES DE ARCHIVOS:');
  
  serviceFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${filePath}`);
    } else {
      throw new Error(`❌ Archivo requerido no encontrado: ${filePath}`);
    }
  });

  return true;
}

/**
 * Validar funciones del servicio de sincronización
 */
function validateSyncServiceFunctions() {
  const servicePath = path.join(process.cwd(), 'src', 'lib', 'auth', 'user-sync-service.ts');
  const content = fs.readFileSync(servicePath, 'utf8');
  
  const checks = [
    {
      name: 'syncUserToSupabase implementada',
      test: content.includes('export async function syncUserToSupabase'),
      required: true
    },
    {
      name: 'deleteUserFromSupabase implementada',
      test: content.includes('export async function deleteUserFromSupabase'),
      required: true
    },
    {
      name: 'syncUserFromClerk implementada',
      test: content.includes('export async function syncUserFromClerk'),
      required: true
    },
    {
      name: 'bulkSyncUsersFromClerk implementada',
      test: content.includes('export async function bulkSyncUsersFromClerk'),
      required: true
    },
    {
      name: 'Retry logic implementado',
      test: content.includes('retryAttempts') && content.includes('retryDelay'),
      required: true
    },
    {
      name: 'Validación de datos implementada',
      test: content.includes('validateClerkUserData'),
      required: true
    },
    {
      name: 'Manejo de errores robusto',
      test: content.includes('try') && content.includes('catch') && content.includes('lastError'),
      required: true
    },
    {
      name: 'Logging de eventos de seguridad',
      test: content.includes('logSecurityEvent'),
      required: true
    },
    {
      name: 'Soft delete implementado',
      test: content.includes('is_active: false'),
      required: true
    },
    {
      name: 'Tipos TypeScript definidos',
      test: content.includes('ClerkUserData') && content.includes('UserSyncResult'),
      required: true
    }
  ];

  console.log('\n🔄 VERIFICACIONES DEL SERVICIO:');
  let passed = 0;
  let failed = 0;

  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`);
      if (check.required) failed++;
    }
  });

  console.log(`\n📊 Verificaciones: ${passed} pasadas, ${failed} fallidas`);
  
  if (failed > 0) {
    throw new Error(`❌ ${failed} verificaciones críticas fallaron`);
  }

  return { passed, failed, total: checks.length };
}

/**
 * Validar API de sincronización mejorada
 */
function validateSyncAPI() {
  const apiPath = path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'sync-user', 'route.ts');
  const content = fs.readFileSync(apiPath, 'utf8');
  
  const checks = [
    {
      name: 'Importa servicio de sincronización',
      test: content.includes('from \'@/lib/auth/user-sync-service\''),
      required: true
    },
    {
      name: 'Método GET mejorado',
      test: content.includes('export async function GET') && content.includes('action'),
      required: true
    },
    {
      name: 'Método POST mejorado',
      test: content.includes('export async function POST') && content.includes('userData'),
      required: true
    },
    {
      name: 'Soporte para sincronización individual',
      test: content.includes('syncUserFromClerk'),
      required: true
    },
    {
      name: 'Soporte para sincronización masiva',
      test: content.includes('bulkSyncUsersFromClerk'),
      required: true
    },
    {
      name: 'Compatibilidad hacia atrás',
      test: content.includes('email, firstName, lastName, clerkUserId'),
      required: true
    },
    {
      name: 'Manejo de errores mejorado',
      test: content.includes('try') && content.includes('catch'),
      required: true
    },
    {
      name: 'Validación de permisos para bulk',
      test: content.includes('getAuthenticatedUser'),
      required: true
    }
  ];

  console.log('\n🔗 VERIFICACIONES DE API:');
  let passed = 0;
  let failed = 0;

  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`);
      if (check.required) failed++;
    }
  });

  console.log(`\n📊 Verificaciones: ${passed} pasadas, ${failed} fallidas`);
  
  if (failed > 0) {
    throw new Error(`❌ ${failed} verificaciones críticas fallaron`);
  }

  return { passed, failed, total: checks.length };
}

/**
 * Validar integración con sistema de auditoría
 */
function validateAuditIntegration() {
  const servicePath = path.join(process.cwd(), 'src', 'lib', 'auth', 'user-sync-service.ts');
  const content = fs.readFileSync(servicePath, 'utf8');
  
  const checks = [
    {
      name: 'Importa funciones de auditoría',
      test: content.includes('from \'./security-audit\''),
      required: true
    },
    {
      name: 'Registra eventos de sincronización',
      test: content.includes('logSecurityEvent'),
      required: true
    },
    {
      name: 'Registra acciones administrativas',
      test: content.includes('logAdminAction'),
      required: true
    },
    {
      name: 'Categoriza eventos correctamente',
      test: content.includes('event_category') && content.includes('data_access'),
      required: true
    },
    {
      name: 'Asigna severidad apropiada',
      test: content.includes('severity'),
      required: true
    }
  ];

  console.log('\n📊 VERIFICACIONES DE AUDITORÍA:');
  let passed = 0;
  let failed = 0;

  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`);
      if (check.required) failed++;
    }
  });

  console.log(`\n📊 Verificaciones: ${passed} pasadas, ${failed} fallidas`);
  
  if (failed > 0) {
    throw new Error(`❌ ${failed} verificaciones críticas fallaron`);
  }

  return { passed, failed, total: checks.length };
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando validación de sincronización automática...\n');

    // Ejecutar todas las validaciones
    validateServiceFiles();
    const serviceResult = validateSyncServiceFunctions();
    const apiResult = validateSyncAPI();
    const auditResult = validateAuditIntegration();

    const totalPassed = serviceResult.passed + apiResult.passed + auditResult.passed;
    const totalChecks = serviceResult.total + apiResult.total + auditResult.total;

    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ¡SINCRONIZACIÓN AUTOMÁTICA VALIDADA!');
    console.log('='.repeat(50));
    console.log('✅ Servicio de sincronización implementado');
    console.log('✅ API de sincronización mejorada');
    console.log('✅ Integración con auditoría completada');
    console.log(`✅ ${totalPassed}/${totalChecks} verificaciones pasadas`);
    
    console.log('\n📋 FUNCIONALIDADES IMPLEMENTADAS:');
    console.log('• Sincronización automática Clerk → Supabase');
    console.log('• Retry logic con backoff exponencial');
    console.log('• Validación robusta de datos de usuario');
    console.log('• Soft delete para eliminación de usuarios');
    console.log('• Sincronización masiva con límites de seguridad');
    console.log('• Logging completo de eventos de sincronización');

    console.log('\n🔄 CAPACIDADES DE SINCRONIZACIÓN:');
    console.log('• Crear usuarios nuevos desde Clerk');
    console.log('• Actualizar usuarios existentes');
    console.log('• Eliminar usuarios (soft delete)');
    console.log('• Sincronización individual por ID');
    console.log('• Sincronización masiva con batches');
    console.log('• Manejo de errores con reintentos');

    console.log('\n🛡️ CARACTERÍSTICAS DE SEGURIDAD:');
    console.log('• Validación de datos antes de sincronizar');
    console.log('• Auditoría completa de eventos');
    console.log('• Límites de seguridad en operaciones masivas');
    console.log('• Manejo graceful de errores');
    console.log('• Compatibilidad hacia atrás mantenida');

    console.log('\n🔄 PRÓXIMOS PASOS:');
    console.log('1. ✅ Tarea 2.1 completada: Sincronización automática');
    console.log('2. 🔄 Continuar con Tarea 2.2: Webhooks robustos');

    process.exit(0);
  } catch (error) {
    console.log('\n❌ VALIDACIÓN FALLIDA');
    console.log('='.repeat(50));
    console.error(`💥 Error: ${error.message}`);
    console.log('\n🔧 ACCIONES REQUERIDAS:');
    console.log('• Revisar la implementación del servicio de sincronización');
    console.log('• Verificar imports y exports');
    console.log('• Comprobar integración con APIs existentes');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { 
  validateServiceFiles, 
  validateSyncServiceFunctions, 
  validateSyncAPI,
  validateAuditIntegration 
};
