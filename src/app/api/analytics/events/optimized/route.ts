// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API OPTIMIZADA PARA ANALYTICS - PINTEYA E-COMMERCE
 * Procesamiento en lotes con inserción masiva optimizada
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { metricsCache } from '@/lib/analytics/metrics-cache'

interface OptimizedAnalyticsEvent {
  event: string
  category: string
  action: string
  label?: string
  value?: number
  userId?: string
  sessionId: string
  page: string
  userAgent?: string
  tenantId?: string // MULTITENANT: ID del tenant
}

interface AnalyticsBatch {
  events: OptimizedAnalyticsEvent[]
  timestamp: number
  compressed: boolean
  tenantId?: string // MULTITENANT: ID del tenant para el batch
}

/**
 * POST /api/analytics/events/optimized
 * Procesar lotes de eventos de analytics de forma optimizada (MULTITENANT)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const MAX_REQUEST_TIME = 5000 // 5 segundos máximo

  try {
    const batch: AnalyticsBatch = await request.json()

    if (!batch.events || !Array.isArray(batch.events) || batch.events.length === 0) {
      return NextResponse.json({ error: 'Batch de eventos inválido' }, { status: 400 })
    }

    // Limitar tamaño del batch para evitar timeouts
    if (batch.events.length > 100) {
      return NextResponse.json(
        { error: 'Batch demasiado grande (máximo 100 eventos)' },
        { status: 400 }
      )
    }

    // MULTITENANT: Obtener tenant_id del batch o headers
    const tenantId = batch.tenantId || request.headers.get('x-tenant-id') || null

    // MULTITENANT: Verificar que todos los eventos tengan tenant_id
    const eventsWithTenant = batch.events.map(event => ({
      ...event,
      tenantId: event.tenantId || tenantId || 'unknown',
    }))

    // Usar cliente admin (service_role) para que el RPC pueda insertar con cualquier tenant_id;
    // con anon, RLS exige get_current_tenant_id() y los inserts en background fallan silenciosamente.
    const supabase = getSupabaseClient(true)
    if (!supabase) {
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      )
    }

    // MULTITENANT: Procesar eventos de forma asíncrona para respuesta rápida
    // Retornar 202 (Accepted) inmediatamente, procesar en background
    setImmediate(async () => {
      try {
        await processEventsBatch(eventsWithTenant, supabase, tenantId)
        // MULTITENANT: Invalidar cache de métricas solo del tenant afectado
        if (tenantId) {
          await metricsCache.invalidatePattern(`analytics:tenant:${tenantId}:*`)
        } else {
          // Fallback: invalidar todo si no hay tenant_id
          await metricsCache.invalidatePattern('analytics:*')
        }
      } catch (error) {
        console.error('[Analytics Batch] Error en background:', error instanceof Error ? error.message : error)
        if (error instanceof Error && error.stack) {
          console.error('[Analytics Batch] Stack:', error.stack)
        }
      }
    })

    // Respuesta inmediata (202 Accepted)
    return NextResponse.json(
      {
        success: true,
        processed: batch.events.length,
        tenantId, // MULTITENANT: Incluir tenant_id en respuesta
        timestamp: Date.now(),
      },
      {
        status: 202, // MULTITENANT: 202 Accepted para procesamiento asíncrono
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error en API de analytics optimizada:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * MULTITENANT: Procesar batch de eventos usando función optimizada de Supabase
 * Incluye tenant_id en cada evento antes de insertar
 */
async function processEventsBatch(
  events: OptimizedAnalyticsEvent[],
  supabase: any,
  tenantId: string | null
) {
  try {
    // MULTITENANT: Agrupar eventos por tenant_id para procesamiento paralelo
    const eventsByTenant = new Map<string, OptimizedAnalyticsEvent[]>()

    for (const event of events) {
      const eventTenantId = event.tenantId || tenantId || 'unknown'
      if (!eventsByTenant.has(eventTenantId)) {
        eventsByTenant.set(eventTenantId, [])
      }
      eventsByTenant.get(eventTenantId)!.push(event)
    }

    // MULTITENANT: Procesar batches por tenant en paralelo (con límite de concurrencia)
    const tenantPromises = Array.from(eventsByTenant.entries()).map(([tid, tenantEvents]) =>
      processTenantBatch(tenantEvents, supabase, tid)
    )

    // Ejecutar con límite de concurrencia (máximo 5 tenants en paralelo)
    const BATCH_CONCURRENCY = 5
    const results: PromiseSettledResult<any>[] = []

    for (let i = 0; i < tenantPromises.length; i += BATCH_CONCURRENCY) {
      const batch = tenantPromises.slice(i, i + BATCH_CONCURRENCY)
      const batchResults = await Promise.allSettled(batch)
      results.push(...batchResults)
    }

    // Contar éxitos y errores
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    if (process.env.NODE_ENV === 'development' || failed > 0) {
      console.log(
        `[Analytics Batch] Processed: ${successful} tenants successful, ${failed} failed, ${events.length} total events`
      )
    }

    // Log errores para debugging
    if (failed > 0) {
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason)

      console.error('[Analytics Batch] Errors:', errors)
    }
  } catch (error) {
    console.error('[Analytics Batch] Error en processEventsBatch:', error)
  }
}

