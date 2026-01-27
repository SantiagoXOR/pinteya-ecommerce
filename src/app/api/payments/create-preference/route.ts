// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTURERÍA DIGITAL - CREATE PAYMENT PREFERENCE API (MULTITENANT)
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
import { whatsappLinkService } from '@/lib/integrations/whatsapp/whatsapp-link-service'
import crypto from 'crypto'
// MULTITENANT: Importar configuración del tenant
import { getTenantConfig } from '@/lib/tenant'

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
        variant_id: z.string().optional(),
        variant_color: z.string().optional(),
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
        apartment: z.string().optional(),
        observations: z.string().optional(),
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

// Función para generar mensaje de WhatsApp para MercadoPago
function generateMercadoPagoWhatsAppMessage(order: any, orderData: any, products: any[], tenantName: string = 'Pinteya'): string {
  const formatARS = (v: number) => Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const bullet = '•'
  
  const lines: string[] = [
    `✨ *¡Gracias por tu compra en ${tenantName}!* 🛍`,
    `💳 Tu pago con MercadoPago ha sido procesado exitosamente`,
    ``,
    `*Detalle de Orden:*`,
    `${bullet} Orden: ${order.order_number || order.id}`,
    `${bullet} Total: $${formatARS(Number(order.total || 0))}`,
    ``,
    `*Datos Personales:*`,
    `${bullet} Nombre: ${orderData.payer.name} ${orderData.payer.surname}`,
    `${bullet} Teléfono: 📞 ${orderData.payer.phone || 'No proporcionado'}`,
    `${bullet} Email: ✉️ ${orderData.payer.email}`,
    ``,
    `*Productos:*`,
  ]

  // Agregar productos
  for (const item of orderData.items) {
    const product = products.find(p => p.id === parseInt(item.id))
    if (product) {
      const finalPrice = getFinalPrice(product)
      const lineTotal = finalPrice * item.quantity
      
      let productLine = `${bullet} ${product.name}`
      
      // Agregar detalles del producto si están disponibles
      const details = []
      if (product.category?.name) details.push(`Categoría: ${product.category.name}`)
      if (product.brand) details.push(`Marca: ${product.brand}`)
      
      if (details.length > 0) {
        productLine += ` (${details.join(', ')})`
      }
      
      productLine += ` x${item.quantity} - $${formatARS(lineTotal)}`
      lines.push(productLine)
    }
  }

  // Datos de envío si están disponibles
  if (orderData.shipping?.address) {
    lines.push('', `*Datos de Envío:*`)
    lines.push(`${bullet} Dirección: 📍 ${orderData.shipping.address.street_name} ${orderData.shipping.address.street_number}`)
    lines.push(`${bullet} Ciudad: ${orderData.shipping.address.city_name}, ${orderData.shipping.address.state_name}`)
    lines.push(`${bullet} CP: ${orderData.shipping.address.zip_code}`)
  }

  lines.push('')
  lines.push(`💳 *Método de pago:* MercadoPago`)
  lines.push('', `✅ ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`)

  return lines.join('\n')
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
        ),
        product_variants (
          id,
          stock,
          price_sale,
          price_list,
          color_name,
          color_hex,
          measure,
          finish,
          image_url
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

    // Obtener imágenes de productos desde product_images
    const { data: productImages } = await supabaseAdmin
      .from('product_images')
      .select('product_id, url, is_primary')
      .in('product_id', productIds)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })

    // Agrupar imágenes por product_id
    const imagesByProductId = (productImages || []).reduce((acc: any, img: any) => {
      if (!acc[img.product_id]) {
        acc[img.product_id] = []
      }
      acc[img.product_id].push(img)
      return acc
    }, {})

    // Definir tipo para productos con categoría y variantes (como viene de Supabase)
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
      product_variants?: Array<{
        id: number
        stock: number
        price_sale: number | null
        price_list: number
        color_name: string | null
        color_hex: string | null
        measure: string | null
        finish: string | null
        image_url: string | null
      }> | null
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

      // Si el item tiene variant_id, validar stock de la variante
      if (item.variant_id) {
        const variantId = parseInt(item.variant_id)
        const variant = product.product_variants?.find(v => v.id === variantId)
        
        if (!variant) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: `Variante ${item.variant_id} no encontrada para producto ${product.name}`,
          }
          return NextResponse.json(errorResponse, { status: 400 })
        }

        if (variant.stock < item.quantity) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: `Stock insuficiente para ${product.name}. Disponible: ${variant.stock}, solicitado: ${item.quantity}`,
          }
          return NextResponse.json(errorResponse, { status: 400 })
        }
      } else {
        // Si no tiene variant_id, validar stock del producto padre
        if (product.stock < item.quantity) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`,
          }
          return NextResponse.json(errorResponse, { status: 400 })
        }
      }
    }

    // ===================================
    // CALCULAR TOTALES CON PRECIOS CORRECTOS (INCLUYENDO VARIANTES)
    // ===================================
    const itemsTotal = orderData.items.reduce((total, item) => {
      const product = typedProducts.find(p => p.id === parseInt(item.id))
      if (!product) {
        return total
      }

      // 🔧 CORREGIDO: Si el item tiene variant_id, usar precio de la variante
      let finalPrice: number
      if (item.variant_id && product.product_variants) {
        const variantId = parseInt(item.variant_id)
        const variant = product.product_variants.find((v: any) => v.id === variantId)
        if (variant) {
          // Priorizar price_sale si existe y es mayor a 0, sino usar price_list
          finalPrice = variant.price_sale && variant.price_sale > 0 ? variant.price_sale : (variant.price_list || 0)
        } else {
          // Fallback al precio del producto si no se encuentra la variante
          finalPrice = getFinalPrice(product)
        }
      } else {
        // Si no tiene variant_id, usar precio del producto padre
        finalPrice = getFinalPrice(product)
      }

      // Validar que finalPrice sea válido
      if (!finalPrice || finalPrice <= 0) {
        console.error(`⚠️ Precio inválido para producto ${product.name}:`, {
          finalPrice,
          variant_id: item.variant_id,
          product_id: product.id,
          product_price: product.price,
          product_discounted_price: product.discounted_price
        })
        // Usar precio del producto como último recurso
        finalPrice = product.discounted_price && product.discounted_price > 0 
          ? product.discounted_price 
          : (product.price || 0)
      }

      return total + finalPrice * item.quantity
    }, 0)

    const totalAmount = itemsTotal + shippingCost

    // ===================================
    // MULTITENANT: Obtener configuración del tenant actual
    // ===================================
    const tenant = await getTenantConfig()
    
    // Validar que el tenant tenga credenciales de MercadoPago configuradas
    if (!tenant.mercadopagoAccessToken) {
      logger.error(LogCategory.PAYMENT, 'MercadoPago no configurado para este tenant', {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      }, { clientIP })
      
      return NextResponse.json({
        success: false,
        error: 'MercadoPago no configurado para este tenant',
      }, { status: 400 })
    }
    
    // ===================================
    // CREAR ORDEN EN BASE DE DATOS
    // ===================================
    // Primero insertamos sin order_number, luego actualizamos con el ID
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        tenant_id: tenant.id, // MULTITENANT: Asociar orden al tenant actual
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'mercadopago',
        total: totalAmount,
        // Guardar shipping_address como objeto JSONB (igual que cash order)
        shipping_address: orderData.shipping?.address
          ? {
              street_name: orderData.shipping.address.street_name,
              street_number: orderData.shipping.address.street_number,
              zip_code: orderData.shipping.address.zip_code,
              city_name: orderData.shipping.address.city_name,
              state_name: orderData.shipping.address.state_name,
              apartment: orderData.shipping.address.apartment,
              observations: orderData.shipping.address.observations,
            }
          : null,
        payer_info: {
          name: orderData.payer.name,
          surname: orderData.payer.surname,
          email: orderData.payer.email,
          phone: orderData.payer.phone,
          identification: orderData.payer.identification,
          payment_method: 'mercadopago',
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
      })
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: `Error creando orden: ${orderError?.message || 'Unknown error'}`,
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // ===================================
    // ACTUALIZAR ORDER_NUMBER CON EL ID
    // ===================================
    const orderNumber = order.id.toString()
    const { error: updateOrderNumberError } = await supabaseAdmin
      .from('orders')
      .update({
        order_number: orderNumber,
        external_reference: orderNumber,
        payer_info: {
          ...order.payer_info,
          order_number: orderNumber,
        },
      })
      .eq('id', order.id)

    if (updateOrderNumberError) {
      console.error('Error updating order_number:', updateOrderNumberError)
    }

    // Actualizar el objeto order con el order_number
    order.order_number = orderNumber

    // ===================================
    // GENERAR WHATSAPP MESSAGE (como en Cash)
    // ===================================
    console.log('[WHATSAPP] Generando mensaje de WhatsApp para orden:', order.id)

    const formatARS = (v: number) => Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const bullet = '•';
    const tenantName = tenant?.name || 'Pinteya';
    const lines: string[] = [
      `✨ *¡Gracias por tu compra en ${tenantName}!* 🛍`,
      `💳 Tu pago con MercadoPago ha sido procesado exitosamente`,
      '',
      `*Detalle de Orden:*`,
      `${bullet} Orden: ${order.order_number}`,  // Usa el order_number generado
      `${bullet} Total: $${formatARS(totalAmount)}`,
      '',
      `*Datos Personales:*`,
      `${bullet} Nombre: ${orderData.payer.name} ${orderData.payer.surname}`,  // Datos reales
      `${bullet} Teléfono: 📞 ${orderData.payer.phone || 'No proporcionado'}`,  // Datos reales
      `${bullet} Email: ✉️ ${orderData.payer.email}`,  // Datos reales
      '',
      `*Productos:*`,
    ];

    // Agregar productos REALES del carrito
    for (const item of orderData.items) {
      const product = typedProducts.find(p => p.id === parseInt(item.id));
      if (product) {
        // 🔧 CORREGIDO: Si el item tiene variant_id, usar precio de la variante
        let finalPrice: number
        if (item.variant_id && product.product_variants) {
          const variantId = parseInt(item.variant_id)
          const variant = product.product_variants.find((v: any) => v.id === variantId)
          if (variant) {
            // Priorizar price_sale si existe y es mayor a 0, sino usar price_list
            finalPrice = variant.price_sale && variant.price_sale > 0 ? variant.price_sale : (variant.price_list || 0)
          } else {
            finalPrice = getFinalPrice(product)
          }
        } else {
          finalPrice = getFinalPrice(product)
        }
        
        // Validar que finalPrice sea válido
        if (!finalPrice || finalPrice <= 0) {
          finalPrice = product.discounted_price && product.discounted_price > 0 
            ? product.discounted_price 
            : (product.price || 0)
        }
        
        const lineTotal = finalPrice * item.quantity;
        
        let productLine = `${bullet} ${product.name}`;
        
        // Agregar detalles del producto y variante si están disponibles
        const details = [];
        
        // 🔧 Agregar información de variante si está disponible
        if (item.variant_id && product.product_variants) {
          const variantId = parseInt(item.variant_id)
          const variant = product.product_variants.find((v: any) => v.id === variantId)
          if (variant) {
            if (variant.color_name) details.push(`Color: ${variant.color_name}`)
            if (variant.finish) details.push(`Terminación: ${variant.finish}`)
            if (variant.measure) details.push(`Medida: ${variant.measure}`)
          }
        }
        
        if (product.category?.name) details.push(`Categoría: ${product.category.name}`);
        if (product.brand) details.push(`Marca: ${product.brand}`);
        
        if (details.length > 0) {
          productLine += ` (${details.join(', ')})`;
        }
        
        productLine += ` x${item.quantity} - $${formatARS(lineTotal)}`;
        lines.push(productLine);
      }
    }

    // Datos de envío si están disponibles
    if (orderData.shipping?.address) {
      lines.push('', `*Datos de Envío:*`);
      lines.push(`${bullet} Dirección: 📍 ${orderData.shipping.address.street_name} ${orderData.shipping.address.street_number}`);
      lines.push(`${bullet} Ciudad: ${orderData.shipping.address.city_name}, ${orderData.shipping.address.state_name}`);
      lines.push(`${bullet} CP: ${orderData.shipping.address.zip_code}`);
    }

    lines.push('');
    lines.push(`💳 *Método de pago:* MercadoPago`);
    lines.push('', `✅ ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`);

    const message = lines.join('\n');
    const whatsappMessage = encodeURIComponent(message);
    // MULTITENANT: Usar número de WhatsApp del tenant actual
    const businessPhone = tenant.whatsappNumber || process.env.WHATSAPP_BUSINESS_NUMBER || '5493513411796';
    const whatsappLink = `https://api.whatsapp.com/send?phone=${businessPhone}&text=${whatsappMessage}`;

    console.log('[WHATSAPP] Mensaje generado con datos reales')

    // Actualizar orden con WhatsApp
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        whatsapp_notification_link: whatsappLink,
        whatsapp_message: message,  // Guardar mensaje sin codificar
        whatsapp_generated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('[WHATSAPP] Error actualizando orden con WhatsApp:', updateError)
    } else {
      console.log('[WHATSAPP] Orden actualizada exitosamente')
    }

    // ===================================
    // CREAR ITEMS DE LA ORDEN CON PRECIOS CORRECTOS (INCLUYENDO VARIANTES)
    // ===================================
    const orderItems = orderData.items.map(item => {
      const product = typedProducts.find(p => p.id === parseInt(item.id))
      if (!product) {
        throw new Error(`Producto ${item.id} no encontrado`)
      }

      // 🔧 CORREGIDO: Si el item tiene variant_id, usar precio de la variante
      let finalPrice: number
      if (item.variant_id && product.product_variants) {
        const variantId = parseInt(item.variant_id)
        const variant = product.product_variants.find((v: any) => v.id === variantId)
        if (variant) {
          // Priorizar price_sale si existe y es mayor a 0, sino usar price_list
          finalPrice = variant.price_sale && variant.price_sale > 0 ? variant.price_sale : (variant.price_list || 0)
        } else {
          // Fallback al precio del producto si no se encuentra la variante
          finalPrice = getFinalPrice(product)
        }
      } else {
        // Si no tiene variant_id, usar precio del producto padre
        finalPrice = getFinalPrice(product)
      }

      // Validar que finalPrice sea válido
      if (!finalPrice || finalPrice <= 0) {
        console.error(`⚠️ Precio inválido para producto ${product.name} en order_items:`, {
          finalPrice,
          variant_id: item.variant_id,
          product_id: product.id,
          product_price: product.price,
          product_discounted_price: product.discounted_price
        })
        // Usar precio del producto como último recurso
        finalPrice = product.discounted_price && product.discounted_price > 0 
          ? product.discounted_price 
          : (product.price || 0)
      }

      const itemTotal = finalPrice * item.quantity

      // 🔧 Preparar product_snapshot con información de variante
      // Obtener imagen del producto (desde product_images o product.images JSONB)
      const productImagesList = imagesByProductId[product.id] || []
      let productImage: string | null = null
      
      // Prioridad 1: Imagen desde product_images
      if (productImagesList.length > 0) {
        productImage = productImagesList[0].url || null
      }
      
      // Prioridad 2: Imagen desde campo images JSONB del producto (si existe)
      if (!productImage && product.images) {
        if (typeof product.images === 'string') {
          try {
            const parsed = JSON.parse(product.images)
            productImage = Array.isArray(parsed) ? parsed[0] : (parsed?.url || parsed?.main || parsed?.previews?.[0] || null)
          } catch {
            productImage = product.images
          }
        } else if (Array.isArray(product.images)) {
          productImage = product.images[0] || null
        } else if (typeof product.images === 'object') {
          productImage = product.images.url || product.images.main || product.images.previews?.[0] || null
        }
      }

      const productSnapshot: any = {
        name: product.name,
        price: finalPrice,
        category: product.category?.name || null,
        image: productImage, // Imagen base desde product_images o product.images
      }

      // Incluir información de variante si está disponible
      if (item.variant_id && product.product_variants) {
        const variantId = parseInt(item.variant_id)
        const variant = product.product_variants.find((v: any) => v.id === variantId)
        if (variant) {
          if (variant.color_name) productSnapshot.color = variant.color_name
          if (variant.color_hex) productSnapshot.color_hex = variant.color_hex
          if (variant.finish) productSnapshot.finish = variant.finish
          if (variant.measure) productSnapshot.medida = variant.measure
          // Priorizar imagen de la variante si existe
          if (variant.image_url) productSnapshot.image = variant.image_url
        }
      }
      if (product.brand) productSnapshot.brand = product.brand

      // Guardar variant_id en product_snapshot para referencia histórica
      if (item.variant_id) {
        productSnapshot.variant_id = parseInt(item.variant_id)
      }

      return {
        order_id: order.id,
        product_id: parseInt(item.id),
        variant_id: item.variant_id ? parseInt(item.variant_id) : null,
        product_name: product.name,
        product_sku: null, // MercadoPago no tiene SKU, usar null
        quantity: item.quantity,
        price: finalPrice,
        unit_price: finalPrice,
        total_price: itemTotal,
        product_snapshot: productSnapshot,
        tenant_id: tenant.id // ⚡ MULTITENANT: Asignar tenant_id
      }
    })

    // Validar que ningún item tenga precio 0
    const invalidItems = orderItems.filter(item => !item.price || item.price <= 0 || !item.unit_price || item.unit_price <= 0 || !item.total_price || item.total_price <= 0)
    if (invalidItems.length > 0) {
      console.error('[ORDER_ITEMS] Items con precios inválidos detectados:', invalidItems)
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: `Error: ${invalidItems.length} item(s) con precio inválido (0 o menor). Verifique que los productos tengan precio o que las variantes seleccionadas tengan precio válido.`,
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Log detallado de los items a insertar
    console.log('[ORDER_ITEMS] Preparando inserción:', {
      orderItemsCount: orderItems.length,
      orderId: order.id,
      items: orderItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }))
    })

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems)

    if (itemsError) {
      console.error('[ORDER_ITEMS] Error detallado:', {
        error: itemsError,
        message: itemsError.message,
        code: itemsError.code,
        details: itemsError.details,
        hint: itemsError.hint,
        orderItemsAttempted: orderItems,
        orderId: order.id
      })
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
    // CONVERTIR ITEMS PARA MERCADOPAGO CON ENVÍO INCLUIDO
    // ===================================
    // Distribuir el costo de envío proporcionalmente entre los productos
    const mercadoPagoItems: MercadoPagoItem[] = typedProducts.map(product => {
      const orderItem = orderData.items.find(item => item.id === product.id.toString())
      if (!orderItem) {
        throw new Error(`Order item not found for product ${product.id}`)
      }

      // 🔧 CORREGIDO: Si el item tiene variant_id, usar precio de la variante
      let finalPrice: number
      let variantDetails: string[] = []
      
      if (orderItem.variant_id && product.product_variants) {
        const variantId = parseInt(orderItem.variant_id)
        const variant = product.product_variants.find((v: any) => v.id === variantId)
        if (variant) {
          // Priorizar price_sale si existe y es mayor a 0, sino usar price_list
          finalPrice = variant.price_sale && variant.price_sale > 0 ? variant.price_sale : (variant.price_list || 0)
          // Agregar detalles de variante
          if (variant.color_name) variantDetails.push(`Color: ${variant.color_name}`)
          if (variant.finish) variantDetails.push(`Terminación: ${variant.finish}`)
          if (variant.measure) variantDetails.push(`Medida: ${variant.measure}`)
        } else {
          finalPrice = getFinalPrice(product)
        }
      } else {
        finalPrice = getFinalPrice(product)
      }

      // Validar que finalPrice sea válido
      if (!finalPrice || finalPrice <= 0) {
        console.error(`⚠️ Precio inválido para producto ${product.name} en MercadoPago items:`, {
          finalPrice,
          variant_id: orderItem.variant_id,
          product_id: product.id
        })
        finalPrice = product.discounted_price && product.discounted_price > 0 
          ? product.discounted_price 
          : (product.price || 0)
      }

      const itemSubtotal = finalPrice * orderItem.quantity
      
      // Calcular porción del envío que corresponde a este producto
      const shippingPortion = itemsTotal > 0 ? (itemSubtotal / itemsTotal) * shippingCost : 0
      const adjustedPrice = finalPrice + (shippingPortion / orderItem.quantity)

      // 🔧 Construir título y descripción con información de variante
      let productTitle = product.name
      let productDescription = `Pinteya - ${product.name}`
      
      if (variantDetails.length > 0) {
        productTitle += ` (${variantDetails.join(', ')})`
        productDescription += ` - ${variantDetails.join(', ')}`
      }
      
      if (product.category?.name) productDescription += ` (${product.category.name})`
      if (product.brand) productDescription += ` - Marca: ${product.brand}`
      productDescription += ` - Cantidad: ${orderItem.quantity}`

      return {
        id: product.id.toString(),
        title: productTitle,
        // ✅ MEJORAR: Descripción más descriptiva que incluya variante, cantidad y categoría
        description: productDescription,
        picture_url: product.images?.previews?.[0] || '',
        category_id: product.category?.slug || 'general',
        quantity: orderItem.quantity,
        currency_id: 'ARS',
        unit_price: Math.round(adjustedPrice * 100) / 100, // Precio con envío incluido
      }
    })

    // ✅ CORREGIR: Ajustar el último producto para que el total coincida exactamente
    // Esto corrige cualquier diferencia de redondeo al distribuir el envío proporcionalmente
    const mercadoPagoTotal = mercadoPagoItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
    const difference = totalAmount - mercadoPagoTotal
    
    if (Math.abs(difference) > 0.01 && mercadoPagoItems.length > 0) {
      // Ajustar el último producto para compensar la diferencia
      const lastItem = mercadoPagoItems[mercadoPagoItems.length - 1]
      const adjustment = difference / lastItem.quantity
      lastItem.unit_price = Math.round((lastItem.unit_price + adjustment) * 100) / 100
      
      console.log('[MERCADOPAGO] Ajuste de total aplicado:', {
        diferenciaOriginal: difference,
        ajustePorUnidad: adjustment,
        nuevoPrecioUnitario: lastItem.unit_price,
        nuevoTotal: mercadoPagoItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
        totalEsperado: totalAmount
      })
    }

    // ✅ DEBUG: Verificar que el total coincida exactamente
    const finalMercadoPagoTotal = mercadoPagoItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
    console.log('[MERCADOPAGO] Verificación de totales:', {
      frontendTotal: totalAmount,
      mercadoPagoTotal: finalMercadoPagoTotal,
      diferencia: Math.abs(totalAmount - finalMercadoPagoTotal),
      items: mercadoPagoItems.map(item => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity
      }))
    })

    // ✅ NUEVO: No enviar shipments para que el envío no aparezca como ítem separado
    // El costo de envío ya está incluido en el precio de cada producto

    // ✅ DEBUG: Logging detallado de URLs de retorno
    const backUrls = {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/mercadopago-success?order_id=${order.id}`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure?order_id=${order.id}`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending?order_id=${order.id}`,
    }
    
    console.log('[MERCADOPAGO] URLs de retorno configuradas:', {
      orderId: order.id,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      backUrls,
      externalReference: order.id.toString()
    })

    // ✅ MEJORADO: Usar nueva función con configuración avanzada y credenciales del tenant
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
      back_urls: backUrls,
      external_reference: order.external_reference || orderNumber || order.id.toString(),
      // ✅ NUEVO: No enviar shipments para que el envío no aparezca como ítem separado
      // shipments: undefined // Comentado intencionalmente
    }, tenant.mercadopagoAccessToken)

    // ✅ MEJORADO: Manejar resultado de la nueva función
    if (!preferenceResult.success) {
      throw new Error(
        'error' in preferenceResult ? preferenceResult.error : 'Error creando preferencia de pago'
      )
    }

    // Actualizar orden con ID de preferencia
    const preferenceData = 'data' in preferenceResult ? preferenceResult.data : null
    const { error: preferenceUpdateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_preference_id: preferenceData?.id,
      })
      .eq('id', order.id)

    if (preferenceUpdateError) {
      logger.warn(
        LogCategory.PAYMENT,
        'Failed to update order with preference ID',
        { preferenceUpdateError },
        { clientIP }
      )
    }

    // ✅ NUEVO: Generar WhatsApp link al crear la orden (similar a pago al recibir)
    try {
      const tenantName = tenant?.name || 'Pinteya'
      const whatsappMessage = generateMercadoPagoWhatsAppMessage(order, orderData, typedProducts, tenantName)
      // MULTITENANT: Usar número de WhatsApp del tenant actual
      const businessPhone = tenant.whatsappNumber || process.env.WHATSAPP_BUSINESS_NUMBER || '5493513411796'
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${businessPhone}&text=${encodeURIComponent(whatsappMessage)}`
      
      console.log('[WHATSAPP] Generando link de WhatsApp:', {
        orderId: order.id,
        businessPhone,
        messageLength: whatsappMessage.length,
        whatsappUrl: whatsappUrl.substring(0, 100) + '...'
      })
      
      // Actualizar orden con whatsapp link
      const { error: whatsappUpdateError } = await supabaseAdmin
        .from('orders')
        .update({
          whatsapp_notification_link: whatsappUrl,
          whatsapp_generated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (whatsappUpdateError) {
        console.error('[WHATSAPP] Error actualizando orden con WhatsApp link:', whatsappUpdateError)
        // No fallar la request por error en WhatsApp
      } else {
        console.log('[WHATSAPP] WhatsApp link guardado exitosamente en la orden')
      }
    } catch (whatsappError) {
      console.error('[WHATSAPP] Error generando WhatsApp link:', whatsappError)
      // No fallar la request por error en WhatsApp
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
