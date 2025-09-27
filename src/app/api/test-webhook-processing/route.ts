// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - TEST WEBHOOK PROCESSING
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST_WEBHOOK] Iniciando prueba de procesamiento...')

    // Datos de prueba simulando MercadoPago
    const testPaymentData = {
      id: '123456',
      status: 'approved',
      external_reference: 'express_checkout_1757431045283',
      transaction_amount: 100,
      currency_id: 'ARS',
    }

    console.log('[TEST_WEBHOOK] Datos de pago simulados:', JSON.stringify(testPaymentData, null, 2))

    // Inicializar Supabase
    const supabase = getSupabaseClient(true)
    if (!supabase) {
      console.error('[TEST_WEBHOOK] Cliente de Supabase no disponible')
      return NextResponse.json(
        {
          error: 'Supabase client not available',
        },
        { status: 500 }
      )
    }

    console.log('[TEST_WEBHOOK] Cliente de Supabase inicializado correctamente')

    // Buscar la orden por external_reference
    const orderReference = testPaymentData.external_reference
    console.log('[TEST_WEBHOOK] Buscando orden con external_reference:', orderReference)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('external_reference', orderReference)
      .single()

    if (orderError) {
      console.error('[TEST_WEBHOOK] Error buscando orden:', orderError)
      return NextResponse.json(
        {
          error: 'Order lookup failed',
          details: orderError,
        },
        { status: 500 }
      )
    }

    if (!order) {
      console.error('[TEST_WEBHOOK] Order not found by external_reference:', orderReference)
      return NextResponse.json(
        {
          error: 'Order not found',
          external_reference: orderReference,
        },
        { status: 404 }
      )
    }

    console.log('[TEST_WEBHOOK] Order encontrada:', order.id, 'Status actual:', order.status)

    // Mapear estados
    const newOrderStatus = 'paid' // ✅ CORREGIDO: Usar estado válido
    const newPaymentStatus = 'paid'

    console.log(
      '[TEST_WEBHOOK] Actualizando orden con status:',
      newOrderStatus,
      'payment_status:',
      newPaymentStatus
    )

    // Actualizar la orden
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: newPaymentStatus,
        status: newOrderStatus,
        payment_id: testPaymentData.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select()
      .single()

    if (updateError) {
      console.error('[TEST_WEBHOOK] Error actualizando orden:', updateError)
      return NextResponse.json(
        {
          error: 'Order update failed',
          details: updateError,
        },
        { status: 500 }
      )
    }

    console.log(
      '[TEST_WEBHOOK] ✅ Orden actualizada exitosamente:',
      JSON.stringify(updatedOrder, null, 2)
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Webhook processing test completed successfully',
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          payment_status: updatedOrder.payment_status,
          payment_id: updatedOrder.payment_id,
          updated_at: updatedOrder.updated_at,
        },
        test_data: testPaymentData,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[TEST_WEBHOOK] Error en prueba:', error)
    console.error('[TEST_WEBHOOK] Stack trace:', error.stack)

    return NextResponse.json(
      {
        error: 'Test failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
