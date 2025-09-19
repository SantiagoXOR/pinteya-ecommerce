/**
 * Sistema de monitoreo y logging de seguridad
 * Detecta y registra eventos de seguridad sospechosos
 */

import { logger, LogLevel } from '@/lib/enterprise/logger';

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

export enum SecurityEventType {
  // Autenticación
  FAILED_LOGIN = 'failed_login',
  SUSPICIOUS_LOGIN = 'suspicious_login',
  ACCOUNT_LOCKOUT = 'account_lockout',
  PASSWORD_RESET_ABUSE = 'password_reset_abuse',
  
  // Autorización
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  ADMIN_ACCESS_ATTEMPT = 'admin_access_attempt',
  
  // Ataques
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  
  // Datos
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  DATA_EXPORT_LARGE = 'data_export_large',
  UNUSUAL_DATA_PATTERN = 'unusual_data_pattern',
  
  // Sistema
  CSP_VIOLATION = 'csp_violation',
  CORS_VIOLATION = 'cors_violation',
  SUSPICIOUS_REQUEST = 'suspicious_request'
}

// ===================================
// DETECTOR DE EVENTOS DE SEGURIDAD
// ===================================

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private eventBuffer: SecurityEvent[] = [];
  private readonly maxBufferSize = 1000;
  
  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }
  
  /**
   * Registra un evento de seguridad
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };
    
    // Agregar al buffer
    this.eventBuffer.push(fullEvent);
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift();
    }
    
    // Log según severidad
    this.logEventBySeverity(fullEvent);
    
    // Alertas automáticas para eventos críticos
    if (fullEvent.severity === 'critical') {
      this.triggerCriticalAlert(fullEvent);
    }
  }
  
  /**
   * Detecta patrones sospechosos en requests
   */
  analyzeRequest(request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    ip?: string;
    userAgent?: string;
  }): SecurityEvent[] {
    const events: SecurityEvent[] = [];
    
    // Detectar intentos de SQL injection
    if (this.detectSQLInjection(request.url, request.body)) {
      events.push({
        type: SecurityEventType.SQL_INJECTION_ATTEMPT,
        severity: 'high',
        source: 'request_analyzer',
        details: {
          url: request.url,
          method: request.method,
          suspiciousContent: this.extractSuspiciousSQL(request.url, request.body)
        },
        timestamp: new Date(),
        ip: request.ip,
        userAgent: request.userAgent
      });
    }
    
    // Detectar intentos de XSS
    if (this.detectXSS(request.url, request.body)) {
      events.push({
        type: SecurityEventType.XSS_ATTEMPT,
        severity: 'high',
        source: 'request_analyzer',
        details: {
          url: request.url,
          method: request.method,
          suspiciousContent: this.extractSuspiciousXSS(request.url, request.body)
        },
        timestamp: new Date(),
        ip: request.ip,
        userAgent: request.userAgent
      });
    }
    
    // Detectar requests sospechosos
    if (this.detectSuspiciousRequest(request)) {
      events.push({
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        severity: 'medium',
        source: 'request_analyzer',
        details: {
          url: request.url,
          method: request.method,
          reason: this.getSuspiciousReason(request)
        },
        timestamp: new Date(),
        ip: request.ip,
        userAgent: request.userAgent
      });
    }
    
    return events;
  }
  
  /**
   * Obtiene estadísticas de seguridad
   */
  getSecurityStats(timeRange: 'hour' | 'day' | 'week' = 'day') {
    const now = new Date();
    const timeRangeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    }[timeRange];
    
    const cutoff = new Date(now.getTime() - timeRangeMs);
    const recentEvents = this.eventBuffer.filter(event => event.timestamp > cutoff);
    
    const stats = {
      totalEvents: recentEvents.length,
      eventsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      eventsByType: {} as Record<string, number>,
      topSources: {} as Record<string, number>,
      timeRange
    };
    
    recentEvents.forEach(event => {
      stats.eventsBySeverity[event.severity]++;
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
      stats.topSources[event.source] = (stats.topSources[event.source] || 0) + 1;
    });
    
    return stats;
  }
  
  // ===================================
  // MÉTODOS PRIVADOS DE DETECCIÓN
  // ===================================
  
  private detectSQLInjection(url: string, body: any): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\'|\")(\s*)(OR|AND)(\s*)(\'|\")/i,
      /(\-\-|\#|\/\*)/,
      /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/i
    ];
    
    const content = JSON.stringify({ url, body }).toLowerCase();
    return sqlPatterns.some(pattern => pattern.test(content));
  }
  
  private detectXSS(url: string, body: any): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ];
    
    const content = JSON.stringify({ url, body });
    return xssPatterns.some(pattern => pattern.test(content));
  }
  
  private detectSuspiciousRequest(request: any): boolean {
    // User-Agent sospechoso
    if (!request.userAgent || request.userAgent.length < 10) {
      return true;
    }
    
    // Demasiados parámetros
    if (request.url.split('?')[1]?.split('&').length > 20) {
      return true;
    }
    
    // Headers sospechosos
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
    if (suspiciousHeaders.some(header => request.headers[header])) {
      return true;
    }
    
    return false;
  }
  
  private extractSuspiciousSQL(url: string, body: any): string[] {
    const content = JSON.stringify({ url, body });
    const matches = content.match(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi);
    return matches || [];
  }
  
  private extractSuspiciousXSS(url: string, body: any): string[] {
    const content = JSON.stringify({ url, body });
    const matches = content.match(/<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=/gi);
    return matches || [];
  }
  
  private getSuspiciousReason(request: any): string {
    if (!request.userAgent || request.userAgent.length < 10) {
      return 'Invalid or missing User-Agent';
    }
    if (request.url.split('?')[1]?.split('&').length > 20) {
      return 'Too many URL parameters';
    }
    return 'General suspicious pattern';
  }
  
  private logEventBySeverity(event: SecurityEvent): void {
    const logData = {
      type: event.type,
      severity: event.severity,
      source: event.source,
      details: event.details,
      ip: event.ip,
      userAgent: event.userAgent,
      userId: event.userId
    };
    
    switch (event.severity) {
      case 'critical':
        logger.error(LogLevel.ERROR, `CRITICAL SECURITY EVENT: ${event.type}`, logData);
        break;
      case 'high':
        logger.error(LogLevel.ERROR, `HIGH SECURITY EVENT: ${event.type}`, logData);
        break;
      case 'medium':
        logger.warn(LogLevel.WARN, `MEDIUM SECURITY EVENT: ${event.type}`, logData);
        break;
      case 'low':
        logger.info(LogLevel.INFO, `LOW SECURITY EVENT: ${event.type}`, logData);
        break;
    }
  }
  
  private triggerCriticalAlert(event: SecurityEvent): void {
    // En un entorno real, aquí se enviarían alertas por email, Slack, etc.
    console.error('🚨 CRITICAL SECURITY ALERT 🚨', {
      type: event.type,
      details: event.details,
      timestamp: event.timestamp
    });
    
    // Log especial para eventos críticos
    logger.error(LogLevel.ERROR, '🚨 CRITICAL SECURITY ALERT', {
      event: event.type,
      severity: event.severity,
      source: event.source,
      details: event.details,
      timestamp: event.timestamp,
      requiresImmedateAttention: true
    });
  }
}

// ===================================
// EXPORTACIONES
// ===================================

export const securityMonitor = SecurityMonitor.getInstance();

// Funciones de conveniencia
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
  securityMonitor.logSecurityEvent(event);
}

export function analyzeRequestSecurity(request: Parameters<SecurityMonitor['analyzeRequest']>[0]) {
  const events = securityMonitor.analyzeRequest(request);
  events.forEach(event => securityMonitor.logSecurityEvent(event));
  return events;
}

export function getSecurityStats(timeRange?: 'hour' | 'day' | 'week') {
  return securityMonitor.getSecurityStats(timeRange);
}