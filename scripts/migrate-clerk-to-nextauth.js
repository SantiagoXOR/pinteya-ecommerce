#!/usr/bin/env node

/**
 * SCRIPT DE MIGRACIÓN CLERK A NEXTAUTH.JS - PINTEYA E-COMMERCE
 * Migra automáticamente todos los archivos que usan Clerk a NextAuth.js
 */

const fs = require('fs');
const path = require('path');

// Configuración de migración
const MIGRATION_CONFIG = {
  srcDir: './src',
  extensions: ['.tsx', '.ts', '.js', '.jsx'],
  backupDir: './backup-clerk-migration',
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
};

// Estadísticas de migración
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacementsMade: 0,
  errors: 0
};

// Patrones de reemplazo para migrar de Clerk a NextAuth.js
const REPLACEMENTS = [
  {
    description: 'Importar auth de NextAuth en lugar de Clerk',
    pattern: /import\s*\{\s*auth,?\s*currentUser\s*\}\s*from\s*['"]@clerk\/nextjs\/server['"]/g,
    replacement: "import { auth } from '@/auth'"
  },
  {
    description: 'Importar solo auth de Clerk',
    pattern: /import\s*\{\s*auth\s*\}\s*from\s*['"]@clerk\/nextjs\/server['"]/g,
    replacement: "import { auth } from '@/auth'"
  },
  {
    description: 'Importar currentUser de Clerk',
    pattern: /import\s*\{\s*currentUser\s*\}\s*from\s*['"]@clerk\/nextjs\/server['"]/g,
    replacement: "import { auth } from '@/auth'"
  },
  {
    description: 'Reemplazar auth() destructuring',
    pattern: /const\s*\{\s*userId\s*\}\s*=\s*await\s*auth\(\)/g,
    replacement: 'const session = await auth()'
  },
  {
    description: 'Reemplazar currentUser() call',
    pattern: /const\s*user\s*=\s*await\s*currentUser\(\)/g,
    replacement: 'const user = session?.user'
  },
  {
    description: 'Reemplazar verificación de userId',
    pattern: /if\s*\(\s*!userId\s*\)/g,
    replacement: 'if (!session?.user)'
  },
  {
    description: 'Reemplazar verificación de user',
    pattern: /if\s*\(\s*!user\s*\)/g,
    replacement: 'if (!session?.user)'
  },
  {
    description: 'Reemplazar acceso a email de Clerk',
    pattern: /user\.emailAddresses\?\.\[0\]\?\.emailAddress/g,
    replacement: 'session.user.email'
  },
  {
    description: 'Reemplazar return con userId',
    pattern: /return\s*\{\s*user,\s*userId\s*\}/g,
    replacement: 'return { user: session.user, userId: session.user.id }'
  }
];

/**
 * Crear backup del directorio
 */
function createBackup() {
  if (MIGRATION_CONFIG.dryRun) return;
  
  if (!fs.existsSync(MIGRATION_CONFIG.backupDir)) {
    fs.mkdirSync(MIGRATION_CONFIG.backupDir, { recursive: true });
    console.log(`📦 Backup creado en: ${MIGRATION_CONFIG.backupDir}`);
  }
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
        if (!item.startsWith('.') && item !== 'node_modules' && item !== 'backup-clerk-migration') {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (MIGRATION_CONFIG.extensions.includes(ext)) {
          // Solo procesar archivos que contengan referencias a Clerk
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('@clerk/nextjs') || content.includes('currentUser') || content.includes('auth()')) {
            files.push(fullPath);
          }
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
  console.log('🚀 MIGRACIÓN DE CLERK A NEXTAUTH.JS');
  console.log('===================================');
  
  if (MIGRATION_CONFIG.dryRun) {
    console.log('🔍 MODO DRY RUN - No se modificarán archivos');
  }
  
  console.log(`📁 Escaneando directorio: ${MIGRATION_CONFIG.srcDir}`);
  
  // Crear backup
  createBackup();
  
  // Obtener archivos
  const files = getFilesToProcess(MIGRATION_CONFIG.srcDir);
  console.log(`📄 Archivos con Clerk encontrados: ${files.length}`);
  
  if (files.length === 0) {
    console.log('✨ No se encontraron archivos que requieran migración');
    return;
  }
  
  // Procesar archivos
  console.log('\n🔄 Procesando archivos...\n');
  
  for (const file of files) {
    processFile(file);
  }
  
  // Mostrar estadísticas
  console.log('\n📊 ESTADÍSTICAS DE MIGRACIÓN:');
  console.log(`📄 Archivos procesados: ${stats.filesProcessed}`);
  console.log(`🔄 Archivos modificados: ${stats.filesModified}`);
  console.log(`✅ Reemplazos realizados: ${stats.replacementsMade}`);
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
  }
}

// Ejecutar migración
if (require.main === module) {
  main();
}

module.exports = { main, MIGRATION_CONFIG, REPLACEMENTS };
