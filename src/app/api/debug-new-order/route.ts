// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - DEBUG NEW ORDER WEBHOOK
// Endpoint específico para probar webhook con orden 107
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'

export async function POST(request: NextRequest) {
  const logs: string[] = []

  try {
    logs.push('[DEBUG_NEW] Iniciando debug del webhook para orden 107...')

    // Simular datos de webhook para orden 107
    const webhookData = {
      action: 'payment.updated',
      api_version: 'v1',
      data: { id: 'test_payment_107' },
      date_created: '2021-11-01T02:02:02Z',
      id: 'test_payment_107',
      live_mode: false,
      type: 'payment',
      user_id: 452711838,
    }

    logs.push('[DEBUG_NEW] Webhook data simulado: ' + JSON.stringify(webhookData))

    // Simular datos de pago para orden 107
    const paymentData = {
      id: 'test_payment_107',
      status: 'approved',
      external_reference: 'test_order_1757606994811', // Orden 107
      transaction_amount: 3650,
      currency_id: 'ARS',
    }

    logs.push('[DEBUG_NEW] Payment data simulado: ' + JSON.stringify(paymentData))

    // Probar conexión a Supabase
    logs.push('[DEBUG_NEW] Probando conexión a Supabase...')
    const supabase = getSupabaseClient(true)

    if (!supabase) {
      logs.push('[DEBUG_NEW] ERROR: Cliente de Supabase no disponible')
      return NextResponse.json({ error: 'Supabase not available', logs }, { status: 500 })
    }

    logs.push('[DEBUG_NEW] Cliente de Supabase OK')

    // Buscar orden 107
    logs.push(
      '[DEBUG_NEW] Buscando orden con external_reference: ' + paymentData.external_reference
    )

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('external_reference', paymentData.external_reference)
      .single()

    if (orderError) {
      logs.push('[DEBUG_NEW] ERROR buscando orden: ' + JSON.stringify(orderError))
      return NextResponse.json({ error: 'Order lookup failed', logs, orderError }, { status: 500 })
    }

    if (!order) {
      logs.push('[DEBUG_NEW] ERROR: Orden no encontrada')
      return NextResponse.json({ error: 'Order not found', logs }, { status: 404 })
    }

    logs.push('[DEBUG_NEW] Orden encontrada: ' + JSON.stringify(order))

    // Mapear estados
    const newOrderStatus = 'confirmed' // ✅ Orden confirmada después del pago
    const newPaymentStatus = 'paid'

    logs.push(
      '[DEBUG_NEW] Nuevos estados: order=' + newOrderStatus + ', payment=' + newPaymentStatus
    )

    // Actualizar orden 107
    logs.push('[DEBUG_NEW] Actualizando orden 107...')

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
      logs.push('[DEBUG_NEW] ERROR actualizando orden: ' + JSON.stringify(updateError))
      return NextResponse.json({ error: 'Update failed', logs, updateError }, { status: 500 })
    }

    logs.push('[DEBUG_NEW] Orden 107 actualizada exitosamente: ' + JSON.stringify(updatedOrder))

    return NextResponse.json(
      {
        success: true,
        message: 'Debug webhook para orden 107 completado exitosamente',
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
          },
          after: {
            id: updatedOrder.id,
            status: updatedOrder.status,
            payment_status: updatedOrder.payment_status,
            payment_id: updatedOrder.payment_id,
            total: updatedOrder.total,
          },
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    logs.push('[DEBUG_NEW] EXCEPTION: ' + error.message)
    logs.push('[DEBUG_NEW] STACK: ' + error.stack)

    return NextResponse.json(
      {
        error: 'Debug new order failed',
        message: error.message,
        logs,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
