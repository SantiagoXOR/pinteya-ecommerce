/**
 * Sistema de Auditoría de Seguridad Mejorado
 * Extiende el sistema base con análisis avanzado, alertas automáticas y reportes
 */

import { supabaseAdmin } from '@/lib/integrations/supabase'
import {
  logSecurityEvent,
  type SecurityEvent,
  type SecuritySeverity,
  type SecurityEventType,
  type SecurityEventCategory,
} from './security-audit'
import { CacheManager, CACHE_CONFIGS } from '@/lib/cache-manager'

// =====================================================
// TIPOS Y INTERFACES EXTENDIDAS
// =====================================================

export interface SecurityPattern {
  id: string
  name: string
  description: string
  severity: SecuritySeverity
  conditions: PatternCondition[]
  timeWindow: number // en minutos
  threshold: number
  enabled: boolean
  actions: SecurityAction[]
}

export interface PatternCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  weight: number // peso en el cálculo del patrón
}

export interface SecurityAction {
  type: 'log' | 'alert' | 'block_user' | 'notify_admin' | 'invalidate_sessions'
  parameters?: Record<string, any>
}

export interface SecurityReport {
  id: string
  period_start: string
  period_end: string
  total_events: number
  events_by_severity: Record<SecuritySeverity, number>
  events_by_category: Record<SecurityEventCategory, number>
  top_users: Array<{ user_id: string; event_count: number }>
  top_ips: Array<{ ip_address: string; event_count: number }>
  patterns_detected: Array<{ pattern_id: string; occurrences: number }>
  recommendations: string[]
  generated_at: string
}

export interface SecurityMetrics {
  total_events_24h: number
  critical_events_24h: number
  unique_users_24h: number
  auth_failures_24h: number
  suspicious_activities_24h: number
  blocked_users: number
  active_alerts: number
  avg_response_time: number
  security_score: number // 0-100
}

export interface SecurityAlert {
  id: string
  pattern_id: string
  user_id: string
  severity: SecuritySeverity
  title: string
  description: string
  event_count: number
  first_occurrence: string
  last_occurrence: string
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  assigned_to?: string
  resolution_notes?: string
  metadata: Record<string, any>
}

// =====================================================
// PATRONES DE SEGURIDAD PREDEFINIDOS
// =====================================================

export const DEFAULT_SECURITY_PATTERNS: SecurityPattern[] = [
  {
    id: 'brute_force_login',
    name: 'Ataque de Fuerza Bruta',
    description: 'Múltiples intentos de login fallidos desde la misma IP',
    severity: 'high',
    timeWindow: 15,
    threshold: 5,
    enabled: true,
    conditions: [
      { field: 'event_type', operator: 'equals', value: 'AUTH_FAILURE', weight: 1 },
      { field: 'ip_address', operator: 'equals', value: 'same', weight: 1 },
    ],
    actions: [
      { type: 'alert', parameters: { notify_admins: true } },
      { type: 'log', parameters: { severity: 'high' } },
    ],
  },
  {
    id: 'privilege_escalation',
    name: 'Escalación de Privilegios',
    description: 'Intento de acceso a recursos sin permisos suficientes',
    severity: 'critical',
    timeWindow: 60,
    threshold: 3,
    enabled: true,
    conditions: [
      { field: 'event_type', operator: 'equals', value: 'PERMISSION_DENIED', weight: 1 },
      { field: 'event_category', operator: 'equals', value: 'authorization', weight: 1 },
    ],
    actions: [
      { type: 'alert', parameters: { notify_admins: true, priority: 'high' } },
      { type: 'log', parameters: { severity: 'critical' } },
    ],
  },
  {
    id: 'suspicious_data_access',
    name: 'Acceso Sospechoso a Datos',
    description: 'Acceso masivo a datos sensibles en corto período',
    severity: 'medium',
    timeWindow: 30,
    threshold: 10,
    enabled: true,
    conditions: [
      { field: 'event_type', operator: 'equals', value: 'DATA_ACCESS', weight: 1 },
      { field: 'event_category', operator: 'equals', value: 'data_access', weight: 1 },
    ],
    actions: [
      { type: 'alert', parameters: { notify_admins: false } },
      { type: 'log', parameters: { severity: 'medium' } },
    ],
  },
  {
    id: 'admin_action_burst',
    name: 'Ráfaga de Acciones Administrativas',
    description: 'Múltiples acciones administrativas en corto período',
    severity: 'medium',
    timeWindow: 10,
    threshold: 5,
    enabled: true,
    conditions: [
      { field: 'event_type', operator: 'equals', value: 'ADMIN_ACTION', weight: 1 },
      { field: 'event_category', operator: 'equals', value: 'admin_operations', weight: 1 },
    ],
    actions: [
      { type: 'alert', parameters: { notify_admins: true } },
      { type: 'log', parameters: { severity: 'medium' } },
    ],
  },
  {
    id: 'geographic_anomaly',
    name: 'Anomalía Geográfica',
    description: 'Acceso desde ubicaciones geográficas inusuales',
    severity: 'medium',
    timeWindow: 60,
    threshold: 2,
    enabled: true,
    conditions: [
      { field: 'event_type', operator: 'equals', value: 'AUTH_SUCCESS', weight: 1 },
      { field: 'ip_address', operator: 'not_in', value: 'usual_locations', weight: 1 },
    ],
    actions: [
      { type: 'alert', parameters: { notify_user: true } },
      { type: 'log', parameters: { severity: 'medium' } },
    ],
  },
]

