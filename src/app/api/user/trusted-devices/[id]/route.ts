// ===================================
// PINTEYA E-COMMERCE - API DE DISPOSITIVO DE CONFIANZA INDIVIDUAL
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { logSecurityActivity, getRequestInfo } from '@/lib/activity/activityLogger'

// PATCH - Actualizar estado de confianza de un dispositivo
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const deviceId = params.id
    const body = await request.json()
    const { is_trusted } = body

    if (typeof is_trusted !== 'boolean') {
      return NextResponse.json({ error: 'Estado de confianza requerido' }, { status: 400 })
    }

    // Verificar que el dispositivo pertenece al usuario
    const { data: existingDevice, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingDevice) {
      return NextResponse.json({ error: 'Dispositivo no encontrado' }, { status: 404 })
    }

    // Actualizar estado de confianza
    const { data: updatedDevice, error } = await supabaseAdmin
      .from('user_sessions')
      .update({ is_trusted })
      .eq('id', deviceId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar dispositivo:', error)
      return NextResponse.json({ error: 'Error al actualizar dispositivo' }, { status: 500 })
    }

    // Registrar actividad de seguridad
    const requestInfo = getRequestInfo(request)
    await logSecurityActivity(
      userId,
      is_trusted ? 'trust_device' : 'untrust_device',
      {
        device_id: deviceId,
        device_name: updatedDevice.device_name,
        device_type: updatedDevice.device_type,
        ip_address: updatedDevice.ip_address,
        previous_trust_status: existingDevice.is_trusted,
        new_trust_status: is_trusted,
      },
      requestInfo
    )

    return NextResponse.json({
      success: true,
      device: updatedDevice,
      message: is_trusted
        ? 'Dispositivo marcado como confiable'
        : 'Confianza removida del dispositivo',
    })
  } catch (error) {
    console.error('Error en PATCH /api/user/trusted-devices/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar dispositivo de confianza y cerrar sesiones
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const deviceId = params.id

    // Verificar que el dispositivo pertenece al usuario
    const { data: existingDevice, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingDevice) {
      return NextResponse.json({ error: 'Dispositivo no encontrado' }, { status: 404 })
    }

    // Eliminar todas las sesiones de este dispositivo
    const { error: deleteError } = await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error al eliminar dispositivo:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar dispositivo' }, { status: 500 })
    }

    // Registrar actividad de seguridad
    const requestInfo = getRequestInfo(request)
    await logSecurityActivity(
      userId,
      'remove_trusted_device',
      {
        device_id: deviceId,
        device_name: existingDevice.device_name,
        device_type: existingDevice.device_type,
        ip_address: existingDevice.ip_address,
        was_trusted: existingDevice.is_trusted,
      },
      requestInfo
    )

    return NextResponse.json({
      success: true,
      message: 'Dispositivo eliminado correctamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/user/trusted-devices/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// GET - Obtener información detallada de un dispositivo
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const deviceId = params.id

    // Obtener información del dispositivo
    const { data: device, error } = await supabaseAdmin
      .from('user_sessions')
      .select(
        `
        id,
        device_type,
        device_name,
        browser,
        os,
        ip_address,
        location,
        user_agent,
        is_trusted,
        last_activity,
        created_at
      `
      )
      .eq('id', deviceId)
      .eq('user_id', userId)
      .single()

    if (error || !device) {
      return NextResponse.json({ error: 'Dispositivo no encontrado' }, { status: 404 })
    }

    // Obtener historial de actividad reciente para este dispositivo
    const { data: recentActivity } = await supabaseAdmin
      .from('user_activity')
      .select('action, description, created_at')
      .eq('user_id', userId)
      .eq('metadata->>session_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calcular estadísticas del dispositivo
    const stats = await calculateDeviceStats(userId, device)

    return NextResponse.json({
      success: true,
      device: {
        ...device,
        trust_level: calculateTrustLevel(device),
        stats,
        recent_activity: recentActivity || [],
      },
    })
  } catch (error) {
    console.error('Error en GET /api/user/trusted-devices/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Función para calcular estadísticas del dispositivo
async function calculateDeviceStats(userId: string, device: any) {
  try {
    // Obtener todas las sesiones de este dispositivo
    const { data: allSessions } = await supabaseAdmin
      .from('user_sessions')
      .select('created_at, last_activity')
      .eq('user_id', userId)
      .eq('device_name', device.device_name)
      .eq('ip_address', device.ip_address)

    if (!allSessions || allSessions.length === 0) {
      return {
        total_sessions: 0,
        first_seen: device.created_at,
        total_usage_hours: 0,
        average_session_duration: 0,
      }
    }

    // Calcular estadísticas
    const totalSessions = allSessions.length
    const firstSeen = allSessions.reduce((earliest, session) => {
      return new Date(session.created_at) < new Date(earliest) ? session.created_at : earliest
    }, allSessions[0].created_at)

    // Calcular duración total de uso (aproximada)
    let totalUsageMinutes = 0
    allSessions.forEach(session => {
      const start = new Date(session.created_at)
      const end = new Date(session.last_activity)
      const durationMinutes = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60))
      totalUsageMinutes += Math.min(durationMinutes, 480) // Máximo 8 horas por sesión
    })

    const totalUsageHours = Math.round(totalUsageMinutes / 60)
    const averageSessionDuration = Math.round(totalUsageMinutes / totalSessions)

    return {
      total_sessions: totalSessions,
      first_seen: firstSeen,
      total_usage_hours: totalUsageHours,
      average_session_duration: averageSessionDuration,
    }
  } catch (error) {
    console.error('Error al calcular estadísticas del dispositivo:', error)
    return {
      total_sessions: 0,
      first_seen: device.created_at,
      total_usage_hours: 0,
      average_session_duration: 0,
    }
  }
}

// Función para calcular nivel de confianza (reutilizada)
function calculateTrustLevel(device: any): number {
  let trustLevel = 50 // Base

  const now = new Date()
  const lastActivity = new Date(device.last_activity)
  const createdAt = new Date(device.created_at)

  // Antigüedad del dispositivo (máximo +30 puntos)
  const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  if (ageInDays > 30) trustLevel += 30
  else if (ageInDays > 7) trustLevel += 20
  else if (ageInDays > 1) trustLevel += 10

  // Actividad reciente (máximo +20 puntos)
  const inactiveHours = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60))
  if (inactiveHours < 1) trustLevel += 20
  else if (inactiveHours < 24) trustLevel += 15
  else if (inactiveHours < 168) trustLevel += 10
  else if (inactiveHours < 720) trustLevel += 5

  // Tipo de dispositivo
  if (device.device_type === 'desktop') trustLevel += 5
  else if (device.device_type === 'mobile') trustLevel += 3

  // Ubicación conocida
  if (device.location) trustLevel += 5

  return Math.min(100, Math.max(0, trustLevel))
}
