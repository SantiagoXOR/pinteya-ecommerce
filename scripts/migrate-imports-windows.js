const fs = require('fs')
const path = require('path')

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      // Excluir directorios
      const dirName = path.basename(filePath)
      if (!['node_modules', '.next', '.git', 'dist', 'build', 'coverage', 'test-results', '__mocks__', '__tests__', 'docs'].includes(dirName)) {
        findFiles(filePath, fileList)
      }
    } else if (stat.isFile()) {
      // Solo archivos TypeScript/JavaScript
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        // Excluir archivos de test y el mismo script
        if (!file.includes('.test.') && !file.includes('.spec.') && file !== 'migrate-imports-windows.js') {
          try {
            const content = fs.readFileSync(filePath, 'utf8')
            // Buscar imports de lucide-react pero no de optimized-imports
            if ((content.includes("from 'lucide-react'") || content.includes('from "lucide-react"')) 
                && !content.includes('@/lib/optimized-imports') 
                && !content.includes("from '@/lib/optimized-imports'")) {
              fileList.push(filePath)
            }
          } catch (err) {
            // Ignorar errores
          }
        }
      }
    }
  }
  
  return fileList
}

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content
    
    // Reemplazar todos los imports de lucide-react
    content = content.replace(/from\s+['"]lucide-react['"]/g, "from '@/lib/optimized-imports'")
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      return true
    }
    return false
  } catch (err) {
    console.error(`Error en ${filePath}:`, err.message)
    return false
  }
}

// Ejecutar
const srcDir = path.join(process.cwd(), 'src')
console.log('🔍 Buscando archivos...\n')

const files = findFiles(srcDir)
console.log(`📦 Encontrados ${files.length} archivos para migrar\n`)

if (files.length === 0) {
  console.log('✅ No hay archivos para migrar')
  process.exit(0)
}

let migrated = 0
let errors = 0

for (const file of files) {
  const relativePath = path.relative(process.cwd(), file)
  try {
    if (migrateFile(file)) {
      console.log(`✅ ${relativePath}`)
      migrated++
    }
  } catch (err) {
    console.error(`❌ ${relativePath}:`, err.message)
    errors++
  }
}

console.log(`\n📊 Resumen:`)
console.log(`   ✅ Migrados: ${migrated}`)
if (errors > 0) {
  console.log(`   ❌ Errores: ${errors}`)
}
console.log(`\n✨ Migración completada!`)

