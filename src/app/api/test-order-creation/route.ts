// ===================================
// PINTEYA E-COMMERCE - TEST ORDER CREATION
// Endpoint para crear órdenes de prueba y validar el flujo completo
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/integrations/supabase';

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  
  try {
    logs.push('[TEST_ORDER] Iniciando creación de orden de prueba...');

    // Datos de prueba para la orden
    const testOrderData = {
      items: [
        {
          id: "43",
          name: "Pincel Persianero N°20",
          price: 1150,
          quantity: 2,
          image: "/products/pincel-persianero-20.jpg"
        },
        {
          id: "87", 
          name: "Lija al Agua Grano 40",
          price: 850,
          quantity: 1,
          image: "/products/lija-agua-40.jpg"
        }
      ],
      payer: {
        name: "Juan",
        surname: "Pérez",
        email: "juan.perez@test.com",
        phone: "+54 11 1234-5678",
        identification: {
          type: "DNI",
          number: "12345678"
        }
      },
      shipping: {
        cost: 500,
        address: {
          street_name: "Av. Corrientes",
          street_number: 1234,
          zip_code: "1043",
          city_name: "Buenos Aires",
          state_name: "CABA"
        }
      },
      external_reference: `test_order_${Date.now()}`
    };

    logs.push('[TEST_ORDER] Datos de orden preparados: ' + JSON.stringify(testOrderData, null, 2));

    // Calcular totales
    const itemsTotal = testOrderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = testOrderData.shipping.cost;
    const totalAmount = itemsTotal + shippingCost;

    logs.push(`[TEST_ORDER] Totales calculados: items=${itemsTotal}, shipping=${shippingCost}, total=${totalAmount}`);

    // Conectar a Supabase
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      logs.push('[TEST_ORDER] ERROR: Cliente de Supabase no disponible');
      return NextResponse.json({ error: 'Supabase not available', logs }, { status: 500 });
    }

    logs.push('[TEST_ORDER] Cliente de Supabase OK');

    // Crear orden en base de datos
    logs.push('[TEST_ORDER] Creando orden en base de datos...');
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: '00000000-0000-4000-8000-000000000000', // Usuario de prueba
        status: 'pending',
        payment_status: 'pending',
        total: totalAmount,
        shipping_address: JSON.stringify(testOrderData.shipping.address),
        external_reference: testOrderData.external_reference,
        payer_info: testOrderData.payer,
      })
      .select()
      .single();

    if (orderError) {
      logs.push('[TEST_ORDER] ERROR creando orden: ' + JSON.stringify(orderError));
      return NextResponse.json({ error: 'Order creation failed', logs, orderError }, { status: 500 });
    }

    logs.push('[TEST_ORDER] Orden creada exitosamente: ' + JSON.stringify(order));

    // Crear items de la orden
    logs.push('[TEST_ORDER] Creando items de la orden...');
    
    const orderItems = testOrderData.items.map(item => ({
      order_id: order.id,
      product_id: parseInt(item.id),
      quantity: item.quantity,
      price: item.price,
      product_name: item.name,
    }));

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      logs.push('[TEST_ORDER] ERROR creando items: ' + JSON.stringify(itemsError));
      // No es crítico, continuamos
    } else {
      logs.push('[TEST_ORDER] Items creados exitosamente: ' + items?.length + ' items');
    }

    // Simular creación de preferencia de MercadoPago
    const mockPreference = {
      id: `test_preference_${Date.now()}`,
      init_point: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=test_preference_${Date.now()}`,
      external_reference: testOrderData.external_reference,
      items: testOrderData.items,
      total_amount: totalAmount
    };

    logs.push('[TEST_ORDER] Preferencia simulada creada: ' + JSON.stringify(mockPreference));

    // Actualizar orden con preference_id
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_preference_id: mockPreference.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) {
      logs.push('[TEST_ORDER] WARNING: Error actualizando preference_id: ' + JSON.stringify(updateError));
    } else {
      logs.push('[TEST_ORDER] Orden actualizada con preference_id');
    }

    return NextResponse.json({
      success: true,
      message: 'Orden de prueba creada exitosamente',
      logs,
      data: {
        order: updatedOrder || order,
        items: items || [],
        preference: mockPreference,
        totals: {
          items: itemsTotal,
          shipping: shippingCost,
          total: totalAmount
        },
        webhook_test_data: {
          payment_id: "test_payment_" + order.id,
          external_reference: testOrderData.external_reference,
          webhook_url: "https://www.pinteya.com/api/payments/webhook",
          test_payload: {
            action: "payment.updated",
            api_version: "v1",
            data: {
              id: "test_payment_" + order.id
            },
            date_created: new Date().toISOString(),
            id: "test_payment_" + order.id,
            live_mode: false,
            type: "payment",
            user_id: 452711838
          }
        }
      }
    }, { status: 201 });

  } catch (error: any) {
    logs.push('[TEST_ORDER] EXCEPTION: ' + error.message);
    logs.push('[TEST_ORDER] STACK: ' + error.stack);

    return NextResponse.json({
      error: 'Test order creation failed',
      message: error.message,
      logs,
      stack: error.stack
    }, { status: 500 });
  }
}









