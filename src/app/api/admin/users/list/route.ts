// =====================================================
// API: Lista de Usuarios/Clientes para Admin
// GET /api/admin/users/list
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/server-auth-guard'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { getTenantConfig } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// =====================================================
// TYPES
// =====================================================

interface UserWithStats {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  last_login: string | null
  total_orders: number
  total_spent: number
  last_order_date: string | null
}

// =====================================================
// GET: Obtener lista de usuarios
// =====================================================

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Iniciando GET /api/admin/users/list')
    
    // Verificar autenticación admin
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      console.error('[API] Error de autenticación:', authResult.error)
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: authResult.status }
      )
    }
    console.log('[API] Autenticación exitosa')

    // Validar supabaseAdmin
    if (!supabaseAdmin) {
      console.error('[API] supabaseAdmin no está disponible')
      return NextResponse.json(
        {
          success: false,
          error: 'Error de configuración del servidor: supabaseAdmin no inicializado',
        },
        { status: 500 }
      )
    }
    console.log('[API] supabaseAdmin disponible')

    // MULTITENANT: filtrar por tenant actual
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    // Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Construir query base (usando solo columnas que sabemos que existen)
    console.log('[API] Construyendo query para user_profiles...')
    let query = supabaseAdmin
      .from('user_profiles')
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        is_active,
        metadata,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', tenantId)
    console.log('[API] Query construida')

    // Filtro de búsqueda
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      )
    }

    // Filtro de estado
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Ordenamiento
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Ejecutar query
    const { data: users, error: usersError, count } = await query

    if (usersError) {
      console.error('[API] Error en query de user_profiles:', {
        message: usersError.message,
        code: usersError.code,
        details: usersError.details,
        hint: usersError.hint,
        query: 'user_profiles select',
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener usuarios',
          message: usersError.message,
          code: usersError.code,
          details: usersError.details,
          hint: usersError.hint,
        },
        { status: 500 }
      )
    }

    // Obtener estadísticas de órdenes (opcional, continuar sin stats si falla)
    const userIds = users?.map(u => u.id) || []
    let orderStats: any[] | null = null

    if (userIds.length > 0) {
      try {
        const { data, error: orderStatsError } = await supabaseAdmin.rpc('get_user_order_stats', {
          user_ids: userIds,
        })

        if (!orderStatsError && data) {
          orderStats = data
        }
      } catch (rpcError) {
        // Continuar sin stats si falla
        console.warn('Error obteniendo stats de órdenes:', rpcError)
      }
    }

    // Combinar datos
    const usersWithStats: UserWithStats[] = (users || []).map((user: any) => {
      const stats = orderStats?.find((s: any) => s.user_id === user.id) || {
        total_orders: 0,
        total_spent: 0,
        last_order_date: null,
      }

      // Extraer phone de metadata si existe
      const phone = user.metadata?.phone || user.metadata?.phone_number || null

      // Extraer last_login de metadata si existe, o usar null
      const lastLogin = user.metadata?.last_login || user.metadata?.last_login_at || null

      return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: phone,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: lastLogin,
        total_orders: stats.total_orders || 0,
        total_spent: parseFloat(String(stats.total_spent || '0')),
        last_order_date: stats.last_order_date || null,
      }
    })

    // Calcular paginación
    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error('Error in /api/admin/users/list:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error inesperado al obtener usuarios',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
