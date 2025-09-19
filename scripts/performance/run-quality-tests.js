#!/usr/bin/env node

/**
 * Script para ejecutar todos los tests de calidad del Design System
 * Pinteya E-commerce - Testing Visual Regression & Performance
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Ejecutando Suite Completa de Tests de Calidad\n');
console.log('📋 Tests incluidos:');
console.log('  🔧 Unit Tests');
console.log('  ♿ Accessibility Tests');
console.log('  🎨 Visual Regression Tests');
console.log('  ⚡ Performance Tests');
console.log('  📊 Coverage Report\n');

const REPORTS_DIR = 'quality-reports';
const results = {
  unitTests: null,
  accessibility: null,
  visualRegression: null,
  performance: null,
  coverage: null,
  timestamp: new Date().toISOString()
};

async function runCommand(command, description, options = {}) {
  console.log(`🚀 ${description}...`);
  
  try {
    const output = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      ...options
    });
    
    console.log(`✅ ${description} completado`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} falló`);
    console.log(`Error: ${error.message}`);
    return { success: false, error: error.message, output: error.stdout };
  }
}

async function checkStorybookRunning() {
  try {
    const response = await fetch('http://localhost:6006');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function startStorybook() {
  console.log('🚀 Iniciando Storybook...');
  
  return new Promise((resolve, reject) => {
    const storybookProcess = spawn('npm', ['run', 'storybook'], {
      stdio: 'pipe',
      shell: true
    });

    let started = false;
    
    storybookProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') && !started) {
        started = true;
        console.log('✅ Storybook iniciado');
        setTimeout(() => resolve(storybookProcess), 3000); // Esperar 3s para que cargue completamente
      }
    });

    storybookProcess.stderr.on('data', (data) => {
      console.error(`Storybook error: ${data}`);
    });

    storybookProcess.on('error', (error) => {
      reject(error);
    });

    // Timeout de 60 segundos
    setTimeout(() => {
      if (!started) {
        storybookProcess.kill();
        reject(new Error('Timeout iniciando Storybook'));
      }
    }, 60000);
  });
}

async function runQualityTests() {
  // Crear directorio de reportes
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  let storybookProcess = null;
  
  try {
    // 1. Unit Tests
    console.log('\n📋 1/5 - Ejecutando Unit Tests...');
    results.unitTests = await runCommand('npm test -- --passWithNoTests --coverage=false', 'Unit Tests');

    // 2. Coverage Report
    console.log('\n📊 2/5 - Generando Coverage Report...');
    results.coverage = await runCommand('npm run test:coverage -- --passWithNoTests', 'Coverage Report');

    // 3. Verificar si Storybook está corriendo
    const isStorybookRunning = await checkStorybookRunning();
    
    if (!isStorybookRunning) {
      console.log('\n🚀 Storybook no está corriendo, iniciando...');
      storybookProcess = await startStorybook();
    }

    // 4. Accessibility Tests
    console.log('\n♿ 3/5 - Ejecutando Accessibility Tests...');
    results.accessibility = await runCommand('npm run test:a11y', 'Accessibility Tests');

    // 5. Performance Tests
    console.log('\n⚡ 4/5 - Ejecutando Performance Tests...');
    results.performance = await runCommand('npm run test:performance', 'Performance Tests');

    // 6. Visual Regression Tests (solo si hay token de Chromatic)
    console.log('\n🎨 5/5 - Ejecutando Visual Regression Tests...');
    const hasChromatic = process.env.CHROMATIC_PROJECT_TOKEN || fs.existsSync('.env.local');
    
    if (hasChromatic) {
      results.visualRegression = await runCommand('npm run test:visual', 'Visual Regression Tests');
    } else {
      console.log('⚠️  Chromatic token no configurado, saltando visual regression tests');
      results.visualRegression = { success: false, error: 'Token no configurado' };
    }

  } catch (error) {
    console.error('❌ Error ejecutando tests:', error);
  } finally {
    // Cerrar Storybook si lo iniciamos nosotros
    if (storybookProcess) {
      console.log('\n🛑 Cerrando Storybook...');
      storybookProcess.kill();
    }
  }

  // Generar reporte consolidado
  await generateConsolidatedReport();
}

async function generateConsolidatedReport() {
  console.log('\n📋 Generando reporte consolidado...');

  const report = {
    summary: {
      timestamp: results.timestamp,
      totalTests: 5,
      passed: Object.values(results).filter(r => r && r.success).length,
      failed: Object.values(results).filter(r => r && !r.success).length,
      skipped: Object.values(results).filter(r => !r).length
    },
    results
  };

  // Guardar reporte JSON
  const jsonPath = path.join(REPORTS_DIR, 'quality-summary.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Generar reporte Markdown
  const markdownReport = generateMarkdownReport(report);
  const mdPath = path.join(REPORTS_DIR, 'quality-summary.md');
  fs.writeFileSync(mdPath, markdownReport);

  // Mostrar resumen en consola
  console.log('\n📊 Resumen de Calidad:');
  console.log(`  ✅ Tests pasados: ${report.summary.passed}/${report.summary.totalTests}`);
  console.log(`  ❌ Tests fallidos: ${report.summary.failed}/${report.summary.totalTests}`);
  console.log(`  ⏭️  Tests saltados: ${report.summary.skipped}/${report.summary.totalTests}`);
  
  console.log('\n📁 Reportes detallados:');
  console.log(`  📄 JSON: ${jsonPath}`);
  console.log(`  📝 Markdown: ${mdPath}`);
  
  if (fs.existsSync('coverage')) {
    console.log(`  📊 Coverage: coverage/lcov-report/index.html`);
  }
  
  if (fs.existsSync('lighthouse-reports')) {
    console.log(`  ⚡ Performance: lighthouse-reports/lighthouse-summary.md`);
  }

  console.log('\n🎯 ¡Suite de tests de calidad completada!');
}

function generateMarkdownReport(report) {
  const { summary, results } = report;
  
  return `# 🧪 Quality Tests Report
## Pinteya E-commerce Design System

**Fecha:** ${new Date(summary.timestamp).toLocaleString()}  
**Tests ejecutados:** ${summary.totalTests}  
**Resultado:** ${summary.passed}/${summary.totalTests} pasados

## 📊 Resumen

| Test Suite | Estado | Resultado |
|------------|--------|-----------|
| Unit Tests | ${results.unitTests?.success ? '✅' : '❌'} | ${results.unitTests?.success ? 'Pasado' : 'Fallido'} |
| Coverage Report | ${results.coverage?.success ? '✅' : '❌'} | ${results.coverage?.success ? 'Generado' : 'Error'} |
| Accessibility Tests | ${results.accessibility?.success ? '✅' : '❌'} | ${results.accessibility?.success ? 'Pasado' : 'Fallido'} |
| Performance Tests | ${results.performance?.success ? '✅' : '❌'} | ${results.performance?.success ? 'Pasado' : 'Fallido'} |
| Visual Regression | ${results.visualRegression?.success ? '✅' : '❌'} | ${results.visualRegression?.success ? 'Pasado' : 'Fallido/Saltado'} |

## 📋 Detalles

### 🔧 Unit Tests
${results.unitTests?.success ? '✅ Todos los tests unitarios pasaron correctamente' : '❌ Algunos tests unitarios fallaron'}

### ♿ Accessibility Tests
${results.accessibility?.success ? '✅ Tests de accesibilidad pasaron' : '❌ Se encontraron problemas de accesibilidad'}

### ⚡ Performance Tests
${results.performance?.success ? '✅ Tests de performance completados' : '❌ Tests de performance fallaron'}

### 🎨 Visual Regression Tests
${results.visualRegression?.success ? '✅ No se detectaron regresiones visuales' : '❌ Tests visuales fallaron o no configurados'}

## 🎯 Próximos Pasos

${generateRecommendations(report)}

---
*Reporte generado automáticamente por el sistema de calidad de Pinteya Design System*
`;
}

function generateRecommendations(report) {
  const recommendations = [];
  
  if (!report.results.unitTests?.success) {
    recommendations.push('- 🔧 **Unit Tests**: Revisar y corregir tests unitarios fallidos');
  }
  
  if (!report.results.accessibility?.success) {
    recommendations.push('- ♿ **Accessibility**: Corregir problemas de accesibilidad detectados');
  }
  
  if (!report.results.performance?.success) {
    recommendations.push('- ⚡ **Performance**: Optimizar componentes con problemas de rendimiento');
  }
  
  if (!report.results.visualRegression?.success) {
    recommendations.push('- 🎨 **Visual Regression**: Configurar Chromatic o revisar cambios visuales');
  }
  
  if (report.summary.passed === report.summary.totalTests) {
    recommendations.push('🎉 **¡Excelente!** Todos los tests de calidad están pasando correctamente');
  }
  
  return recommendations.length > 0 ? recommendations.join('\n') : '';
}

// Ejecutar tests
if (require.main === module) {
  runQualityTests().catch(console.error);
}

module.exports = { runQualityTests };
