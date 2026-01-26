// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: GOOGLE MAPS DISTANCE MATRIX
// Endpoint: POST /api/admin/logistics/distance-matrix
// Descripción: Calcula distancias y tiempos usando Google Maps Distance Matrix API
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
// ⚡ MULTITENANT: Importar guard de tenant admin
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'
import {
  getDistanceMatrixService,
  calculateDistance,
  calculateDistancesToMultiple,
  calculateRouteTotalDistance,
} from '@/lib/integrations/google-maps/distance-matrix'
import { Address } from '@/types/logistics'

// =====================================================
// SCHEMAS DE VALIDACIÓN ZOD
// =====================================================

const CoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

const AddressSchema = z.object({
  street: z.string(),
  number: z.string(),
  apartment: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string().default('Argentina'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  reference: z.string().optional(),
})

const DistanceRequestSchema = z.object({
  origin: z.union([CoordinateSchema, z.string(), AddressSchema]),
  destination: z.union([CoordinateSchema, z.string(), AddressSchema]),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).optional(),
  departureTime: z.union([z.literal('now'), z.number()]).optional(),
  trafficModel: z.enum(['best_guess', 'pessimistic', 'optimistic']).optional(),
})

const MultipleDestinationsRequestSchema = z.object({
  origin: z.union([CoordinateSchema, z.string(), AddressSchema]),
  destinations: z.array(z.union([CoordinateSchema, z.string(), AddressSchema])).min(1).max(25),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).optional(),
  departureTime: z.union([z.literal('now'), z.number()]).optional(),
  trafficModel: z.enum(['best_guess', 'pessimistic', 'optimistic']).optional(),
})

const RouteDistanceRequestSchema = z.object({
  waypoints: z.array(z.union([CoordinateSchema, z.string(), AddressSchema])).min(2).max(25),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).optional(),
  departureTime: z.union([z.literal('now'), z.number()]).optional(),
  trafficModel: z.enum(['best_guess', 'pessimistic', 'optimistic']).optional(),
})

// =====================================================
// POST: CALCULAR DISTANCIA
// ⚡ MULTITENANT: Protegido con withTenantAdmin
// =====================================================

export const POST = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest
) => {
  try {
    const body = await request.json()
    const { type, ...data } = body

    // Validar según el tipo de request
    if (type === 'single') {
      const validatedData = DistanceRequestSchema.parse(data)

      const result = await calculateDistance(
        validatedData.origin as any,
        validatedData.destination as any,
        {
          mode: validatedData.mode,
          departureTime: validatedData.departureTime,
          trafficModel: validatedData.trafficModel,
        }
      )

      if (!result) {
        return NextResponse.json(
          { error: 'No se pudo calcular la distancia' },
          { status: 400 }
        )
      }

      return NextResponse.json({ data: result })
    } else if (type === 'multiple') {
      const validatedData = MultipleDestinationsRequestSchema.parse(data)

      const results = await calculateDistancesToMultiple(
        validatedData.origin as any,
        validatedData.destinations as any,
        {
          mode: validatedData.mode,
          departureTime: validatedData.departureTime,
          trafficModel: validatedData.trafficModel,
        }
      )

      return NextResponse.json({ data: results })
    } else if (type === 'route') {
      const validatedData = RouteDistanceRequestSchema.parse(data)

      const result = await calculateRouteTotalDistance(
        validatedData.waypoints as any,
        {
          mode: validatedData.mode,
          departureTime: validatedData.departureTime,
          trafficModel: validatedData.trafficModel,
        }
      )

      if (!result) {
        return NextResponse.json(
          { error: 'No se pudo calcular la distancia de la ruta' },
          { status: 400 }
        )
      }

      return NextResponse.json({ data: result })
    } else {
      return NextResponse.json(
        { error: 'Tipo de request inválido. Use: single, multiple, o route' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in distance matrix API:', error)

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
})
