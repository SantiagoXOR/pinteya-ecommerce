'use client'

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
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

// Contexto
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

// Hook para usar el contexto
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
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

    const eventData = {
      event,
      category,
      action,
      label,
      value,
      userId: metadata?.userId,
      sessionId,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      metadata,
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

  // Track page views automáticamente
  useEffect(() => {
    if (isEnabled && pathname) {
      sendAnalyticsEvent('page_view', 'navigation', 'view', pathname, undefined, {
        userId: user?.id,
      })
    }
  }, [pathname, isEnabled, user])

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
