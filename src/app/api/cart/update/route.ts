// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - API ACTUALIZAR CARRITO
// ===================================
// Endpoint para actualizar cantidades en el carrito

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/integrations/supabase';
import { auth } from '@/lib/auth/config';

/**
 * PUT /api/cart/update
 * Actualizar cantidad de un producto en el carrito
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('🛒 Cart Update API: Iniciando actualización de cantidad');

    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ Cart Update API: Usuario no autenticado');
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

    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La cantidad debe ser un número entero entre 0 y 99',
          field: 'quantity'
        }, 
        { status: 400 }
      );
    }

    console.log(`🔍 Cart Update API: Actualizando producto ${productId} a cantidad ${quantity} para usuario ${userId}`);

    // Obtener cliente de Supabase
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('❌ Cart Update API: Cliente de Supabase no disponible');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Servicio de base de datos no disponible'
        }, 
        { status: 503 }
      );
    }

    // Verificar que el producto existe y obtener stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, stock, price, discounted_price')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.log(`❌ Cart Update API: Producto ${productId} no encontrado`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Producto no encontrado',
          productId
        }, 
        { status: 404 }
      );
    }

    // Verificar stock disponible
    if (quantity > product.stock) {
      console.log(`❌ Cart Update API: Stock insuficiente para producto ${productId}. Stock: ${product.stock}, Solicitado: ${quantity}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Stock insuficiente. Solo hay ${product.stock} unidades disponibles`,
          availableStock: product.stock,
          requestedQuantity: quantity,
          productName: product.name
        }, 
        { status: 400 }
      );
    }

    // Verificar que el item existe en el carrito
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingError || !existingItem) {
      console.log(`❌ Cart Update API: Producto ${productId} no está en el carrito`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'El producto no está en tu carrito',
          productId
        }, 
        { status: 404 }
      );
    }

    let operation = '';
    let responseMessage = '';

    if (quantity === 0) {
      // Remover completamente del carrito
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', existingItem.id);

      if (deleteError) {
        console.error('❌ Cart Update API: Error removiendo del carrito:', deleteError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error removiendo producto del carrito',
            details: deleteError.message
          }, 
          { status: 500 }
        );
      }

      operation = 'removed';
      responseMessage = `${product.name} removido del carrito`;
      
      console.log(`✅ Cart Update API: Producto removido - ${responseMessage}`);

      return NextResponse.json({
        success: true,
        message: responseMessage,
        operation,
        item: {
          productId: productId,
          productName: product.name,
          previousQuantity: existingItem.quantity,
          newQuantity: 0
        }
      });

    } else {
      // Actualizar cantidad
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: quantity })
        .eq('id', existingItem.id)
        .select(`
          id,
          user_id,
          product_id,
          quantity,
          updated_at
        `)
        .single();

      if (updateError) {
        console.error('❌ Cart Update API: Error actualizando cantidad:', updateError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error actualizando cantidad en el carrito',
            details: updateError.message
          }, 
          { status: 500 }
        );
      }

      if (quantity > existingItem.quantity) {
        operation = 'increased';
        responseMessage = `Cantidad de ${product.name} aumentada a ${quantity}`;
      } else {
        operation = 'decreased';
        responseMessage = `Cantidad de ${product.name} reducida a ${quantity}`;
      }
      
      console.log(`✅ Cart Update API: Cantidad actualizada - ${responseMessage}`);

      return NextResponse.json({
        success: true,
        message: responseMessage,
        operation,
        item: {
          id: updatedItem.id,
          productId: productId,
          productName: product.name,
          previousQuantity: existingItem.quantity,
          newQuantity: quantity,
          price: product.discounted_price || product.price
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Cart Update API: Error inesperado:', error);
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
 * PATCH /api/cart/update
 * Alias para PUT (para compatibilidad)
 */
export async function PATCH(request: NextRequest) {
  return PUT(request);
}

/**
 * POST /api/cart/update
 * Alias para PUT (para compatibilidad)
 */
export async function POST(request: NextRequest) {
  return PUT(request);
}

/**
 * GET /api/cart/update
 * Información sobre cómo usar este endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cart/update',
    methods: ['PUT', 'PATCH', 'POST'],
    description: 'Actualizar cantidad de productos en el carrito',
    parameters: {
      productId: 'number - ID del producto a actualizar (requerido)',
      quantity: 'number - Nueva cantidad (0-99). Si es 0, se remueve del carrito (requerido)'
    },
    examples: {
      updateQuantity: {
        productId: 123,
        quantity: 3
      },
      removeProduct: {
        productId: 123,
        quantity: 0
      }
    },
    authentication: 'Requerida - Usuario debe estar autenticado',
    responses: {
      200: 'Cantidad actualizada exitosamente',
      400: 'Datos inválidos o stock insuficiente',
      401: 'Usuario no autenticado',
      404: 'Producto no encontrado o no está en el carrito',
      500: 'Error interno del servidor'
    }
  });
}










