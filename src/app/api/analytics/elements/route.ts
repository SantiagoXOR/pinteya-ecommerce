/**
 * API Endpoint para métricas de elementos interactivos
 * GET /api/analytics/elements?route=/&device=mobile&startDate=...&endDate=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ElementMetrics {
  elementSelector: string
  elementPosition: { x: number; y: number }
  elementDimensions: { width: number; height: number }
  interactions: {
    clicks: number
    hovers: number
    scrolls: number
    conversions: number
  }
  metrics: {
    totalInteractions: number
    uniqueUsers: number
    averageHoverTime: number
    conversionRate: number
    clickThroughRate: number
  }
  deviceBreakdown: {
    mobile: { interactions: number; users: number }
    desktop: { interactions: number; users: number }
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const route = searchParams.get('route') || '/'
    const device = searchParams.get('device') || 'all' // mobile, desktop, all
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()

    // Obtener page_id para la ruta
    const { data: pageData } = await supabase
      .from('analytics_pages')
      .select('id')
      .eq('path', route)
      .single()

    if (!pageData) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    // Obtener eventos de elementos para esta ruta
    let query = supabase
      .from('analytics_events_optimized')
      .select(`
        id,
        element_selector,
        element_x,
        element_y,
        element_width,
        element_height,
        device_type,
        action_id,
        user_id,
        session_hash,
        created_at,
        analytics_actions(name)
      `)
      .eq('page_id', pageData.id)
      .not('element_selector', 'is', null)
      .gte('created_at', Math.floor(new Date(startDate).getTime() / 1000))
      .lte('created_at', Math.floor(new Date(endDate).getTime() / 1000))

    if (device !== 'all') {
      query = query.eq('device_type', device)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error obteniendo eventos de elementos:', error)
      return NextResponse.json({ error: 'Error obteniendo datos' }, { status: 500 })
    }

    // Agrupar por elemento
    const elementMap = new Map<string, {
      selector: string
      position: { x: number; y: number }
      dimensions: { width: number; height: number }
      clicks: number
      hovers: number
      scrolls: number
      conversions: number
      users: Set<string>
      deviceBreakdown: {
        mobile: { interactions: number; users: Set<string> }
        desktop: { interactions: number; users: Set<string> }
      }
    }>()

    events?.forEach((event: any) => {
      const selector = event.element_selector
      if (!selector) return

      if (!elementMap.has(selector)) {
        elementMap.set(selector, {
          selector,
          position: {
            x: event.element_x || 0,
            y: event.element_y || 0,
          },
          dimensions: {
            width: event.element_width || 0,
            height: event.element_height || 0,
          },
          clicks: 0,
          hovers: 0,
          scrolls: 0,
          conversions: 0,
          users: new Set(),
          deviceBreakdown: {
            mobile: { interactions: 0, users: new Set() },
            desktop: { interactions: 0, users: new Set() },
          },
        })
      }

      const element = elementMap.get(selector)!
      const action = event.analytics_actions?.name || 'unknown'
      const userId = event.user_id?.toString() || event.session_hash?.toString() || 'anonymous'
      const deviceType = event.device_type || 'desktop'

      if (action === 'click') element.clicks++
      if (action === 'hover') element.hovers++
      if (action === 'scroll') element.scrolls++
      // Asumir conversión si hay evento de purchase después (simplificado)
      if (action === 'purchase' || action === 'add') element.conversions++

      element.users.add(userId)

      if (deviceType === 'mobile') {
        element.deviceBreakdown.mobile.interactions++
        element.deviceBreakdown.mobile.users.add(userId)
      } else {
        element.deviceBreakdown.desktop.interactions++
        element.deviceBreakdown.desktop.users.add(userId)
      }
    })

    // Convertir a formato de respuesta
    const elements: ElementMetrics[] = Array.from(elementMap.values())
      .map(element => {
        const totalInteractions = element.clicks + element.hovers + element.scrolls
        return {
          elementSelector: element.selector,
          elementPosition: element.position,
          elementDimensions: element.dimensions,
          interactions: {
            clicks: element.clicks,
            hovers: element.hovers,
            scrolls: element.scrolls,
            conversions: element.conversions,
          },
          metrics: {
            totalInteractions,
            uniqueUsers: element.users.size,
            averageHoverTime: 0, // Se calcularía con datos de tiempo de hover
            conversionRate: totalInteractions > 0 ? (element.conversions / totalInteractions) * 100 : 0,
            clickThroughRate: totalInteractions > 0 ? (element.clicks / totalInteractions) * 100 : 0,
          },
          deviceBreakdown: {
            mobile: {
              interactions: element.deviceBreakdown.mobile.interactions,
              users: element.deviceBreakdown.mobile.users.size,
            },
            desktop: {
              interactions: element.deviceBreakdown.desktop.interactions,
              users: element.deviceBreakdown.desktop.users.size,
            },
          },
        }
      })
      .sort((a, b) => b.metrics.totalInteractions - a.metrics.totalInteractions)

    const mostInteracted = elements[0] || null
    const conversionElements = elements.filter(e => e.interactions.conversions > 0)

    return NextResponse.json({
      route,
      device,
      elements,
      summary: {
        totalElements: elements.length,
        totalInteractions: elements.reduce((sum, e) => sum + e.metrics.totalInteractions, 0),
        mostInteracted,
        conversionElements: conversionElements.slice(0, 10),
      },
    })
  } catch (error) {
    console.error('Error en /api/analytics/elements:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
