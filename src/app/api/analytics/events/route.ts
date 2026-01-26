// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route para recibir eventos de analytics
 * Optimizado para procesamiento asíncrono y cache
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { metricsCache } from '@/lib/analytics/metrics-cache'
import { getTenantConfig } from '@/lib/tenant'

// Cache simple en memoria para eventos recientes (evita duplicados)
const eventCache = new Map<string, number>()
const CACHE_TTL = 5000 // 5 segundos

export async function POST(request: NextRequest) {
  try {
    // ===================================
    // MULTITENANT: Obtener configuración del tenant
    // ===================================
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    const event = await request.json()

    // Validación rápida y simple
    if (!event.event || !event.category || !event.action) {
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
    setImmediate(async () => {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          console.error('Error: Supabase client no disponible')
          return
        }

        // Extraer datos de producto del metadata
        const metadata = event.metadata || {}
        const productId = metadata.productId || metadata.item_id
        const productName = metadata.productName || metadata.item_name
        // Usar category del metadata como categoría del PRODUCTO (no del evento)
        const productCategory = metadata.category || metadata.category_name
        const price = metadata.price || event.value
        const quantity = metadata.quantity || 1
        const deviceType = metadata.deviceType
        
        // Extraer visitorHash para tracking de usuarios recurrentes
        const visitorHash = event.visitorHash || metadata.visitorHash || null
        
        // Mejorar vinculación de userId: priorizar el que viene directamente, luego del metadata
        const userId = event.userId || metadata.userId || null

        // Construir metadata enriquecido con visitorHash y timestamp
        const enrichedMetadata = {
          ...metadata,
          visitorHash,
          timestamp: Date.now(),
        }

        // Usar función RPC optimizada para insertar en tabla optimizada
        // MULTITENANT: Incluir tenant_id si la función RPC lo soporta
        const { error: rpcError } = await supabase.rpc('insert_analytics_event_optimized', {
          p_event_name: event.event,
          p_category: event.category,
          p_action: event.action,
          p_label: event.label || null,
          p_value: event.value || null,
          p_user_id: userId,
          p_session_id: event.sessionId,
          p_page: event.page || null,
          p_user_agent: event.userAgent || null,
          // Datos de producto
          p_product_id: productId && !isNaN(Number(productId)) ? parseInt(String(productId), 10) : null,
          p_product_name: productName || null,
          p_category_name: productCategory || null,
          p_price: price && !isNaN(Number(price)) ? parseFloat(String(price)) : null,
          p_quantity: quantity && !isNaN(Number(quantity)) ? parseInt(String(quantity), 10) : null,
          p_device_type: deviceType || null,
          // Metadata enriquecido con visitorHash (se guarda comprimido)
          p_metadata: enrichedMetadata,
          // MULTITENANT: Incluir tenant_id
          p_tenant_id: tenantId,
        })

        if (rpcError) {
          console.error('Error insertando evento analytics (RPC):', rpcError)
        } else {
          // Invalidar cache de métricas al insertar nuevo evento (fire-and-forget para no bloquear)
          metricsCache.invalidatePattern('analytics:*').catch(error => {
            console.warn('Error invalidando cache (no crítico):', error)
          })
        }
      } catch (error) {
        console.error('Error procesando evento analytics (async):', error)
      }
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

export async function GET(request: NextRequest) {
  try {
    // ===================================
    // MULTITENANT: Obtener configuración del tenant
    // ===================================
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Servicio de base de datos no disponible' }, { status: 503 })
    }

    // Usar tabla optimizada directamente (vista unificada eliminada)
    // MULTITENANT: Filtrar por tenant_id
    let query = supabase
      .from('analytics_events_optimized')
      .select(`
        id,
        event_type,
        category_id,
        action_id,
        label,
        value,
        user_id,
        session_hash,
        visitor_hash,
        page_id,
        browser_id,
        created_at,
        analytics_event_types(name),
        analytics_categories(name),
        analytics_actions(name),
        analytics_pages(path),
        analytics_browsers(name, version)
      `)
      .eq('tenant_id', tenantId) // MULTITENANT: Filtrar por tenant
      .order('created_at', { ascending: false })
      .limit(limit)

    if (sessionId) {
      // Para session_id, necesitamos hacer hash (simplificado por ahora)
      // En producción, esto debería usar la misma función de hash que la BD
      query = query.eq('session_hash', parseInt(sessionId) || 0)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (startDate) {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
      query = query.gte('created_at', startTimestamp)
    }

    if (endDate) {
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)
      query = query.lte('created_at', endTimestamp)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo eventos:', error)
      return NextResponse.json({ error: 'Error obteniendo eventos' }, { status: 500 })
    }

    return NextResponse.json({ events: data })
  } catch (error) {
    console.error('Error procesando solicitud:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
