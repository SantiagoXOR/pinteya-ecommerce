// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - CREATE PAYMENT PREFERENCE API
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { CreatePreferencePayload } from '@/types/checkout'
import { ApiResponse } from '@/types/api'
import { createPaymentPreference } from '@/lib/integrations/mercadopago'
import type { MercadoPagoItem } from '@/lib/integrations/mercadopago'
import { auth } from '@/auth'
import { CHECKOUT_CONSTANTS, VALIDATION_CONSTANTS } from '@/constants/shop'
import { z } from 'zod'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import {
  checkRateLimit,
  addRateLimitHeaders,
  endpointKeyGenerator,
} from '@/lib/enterprise/rate-limiter'
import { ENTERPRISE_RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/enterprise-rate-limiter'
import { metricsCollector } from '@/lib/enterprise/metrics'

// Schema de validación para la entrada
const CreatePreferenceSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, 'ID de producto requerido'),
        quantity: z
          .number()
          .min(1, 'Cantidad debe ser mayor a 0')
          .max(99, 'Cantidad máxima excedida'),
      })
    )
    .min(1, 'Al menos un producto es requerido'),
  payer: z.object({
    name: z.string().min(VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Nombre requerido'),
    surname: z.string().min(VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Apellido requerido'),
    email: z.string().email('Email inválido'),
    phone: z.string().regex(VALIDATION_CONSTANTS.PHONE_REGEX, 'Teléfono inválido').optional(),
    identification: z
      .object({
        type: z.string().min(1, 'Tipo de identificación requerido'),
        number: z.string().min(1, 'Número de identificación requerido'),
      })
      .optional(),
  }),
  shipping: z
    .object({
      cost: z.number().min(0, 'Costo de envío inválido'),
      address: z.object({
        street_name: z.string().min(1, 'Nombre de calle requerido'),
        street_number: z.string().min(1, 'Número de calle requerido'),
        zip_code: z.string().min(1, 'Código postal requerido'),
        city_name: z.string().min(1, 'Ciudad requerida'),
        state_name: z.string().min(1, 'Provincia requerida'),
      }),
    })
    .optional(),
  external_reference: z.string().optional(),
})

interface Product {
  id: number
  name: string
  price: number
  discounted_price?: number
  images?: {
    previews: string[]
  }
  category?: {
    name: string
    slug: string
  }
}

// Función helper para calcular precio final
function getFinalPrice(product: { price: number; discounted_price?: number | null }): number {
  return product.discounted_price ?? product.price
}

// Función helper para crear usuario temporal
async function createTemporaryUser(userId: string, email: string, name: string) {
  if (!supabaseAdmin) {
    throw new Error('Cliente administrativo de Supabase no disponible')
  }

  const { error } = await supabaseAdmin.from('users').insert({
    id: userId,
    clerk_id: 'temp-user',
    email,
    name,
  })

  if (error) {
    console.error('Error creating temporary user:', error)
    throw new Error('Error creando usuario temporal')
  }
}