// =====================================================
// FUNCIONES DE ANÁLISIS AVANZADO
// =====================================================

/**
 * Analiza eventos de seguridad para detectar patrones
 */
export async function analyzeSecurityPatterns(
  userId?: string,
  timeWindowHours: number = 24
): Promise<SecurityAlert[]> {
  try {
    console.log('[SECURITY] Iniciando análisis de patrones de seguridad')

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible')
    }

    const timeThreshold = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString()
    const alerts: SecurityAlert[] = []

    // Obtener eventos recientes
    let query = supabaseAdmin
      .from('security_events')
      .select('*')
      .gte('timestamp', timeThreshold)
      .order('timestamp', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: events, error } = await query

    if (error) {
      throw new Error(`Error obteniendo eventos: ${error.message}`)
    }

    if (!events || events.length === 0) {
      return alerts
    }

    // Analizar cada patrón
    for (const pattern of DEFAULT_SECURITY_PATTERNS) {
      if (!pattern.enabled) {
        continue
      }

      const patternAlerts = await detectPattern(pattern, events)
      alerts.push(...patternAlerts)
    }

    // Guardar alertas en base de datos
    if (alerts.length > 0) {
      const { error: insertError } = await supabaseAdmin.from('security_alerts').insert(alerts)

      if (insertError) {
        console.error('[SECURITY] Error guardando alertas:', insertError)
      }
    }

    console.log(`[SECURITY] Análisis completado: ${alerts.length} alertas generadas`)
    return alerts
  } catch (error) {
    console.error('[SECURITY] Error en análisis de patrones:', error)
    return []
  }
}

/**
 * Detecta un patrón específico en los eventos
 */
