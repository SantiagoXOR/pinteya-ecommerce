// =====================================================
// API: Lista de Usuarios/Clientes para Admin
// GET /api/admin/users/list
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/server-auth-guard'
import { createClient } from '@/lib/integrations/supabase/server'

export const dynamic = 'force-dynamic'

// =====================================================
// TYPES
// =====================================================

interface UserWithStats {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login: string | null
  // Stats calculados
  total_orders: number
  total_spent: number
  last_order_date: string | null
}

interface PaginationParams {
  page: number
  limit: number
  search?: string
  status?: 'all' | 'active' | 'inactive'
  sortBy?: 'created_at' | 'last_order' | 'total_spent' | 'total_orders'
  sortOrder?: 'asc' | 'desc'
}

// =====================================================
// GET: Obtener lista de usuarios
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación admin
    await requireAdminAuth()

    // Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = (searchParams.get('status') || 'all') as PaginationParams['status']
    const sortBy = (searchParams.get('sortBy') || 'created_at') as PaginationParams['sortBy']
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as PaginationParams['sortOrder']

    const supabase = await createClient()

    // =====================================================
    // QUERY PRINCIPAL: Usuarios con estadísticas
    // =====================================================

    let query = supabase
      .from('user_profiles')
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        phone,
        is_active,
        created_at,
        updated_at,
        last_login
      `,
        { count: 'exact' }
      )

    // Filtro de búsqueda
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`
      )
    }

    // Filtro de estado
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Ordenamiento
    const orderColumn = sortBy === 'created_at' ? 'created_at' : 'created_at'
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' })

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: users, error: usersError, count } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener usuarios',
          message: usersError.message,
        },
        { status: 500 }
      )
    }

    // =====================================================
    // OBTENER ESTADÍSTICAS DE ÓRDENES POR USUARIO
    // =====================================================

    const userIds = users?.map(u => u.id) || []

    // Query para obtener stats de órdenes por usuario
    const { data: orderStats, error: orderStatsError } = await supabase.rpc('get_user_order_stats', {
      user_ids: userIds,
    })

    if (orderStatsError) {
      console.warn('Error fetching order stats:', orderStatsError)
      // Continuar sin stats si falla
    }

    // =====================================================
    // COMBINAR DATOS
    // =====================================================

    const usersWithStats: UserWithStats[] = (users || []).map(user => {
      const stats = orderStats?.find((s: any) => s.user_id === user.id) || {
        total_orders: 0,
        total_spent: 0,
        last_order_date: null,
      }

      return {
        ...user,
        total_orders: stats.total_orders || 0,
        total_spent: parseFloat(stats.total_spent || '0'),
        last_order_date: stats.last_order_date || null,
      }
    })

    // =====================================================
    // RESPUESTA
    // =====================================================

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
    console.error('Unexpected error in /api/admin/users/list:', error)
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

