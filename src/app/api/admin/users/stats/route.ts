// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { supabaseAdmin } from '@/lib/integrations/supabase'

/**
 * GET /api/admin/users/stats
 * Obtener estadísticas de usuarios desde Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const authResult = await requireAdminAuth()

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    // Obtener estadísticas de usuarios
    const [totalResult, activeResult, newResult] = await Promise.all([
      // Total de usuarios
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      // Usuarios activos (con sesiones recientes)
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('last_sign_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      // Usuarios nuevos (últimos 7 días)
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const stats = {
      total_users: totalResult.count || 0,
      active_users: activeResult.count || 0,
      new_users: newResult.count || 0,
      growth_rate: 0, // Placeholder para cálculo de crecimiento
    }

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuarios:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        data: {
          total_users: 0,
          active_users: 0,
          new_users: 0,
          growth_rate: 0,
        },
      },
      { status: 500 }
    )
  }
}
