// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API DE ÓRDENES DE USUARIO
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'
import { ApiResponse } from '@/types/api'

// ===================================
// GET - Obtener órdenes del usuario
// ===================================
export async function GET(request: NextRequest) {
  try {
    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      console.error('Cliente administrativo de Supabase no disponible en GET /api/user/orders')
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      )
    }

    // Obtener usuario autenticado usando NextAuth.js
    const session = await auth()

    if (!session?.user?.id) {
      console.error('Usuario no autenticado en GET /api/user/orders')
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    console.log(`[API] Obteniendo órdenes para usuario: ${session.user.id}`)

    // Construir query base usando directamente el ID del usuario de NextAuth.js
    let query = supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          quantity,
          price,
          product_id,
          product_snapshot
        )
      `
      )
      .eq('user_id', session.user.id)

    // Filtrar por status si se especifica
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Aplicar paginación y ordenamiento
    const from = (page - 1) * limit
    const to = from + limit - 1

    const {
      data: orders,
      error,
      count,
    } = await query.order('created_at', { ascending: false }).range(from, to)

    if (error) {
      console.error('Error al obtener órdenes:', error)
      return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 })
    }

    // Obtener imágenes de productos desde product_images para todas las órdenes
    if (orders && orders.length > 0) {
      // Recopilar todos los product_ids de todos los order_items
      const productIds: number[] = []
      orders.forEach((order: any) => {
        if (order.order_items) {
          order.order_items.forEach((item: any) => {
            if (item.product_id && !productIds.includes(item.product_id)) {
              productIds.push(item.product_id)
            }
          })
        }
      })

      // Obtener imágenes desde product_images si hay productos
      if (productIds.length > 0) {
        const { data: productImages } = await supabaseAdmin
          .from('product_images')
          .select('product_id, url, is_primary')
          .in('product_id', productIds)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true })

        // Agrupar imágenes por product_id
        const imagesByProductId = (productImages || []).reduce((acc: any, img: any) => {
          if (!acc[img.product_id]) {
            acc[img.product_id] = []
          }
          acc[img.product_id].push(img)
          return acc
        }, {})

        // Agregar image_url a cada order_item con prioridad: product_images > product_snapshot.image > null
        orders.forEach((order: any) => {
          if (order.order_items) {
            order.order_items = order.order_items.map((item: any) => {
              const images = imagesByProductId[item.product_id] || []
              const imageFromProductImages = images[0]?.url || null
              const imageFromSnapshot = item.product_snapshot?.image || null

              return {
                ...item,
                image_url: imageFromProductImages || imageFromSnapshot || null,
              }
            })
          }
        })
      }
    }

    // Calcular estadísticas
    const { data: stats } = await supabaseAdmin
      .from('orders')
      .select('status, total')
      .eq('user_id', session.user.id)

    const statistics = {
      total_orders: stats?.length || 0,
      total_spent: stats?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0,
      pending_orders: stats?.filter(order => order.status === 'pending').length || 0,
      completed_orders: stats?.filter(order => order.status === 'delivered').length || 0,
    }

    return NextResponse.json({
      success: true,
      data: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
      statistics,
    })
  } catch (error) {
    console.error('Error en GET /api/user/orders:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
