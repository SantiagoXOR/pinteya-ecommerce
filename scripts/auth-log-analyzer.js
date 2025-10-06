#!/usr/bin/env node

/**
 * Analizador de logs de autenticación
 * Detecta patrones sospechosos en intentos de login y actividad de usuarios
 */

const fs = require('fs')
const path = require('path')

// ===================================
// CONFIGURACIÓN
// ===================================

const CONFIG = {
  // Umbrales de detección
  maxFailedAttempts: 5,
  suspiciousTimeWindow: 300000, // 5 minutos en ms
  maxLoginFrequency: 10, // máximo 10 logins por minuto

  // Patrones sospechosos
  suspiciousUserAgents: ['curl', 'wget', 'python', 'bot', 'crawler', 'scanner'],

  // IPs conocidas como problemáticas (ejemplo)
  knownBadIPs: [
    '192.168.1.100', // IP de ejemplo
  ],

  // Archivos de log (ajustar según tu configuración)
  logPaths: ['./logs/auth.log', './logs/security.log', './logs/application.log'],
}

// ===================================
// TIPOS DE ANÁLISIS
// ===================================

class AuthLogAnalyzer {
  constructor() {
    this.events = []
    this.suspiciousPatterns = []
    this.stats = {
      totalEvents: 0,
      failedLogins: 0,
      successfulLogins: 0,
      suspiciousEvents: 0,
      uniqueIPs: new Set(),
      uniqueUsers: new Set(),
    }
  }

  /**
   * Analiza logs de autenticación desde archivos
   */
  async analyzeLogs() {
    console.log('🔍 Iniciando análisis de logs de autenticación...\n')

    // Leer logs desde archivos
    await this.readLogFiles()

    // Analizar patrones sospechosos
    this.detectSuspiciousPatterns()

    // Generar reporte
    this.generateReport()
  }

  /**
   * Lee archivos de log disponibles
   */
  async readLogFiles() {
    for (const logPath of CONFIG.logPaths) {
      if (fs.existsSync(logPath)) {
        console.log(`📖 Leyendo: ${logPath}`)
        const content = fs.readFileSync(logPath, 'utf8')
        this.parseLogContent(content, logPath)
      } else {
        console.log(`⚠️  Archivo no encontrado: ${logPath}`)
      }
    }

    // Si no hay logs de archivos, generar datos de ejemplo para demostración
    if (this.events.length === 0) {
      console.log('📝 Generando datos de ejemplo para demostración...')
      this.generateSampleData()
    }
  }

  /**
   * Parsea contenido de logs
   */
  parseLogContent(content, source) {
    const lines = content.split('\n')

    lines.forEach(line => {
      if (line.trim()) {
        const event = this.parseLogLine(line, source)
        if (event) {
          this.events.push(event)
          this.updateStats(event)
        }
      }
    })
  }

  /**
   * Parsea una línea de log individual
   */
  parseLogLine(line, source) {
    // Intentar parsear diferentes formatos de log

    // Formato JSON
    try {
      const jsonEvent = JSON.parse(line)
      if (jsonEvent.level && jsonEvent.message) {
        return {
          timestamp: new Date(jsonEvent.timestamp || Date.now()),
          level: jsonEvent.level,
          message: jsonEvent.message,
          ip: jsonEvent.ip || 'unknown',
          userAgent: jsonEvent.userAgent || 'unknown',
          userId: jsonEvent.userId,
          source,
          raw: line,
        }
      }
    } catch (e) {
      // No es JSON, continuar con otros formatos
    }

    // Formato de texto simple (buscar patrones comunes)
    const patterns = [
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/, // timestamp ISO
      /(ERROR|WARN|INFO|DEBUG)/, // level
      /(login|auth|authentication|failed|success)/i, // keywords
      /ip[:\s]+([0-9.]+)/i, // IP
      /user[:\s]+([a-zA-Z0-9@._-]+)/i, // user
    ]

    const timestampMatch = line.match(patterns[0])
    const levelMatch = line.match(patterns[1])
    const authMatch = line.match(patterns[2])
    const ipMatch = line.match(patterns[3])
    const userMatch = line.match(patterns[4])

    if (authMatch) {
      return {
        timestamp: timestampMatch ? new Date(timestampMatch[1]) : new Date(),
        level: levelMatch ? levelMatch[1] : 'INFO',
        message: line,
        ip: ipMatch ? ipMatch[1] : 'unknown',
        userAgent: 'unknown',
        userId: userMatch ? userMatch[1] : undefined,
        source,
        raw: line,
      }
    }

    return null
  }

