// ===================================
// PINTEYA E-COMMERCE - LOGGING ESTRUCTURADO DE SEGURIDAD
// ===================================
// Sistema de logging estructurado para eventos de seguridad
// con contexto enriquecido y formato consistente

import { NextRequest } from 'next/server';

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface SecurityLogContext {
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  endpoint: string;
  method: string;
  timestamp: string;
  requestId?: string;
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  context: SecurityLogContext;
  metadata?: Record<string, any>;
  error?: Error;
}

export type SecurityEventType = 
  | 'auth_attempt'
  | 'auth_success'
  | 'auth_failure'
  | 'rate_limit_exceeded'
  | 'permission_denied'
  | 'suspicious_activity'
  | 'data_access'
  | 'admin_action'
  | 'api_error'
  | 'validation_error'
  | 'security_scan'
  | 'unauthorized_access';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityLogger {
  log(event: SecurityEvent): void;
  logAuthAttempt(context: SecurityLogContext, success: boolean, metadata?: Record<string, any>): void;
  logRateLimitExceeded(context: SecurityLogContext, metadata?: Record<string, any>): void;
  logPermissionDenied(context: SecurityLogContext, resource: string, action: string): void;
  logSuspiciousActivity(context: SecurityLogContext, reason: string, metadata?: Record<string, any>): void;
  logAdminAction(context: SecurityLogContext, action: string, metadata?: Record<string, any>): void;
  logApiError(context: SecurityLogContext, error: Error, metadata?: Record<string, any>): void;
}

// ===================================
// EXTRACTOR DE CONTEXTO DE REQUEST
// ===================================

export function extractSecurityContext(
  request: NextRequest,
  additionalContext: Partial<SecurityLogContext> = {}
): SecurityLogContext {
  const url = new URL(request.url);
  
  // Extraer IP de headers
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded 
    ? forwarded.split(',')[0].trim() 
    : request.headers.get('x-real-ip') || 'unknown';
  
  // Generar request ID único
  const requestId = request.headers.get('x-request-id') || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    endpoint: url.pathname,
    method: request.method,
    timestamp: new Date().toISOString(),
    requestId,
    ...additionalContext,
  };
}

// ===================================
// IMPLEMENTACIÓN DEL LOGGER
// ===================================

class SecurityLoggerImpl implements SecurityLogger {
  private formatLogEntry(event: SecurityEvent): string {
    const logEntry = {
      timestamp: event.context.timestamp,
      level: this.mapSeverityToLevel(event.severity),
      type: 'SECURITY',
      event_type: event.type,
      severity: event.severity,
      message: event.message,
      context: event.context,
      metadata: event.metadata,
      error: event.error ? {
        name: event.error.name,
        message: event.error.message,
        stack: event.error.stack,
      } : undefined,
    };
    
    return JSON.stringify(logEntry, null, process.env.NODE_ENV === 'development' ? 2 : 0);
  }
  
