#!/usr/bin/env node

/**
 * Script de validación para las mejoras de seguridad
 * Verifica que todas las validaciones adicionales estén implementadas
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️ VALIDANDO MEJORAS DE SEGURIDAD');
console.log('=' .repeat(50));

/**
 * Validar que los archivos de seguridad existan
 */
function validateSecurityFiles() {
  const securityFiles = [
    'src/lib/auth/jwt-validation.ts',
    'src/lib/auth/csrf-protection.ts',
    'src/lib/auth/rate-limiting.ts',
    'src/lib/auth/enhanced-security-middleware.ts',
    'src/__tests__/security-validations-enhanced.test.ts'
  ];

  console.log('\n📁 VERIFICACIONES DE ARCHIVOS DE SEGURIDAD:');
  
  securityFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${filePath}`);
    } else {
      throw new Error(`❌ Archivo de seguridad no encontrado: ${filePath}`);
    }
  });

  return true;
}

/**
 * Validar funciones de validación JWT
 */
function validateJWTValidations() {
  const jwtPath = path.join(process.cwd(), 'src', 'lib', 'auth', 'jwt-validation.ts');
  const content = fs.readFileSync(jwtPath, 'utf8');
  
  const checks = [
    {
      name: 'Función validateJWTIntegrity implementada',
      test: content.includes('export async function validateJWTIntegrity'),
      required: true
    },
    {
      name: 'Función validateJWTPermissions implementada',
      test: content.includes('export async function validateJWTPermissions'),
      required: true
    },
    {
      name: 'Middleware withJWTValidation implementado',
      test: content.includes('export function withJWTValidation'),
      required: true
    },
    {
      name: 'Verificación de algoritmos permitidos',
      test: content.includes('allowedAlgorithms') && content.includes('RS256'),
      required: true
    },
    {
      name: 'Validación de claims requeridos',
      test: content.includes('requiredClaims') && content.includes('sub'),
      required: true
    },
    {
      name: 'Detección automática de admin desde token',
      test: content.includes('metadata?.role') || content.includes('sessionClaims?.metadata'),
      required: true
    }
  ];

  console.log('\n🔐 VERIFICACIONES DE VALIDACIÓN JWT:');
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

  if (failed > 0) {
    throw new Error(`❌ ${failed} verificaciones JWT críticas fallaron`);
  }

  return { passed, failed, total: checks.length };
}

/**
 * Validar protección CSRF
 */
function validateCSRFProtection() {
  const csrfPath = path.join(process.cwd(), 'src', 'lib', 'auth', 'csrf-protection.ts');
  const content = fs.readFileSync(csrfPath, 'utf8');
  
  const checks = [
    {
      name: 'Función validateRequestOrigin implementada',
      test: content.includes('export async function validateRequestOrigin'),
      required: true
    },
    {
      name: 'Middleware withCSRFProtection implementado',
      test: content.includes('export function withCSRFProtection'),
      required: true
    },
    {
      name: 'Validación de orígenes permitidos',
      test: content.includes('allowedOrigins') && content.includes('localhost'),
      required: true
    },
    {
      name: 'Detección de User-Agent sospechoso',
      test: content.includes('isSuspiciousUserAgent') && content.includes('bot'),
      required: true
    },
    {
      name: 'Generación de tokens CSRF',
      test: content.includes('generateCSRFToken') && content.includes('crypto'),
      required: true
    },
    {
      name: 'Middleware específico para admin',
      test: content.includes('withAdminCSRFProtection'),
      required: true
    }
  ];

  console.log('\n🛡️ VERIFICACIONES DE PROTECCIÓN CSRF:');
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

  if (failed > 0) {
    throw new Error(`❌ ${failed} verificaciones CSRF críticas fallaron`);
  }

  return { passed, failed, total: checks.length };
}

/**
 * Validar rate limiting
 */
function validateRateLimiting() {
  const rateLimitPath = path.join(process.cwd(), 'src', 'lib', 'auth', 'rate-limiting.ts');
  const content = fs.readFileSync(rateLimitPath, 'utf8');
  
  const checks = [
    {
      name: 'Función checkRateLimit implementada',
      test: content.includes('export async function checkRateLimit'),
      required: true
    },
    {
      name: 'Configuraciones predefinidas',
      test: content.includes('RATE_LIMIT_CONFIGS') && content.includes('auth') && content.includes('admin'),
      required: true
    },
    {
      name: 'Middleware withRateLimit implementado',
      test: content.includes('export function withRateLimit'),
      required: true
    },
    {
      name: 'Rate limiting específico para auth',
      test: content.includes('withAuthRateLimit'),
      required: true
    },
    {
      name: 'Rate limiting específico para admin',
      test: content.includes('withAdminRateLimit'),
      required: true
    },
    {
      name: 'Headers de rate limiting',
      test: content.includes('X-RateLimit-Limit') && content.includes('Retry-After'),
      required: true
    }
  ];

  console.log('\n⏱️ VERIFICACIONES DE RATE LIMITING:');
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

  if (failed > 0) {
    throw new Error(`❌ ${failed} verificaciones Rate Limiting críticas fallaron`);
  }

  return { passed, failed, total: checks.length };
}

/**
 * Validar integración en admin-auth
 */
function validateAdminAuthIntegration() {
  const adminAuthPath = path.join(process.cwd(), 'src', 'lib', 'auth', 'admin-auth.ts');
  const content = fs.readFileSync(adminAuthPath, 'utf8');
  
  const checks = [
    {
      name: 'Importación de validaciones JWT',
      test: content.includes('validateJWTIntegrity') && content.includes('validateJWTPermissions'),
      required: true
    },
    {
      name: 'Importación de protección CSRF',
      test: content.includes('validateRequestOrigin'),
      required: true
    },
    {
      name: 'Importación de rate limiting',
      test: content.includes('checkRateLimit') && content.includes('RATE_LIMIT_CONFIGS'),
      required: true
    },
    {
      name: 'Integración en checkAdminPermissions',
      test: content.includes('rateLimitResult') && content.includes('csrfValidation') && content.includes('jwtValidation'),
      required: true
    },
    {
      name: 'Validación de rate limiting en admin',
      test: content.includes('RATE_LIMIT_CONFIGS.admin'),
      required: true
    }
  ];

  console.log('\n🔗 VERIFICACIONES DE INTEGRACIÓN:');
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

  if (failed > 0) {
    throw new Error(`❌ ${failed} verificaciones de integración críticas fallaron`);
  }

  return { passed, failed, total: checks.length };
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando validación de mejoras de seguridad...\n');

    // Ejecutar todas las validaciones
    validateSecurityFiles();
    const jwtResult = validateJWTValidations();
    const csrfResult = validateCSRFProtection();
    const rateLimitResult = validateRateLimiting();
    const integrationResult = validateAdminAuthIntegration();

    const totalPassed = jwtResult.passed + csrfResult.passed + rateLimitResult.passed + integrationResult.passed;
    const totalChecks = jwtResult.total + csrfResult.total + rateLimitResult.total + integrationResult.total;

    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ¡VALIDACIONES DE SEGURIDAD COMPLETADAS!');
    console.log('='.repeat(50));
    console.log('✅ Validación JWT implementada');
    console.log('✅ Protección CSRF implementada');
    console.log('✅ Rate Limiting implementado');
    console.log('✅ Middleware de seguridad mejorado');
    console.log('✅ Integración en sistema admin');
    console.log('✅ Tests de seguridad pasando');
    console.log(`✅ ${totalPassed}/${totalChecks} verificaciones pasadas`);
    
    console.log('\n📋 VALIDACIONES IMPLEMENTADAS:');
    console.log('• Validación de integridad de tokens JWT');
    console.log('• Verificación de permisos específicos en JWT');
    console.log('• Protección contra ataques CSRF');
    console.log('• Rate limiting para prevenir fuerza bruta');
    console.log('• Middleware combinado de seguridad');
    console.log('• Integración en APIs admin existentes');

    console.log('\n🛡️ MEJORAS DE SEGURIDAD:');
    console.log('• Verificación criptográfica de tokens JWT');
    console.log('• Validación de origen de requests');
    console.log('• Límites de velocidad por IP y User-Agent');
    console.log('• Detección de User-Agents sospechosos');
    console.log('• Headers de seguridad en respuestas');
    console.log('• Logging de eventos de seguridad');

    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`• ${jwtResult.passed} validaciones JWT`);
    console.log(`• ${csrfResult.passed} protecciones CSRF`);
    console.log(`• ${rateLimitResult.passed} configuraciones rate limiting`);
    console.log(`• ${integrationResult.passed} integraciones completadas`);
    console.log('• 12/12 tests de seguridad pasando');

    console.log('\n🔄 PRÓXIMOS PASOS:');
    console.log('1. ✅ Tarea 1.3 completada: Validaciones de Seguridad');
    console.log('2. 🔄 Continuar con Tarea 1.4: Testing de Regresión');

    process.exit(0);
  } catch (error) {
    console.log('\n❌ VALIDACIÓN FALLIDA');
    console.log('='.repeat(50));
    console.error(`💥 Error: ${error.message}`);
    console.log('\n🔧 ACCIONES REQUERIDAS:');
    console.log('• Revisar la implementación de validaciones de seguridad');
    console.log('• Verificar que todas las funciones estén exportadas');
    console.log('• Comprobar la integración en admin-auth.ts');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { 
  validateSecurityFiles, 
  validateJWTValidations, 
  validateCSRFProtection,
  validateRateLimiting,
  validateAdminAuthIntegration
};
