/**
 * Script para migrar imports de lucide-react a @/lib/optimized-imports
 * 
 * Este script busca todos los archivos que importan directamente de 'lucide-react'
 * y los actualiza para usar '@/lib/optimized-imports' en su lugar.
 * 
 * Uso: node scripts/migrate-lucide-to-tabler.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Directorios a excluir
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  'test-results',
  '__mocks__',
  '__tests__',
  'docs',
]

// Archivos a excluir
const EXCLUDE_FILES = [
  'migrate-lucide-to-tabler.js',
  'package.json',
  'package-lock.json',
]

/**
 * Verifica si un archivo debe ser excluido
 */
function shouldExclude(filePath) {
  const relativePath = path.relative(process.cwd(), filePath)
  
  // Excluir archivos en directorios específicos
  for (const dir of EXCLUDE_DIRS) {
    if (relativePath.includes(path.sep + dir + path.sep) || relativePath.startsWith(dir + path.sep)) {
      return true
    }
  }
  
  // Excluir archivos específicos
  const fileName = path.basename(filePath)
  if (EXCLUDE_FILES.includes(fileName)) {
    return true
  }
  
  // Solo procesar archivos TypeScript/JavaScript
  if (!fileName.endsWith('.ts') && !fileName.endsWith('.tsx') && !fileName.endsWith('.js') && !fileName.endsWith('.jsx')) {
    return true
  }
  
  return false
}

/**
 * Encuentra todos los archivos que importan de lucide-react
 */
function findFilesWithLucideImports(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      if (!shouldExclude(filePath)) {
        findFilesWithLucideImports(filePath, fileList)
      }
    } else if (stat.isFile()) {
      if (!shouldExclude(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          // Buscar imports de lucide-react (pero no de optimized-imports)
          if (content.includes("from 'lucide-react'") || content.includes('from "lucide-react"')) {
            // Verificar que no esté ya usando optimized-imports
            if (!content.includes('@/lib/optimized-imports') && !content.includes("from '@/lib/optimized-imports'")) {
              fileList.push(filePath)
            }
          }
        } catch (err) {
          // Ignorar errores de lectura
        }
      }
    }
  }
  
  return fileList
}

/**
 * Migra un archivo de lucide-react a optimized-imports
 */
function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // Patrón 1: import { ... } from 'lucide-react'
    const pattern1 = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g
    const matches1 = [...content.matchAll(pattern1)]
    
    for (const match of matches1) {
      const imports = match[1].trim()
      // Reemplazar con import desde optimized-imports
      const newImport = `import {${imports}} from '@/lib/optimized-imports'`
      content = content.replace(match[0], newImport)
      modified = true
    }
    
    // Patrón 2: import Icon from 'lucide-react' (imports por defecto, menos común)
    const pattern2 = /import\s+(\w+)\s+from\s*['"]lucide-react['"]/g
    const matches2 = [...content.matchAll(pattern2)]
    
    for (const match of matches2) {
      const iconName = match[1]
      const newImport = `import { ${iconName} } from '@/lib/optimized-imports'`
      content = content.replace(match[0], newImport)
      modified = true
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      return true
    }
    
    return false
  } catch (err) {
    console.error(`Error procesando ${filePath}:`, err.message)
    return false
  }
}

/**
 * Función principal
 */
function main() {
  console.log('🔍 Buscando archivos con imports de lucide-react...\n')
  
  const srcDir = path.join(process.cwd(), 'src')
  const files = findFilesWithLucideImports(srcDir)
  
  console.log(`📦 Encontrados ${files.length} archivos para migrar\n`)
  
  if (files.length === 0) {
    console.log('✅ No hay archivos para migrar')
    return
  }
  
  let migrated = 0
  let errors = 0
  
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file)
    try {
      if (migrateFile(file)) {
        console.log(`✅ Migrado: ${relativePath}`)
        migrated++
      } else {
        console.log(`⚠️  Sin cambios: ${relativePath}`)
      }
    } catch (err) {
      console.error(`❌ Error en ${relativePath}:`, err.message)
      errors++
    }
  }
  
  console.log(`\n📊 Resumen:`)
  console.log(`   ✅ Migrados: ${migrated}`)
  console.log(`   ⚠️  Sin cambios: ${files.length - migrated - errors}`)
  if (errors > 0) {
    console.log(`   ❌ Errores: ${errors}`)
  }
  console.log(`\n✨ Migración completada!`)
}

// Ejecutar
if (require.main === module) {
  main()
}

module.exports = { findFilesWithLucideImports, migrateFile }








