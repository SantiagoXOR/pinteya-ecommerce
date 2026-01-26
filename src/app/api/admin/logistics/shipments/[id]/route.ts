// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: GESTIÓN INDIVIDUAL DE ENVÍOS ENTERPRISE
// Endpoints: GET/PUT/DELETE /api/admin/logistics/shipments/[id]
// Descripción: Operaciones CRUD individuales para envíos
// Basado en: Patrones Spree Commerce + WooCommerce
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/integrations/supabase/server'
import { z } from 'zod'
// ⚡ MULTITENANT: Importar guard de tenant admin
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'
import { UpdateShipmentRequest, ShipmentStatus } from '@/types/logistics'

// =====================================================
// SCHEMAS DE VALIDACIÓN ZOD
// =====================================================

const UpdateShipmentSchema = z.object({
  status: z.nativeEnum(ShipmentStatus).optional(),
  carrier_id: z.number().positive().optional(),
  tracking_number: z.string().optional(),
  tracking_url: z.string().url().optional(),
  shipping_method: z.string().optional(),
  estimated_delivery_date: z.string().datetime().optional(),
  actual_delivery_date: z.string().datetime().optional(),
  shipping_cost: z.number().min(0).optional(),
  insurance_cost: z.number().min(0).optional(),
  weight_kg: z.number().positive().optional(),
  dimensions_cm: z.string().regex(/^\d+x\d+x\d+$/).optional(),
  special_instructions: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  admin_notes: z.string().max(1000).optional(),
})

// =====================================================
// GET: OBTENER ENVÍO POR ID
// ⚡ MULTITENANT: Filtra por tenant_id
// =====================================================

export const GET = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { tenantId } = guardResult
    const { id } = await context.params
    const shipmentId = parseInt(id)

    if (isNaN(shipmentId)) {
      return NextResponse.json({ error: 'Invalid shipment ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // ⚡ MULTITENANT: Filtrar por tenant_id
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(
        `
        *,
        carrier:couriers(id, name, code),
        items:shipment_items(
          id, quantity, weight_kg,
          product:products(id, name, slug, images)
        ),
        tracking_events:tracking_events(*)
      `
      )
      .eq('id', shipmentId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
      .single()

    if (error || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: shipment,
    })
  } catch (error) {
    console.error('Error in GET shipment API:', error)

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
// PUT: ACTUALIZAR ENVÍO
// ⚡ MULTITENANT: Valida pertenencia al tenant
// =====================================================

export const PUT = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { tenantId } = guardResult
    const { id } = await context.params
    const shipmentId = parseInt(id)

    if (isNaN(shipmentId)) {
      return NextResponse.json({ error: 'Invalid shipment ID' }, { status: 400 })
    }

    // Parsear y validar body
    const body = await request.json()
    const validatedData = UpdateShipmentSchema.parse(body)

    // Crear cliente Supabase
    const supabase = await createClient()

    // ⚡ MULTITENANT: Verificar que el envío existe y pertenece al tenant
    const { data: existingShipment, error: fetchError } = await supabase
      .from('shipments')
      .select('id, status')
      .eq('id', shipmentId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
      .single()

    if (fetchError || !existingShipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    // Preparar datos de actualización
    const updateData: any = {}

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      // Actualizar timestamps según el estado
      if (validatedData.status === ShipmentStatus.CONFIRMED) {
        updateData.confirmed_at = new Date().toISOString()
      } else if (validatedData.status === ShipmentStatus.PICKED_UP) {
        updateData.picked_up_at = new Date().toISOString()
      } else if (validatedData.status === ShipmentStatus.IN_TRANSIT) {
        updateData.shipped_at = new Date().toISOString()
      } else if (validatedData.status === ShipmentStatus.DELIVERED) {
        updateData.delivered_at = validatedData.actual_delivery_date || new Date().toISOString()
      } else if (validatedData.status === ShipmentStatus.CANCELLED) {
        updateData.cancelled_at = new Date().toISOString()
      }
    }

    if (validatedData.carrier_id !== undefined) updateData.carrier_id = validatedData.carrier_id
    if (validatedData.tracking_number !== undefined)
      updateData.tracking_number = validatedData.tracking_number
    if (validatedData.tracking_url !== undefined) updateData.tracking_url = validatedData.tracking_url
    if (validatedData.shipping_method !== undefined)
      updateData.shipping_method = validatedData.shipping_method
    if (validatedData.estimated_delivery_date !== undefined)
      updateData.estimated_delivery_date = validatedData.estimated_delivery_date
    if (validatedData.actual_delivery_date !== undefined)
      updateData.actual_delivery_date = validatedData.actual_delivery_date
    if (validatedData.shipping_cost !== undefined) updateData.shipping_cost = validatedData.shipping_cost
    if (validatedData.insurance_cost !== undefined)
      updateData.insurance_cost = validatedData.insurance_cost
    if (validatedData.weight_kg !== undefined) updateData.weight_kg = validatedData.weight_kg
    if (validatedData.dimensions_cm !== undefined)
      updateData.dimensions_cm = validatedData.dimensions_cm
    if (validatedData.special_instructions !== undefined)
      updateData.special_instructions = validatedData.special_instructions
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.admin_notes !== undefined) updateData.admin_notes = validatedData.admin_notes

    updateData.updated_at = new Date().toISOString()

    // Actualizar envío
    const { data: shipment, error: updateError } = await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', shipmentId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
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
      .single()

    if (updateError) {
      throw updateError
    }

    // Crear evento de tracking si cambió el estado
    if (validatedData.status && validatedData.status !== existingShipment.status) {
      await supabase.from('tracking_events').insert({
        shipment_id: shipmentId,
        status: validatedData.status,
        description: `Estado actualizado a: ${validatedData.status}`,
        occurred_at: new Date().toISOString(),
        tenant_id: tenantId, // ⚡ MULTITENANT
      })
    }

    return NextResponse.json({
      data: shipment,
      message: 'Shipment updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT shipment API:', error)

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
// DELETE: ELIMINAR ENVÍO
// ⚡ MULTITENANT: Valida pertenencia al tenant
// =====================================================

export const DELETE = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { tenantId } = guardResult
    const { id } = await context.params
    const shipmentId = parseInt(id)

    if (isNaN(shipmentId)) {
      return NextResponse.json({ error: 'Invalid shipment ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // ⚡ MULTITENANT: Verificar que el envío existe y pertenece al tenant
    const { data: existingShipment, error: fetchError } = await supabase
      .from('shipments')
      .select('id, status')
      .eq('id', shipmentId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
      .single()

    if (fetchError || !existingShipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    // Verificar si el envío puede ser eliminado (opcional: solo permitir eliminar en ciertos estados)
    if (
      existingShipment.status === ShipmentStatus.DELIVERED ||
      existingShipment.status === ShipmentStatus.IN_TRANSIT
    ) {
      return NextResponse.json(
        {
          error: 'Cannot delete shipment in this status',
          details: `Shipments with status "${existingShipment.status}" cannot be deleted`,
        },
        { status: 409 }
      )
    }

    // Eliminar eventos de tracking primero (cascada)
    await supabase
      .from('tracking_events')
      .delete()
      .eq('shipment_id', shipmentId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT

    // Eliminar items del envío
    await supabase
      .from('shipment_items')
      .delete()
      .eq('shipment_id', shipmentId)

    // Eliminar envío
    const { error: deleteError } = await supabase
      .from('shipments')
      .delete()
      .eq('id', shipmentId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      message: 'Shipment deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE shipment API:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
})
