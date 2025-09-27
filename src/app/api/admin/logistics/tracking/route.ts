// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// =====================================================
// API: SEGUIMIENTO DE ENVÍOS EN TIEMPO REAL ENTERPRISE
// Endpoint: /api/admin/logistics/tracking
// Descripción: Gestión completa de tracking de envíos
// Basado en: Patrones enterprise establecidos en el proyecto
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { composeMiddlewares } from '@/lib/api/middleware-composer';
import { withErrorHandler, ApiError, ValidationError, NotFoundError } from '@/lib/api/error-handler';
import { withApiLogging, logAdminAction } from '@/lib/api/api-logger';
import { withAdminAuth } from '@/lib/auth/api-auth-middleware';
import { withValidation } from '@/lib/validation/admin-schemas';
import { createClient } from '@/lib/integrations/supabase/server';
import { Database } from '@/types/database';
import { auth } from '@/lib/auth/config';
import { checkRateLimit } from '@/lib/auth/rate-limiting';
import { 
  TrackingEvent,
  TrackingEventType,
  ShipmentStatus,
  TrackingFiltersRequest,
  TrackingEventCreateRequest,
  TrackingEventUpdateRequest,
  TrackingResponse,
  TrackingListResponse,
  BulkTrackingUpdateRequest
} from '@/types/logistics';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const TrackingFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
limit: z.coerce.number().int().min(1).max(100).default(20),
  shipment_id: z.number().int().positive().optional(),
  tracking_number: z.string().optional(),
  event_type: z.nativeEnum(TrackingEventType).optional(),
  status: z.nativeEnum(ShipmentStatus).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  location: z.string().optional(),
  carrier_id: z.number().int().positive().optional(),
  sort_by: z.enum(['created_at', 'event_date', 'shipment_id']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

const TrackingEventCreateSchema = z.object({
  shipment_id: z.number().int().positive('ID de envío es requerido'),
  event_type: z.nativeEnum(TrackingEventType, { 
    errorMap: () => ({ message: 'Tipo de evento inválido' })
  }),
  status: z.nativeEnum(ShipmentStatus, {
    errorMap: () => ({ message: 'Estado de envío inválido' })
  }),
  event_date: z.string().datetime('Fecha del evento debe ser válida'),
  location: z.string().min(1, 'Ubicación es requerida').max(255),
  description: z.string().max(500, 'Descripción muy larga').optional(),
  carrier_reference: z.string().max(100).optional(),
  estimated_delivery: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

const TrackingEventUpdateSchema = TrackingEventCreateSchema.partial().omit({ shipment_id: true });

const BulkTrackingUpdateSchema = z.object({
  events: z.array(TrackingEventCreateSchema).min(1, 'Debe incluir al menos un evento').max(50, 'Máximo 50 eventos por lote')
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function validateAdminAuth(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'No autorizado', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // Verificar rate limiting
  const rateLimitResult = await checkRateLimit(request, {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 200, // Más permisivo para tracking en tiempo real
    keyGenerator: (req) => `admin_tracking_${session.user.id}_${req.method}`
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Demasiadas solicitudes', 
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter 
      },
      { status: 429 }
    );
  }

  return null;
}

async function updateShipmentStatus(supabase: ReturnType<typeof createClient<Database>>, shipmentId: number, newStatus: ShipmentStatus) {
  // Actualizar estado del envío basado en el último evento
  const { error } = await supabase
    .from('shipments')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString(),
      // Actualizar fechas específicas según el estado
      ...(newStatus === ShipmentStatus.PICKED_UP && { picked_up_at: new Date().toISOString() }),
      ...(newStatus === ShipmentStatus.DELIVERED && { delivered_at: new Date().toISOString() }),
      ...(newStatus === ShipmentStatus.CANCELLED && { cancelled_at: new Date().toISOString() })
    })
    .eq('id', shipmentId);

  if (error) {
    throw new ApiError('Error al actualizar estado del envío', 500, 'DATABASE_ERROR', error);
  }
}

// =====================================================
// HANDLERS
// =====================================================

async function getHandler(request: NextRequest) {
  // Validar autenticación
  const authError = await validateAdminAuth(request);
  if (authError) {return authError;}

  const { searchParams } = new URL(request.url);
  const filters = TrackingFiltersSchema.parse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    shipment_id: searchParams.get('shipment_id') ? parseInt(searchParams.get('shipment_id')!) : undefined,
    tracking_number: searchParams.get('tracking_number') || undefined,
    event_type: searchParams.get('event_type') || undefined,
    status: searchParams.get('status') || undefined,
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined,
    location: searchParams.get('location') || undefined,
    carrier_id: searchParams.get('carrier_id') ? parseInt(searchParams.get('carrier_id')!) : undefined,
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: searchParams.get('sort_order') || 'desc'
  });

  const supabase = createClient();

  // Construir query con joins optimizados
  let query = supabase
    .from('tracking_events')
    .select(`
      *,
      shipments!tracking_events_shipment_id_fkey (
        id,
        shipment_number,
        tracking_number,
        status,
        carrier_id,
        couriers (
          id,
          name,
          code
        )
      )
    `, { count: 'exact' });

  // Aplicar filtros
  if (filters.shipment_id) {
    query = query.eq('shipment_id', filters.shipment_id);
  }

  if (filters.tracking_number) {
    query = query.eq('shipments.tracking_number', filters.tracking_number);
  }

  if (filters.event_type) {
    query = query.eq('event_type', filters.event_type);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.date_from) {
    query = query.gte('event_date', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('event_date', filters.date_to);
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters.carrier_id) {
    query = query.eq('shipments.carrier_id', filters.carrier_id);
  }

  // Aplicar ordenamiento y paginación
  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;

  const { data: trackingEvents, error, count } = await query
    .order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
    .range(from, to);

  if (error) {
    throw new ApiError('Error al obtener eventos de tracking', 500, 'DATABASE_ERROR', error);
  }

  const response: TrackingListResponse = {
    data: trackingEvents || [],
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / filters.limit)
    },
    filters: {
      shipment_id: filters.shipment_id,
      tracking_number: filters.tracking_number,
      event_type: filters.event_type,
      status: filters.status,
      date_from: filters.date_from,
      date_to: filters.date_to,
      location: filters.location,
      carrier_id: filters.carrier_id
    }
  };

  return NextResponse.json(response);
}

