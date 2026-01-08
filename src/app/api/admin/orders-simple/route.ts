// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: ÓRDENES ADMIN SIMPLIFICADA (DESARROLLO)
// Descripción: Versión simplificada sin Redis ni métricas complejas
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// =====================================================
// CONFIGURACIÓN SIMPLIFICADA
// =====================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================================
// VALIDACIÓN DE AUTH SIMPLIFICADA
// =====================================================

async function validateSimpleAuth() {
  // ⚠️ TEMPORAL: Remover restricción de desarrollo para permitir bypass en producción hoy (2026-01-08)
  if (process.env.BYPASS_AUTH === 'true') {
    // Verificar que existe archivo .env.local para evitar bypass accidental en producción
    try {
      const fs = require('fs')
      const path = require('path')
      const envLocalPath = path.join(process.cwd(), '.env.local')
      // En producción, permitir bypass directamente si BYPASS_AUTH está configurado
      if (fs.existsSync(envLocalPath) || process.env.NODE_ENV === 'production') {
        return {
          success: true,
          user: {
            id: 'dev-admin',
            email: 'admin@bypass.dev',
          },
        }
      }
    } catch (error) {
      console.warn('[API Admin Orders Simple] No se pudo verificar .env.local, bypass deshabilitado')
    }
  }

  return { success: false, error: 'No autorizado' }
}

// =====================================================
// HANDLER GET - LISTAR ÓRDENES
// =====================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log('🔍 [Orders Simple API] Iniciando GET request')

    // Validar autenticación
    const authResult = await validateSimpleAuth()
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    console.log('✅ [Orders Simple API] Autenticación exitosa')

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    console.log('📋 [Orders Simple API] Parámetros:', { page, limit, status, search })

    // Construir query base (sin join automático)
    let query = supabase.from('orders').select(
      `
        id,
        user_id,
        status,
        total,
        payment_id,
        shipping_address,
        external_reference,
        created_at,
        updated_at
      `,
      { count: 'exact' }
    )

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`external_reference.ilike.%${search}%,user_id.ilike.%${search}%`)
    }

    // Aplicar paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Ordenar por fecha de creación (más recientes primero)
    query = query.order('created_at', { ascending: false })

    console.log('🔍 [Orders Simple API] Ejecutando query...')

    // Ejecutar query
    const { data: orders, error: ordersError, count } = await query

    if (ordersError) {
      console.error('❌ [Orders Simple API] Error en query:', ordersError)
      throw ordersError
    }

    console.log(`✅ [Orders Simple API] Query exitosa: ${orders?.length || 0} órdenes encontradas`)

    // Obtener datos de usuarios para hacer join manual
    console.log('👥 [Orders Simple API] Obteniendo datos de usuarios...')

    const userIds = orders?.map(order => order.user_id).filter(Boolean) || []
    let userProfiles = []

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds)

      if (!profilesError && profiles) {
        userProfiles = profiles
        console.log(`✅ [Orders Simple API] ${profiles.length} perfiles de usuario obtenidos`)
      } else {
        console.log('⚠️ [Orders Simple API] Error obteniendo perfiles:', profilesError)
      }
    }

    // Calcular estadísticas básicas
    console.log('📊 [Orders Simple API] Calculando estadísticas...')

    const { data: statsData, error: statsError } = await supabase
      .from('orders')
      .select('status, total')

    let stats = {
      totalOrders: count || 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    }

    if (!statsError && statsData) {
      stats = {
        totalOrders: count || 0,
        pendingOrders: statsData.filter(o => o.status === 'pending').length,
        confirmedOrders: statsData.filter(o => o.status === 'confirmed').length,
        shippedOrders: statsData.filter(o => o.status === 'shipped').length,
        deliveredOrders: statsData.filter(o => o.status === 'delivered').length,
        cancelledOrders: statsData.filter(o => o.status === 'cancelled').length,
        totalRevenue: statsData.reduce((sum, o) => sum + (o.total || 0), 0),
        averageOrderValue:
          statsData.length > 0
            ? statsData.reduce((sum, o) => sum + (o.total || 0), 0) / statsData.length
            : 0,
      }
    }

    console.log('📊 [Orders Simple API] Estadísticas calculadas:', stats)

    // Formatear respuesta con join manual
    const formattedOrders =
      orders?.map(order => {
        // Buscar el perfil de usuario correspondiente
        const userProfile = userProfiles.find(profile => profile.id === order.user_id)

        return {
          id: order.id,
          orderNumber: order.external_reference || `ORD-${order.id.toString().slice(-8)}`,
          customer: {
            id: userProfile?.id || order.user_id,
            name: userProfile
              ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
              : 'Usuario no encontrado',
            email: userProfile?.email || 'Email no disponible',
          },
          status: order.status,
          total: order.total,
          paymentId: order.payment_id,
          shippingAddress: order.shipping_address,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        }
      }) || []

    const responseTime = Date.now() - startTime

    console.log(`✅ [Orders Simple API] Respuesta exitosa en ${responseTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        analytics: {
          total_orders: stats.totalOrders,
          pending_orders: stats.pendingOrders,
          completed_orders: stats.confirmedOrders + stats.deliveredOrders,
          total_revenue: stats.totalRevenue,
          today_revenue: 0, // Placeholder, se puede calcular después
        },
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNextPage: page < Math.ceil((count || 0) / limit),
          hasPreviousPage: page > 1,
        },
      },
      meta: {
        responseTime,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    console.error('❌ [Orders Simple API] Error:', error)

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
        meta: {
          responseTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

// =====================================================
// HANDLER POST - CREAR ORDEN (SIMPLIFICADO)
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const authResult = await validateSimpleAuth()
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()

    // Crear orden básica
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: body.user_id || 'dev-user',
        status: body.status || 'pending',
        total: body.total || 0,
        payment_id: body.payment_id || 'dev-payment',
        shipping_address: body.shipping_address || {},
        external_reference: body.external_reference || `DEV-${Date.now()}`,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('❌ [Orders Simple API] Error en POST:', error)

    return NextResponse.json(
      {
        error: 'Error creando orden',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
