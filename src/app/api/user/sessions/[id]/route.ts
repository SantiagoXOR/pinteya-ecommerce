// ===================================
// PINTEYA E-COMMERCE - API DE GESTIÓN DE SESIÓN ESPECÍFICA
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/integrations/supabase'

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Obtener información de una sesión específica
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Obtener la sesión específica
    const { data: userSession, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !userSession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      session: userSession,
    })
  } catch (error) {
    console.error('Error en GET /api/user/sessions/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Cerrar una sesión específica
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verificar que la sesión pertenece al usuario
    const { data: userSession, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !userSession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // Verificar que no sea la sesión actual
    const currentIP = getClientIP(request)
    const currentUserAgent = request.headers.get('user-agent') || ''

    if (userSession.ip_address === currentIP && userSession.user_agent === currentUserAgent) {
      return NextResponse.json({ error: 'No puedes cerrar tu sesión actual' }, { status: 400 })
    }

    // Eliminar la sesión
    const { error: deleteError } = await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error al eliminar sesión:', deleteError)
      return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 })
    }

    // Registrar actividad de seguridad
    await logSecurityActivity(user.id, 'session_terminated', {
      session_id: params.id,
      device_name: userSession.device_name,
      ip_address: userSession.ip_address,
    })

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    })
  } catch (error) {
    console.error('Error en DELETE /api/user/sessions/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar información de una sesión (marcar como confiable, etc.)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const { is_trusted, location } = body

    // Verificar que la sesión pertenece al usuario
    const { data: userSession, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !userSession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // Actualizar la sesión
    const updateData: any = {
      last_activity: new Date().toISOString(),
    }

    if (typeof is_trusted === 'boolean') {
      updateData.is_trusted = is_trusted
    }

    if (location) {
      updateData.location = location
    }

    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('user_sessions')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error al actualizar sesión:', updateError)
      return NextResponse.json({ error: 'Error al actualizar sesión' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: 'Sesión actualizada exitosamente',
    })
  } catch (error) {
    console.error('Error en PUT /api/user/sessions/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
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
