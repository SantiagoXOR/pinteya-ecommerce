// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: GESTIÓN DE ENVÍOS ENTERPRISE
// Endpoints: GET/POST /api/admin/logistics/shipments
// Descripción: CRUD completo de envíos con validación
// Basado en: Patrones Spree Commerce + WooCommerce
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createClient } from '@/lib/integrations/supabase/server'
import { Database } from '@/types/database'
import { z } from 'zod'
import {
  CreateShipmentRequest,
  GetShipmentsRequest,
  Shipment,
  PaginatedResponse,
  ShipmentStatus,
  ShippingService,
} from '@/types/logistics'

// =====================================================
// SCHEMAS DE VALIDACIÓN ZOD
// =====================================================

const AddressSchema = z.object({
  street: z.string().min(1, 'Calle es requerida'),
  number: z.string().min(1, 'Número es requerido'),
  apartment: z.string().optional(),
  neighborhood: z.string().min(1, 'Barrio es requerido'),
  city: z.string().min(1, 'Ciudad es requerida'),
  state: z.string().min(1, 'Provincia es requerida'),
  postal_code: z.string().min(4, 'Código postal debe tener al menos 4 caracteres'),
  country: z.string().default('Argentina'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  reference: z.string().optional(),
})

const CreateShipmentSchema = z.object({
  order_id: z.number().positive('ID de orden debe ser positivo'),
  carrier_id: z.number().positive().optional(),
  shipping_service: z.nativeEnum(ShippingService),
  items: z
    .array(
      z.object({
        order_item_id: z.number().positive().optional(),
        product_id: z.number().positive('ID de producto es requerido'),
        quantity: z.number().positive('Cantidad debe ser positiva'),
        weight_kg: z.number().positive().optional(),
      })
    )
    .min(1, 'Debe incluir al menos un item'),
  pickup_address: AddressSchema.optional(),
  delivery_address: AddressSchema,
  weight_kg: z.number().positive().optional(),
  dimensions_cm: z
    .string()
    .regex(/^\d+x\d+x\d+$/, 'Formato debe ser LxWxH (ej: 30x20x15)')
    .optional(),
  special_instructions: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  estimated_delivery_date: z.string().datetime().optional(),
})

const GetShipmentsSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  status: z.nativeEnum(ShipmentStatus).optional(),
  carrier: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().optional(),
  order_by: z.enum(['created_at', 'updated_at', 'estimated_delivery_date']).default('created_at'),
  order_direction: z.enum(['asc', 'desc']).default('desc'),
})

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================
async function validateAdminAuth(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar si es admin usando el rol de la sesión (cargado desde la BD en auth.ts)
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  return null
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function generateShipmentNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `SH${dateStr}${randomStr}`
}

async function validateOrderExists(
  supabase: ReturnType<typeof createClient<Database>>,
  orderId: number
): Promise<boolean> {
  const { data, error } = await supabase.from('orders').select('id').eq('id', orderId).single()

  return !error && data
}

async function createShipmentItems(
  supabase: ReturnType<typeof createClient<Database>>,
  shipmentId: number,
  items: CreateShipmentRequest['items']
): Promise<void> {
  const shipmentItems = items.map(item => ({
    shipment_id: shipmentId,
    order_item_id: item.order_item_id,
    product_id: item.product_id,
    quantity: item.quantity,
    weight_kg: item.weight_kg,
  }))

  const { error } = await supabase.from('shipment_items').insert(shipmentItems)

  if (error) {
    throw error
  }
}

