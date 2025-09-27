// ===================================
// PINTEYA E-COMMERCE - SECURITY LOGGER
// ===================================

import { logger, LogCategory, LogLevel } from './enterprise/logger'

/**
 * Tipos de eventos de seguridad
 */
export enum SecurityEventType {
  AUTHENTICATION_SUCCESS = 'auth_success',
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHORIZATION_DENIED = 'auth_denied',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  SECURITY_VIOLATION = 'security_violation',
  PAYMENT_FRAUD_ATTEMPT = 'payment_fraud_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  SESSION_HIJACK_ATTEMPT = 'session_hijack_attempt',
  API_ABUSE = 'api_abuse',
  WEBHOOK_VALIDATION_FAILURE = 'webhook_validation_failure',
  ENCRYPTION_FAILURE = 'encryption_failure',
  COMPLIANCE_VIOLATION = 'compliance_violation',
}

/**
 * Severidad de eventos de seguridad
 */
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Contexto de seguridad
 */
export interface SecurityContext {
  // Información del usuario
  userId?: string
  userEmail?: string
  userRole?: string
  sessionId?: string

  // Información de la request
  ip?: string
  userAgent?: string
  method?: string
  endpoint?: string
  headers?: Record<string, string>

  // Información geográfica
  country?: string
  region?: string
  city?: string

  // Información del dispositivo
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'unknown'
  browser?: string
  os?: string

  // Información adicional
  referrer?: string
  timestamp?: number
  requestId?: string

  // Datos específicos del evento
  resource?: string
  action?: string
  targetUserId?: string
  dataType?: string
  recordCount?: number

  // Información de seguridad
  riskScore?: number
  threatLevel?: SecuritySeverity
  mitigationApplied?: string[]

  // Metadatos adicionales
  metadata?: Record<string, any>
}

/**
 * Evento de seguridad
 */
export interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: SecuritySeverity
  message: string
  context: SecurityContext
  timestamp: number
  source: string
  tags: string[]
}

/**
 * Configuración del logger de seguridad
 */
export interface SecurityLoggerConfig {
  enabled: boolean
  logLevel: SecuritySeverity
  includeStackTrace: boolean
  maskSensitiveData: boolean
  alertOnCritical: boolean
  persistToDatabase: boolean
  exportToSIEM: boolean
  retentionDays: number
}

/**
 * Configuración por defecto
 */
const DEFAULT_CONFIG: SecurityLoggerConfig = {
  enabled: true,
  logLevel: SecuritySeverity.LOW,
  includeStackTrace: false,
  maskSensitiveData: true,
  alertOnCritical: true,
  persistToDatabase: true,
  exportToSIEM: false,
  retentionDays: 90,
}

/**
 * Datos sensibles que deben ser enmascarados
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'ssn',
  'phone',
  'email',
  'address',
]

/**
 * Logger de seguridad especializado
 */
export class SecurityLogger {
  private static instance: SecurityLogger
  private config: SecurityLoggerConfig
  private eventBuffer: SecurityEvent[] = []
  private flushInterval?: NodeJS.Timeout

  private constructor(config: Partial<SecurityLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startPeriodicFlush()
  }

