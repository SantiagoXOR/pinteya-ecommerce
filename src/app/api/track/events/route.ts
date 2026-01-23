// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route alternativa para recibir eventos de analytics
 * Endpoint sin "analytics" en la URL para evitar bloqueadores
 * Usa la tabla optimizada directamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase/index'
import { withTimeout, API_TIMEOUTS } from '@/lib/config/api-timeouts'
// MULTITENANT: Rate limiting por tenant
import { checkRateLimit, addRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/enterprise/rate-limiter'
import { getTenantConfig } from '@/lib/tenant/tenant-service'

interface TrackEvent {
  event: string
  category: string
  action: string
  label?: string
  value?: number
  userId?: string
  sessionId: string
  visitorId?: string // ID persistente para usuarios anónimos recurrentes
  page: string
  userAgent?: string
  metadata?: Record<string, any>
  // Metadata de productos
  productId?: number | string
  productName?: string
  category?: string
  category_name?: string
  price?: number
  quantity?: number
  // Metadata de elementos
  elementSelector?: string
  elementPosition?: { x: number; y: number }
  elementDimensions?: { width: number; height: number }
  deviceType?: string
}

// MULTITENANT: Cache simple en memoria para eventos recientes (evita duplicados)
// Clave: tenant_id:event_type:session_id:timestamp
const eventCache = new Map<string, number>()
const CACHE_TTL = 30000 // MULTITENANT: 30 segundos (aumentado para multitenant)

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const MAX_REQUEST_TIME = 5000 // MULTITENANT: 5 segundos máximo por request

  try {
    const event: TrackEvent = await request.json()

    // MULTITENANT: Obtener tenant_id desde headers o del evento
    let tenantId: string | null = null
    try {
      const tenant = await getTenantConfig()
      tenantId = tenant.id
    } catch (error) {
      // Si falla obtener tenant, intentar desde headers
      tenantId = request.headers.get('x-tenant-id') || event.metadata?.tenantId || null
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'track/events/route.ts:POST',message:'Evento recibido en API',data:{event:event.event,visitorId:event.visitorId,metadataVisitorId:event.metadata?.visitorId,tenantId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3-API'})}).catch(()=>{});
    // #endregion

    if (process.env.NODE_ENV === 'development') {
      console.log('[API /api/track/events] Evento recibido:', {
        event: event.event,
        category: event.category,
        action: event.action,
        label: event.label,
        sessionId: event.sessionId,
        visitorId: event.visitorId,
        tenantId, // MULTITENANT: Incluir tenant_id en logs
      })
    }

    // Validación rápida y simple
    if (!event.event || !event.category || !event.action || !event.sessionId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[API /api/track/events] Evento inválido:', event)
      }
      return NextResponse.json(
        { error: 'Evento inválido: faltan campos requeridos' },
        { status: 400 }
      )
    }

    // MULTITENANT: Rate limiting por tenant_id + IP
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = tenantId ? `tenant:${tenantId}:ip:${clientIP}` : `ip:${clientIP}`
    
    const rateLimitConfig = {
      ...RATE_LIMIT_CONFIGS.GENERAL_IP,
      maxRequests: 10, // MULTITENANT: 10 req/s por tenant (según plan)
      windowMs: 1000, // 1 segundo
      keyGenerator: () => rateLimitKey,
      message: 'Demasiadas solicitudes de tracking. Intenta nuevamente en un segundo.',
    }

    const rateLimitResult = await checkRateLimit(request, rateLimitConfig)
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: rateLimitConfig.message,
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      )
      addRateLimitHeaders(response, rateLimitResult, rateLimitConfig)
      return response
    }

    // MULTITENANT: Cache key incluye tenant_id para evitar duplicados
    // Clave: tenant_id:event_type:session_id:timestamp
    const timestampRounded = Math.floor(Date.now() / 1000) * 1000
    const cacheKey = `${tenantId || 'unknown'}:${event.event}:${event.category}:${event.action}:${event.sessionId}:${timestampRounded}`
    const now = Date.now()

    // Verificar cache para evitar duplicados recientes
    if (eventCache.has(cacheKey)) {
      const lastTime = eventCache.get(cacheKey)!
      if (now - lastTime < CACHE_TTL) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[API /api/track/events] ⚠️ Evento duplicado detectado y rechazado:', {
            event: event.event,
            category: event.category,
            action: event.action,
            sessionId: event.sessionId,
            timeSinceLast: now - lastTime,
          })
        }
        return NextResponse.json({ success: true, cached: true })
      }
    }

    // Actualizar cache
    eventCache.set(cacheKey, now)

    // Limpiar cache viejo periódicamente
    if (eventCache.size > 1000) {
      const cutoff = now - CACHE_TTL
      for (const [key, time] of eventCache.entries()) {
        if (time < cutoff) {
          eventCache.delete(key)
        }
      }
    }

    // Procesar evento de forma asíncrona usando función RPC optimizada
    // Usar Promise para asegurar que se ejecute incluso si setImmediate falla
    Promise.resolve().then(async () => {
      try {
        // Usar cliente admin para operaciones del servidor (más confiable en Vercel)
        const supabase = getSupabaseClient(true)
        if (!supabase) {
          console.error('[API /api/track/events] ❌ Supabase client no disponible')
          return
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('[API /api/track/events] 🔄 Insertando evento en BD...', {
            event: event.event,
            category: event.category,
            action: event.action,
          })
        }

        // Extraer metadata de productos del metadata o campos directos
        // Intentar obtener productId de múltiples fuentes, incluyendo label
        let productId = event.productId || event.metadata?.productId || event.metadata?.item_id
        
        // Si no hay productId pero hay label con formato de ID, intentar extraerlo
        if (!productId && event.label) {
          // Intentar extraer número del label (ej: "product-123" -> 123)
          const labelMatch = event.label.match(/(\d+)/)
          if (labelMatch) {
            productId = labelMatch[1]
          } else if (!isNaN(Number(event.label))) {
            productId = event.label
          }
        }
        
        const productName = event.productName || event.metadata?.productName || event.metadata?.item_name
        // Priorizar categoría del PRODUCTO (en metadata) sobre categoría del EVENTO
        const categoryName = event.metadata?.category || event.metadata?.category_name || event.category_name
        const price = event.price || event.metadata?.price || event.value
        const quantity = event.quantity || event.metadata?.quantity || 1

        // Extraer metadata de elementos
        // Asegurar que si hay elementSelector, también haya coordenadas
        const elementSelector = event.elementSelector || event.metadata?.elementSelector
        let elementX = event.elementPosition?.x || event.metadata?.elementPosition?.x
        let elementY = event.elementPosition?.y || event.metadata?.elementPosition?.y
        const elementWidth = event.elementDimensions?.width || event.metadata?.elementDimensions?.width
        const elementHeight = event.elementDimensions?.height || event.metadata?.elementDimensions?.height
        const deviceType = event.deviceType || event.metadata?.deviceType
        
        // Si hay elementSelector pero no coordenadas, usar 0 como fallback
        if (elementSelector && (elementX === undefined || elementY === undefined)) {
          elementX = elementX || 0
          elementY = elementY || 0
        }

        // Preparar metadata adicional (excluyendo campos que ya se guardan por separado)
        const additionalMetadata: Record<string, any> = {}
        if (event.metadata) {
          Object.keys(event.metadata).forEach(key => {
            // Excluir campos que ya se guardan en columnas separadas
            if (!['productId', 'productName', 'category', 'category_name', 'price', 'quantity',
                  'elementSelector', 'elementPosition', 'elementDimensions', 'deviceType',
                  'item_id', 'item_name'].includes(key)) {
              additionalMetadata[key] = event.metadata![key]
            }
          })
        }

        // Preparar parámetros RPC
        const rpcParams = {
          p_event_name: event.event,
          p_category: event.category,
          p_action: event.action,
          p_label: event.label || null,
          p_value: event.value || null,
          p_user_id: event.userId || null,
          p_session_id: event.sessionId,
          p_page: event.page || null,
          p_user_agent: event.userAgent || null,
          // Metadata de productos
          p_product_id: productId && !isNaN(Number(productId)) ? parseInt(String(productId), 10) : null,
          p_product_name: productName || null,
          p_category_name: categoryName || null,
          p_price: price && !isNaN(Number(price)) ? parseFloat(String(price)) : null,
          p_quantity: quantity && !isNaN(Number(quantity)) ? parseInt(String(quantity), 10) : null,
          // Metadata de elementos
          p_element_selector: elementSelector || null,
          p_element_x: elementX ? parseInt(String(elementX)) : null,
          p_element_y: elementY ? parseInt(String(elementY)) : null,
          p_element_width: elementWidth ? parseInt(String(elementWidth)) : null,
          p_element_height: elementHeight ? parseInt(String(elementHeight)) : null,
          p_device_type: deviceType || null,
          // Metadata adicional (se comprimirá)
          p_metadata: Object.keys(additionalMetadata).length > 0 ? additionalMetadata : null,
          // Visitor ID persistente para usuarios anónimos recurrentes
          p_visitor_id: event.visitorId || event.metadata?.visitorId || null,
          // MULTITENANT: Incluir tenant_id si la función RPC lo soporta
          // Nota: Esto requiere que la función RPC acepte p_tenant_id
          // Si no está disponible, se puede agregar en metadata
          p_tenant_id: tenantId || null,
        }

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'track/events/route.ts:rpcParams',message:'RPC params preparados',data:{p_event_name:rpcParams.p_event_name,p_visitor_id:rpcParams.p_visitor_id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4-RPC'})}).catch(()=>{});
        // #endregion

        // Función para intentar insertar el evento con reintentos
        const insertEventWithRetry = async (maxRetries = 3): Promise<void> => {
          let lastError: any = null
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              // Usar timeout específico para operaciones de escritura en Supabase
              const { error: rpcError, data: rpcData } = await withTimeout(
                () => supabase.rpc('insert_analytics_event_optimized', rpcParams),
                API_TIMEOUTS.supabase.write
              )

              if (rpcError) {
                // Si es un error de red, intentar de nuevo
                if (
                  rpcError.message?.includes('fetch failed') ||
                  rpcError.message?.includes('network') ||
                  rpcError.message?.includes('ECONNREFUSED') ||
                  rpcError.message?.includes('ETIMEDOUT') ||
                  rpcError.message?.includes('ENOTFOUND')
                ) {
                  lastError = rpcError
                  if (attempt < maxRetries) {
                    const delay = Math.min(1000 * attempt, 3000) // Backoff exponencial, max 3s
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                  }
                }
                
                // Error que no es de red, no reintentar
                console.error('[API /api/track/events] ❌ Error insertando evento analytics (RPC):', {
                  error: rpcError,
                  code: rpcError.code,
                  message: rpcError.message,
                  details: rpcError.details,
                  hint: rpcError.hint,
                  event: event.event,
                  category: event.category,
                  action: event.action,
                  attempt,
                })
                return
              }

              // Éxito
              if (process.env.NODE_ENV === 'development' || attempt > 1) {
                console.log('[API /api/track/events] ✅ Evento insertado exitosamente:', {
                  eventId: rpcData,
                  event: event.event,
                  category: event.category,
                  action: event.action,
                  attempt,
                })
              }
              return
            } catch (error: any) {
              lastError = error
              
              // Verificar si es un error de red que justifica reintento
              const isNetworkError = 
                error?.message?.includes('fetch failed') ||
                error?.message?.includes('TypeError: fetch failed') ||
                error?.name === 'TypeError' ||
                error?.code === 'ECONNREFUSED' ||
                error?.code === 'ETIMEDOUT' ||
                error?.code === 'ENOTFOUND'

              if (isNetworkError && attempt < maxRetries) {
                const delay = Math.min(1000 * attempt, 3000) // Backoff exponencial, max 3s
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
              }
              
              // No es un error de red o se agotaron los reintentos
              throw error
            }
          }
          
          // Si llegamos aquí, todos los reintentos fallaron
          throw lastError
        }

        // Intentar insertar con reintentos
        await insertEventWithRetry()
      } catch (error: any) {
        // Log detallado del error para debugging
        const errorDetails = {
          error: error?.message || String(error),
          stack: error?.stack,
          name: error?.name,
          code: error?.code,
          event: event.event,
          category: event.category,
          action: event.action,
        }
        
        // Solo loguear errores críticos en producción para no saturar logs
        if (process.env.NODE_ENV === 'development' || error?.message?.includes('fetch failed')) {
          console.error('[API /api/track/events] ❌ Error procesando evento analytics (async):', errorDetails)
        }
      }
    }).catch(error => {
      console.error('[API /api/track/events] ❌ Error crítico en Promise:', error)
    })

    // MULTITENANT: Respuesta inmediata 202 (Accepted) para procesamiento asíncrono
    const response = NextResponse.json(
      { success: true, tenantId }, // MULTITENANT: Incluir tenant_id en respuesta
      {
        status: 202, // MULTITENANT: 202 Accepted para procesamiento asíncrono
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
    
    // MULTITENANT: Agregar headers de rate limiting
    addRateLimitHeaders(response, rateLimitResult, rateLimitConfig)
    
    return response
  } catch (error) {
    console.error('Error procesando evento:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
