// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route para obtener eventos raw de analytics
 * Con soporte multitenant completo
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { getTenantConfig } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    // ===================================
    // MULTITENANT: Obtener configuración del tenant
    // ===================================
    const tenant = await getTenantConfig()
    const tenantId = tenant.id

    const { searchParams } = new URL(request.url)
    const sessionHash = searchParams.get('sessionHash')
    const visitorHash = searchParams.get('visitorHash')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const eventType = searchParams.get('eventType')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Servicio de base de datos no disponible' }, { status: 503 })
    }

    // Construir query con todos los campos relevantes
    let query = supabase
      .from('analytics_events_optimized')
      .select(`
        id,
        created_at,
        session_hash,
        visitor_hash,
        user_id,
        event_type,
        category_id,
        action_id,
        label,
        value,
        page_id,
        product_id,
        product_name,
        category_name,
        price,
        quantity,
        device_type,
        element_selector,
        analytics_event_types(name),
        analytics_categories(name),
        analytics_actions(name),
        analytics_pages(path)
      `)
      .eq('tenant_id', tenantId) // MULTITENANT: Filtrar por tenant
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (sessionHash) {
      query = query.eq('session_hash', parseInt(sessionHash) || 0)
    }

    if (visitorHash) {
      query = query.eq('visitor_hash', visitorHash)
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

    // Filtrar por tipo de evento (necesitamos hacer JOIN primero)
    if (eventType) {
      // Esto requiere un subquery o filtro adicional
      // Por ahora, lo manejamos después de obtener los datos
    }

    // Filtrar por acción (necesitamos hacer JOIN primero)
    if (action) {
      // Esto requiere un subquery o filtro adicional
      // Por ahora, lo manejamos después de obtener los datos
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo eventos raw:', error)
      return NextResponse.json({ error: 'Error obteniendo eventos' }, { status: 500 })
    }

    // Filtrar por eventType y action si se especificaron (después de obtener los datos)
    let filteredData = data || []
    
    if (eventType) {
      filteredData = filteredData.filter(
        (event: any) => event.analytics_event_types?.name === eventType
      )
    }

    if (action) {
      filteredData = filteredData.filter(
        (event: any) => event.analytics_actions?.name === action
      )
    }

    // Obtener total count para paginación
    let countQuery = supabase
      .from('analytics_events_optimized')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if (sessionHash) {
      countQuery = countQuery.eq('session_hash', parseInt(sessionHash) || 0)
    }

    if (visitorHash) {
      countQuery = countQuery.eq('visitor_hash', visitorHash)
    }

    if (userId) {
      countQuery = countQuery.eq('user_id', userId)
    }

    if (startDate) {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
      countQuery = countQuery.gte('created_at', startTimestamp)
    }

    if (endDate) {
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)
      countQuery = countQuery.lte('created_at', endTimestamp)
    }

    const { count } = await countQuery

    return NextResponse.json({
      events: filteredData,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error('Error procesando solicitud:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