async function detectPattern(
  pattern: SecurityPattern,
  events: SecurityEvent[]
): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = []
  const timeWindow = pattern.timeWindow * 60 * 1000 // convertir a ms

  // Agrupar eventos por usuario
  const eventsByUser = events.reduce(
    (acc, event) => {
      if (!acc[event.user_id]) {
        acc[event.user_id] = []
      }
      acc[event.user_id].push(event)
      return acc
    },
    {} as Record<string, SecurityEvent[]>
  )

  // Analizar cada usuario
  for (const [userId, userEvents] of Object.entries(eventsByUser)) {
    const matchingEvents = userEvents.filter(event =>
      matchesPatternConditions(event, pattern.conditions)
    )

    if (matchingEvents.length < pattern.threshold) {
      continue
    }

    // Verificar ventana de tiempo
    const sortedEvents = matchingEvents.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    for (let i = 0; i <= sortedEvents.length - pattern.threshold; i++) {
      const windowStart = new Date(sortedEvents[i].timestamp).getTime()
      const windowEnd = windowStart + timeWindow

      const eventsInWindow = sortedEvents.filter(event => {
        const eventTime = new Date(event.timestamp).getTime()
        return eventTime >= windowStart && eventTime <= windowEnd
      })

      if (eventsInWindow.length >= pattern.threshold) {
        // Patrón detectado
        const alert: SecurityAlert = {
          id: `${pattern.id}_${userId}_${Date.now()}`,
          pattern_id: pattern.id,
          user_id: userId,
          severity: pattern.severity,
          title: pattern.name,
          description: `${pattern.description} - ${eventsInWindow.length} eventos detectados`,
          event_count: eventsInWindow.length,
          first_occurrence: eventsInWindow[0].timestamp,
          last_occurrence: eventsInWindow[eventsInWindow.length - 1].timestamp,
          status: 'open',
          metadata: {
            pattern_name: pattern.name,
            events: eventsInWindow.map(e => e.id),
            threshold: pattern.threshold,
            time_window_minutes: pattern.timeWindow,
          },
        }

        alerts.push(alert)

        // Ejecutar acciones del patrón
        await executePatternActions(pattern.actions, alert, eventsInWindow)
        break // Solo una alerta por patrón por usuario
      }
    }
  }

  return alerts
}

/**
 * Verifica si un evento coincide con las condiciones del patrón
 */
function matchesPatternConditions(event: SecurityEvent, conditions: PatternCondition[]): boolean {
  return conditions.every(condition => {
    const eventValue = (event as any)[condition.field]

    switch (condition.operator) {
      case 'equals':
        return eventValue === condition.value
      case 'contains':
        return typeof eventValue === 'string' && eventValue.includes(condition.value)
      case 'greater_than':
        return Number(eventValue) > Number(condition.value)
      case 'less_than':
        return Number(eventValue) < Number(condition.value)
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(eventValue)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(eventValue)
      default:
        return false
    }
  })
}

/**
 * Ejecuta las acciones definidas para un patrón
 */
async function executePatternActions(
  actions: SecurityAction[],
  alert: SecurityAlert,
  events: SecurityEvent[]
): Promise<void> {
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'log':
          await logSecurityEvent({
            user_id: alert.user_id,
            event_type: 'SUSPICIOUS_ACTIVITY',
            event_category: 'suspicious_behavior',
            severity: action.parameters?.severity || alert.severity,
            description: `Patrón detectado: ${alert.title}`,
            metadata: {
              pattern_id: alert.pattern_id,
              alert_id: alert.id,
              event_count: alert.event_count,
              ...action.parameters,
            },
          })
          break

        case 'alert':
          console.warn(`[SECURITY ALERT] ${alert.title} - Usuario: ${alert.user_id}`)
          if (action.parameters?.notify_admins) {
            // Aquí se podría integrar con un sistema de notificaciones
            console.log('[SECURITY] Notificando a administradores...')
          }
          break

        case 'block_user':
          console.log(`[SECURITY] Bloqueando usuario: ${alert.user_id}`)
          // Implementar lógica de bloqueo
          break

        case 'invalidate_sessions':
          console.log(`[SECURITY] Invalidando sesiones del usuario: ${alert.user_id}`)
          // Integrar con sistema de gestión de sesiones
          break

        default:
          console.warn(`[SECURITY] Acción no reconocida: ${action.type}`)
      }
    } catch (error) {
      console.error(`[SECURITY] Error ejecutando acción ${action.type}:`, error)
    }
  }
}

// =====================================================
// FUNCIONES DE MÉTRICAS Y REPORTES
// =====================================================

/**
 * Obtiene métricas de seguridad en tiempo real
 */
