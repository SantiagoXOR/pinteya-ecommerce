#!/usr/bin/env node

/**
 * Script para analizar CSS sin usar
 * Identifica reglas CSS que no se están utilizando en el proyecto
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔍 Analizando CSS sin usar...\n')

// Configuración
const projectRoot = path.resolve(__dirname, '../..')
const srcDir = path.join(projectRoot, 'src')
const publicDir = path.join(projectRoot, 'public')
const outputFile = path.join(projectRoot, 'unused-css-analysis.json')

// Archivos CSS a analizar
const cssFiles = [
  'src/app/css/style.css',
  'public/styles/hero-carousel.css',
  'public/styles/home-v2-animations.css',
  'public/styles/z-index-hierarchy.css',
  'public/styles/mobile-modals.css',
]

// Función para extraer clases CSS de un archivo
function extractCSSClasses(cssContent) {
  const classes = new Set()
  
  // Buscar clases: .class-name
  const classRegex = /\.([a-zA-Z0-9_-]+)/g
  let match
  while ((match = classRegex.exec(cssContent)) !== null) {
    classes.add(match[1])
  }
  
  // Buscar IDs: #id-name
  const idRegex = /#([a-zA-Z0-9_-]+)/g
  while ((match = idRegex.exec(cssContent)) !== null) {
    classes.add(match[1])
  }
  
  return Array.from(classes)
}

// Función para buscar uso de una clase en el código
function findClassUsage(className, directory) {
  try {
    // Buscar en archivos TS/TSX/JS/JSX
    const grepCommand = `grep -r "${className}" ${directory} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.html" | grep -v "node_modules" | wc -l`
    const count = parseInt(execSync(grepCommand, { encoding: 'utf8' }).trim(), 10)
    return count > 0
  } catch (error) {
    return false
  }
}

// Analizar un archivo CSS
function analyzeCSSFile(filePath) {
  try {
    const fullPath = path.join(projectRoot, filePath)
    if (!fs.existsSync(fullPath)) {
      return null
    }
    
    const content = fs.readFileSync(fullPath, 'utf8')
    const classes = extractCSSClasses(content)
    
    const unused = []
    const used = []
    
    for (const className of classes) {
      const isUsed = findClassUsage(className, srcDir) || findClassUsage(className, publicDir)
      if (isUsed) {
        used.push(className)
      } else {
        unused.push(className)
      }
    }
    
    return {
      file: filePath,
      totalClasses: classes.length,
      used: used.length,
      unused: unused.length,
      unusedList: unused.slice(0, 50), // Limitar a 50 para no hacer el archivo muy grande
      percentageUnused: ((unused.length / classes.length) * 100).toFixed(1),
    }
  } catch (error) {
    console.error(`Error analizando ${filePath}:`, error.message)
    return null
  }
}

// Función principal
function main() {
  const results = {
    timestamp: new Date().toISOString(),
    files: [],
    summary: {
      totalFiles: 0,
      totalClasses: 0,
      totalUnused: 0,
      totalUsed: 0,
    },
    recommendations: [],
  }
  
  // Analizar cada archivo CSS
  for (const cssFile of cssFiles) {
    const analysis = analyzeCSSFile(cssFile)
    if (analysis) {
      results.files.push(analysis)
      results.summary.totalFiles++
      results.summary.totalClasses += analysis.totalClasses
      results.summary.totalUnused += analysis.unused
      results.summary.totalUsed += analysis.used
    }
  }
  
  // Generar recomendaciones
  const highUnusedFiles = results.files.filter(f => parseFloat(f.percentageUnused) > 50)
  if (highUnusedFiles.length > 0) {
    results.recommendations.push({
      type: 'high-unused-css',
      message: `Se encontraron ${highUnusedFiles.length} archivos CSS con más del 50% de código sin usar`,
      files: highUnusedFiles.map(f => ({
        file: f.file,
        unused: f.unused,
        percentage: f.percentageUnused,
      })),
      impact: 'Reducción significativa de bundle size y tiempo de parse CSS',
      action: 'Revisar y eliminar reglas CSS no utilizadas',
    })
  }
  
  // Guardar resultados
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))
  
  console.log('✅ Análisis completado')
  console.log(`📊 Resultados guardados en: ${outputFile}\n`)
  console.log('📋 Resumen:')
  console.log(`   - Archivos analizados: ${results.summary.totalFiles}`)
  console.log(`   - Clases totales: ${results.summary.totalClasses}`)
  console.log(`   - Clases usadas: ${results.summary.totalUsed}`)
  console.log(`   - Clases sin usar: ${results.summary.totalUnused}`)
  console.log(`   - Porcentaje sin usar: ${((results.summary.totalUnused / results.summary.totalClasses) * 100).toFixed(1)}%`)
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 Recomendaciones:')
    results.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.message}`)
      if (rec.files) {
        rec.files.forEach(f => {
          console.log(`      - ${f.file}: ${f.unused} clases sin usar (${f.percentage}%)`)
        })
      }
      console.log(`      Impacto: ${rec.impact}`)
      console.log(`      Acción: ${rec.action}`)
    })
  }
}

main()
