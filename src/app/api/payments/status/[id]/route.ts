// ===================================
// PINTEYA E-COMMERCE - PAYMENT STATUS API
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPaymentInfo } from '@/lib/integrations/mercadopago';
import { getSupabaseClient } from '@/lib/integrations/supabase';
import { ApiResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    // Autenticación con Clerk
    const session = await auth();
    if (!session?.user) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Usuario no autenticado',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }
    const orderId = params.id;

    // Inicializar Supabase con cliente administrativo
    const supabase = getSupabaseClient(true);

    // Verificar que el cliente esté disponible
    if (!supabase) {
      console.error('Cliente de Supabase no disponible en GET /api/payments/status/[id]');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Obtener la orden y verificar que pertenece al usuario
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          product:products (
            id,
            name,
            images
          )
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Orden no encontrada',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    let paymentInfo = null;
    let mercadoPagoStatus = null;

    // Si hay un payment_id, obtener información de MercadoPago
    if (order.payment_id) {
      const paymentResult = await getPaymentInfo(order.payment_id);

      if (paymentResult.success && 'data' in paymentResult) {
        paymentInfo = paymentResult.data;
        mercadoPagoStatus = {
          id: paymentInfo.id,
          status: paymentInfo.status,
          status_detail: paymentInfo.status_detail,
          transaction_amount: paymentInfo.transaction_amount,
          currency_id: paymentInfo.currency_id,
          date_created: paymentInfo.date_created,
          date_approved: paymentInfo.date_approved,
          payment_method: {
            id: paymentInfo.payment_method_id,
            type: paymentInfo.payment_type_id,
          },
          installments: paymentInfo.installments,
        };
      }
    }

    // Preparar respuesta
    const responseData = {
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        created_at: order.created_at,
        updated_at: order.updated_at,
        external_reference: order.external_reference,
        items: order.order_items?.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.product.id,
            name: item.product.name,
            image: item.product.images?.previews?.[0] || null,
          },
        })) || [],
      },
      payment: mercadoPagoStatus,
    };

    const successResponse: ApiResponse<typeof responseData> = {
      data: responseData,
      success: true,
      message: 'Estado de pago obtenido exitosamente',
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error: any) {
    console.error('Error getting payment status:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Endpoint para verificar estado desde el frontend después de redirección
export async function POST(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    // TODO: Reactivar cuando Clerk funcione
    // const { userId } = auth();
    // if (!session?.user) {
    //   const errorResponse: ApiResponse<null> = {
    //     data: null,
    //     success: false,
    //     error: 'Usuario no autenticado',
    //   };
    //   return NextResponse.json(errorResponse, { status: 401 });
    // }

    // Usar usuario temporal por ahora
    const userId = '00000000-0000-4000-8000-000000000000';
    const orderId = params.id;
    const body = await request.json();
    const { payment_id, status, merchant_order_id } = body;

    // Inicializar Supabase con cliente administrativo
    const supabase = getSupabaseClient(true);

    // Verificar que el cliente esté disponible
    if (!supabase) {
      console.error('Cliente de Supabase no disponible en POST /api/payments/status/[id]');
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Verificar que la orden pertenece al usuario
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Orden no encontrada',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Si se proporciona payment_id, obtener información actualizada
    if (payment_id) {
      const paymentResult = await getPaymentInfo(payment_id);

      if (paymentResult.success && 'data' in paymentResult) {
        const payment = paymentResult.data;
        
        // Mapear estado de MercadoPago
        let newStatus: string;
        switch (payment.status) {
          case 'approved':
            newStatus = 'paid';
            break;
          case 'pending':
          case 'in_process':
            newStatus = 'pending';
            break;
          case 'rejected':
          case 'cancelled':
            newStatus = 'cancelled';
            break;
          default:
            newStatus = order.status; // Mantener estado actual
        }

        // Actualizar orden si el estado cambió
        if (newStatus !== order.status) {
          await supabase
            .from('orders')
            .update({
              status: newStatus,
              payment_id: payment_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }

        const successResponse: ApiResponse<any> = {
          data: {
            order_id: orderId,
            status: newStatus,
            payment_status: payment.status,
            amount: payment.transaction_amount,
          },
          success: true,
          message: 'Estado actualizado exitosamente',
        };

        return NextResponse.json(successResponse, { status: 200 });
      }
    }

    // Si no hay payment_id o falló la consulta, retornar estado actual
    const successResponse: ApiResponse<any> = {
      data: {
        order_id: orderId,
        status: order.status,
        payment_status: status || 'unknown',
      },
      success: true,
      message: 'Estado actual de la orden',
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error: any) {
    console.error('Error updating payment status:', error);
    
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