export async function getSecurityMetrics(): Promise<SecurityMetrics> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible')
    }

    const cache = CacheManager.getInstance()
    const cacheKey = 'security_metrics'

    // Intentar obtener desde cache
    const cached = await cache.get(CACHE_CONFIGS.USER_SESSION, cacheKey)
    if (cached) {
      return cached as SecurityMetrics
    }

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // Obtener eventos de las últimas 24 horas
    const { data: events, error } = await supabaseAdmin
      .from('security_events')
      .select('*')
      .gte('timestamp', last24h)

    if (error) {
      throw new Error(`Error obteniendo eventos: ${error.message}`)
    }

    // Obtener alertas activas
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from('security_alerts')
      .select('id')
      .eq('status', 'open')

    if (alertsError) {
      console.error('[SECURITY] Error obteniendo alertas:', alertsError)
    }

    // Calcular métricas
    const totalEvents = events?.length || 0
    const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0
    const uniqueUsers = new Set(events?.map(e => e.user_id)).size
    const authFailures = events?.filter(e => e.event_type === 'AUTH_FAILURE').length || 0
    const suspiciousActivities =
      events?.filter(e => e.event_type === 'SUSPICIOUS_ACTIVITY').length || 0
    const activeAlerts = alerts?.length || 0

    // Calcular score de seguridad (0-100)
    let securityScore = 100
    if (criticalEvents > 0) {
      securityScore -= criticalEvents * 10
    }
    if (authFailures > 10) {
      securityScore -= (authFailures - 10) * 2
    }
    if (suspiciousActivities > 5) {
      securityScore -= (suspiciousActivities - 5) * 5
    }
    if (activeAlerts > 0) {
      securityScore -= activeAlerts * 3
    }
    securityScore = Math.max(0, Math.min(100, securityScore))

    const metrics: SecurityMetrics = {
      total_events_24h: totalEvents,
      critical_events_24h: criticalEvents,
      unique_users_24h: uniqueUsers,
      auth_failures_24h: authFailures,
      suspicious_activities_24h: suspiciousActivities,
      blocked_users: 0, // TODO: implementar cuando se tenga sistema de bloqueo
      active_alerts: activeAlerts,
      avg_response_time: 0, // TODO: calcular tiempo promedio de respuesta
      security_score: securityScore,
    }

    // Guardar en cache por 5 minutos
    await cache.set(CACHE_CONFIGS.USER_SESSION, cacheKey, metrics)

    return metrics
  } catch (error) {
    console.error('[SECURITY] Error obteniendo métricas:', error)
    return {
      total_events_24h: 0,
      critical_events_24h: 0,
      unique_users_24h: 0,
      auth_failures_24h: 0,
      suspicious_activities_24h: 0,
      blocked_users: 0,
      active_alerts: 0,
      avg_response_time: 0,
      security_score: 0,
    }
  }
}

/**
 * Genera un reporte de seguridad para un período específico
 */
