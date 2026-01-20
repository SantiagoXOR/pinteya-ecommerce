'use client'

import React, { createContext, useContext, ReactNode, useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

// Tipos simplificados
interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void
  trackPageView: (pageName: string, properties?: Record<string, any>) => void
  trackClick: (elementName: string, properties?: Record<string, any>) => void
  trackHover: (elementName: string, properties?: Record<string, any>) => void
  trackScroll: (scrollData: { scrollY: number; scrollPercent: number }) => void
  trackConversion: (conversionType: string, properties?: Record<string, any>) => void
  trackSearch: (searchTerm: string, results?: number) => void
  trackCartAction: (action: string, productId?: string, properties?: Record<string, any>) => void
  trackProductView: (
    productId: string,
    productName: string,
    properties?: Record<string, any>
  ) => void
  trackCategoryView: (categoryName: string, properties?: Record<string, any>) => void
  trackUserAction: (action: string, properties?: Record<string, any>) => void
  isEnabled: boolean
}

// Constantes para debounce y deduplicación
const PAGE_VIEW_DEBOUNCE_MS = 500
const VISITOR_HASH_KEY = 'pinteya_visitor_hash'

/**
 * Genera un hash único para identificar visitantes recurrentes
 * Persiste en localStorage para mantener identidad entre sesiones
 */
const getOrCreateVisitorHash = (): string => {
  if (typeof window === 'undefined') return ''
  
  try {
    let visitorHash = localStorage.getItem(VISITOR_HASH_KEY)
    
    if (!visitorHash) {
      // Generar hash único basado en timestamp + random
      const timestamp = Date.now().toString(36)
      const randomPart = Math.random().toString(36).substring(2, 15)
      const browserFingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        new Date().getTimezoneOffset()
      ].join('|')
      
      // Crear hash simple pero único
      let hash = 0
      const combined = `${timestamp}${randomPart}${browserFingerprint}`
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      
      visitorHash = `vh_${Math.abs(hash).toString(36)}_${timestamp}`
      localStorage.setItem(VISITOR_HASH_KEY, visitorHash)
    }
    
    return visitorHash
  } catch {
    // localStorage no disponible
    return `vh_temp_${Date.now().toString(36)}`
  }
}

// Contexto
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

// ⚡ FIX: Hook opcional - no lanza error si el provider no está disponible
// Esto permite que componentes se rendericen antes de que AnalyticsProvider se hidrate
const noopAnalytics: AnalyticsContextType = {
  trackEvent: () => {},
  trackPageView: () => {},
  trackClick: () => {},
  trackHover: () => {},
  trackScroll: () => {},
  trackConversion: () => {},
  trackSearch: () => {},
  trackCartAction: () => {},
  trackProductView: () => {},
  trackCategoryView: () => {},
  trackUserAction: () => {},
  isEnabled: false,
}

// Hook para usar el contexto
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext)
  // ⚡ FIX: Retornar objeto no-op si el provider no está disponible
  // Esto permite que componentes se rendericen antes de que AnalyticsProvider se hidrate
  if (!context) {
    return noopAnalytics
  }
  return context
}

// Props del provider
interface SimpleAnalyticsProviderProps {
  children: ReactNode
}

// Función helper para enviar eventos a la API
const sendAnalyticsEvent = async (
  event: string,
  category: string,
  action: string,
  label?: string,
  value?: number,
  metadata?: Record<string, any>
) => {
  try {
    const sessionId = sessionStorage.getItem('analytics_session_id') || 
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (!sessionStorage.getItem('analytics_session_id')) {
      sessionStorage.setItem('analytics_session_id', sessionId)
    }

    // Obtener visitor hash para identificar usuarios recurrentes
    const visitorHash = getOrCreateVisitorHash()

    const eventData = {
      event,
      category,
      action,
      label,
      value,
      userId: metadata?.userId,
      sessionId,
      visitorHash, // Nuevo: identificador persistente de visitante
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      metadata: {
        ...metadata,
        visitorHash, // También incluir en metadata para compatibilidad
      },
    }

    // Enviar evento a la API de forma asíncrona (no bloquea)
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    }).catch(error => {
      // Silenciar errores de analytics para no afectar la UX
      console.warn('Analytics event failed:', error)
    })
  } catch (error) {
    // Silenciar errores
    console.warn('Analytics error:', error)
  }
}

