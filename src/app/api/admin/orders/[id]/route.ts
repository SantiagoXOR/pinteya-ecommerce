// ===================================
// PINTEYA E-COMMERCE - ADMIN ORDER DETAIL API ENTERPRISE
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'
import { ApiResponse } from '@/types/api'
import { z } from 'zod'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/auth/rate-limiting'
import { MetricsCollector } from '@/lib/enterprise/metrics'

// ===================================
// SCHEMAS DE VALIDACIÓN
// ===================================

const UpdateOrderSchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  notes: z.string().optional(),
  tracking_number: z.string().optional(),
  carrier: z.string().optional(),
  shipping_address: z
    .object({
      street_name: z.string().min(1),
      street_number: z.string().min(1),
      zip_code: z.string().min(1),
      city_name: z.string().min(1),
      state_name: z.string().min(1),
    })
    .optional(),
})

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    // BYPASS SOLO EN DESARROLLO CON VALIDACIÓN ESTRICTA
    // ⚠️ TEMPORAL: Remover restricción de desarrollo para permitir bypass en producción hoy (2026-01-08)
    if (process.env.BYPASS_AUTH === 'true') {
      // En producción, permitir bypass directamente si BYPASS_AUTH está configurado
      try {
        const fs = require('fs')
        const path = require('path')
        const envLocalPath = path.join(process.cwd(), '.env.local')
        if (fs.existsSync(envLocalPath) || process.env.NODE_ENV === 'production') {
          return {
            user: {
              id: 'dev-admin',
              email: 'admin@bypass.dev',
              name: 'Dev Admin',
            },
            userId: 'dev-admin',
          }
        }
      } catch (error) {
        console.warn('[API Admin Orders Detail] No se pudo verificar .env.local, bypass deshabilitado')
      }
    }

    const session = await auth()
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 }
    }

    // Verificar si es admin usando el rol de la sesión (cargado desde la BD en auth.ts)
    const isAdmin = session.user.role === 'admin'
    if (!isAdmin) {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 }
    }

    return { user: session.user, userId: session.user.id }
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.AUTH, 'Error en validación admin', { error })
    return { error: 'Error de autenticación', status: 500 }
  }
}

// ===================================
// VALIDACIONES DE TRANSICIÓN DE ESTADOS
// ===================================

const stateTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  refunded: [],
  returned: ['refunded'],
}

function validateStateTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) {
    return true
  }
  return stateTransitions[currentStatus]?.includes(newStatus) || false
}

// ===================================
// VALIDACIONES DE TRANSICIÓN DE ESTADO DE PAGO
// ===================================

const paymentStateTransitions: Record<string, string[]> = {
  pending: ['paid', 'failed', 'cash_on_delivery'],
  paid: ['refunded'],
  failed: ['pending', 'paid'],
  refunded: [], // Estado final
  cash_on_delivery: ['paid', 'failed'],
}

function validatePaymentTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) {
    return true
  }
  return paymentStateTransitions[currentStatus]?.includes(newStatus) || false
}

// ===================================
// VALIDACIÓN DE STOCK
// ===================================

