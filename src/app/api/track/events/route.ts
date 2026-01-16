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
}

// Cache simple en memoria para eventos recientes (evita duplicados)
const eventCache = new Map<string, number>()
const CACHE_TTL = 5000 // 5 segundos

export async function POST(request: NextRequest) {
  try {
    const event: TrackEvent = await request.json()

    // Validación rápida y simple
    if (!event.event || !event.category || !event.action || !event.sessionId) {
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

        // Usar función RPC optimizada para insertar en tabla optimizada
        const { error: rpcError } = await supabase.rpc('insert_analytics_event_optimized', {
          p_event_name: event.event,
          p_category: event.category,
          p_action: event.action,
          p_label: event.label || null,
          p_value: event.value || null,
          p_user_id: event.userId || null,
          p_session_id: event.sessionId,
          p_page: event.page || null,
          p_user_agent: event.userAgent || null,
        })

        if (rpcError) {
          console.error('Error insertando evento analytics (RPC):', rpcError)
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
