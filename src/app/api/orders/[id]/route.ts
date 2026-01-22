import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
// ⚡ MULTITENANT: Importar configuración del tenant
import { getTenantConfig } from '@/lib/tenant'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'ID de orden requerido' }, { status: 400 })
    }

    // ⚡ MULTITENANT: Obtener configuración del tenant actual
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    const supabase = getSupabaseClient(true)

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      )
    }

    // Determinar el tipo de ID y campo de búsqueda
    const isNumericId = /^\d+$/.test(orderId)
    const isOrderNumber = /^ORD-/.test(orderId)
    
    let searchField, searchValue
    if (isNumericId) {
      searchField = 'id'
      searchValue = orderId
    } else if (isOrderNumber) {
      searchField = 'order_number'
      searchValue = orderId
    } else {
      searchField = 'external_reference'
      searchValue = orderId
    }

    // Obtener orden CON order_items para mostrar datos correctos
    // ⚡ MULTITENANT: Filtrar por tenant_id para asegurar aislamiento de datos
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        external_reference,
        total,
        status,
        payment_status,
        payment_method,
        payer_info,
        shipping_address,
        created_at,
        updated_at,
        whatsapp_notification_link,
        whatsapp_message,
        whatsapp_generated_at,
        order_items (
          id,
          product_id,
          product_name,
          product_sku,
          quantity,
          price,
          unit_price,
          total_price,
          product_snapshot
        )
      `
      )
      .eq(searchField, searchValue)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Filtrar por tenant
      .single()

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 })
      }

      console.error('Error fetching order:', orderError)
      return NextResponse.json({ success: false, error: 'Error al obtener orden' }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 })
    }

    // Obtener imágenes de productos desde product_images
    if (order.order_items && order.order_items.length > 0) {
      const productIds = order.order_items
        .map((item: any) => item.product_id)
        .filter((id: any) => id != null)
      
      if (productIds.length > 0) {
        const { data: productImages } = await supabase
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

        // Agregar image_url a cada order_item
        // Prioridad: product_images > product_snapshot.image > null
        order.order_items = order.order_items.map((item: any) => {
          const images = imagesByProductId[item.product_id] || []
          const imageFromProductImages = images[0]?.url || null
          const imageFromSnapshot = item.product_snapshot?.image || null
          
          return {
            ...item,
            image_url: imageFromProductImages || imageFromSnapshot || null
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Error in GET /api/orders/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
