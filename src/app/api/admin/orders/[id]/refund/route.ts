import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { logger, LogLevel, LogCategory } from '@/lib/logger';

/**
 * POST /api/admin/orders/[id]/refund
 * Procesa un reembolso para una orden
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { amount, reason = 'Reembolso solicitado por administrador' } = body;

    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Processing refund for order', { 
      orderId,
      userId: session.user.id,
      amount,
      reason
    });

    // Obtener datos actuales de la orden
    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_status, total, payment_id, payment_preference_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      logger.log(LogLevel.WARN, LogCategory.API, 'Order not found', { orderId, orderError });
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la orden esté pagada
    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden reembolsar órdenes pagadas' },
        { status: 400 }
      );
    }

    // Verificar que el monto no exceda el total de la orden
    if (amount && amount > order.total) {
      return NextResponse.json(
        { success: false, error: 'El monto del reembolso no puede exceder el total de la orden' },
        { status: 400 }
      );
    }

    const refundAmount = amount || order.total;

    // TODO: Aquí se integraría con MercadoPago para procesar el reembolso real
    // Por ahora, simularemos el proceso
    
    // Simular procesamiento de reembolso
    const refundResult = {
      success: true,
      refund_id: `refund_${Date.now()}`,
      amount: refundAmount,
      status: 'approved'
    };

    if (!refundResult.success) {
      logger.log(LogLevel.ERROR, LogCategory.PAYMENT, 'Error processing refund', { 
        orderId,
        refundResult 
      });
      return NextResponse.json(
        { success: false, error: 'Error al procesar reembolso' },
        { status: 500 }
      );
    }

    // Actualizar estado de la orden
    const updateData = {
      payment_status: 'refunded',
      status: 'refunded',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error updating order after refund', { 
        orderId,
        updateError 
      });
      return NextResponse.json(
        { success: false, error: 'Error al actualizar estado de la orden' },
        { status: 500 }
      );
    }

    // Registrar en historial de estados
    try {
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          previous_status: order.status,
          new_status: 'refunded',
          changed_by: session.user.id,
          reason: `Reembolso procesado: ${reason}`,
          metadata: JSON.stringify({
            refund_id: refundResult.refund_id,
            refund_amount: refundAmount,
            refund_reason: reason,
            processed_by: session.user.id
          })
        });
    } catch (historyError) {
      // Si la tabla no existe, continuar sin registrar historial
      logger.log(LogLevel.WARN, LogCategory.DATABASE, 'Could not register refund in status history', { historyError });
    }

    // TODO: Aquí se podrían agregar acciones adicionales como:
    // - Enviar email de confirmación de reembolso al cliente
    // - Restaurar inventario si es necesario
    // - Crear notificaciones

    logger.log(LogLevel.INFO, LogCategory.API, 'Refund processed successfully', {
      orderId,
      refund_id: refundResult.refund_id,
      amount: refundAmount
    });

    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        refund_id: refundResult.refund_id,
        refund_amount: refundAmount,
        payment_status: 'refunded',
        status: 'refunded'
      },
      message: 'Reembolso procesado exitosamente'
    });

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Unexpected error processing refund', { 
      orderId: params.id,
      error 
    });
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
