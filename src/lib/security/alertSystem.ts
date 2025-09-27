// ===================================
// PINTEYA E-COMMERCE - SISTEMA DE ALERTAS AUTOMÁTICAS
// ===================================

import { supabaseAdmin } from '@/lib/integrations/supabase'
import { AnomalyDetector } from './anomalyDetection'

// Tipos para el sistema de alertas
export interface SecurityAlert {
  id: string
  user_id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  metadata: Record<string, any>
  is_read: boolean
  is_resolved: boolean
  created_at: string
  resolved_at?: string
}

export interface AlertRule {
  id: string
  name: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  conditions: Record<string, any>
  actions: string[]
}

export interface AlertNotification {
  type: 'email' | 'push' | 'sms'
  recipient: string
  subject: string
  message: string
  metadata?: Record<string, any>
}

// Clase principal del sistema de alertas
export class SecurityAlertSystem {
  private static instance: SecurityAlertSystem
  private anomalyDetector: AnomalyDetector

  public static getInstance(): SecurityAlertSystem {
    if (!SecurityAlertSystem.instance) {
      SecurityAlertSystem.instance = new SecurityAlertSystem()
    }
    return SecurityAlertSystem.instance
  }

  constructor() {
    this.anomalyDetector = AnomalyDetector.getInstance()
  }

