// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - DEBUG ORDER 109 WEBHOOK
// Endpoint específico para probar webhook con orden 109 (nueva manual)
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/integrations/supabase';

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  
  try {
    logs.push('[DEBUG_109] Iniciando debug del webhook para orden 109 (nueva manual)...');

    // Simular datos de webhook para orden 109
    const webhookData = {
      action: "payment.updated",
      api_version: "v1",
      data: { id: "new_manual_payment" },
      date_created: "2021-11-01T02:02:02Z",
      id: "new_manual_payment",
      live_mode: false,
      type: "payment",
      user_id: 452711838
    };

    logs.push('[DEBUG_109] Webhook data simulado: ' + JSON.stringify(webhookData));

    // Simular datos de pago para orden 109
    const paymentData = {
      id: 'new_manual_payment',
      status: 'approved',
      external_reference: 'express_checkout_1757621876739', // Orden 109 nueva
      transaction_amount: 850,
      currency_id: 'ARS'
    };

    logs.push('[DEBUG_109] Payment data simulado: ' + JSON.stringify(paymentData));

    // Probar conexión a Supabase
    logs.push('[DEBUG_109] Probando conexión a Supabase...');
    const supabase = getSupabaseClient(true);
    
    if (!supabase) {
      logs.push('[DEBUG_109] ERROR: Cliente de Supabase no disponible');
      return NextResponse.json({ error: 'Supabase not available', logs }, { status: 500 });
    }

    logs.push('[DEBUG_109] Cliente de Supabase OK');

    // Buscar orden 109
    logs.push('[DEBUG_109] Buscando orden con external_reference: ' + paymentData.external_reference);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('external_reference', paymentData.external_reference)
      .single();

    if (orderError) {
      logs.push('[DEBUG_109] ERROR buscando orden: ' + JSON.stringify(orderError));
      return NextResponse.json({ error: 'Order lookup failed', logs, orderError }, { status: 500 });
    }

    if (!order) {
      logs.push('[DEBUG_109] ERROR: Orden no encontrada');
      return NextResponse.json({ error: 'Order not found', logs }, { status: 404 });
    }

    logs.push('[DEBUG_109] Orden encontrada: ' + JSON.stringify(order));

    // Mapear estados
    const newOrderStatus = 'paid';
    const newPaymentStatus = 'paid';

    logs.push('[DEBUG_109] Nuevos estados: order=' + newOrderStatus + ', payment=' + newPaymentStatus);

    // Actualizar orden 109
    logs.push('[DEBUG_109] Actualizando orden 109...');
    
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: newPaymentStatus,
        status: newOrderStatus,
        payment_id: paymentData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) {
      logs.push('[DEBUG_109] ERROR actualizando orden: ' + JSON.stringify(updateError));
      return NextResponse.json({ error: 'Update failed', logs, updateError }, { status: 500 });
    }

    logs.push('[DEBUG_109] Orden 109 actualizada exitosamente: ' + JSON.stringify(updatedOrder));

    return NextResponse.json({
      success: true,
      message: 'Debug webhook para orden 109 (nueva manual) completado exitosamente',
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
          external_reference: order.external_reference
        },
        after: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          payment_status: updatedOrder.payment_status,
          payment_id: updatedOrder.payment_id,
          total: updatedOrder.total,
          external_reference: updatedOrder.external_reference
        }
      },
      newManualOrderInfo: {
        created_manually: true,
        customer: order.payer_info,
        total_amount: order.total,
        created_at: order.created_at,
        order_number: 109,
        is_smaller_order: true,
        note: "Orden más pequeña ($850) para testing adicional"
      }
    }, { status: 200 });

  } catch (error: any) {
    logs.push('[DEBUG_109] EXCEPTION: ' + error.message);
    logs.push('[DEBUG_109] STACK: ' + error.stack);

    return NextResponse.json({
      error: 'Debug order 109 failed',
      message: error.message,
      logs,
      stack: error.stack
    }, { status: 500 });
  }
}










