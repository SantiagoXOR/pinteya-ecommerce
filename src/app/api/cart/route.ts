// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - API DE CARRITO
// ===================================
// Implementación completa de APIs de carrito con mejoras de seguridad

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { auth } from '@/lib/auth/config'

// ===================================
// MEJORAS DE SEGURIDAD - ALTA PRIORIDAD
// ===================================
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { API_TIMEOUTS, withDatabaseTimeout, getEndpointTimeouts } from '@/lib/config/api-timeouts'
import { createSecurityLogger } from '@/lib/logging/security-logger'

// Tipos para el carrito
interface CartItem {
  id: string
  user_id: string
  product_id: number
  variant_id?: number | null
  quantity: number
  created_at: string
  updated_at: string
  products: {
    id: number
    name: string
    price: number
    discounted_price?: number
    images?: any
    stock: number
    brand?: string
    category?: {
      id: number
      name: string
    }
  }
  product_variants?: {
    id: number
    aikon_id: string | null
    color_name: string | null
    measure: string | null
    finish: string | null
    price_list: number
    price_sale: number | null
    stock: number
    image_url: string | null
  } | null
}

interface CartSummary {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  itemCount: number
}

/**
 * GET /api/cart
 * Obtener todos los items del carrito del usuario autenticado
 */
export async function GET(request: NextRequest) {
  // Crear logger de seguridad
  const securityLogger = createSecurityLogger(request)

  // Aplicar rate limiting para APIs de carrito
  return await withRateLimit(
    request,
    RATE_LIMIT_CONFIGS.products, // Usar configuración similar a productos
    async () => {
      try {
        console.log('🛒 Cart API: GET - Obteniendo carrito del usuario')
        securityLogger.log({
          type: 'data_access',
          severity: 'low',
          message: 'Cart API access',
          context: {
            endpoint: '/api/cart',
            method: 'GET',
            timestamp: new Date().toISOString(),
          },
        })

        // Verificar autenticación
        const session = await auth()
        if (!session?.user?.id) {
          console.log('❌ Cart API: Usuario no autenticado')
          securityLogger.log({
            type: 'auth_failure',
            severity: 'medium',
            message: 'Unauthorized cart access attempt',
            context: {
              endpoint: '/api/cart',
              method: 'GET',
              timestamp: new Date().toISOString(),
            },
            metadata: { reason: 'No authenticated user' },
          })

          return NextResponse.json(
            {
              success: false,
              error: 'Usuario no autenticado',
              items: [],
              totalItems: 0,
              totalAmount: 0,
            },
            { status: 401 }
          )
        }

        const userId = session.user.id
        console.log(`🔍 Cart API: Obteniendo carrito para usuario ${userId}`)

        // Obtener cliente de Supabase con manejo de errores mejorado
        let supabase
        try {
          supabase = getSupabaseClient(true)
        } catch (error: any) {
          console.error('❌ Cart API: Error obteniendo cliente de Supabase:', error)
          securityLogger.logApiError(securityLogger.context, error, {
            operation: 'supabase_client_init',
          })

          return NextResponse.json(
            {
              success: false,
              error: 'Servicio de base de datos temporalmente no disponible',
              items: [],
            },
            { status: 503 }
          )
        }

        if (!supabase) {
          console.error('❌ Cart API: Cliente de Supabase no disponible')
          securityLogger.log({
            type: 'api_error',
            severity: 'high',
            message: 'Supabase client not available',
            context: securityLogger.context,
            metadata: { operation: 'supabase_client_check' },
          })

          return NextResponse.json(
            {
              success: false,
              error: 'Servicio de base de datos no disponible',
              items: [],
            },
            { status: 503 }
          )
        }

        // Consultar items del carrito con manejo de errores mejorado
        let cartItems, error
        try {
          const result = await withDatabaseTimeout(async signal => {
            return await supabase
              .from('cart_items')
              .select(
                `
                  id,
                  user_id,
                  product_id,
                  variant_id,
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
                  ),
                  product_variants (
                    id,
                    aikon_id,
                    color_name,
                    measure,
                    finish,
                    price_list,
                    price_sale,
                    stock,
                    image_url
                  )
                `
              )
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .abortSignal(signal)
          }, API_TIMEOUTS.database)
          cartItems = result.data
          error = result.error
        } catch (timeoutError: any) {
          console.error('❌ Cart API: Timeout en consulta de carrito:', timeoutError)
          securityLogger.log({
            type: 'api_error',
            severity: 'high',
            message: 'Database timeout in cart query',
            context: securityLogger.context,
            metadata: {
              operation: 'get_cart_items',
              timeout: API_TIMEOUTS.database,
            },
          })

          return NextResponse.json(
            {
              success: false,
              error: 'Timeout al obtener carrito. Intenta nuevamente.',
              items: [],
            },
            { status: 408 }
          )
        }

        if (error) {
          console.error('❌ Cart API: Error consultando carrito:', error)
          securityLogger.logApiError(securityLogger.context, error, { operation: 'get_cart_items' })

          return NextResponse.json(
            {
              success: false,
              error: 'Error obteniendo carrito de la base de datos',
              details: error.message,
              items: [],
            },
            { status: 500 }
          )
        }

        // Calcular totales usando precios de variantes si existen
        const totalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0
        const totalAmount =
          cartItems?.reduce((sum, item) => {
            // Priorizar precio de variante sobre precio de producto
            const price = item.product_variants?.price_sale || 
                         item.product_variants?.price_list ||
                         item.products?.discounted_price || 
                         item.products?.price || 0
            return sum + price * item.quantity
          }, 0) || 0

        const response: CartSummary = {
          items: cartItems || [],
          totalItems,
          totalAmount,
          itemCount: cartItems?.length || 0,
        }

        console.log(
          `✅ Cart API: Carrito obtenido exitosamente - ${response.itemCount} productos únicos, ${totalItems} items totales`
        )

        securityLogger.log({
          type: 'data_access',
          severity: 'low',
          message: 'Cart retrieved successfully',
          context: securityLogger.context,
          metadata: {
            endpoint: '/api/cart',
            method: 'GET',
            itemCount: response.itemCount,
          },
        })

        return NextResponse.json({
          success: true,
          message: `Carrito obtenido: ${response.itemCount} productos`,
          ...response,
        })
      } catch (error: any) {
        console.error('❌ Cart API: Error inesperado:', error)

        return NextResponse.json(
          {
            success: false,
            error: 'Error interno del servidor',
            details: error.message,
            items: [],
          },
          { status: 500 }
        )
      }
    }
  )
}