  static getInstance(config?: Partial<SecurityLoggerConfig>): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger(config)
    }
    return SecurityLogger.instance
  }

  /**
   * Registra un evento de seguridad
   */
  logSecurityEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    message: string,
    context: SecurityContext = {},
    source: string = 'api',
    tags: string[] = []
  ): void {
    if (!this.config.enabled) {
      return
    }

    // Verificar si el nivel de severidad cumple el umbral
    if (!this.shouldLog(severity)) {
      return
    }

    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      message,
      context: this.sanitizeContext(context),
      timestamp: Date.now(),
      source,
      tags: [...tags, 'security', severity, type],
    }

    // Agregar al buffer
    this.eventBuffer.push(event)

    // Log inmediato para eventos críticos
    if (severity === SecuritySeverity.CRITICAL) {
      this.logImmediate(event)

      if (this.config.alertOnCritical) {
        this.triggerCriticalAlert(event)
      }
    }

    // Log normal para otros eventos
    this.logToConsole(event)
  }

  /**
   * Logs específicos por tipo de evento
   */

  /**
   * Log de autenticación exitosa
   */
  logAuthenticationSuccess(context: SecurityContext): void {
    this.logSecurityEvent(
      SecurityEventType.AUTHENTICATION_SUCCESS,
      SecuritySeverity.LOW,
      `Usuario autenticado exitosamente: ${context.userEmail || context.userId}`,
      context,
      'auth',
      ['authentication', 'success']
    )
  }

  /**
   * Log de fallo de autenticación
   */
  logAuthenticationFailure(context: SecurityContext, reason: string = 'Invalid credentials'): void {
    this.logSecurityEvent(
      SecurityEventType.AUTHENTICATION_FAILURE,
      SecuritySeverity.MEDIUM,
      `Fallo de autenticación: ${reason}`,
      { ...context, failureReason: reason },
      'auth',
      ['authentication', 'failure']
    )
  }

  /**
   * Log de acceso denegado
   */
  logAuthorizationDenied(context: SecurityContext, resource: string, action: string): void {
    this.logSecurityEvent(
      SecurityEventType.AUTHORIZATION_DENIED,
      SecuritySeverity.MEDIUM,
      `Acceso denegado a recurso: ${resource} (acción: ${action})`,
      { ...context, resource, action },
      'auth',
      ['authorization', 'denied', resource]
    )
  }

  /**
   * Log de rate limiting
   */
  logRateLimitExceeded(context: SecurityContext, limit: number, window: string): void {
    this.logSecurityEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecuritySeverity.MEDIUM,
      `Rate limit excedido: ${limit} requests en ${window}`,
      { ...context, rateLimit: limit, timeWindow: window },
      'rate-limiter',
      ['rate-limit', 'exceeded']
    )
  }

  /**
   * Log de actividad sospechosa
   */
  logSuspiciousActivity(context: SecurityContext, description: string, riskScore: number): void {
    const severity =
      riskScore >= 80
        ? SecuritySeverity.CRITICAL
        : riskScore >= 60
          ? SecuritySeverity.HIGH
          : riskScore >= 40
            ? SecuritySeverity.MEDIUM
            : SecuritySeverity.LOW

    this.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity,
      `Actividad sospechosa detectada: ${description}`,
      { ...context, riskScore, description },
      'security-monitor',
      ['suspicious', 'activity', `risk-${Math.floor(riskScore / 20) * 20}`]
    )
  }

  /**
   * Log de acceso a datos sensibles
   */
  logDataAccess(context: SecurityContext, dataType: string, recordCount: number = 1): void {
    this.logSecurityEvent(
      SecurityEventType.DATA_ACCESS,
      SecuritySeverity.LOW,
      `Acceso a datos: ${dataType} (${recordCount} registros)`,
      { ...context, dataType, recordCount },
      'data-access',
      ['data', 'access', dataType]
    )
  }

  /**
   * Log de modificación de datos
   */
  logDataModification(
    context: SecurityContext,
    dataType: string,
    action: string,
    recordCount: number = 1
  ): void {
    this.logSecurityEvent(
      SecurityEventType.DATA_MODIFICATION,
      SecuritySeverity.MEDIUM,
      `Modificación de datos: ${action} en ${dataType} (${recordCount} registros)`,
      { ...context, dataType, action, recordCount },
      'data-modification',
      ['data', 'modification', action, dataType]
    )
  }

  /**
   * Log de intento de fraude en pagos
   */
  logPaymentFraudAttempt(context: SecurityContext, reason: string, amount?: number): void {
    this.logSecurityEvent(
      SecurityEventType.PAYMENT_FRAUD_ATTEMPT,
      SecuritySeverity.CRITICAL,
      `Intento de fraude en pago detectado: ${reason}`,
      { ...context, fraudReason: reason, amount },
      'payment-security',
      ['payment', 'fraud', 'attempt']
    )
  }

  /**
   * Log de intento de inyección SQL
   */
  logSQLInjectionAttempt(context: SecurityContext, query: string): void {
    this.logSecurityEvent(
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecuritySeverity.HIGH,
      'Intento de inyección SQL detectado',
      { ...context, suspiciousQuery: this.maskSensitiveData(query) },
      'sql-security',
      ['sql', 'injection', 'attempt']
    )
  }

  /**
   * Log de intento XSS
   */
  logXSSAttempt(context: SecurityContext, payload: string): void {
    this.logSecurityEvent(
      SecurityEventType.XSS_ATTEMPT,
      SecuritySeverity.HIGH,
      'Intento de XSS detectado',
      { ...context, xssPayload: this.maskSensitiveData(payload) },
      'xss-security',
      ['xss', 'attempt']
    )
  }

  /**
   * Log de fallo de validación de webhook
   */
  logWebhookValidationFailure(context: SecurityContext, provider: string, reason: string): void {
    this.logSecurityEvent(
      SecurityEventType.WEBHOOK_VALIDATION_FAILURE,
      SecuritySeverity.HIGH,
      `Fallo de validación de webhook de ${provider}: ${reason}`,
      { ...context, provider, validationFailure: reason },
      'webhook-security',
      ['webhook', 'validation', 'failure', provider]
    )
  }

  /**
   * Log de abuso de API
   */
  logAPIAbuse(context: SecurityContext, pattern: string, frequency: number): void {
    this.logSecurityEvent(
      SecurityEventType.API_ABUSE,
      SecuritySeverity.HIGH,
      `Abuso de API detectado: ${pattern} (${frequency} veces)`,
      { ...context, abusePattern: pattern, frequency },
      'api-security',
      ['api', 'abuse', pattern]
    )
  }

  /**
   * Métodos auxiliares
   */

  /**
   * Verifica si debe registrar el evento según la configuración
   */
  private shouldLog(severity: SecuritySeverity): boolean {
    const severityLevels = {
      [SecuritySeverity.LOW]: 0,
      [SecuritySeverity.MEDIUM]: 1,
      [SecuritySeverity.HIGH]: 2,
      [SecuritySeverity.CRITICAL]: 3,
    }

    return severityLevels[severity] >= severityLevels[this.config.logLevel]
  }

  /**
   * Sanitiza el contexto removiendo datos sensibles
   */
  private sanitizeContext(context: SecurityContext): SecurityContext {
    if (!this.config.maskSensitiveData) {
      return context
    }

    const sanitized = { ...context }

    // Enmascarar headers sensibles
    if (sanitized.headers) {
      sanitized.headers = this.maskSensitiveHeaders(sanitized.headers)
    }

    // Enmascarar metadata sensible
    if (sanitized.metadata) {
      sanitized.metadata = this.maskSensitiveData(sanitized.metadata)
    }

    // Enmascarar email parcialmente
    if (sanitized.userEmail) {
      sanitized.userEmail = this.maskEmail(sanitized.userEmail)
    }

    return sanitized
  }

  /**
   * Enmascara headers sensibles
   */
  private maskSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
    const masked = { ...headers }

    Object.keys(masked).forEach(key => {
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
        masked[key] = '***MASKED***'
      }
    })

    return masked
  }

  /**
   * Enmascara datos sensibles en objetos
   */
  private maskSensitiveData(data: any): any {
    if (typeof data === 'string') {
      return data.length > 100 ? data.substring(0, 100) + '...' : data
    }

    if (typeof data !== 'object' || data === null) {
      return data
    }

    const masked = Array.isArray(data) ? [...data] : { ...data }

    Object.keys(masked).forEach(key => {
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
        masked[key] = '***MASKED***'
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key])
      }
    })

    return masked
  }

  /**
   * Enmascara email parcialmente
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!domain) {
      return '***MASKED***'
    }

    const maskedLocal = local.length > 2 ? local.substring(0, 2) + '***' : '***'

    return `${maskedLocal}@${domain}`
  }

  /**
   * Log inmediato para eventos críticos
   */
  private logImmediate(event: SecurityEvent): void {
    logger.error(
      LogLevel.ERROR,
      `SECURITY CRITICAL: ${event.message}`,
      event.context,
      LogCategory.SECURITY
    )
  }

  /**
   * Log a consola
   */
  private logToConsole(event: SecurityEvent): void {
    const logLevel = this.getLogLevel(event.severity)
    logger.log(logLevel, `SECURITY: ${event.message}`, event.context, LogCategory.SECURITY)
  }

  /**
   * Convierte severidad de seguridad a nivel de log
   */
  private getLogLevel(severity: SecuritySeverity): LogLevel {
    switch (severity) {
      case SecuritySeverity.LOW:
        return LogLevel.INFO
      case SecuritySeverity.MEDIUM:
        return LogLevel.WARN
      case SecuritySeverity.HIGH:
        return LogLevel.ERROR
      case SecuritySeverity.CRITICAL:
        return LogLevel.ERROR
      default:
        return LogLevel.INFO
    }
  }

  /**
   * Dispara alerta crítica
   */
  private triggerCriticalAlert(event: SecurityEvent): void {
    // En implementación real, enviar a sistema de alertas
    console.error('🚨 CRITICAL SECURITY ALERT 🚨', {
      type: event.type,
      message: event.message,
      timestamp: new Date(event.timestamp).toISOString(),
      context: event.context,
    })
  }

  /**
   * Genera ID único para evento
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Inicia flush periódico del buffer
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushBuffer()
    }, 60000) // Cada minuto
  }

  /**
   * Flush del buffer de eventos
   */
  private flushBuffer(): void {
    if (this.eventBuffer.length === 0) {
      return
    }

    // En implementación real, persistir en base de datos o SIEM
    logger.info(
      LogLevel.INFO,
      `Flushing ${this.eventBuffer.length} security events`,
      {
        eventCount: this.eventBuffer.length,
      },
      LogCategory.SECURITY
    )

    this.eventBuffer = []
  }

  /**
   * Obtiene estadísticas de seguridad
   */
  getSecurityStats(): {
    totalEvents: number
    eventsBySeverity: Record<SecuritySeverity, number>
    eventsByType: Record<SecurityEventType, number>
    recentEvents: SecurityEvent[]
  } {
    const eventsBySeverity = this.eventBuffer.reduce(
      (acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1
        return acc
      },
      {} as Record<SecuritySeverity, number>
    )

    const eventsByType = this.eventBuffer.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1
        return acc
      },
      {} as Record<SecurityEventType, number>
    )

    return {
      totalEvents: this.eventBuffer.length,
      eventsBySeverity,
      eventsByType,
      recentEvents: this.eventBuffer.slice(-10),
    }
  }

  /**
   * Destructor
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushBuffer()
  }
}

// Instancia singleton
export const securityLogger = SecurityLogger.getInstance()

/**
 * Utilidades para logging de seguridad
 */
