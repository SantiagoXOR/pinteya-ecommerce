// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// =====================================================
// API: GESTIÓN DE TRANSPORTISTAS/CARRIERS ENTERPRISE
// Endpoint: /api/admin/logistics/carriers
// Descripción: CRUD completo para gestión de transportistas
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
import { auth } from '@/lib/auth/config';
import { checkRateLimit } from '@/lib/auth/rate-limiting';
import { 
  Courier, 
  ShippingService,
  CarrierFiltersRequest,
  CarrierCreateRequest,
  CarrierUpdateRequest,
  CarrierResponse,
  CarrierListResponse
} from '@/types/logistics';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const CarrierFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  is_active: z.boolean().optional(),
  service: z.nativeEnum(ShippingService).optional(),
  coverage_area: z.string().optional(),
  sort_by: z.enum(['name', 'created_at', 'base_cost', 'cost_per_kg']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

const CarrierCreateSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(255),
  code: z.string().min(2, 'Código debe tener al menos 2 caracteres').max(10).regex(/^[A-Z0-9_]+$/, 'Código debe ser alfanumérico en mayúsculas'),
  api_endpoint: z.string().url().optional(),
  api_key: z.string().optional(),
  supported_services: z.array(z.nativeEnum(ShippingService)).min(1, 'Debe soportar al menos un servicio'),
  coverage_areas: z.array(z.string()).min(1, 'Debe cubrir al menos un área'),
  base_cost: z.number().min(0, 'Costo base no puede ser negativo'),
  cost_per_kg: z.number().min(0, 'Costo por kg no puede ser negativo'),
  free_shipping_threshold: z.number().min(0).optional(),
  max_weight_kg: z.number().min(0).optional(),
  max_dimensions_cm: z.string().regex(/^\d+x\d+x\d+$/, 'Formato debe ser LxWxH (ej: 100x80x60)').optional(),
  logo_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  is_active: z.boolean().default(true)
});

const CarrierUpdateSchema = CarrierCreateSchema.partial().omit({ code: true });

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
    maxRequests: 100,
    keyGenerator: (req) => `admin_carriers_${session.user.id}_${req.method}`
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

async function encryptApiKey(apiKey: string): Promise<string> {
  // Implementación básica de encriptación
  // En producción usar crypto más robusto
  return Buffer.from(apiKey).toString('base64');
}

async function decryptApiKey(encryptedKey: string): Promise<string> {
  // Implementación básica de desencriptación
  return Buffer.from(encryptedKey, 'base64').toString();
}

// =====================================================
// HANDLERS
// =====================================================

async function getHandler(request: NextRequest) {
  // Validar autenticación
  const authError = await validateAdminAuth(request);
  if (authError) {return authError;}

  const { searchParams } = new URL(request.url);
  const filters = CarrierFiltersSchema.parse({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    search: searchParams.get('search') || undefined,
    is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
    service: searchParams.get('service') || undefined,
    coverage_area: searchParams.get('coverage_area') || undefined,
    sort_by: searchParams.get('sort_by') || 'name',
    sort_order: searchParams.get('sort_order') || 'asc'
  });

  const supabase = createClient();

  // Construir query con filtros
  let query = supabase
    .from('couriers')
    .select('*', { count: 'exact' });

  // Aplicar filtros
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
  }

  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters.service) {
    query = query.contains('supported_services', [filters.service]);
  }

  if (filters.coverage_area) {
    query = query.contains('coverage_areas', [filters.coverage_area]);
  }

  // Aplicar ordenamiento y paginación
  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;

  const { data: carriers, error, count } = await query
    .order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
    .range(from, to);

  if (error) {
    throw new ApiError('Error al obtener transportistas', 500, 'DATABASE_ERROR', error);
  }

  // Desencriptar API keys para respuesta (solo mostrar si existen)
  const carriersWithDecryptedKeys = await Promise.all(
    (carriers || []).map(async (carrier) => ({
      ...carrier,
      api_key_encrypted: carrier.api_key_encrypted ? '***ENCRYPTED***' : null
    }))
  );

  const response: CarrierListResponse = {
    data: carriersWithDecryptedKeys,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / filters.limit)
    },
    filters: {
      search: filters.search,
      is_active: filters.is_active,
      service: filters.service,
      coverage_area: filters.coverage_area
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
  const validatedData = CarrierCreateSchema.parse(body);

  const supabase = createClient();

  // Verificar que el código no exista
  const { data: existingCarrier } = await supabase
    .from('couriers')
    .select('id')
    .eq('code', validatedData.code)
    .single();

  if (existingCarrier) {
    throw new ValidationError('El código del transportista ya existe');
  }

  // Encriptar API key si se proporciona
  let apiKeyEncrypted = null;
  if (validatedData.api_key) {
    apiKeyEncrypted = await encryptApiKey(validatedData.api_key);
  }

  // Crear transportista
  const { data: carrier, error } = await supabase
    .from('couriers')
    .insert({
      name: validatedData.name,
      code: validatedData.code,
      api_endpoint: validatedData.api_endpoint,
      api_key_encrypted: apiKeyEncrypted,
      supported_services: validatedData.supported_services,
      coverage_areas: validatedData.coverage_areas,
      base_cost: validatedData.base_cost,
      cost_per_kg: validatedData.cost_per_kg,
      free_shipping_threshold: validatedData.free_shipping_threshold,
      max_weight_kg: validatedData.max_weight_kg,
      max_dimensions_cm: validatedData.max_dimensions_cm,
      logo_url: validatedData.logo_url,
      website_url: validatedData.website_url,
      contact_phone: validatedData.contact_phone,
      contact_email: validatedData.contact_email,
      is_active: validatedData.is_active
    })
    .select()
    .single();

  if (error) {
    throw new ApiError('Error al crear transportista', 500, 'DATABASE_ERROR', error);
  }

  // Log de auditoría
  await logAdminAction(session.user.id, 'CREATE', 'carrier', carrier.id, null, carrier);

  const response: CarrierResponse = {
    data: {
      ...carrier,
      api_key_encrypted: carrier.api_key_encrypted ? '***ENCRYPTED***' : null
    },
    success: true,
    message: 'Transportista creado exitosamente'
  };

  return NextResponse.json(response, { status: 201 });
}

