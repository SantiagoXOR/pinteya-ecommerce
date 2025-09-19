#!/usr/bin/env node

// ===================================
// MONITORING SETUP SCRIPT
// Script para configurar el sistema de monitoring en producción
// ===================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Configuración del proyecto
const PROJECT_ROOT = path.resolve(__dirname, '..');
const MONITORING_CONFIG_PATH = path.join(PROJECT_ROOT, 'src', 'config', 'monitoring-config.ts');
const ENV_EXAMPLE_PATH = path.join(PROJECT_ROOT, '.env.monitoring.example');
const ENV_LOCAL_PATH = path.join(PROJECT_ROOT, '.env.local');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

// Función principal
async function setupMonitoring() {
  log('🚀 Configurando sistema de monitoring...', 'bright');
  
  try {
    // Paso 1: Verificar archivos necesarios
    logStep('1', 'Verificando archivos del sistema de monitoring');
    await verifyFiles();
    
    // Paso 2: Configurar variables de entorno
    logStep('2', 'Configurando variables de entorno');
    await setupEnvironmentVariables();
    
    // Paso 3: Instalar dependencias adicionales
    logStep('3', 'Verificando dependencias');
    await checkDependencies();
    
    // Paso 4: Configurar base de datos (si es necesario)
    logStep('4', 'Configurando almacenamiento');
    await setupStorage();
    
    // Paso 5: Configurar alertas
    logStep('5', 'Configurando sistema de alertas');
    await setupAlerts();
    
    // Paso 6: Ejecutar tests del sistema
    logStep('6', 'Ejecutando tests del sistema de monitoring');
    await runTests();
    
    // Paso 7: Generar documentación
    logStep('7', 'Generando documentación');
    await generateDocumentation();
    
    log('\n🎉 Sistema de monitoring configurado exitosamente!', 'green');
    log('\n📋 Próximos pasos:', 'bright');
    log('1. Revisar las variables de entorno en .env.local');
    log('2. Configurar webhooks para alertas');
    log('3. Ejecutar npm run build para verificar la compilación');
    log('4. Desplegar a producción');
    log('5. Monitorear los logs iniciales');
    
  } catch (error) {
    logError(`Error durante la configuración: ${error.message}`);
    process.exit(1);
  }
}

// Verificar que todos los archivos necesarios existan
async function verifyFiles() {
  const requiredFiles = [
    'src/lib/monitoring/admin-monitoring.ts',
    'src/middleware/performance-monitoring.ts',
    'src/config/production-monitoring.ts',
    'src/config/monitoring-config.ts',
    'src/components/admin/PerformanceMonitor.tsx',
    'src/app/api/admin/performance/metrics/route.ts',
    'src/app/admin/performance/page.tsx',
    'middleware.ts',
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    logError('Archivos faltantes del sistema de monitoring:');
    missingFiles.forEach(file => log(`  - ${file}`, 'red'));
    throw new Error('Archivos del sistema de monitoring faltantes');
  }
  
  logSuccess('Todos los archivos del sistema están presentes');
}

// Configurar variables de entorno
async function setupEnvironmentVariables() {
  if (!fs.existsSync(ENV_LOCAL_PATH)) {
    if (fs.existsSync(ENV_EXAMPLE_PATH)) {
      fs.copyFileSync(ENV_EXAMPLE_PATH, ENV_LOCAL_PATH);
      logSuccess('Archivo .env.local creado desde .env.monitoring.example');
    } else {
      // Crear .env.local básico
      const basicEnv = `# Monitoring Configuration\nMONITORING_ENABLED=true\nMONITORING_ENVIRONMENT=production\nNODE_ENV=production\n`;
      fs.writeFileSync(ENV_LOCAL_PATH, basicEnv);
      logSuccess('Archivo .env.local básico creado');
    }
  } else {
    logWarning('.env.local ya existe, no se sobrescribirá');
  }
  
  // Verificar variables críticas
  const envContent = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
  const criticalVars = ['MONITORING_ENABLED', 'NODE_ENV'];
  const missingVars = criticalVars.filter(varName => !envContent.includes(varName));
  
  if (missingVars.length > 0) {
    logWarning(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
  } else {
    logSuccess('Variables de entorno críticas configuradas');
  }
}

// Verificar dependencias
async function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = [
      '@types/node',
      'next',
      'react',
      'lucide-react',
    ];
    
    const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
    
    if (missingDeps.length > 0) {
      logWarning(`Dependencias faltantes: ${missingDeps.join(', ')}`);
      log('Instalando dependencias faltantes...');
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    }
    
    logSuccess('Todas las dependencias están instaladas');
  } catch (error) {
    logWarning('No se pudo verificar las dependencias automáticamente');
  }
}

