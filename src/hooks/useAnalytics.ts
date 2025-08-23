/**
 * Hook personalizado para Analytics en Pinteya E-commerce
 * Proporciona funciones de tracking y métricas fáciles de usar
 */

import { useEffect, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { usePathname } from 'next/navigation';
import { analytics, AnalyticsEvent, ConversionMetrics, UserInteraction } from '@/lib/analytics';

export interface UseAnalyticsReturn {
  // Tracking functions
  trackEvent: (event: string, category: string, action: string, label?: string, value?: number, metadata?: Record<string, any>) => void;
  trackEcommerceEvent: (action: string, data: Record<string, any>) => void;
  trackPageView: (page?: string) => void;
  trackConversion: (type: string, value?: number, metadata?: Record<string, any>) => void;
  trackProductView: (productId: string, productName: string, category: string, price: number) => void;
  trackAddToCart: (productId: string, productName: string, price: number, quantity: number) => void;
  trackRemoveFromCart: (productId: string, productName: string) => void;
  trackCheckoutStart: (cartValue: number, itemCount: number) => void;
  trackPurchase: (orderId: string, value: number, items: any[]) => void;
  trackSearch: (query: string, resultsCount: number) => void;
  
  // Data retrieval
  getEvents: () => AnalyticsEvent[];
  getInteractions: () => UserInteraction[];
  getConversionMetrics: () => ConversionMetrics;
  getSessionId: () => string;
  
  // State
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  
  // Real-time metrics
  sessionMetrics: ConversionMetrics;
  refreshMetrics: () => void;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isEnabled, setIsEnabled] = useState(true);
  const [sessionMetrics, setSessionMetrics] = useState<ConversionMetrics>({
    cartAdditions: 0,
    cartRemovals: 0,
    checkoutStarts: 0,
    checkoutCompletions: 0,
    productViews: 0,
    categoryViews: 0,
    searchQueries: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    cartAbandonmentRate: 0,
  });

  // Track page views automáticamente cuando cambia la ruta
  useEffect(() => {
    if (isEnabled) {
      analytics.trackPageView(pathname);
    }
  }, [pathname, isEnabled]);

  // Actualizar métricas periódicamente
  useEffect(() => {
    const updateMetrics = () => {
      setSessionMetrics(analytics.getConversionMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Habilitar/deshabilitar analytics
  useEffect(() => {
    if (isEnabled) {
      analytics.enable();
    } else {
      analytics.disable();
    }
  }, [isEnabled]);

  const trackEvent = useCallback((
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    if (!isEnabled) return;
    
    const enrichedMetadata = {
      ...metadata,
      userId: user?.id,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
    };
    
    optimizedAnalytics.trackEvent(event, category, action, label, value, enrichedMetadata);
  }, [isEnabled, user]);

  const trackEcommerceEvent = useCallback((action: string, data: Record<string, any>) => {
    if (!isEnabled) return;
    
    const enrichedData = {
      ...data,
      userId: user?.id,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
    };
    
    analytics.trackEcommerceEvent(action, enrichedData);
  }, [isEnabled, user]);

  const trackPageView = useCallback((page?: string) => {
    if (!isEnabled) return;
    analytics.trackPageView(page);
  }, [isEnabled]);

  const trackConversion = useCallback((type: string, value?: number, metadata?: Record<string, any>) => {
    if (!isEnabled) return;
    
    const enrichedMetadata = {
      ...metadata,
      userId: user?.id,
    };
    
    analytics.trackConversion(type, value, enrichedMetadata);
  }, [isEnabled, user]);

  // Funciones específicas para e-commerce
  const trackProductView = useCallback((
    productId: string,
    productName: string,
    category: string,
    price: number
  ) => {
    trackEcommerceEvent('view_item', {
      item_id: productId,
      item_name: productName,
      item_category: category,
      price: price,
      currency: 'ARS',
    });
  }, [trackEcommerceEvent]);

  const trackAddToCart = useCallback((
    productId: string,
    productName: string,
    price: number,
    quantity: number
  ) => {
    trackEcommerceEvent('add_to_cart', {
      item_id: productId,
      item_name: productName,
      price: price,
      quantity: quantity,
      currency: 'ARS',
      value: price * quantity,
    });
  }, [trackEcommerceEvent]);

  const trackRemoveFromCart = useCallback((
    productId: string,
    productName: string
  ) => {
    trackEcommerceEvent('remove_from_cart', {
      item_id: productId,
      item_name: productName,
    });
  }, [trackEcommerceEvent]);

  const trackCheckoutStart = useCallback((
    cartValue: number,
    itemCount: number
  ) => {
    trackEcommerceEvent('begin_checkout', {
      value: cartValue,
      currency: 'ARS',
      num_items: itemCount,
    });
  }, [trackEcommerceEvent]);

  const trackPurchase = useCallback((
    orderId: string,
    value: number,
    items: any[]
  ) => {
    trackEcommerceEvent('purchase', {
      transaction_id: orderId,
      value: value,
      currency: 'ARS',
      items: items,
    });
    
    // También trackear como conversión
    trackConversion('purchase', value, {
      orderId,
      itemCount: items.length,
    });
  }, [trackEcommerceEvent, trackConversion]);

  const trackSearch = useCallback((
    query: string,
    resultsCount: number
  ) => {
    trackEcommerceEvent('search', {
      search_term: query,
      results_count: resultsCount,
    });
  }, [trackEcommerceEvent]);

  const getEvents = useCallback(() => {
    return analytics.getEvents();
  }, []);

  const getInteractions = useCallback(() => {
    return analytics.getInteractions();
  }, []);

  const getConversionMetrics = useCallback(() => {
    return analytics.getConversionMetrics();
  }, []);

  const getSessionId = useCallback(() => {
    return analytics.getSessionId();
  }, []);

  const refreshMetrics = useCallback(() => {
    setSessionMetrics(analytics.getConversionMetrics());
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
  }, []);

  return {
    // Tracking functions
    trackEvent,
    trackEcommerceEvent,
    trackPageView,
    trackConversion,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckoutStart,
    trackPurchase,
    trackSearch,
    
    // Data retrieval
    getEvents,
    getInteractions,
    getConversionMetrics,
    getSessionId,
    
    // State
    isEnabled,
    setEnabled,
    
    // Real-time metrics
    sessionMetrics,
    refreshMetrics,
  };
};

// Hook específico para métricas en tiempo real
export const useRealTimeMetrics = (refreshInterval: number = 5000) => {
  const [metrics, setMetrics] = useState<ConversionMetrics>({
    cartAdditions: 0,
    cartRemovals: 0,
    checkoutStarts: 0,
    checkoutCompletions: 0,
    productViews: 0,
    categoryViews: 0,
    searchQueries: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    cartAbandonmentRate: 0,
  });

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(analytics.getConversionMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return metrics;
};

// Hook para tracking automático de componentes
export const useComponentTracking = (componentName: string, trackMount: boolean = true) => {
  const { trackEvent } = useOptimizedAnalytics();

  useEffect(() => {
    if (trackMount) {
      trackEvent('component_mount', 'ui', 'mount', componentName);
    }

    return () => {
      trackEvent('component_unmount', 'ui', 'unmount', componentName);
    };
  }, [componentName, trackMount, trackEvent]);

  const trackComponentEvent = useCallback((action: string, metadata?: Record<string, any>) => {
    trackEvent('component_interaction', 'ui', action, componentName, undefined, metadata);
  }, [componentName, trackEvent]);

  return { trackComponentEvent };
};
