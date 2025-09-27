/**
 * Sistema de Auditoría de Seguridad
 * Registra eventos de seguridad y detecta patrones sospechosos
 */

import { supabaseAdmin } from '@/lib/integrations/supabase'
import type { NextRequest, NextApiRequest } from 'next'
import type { SecurityContext } from './security-validations'

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface SecurityEvent {
  id?: string
  user_id: string
  event_type: SecurityEventType
  event_category: SecurityEventCategory
  severity: SecuritySeverity
  description: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp: string
  resolved: boolean
}

export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'PERMISSION_DENIED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'ROLE_CHANGE'
  | 'DATA_ACCESS'
  | 'ADMIN_ACTION'
  | 'SECURITY_VIOLATION'

export type SecurityEventCategory =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'admin_operations'
  | 'suspicious_behavior'

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityAlert {
  id?: string
  user_id: string
  alert_type: string
  severity: SecuritySeverity
  description: string
  event_count: number
  first_occurrence: string
  last_occurrence: string
  resolved: boolean
  metadata?: Record<string, any>
}

// =====================================================
// FUNCIONES DE LOGGING DE EVENTOS
// =====================================================

/**
 * Registra un evento de seguridad
 */
export async function logSecurityEvent(
  event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>
): Promise<void> {
  try {
    if (!supabaseAdmin) {
      console.warn('[SECURITY] Supabase admin no disponible para logging')
      return
    }

    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      resolved: false,
    }

    const { error } = await supabaseAdmin.from('security_events').insert(securityEvent)

    if (error) {
      console.error('[SECURITY] Error guardando evento de seguridad:', error)
    } else {
      console.log(`[SECURITY] Evento registrado: ${event.event_type} - ${event.description}`)
    }

    // También log en consola para desarrollo
    console.log('[SECURITY EVENT]', JSON.stringify(securityEvent, null, 2))
  } catch (error) {
    console.error('[SECURITY] Error en logSecurityEvent:', error)
  }
}

/**
 * Registra autenticación exitosa
 */
export async function logAuthSuccess(
  userId: string,
  context: SecurityContext,
  request?: NextRequest | NextApiRequest
): Promise<void> {
  await logSecurityEvent({
    user_id: userId,
    event_type: 'AUTH_SUCCESS',
    event_category: 'authentication',
    severity: 'low',
    description: `Usuario autenticado exitosamente con rol: ${context.userRole}`,
    metadata: {
      role: context.userRole,
      permissions: context.permissions,
      emailVerified: context.metadata.emailVerified,
    },
    ip_address: context.ipAddress,
    user_agent: context.userAgent,
  })
}

/**
 * Registra fallo de autenticación
 */
export async function logAuthFailure(
  userId: string | null,
  reason: string,
  request?: NextRequest | NextApiRequest
): Promise<void> {
  let ipAddress: string | undefined
  let userAgent: string | undefined

  if (request) {
    if ('headers' in request && typeof request.headers.get === 'function') {
      ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
      userAgent = request.headers.get('user-agent') || 'unknown'
    } else if ('headers' in request) {
      const req = request as NextApiRequest
      ipAddress = (req.headers['x-forwarded-for'] as string) || 'unknown'
      userAgent = req.headers['user-agent'] || 'unknown'
    }
  }

  await logSecurityEvent({
    user_id: userId || 'unknown',
    event_type: 'AUTH_FAILURE',
    event_category: 'authentication',
    severity: 'medium',
    description: `Fallo de autenticación: ${reason}`,
    metadata: { reason },
    ip_address: ipAddress,
    user_agent: userAgent,
  })
}

/**
 * Registra denegación de permisos
 */
export async function logPermissionDenied(
  userId: string,
  operation: string,
  requiredPermissions: string[],
  context: SecurityContext
): Promise<void> {
  await logSecurityEvent({
    user_id: userId,
    event_type: 'PERMISSION_DENIED',
    event_category: 'authorization',
    severity: 'medium',
    description: `Acceso denegado a operación: ${operation}`,
    metadata: {
      operation,
      requiredPermissions,
      userRole: context.userRole,
      userPermissions: context.permissions,
    },
    ip_address: context.ipAddress,
    user_agent: context.userAgent,
  })
}

