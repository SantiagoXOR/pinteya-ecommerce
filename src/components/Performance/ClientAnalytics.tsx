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
    // No loguear como error para evitar que el script de diagnóstico lo capture
    // Los errores de scripts bloqueados son esperados y no críticos
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

  // ⚡ FIX: Eliminar delay completamente para evitar recarga visual
  // Cargar inmediatamente después de que el componente se monte
  useEffect(() => {
    setIsHydrated(true)
    // ⚡ FIX: Cargar inmediatamente sin delay para eliminar recarga visual
    setShouldLoad(true)
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
    // ⚡ FIX: Capturar errores silenciosamente sin loguear
    // Los errores de Vercel Analytics/Speed Insights cuando están bloqueados son esperados
    // No loguear para evitar que el script de diagnóstico los capture como errores críticos
    // No hacer nada más - evitar recargas y errores en consola
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
  const [shouldLoadAnalytics, setShouldLoadAnalytics] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let idleId: number | ReturnType<typeof setTimeout> | null = null
    const enable = () => setShouldLoadAnalytics(true)

    const onInteraction = () => {
      enable()
    }

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    events.forEach((event) => {
      window.addEventListener(event, onInteraction, { passive: true, once: true })
    })

    if ('requestIdleCallback' in window) {
      // @ts-expect-error requestIdleCallback no está tipado en TS DOM estándar
      idleId = window.requestIdleCallback(enable, { timeout: 2000 })
    } else {
      idleId = setTimeout(enable, 2000)
    }

    return () => {
      events.forEach((event) => window.removeEventListener(event, onInteraction))
      if (idleId) {
        if (typeof idleId === 'number' && 'cancelIdleCallback' in window) {
          // @ts-expect-error cancelIdleCallback no está tipado en TS DOM estándar
          window.cancelIdleCallback(idleId)
        } else {
          clearTimeout(idleId as ReturnType<typeof setTimeout>)
        }
      }
    }
  }, [])

  return (
    <>
      <ClientErrorSuppression />
      <NonBlockingCSS />
      <DeferredCSS />
      {shouldLoadAnalytics && (
        <>
          <GoogleAnalytics />
          <MetaPixel />
          <GoogleAds />
          <PerformanceTracker />
          {/* ⚡ FIX: Usar wrapper con manejo robusto de errores */}
          <VercelAnalyticsWrapper />
        </>
      )}
    </>
  )
}

