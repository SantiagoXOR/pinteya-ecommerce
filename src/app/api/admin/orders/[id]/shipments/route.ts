// =====================================================
// API: INTEGRACIÓN ÓRDENES-LOGÍSTICA
// Ruta: /api/admin/orders/[id]/shipments
// Descripción: Crear y gestionar envíos desde órdenes
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// =====================================================
// CONFIGURACIÓN
// =====================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =====================================================
// ESQUEMAS DE VALIDACIÓN
// =====================================================

const CreateShipmentFromOrderSchema = z.object({
  carrier_id: z.number().int().positive(),
  shipping_service: z.string().min(1),
  items: z.array(z.object({
    order_item_id: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1),
  pickup_address: z.object({
    street_name: z.string(),
    street_number: z.string(),
    city_name: z.string(),
    state_name: z.string(),
    zip_code: z.string(),
    country: z.string().default('Argentina')
  }).optional(),
  delivery_address: z.object({
    street_name: z.string(),
    street_number: z.string(),
    apartment: z.string().optional(),
    city_name: z.string(),
    state_name: z.string(),
    zip_code: z.string(),
    country: z.string().default('Argentina')
  }),
  weight_kg: z.number().positive().optional(),
  dimensions_cm: z.string().optional(),
  special_instructions: z.string().optional(),
  notes: z.string().optional(),
  estimated_delivery_date: z.string().optional()
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function generateShipmentNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `SHP-${timestamp.slice(-8)}-${random}`;
}

async function validateOrderAccess(orderId: string, userId: string): Promise<any> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      payment_status,
      total,
      shipping_address,
      user_profiles (
        id,
        name,
        email
      ),
      order_items (
        id,
        product_id,
        quantity,
        unit_price,
        products (
          id,
          name,
          weight_kg,
          dimensions_cm
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    throw new Error(`Error obteniendo orden: ${error.message}`);
  }

  if (!order) {
    throw new Error('Orden no encontrada');
  }

  // Verificar que la orden esté en estado válido para envío
  if (!['confirmed', 'processing'].includes(order.status)) {
    throw new Error(`La orden debe estar confirmada o en procesamiento para crear envío. Estado actual: ${order.status}`);
  }

  return order;
}

async function createShipmentRecord(orderData: any, validatedData: any): Promise<any> {
  const shipmentNumber = generateShipmentNumber();
  
  // Calcular peso total si no se proporciona
  let totalWeight = validatedData.weight_kg;
  if (!totalWeight) {
    totalWeight = orderData.order_items.reduce((sum: number, item: any) => {
      const itemWeight = item.products?.weight_kg || 0.5; // Peso por defecto 500g
      return sum + (itemWeight * item.quantity);
    }, 0);
  }

  // Usar dirección de envío de la orden si no se proporciona
  const deliveryAddress = validatedData.delivery_address || orderData.shipping_address;

  const { data: shipment, error } = await supabase
    .from('shipments')
    .insert({
      shipment_number: shipmentNumber,
      order_id: orderData.id,
      status: 'pending',
      carrier_id: validatedData.carrier_id,
      shipping_service: validatedData.shipping_service,
      pickup_address: validatedData.pickup_address,
      delivery_address: deliveryAddress,
      weight_kg: totalWeight,
      dimensions_cm: validatedData.dimensions_cm,
      special_instructions: validatedData.special_instructions,
      notes: validatedData.notes,
      estimated_delivery_date: validatedData.estimated_delivery_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      carrier:couriers(id, name, code, logo_url)
    `)
    .single();

  if (error) {
    throw new Error(`Error creando envío: ${error.message}`);
  }

  return shipment;
}

async function createShipmentItems(shipmentId: string, orderItems: any[], requestedItems: any[]): Promise<void> {
  const shipmentItems = requestedItems.map(reqItem => {
    const orderItem = orderItems.find(oi => oi.id === reqItem.order_item_id);
    if (!orderItem) {
      throw new Error(`Item de orden no encontrado: ${reqItem.order_item_id}`);
    }

    if (reqItem.quantity > orderItem.quantity) {
      throw new Error(`Cantidad solicitada (${reqItem.quantity}) excede cantidad disponible (${orderItem.quantity})`);
    }

    return {
      shipment_id: shipmentId,
      order_item_id: reqItem.order_item_id,
      product_id: orderItem.product_id,
      quantity: reqItem.quantity,
      weight_kg: (orderItem.products?.weight_kg || 0.5) * reqItem.quantity,
      created_at: new Date().toISOString()
    };
  });

  const { error } = await supabase
    .from('shipment_items')
    .insert(shipmentItems);

  if (error) {
    throw new Error(`Error creando items de envío: ${error.message}`);
  }
}

async function createInitialTrackingEvent(shipmentId: string): Promise<void> {
  const { error } = await supabase
    .from('tracking_events')
    .insert({
      shipment_id: shipmentId,
      status: 'pending',
      description: 'Envío creado desde orden - Pendiente de confirmación',
      occurred_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error creando evento de tracking inicial:', error);
    // No lanzar error, es opcional
  }
}

async function updateOrderStatus(orderId: string): Promise<void> {
  // Actualizar estado de la orden a "shipped" si todos los items tienen envío
  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'processing', // Cambiar a processing mientras se confirma el envío
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error actualizando estado de orden:', error);
    // No lanzar error, es opcional
  }
}

// =====================================================
// HANDLER POST - CREAR ENVÍO DESDE ORDEN
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const orderId = params.id;

    // Validar datos de entrada
    const body = await request.json();
    const validationResult = CreateShipmentFromOrderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos de envío inválidos', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Validar acceso a la orden y obtener datos
    const orderData = await validateOrderAccess(orderId, session.user.id!);

    // Verificar que el carrier existe
    const { data: carrier, error: carrierError } = await supabase
      .from('couriers')
      .select('id, name, is_active')
      .eq('id', validatedData.carrier_id)
      .eq('is_active', true)
      .single();

    if (carrierError || !carrier) {
      return NextResponse.json(
        { error: 'Carrier no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Crear el envío
    const shipment = await createShipmentRecord(orderData, validatedData);

    // Crear los items del envío
    await createShipmentItems(shipment.id, orderData.order_items, validatedData.items);

    // Crear evento de tracking inicial
    await createInitialTrackingEvent(shipment.id);

    // Actualizar estado de la orden
    await updateOrderStatus(orderId);

    // Obtener el envío completo con todos los datos
    const { data: completeShipment, error: fetchError } = await supabase
      .from('shipments')
      .select(`
        *,
        carrier:couriers(id, name, code, logo_url),
        items:shipment_items(
          id, quantity, weight_kg,
          order_item:order_items(
            id, quantity, unit_price,
            product:products(id, name, sku)
          )
        ),
        tracking_events(
          id, status, description, occurred_at
        )
      `)
      .eq('id', shipment.id)
      .single();

    if (fetchError) {
      console.error('Error obteniendo envío completo:', fetchError);
    }

    console.log('✅ Envío creado exitosamente:', {
      shipment_id: shipment.id,
      shipment_number: shipment.shipment_number,
      order_id: orderId,
      carrier: carrier.name,
      user_id: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Envío creado exitosamente',
      data: completeShipment || shipment
    });

  } catch (error) {
    console.error('❌ Error creando envío desde orden:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// =====================================================
// HANDLER GET - OBTENER ENVÍOS DE UNA ORDEN
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const orderId = params.id;

    // Obtener envíos de la orden
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select(`
        *,
        carrier:couriers(id, name, code, logo_url),
        items:shipment_items(
          id, quantity, weight_kg,
          order_item:order_items(
            id, quantity, unit_price,
            product:products(id, name, sku)
          )
        ),
        tracking_events(
          id, status, description, occurred_at, location
        )
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: shipments || []
    });

  } catch (error) {
    console.error('❌ Error obteniendo envíos de orden:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
