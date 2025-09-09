// ===================================
// PINTEYA E-COMMERCE - API REMOVER DEL CARRITO
// ===================================
// Endpoint para remover productos del carrito

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { auth } from '@/auth';

/**
 * DELETE /api/cart/remove
 * Remover un producto específico del carrito
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🛒 Cart Remove API: Iniciando proceso de remoción');

    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ Cart Remove API: Usuario no autenticado');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuario no autenticado',
          requiresAuth: true
        }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Obtener datos del request
    const body = await request.json();
    const { productId, quantity } = body;

    // Validaciones
    if (!productId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID del producto es requerido',
          field: 'productId'
        }, 
        { status: 400 }
      );
    }

    console.log(`🔍 Cart Remove API: Removiendo producto ${productId} para usuario ${userId}`);

    // Obtener cliente de Supabase
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('❌ Cart Remove API: Cliente de Supabase no disponible');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Servicio de base de datos no disponible'
        }, 
        { status: 503 }
      );
    }

    // Verificar que el item existe en el carrito
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        products (
          id,
          name,
          price,
          discounted_price
        )
      `)
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingError || !existingItem) {
      console.log(`❌ Cart Remove API: Producto ${productId} no está en el carrito`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'El producto no está en tu carrito',
          productId
        }, 
        { status: 404 }
      );
    }

    let operation = 'removed';
    let responseMessage = '';

    if (quantity && quantity > 0 && quantity < existingItem.quantity) {
      // Reducir cantidad específica
      const newQuantity = existingItem.quantity - quantity;
      
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Cart Remove API: Error actualizando cantidad:', updateError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error actualizando cantidad en el carrito',
            details: updateError.message
          }, 
          { status: 500 }
        );
      }

      operation = 'quantity_reduced';
      responseMessage = `Se removieron ${quantity} unidades de ${existingItem.products.name}. Quedan ${newQuantity} en el carrito`;
      
      console.log(`✅ Cart Remove API: Cantidad reducida - ${responseMessage}`);

      return NextResponse.json({
        success: true,
        message: responseMessage,
        operation,
        item: {
          id: updatedItem.id,
          productId: productId,
          productName: existingItem.products.name,
          previousQuantity: existingItem.quantity,
          newQuantity: newQuantity,
          removedQuantity: quantity
        }
      });

    } else {
      // Remover completamente del carrito
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', existingItem.id);

      if (deleteError) {
        console.error('❌ Cart Remove API: Error removiendo del carrito:', deleteError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error removiendo producto del carrito',
            details: deleteError.message
          }, 
          { status: 500 }
        );
      }

      operation = 'completely_removed';
      responseMessage = `${existingItem.products.name} removido del carrito`;
      
      console.log(`✅ Cart Remove API: Producto removido completamente - ${responseMessage}`);

      return NextResponse.json({
        success: true,
        message: responseMessage,
        operation,
        item: {
          productId: productId,
          productName: existingItem.products.name,
          removedQuantity: existingItem.quantity
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Cart Remove API: Error inesperado:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error.message
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart/remove
 * Alias para DELETE (para compatibilidad)
 */
export async function POST(request: NextRequest) {
  return DELETE(request);
}

/**
 * GET /api/cart/remove
 * Información sobre cómo usar este endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cart/remove',
    methods: ['DELETE', 'POST'],
    description: 'Remover productos del carrito de compras',
    parameters: {
      productId: 'number - ID del producto a remover (requerido)',
      quantity: 'number - Cantidad específica a remover (opcional). Si no se especifica o es mayor/igual a la cantidad actual, se remueve completamente'
    },
    examples: {
      removeCompletely: {
        productId: 123
      },
      reduceQuantity: {
        productId: 123,
        quantity: 1
      }
    },
    authentication: 'Requerida - Usuario debe estar autenticado',
    responses: {
      200: 'Producto removido exitosamente',
      400: 'Datos inválidos',
      401: 'Usuario no autenticado',
      404: 'Producto no está en el carrito',
      500: 'Error interno del servidor'
    }
  });
}