export async function generateSecurityReport(
  startDate: Date,
  endDate: Date
): Promise<SecurityReport> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible')
    }

    console.log(
      `[SECURITY] Generando reporte de seguridad: ${startDate.toISOString()} - ${endDate.toISOString()}`
    )

    // Obtener eventos del período
    const { data: events, error } = await supabaseAdmin
      .from('security_events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error(`Error obteniendo eventos: ${error.message}`)
    }

    const totalEvents = events?.length || 0

    // Agrupar por severidad
    const eventsBySeverity: Record<SecuritySeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }

    // Agrupar por categoría
    const eventsByCategory: Record<SecurityEventCategory, number> = {
      authentication: 0,
      authorization: 0,
      data_access: 0,
      admin_operations: 0,
      suspicious_behavior: 0,
    }

    // Contadores de usuarios e IPs
    const userCounts: Record<string, number> = {}
    const ipCounts: Record<string, number> = {}

    events?.forEach(event => {
      // Contar por severidad
      eventsBySeverity[event.severity]++

      // Contar por categoría
      eventsByCategory[event.event_category]++

      // Contar por usuario
      userCounts[event.user_id] = (userCounts[event.user_id] || 0) + 1

      // Contar por IP
      if (event.ip_address) {
        ipCounts[event.ip_address] = (ipCounts[event.ip_address] || 0) + 1
      }
    })

    // Top usuarios (más eventos)
    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([user_id, event_count]) => ({ user_id, event_count }))

    // Top IPs (más eventos)
    const topIps = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip_address, event_count]) => ({ ip_address, event_count }))

    // Obtener patrones detectados
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from('security_alerts')
      .select('pattern_id')
      .gte('first_occurrence', startDate.toISOString())
      .lte('last_occurrence', endDate.toISOString())

    const patternsDetected: Array<{ pattern_id: string; occurrences: number }> = []
    if (!alertsError && alerts) {
      const patternCounts: Record<string, number> = {}
      alerts.forEach(alert => {
        patternCounts[alert.pattern_id] = (patternCounts[alert.pattern_id] || 0) + 1
      })

      Object.entries(patternCounts).forEach(([pattern_id, occurrences]) => {
        patternsDetected.push({ pattern_id, occurrences })
      })
    }

    // Generar recomendaciones
    const recommendations = generateSecurityRecommendations(
      eventsBySeverity,
      eventsByCategory,
      patternsDetected
    )

    const report: SecurityReport = {
      id: `report_${Date.now()}`,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
      total_events: totalEvents,
      events_by_severity: eventsBySeverity,
      events_by_category: eventsByCategory,
      top_users: topUsers,
      top_ips: topIps,
      patterns_detected: patternsDetected,
      recommendations,
      generated_at: new Date().toISOString(),
    }

    // Guardar reporte en base de datos
    const { error: insertError } = await supabaseAdmin.from('security_reports').insert(report)

    if (insertError) {
      console.error('[SECURITY] Error guardando reporte:', insertError)
    }

    console.log(`[SECURITY] Reporte generado: ${totalEvents} eventos analizados`)
    return report
  } catch (error) {
    console.error('[SECURITY] Error generando reporte:', error)
    throw error
  }
}

/**
 * Genera recomendaciones de seguridad basadas en los datos del reporte
 */
function generateSecurityRecommendations(
  eventsBySeverity: Record<SecuritySeverity, number>,
  eventsByCategory: Record<SecurityEventCategory, number>,
  patternsDetected: Array<{ pattern_id: string; occurrences: number }>
): string[] {
  const recommendations: string[] = []

  // Recomendaciones basadas en severidad
  if (eventsBySeverity.critical > 0) {
    recommendations.push(
      `Se detectaron ${eventsBySeverity.critical} eventos críticos. Revisar inmediatamente.`
    )
  }

  if (eventsBySeverity.high > 10) {
    recommendations.push(
      `Alto número de eventos de severidad alta (${eventsBySeverity.high}). Considerar reforzar medidas de seguridad.`
    )
  }

  // Recomendaciones basadas en categorías
  if (eventsByCategory.authentication > 50) {
    recommendations.push(
      `Muchos eventos de autenticación (${eventsByCategory.authentication}). Considerar implementar MFA.`
    )
  }

  if (eventsByCategory.authorization > 20) {
    recommendations.push(
      `Eventos de autorización elevados (${eventsByCategory.authorization}). Revisar permisos de usuarios.`
    )
  }

  if (eventsByCategory.suspicious_behavior > 5) {
    recommendations.push(
      `Actividad sospechosa detectada (${eventsByCategory.suspicious_behavior} eventos). Monitorear de cerca.`
    )
  }

  // Recomendaciones basadas en patrones
  const highFrequencyPatterns = patternsDetected.filter(p => p.occurrences > 3)
  if (highFrequencyPatterns.length > 0) {
    recommendations.push(
      `Patrones de seguridad recurrentes detectados. Considerar medidas preventivas adicionales.`
    )
  }

  // Recomendaciones generales
  if (recommendations.length === 0) {
    recommendations.push(
      'No se detectaron problemas críticos de seguridad. Mantener monitoreo regular.'
    )
  }

  return recommendations
}