  // Crear una nueva alerta de seguridad
  async createAlert(
    userId: string,
    type: string,
    severity: SecurityAlert['severity'],
    title: string,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<SecurityAlert | null> {
    try {
      const { data: alert, error } = await supabaseAdmin
        .from('user_security_alerts')
        .insert({
          user_id: userId,
          type,
          severity,
          title,
          description,
          metadata,
          is_read: false,
          is_resolved: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Error al crear alerta de seguridad:', error)
        return null
      }

      // Enviar notificaciones según la severidad
      await this.sendAlertNotifications(alert)

      return alert
    } catch (error) {
      console.error('Error en createAlert:', error)
      return null
    }
  }

  // Procesar alertas automáticas para un usuario
  async processAutomaticAlerts(userId: string, sessionData: any): Promise<void> {
    try {
      // Detectar anomalías
      const anomalies = await this.anomalyDetector.analyzeSession(sessionData)

      for (const anomaly of anomalies) {
        if (anomaly.isAnomalous) {
          await this.createAlert(
            userId,
            anomaly.type,
            anomaly.severity,
            this.getAlertTitle(anomaly.type),
            anomaly.description,
            {
              ...anomaly.metadata,
              detection_time: new Date().toISOString(),
              session_data: sessionData,
            }
          )
        }
      }

      // Verificar otras condiciones de alerta
      await this.checkLoginFromNewLocation(userId, sessionData)
      await this.checkMultipleConcurrentSessions(userId)
      await this.checkSuspiciousActivity(userId)
    } catch (error) {
      console.error('Error al procesar alertas automáticas:', error)
    }
  }

  // Verificar login desde nueva ubicación
  private async checkLoginFromNewLocation(userId: string, sessionData: any): Promise<void> {
    try {
      const { data: recentSessions } = await supabaseAdmin
        .from('user_sessions')
        .select('location, ip_address')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10)

      const currentLocation = sessionData.location
      const currentIP = sessionData.ipAddress

      if (recentSessions && recentSessions.length > 0) {
        const knownLocations = recentSessions.map(s => s.location).filter(Boolean)
        const knownIPs = recentSessions.map(s => s.ip_address).filter(Boolean)

        const isNewLocation = currentLocation && !knownLocations.includes(currentLocation)
        const isNewIP = currentIP && !knownIPs.includes(currentIP)

        if (isNewLocation || isNewIP) {
          await this.createAlert(
            userId,
            'new_location_login',
            'medium',
            'Acceso desde nueva ubicación',
            `Se detectó un acceso desde una nueva ubicación: ${currentLocation || 'Ubicación desconocida'}`,
            {
              new_location: currentLocation,
              new_ip: currentIP,
              known_locations: knownLocations,
              known_ips: knownIPs,
            }
          )
        }
      }
    } catch (error) {
      console.error('Error al verificar nueva ubicación:', error)
    }
  }

  // Verificar múltiples sesiones concurrentes
  private async checkMultipleConcurrentSessions(userId: string): Promise<void> {
    try {
      const { data: activeSessions } = await supabaseAdmin
        .from('user_sessions')
        .select('id, ip_address, device_name, location')
        .eq('user_id', userId)
        .gte('last_activity', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Últimos 30 minutos

      if (activeSessions && activeSessions.length > 3) {
        const uniqueIPs = new Set(activeSessions.map(s => s.ip_address)).size
        const uniqueDevices = new Set(activeSessions.map(s => s.device_name)).size

        if (uniqueIPs > 2 || uniqueDevices > 3) {
          await this.createAlert(
            userId,
            'multiple_concurrent_sessions',
            'high',
            'Múltiples sesiones activas detectadas',
            `Se detectaron ${activeSessions.length} sesiones activas desde ${uniqueIPs} ubicaciones diferentes`,
            {
              total_sessions: activeSessions.length,
              unique_ips: uniqueIPs,
              unique_devices: uniqueDevices,
              sessions: activeSessions,
            }
          )
        }
      }
    } catch (error) {
      console.error('Error al verificar sesiones concurrentes:', error)
    }
  }

  // Verificar actividad sospechosa
  private async checkSuspiciousActivity(userId: string): Promise<void> {
    try {
      // Verificar intentos de login fallidos recientes
      const { data: failedLogins } = await supabaseAdmin
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .eq('action', 'login_failed')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Última hora
        .order('created_at', { ascending: false })

      if (failedLogins && failedLogins.length >= 5) {
        await this.createAlert(
          userId,
          'suspicious_login_attempts',
          'high',
          'Múltiples intentos de acceso fallidos',
          `Se detectaron ${failedLogins.length} intentos de acceso fallidos en la última hora`,
          {
            failed_attempts: failedLogins.length,
            time_window: '1 hour',
            attempts: failedLogins.slice(0, 5), // Solo los primeros 5
          }
        )
      }

      // Verificar cambios críticos de configuración
      const { data: criticalChanges } = await supabaseAdmin
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .in('action', ['password_change', 'email_change', 'enable_2fa', 'disable_2fa'])
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24 horas
        .order('created_at', { ascending: false })

      if (criticalChanges && criticalChanges.length >= 3) {
        await this.createAlert(
          userId,
          'multiple_critical_changes',
          'medium',
          'Múltiples cambios críticos detectados',
          `Se realizaron ${criticalChanges.length} cambios críticos en las últimas 24 horas`,
          {
            changes_count: criticalChanges.length,
            time_window: '24 hours',
            changes: criticalChanges,
          }
        )
      }
    } catch (error) {
      console.error('Error al verificar actividad sospechosa:', error)
    }
  }

  // Enviar notificaciones de alerta
  private async sendAlertNotifications(alert: SecurityAlert): Promise<void> {
    try {
      // Obtener preferencias de notificación del usuario
      const { data: userPrefs } = await supabaseAdmin
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', alert.user_id)
        .single()

      const notificationPrefs = userPrefs?.preferences?.notifications || {}

      // Solo enviar si las alertas de seguridad están habilitadas
      if (!notificationPrefs.securityAlerts) {
        return
      }

      const notifications: AlertNotification[] = []

      // Email para alertas críticas y altas
      if (alert.severity === 'critical' || alert.severity === 'high') {
        if (notificationPrefs.emailNotifications) {
          notifications.push({
            type: 'email',
            recipient: alert.user_id,
            subject: `🔒 Alerta de Seguridad: ${alert.title}`,
            message: this.generateEmailMessage(alert),
            metadata: { alert_id: alert.id },
          })
        }
      }

      // Push notifications para todas las alertas
      if (notificationPrefs.pushNotifications) {
        notifications.push({
          type: 'push',
          recipient: alert.user_id,
          subject: alert.title,
          message: alert.description,
          metadata: { alert_id: alert.id, severity: alert.severity },
        })
      }

      // Enviar notificaciones (implementación pendiente)
      for (const notification of notifications) {
        await this.sendNotification(notification)
      }
    } catch (error) {
      console.error('Error al enviar notificaciones de alerta:', error)
    }
  }

  // Generar mensaje de email para alerta
  private generateEmailMessage(alert: SecurityAlert): string {
    return `
      Hola,

      Se ha detectado una alerta de seguridad en tu cuenta de Pinteya:

      Tipo: ${alert.title}
      Severidad: ${alert.severity.toUpperCase()}
      Descripción: ${alert.description}
      Fecha: ${new Date(alert.created_at).toLocaleString('es-AR')}

      Te recomendamos revisar tu cuenta y tomar las medidas necesarias si no reconoces esta actividad.

      Puedes revisar todas tus alertas de seguridad en: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/security

      Saludos,
      Equipo de Seguridad de Pinteya
    `
  }

  // Enviar notificación (placeholder para implementación futura)
  private async sendNotification(notification: AlertNotification): Promise<void> {
    // Aquí se implementaría el envío real de notificaciones
    console.log('Enviando notificación:', notification)
  }

  // Obtener título de alerta según el tipo
  private getAlertTitle(type: string): string {
    const titles: Record<string, string> = {
      new_location_login: 'Acceso desde nueva ubicación',
      multiple_concurrent_sessions: 'Múltiples sesiones activas',
      suspicious_login_attempts: 'Intentos de acceso sospechosos',
      multiple_critical_changes: 'Múltiples cambios críticos',
      unusual_time_access: 'Acceso en horario inusual',
      impossible_travel: 'Viaje imposible detectado',
      device_anomaly: 'Dispositivo anómalo detectado',
      ip_reputation_alert: 'IP con reputación sospechosa',
    }

    return titles[type] || 'Alerta de seguridad'
  }

  // Marcar alerta como leída
  async markAlertAsRead(alertId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('user_security_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .eq('user_id', userId)

      return !error
    } catch (error) {
      console.error('Error al marcar alerta como leída:', error)
      return false
    }
  }

  // Resolver alerta
  async resolveAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('user_security_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .eq('user_id', userId)

      return !error
    } catch (error) {
      console.error('Error al resolver alerta:', error)
      return false
    }
  }

  // Obtener alertas de un usuario
  async getUserAlerts(
    userId: string,
    filters: {
      severity?: string
      type?: string
      is_read?: boolean
      is_resolved?: boolean
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ alerts: SecurityAlert[]; total: number }> {
    try {
      let query = supabaseAdmin
        .from('user_security_alerts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      // Aplicar filtros
      if (filters.severity) {
        query = query.eq('severity', filters.severity)
      }
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read)
      }
      if (filters.is_resolved !== undefined) {
        query = query.eq('is_resolved', filters.is_resolved)
      }

      // Paginación
      const limit = filters.limit || 50
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      // Ordenar por fecha de creación (más recientes primero)
      query = query.order('created_at', { ascending: false })

      const { data: alerts, error, count } = await query

      if (error) {
        console.error('Error al obtener alertas:', error)
        return { alerts: [], total: 0 }
      }

      return { alerts: alerts || [], total: count || 0 }
    } catch (error) {
      console.error('Error en getUserAlerts:', error)
      return { alerts: [], total: 0 }
    }
  }
}

// Función auxiliar para procesar alertas automáticas
export async function processUserSecurityAlerts(userId: string, sessionData: any): Promise<void> {
  const alertSystem = SecurityAlertSystem.getInstance()
  await alertSystem.processAutomaticAlerts(userId, sessionData)
}

// Función auxiliar para crear alerta manual
export async function createSecurityAlert(
  userId: string,
  type: string,
  severity: SecurityAlert['severity'],
  title: string,
  description: string,
  metadata: Record<string, any> = {}
): Promise<SecurityAlert | null> {
  const alertSystem = SecurityAlertSystem.getInstance()
  return await alertSystem.createAlert(userId, type, severity, title, description, metadata)
}

export default SecurityAlertSystem
