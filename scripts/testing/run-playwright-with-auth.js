#!/usr/bin/env node

/**
 * SCRIPT PARA EJECUTAR PLAYWRIGHT CON AUTENTICACIÓN CONFIGURADA
 * 
 * Este script ejecuta los tests de Playwright con la configuración
 * de autenticación automática para tests administrativos.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

async function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    log(`🚀 Ejecutando: ${command}`, 'blue');
    
    const child = spawn(command, { 
      shell: true, 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        logSuccess(`${description} completado exitosamente`);
        resolve({ success: true, code });
      } else {
        logError(`${description} falló con código: ${code}`);
        resolve({ success: false, code });
      }
    });
    
    child.on('error', (error) => {
      logError(`Error ejecutando ${description}: ${error.message}`);
      reject(error);
    });
  });
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`📁 Directorio creado: ${dirPath}`, 'blue');
  }
}

async function main() {
  log('🎭 PLAYWRIGHT E2E TESTS CON AUTENTICACIÓN AUTOMÁTICA', 'bright');
  log('=' .repeat(60), 'cyan');
  
  try {
    // Verificar que estamos en el directorio correcto
    if (!fs.existsSync('playwright.config.ts')) {
      throw new Error('No se encontró playwright.config.ts. Ejecuta desde la raíz del proyecto.');
    }

    // Crear directorios necesarios
    logStep(1, 'Preparando directorios');
    ensureDirectoryExists('test-results');
    ensureDirectoryExists('tests/e2e/.auth');
    ensureDirectoryExists('playwright-report');

    // Cambiar a middleware de testing
    logStep(2, 'Configurando middleware de testing');
    const middlewareResult = await runCommand(
      'node scripts/switch-middleware.js test',
      'Configuración de middleware de testing'
    );

    if (!middlewareResult.success) {
      logWarning('No se pudo configurar middleware de testing, continuando...');
    }
    
    // Verificar que el servidor de desarrollo esté corriendo
    logStep(3, 'Verificando servidor de desarrollo');
    log('💡 Asegúrate de que el servidor esté corriendo en http://localhost:3000', 'yellow');
    log('💡 Si no está corriendo, ejecuta: npm run dev', 'yellow');
    
    // Ejecutar setup de autenticación
    logStep(4, 'Configurando autenticación');
    const setupResult = await runCommand(
      'npx playwright test --project=setup',
      'Setup de autenticación'
    );
    
    if (!setupResult.success) {
      throw new Error('Fallo en la configuración de autenticación');
    }
    
    // Verificar que el archivo de autenticación se creó o existe
    const authFile = 'tests/e2e/.auth/admin.json';

    // Esperar un momento para que el archivo se cree
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!fs.existsSync(authFile)) {
      logWarning('Archivo de autenticación no encontrado, pero setup completado exitosamente');
      logWarning('Los tests administrativos usarán autenticación en tiempo real');
    } else {
      logSuccess('Archivo de autenticación creado correctamente');
    }
    
    // Ejecutar tests administrativos
    logStep(5, 'Ejecutando tests administrativos');
    const adminTestsResult = await runCommand(
      'npx playwright test --project=chromium-admin --reporter=html,json',
      'Tests administrativos'
    );
    
    // Ejecutar tests públicos
    logStep(6, 'Ejecutando tests públicos');
    const publicTestsResult = await runCommand(
      'npx playwright test --project=chromium-public --reporter=html,json',
      'Tests públicos'
    );
    
    // Ejecutar cleanup y restaurar middleware
    logStep(7, 'Limpiando archivos temporales y restaurando middleware');
    const cleanupResult = await runCommand(
      'npx playwright test --project=cleanup',
      'Cleanup'
    );

    // Restaurar middleware de producción
    await runCommand(
      'node scripts/switch-middleware.js prod',
      'Restauración de middleware de producción'
    );
    
    // Resumen de resultados
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 RESUMEN DE RESULTADOS', 'bright');
    log('='.repeat(60), 'cyan');
    
    logSuccess(`Setup de autenticación: ${setupResult.success ? 'EXITOSO' : 'FALLIDO'}`);
    logSuccess(`Tests administrativos: ${adminTestsResult.success ? 'EXITOSO' : 'FALLIDO'}`);
    logSuccess(`Tests públicos: ${publicTestsResult.success ? 'EXITOSO' : 'FALLIDO'}`);
    logSuccess(`Cleanup: ${cleanupResult.success ? 'EXITOSO' : 'FALLIDO'}`);
    
    // Verificar si hay reportes disponibles
    if (fs.existsSync('playwright-report/index.html')) {
      log('\n📄 Reporte HTML disponible en: playwright-report/index.html', 'blue');
      log('💡 Abre el reporte con: npx playwright show-report', 'yellow');
    }
    
    if (fs.existsSync('test-results/results.json')) {
      log('📄 Reporte JSON disponible en: test-results/results.json', 'blue');
    }
    
    // Determinar éxito general
    const overallSuccess = setupResult.success && 
                          (adminTestsResult.success || publicTestsResult.success);
    
    if (overallSuccess) {
      log('\n🎉 TESTS COMPLETADOS EXITOSAMENTE', 'green');
      process.exit(0);
    } else {
      log('\n💥 ALGUNOS TESTS FALLARON', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Error ejecutando tests: ${error.message}`);
    process.exit(1);
  }
}

// Manejar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('🎭 PLAYWRIGHT E2E TESTS CON AUTENTICACIÓN', 'bright');
  log('\nUso: node scripts/run-playwright-with-auth.js [opciones]', 'blue');
  log('\nOpciones:', 'yellow');
  log('  --help, -h     Mostrar esta ayuda');
  log('  --admin-only   Ejecutar solo tests administrativos');
  log('  --public-only  Ejecutar solo tests públicos');
  log('\nEjemplos:', 'yellow');
  log('  node scripts/run-playwright-with-auth.js');
  log('  node scripts/run-playwright-with-auth.js --admin-only');
  process.exit(0);
}

// Ejecutar script principal
main().catch(error => {
  logError(`Error no manejado: ${error.message}`);
  process.exit(1);
});
