#!/usr/bin/env node

/**
 * SCRIPT DE MIGRACIÓN DE ANALYTICS - PINTEYA E-COMMERCE
 * Migra automáticamente el código de analytics al sistema optimizado
 */

const fs = require('fs');
const path = require('path');

// Configuración de migración
const MIGRATION_CONFIG = {
  srcDir: './src',
  extensions: ['.tsx', '.ts', '.js', '.jsx'],
  backupDir: './backup-analytics-migration',
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
};

// Patrones de reemplazo
const REPLACEMENTS = [
  // Imports
  {
    pattern: /import\s+{\s*analytics\s*}\s+from\s+['"]@\/lib\/analytics['"];?/g,
    replacement: "import { optimizedAnalytics } from '@/lib/analytics-optimized';",
    description: 'Reemplazar import de analytics'
  },
  {
    pattern: /import\s+{\s*trackEvent\s*}\s+from\s+['"]@\/lib\/analytics['"];?/g,
    replacement: "import { trackEventOptimized as trackEvent } from '@/lib/analytics-optimized';",
    description: 'Reemplazar import de trackEvent'
  },
  {
    pattern: /import\s+{\s*AnalyticsProvider\s*}\s+from\s+['"]@\/components\/Analytics\/AnalyticsProvider['"];?/g,
    replacement: "import { OptimizedAnalyticsProvider as AnalyticsProvider } from '@/components/Analytics/OptimizedAnalyticsProvider';",
    description: 'Reemplazar import de AnalyticsProvider'
  },
  
  // Uso de analytics
  {
    pattern: /analytics\.trackEvent\(/g,
    replacement: 'optimizedAnalytics.trackEvent(',
    description: 'Reemplazar llamadas a analytics.trackEvent'
  },
  {
    pattern: /await\s+analytics\.trackEvent\(/g,
    replacement: 'await optimizedAnalytics.trackEvent(',
    description: 'Reemplazar llamadas async a analytics.trackEvent'
  },
  
  // Hooks específicos
  {
    pattern: /useAnalytics\(\)/g,
    replacement: 'useOptimizedAnalytics()',
    description: 'Reemplazar hook useAnalytics'
  },
  
  // Componentes
  {
    pattern: /<AnalyticsProvider/g,
    replacement: '<OptimizedAnalyticsProvider',
    description: 'Reemplazar componente AnalyticsProvider'
  },
  {
    pattern: /<\/AnalyticsProvider>/g,
    replacement: '</OptimizedAnalyticsProvider>',
    description: 'Reemplazar cierre de AnalyticsProvider'
  },
];

// Estadísticas de migración
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacementsMade: 0,
  errors: 0,
};

/**
 * Crear backup de archivos
 */
function createBackup() {
  if (MIGRATION_CONFIG.dryRun) return;
  
  if (!fs.existsSync(MIGRATION_CONFIG.backupDir)) {
    fs.mkdirSync(MIGRATION_CONFIG.backupDir, { recursive: true });
  }
  
  console.log(`📦 Backup creado en: ${MIGRATION_CONFIG.backupDir}`);
}

/**
 * Obtener todos los archivos a procesar
 */
function getFilesToProcess(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Ignorar node_modules, .git, etc.
        if (!item.startsWith('.') && item !== 'node_modules' && item !== 'backup-analytics-migration') {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (MIGRATION_CONFIG.extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

/**
 * Procesar un archivo
 */
function processFile(filePath) {
  try {
    stats.filesProcessed++;
    
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let fileModified = false;
    
    // Aplicar todos los reemplazos
    for (const replacement of REPLACEMENTS) {
      const matches = modifiedContent.match(replacement.pattern);
      if (matches) {
        modifiedContent = modifiedContent.replace(replacement.pattern, replacement.replacement);
        stats.replacementsMade += matches.length;
        fileModified = true;
        
        if (MIGRATION_CONFIG.verbose) {
          console.log(`  ✅ ${replacement.description}: ${matches.length} reemplazos`);
        }
      }
    }
    
    // Guardar archivo modificado
    if (fileModified) {
      stats.filesModified++;
      
      // Crear backup del archivo original
      if (!MIGRATION_CONFIG.dryRun) {
        const backupPath = path.join(
          MIGRATION_CONFIG.backupDir,
          path.relative(MIGRATION_CONFIG.srcDir, filePath)
        );
        const backupDir = path.dirname(backupPath);
        
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        fs.writeFileSync(backupPath, content);
        fs.writeFileSync(filePath, modifiedContent);
      }
      
      console.log(`🔄 Modificado: ${filePath}`);
    }
    
  } catch (error) {
    stats.errors++;
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

/**
 * Función principal
 */
function main() {
  console.log('🚀 MIGRACIÓN DE ANALYTICS A SISTEMA OPTIMIZADO');
  console.log('===============================================');
  
  if (MIGRATION_CONFIG.dryRun) {
    console.log('🔍 MODO DRY RUN - No se modificarán archivos');
  }
  
  console.log(`📁 Escaneando directorio: ${MIGRATION_CONFIG.srcDir}`);
  
  // Crear backup
  createBackup();
  
  // Obtener archivos
  const files = getFilesToProcess(MIGRATION_CONFIG.srcDir);
  console.log(`📄 Archivos encontrados: ${files.length}`);
  
  // Procesar archivos
  console.log('\n🔄 Procesando archivos...\n');
  
  for (const file of files) {
    processFile(file);
  }
  
  // Mostrar estadísticas
  console.log('\n📊 ESTADÍSTICAS DE MIGRACIÓN');
  console.log('============================');
  console.log(`📄 Archivos procesados: ${stats.filesProcessed}`);
  console.log(`✏️  Archivos modificados: ${stats.filesModified}`);
  console.log(`🔄 Reemplazos realizados: ${stats.replacementsMade}`);
  console.log(`❌ Errores: ${stats.errors}`);
  
  if (stats.filesModified > 0) {
    console.log('\n✅ MIGRACIÓN COMPLETADA');
    if (!MIGRATION_CONFIG.dryRun) {
      console.log(`📦 Backup disponible en: ${MIGRATION_CONFIG.backupDir}`);
    }
    console.log('\n🔧 PRÓXIMOS PASOS:');
    console.log('1. Verificar que la aplicación compile correctamente');
    console.log('2. Ejecutar tests para validar funcionalidad');
    console.log('3. Revisar manualmente archivos críticos');
    console.log('4. Eliminar imports no utilizados');
  } else {
    console.log('\n✨ No se encontraron archivos que requieran migración');
  }
}

// Ejecutar migración
if (require.main === module) {
  main();
}

module.exports = { main, MIGRATION_CONFIG, REPLACEMENTS };
