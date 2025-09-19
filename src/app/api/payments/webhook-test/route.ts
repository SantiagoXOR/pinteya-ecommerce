// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO WEBHOOK TEST API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/integrations/supabase';
import { MercadoPagoWebhookData } from '@/types/mercadopago';

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    console.log('[WEBHOOK_TEST] Webhook test recibido desde IP:', clientIP);

    // Parsear datos del webhook
    const webhookData: MercadoPagoWebhookData = await request.json();
    
    console.log('[WEBHOOK_TEST] Datos del webhook:', JSON.stringify(webhookData, null, 2));

    // Validar que sea un webhook de pago
    if (webhookData.type !== 'payment') {
      console.log('[WEBHOOK_TEST] Non-payment webhook ignorado:', webhookData.type);
      return NextResponse.json({
        status: 'ignored',
        message: 'Non-payment webhook',
        type: webhookData.type
      }, { status: 200 });
    }

    // Validar que tenga datos de pago
    if (!webhookData.data?.id) {
      console.log('[WEBHOOK_TEST] Webhook sin datos de pago');
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Missing payment data'
      }, { status: 400 });
    }

    console.log('[WEBHOOK_TEST] Procesando webhook para payment ID:', webhookData.data.id);

    // Procesar webhook de forma asíncrona
    processWebhookTestAsync(webhookData, clientIP).catch(error => {
      console.error('[WEBHOOK_TEST_ASYNC] Error en procesamiento asíncrono:', error);
      console.error('[WEBHOOK_TEST_ASYNC] Stack trace:', error.stack);
    });

    // Responder inmediatamente a MercadoPago
    return NextResponse.json({
      status: 'received',
      message: 'Webhook test received and processing',
      timestamp: new Date().toISOString(),
      data_id: webhookData.data.id
    }, { status: 200 });
  } catch (error: any) {
    console.error('[WEBHOOK_TEST] Error en webhook:', error);
    console.error('[WEBHOOK_TEST] Stack trace:', error.stack);

    return NextResponse.json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Processing failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Función de procesamiento asíncrono simplificada
async function processWebhookTestAsync(webhookData: MercadoPagoWebhookData, clientIP: string) {
  try {
    console.log('[WEBHOOK_TEST_ASYNC] Iniciando procesamiento asíncrono para:', webhookData.data.id);
    console.log('[WEBHOOK_TEST_ASYNC] Webhook data completo:', JSON.stringify(webhookData, null, 2));

    // Simular datos de pago para testing
    let paymentData;
    if (webhookData.data.id === '123456' || webhookData.data.id === 'test') {
      console.log('[WEBHOOK_TEST_ASYNC] ID de prueba detectado, usando datos simulados');
      paymentData = {
        id: webhookData.data.id,
        status: 'approved',
        external_reference: 'express_checkout_1757431045283', // Usar una orden real
        transaction_amount: 100,
        currency_id: 'ARS'
      };
    } else if (webhookData.data.id === 'manual_payment_110') {
      console.log('[WEBHOOK_TEST_ASYNC] Orden manual 110 detectada:', webhookData.data.id);
      paymentData = {
        id: webhookData.data.id,
        status: 'approved',
        external_reference: 'express_checkout_1757622395061', // Orden 110
        transaction_amount: 405,
        currency_id: 'ARS',
        payer: {
          first_name: 'Santiago',
          last_name: 'Martinez',
          email: 'santiago@xor.com.ar',
          phone: {
            number: '3547527070'
          },
          identification: {
            type: 'DNI',
            number: '12345678'
          }
        },
        additional_info: {
          shipments: {
            receiver_address: {
              street_name: 'Av. Colón',
              street_number: '1234',
              zip_code: '5000',
              floor: '2',
              apartment: 'A'
            }
          }
        }
      };
    } else if (webhookData.data.id === 'manual_payment_106') {
      console.log('[WEBHOOK_TEST_ASYNC] Orden manual 106 detectada:', webhookData.data.id);
      paymentData = {
        id: webhookData.data.id,
        status: 'approved',
        external_reference: 'express_checkout_1757431045283', // Orden 106
        transaction_amount: 780,
        currency_id: 'ARS',
        payer: {
          first_name: 'María',
          last_name: 'González',
          email: 'maria.gonzalez@email.com',
          phone: {
            number: '3511234567'
          },
          identification: {
            type: 'DNI',
            number: '87654321'
          }
        },
        additional_info: {
          shipments: {
            receiver_address: {
              street_name: 'Calle San Martín',
              street_number: '567',
              zip_code: '5000',
              floor: '1',
              apartment: 'B'
            }
          }
        }
      };
    } else {
      console.log('[WEBHOOK_TEST_ASYNC] ID real, saltando procesamiento por ahora');
      return;
    }

    console.log('[WEBHOOK_TEST_ASYNC] Payment data:', JSON.stringify(paymentData, null, 2));

    // Inicializar Supabase
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('[WEBHOOK_TEST_ASYNC] Cliente de Supabase no disponible');
      return;
    }

    // Buscar la orden por external_reference
    const orderReference = paymentData.external_reference;
    if (!orderReference) {
      console.error('[WEBHOOK_TEST_ASYNC] No external_reference found in payment');
      return;
    }

    console.log('[WEBHOOK_TEST_ASYNC] Buscando orden con external_reference:', orderReference);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('external_reference', orderReference)
      .single();

    if (orderError) {
      console.error('[WEBHOOK_TEST_ASYNC] Error buscando orden:', orderError);
      return;
    }

    if (!order) {
      console.error('[WEBHOOK_TEST_ASYNC] Order not found by external_reference:', orderReference);
      return;
    }

    console.log('[WEBHOOK_TEST_ASYNC] Order encontrada:', order.id, 'Status actual:', order.status);

    // Mapear estados
    let newOrderStatus: string;
    let newPaymentStatus: string;

    switch (paymentData.status) {
      case 'approved':
        newOrderStatus = 'paid'; // ✅ CORREGIDO: Usar estado válido
        newPaymentStatus = 'paid';
        break;
      case 'pending':
      case 'in_process':
        newOrderStatus = 'pending';
        newPaymentStatus = 'pending';
        break;
      case 'rejected':
      case 'cancelled':
        newOrderStatus = 'cancelled';
        newPaymentStatus = 'failed';
        break;
      default:
        newOrderStatus = 'pending';
        newPaymentStatus = 'pending';
    }

    console.log('[WEBHOOK_TEST_ASYNC] Actualizando orden con status:', newOrderStatus, 'payment_status:', newPaymentStatus);

    // ✅ NUEVO: Preparar información de envío y payer actualizada desde MercadoPago
    let updatedPayerInfo = order.payer_info || {};
    let updatedShippingAddress = order.shipping_address;

    // Actualizar información del payer desde MercadoPago si está disponible
    if (paymentData.payer) {
      console.log('[WEBHOOK_TEST_ASYNC] 🔍 Actualizando payer info desde MercadoPago');
      updatedPayerInfo = {
        ...updatedPayerInfo,
        name: paymentData.payer.first_name || updatedPayerInfo.name,
        surname: paymentData.payer.last_name || updatedPayerInfo.surname,
        email: paymentData.payer.email || updatedPayerInfo.email,
        phone: paymentData.payer.phone?.number || updatedPayerInfo.phone,
        identification: paymentData.payer.identification ? {
          type: paymentData.payer.identification.type,
          number: paymentData.payer.identification.number
        } : updatedPayerInfo.identification,
      };
    }

    // Actualizar información de envío desde MercadoPago si está disponible
    if (paymentData.additional_info?.shipments?.receiver_address) {
      console.log('[WEBHOOK_TEST_ASYNC] 🔍 Actualizando shipping address desde MercadoPago');
      const mpShipping = paymentData.additional_info.shipments.receiver_address;
      updatedShippingAddress = {
        street_name: mpShipping.street_name || '',
        street_number: mpShipping.street_number || '',
        zip_code: mpShipping.zip_code || '',
        floor: mpShipping.floor || '',
        apartment: mpShipping.apartment || '',
        city_name: 'Córdoba', // Por defecto
        state_name: 'Córdoba', // Por defecto
      };
    }

    console.log('[WEBHOOK_TEST_ASYNC] 🔍 Updated payer info:', JSON.stringify(updatedPayerInfo, null, 2));
    console.log('[WEBHOOK_TEST_ASYNC] 🔍 Updated shipping address:', JSON.stringify(updatedShippingAddress, null, 2));

    // Actualizar la orden con información completa
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: newPaymentStatus,
        status: newOrderStatus,
        payment_id: paymentData.id,
        payer_info: updatedPayerInfo,
        shipping_address: updatedShippingAddress,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('[WEBHOOK_TEST_ASYNC] Error actualizando orden:', updateError);
      return;
    }

    console.log('[WEBHOOK_TEST_ASYNC] ✅ Orden actualizada exitosamente');

    // Enviar email si el pago fue aprobado
    if (paymentData.status === 'approved') {
      console.log('[WEBHOOK_TEST_ASYNC] Enviando email de confirmación...');
      // await sendOrderConfirmationEmail(order);
      console.log('[WEBHOOK_TEST_ASYNC] ✅ Email de confirmación enviado (simulado)');
    }

    console.log('[WEBHOOK_TEST_ASYNC] ✅ Procesamiento completado exitosamente');

  } catch (error) {
    console.error('[WEBHOOK_TEST_ASYNC] Error en procesamiento asíncrono:', error);
    console.error('[WEBHOOK_TEST_ASYNC] Error stack:', error.stack);
  }
}









