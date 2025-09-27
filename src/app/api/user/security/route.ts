// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API DE CONFIGURACIÓN DE SEGURIDAD
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { supabaseAdmin } from '@/lib/integrations/supabase'

// Tipos para configuración de seguridad
export interface SecuritySettings {
  id: string
  user_id: string
  two_factor_enabled: boolean
  login_alerts: boolean
  suspicious_activity_alerts: boolean
  new_device_alerts: boolean
  password_change_alerts: boolean
  trusted_devices_only: boolean
  session_timeout: number // en minutos
  max_concurrent_sessions: number
  created_at: string
  updated_at: string
}

export interface SecurityAlert {
  id: string
  user_id: string
  type: 'login' | 'suspicious_activity' | 'new_device' | 'password_change' | 'session_timeout'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  metadata?: Record<string, any>
  is_read: boolean
  is_resolved: boolean
  created_at: string
}

// GET - Obtener configuración de seguridad del usuario
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Obtener usuario por email
    const userEmail = session.user.email
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener configuración de seguridad
    const { data: securitySettings, error } = await supabaseAdmin
      .from('user_security_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error('Error al obtener configuración de seguridad:', error)
      return NextResponse.json(
        { error: 'Error al obtener configuración de seguridad' },
        { status: 500 }
      )
    }

    // Si no existe configuración, crear una por defecto
    if (!securitySettings) {
      const defaultSettings: Omit<SecuritySettings, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        two_factor_enabled: false,
        login_alerts: true,
        suspicious_activity_alerts: true,
        new_device_alerts: true,
        password_change_alerts: true,
        trusted_devices_only: false,
        session_timeout: 30, // 30 días
        max_concurrent_sessions: 5,
      }

      const { data: newSettings, error: createError } = await supabaseAdmin
        .from('user_security_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (createError) {
        console.error('Error al crear configuración por defecto:', createError)
        return NextResponse.json(
          { error: 'Error al crear configuración de seguridad' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        settings: newSettings,
      })
    }

    // Obtener alertas de seguridad recientes
    const { data: alerts } = await supabaseAdmin
      .from('user_security_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(10)

    // Obtener estadísticas de seguridad
    const stats = await getSecurityStats(user.id)

    return NextResponse.json({
      success: true,
      settings: securitySettings,
      alerts: alerts || [],
      stats,
    })
  } catch (error) {
    console.error('Error en GET /api/user/security:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar configuración de seguridad
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Obtener usuario por email
    const userEmail = session.user.email
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const {
      two_factor_enabled,
      login_alerts,
      suspicious_activity_alerts,
      new_device_alerts,
      password_change_alerts,
      trusted_devices_only,
      session_timeout,
      max_concurrent_sessions,
    } = body

    // Validar datos
    if (session_timeout && (session_timeout < 1 || session_timeout > 43200)) {
      // máximo 30 días
      return NextResponse.json(
        { error: 'Timeout de sesión debe estar entre 1 y 43200 minutos' },
        { status: 400 }
      )
    }

    if (max_concurrent_sessions && (max_concurrent_sessions < 1 || max_concurrent_sessions > 20)) {
      return NextResponse.json(
        { error: 'Máximo de sesiones concurrentes debe estar entre 1 y 20' },
        { status: 400 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (typeof two_factor_enabled === 'boolean') {
      updateData.two_factor_enabled = two_factor_enabled
    }
    if (typeof login_alerts === 'boolean') {
      updateData.login_alerts = login_alerts
    }
    if (typeof suspicious_activity_alerts === 'boolean') {
      updateData.suspicious_activity_alerts = suspicious_activity_alerts
    }
    if (typeof new_device_alerts === 'boolean') {
      updateData.new_device_alerts = new_device_alerts
    }
    if (typeof password_change_alerts === 'boolean') {
      updateData.password_change_alerts = password_change_alerts
    }
    if (typeof trusted_devices_only === 'boolean') {
      updateData.trusted_devices_only = trusted_devices_only
    }
    if (session_timeout) {
      updateData.session_timeout = session_timeout
    }
    if (max_concurrent_sessions) {
      updateData.max_concurrent_sessions = max_concurrent_sessions
    }

    // Actualizar configuración
    const { data: updatedSettings, error } = await supabaseAdmin
      .from('user_security_settings')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar configuración de seguridad:', error)
      return NextResponse.json(
        { error: 'Error al actualizar configuración de seguridad' },
        { status: 500 }
      )
    }

    // Registrar actividad
    await logSecurityActivity(user.id, 'security_settings_updated', {
      changes: updateData,
      ip_address: getClientIP(request),
    })

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: 'Configuración de seguridad actualizada exitosamente',
    })
  } catch (error) {
    console.error('Error en PUT /api/user/security:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Función auxiliar para obtener estadísticas de seguridad
async function getSecurityStats(userId: string) {
  try {
    // Contar sesiones activas
    const { count: activeSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Contar alertas no resueltas
    const { count: unresolvedAlerts } = await supabaseAdmin
      .from('user_security_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_resolved', false)

    // Última actividad sospechosa
    const { data: lastSuspiciousActivity } = await supabaseAdmin
      .from('user_activity')
      .select('created_at')
      .eq('user_id', userId)
      .eq('category', 'security')
      .order('created_at', { ascending: false })
      .limit(1)

    // Dispositivos únicos (últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('device_name, ip_address')
      .eq('user_id', userId)
      .gte('last_activity', thirtyDaysAgo)

    const uniqueDevices = new Set(recentSessions?.map(s => `${s.device_name}-${s.ip_address}`)).size

    return {
      activeSessions: activeSessions || 0,
      unresolvedAlerts: unresolvedAlerts || 0,
      lastSuspiciousActivity: lastSuspiciousActivity?.[0]?.created_at || null,
      uniqueDevicesLast30Days: uniqueDevices || 0,
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de seguridad:', error)
    return {
      activeSessions: 0,
      unresolvedAlerts: 0,
      lastSuspiciousActivity: null,
      uniqueDevicesLast30Days: 0,
    }
  }
}

// Función auxiliar para registrar actividad de seguridad
async function logSecurityActivity(userId: string, action: string, metadata: any) {
  try {
    await supabaseAdmin.from('user_activity').insert({
      user_id: userId,
      action,
      category: 'security',
      metadata,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error al registrar actividad de seguridad:', error)
  }
}

// Función auxiliar para obtener IP del cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return request.ip || 'unknown'
}
