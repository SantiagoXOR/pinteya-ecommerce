'use client'

/**
 * ⚡ OPTIMIZACIÓN: Componente cliente para lazy loading de analytics y performance
 * 
 * En Next.js 15, no se puede usar `ssr: false` con `next/dynamic` en Server Components.
 * Este componente cliente maneja todos los imports dinámicos que requieren `ssr: false`.
 * 
 * ⚡ FIX: Manejo robusto de errores para scripts de Vercel que pueden estar bloqueados
 */

import React, { useEffect, useState } from 'react'
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

// ⚡ FIX: Vercel Analytics con manejo robusto de errores para evitar recargas
// ⚡ Cargar solo después de que la página esté completamente hidratada
const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(m => ({ default: m.Analytics })).catch((error) => {
    // ⚡ FIX: Capturar errores de carga (scripts bloqueados) y retornar componente vacío
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Vercel Analytics bloqueado o no disponible:', error)
    }
    return { default: () => null }
  }),
  {
    ssr: false,
    loading: () => null,
  }
)

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then(m => ({ default: m.SpeedInsights })).catch((error) => {
    // ⚡ FIX: Capturar errores de carga (scripts bloqueados) y retornar componente vacío
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Vercel Speed Insights bloqueado o no disponible:', error)
    }
    return { default: () => null }
  }),
  {
    ssr: false,
    loading: () => null,
  }
)

// ⚡ FIX: Componente wrapper con error boundary para Vercel Analytics
function VercelAnalyticsWrapper() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)

  // ⚡ FIX: Esperar a que la página esté completamente hidratada antes de cargar
  // ⚡ FIX: Reducir delay para evitar recarga visual - cargar casi inmediatamente después de hidratación
  useEffect(() => {
    setIsHydrated(true)
    
    // ⚡ FIX: Cargar después de un delay mínimo para asegurar que no cause recargas
    // Delay reducido de 2000ms a 100ms para evitar recarga visual perceptible
    const timer = setTimeout(() => {
      setShouldLoad(true)
    }, 100) // Delay mínimo para permitir hidratación completa sin causar recarga visual

    return () => clearTimeout(timer)
  }, [])

  // ⚡ FIX: Solo cargar en producción y después de hidratación
  if (process.env.NODE_ENV !== 'production' || !isHydrated || !shouldLoad) {
    return null
  }

  return (
    <>
      {/* ⚡ FIX: Wrapper con try-catch silencioso para evitar errores no manejados */}
      <ErrorBoundaryVercel>
        <Analytics />
        <SpeedInsights />
      </ErrorBoundaryVercel>
    </>
  )
}

// ⚡ FIX: Error boundary simple para capturar errores de Vercel Analytics
class ErrorBoundaryVercel extends React.Component<
  React.PropsWithChildren<{}>,
  { hasError: boolean }
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    // ⚡ FIX: Capturar errores silenciosamente sin causar recargas
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // ⚡ FIX: Log silencioso solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Vercel Analytics error (manejado silenciosamente):', error, errorInfo)
    }
    // No hacer nada más - evitar recargas
  }

  render() {
    if (this.state.hasError) {
      // ⚡ FIX: Retornar null en lugar de fallback UI que podría causar problemas
      return null
    }

    return this.props.children
  }
}

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
      {/* ⚡ FIX: Usar wrapper con manejo robusto de errores */}
      <VercelAnalyticsWrapper />
    </>
  )
}