/**
 * Registra acceso a datos sensibles
 */
export async function logDataAccess(
  userId: string,
  resource: string,
  action: string,
  context: SecurityContext,
  metadata?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    user_id: userId,
    event_type: 'DATA_ACCESS',
    event_category: 'data_access',
    severity: 'low',
    description: `Acceso a ${resource} - Acción: ${action}`,
    metadata: {
      resource,
      action,
      userRole: context.userRole,
      ...metadata,
    },
    ip_address: context.ipAddress,
    user_agent: context.userAgent,
  })
}

/**
 * Registra acción administrativa
 */
export async function logAdminAction(
  userId: string,
  action: string,
  target: string,
  context: SecurityContext,
  metadata?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    user_id: userId,
    event_type: 'ADMIN_ACTION',
    event_category: 'admin_operations',
    severity: 'medium',
    description: `Acción administrativa: ${action} en ${target}`,
    metadata: {
      action,
      target,
      userRole: context.userRole,
      ...metadata,
    },
    ip_address: context.ipAddress,
    user_agent: context.userAgent,
  })
}

// =====================================================
// DETECCIÓN DE ACTIVIDAD SOSPECHOSA
// =====================================================

/**
 * Detecta múltiples fallos de autenticación
 */
export async function detectMultipleAuthFailures(
  userId: string,
  timeWindowMinutes: number = 15,
  maxAttempts: number = 5
): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      return false
    }

    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString()

    const { data, error } = await supabaseAdmin
      .from('security_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'AUTH_FAILURE')
      .gte('timestamp', timeThreshold)

    if (error) {
      console.error('[SECURITY] Error detectando fallos de auth:', error)
      return false
    }

    const failureCount = data?.length || 0

    if (failureCount >= maxAttempts) {
      await logSecurityEvent({
        user_id: userId,
        event_type: 'SUSPICIOUS_ACTIVITY',
        event_category: 'suspicious_behavior',
        severity: 'high',
        description: `Múltiples fallos de autenticación detectados: ${failureCount} intentos en ${timeWindowMinutes} minutos`,
        metadata: {
          failureCount,
          timeWindowMinutes,
          threshold: maxAttempts,
        },
      })
      return true
    }

    return false
  } catch (error) {
    console.error('[SECURITY] Error en detectMultipleAuthFailures:', error)
    return false
  }
}

/**
 * Detecta acceso desde múltiples IPs
 */
export async function detectMultipleIPAccess(
  userId: string,
  timeWindowHours: number = 1,
  maxIPs: number = 3
): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      return false
    }

    const timeThreshold = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabaseAdmin
      .from('security_events')
      .select('ip_address')
      .eq('user_id', userId)
      .eq('event_type', 'AUTH_SUCCESS')
      .gte('timestamp', timeThreshold)
      .not('ip_address', 'is', null)

    if (error) {
      console.error('[SECURITY] Error detectando múltiples IPs:', error)
      return false
    }

    const uniqueIPs = new Set(data?.map(event => event.ip_address))
    const ipCount = uniqueIPs.size

    if (ipCount >= maxIPs) {
      await logSecurityEvent({
        user_id: userId,
        event_type: 'SUSPICIOUS_ACTIVITY',
        event_category: 'suspicious_behavior',
        severity: 'medium',
        description: `Acceso desde múltiples IPs detectado: ${ipCount} IPs diferentes en ${timeWindowHours} horas`,
        metadata: {
          ipCount,
          timeWindowHours,
          threshold: maxIPs,
          ips: Array.from(uniqueIPs),
        },
      })
      return true
    }

    return false
  } catch (error) {
    console.error('[SECURITY] Error en detectMultipleIPAccess:', error)
    return false
  }
}

/**
 * Ejecuta todas las detecciones de seguridad para un usuario
 */
export async function runSecurityDetection(userId: string): Promise<void> {
  try {
    await Promise.all([detectMultipleAuthFailures(userId), detectMultipleIPAccess(userId)])
  } catch (error) {
    console.error('[SECURITY] Error en runSecurityDetection:', error)
  }
}
