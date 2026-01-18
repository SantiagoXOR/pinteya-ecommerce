import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createAdminClient } from '@/lib/integrations/supabase/server'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { createPaymentPreference } from '@/lib/integrations/mercadopago'

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    // BYPASS SOLO EN DESARROLLO CON VALIDACIÓN ESTRICTA
    // ⚠️ TEMPORAL: Remover restricción de desarrollo para permitir bypass en producción hoy (2026-01-08)
    if (process.env.BYPASS_AUTH === 'true') {
      try {
        const fs = require('fs')
        const path = require('path')
        const envLocalPath = path.join(process.cwd(), '.env.local')
        if (fs.existsSync(envLocalPath)) {
          return {
            user: {
              id: 'dev-admin',
              email: 'admin@bypass.dev',
              name: 'Dev Admin',
            },
            userId: 'dev-admin',
          }
        }
      } catch (error) {
        console.warn('[API Admin Payment Link] No se pudo verificar .env.local, bypass deshabilitado')
      }
    }

    const session = await auth()
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 }
    }

    // Verificar si es admin usando el rol de la sesión (cargado desde la BD en auth.ts)
    const isAdmin = session.user.role === 'admin'
    if (!isAdmin) {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 }
    }

    return { user: session.user, userId: session.user.id }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error en validación admin', { error })
    return { error: 'Error de autenticación', status: 500 }
  }
}

/**
 * POST /api/admin/orders/[id]/payment-link
 * Crea un link de pago para una orden manual
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  let orderId: string | undefined
  try {
    const { id } = await context.params
    orderId = id

    // Verificar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status || 401 })
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Creating payment link for order', {
      orderId,
      userId: authResult.userId,
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
        payer_info,
        user_profiles!orders_user_id_fkey (
          first_name,
          last_name,
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
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error fetching order items', {
        orderId,
        itemsError,
      })
      return NextResponse.json(
        { success: false, error: 'Error al obtener items de la orden' },
        { status: 500 }
      )
    }

    // Obtener datos del pagador - priorizar payer_info de la orden (órdenes de visitantes)
    const payerInfo = order.payer_info as { name?: string; surname?: string; email?: string; phone?: string } | null
    const userProfile = Array.isArray(order.user_profiles) ? order.user_profiles[0] : order.user_profiles
    
    const payerName = payerInfo?.name || userProfile?.first_name || 'Cliente'
    const payerSurname = payerInfo?.surname || userProfile?.last_name || ''
    const payerEmail = payerInfo?.email || userProfile?.email || 'cliente@pinteya.com'

    // Preparar datos para MercadoPago
    const preferenceData = {
      items: orderItems.map(item => {
        const product = Array.isArray(item.products) ? item.products[0] : item.products
        return {
          id: product?.id?.toString() || 'unknown',
          title: product?.name || 'Producto',
          description: product?.description || product?.name || 'Producto',
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: 'ARS',
        }
      }),
      payer: {
        name: `${payerName} ${payerSurname}`.trim(),
        email: payerEmail,
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
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error updating order with preference_id', {
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
      orderId: orderId || 'unknown',
      error,
    })

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
