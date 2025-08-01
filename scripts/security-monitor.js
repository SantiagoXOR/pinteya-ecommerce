#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - MONITOR DE SEGURIDAD CONTINUO
 * Monitorea cambios en archivos y ejecuta verificaciones de seguridad
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

console.log('🛡️  MONITOR DE SEGURIDAD CONTINUO - PINTEYA E-COMMERCE');
console.log('Monitoreando cambios en archivos sensibles...\n');

// Archivos y patrones a monitorear
const WATCH_PATTERNS = [
  '.env*',
  '*.backup*',
  'backup.*',
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'src/**/*.jsx'
];

// Archivos a excluir del monitoreo
const IGNORE_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'build/**',
  '.git/**'
];

/**
 * Ejecuta verificación de seguridad
 */
async function runSecurityCheck(filePath) {
  console.log(`🔍 Verificando seguridad en: ${filePath}`);
  
  try {
    const { execSync } = require('child_process');
    const result = execSync('node scripts/security-audit-enhanced.js', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Verificación completada - Sin problemas detectados');
  } catch (error) {
    console.error('❌ ALERTA DE SEGURIDAD DETECTADA:');
    console.error(error.stdout || error.message);
    
    // Enviar notificación (implementar según necesidades)
    sendSecurityAlert(filePath, error.stdout || error.message);
  }
}

/**
 * Envía alerta de seguridad
 */
function sendSecurityAlert(filePath, details) {
  const timestamp = new Date().toISOString();
  const alertMessage = `
🚨 ALERTA DE SEGURIDAD - ${timestamp}
Archivo: ${filePath}
Detalles: ${details}
Acción requerida: Revisar y corregir inmediatamente
`;

  // Escribir a log de seguridad
  const logPath = path.join(process.cwd(), 'security-alerts.log');
  fs.appendFileSync(logPath, alertMessage + '\n');
  
  console.log('📝 Alerta registrada en security-alerts.log');
  
  // Aquí se pueden agregar más canales de notificación:
  // - Email
  // - Slack
  // - Discord
  // - SMS
}

/**
 * Inicializa el monitor
 */
function initializeMonitor() {
  const watcher = chokidar.watch(WATCH_PATTERNS, {
    ignored: IGNORE_PATTERNS,
    persistent: true,
    ignoreInitial: true
  });

  watcher
    .on('add', (filePath) => {
      console.log(`📁 Archivo agregado: ${filePath}`);
      runSecurityCheck(filePath);
    })
    .on('change', (filePath) => {
      console.log(`📝 Archivo modificado: ${filePath}`);
      runSecurityCheck(filePath);
    })
    .on('unlink', (filePath) => {
      console.log(`🗑️  Archivo eliminado: ${filePath}`);
    })
    .on('error', (error) => {
      console.error('❌ Error en monitor:', error);
    });

  console.log('✅ Monitor de seguridad iniciado');
  console.log('Presiona Ctrl+C para detener\n');
}

// Verificación inicial
console.log('🔍 Ejecutando verificación inicial...');
runSecurityCheck('.')
  .then(() => {
    console.log('✅ Verificación inicial completada\n');
    initializeMonitor();
  })
  .catch((error) => {
    console.error('❌ Error en verificación inicial:', error);
    process.exit(1);
  });

// Manejo de señales para cierre limpio
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo monitor de seguridad...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Monitor de seguridad terminado');
  process.exit(0);
});
