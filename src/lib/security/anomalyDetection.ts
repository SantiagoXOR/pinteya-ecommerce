// ===================================
// PINTEYA E-COMMERCE - SISTEMA DE DETECCIÓN DE ANOMALÍAS
// ===================================

import { supabaseAdmin } from '@/lib/integrations/supabase'

// Tipos para detección de anomalías
export interface AnomalyDetectionResult {
  isAnomalous: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  description: string
  metadata: Record<string, any>
  recommendations: string[]
}

export interface SessionAnalysis {
  userId: string
  sessionId: string
  ipAddress: string
  userAgent: string
  deviceType: string
  location?: string
  timestamp: string
}

export interface UserBehaviorPattern {
  userId: string
  commonIPs: string[]
  commonDevices: string[]
  commonLocations: string[]
  typicalLoginHours: number[]
  averageSessionDuration: number
  lastSeenDevices: Array<{
    deviceName: string
    lastSeen: string
    trustLevel: number
  }>
}

// Clase principal para detección de anomalías
export class AnomalyDetector {
  private static instance: AnomalyDetector

  public static getInstance(): AnomalyDetector {
    if (!AnomalyDetector.instance) {
      AnomalyDetector.instance = new AnomalyDetector()
    }
    return AnomalyDetector.instance
  }

  // Analizar nueva sesión para detectar anomalías
  async analyzeSession(sessionData: SessionAnalysis): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = []

    try {
      // Obtener patrón de comportamiento del usuario
      const userPattern = await this.getUserBehaviorPattern(sessionData.userId)

      // Detectar IP nueva o sospechosa
      const ipAnomaly = await this.detectIPAnomaly(sessionData, userPattern)
      if (ipAnomaly.isAnomalous) {
        anomalies.push(ipAnomaly)
      }

      // Detectar dispositivo nuevo
      const deviceAnomaly = await this.detectDeviceAnomaly(sessionData, userPattern)
      if (deviceAnomaly.isAnomalous) {
        anomalies.push(deviceAnomaly)
      }

      // Detectar horario inusual
      const timeAnomaly = await this.detectTimeAnomaly(sessionData, userPattern)
      if (timeAnomaly.isAnomalous) {
        anomalies.push(timeAnomaly)
      }

      // Detectar múltiples sesiones simultáneas
      const concurrentAnomaly = await this.detectConcurrentSessionsAnomaly(sessionData)
      if (concurrentAnomaly.isAnomalous) {
        anomalies.push(concurrentAnomaly)
      }

      // Detectar velocidad de viaje imposible
      const travelAnomaly = await this.detectImpossibleTravelAnomaly(sessionData, userPattern)
      if (travelAnomaly.isAnomalous) {
        anomalies.push(travelAnomaly)
      }
    } catch (error) {
      console.error('Error en detección de anomalías:', error)
    }