  /**
   * Actualiza estadísticas
   */
  updateStats(event) {
    this.stats.totalEvents++

    if (event.message.toLowerCase().includes('failed')) {
      this.stats.failedLogins++
    } else if (event.message.toLowerCase().includes('success')) {
      this.stats.successfulLogins++
    }

    if (event.ip !== 'unknown') {
      this.stats.uniqueIPs.add(event.ip)
    }

    if (event.userId) {
      this.stats.uniqueUsers.add(event.userId)
    }
  }

  /**
   * Detecta patrones sospechosos
   */
  detectSuspiciousPatterns() {
    console.log('🕵️  Detectando patrones sospechosos...\n')

    // Agrupar eventos por IP
    const eventsByIP = this.groupEventsByIP()

    // Detectar múltiples fallos de login
    this.detectBruteForceAttempts(eventsByIP)

    // Detectar logins desde IPs sospechosas
    this.detectSuspiciousIPs()

    // Detectar user agents sospechosos
    this.detectSuspiciousUserAgents()

    // Detectar actividad inusual por tiempo
    this.detectUnusualTimePatterns()

    // Detectar múltiples cuentas desde misma IP
    this.detectMultipleAccountsFromSameIP(eventsByIP)
  }

  /**
   * Agrupa eventos por IP
   */
  groupEventsByIP() {
    const grouped = {}

    this.events.forEach(event => {
      if (!grouped[event.ip]) {
        grouped[event.ip] = []
      }
      grouped[event.ip].push(event)
    })

    return grouped
  }

  /**
   * Detecta intentos de fuerza bruta
   */
  detectBruteForceAttempts(eventsByIP) {
    Object.entries(eventsByIP).forEach(([ip, events]) => {
      const failedEvents = events.filter(e => e.message.toLowerCase().includes('failed'))

      if (failedEvents.length >= CONFIG.maxFailedAttempts) {
        // Verificar si están en ventana de tiempo sospechosa
        const timeWindow = this.getTimeWindow(failedEvents)

        if (timeWindow <= CONFIG.suspiciousTimeWindow) {
          this.suspiciousPatterns.push({
            type: 'brute_force',
            severity: 'high',
            ip,
            description: `${failedEvents.length} intentos fallidos de login desde ${ip} en ${Math.round(timeWindow / 1000)} segundos`,
            events: failedEvents.length,
            timeWindow: Math.round(timeWindow / 1000),
          })

          this.stats.suspiciousEvents++
        }
      }
    })
  }

  /**
   * Detecta IPs sospechosas
   */
  detectSuspiciousIPs() {
    this.events.forEach(event => {
      if (CONFIG.knownBadIPs.includes(event.ip)) {
        this.suspiciousPatterns.push({
          type: 'known_bad_ip',
          severity: 'critical',
          ip: event.ip,
          description: `Actividad desde IP conocida como maliciosa: ${event.ip}`,
          timestamp: event.timestamp,
        })

        this.stats.suspiciousEvents++
      }
    })
  }

  /**
   * Detecta user agents sospechosos
   */
  detectSuspiciousUserAgents() {
    this.events.forEach(event => {
      const userAgent = event.userAgent.toLowerCase()

      CONFIG.suspiciousUserAgents.forEach(suspicious => {
        if (userAgent.includes(suspicious)) {
          this.suspiciousPatterns.push({
            type: 'suspicious_user_agent',
            severity: 'medium',
            ip: event.ip,
            description: `User-Agent sospechoso detectado: ${suspicious}`,
            userAgent: event.userAgent,
            timestamp: event.timestamp,
          })

          this.stats.suspiciousEvents++
        }
      })
    })
  }

  /**
   * Detecta patrones de tiempo inusuales
   */
  detectUnusualTimePatterns() {
    // Detectar logins fuera de horario laboral (ejemplo: 2AM - 6AM)
    this.events.forEach(event => {
      const hour = event.timestamp.getHours()

      if (hour >= 2 && hour <= 6) {
        this.suspiciousPatterns.push({
          type: 'unusual_time',
          severity: 'low',
          ip: event.ip,
          description: `Login fuera de horario laboral: ${event.timestamp.toLocaleString()}`,
          timestamp: event.timestamp,
          hour,
        })
      }
    })
  }

