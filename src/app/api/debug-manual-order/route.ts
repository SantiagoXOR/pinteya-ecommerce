// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - DEBUG MANUAL ORDER WEBHOOK
// Endpoint específico para probar webhook con orden 108 (manual)
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'

export async function POST(request: NextRequest) {
  const logs: string[] = []

  try {
    logs.push('[DEBUG_MANUAL] Iniciando debug del webhook para orden 108 (manual)...')

    // Simular datos de webhook para orden 108
    const webhookData = {
      action: 'payment.updated',
      api_version: 'v1',
      data: { id: 'manual_test_payment' },
      date_created: '2021-11-01T02:02:02Z',
      id: 'manual_test_payment',
      live_mode: false,
      type: 'payment',
      user_id: 452711838,
    }

    logs.push('[DEBUG_MANUAL] Webhook data simulado: ' + JSON.stringify(webhookData))

    // Simular datos de pago para orden 108
    const paymentData = {
      id: 'manual_test_payment',
      status: 'approved',
      external_reference: 'express_checkout_1757621175964', // Orden 108 manual
      transaction_amount: 13950,
      currency_id: 'ARS',
    }

    logs.push('[DEBUG_MANUAL] Payment data simulado: ' + JSON.stringify(paymentData))

    // Probar conexión a Supabase
    logs.push('[DEBUG_MANUAL] Probando conexión a Supabase...')
    const supabase = getSupabaseClient(true)

    if (!supabase) {
      logs.push('[DEBUG_MANUAL] ERROR: Cliente de Supabase no disponible')
      return NextResponse.json({ error: 'Supabase not available', logs }, { status: 500 })
    }

    logs.push('[DEBUG_MANUAL] Cliente de Supabase OK')

    // Buscar orden 108
    logs.push(
      '[DEBUG_MANUAL] Buscando orden con external_reference: ' + paymentData.external_reference
    )

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('external_reference', paymentData.external_reference)
      .single()

    if (orderError) {
      logs.push('[DEBUG_MANUAL] ERROR buscando orden: ' + JSON.stringify(orderError))
      return NextResponse.json({ error: 'Order lookup failed', logs, orderError }, { status: 500 })
    }

    if (!order) {
      logs.push('[DEBUG_MANUAL] ERROR: Orden no encontrada')
      return NextResponse.json({ error: 'Order not found', logs }, { status: 404 })
    }

    logs.push('[DEBUG_MANUAL] Orden encontrada: ' + JSON.stringify(order))

    // Mapear estados
    const newOrderStatus = 'confirmed' // ✅ Orden confirmada después del pago
    const newPaymentStatus = 'paid'

    logs.push(
      '[DEBUG_MANUAL] Nuevos estados: order=' + newOrderStatus + ', payment=' + newPaymentStatus
    )

    // Actualizar orden 108
    logs.push('[DEBUG_MANUAL] Actualizando orden 108...')

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: newPaymentStatus,
        status: newOrderStatus,
        payment_id: paymentData.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select()
      .single()

    if (updateError) {
      logs.push('[DEBUG_MANUAL] ERROR actualizando orden: ' + JSON.stringify(updateError))
      return NextResponse.json({ error: 'Update failed', logs, updateError }, { status: 500 })
    }

    logs.push('[DEBUG_MANUAL] Orden 108 actualizada exitosamente: ' + JSON.stringify(updatedOrder))

    return NextResponse.json(
      {
        success: true,
        message: 'Debug webhook para orden 108 (manual) completado exitosamente',
        logs,
        originalOrder: order,
        updatedOrder,
        paymentData,
        orderComparison: {
          before: {
            id: order.id,
            status: order.status,
            payment_status: order.payment_status,
            payment_id: order.payment_id,
            total: order.total,
            external_reference: order.external_reference,
          },
          after: {
            id: updatedOrder.id,
            status: updatedOrder.status,
            payment_status: updatedOrder.payment_status,
            payment_id: updatedOrder.payment_id,
            total: updatedOrder.total,
            external_reference: updatedOrder.external_reference,
          },
        },
        manualOrderInfo: {
          created_manually: true,
          customer: order.payer_info,
          total_amount: order.total,
          created_at: order.created_at,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    logs.push('[DEBUG_MANUAL] EXCEPTION: ' + error.message)
    logs.push('[DEBUG_MANUAL] STACK: ' + error.stack)

    return NextResponse.json(
      {
        error: 'Debug manual order failed',
        message: error.message,
        logs,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
