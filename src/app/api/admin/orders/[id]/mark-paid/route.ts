import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/integrations/supabase/server';
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger';

/**
 * POST /api/admin/orders/[id]/mark-paid
 * Marca una orden como pagada manualmente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { payment_method = 'manual', notes = '' } = body;

    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    logger.log(LogLevel.INFO, LogCategory.API, 'Marking order as paid manually', { 
      orderId,
      userId: session.user.id,
      payment_method
    });

    // Obtener datos actuales de la orden
    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, payment_status, total')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      logger.log(LogLevel.WARN, LogCategory.API, 'Order not found', { orderId, orderError });
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la orden esté pendiente de pago
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'La orden ya está marcada como pagada' },
        { status: 400 }
      );
    }

    // Actualizar estado de pago y orden
    const updateData = {
      payment_status: 'paid',
      status: order.status === 'pending' ? 'confirmed' : order.status,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      logger.log(LogLevel.ERROR, LogCategory.DATABASE, 'Error updating order payment status', { 
        orderId,
        updateError 
      });
      return NextResponse.json(
        { success: false, error: 'Error al actualizar estado de pago' },
        { status: 500 }
      );
    }

    // Registrar en historial de estados si cambió el status
    if (order.status === 'pending' && updateData.status === 'confirmed') {
      try {
        await supabase
          .from('order_status_history')
          .insert({
            order_id: orderId,
            previous_status: 'pending',
            new_status: 'confirmed',
            changed_by: session.user.id,
            reason: `Pago confirmado manualmente por administrador (${payment_method})`,
            metadata: JSON.stringify({
              payment_method,
              notes,
              manual_confirmation: true
            })
          });
      } catch (historyError) {
        // Si la tabla no existe, continuar sin registrar historial
        logger.log(LogLevel.WARN, LogCategory.DATABASE, 'Could not register status history', { historyError });
      }
    }

    // TODO: Aquí se podrían agregar acciones adicionales como:
    // - Enviar email de confirmación al cliente
    // - Actualizar inventario
    // - Crear notificaciones

    logger.log(LogLevel.INFO, LogCategory.API, 'Order marked as paid successfully', {
      orderId,
      previousStatus: order.status,
      newStatus: updateData.status,
      payment_method
    });

    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        payment_status: 'paid',
        status: updateData.status
      },
      message: 'Orden marcada como pagada exitosamente'
    });

  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Unexpected error marking order as paid', { 
      orderId: params.id,
      error 
    });
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