export const SecurityLogUtils = {
  /**
   * Extrae contexto de seguridad de una request
   */
  extractSecurityContext(request: any): SecurityContext {
    const headers = request.headers || {}
    const userAgent = headers['user-agent'] || ''

    return {
      ip: headers['x-forwarded-for'] || headers['x-real-ip'] || request.ip,
      userAgent,
      method: request.method,
      endpoint: request.url,
      referrer: headers.referer || headers.referrer,
      timestamp: Date.now(),
      requestId: headers['x-request-id'],
      deviceType: this.detectDeviceType(userAgent),
      browser: this.extractBrowser(userAgent),
      headers: this.sanitizeHeaders(headers),
    }
  },

  /**
   * Detecta tipo de dispositivo
   */
  detectDeviceType(userAgent: string): SecurityContext['deviceType'] {
    if (/mobile|android|iphone/i.test(userAgent)) {
      return 'mobile'
    }
    if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet'
    }
    if (/desktop|windows|mac|linux/i.test(userAgent)) {
      return 'desktop'
    }
    return 'unknown'
  },

  /**
   * Extrae información del navegador
   */
  extractBrowser(userAgent: string): string {
    if (/chrome/i.test(userAgent)) {
      return 'Chrome'
    }
    if (/firefox/i.test(userAgent)) {
      return 'Firefox'
    }
    if (/safari/i.test(userAgent)) {
      return 'Safari'
    }
    if (/edge/i.test(userAgent)) {
      return 'Edge'
    }
    return 'Unknown'
  },

  /**
   * Sanitiza headers para logging
   */
  sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {}

    Object.keys(headers).forEach(key => {
      if (!SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = String(headers[key])
      }
    })

    return sanitized
  },
}
