// ===================================
// PINTEYA E-COMMERCE - AUDIT TRAIL SYSTEM ENTERPRISE
// ===================================

import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import crypto from 'crypto'

// Niveles de criticidad según ISO/IEC 27001:2013
export enum AuditSeverity {
  LOW = 'low', // Eventos informativos
  MEDIUM = 'medium', // Eventos de advertencia
  HIGH = 'high', // Eventos críticos
  CRITICAL = 'critical', // Eventos de seguridad críticos
}

// Categorías de eventos de auditoría
export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  PAYMENT_PROCESSING = 'payment_processing',
  SYSTEM_ADMINISTRATION = 'system_administration',
  SECURITY_VIOLATION = 'security_violation',
  CONFIGURATION_CHANGE = 'configuration_change',
  ERROR_EVENT = 'error_event',
  COMPLIANCE_EVENT = 'compliance_event',
}

// Resultado de operaciones
export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  BLOCKED = 'blocked',
  UNAUTHORIZED = 'unauthorized',
  ERROR = 'error',
}

// Evento de auditoría completo
export interface AuditEvent {
  id: string
  timestamp: string
  userId?: string
  sessionId?: string
  action: string
  resource: string
  category: AuditCategory
  severity: AuditSeverity
  result: AuditResult
  ipAddress: string
  userAgent: string
  requestId?: string
  metadata?: Record<string, any>
  hash: string
  complianceFlags?: string[]
}

// Configuración de retención según compliance
export interface RetentionPolicy {
  category: AuditCategory
  retentionDays: number
  archiveAfterDays: number
  requiresEncryption: boolean
}

// Políticas de retención ISO/IEC 27001:2013
export const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    category: AuditCategory.AUTHENTICATION,
    retentionDays: 365,
    archiveAfterDays: 90,
    requiresEncryption: true,
  },
  {
    category: AuditCategory.AUTHORIZATION,
    retentionDays: 365,
    archiveAfterDays: 90,
    requiresEncryption: true,
  },
  {
    category: AuditCategory.PAYMENT_PROCESSING,
    retentionDays: 2555, // 7 años para compliance financiero
    archiveAfterDays: 365,
    requiresEncryption: true,
  },
  {
    category: AuditCategory.SECURITY_VIOLATION,
    retentionDays: 2555, // 7 años
    archiveAfterDays: 180,
    requiresEncryption: true,
  },
  {
    category: AuditCategory.DATA_ACCESS,
    retentionDays: 1095, // 3 años
    archiveAfterDays: 180,
    requiresEncryption: true,
  },
  {
    category: AuditCategory.SYSTEM_ADMINISTRATION,
    retentionDays: 1095, // 3 años
    archiveAfterDays: 365,
    requiresEncryption: true,
  },
]

/**
 * Sistema de Auditoría Enterprise con compliance ISO/IEC 27001:2013
 */
export class AuditTrailManager {
  private static instance: AuditTrailManager
  private secretKey: string

  constructor() {
    this.secretKey = process.env.AUDIT_TRAIL_SECRET_KEY || 'default-audit-key'
    if (this.secretKey === 'default-audit-key') {
      logger.warn(
        LogLevel.WARN,
        'Using default audit trail secret key - not secure for production',
        {},
        LogCategory.SYSTEM
      )
    }
  }

  static getInstance(): AuditTrailManager {
    if (!AuditTrailManager.instance) {
      AuditTrailManager.instance = new AuditTrailManager()
    }
    return AuditTrailManager.instance
  }

