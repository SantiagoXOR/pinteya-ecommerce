import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/integrations/supabase/server'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { createPaymentPreference } from '@/lib/integrations/mercadopago'

/**
 * POST /api/admin/orders/[id]/payment-link
 * Crea un link de pago para una orden manual
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const orderId = params.id

    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Creating payment link for order', {
      orderId,
      userId: session.user.id,
    })

    // Obtener datos de la orden
    const supabase = createAdminClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        user_id,
        total,
        status,
        payment_status,
        external_reference,
        user_profiles!orders_user_id_fkey (
          name,
          email
        )
      `
      )
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      logger.log(LogLevel.WARN, LogCategory.API, 'Order not found', { orderId, orderError })
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 })
    }

    // Verificar que la orden esté pendiente de pago
    if (order.payment_status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'La orden ya tiene un estado de pago diferente a pendiente' },
        { status: 400 }
      )
    }

    // Obtener items de la orden
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(
        `
        quantity,
        price,
        products!order_items_product_id_fkey (
          id,
          name,
          description
        )
      `
      )
      .eq('order_id', orderId)

    if (itemsError || !orderItems) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error fetching order items', {
        orderId,
        itemsError,
      })
      return NextResponse.json(
        { success: false, error: 'Error al obtener items de la orden' },
        { status: 500 }
      )
    }

    // Preparar datos para MercadoPago
    const preferenceData = {
      items: orderItems.map(item => ({
        id: item.products.id.toString(),
        title: item.products.name,
        description: item.products.description || item.products.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'ARS',
      })),
      payer: {
        name: order.user_profiles?.name || 'Cliente',
        email: order.user_profiles?.email || 'cliente@pinteya.com',
      },
      external_reference: order.external_reference || orderId.toString(),
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_URL}/orders/success`,
        failure: `${process.env.NEXT_PUBLIC_URL}/orders/failure`,
        pending: `${process.env.NEXT_PUBLIC_URL}/orders/pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_URL}/api/payments/webhook`,
    }

    // Crear preferencia en MercadoPago
    const preferenceResult = await createPaymentPreference(preferenceData)

    if (!preferenceResult.success || !preferenceResult.data) {
      logger.log(LogLevel.ERROR, LogCategory.PAYMENT, 'Error creating MercadoPago preference', {
        orderId,
        error: preferenceResult.error,
      })
      return NextResponse.json(
        { success: false, error: 'Error al crear preferencia de pago' },
        { status: 500 }
      )
    }

    // Actualizar orden con preference_id
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_preference_id: preferenceResult.data.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error updating order with preference_id', {
        orderId,
        updateError,
      })
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Payment link created successfully', {
      orderId,
      preferenceId: preferenceResult.data.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        preference_id: preferenceResult.data.id,
        payment_url: preferenceResult.data.init_point,
        sandbox_payment_url: preferenceResult.data.sandbox_init_point,
      },
      message: 'Link de pago creado exitosamente',
    })
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Unexpected error creating payment link', {
      orderId: params.id,
      error,
    })

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
