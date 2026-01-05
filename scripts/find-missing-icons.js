const fs = require('fs')
const path = require('path')

// Leer optimized-imports.ts para obtener los iconos exportados
const optimizedImportsPath = path.join(process.cwd(), 'src/lib/optimized-imports.ts')
const optimizedImportsContent = fs.readFileSync(optimizedImportsPath, 'utf8')

// Extraer todos los exports (buscar patrones como "IconX as X")
const exportMatches = [...optimizedImportsContent.matchAll(/Icon\w+\s+as\s+(\w+)/g)]
const exportedIcons = new Set(exportMatches.map(m => m[1]))

console.log(`Iconos exportados: ${exportedIcons.size}\n`)

// Buscar todos los archivos que importan desde optimized-imports
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      const dirName = path.basename(filePath)
      if (!['node_modules', '.next', '.git', 'dist', 'build', 'coverage', 'test-results', '__mocks__', '__tests__', 'docs'].includes(dirName)) {
        findFiles(filePath, fileList)
      }
    } else if (stat.isFile()) {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (!file.includes('.test.') && !file.includes('.spec.')) {
          try {
            const content = fs.readFileSync(filePath, 'utf8')
            if (content.includes("@/lib/optimized-imports") || content.includes("from '@/lib/optimized-imports'")) {
              fileList.push({ path: filePath, content })
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

// Extraer todos los iconos importados
const importedIcons = new Set()
const files = findFiles(path.join(process.cwd(), 'src'))

for (const file of files) {
  // Buscar imports como: import { Icon1, Icon2, Icon3 } from '@/lib/optimized-imports'
  const importMatches = [...file.content.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/optimized-imports['"]/g)]
  
  for (const match of importMatches) {
    const imports = match[1]
    // Extraer cada icono (separados por comas, pueden tener espacios y saltos de línea)
    const icons = imports.split(',').map(i => i.trim()).filter(i => i)
    icons.forEach(icon => {
      // Remover comentarios y espacios
      const cleanIcon = icon.split('//')[0].trim()
      if (cleanIcon) {
        importedIcons.add(cleanIcon)
      }
    })
  }
}

console.log(`Iconos importados: ${importedIcons.size}\n`)

// Encontrar iconos faltantes
const missingIcons = []
for (const icon of importedIcons) {
  if (!exportedIcons.has(icon)) {
    missingIcons.push(icon)
  }
}

if (missingIcons.length > 0) {
  console.log('❌ Iconos faltantes:')
  missingIcons.forEach(icon => {
    console.log(`   - ${icon}`)
  })
} else {
  console.log('✅ Todos los iconos están exportados')
}

// Mostrar algunos iconos importados como referencia
console.log(`\n📊 Resumen:`)
console.log(`   Exportados: ${exportedIcons.size}`)
console.log(`   Importados: ${importedIcons.size}`)
console.log(`   Faltantes: ${missingIcons.length}`)

