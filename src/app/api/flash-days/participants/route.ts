import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Listar participantes (solo admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar si el usuario es admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar rol de admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role_id, user_roles(role_name)')
      .eq('id', user.id)
      .single()

    const roleData = profile?.user_roles as any
    const isAdmin =
      roleData?.role_name === 'admin' ||
      roleData?.role_name === 'moderator'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'participated_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Construir query
    let query = supabase.from('flash_days_participants').select('*', { count: 'exact' })

    // Filtros
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('phone_number', `%${search}%`)
    }

    // Ordenamiento
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Paginación
    query = query.range(offset, offset + limit - 1)

    const { data: participants, error, count } = await query

    if (error) {
      console.error('[FLASH_DAYS] Error fetching participants:', error)
      return NextResponse.json({ error: 'Error al obtener participantes' }, { status: 500 })
    }

    // Estadísticas
    const { data: stats } = await supabase.from('flash_days_participants').select('status')

    const statistics = {
      total: count || 0,
      pending: stats?.filter(s => s.status === 'pending').length || 0,
      contacted: stats?.filter(s => s.status === 'contacted').length || 0,
      winners: stats?.filter(s => s.status === 'winner').length || 0,
      duplicates: stats?.filter(s => s.status === 'duplicate').length || 0,
    }

    return NextResponse.json({
      success: true,
      participants,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics,
    })
  } catch (error) {
    console.error('[FLASH_DAYS] Error in GET /participants:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