async function putHandler(request: NextRequest) {
  // Validar autenticación
  const authError = await validateAdminAuth(request);
  if (authError) {return authError;}

  const session = await auth();
  const { searchParams } = new URL(request.url);
  const carrierId = searchParams.get('id');

  if (!carrierId) {
    throw new ValidationError('ID del transportista es requerido');
  }

  const body = await request.json();
  const validatedData = CarrierUpdateSchema.parse(body);

  const supabase = createClient();

  // Verificar que el transportista existe
  const { data: existingCarrier, error: fetchError } = await supabase
    .from('couriers')
    .select('*')
    .eq('id', carrierId)
    .single();

  if (fetchError || !existingCarrier) {
    throw new NotFoundError('Transportista no encontrado');
  }

  // Encriptar nueva API key si se proporciona
  let apiKeyEncrypted = existingCarrier.api_key_encrypted;
  if (validatedData.api_key) {
    apiKeyEncrypted = await encryptApiKey(validatedData.api_key);
  }

  // Actualizar transportista
  const { data: carrier, error } = await supabase
    .from('couriers')
    .update({
      ...validatedData,
      api_key_encrypted: apiKeyEncrypted,
      updated_at: new Date().toISOString()
    })
    .eq('id', carrierId)
    .select()
    .single();

  if (error) {
    throw new ApiError('Error al actualizar transportista', 500, 'DATABASE_ERROR', error);
  }

  // Log de auditoría
  await logAdminAction(session.user.id, 'UPDATE', 'carrier', carrier.id, existingCarrier, carrier);

  const response: CarrierResponse = {
    data: {
      ...carrier,
      api_key_encrypted: carrier.api_key_encrypted ? '***ENCRYPTED***' : null
    },
    success: true,
    message: 'Transportista actualizado exitosamente'
  };

  return NextResponse.json(response);
}

async function deleteHandler(request: NextRequest) {
  // Validar autenticación
  const authError = await validateAdminAuth(request);
  if (authError) {return authError;}

  const session = await auth();
  const { searchParams } = new URL(request.url);
  const carrierId = searchParams.get('id');

  if (!carrierId) {
    throw new ValidationError('ID del transportista es requerido');
  }

  const supabase = createClient();

  // Verificar que el transportista existe
  const { data: existingCarrier, error: fetchError } = await supabase
    .from('couriers')
    .select('*')
    .eq('id', carrierId)
    .single();

  if (fetchError || !existingCarrier) {
    throw new NotFoundError('Transportista no encontrado');
  }

  // Verificar que no tenga envíos activos
  const { data: activeShipments, error: shipmentsError } = await supabase
    .from('shipments')
    .select('id')
    .eq('carrier_id', carrierId)
    .in('status', ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery']);

  if (shipmentsError) {
    throw new ApiError('Error al verificar envíos activos', 500, 'DATABASE_ERROR', shipmentsError);
  }

  if (activeShipments && activeShipments.length > 0) {
    throw new ValidationError('No se puede eliminar un transportista con envíos activos');
  }

  // Eliminar transportista (soft delete - marcar como inactivo)
  const { error } = await supabase
    .from('couriers')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', carrierId);

  if (error) {
    throw new ApiError('Error al eliminar transportista', 500, 'DATABASE_ERROR', error);
  }

  // Log de auditoría
  await logAdminAction(session.user.id, 'DELETE', 'carrier', carrierId, existingCarrier, null);

  return NextResponse.json({
    success: true,
    message: 'Transportista eliminado exitosamente'
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










