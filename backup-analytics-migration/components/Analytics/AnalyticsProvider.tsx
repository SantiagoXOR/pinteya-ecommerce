/**
 * Provider de Analytics para Pinteya E-commerce
 * Proporciona contexto global para tracking y métricas
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { analytics, initializeAnalytics } from '@/lib/analytics';
import { initGA, trackPageView as gaTrackPageView } from '@/lib/google-analytics';
import { useUserRole } from '@/hooks/useUserRole';

// Hook seguro para usar Clerk
const useSafeUser = () => {
  try {
    return useUser();
  } catch (error) {
    console.warn('Clerk not available, using fallback user state');
    return { user: null, isLoaded: true, isSignedIn: false };
  }
};

interface AnalyticsContextType {
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  trackEvent: (event: string, category: string, action: string, label?: string, value?: number, metadata?: Record<string, any>) => void;
  trackEcommerceEvent: (action: string, data: Record<string, any>) => void;
  trackPageView: (page?: string) => void;
  trackConversion: (type: string, value?: number, metadata?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  enableGA?: boolean;
  enableCustomAnalytics?: boolean;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  enableGA = true,
  enableCustomAnalytics = true,
}) => {
  const { user } = useSafeUser();
  const { userProfile, role, isAdmin, hasPermission } = useUserRole();
  const pathname = usePathname();
  const [isEnabled, setIsEnabled] = useState(true);

  // Inicializar Google Analytics y Analytics personalizado
  useEffect(() => {
    const initializeAnalyticsSystem = async () => {
      try {
        if (enableGA && typeof window !== 'undefined') {
          initGA();
        }

        if (enableCustomAnalytics && typeof window !== 'undefined') {
          await initializeAnalytics();
        }
      } catch (error) {
        console.warn('Error initializing analytics system:', error);
      }
    };

    initializeAnalyticsSystem();
  }, [enableGA, enableCustomAnalytics]);

  // Track page views automáticamente
  useEffect(() => {
    if (isEnabled && typeof window !== 'undefined') {
      const url = window.location.href;
      
      // Track en nuestro sistema
      if (enableCustomAnalytics) {
        analytics.trackPageView(pathname);
      }
      
      // Track en Google Analytics
      if (enableGA) {
        gaTrackPageView(url);
      }
    }
  }, [pathname, isEnabled, enableGA, enableCustomAnalytics]);

  // Configurar usuario cuando se autentica
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      // Configurar propiedades de usuario en GA
      if (enableGA && window.gtag) {
        try {
          window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
            user_id: user.id,
            custom_map: {
              user_email: user.emailAddresses?.[0]?.emailAddress,
              user_role: user.publicMetadata?.role || 'customer',
            },
          });
        } catch (error) {
          console.warn('Error configuring GA user properties:', error);
        }
      }
    }
  }, [user, enableGA]);

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
        userEmail: user?.emailAddresses?.[0]?.emailAddress,
        userRole: user?.publicMetadata?.role || 'guest',
      };

      // Track en nuestro sistema
      if (enableCustomAnalytics) {
        await analytics.trackEvent(event, category, action, label, value, enrichedMetadata);
      }

      // Track en Google Analytics
      if (enableGA && typeof window !== 'undefined' && window.gtag) {
        try {
          window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
            ...enrichedMetadata,
          });
        } catch (error) {
          console.warn('Error tracking GA event:', error);
        }
      }
    } catch (error) {
      console.warn('Error in trackEvent:', error);
    }
  };

  const trackEcommerceEvent = (action: string, data: Record<string, any>) => {
    if (!isEnabled) return;

    const enrichedData = {
      ...data,
      userId: user?.id,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
    };

    // Track en nuestro sistema
    if (enableCustomAnalytics) {
      analytics.trackEcommerceEvent(action, enrichedData);
    }

    // Track en Google Analytics
    if (enableGA && typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', action, enrichedData);
      } catch (error) {
        console.warn('Error tracking GA ecommerce event:', error);
      }
    }
  };

  const trackPageView = (page?: string) => {
    if (!isEnabled) return;

    const currentPage = page || pathname;

    // Track en nuestro sistema
    if (enableCustomAnalytics) {
      analytics.trackPageView(currentPage);
    }

    // Track en Google Analytics
    if (enableGA && typeof window !== 'undefined') {
      gaTrackPageView(window.location.href);
    }
  };

  const trackConversion = (type: string, value?: number, metadata?: Record<string, any>) => {
    if (!isEnabled) return;

    const enrichedMetadata = {
      ...metadata,
      userId: user?.id,
    };

    // Track en nuestro sistema
    if (enableCustomAnalytics) {
      analytics.trackConversion(type, value, enrichedMetadata);
    }

    // Track en Google Analytics como evento de conversión
    if (enableGA && typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', 'conversion', {
          event_category: 'ecommerce',
          event_label: type,
          value: value,
          ...enrichedMetadata,
        });
      } catch (error) {
        console.warn('Error tracking GA conversion:', error);
      }
    }
  };

  const contextValue: AnalyticsContextType = {
    isEnabled,
    setEnabled: setIsEnabled,
    trackEvent,
    trackEcommerceEvent,
    trackPageView,
    trackConversion,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};

// HOC para tracking automático de componentes
export function withAnalytics<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string,
  trackMount: boolean = true
) {
  const WithAnalyticsComponent = (props: P) => {
    const { trackEvent } = useAnalyticsContext();

    useEffect(() => {
      if (trackMount) {
        trackEvent('component_mount', 'ui', 'mount', componentName);
      }

      return () => {
        trackEvent('component_unmount', 'ui', 'unmount', componentName);
      };
    }, [trackEvent]);

    return <WrappedComponent {...props} />;
  };

  WithAnalyticsComponent.displayName = `withAnalytics(${componentName})`;
  return WithAnalyticsComponent;
}

// Hook para tracking de interacciones específicas
export const useTrackInteraction = () => {
  const { trackEvent } = useAnalyticsContext();

  const trackClick = (element: string, metadata?: Record<string, any>) => {
    trackEvent('click', 'interaction', 'click', element, undefined, metadata);
  };

  const trackHover = (element: string, metadata?: Record<string, any>) => {
    trackEvent('hover', 'interaction', 'hover', element, undefined, metadata);
  };

  const trackScroll = (depth: number, page: string) => {
    trackEvent('scroll', 'engagement', 'scroll_depth', page, depth);
  };

  const trackFormSubmit = (formName: string, success: boolean, metadata?: Record<string, any>) => {
    trackEvent('form_submit', 'engagement', success ? 'success' : 'error', formName, undefined, metadata);
  };

  const trackSearch = (query: string, resultsCount: number) => {
    trackEvent('search', 'engagement', 'search', query, resultsCount);
  };

  return {
    trackClick,
    trackHover,
    trackScroll,
    trackFormSubmit,
    trackSearch,
  };
};

// Hook para tracking de e-commerce específico
export const useTrackEcommerce = () => {
  const { trackEcommerceEvent, trackConversion } = useAnalyticsContext();

  const trackProductView = (productId: string, productName: string, category: string, price: number) => {
    trackEcommerceEvent('view_item', {
      item_id: productId,
      item_name: productName,
      item_category: category,
      price: price,
      currency: 'ARS',
    });
  };

  const trackAddToCart = (productId: string, productName: string, price: number, quantity: number) => {
    trackEcommerceEvent('add_to_cart', {
      item_id: productId,
      item_name: productName,
      price: price,
      quantity: quantity,
      currency: 'ARS',
      value: price * quantity,
    });
  };

  const trackRemoveFromCart = (productId: string, productName: string) => {
    trackEcommerceEvent('remove_from_cart', {
      item_id: productId,
      item_name: productName,
    });
  };

  const trackCheckoutStart = (cartValue: number, itemCount: number) => {
    trackEcommerceEvent('begin_checkout', {
      value: cartValue,
      currency: 'ARS',
      num_items: itemCount,
    });
  };

  const trackPurchase = (orderId: string, value: number, items: any[]) => {
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
  };

  return {
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckoutStart,
    trackPurchase,
  };
};