/**
 * POST /api/cart
 * Agregar un item al carrito (o actualizar cantidad si ya existe)
 */
export async function POST(request: NextRequest) {
  // Crear logger de seguridad
  const securityLogger = createSecurityLogger(request)

  // Aplicar rate limiting para APIs de carrito
  return await withRateLimit(
    request,
    RATE_LIMIT_CONFIGS.creation, // Usar configuración para creación
    async () => {
      try {
        console.log('🛒 Cart API: POST - Agregando item al carrito')
        securityLogger.log({
          type: 'data_access',
          severity: 'low',
          message: 'Cart POST API access',
          context: {
            endpoint: '/api/cart',
            method: 'POST',
            timestamp: new Date().toISOString(),
          },
        })

        // Verificar autenticación
        const session = await auth()
        if (!session?.user?.id) {
          console.log('❌ Cart API: Usuario no autenticado')
          securityLogger.log({
            type: 'auth_failure',
            severity: 'medium',
            message: 'Unauthorized cart POST attempt',
            context: {
              endpoint: '/api/cart',
              method: 'POST',
              timestamp: new Date().toISOString(),
            },
            metadata: { reason: 'No authenticated user' },
          })

          return NextResponse.json(
            { success: false, error: 'Usuario no autenticado' },
            { status: 401 }
          )
        }

        const userId = session.user.id

        // Obtener datos del request
        const body = await request.json()
        const { productId, variantId, quantity = 1 } = body

        // Validaciones
        if (!productId) {
          return NextResponse.json(
            { success: false, error: 'productId es requerido' },
            { status: 400 }
          )
        }

        if (quantity <= 0 || quantity > 99) {
          return NextResponse.json(
            { success: false, error: 'Cantidad debe estar entre 1 y 99' },
            { status: 400 }
          )
        }

        console.log(
          `🔍 Cart API: Agregando producto ${productId} ${variantId ? `variante ${variantId}` : '(sin variante)'} (cantidad: ${quantity}) para usuario ${userId}`
        )

        // Obtener cliente de Supabase
        const supabase = getSupabaseClient(true)
        if (!supabase) {
          console.error('❌ Cart API: Cliente de Supabase no disponible')
          return NextResponse.json(
            { success: false, error: 'Servicio de base de datos no disponible' },
            { status: 503 }
          )
        }

        // Verificar que el producto existe
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name')
          .eq('id', productId)
          .single()

        if (productError || !product) {
          console.log(`❌ Cart API: Producto ${productId} no encontrado`)
          return NextResponse.json(
            { success: false, error: 'Producto no encontrado' },
            { status: 404 }
          )
        }

        // Si no se especifica variante, buscar la default
        let finalVariantId = variantId

        if (!finalVariantId) {
          console.log(`🔍 Cart API: Buscando variante default para producto ${productId}`)
          const { data: defaultVariant } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId)
            .eq('is_default', true)
            .eq('is_active', true)
            .single()

          if (defaultVariant) {
            finalVariantId = defaultVariant.id
            console.log(`✅ Cart API: Variante default encontrada: ${finalVariantId}`)
          } else {
            // Si no hay variante default, buscar la primera activa
            const { data: firstVariant } = await supabase
              .from('product_variants')
              .select('id')
              .eq('product_id', productId)
              .eq('is_active', true)
              .order('id', { ascending: true })
              .limit(1)
              .single()

            if (firstVariant) {
              finalVariantId = firstVariant.id
              console.log(`✅ Cart API: Primera variante activa encontrada: ${finalVariantId}`)
            }
          }
        }

        // Validar stock de la variante (si existe)
        let stockAvailable = 0
        let variantInfo = null

        if (finalVariantId) {
          const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .select('id, stock, price_sale, price_list, aikon_id, color_name, measure')
            .eq('id', finalVariantId)
            .single()

          if (variantError || !variant) {
            console.log(`❌ Cart API: Variante ${finalVariantId} no encontrada`)
            return NextResponse.json(
              { success: false, error: 'Variante no encontrada' },
              { status: 404 }
            )
          }

          stockAvailable = variant.stock
          variantInfo = variant

          if (variant.stock < quantity) {
            console.log(
              `❌ Cart API: Stock insuficiente para variante ${finalVariantId}. Stock: ${variant.stock}, Solicitado: ${quantity}`
            )
            return NextResponse.json(
              {
                success: false,
                error: 'Stock insuficiente para esta variante',
                availableStock: variant.stock,
              },
              { status: 400 }
            )
          }
        } else {
          // Fallback: usar stock del producto padre (para productos sin variantes)
          const { data: productStock } = await supabase
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single()

          stockAvailable = productStock?.stock || 0

          if (stockAvailable < quantity) {
            console.log(
              `❌ Cart API: Stock insuficiente para producto ${productId}. Stock: ${stockAvailable}, Solicitado: ${quantity}`
            )
            return NextResponse.json(
              {
                success: false,
                error: 'Stock insuficiente',
                availableStock: stockAvailable,
              },
              { status: 400 }
            )
          }
        }

        // Upsert: agregar o actualizar item en carrito
        const { data: cartItem, error: cartError } = await supabase
          .from('cart_items')
          .upsert(
            {
              user_id: userId,
              product_id: productId,
              variant_id: finalVariantId,
              quantity: quantity,
            },
            {
              onConflict: 'user_id,product_id,variant_id',
            }
          )
          .select(
            `
        id,
        user_id,
        product_id,
        variant_id,
        quantity,
        created_at,
        updated_at
      `
          )
          .single()

        if (cartError) {
          console.error('❌ Cart API: Error agregando al carrito:', cartError)
          return NextResponse.json(
            {
              success: false,
              error: 'Error agregando producto al carrito',
              details: cartError.message,
            },
            { status: 500 }
          )
        }

        const displayName = variantInfo 
          ? `${product.name} - ${variantInfo.measure || ''} ${variantInfo.color_name || ''}`.trim()
          : product.name

        console.log(`✅ Cart API: ${displayName} agregado al carrito exitosamente`)

        return NextResponse.json({
          success: true,
          message: `${displayName} agregado al carrito`,
          item: cartItem,
          product: {
            id: product.id,
            name: product.name,
          },
          variant: variantInfo,
        })
      } catch (error: any) {
        console.error('❌ Cart API: Error inesperado:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Error interno del servidor',
            details: error.message,
          },
          { status: 500 }
        )
      }
    }
  )
}

