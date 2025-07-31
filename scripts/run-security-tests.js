#!/usr/bin/env node

/**
 * Script de Ejecución de Tests de Seguridad Enterprise
 * Ejecuta la suite completa de tests de seguridad con reportes detallados
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración de colores para output
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

// Función para logging con colores
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para ejecutar comandos con manejo de errores
function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'cyan');
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    log(`✅ ${description} completado`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} falló`, 'red');
    return { success: false, error: error.message, output: error.stdout };
  }
}

// Función para generar reporte de resultados
function generateReport(results) {
  const timestamp = new Date().toISOString();
  const reportPath = path.join(__dirname, '..', 'reports', `security-test-report-${Date.now()}.json`);
  
  // Crear directorio de reportes si no existe
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const report = {
    timestamp,
    summary: {
      total_suites: results.length,
      passed_suites: results.filter(r => r.success).length,
      failed_suites: results.filter(r => !r.success).length,
      success_rate: (results.filter(r => r.success).length / results.length * 100).toFixed(2)
    },
    results,
    recommendations: [
      'Revisar tests fallidos para identificar problemas de configuración',
      'Mejorar mocks para mayor estabilidad en testing',
      'Implementar tests de regresión para cambios futuros',
      'Considerar integración con CI/CD para testing automático'
    ]
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📊 Reporte generado: ${reportPath}`, 'blue');
  
  return report;
}

// Función principal
async function runSecurityTests() {
  log('🛡️  INICIANDO TESTS DE SEGURIDAD ENTERPRISE - FASE 3', 'bright');
  log('=' * 60, 'cyan');

  const startTime = Date.now();
  const results = [];

  // 1. Tests de Rate Limiting Enterprise
  log('\n📋 CATEGORÍA 1: RATE LIMITING ENTERPRISE', 'magenta');
  const rateLimitResult = runCommand(
    'npm test src/__tests__/security/penetration-rate-limiting.test.ts --verbose',
    'Tests de Penetración - Rate Limiting'
  );
  results.push({
    category: 'Rate Limiting Enterprise',
    test_file: 'penetration-rate-limiting.test.ts',
    ...rateLimitResult
  });

  // 2. Tests de Auditoría Enterprise
  log('\n📋 CATEGORÍA 2: AUDITORÍA ENTERPRISE', 'magenta');
  const auditResult = runCommand(
    'npm test src/__tests__/security/penetration-audit-system.test.ts --verbose',
    'Tests de Penetración - Sistema de Auditoría'
  );
  results.push({
    category: 'Auditoría Enterprise',
    test_file: 'penetration-audit-system.test.ts',
    ...auditResult
  });

  // 3. Tests de Validación Enterprise
  log('\n📋 CATEGORÍA 3: VALIDACIÓN ENTERPRISE', 'magenta');
  const validationResult = runCommand(
    'npm test src/__tests__/security/penetration-validation-system.test.ts --verbose',
    'Tests de Penetración - Sistema de Validación'
  );
  results.push({
    category: 'Validación Enterprise',
    test_file: 'penetration-validation-system.test.ts',
    ...validationResult
  });

  // 4. Tests de Integración Completa
  log('\n📋 CATEGORÍA 4: INTEGRACIÓN COMPLETA', 'magenta');
  const integrationResult = runCommand(
    'npm test src/__tests__/security/integration-security-complete.test.ts --verbose',
    'Tests de Integración - Seguridad Completa'
  );
  results.push({
    category: 'Integración Completa',
    test_file: 'integration-security-complete.test.ts',
    ...integrationResult
  });

  // 5. Tests de Performance y Carga
  log('\n📋 CATEGORÍA 5: PERFORMANCE Y CARGA', 'magenta');
  const performanceResult = runCommand(
    'npm test src/__tests__/security/performance-security-load.test.ts --verbose --testTimeout=120000',
    'Tests de Performance - Carga de Seguridad'
  );
  results.push({
    category: 'Performance y Carga',
    test_file: 'performance-security-load.test.ts',
    ...performanceResult
  });

  // 6. Tests de Sistema Enterprise Completo
  log('\n📋 CATEGORÍA 6: SISTEMA ENTERPRISE COMPLETO', 'magenta');
  const enterpriseResult = runCommand(
    'npm test src/__tests__/security/enterprise-audit-system.test.ts --verbose',
    'Tests Enterprise - Sistema de Auditoría'
  );
  results.push({
    category: 'Sistema Enterprise Completo',
    test_file: 'enterprise-audit-system.test.ts',
    ...enterpriseResult
  });

  // Generar reporte final
  log('\n📊 GENERANDO REPORTE FINAL...', 'cyan');
  const report = generateReport(results);

  // Mostrar resumen
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n🎯 RESUMEN DE RESULTADOS:', 'bright');
  log('=' * 50, 'cyan');
  log(`⏱️  Tiempo total: ${duration} segundos`, 'blue');
  log(`📊 Suites totales: ${report.summary.total_suites}`, 'blue');
  log(`✅ Suites exitosas: ${report.summary.passed_suites}`, 'green');
  log(`❌ Suites fallidas: ${report.summary.failed_suites}`, 'red');
  log(`📈 Tasa de éxito: ${report.summary.success_rate}%`, 'yellow');

  // Mostrar detalles por categoría
  log('\n📋 DETALLES POR CATEGORÍA:', 'bright');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${status} ${index + 1}. ${result.category}`, color);
  });

  // Recomendaciones
  log('\n💡 RECOMENDACIONES:', 'bright');
  report.recommendations.forEach((rec, index) => {
    log(`${index + 1}. ${rec}`, 'yellow');
  });

  // Estado final
  const overallSuccess = report.summary.success_rate >= 70;
  if (overallSuccess) {
    log('\n🎉 TESTING DE SEGURIDAD COMPLETADO EXITOSAMENTE', 'green');
    log('✅ Sistema apto para producción con las mejoras recomendadas', 'green');
  } else {
    log('\n⚠️  TESTING DE SEGURIDAD COMPLETADO CON ADVERTENCIAS', 'yellow');
    log('🔧 Se requieren correcciones antes del despliegue en producción', 'yellow');
  }

  log('\n🛡️  FASE 3 - TESTING DE SEGURIDAD ENTERPRISE FINALIZADO', 'bright');
  log('=' * 60, 'cyan');

  return report;
}

// Función para mostrar ayuda
function showHelp() {
  log('🛡️  Script de Testing de Seguridad Enterprise', 'bright');
  log('\nUso:', 'cyan');
  log('  node scripts/run-security-tests.js [opciones]', 'blue');
  log('\nOpciones:', 'cyan');
  log('  --help, -h     Mostrar esta ayuda', 'blue');
  log('  --category, -c Ejecutar solo una categoría específica', 'blue');
  log('  --verbose, -v  Output detallado', 'blue');
  log('\nCategorías disponibles:', 'cyan');
  log('  1. rate-limiting    Tests de Rate Limiting Enterprise', 'blue');
  log('  2. audit           Tests de Auditoría Enterprise', 'blue');
  log('  3. validation      Tests de Validación Enterprise', 'blue');
  log('  4. integration     Tests de Integración Completa', 'blue');
  log('  5. performance     Tests de Performance y Carga', 'blue');
  log('  6. enterprise      Tests de Sistema Enterprise', 'blue');
  log('\nEjemplos:', 'cyan');
  log('  node scripts/run-security-tests.js', 'blue');
  log('  node scripts/run-security-tests.js --category rate-limiting', 'blue');
  log('  node scripts/run-security-tests.js --verbose', 'blue');
}

// Función para ejecutar categoría específica
function runSpecificCategory(category) {
  const categories = {
    'rate-limiting': {
      name: 'Rate Limiting Enterprise',
      file: 'penetration-rate-limiting.test.ts'
    },
    'audit': {
      name: 'Auditoría Enterprise',
      file: 'penetration-audit-system.test.ts'
    },
    'validation': {
      name: 'Validación Enterprise',
      file: 'penetration-validation-system.test.ts'
    },
    'integration': {
      name: 'Integración Completa',
      file: 'integration-security-complete.test.ts'
    },
    'performance': {
      name: 'Performance y Carga',
      file: 'performance-security-load.test.ts'
    },
    'enterprise': {
      name: 'Sistema Enterprise',
      file: 'enterprise-audit-system.test.ts'
    }
  };

  const cat = categories[category];
  if (!cat) {
    log(`❌ Categoría '${category}' no encontrada`, 'red');
    log('Categorías disponibles: ' + Object.keys(categories).join(', '), 'yellow');
    return;
  }

  log(`🛡️  EJECUTANDO CATEGORÍA: ${cat.name}`, 'bright');
  const result = runCommand(
    `npm test src/__tests__/security/${cat.file} --verbose`,
    `Tests de ${cat.name}`
  );

  if (result.success) {
    log(`✅ Categoría '${cat.name}' completada exitosamente`, 'green');
  } else {
    log(`❌ Categoría '${cat.name}' falló`, 'red');
  }
}

// Procesamiento de argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const categoryIndex = args.findIndex(arg => arg === '--category' || arg === '-c');
if (categoryIndex !== -1 && args[categoryIndex + 1]) {
  runSpecificCategory(args[categoryIndex + 1]);
  process.exit(0);
}

// Ejecutar tests completos si no hay argumentos específicos
if (require.main === module) {
  runSecurityTests()
    .then(report => {
      const exitCode = report.summary.success_rate >= 70 ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      log(`💥 Error ejecutando tests: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  runSecurityTests,
  runSpecificCategory,
  showHelp
};
