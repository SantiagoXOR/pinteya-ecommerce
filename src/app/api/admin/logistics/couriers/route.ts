// =====================================================
// API: GESTIÓN DE COURIERS ENTERPRISE
// Endpoints: GET/POST/PUT /api/admin/logistics/couriers
// Descripción: CRUD completo de proveedores de envío
// Basado en: Patrones Spree Commerce + WooCommerce
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { 
  Courier,
  ShippingService,
  ShippingQuoteRequest,
  ShippingQuote,
  ShippingQuoteResponse 
} from '@/types/logistics';

// =====================================================
// SCHEMAS DE VALIDACIÓN ZOD
// =====================================================

const CreateCourierSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  code: z.string().min(2, 'Código debe tener al menos 2 caracteres').regex(/^[a-z_]+$/, 'Código debe ser lowercase con underscores'),
  api_endpoint: z.string().url().optional(),
  api_key: z.string().optional(),
  supported_services: z.array(z.nativeEnum(ShippingService)).min(1, 'Debe soportar al menos un servicio'),
  coverage_areas: z.array(z.string()).min(1, 'Debe cubrir al menos un área'),
  base_cost: z.number().min(0, 'Costo base debe ser positivo'),
  cost_per_kg: z.number().min(0, 'Costo por kg debe ser positivo'),
  free_shipping_threshold: z.number().positive().optional(),
  max_weight_kg: z.number().positive().optional(),
  max_dimensions_cm: z.string().regex(/^\d+x\d+x\d+$/, 'Formato debe ser LxWxH').optional(),
  logo_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  is_active: z.boolean().default(true)
});

const UpdateCourierSchema = CreateCourierSchema.partial();

