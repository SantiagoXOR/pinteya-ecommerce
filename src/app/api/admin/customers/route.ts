// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/integrations/supabase/server'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'

// Tipos para clientes
interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  created_at: string
}

/**
 * GET /api/admin/customers
 * Obtener lista de clientes
 * ⚡ MULTITENANT: Filtra por tenant_id
 */
export const GET = withTenantAdmin(async (guardResult: TenantAdminGuardResult, request: NextRequest) => {
  try {
    console.log('🔍 API: GET /api/admin/customers - Iniciando...')
    const { tenantId } = guardResult

    logger.log(LogLevel.INFO, LogCategory.API, 'Fetching customers for admin', {
      userId: guardResult.userId,
      tenantId,
    })

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    console.log('📊 Parámetros:', { page, limit, search })

    // Calcular offset
    const offset = (page - 1) * limit

    // Construir query base
    // ⚡ MULTITENANT: Usar user_profiles que tiene tenant_id en lugar de users
    const supabase = createAdminClient()
    let query = supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, phone, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant_id

    // Aplicar filtros de búsqueda si se proporciona
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Aplicar paginación y ordenamiento
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: customers, error, count } = await query

    if (error) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error fetching customers', { error })
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener clientes',
        },
        { status: 500 }
      )
    }

    // Formatear datos para el frontend
    // ⚡ MULTITENANT: Adaptar formato de user_profiles
    const formattedCustomers: Customer[] =
      customers?.map(customer => ({
        id: customer.id,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Sin nombre',
        email: customer.email,
        phone: customer.phone || '', // ⚡ MULTITENANT: Ahora disponible desde user_profiles
        address: '', // TODO: Obtener de user_addresses si es necesario
        created_at: customer.created_at,
      })) || []

    const response = {
      success: true,
      data: formattedCustomers,
      total: count || 0,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
      message: `${formattedCustomers.length} clientes encontrados de ${count || 0} totales`,
    }

    console.log('✅ Respuesta exitosa:', {
      customersCount: formattedCustomers.length,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })

    logger.log(LogLevel.INFO, LogCategory.API, 'Customers fetched successfully', {
      count: formattedCustomers.length,
      total: count,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Error en GET /api/admin/customers:', error)
    logger.log(LogLevel.ERROR, LogCategory.API, 'Unexpected error in customers API', { error })

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
})

/**
 * POST /api/admin/customers
 * Crear nuevo cliente
 * ⚡ MULTITENANT: Asigna tenant_id automáticamente
 */
export const POST = withTenantAdmin(async (guardResult: TenantAdminGuardResult, request: NextRequest) => {
  try {
    console.log('🔍 API: POST /api/admin/customers - Iniciando...')
    const { tenantId } = guardResult

    // TODO: Implementar creación de clientes
    return NextResponse.json(
      {
        success: false,
        error: 'Funcionalidad no implementada aún',
        message: 'La creación de clientes estará disponible en una próxima versión',
      },
      { status: 501 }
    )
  } catch (error) {
    console.error('❌ Error en POST /api/admin/customers:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
})
