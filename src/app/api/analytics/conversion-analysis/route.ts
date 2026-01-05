// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Route para análisis de conversión
 * Calcula puntos de mejora y fortalezas basados en datos reales de la DB
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Improvement {
  label: string
  value: string
  severity: 'high' | 'medium' | 'low'
}

interface Strength {
  label: string
  value: string
  severity: 'high' | 'medium' | 'low'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate =
      searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()

    // Obtener eventos de analytics
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events_unified')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (eventsError) {
      console.error('Error obteniendo eventos:', eventsError)
      return NextResponse.json({ error: 'Error obteniendo eventos' }, { status: 500 })
    }

    // Calcular métricas básicas
    const productViews =
      events?.filter(
        e => e.action === 'view_item' || e.page?.includes('/product/') || e.page?.includes('/buy/')
      ).length || 0
    const cartAdditions = events?.filter(e => e.action === 'add_to_cart' || e.action === 'add').length || 0
    const checkoutStarts = events?.filter(e => e.action === 'begin_checkout').length || 0
    const checkoutCompletions = events?.filter(e => e.action === 'purchase').length || 0

    // Calcular tasas de conversión
    const productToCartRate = productViews > 0 ? (cartAdditions / productViews) * 100 : 0
    const cartToCheckoutRate = cartAdditions > 0 ? (checkoutStarts / cartAdditions) * 100 : 0
    const checkoutToPurchaseRate = checkoutStarts > 0 ? (checkoutCompletions / checkoutStarts) * 100 : 0
    const cartAbandonmentRate =
      cartAdditions > 0 ? ((cartAdditions - checkoutCompletions) / cartAdditions) * 100 : 0

    // Benchmarks de la industria para e-commerce
    const industryBenchmarks = {
      productToCart: 3.0, // 3% es un buen benchmark
      cartToCheckout: 70.0, // 70% es un buen benchmark
      checkoutToPurchase: 80.0, // 80% es un buen benchmark
      cartAbandonment: 70.0, // 70% es normal (alto abandono es malo)
    }

    const improvements: Improvement[] = []
    const strengths: Strength[] = []

    // Análisis de mejoras (problemas a resolver)
    if (cartAbandonmentRate > industryBenchmarks.cartAbandonment && checkoutStarts > 0) {
      const diff = cartAbandonmentRate - industryBenchmarks.cartAbandonment
      improvements.push({
        label: 'Mayor abandono en checkout',
        value: `-${diff.toFixed(1)}%`,
        severity: diff > 20 ? 'high' : 'medium',
      })
    }

    if (productToCartRate < industryBenchmarks.productToCart && productViews > 0) {
      const diff = industryBenchmarks.productToCart - productToCartRate
      improvements.push({
        label: 'Baja conversión producto → carrito',
        value: `-${diff.toFixed(1)}%`,
        severity: diff > 2 ? 'high' : 'medium',
      })
    }

    if (checkoutToPurchaseRate < industryBenchmarks.checkoutToPurchase && checkoutStarts > 0) {
      const diff = industryBenchmarks.checkoutToPurchase - checkoutToPurchaseRate
      improvements.push({
        label: 'Baja tasa de finalización de compra',
        value: `-${diff.toFixed(1)}%`,
        severity: diff > 15 ? 'high' : 'medium',
      })
    }

    // Análisis de fortalezas (cosas que van bien)
    if (cartToCheckoutRate > industryBenchmarks.cartToCheckout && cartAdditions > 0) {
      const diff = cartToCheckoutRate - industryBenchmarks.cartToCheckout
      strengths.push({
        label: 'Alta retención en carrito',
        value: `+${diff.toFixed(1)}%`,
        severity: diff > 10 ? 'high' : 'medium',
      })
    }

    if (productToCartRate > industryBenchmarks.productToCart && productViews > 0) {
      const diff = productToCartRate - industryBenchmarks.productToCart
      strengths.push({
        label: 'Buena tasa de vista de productos',
        value: `+${diff.toFixed(1)}%`,
        severity: diff > 2 ? 'high' : 'medium',
      })
    }

    if (checkoutToPurchaseRate > industryBenchmarks.checkoutToPurchase && checkoutStarts > 0) {
      const diff = checkoutToPurchaseRate - industryBenchmarks.checkoutToPurchase
      strengths.push({
        label: 'Excelente tasa de finalización',
        value: `+${diff.toFixed(1)}%`,
        severity: diff > 10 ? 'high' : 'medium',
      })
    }

    return NextResponse.json({
      improvements,
      strengths,
      metrics: {
        productViews,
        cartAdditions,
        checkoutStarts,
        checkoutCompletions,
        productToCartRate: Math.round(productToCartRate * 100) / 100,
        cartToCheckoutRate: Math.round(cartToCheckoutRate * 100) / 100,
        checkoutToPurchaseRate: Math.round(checkoutToPurchaseRate * 100) / 100,
        cartAbandonmentRate: Math.round(cartAbandonmentRate * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Error calculando análisis de conversión:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}















