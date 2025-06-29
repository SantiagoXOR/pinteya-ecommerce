#!/usr/bin/env node

/**
 * Script para verificar y activar gradualmente EnhancedProductCard en producción
 * Pinteya E-commerce - Design System Activation
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Verificando Activación de EnhancedProductCard...\n');

const activationStatus = {
  currentUsage: [],
  migrationOpportunities: [],
  productionReady: false,
  testsPassing: false,
  configurationValid: false
};

async function analyzeCurrentUsage() {
  console.log('🔍 1/5 - Analizando uso actual de EnhancedProductCard...');
  
  const usageLocations = [];
  
  // Buscar archivos que usan EnhancedProductCard
  function searchEnhancedProductCard(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        searchEnhancedProductCard(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('EnhancedProductCard')) {
          const lines = content.split('\n');
          const usages = [];
          
          lines.forEach((line, index) => {
            if (line.includes('EnhancedProductCard')) {
              usages.push({
                line: index + 1,
                content: line.trim(),
                context: extractContext(line)
              });
            }
          });
          
          if (usages.length > 0) {
            usageLocations.push({
              file: filePath,
              usages,
              type: determineFileType(filePath)
            });
          }
        }
      }
    }
  }

  searchEnhancedProductCard('src');
  
  activationStatus.currentUsage = usageLocations;
  
  console.log('✅ Análisis de uso actual completado');
  console.log(`📊 EnhancedProductCard encontrado en ${usageLocations.length} archivos`);
  
  // Mostrar resumen
  usageLocations.forEach(location => {
    console.log(`  📁 ${location.file} (${location.type})`);
    location.usages.forEach(usage => {
      console.log(`    📍 Línea ${usage.line}: ${usage.context || 'Uso estándar'}`);
    });
  });
}

function extractContext(line) {
  if (line.includes('context="productDetail"')) return 'Product Detail';
  if (line.includes('context="checkout"')) return 'Checkout';
  if (line.includes('context="demo"')) return 'Demo';
  if (line.includes('context="default"')) return 'Default Grid';
  return null;
}

function determineFileType(filePath) {
  if (filePath.includes('/demo/')) return 'Demo';
  if (filePath.includes('/ShopDetails/')) return 'Product Detail';
  if (filePath.includes('/Checkout/')) return 'Checkout';
  if (filePath.includes('/Shop/')) return 'Shop Grid';
  if (filePath.includes('/stories/')) return 'Storybook';
  if (filePath.includes('/__tests__/')) return 'Test';
  return 'Other';
}

async function findMigrationOpportunities() {
  console.log('🔄 2/5 - Identificando oportunidades de migración...');
  
  const opportunities = [];
  
  // Buscar archivos que usan ProductCard pero no EnhancedProductCard
  function searchProductCard(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        searchProductCard(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Buscar ProductCard pero no EnhancedProductCard
        if (content.includes('ProductCard') && !content.includes('EnhancedProductCard')) {
          const lines = content.split('\n');
          const productCardUsages = [];
          
          lines.forEach((line, index) => {
            if (line.includes('<ProductCard') || line.includes('ProductCard(')) {
              productCardUsages.push({
                line: index + 1,
                content: line.trim()
              });
            }
          });
          
          if (productCardUsages.length > 0) {
            opportunities.push({
              file: filePath,
              usages: productCardUsages,
              type: determineFileType(filePath),
              priority: determineMigrationPriority(filePath, content),
              complexity: determineMigrationComplexity(content)
            });
          }
        }
      }
    }
  }

  searchProductCard('src');
  
  // Filtrar archivos de test y demo
  const filteredOpportunities = opportunities.filter(opp => 
    !opp.file.includes('__tests__') && 
    !opp.file.includes('/demo/') &&
    !opp.file.includes('/stories/')
  );
  
  activationStatus.migrationOpportunities = filteredOpportunities;
  
  console.log('✅ Identificación de oportunidades completada');
  console.log(`🎯 ${filteredOpportunities.length} archivos candidatos para migración`);
  
  // Mostrar oportunidades por prioridad
  const highPriority = filteredOpportunities.filter(opp => opp.priority === 'high');
  const mediumPriority = filteredOpportunities.filter(opp => opp.priority === 'medium');
  
  if (highPriority.length > 0) {
    console.log(`\n🔥 Alta prioridad (${highPriority.length}):`);
    highPriority.forEach(opp => {
      console.log(`  📁 ${opp.file} (${opp.type}) - ${opp.complexity} complejidad`);
    });
  }
  
  if (mediumPriority.length > 0) {
    console.log(`\n🟡 Media prioridad (${mediumPriority.length}):`);
    mediumPriority.forEach(opp => {
      console.log(`  📁 ${opp.file} (${opp.type}) - ${opp.complexity} complejidad`);
    });
  }
}

function determineMigrationPriority(filePath, content) {
  // Alta prioridad: páginas principales de e-commerce
  if (filePath.includes('/Shop/') || filePath.includes('/ShopDetails/') || filePath.includes('/Checkout/')) {
    return 'high';
  }
  
  // Media prioridad: componentes comunes
  if (filePath.includes('/Common/') || filePath.includes('/Home/')) {
    return 'medium';
  }
  
  return 'low';
}

function determineMigrationComplexity(content) {
  let complexity = 0;
  
  // Factores que aumentan complejidad
  if (content.includes('useNewComponents')) complexity += 1;
  if (content.includes('showInstallments')) complexity += 1;
  if (content.includes('customInstallments')) complexity += 1;
  if (content.includes('productData')) complexity += 1;
  if (content.includes('context=')) complexity += 1;
  
  if (complexity === 0) return 'baja';
  if (complexity <= 2) return 'media';
  return 'alta';
}

async function verifyConfiguration() {
  console.log('⚙️ 3/5 - Verificando configuración del Design System...');
  
  try {
    const configPath = 'src/lib/design-system-config.ts';
    
    if (!fs.existsSync(configPath)) {
      console.log('❌ Archivo de configuración no encontrado');
      return;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Verificar configuraciones clave
    const checks = {
      enableNewComponents: configContent.includes('enableNewComponents: true'),
      useNewComponentsByDefault: configContent.includes('useNewComponentsByDefault: true'),
      contextConfigs: configContent.includes('contextConfigs'),
      productDetailConfig: configContent.includes('productDetail:'),
      checkoutConfig: configContent.includes('checkout:')
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    activationStatus.configurationValid = passedChecks === totalChecks;
    
    console.log('✅ Verificación de configuración completada');
    console.log(`📊 Configuración: ${passedChecks}/${totalChecks} checks pasados`);
    
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    });

  } catch (error) {
    console.error('❌ Error verificando configuración:', error.message);
  }
}

async function runTests() {
  console.log('🧪 4/5 - Ejecutando tests de EnhancedProductCard...');
  
  try {
    const { execSync } = require('child_process');
    
    // Ejecutar tests específicos de ProductCard
    const testOutput = execSync('npm test -- --testPathPattern=product-card --passWithNoTests', {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    activationStatus.testsPassing = !testOutput.includes('FAIL') && !testOutput.includes('failed');
    
    console.log('✅ Tests ejecutados');
    console.log(`📊 Estado: ${activationStatus.testsPassing ? 'Pasando' : 'Fallando'}`);
    
    if (!activationStatus.testsPassing) {
      console.log('⚠️ Algunos tests están fallando. Revisar antes de activar en producción.');
    }

  } catch (error) {
    console.log('⚠️ Error ejecutando tests:', error.message);
    activationStatus.testsPassing = false;
  }
}

async function generateActivationPlan() {
  console.log('📋 5/5 - Generando plan de activación...');
  
  // Determinar si está listo para producción
  const readinessChecks = {
    hasCurrentUsage: activationStatus.currentUsage.length > 0,
    configurationValid: activationStatus.configurationValid,
    testsPassing: activationStatus.testsPassing,
    hasMigrationPath: activationStatus.migrationOpportunities.length > 0
  };
  
  const readinessScore = Object.values(readinessChecks).filter(Boolean).length;
  activationStatus.productionReady = readinessScore >= 3;
  
  const plan = {
    status: activationStatus.productionReady ? 'READY' : 'NEEDS_WORK',
    readinessScore: `${readinessScore}/4`,
    currentUsage: activationStatus.currentUsage.length,
    migrationOpportunities: activationStatus.migrationOpportunities.length,
    nextSteps: generateNextSteps(),
    timeline: generateTimeline()
  };
  
  // Generar reporte
  const report = generateActivationReport(plan);
  fs.writeFileSync('ENHANCED_PRODUCT_CARD_ACTIVATION.md', report);
  
  console.log('\n📊 Resumen de Activación:');
  console.log(`  🎯 Estado: ${plan.status}`);
  console.log(`  📈 Preparación: ${plan.readinessScore}`);
  console.log(`  📍 Uso actual: ${plan.currentUsage} archivos`);
  console.log(`  🔄 Oportunidades: ${plan.migrationOpportunities} archivos`);
  
  console.log('\n📁 Reporte generado: ENHANCED_PRODUCT_CARD_ACTIVATION.md');
}

function generateNextSteps() {
  const steps = [];
  
  if (!activationStatus.configurationValid) {
    steps.push('Corregir configuración del Design System');
  }
  
  if (!activationStatus.testsPassing) {
    steps.push('Corregir tests fallidos de ProductCard');
  }
  
  if (activationStatus.migrationOpportunities.length > 0) {
    const highPriority = activationStatus.migrationOpportunities.filter(opp => opp.priority === 'high');
    if (highPriority.length > 0) {
      steps.push(`Migrar ${highPriority.length} archivos de alta prioridad`);
    }
  }
  
  if (activationStatus.productionReady) {
    steps.push('Activar en producción gradualmente');
    steps.push('Monitorear métricas de performance');
    steps.push('Recopilar feedback de usuarios');
  }
  
  return steps;
}

function generateTimeline() {
  if (!activationStatus.productionReady) {
    return 'Pendiente de completar preparación';
  }
  
  return [
    'Semana 1: Migración de archivos alta prioridad',
    'Semana 2: Testing en staging',
    'Semana 3: Deploy gradual a producción',
    'Semana 4: Monitoreo y optimización'
  ];
}

function generateActivationReport(plan) {
  return `# 🚀 Enhanced ProductCard Activation Report

**Fecha:** ${new Date().toLocaleString()}  
**Estado:** ${plan.status}  
**Preparación:** ${plan.readinessScore}

## 📊 Resumen Ejecutivo

El EnhancedProductCard está ${activationStatus.productionReady ? '✅ LISTO' : '⏳ EN PREPARACIÓN'} para activación en producción.

### Estado Actual
- **Uso actual**: ${plan.currentUsage} archivos implementados
- **Oportunidades de migración**: ${plan.migrationOpportunidades} archivos
- **Configuración**: ${activationStatus.configurationValid ? '✅ Válida' : '❌ Requiere corrección'}
- **Tests**: ${activationStatus.testsPassing ? '✅ Pasando' : '❌ Fallando'}

## 📍 Uso Actual

${activationStatus.currentUsage.map(usage => `
### ${usage.file}
- **Tipo**: ${usage.type}
- **Usos**: ${usage.usages.length}
${usage.usages.map(u => `  - Línea ${u.line}: ${u.context || 'Uso estándar'}`).join('\n')}
`).join('\n')}

## 🔄 Oportunidades de Migración

### Alta Prioridad
${activationStatus.migrationOpportunities.filter(opp => opp.priority === 'high').map(opp => `
- **${opp.file}** (${opp.type})
  - Complejidad: ${opp.complexity}
  - Usos: ${opp.usages.length}
`).join('\n')}

### Media Prioridad
${activationStatus.migrationOpportunities.filter(opp => opp.priority === 'medium').map(opp => `
- **${opp.file}** (${opp.type})
  - Complejidad: ${opp.complexity}
  - Usos: ${opp.usages.length}
`).join('\n')}

## 🎯 Próximos Pasos

${plan.nextSteps.map(step => `- ${step}`).join('\n')}

## 📅 Timeline

${Array.isArray(plan.timeline) ? plan.timeline.map(item => `- ${item}`).join('\n') : plan.timeline}

## 🧪 Verificación

\`\`\`bash
# Ejecutar tests
npm test -- --testPathPattern=product-card

# Verificar configuración
cat src/lib/design-system-config.ts

# Verificar uso actual
grep -r "EnhancedProductCard" src/
\`\`\`

---

**Recomendación**: ${activationStatus.productionReady ? 
  '🚀 Proceder con activación gradual en producción' : 
  '⏳ Completar preparación antes de activar en producción'}
`;
}

// Ejecutar análisis
async function main() {
  try {
    await analyzeCurrentUsage();
    await findMigrationOpportunities();
    await verifyConfiguration();
    await runTests();
    await generateActivationPlan();
    
    console.log('\n🎯 ¡Análisis de activación completado!');
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