/**
 * MULTITENANT: Procesar batch de eventos de un tenant específico
 */
async function processTenantBatch(
  events: OptimizedAnalyticsEvent[],
  supabase: any,
  tenantId: string
) {
  // Preparar datos para inserción masiva usando función optimizada
  const insertPromises = events.map(event =>
    supabase.rpc('insert_analytics_event_optimized', {
      p_event_name: event.event,
      p_category: event.category,
      p_action: event.action,
      p_label: event.label || null,
      p_value: event.value || null,
      p_user_id: event.userId || null,
      p_session_id: event.sessionId,
      p_page: event.page,
      p_user_agent: event.userAgent || null,
      // MULTITENANT: Incluir tenant_id si la función RPC lo soporta
      // Nota: Esto requiere que la función RPC acepte p_tenant_id
      // Si no está disponible, se puede agregar en metadata
      p_tenant_id: tenantId !== 'unknown' ? tenantId : null,
    })
  )

  // Ejecutar todas las inserciones en paralelo
  const results = await Promise.allSettled(insertPromises)

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  if (failed > 0) {
    const reasons = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason?.message ?? String(r.reason))
    console.warn(`[Analytics Batch] Tenant ${tenantId}: ${successful} ok, ${failed} failed`, reasons.slice(0, 3))
  }

  return { tenantId, successful, failed, total: events.length }
}

/**
 * GET /api/analytics/events/optimized
 * Obtener eventos optimizados con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const eventType = searchParams.get('eventType')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      )
    }

    // Usar tabla optimizada directamente (vista unificada eliminada)
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
        page_id,
        browser_id,
        created_at,
        analytics_event_types(name),
        analytics_categories(name),
        analytics_actions(name),
        analytics_pages(path),
        analytics_browsers(name, version)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    // Aplicar filtros
    if (startDate) {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
      query = query.gte('created_at', startTimestamp)
    }

    if (endDate) {
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)
      query = query.lte('created_at', endTimestamp)
    }

    if (eventType) {
      // Necesitamos hacer JOIN con analytics_event_types para filtrar por nombre
      query = query.eq('analytics_event_types.name', eventType)
    }

    if (category) {
      // Necesitamos hacer JOIN con analytics_categories para filtrar por nombre
      query = query.eq('analytics_categories.name', category)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error obteniendo eventos optimizados:', error)
      return NextResponse.json({ error: 'Error obteniendo eventos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error en GET analytics optimizada:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * DELETE /api/analytics/events/optimized
 * Limpiar eventos antiguos (solo admins)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysOld = parseInt(searchParams.get('daysOld') || '30')
    const dryRun = searchParams.get('dryRun') === 'true'

    const supabase = getSupabaseClient(true) // Usar cliente admin
    if (!supabase) {
      return NextResponse.json({ error: 'Servicio administrativo no disponible' }, { status: 503 })
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000)

    if (dryRun) {
      // Solo contar cuántos registros se eliminarían
      const { count, error } = await supabase
        .from('analytics_events_optimized')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffTimestamp)

      if (error) {
        console.error('Error en dry run de limpieza:', error)
        return NextResponse.json({ error: 'Error en simulación de limpieza' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        dryRun: true,
        wouldDelete: count || 0,
        cutoffDate: cutoffDate.toISOString(),
      })
    }

    // Eliminar registros antiguos
    const { error } = await supabase
      .from('analytics_events_optimized')
      .delete()
      .lt('created_at', cutoffTimestamp)

    if (error) {
      console.error('Error eliminando eventos antiguos:', error)
      return NextResponse.json({ error: 'Error eliminando eventos antiguos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: true,
      cutoffDate: cutoffDate.toISOString(),
      message: `Eventos anteriores a ${daysOld} días eliminados`,
    })
  } catch (error) {
    console.error('Error en DELETE analytics optimizada:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
