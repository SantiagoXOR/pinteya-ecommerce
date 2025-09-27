// ===================================
// PINTEYA E-COMMERCE - ACTIVITY LOGGER UTILITY
// ===================================

import { supabaseAdmin } from '@/lib/integrations/supabase'

// Tipos para actividad
export interface ActivityLogData {
  action: string
  category: 'auth' | 'profile' | 'order' | 'security' | 'session' | 'preference'
  description?: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

export interface ActivityLogOptions {
  skipIfError?: boolean
  includeTimestamp?: boolean
}

/**
 * Función utilitaria centralizada para registrar actividad de usuario
 * Puede ser usada desde APIs del servidor o desde el cliente
 */
export async function logUserActivity(
  userId: string,
  activityData: ActivityLogData,
  options: ActivityLogOptions = {}
): Promise<boolean> {
  try {
    const { skipIfError = true, includeTimestamp = true } = options

    // Preparar datos de actividad
    const logData = {
      user_id: userId,
      action: activityData.action,
      category: activityData.category,
      description: activityData.description,
      metadata: activityData.metadata,
      ip_address: activityData.ip_address,
      user_agent: activityData.user_agent,
      ...(includeTimestamp && { created_at: new Date().toISOString() }),
    }

    // Insertar en base de datos
    const { error } = await supabaseAdmin.from('user_activity').insert(logData)

    if (error) {
      console.error('Error al registrar actividad:', error)
      if (!skipIfError) {
        throw error
      }
      return false
    }

    return true
  } catch (error) {
    console.error('Error en logUserActivity:', error)
    if (!options.skipIfError) {
      throw error
    }
    return false
  }
}

/**
 * Función específica para logging de autenticación
 */
export async function logAuthActivity(
  userId: string,
  action: 'login' | 'logout' | 'register' | 'password_reset' | 'email_verification',
  metadata?: Record<string, any>,
  request?: { ip?: string; userAgent?: string }
): Promise<boolean> {
  return logUserActivity(userId, {
    action,
    category: 'auth',
    description: `Usuario ${action}`,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
    ip_address: request?.ip,
    user_agent: request?.userAgent,
  })
}

/**
 * Función específica para logging de perfil
 */
export async function logProfileActivity(
  userId: string,
  action:
    | 'update_profile'
    | 'upload_avatar'
    | 'delete_avatar'
    | 'add_address'
    | 'update_address'
    | 'delete_address',
  metadata?: Record<string, any>,
  request?: { ip?: string; userAgent?: string }
): Promise<boolean> {
  return logUserActivity(userId, {
    action,
    category: 'profile',
    description: `Perfil: ${action.replace('_', ' ')}`,
    metadata,
    ip_address: request?.ip,
    user_agent: request?.userAgent,
  })
}

/**
 * Función específica para logging de seguridad
 */
export async function logSecurityActivity(
  userId: string,
  action:
    | 'enable_2fa'
    | 'disable_2fa'
    | 'update_security_settings'
    | 'suspicious_activity'
    | 'password_change',
  metadata?: Record<string, any>,
  request?: { ip?: string; userAgent?: string }
): Promise<boolean> {
  return logUserActivity(userId, {
    action,
    category: 'security',
    description: `Seguridad: ${action.replace('_', ' ')}`,
    metadata: {
      severity: action === 'suspicious_activity' ? 'high' : 'medium',
      ...metadata,
    },
    ip_address: request?.ip,
    user_agent: request?.userAgent,
  })
}

/**
 * Función específica para logging de sesiones
 */
export async function logSessionActivity(
  userId: string,
  action: 'session_start' | 'session_end' | 'session_timeout' | 'revoke_session' | 'trust_device',
  metadata?: Record<string, any>,
  request?: { ip?: string; userAgent?: string }
): Promise<boolean> {
  return logUserActivity(userId, {
    action,
    category: 'session',
    description: `Sesión: ${action.replace('_', ' ')}`,
    metadata: {
      device_info: metadata?.device_info,
      session_id: metadata?.session_id,
      ...metadata,
    },
    ip_address: request?.ip,
    user_agent: request?.userAgent,
  })
}

/**
 * Función específica para logging de órdenes
 */
export async function logOrderActivity(
  userId: string,
  action:
    | 'create_order'
    | 'update_order'
    | 'cancel_order'
    | 'payment_completed'
    | 'order_shipped'
    | 'order_delivered',
  orderId: string,
  metadata?: Record<string, any>,
  request?: { ip?: string; userAgent?: string }
): Promise<boolean> {
  return logUserActivity(userId, {
    action,
    category: 'order',
    description: `Orden ${orderId}: ${action.replace('_', ' ')}`,
    metadata: {
      order_id: orderId,
      ...metadata,
    },
    ip_address: request?.ip,
    user_agent: request?.userAgent,
  })
}

/**
 * Función específica para logging de preferencias
 */
export async function logPreferenceActivity(
  userId: string,
  action: 'update_notifications' | 'update_display' | 'update_privacy' | 'update_theme',
  metadata?: Record<string, any>,
  request?: { ip?: string; userAgent?: string }
): Promise<boolean> {
  return logUserActivity(userId, {
    action,
    category: 'preference',
    description: `Preferencias: ${action.replace('_', ' ')}`,
    metadata,
    ip_address: request?.ip,
    user_agent: request?.userAgent,
  })
}

/**
 * Función para obtener información del request (para usar en APIs)
 */
export function getRequestInfo(request: Request | any): { ip?: string; userAgent?: string } {
  try {
    const ip =
      request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers?.get?.('x-real-ip') ||
      request.ip ||
      'unknown'

    const userAgent = request.headers?.get?.('user-agent') || 'unknown'

    return { ip, userAgent }
  } catch (error) {
    console.error('Error obteniendo información del request:', error)
    return { ip: 'unknown', userAgent: 'unknown' }
  }
}

/**
 * Función para logging desde el cliente (usando fetch a la API)
 */
export async function logActivityFromClient(
  action: string,
  category: ActivityLogData['category'],
  description?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const response = await fetch('/api/user/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        category,
        description,
        metadata,
      }),
    })

    if (!response.ok) {
      console.error('Error al registrar actividad desde cliente:', response.statusText)
      return false
    }

    const data = await response.json()
    return data.success || false
  } catch (error) {
    console.error('Error en logActivityFromClient:', error)
    return false
  }
}

/**
 * Función para logging masivo (útil para migraciones o importaciones)
 */
export async function logBulkActivity(
  activities: Array<{ userId: string; activityData: ActivityLogData }>,
  options: ActivityLogOptions = {}
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const { userId, activityData } of activities) {
    const result = await logUserActivity(userId, activityData, options)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  return { success, failed }
}