  /**
   * Registra un evento de auditoría
   */
  async logEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp' | 'hash'>): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        ...eventData,
        id: this.generateEventId(),
        timestamp: new Date().toISOString(),
        hash: '',
      }

      // Generar hash de integridad
      auditEvent.hash = this.generateEventHash(auditEvent)

      // Almacenar en base de datos
      await this.storeAuditEvent(auditEvent)

      // Verificar si requiere alertas
      if (this.requiresAlert(auditEvent)) {
        await this.sendSecurityAlert(auditEvent)
      }

      // Log estructurado
      logger.audit(LogLevel.INFO, `Audit event logged: ${auditEvent.action}`, {
        eventId: auditEvent.id,
        category: auditEvent.category,
        severity: auditEvent.severity,
        result: auditEvent.result,
        userId: auditEvent.userId,
      })
    } catch (error) {
      logger.error(
        LogLevel.ERROR,
        'Failed to log audit event',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          action: eventData.action,
          category: eventData.category,
        },
        LogCategory.SYSTEM
      )
    }
  }

  /**
   * Registra evento de autenticación
   */
  async logAuthentication(
    action: string,
    result: AuditResult,
    userId?: string,
    metadata?: Record<string, any>,
    request?: { ip: string; userAgent: string; sessionId?: string }
  ): Promise<void> {
    await this.logEvent({
      userId,
      sessionId: request?.sessionId,
      action,
      resource: 'authentication',
      category: AuditCategory.AUTHENTICATION,
      severity: result === AuditResult.FAILURE ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      result,
      ipAddress: request?.ip || 'unknown',
      userAgent: request?.userAgent || 'unknown',
      metadata,
      complianceFlags: ['ISO27001', 'AUTHENTICATION_LOG'],
    })
  }

  /**
   * Registra evento de procesamiento de pagos
   */
  async logPaymentEvent(
    action: string,
    result: AuditResult,
    paymentData: {
      orderId?: string
      paymentId?: string
      amount?: number
      currency?: string
      method?: string
    },
    userId?: string,
    request?: { ip: string; userAgent: string }
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: `payment:${paymentData.paymentId || 'unknown'}`,
      category: AuditCategory.PAYMENT_PROCESSING,
      severity: result === AuditResult.FAILURE ? AuditSeverity.HIGH : AuditSeverity.LOW,
      result,
      ipAddress: request?.ip || 'unknown',
      userAgent: request?.userAgent || 'unknown',
      metadata: {
        ...paymentData,
        complianceRequired: true,
      },
      complianceFlags: ['ISO27001', 'PAYMENT_LOG', 'FINANCIAL_COMPLIANCE'],
    })
  }

  /**
   * Registra violación de seguridad
   */
  async logSecurityViolation(
    action: string,
    details: string,
    request: { ip: string; userAgent: string },
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      action,
      resource: 'security_system',
      category: AuditCategory.SECURITY_VIOLATION,
      severity: AuditSeverity.CRITICAL,
      result: AuditResult.BLOCKED,
      ipAddress: request.ip,
      userAgent: request.userAgent,
      metadata: {
        details,
        ...metadata,
        alertRequired: true,
      },
      complianceFlags: ['ISO27001', 'SECURITY_INCIDENT', 'IMMEDIATE_ALERT'],
    })
  }

  /**
   * Registra acceso a datos sensibles
   */
  async logDataAccess(
    action: string,
    resource: string,
    result: AuditResult,
    userId?: string,
    request?: { ip: string; userAgent: string },
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource,
      category: AuditCategory.DATA_ACCESS,
      severity: result === AuditResult.UNAUTHORIZED ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      result,
      ipAddress: request?.ip || 'unknown',
      userAgent: request?.userAgent || 'unknown',
      metadata,
      complianceFlags: ['ISO27001', 'DATA_ACCESS_LOG'],
    })
  }

  /**
   * Registra cambios administrativos
   */
  async logAdminAction(
    action: string,
    resource: string,
    result: AuditResult,
    userId: string,
    request: { ip: string; userAgent: string },
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource,
      category: AuditCategory.SYSTEM_ADMINISTRATION,
      severity: AuditSeverity.HIGH,
      result,
      ipAddress: request.ip,
      userAgent: request.userAgent,
      metadata,
      complianceFlags: ['ISO27001', 'ADMIN_ACTION', 'PRIVILEGED_ACCESS'],
    })
  }

  /**
   * Genera ID único para el evento
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  }

  /**
   * Genera hash de integridad para el evento
   */
  private generateEventHash(event: Omit<AuditEvent, 'hash'>): string {
    const eventString = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      category: event.category,
      result: event.result,
    })

    return crypto.createHmac('sha256', this.secretKey).update(eventString).digest('hex')
  }

  /**
   * Almacena el evento en la base de datos
   */
  private async storeAuditEvent(event: AuditEvent): Promise<void> {
    const supabase = getSupabaseClient(true) // Usar cliente administrativo

    if (!supabase) {
      throw new Error('Supabase client not available for audit logging')
    }

    const { error } = await supabase.from('audit_events').insert({
      id: event.id,
      timestamp: event.timestamp,
      user_id: event.userId,
      session_id: event.sessionId,
      action: event.action,
      resource: event.resource,
      category: event.category,
      severity: event.severity,
      result: event.result,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      request_id: event.requestId,
      metadata: event.metadata,
      hash: event.hash,
      compliance_flags: event.complianceFlags,
    })

    if (error) {
      throw new Error(`Failed to store audit event: ${error.message}`)
    }
  }

  /**
   * Determina si el evento requiere alerta inmediata
   */
  private requiresAlert(event: AuditEvent): boolean {
    return (
      event.severity === AuditSeverity.CRITICAL ||
      event.category === AuditCategory.SECURITY_VIOLATION ||
      event.result === AuditResult.BLOCKED ||
      event.complianceFlags?.includes('IMMEDIATE_ALERT') ||
      false
    )
  }

  /**
   * Envía alerta de seguridad
   */
  private async sendSecurityAlert(event: AuditEvent): Promise<void> {
    try {
      // Log inmediato para alertas críticas
      logger.security(LogLevel.ERROR, `SECURITY ALERT: ${event.action}`, {
        eventId: event.id,
        category: event.category,
        severity: event.severity,
        result: event.result,
        ipAddress: event.ipAddress,
        userId: event.userId,
        resource: event.resource,
      })

      // TODO: Implementar notificaciones adicionales (email, Slack, etc.)
      // await this.sendEmailAlert(event);
      // await this.sendSlackAlert(event);
    } catch (error) {
      logger.error(
        LogLevel.ERROR,
        'Failed to send security alert',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          eventId: event.id,
        },
        LogCategory.SYSTEM
      )
    }
  }

  /**
   * Verifica la integridad de un evento
   */
  async verifyEventIntegrity(event: AuditEvent): Promise<boolean> {
    const expectedHash = this.generateEventHash({
      ...event,
      hash: '',
    })

    return event.hash === expectedHash
  }

  /**
   * Obtiene eventos de auditoría con filtros
   */
  async getAuditEvents(filters: {
    userId?: string
    category?: AuditCategory
    severity?: AuditSeverity
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<AuditEvent[]> {
    const supabase = getSupabaseClient(true)

    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    let query = supabase.from('audit_events').select('*').order('timestamp', { ascending: false })

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity)
    }

    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to retrieve audit events: ${error.message}`)
    }

    return data || []
  }
}

// Instancia singleton
export const auditTrail = AuditTrailManager.getInstance()

// Funciones de conveniencia
export const logAuthentication = auditTrail.logAuthentication.bind(auditTrail)
export const logPaymentEvent = auditTrail.logPaymentEvent.bind(auditTrail)
export const logSecurityViolation = auditTrail.logSecurityViolation.bind(auditTrail)
export const logDataAccess = auditTrail.logDataAccess.bind(auditTrail)
export const logAdminAction = auditTrail.logAdminAction.bind(auditTrail)
