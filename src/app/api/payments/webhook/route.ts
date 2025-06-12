// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO WEBHOOK API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentInfo, validateWebhookSignature } from '@/lib/mercadopago';
import { getSupabaseClient } from '@/lib/supabase';
import { MercadoPagoWebhookData } from '@/types/mercadopago';

export async function POST(request: NextRequest) {
  try {
    // Obtener headers necesarios para validación
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    
    if (!xSignature || !xRequestId) {
      console.error('Missing required headers for webhook validation');
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    // Obtener datos del webhook
    const webhookData: MercadoPagoWebhookData = await request.json();
    
    console.log('Webhook received:', {
      type: webhookData.type,
      action: webhookData.action,
      dataId: webhookData.data.id,
    });

    // Solo procesar notificaciones de pagos
    if (webhookData.type !== 'payment') {
      console.log('Ignoring non-payment webhook:', webhookData.type);
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // Validar firma del webhook (opcional en desarrollo)
    const timestamp = Date.now().toString();
    const isValidSignature = validateWebhookSignature(
      xSignature,
      xRequestId,
      webhookData.data.id,
      timestamp
    );

    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Obtener información del pago desde MercadoPago
    const paymentResult = await getPaymentInfo(webhookData.data.id);
    
    if (!paymentResult.success) {
      console.error('Error getting payment info:', paymentResult.error);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = paymentResult.data;
    
    // Inicializar Supabase con cliente administrativo
    const supabase = getSupabaseClient(true);

    // Buscar la orden por external_reference
    const orderId = payment.external_reference;
    if (!orderId) {
      console.error('No external_reference found in payment');
      return NextResponse.json({ error: 'No order reference' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId, orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Mapear estados de MercadoPago a estados internos
    let newStatus: string;
    let shouldUpdateStock = false;

    switch (payment.status) {
      case 'approved':
        newStatus = 'paid';
        shouldUpdateStock = true;
        break;
      case 'pending':
      case 'in_process':
        newStatus = 'pending';
        break;
      case 'rejected':
      case 'cancelled':
        newStatus = 'cancelled';
        break;
      case 'refunded':
      case 'charged_back':
        newStatus = 'refunded';
        // TODO: Restaurar stock si es necesario
        break;
      default:
        newStatus = 'pending';
    }

    // Actualizar estado de la orden
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
    }

    // Si el pago fue aprobado, actualizar stock de productos
    if (shouldUpdateStock) {
      try {
        // Obtener items de la orden
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', orderId);

        if (itemsError) {
          console.error('Error getting order items:', itemsError);
        } else if (orderItems) {
          // Actualizar stock de cada producto
          for (const item of orderItems) {
            const { error: stockError } = await supabase.rpc('update_product_stock', {
              product_id: item.product_id,
              quantity_sold: item.quantity,
            });

            if (stockError) {
              console.error('Error updating stock for product:', item.product_id, stockError);
            }
          }
        }
      } catch (stockError) {
        console.error('Error in stock update process:', stockError);
        // No fallar el webhook por errores de stock
      }
    }

    // Log del evento procesado
    console.log('Webhook processed successfully:', {
      orderId,
      paymentId: payment.id,
      status: payment.status,
      newOrderStatus: newStatus,
      amount: payment.transaction_amount,
    });

    // Responder exitosamente
    return NextResponse.json({ 
      status: 'processed',
      order_id: orderId,
      payment_status: payment.status,
      order_status: newStatus,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    
    // Retornar error 500 para que MercadoPago reintente
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

// Función para crear la función de actualización de stock en Supabase
// Esta función debe ejecutarse en la consola de Supabase:
/*
CREATE OR REPLACE FUNCTION update_product_stock(product_id INTEGER, quantity_sold INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET stock = stock - quantity_sold,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
*/