async function postHandler(request: NextRequest) {
  // Validar autenticación
  const authError = await validateAdminAuth(request);
  if (authError) {return authError;}

  const session = await auth();
  const body = await request.json();
  
  // Verificar si es una actualización masiva o un evento individual
  if (body.events && Array.isArray(body.events)) {
    return handleBulkUpdate(request, body);
  }

  const validatedData = TrackingEventCreateSchema.parse(body);
  const supabase = createClient();

  // Verificar que el envío existe
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .select('id, status, tracking_number')
    .eq('id', validatedData.shipment_id)
    .single();

  if (shipmentError || !shipment) {
    throw new NotFoundError('Envío no encontrado');
  }

  // Crear evento de tracking
  const { data: trackingEvent, error } = await supabase
    .from('tracking_events')
    .insert({
      shipment_id: validatedData.shipment_id,
      event_type: validatedData.event_type,
      status: validatedData.status,
      event_date: validatedData.event_date,
      location: validatedData.location,
      description: validatedData.description,
      carrier_reference: validatedData.carrier_reference,
      estimated_delivery: validatedData.estimated_delivery,
      metadata: validatedData.metadata
    })
    .select()
    .single();

  if (error) {
    throw new ApiError('Error al crear evento de tracking', 500, 'DATABASE_ERROR', error);
  }

  // Actualizar estado del envío si es necesario
  if (validatedData.status !== shipment.status) {
    await updateShipmentStatus(supabase, validatedData.shipment_id, validatedData.status);
  }

  // Log de auditoría
  await logAdminAction(session.user.id, 'CREATE', 'tracking_event', trackingEvent.id, null, trackingEvent);

  const response: TrackingResponse = {
    data: trackingEvent,
    success: true,
    message: 'Evento de tracking creado exitosamente'
  };

  return NextResponse.json(response, { status: 201 });
}