  private mapSeverityToLevel(severity: SecuritySeverity): string {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warn';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'info';
    }
  }
  
  private shouldLog(severity: SecuritySeverity): boolean {
    const logLevel = process.env.SECURITY_LOG_LEVEL || 'medium';
    
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    const currentLevel = levels[logLevel as SecuritySeverity] || 2;
    const eventLevel = levels[severity];
    
    return eventLevel >= currentLevel;
  }
  
  log(event: SecurityEvent): void {
    if (!this.shouldLog(event.severity)) {
      return;
    }
    
    const logEntry = this.formatLogEntry(event);
    
    // En desarrollo, usar console con colores
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        low: '\x1b[36m',      // cyan
        medium: '\x1b[33m',   // yellow
        high: '\x1b[31m',     // red
        critical: '\x1b[35m', // magenta
      };
      
      const reset = '\x1b[0m';
      const color = colors[event.severity];
      
      console.log(`${color}[SECURITY:${event.type.toUpperCase()}]${reset}`, logEntry);
    } else {
      // En producción, usar console.log estándar para integración con sistemas de logging
      console.log(logEntry);
    }
    
    // TODO: Integrar con servicio de logging externo (DataDog, LogRocket, etc.)
    // await this.sendToExternalLogger(logEntry);
  }
  
  logAuthAttempt(
    context: SecurityLogContext, 
    success: boolean, 
    metadata?: Record<string, any>
  ): void {
    this.log({
      type: success ? 'auth_success' : 'auth_failure',
      severity: success ? 'low' : 'medium',
      message: success 
        ? `Authentication successful for ${context.userId || 'unknown user'}` 
        : `Authentication failed for ${context.userId || 'unknown user'}`,
      context,
      metadata: {
        success,
        ...metadata,
      },
    });
  }
  
  logRateLimitExceeded(
    context: SecurityLogContext, 
    metadata?: Record<string, any>
  ): void {
    this.log({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      message: `Rate limit exceeded for ${context.endpoint}`,
      context,
      metadata: {
        endpoint: context.endpoint,
        ip: context.ip,
        ...metadata,
      },
    });
  }
  
  logPermissionDenied(
    context: SecurityLogContext, 
    resource: string, 
    action: string
  ): void {
    this.log({
      type: 'permission_denied',
      severity: 'high',
      message: `Permission denied: ${action} on ${resource}`,
      context,
      metadata: {
        resource,
        action,
        userId: context.userId,
      },
    });
  }
  
  logSuspiciousActivity(
    context: SecurityLogContext, 
    reason: string, 
    metadata?: Record<string, any>
  ): void {
    this.log({
      type: 'suspicious_activity',
      severity: 'high',
      message: `Suspicious activity detected: ${reason}`,
      context,
      metadata: {
        reason,
        ...metadata,
      },
    });
  }
  
  logAdminAction(
    context: SecurityLogContext, 
    action: string, 
    metadata?: Record<string, any>
  ): void {
    this.log({
      type: 'admin_action',
      severity: 'medium',
      message: `Admin action performed: ${action}`,
      context,
      metadata: {
        action,
        adminUserId: context.userId,
        ...metadata,
      },
    });
  }
  
  logApiError(
    context: SecurityLogContext, 
    error: Error, 
    metadata?: Record<string, any>
  ): void {
    this.log({
      type: 'api_error',
      severity: 'medium',
      message: `API error in ${context.endpoint}: ${error.message}`,
      context,
      error,
      metadata,
    });
  }
}

// ===================================
// INSTANCIA GLOBAL Y FACTORY
// ===================================

const globalSecurityLogger = new SecurityLoggerImpl();

/**
 * Crea un logger de seguridad con contexto pre-configurado
 */
export function createSecurityLogger(
  request?: NextRequest,
  additionalContext?: Partial<SecurityLogContext>
): SecurityLogger & { context: SecurityLogContext } {
  const context = request 
    ? extractSecurityContext(request, additionalContext)
    : {
        endpoint: 'unknown',
        method: 'unknown',
        timestamp: new Date().toISOString(),
        ...additionalContext,
      } as SecurityLogContext;
  
  return {
    context,
    log: globalSecurityLogger.log.bind(globalSecurityLogger),
    logAuthAttempt: (ctx, success, metadata) => 
      globalSecurityLogger.logAuthAttempt({ ...context, ...ctx }, success, metadata),
    logRateLimitExceeded: (ctx, metadata) => 
      globalSecurityLogger.logRateLimitExceeded({ ...context, ...ctx }, metadata),
    logPermissionDenied: (ctx, resource, action) => 
      globalSecurityLogger.logPermissionDenied({ ...context, ...ctx }, resource, action),
    logSuspiciousActivity: (ctx, reason, metadata) => 
      globalSecurityLogger.logSuspiciousActivity({ ...context, ...ctx }, reason, metadata),
    logAdminAction: (ctx, action, metadata) => 
      globalSecurityLogger.logAdminAction({ ...context, ...ctx }, action, metadata),
    logApiError: (ctx, error, metadata) => 
      globalSecurityLogger.logApiError({ ...context, ...ctx }, error, metadata),
  };
}

// ===================================
// HELPERS Y UTILIDADES
// ===================================

/**
 * Helper para logging rápido de eventos de seguridad
 */
export const securityLog = {
  info: (message: string, context: Partial<SecurityLogContext> = {}) => {
    globalSecurityLogger.log({
      type: 'security_scan',
      severity: 'low',
      message,
      context: {
        endpoint: 'system',
        method: 'SYSTEM',
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  },
  
  warn: (message: string, context: Partial<SecurityLogContext> = {}) => {
    globalSecurityLogger.log({
      type: 'suspicious_activity',
      severity: 'medium',
      message,
      context: {
        endpoint: 'system',
        method: 'SYSTEM',
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  },
  
  error: (message: string, error?: Error, context: Partial<SecurityLogContext> = {}) => {
    globalSecurityLogger.log({
      type: 'api_error',
      severity: 'high',
      message,
      error,
      context: {
        endpoint: 'system',
        method: 'SYSTEM',
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  },
};

export default globalSecurityLogger;









