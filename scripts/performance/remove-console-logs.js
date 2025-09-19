#!/usr/bin/env node

/**
 * Script para eliminar console.log de producción
 * Mantiene solo logging estructurado y console.error/warn necesarios
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Eliminando console.log de producción...\n');

// Configuración
const config = {
  srcDir: path.join(process.cwd(), 'src'),
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludeDirs: ['__tests__', 'stories', 'node_modules', '.next'],
  excludeFiles: ['.test.', '.spec.', '.stories.'],
  // Patrones a eliminar
  removePatterns: [
    /console\.log\([^)]*\);?\s*$/gm,
    /console\.info\([^)]*\);?\s*$/gm,
    /console\.debug\([^)]*\);?\s*$/gm,
  ],
  // Patrones a mantener (logging estructurado)
  keepPatterns: [
    /console\.error\(/,
    /console\.warn\(/,
    /logger\./,
    /log\./,
    /Logger\./,
  ],
  // Archivos que requieren logging especial
  specialFiles: [
    'middleware.ts',
    'logger.ts',
    'monitoring.ts',
    'analytics.ts',
  ]
};

// Resultados
const results = {
  filesProcessed: 0,
  filesModified: 0,
  logsRemoved: 0,
  logsKept: 0,
  errors: []
};

/**
 * Verifica si un archivo debe ser excluido
 */
function shouldExcludeFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Excluir archivos de test
  if (config.excludeFiles.some(pattern => fileName.includes(pattern))) {
    return true;
  }
  
  // Excluir directorios específicos
  if (config.excludeDirs.some(dir => filePath.includes(dir))) {
    return true;
  }
  
  return false;
}

/**
 * Verifica si un archivo requiere logging especial
 */
function isSpecialFile(filePath) {
  const fileName = path.basename(filePath);
  return config.specialFiles.some(special => fileName.includes(special));
}

/**
 * Procesa un archivo para eliminar console.log
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modifiedContent = content;
    let logsRemovedInFile = 0;
    let logsKeptInFile = 0;
    
    results.filesProcessed++;
    
    // Si es un archivo especial, ser más conservador
    if (isSpecialFile(filePath)) {
      console.log(`⚠️  Archivo especial detectado: ${path.relative(process.cwd(), filePath)}`);
      return;
    }
    
    // Buscar y analizar console statements
    const consoleStatements = content.match(/console\.[a-zA-Z]+\([^)]*\)/g) || [];
    
    for (const statement of consoleStatements) {
      // Verificar si debe mantenerse
      const shouldKeep = config.keepPatterns.some(pattern => pattern.test(statement));
      
      if (shouldKeep) {
        logsKeptInFile++;
        continue;
      }
      
      // Verificar si debe eliminarse
      const shouldRemove = config.removePatterns.some(pattern => pattern.test(statement));
      
      if (shouldRemove) {
        // Eliminar la línea completa que contiene el console.log
        const lines = modifiedContent.split('\n');
        const newLines = lines.filter(line => {
          const trimmedLine = line.trim();
          return !config.removePatterns.some(pattern => pattern.test(trimmedLine));
        });
        
        modifiedContent = newLines.join('\n');
        logsRemovedInFile++;
      }
    }
    
    // Si hubo cambios, escribir el archivo
    if (modifiedContent !== originalContent) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      results.filesModified++;
      results.logsRemoved += logsRemovedInFile;
      results.logsKept += logsKeptInFile;
      
      console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
      console.log(`   📝 Logs eliminados: ${logsRemovedInFile}`);
      console.log(`   📋 Logs mantenidos: ${logsKeptInFile}\n`);
    } else if (consoleStatements.length > 0) {
      results.logsKept += logsKeptInFile;
      console.log(`ℹ️  ${path.relative(process.cwd(), filePath)} - Solo logs estructurados`);
    }
    
  } catch (error) {
    results.errors.push({
      file: filePath,
      error: error.message
    });
    console.error(`❌ Error procesando ${filePath}: ${error.message}`);
  }
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
        if (!config.excludeDirs.includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (config.extensions.includes(ext) && !shouldExcludeFile(fullPath)) {
          processFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Error escaneando directorio ${dir}: ${error.message}`);
  }
}

/**
 * Genera reporte final
 */
function generateReport() {
  console.log('\n📊 REPORTE DE LIMPIEZA DE CONSOLE.LOG\n');
  console.log('='.repeat(50));
  
  console.log(`📁 Archivos procesados: ${results.filesProcessed}`);
  console.log(`✏️  Archivos modificados: ${results.filesModified}`);
  console.log(`🗑️  Console.log eliminados: ${results.logsRemoved}`);
  console.log(`📋 Logs estructurados mantenidos: ${results.logsKept}`);
  console.log(`❌ Errores: ${results.errors.length}\n`);
  
  if (results.errors.length > 0) {
    console.log('❌ ERRORES ENCONTRADOS:\n');
    results.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${path.relative(process.cwd(), err.file)}`);
      console.log(`   Error: ${err.error}\n`);
    });
  }
  
  // Recomendaciones
  console.log('💡 RECOMENDACIONES:\n');
  console.log('1. ✅ Usar logger estructurado en lugar de console.log');
  console.log('2. ✅ Mantener console.error y console.warn para errores críticos');
  console.log('3. ✅ Usar variables de entorno para debugging en desarrollo');
  console.log('4. ✅ Implementar logging centralizado para producción');
  console.log('5. ✅ Usar herramientas como Sentry para monitoreo de errores\n');
  
  // Comandos útiles
  console.log('🛠️  COMANDOS ÚTILES:\n');
  console.log('npm run lint              # Verificar reglas ESLint');
  console.log('npm run build             # Build sin console.log');
  console.log('npm run test              # Ejecutar tests');
  console.log('npm run remove-console    # Ejecutar este script\n');
  
  // Resultado final
  if (results.logsRemoved > 0) {
    console.log(`🎉 ¡Limpieza completada! Se eliminaron ${results.logsRemoved} console.log de producción.`);
  } else {
    console.log('✨ ¡El código ya está limpio! No se encontraron console.log innecesarios.');
  }
}

/**
 * Función principal
 */
function main() {
  console.log('🚀 Iniciando limpieza de console.log...\n');
  
  // Verificar que existe el directorio src
  if (!fs.existsSync(config.srcDir)) {
    console.error('❌ No se encontró el directorio src/');
    process.exit(1);
  }
  
  // Crear backup de archivos críticos (opcional)
  console.log('📋 Archivos que serán procesados:');
  console.log('- APIs: src/app/api/**/*');
  console.log('- Componentes: src/components/**/*');
  console.log('- Hooks: src/hooks/**/*');
  console.log('- Utilidades: src/utils/**/*');
  console.log('- Analytics: src/analytics/**/*\n');
  
  console.log('⚠️  NOTA: Se mantendrán console.error y console.warn para errores críticos\n');
  
  // Escanear archivos
  scanDirectory(config.srcDir);
  
  // Generar reporte
  generateReport();
  
  console.log('\n✅ Proceso completado!\n');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  processFile,
  scanDirectory,
  generateReport,
  shouldExcludeFile,
  isSpecialFile
};