export async function POST(request: NextRequest) {
  const requestStart = Date.now()
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // ✅ NUEVO: Logging estructurado del inicio de la request
  logger.info(
    LogCategory.PAYMENT,
    'Create preference request started',
    {
      endpoint: '/api/payments/create-preference',
      method: 'POST',
    },
    {
      clientIP,
      userAgent,
    }
  )

  // ✅ NUEVO: Rate limiting avanzado para API de pagos
  const rateLimitConfig = {
    ...ENTERPRISE_RATE_LIMIT_CONFIGS.PAYMENT_API,
    keyGenerator: endpointKeyGenerator('create-preference'),
  }

  const rateLimitResult = await checkRateLimit(request, rateLimitConfig)

  if (!rateLimitResult.success) {
    logger.warn(LogCategory.SECURITY, 'Rate limit exceeded for create-preference', {
      clientIP,
      limit: rateLimitResult.limit,
      retryAfter: rateLimitResult.retryAfter,
    })

    return NextResponse.json(
      {
        success: false,
        error: rateLimitConfig.message,
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'RateLimit-Limit': rateLimitResult.limit.toString(),
          'RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
        },
      }
    )
  }

  try {
    // Verificar que el cliente administrativo esté disponible
    if (!supabaseAdmin) {
      logger.error(LogCategory.PAYMENT, 'Supabase admin client not available', undefined, {
        clientIP,
      })
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }

    // Validar entrada
    const rawData = await request.json()
    const validationResult = CreatePreferenceSchema.safeParse(rawData)

    if (!validationResult.success) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: `Datos inválidos: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const orderData = validationResult.data
    const productIds = orderData.items.map(item => parseInt(item.id))
    const shippingCost = orderData.shipping?.cost || 0

    // ===================================
    // OBTENER USUARIO AUTENTICADO CON NEXTAUTH
    // ===================================
    let userId: string | null = null
    let userEmail: string | null = null

    try {
      // Intentar obtener usuario autenticado de NextAuth
      const session = await auth()
      if (session?.user) {
        userEmail = session.user.email || null

        // Verificar si el usuario existe en user_profiles
        const { data: existingUser, error: userError } = await supabaseAdmin
          .from('user_profiles')
          .select('id, email')
          .eq('email', userEmail)
          .single()

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error checking user in user_profiles:', userError)
        }

        // Si el usuario no existe en user_profiles, crearlo
        if (!existingUser) {
          const { data: newUser, error: createUserError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
              supabase_user_id: session.user.id,
              email: userEmail,
              first_name: session.user.name?.split(' ')[0] || 'Usuario',
              last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
              metadata: {
                created_from: 'checkout',
                created_at: new Date().toISOString()
              }
            })
            .select('id')
            .single()

          if (createUserError) {
            console.error('Error creating user in user_profiles:', createUserError)
            // Continuar con usuario temporal si falla la creación
            userId = null
          } else if (newUser) {
            userId = newUser.id
          } else {
            console.error('Error: newUser is null after insertion')
            userId = null
          }
        } else {
          userId = existingUser.id
        }
      }
    } catch (authError) {
      console.error('Error getting NextAuth session:', authError)
      // Continuar sin usuario autenticado
    }

    // Si no hay usuario autenticado, usar usuario temporal
    if (!userId) {
      userId = '00000000-0000-4000-8000-000000000000'
      userEmail = orderData.payer.email

      // Verificar que el usuario temporal existe en user_profiles
      const { data: tempUser, error: tempUserError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (tempUserError) {
        // Crear usuario temporal si no existe
        const { error: createTempError } = await supabaseAdmin.from('user_profiles').insert({
          id: userId,
          email: userEmail,
          first_name: orderData.payer.name,
          last_name: orderData.payer.surname,
          metadata: {
            type: 'temporary',
            created_for: 'checkout',
            created_at: new Date().toISOString()
          }
        })

        if (createTempError) {
          console.error('Error creating temporary user:', createTempError)
        }
      }
    }

    // ===================================
    // OBTENER PRODUCTOS Y VALIDAR STOCK
    // ===================================
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select(
        `
        id,
        name,
        price,
        discounted_price,
        stock,
        images,
        category:categories (
          name,
          slug
        )
      `
      )
      .in('id', productIds)

    if (productsError || !products) {
      console.error('Error fetching products:', productsError)
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error obteniendo productos',
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // Definir tipo para productos con categoría (como viene de Supabase)
    type SupabaseProduct = {
      id: number
      name: string
      price: number
      discounted_price: number | null
      stock: number
      images: string[] | null
      category:
        | {
            name: string
            slug: string
          }[]
        | null
    }

    // Convertir productos para tener categoría como objeto
    const typedProducts = (products as SupabaseProduct[]).map(product => ({
      ...product,
      category: product.category && product.category.length > 0 ? product.category[0] : null,
    }))

    // Validar stock disponible
    for (const item of orderData.items) {
      const product = typedProducts.find(p => p.id === parseInt(item.id))
      if (!product) {
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: `Producto ${item.id} no encontrado`,
        }
        return NextResponse.json(errorResponse, { status: 400 })
      }

      if (product.stock < item.quantity) {
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`,
        }
        return NextResponse.json(errorResponse, { status: 400 })
      }
    }

    // ===================================
    // CALCULAR TOTALES CON PRECIOS CORRECTOS
    // ===================================
    const itemsTotal = orderData.items.reduce((total, item) => {
      const product = typedProducts.find(p => p.id === parseInt(item.id))
      if (!product) {
        return total
      }

      // Usar precio con descuento si existe, sino precio normal
      const finalPrice = getFinalPrice(product)
      return total + finalPrice * item.quantity
    }, 0)

    const totalAmount = itemsTotal + shippingCost

    // ===================================
    // CREAR ORDEN EN BASE DE DATOS
    // ===================================
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        status: 'pending',
        total: totalAmount,
        shipping_address: orderData.shipping?.address
          ? JSON.stringify(orderData.shipping.address)
          : null,
        external_reference: orderData.external_reference || `order_${Date.now()}`,
        // ✅ NUEVO: Guardar información del payer
        payer_info: {
          name: orderData.payer.name,
          surname: orderData.payer.surname,
          email: orderData.payer.email,
          phone: orderData.payer.phone,
          identification: orderData.payer.identification,
        },
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      console.error('Order data attempted:', {
        user_id: userId,
        status: 'pending',
        total: totalAmount,
        shipping_address: orderData.shipping?.address
          ? JSON.stringify(orderData.shipping.address)
          : null,
        external_reference: orderData.external_reference || `order_${Date.now()}`,
      })
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: `Error creando orden: ${orderError?.message || 'Unknown error'}`,
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // ===================================
    // CREAR ITEMS DE LA ORDEN CON PRECIOS CORRECTOS
    // ===================================
    const orderItems = orderData.items.map(item => {
      const product = typedProducts.find(p => p.id === parseInt(item.id))
      if (!product) {
        throw new Error(`Producto ${item.id} no encontrado`)
      }

      // Usar precio con descuento si existe, sino precio normal
      const finalPrice = getFinalPrice(product)

      return {
        order_id: order.id,
        product_id: parseInt(item.id),
        quantity: item.quantity,
        price: finalPrice,
      }
    })

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Rollback: eliminar orden creada
      await supabaseAdmin.from('orders').delete().eq('id', order.id)

      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error creando items de orden',
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // ===================================
    // CONVERTIR ITEMS PARA MERCADOPAGO
    // ===================================
    const mercadoPagoItems: MercadoPagoItem[] = typedProducts.map(product => {
      const orderItem = orderData.items.find(item => item.id === product.id.toString())
      if (!orderItem) {
        throw new Error(`Order item not found for product ${product.id}`)
      }

      // Usar precio con descuento si existe, sino precio normal
      const finalPrice = getFinalPrice(product)

      return {
        id: product.id.toString(),
        title: product.name,
        description: `Producto de pinturería - ${product.category?.name || 'General'}`,
        picture_url: product.images?.previews?.[0] || '',
        category_id: product.category?.slug || 'general',
        quantity: orderItem.quantity,
        currency_id: 'ARS',
        unit_price: finalPrice,
      }
    })

    // No agregar el costo de envío como ítem separado.
    // Mercado Pago mostrará y cobrará el envío usando `shipments.cost`.

    // ✅ MEJORADO: Usar nueva función con configuración avanzada
    const preferenceResult = await createPaymentPreference({
      items: mercadoPagoItems,
      payer: {
        name: orderData.payer.name,
        surname: orderData.payer.surname,
        email: orderData.payer.email,
        phone: orderData.payer.phone
          ? {
              area_code: orderData.payer.phone.substring(0, 3),
              number: orderData.payer.phone.substring(3),
            }
          : undefined,
        identification: orderData.payer.identification,
        address: orderData.shipping
          ? {
              street_name: orderData.shipping.address.street_name,
              street_number: orderData.shipping.address.street_number,
              zip_code: orderData.shipping.address.zip_code,
            }
          : undefined,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order_id=${order.id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure?order_id=${order.id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending?order_id=${order.id}`,
      },
      external_reference: order.id.toString(),
      shipments: orderData.shipping
        ? {
            cost: orderData.shipping.cost,
            receiver_address: {
              zip_code: orderData.shipping.address.zip_code,
              street_name: orderData.shipping.address.street_name,
              street_number: orderData.shipping.address.street_number,
              city_name: orderData.shipping.address.city_name,
              state_name: orderData.shipping.address.state_name,
            },
          }
        : undefined,
    })

    // ✅ MEJORADO: Manejar resultado de la nueva función
    if (!preferenceResult.success) {
      throw new Error(
        'error' in preferenceResult ? preferenceResult.error : 'Error creando preferencia de pago'
      )
    }

    // Actualizar orden con ID de preferencia
    const preferenceData = 'data' in preferenceResult ? preferenceResult.data : null
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_preference_id: preferenceData?.id,
      })
      .eq('id', order.id)

    if (updateError) {
      logger.warn(
        LogCategory.PAYMENT,
        'Failed to update order with preference ID',
        { updateError },
        { clientIP }
      )
    }

    // ✅ NUEVO: Logging exitoso de creación de preferencia
    const processingTime = Date.now() - requestStart
    logger.payment(
      LogLevel.INFO,
      'Payment preference created successfully',
      {
        orderId: order.id.toString(),
        preferenceId: preferenceData?.id,
        amount: totalAmount,
        currency: 'ARS',
        method: 'mercadopago',
      },
      {
        clientIP,
        userAgent,
      }
    )

    logger.performance(
      LogLevel.INFO,
      'Create preference request completed',
      {
        operation: 'create-preference',
        duration: processingTime,
        endpoint: '/api/payments/create-preference',
        statusCode: 200,
      },
      { clientIP }
    )

    // ✅ NUEVO: Crear respuesta con headers de rate limiting
    const response = NextResponse.json({
      success: true,
      data: {
        init_point: preferenceData?.init_point,
        preference_id: preferenceData?.id,
      },
    })

    // ✅ NUEVO: Registrar métricas de éxito
    await metricsCollector.recordRequest(
      'create-preference',
      'POST',
      200,
      Date.now() - requestStart,
      { clientIP, userAgent }
    )

    // Agregar headers de rate limiting a la respuesta exitosa
    return addRateLimitHeaders(response, rateLimitResult, rateLimitConfig)
  } catch (error: unknown) {
    // ✅ MEJORADO: Logging estructurado de errores
    const processingTime = Date.now() - requestStart

    logger.error(LogCategory.PAYMENT, 'Failed to create payment preference', error, {
      clientIP,
      userAgent,
    })

    logger.performance(
      LogLevel.ERROR,
      'Create preference request failed',
      {
        operation: 'create-preference',
        duration: processingTime,
        endpoint: '/api/payments/create-preference',
        statusCode: 500,
      },
      { clientIP }
    )

    // ✅ NUEVO: Registrar métricas de error
    await metricsCollector.recordRequest('create-preference', 'POST', 500, processingTime, {
      clientIP,
      userAgent,
      error: error.message,
    })

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