// Configurar almacenamiento
async function setupStorage() {
  const envContent = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
  
  if (envContent.includes('MONITORING_STORAGE_TYPE=redis')) {
    logWarning('Configuración de Redis detectada');
    log('Asegúrate de que Redis esté ejecutándose y configurado correctamente');
  } else if (envContent.includes('MONITORING_STORAGE_TYPE=database')) {
    logWarning('Configuración de base de datos detectada');
    log('Asegúrate de que la base de datos esté configurada correctamente');
  } else {
    logSuccess('Usando almacenamiento en memoria (por defecto)');
  }
}

// Configurar alertas
async function setupAlerts() {
  const envContent = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
  
  const hasWebhook = envContent.includes('MONITORING_WEBHOOK_URL=http');
  const hasEmail = envContent.includes('MONITORING_EMAIL_ALERTS=');
  
  if (!hasWebhook && !hasEmail) {
    logWarning('No se han configurado canales de alerta');
    log('Considera configurar MONITORING_WEBHOOK_URL o MONITORING_EMAIL_ALERTS');
  } else {
    logSuccess('Canales de alerta configurados');
  }
}

// Ejecutar tests básicos
async function runTests() {
  try {
    // Test básico de compilación
    log('Verificando compilación de TypeScript...');
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    logSuccess('Compilación de TypeScript exitosa');
    
    // Test de build de Next.js
    log('Verificando build de Next.js...');
    execSync('npm run build', { stdio: 'pipe' });
    logSuccess('Build de Next.js exitoso');
    
  } catch (error) {
    logWarning('Algunos tests fallaron, revisa la configuración');
    log('Error:', error.message.substring(0, 200) + '...');
  }
}

// Generar documentación
async function generateDocumentation() {
  const docsPath = path.join(PROJECT_ROOT, 'docs', 'monitoring.md');
  const docsDir = path.dirname(docsPath);
  
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  const documentation = `# Sistema de Monitoring

## Configuración

El sistema de monitoring ha sido configurado automáticamente.

### Archivos principales:
- \`src/lib/monitoring/\` - Librerías de monitoring
- \`src/components/admin/PerformanceMonitor.tsx\` - Componente de dashboard
- \`src/app/admin/performance/page.tsx\` - Página de administración
- \`middleware.ts\` - Middleware integrado

### Variables de entorno:
Ver \`.env.monitoring.example\` para todas las opciones disponibles.

### Uso:
1. Accede a \`/admin/performance\` para ver el dashboard
2. Las métricas se recolectan automáticamente
3. Las alertas se envían según la configuración

### API Endpoints:
- \`GET /api/admin/performance/metrics\` - Obtener métricas
- \`POST /api/admin/performance/metrics\` - Enviar métricas del cliente
- \`DELETE /api/admin/performance/metrics\` - Limpiar métricas antiguas

## Mantenimiento

- Revisar logs regularmente
- Ajustar umbrales según necesidades
- Actualizar configuración de alertas
- Monitorear uso de recursos

Generado automáticamente el ${new Date().toISOString()}
`;
  
  fs.writeFileSync(docsPath, documentation);
  logSuccess('Documentación generada en docs/monitoring.md');
}

// Función de ayuda
function showHelp() {
  log('\n🔧 Script de configuración del sistema de monitoring\n', 'bright');
  log('Uso: node scripts/setup-monitoring.js [opciones]\n');
  log('Opciones:');
  log('  --help, -h     Mostrar esta ayuda');
  log('  --force, -f    Forzar reconfiguración');
  log('  --check, -c    Solo verificar configuración');
  log('\nEjemplos:');
  log('  node scripts/setup-monitoring.js');
  log('  node scripts/setup-monitoring.js --check');
  log('  node scripts/setup-monitoring.js --force\n');
}

// Manejo de argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--check') || args.includes('-c')) {
  log('🔍 Verificando configuración del sistema de monitoring...', 'bright');
  verifyFiles()
    .then(() => logSuccess('Sistema de monitoring configurado correctamente'))
    .catch(error => {
      logError(`Error en la verificación: ${error.message}`);
      process.exit(1);
    });
} else {
  // Ejecutar configuración completa
  setupMonitoring();
}

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logError(`Error no manejado: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Excepción no capturada: ${error.message}`);
  process.exit(1);
});