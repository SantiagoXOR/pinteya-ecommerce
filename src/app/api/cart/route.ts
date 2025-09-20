// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - API DE CARRITO
// ===================================
// Implementación completa de APIs de carrito con mejoras de seguridad

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/integrations/supabase';
import { auth } from '@/auth';

// ===================================
// MEJORAS DE SEGURIDAD - ALTA PRIORIDAD
// ===================================
import {
  withRateLimit,
  RATE_LIMIT_CONFIGS
} from '@/lib/rate-limiting/rate-limiter';
import {
  API_TIMEOUTS,
  withDatabaseTimeout,
  getEndpointTimeouts
} from '@/lib/config/api-timeouts';
import { createSecurityLogger } from '@/lib/logging/security-logger';

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
  // Aplicar rate limiting para APIs de carrito
  const rateLimitResult = await withRateLimit(
    request,
    RATE_LIMIT_CONFIGS.products, // Usar configuración similar a productos
    async () => {
      // Crear logger de seguridad
      const securityLogger = createSecurityLogger(request);

      try {
        console.log('🛒 Cart API: GET - Obteniendo carrito del usuario');
        securityLogger.logEvent('api_access', 'low', {
          endpoint: '/api/cart',
          method: 'GET'
        });

        // Verificar autenticación
        const session = await auth();
        if (!session?.user?.id) {
          console.log('❌ Cart API: Usuario no autenticado');
          securityLogger.logEvent('auth_failure', 'medium', {
            reason: 'No authenticated user'
          });

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

        // Obtener cliente de Supabase con manejo de errores mejorado
        let supabase;
        try {
          supabase = getSupabaseClient(true);
        } catch (error: any) {
          console.error('❌ Cart API: Error obteniendo cliente de Supabase:', error);
          securityLogger.logEvent('database_error', 'high', {
            error: error.message || 'Supabase client initialization failed'
          });

          return NextResponse.json(
            {
              success: false,
              error: 'Servicio de base de datos temporalmente no disponible',
              items: []
            },
            { status: 503 }
          );
        }

        if (!supabase) {
          console.error('❌ Cart API: Cliente de Supabase no disponible');
          securityLogger.logEvent('database_error', 'high', {
            error: 'Supabase client not available'
          });

          return NextResponse.json(
            {
              success: false,
              error: 'Servicio de base de datos no disponible',
              items: []
            },
            { status: 503 }
          );
        }

        // Consultar items del carrito con manejo de errores mejorado
        let cartItems, error;
        try {
          const result = await withDatabaseTimeout(
            async (signal) => {
              return await supabase
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
                .order('created_at', { ascending: false })
                .abortSignal(signal);
            },
            API_TIMEOUTS.database
          );
          cartItems = result.data;
          error = result.error;
        } catch (timeoutError: any) {
          console.error('❌ Cart API: Timeout en consulta de carrito:', timeoutError);
          securityLogger.logEvent('database_timeout', 'high', {
            operation: 'get_cart_items',
            timeout: API_TIMEOUTS.database
          });

          return NextResponse.json(
            {
              success: false,
              error: 'Timeout al obtener carrito. Intenta nuevamente.',
              items: []
            },
            { status: 408 }
          );
        }

        if (error) {
          console.error('❌ Cart API: Error consultando carrito:', error);
          securityLogger.logEvent('database_error', 'high', {
            error: error.message,
            operation: 'get_cart_items'
          });

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

        securityLogger.logEvent('api_success', 'low', {
          endpoint: '/api/cart',
          method: 'GET',
          itemCount: response.itemCount
        });

        return NextResponse.json({
          success: true,
          message: `Carrito obtenido: ${response.itemCount} productos`,
          ...response
        });

      } catch (error: any) {
        console.error('❌ Cart API: Error inesperado:', error);
        securityLogger.logEvent('api_error', 'high', {
          endpoint: '/api/cart',
          method: 'GET',
          error: error.message
        });

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
  );

  return rateLimitResult;
}

/**
 * POST /api/cart
 * Agregar un item al carrito (o actualizar cantidad si ya existe)
 */
export async function POST(request: NextRequest) {
  // Aplicar rate limiting para APIs de carrito
  const rateLimitResult = await withRateLimit(
    request,
    RATE_LIMIT_CONFIGS.creation, // Usar configuración para creación
    async () => {
      // Crear logger de seguridad
      const securityLogger = createSecurityLogger(request);

      try {
        console.log('🛒 Cart API: POST - Agregando item al carrito');
        securityLogger.logEvent('api_access', 'low', {
          endpoint: '/api/cart',
          method: 'POST'
        });

        // Verificar autenticación
        const session = await auth();
        if (!session?.user?.id) {
          console.log('❌ Cart API: Usuario no autenticado');
          securityLogger.logEvent('auth_failure', 'medium', {
            reason: 'No authenticated user'
          });

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
  );

  return rateLimitResult;
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









