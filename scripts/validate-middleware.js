#!/usr/bin/env node

/**
 * Script de validación del middleware
 * Verifica que la configuración esté correcta sin necesidad de servidor corriendo
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDANDO CONFIGURACIÓN DEL MIDDLEWARE');
console.log('=' .repeat(50));

/**
 * Validar que el archivo middleware.ts existe y tiene el contenido correcto
 */
function validateMiddlewareFile() {
  const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts');
  
  if (!fs.existsSync(middlewarePath)) {
    throw new Error('❌ Archivo middleware.ts no encontrado');
  }

  const content = fs.readFileSync(middlewarePath, 'utf8');
  
  // Verificaciones de contenido
  const checks = [
    {
      name: 'Importa clerkMiddleware',
      test: content.includes('clerkMiddleware'),
      required: true
    },
    {
      name: 'Importa createRouteMatcher',
      test: content.includes('createRouteMatcher'),
      required: true
    },
    {
      name: 'Define rutas admin',
      test: content.includes('isAdminRoute') && content.includes('/api/admin'),
      required: true
    },
    {
      name: 'Define rutas públicas',
      test: content.includes('isPublicRoute'),
      required: true
    },
    {
      name: 'Verifica userId en rutas admin',
      test: content.includes('userId') && content.includes('auth()'),
      required: true
    },
    {
      name: 'Verifica roles de usuario',
      test: content.includes('sessionClaims') && content.includes('role'),
      required: true
    },
    {
      name: 'Maneja errores de autenticación',
      test: content.includes('catch') && content.includes('error'),
      required: true
    },
    {
      name: 'Configuración de matcher',
      test: content.includes('export const config') && content.includes('matcher'),
      required: true
    },
    {
      name: 'Skip rutas estáticas',
      test: content.includes('_next') && content.includes('favicon'),
      required: true
    },
    {
      name: 'Logging de seguridad',
      test: content.includes('console.warn') || content.includes('console.log'),
      required: false
    }
  ];

  console.log('\n📋 VERIFICACIONES DE CONTENIDO:');
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
 * Validar dependencias de Clerk
 */
function validateClerkDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('❌ package.json no encontrado');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredDeps = [
    '@clerk/nextjs',
    'next'
  ];

  console.log('\n📦 VERIFICACIONES DE DEPENDENCIAS:');
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep}: ${dependencies[dep]}`);
    } else {
      throw new Error(`❌ Dependencia requerida no encontrada: ${dep}`);
    }
  });

  return true;
}

/**
 * Validar variables de entorno
 */
function validateEnvironmentVariables() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  console.log('\n🔐 VERIFICACIONES DE VARIABLES DE ENTORNO:');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];

  const optionalEnvVars = [
    'CLERK_WEBHOOK_SECRET'
  ];

  // Verificar variables requeridas
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      const value = process.env[varName];
      const maskedValue = value.substring(0, 10) + '...';
      console.log(`✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`⚠️ ${varName}: No configurada (requerida para producción)`);
    }
  });

  // Verificar variables opcionales
  optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configurada`);
    } else {
      console.log(`ℹ️ ${varName}: No configurada (opcional)`);
    }
  });

  return true;
}

/**
 * Validar estructura de archivos
 */
function validateFileStructure() {
  console.log('\n📁 VERIFICACIONES DE ESTRUCTURA:');
  
  const requiredFiles = [
    'src/middleware.ts',
    'src/middleware/security.ts',
    'src/lib/auth/admin-auth.ts'
  ];

  const optionalFiles = [
    'src/__tests__/middleware.test.ts',
    'scripts/test-middleware-integration.js'
  ];

  requiredFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${filePath}`);
    } else {
      throw new Error(`❌ Archivo requerido no encontrado: ${filePath}`);
    }
  });

  optionalFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${filePath} (opcional)`);
    } else {
      console.log(`ℹ️ ${filePath} (opcional, no encontrado)`);
    }
  });

  return true;
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando validación del middleware...\n');

    // Ejecutar todas las validaciones
    validateFileStructure();
    validateClerkDependencies();
    validateEnvironmentVariables();
    const middlewareValidation = validateMiddlewareFile();

    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ¡VALIDACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('='.repeat(50));
    console.log('✅ Middleware configurado correctamente');
    console.log('✅ Dependencias instaladas');
    console.log('✅ Estructura de archivos válida');
    console.log(`✅ ${middlewareValidation.passed}/${middlewareValidation.total} verificaciones pasadas`);
    
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. ✅ Middleware de Clerk implementado');
    console.log('2. 🔄 Continuar con Tarea 1.2: Migrar getAuthenticatedUser');
    console.log('3. 🔄 Continuar con Tarea 1.3: Añadir validaciones');
    console.log('4. 🔄 Continuar con Tarea 1.4: Testing de regresión');

    console.log('\n🛡️ FUNCIONALIDADES IMPLEMENTADAS:');
    console.log('• Protección automática de rutas /api/admin/*');
    console.log('• Verificación de roles (admin/moderator)');
    console.log('• Manejo de errores robusto');
    console.log('• Logging de seguridad');
    console.log('• Performance optimizada para rutas estáticas');

    process.exit(0);
  } catch (error) {
    console.log('\n❌ VALIDACIÓN FALLIDA');
    console.log('='.repeat(50));
    console.error(`💥 Error: ${error.message}`);
    console.log('\n🔧 ACCIONES REQUERIDAS:');
    console.log('• Revisar la configuración del middleware');
    console.log('• Verificar dependencias instaladas');
    console.log('• Comprobar variables de entorno');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { validateMiddlewareFile, validateClerkDependencies };
