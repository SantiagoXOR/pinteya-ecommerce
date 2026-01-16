// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route alternativa para recibir eventos de analytics
 * Endpoint sin "analytics" en la URL para evitar bloqueadores
 * Usa la tabla optimizada directamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase/index'

interface TrackEvent {
  event: string
  category: string
  action: string
  label?: string
  value?: number
  userId?: string
  sessionId: string
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

// Cache simple en memoria para eventos recientes (evita duplicados)
const eventCache = new Map<string, number>()
const CACHE_TTL = 5000 // 5 segundos

export async function POST(request: NextRequest) {
  try {
    const event: TrackEvent = await request.json()

    if (process.env.NODE_ENV === 'development') {
      console.log('[API /api/track/events] Evento recibido:', {
        event: event.event,
        category: event.category,
        action: event.action,
        label: event.label,
        sessionId: event.sessionId,
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

    // Cache key para evitar eventos duplicados
    const cacheKey = `${event.event}-${event.category}-${event.action}-${event.sessionId}`
    const now = Date.now()

    // Verificar cache para evitar duplicados recientes
    if (eventCache.has(cacheKey)) {
      const lastTime = eventCache.get(cacheKey)!
      if (now - lastTime < CACHE_TTL) {
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
        const supabase = getSupabaseClient()
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
        const productId = event.productId || event.metadata?.productId || event.metadata?.item_id
        const productName = event.productName || event.metadata?.productName || event.metadata?.item_name
        const categoryName = event.category_name || event.category || event.metadata?.category || event.metadata?.category_name
        const price = event.price || event.metadata?.price || event.value
        const quantity = event.quantity || event.metadata?.quantity || 1

        // Extraer metadata de elementos
        const elementSelector = event.elementSelector || event.metadata?.elementSelector
        const elementX = event.elementPosition?.x || event.metadata?.elementPosition?.x
        const elementY = event.elementPosition?.y || event.metadata?.elementPosition?.y
        const elementWidth = event.elementDimensions?.width || event.metadata?.elementDimensions?.width
        const elementHeight = event.elementDimensions?.height || event.metadata?.elementDimensions?.height
        const deviceType = event.deviceType || event.metadata?.deviceType

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

        // Usar función RPC optimizada para insertar en tabla optimizada
        const { error: rpcError, data: rpcData } = await supabase.rpc('insert_analytics_event_optimized', {
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
          p_product_id: productId ? parseInt(String(productId)) : null,
          p_product_name: productName || null,
          p_category_name: categoryName || null,
          p_price: price ? parseFloat(String(price)) : null,
          p_quantity: quantity ? parseInt(String(quantity)) : null,
          // Metadata de elementos
          p_element_selector: elementSelector || null,
          p_element_x: elementX ? parseInt(String(elementX)) : null,
          p_element_y: elementY ? parseInt(String(elementY)) : null,
          p_element_width: elementWidth ? parseInt(String(elementWidth)) : null,
          p_element_height: elementHeight ? parseInt(String(elementHeight)) : null,
          p_device_type: deviceType || null,
          // Metadata adicional (se comprimirá)
          p_metadata: Object.keys(additionalMetadata).length > 0 ? additionalMetadata : null,
        })

        if (rpcError) {
          console.error('[API /api/track/events] ❌ Error insertando evento analytics (RPC):', {
            error: rpcError,
            code: rpcError.code,
            message: rpcError.message,
            details: rpcError.details,
            hint: rpcError.hint,
            event: event.event,
            category: event.category,
            action: event.action,
          })
        } else {
          console.log('[API /api/track/events] ✅ Evento insertado exitosamente:', {
            eventId: rpcData,
            event: event.event,
            category: event.category,
            action: event.action,
          })
          // Invalidar cache de métricas (fire-and-forget para no bloquear)
          // No importa si falla, el evento ya está insertado
        }
      } catch (error: any) {
        console.error('[API /api/track/events] ❌ Error procesando evento analytics (async):', {
          error: error?.message || error,
          stack: error?.stack,
          event: event.event,
          category: event.category,
          action: event.action,
        })
      }
    }).catch(error => {
      console.error('[API /api/track/events] ❌ Error crítico en Promise:', error)
    })

    // Respuesta inmediata
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error procesando evento:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
