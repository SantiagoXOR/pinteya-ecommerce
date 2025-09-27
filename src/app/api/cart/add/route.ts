// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API AGREGAR AL CARRITO
// ===================================
// Endpoint específico para agregar productos al carrito

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'

/**
 * POST /api/cart/add
 * Agregar un producto específico al carrito
 * Endpoint optimizado para botones "Agregar al carrito"
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Cart Add API: Iniciando proceso de agregar al carrito')

    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      console.log('❌ Cart Add API: Usuario no autenticado')
      return NextResponse.json(
        {
          success: false,
          error: 'Debes iniciar sesión para agregar productos al carrito',
          requiresAuth: true,
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Obtener datos del request
    const body = await request.json()
    const { productId, quantity = 1, replace = false } = body

    // Validaciones de entrada
    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID del producto es requerido',
          field: 'productId',
        },
        { status: 400 }
      )
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99) {
      return NextResponse.json(
        {
          success: false,
          error: 'La cantidad debe ser un número entero entre 1 y 99',
          field: 'quantity',
        },
        { status: 400 }
      )
    }

    console.log(
      `🔍 Cart Add API: Agregando producto ${productId} (cantidad: ${quantity}, replace: ${replace}) para usuario ${userId}`
    )

    // Obtener cliente de Supabase
    const supabase = getSupabaseClient(true)
    if (!supabase) {
      console.error('❌ Cart Add API: Cliente de Supabase no disponible')
      return NextResponse.json(
        {
          success: false,
          error: 'Servicio de base de datos temporalmente no disponible',
          retry: true,
        },
        { status: 503 }
      )
    }

    // 1. Verificar que el producto existe y obtener información
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(
        `
        id,
        name,
        price,
        discounted_price,
        stock,
        images,
        brand,
        category:categories (
          id,
          name
        )
      `
      )
      .eq('id', productId)
      .single()

    if (productError || !product) {
      console.log(`❌ Cart Add API: Producto ${productId} no encontrado`)
      return NextResponse.json(
        {
          success: false,
          error: 'El producto solicitado no existe o no está disponible',
          productId,
        },
        { status: 404 }
      )
    }

    // 2. Verificar stock disponible
    if (product.stock < quantity) {
      console.log(
        `❌ Cart Add API: Stock insuficiente para producto ${productId}. Stock: ${product.stock}, Solicitado: ${quantity}`
      )
      return NextResponse.json(
        {
          success: false,
          error: `Stock insuficiente. Solo quedan ${product.stock} unidades disponibles`,
          availableStock: product.stock,
          requestedQuantity: quantity,
          productName: product.name,
        },
        { status: 400 }
      )
    }

    // 3. Verificar si el producto ya está en el carrito
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    let finalQuantity = quantity
    let operation = 'added'

    if (existingItem && !existingError) {
      if (replace) {
        // Reemplazar cantidad existente
        finalQuantity = quantity
        operation = 'updated'
      } else {
        // Sumar a la cantidad existente
        finalQuantity = existingItem.quantity + quantity
        operation = 'increased'
      }

      // Verificar que la cantidad final no exceda el stock
      if (finalQuantity > product.stock) {
        return NextResponse.json(
          {
            success: false,
            error: `No se puede agregar. Ya tienes ${existingItem.quantity} en el carrito. Stock disponible: ${product.stock}`,
            currentQuantity: existingItem.quantity,
            availableStock: product.stock,
            maxCanAdd: product.stock - existingItem.quantity,
          },
          { status: 400 }
        )
      }
    }

    // 4. Agregar o actualizar item en carrito
    const { data: cartItem, error: cartError } = await supabase
      .from('cart_items')
      .upsert(
        {
          user_id: userId,
          product_id: productId,
          quantity: finalQuantity,
        },
        {
          onConflict: 'user_id,product_id',
        }
      )
      .select(
        `
        id,
        user_id,
        product_id,
        quantity,
        created_at,
        updated_at
      `
      )
      .single()

    if (cartError) {
      console.error('❌ Cart Add API: Error agregando al carrito:', cartError)
      return NextResponse.json(
        {
          success: false,
          error: 'Error agregando producto al carrito. Intenta nuevamente.',
          details: cartError.message,
          retry: true,
        },
        { status: 500 }
      )
    }

    // 5. Obtener resumen actualizado del carrito
    const { data: cartSummary, error: summaryError } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', userId)

    const totalItems = cartSummary?.reduce((sum, item) => sum + item.quantity, 0) || 0
    const totalProducts = cartSummary?.length || 0

    // 6. Preparar respuesta
    const responseMessage = {
      added: `${product.name} agregado al carrito`,
      updated: `Cantidad de ${product.name} actualizada en el carrito`,
      increased: `Se agregaron ${quantity} más de ${product.name} al carrito`,
    }[operation]

    console.log(`✅ Cart Add API: ${responseMessage} - Total items: ${totalItems}`)

    return NextResponse.json({
      success: true,
      message: responseMessage,
      operation,
      item: {
        id: cartItem.id,
        productId: product.id,
        productName: product.name,
        quantity: cartItem.quantity,
        price: product.discounted_price || product.price,
        addedQuantity: quantity,
      },
      cart: {
        totalItems,
        totalProducts,
      },
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        discounted_price: product.discounted_price,
        images: product.images,
        brand: product.brand,
        category: product.category,
      },
    })
  } catch (error: any) {
    console.error('❌ Cart Add API: Error inesperado:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor. Intenta nuevamente.',
        details: error.message,
        retry: true,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cart/add
 * Información sobre cómo usar este endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cart/add',
    method: 'POST',
    description: 'Agregar productos al carrito de compras',
    parameters: {
      productId: 'number - ID del producto (requerido)',
      quantity: 'number - Cantidad a agregar (opcional, default: 1)',
      replace: 'boolean - Si true, reemplaza cantidad existente (opcional, default: false)',
    },
    example: {
      productId: 123,
      quantity: 2,
      replace: false,
    },
    authentication: 'Requerida - Usuario debe estar autenticado',
    responses: {
      200: 'Producto agregado exitosamente',
      400: 'Datos inválidos o stock insuficiente',
      401: 'Usuario no autenticado',
      404: 'Producto no encontrado',
      500: 'Error interno del servidor',
    },
  })
}
