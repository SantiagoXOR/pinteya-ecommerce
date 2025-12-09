'use client'

/**
 * ⚡ OPTIMIZACIÓN: Componente cliente para lazy loading de analytics y performance
 * 
 * En Next.js 15, no se puede usar `ssr: false` con `next/dynamic` en Server Components.
 * Este componente cliente maneja todos los imports dinámicos que requieren `ssr: false`.
 */

import React from 'react'
import dynamic from 'next/dynamic'

// ⚡ PERFORMANCE: Componentes no críticos (lazy load después de FCP)
// Analytics y tracking se cargan después de interacción del usuario
const GoogleAnalytics = dynamic(() => import('@/components/Analytics/GoogleAnalytics'), {
  ssr: false,
  loading: () => null,
})
const MetaPixel = dynamic(() => import('@/components/Analytics/MetaPixel'), {
  ssr: false,
  loading: () => null,
})
const GoogleAds = dynamic(() => import('@/components/Analytics/GoogleAds'), {
  ssr: false,
  loading: () => null,
})

// ⚡ PERFORMANCE: Performance tracking y optimizaciones (lazy load)
const ClientErrorSuppression = dynamic(() => import('@/components/ErrorSuppression/ClientErrorSuppression').then(m => ({ default: m.ClientErrorSuppression })), {
  ssr: false,
  loading: () => null,
})
const PerformanceTracker = dynamic(() => import('@/components/PerformanceTracker'), {
  ssr: false,
  loading: () => null,
})
const DeferredCSS = dynamic(() => import('@/components/Performance/DeferredCSS').then(m => ({ default: m.DeferredCSS })), {
  ssr: false,
  loading: () => null,
})
const NonBlockingCSS = dynamic(() => import('@/components/Performance/NonBlockingCSS').then(m => ({ default: m.NonBlockingCSS })), {
  ssr: false,
  loading: () => null,
})

// ⚡ PERFORMANCE: Vercel Analytics - Lazy load (solo en producción)
const Analytics = dynamic(() => import('@vercel/analytics/react').then(m => ({ default: m.Analytics })), {
  ssr: false,
  loading: () => null,
})
const SpeedInsights = dynamic(() => import('@vercel/speed-insights/next').then(m => ({ default: m.SpeedInsights })), {
  ssr: false,
  loading: () => null,
})

export default function ClientAnalytics() {
  return (
    <>
      <GoogleAnalytics />
      <MetaPixel />
      <GoogleAds />
      <ClientErrorSuppression />
      <PerformanceTracker />
      <NonBlockingCSS />
      <DeferredCSS />
      {process.env.NODE_ENV === 'production' && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </>
  )
}

