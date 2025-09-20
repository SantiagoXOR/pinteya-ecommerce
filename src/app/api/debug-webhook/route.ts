// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - DEBUG WEBHOOK
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/integrations/supabase';

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  
  try {
    logs.push('[DEBUG] Iniciando debug del webhook...');

    // Simular datos de webhook
    const webhookData = {
      action: "payment.updated",
      api_version: "v1",
      data: { id: "123456" },
      date_created: "2021-11-01T02:02:02Z",
      id: "123456",
      live_mode: false,
      type: "payment",
      user_id: 452711838
    };

    logs.push('[DEBUG] Webhook data simulado: ' + JSON.stringify(webhookData));

    // Simular datos de pago para nueva orden
    const paymentData = {
      id: 'test_payment_107',
      status: 'approved',
      external_reference: 'test_order_1757606994811', // Nueva orden 107
      transaction_amount: 3650,
      currency_id: 'ARS'
    };

    logs.push('[DEBUG] Payment data simulado: ' + JSON.stringify(paymentData));

    // Probar conexión a Supabase
    logs.push('[DEBUG] Probando conexión a Supabase...');
    const supabase = getSupabaseClient(true);
    
    if (!supabase) {
      logs.push('[DEBUG] ERROR: Cliente de Supabase no disponible');
      return NextResponse.json({ error: 'Supabase not available', logs }, { status: 500 });
    }

    logs.push('[DEBUG] Cliente de Supabase OK');

    // Buscar orden
    logs.push('[DEBUG] Buscando orden con external_reference: ' + paymentData.external_reference);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('external_reference', paymentData.external_reference)
      .single();

    if (orderError) {
      logs.push('[DEBUG] ERROR buscando orden: ' + JSON.stringify(orderError));
      return NextResponse.json({ error: 'Order lookup failed', logs, orderError }, { status: 500 });
    }

    if (!order) {
      logs.push('[DEBUG] ERROR: Orden no encontrada');
      return NextResponse.json({ error: 'Order not found', logs }, { status: 404 });
    }

    logs.push('[DEBUG] Orden encontrada: ' + JSON.stringify(order));

    // Mapear estados
    const newOrderStatus = 'paid';
    const newPaymentStatus = 'paid';

    logs.push('[DEBUG] Nuevos estados: order=' + newOrderStatus + ', payment=' + newPaymentStatus);

    // Actualizar orden
    logs.push('[DEBUG] Actualizando orden...');
    
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
      logs.push('[DEBUG] ERROR actualizando orden: ' + JSON.stringify(updateError));
      return NextResponse.json({ error: 'Update failed', logs, updateError }, { status: 500 });
    }

    logs.push('[DEBUG] Orden actualizada exitosamente: ' + JSON.stringify(updatedOrder));

    return NextResponse.json({
      success: true,
      message: 'Debug webhook completed successfully',
      logs,
      originalOrder: order,
      updatedOrder,
      paymentData
    }, { status: 200 });

  } catch (error: any) {
    logs.push('[DEBUG] EXCEPTION: ' + error.message);
    logs.push('[DEBUG] STACK: ' + error.stack);

    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      logs,
      stack: error.stack
    }, { status: 500 });
  }
}










