import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createAdminClient } from '@/lib/integrations/supabase/server'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { MercadoPagoConfig, PaymentRefund } from 'mercadopago'
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'
import { getTenantById } from '@/lib/tenant/tenant-service'

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===================================

async function validateAdminAuth() {
  try {
    // BYPASS SOLO EN DESARROLLO CON VALIDACIÓN ESTRICTA
    if (process.env.BYPASS_AUTH === 'true') {
      try {
        const fs = require('fs')
        const path = require('path')
        const envLocalPath = path.join(process.cwd(), '.env.local')
        if (fs.existsSync(envLocalPath)) {
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
        console.warn('[API Admin Refund] No se pudo verificar .env.local, bypass deshabilitado')
      }
    }

    const session = await auth()
    if (!session?.user) {
      return { error: 'Usuario no autenticado', status: 401 }
    }

    // Verificar si es admin usando el rol de la sesión
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
// RESTAURAR STOCK AL REEMBOLSAR
// ===================================

async function restoreStockForOrder(orderId: string, supabase: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener items de la orden incluyendo variant_id
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, variant_id, quantity')
      .eq('order_id', orderId)

    if (itemsError || !items) {
      console.error('[STOCK] Error obteniendo items de la orden:', itemsError)
      return { success: false, error: 'Error al obtener items de la orden' }
    }

    console.log(`[STOCK] Restaurando stock para orden ${orderId}, ${items.length} items`)

    // Restaurar stock de cada producto/variante usando la función RPC
    for (const item of items) {
      const { data: stockResult, error: stockError } = await supabase.rpc('restore_stock', {
        p_product_id: item.product_id,
        p_variant_id: item.variant_id || null,
        p_quantity: item.quantity,
      })

      if (stockError) {
        console.error(`[STOCK] Error restaurando stock:`, {
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          error: stockError
        })
      } else {
        console.log(`[STOCK] Stock restaurado:`, {
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          success: stockResult
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[STOCK] Error en restoreStockForOrder:', error)
    return { success: false, error: 'Error al restaurar stock' }
  }
}

/**
 * POST /api/admin/orders/[id]/refund
 * Procesa un reembolso real para una orden usando MercadoPago API
 */
export const POST = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  let orderId: string | undefined
  const { tenantId } = guardResult
  try {
    const { id } = await context.params
    orderId = id
    const body = await request.json()
    const { amount, reason = 'Reembolso solicitado por administrador' } = body

    logger.log(LogLevel.INFO, LogCategory.API, 'Processing refund for order', {
      orderId,
      userId: guardResult.userId,
      tenantId,
      amount,
      reason,
    })

    // ===================================
    // MULTITENANT: Obtener orden del tenant
    // ===================================
    const supabase = createAdminClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_status, total, payment_id, payment_preference_id, payment_method')
      .eq('id', orderId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Verificar que pertenece al tenant
      .single()

    if (orderError || !order) {
      logger.log(LogLevel.WARN, LogCategory.API, 'Order not found', { orderId, orderError })
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 })
    }

    // Verificar que la orden esté pagada
    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden reembolsar órdenes pagadas' },
        { status: 400 }
      )
    }

    // Verificar que el monto no exceda el total de la orden
    const orderTotal = parseFloat(order.total)
    if (amount && amount > orderTotal) {
      return NextResponse.json(
        { success: false, error: 'El monto del reembolso no puede exceder el total de la orden' },
        { status: 400 }
      )
    }

    const refundAmount = amount || orderTotal
    let refundResult: { success: boolean; refund_id: string; amount: number; status: string; source: string }

    // ===================================
    // PROCESAR REEMBOLSO CON MERCADOPAGO
    // ===================================
    if (order.payment_method === 'mercadopago' && order.payment_id) {
      console.log('[REFUND] Procesando reembolso con MercadoPago para payment_id:', order.payment_id)
      
      try {
        // ⚡ MULTITENANT: Obtener credenciales del tenant
        const tenant = await getTenantById(tenantId)
        if (!tenant || !tenant.mercadopagoAccessToken) {
          throw new Error('MercadoPago no configurado para este tenant')
        }

        // Crear cliente de MercadoPago con credenciales del tenant
        const client = new MercadoPagoConfig({
          accessToken: tenant.mercadopagoAccessToken,
        })
        const paymentRefund = new PaymentRefund(client)

        // Generar idempotency key para evitar duplicados
        const idempotencyKey = `refund-${orderId}-${Date.now()}`

        let mpRefund: any

        // Determinar si es reembolso total o parcial
        if (refundAmount >= orderTotal) {
          // Reembolso total
          console.log('[REFUND] Ejecutando reembolso TOTAL')
          mpRefund = await paymentRefund.create({
            payment_id: order.payment_id,
            requestOptions: {
              idempotencyKey,
            },
          })
        } else {
          // Reembolso parcial
          console.log('[REFUND] Ejecutando reembolso PARCIAL por:', refundAmount)
          mpRefund = await paymentRefund.create({
            payment_id: order.payment_id,
            body: {
              amount: refundAmount,
            },
            requestOptions: {
              idempotencyKey,
            },
          })
        }

        console.log('[REFUND] Respuesta de MercadoPago:', mpRefund)

        refundResult = {
          success: true,
          refund_id: mpRefund.id?.toString() || `mp_refund_${Date.now()}`,
          amount: mpRefund.amount || refundAmount,
          status: mpRefund.status || 'approved',
          source: 'mercadopago',
        }

      } catch (mpError: any) {
        console.error('[REFUND] Error de MercadoPago:', mpError)
        
        // Intentar extraer mensaje de error de MercadoPago
        const errorMessage = mpError?.message || mpError?.cause?.[0]?.description || 'Error al procesar reembolso en MercadoPago'
        
        logger.log(LogLevel.ERROR, LogCategory.PAYMENT, 'MercadoPago refund failed', {
          orderId,
          payment_id: order.payment_id,
          error: errorMessage,
          errorDetails: mpError,
        })

        return NextResponse.json(
          { success: false, error: `Error de MercadoPago: ${errorMessage}` },
          { status: 500 }
        )
      }
    } else if (order.payment_method === 'cash') {
      // Para pagos en efectivo, solo actualizamos el estado (no hay reembolso real)
      console.log('[REFUND] Orden pagada en efectivo - solo actualizando estado')
      refundResult = {
        success: true,
        refund_id: `cash_refund_${Date.now()}`,
        amount: refundAmount,
        status: 'approved',
        source: 'manual',
      }
    } else {
      // Orden sin payment_id o método de pago desconocido
      return NextResponse.json(
        { success: false, error: 'Esta orden no tiene un pago de MercadoPago asociado para reembolsar' },
        { status: 400 }
      )
    }

    // ===================================
    // ACTUALIZAR ESTADO DE LA ORDEN
    // ===================================
    const updateData = {
      payment_status: 'refunded',
      status: 'refunded',
      updated_at: new Date().toISOString(),
    }

    // ⚡ MULTITENANT: Actualizar orden del tenant
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT: Verificar que pertenece al tenant

    if (updateError) {
      logger.log(LogLevel.ERROR, LogCategory.API, 'Error updating order after refund', {
        orderId,
        updateError,
      })
      return NextResponse.json(
        { success: false, error: 'Reembolso procesado pero error al actualizar estado de la orden' },
        { status: 500 }
      )
    }

    // ===================================
    // RESTAURAR STOCK
    // ===================================
    const stockResult = await restoreStockForOrder(orderId, supabase)
    if (!stockResult.success) {
      logger.log(LogLevel.WARN, LogCategory.API, 'Error restaurando stock (no bloqueante)', {
        orderId,
        error: stockResult.error,
      })
    } else {
      logger.log(LogLevel.INFO, LogCategory.API, 'Stock restaurado exitosamente', { orderId })
    }

    // ===================================
    // REGISTRAR EN HISTORIAL
    // ===================================
    try {
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        previous_status: order.status,
        new_status: 'refunded',
        changed_by: guardResult.userId, // ⚡ MULTITENANT: Usar userId del guard
        reason: `Reembolso procesado: ${reason}`,
        metadata: JSON.stringify({
          refund_id: refundResult.refund_id,
          refund_amount: refundResult.amount,
          refund_reason: reason,
          refund_source: refundResult.source,
          processed_by: guardResult.userId, // ⚡ MULTITENANT: Usar userId del guard
        }),
      })
    } catch (historyError) {
      logger.log(
        LogLevel.WARN,
        LogCategory.API,
        'Could not register refund in status history',
        { historyError }
      )
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Refund processed successfully', {
      orderId,
      refund_id: refundResult.refund_id,
      amount: refundResult.amount,
      source: refundResult.source,
    })

    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        refund_id: refundResult.refund_id,
        refund_amount: refundResult.amount,
        refund_status: refundResult.status,
        refund_source: refundResult.source,
        payment_status: 'refunded',
        status: 'refunded',
        stock_restored: stockResult.success,
      },
      message: refundResult.source === 'mercadopago' 
        ? 'Reembolso procesado exitosamente en MercadoPago' 
        : 'Reembolso registrado exitosamente',
    })
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Unexpected error processing refund', {
      orderId: orderId || 'unknown',
      error,
    })

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
