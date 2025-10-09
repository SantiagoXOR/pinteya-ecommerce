// ===================================
// PINTEYA E-COMMERCE - ADMIN WHATSAPP ENDPOINT
// Endpoint para generar enlaces de WhatsApp manualmente desde el panel admin
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { whatsappLinkService, OrderDetails } from '@/lib/integrations/whatsapp/whatsapp-link-service'
import { logger, LogLevel } from '@/lib/enterprise/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y permisos de admin
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario sea admin
    if (session.user.email !== 'santiago@xor.com.ar') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      )
    }

    const orderId = params.id
    const supabase = getSupabaseClient()

    // Obtener la orden completa con sus items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price,
          products (
            name
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      logger.warn(LogLevel.WARN, 'Order not found for WhatsApp generation', {
        orderId,
        error: orderError?.message
      })
      
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Preparar los datos de la orden para WhatsApp
    const orderItems = order.order_items?.map((item: any) => ({
      name: item.products?.name || 'Producto',
      quantity: item.quantity,
      price: `$${parseFloat(item.price).toLocaleString('es-AR')}`,
    })) || []

    const orderDetails: OrderDetails = {
      id: order.id,
      orderNumber: order.external_reference || order.id,
      total: `$${parseFloat(order.total).toLocaleString('es-AR')}`,
      status: order.status,
      paymentId: order.payment_id,
      payerInfo: {
        name: order.payer_info?.name || 'Cliente',
        email: order.payer_info?.email || '',
        phone: order.payer_info?.phone || undefined,
      },
      shippingInfo: order.shipping_info ? {
        address: order.shipping_info.address,
        city: order.shipping_info.city,
        postalCode: order.shipping_info.postal_code,
      } : undefined,
      items: orderItems,
      createdAt: order.created_at,
    }

    // Generar el enlace de WhatsApp
    const whatsappLink = whatsappLinkService.generateOrderWhatsAppLink(orderDetails)

    // Actualizar la orden con el nuevo enlace
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        whatsapp_notification_link: whatsappLink,
        whatsapp_generated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      logger.error(LogLevel.ERROR, 'Failed to save WhatsApp link to database', {
        orderId,
        error: updateError.message
      })
      
      return NextResponse.json(
        { error: 'Error al guardar el enlace de WhatsApp' },
        { status: 500 }
      )
    }

    logger.info(LogLevel.INFO, 'WhatsApp link generated manually by admin', {
      orderId,
      adminEmail: session.user.email,
      linkLength: whatsappLink.length
    })

    return NextResponse.json({
      success: true,
      whatsappLink,
      orderNumber: orderDetails.orderNumber,
      generatedAt: new Date().toISOString(),
      message: 'Enlace de WhatsApp generado exitosamente'
    })

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Error in admin WhatsApp endpoint', {
      orderId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que es admin
    if (session.user.email !== 'santiago@xor.com.ar') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const orderId = params.id
    const body = await request.json()
    const { regenerate = false } = body

    const supabase = getSupabaseClient()

    // Si no es regeneración, verificar si ya existe un enlace
    if (!regenerate) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('whatsapp_notification_link, whatsapp_generated_at')
        .eq('id', orderId)
        .single()

      if (existingOrder?.whatsapp_notification_link) {
        return NextResponse.json({
          success: true,
          whatsappLink: existingOrder.whatsapp_notification_link,
          generatedAt: existingOrder.whatsapp_generated_at,
          message: 'Enlace de WhatsApp ya existe (usar regenerate: true para crear uno nuevo)'
        })
      }
    }

    // Usar el método GET para generar el enlace
    return GET(request, { params })

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Error in admin WhatsApp POST endpoint', {
      orderId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}