// Configuración para Node.js Runtime
export const runtime = 'nodejs';

/**
 * API para obtener órdenes pendientes de entrega para drivers
 * GET /api/driver/pending-orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/integrations/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Configurar Supabase con service role para acceso completo
    const supabase = createAdminClient();

    // Verificar que el usuario sea un driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, status')
      .eq('email', session.user.email)
      .eq('status', 'available')
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { error: 'Driver no encontrado o no disponible' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const limit = parseInt(searchParams.get('limit') || '50');

    // Debug: Verificar configuración de Supabase
    console.log('🔧 Supabase client configured:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
    });

    // Consultar órdenes pendientes de entrega
    console.log('🔍 Executing Supabase query...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        payment_status,
        fulfillment_status,
        shipping_address,
        estimated_delivery,
        created_at,
        order_number,
        tracking_number,
        notes
      `)
      .in('status', ['confirmed', 'paid'])
      .eq('fulfillment_status', 'unfulfilled')
      .not('shipping_address', 'is', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    console.log('🔍 Raw Supabase response:', { data: orders, error: ordersError });

    console.log('🔍 Debug - Filters applied:', {
      status: ['confirmed', 'paid'],
      fulfillment_status: 'unfulfilled',
      shipping_address: 'not null'
    });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Error al obtener órdenes' },
        { status: 500 }
      );
    }

    console.log('📦 Orders fetched from database:', orders?.length || 0);
    console.log('📦 First order sample:', orders?.[0] ? JSON.stringify(orders[0], null, 2) : 'No orders');

    // Si hay órdenes, obtener los order_items por separado
    if (orders && orders.length > 0) {
      const orderIds = orders.map(order => order.id);
      console.log('🔍 Fetching order_items for orders:', orderIds);

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            description
          )
        `)
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
      } else {
        console.log('📦 Order items fetched:', orderItems?.length || 0);

        // Agregar order_items a cada orden
        orders.forEach(order => {
          order.order_items = orderItems?.filter(item => item.order_id === order.id) || [];
        });
      }
    }

    // Filtrar órdenes que tienen dirección de entrega válida
    const validOrders = orders?.filter(order => {
      const address = order.shipping_address;
      return address && 
             address.street_name && 
             address.street_number && 
             address.city_name;
    }) || [];

    // Formatear datos para el frontend
    const formattedOrders = validOrders.map(order => ({
      id: order.id,
      orderNumber: order.order_number || `#${order.id}`,
      total: parseFloat(order.total),
      status: order.status,
      paymentStatus: order.payment_status,
      fulfillmentStatus: order.fulfillment_status,
      createdAt: order.created_at,
      estimatedDelivery: order.estimated_delivery,
      trackingNumber: order.tracking_number,
      notes: order.notes,
      shippingAddress: {
        streetName: order.shipping_address.street_name,
        streetNumber: order.shipping_address.street_number,
        floor: order.shipping_address.floor || '',
        apartment: order.shipping_address.apartment || '',
        cityName: order.shipping_address.city_name,
        stateName: order.shipping_address.state_name,
        zipCode: order.shipping_address.zip_code,
        fullAddress: `${order.shipping_address.street_name} ${order.shipping_address.street_number}${
          order.shipping_address.floor ? `, Piso ${order.shipping_address.floor}` : ''
        }${
          order.shipping_address.apartment ? `, Depto ${order.shipping_address.apartment}` : ''
        }, ${order.shipping_address.city_name}, ${order.shipping_address.state_name} ${order.shipping_address.zip_code}`
      },
      items: order.order_items?.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products?.name || 'Producto desconocido',
        description: item.products?.description || '',
        quantity: item.quantity,
        price: parseFloat(item.price),
        weight: 0, // Peso por defecto hasta que se agregue la columna
        dimensions: null // Dimensiones por defecto hasta que se agregue la columna
      })) || [],
      totalItems: order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      totalWeight: 0 // Peso total por defecto hasta que se agregue la columna weight
    }));

    // Estadísticas del día
    const stats = {
      totalOrders: formattedOrders.length,
      totalValue: formattedOrders.reduce((sum, order) => sum + order.total, 0),
      totalItems: formattedOrders.reduce((sum, order) => sum + order.totalItems, 0),
      totalWeight: formattedOrders.reduce((sum, order) => sum + order.totalWeight, 0),
      averageOrderValue: formattedOrders.length > 0 
        ? formattedOrders.reduce((sum, order) => sum + order.total, 0) / formattedOrders.length 
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        stats,
        driver: {
          id: driver.id,
          name: `${driver.first_name} ${driver.last_name}`,
          status: driver.status
        },
        metadata: {
          date,
          limit,
          total: formattedOrders.length
        }
      }
    });

  } catch (error) {
    console.error('Error in pending-orders API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}










