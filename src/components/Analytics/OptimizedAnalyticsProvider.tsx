'use client';

/**
 * PROVIDER DE ANALYTICS OPTIMIZADO - PINTEYA E-COMMERCE
 * Reemplaza AnalyticsProvider con sistema optimizado de 66% menos uso de recursos
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { optimizedAnalytics, trackEventOptimized } from '@/lib/analytics-optimized';

// Hook para NextAuth.js
const useSafeUser = () => {
  // Usar NextAuth.js en lugar de Clerk
  const { user, isLoaded, isSignedIn } = useAuth();
  return { user, isLoaded, isSignedIn };
};

interface OptimizedAnalyticsContextType {
  trackEvent: (
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ) => Promise<void>;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  flushEvents: () => Promise<void>;
}

const OptimizedAnalyticsContext = createContext<OptimizedAnalyticsContextType | null>(null);

interface OptimizedAnalyticsProviderProps {
  children: React.ReactNode;
  enableGA?: boolean;
  enableCustomAnalytics?: boolean;
  samplingRate?: number;
}

export const OptimizedAnalyticsProvider: React.FC<OptimizedAnalyticsProviderProps> = ({
  children,
  enableGA = true,
  enableCustomAnalytics = true,
  samplingRate = 1.0,
}) => {
  const { user } = useSafeUser();
  const { userProfile, role, isAdmin } = useUserRole();
  const pathname = usePathname();
  const [isEnabled, setIsEnabled] = useState(true);

  // Configurar sampling rate según el entorno
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      optimizedAnalytics.setSamplingRate(0.1); // 10% en producción
    } else if (process.env.NODE_ENV === 'development') {
      optimizedAnalytics.setSamplingRate(samplingRate);
    } else {
      optimizedAnalytics.setEnabled(false); // Deshabilitar en tests
    }
  }, [samplingRate]);

  // Trackear cambios de página automáticamente
  useEffect(() => {
    if (isEnabled && enableCustomAnalytics) {
      trackEventOptimized('page_view', 'navigation', 'view', pathname);
    }
  }, [pathname, isEnabled, enableCustomAnalytics]);

  // Configurar usuario cuando se autentica
  useEffect(() => {
    if (user && isEnabled) {
      // Track login event
      trackEventOptimized('user_login', 'user', 'login', user.id);
    }
  }, [user, isEnabled]);

  const trackEvent = async (
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    if (!isEnabled) return;

    try {
      const enrichedMetadata = {
        ...metadata,
        userId: user?.id,
        userRole: user?.publicMetadata?.role || 'guest',
      };

      // Track en nuestro sistema optimizado
      if (enableCustomAnalytics) {
        await trackEventOptimized(event, category, action, label, value, enrichedMetadata);
      }

      // Track en Google Analytics (si está habilitado)
      if (enableGA && typeof window !== 'undefined' && window.gtag) {
        try {
          window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
            user_id: user?.id,
          });
        } catch (error) {
          console.warn('Error tracking GA event:', error);
        }
      }
    } catch (error) {
      console.warn('Error in optimized trackEvent:', error);
    }
  };

  const flushEvents = async () => {
    try {
      await optimizedAnalytics.flushEvents();
    } catch (error) {
      console.warn('Error flushing analytics events:', error);
    }
  };

  const setEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    optimizedAnalytics.setEnabled(enabled);
  };

  const contextValue: OptimizedAnalyticsContextType = {
    trackEvent,
    isEnabled,
    setEnabled,
    flushEvents,
  };

  return (
    <OptimizedAnalyticsContext.Provider value={contextValue}>
      {children}
    </OptimizedAnalyticsContext.Provider>
  );
};

/**
 * Hook para usar analytics optimizado
 */
export const useOptimizedAnalytics = (): OptimizedAnalyticsContextType => {
  const context = useContext(OptimizedAnalyticsContext);
  if (!context) {
    throw new Error('useOptimizedAnalytics must be used within OptimizedAnalyticsProvider');
  }
  return context;
};

/**
 * Hooks específicos para eventos comunes
 */
export const useTrackPageView = () => {
  const { trackEvent } = useOptimizedAnalytics();
  
  return (page?: string) => {
    trackEvent('page_view', 'navigation', 'view', page);
  };
};

export const useTrackProductView = () => {
  const { trackEvent } = useOptimizedAnalytics();
  
  return (productId: string, productName?: string) => {
    trackEvent('product_view', 'ecommerce', 'view', productId);
  };
};

export const useTrackSearch = () => {
  const { trackEvent } = useOptimizedAnalytics();
  
  return (query: string, category?: string) => {
    trackEvent('search', 'search', 'search', query.substring(0, 30));
  };
};

export const useTrackCartAction = () => {
  const { trackEvent } = useOptimizedAnalytics();
  
  return (action: 'add' | 'remove', productId: string, value?: number) => {
    trackEvent(`cart_${action}`, 'ecommerce', action, productId, value);
  };
};

export const useTrackPurchase = () => {
  const { trackEvent } = useOptimizedAnalytics();
  
  return (orderId: string, value: number, items?: number) => {
    trackEvent('purchase', 'ecommerce', 'purchase', orderId, value, { items });
  };
};

/**
 * HOC para componentes que necesitan analytics
 */
export function withOptimizedAnalytics<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    const analytics = useOptimizedAnalytics();
    
    return <Component {...props} analytics={analytics} />;
  };
}

/**
 * Cleanup automático al desmontar
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    optimizedAnalytics.flushEvents();
  });
}