const ShippingQuoteSchema = z.object({
  origin_address: z.object({
    city: z.string(),
    state: z.string(),
    postal_code: z.string()
  }),
  destination_address: z.object({
    city: z.string(),
    state: z.string(),
    postal_code: z.string()
  }),
  weight_kg: z.number().positive('Peso debe ser positivo'),
  dimensions_cm: z.string().regex(/^\d+x\d+x\d+$/, 'Formato debe ser LxWxH'),
  declared_value: z.number().positive().optional(),
  service_type: z.nativeEnum(ShippingService).optional(),
  courier_codes: z.array(z.string()).optional()
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

  // TODO: Verificar rol de admin cuando esté implementado
  // if (session.user.role !== 'admin' && session.user.role !== 'manager') {
  //   return NextResponse.json(
  //     { error: 'Insufficient permissions' },
  //     { status: 403 }
  //   );
  // }

  return null;
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function calculateShippingCost(
  courier: Courier, 
  weightKg: number, 
  declaredValue?: number
): number {
  let cost = courier.base_cost + (courier.cost_per_kg * weightKg);
  
  // Aplicar envío gratis si aplica
  if (courier.free_shipping_threshold && declaredValue && declaredValue >= courier.free_shipping_threshold) {
    cost = 0;
  }
  
  return Math.round(cost * 100) / 100; // Redondear a 2 decimales
}

function calculateEstimatedDeliveryDays(
  service: ShippingService,
  originState: string,
  destinationState: string
): number {
  const baseDays = {
    [ShippingService.SAME_DAY]: 1,
    [ShippingService.NEXT_DAY]: 1,
    [ShippingService.EXPRESS]: 2,
    [ShippingService.STANDARD]: 5
  };
  
  // Agregar días extra si es envío interprovincial
  const extraDays = originState !== destinationState ? 2 : 0;
  
  return baseDays[service] + extraDays;
}

// =====================================================
// GET: OBTENER COURIERS
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const authError = await validateAdminAuth(request);
    if (authError) return authError;
    
    // Parsear query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';
    const includeStats = searchParams.get('include_stats') === 'true';
    
    // Crear cliente Supabase
    const supabase = createClient();
    
    // Construir query
    let query = supabase
      .from('couriers')
      .select('*')
      .order('name');
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data: couriers, error } = await query;
    
    if (error) throw error;
    
    // Si se solicitan estadísticas, obtenerlas
    let couriersWithStats = couriers;
    
    if (includeStats && couriers) {
      const courierStats = await Promise.all(
        couriers.map(async (courier) => {
          const { data: shipments } = await supabase
            .from('shipments')
            .select('status, shipping_cost, created_at, delivered_at')
            .eq('carrier_id', courier.id);
          
          const totalShipments = shipments?.length || 0;
          const deliveredShipments = shipments?.filter(s => s.status === 'delivered').length || 0;
          const totalRevenue = shipments?.reduce((acc, s) => acc + (s.shipping_cost || 0), 0) || 0;
          
          return {
            ...courier,
            stats: {
              total_shipments: totalShipments,
              delivered_shipments: deliveredShipments,
              delivery_rate: totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0,
              total_revenue: totalRevenue
            }
          };
        })
      );
      
      couriersWithStats = courierStats;
    }
    
    return NextResponse.json({
      data: couriersWithStats || []
    });
    
  } catch (error) {
    console.error('Error in GET couriers API:', error);
    
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
// POST: CREAR COURIER
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const authError = await validateAdminAuth(request);
    if (authError) return authError;
    
    // Parsear y validar body
    const body = await request.json();
    const validatedData = CreateCourierSchema.parse(body);
    
    // Crear cliente Supabase
    const supabase = createClient();
    
    // Verificar que el código no exista
    const { data: existingCourier } = await supabase
      .from('couriers')
      .select('id')
      .eq('code', validatedData.code)
      .single();
    
    if (existingCourier) {
      return NextResponse.json(
        { error: 'Courier code already exists' },
        { status: 409 }
      );
    }
    
    // Encriptar API key si se proporciona
    let apiKeyEncrypted = null;
    if (validatedData.api_key) {
      // TODO: Implementar encriptación real
      apiKeyEncrypted = Buffer.from(validatedData.api_key).toString('base64');
    }
    
    // Crear courier
    const { data: courier, error: courierError } = await supabase
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
      .select('*')
      .single();
    
    if (courierError) throw courierError;
    
    return NextResponse.json(
      { 
        data: courier,
        message: 'Courier created successfully'
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error in POST couriers API:', error);
    
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
// POST: COTIZAR ENVÍOS
// =====================================================

export async function POST_QUOTE(request: NextRequest) {
  try {
    // Validar autenticación
    const authError = await validateAdminAuth(request);
    if (authError) return authError;
    
    // Parsear y validar body
    const body = await request.json();
    const validatedData = ShippingQuoteSchema.parse(body);
    
    // Crear cliente Supabase
    const supabase = createClient();
    
    // Obtener couriers activos
    let query = supabase
      .from('couriers')
      .select('*')
      .eq('is_active', true);
    
    if (validatedData.courier_codes && validatedData.courier_codes.length > 0) {
      query = query.in('code', validatedData.courier_codes);
    }
    
    const { data: couriers, error } = await query;
    
    if (error) throw error;
    
    // Generar cotizaciones
    const quotes: ShippingQuote[] = [];
    
    for (const courier of couriers || []) {
      // Verificar restricciones de peso
      if (courier.max_weight_kg && validatedData.weight_kg > courier.max_weight_kg) {
        continue;
      }
      
      // Verificar cobertura
      const destinationState = validatedData.destination_address.state;
      if (!courier.coverage_areas.includes(destinationState)) {
        continue;
      }
      
      // Generar cotizaciones para cada servicio soportado
      const servicesToQuote = validatedData.service_type 
        ? [validatedData.service_type]
        : courier.supported_services;
      
      for (const service of servicesToQuote) {
        const cost = calculateShippingCost(
          courier, 
          validatedData.weight_kg, 
          validatedData.declared_value
        );
        
        const estimatedDays = calculateEstimatedDeliveryDays(
          service,
          validatedData.origin_address.state,
          validatedData.destination_address.state
        );
        
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
        
        quotes.push({
          courier_id: courier.id,
          courier_name: courier.name,
          service_type: service,
          cost,
          estimated_delivery_days: estimatedDays,
          estimated_delivery_date: estimatedDate.toISOString().split('T')[0],
          includes_insurance: validatedData.declared_value ? validatedData.declared_value <= 10000 : false,
          max_declared_value: 50000,
          restrictions: courier.max_weight_kg ? [`Peso máximo: ${courier.max_weight_kg}kg`] : []
        });
      }
    }
    
    // Encontrar mejores opciones
    const cheapestQuote = quotes.reduce((prev, current) => 
      prev.cost < current.cost ? prev : current
    );
    
    const fastestQuote = quotes.reduce((prev, current) => 
      prev.estimated_delivery_days < current.estimated_delivery_days ? prev : current
    );
    
    // Recomendar el mejor balance precio/velocidad
    const recommendedQuote = quotes.reduce((prev, current) => {
      const prevScore = (1 / prev.cost) + (1 / prev.estimated_delivery_days);
      const currentScore = (1 / current.cost) + (1 / current.estimated_delivery_days);
      return currentScore > prevScore ? current : prev;
    });
    
    const response: ShippingQuoteResponse = {
      quotes: quotes.sort((a, b) => a.cost - b.cost),
      cheapest_quote: cheapestQuote,
      fastest_quote: fastestQuote,
      recommended_quote: recommendedQuote
    };
    
    return NextResponse.json({ data: response });
    
  } catch (error) {
    console.error('Error in POST quote API:', error);
    
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