    return anomalies
  }

  // Obtener patrón de comportamiento del usuario
  private async getUserBehaviorPattern(userId: string): Promise<UserBehaviorPattern> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Obtener sesiones de los últimos 30 días
    const { data: sessions } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo)

    if (!sessions || sessions.length === 0) {
      return {
        userId,
        commonIPs: [],
        commonDevices: [],
        commonLocations: [],
        typicalLoginHours: [],
        averageSessionDuration: 0,
        lastSeenDevices: [],
      }
    }

    // Analizar IPs comunes
    const ipCounts = sessions.reduce(
      (acc, session) => {
        acc[session.ip_address] = (acc[session.ip_address] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const commonIPs = Object.entries(ipCounts)
      .filter(([_, count]) => count >= 3)
      .map(([ip]) => ip)

    // Analizar dispositivos comunes
    const deviceCounts = sessions.reduce(
      (acc, session) => {
        acc[session.device_name] = (acc[session.device_name] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const commonDevices = Object.entries(deviceCounts)
      .filter(([_, count]) => count >= 2)
      .map(([device]) => device)

    // Analizar horarios típicos
    const loginHours = sessions.map(session => new Date(session.created_at).getHours())

    const hourCounts = loginHours.reduce(
      (acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      },
      {} as Record<number, number>
    )

    const typicalLoginHours = Object.entries(hourCounts)
      .filter(([_, count]) => count >= 2)
      .map(([hour]) => parseInt(hour))

    // Calcular duración promedio de sesión
    const sessionDurations = sessions.map(session => {
      const created = new Date(session.created_at).getTime()
      const lastActivity = new Date(session.last_activity).getTime()
      return lastActivity - created
    })

    const averageSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0

    // Dispositivos vistos recientemente
    const lastSeenDevices = Object.entries(deviceCounts)
      .map(([device, count]) => ({
        deviceName: device,
        lastSeen:
          sessions
            .filter(s => s.device_name === device)
            .sort(
              (a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
            )[0]?.last_activity || '',
        trustLevel: Math.min(count / 10, 1), // Nivel de confianza basado en frecuencia
      }))
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())

    return {
      userId,
      commonIPs,
      commonDevices,
      commonLocations: [], // TODO: Implementar geolocalización
      typicalLoginHours,
      averageSessionDuration,
      lastSeenDevices,
    }
  }

  // Detectar anomalía de IP
  private async detectIPAnomaly(
    sessionData: SessionAnalysis,
    userPattern: UserBehaviorPattern
  ): Promise<AnomalyDetectionResult> {
    const isNewIP = !userPattern.commonIPs.includes(sessionData.ipAddress)

    if (isNewIP && userPattern.commonIPs.length > 0) {
      return {
        isAnomalous: true,
        severity: 'medium',
        type: 'new_ip_address',
        description: 'Inicio de sesión desde una nueva dirección IP',
        metadata: {
          newIP: sessionData.ipAddress,
          knownIPs: userPattern.commonIPs,
          sessionId: sessionData.sessionId,
        },
        recommendations: [
          'Verificar si el inicio de sesión fue autorizado',
          'Considerar marcar el dispositivo como confiable si es legítimo',
          'Revisar actividad reciente en la cuenta',
        ],
      }
    }

    return {
      isAnomalous: false,
      severity: 'low',
      type: '',
      description: '',
      metadata: {},
      recommendations: [],
    }
  }

  // Detectar anomalía de dispositivo
  private async detectDeviceAnomaly(
    sessionData: SessionAnalysis,
    userPattern: UserBehaviorPattern
  ): Promise<AnomalyDetectionResult> {
    const deviceName = `${sessionData.deviceType} ${sessionData.userAgent.split(' ')[0]}`
    const isNewDevice = !userPattern.commonDevices.some(device =>
      device.toLowerCase().includes(sessionData.deviceType.toLowerCase())
    )

    if (isNewDevice && userPattern.commonDevices.length > 0) {
      return {
        isAnomalous: true,
        severity: 'medium',
        type: 'new_device',
        description: 'Inicio de sesión desde un nuevo dispositivo',
        metadata: {
          newDevice: deviceName,
          deviceType: sessionData.deviceType,
          userAgent: sessionData.userAgent,
          knownDevices: userPattern.commonDevices,
        },
        recommendations: [
          'Verificar si el dispositivo es de confianza',
          'Considerar activar autenticación de dos factores',
          'Revisar configuración de alertas de seguridad',
        ],
      }
    }

    return {
      isAnomalous: false,
      severity: 'low',
      type: '',
      description: '',
      metadata: {},
      recommendations: [],
    }
  }

  // Detectar anomalía de horario
  private async detectTimeAnomaly(
    sessionData: SessionAnalysis,
    userPattern: UserBehaviorPattern
  ): Promise<AnomalyDetectionResult> {
    const loginHour = new Date(sessionData.timestamp).getHours()
    const isUnusualTime =
      userPattern.typicalLoginHours.length > 0 && !userPattern.typicalLoginHours.includes(loginHour)

    // Solo considerar anómalo si es muy fuera del patrón (más de 6 horas de diferencia)
    if (isUnusualTime && userPattern.typicalLoginHours.length >= 5) {
      const hourDifferences = userPattern.typicalLoginHours.map(hour =>
        Math.min(Math.abs(hour - loginHour), 24 - Math.abs(hour - loginHour))
      )
      const minDifference = Math.min(...hourDifferences)

      if (minDifference >= 6) {
        return {
          isAnomalous: true,
          severity: 'low',
          type: 'unusual_time',
          description: 'Inicio de sesión en horario inusual',
          metadata: {
            loginHour,
            typicalHours: userPattern.typicalLoginHours,
            hourDifference: minDifference,
          },
          recommendations: [
            'Verificar si el horario corresponde a tu zona horaria',
            'Considerar si estás viajando o en una ubicación diferente',
          ],
        }
      }
    }

    return {
      isAnomalous: false,
      severity: 'low',
      type: '',
      description: '',
      metadata: {},
      recommendations: [],
    }
  }

  // Detectar múltiples sesiones concurrentes
  private async detectConcurrentSessionsAnomaly(
    sessionData: SessionAnalysis
  ): Promise<AnomalyDetectionResult> {
    const { data: activeSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('id, ip_address, device_name')
      .eq('user_id', sessionData.userId)
      .gte('last_activity', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Últimas 1 hora

    if (activeSessions && activeSessions.length > 3) {
      const uniqueIPs = new Set(activeSessions.map(s => s.ip_address)).size
      const uniqueDevices = new Set(activeSessions.map(s => s.device_name)).size

      if (uniqueIPs > 2 || uniqueDevices > 3) {
        return {
          isAnomalous: true,
          severity: 'high',
          type: 'multiple_concurrent_sessions',
          description: 'Múltiples sesiones activas desde diferentes ubicaciones o dispositivos',
          metadata: {
            totalSessions: activeSessions.length,
            uniqueIPs,
            uniqueDevices,
            sessions: activeSessions,
          },
          recommendations: [
            'Revisar todas las sesiones activas',
            'Cerrar sesiones no autorizadas',
            'Cambiar contraseña si es necesario',
            'Activar autenticación de dos factores',
          ],
        }
      }
    }

    return {
      isAnomalous: false,
      severity: 'low',
      type: '',
      description: '',
      metadata: {},
      recommendations: [],
    }
  }

  // Detectar viaje imposible (placeholder - requiere geolocalización)
  private async detectImpossibleTravelAnomaly(
    sessionData: SessionAnalysis,
    userPattern: UserBehaviorPattern
  ): Promise<AnomalyDetectionResult> {
    // TODO: Implementar detección de viaje imposible con geolocalización
    // Por ahora, solo detectamos cambios rápidos de IP

    const { data: recentSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('ip_address, created_at')
      .eq('user_id', sessionData.userId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Última hora
      .neq('ip_address', sessionData.ipAddress)
      .order('created_at', { ascending: false })
      .limit(1)

    if (recentSessions && recentSessions.length > 0) {
      const lastSession = recentSessions[0]
      const timeDiff =
        new Date(sessionData.timestamp).getTime() - new Date(lastSession.created_at).getTime()
      const timeDiffMinutes = timeDiff / (1000 * 60)

      // Si hay cambio de IP en menos de 30 minutos, podría ser sospechoso
      if (timeDiffMinutes < 30) {
        return {
          isAnomalous: true,
          severity: 'medium',
          type: 'rapid_location_change',
          description: 'Cambio rápido de ubicación detectado',
          metadata: {
            previousIP: lastSession.ip_address,
            currentIP: sessionData.ipAddress,
            timeDifferenceMinutes: Math.round(timeDiffMinutes),
          },
          recommendations: [
            'Verificar si estás usando VPN o proxy',
            'Confirmar que ambos inicios de sesión son legítimos',
            'Revisar configuración de red',
          ],
        }
      }
    }

    return {
      isAnomalous: false,
      severity: 'low',
      type: '',
      description: '',
      metadata: {},
      recommendations: [],
    }
  }

  // Crear alerta de seguridad
  async createSecurityAlert(userId: string, anomaly: AnomalyDetectionResult): Promise<void> {
    try {
      await supabaseAdmin.from('user_security_alerts').insert({
        user_id: userId,
        type: anomaly.type,
        severity: anomaly.severity,
        title: anomaly.description,
        description: `${anomaly.description}. ${anomaly.recommendations.join(' ')}`,
        metadata: anomaly.metadata,
      })
    } catch (error) {
      console.error('Error creando alerta de seguridad:', error)
    }
  }
}

// Función de utilidad para analizar sesión
export async function analyzeSessionForAnomalies(sessionData: SessionAnalysis): Promise<void> {
  const detector = AnomalyDetector.getInstance()
  const anomalies = await detector.analyzeSession(sessionData)

  // Crear alertas para anomalías detectadas
  for (const anomaly of anomalies) {
    if (anomaly.isAnomalous) {
      await detector.createSecurityAlert(sessionData.userId, anomaly)

      // Log para debugging
      console.log(`[ANOMALY DETECTED] ${anomaly.type} - ${anomaly.description}`, {
        userId: sessionData.userId,
        severity: anomaly.severity,
        metadata: anomaly.metadata,
      })
    }
  }
}
