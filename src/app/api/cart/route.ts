// ===================================
// PINTEYA E-COMMERCE - API DE CARRITO
// ===================================
// Implementación completa de APIs de carrito para flujo de compra

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { auth } from '@/auth';

// Tipos para el carrito
interface CartItem {
  id: string;
  user_id: string;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  products: {
    id: number;
    name: string;
    price: number;
    discounted_price?: number;
    images?: any;
    stock: number;
    brand?: string;
    category?: {
      id: number;
      name: string;
    };
  };
}

interface CartSummary {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  itemCount: number;
}

/**
 * GET /api/cart
 * Obtener todos los items del carrito del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🛒 Cart API: GET - Obteniendo carrito del usuario');

    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ Cart API: Usuario no autenticado');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuario no autenticado',
          items: [],
          totalItems: 0,
          totalAmount: 0
        }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`🔍 Cart API: Obteniendo carrito para usuario ${userId}`);

    // Obtener cliente de Supabase
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('❌ Cart API: Cliente de Supabase no disponible');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Servicio de base de datos no disponible',
          items: []
        }, 
        { status: 503 }
      );
    }

    // Consultar items del carrito con información de productos
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        created_at,
        updated_at,
        products (
          id,
          name,
          price,
          discounted_price,
          images,
          stock,
          brand,
          category:categories (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Cart API: Error consultando carrito:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo carrito de la base de datos',
          details: error.message,
          items: []
        }, 
        { status: 500 }
      );
    }

    // Calcular totales
    const totalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalAmount = cartItems?.reduce((sum, item) => {
      const price = item.products?.discounted_price || item.products?.price || 0;
      return sum + (price * item.quantity);
    }, 0) || 0;

    const response: CartSummary = {
      items: cartItems || [],
      totalItems,
      totalAmount,
      itemCount: cartItems?.length || 0
    };

    console.log(`✅ Cart API: Carrito obtenido exitosamente - ${response.itemCount} productos únicos, ${totalItems} items totales`);

    return NextResponse.json({
      success: true,
      message: `Carrito obtenido: ${response.itemCount} productos`,
      ...response
    });

  } catch (error: any) {
    console.error('❌ Cart API: Error inesperado:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error.message,
        items: []
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Agregar un item al carrito (o actualizar cantidad si ya existe)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Cart API: POST - Agregando item al carrito');

    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ Cart API: Usuario no autenticado');
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Obtener datos del request
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    // Validaciones
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId es requerido' }, 
        { status: 400 }
      );
    }

    if (quantity <= 0 || quantity > 99) {
      return NextResponse.json(
        { success: false, error: 'Cantidad debe estar entre 1 y 99' }, 
        { status: 400 }
      );
    }

    console.log(`🔍 Cart API: Agregando producto ${productId} (cantidad: ${quantity}) para usuario ${userId}`);

    // Obtener cliente de Supabase
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('❌ Cart API: Cliente de Supabase no disponible');
      return NextResponse.json(
        { success: false, error: 'Servicio de base de datos no disponible' }, 
        { status: 503 }
      );
    }

    // Verificar que el producto existe y tiene stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, stock, price')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.log(`❌ Cart API: Producto ${productId} no encontrado`);
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' }, 
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      console.log(`❌ Cart API: Stock insuficiente para producto ${productId}. Stock: ${product.stock}, Solicitado: ${quantity}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Stock insuficiente',
          availableStock: product.stock
        }, 
        { status: 400 }
      );
    }

    // Upsert: agregar o actualizar item en carrito
    const { data: cartItem, error: cartError } = await supabase
      .from('cart_items')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity: quantity
      }, {
        onConflict: 'user_id,product_id'
      })
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        created_at,
        updated_at
      `)
      .single();

    if (cartError) {
      console.error('❌ Cart API: Error agregando al carrito:', cartError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error agregando producto al carrito',
          details: cartError.message
        }, 
        { status: 500 }
      );
    }

    console.log(`✅ Cart API: Producto ${product.name} agregado al carrito exitosamente`);

    return NextResponse.json({
      success: true,
      message: `${product.name} agregado al carrito`,
      item: cartItem,
      product: {
        id: product.id,
        name: product.name,
        price: product.price
      }
    });

  } catch (error: any) {
    console.error('❌ Cart API: Error inesperado:', error);
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
 * DELETE /api/cart
 * Limpiar todo el carrito del usuario
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🛒 Cart API: DELETE - Limpiando carrito completo');

    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Obtener cliente de Supabase
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Servicio de base de datos no disponible' }, 
        { status: 503 }
      );
    }

    // Eliminar todos los items del carrito del usuario
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Cart API: Error limpiando carrito:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error limpiando carrito',
          details: error.message
        }, 
        { status: 500 }
      );
    }

    console.log(`✅ Cart API: Carrito limpiado exitosamente para usuario ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Carrito limpiado exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Cart API: Error inesperado:', error);
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