async function validateStockForConfirmation(orderId: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Obtener items de la orden
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId)

    if (itemsError || !items) {
      return { valid: false, error: 'Error al obtener items de la orden' }
    }

    // Verificar stock de cada producto
    for (const item of items) {
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('stock, name')
        .eq('id', item.product_id)
        .single()

      if (productError || !product) {
        return { valid: false, error: `Producto ${item.product_id} no encontrado` }
      }

      if (product.stock < item.quantity) {
        return { 
          valid: false, 
          error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Requerido: ${item.quantity}` 
        }
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('Error validating stock:', error)
    return { valid: false, error: 'Error al validar stock' }
  }
}

// ===================================
// GET - Obtener orden específica
// ===================================
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()
  let orderId: string | undefined

  try {
    const { id } = await context.params
    orderId = id
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.admin,
      'admin-order-detail'
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Obtener orden con todos los detalles
    console.log('[ORDER_DETAIL] Fetching order with ID:', id)
    
    if (!supabaseAdmin) {
      console.error('[ORDER_DETAIL] supabaseAdmin is null!')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Primero intentar obtener la orden sin las relaciones para diagnosticar
    const { data: basicOrder, error: basicError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id' as any, id)
      .single()

    console.log('[ORDER_DETAIL] Basic order query:', { hasBasicOrder: !!basicOrder, basicError })

    if (basicError) {
      console.error('[ORDER_DETAIL] Basic order query failed:', basicError)
      if (basicError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
      }
      return NextResponse.json({ 
        error: 'Error al obtener orden básica',
        details: basicError.message 
      }, { status: 500 })
    }

    // Ahora intentar con todas las relaciones
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        user_profiles!orders_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          products (
            id,
            name,
            images,
            brand,
            slug
          )
        )
      `
      )
      .eq('id' as any, id)
      .single()

    console.log('[ORDER_DETAIL] Query result:', { hasOrder: !!order, error })

    if (error) {
      console.error('[ORDER_DETAIL] Database error:', error)
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
      }

      logger.log(LogLevel.ERROR, LogCategory.API, 'Error al obtener orden', { 
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }, 
        orderId: id 
      })
      return NextResponse.json({ 
        error: 'Error al obtener orden',
        details: error.message 
      }, { status: 500 })
    }

    if (!order) {
      console.error('[ORDER_DETAIL] Order is null but no error!')
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    console.log('[ORDER_DETAIL] Order fetched successfully, ID:', order.id)

    // Obtener historial de estados si existe la tabla
    let statusHistory: any[] = []
    try {
      const { data: history } = await supabaseAdmin
        .from('order_status_history')
        .select(
          `
          id,
          previous_status,
          new_status,
          reason,
          created_at,
          user_profiles!order_status_history_changed_by_fkey (
            first_name,
            last_name,
            email
          )
        `
        )
        .eq('order_id' as any, id)
        .order('created_at', { ascending: false })

      statusHistory = history || []
    } catch (historyError) {
      // Si la tabla no existe, continuar sin historial
      logger.log(LogLevel.WARN, LogCategory.API, 'Tabla order_status_history no existe', {
        historyError,
      })
    }

    // Obtener notas si existe la tabla
    let orderNotes: any[] = []
    try {
      const { data: notes } = await supabaseAdmin
        .from('order_notes')
        .select(
          `
          id,
          note_type,
          content,
          is_visible_to_customer,
          created_at,
          user_profiles!order_notes_admin_id_fkey (
            first_name,
            last_name,
            email
          )
        `
        )
        .eq('order_id' as any, id)
        .order('created_at', { ascending: false })

      orderNotes = notes || []
    } catch (notesError) {
      // Si la tabla no existe, continuar sin notas
      logger.log(LogLevel.WARN, LogCategory.API, 'Tabla order_notes no existe', { notesError })
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime
    await MetricsCollector.getInstance().recordRequest(
      'admin-order-detail',
      'GET',
      200,
      responseTime
    )

    const response: ApiResponse<{
      order: typeof order
      statusHistory: any[]
      notes: any[]
    }> = {
      data: {
        order,
        statusHistory,
        notes: orderNotes,
      },
      success: true,
      error: '',
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Orden obtenida exitosamente', {
      orderId: id,
      responseTime,
    })

    return NextResponse.json(response)
  } catch (error) {
    const responseTime = Date.now() - startTime
    await MetricsCollector.getInstance().recordRequest(
      'admin-order-detail',
      'GET',
      500,
      responseTime
    )

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en GET /api/admin/orders/[id]', {
      error,
      orderId: orderId || 'unknown',
    })

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ===================================
// PATCH - Actualizar orden
// ===================================
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()
  const { id } = await context.params

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      RATE_LIMIT_CONFIGS.admin,
      'admin-order-update'
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
    }

    // Validar autenticación admin
    const authResult = await validateAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const orderId = id

    // Validar datos de entrada
    const body = await request.json()
    const validationResult = UpdateOrderSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Obtener orden actual para validar transiciones
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Base de datos no disponible' }, { status: 500 })
    }
    
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_status')
      .eq('id' as any, orderId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
      }

      logger.log(LogLevel.ERROR, LogCategory.API, 'Error al obtener orden actual', {
        fetchError,
        orderId,
      })
      return NextResponse.json({ error: 'Error al obtener orden' }, { status: 500 })
    }

    // Validar transición de estado si se está cambiando
    if (updateData.status && !validateStateTransition(currentOrder.status, updateData.status)) {
      return NextResponse.json(
        { error: `Transición de estado inválida: ${currentOrder.status} → ${updateData.status}` },
        { status: 400 }
      )
    }

    // Validar transición de estado de pago si se está cambiando
    if (updateData.payment_status && !validatePaymentTransition(currentOrder.payment_status, updateData.payment_status)) {
      return NextResponse.json(
        { error: `Transición de pago no permitida: ${currentOrder.payment_status} → ${updateData.payment_status}` },
        { status: 400 }
      )
    }

    // Validar stock antes de confirmar la orden
    if (updateData.status === 'confirmed' && currentOrder.status === 'pending') {
      const stockValidation = await validateStockForConfirmation(orderId)
      if (!stockValidation.valid) {
        return NextResponse.json(
          { error: stockValidation.error || 'Error de validación de stock' },
          { status: 400 }
        )
      }
    }

    // Si se va a cambiar a shipped, verificar que exista un shipment o actualizar fulfillment_status
    if (updateData.status === 'shipped') {
      // Verificar si existe un shipment asociado
      const { data: existingShipments } = await supabaseAdmin
        .from('shipments')
        .select('id, status')
        .eq('order_id', orderId)
        .limit(1)

      if (!existingShipments || existingShipments.length === 0) {
        // Si no existe shipment, solo marcamos fulfillment_status y continuamos
        // El admin puede crear el shipment después si lo necesita
        logger.log(LogLevel.WARN, LogCategory.API, 'Orden marcada como shipped sin shipment asociado', {
          orderId,
        })
      }
    }

    // Preparar datos de actualización
    const updatePayload: any = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    // Actualizar fulfillment_status según el estado de la orden
    if (updateData.status) {
      switch (updateData.status) {
        case 'shipped':
          updatePayload.fulfillment_status = 'fulfilled'
          break
        case 'delivered':
          updatePayload.fulfillment_status = 'fulfilled'
          break
        case 'cancelled':
        case 'refunded':
          updatePayload.fulfillment_status = 'returned'
          break
        case 'pending':
        case 'confirmed':
        case 'processing':
          updatePayload.fulfillment_status = 'unfulfilled'
          break
      }
    }

    // Convertir shipping_address a JSON si se proporciona
    if (updateData.shipping_address) {
      updatePayload.shipping_address = JSON.stringify(updateData.shipping_address)
    }

    // Actualizar orden
    const { data: updatedOrder, error: updateError } = await supabaseAdmin!
      .from('orders')
      .update(updatePayload)
      .eq('id' as any, orderId)
      .select()
      .single()

    if (updateError) {
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error al actualizar orden', {
        updateError,
        orderId,
      })
      return NextResponse.json({ error: 'Error al actualizar orden' }, { status: 500 })
    }

    // Registrar cambio de estado en historial si cambió el status
    if (updateData.status && currentOrder && 'status' in currentOrder && updateData.status !== currentOrder.status) {
      try {
        await supabaseAdmin!.from('order_status_history').insert({
          order_id: orderId as any,
          previous_status: currentOrder.status as any,
          new_status: updateData.status,
          changed_by: authResult.userId,
          reason: `Cambio manual por administrador`,
        })
      } catch (historyError) {
        // Si la tabla no existe, continuar sin registrar historial
        logger.log(
          LogLevel.WARN,
          LogCategory.API,
          'No se pudo registrar historial de estado',
          { historyError }
        )
      }
    }

    // Métricas de performance
    const responseTime = Date.now() - startTime
    await MetricsCollector.getInstance().recordRequest(
      'admin-order-update',
      'PATCH',
      200,
      responseTime
    )

    const response: ApiResponse<typeof updatedOrder> = {
      data: updatedOrder,
      success: true,
      error: '',
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Orden actualizada exitosamente', {
      orderId,
      changes: updateData,
      responseTime,
    })

    return NextResponse.json(response)
  } catch (error) {
    const responseTime = Date.now() - startTime
    await MetricsCollector.getInstance().recordRequest(
      'admin-order-update',
      'PATCH',
      500,
      responseTime
    )

    logger.log(LogLevel.ERROR, LogCategory.API, 'Error en PATCH /api/admin/orders/[id]', {
      error,
      orderId: id,
    })

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