// =====================================================
// GET: OBTENER ENVÍOS CON FILTROS Y PAGINACIÓN
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const authError = await validateAdminAuth(request)
    if (authError) {
      return authError
    }

    // Parsear y validar query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validatedParams = GetShipmentsSchema.parse(queryParams)

    // Crear cliente Supabase
    const supabase = await createClient()

    // Construir query base
    let query = supabase.from('shipments').select(
      `
        *,
        carrier:couriers(id, name, code),
        items:shipment_items(
          id, quantity, weight_kg,
          product:products(id, name, slug, images)
        )
      `,
      { count: 'exact' }
    )

    // Aplicar filtros
    if (validatedParams.status) {
      query = query.eq('status', validatedParams.status)
    }

    if (validatedParams.carrier) {
      query = query.eq('couriers.code', validatedParams.carrier)
    }

    if (validatedParams.date_from) {
      query = query.gte('created_at', validatedParams.date_from)
    }

    if (validatedParams.date_to) {
      query = query.lte('created_at', validatedParams.date_to)
    }

    if (validatedParams.search) {
      query = query.or(`
        shipment_number.ilike.%${validatedParams.search}%,
        tracking_number.ilike.%${validatedParams.search}%,
        order_id.eq.${isNaN(Number(validatedParams.search)) ? 0 : validatedParams.search}
      `)
    }

    // Aplicar ordenamiento
    query = query.order(validatedParams.order_by, {
      ascending: validatedParams.order_direction === 'asc',
    })

    // Aplicar paginación
    const offset = (validatedParams.page - 1) * validatedParams.limit
    query = query.range(offset, offset + validatedParams.limit - 1)

    // Ejecutar query
    const { data: shipments, error, count } = await query

    if (error) {
      throw error
    }

    // Construir respuesta paginada
    const totalPages = Math.ceil((count || 0) / validatedParams.limit)

    const response: PaginatedResponse<Shipment> = {
      data: shipments || [],
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: count || 0,
        total_pages: totalPages,
        has_next: validatedParams.page < totalPages,
        has_prev: validatedParams.page > 1,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET shipments API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.reduce(
            (acc, err) => {
              acc[err.path.join('.')] = [err.message]
              return acc
            },
            {} as Record<string, string[]>
          ),
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// =====================================================
// POST: CREAR NUEVO ENVÍO
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const authError = await validateAdminAuth(request)
    if (authError) {
      return authError
    }

    // Parsear y validar body
    const body = await request.json()
    const validatedData = CreateShipmentSchema.parse(body)

    // Crear cliente Supabase
    const supabase = await createClient()

    // Validar que la orden existe
    const orderExists = await validateOrderExists(supabase, validatedData.order_id)
    if (!orderExists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generar número de envío único
    const shipmentNumber = generateShipmentNumber()

    // Crear el envío
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        shipment_number: shipmentNumber,
        order_id: validatedData.order_id,
        status: 'pending',
        carrier_id: validatedData.carrier_id,
        shipping_service: validatedData.shipping_service,
        pickup_address: validatedData.pickup_address,
        delivery_address: validatedData.delivery_address,
        weight_kg: validatedData.weight_kg,
        dimensions_cm: validatedData.dimensions_cm,
        special_instructions: validatedData.special_instructions,
        notes: validatedData.notes,
        estimated_delivery_date: validatedData.estimated_delivery_date,
      })
      .select(
        `
        *,
        carrier:couriers(id, name, code)
      `
      )
      .single()

    if (shipmentError) {
      throw shipmentError
    }

    // Crear los items del envío
    await createShipmentItems(supabase, shipment.id, validatedData.items)

    // Obtener el envío completo con items
    const { data: completeShipment, error: fetchError } = await supabase
      .from('shipments')
      .select(
        `
        *,
        carrier:couriers(id, name, code),
        items:shipment_items(
          id, quantity, weight_kg,
          product:products(id, name, slug, images)
        )
      `
      )
      .eq('id', shipment.id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    // Crear evento de tracking inicial
    await supabase.from('tracking_events').insert({
      shipment_id: shipment.id,
      status: 'pending',
      description: 'Envío creado y pendiente de confirmación',
      occurred_at: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        data: completeShipment,
        message: 'Shipment created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST shipments API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.reduce(
            (acc, err) => {
              acc[err.path.join('.')] = [err.message]
              return acc
            },
            {} as Record<string, string[]>
          ),
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
