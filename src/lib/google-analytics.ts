/**
 * Configuración de Google Analytics 4 para Pinteya E-commerce
 * Integración con el sistema de analytics personalizado
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Verificar si GA está habilitado y disponible
export const isGAEnabled = (): boolean => {
  return !!GA_TRACKING_ID && typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Verificar si GA está listo para usar
export const isGAReady = (): boolean => {
  return typeof window !== 'undefined' &&
         typeof window.gtag === 'function' &&
         Array.isArray(window.dataLayer);
};

// Esperar a que GA esté listo
export const waitForGA = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isGAReady()) {
      resolve();
      return;
    }

    const checkGA = () => {
      if (isGAReady()) {
        resolve();
      } else {
        setTimeout(checkGA, 100);
      }
    };

    checkGA();
  });
};

// Inicializar Google Analytics
export const initGA = (): void => {
  if (!isGAEnabled()) return;

  // Crear dataLayer si no existe
  window.dataLayer = window.dataLayer || [];
  
  // Función gtag
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // Configuración inicial
  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: false, // Manejamos page views manualmente
  });
};

// Trackear page view
export const trackPageView = (url: string, title?: string): void => {
  if (!isGAEnabled()) return;

  try {
    window.gtag('config', GA_TRACKING_ID, {
      page_title: title || document.title,
      page_location: url,
    });

    window.gtag('event', 'page_view', {
      page_title: title || document.title,
      page_location: url,
    });
  } catch (error) {
    console.warn('Error tracking page view:', error);
  }
};

// Trackear evento personalizado
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number,
  customParameters?: Record<string, any>
): void => {
  if (!isGAEnabled()) return;

  try {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParameters,
    });
  } catch (error) {
    console.warn('Error tracking event:', error);
  }
};

// Eventos específicos de e-commerce
export const trackEcommerceEvent = (
  eventName: string,
  parameters: Record<string, any>
): void => {
  if (!isGAEnabled()) return;

  try {
    window.gtag('event', eventName, parameters);
  } catch (error) {
    console.warn('Error tracking ecommerce event:', error);
  }
};

// Trackear vista de producto
export const trackProductView = (
  itemId: string,
  itemName: string,
  category: string,
  price: number,
  currency: string = 'ARS'
): void => {
  trackEcommerceEvent('view_item', {
    currency,
    value: price,
    items: [
      {
        item_id: itemId,
        item_name: itemName,
        item_category: category,
        price: price,
        quantity: 1,
      },
    ],
  });
};

// Trackear agregar al carrito
export const trackAddToCart = (
  itemId: string,
  itemName: string,
  category: string,
  price: number,
  quantity: number,
  currency: string = 'ARS'
): void => {
  trackEcommerceEvent('add_to_cart', {
    currency,
    value: price * quantity,
    items: [
      {
        item_id: itemId,
        item_name: itemName,
        item_category: category,
        price: price,
        quantity: quantity,
      },
    ],
  });
};

// Trackear remover del carrito
export const trackRemoveFromCart = (
  itemId: string,
  itemName: string,
  category: string,
  price: number,
  quantity: number,
  currency: string = 'ARS'
): void => {
  trackEcommerceEvent('remove_from_cart', {
    currency,
    value: price * quantity,
    items: [
      {
        item_id: itemId,
        item_name: itemName,
        item_category: category,
        price: price,
        quantity: quantity,
      },
    ],
  });
};

// Trackear inicio de checkout
export const trackBeginCheckout = (
  items: Array<{
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    quantity: number;
  }>,
  value: number,
  currency: string = 'ARS'
): void => {
  trackEcommerceEvent('begin_checkout', {
    currency,
    value,
    items,
  });
};

// Trackear compra completada
export const trackPurchase = (
  transactionId: string,
  items: Array<{
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    quantity: number;
  }>,
  value: number,
  currency: string = 'ARS',
  shipping?: number,
  tax?: number
): void => {
  trackEcommerceEvent('purchase', {
    transaction_id: transactionId,
    currency,
    value,
    shipping: shipping || 0,
    tax: tax || 0,
    items,
  });
};

// Trackear búsqueda
export const trackSearch = (
  searchTerm: string,
  resultsCount?: number
): void => {
  trackEvent('search', 'engagement', searchTerm, resultsCount, {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

// Trackear interacción con contenido
export const trackContentInteraction = (
  contentType: string,
  contentId: string,
  action: string
): void => {
  trackEvent(action, 'content', contentId, undefined, {
    content_type: contentType,
    content_id: contentId,
  });
};

// Trackear conversión personalizada
export const trackConversion = (
  conversionName: string,
  value?: number,
  currency: string = 'ARS'
): void => {
  trackEvent('conversion', 'ecommerce', conversionName, value, {
    currency,
    conversion_name: conversionName,
  });
};

// Trackear tiempo en página
export const trackTimeOnPage = (
  timeInSeconds: number,
  page: string
): void => {
  trackEvent('time_on_page', 'engagement', page, timeInSeconds, {
    page_path: page,
    time_seconds: timeInSeconds,
  });
};

// Trackear scroll depth
export const trackScrollDepth = (
  percentage: number,
  page: string
): void => {
  trackEvent('scroll_depth', 'engagement', page, percentage, {
    page_path: page,
    scroll_percentage: percentage,
  });
};

// Trackear error
export const trackError = (
  errorMessage: string,
  errorType: string,
  page: string
): void => {
  trackEvent('exception', 'error', errorMessage, undefined, {
    description: errorMessage,
    error_type: errorType,
    page_path: page,
    fatal: false,
  });
};

// Configurar usuario
export const setUserProperties = (
  userId: string,
  properties: Record<string, any>
): void => {
  if (!isGAEnabled()) return;

  window.gtag('config', GA_TRACKING_ID, {
    user_id: userId,
    custom_map: properties,
  });
};

// Configurar consentimiento
export const setConsent = (
  adStorage: 'granted' | 'denied',
  analyticsStorage: 'granted' | 'denied'
): void => {
  if (!isGAEnabled()) return;

  window.gtag('consent', 'update', {
    ad_storage: adStorage,
    analytics_storage: analyticsStorage,
  });
};

// Utilidades para Enhanced Ecommerce
export const enhancedEcommerce = {
  // Trackear vista de lista de productos
  viewItemList: (
    items: Array<{
      item_id: string;
      item_name: string;
      item_category: string;
      price: number;
      index: number;
    }>,
    listName: string
  ) => {
    trackEcommerceEvent('view_item_list', {
      item_list_name: listName,
      items,
    });
  },

  // Trackear click en producto de lista
  selectItem: (
    itemId: string,
    itemName: string,
    category: string,
    listName: string,
    index: number
  ) => {
    trackEcommerceEvent('select_item', {
      item_list_name: listName,
      items: [
        {
          item_id: itemId,
          item_name: itemName,
          item_category: category,
          index,
        },
      ],
    });
  },

  // Trackear promoción vista
  viewPromotion: (
    promotionId: string,
    promotionName: string,
    creativeName?: string,
    creativeSlot?: string
  ) => {
    trackEcommerceEvent('view_promotion', {
      promotion_id: promotionId,
      promotion_name: promotionName,
      creative_name: creativeName,
      creative_slot: creativeSlot,
    });
  },

  // Trackear click en promoción
  selectPromotion: (
    promotionId: string,
    promotionName: string,
    creativeName?: string,
    creativeSlot?: string
  ) => {
    trackEcommerceEvent('select_promotion', {
      promotion_id: promotionId,
      promotion_name: promotionName,
      creative_name: creativeName,
      creative_slot: creativeSlot,
    });
  },
};
