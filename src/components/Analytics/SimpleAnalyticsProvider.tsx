"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Tipos simplificados
interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackPageView: (pageName: string, properties?: Record<string, any>) => void;
  trackClick: (elementName: string, properties?: Record<string, any>) => void;
  trackHover: (elementName: string, properties?: Record<string, any>) => void;
  trackScroll: (scrollData: { scrollY: number; scrollPercent: number }) => void;
  trackConversion: (conversionType: string, properties?: Record<string, any>) => void;
  trackSearch: (searchTerm: string, results?: number) => void;
  trackCartAction: (action: string, productId?: string, properties?: Record<string, any>) => void;
  trackProductView: (productId: string, productName: string, properties?: Record<string, any>) => void;
  trackCategoryView: (categoryName: string, properties?: Record<string, any>) => void;
  trackUserAction: (action: string, properties?: Record<string, any>) => void;
  isEnabled: boolean;
}

// Contexto
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Hook para usar el contexto
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// Props del provider
interface SimpleAnalyticsProviderProps {
  children: ReactNode;
}

// Provider simplificado
export const SimpleAnalyticsProvider: React.FC<SimpleAnalyticsProviderProps> = ({ children }) => {
  // Funciones mock para analytics
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    console.log('📊 Analytics Event:', eventName, properties);
  };

  const trackPageView = (pageName: string, properties?: Record<string, any>) => {
    console.log('📄 Page View:', pageName, properties);
  };

  const trackClick = (elementName: string, properties?: Record<string, any>) => {
    console.log('🖱️ Click:', elementName, properties);
  };

  const trackHover = (elementName: string, properties?: Record<string, any>) => {
    console.log('👆 Hover:', elementName, properties);
  };

  const trackScroll = (scrollData: { scrollY: number; scrollPercent: number }) => {
    console.log('📜 Scroll:', scrollData);
  };

  const trackConversion = (conversionType: string, properties?: Record<string, any>) => {
    console.log('💰 Conversion:', conversionType, properties);
  };

  const trackSearch = (searchTerm: string, results?: number) => {
    console.log('🔍 Search:', searchTerm, 'Results:', results);
  };

  const trackCartAction = (action: string, productId?: string, properties?: Record<string, any>) => {
    console.log('🛒 Cart Action:', action, productId, properties);
  };

  const trackProductView = (productId: string, productName: string, properties?: Record<string, any>) => {
    console.log('👁️ Product View:', productId, productName, properties);
  };

  const trackCategoryView = (categoryName: string, properties?: Record<string, any>) => {
    console.log('📂 Category View:', categoryName, properties);
  };

  const trackUserAction = (action: string, properties?: Record<string, any>) => {
    console.log('👤 User Action:', action, properties);
  };

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
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};
