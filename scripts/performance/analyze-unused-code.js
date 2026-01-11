#!/usr/bin/env node

/**
 * Script para analizar código JavaScript sin usar
 * Identifica imports y código que no se está utilizando
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔍 Analizando código JavaScript sin usar...\n')

// Configuración
const projectRoot = path.resolve(__dirname, '../..')
const srcDir = path.join(projectRoot, 'src')
const outputFile = path.join(projectRoot, 'unused-code-analysis.json')

// Archivos a analizar
const filesToAnalyze = [
  'src/lib/optimized-imports.ts',
  'src/components/Home/index.tsx',
  'src/app/page.tsx',
]

// Función para encontrar imports en un archivo
function findImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const imports = []
    
    // Buscar imports de optimized-imports
    const optimizedImportsRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/optimized-imports['"]/g
    let match
    while ((match = optimizedImportsRegex.exec(content)) !== null) {
      const importList = match[1]
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
      imports.push(...importList)
    }
    
    // Buscar otros imports
    const otherImportsRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g
    while ((match = otherImportsRegex.exec(content)) !== null) {
      imports.push({
        name: match[1],
        from: match[2],
      })
    }
    
    return imports
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error.message)
    return []
  }
}

// Función para buscar uso de un símbolo
function findUsage(symbol, directory) {
  try {
    const grepCommand = `grep -r "${symbol}" ${directory} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "node_modules" | wc -l`
    const count = parseInt(execSync(grepCommand, { encoding: 'utf8' }).trim(), 10)
    return count > 1 // Más de 1 porque aparece en la definición también
  } catch (error) {
    return false
  }
}

// Analizar optimized-imports.ts
function analyzeOptimizedImports() {
  const filePath = path.join(projectRoot, 'src/lib/optimized-imports.ts')
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Extraer todos los iconos importados
  const iconImports = []
  const iconRegex = /Icon\w+/g
  let match
  while ((match = iconRegex.exec(content)) !== null) {
    iconImports.push(match[0])
  }
  
  // Buscar uso de cada icono
  const unusedIcons = []
  for (const icon of iconImports) {
    const usageCount = execSync(
      `grep -r "${icon}" ${srcDir} --include="*.ts" --include="*.tsx" | grep -v "optimized-imports" | wc -l`,
      { encoding: 'utf8' }
    ).trim()
    
    if (parseInt(usageCount, 10) === 0) {
      unusedIcons.push(icon)
    }
  }
  
  return {
    total: iconImports.length,
    unused: unusedIcons.length,
    unusedList: unusedIcons,
  }
}

// Función principal
function main() {
  const results = {
    timestamp: new Date().toISOString(),
    optimizedImports: analyzeOptimizedImports(),
    recommendations: [],
  }
  
  // Generar recomendaciones
  if (results.optimizedImports.unused > 0) {
    results.recommendations.push({
      type: 'remove-unused-icons',
      message: `Se encontraron ${results.optimizedImports.unused} iconos sin usar en optimized-imports.ts`,
      impact: 'Reducción de bundle size',
      action: `Eliminar ${results.optimizedImports.unused} iconos no utilizados`,
    })
  }
  
  // Guardar resultados
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))
  
  console.log('✅ Análisis completado')
  console.log(`📊 Resultados guardados en: ${outputFile}\n`)
  console.log('📋 Resumen:')
  console.log(`   - Iconos totales: ${results.optimizedImports.total}`)
  console.log(`   - Iconos sin usar: ${results.optimizedImports.unused}`)
  console.log(`   - Porcentaje sin usar: ${((results.optimizedImports.unused / results.optimizedImports.total) * 100).toFixed(1)}%`)
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 Recomendaciones:')
    results.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.message}`)
      console.log(`      Impacto: ${rec.impact}`)
      console.log(`      Acción: ${rec.action}`)
    })
  }
}

main()