// =====================================================
// FUNCIONES DE GESTIÓN DE ALERTAS
// =====================================================

/**
 * Obtiene alertas de seguridad activas
 */
export async function getActiveSecurityAlerts(
  userId?: string,
  severity?: SecuritySeverity
): Promise<SecurityAlert[]> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible')
    }

    let query = supabaseAdmin
      .from('security_alerts')
      .select('*')
      .eq('status', 'open')
      .order('last_occurrence', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data: alerts, error } = await query

    if (error) {
      throw new Error(`Error obteniendo alertas: ${error.message}`)
    }

    return alerts || []
  } catch (error) {
    console.error('[SECURITY] Error obteniendo alertas activas:', error)
    return []
  }
}

/**
 * Actualiza el estado de una alerta
 */
export async function updateSecurityAlert(
  alertId: string,
  updates: Partial<Pick<SecurityAlert, 'status' | 'assigned_to' | 'resolution_notes'>>
): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible')
    }

    const { error } = await supabaseAdmin
      .from('security_alerts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    if (error) {
      throw new Error(`Error actualizando alerta: ${error.message}`)
    }

    console.log(`[SECURITY] Alerta ${alertId} actualizada: ${JSON.stringify(updates)}`)
    return true
  } catch (error) {
    console.error('[SECURITY] Error actualizando alerta:', error)
    return false
  }
}

/**
 * Resuelve una alerta de seguridad
 */
export async function resolveSecurityAlert(
  alertId: string,
  resolutionNotes: string,
  resolvedBy: string
): Promise<boolean> {
  return await updateSecurityAlert(alertId, {
    status: 'resolved',
    assigned_to: resolvedBy,
    resolution_notes: resolutionNotes,
  })
}

/**
 * Marca una alerta como falso positivo
 */
export async function markAlertAsFalsePositive(
  alertId: string,
  notes: string,
  markedBy: string
): Promise<boolean> {
  return await updateSecurityAlert(alertId, {
    status: 'false_positive',
    assigned_to: markedBy,
    resolution_notes: notes,
  })
}

// =====================================================
// FUNCIONES DE MONITOREO EN TIEMPO REAL
// =====================================================

/**
 * Inicia el monitoreo automático de seguridad
 * 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN
 */
export function startSecurityMonitoring(intervalMinutes: number = 5): NodeJS.Timeout {
  console.log(`[SECURITY] 🚫 MONITOREO AUTOMÁTICO TEMPORALMENTE DESHABILITADO`)
  console.log(`[SECURITY] 📋 Razón: Evitar llamadas recursivas a APIs de auth`)

  // RETORNAR UN TIMEOUT DUMMY PARA NO ROMPER EL CÓDIGO QUE LO LLAMA
  return setTimeout(() => {
    console.log('[SECURITY] Timeout dummy completado')
  }, 1000) as NodeJS.Timeout

  // CÓDIGO COMENTADO TEMPORALMENTE
  // return setInterval(async () => {
  //   try {
  //     console.log('[SECURITY] Ejecutando análisis automático...');

  //     // Analizar patrones de seguridad
  //     const alerts = await analyzeSecurityPatterns();

  //     if (alerts.length > 0) {
  //       console.log(`[SECURITY] ${alerts.length} nuevas alertas generadas`);

  //       // Procesar alertas críticas inmediatamente
  //       const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  //       if (criticalAlerts.length > 0) {
  //         console.warn(`[SECURITY] ¡${criticalAlerts.length} alertas críticas detectadas!`);
  //         // Aquí se podrían enviar notificaciones inmediatas
  //       }
  //     }

  //     // Actualizar métricas
  //     await getSecurityMetrics();

  //   } catch (error) {
  //     console.error('[SECURITY] Error en monitoreo automático:', error);
  //   }
  // }, intervalMinutes * 60 * 1000);
}

/**
 * Detiene el monitoreo automático
 */
export function stopSecurityMonitoring(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId)
  console.log('[SECURITY] Monitoreo automático detenido')
}

/**
 * Ejecuta una verificación completa de seguridad
 */
export async function runSecurityHealthCheck(): Promise<{
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
  recommendations: string[]
  metrics: SecurityMetrics
}> {
  try {
    console.log('[SECURITY] Ejecutando verificación completa de seguridad...')

    // Obtener métricas actuales
    const metrics = await getSecurityMetrics()

    // Obtener alertas activas
    const activeAlerts = await getActiveSecurityAlerts()

    const issues: string[] = []
    const recommendations: string[] = []
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Evaluar estado de seguridad
    if (metrics.critical_events_24h > 0) {
      issues.push(`${metrics.critical_events_24h} eventos críticos en las últimas 24 horas`)
      status = 'critical'
    }

    if (metrics.auth_failures_24h > 20) {
      issues.push(`Alto número de fallos de autenticación: ${metrics.auth_failures_24h}`)
      if (status !== 'critical') {
        status = 'warning'
      }
      recommendations.push('Considerar implementar medidas anti-brute force')
    }

    if (metrics.suspicious_activities_24h > 10) {
      issues.push(`Actividad sospechosa elevada: ${metrics.suspicious_activities_24h} eventos`)
      if (status !== 'critical') {
        status = 'warning'
      }
      recommendations.push('Revisar patrones de actividad sospechosa')
    }

    if (metrics.active_alerts > 5) {
      issues.push(`Muchas alertas activas sin resolver: ${metrics.active_alerts}`)
      if (status !== 'critical') {
        status = 'warning'
      }
      recommendations.push('Revisar y resolver alertas pendientes')
    }

    if (metrics.security_score < 70) {
      issues.push(`Score de seguridad bajo: ${metrics.security_score}/100`)
      if (status !== 'critical') {
        status = 'warning'
      }
      recommendations.push('Implementar medidas para mejorar el score de seguridad')
    }

    // Recomendaciones generales
    if (issues.length === 0) {
      recommendations.push('Sistema de seguridad funcionando correctamente')
      recommendations.push('Mantener monitoreo regular y actualizaciones de seguridad')
    }

    console.log(`[SECURITY] Verificación completada - Estado: ${status}`)

    return {
      status,
      issues,
      recommendations,
      metrics,
    }
  } catch (error) {
    console.error('[SECURITY] Error en verificación de seguridad:', error)
    return {
      status: 'critical',
      issues: ['Error ejecutando verificación de seguridad'],
      recommendations: ['Revisar logs del sistema'],
      metrics: await getSecurityMetrics(),
    }
  }
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * Limpia eventos de seguridad antiguos
 */
export async function cleanupOldSecurityEvents(daysToKeep: number = 90): Promise<number> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible')
    }

    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabaseAdmin
      .from('security_events')
      .delete()
      .lt('timestamp', cutoffDate)

    if (error) {
      throw new Error(`Error limpiando eventos: ${error.message}`)
    }

    const deletedCount = Array.isArray(data) ? data.length : 0
    console.log(`[SECURITY] Limpieza completada: ${deletedCount} eventos eliminados`)

    return deletedCount
  } catch (error) {
    console.error('[SECURITY] Error en limpieza de eventos:', error)
    return 0
  }
}

/**
 * Exporta eventos de seguridad para análisis externo
 */
export async function exportSecurityEvents(
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible')
    }

    const { data: events, error } = await supabaseAdmin
      .from('security_events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true })

    if (error) {
      throw new Error(`Error exportando eventos: ${error.message}`)
    }

    if (format === 'json') {
      return JSON.stringify(events, null, 2)
    } else {
      // Formato CSV
      if (!events || events.length === 0) {
        return 'No hay eventos para exportar'
      }

      const headers = Object.keys(events[0]).join(',')
      const rows = events.map(event =>
        Object.values(event)
          .map(value => (typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value))
          .join(',')
      )

      return [headers, ...rows].join('\n')
    }
  } catch (error) {
    console.error('[SECURITY] Error exportando eventos:', error)
    throw error
  }
}
