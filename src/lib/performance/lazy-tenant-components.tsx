/**
 * MULTITENANT: Lazy Loading con Tenant Context
 * Fase 2: Optimización Performance Lighthouse
 * 
 * Componentes lazy-loaded con fallbacks que usan colores del tenant
 */

'use client'

import React, { Suspense, lazy, ComponentType } from 'react'
import dynamic from 'next/dynamic'
import { useTenantSafe } from '@/contexts/TenantContext'

/**
 * Fallback component que usa colores del tenant
 */
function TenantFallback({ message = 'Cargando...' }: { message?: string }) {
  const tenant = useTenantSafe()
  const primaryColor = tenant?.primaryColor || '#f27a1d'
  const primaryLight = tenant?.primaryLight || '#f9be78'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        background: `linear-gradient(135deg, ${primaryColor}15, ${primaryLight}15)`,
        borderRadius: '0.5rem',
        border: `1px solid ${primaryColor}30`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${primaryColor}30`,
            borderTopColor: primaryColor,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ color: primaryColor, fontSize: '0.875rem', margin: 0 }}>
          {message}
        </p>
      </div>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

/**
 * MULTITENANT: Crear componente lazy con fallback usando colores del tenant
 */
export function createTenantLazyComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    fallbackMessage?: string
    ssr?: boolean
  }
) {
  const LazyComponent = dynamic(importFn, {
    ssr: options?.ssr ?? false,
    loading: () => <TenantFallback message={options?.fallbackMessage} />,
  })

  return LazyComponent
}

/**
 * MULTITENANT: Wrapper de Suspense con tenant context
 */
export function TenantSuspense({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <Suspense fallback={fallback || <TenantFallback />}>{children}</Suspense>
  )
}

/**
 * MULTITENANT: Lazy load de componentes pesados con Intersection Observer
 * Solo carga cuando el componente es visible
 */
export function useLazyOnVisible<T extends HTMLElement>(
  callback: () => void,
  options?: IntersectionObserverInit
) {
  const ref = React.useRef<T>(null)
  const [isVisible, setIsVisible] = React.useState(false)
  const [hasLoaded, setHasLoaded] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element || hasLoaded) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          callback()
          setHasLoaded(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '200px', // Preload 200px antes de que sea visible
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [callback, hasLoaded, options])

  return { ref, isVisible, hasLoaded }
}

/**
 * MULTITENANT: Preload de componentes críticos del tenant basado en analytics
 * Esto se puede usar para preload componentes que el tenant usa frecuentemente
 */
export function useTenantPreload(componentPath: string) {
  const tenant = useTenantSafe()

  React.useEffect(() => {
    if (!tenant || typeof window === 'undefined') return

    // Preload basado en analytics históricos del tenant
    // Por ahora, preload después de FCP
    const timer = setTimeout(() => {
      // Prefetch el chunk del componente
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = 'script'
      link.href = `/_next/static/chunks/${componentPath}`
      document.head.appendChild(link)
    }, 2000) // 2 segundos después de FCP

    return () => clearTimeout(timer)
  }, [tenant, componentPath])
}
