#!/usr/bin/env node

/**
 * Script para analizar performance del Design System
 * Analiza bundle size, tree-shaking, y optimizaciones
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('📊 Analizando performance del Design System...\n')

// 1. Analizar bundle size de componentes
function analyzeBundleSize() {
  console.log('📦 Analizando bundle size de componentes...')

  const componentsDir = path.join(process.cwd(), 'src', 'components', 'ui')
  const components = fs
    .readdirSync(componentsDir)
    .filter(
      file => file.endsWith('.tsx') && !file.includes('.stories.') && !file.includes('.test.')
    )
    .map(file => file.replace('.tsx', ''))

  const bundleAnalysis = {
    totalComponents: components.length,
    componentSizes: {},
    recommendations: [],
  }

  components.forEach(component => {
    const filePath = path.join(componentsDir, `${component}.tsx`)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n').length
      const size = Buffer.byteLength(content, 'utf8')

      bundleAnalysis.componentSizes[component] = {
        lines,
        bytes: size,
        kb: (size / 1024).toFixed(2),
      }

      // Recomendaciones basadas en tamaño
      if (size > 10000) {
        // > 10KB
        bundleAnalysis.recommendations.push({
          component,
          type: 'size',
          message: `Componente ${component} es grande (${(size / 1024).toFixed(2)}KB). Considerar dividir en subcomponentes.`,
        })
      }

      // Analizar imports
      const imports = content.match(/import.*from.*['"`]/g) || []
      if (imports.length > 15) {
        bundleAnalysis.recommendations.push({
          component,
          type: 'imports',
          message: `Componente ${component} tiene muchos imports (${imports.length}). Revisar dependencias.`,
        })
      }
    }
  })

  return bundleAnalysis
}

// 2. Analizar tree-shaking
function analyzeTreeShaking() {
  console.log('🌳 Analizando tree-shaking...')

  const indexPath = path.join(process.cwd(), 'src', 'components', 'ui', 'index.ts')
  if (!fs.existsSync(indexPath)) {
    return {
      hasIndex: false,
      recommendation: 'Crear archivo index.ts para mejor tree-shaking',
    }
  }

  const indexContent = fs.readFileSync(indexPath, 'utf8')
  const exports = indexContent.match(/export.*from/g) || []

  return {
    hasIndex: true,
    totalExports: exports.length,
    namedExports: exports.filter(exp => exp.includes('{')).length,
    defaultExports: exports.filter(exp => !exp.includes('{')).length,
    recommendation:
      exports.length > 0 ? 'Tree-shaking configurado correctamente' : 'Agregar exports al index.ts',
  }
}

// 3. Analizar dependencias
function analyzeDependencies() {
  console.log('📋 Analizando dependencias...')

  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  const uiDependencies = [
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-select',
    '@radix-ui/react-tabs',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'lucide-react',
  ]

  const analysis = {
    totalDependencies: Object.keys(packageJson.dependencies || {}).length,
    uiDependencies: uiDependencies.filter(dep => packageJson.dependencies?.[dep]),
    heavyDependencies: [],
    recommendations: [],
  }

  // Identificar dependencias pesadas
  const heavyDeps = ['moment', 'lodash', 'date-fns']
  heavyDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep]) {
      analysis.heavyDependencies.push(dep)
      analysis.recommendations.push({
        type: 'dependency',
        message: `Considerar alternativas más ligeras para ${dep}`,
      })
    }
  })

  return analysis
}

// 4. Analizar performance de componentes
function analyzeComponentPerformance() {
  console.log('⚡ Analizando performance de componentes...')

  const componentsDir = path.join(process.cwd(), 'src', 'components', 'ui')
  const performanceIssues = []

  const components = fs
    .readdirSync(componentsDir)
    .filter(
      file => file.endsWith('.tsx') && !file.includes('.stories.') && !file.includes('.test.')
    )

  components.forEach(componentFile => {
    const filePath = path.join(componentsDir, componentFile)
    const content = fs.readFileSync(filePath, 'utf8')
    const componentName = componentFile.replace('.tsx', '')

    // Buscar problemas de performance
    const issues = []

    // 1. Uso de useEffect sin dependencias
    if (content.includes('useEffect(') && content.includes('[]')) {
      const effectCount = (content.match(/useEffect\(/g) || []).length
      if (effectCount > 3) {
        issues.push('Muchos useEffect - considerar optimización')
      }
    }

    // 2. Funciones inline en JSX
    const inlineFunctions = (content.match(/onClick=\{.*=>/g) || []).length
    if (inlineFunctions > 2) {
      issues.push('Funciones inline en JSX - usar useCallback')
    }

    // 3. Objetos inline en props
    const inlineObjects = (content.match(/\{\{.*\}\}/g) || []).length
    if (inlineObjects > 1) {
      issues.push('Objetos inline en props - usar useMemo')
    }

    // 4. Falta de memo
    if (!content.includes('React.memo') && !content.includes('memo(')) {
      issues.push('Considerar React.memo para optimización')
    }

    if (issues.length > 0) {
      performanceIssues.push({
        component: componentName,
        issues,
      })
    }
  })

  return performanceIssues
}

// 5. Generar reporte
function generateReport() {
  const bundleAnalysis = analyzeBundleSize()
  const treeShaking = analyzeTreeShaking()
  const dependencies = analyzeDependencies()
  const performance = analyzeComponentPerformance()

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalComponents: bundleAnalysis.totalComponents,
      totalRecommendations:
        bundleAnalysis.recommendations.length +
        dependencies.recommendations.length +
        performance.length,
      treeShakingStatus: treeShaking.hasIndex ? 'Configurado' : 'No configurado',
      performanceIssues: performance.length,
    },
    bundleAnalysis,
    treeShaking,
    dependencies,
    performance,
    recommendations: [
      ...bundleAnalysis.recommendations,
      ...dependencies.recommendations,
      ...performance.map(p => ({
        component: p.component,
        type: 'performance',
        message: `Issues de performance: ${p.issues.join(', ')}`,
      })),
    ],
  }

  // Guardar reporte
  const reportPath = path.join(process.cwd(), 'reports', 'design-system-performance.json')
  const reportsDir = path.dirname(reportPath)

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  return report
}

// Ejecutar análisis
try {
  const report = generateReport()

  console.log('📊 REPORTE DE PERFORMANCE DEL DESIGN SYSTEM')
  console.log('='.repeat(50))
  console.log(`📦 Total de componentes: ${report.summary.totalComponents}`)
  console.log(`🌳 Tree-shaking: ${report.summary.treeShakingStatus}`)
  console.log(`⚠️  Issues de performance: ${report.summary.performanceIssues}`)
  console.log(`💡 Total recomendaciones: ${report.summary.totalRecommendations}`)

  if (report.recommendations.length > 0) {
    console.log('\n🔧 RECOMENDACIONES:')
    report.recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.component || rec.type}] ${rec.message}`)
    })

    if (report.recommendations.length > 5) {
      console.log(`   ... y ${report.recommendations.length - 5} más`)
    }
  }

  console.log(`\n📄 Reporte completo guardado en: reports/design-system-performance.json`)
  console.log('\n✅ Análisis de performance completado')
} catch (error) {
  console.error('❌ Error en análisis de performance:', error.message)
  process.exit(1)
}
