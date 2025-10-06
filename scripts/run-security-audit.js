#!/usr/bin/env node

/**
 * Script de auditoría de seguridad completa
 * Ejecuta todos los análisis de seguridad y genera un reporte consolidado
 */

const { AuthLogAnalyzer } = require('./auth-log-analyzer')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ===================================
// CONFIGURACIÓN DE AUDITORÍA
// ===================================

const AUDIT_CONFIG = {
  outputDir: './security-reports',
  reportFormat: 'both', // 'json', 'text', 'both'
  includeRecommendations: true,

  // Módulos de auditoría a ejecutar
  modules: {
    authLogs: true,
    corsConfig: true,
    cspHeaders: true,
    dependencies: true,
    filePermissions: true,
    environmentVars: true,
  },
}

class SecurityAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: 0,
        passed: 0,
        warnings: 0,
        critical: 0,
      },
      modules: {},
    }

    this.ensureOutputDir()
  }

  /**
   * Ejecuta auditoría completa de seguridad
   */
  async runFullAudit() {
    console.log('🔒 INICIANDO AUDITORÍA DE SEGURIDAD COMPLETA')
    console.log('='.repeat(60))
    console.log(`Timestamp: ${this.results.timestamp}\n`)

    // Ejecutar módulos de auditoría
    if (AUDIT_CONFIG.modules.authLogs) {
      await this.auditAuthenticationLogs()
    }

    if (AUDIT_CONFIG.modules.corsConfig) {
      await this.auditCorsConfiguration()
    }

    if (AUDIT_CONFIG.modules.cspHeaders) {
      await this.auditCSPHeaders()
    }

    if (AUDIT_CONFIG.modules.dependencies) {
      await this.auditDependencies()
    }

    if (AUDIT_CONFIG.modules.filePermissions) {
      await this.auditFilePermissions()
    }

    if (AUDIT_CONFIG.modules.environmentVars) {
      await this.auditEnvironmentVariables()
    }

    // Generar reporte final
    await this.generateFinalReport()
  }

  /**
   * Audita logs de autenticación
   */
  async auditAuthenticationLogs() {
    console.log('🔍 Auditando logs de autenticación...')

    try {
      const analyzer = new AuthLogAnalyzer()
      await analyzer.analyzeLogs()

      this.results.modules.authLogs = {
        status: 'completed',
        findings: analyzer.suspiciousPatterns.length,
        severity: analyzer.suspiciousPatterns.some(p => p.severity === 'critical')
          ? 'critical'
          : analyzer.suspiciousPatterns.some(p => p.severity === 'high')
            ? 'high'
            : 'low',
        details: analyzer.suspiciousPatterns,
        stats: analyzer.stats,
      }

      this.updateSummary('authLogs', this.results.modules.authLogs.severity)
      console.log(
        `   ✅ Completado - ${analyzer.suspiciousPatterns.length} patrones sospechosos detectados\n`
      )
    } catch (error) {
      this.results.modules.authLogs = {
        status: 'error',
        error: error.message,
      }
      console.log(`   ❌ Error: ${error.message}\n`)
    }
  }

  /**
   * Audita configuración CORS
   */
  async auditCorsConfiguration() {
    console.log('🌐 Auditando configuración CORS...')

    const findings = []

    try {
      // Verificar si existe configuración centralizada
      const corsConfigPath = './src/lib/security/cors-config.ts'
      if (fs.existsSync(corsConfigPath)) {
        findings.push({
          type: 'good_practice',
          message: 'Configuración CORS centralizada encontrada',
          severity: 'info',
        })
      } else {
        findings.push({
          type: 'missing_config',
          message: 'No se encontró configuración CORS centralizada',
          severity: 'warning',
        })
      }

      // Buscar configuraciones CORS inseguras
      const apiDir = './src/app/api'
      if (fs.existsSync(apiDir)) {
        const insecureConfigs = this.findInsecureCorsConfigs(apiDir)

        insecureConfigs.forEach(config => {
          findings.push({
            type: 'insecure_cors',
            message: `CORS inseguro en ${config.file}: ${config.issue}`,
            severity: 'high',
            file: config.file,
          })
        })
      }

      const severity = findings.some(f => f.severity === 'high')
        ? 'high'
        : findings.some(f => f.severity === 'warning')
          ? 'warning'
          : 'low'

      this.results.modules.corsConfig = {
        status: 'completed',
        findings: findings.length,
        severity,
        details: findings,
      }

      this.updateSummary('corsConfig', severity)
      console.log(`   ✅ Completado - ${findings.length} hallazgos\n`)
    } catch (error) {
      this.results.modules.corsConfig = {
        status: 'error',
        error: error.message,
      }
      console.log(`   ❌ Error: ${error.message}\n`)
    }
  }

  /**
   * Audita headers CSP
   */
  async auditCSPHeaders() {
    console.log('🛡️  Auditando Content Security Policy...')

    const findings = []

    try {
      // Verificar middleware de seguridad
      const securityMiddlewarePath = './src/middleware/security.ts'
      if (fs.existsSync(securityMiddlewarePath)) {
        const content = fs.readFileSync(securityMiddlewarePath, 'utf8')

        // Verificar si usa nonces
        if (content.includes('generateNonces') && content.includes('buildStrictCSP')) {
          findings.push({
            type: 'good_practice',
            message: 'CSP con nonces implementado correctamente',
            severity: 'info',
          })
        } else if (content.includes('unsafe-inline') || content.includes('unsafe-eval')) {
          findings.push({
            type: 'insecure_csp',
            message: 'CSP contiene directivas inseguras (unsafe-inline/unsafe-eval)',
            severity: 'high',
          })
        }

        // Verificar si existe CSP
        if (content.includes('Content-Security-Policy')) {
          findings.push({
            type: 'csp_present',
            message: 'Content-Security-Policy configurado',
            severity: 'info',
          })
        } else {
          findings.push({
            type: 'missing_csp',
            message: 'Content-Security-Policy no encontrado',
            severity: 'critical',
          })
        }
      } else {
        findings.push({
          type: 'missing_middleware',
          message: 'Middleware de seguridad no encontrado',
          severity: 'critical',
        })
      }

      const severity = findings.some(f => f.severity === 'critical')
        ? 'critical'
        : findings.some(f => f.severity === 'high')
          ? 'high'
          : 'low'

      this.results.modules.cspHeaders = {
        status: 'completed',
        findings: findings.length,
        severity,
        details: findings,
      }

      this.updateSummary('cspHeaders', severity)
      console.log(`   ✅ Completado - ${findings.length} hallazgos\n`)
    } catch (error) {
      this.results.modules.cspHeaders = {
        status: 'error',
        error: error.message,
      }
      console.log(`   ❌ Error: ${error.message}\n`)
    }
  }

  /**
   * Audita dependencias
   */
  async auditDependencies() {
    console.log('📦 Auditando dependencias...')

    try {
      const findings = []

      // Verificar si existe package.json
      if (fs.existsSync('./package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))

        // Verificar dependencias de seguridad
        const securityDeps = ['helmet', 'cors', 'express-rate-limit', 'bcrypt']
        const missingSecurityDeps = securityDeps.filter(
          dep => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
        )

        missingSecurityDeps.forEach(dep => {
          findings.push({
            type: 'missing_security_dep',
            message: `Dependencia de seguridad recomendada no encontrada: ${dep}`,
            severity: 'warning',
          })
        })

        // Intentar ejecutar npm audit (si está disponible)
        try {
          const auditResult = execSync('npm audit --json', { encoding: 'utf8' })
          const audit = JSON.parse(auditResult)

          if (audit.vulnerabilities) {
            Object.entries(audit.vulnerabilities).forEach(([name, vuln]) => {
              findings.push({
                type: 'vulnerability',
                message: `Vulnerabilidad en ${name}: ${vuln.title}`,
                severity:
                  vuln.severity === 'critical'
                    ? 'critical'
                    : vuln.severity === 'high'
                      ? 'high'
                      : 'warning',
                package: name,
                details: vuln,
              })
            })
          }
        } catch (auditError) {
          findings.push({
            type: 'audit_unavailable',
            message: 'No se pudo ejecutar npm audit',
            severity: 'info',
          })
        }
      } else {
        findings.push({
          type: 'missing_package_json',
          message: 'package.json no encontrado',
          severity: 'warning',
        })
      }

      const severity = findings.some(f => f.severity === 'critical')
        ? 'critical'
        : findings.some(f => f.severity === 'high')
          ? 'high'
          : findings.some(f => f.severity === 'warning')
            ? 'warning'
            : 'low'

      this.results.modules.dependencies = {
        status: 'completed',
        findings: findings.length,
        severity,
        details: findings,
      }

      this.updateSummary('dependencies', severity)
      console.log(`   ✅ Completado - ${findings.length} hallazgos\n`)
    } catch (error) {
      this.results.modules.dependencies = {
        status: 'error',
        error: error.message,
      }
      console.log(`   ❌ Error: ${error.message}\n`)
    }
  }

  /**
   * Audita permisos de archivos
   */
  async auditFilePermissions() {
    console.log('📁 Auditando permisos de archivos...')

    const findings = []

    try {
      const sensitiveFiles = [
        '.env',
        '.env.local',
        '.env.production',
        'package.json',
        'next.config.js',
      ]

      sensitiveFiles.forEach(file => {
        if (fs.existsSync(file)) {
          try {
            const stats = fs.statSync(file)
            const mode = stats.mode

            // Verificar si el archivo es legible por otros (muy básico en Windows)
            findings.push({
              type: 'file_permissions',
              message: `Archivo sensible encontrado: ${file}`,
              severity: 'info',
              file,
            })
          } catch (statError) {
            findings.push({
              type: 'permission_check_failed',
              message: `No se pudieron verificar permisos de ${file}`,
              severity: 'warning',
              file,
            })
          }
        }
      })

      // Verificar archivos de configuración expuestos
      const exposedConfigs = [
        'src/config/database.ts',
        'src/config/secrets.ts',
        'config/production.json',
      ]

      exposedConfigs.forEach(file => {
        if (fs.existsSync(file)) {
          findings.push({
            type: 'exposed_config',
            message: `Archivo de configuración potencialmente expuesto: ${file}`,
            severity: 'warning',
            file,
          })
        }
      })

      const severity = findings.some(f => f.severity === 'high')
        ? 'high'
        : findings.some(f => f.severity === 'warning')
          ? 'warning'
          : 'low'

      this.results.modules.filePermissions = {
        status: 'completed',
        findings: findings.length,
        severity,
        details: findings,
      }

      this.updateSummary('filePermissions', severity)
      console.log(`   ✅ Completado - ${findings.length} hallazgos\n`)
    } catch (error) {
      this.results.modules.filePermissions = {
        status: 'error',
        error: error.message,
      }
      console.log(`   ❌ Error: ${error.message}\n`)
    }
  }

  /**
   * Audita variables de entorno
   */
  async auditEnvironmentVariables() {
    console.log('🔐 Auditando variables de entorno...')

    const findings = []

    try {
      // Verificar archivos .env
      const envFiles = ['.env', '.env.local', '.env.example']

      envFiles.forEach(file => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8')

          // Buscar posibles secretos hardcodeados
          const suspiciousPatterns = [
            /password\s*=\s*['"]\w+['"]/i,
            /secret\s*=\s*['"]\w+['"]/i,
            /key\s*=\s*['"]\w+['"]/i,
            /token\s*=\s*['"]\w+['"]/i,
          ]

          suspiciousPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              findings.push({
                type: 'hardcoded_secret',
                message: `Posible secreto hardcodeado en ${file}`,
                severity: 'high',
                file,
              })
            }
          })

          // Verificar variables requeridas
          const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']

          requiredVars.forEach(varName => {
            if (!content.includes(varName)) {
              findings.push({
                type: 'missing_env_var',
                message: `Variable de entorno requerida no encontrada: ${varName}`,
                severity: 'warning',
                variable: varName,
              })
            }
          })
        }
      })

      // Verificar si .env está en .gitignore
      if (fs.existsSync('.gitignore')) {
        const gitignore = fs.readFileSync('.gitignore', 'utf8')
        if (!gitignore.includes('.env')) {
          findings.push({
            type: 'env_not_ignored',
            message: 'Archivos .env no están en .gitignore',
            severity: 'critical',
          })
        }
      }

      const severity = findings.some(f => f.severity === 'critical')
        ? 'critical'
        : findings.some(f => f.severity === 'high')
          ? 'high'
          : findings.some(f => f.severity === 'warning')
            ? 'warning'
            : 'low'

      this.results.modules.environmentVars = {
        status: 'completed',
        findings: findings.length,
        severity,
        details: findings,
      }

      this.updateSummary('environmentVars', severity)
      console.log(`   ✅ Completado - ${findings.length} hallazgos\n`)
    } catch (error) {
      this.results.modules.environmentVars = {
        status: 'error',
        error: error.message,
      }
      console.log(`   ❌ Error: ${error.message}\n`)
    }
  }

  /**
   * Busca configuraciones CORS inseguras
   */
  findInsecureCorsConfigs(dir) {
    const insecureConfigs = []

    const scanDirectory = directory => {
      const files = fs.readdirSync(directory)

      files.forEach(file => {
        const filePath = path.join(directory, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
          scanDirectory(filePath)
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
          const content = fs.readFileSync(filePath, 'utf8')

          // Buscar CORS inseguro
          if (content.includes('Access-Control-Allow-Origin: *')) {
            insecureConfigs.push({
              file: filePath,
              issue: 'Permite cualquier origen (*)',
            })
          }

          if (content.includes('credentials: true') && content.includes('*')) {
            insecureConfigs.push({
              file: filePath,
              issue: 'Credentials habilitado con origen wildcard',
            })
          }
        }
      })
    }

    scanDirectory(dir)
    return insecureConfigs
  }

  /**
   * Actualiza resumen de auditoría
   */
  updateSummary(module, severity) {
    this.results.summary.totalChecks++

    switch (severity) {
      case 'critical':
        this.results.summary.critical++
        break
      case 'high':
      case 'warning':
        this.results.summary.warnings++
        break
      default:
        this.results.summary.passed++
    }
  }

  /**
   * Asegura que existe el directorio de reportes
   */
  ensureOutputDir() {
    if (!fs.existsSync(AUDIT_CONFIG.outputDir)) {
      fs.mkdirSync(AUDIT_CONFIG.outputDir, { recursive: true })
    }
  }

  /**
   * Genera reporte final
   */
  async generateFinalReport() {
    console.log('📋 GENERANDO REPORTE FINAL...\n')

    // Reporte en consola
    this.printConsoleSummary()

    // Guardar reportes en archivos
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    if (AUDIT_CONFIG.reportFormat === 'json' || AUDIT_CONFIG.reportFormat === 'both') {
      const jsonPath = path.join(AUDIT_CONFIG.outputDir, `security-audit-${timestamp}.json`)
      fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2))
      console.log(`📄 Reporte JSON guardado: ${jsonPath}`)
    }

    if (AUDIT_CONFIG.reportFormat === 'text' || AUDIT_CONFIG.reportFormat === 'both') {
      const textPath = path.join(AUDIT_CONFIG.outputDir, `security-audit-${timestamp}.txt`)
      fs.writeFileSync(textPath, this.generateTextReport())
      console.log(`📄 Reporte de texto guardado: ${textPath}`)
    }

    console.log('\n✅ AUDITORÍA DE SEGURIDAD COMPLETADA')
  }

  /**
   * Imprime resumen en consola
   */
  printConsoleSummary() {
    console.log('📊 RESUMEN DE AUDITORÍA DE SEGURIDAD')
    console.log('='.repeat(50))
    console.log(`Total de verificaciones: ${this.results.summary.totalChecks}`)
    console.log(`✅ Pasadas: ${this.results.summary.passed}`)
    console.log(`⚠️  Advertencias: ${this.results.summary.warnings}`)
    console.log(`🚨 Críticas: ${this.results.summary.critical}`)

    console.log('\n📋 ESTADO POR MÓDULO:')
    Object.entries(this.results.modules).forEach(([module, result]) => {
      const status = result.status === 'completed' ? '✅' : '❌'
      const severity = result.severity || 'unknown'
      console.log(`   ${status} ${module}: ${result.findings || 0} hallazgos (${severity})`)
    })

    if (AUDIT_CONFIG.includeRecommendations) {
      console.log('\n💡 RECOMENDACIONES PRINCIPALES:')

      if (this.results.summary.critical > 0) {
        console.log('   🚨 CRÍTICO: Resolver inmediatamente los problemas críticos')
      }

      if (this.results.summary.warnings > 0) {
        console.log('   ⚠️  Revisar y corregir las advertencias de seguridad')
      }

      console.log('   📅 Ejecutar esta auditoría regularmente')
      console.log('   🔄 Mantener dependencias actualizadas')
      console.log('   📝 Documentar cambios de seguridad')
    }
  }

  /**
   * Genera reporte en formato texto
   */
  generateTextReport() {
    let report = 'REPORTE DE AUDITORÍA DE SEGURIDAD\n'
    report += '='.repeat(50) + '\n'
    report += `Fecha: ${this.results.timestamp}\n\n`

    report += 'RESUMEN:\n'
    report += `Total de verificaciones: ${this.results.summary.totalChecks}\n`
    report += `Pasadas: ${this.results.summary.passed}\n`
    report += `Advertencias: ${this.results.summary.warnings}\n`
    report += `Críticas: ${this.results.summary.critical}\n\n`

    report += 'DETALLES POR MÓDULO:\n'
    Object.entries(this.results.modules).forEach(([module, result]) => {
      report += `\n${module.toUpperCase()}:\n`
      report += `Estado: ${result.status}\n`
      report += `Hallazgos: ${result.findings || 0}\n`
      report += `Severidad: ${result.severity || 'N/A'}\n`

      if (result.details && result.details.length > 0) {
        report += 'Detalles:\n'
        result.details.forEach((detail, index) => {
          report += `  ${index + 1}. ${detail.message} (${detail.severity})\n`
        })
      }
    })

    return report
  }
}

// ===================================
// EJECUCIÓN
// ===================================

async function main() {
  const auditor = new SecurityAuditor()
  await auditor.runFullAudit()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { SecurityAuditor, AUDIT_CONFIG }
