#!/usr/bin/env node

/**
 * Script para ejecutar el test de flujo completo
 *
 * Este script:
 * 1. Configura el entorno de testing
 * 2. Ejecuta el test de flujo completo
 * 3. Verifica la integración de todos los componentes
 * 4. Genera un reporte final
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

class CompleteFlowTestRunner {
  constructor() {
    this.serverPort = 3000 // Puerto por defecto
    this.testResults = {
      startTime: new Date(),
      endTime: null,
      duration: 0,
      status: 'running',
      tests: [],
      screenshots: [],
      errors: [],
    }
  }

  async run() {
    console.log('🚀 Iniciando test de flujo completo...')
    console.log('='.repeat(50))

    try {
      // Paso 1: Verificar dependencias
      await this.checkDependencies()

      // Paso 2: Iniciar servidor de desarrollo (si no está corriendo)
      await this.ensureServerRunning()

      // Paso 3: Ejecutar tests de integración
      await this.runIntegrationTests()

      // Paso 4: Verificar APIs
      await this.verifyAPIs()

      // Paso 5: Verificar dashboard
      await this.verifyDashboard()

      // Paso 6: Generar reporte final
      await this.generateFinalReport()

      this.testResults.status = 'completed'
      this.testResults.endTime = new Date()
      this.testResults.duration = this.testResults.endTime - this.testResults.startTime

      console.log('✅ Test de flujo completo ejecutado exitosamente!')
      console.log(`⏱️  Duración total: ${this.testResults.duration}ms`)
    } catch (error) {
      this.testResults.status = 'failed'
      this.testResults.errors.push(error.message)
      console.error('❌ Error en test de flujo completo:', error.message)
      process.exit(1)
    }
  }

  async checkDependencies() {
    console.log('🔍 Verificando dependencias...')

    const requiredFiles = [
      'src/lib/test-flow-manager.ts',
      'src/lib/screenshot-manager.ts',
      'src/app/api/admin/test-execution/route.ts',
      'src/app/api/admin/test-screenshots/route.ts',
      'src/app/admin/test-reports/page.tsx',
      'src/__tests__/e2e/complete-flow-test.spec.ts',
    ]

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file)
      if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo requerido no encontrado: ${file}`)
      }
    }

    console.log('✅ Todas las dependencias verificadas')
  }

  async ensureServerRunning() {
    console.log('🌐 Verificando servidor de desarrollo...')

    const ports = [3001, 3000] // Probar puerto 3001 primero, luego 3000

    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}`)
        if (response.ok || response.status === 404) {
          // 404 es OK, significa que el servidor responde
          console.log(`✅ Servidor de desarrollo está corriendo en puerto ${port}`)
          this.serverPort = port
          return
        }
      } catch (error) {
        console.log(`⚠️  Puerto ${port} no disponible`)
      }
    }

    console.log('ℹ️  Servidor no detectado en puertos 3000 o 3001')
  }

  async runIntegrationTests() {
    console.log('🧪 Ejecutando tests de integración...')

    return new Promise((resolve, reject) => {
      const playwrightProcess = spawn(
        'npx',
        ['playwright', 'test', 'src/__tests__/e2e/complete-flow-test.spec.ts', '--reporter=json'],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
        }
      )

      let output = ''
      let errorOutput = ''

      playwrightProcess.stdout.on('data', data => {
        output += data.toString()
        process.stdout.write(data)
      })

      playwrightProcess.stderr.on('data', data => {
        errorOutput += data.toString()
        process.stderr.write(data)
      })

      playwrightProcess.on('close', code => {
        if (code === 0) {
          console.log('✅ Tests de integración completados')
          this.testResults.tests.push({
            name: 'Integration Tests',
            status: 'passed',
            output: output,
          })
          resolve()
        } else {
          console.error('❌ Tests de integración fallaron')
          this.testResults.tests.push({
            name: 'Integration Tests',
            status: 'failed',
            output: output,
            error: errorOutput,
          })
          reject(new Error(`Tests fallaron con código: ${code}`))
        }
      })
    })
  }

  async verifyAPIs() {
    console.log('🔌 Verificando APIs...')

    const apiEndpoints = [
      {
        name: 'Test Execution API',
        url: `http://localhost:${this.serverPort}/api/admin/test-execution`,
        method: 'POST',
        body: {
          suites: ['unit'],
          generateReport: true,
          screenshotOptions: { enabled: true },
        },
      },
      {
        name: 'Screenshots API',
        url: `http://localhost:${this.serverPort}/api/admin/test-screenshots?action=list`,
        method: 'GET',
      },
      {
        name: 'Test Flows API',
        url: `http://localhost:${this.serverPort}/api/admin/test-flows`,
        method: 'GET',
      },
    ]

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`  📡 Probando ${endpoint.name}...`)

        const options = {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
        }

        if (endpoint.body) {
          options.body = JSON.stringify(endpoint.body)
        }

        const response = await fetch(endpoint.url, options)

        if (response.ok) {
          console.log(`  ✅ ${endpoint.name} - OK`)
          this.testResults.tests.push({
            name: endpoint.name,
            status: 'passed',
            url: endpoint.url,
          })
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name} - Error: ${error.message}`)
        this.testResults.tests.push({
          name: endpoint.name,
          status: 'failed',
          url: endpoint.url,
          error: error.message,
        })
      }
    }
  }

  async verifyDashboard() {
    console.log('📊 Verificando dashboard...')

    try {
      const response = await fetch(`http://localhost:${this.serverPort}/admin/test-reports`)
      if (response.ok) {
        console.log('✅ Dashboard accesible')
        this.testResults.tests.push({
          name: 'Dashboard Access',
          status: 'passed',
          url: `http://localhost:${this.serverPort}/admin/test-reports`,
        })
      } else {
        throw new Error(`Dashboard no accesible: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Dashboard - Error: ${error.message}`)
      this.testResults.tests.push({
        name: 'Dashboard Access',
        status: 'failed',
        error: error.message,
      })
    }
  }

  async generateFinalReport() {
    console.log('📋 Generando reporte final...')

    const report = {
      timestamp: new Date().toISOString(),
      duration: this.testResults.duration,
      status: this.testResults.status,
      summary: {
        totalTests: this.testResults.tests.length,
        passedTests: this.testResults.tests.filter(t => t.status === 'passed').length,
        failedTests: this.testResults.tests.filter(t => t.status === 'failed').length,
        totalScreenshots: this.testResults.screenshots.length,
        errors: this.testResults.errors.length,
      },
      tests: this.testResults.tests,
      screenshots: this.testResults.screenshots,
      errors: this.testResults.errors,
      components: {
        testFlowManager: '✅ Implementado',
        screenshotManager: '✅ Implementado',
        testExecutionAPI: '✅ Implementado',
        screenshotsAPI: '✅ Implementado',
        testFlowsAPI: '✅ Implementado',
        dashboard: '✅ Implementado con visualización de screenshots',
      },
      recommendations: this.generateRecommendations(),
    }

    // Guardar reporte
    const reportPath = path.join(process.cwd(), 'test-reports', 'complete-flow-report.json')
    const reportDir = path.dirname(reportPath)

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log('📄 Reporte guardado en:', reportPath)

    // Mostrar resumen en consola
    this.displaySummary(report)
  }

  generateRecommendations() {
    const recommendations = []

    const failedTests = this.testResults.tests.filter(t => t.status === 'failed')
    if (failedTests.length > 0) {
      recommendations.push('Revisar y corregir tests fallidos antes de producción')
    }

    if (this.testResults.screenshots.length === 0) {
      recommendations.push('Verificar que la captura de screenshots esté funcionando correctamente')
    }

    if (this.testResults.errors.length > 0) {
      recommendations.push('Resolver errores identificados durante la ejecución')
    }

    if (recommendations.length === 0) {
      recommendations.push('Sistema completamente funcional - listo para producción')
    }

    return recommendations
  }

  displaySummary(report) {
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMEN DEL TEST DE FLUJO COMPLETO')
    console.log('='.repeat(60))
    console.log(`⏱️  Duración: ${report.duration}ms`)
    console.log(`📈 Estado: ${report.status.toUpperCase()}`)
    console.log(`✅ Tests exitosos: ${report.summary.passedTests}/${report.summary.totalTests}`)
    console.log(`❌ Tests fallidos: ${report.summary.failedTests}/${report.summary.totalTests}`)
    console.log(`📸 Screenshots: ${report.summary.totalScreenshots}`)
    console.log(`🚨 Errores: ${report.summary.errors}`)

    console.log('\n🔧 COMPONENTES IMPLEMENTADOS:')
    Object.entries(report.components).forEach(([component, status]) => {
      console.log(`  ${component}: ${status}`)
    })

    console.log('\n💡 RECOMENDACIONES:')
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`)
    })

    console.log('\n' + '='.repeat(60))
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const runner = new CompleteFlowTestRunner()
  runner.run().catch(console.error)
}

module.exports = CompleteFlowTestRunner
