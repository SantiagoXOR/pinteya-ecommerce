/**
 * Provider Unificado de Analytics - Pinteya E-commerce
 * Consolida toda la funcionalidad de analytics en un solo provider
 * Usa nuevas estrategias anti-bloqueadores y sistema optimizado
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { sendStrategies, AnalyticsEvent } from '@/lib/analytics/send-strategies'
import { eventPersistence } from '@/lib/analytics/event-persistence'
import { adBlockDetector } from '@/lib/analytics/adblock-detector'

interface UnifiedAnalyticsContextType {
  // Estado
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void

  // Tracking básico
  trackEvent: (
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ) => void
  trackPageView: (page?: string, properties?: Record<string, any>) => void

  // E-commerce
  trackEcommerceEvent: (action: string, data: Record<string, any>) => void
  trackProductView: (productId: string, productName: string, properties?: Record<string, any>) => void
  trackCartAction: (action: string, productId?: string, properties?: Record<string, any>) => void
  trackConversion: (conversionType: string, properties?: Record<string, any>) => void

  // Búsqueda y navegación
  trackSearch: (searchTerm: string, results?: number) => void
  trackCategoryView: (categoryName: string, properties?: Record<string, any>) => void

  // Interacciones
  trackClick: (elementName: string, properties?: Record<string, any>) => void
  trackHover: (elementName: string, properties?: Record<string, any>) => void
  trackScroll: (scrollData: { scrollY: number; scrollPercent: number }) => void
  trackUserAction: (action: string, properties?: Record<string, any>) => void

  // Utilidades
  getPendingEventsCount: () => Promise<number>
  flushPendingEvents: () => Promise<number>
}

const UnifiedAnalyticsContext = createContext<UnifiedAnalyticsContextType | undefined>(undefined)

// Hook para usar el contexto
export const useUnifiedAnalytics = (): UnifiedAnalyticsContextType => {
  const context = useContext(UnifiedAnalyticsContext)
  if (!context) {
    // Retornar funciones no-op si el provider no está disponible
    return {
      isEnabled: false,
      setEnabled: () => {},
      trackEvent: () => {},
      trackPageView: () => {},
      trackEcommerceEvent: () => {},
      trackProductView: () => {},
      trackCartAction: () => {},
      trackConversion: () => {},
      trackSearch: () => {},
      trackCategoryView: () => {},
      trackClick: () => {},
      trackHover: () => {},
      trackScroll: () => {},
      trackUserAction: () => {},
      getPendingEventsCount: async () => 0,
      flushPendingEvents: async () => 0,
    }
  }
  return context
}

// Mantener compatibilidad con hook anterior
export const useAnalytics = useUnifiedAnalytics

interface UnifiedAnalyticsProviderProps {
  children: React.ReactNode
  enableGA?: boolean
  enableCustomAnalytics?: boolean
  strategy?: 'development' | 'production' | 'optimized'
}

export const UnifiedAnalyticsProvider: React.FC<UnifiedAnalyticsProviderProps> = ({
  children,
  enableGA = true,
  enableCustomAnalytics = true,
  strategy = process.env.NODE_ENV === 'production' ? 'production' : 'development',
}) => {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isEnabled, setIsEnabled] = useState(true)
  const [sessionId, setSessionId] = useState<string>('')

  // Inicializar sistema de persistencia
  useEffect(() => {
    if (typeof window !== 'undefined' && enableCustomAnalytics) {
      eventPersistence.init().catch(console.warn)

      // Inicializar session ID
      const storedSessionId = sessionStorage.getItem('analytics_session_id')
      if (storedSessionId) {
        setSessionId(storedSessionId)
      } else {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('analytics_session_id', newSessionId)
        setSessionId(newSessionId)
      }

      // Enviar eventos pendientes al cargar
      eventPersistence.flushPendingEvents()
    }
  }, [enableCustomAnalytics])

  // Track page views automáticamente
  useEffect(() => {
    if (isEnabled && pathname && enableCustomAnalytics && typeof window !== 'undefined') {
      trackPageView(pathname)
    }
  }, [pathname, isEnabled, enableCustomAnalytics])

  // Función helper para crear evento base
  const createBaseEvent = useCallback(
    (
      event: string,
      category: string,
      action: string,
      label?: string,
      value?: number,
      metadata?: Record<string, any>
    ): AnalyticsEvent => {
      return {
        event,
        category,
        action,
        label,
        value,
        userId: user?.id,
        sessionId,
        page: typeof window !== 'undefined' ? window.location.pathname : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        metadata: {
          ...metadata,
          userId: user?.id,
          timestamp: Date.now(),
        },
      }
    },
    [user, sessionId]
  )

  // Función principal de tracking
  const trackEvent = useCallback(
    (
      event: string,
      category: string,
      action: string,
      label?: string,
      value?: number,
      metadata?: Record<string, any>
    ) => {
      if (!isEnabled || !enableCustomAnalytics) {
        return
      }

      const analyticsEvent = createBaseEvent(event, category, action, label, value, metadata)
      sendStrategies.sendEvent(analyticsEvent).catch(console.warn)
    },
    [isEnabled, enableCustomAnalytics, createBaseEvent]
  )

  // Track page view
  const trackPageView = useCallback(
    (page?: string, properties?: Record<string, any>) => {
      const pagePath = page || (typeof window !== 'undefined' ? window.location.pathname : '')
      trackEvent('page_view', 'navigation', 'view', pagePath, undefined, properties)
    },
    [trackEvent]
  )

  // Track e-commerce event
  const trackEcommerceEvent = useCallback(
    (action: string, data: Record<string, any>) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] trackEcommerceEvent:', { action, data })
      }
      // Mapear action a event_name correcto para la función RPC
      // La función RPC espera event_name específico, no "ecommerce"
      let eventName = 'ecommerce'
      if (action === 'add_to_cart') {
        eventName = 'add_to_cart'
      } else if (action === 'remove_from_cart') {
        eventName = 'remove_from_cart'
      } else if (action === 'view_item') {
        eventName = 'product_view'
      } else if (action === 'begin_checkout') {
        eventName = 'begin_checkout'
      } else if (action === 'purchase') {
        eventName = 'purchase'
      }
      
      trackEvent(eventName, 'shop', action, undefined, data.value, data)
    },
    [trackEvent]
  )

  // Track product view
  const trackProductView = useCallback(
    (productId: string, productName: string, properties?: Record<string, any>) => {
      trackEcommerceEvent('view_item', {
        item_id: productId,
        item_name: productName,
        ...properties,
      })
    },
    [trackEcommerceEvent]
  )

  // Track cart action
  const trackCartAction = useCallback(
    (action: string, productId?: string, properties?: Record<string, any>) => {
      const eventName = action === 'add' ? 'add_to_cart' : action === 'remove' ? 'remove_from_cart' : 'cart_action'
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] trackCartAction:', { action, eventName, productId, properties })
      }
      trackEcommerceEvent(eventName, {
        item_id: productId,
        ...properties,
      })
    },
    [trackEcommerceEvent]
  )

  // Track conversion
  const trackConversion = useCallback(
    (conversionType: string, properties?: Record<string, any>) => {
      trackEvent('conversion', 'ecommerce', conversionType, undefined, properties?.value, properties)
    },
    [trackEvent]
  )

  // Track search
  const trackSearch = useCallback(
    (searchTerm: string, results?: number) => {
      trackEvent('search', 'search', 'search_query', searchTerm, results, {
        search_term: searchTerm,
        results_count: results,
      })
    },
    [trackEvent]
  )

  // Track category view
  const trackCategoryView = useCallback(
    (categoryName: string, properties?: Record<string, any>) => {
      trackEvent('view_category', 'navigation', 'view', categoryName, undefined, {
        category_name: categoryName,
        ...properties,
      })
    },
    [trackEvent]
  )

  // Track click
  const trackClick = useCallback(
    (elementName: string, properties?: Record<string, any>) => {
      trackEvent('click', 'interaction', 'click', elementName, undefined, {
        element: elementName,
        ...properties,
      })
    },
    [trackEvent]
  )

  // Track hover
  const trackHover = useCallback(
    (elementName: string, properties?: Record<string, any>) => {
      trackEvent('hover', 'interaction', 'hover', elementName, undefined, {
        element: elementName,
        ...properties,
      })
    },
    [trackEvent]
  )

  // Track scroll
  const trackScroll = useCallback(
    (scrollData: { scrollY: number; scrollPercent: number }) => {
      trackEvent('scroll', 'interaction', 'scroll', undefined, scrollData.scrollPercent, scrollData)
    },
    [trackEvent]
  )

  // Track user action
  const trackUserAction = useCallback(
    (action: string, properties?: Record<string, any>) => {
      trackEvent('user_action', 'user', action, action, undefined, properties)
    },
    [trackEvent]
  )

  // Obtener cantidad de eventos pendientes
  const getPendingEventsCount = useCallback(async () => {
    return eventPersistence.getPendingCount()
  }, [])

  // Enviar eventos pendientes
  const flushPendingEvents = useCallback(async () => {
    return eventPersistence.flushPendingEvents()
  }, [])

  const contextValue: UnifiedAnalyticsContextType = {
    isEnabled,
    setEnabled: setIsEnabled,
    trackEvent,
    trackPageView,
    trackEcommerceEvent,
    trackProductView,
    trackCartAction,
    trackConversion,
    trackSearch,
    trackCategoryView,
    trackClick,
    trackHover,
    trackScroll,
    trackUserAction,
    getPendingEventsCount,
    flushPendingEvents,
  }

  return (
    <UnifiedAnalyticsContext.Provider value={contextValue}>{children}</UnifiedAnalyticsContext.Provider>
  )
}

// Exportar como default para compatibilidad
export default UnifiedAnalyticsProvider