// Provider simplificado con tracking real
export const SimpleAnalyticsProvider: React.FC<SimpleAnalyticsProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isEnabled] = useState(true)
  
  // Referencias para debounce y deduplicación
  const lastPageViewRef = useRef<string | null>(null)
  const pageViewTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPageViewTimeRef = useRef<number>(0)

  // Track page views automáticamente con debounce para evitar duplicados
  useEffect(() => {
    if (!isEnabled || !pathname) return

    const now = Date.now()
    const timeSinceLastPageView = now - lastPageViewTimeRef.current

    // Cancelar timeout anterior si existe
    if (pageViewTimeoutRef.current) {
      clearTimeout(pageViewTimeoutRef.current)
    }

    // Evitar duplicados: misma página en menos de DEBOUNCE_MS
    if (lastPageViewRef.current === pathname && timeSinceLastPageView < PAGE_VIEW_DEBOUNCE_MS) {
      return
    }

    // Aplicar debounce para evitar múltiples eventos por re-renders
    pageViewTimeoutRef.current = setTimeout(() => {
      // Doble verificación después del debounce
      if (lastPageViewRef.current === pathname && 
          Date.now() - lastPageViewTimeRef.current < PAGE_VIEW_DEBOUNCE_MS) {
        return
      }

      lastPageViewRef.current = pathname
      lastPageViewTimeRef.current = Date.now()

      sendAnalyticsEvent('page_view', 'navigation', 'view', pathname, undefined, {
        userId: user?.id,
        timestamp: Date.now(),
      })
    }, PAGE_VIEW_DEBOUNCE_MS)

    // Cleanup
    return () => {
      if (pageViewTimeoutRef.current) {
        clearTimeout(pageViewTimeoutRef.current)
      }
    }
  }, [pathname, isEnabled, user?.id]) // Solo user?.id, no todo el objeto user

  // Funciones de tracking que envían eventos reales
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (!isEnabled) return
    sendAnalyticsEvent(eventName, 'custom', 'event', eventName, undefined, {
      userId: user?.id,
      ...properties,
    })
  }

  const trackPageView = (pageName: string, properties?: Record<string, any>) => {
    if (!isEnabled) return
    sendAnalyticsEvent('page_view', 'navigation', 'view', pageName, undefined, {
      userId: user?.id,
      ...properties,
    })
  }

  const trackClick = (elementName: string, properties?: Record<string, any>) => {
    if (!isEnabled) return
    sendAnalyticsEvent('click', 'interaction', 'click', elementName, undefined, {
      userId: user?.id,
      ...properties,
    })
  }

  const trackHover = (elementName: string, properties?: Record<string, any>) => {
    if (!isEnabled) return
    sendAnalyticsEvent('hover', 'interaction', 'hover', elementName, undefined, {
      userId: user?.id,
      ...properties,
    })
  }

  const trackScroll = (scrollData: { scrollY: number; scrollPercent: number }) => {
    if (!isEnabled) return
    sendAnalyticsEvent('scroll', 'interaction', 'scroll', undefined, scrollData.scrollPercent, {
      userId: user?.id,
      scrollY: scrollData.scrollY,
    })
  }

  const trackConversion = (conversionType: string, properties?: Record<string, any>) => {
    if (!isEnabled) return
    sendAnalyticsEvent('conversion', 'conversion', conversionType, conversionType, properties?.value, {
      userId: user?.id,
      ...properties,
    })
  }

  const trackSearch = (searchTerm: string, results?: number) => {
    if (!isEnabled) return
    sendAnalyticsEvent('search', 'search', 'search_query', searchTerm, results, {
      userId: user?.id,
    })
  }

  const trackCartAction = (
    action: string,
    productId?: string,
    properties?: Record<string, any>
  ) => {
    if (!isEnabled) return
    const eventName = action === 'add' ? 'add_to_cart' : action === 'remove' ? 'remove_from_cart' : 'cart_action'
    sendAnalyticsEvent(eventName, 'shop', action, productId, properties?.value, {
      userId: user?.id,
      productId,
      ...properties,
    })
  }

  const trackProductView = (
    productId: string,
    productName: string,
    properties?: Record<string, any>
  ) => {
    if (!isEnabled) return
    sendAnalyticsEvent('view_item', 'shop', 'view_item', productName, undefined, {
      userId: user?.id,
      item_id: productId,
      item_name: productName,
      ...properties,
    })
  }

  const trackCategoryView = (categoryName: string, properties?: Record<string, any>) => {
    if (!isEnabled) return
    sendAnalyticsEvent('view_category', 'navigation', 'view', categoryName, undefined, {
      userId: user?.id,
      category_name: categoryName,
      ...properties,
    })
  }

  const trackUserAction = (action: string, properties?: Record<string, any>) => {
    if (!isEnabled) return
    sendAnalyticsEvent('user_action', 'user', action, action, undefined, {
      userId: user?.id,
      ...properties,
    })
  }

  const contextValue: AnalyticsContextType = {
    trackEvent,
    trackPageView,
    trackClick,
    trackHover,
    trackScroll,
    trackConversion,
    trackSearch,
    trackCartAction,
    trackProductView,
    trackCategoryView,
    trackUserAction,
    isEnabled: true,
  }

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>
}
