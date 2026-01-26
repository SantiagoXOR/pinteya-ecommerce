// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: GESTIÓN INDIVIDUAL DE COURIERS ENTERPRISE
// Endpoints: GET/PUT/DELETE /api/admin/logistics/couriers/[id]
// Descripción: Operaciones CRUD individuales para couriers
// Basado en: Patrones Spree Commerce + WooCommerce
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { z } from 'zod'
// ⚡ MULTITENANT: Importar guard de tenant admin
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'
import { ShippingService } from '@/types/logistics'
import crypto from 'crypto'

// =====================================================
// SCHEMAS DE VALIDACIÓN ZOD
// =====================================================

const UpdateCourierSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  api_endpoint: z.string().url().optional().or(z.literal('')),
  api_key: z.string().optional(),
  supported_services: z.array(z.nativeEnum(ShippingService)).optional(),
  coverage_areas: z.array(z.string()).optional(),
  base_cost: z.number().min(0).optional(),
  cost_per_kg: z.number().min(0).optional(),
  free_shipping_threshold: z.number().positive().optional().or(z.null()),
  max_weight_kg: z.number().positive().optional().or(z.null()),
  max_dimensions_cm: z
    .string()
    .regex(/^\d+x\d+x\d+$/, 'Formato debe ser LxWxH')
    .optional()
    .or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  is_active: z.boolean().optional(),
})

// =====================================================
// FUNCIONES DE ENCRIPTACIÓN
// =====================================================

function getEncryptionKey(): string {
  // En producción, usar una variable de entorno segura
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 32)
}

function encryptApiKey(apiKey: string): string {
  try {
    const algorithm = 'aes-256-cbc'
    const key = Buffer.from(getEncryptionKey(), 'hex')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)

    let encrypted = cipher.update(apiKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Retornar IV + datos encriptados (IV se necesita para desencriptar)
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Error encrypting API key:', error)
    // Fallback a base64 si falla la encriptación
    return Buffer.from(apiKey).toString('base64')
  }
}

function decryptApiKey(encryptedKey: string): string {
  try {
    // Si no tiene el formato IV:encrypted, es base64 legacy
    if (!encryptedKey.includes(':')) {
      return Buffer.from(encryptedKey, 'base64').toString()
    }

    const [ivHex, encrypted] = encryptedKey.split(':')
    const algorithm = 'aes-256-cbc'
    const key = Buffer.from(getEncryptionKey(), 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(algorithm, key, iv)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Error decrypting API key:', error)
    // Fallback a base64 si falla la desencriptación
    try {
      return Buffer.from(encryptedKey, 'base64').toString()
    } catch {
      return ''
    }
  }
}

// =====================================================
// GET: OBTENER COURIER POR ID
// ⚡ MULTITENANT: Couriers son compartidos
// =====================================================

export const GET = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params
    const courierId = parseInt(id)

    if (isNaN(courierId)) {
      return NextResponse.json({ error: 'Invalid courier ID' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: courier, error } = await supabase
      .from('couriers')
      .select('*')
      .eq('id', courierId)
      .single()

    if (error || !courier) {
      return NextResponse.json({ error: 'Courier not found' }, { status: 404 })
    }

    // No retornar la API key encriptada por seguridad
    const { api_key_encrypted, ...safeCourier } = courier

    return NextResponse.json({
      data: safeCourier,
    })
  } catch (error) {
    console.error('Error in GET courier API:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
})

// =====================================================
// PUT: ACTUALIZAR COURIER
// ⚡ MULTITENANT: Couriers son compartidos
// =====================================================

export const PUT = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params
    const courierId = parseInt(id)

    if (isNaN(courierId)) {
      return NextResponse.json({ error: 'Invalid courier ID' }, { status: 400 })
    }

    // Parsear y validar body
    const body = await request.json()
    const validatedData = UpdateCourierSchema.parse(body)

    // Crear cliente Supabase
    const supabase = await createClient()

    // Verificar que el courier existe
    const { data: existingCourier, error: fetchError } = await supabase
      .from('couriers')
      .select('id, api_key_encrypted')
      .eq('id', courierId)
      .single()

    if (fetchError || !existingCourier) {
      return NextResponse.json({ error: 'Courier not found' }, { status: 404 })
    }

    // Preparar datos de actualización
    const updateData: any = {}

    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.api_endpoint !== undefined)
      updateData.api_endpoint = validatedData.api_endpoint || null
    if (validatedData.supported_services !== undefined)
      updateData.supported_services = validatedData.supported_services
    if (validatedData.coverage_areas !== undefined)
      updateData.coverage_areas = validatedData.coverage_areas
    if (validatedData.base_cost !== undefined) updateData.base_cost = validatedData.base_cost
    if (validatedData.cost_per_kg !== undefined) updateData.cost_per_kg = validatedData.cost_per_kg
    if (validatedData.free_shipping_threshold !== undefined)
      updateData.free_shipping_threshold = validatedData.free_shipping_threshold
    if (validatedData.max_weight_kg !== undefined)
      updateData.max_weight_kg = validatedData.max_weight_kg
    if (validatedData.max_dimensions_cm !== undefined)
      updateData.max_dimensions_cm = validatedData.max_dimensions_cm || null
    if (validatedData.logo_url !== undefined) updateData.logo_url = validatedData.logo_url || null
    if (validatedData.website_url !== undefined)
      updateData.website_url = validatedData.website_url || null
    if (validatedData.contact_phone !== undefined)
      updateData.contact_phone = validatedData.contact_phone || null
    if (validatedData.contact_email !== undefined)
      updateData.contact_email = validatedData.contact_email || null
    if (validatedData.is_active !== undefined) updateData.is_active = validatedData.is_active

    // Encriptar API key si se proporciona
    if (validatedData.api_key && validatedData.api_key.trim() !== '') {
      updateData.api_key_encrypted = encryptApiKey(validatedData.api_key)
    }

    // Actualizar courier
    const { data: courier, error: updateError } = await supabase
      .from('couriers')
      .update(updateData)
      .eq('id', courierId)
      .select('*')
      .single()

    if (updateError) {
      throw updateError
    }

    // No retornar la API key encriptada
    const { api_key_encrypted, ...safeCourier } = courier

    return NextResponse.json({
      data: safeCourier,
      message: 'Courier updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT courier API:', error)

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

// =====================================================
// DELETE: ELIMINAR COURIER
// ⚡ MULTITENANT: Couriers son compartidos
// =====================================================

export const DELETE = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params
    const courierId = parseInt(id)

    if (isNaN(courierId)) {
      return NextResponse.json({ error: 'Invalid courier ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el courier existe
    const { data: existingCourier, error: fetchError } = await supabase
      .from('couriers')
      .select('id')
      .eq('id', courierId)
      .single()

    if (fetchError || !existingCourier) {
      return NextResponse.json({ error: 'Courier not found' }, { status: 404 })
    }

    // Verificar si hay envíos asociados (opcional, dependiendo de la lógica de negocio)
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select('id')
      .eq('carrier_id', courierId)
      .limit(1)

    if (shipments && shipments.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete courier with associated shipments',
          details: 'There are shipments using this courier',
        },
        { status: 409 }
      )
    }

    // Eliminar courier
    const { error: deleteError } = await supabase.from('couriers').delete().eq('id', courierId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      message: 'Courier deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE courier API:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
})
