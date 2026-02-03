// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { getTenantConfig } from '@/lib/tenant'

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

    // MULTITENANT: filtrar por tenant actual
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    // Calcular fechas para comparación
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Obtener estadísticas de usuarios desde user_profiles (filtrado por tenant_id)
    const [totalResult, activeResult, newResult30d, newResultPrevious30d, inactiveResult] = await Promise.all([
      // Total de usuarios
      supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      // Usuarios activos
      supabaseAdmin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
      // Usuarios nuevos (últimos 30 días)
      supabaseAdmin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      // Usuarios nuevos en el período anterior (30-60 días atrás) para calcular crecimiento
      supabaseAdmin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString()),
      // Usuarios inactivos
      supabaseAdmin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', false),
    ])

    const totalUsers = totalResult.count || 0
    const activeUsers = activeResult.count || 0
    const newUsers30d = newResult30d.count || 0
    const newUsersPrevious30d = newResultPrevious30d.count || 0
    const inactiveUsers = inactiveResult.count || 0

    // Calcular tasa de crecimiento
    const growthRate = newUsersPrevious30d > 0 
      ? ((newUsers30d - newUsersPrevious30d) / newUsersPrevious30d) * 100 
      : (newUsers30d > 0 ? 100 : 0)

    const stats = {
      total_users: totalUsers,
      active_users: activeUsers,
      new_users_30d: newUsers30d,
      new_users_previous_30d: newUsersPrevious30d, // Usuarios nuevos en el período anterior (30-60 días)
      inactive_users: inactiveUsers,
      growth_rate: Math.round(growthRate * 100) / 100, // Redondear a 2 decimales
    }

    console.log('[API] Estadísticas de usuarios calculadas:', {
      total: stats.total_users,
      active: stats.active_users,
      inactive: stats.inactive_users,
      new30d: stats.new_users_30d,
      previous30d: stats.new_users_previous_30d,
      growthRate: stats.growth_rate,
    })

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
          new_users_30d: 0,
          inactive_users: 0,
          growth_rate: 0,
        },
      },
      { status: 500 }
    )
  }
}
