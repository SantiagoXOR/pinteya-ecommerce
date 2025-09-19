#!/usr/bin/env node

// =====================================================
// SCRIPT: EJECUTOR DE PRUEBAS ENTERPRISE
// Descripción: Ejecuta suite completa de pruebas E2E y genera reportes
// =====================================================

const { spawn } = require('child_process');
const { promises: fs } = require('fs');
const path = require('path');
const { generateHTMLReport } = require('./generate-test-report');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const CONFIG = {
  testFile: 'tests/e2e/admin-panel-enterprise.spec.ts',
  maxRetries: 2,
  timeout: 300000, // 5 minutos
  serverStartTimeout: 120000, // 2 minutos para que Next.js compile
  reportDir: 'tests/reports',
  screenshotDir: 'tests/screenshots'
};

// =====================================================
// UTILIDADES
// =====================================================

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    progress: '🔄'
  };
  
  console.log(`${icons[type]} [${timestamp}] ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureDirectories() {
  const dirs = [CONFIG.reportDir, CONFIG.screenshotDir, 'tests/playwright-report'];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directorio ya existe
    }
  }
}

async function checkServerHealth(url = 'http://localhost:3000', maxAttempts = 30) {
  log('🔍 Verificando que el servidor esté disponible...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        log(`✅ Servidor disponible en ${url}`, 'success');
        return true;
      }
    } catch (error) {
      // Servidor no disponible aún
    }
    
    if (attempt < maxAttempts) {
      log(`🔄 Intento ${attempt}/${maxAttempts} - Esperando servidor...`, 'progress');
      await sleep(2000);
    }
  }
  
  log(`❌ Servidor no disponible después de ${maxAttempts} intentos`, 'error');
  return false;
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`🚀 Ejecutando: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Comando falló con código ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function startDevServer() {
  log('🚀 Iniciando servidor de desarrollo...');
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true,
    detached: false
  });
  
  // Esperar a que el servidor esté listo
  await sleep(5000); // Esperar inicial
  
  const isReady = await checkServerHealth();
  if (!isReady) {
    serverProcess.kill();
    throw new Error('No se pudo iniciar el servidor de desarrollo');
  }
  
  return serverProcess;
}

async function runPlaywrightTests() {
  log('🎭 Ejecutando pruebas de Playwright...');
  
  try {
    await runCommand('npx', [
      'playwright',
      'test',
      CONFIG.testFile,
      '--project=enterprise-chrome',
      '--reporter=list,json,html',
      '--config=playwright.enterprise.config.ts'
    ]);
    
    log('✅ Pruebas completadas exitosamente', 'success');
    return true;
  } catch (error) {
    log(`⚠️ Pruebas completadas con errores: ${error.message}`, 'warning');
    return false;
  }
}

async function generateReports() {
  log('📊 Generando reportes...');
  
  try {
    await generateHTMLReport();
    log('✅ Reporte HTML generado exitosamente', 'success');
  } catch (error) {
    log(`❌ Error generando reporte HTML: ${error.message}`, 'error');
  }
}

async function openReports() {
  const reportPaths = [
    'tests/playwright-report/index.html',
    'tests/reports'
  ];
  
  log('📂 Reportes disponibles en:');
  for (const reportPath of reportPaths) {
    try {
      const fullPath = path.resolve(reportPath);
      log(`   📄 ${fullPath}`);
    } catch (error) {
      // Archivo no existe
    }
  }
}

// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function runEnterpriseTests() {
  const startTime = Date.now();
  let serverProcess = null;
  
  try {
    log('🚀 INICIANDO SUITE DE PRUEBAS ENTERPRISE', 'info');
    log('==========================================');
    
    // 1. Preparar directorios
    await ensureDirectories();
    log('✅ Directorios preparados', 'success');
    
    // 2. Verificar si el servidor ya está corriendo
    const serverRunning = await checkServerHealth('http://localhost:3000', 3);
    
    if (!serverRunning) {
      // 3. Iniciar servidor de desarrollo
      serverProcess = await startDevServer();
      log('✅ Servidor de desarrollo iniciado', 'success');
    } else {
      log('✅ Servidor ya está corriendo', 'success');
    }
    
    // 4. Ejecutar pruebas de Playwright
    const testsSuccessful = await runPlaywrightTests();
    
    // 5. Generar reportes
    await generateReports();
    
    // 6. Mostrar ubicación de reportes
    await openReports();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    log('==========================================');
    if (testsSuccessful) {
      log(`🎉 SUITE COMPLETADA EXITOSAMENTE en ${duration}s`, 'success');
    } else {
      log(`⚠️ SUITE COMPLETADA CON ERRORES en ${duration}s`, 'warning');
    }
    log('==========================================');
    
    return testsSuccessful;
    
  } catch (error) {
    log(`❌ ERROR CRÍTICO: ${error.message}`, 'error');
    console.error(error);
    return false;
  } finally {
    // Limpiar servidor si lo iniciamos nosotros
    if (serverProcess && !serverProcess.killed) {
      log('🛑 Deteniendo servidor de desarrollo...');
      serverProcess.kill('SIGTERM');
      
      // Esperar a que termine
      await sleep(2000);
      
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }
  }
}

// =====================================================
// COMANDOS CLI
// =====================================================

async function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'test':
      const success = await runEnterpriseTests();
      process.exit(success ? 0 : 1);
      break;
      
    case 'report':
      await generateReports();
      break;
      
    case 'health':
      const healthy = await checkServerHealth();
      process.exit(healthy ? 0 : 1);
      break;
      
    case 'help':
    default:
      console.log(`
🚀 SCRIPT DE PRUEBAS ENTERPRISE - PINTEYA E-COMMERCE

Uso:
  node scripts/run-enterprise-tests.js [comando]

Comandos:
  test     - Ejecutar suite completa de pruebas E2E
  report   - Generar solo reportes HTML
  health   - Verificar estado del servidor
  help     - Mostrar esta ayuda

Ejemplos:
  node scripts/run-enterprise-tests.js test
  npm run test:enterprise
      `);
      break;
  }
}

// =====================================================
// EJECUCIÓN
// =====================================================

if (require.main === module) {
  handleCLI().catch(error => {
    log(`❌ Error fatal: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runEnterpriseTests,
  checkServerHealth,
  generateReports
};