  /**
   * Detecta múltiples cuentas desde la misma IP
   */
  detectMultipleAccountsFromSameIP(eventsByIP) {
    Object.entries(eventsByIP).forEach(([ip, events]) => {
      const uniqueUsers = new Set()

      events.forEach(event => {
        if (event.userId) {
          uniqueUsers.add(event.userId)
        }
      })

      if (uniqueUsers.size > 3) {
        // Más de 3 usuarios diferentes
        this.suspiciousPatterns.push({
          type: 'multiple_accounts',
          severity: 'medium',
          ip,
          description: `${uniqueUsers.size} cuentas diferentes accediendo desde ${ip}`,
          userCount: uniqueUsers.size,
          users: Array.from(uniqueUsers),
        })

        this.stats.suspiciousEvents++
      }
    })
  }

  /**
   * Calcula ventana de tiempo entre eventos
   */
  getTimeWindow(events) {
    if (events.length < 2) return 0

    const timestamps = events.map(e => e.timestamp.getTime()).sort()
    return timestamps[timestamps.length - 1] - timestamps[0]
  }

  /**
   * Genera datos de ejemplo para demostración
   */
  generateSampleData() {
    const sampleEvents = [
      {
        timestamp: new Date(Date.now() - 3600000),
        level: 'ERROR',
        message: 'Authentication failed for user admin',
        ip: '192.168.1.100',
        userAgent: 'curl/7.68.0',
        userId: 'admin',
        source: 'sample',
      },
      {
        timestamp: new Date(Date.now() - 3500000),
        level: 'ERROR',
        message: 'Authentication failed for user admin',
        ip: '192.168.1.100',
        userAgent: 'curl/7.68.0',
        userId: 'admin',
        source: 'sample',
      },
      {
        timestamp: new Date(Date.now() - 1800000),
        level: 'INFO',
        message: 'User login successful',
        ip: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        userId: 'user@example.com',
        source: 'sample',
      },
    ]

    sampleEvents.forEach(event => {
      this.events.push(event)
      this.updateStats(event)
    })
  }

  /**
   * Genera reporte final
   */
  generateReport() {
    console.log('📊 REPORTE DE ANÁLISIS DE AUTENTICACIÓN')
    console.log('='.repeat(50))

    // Estadísticas generales
    console.log('\n📈 ESTADÍSTICAS GENERALES:')
    console.log(`   Total de eventos: ${this.stats.totalEvents}`)
    console.log(`   Logins exitosos: ${this.stats.successfulLogins}`)
    console.log(`   Logins fallidos: ${this.stats.failedLogins}`)
    console.log(`   IPs únicas: ${this.stats.uniqueIPs.size}`)
    console.log(`   Usuarios únicos: ${this.stats.uniqueUsers.size}`)
    console.log(`   Eventos sospechosos: ${this.stats.suspiciousEvents}`)

    // Patrones sospechosos
    if (this.suspiciousPatterns.length > 0) {
      console.log('\n🚨 PATRONES SOSPECHOSOS DETECTADOS:')

      this.suspiciousPatterns.forEach((pattern, index) => {
        console.log(`\n   ${index + 1}. ${pattern.type.toUpperCase()} (${pattern.severity})`)
        console.log(`      ${pattern.description}`)
        if (pattern.ip) console.log(`      IP: ${pattern.ip}`)
        if (pattern.timestamp) console.log(`      Tiempo: ${pattern.timestamp.toLocaleString()}`)
      })
    } else {
      console.log('\n✅ No se detectaron patrones sospechosos')
    }

    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:')

    if (this.stats.failedLogins > this.stats.successfulLogins) {
      console.log('   - Alto número de logins fallidos. Considerar implementar CAPTCHA')
    }

    if (this.suspiciousPatterns.some(p => p.type === 'brute_force')) {
      console.log('   - Detectados intentos de fuerza bruta. Implementar rate limiting')
    }

    if (this.suspiciousPatterns.some(p => p.type === 'known_bad_ip')) {
      console.log('   - Actividad desde IPs maliciosas. Considerar bloqueo automático')
    }

    console.log('   - Revisar logs regularmente')
    console.log('   - Mantener actualizada la lista de IPs sospechosas')
    console.log('   - Configurar alertas automáticas para eventos críticos')

    console.log('\n✅ Análisis completado')
  }
}

// ===================================
// EJECUCIÓN
// ===================================

async function main() {
  const analyzer = new AuthLogAnalyzer()
  await analyzer.analyzeLogs()
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { AuthLogAnalyzer, CONFIG }
