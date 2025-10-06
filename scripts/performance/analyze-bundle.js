#!/usr/bin/env node

/**
 * Script para analizar el bundle size y identificar oportunidades de optimización
 * Pinteya E-commerce - Performance Optimization
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('📊 Analizando Bundle Size y Performance...\n')

const REPORTS_DIR = 'bundle-analysis'
const results = {
  bundleSize: null,
  dependencies: null,
  unusedDependencies: null,
  heavyComponents: null,
  optimizations: [],
  timestamp: new Date().toISOString(),
}

async function analyzeBundleSize() {
  console.log('🔍 1/4 - Analizando tamaño del bundle...')

  try {
    // Crear directorio de reportes
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true })
    }

    // Build del proyecto para análisis
    console.log('🔨 Building proyecto para análisis...')
    execSync('npm run build', { stdio: 'pipe' })

    // Analizar archivos .next
    const nextDir = '.next'
    const staticDir = path.join(nextDir, 'static')

    if (fs.existsSync(staticDir)) {
      const bundleStats = await analyzeBundleFiles(staticDir)
      results.bundleSize = bundleStats

      console.log('✅ Análisis de bundle completado')
      console.log(`📦 Bundle total: ${(bundleStats.totalSize / 1024 / 1024).toFixed(2)} MB`)
      console.log(`📄 Archivos JS: ${bundleStats.jsFiles.length}`)
      console.log(`🎨 Archivos CSS: ${bundleStats.cssFiles.length}`)
    }
  } catch (error) {
    console.error('❌ Error analizando bundle:', error.message)
    results.bundleSize = { error: error.message }
  }
}

async function analyzeBundleFiles(staticDir) {
  const stats = {
    totalSize: 0,
    jsFiles: [],
    cssFiles: [],
    chunks: [],
    largestFiles: [],
  }

  function analyzeDirectory(dir) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        analyzeDirectory(filePath)
      } else {
        const fileInfo = {
          name: file,
          path: filePath.replace('.next/', ''),
          size: stat.size,
          sizeKB: (stat.size / 1024).toFixed(2),
          sizeMB: (stat.size / 1024 / 1024).toFixed(2),
        }

        stats.totalSize += stat.size

        if (file.endsWith('.js')) {
          stats.jsFiles.push(fileInfo)
        } else if (file.endsWith('.css')) {
          stats.cssFiles.push(fileInfo)
        }

        // Identificar chunks grandes
        if (stat.size > 100 * 1024) {
          // > 100KB
          stats.chunks.push(fileInfo)
        }
      }
    }
  }

  analyzeDirectory(staticDir)

  // Ordenar por tamaño
  stats.jsFiles.sort((a, b) => b.size - a.size)
  stats.cssFiles.sort((a, b) => b.size - a.size)
  stats.chunks.sort((a, b) => b.size - a.size)

  // Top 10 archivos más grandes
  stats.largestFiles = [...stats.jsFiles, ...stats.cssFiles]
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)

  return stats
}

async function analyzeDependencies() {
  console.log('📦 2/4 - Analizando dependencias...')

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const dependencies = packageJson.dependencies || {}
    const devDependencies = packageJson.devDependencies || {}

    // Analizar tamaños de dependencias
    const depAnalysis = {
      total: Object.keys(dependencies).length,
      heavy: [],
      light: [],
      categories: {
        ui: [],
        state: [],
        auth: [],
        database: [],
        payment: [],
        testing: [],
        build: [],
        other: [],
      },
    }

    // Categorizar dependencias
    for (const [name, version] of Object.entries(dependencies)) {
      const category = categorizeDependency(name)
      depAnalysis.categories[category].push({ name, version })

      // Identificar dependencias pesadas conocidas
      if (isHeavyDependency(name)) {
        depAnalysis.heavy.push({ name, version, reason: getHeavyReason(name) })
      } else {
        depAnalysis.light.push({ name, version })
      }
    }

    results.dependencies = depAnalysis
    console.log('✅ Análisis de dependencias completado')
    console.log(`📦 Total dependencias: ${depAnalysis.total}`)
    console.log(`⚠️  Dependencias pesadas: ${depAnalysis.heavy.length}`)
  } catch (error) {
    console.error('❌ Error analizando dependencias:', error.message)
    results.dependencies = { error: error.message }
  }
}

function categorizeDependency(name) {
  if (name.includes('radix') || name.includes('ui') || name === 'lucide-react') return 'ui'
  if (name.includes('redux') || name.includes('state')) return 'state'
  if (name.includes('clerk') || name.includes('auth')) return 'auth'
  if (name.includes('supabase') || name.includes('database')) return 'database'
  if (name.includes('mercadopago') || name.includes('payment')) return 'payment'
  if (name.includes('test') || name.includes('jest') || name.includes('playwright'))
    return 'testing'
  if (name.includes('next') || name.includes('webpack') || name.includes('babel')) return 'build'
  return 'other'
}

function isHeavyDependency(name) {
  const heavyDeps = [
    'puppeteer',
    'swiper',
    'mercadopago',
    '@reduxjs/toolkit',
    'react-redux',
    'date-fns',
    'sharp',
    'lucide-react',
  ]
  return heavyDeps.some(heavy => name.includes(heavy))
}

function getHeavyReason(name) {
  const reasons = {
    puppeteer: 'Browser automation - considerar alternativas más ligeras',
    swiper: 'Carousel library - evaluar si se usa completamente',
    mercadopago: 'Payment SDK - necesario pero optimizable',
    '@reduxjs/toolkit': 'State management - evaluar uso real',
    'react-redux': 'Redux bindings - evaluar si es necesario',
    'date-fns': 'Date library - considerar tree-shaking',
    sharp: 'Image processing - solo para build',
    'lucide-react': 'Icon library - implementar tree-shaking',
  }

  for (const [key, reason] of Object.entries(reasons)) {
    if (name.includes(key)) return reason
  }
  return 'Dependencia pesada identificada'
}

async function findUnusedDependencies() {
  console.log('🔍 3/4 - Buscando dependencias no utilizadas...')

  try {
    // Buscar imports en el código
    const usedDependencies = new Set()
    const srcDir = 'src'

    function scanDirectory(dir) {
      if (!fs.existsSync(dir)) return

      const files = fs.readdirSync(dir)

      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
          scanDirectory(filePath)
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
          const content = fs.readFileSync(filePath, 'utf8')

          // Buscar imports
          const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g)
          if (importMatches) {
            importMatches.forEach(match => {
              const dep = match.match(/from\s+['"]([^'"]+)['"]/)[1]
              if (!dep.startsWith('.') && !dep.startsWith('/')) {
                const packageName = dep.split('/')[0]
                if (packageName.startsWith('@')) {
                  usedDependencies.add(`${packageName}/${dep.split('/')[1]}`)
                } else {
                  usedDependencies.add(packageName)
                }
              }
            })
          }
        }
      }
    }

    scanDirectory(srcDir)

    // Comparar con package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    const unused = []
    const used = []

    for (const dep of Object.keys(allDependencies)) {
      if (usedDependencies.has(dep) || isEssentialDependency(dep)) {
        used.push(dep)
      } else {
        unused.push(dep)
      }
    }

    results.unusedDependencies = { unused, used, total: Object.keys(allDependencies).length }

    console.log('✅ Análisis de dependencias no utilizadas completado')
    console.log(`📦 Dependencias usadas: ${used.length}`)
    console.log(`⚠️  Posiblemente no utilizadas: ${unused.length}`)
  } catch (error) {
    console.error('❌ Error buscando dependencias no utilizadas:', error.message)
    results.unusedDependencies = { error: error.message }
  }
}

function isEssentialDependency(name) {
  const essential = [
    'next',
    'react',
    'react-dom',
    'typescript',
    '@types/',
    'eslint',
    'tailwindcss',
    'postcss',
    'autoprefixer',
  ]
  return essential.some(ess => name.includes(ess))
}

async function analyzeHeavyComponents() {
  console.log('🧩 4/4 - Analizando componentes pesados...')

  try {
    const heavyComponents = []
    const srcDir = 'src/components'

    function analyzeComponent(dir, componentName = '') {
      if (!fs.existsSync(dir)) return

      const files = fs.readdirSync(dir)

      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
          analyzeComponent(filePath, file)
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf8')
          const size = stat.size

          // Componentes grandes (> 5KB)
          if (size > 5 * 1024) {
            const analysis = {
              name: componentName || file.replace(/\.(tsx?|jsx?)$/, ''),
              file: filePath,
              size: size,
              sizeKB: (size / 1024).toFixed(2),
              lines: content.split('\n').length,
              imports: (content.match(/import/g) || []).length,
              exports: (content.match(/export/g) || []).length,
              complexity: calculateComplexity(content),
              suggestions: generateOptimizationSuggestions(content, componentName || file),
            }

            heavyComponents.push(analysis)
          }
        }
      }
    }

    analyzeComponent(srcDir)

    // Ordenar por tamaño
    heavyComponents.sort((a, b) => b.size - a.size)

    results.heavyComponents = heavyComponents.slice(0, 10) // Top 10

    console.log('✅ Análisis de componentes pesados completado')
    console.log(`🧩 Componentes grandes encontrados: ${heavyComponents.length}`)
  } catch (error) {
    console.error('❌ Error analizando componentes:', error.message)
    results.heavyComponents = { error: error.message }
  }
}

function calculateComplexity(content) {
  let complexity = 0

  // Contar estructuras complejas
  complexity += (content.match(/if\s*\(/g) || []).length
  complexity += (content.match(/for\s*\(/g) || []).length
  complexity += (content.match(/while\s*\(/g) || []).length
  complexity += (content.match(/switch\s*\(/g) || []).length
  complexity += (content.match(/\?\s*:/g) || []).length // ternarios
  complexity += (content.match(/&&/g) || []).length
  complexity += (content.match(/\|\|/g) || []).length

  return complexity
}

function generateOptimizationSuggestions(content, componentName) {
  const suggestions = []

  if (content.includes('useState') && content.includes('useEffect')) {
    suggestions.push('Considerar usar useReducer para estado complejo')
  }

  if (content.includes('map(') && content.includes('filter(')) {
    suggestions.push('Optimizar operaciones de array con useMemo')
  }

  if (content.includes('import') && content.match(/import.*{.*}/g)?.length > 10) {
    suggestions.push('Considerar lazy loading de imports pesados')
  }

  if (content.includes('Modal') || content.includes('Dialog')) {
    suggestions.push('Implementar lazy loading para modales')
  }

  if (
    componentName.toLowerCase().includes('home') ||
    componentName.toLowerCase().includes('page')
  ) {
    suggestions.push('Dividir en componentes más pequeños')
  }

  return suggestions
}

async function generateOptimizationPlan() {
  console.log('📋 Generando plan de optimización...')

  const optimizations = []

  // Basado en bundle size
  if (results.bundleSize && results.bundleSize.totalSize > 5 * 1024 * 1024) {
    // > 5MB
    optimizations.push({
      priority: 'high',
      category: 'Bundle Size',
      issue: 'Bundle total muy grande',
      solution: 'Implementar code splitting y lazy loading',
      impact: 'Alto - mejora significativa en FCP y LCP',
    })
  }

  // Basado en dependencias pesadas
  if (results.dependencies && results.dependencies.heavy.length > 0) {
    optimizations.push({
      priority: 'medium',
      category: 'Dependencies',
      issue: `${results.dependencies.heavy.length} dependencias pesadas detectadas`,
      solution: 'Evaluar alternativas más ligeras o tree-shaking',
      impact: 'Medio - reducción de bundle size',
    })
  }

  // Basado en dependencias no utilizadas
  if (results.unusedDependencies && results.unusedDependencies.unused.length > 0) {
    optimizations.push({
      priority: 'low',
      category: 'Cleanup',
      issue: `${results.unusedDependencies.unused.length} dependencias posiblemente no utilizadas`,
      solution: 'Remover dependencias no utilizadas',
      impact: 'Bajo - limpieza de código',
    })
  }

  // Basado en componentes pesados
  if (results.heavyComponents && results.heavyComponents.length > 0) {
    optimizations.push({
      priority: 'medium',
      category: 'Components',
      issue: `${results.heavyComponents.length} componentes grandes detectados`,
      solution: 'Refactorizar componentes grandes y implementar lazy loading',
      impact: 'Medio - mejora en tiempo de renderizado',
    })
  }

  results.optimizations = optimizations
}

async function generateReport() {
  console.log('📄 Generando reporte...')

  const report = {
    summary: {
      timestamp: results.timestamp,
      bundleSize: results.bundleSize?.totalSize
        ? `${(results.bundleSize.totalSize / 1024 / 1024).toFixed(2)} MB`
        : 'Error',
      dependencies: results.dependencies?.total || 0,
      unusedDependencies: results.unusedDependencies?.unused?.length || 0,
      heavyComponents: results.heavyComponents?.length || 0,
      optimizations: results.optimizations?.length || 0,
    },
    results,
  }

  // Guardar reporte JSON
  const jsonPath = path.join(REPORTS_DIR, 'bundle-analysis.json')
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))

  // Generar reporte Markdown
  const markdownReport = generateMarkdownReport(report)
  const mdPath = path.join(REPORTS_DIR, 'bundle-analysis.md')
  fs.writeFileSync(mdPath, markdownReport)

  console.log('\n📊 Resumen del Análisis:')
  console.log(`  📦 Bundle Size: ${report.summary.bundleSize}`)
  console.log(`  📚 Dependencias: ${report.summary.dependencies}`)
  console.log(`  ⚠️  No utilizadas: ${report.summary.unusedDependencies}`)
  console.log(`  🧩 Componentes pesados: ${report.summary.heavyComponents}`)
  console.log(`  🎯 Optimizaciones sugeridas: ${report.summary.optimizations}`)

  console.log('\n📁 Reportes generados:')
  console.log(`  📄 JSON: ${jsonPath}`)
  console.log(`  📝 Markdown: ${mdPath}`)
}

function generateMarkdownReport(report) {
  const { summary, results } = report

  return `# 📊 Bundle Analysis Report
## Pinteya E-commerce Performance Analysis

**Fecha:** ${new Date(summary.timestamp).toLocaleString()}

## 📋 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| Bundle Size | ${summary.bundleSize} | ${getBundleStatus(summary.bundleSize)} |
| Dependencias | ${summary.dependencies} | ${getDependenciesStatus(summary.dependencies)} |
| No utilizadas | ${summary.unusedDependencies} | ${getUnusedStatus(summary.unusedDependencies)} |
| Componentes pesados | ${summary.heavyComponents} | ${getComponentsStatus(summary.heavyComponents)} |

## 🎯 Plan de Optimización

${
  results.optimizations
    ?.map(
      opt => `
### ${opt.category} - Prioridad ${opt.priority.toUpperCase()}

**Problema:** ${opt.issue}  
**Solución:** ${opt.solution}  
**Impacto:** ${opt.impact}
`
    )
    .join('\n') || 'No se identificaron optimizaciones críticas'
}

## 📦 Análisis de Bundle

${
  results.bundleSize
    ? `
### Archivos más grandes
${results.bundleSize.largestFiles?.map(file => `- **${file.name}**: ${file.sizeKB} KB`).join('\n') || 'No disponible'}

### Distribución por tipo
- **JavaScript**: ${results.bundleSize.jsFiles?.length || 0} archivos
- **CSS**: ${results.bundleSize.cssFiles?.length || 0} archivos
- **Chunks grandes**: ${results.bundleSize.chunks?.length || 0} archivos
`
    : 'Error en análisis de bundle'
}

## 📚 Análisis de Dependencias

${
  results.dependencies
    ? `
### Dependencias por categoría
- **UI**: ${results.dependencies.categories?.ui?.length || 0}
- **Estado**: ${results.dependencies.categories?.state?.length || 0}
- **Auth**: ${results.dependencies.categories?.auth?.length || 0}
- **Database**: ${results.dependencies.categories?.database?.length || 0}
- **Payment**: ${results.dependencies.categories?.payment?.length || 0}

### Dependencias pesadas
${results.dependencies.heavy?.map(dep => `- **${dep.name}**: ${dep.reason}`).join('\n') || 'Ninguna identificada'}
`
    : 'Error en análisis de dependencias'
}

## 🧩 Componentes Pesados

${
  results.heavyComponents
    ?.map(
      comp => `
### ${comp.name}
- **Tamaño**: ${comp.sizeKB} KB (${comp.lines} líneas)
- **Complejidad**: ${comp.complexity}
- **Sugerencias**: ${comp.suggestions?.join(', ') || 'Ninguna'}
`
    )
    .join('\n') || 'No se encontraron componentes pesados'
}

---
*Reporte generado automáticamente por el analizador de performance de Pinteya*
`
}

function getBundleStatus(size) {
  if (size === 'Error') return '❌ Error'
  const sizeNum = parseFloat(size)
  if (sizeNum < 2) return '🟢 Excelente'
  if (sizeNum < 5) return '🟡 Bueno'
  return '🔴 Necesita optimización'
}

function getDependenciesStatus(count) {
  if (count < 30) return '🟢 Manejable'
  if (count < 50) return '🟡 Moderado'
  return '🔴 Muchas dependencias'
}

function getUnusedStatus(count) {
  if (count === 0) return '🟢 Limpio'
  if (count < 5) return '🟡 Pocas'
  return '🔴 Muchas no utilizadas'
}

function getComponentsStatus(count) {
  if (count === 0) return '🟢 Optimizado'
  if (count < 3) return '🟡 Algunos grandes'
  return '🔴 Muchos componentes pesados'
}

// Ejecutar análisis
async function main() {
  try {
    await analyzeBundleSize()
    await analyzeDependencies()
    await findUnusedDependencies()
    await analyzeHeavyComponents()
    await generateOptimizationPlan()
    await generateReport()

    console.log('\n🎯 ¡Análisis de bundle completado!')
  } catch (error) {
    console.error('❌ Error en análisis:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }
