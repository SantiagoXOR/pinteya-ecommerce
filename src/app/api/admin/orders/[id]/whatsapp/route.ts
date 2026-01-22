// ===================================
// PINTEYA E-COMMERCE - ADMIN WHATSAPP ENDPOINT
// Endpoint para generar enlaces de WhatsApp manualmente desde el panel admin
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { whatsappLinkService, OrderDetails } from '@/lib/integrations/whatsapp/whatsapp-link-service'
import { logger, LogLevel } from '@/lib/enterprise/logger'
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'

export const GET = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { tenantId } = guardResult
    const { id } = await context.params
    const orderId = id

    // ⚡ MULTITENANT: Obtener la orden completa con sus items, filtrando por tenant_id
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          unit_price,
          product_snapshot,
          products (
            name,
            color,
            medida,
            brand,
            finish
          )
        )
      `)
      .eq('id', orderId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
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

    // Preparar los datos de la orden para WhatsApp con detalles completos
    const orderItems = order.order_items?.map((item: any) => {
      const snapshot = item.product_snapshot || {};
      const product = item.products || {};
      
      // Construir nombre con detalles
      let productName = snapshot.name || product.name || 'Producto';
      const details = [];
      
      // Color (prioridad: snapshot > producto)
      const color = snapshot.color || product.color;
      if (color) details.push(`Color: ${color}`);
      
      // Terminación (prioridad: snapshot > producto)
      const finish = snapshot.finish || product.finish;
      if (finish) details.push(`Terminación: ${finish}`);
      
      // Medida
      const medida = snapshot.medida || product.medida;
      if (medida) details.push(`Medida: ${medida}`);
      
      // Marca
      const brand = snapshot.brand || product.brand;
      if (brand) details.push(`Marca: ${brand}`);
      
      if (details.length > 0) {
        productName += ` (${details.join(', ')})`;
      }
      
      return {
        name: productName,
        quantity: item.quantity,
        price: `$${parseFloat(item.unit_price).toLocaleString('es-AR')}`,
      };
    }) || []

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

    // Generar el enlace y obtener el mensaje crudo
    const { link: whatsappLink, message: whatsappMessage } = whatsappLinkService.generateOrderWhatsApp(orderDetails)

    // ⚡ MULTITENANT: Actualizar la orden con el nuevo enlace, filtrando por tenant_id
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        whatsapp_notification_link: whatsappLink,
        whatsapp_message: whatsappMessage,
        whatsapp_generated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT

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
      tenantId,
      adminEmail: guardResult.userEmail,
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
      orderId: id,
      tenantId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

export const POST = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { tenantId } = guardResult
    const { id } = await context.params
    const orderId = id
    const body = await request.json()
    const { regenerate = false } = body

    // Si no es regeneración, verificar si ya existe un enlace
    if (!regenerate) {
      // ⚡ MULTITENANT: Verificar enlace existente filtrando por tenant_id
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('whatsapp_notification_link, whatsapp_generated_at')
        .eq('id', orderId)
        .eq('tenant_id', tenantId) // ⚡ MULTITENANT
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
    return GET(request, context)

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Error in admin WhatsApp POST endpoint', {
      orderId: id,
      tenantId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})