/**
 * DELETE /api/cart
 * Limpiar todo el carrito del usuario
 */
export async function DELETE(request: NextRequest) {
  // Crear logger de seguridad
  const securityLogger = createSecurityLogger(request)

  // Aplicar rate limiting para APIs de carrito
  return await withRateLimit(
    request,
    RATE_LIMIT_CONFIGS.products, // Usar configuración similar a productos
    async () => {
      try {
        console.log('🛒 Cart API: DELETE - Limpiando carrito completo')
        securityLogger.log({
          type: 'data_access',
          severity: 'low',
          message: 'Cart DELETE API access',
          context: {
            endpoint: '/api/cart',
            method: 'DELETE',
            timestamp: new Date().toISOString(),
          },
        })

        // Verificar autenticación
        const session = await auth()
        if (!session?.user?.id) {
          return NextResponse.json(
            { success: false, error: 'Usuario no autenticado' },
            { status: 401 }
          )
        }

        const userId = session.user.id

        // Obtener cliente de Supabase
        const supabase = getSupabaseClient(true)
        if (!supabase) {
          return NextResponse.json(
            { success: false, error: 'Servicio de base de datos no disponible' },
            { status: 503 }
          )
        }

        // Eliminar todos los items del carrito del usuario
        const { error } = await supabase.from('cart_items').delete().eq('user_id', userId)

        if (error) {
          console.error('❌ Cart API: Error limpiando carrito:', error)
          return NextResponse.json(
            {
              success: false,
              error: 'Error limpiando carrito',
              details: error.message,
            },
            { status: 500 }
          )
        }

        console.log(`✅ Cart API: Carrito limpiado exitosamente para usuario ${userId}`)

        return NextResponse.json({
          success: true,
          message: 'Carrito limpiado exitosamente',
        })
      } catch (error: any) {
        console.error('❌ Cart API: Error inesperado:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Error interno del servidor',
            details: error.message,
          },
          { status: 500 }
        )
      }
    }
  )
}
