// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route para analizar carritos abandonados
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
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()
    const minCartValue = parseFloat(searchParams.get('minCartValue') || '0')
    const groupBy = searchParams.get('groupBy') || 'session' // 'session' | 'visitor' | 'user'

    if (!['session', 'visitor', 'user'].includes(groupBy)) {
      return NextResponse.json(
        { error: 'groupBy debe ser: session, visitor o user' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Servicio de base de datos no disponible' }, { status: 503 })
    }

    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)

    // Obtener todos los eventos de carrito en el rango de fechas
    const { data: cartEvents, error: cartError } = await supabase
      .from('analytics_events_optimized')
      .select(`
        id,
        created_at,
        session_hash,
        visitor_hash,
        user_id,
        action_id,
        value,
        product_id,
        product_name,
        price,
        quantity,
        page_id,
        analytics_actions(name),
        analytics_pages(path)
      `)
      .eq('tenant_id', tenantId) // MULTITENANT: Filtrar por tenant
      .gte('created_at', startTimestamp)
      .lte('created_at', endTimestamp)
      .in('action_id', [
        // Necesitamos obtener los IDs de las acciones primero
        // Por ahora, usamos un enfoque diferente
      ])
      .order('created_at', { ascending: false })

    if (cartError) {
      console.error('Error obteniendo eventos de carrito:', cartError)
    }

    // Obtener eventos de carrito filtrando por nombres de acciones
    // Primero obtenemos todos los eventos y luego filtramos
    const { data: allEvents, error: eventsError } = await supabase
      .from('analytics_events_optimized')
      .select(`
        id,
        created_at,
        session_hash,
        visitor_hash,
        user_id,
        action_id,
        value,
        product_id,
        product_name,
        price,
        quantity,
        page_id,
        analytics_actions(name),
        analytics_pages(path)
      `)
      .eq('tenant_id', tenantId) // MULTITENANT: Filtrar por tenant
      .gte('created_at', startTimestamp)
      .lte('created_at', endTimestamp)
      .order('created_at', { ascending: false })

    if (eventsError) {
      console.error('Error obteniendo eventos:', eventsError)
      return NextResponse.json({ error: 'Error obteniendo eventos' }, { status: 500 })
    }

    // Filtrar eventos de carrito
    const relevantEvents = (allEvents || []).filter((event: any) => {
      const actionName = event.analytics_actions?.name || ''
      return (
        actionName === 'add_to_cart' ||
        actionName === 'add' ||
        actionName === 'begin_checkout' ||
        actionName === 'purchase'
      )
    })

    // Agrupar por identificador según groupBy
    const groupedCarts = new Map<string, any[]>()

    relevantEvents.forEach((event: any) => {
      let identifier: string | null = null

      if (groupBy === 'session') {
        identifier = event.session_hash?.toString() || null
      } else if (groupBy === 'visitor') {
        identifier = event.visitor_hash?.toString() || null
      } else if (groupBy === 'user') {
        identifier = event.user_id || null
      }

      if (identifier) {
        if (!groupedCarts.has(identifier)) {
          groupedCarts.set(identifier, [])
        }
        groupedCarts.get(identifier)!.push(event)
      }
    })

    // Identificar carritos abandonados
    const abandonedCarts: any[] = []
    let totalCartValue = 0
    let totalAbandonedValue = 0

    for (const [identifier, events] of groupedCarts.entries()) {
      // Ordenar eventos por fecha
      events.sort((a, b) => a.created_at - b.created_at)

      // Verificar si hay un purchase
      const hasPurchase = events.some(
        (event: any) => event.analytics_actions?.name === 'purchase'
      )

      if (hasPurchase) {
        continue // No es un carrito abandonado
      }

      // Calcular valor del carrito
      const cartValue = events.reduce((sum: number, event: any) => {
        const actionName = event.analytics_actions?.name || ''
        if (actionName === 'add_to_cart' || actionName === 'add') {
          return sum + (event.price || 0) * (event.quantity || 1)
        }
        return sum
      }, 0)

      if (cartValue < minCartValue) {
        continue // Valor mínimo no alcanzado
      }

      // Encontrar último evento de carrito
      const lastCartEvent = events
        .filter(
          (event: any) =>
            event.analytics_actions?.name === 'add_to_cart' ||
            event.analytics_actions?.name === 'add' ||
            event.analytics_actions?.name === 'begin_checkout'
        )
        .pop()

      if (!lastCartEvent) {
        continue
      }

      // Obtener productos del carrito
      const products = events
        .filter(
          (event: any) =>
            event.analytics_actions?.name === 'add_to_cart' ||
            event.analytics_actions?.name === 'add'
        )
        .map((event: any) => ({
          productId: event.product_id,
          productName: event.product_name,
          price: event.price,
          quantity: event.quantity,
        }))

      const now = Math.floor(Date.now() / 1000)
      const timeSinceAbandonment = now - lastCartEvent.created_at

      abandonedCarts.push({
        identifier,
        identifierType: groupBy,
        sessionHash: events[0]?.session_hash,
        visitorHash: events[0]?.visitor_hash,
        userId: events[0]?.user_id,
        lastEventAt: lastCartEvent.created_at,
        lastPage: lastCartEvent.analytics_pages?.path || 'unknown',
        lastAction: lastCartEvent.analytics_actions?.name || 'unknown',
        cartValue,
        products,
        timeSinceAbandonment, // en segundos
        timeSinceAbandonmentMinutes: Math.floor(timeSinceAbandonment / 60),
        timeSinceAbandonmentHours: Math.floor(timeSinceAbandonment / 3600),
        timeSinceAbandonmentDays: Math.floor(timeSinceAbandonment / 86400),
      })

      totalAbandonedValue += cartValue
    }

    // Ordenar por valor del carrito (descendente)
    abandonedCarts.sort((a, b) => b.cartValue - a.cartValue)

    // Calcular métricas agregadas
    const totalCarts = groupedCarts.size
    const totalPurchases = Array.from(groupedCarts.values()).filter((events) =>
      events.some((event: any) => event.analytics_actions?.name === 'purchase')
    ).length
    const abandonmentRate = totalCarts > 0 ? (abandonedCarts.length / totalCarts) * 100 : 0

    // Análisis de puntos de abandono
    const abandonmentByPage = new Map<string, number>()
    const abandonmentByStep = new Map<string, number>()

    abandonedCarts.forEach((cart) => {
      // Por página
      const page = cart.lastPage
      abandonmentByPage.set(page, (abandonmentByPage.get(page) || 0) + 1)

      // Por paso del checkout
      const step = cart.lastAction === 'begin_checkout' ? 'checkout' : 'cart'
      abandonmentByStep.set(step, (abandonmentByStep.get(step) || 0) + 1)
    })

    return NextResponse.json({
      summary: {
        totalCarts,
        totalPurchases,
        totalAbandoned: abandonedCarts.length,
        totalAbandonedValue,
        abandonmentRate: Math.round(abandonmentRate * 100) / 100,
        averageCartValue:
          abandonedCarts.length > 0
            ? totalAbandonedValue / abandonedCarts.length
            : 0,
        averageTimeToAbandonment:
          abandonedCarts.length > 0
            ? abandonedCarts.reduce((sum, cart) => sum + cart.timeSinceAbandonmentMinutes, 0) /
              abandonedCarts.length
            : 0,
      },
      abandonmentByPage: Array.from(abandonmentByPage.entries()).map(([page, count]) => ({
        page,
        count,
        percentage: (count / abandonedCarts.length) * 100,
      })),
      abandonmentByStep: Array.from(abandonmentByStep.entries()).map(([step, count]) => ({
        step,
        count,
        percentage: (count / abandonedCarts.length) * 100,
      })),
      abandonedCarts,
      period: {
        startDate,
        endDate,
        groupBy,
      },
    })
  } catch (error) {
    console.error('Error analizando carritos abandonados:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
