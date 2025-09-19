#!/usr/bin/env node

/**
 * Script para optimizar imports y mejorar tree-shaking
 * Analiza el proyecto y sugiere optimizaciones para reducir bundle size
 */

const fs = require('fs');
const path = require('path');

console.log('🌳 Optimizando imports para mejor tree-shaking...\n');

// Configuración
const analysisConfig = {
  srcDir: path.join(process.cwd(), 'src'),
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludeDirs: ['node_modules', '.next', 'dist', 'build', '__tests__', 'stories'],
  optimizableLibraries: {
    'lucide-react': {
      pattern: /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]lucide-react['"]/g,
      suggestion: 'Usar imports específicos desde @/lib/optimized-imports'
    },
    'date-fns': {
      pattern: /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]date-fns['"]/g,
      suggestion: 'Usar imports específicos desde @/lib/optimized-imports'
    },
    'framer-motion': {
      pattern: /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]framer-motion['"]/g,
      suggestion: 'Usar imports específicos desde @/lib/optimized-imports'
    },
    '@radix-ui': {
      pattern: /import\s*\*\s*as\s*\w+\s*from\s*['"]@radix-ui\/[^'"]+['"]/g,
      suggestion: 'Evitar import * as, usar imports específicos'
    }
  }
};

// Resultados del análisis
const results = {
  filesAnalyzed: 0,
  issuesFound: 0,
  optimizations: [],
  heavyImports: [],
  suggestions: []
};

/**
 * Analiza un archivo en busca de imports optimizables
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    results.filesAnalyzed++;
    
    // Buscar imports problemáticos
    for (const [library, libConfig] of Object.entries(analysisConfig.optimizableLibraries)) {
      const matches = content.match(libConfig.pattern);
      if (matches) {
        results.issuesFound++;
        results.optimizations.push({
          file: relativePath,
          library,
          matches: matches.length,
          suggestion: libConfig.suggestion,
          lines: getLineNumbers(content, libConfig.pattern)
        });
      }
    }
    
    // Buscar imports pesados (más de 10 imports de una librería)
    const importLines = content.match(/import\s*\{[^}]{100,}\}\s*from/g);
    if (importLines && importLines.length > 0) {
      results.heavyImports.push({
        file: relativePath,
        count: importLines.length,
        suggestion: 'Considerar dividir imports o usar barrel exports'
      });
    }
    
    // Buscar imports de toda la librería
    const wildcardImports = content.match(/import\s*\*\s*as\s*\w+\s*from\s*['"][^'"]+['"]/g);
    if (wildcardImports) {
      wildcardImports.forEach(imp => {
        if (!imp.includes('@radix-ui') && !imp.includes('React')) {
          results.suggestions.push({
            file: relativePath,
            import: imp,
            suggestion: 'Evitar import * as, usar imports específicos'
          });
        }
      });
    }
    
  } catch (error) {
    console.warn(`⚠️  Error analizando ${filePath}: ${error.message}`);
  }
}

/**
 * Obtiene los números de línea donde aparece un patrón
 */
function getLineNumbers(content, pattern) {
  const lines = content.split('\n');
  const lineNumbers = [];
  
  lines.forEach((line, index) => {
    if (pattern.test(line)) {
      lineNumbers.push(index + 1);
    }
  });
  
  return lineNumbers;
}

/**
 * Escanea recursivamente un directorio
 */
function scanDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!analysisConfig.excludeDirs.includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (analysisConfig.extensions.includes(ext)) {
          analyzeFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Error escaneando directorio ${dir}: ${error.message}`);
  }
}

/**
 * Genera reporte de optimizaciones
 */
function generateReport() {
  console.log('📊 REPORTE DE OPTIMIZACIÓN DE IMPORTS\n');
  console.log('='.repeat(50));
  
  console.log(`📁 Archivos analizados: ${results.filesAnalyzed}`);
  console.log(`⚠️  Issues encontrados: ${results.issuesFound}`);
  console.log(`🔧 Optimizaciones sugeridas: ${results.optimizations.length}`);
  console.log(`📦 Imports pesados: ${results.heavyImports.length}`);
  console.log(`💡 Sugerencias adicionales: ${results.suggestions.length}\n`);
  
  if (results.optimizations.length > 0) {
    console.log('🔧 OPTIMIZACIONES RECOMENDADAS:\n');
    results.optimizations.forEach((opt, index) => {
      console.log(`${index + 1}. ${opt.file}`);
      console.log(`   📚 Librería: ${opt.library}`);
      console.log(`   🔢 Matches: ${opt.matches}`);
      console.log(`   📍 Líneas: ${opt.lines.join(', ')}`);
      console.log(`   💡 Sugerencia: ${opt.suggestion}\n`);
    });
  }
  
  if (results.heavyImports.length > 0) {
    console.log('📦 IMPORTS PESADOS:\n');
    results.heavyImports.forEach((heavy, index) => {
      console.log(`${index + 1}. ${heavy.file}`);
      console.log(`   🔢 Imports largos: ${heavy.count}`);
      console.log(`   💡 Sugerencia: ${heavy.suggestion}\n`);
    });
  }
  
  if (results.suggestions.length > 0) {
    console.log('💡 SUGERENCIAS ADICIONALES:\n');
    results.suggestions.slice(0, 10).forEach((sug, index) => {
      console.log(`${index + 1}. ${sug.file}`);
      console.log(`   📝 Import: ${sug.import.trim()}`);
      console.log(`   💡 Sugerencia: ${sug.suggestion}\n`);
    });
    
    if (results.suggestions.length > 10) {
      console.log(`   ... y ${results.suggestions.length - 10} más\n`);
    }
  }
  
  // Recomendaciones generales
  console.log('🎯 RECOMENDACIONES GENERALES:\n');
  console.log('1. ✅ Usar el archivo @/lib/optimized-imports para imports comunes');
  console.log('2. ✅ Evitar import * as excepto para React y Radix UI');
  console.log('3. ✅ Usar lazy loading para componentes pesados');
  console.log('4. ✅ Configurar optimizePackageImports en next.config.js');
  console.log('5. ✅ Usar dynamic imports para código que no es crítico');
  console.log('6. ✅ Implementar code splitting por rutas');
  console.log('7. ✅ Usar React.memo para componentes puros');
  console.log('8. ✅ Implementar preloading para módulos críticos\n');
  
  // Comandos útiles
  console.log('🛠️  COMANDOS ÚTILES:\n');
  console.log('npm run analyze-bundle     # Analizar tamaño del bundle');
  console.log('npm run build              # Build con optimizaciones');
  console.log('ANALYZE=true npm run build # Build con bundle analyzer');
  console.log('npm run test:performance   # Test de performance\n');
  
  // Métricas de éxito
  const score = calculateOptimizationScore();
  console.log(`📈 PUNTUACIÓN DE OPTIMIZACIÓN: ${score}/100`);
  
  if (score >= 90) {
    console.log('🎉 ¡Excelente! El proyecto está muy bien optimizado.');
  } else if (score >= 70) {
    console.log('👍 Bien optimizado, pero hay margen de mejora.');
  } else if (score >= 50) {
    console.log('⚠️  Optimización moderada, se recomienda mejorar.');
  } else {
    console.log('🚨 Necesita optimización urgente para mejor performance.');
  }
}

/**
 * Calcula una puntuación de optimización
 */
function calculateOptimizationScore() {
  let score = 100;
  
  // Penalizar por issues encontrados
  score -= Math.min(results.issuesFound * 5, 30);
  
  // Penalizar por imports pesados
  score -= Math.min(results.heavyImports.length * 3, 20);
  
  // Penalizar por sugerencias no implementadas
  score -= Math.min(results.suggestions.length * 2, 25);
  
  return Math.max(score, 0);
}

/**
 * Función principal
 */
function main() {
  console.log('🚀 Iniciando análisis de optimización de imports...\n');
  
  // Verificar que existe el directorio src
  if (!fs.existsSync(analysisConfig.srcDir)) {
    console.error('❌ No se encontró el directorio src/');
    process.exit(1);
  }

  // Escanear archivos
  scanDirectory(analysisConfig.srcDir);
  
  // Generar reporte
  generateReport();
  
  console.log('✅ Análisis completado!\n');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  analyzeFile,
  scanDirectory,
  generateReport,
  calculateOptimizationScore
};
