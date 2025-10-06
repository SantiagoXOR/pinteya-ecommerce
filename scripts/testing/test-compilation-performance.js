#!/usr/bin/env node

/**
 * Script para medir performance de compilación
 * Pinteya E-commerce - Optimizaciones de Performance
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Testing Compilation Performance - Pinteya E-commerce')
console.log('=' * 60)

// Métricas objetivo después de optimizaciones
const TARGETS = {
  buildTime: 30000, // 30 segundos
  startupTime: 2000, // 2 segundos
  firstCompile: 3000, // 3 segundos para primera compilación
}

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {},
}

function measureTime(label, fn) {
  console.log(`\n⏱️  Midiendo: ${label}...`)
  const startTime = Date.now()

  try {
    const result = fn()
    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`✅ ${label}: ${duration}ms`)

    results.tests.push({
      test: label,
      duration,
      success: true,
      timestamp: new Date().toISOString(),
    })

    return { success: true, duration, result }
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`❌ ${label}: ${duration}ms (ERROR: ${error.message})`)

    results.tests.push({
      test: label,
      duration,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    })

    return { success: false, duration, error }
  }
}

function cleanBuild() {
  console.log('🧹 Limpiando build anterior...')
  try {
    if (fs.existsSync('.next')) {
      execSync('rmdir /s /q .next', { stdio: 'pipe' })
    }
    console.log('✅ Build limpiado')
  } catch (error) {
    console.log('⚠️  Error limpiando build:', error.message)
  }
}

function testBuildTime() {
  return measureTime('Build Time', () => {
    cleanBuild()
    execSync('npm run build', {
      stdio: 'pipe',
      cwd: process.cwd(),
      timeout: 120000, // 2 minutos timeout
    })
    return 'Build completado'
  })
}

function testStartupTime() {
  return measureTime('Dev Server Startup', () => {
    cleanBuild()

    // Simular inicio del servidor dev
    const output = execSync('timeout 10 npm run dev', {
      stdio: 'pipe',
      cwd: process.cwd(),
      encoding: 'utf8',
    }).toString()

    // Buscar el tiempo de "Ready in"
    const readyMatch = output.match(/Ready in (\d+)ms/)
    if (readyMatch) {
      const readyTime = parseInt(readyMatch[1])
      console.log(`📊 Ready time detectado: ${readyTime}ms`)
      return `Ready in ${readyTime}ms`
    }

    return 'Startup completado'
  })
}

function analyzeBundleSize() {
  console.log('\n📦 Analizando Bundle Size...')

  try {
    const buildDir = path.join(process.cwd(), '.next')

    if (!fs.existsSync(buildDir)) {
      console.log('⚠️  Directorio .next no encontrado, ejecutando build...')
      execSync('npm run build', { stdio: 'pipe' })
    }

    // Calcular tamaño total
    function getDirectorySize(dirPath) {
      let totalSize = 0

      function calculateSize(currentPath) {
        const stats = fs.statSync(currentPath)

        if (stats.isDirectory()) {
          const files = fs.readdirSync(currentPath)
          files.forEach(file => {
            calculateSize(path.join(currentPath, file))
          })
        } else {
          totalSize += stats.size
        }
      }

      calculateSize(dirPath)
      return totalSize
    }

    const totalSize = getDirectorySize(buildDir)
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2)

    console.log(`📊 Bundle size total: ${sizeMB}MB`)

    results.bundleSize = {
      bytes: totalSize,
      mb: sizeMB,
    }

    return { totalSize, sizeMB }
  } catch (error) {
    console.log('❌ Error analizando bundle:', error.message)
    return null
  }
}

function generateReport() {
  console.log('\n📊 Generando Reporte de Performance...')

  // Calcular métricas de resumen
  const successfulTests = results.tests.filter(t => t.success)
  const failedTests = results.tests.filter(t => !t.success)

  results.summary = {
    totalTests: results.tests.length,
    successful: successfulTests.length,
    failed: failedTests.length,
    averageTime:
      successfulTests.length > 0
        ? Math.round(
            successfulTests.reduce((sum, t) => sum + t.duration, 0) / successfulTests.length
          )
        : 0,
  }

  // Comparar con targets
  const buildTest = results.tests.find(t => t.test === 'Build Time')
  const startupTest = results.tests.find(t => t.test === 'Dev Server Startup')

  console.log('\n🎯 Comparación con Targets:')

  if (buildTest && buildTest.success) {
    const improvement = buildTest.duration < TARGETS.buildTime
    console.log(
      `Build Time: ${buildTest.duration}ms ${improvement ? '✅' : '❌'} (Target: ${TARGETS.buildTime}ms)`
    )
  }

  if (startupTest && startupTest.success) {
    const improvement = startupTest.duration < TARGETS.startupTime
    console.log(
      `Startup Time: ${startupTest.duration}ms ${improvement ? '✅' : '❌'} (Target: ${TARGETS.startupTime}ms)`
    )
  }

  // Guardar reporte
  const reportPath = path.join(process.cwd(), 'performance-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
  console.log(`\n📄 Reporte guardado en: ${reportPath}`)

  return results
}

// Ejecutar tests
async function runTests() {
  console.log('🧪 Iniciando Tests de Performance...\n')

  // Test 1: Build Time
  testBuildTime()

  // Test 2: Bundle Size
  analyzeBundleSize()

  // Test 3: Startup Time (comentado por ahora para evitar conflictos)
  // testStartupTime();

  // Generar reporte final
  generateReport()

  console.log('\n🎉 Tests de Performance Completados!')
  console.log('\n📋 Resumen:')
  console.log(`- Tests ejecutados: ${results.summary.totalTests}`)
  console.log(`- Exitosos: ${results.summary.successful}`)
  console.log(`- Fallidos: ${results.summary.failed}`)
  console.log(`- Tiempo promedio: ${results.summary.averageTime}ms`)

  if (results.bundleSize) {
    console.log(`- Bundle size: ${results.bundleSize.mb}MB`)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { runTests, measureTime, analyzeBundleSize }
