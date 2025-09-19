// =====================================================
// API: TRACKING DE ENVÍOS ENTERPRISE
// Endpoints: GET/POST /api/admin/logistics/tracking/[id]
// Descripción: Sistema de tracking tiempo real
// Basado en: Patrones WooCommerce + Spree Commerce
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@/lib/integrations/supabase/server';
import { z } from 'zod';
import { 
  TrackingEvent,
  CreateTrackingEventRequest,
  Shipment 
} from '@/types/logistics';

// =====================================================
// SCHEMAS DE VALIDACIÓN ZOD
// =====================================================

const CreateTrackingEventSchema = z.object({
  status: z.string().min(1, 'Status es requerido'),
  description: z.string().min(1, 'Descripción es requerida'),
  location: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  occurred_at: z.string().datetime('Fecha debe ser válida'),
  external_event_id: z.string().optional(),
  raw_data: z.record(z.any()).optional()
});

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================
async function validateAdminAuth(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  if (session.user.role !== 'admin' && session.user.role !== 'manager') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }
  
  return null;
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

async function validateShipmentExists(supabase: any, shipmentId: number): Promise<Shipment | null> {
  const { data, error } = await supabase
    .from('shipments')
    .select(`
      *,
      carrier:couriers(id, name, code, logo_url),
      items:shipment_items(
        id, quantity, weight_kg,
        product:products(id, name, sku, image_url)
      )
    `)
    .eq('id', shipmentId)
    .single();
  
  if (error || !data) {return null;}
  return data;
}

async function updateShipmentStatus(
  supabase: any, 
  shipmentId: number, 
  status: string
): Promise<void> {
  const statusTimestampMap: Record<string, string> = {
    'confirmed': 'confirmed_at',
    'picked_up': 'picked_up_at',
    'shipped': 'shipped_at',
    'delivered': 'delivered_at',
    'cancelled': 'cancelled_at'
  };
  
  const updateData: any = { status };
  
  // Actualizar timestamp correspondiente si aplica
  if (statusTimestampMap[status]) {
    updateData[statusTimestampMap[status]] = new Date().toISOString();
  }
  
  const { error } = await supabase
    .from('shipments')
    .update(updateData)
    .eq('id', shipmentId);
  
  if (error) {throw error;}
}

// =====================================================
// GET: OBTENER EVENTOS DE TRACKING
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticación
    const authError = await validateAdminAuth(request);
    if (authError) {return authError;}
    
    // Validar ID del envío
    const shipmentId = parseInt(params.id);
    if (isNaN(shipmentId)) {
      return NextResponse.json(
        { error: 'Invalid shipment ID' },
        { status: 400 }
      );
    }
    
    // Crear cliente Supabase
    const supabase = createClient();
    
    // Validar que el envío existe
    const shipment = await validateShipmentExists(supabase, shipmentId);
    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }
    
    // Obtener eventos de tracking
    const { data: trackingEvents, error } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('occurred_at', { ascending: false });
    
    if (error) {throw error;}
    
    return NextResponse.json({
      data: {
        shipment,
        tracking_events: trackingEvents || []
      }
    });
    
  } catch (error) {
    console.error('Error in GET tracking API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// =====================================================
// POST: CREAR EVENTO DE TRACKING
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticación
    const authError = await validateAdminAuth(request);
    if (authError) {return authError;}
    
    // Validar ID del envío
    const shipmentId = parseInt(params.id);
    if (isNaN(shipmentId)) {
      return NextResponse.json(
        { error: 'Invalid shipment ID' },
        { status: 400 }
      );
    }
    
    // Parsear y validar body
    const body = await request.json();
    const validatedData = CreateTrackingEventSchema.parse(body);
    
    // Crear cliente Supabase
    const supabase = createClient();
    
    // Validar que el envío existe
    const shipment = await validateShipmentExists(supabase, shipmentId);
    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }
    
    // Crear evento de tracking
    const { data: trackingEvent, error: trackingError } = await supabase
      .from('tracking_events')
      .insert({
        shipment_id: shipmentId,
        status: validatedData.status,
        description: validatedData.description,
        location: validatedData.location,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        occurred_at: validatedData.occurred_at,
        external_event_id: validatedData.external_event_id,
        raw_data: validatedData.raw_data
      })
      .select('*')
      .single();
    
    if (trackingError) {throw trackingError;}
    
    // Actualizar estado del envío si es necesario
    const statusesToUpdate = [
      'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 
      'delivered', 'exception', 'cancelled', 'returned'
    ];
    
    if (statusesToUpdate.includes(validatedData.status)) {
      await updateShipmentStatus(supabase, shipmentId, validatedData.status);
    }
    
    // Si el envío fue entregado, actualizar fecha de entrega real
    if (validatedData.status === 'delivered') {
      await supabase
        .from('shipments')
        .update({ 
          actual_delivery_date: validatedData.occurred_at.split('T')[0]
        })
        .eq('id', shipmentId);
    }
    
    return NextResponse.json(
      { 
        data: trackingEvent,
        message: 'Tracking event created successfully'
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error in POST tracking API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors.reduce((acc, err) => {
            acc[err.path.join('.')] = [err.message];
            return acc;
          }, {} as Record<string, string[]>)
        },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT: ACTUALIZAR MÚLTIPLES EVENTOS (BULK UPDATE)
// =====================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticación
    const authError = await validateAdminAuth(request);
    if (authError) {return authError;}
    
    // Validar ID del envío
    const shipmentId = parseInt(params.id);
    if (isNaN(shipmentId)) {
      return NextResponse.json(
        { error: 'Invalid shipment ID' },
        { status: 400 }
      );
    }
    
    // Parsear body para bulk update
    const body = await request.json();
    const { events } = body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }
    
    // Validar cada evento
    const validatedEvents = events.map(event => 
      CreateTrackingEventSchema.parse(event)
    );
    
    // Crear cliente Supabase
    const supabase = createClient();
    
    // Validar que el envío existe
    const shipment = await validateShipmentExists(supabase, shipmentId);
    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }
    
    // Insertar eventos en lote
    const eventsToInsert = validatedEvents.map(event => ({
      shipment_id: shipmentId,
      ...event
    }));
    
    const { data: insertedEvents, error: insertError } = await supabase
      .from('tracking_events')
      .insert(eventsToInsert)
      .select('*');
    
    if (insertError) {throw insertError;}
    
    // Actualizar estado del envío al último estado válido
    const lastValidStatus = validatedEvents
      .filter(event => [
        'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 
        'delivered', 'exception', 'cancelled', 'returned'
      ].includes(event.status))
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0];
    
    if (lastValidStatus) {
      await updateShipmentStatus(supabase, shipmentId, lastValidStatus.status);
    }
    
    return NextResponse.json(
      { 
        data: insertedEvents,
        message: `${insertedEvents?.length || 0} tracking events created successfully`
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error in PUT tracking API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors.reduce((acc, err) => {
            acc[err.path.join('.')] = [err.message];
            return acc;
          }, {} as Record<string, string[]>)
        },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