async function handleBulkUpdate(request: NextRequest, body: any) {
  const session = await auth();
  const validatedData = BulkTrackingUpdateSchema.parse(body);
  const supabase = createClient();

  const results = [];
  const errors = [];

  // Procesar eventos en lotes para mejor performance
  for (const eventData of validatedData.events) {
    try {
      // Verificar que el envío existe
      const { data: shipment } = await supabase
        .from('shipments')
        .select('id, status')
        .eq('id', eventData.shipment_id)
        .single();

      if (!shipment) {
        errors.push({
          shipment_id: eventData.shipment_id,
          error: 'Envío no encontrado'
        });
        continue;
      }

      // Crear evento
      const { data: trackingEvent, error } = await supabase
        .from('tracking_events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        errors.push({
          shipment_id: eventData.shipment_id,
          error: error.message
        });
        continue;
      }

      // Actualizar estado del envío si es necesario
      if (eventData.status !== shipment.status) {
        await updateShipmentStatus(supabase, eventData.shipment_id, eventData.status);
      }

      results.push(trackingEvent);

      // Log de auditoría
      await logAdminAction(session.user.id, 'CREATE', 'tracking_event', trackingEvent.id, null, trackingEvent);

    } catch (error) {
      errors.push({
        shipment_id: eventData.shipment_id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Procesados ${results.length} eventos exitosamente`,
    data: {
      created: results,
      errors: errors,
      summary: {
        total: validatedData.events.length,
        successful: results.length,
        failed: errors.length
      }
    }
  });
}

async function putHandler(request: NextRequest) {
  // Validar autenticación
  const authError = await validateAdminAuth(request);
  if (authError) {return authError;}

  const session = await auth();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('id');

  if (!eventId) {
    throw new ValidationError('ID del evento de tracking es requerido');
  }

  const body = await request.json();
  const validatedData = TrackingEventUpdateSchema.parse(body);

  const supabase = createClient();

  // Verificar que el evento existe
  const { data: existingEvent, error: fetchError } = await supabase
    .from('tracking_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError || !existingEvent) {
    throw new NotFoundError('Evento de tracking no encontrado');
  }

  // Actualizar evento
  const { data: trackingEvent, error } = await supabase
    .from('tracking_events')
    .update({
      ...validatedData,
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    throw new ApiError('Error al actualizar evento de tracking', 500, 'DATABASE_ERROR', error);
  }

  // Si se cambió el estado, actualizar el envío
  if (validatedData.status && validatedData.status !== existingEvent.status) {
    await updateShipmentStatus(supabase, existingEvent.shipment_id, validatedData.status);
  }

  // Log de auditoría
  await logAdminAction(session.user.id, 'UPDATE', 'tracking_event', trackingEvent.id, existingEvent, trackingEvent);

  const response: TrackingResponse = {
    data: trackingEvent,
    success: true,
    message: 'Evento de tracking actualizado exitosamente'
  };

  return NextResponse.json(response);
}

async function deleteHandler(request: NextRequest) {
  // Validar autenticación
  const authError = await validateAdminAuth(request);
  if (authError) {return authError;}

  const session = await auth();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('id');

  if (!eventId) {
    throw new ValidationError('ID del evento de tracking es requerido');
  }

  const supabase = createClient();

  // Verificar que el evento existe
  const { data: existingEvent, error: fetchError } = await supabase
    .from('tracking_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError || !existingEvent) {
    throw new NotFoundError('Evento de tracking no encontrado');
  }

  // Verificar que no es el último evento del envío
  const { data: eventCount, error: countError } = await supabase
    .from('tracking_events')
    .select('id', { count: 'exact' })
    .eq('shipment_id', existingEvent.shipment_id);

  if (countError) {
    throw new ApiError('Error al verificar eventos del envío', 500, 'DATABASE_ERROR', countError);
  }

  if (eventCount && eventCount.length <= 1) {
    throw new ValidationError('No se puede eliminar el único evento de tracking del envío');
  }

  // Eliminar evento
  const { error } = await supabase
    .from('tracking_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    throw new ApiError('Error al eliminar evento de tracking', 500, 'DATABASE_ERROR', error);
  }

  // Obtener el último evento restante para actualizar el estado del envío
  const { data: lastEvent } = await supabase
    .from('tracking_events')
    .select('status')
    .eq('shipment_id', existingEvent.shipment_id)
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  if (lastEvent) {
    await updateShipmentStatus(supabase, existingEvent.shipment_id, lastEvent.status);
  }

  // Log de auditoría
  await logAdminAction(session.user.id, 'DELETE', 'tracking_event', eventId, existingEvent, null);

  return NextResponse.json({
    success: true,
    message: 'Evento de tracking eliminado exitosamente'
  });
}

// =====================================================
// EXPORTS CON MIDDLEWARES
// =====================================================

export const GET = composeMiddlewares(
  withErrorHandler,
  withApiLogging
)(getHandler);

export const POST = composeMiddlewares(
  withErrorHandler,
  withApiLogging
)(postHandler);

export const PUT = composeMiddlewares(
  withErrorHandler,
  withApiLogging
)(putHandler);

export const DELETE = composeMiddlewares(
  withErrorHandler,
  withApiLogging
)(deleteHandler);










