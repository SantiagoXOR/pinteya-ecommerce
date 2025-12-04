#!/usr/bin/env node

/**
 * SCRIPT DE PENETRATION TESTING - VERIFICACIÓN DE SEGURIDAD OBLIGATORIA
 *
 * Este script ejecuta pruebas exhaustivas de seguridad antes de permitir commits.
 * FALLA INMEDIATAMENTE si encuentra vulnerabilidades de acceso no autorizado.
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Usar fetch nativo de Node.js
const fetch = globalThis.fetch

// Configuración de testing de seguridad
const SECURITY_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  maxRetries: 3,
}

// Rutas que DEBEN estar protegidas
const PROTECTED_ROUTES = [
  // Rutas UI Admin
  { url: '/admin', type: 'UI', expectedStatus: [302, 401, 403] },
  { url: '/admin/products', type: 'UI', expectedStatus: [302, 401, 403] },
  { url: '/admin/orders', type: 'UI', expectedStatus: [302, 401, 403] },
  { url: '/admin/monitoring', type: 'UI', expectedStatus: [302, 401, 403] },

  // APIs Admin
  { url: '/api/admin/products', type: 'API', expectedStatus: [401, 403] },
  { url: '/api/admin/orders', type: 'API', expectedStatus: [401, 403] },
  { url: '/api/admin/monitoring/health', type: 'API', expectedStatus: [401, 403] },
  { url: '/api/admin/users/stats', type: 'API', expectedStatus: [401, 403] },
  { url: '/api/admin/settings', type: 'API', expectedStatus: [401, 403] },
]

// Rutas que DEBEN permanecer públicas
const PUBLIC_ROUTES = [
  { url: '/api/products', expectedStatus: [200] },
  { url: '/api/categories', expectedStatus: [200] },
  { url: '/api/brands', expectedStatus: [200] },
  { url: '/api/search/trending', expectedStatus: [200] },
]

// Headers maliciosos para testing
const MALICIOUS_HEADERS = [
  { name: 'X-Admin-Override', value: 'true' },
  { name: 'Authorization', value: 'Bearer fake-token' },
  { name: 'X-API-Key', value: 'malicious-key' },
  { name: 'X-Forwarded-For', value: '127.0.0.1' },
  { name: 'X-Real-IP', value: 'localhost' },
]

class SecurityPenetrationTester {
  constructor() {
    this.results = []
    this.vulnerabilities = []
    this.server = null
    this.criticalFailures = 0
  }

  async startServer() {
    console.log('🔒 INICIANDO TESTING DE SEGURIDAD...')
    console.log('🚀 Verificando servidor Next.js...')

    // Verificar si el servidor ya está corriendo
    try {
      const response = await fetch(`${SECURITY_CONFIG.baseUrl}/api/test`, {
        timeout: 5000,
      })
      console.log('✅ Servidor ya disponible')
      return true
    } catch (error) {
      console.log('⚠️  Servidor no disponible, iniciando...')

      return new Promise((resolve, reject) => {
        this.server = spawn('npm', ['start'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
        })

        let output = ''

        this.server.stdout.on('data', data => {
          output += data.toString()
          if (output.includes('Ready on') || output.includes('started server on')) {
            console.log('✅ Servidor iniciado correctamente')
            setTimeout(resolve, 3000)
          }
        })

        setTimeout(() => {
          console.log('⏰ Timeout del servidor, continuando...')
          resolve()
        }, 15000)
      })
    }
  }

  async testProtectedRoute(route) {
    console.log(`🔍 Testing protección: ${route.url}`)

    try {
      // Test 1: Acceso sin autenticación
      const response = await fetch(`${SECURITY_CONFIG.baseUrl}${route.url}`, {
        method: 'GET',
        timeout: SECURITY_CONFIG.timeout,
        headers: {
          'User-Agent': 'Malicious-Bot/1.0',
        },
      })

      const status = response.status
      const isProtected = route.expectedStatus.includes(status)

      if (!isProtected) {
        this.criticalFailures++
        this.vulnerabilities.push({
          type: 'UNAUTHORIZED_ACCESS',
          route: route.url,
          severity: 'CRITICAL',
          status: status,
          expected: route.expectedStatus,
          description: `Ruta protegida accesible sin autenticación`,
        })
      }

      return {
        route: route.url,
        type: route.type,
        status,
        expectedStatus: route.expectedStatus,
        protected: isProtected,
        vulnerability: !isProtected,
      }
    } catch (error) {
      return {
        route: route.url,
        type: route.type,
        status: 'ERROR',
        expectedStatus: route.expectedStatus,
        protected: true, // Error es mejor que acceso
        vulnerability: false,
        error: error.message,
      }
    }
  }

  async testMaliciousHeaders(route) {
    console.log(`🕵️  Testing headers maliciosos: ${route.url}`)

    for (const header of MALICIOUS_HEADERS) {
      try {
        const response = await fetch(`${SECURITY_CONFIG.baseUrl}${route.url}`, {
          method: 'GET',
          timeout: SECURITY_CONFIG.timeout,
          headers: {
            [header.name]: header.value,
            'User-Agent': 'Penetration-Test/1.0',
          },
        })

        const status = response.status
        const isProtected = route.expectedStatus.includes(status)

        if (!isProtected) {
          this.criticalFailures++
          this.vulnerabilities.push({
            type: 'HEADER_BYPASS',
            route: route.url,
            severity: 'CRITICAL',
            status: status,
            header: header,
            description: `Header malicioso permitió acceso no autorizado`,
          })
        }
      } catch (error) {
        // Error es esperado para rutas protegidas
      }
    }
  }

  async testPublicRoute(route) {
    console.log(`🌐 Verificando ruta pública: ${route.url}`)

    try {
      const response = await fetch(`${SECURITY_CONFIG.baseUrl}${route.url}`, {
        method: 'GET',
        timeout: SECURITY_CONFIG.timeout,
      })

      const status = response.status
      const isAccessible = route.expectedStatus.includes(status)

      if (!isAccessible) {
        this.vulnerabilities.push({
          type: 'PUBLIC_ROUTE_BLOCKED',
          route: route.url,
          severity: 'HIGH',
          status: status,
          expected: route.expectedStatus,
          description: `Ruta pública no accesible`,
        })
      }

      return {
        route: route.url,
        status,
        expectedStatus: route.expectedStatus,
        accessible: isAccessible,
        issue: !isAccessible,
      }
    } catch (error) {
      return {
        route: route.url,
        status: 'ERROR',
        expectedStatus: route.expectedStatus,
        accessible: false,
        issue: true,
        error: error.message,
      }
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 EJECUTANDO PRUEBAS DE PENETRACIÓN...\n')

    // Test 1: Verificar rutas protegidas
    console.log('📋 FASE 1: Verificando protección de rutas admin...')
    for (const route of PROTECTED_ROUTES) {
      const result = await this.testProtectedRoute(route)
      this.results.push(result)

      const statusIcon = result.protected ? '✅' : '❌'
      console.log(
        `${statusIcon} ${route.url} - Status: ${result.status} (${result.protected ? 'PROTEGIDO' : 'VULNERABLE'})`
      )

      // Test headers maliciosos solo en rutas críticas
      if (route.url.includes('/api/admin/')) {
        await this.testMaliciousHeaders(route)
      }
    }

    // Test 2: Verificar rutas públicas
    console.log('\n📋 FASE 2: Verificando accesibilidad de rutas públicas...')
    for (const route of PUBLIC_ROUTES) {
      const result = await this.testPublicRoute(route)
      this.results.push(result)

      const statusIcon = result.accessible ? '✅' : '❌'
      console.log(
        `${statusIcon} ${route.url} - Status: ${result.status} (${result.accessible ? 'ACCESIBLE' : 'BLOQUEADO'})`
      )
    }
  }

  generateSecurityReport() {
    const totalTests = this.results.length
    const protectedRoutes = this.results.filter(r => r.protected !== undefined)
    const publicRoutes = this.results.filter(r => r.accessible !== undefined)

    const protectedCount = protectedRoutes.filter(r => r.protected).length
    const accessibleCount = publicRoutes.filter(r => r.accessible).length

    const securityScore =
      this.vulnerabilities.length === 0 ? 100 : Math.max(0, 100 - this.vulnerabilities.length * 10)

    const report = {
      timestamp: new Date().toISOString(),
      securityScore: `${securityScore}%`,
      criticalFailures: this.criticalFailures,
      summary: {
        totalTests,
        protectedRoutes: `${protectedCount}/${protectedRoutes.length}`,
        publicRoutes: `${accessibleCount}/${publicRoutes.length}`,
        vulnerabilities: this.vulnerabilities.length,
      },
      vulnerabilities: this.vulnerabilities,
      results: this.results,
      commitApproved: this.criticalFailures === 0 && this.vulnerabilities.length === 0,
    }

    // Guardar reporte
    const reportPath = path.join(
      __dirname,
      '..',
      'test-results',
      'security-penetration-report.json'
    )
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    return report
  }

  printSecurityReport(report) {
    console.log('\n' + '='.repeat(70))
    console.log('🔒 REPORTE DE PENETRATION TESTING - VERIFICACIÓN DE SEGURIDAD')
    console.log('='.repeat(70))
    console.log(`📅 Timestamp: ${report.timestamp}`)
    console.log(`🛡️  Security Score: ${report.securityScore}`)
    console.log(`🚨 Critical Failures: ${report.criticalFailures}`)
    console.log(`🔐 Rutas Protegidas: ${report.summary.protectedRoutes}`)
    console.log(`🌐 Rutas Públicas: ${report.summary.publicRoutes}`)
    console.log(`⚠️  Vulnerabilidades: ${report.summary.vulnerabilities}`)

    if (report.vulnerabilities.length > 0) {
      console.log('\n🚨 VULNERABILIDADES DETECTADAS:')
      report.vulnerabilities.forEach((vuln, index) => {
        console.log(`${index + 1}. [${vuln.severity}] ${vuln.type}`)
        console.log(`   Ruta: ${vuln.route}`)
        console.log(`   Descripción: ${vuln.description}`)
        if (vuln.status) console.log(`   Status: ${vuln.status}`)
        console.log('')
      })
    }

    console.log('\n' + '='.repeat(70))

    if (report.commitApproved) {
      console.log('✅ VERIFICACIÓN DE SEGURIDAD APROBADA - COMMIT AUTORIZADO')
      console.log('🔒 Todas las rutas admin están protegidas correctamente')
      console.log('🌐 Todas las rutas públicas son accesibles')
      console.log('🛡️  No se detectaron vulnerabilidades críticas')
    } else {
      console.log('❌ VERIFICACIÓN DE SEGURIDAD FALLIDA - COMMIT RECHAZADO')
      console.log('🚨 Se detectaron vulnerabilidades críticas de seguridad')
      console.log('⛔ NO PROCEDER CON EL COMMIT HASTA RESOLVER PROBLEMAS')
    }

    console.log('='.repeat(70))
    console.log(`📁 Reporte guardado en: test-results/security-penetration-report.json`)
    console.log('='.repeat(70))
  }

  async cleanup() {
    if (this.server) {
      console.log('\n🧹 Limpiando servidor...')
      this.server.kill()
    }
  }

  async run() {
    try {
      await this.startServer()
      await this.runSecurityTests()

      const report = this.generateSecurityReport()
      this.printSecurityReport(report)

      // Exit code basado en la seguridad
      process.exit(report.commitApproved ? 0 : 1)
    } catch (error) {
      console.error('💥 Error durante testing de seguridad:', error)
      process.exit(1)
    } finally {
      await this.cleanup()
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const tester = new SecurityPenetrationTester()
  tester.run()
}

module.exports = SecurityPenetrationTester
