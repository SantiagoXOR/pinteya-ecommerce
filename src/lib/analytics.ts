/**
 * Sistema de Analytics para Pinteya E-commerce
 * Tracking de eventos, métricas de conversión y análisis de comportamiento
 */

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
  page: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export interface ConversionMetrics {
  cartAdditions: number;
  cartRemovals: number;
  checkoutStarts: number;
  checkoutCompletions: number;
  productViews: number;
  categoryViews: number;
  searchQueries: number;
  conversionRate: number;
  averageOrderValue: number;
  cartAbandonmentRate: number;
}

export interface UserInteraction {
  type: 'click' | 'hover' | 'scroll' | 'focus' | 'input';
  element: string;
  x: number;
  y: number;
  timestamp: number;
  page: string;
  sessionId: string;
}

class AnalyticsManager {
  private events: AnalyticsEvent[] = [];
  private interactions: UserInteraction[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    // No inicializar automáticamente - usar lazy initialization
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async ensureInitialized(): Promise<void> {
    // Si ya está inicializado, no hacer nada
    if (this.isInitialized) return;

    // Si ya hay una inicialización en progreso, esperar a que termine
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Crear la promesa de inicialización
    this.initializationPromise = this.initializeTracking();

    try {
      await this.initializationPromise;
    } catch (error) {
      // En caso de error, limpiar la promesa para permitir reintentos
      this.initializationPromise = null;
      throw error;
    }
  }

  private async initializeTracking(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isInitialized) return;

    try {
      // Esperar a que el DOM esté listo
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }

      // Marcar como inicializado ANTES de hacer cualquier tracking
      // para evitar recursión infinita
      this.isInitialized = true;

      // Track page views automáticamente (ahora que ya está inicializado)
      this.trackPageView();

      // Track clicks globalmente
      document.addEventListener('click', this.handleClick.bind(this));

      // Track scroll events
      let scrollTimeout: NodeJS.Timeout;
      document.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.trackInteraction('scroll', 'page', window.scrollX, window.scrollY);
        }, 100);
      });

      // Track form interactions
      document.addEventListener('input', this.handleInput.bind(this));
      document.addEventListener('focus', this.handleFocus.bind(this));

    } catch (error) {
      console.warn('Error initializing analytics tracking:', error);
      // En caso de error, resetear el estado de inicialización
      this.isInitialized = false;
    }
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const elementInfo = this.getElementInfo(target);
    
    this.trackInteraction('click', elementInfo, event.clientX, event.clientY);
    
    // Track specific e-commerce events
    if (target.closest('[data-analytics="add-to-cart"]')) {
      this.trackEcommerceEvent('add_to_cart', {
        productId: target.getAttribute('data-product-id'),
        productName: target.getAttribute('data-product-name'),
        price: target.getAttribute('data-product-price'),
      });
    }
    
    if (target.closest('[data-analytics="remove-from-cart"]')) {
      this.trackEcommerceEvent('remove_from_cart', {
        productId: target.getAttribute('data-product-id'),
      });
    }
    
    if (target.closest('[data-analytics="checkout-start"]')) {
      this.trackEcommerceEvent('begin_checkout', {
        cartValue: target.getAttribute('data-cart-value'),
        itemCount: target.getAttribute('data-item-count'),
      });
    }
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLElement;
    const elementInfo = this.getElementInfo(target);
    this.trackInteraction('input', elementInfo, 0, 0);
  }

  private handleFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    const elementInfo = this.getElementInfo(target);
    this.trackInteraction('focus', elementInfo, 0, 0);
  }

  private getElementInfo(element: HTMLElement): string {
    const id = element.id ? `#${element.id}` : '';

    // Manejar className que puede ser string o DOMTokenList
    let className = '';
    if (element.className) {
      // Si className es un DOMTokenList, convertir a string
      const classNameValue = element.className as string | DOMTokenList;
      const classNameStr = typeof classNameValue === 'string'
        ? classNameValue
        : classNameValue.toString();

      // Solo procesar si hay clases
      if (classNameStr.trim()) {
        className = `.${classNameStr.split(' ').filter(cls => cls.trim()).join('.')}`;
      }
    }

    const tagName = element.tagName.toLowerCase();
    const dataAnalytics = element.getAttribute('data-analytics') || '';

    return `${tagName}${id}${className}${dataAnalytics ? `[${dataAnalytics}]` : ''}`;
  }

  public async trackEvent(
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled) return;

    // Solo inicializar si no está ya inicializado para evitar recursión
    if (!this.isInitialized) {
      await this.ensureInitialized();
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      category,
      action,
      label,
      value,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      metadata,
    };

    this.events.push(analyticsEvent);
    this.sendToAnalytics(analyticsEvent);
  }

  public async trackEcommerceEvent(action: string, data: Record<string, any>): Promise<void> {
    await this.trackEvent('ecommerce', 'shop', action, undefined, undefined, data);
  }

  public async trackPageView(page?: string): Promise<void> {
    const currentPage = page || (typeof window !== 'undefined' ? window.location.pathname : '');
    await this.trackEvent('page_view', 'navigation', 'view', currentPage);
  }

  public async trackInteraction(
    type: UserInteraction['type'],
    element: string,
    x: number,
    y: number
  ): Promise<void> {
    if (!this.isEnabled) return;

    // Solo inicializar si no está ya inicializado para evitar recursión
    if (!this.isInitialized) {
      await this.ensureInitialized();
    }

    const interaction: UserInteraction = {
      type,
      element,
      x,
      y,
      timestamp: Date.now(),
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      sessionId: this.sessionId,
    };

    this.interactions.push(interaction);
  }

  public async trackConversion(type: string, value?: number, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent('conversion', 'ecommerce', type, undefined, value, metadata);
  }

  private sendToAnalytics(event: AnalyticsEvent): void {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Enviar a Google Analytics 4
    if ((window as any).gtag) {
      try {
        (window as any).gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          custom_parameter_session_id: event.sessionId,
          ...event.metadata,
        });
      } catch (error) {
        console.warn('Error sending event to GA:', error);
      }
    }

    // Enviar a nuestro endpoint interno con mejor manejo de errores
    this.sendToInternalAPI(event);
  }

  private eventQueue: AnalyticsEvent[] = [];
  private isProcessingQueue: boolean = false;
  private queueTimeout: NodeJS.Timeout | null = null;

  private async sendToInternalAPI(event: AnalyticsEvent): Promise<void> {
    // Agregar evento a la cola en lugar de enviarlo inmediatamente
    this.eventQueue.push(event);

    // Procesar la cola con debounce
    this.debouncedProcessQueue();
  }

  private debouncedProcessQueue(): void {
    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout);
    }

    this.queueTimeout = setTimeout(() => {
      this.processEventQueue();
    }, 100); // Debounce de 100ms
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessingQueue || this.eventQueue.length === 0) return;
    if (typeof window === 'undefined') return;

    this.isProcessingQueue = true;

    try {
      // Verificar que el documento está listo
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }

      // Procesar eventos en lotes
      const eventsToProcess = [...this.eventQueue];
      this.eventQueue = [];

      // Enviar eventos en lotes de 5 para evitar rate limiting
      const batchSize = 5;
      for (let i = 0; i < eventsToProcess.length; i += batchSize) {
        const batch = eventsToProcess.slice(i, i + batchSize);

        for (const event of batch) {
          try {
            const response = await fetch('/api/analytics/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (error) {
            // En caso de error, almacenar el evento para reintento
            this.storeEventForRetry(event);
          }
        }

        // Pausa entre lotes para evitar rate limiting
        if (i + batchSize < eventsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Analytics queue processing error (non-critical):', error);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private storeEventForRetry(event: AnalyticsEvent): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const failedEvents = JSON.parse(localStorage.getItem('analytics_failed_events') || '[]');
        failedEvents.push(event);

        // Limitar a los últimos 50 eventos fallidos
        if (failedEvents.length > 50) {
          failedEvents.splice(0, failedEvents.length - 50);
        }

        localStorage.setItem('analytics_failed_events', JSON.stringify(failedEvents));
      }
    } catch (error) {
      // Ignorar errores de localStorage
    }
  }

  public getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  public getInteractions(): UserInteraction[] {
    return [...this.interactions];
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public clearData(): void {
    this.events = [];
    this.interactions = [];
    this.eventQueue = [];

    // Limpiar timeouts
    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout);
      this.queueTimeout = null;
    }
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public async initialize(): Promise<void> {
    await this.ensureInitialized();
  }

  public getConversionMetrics(): ConversionMetrics {
    const ecommerceEvents = this.events.filter(e => e.category === 'shop');
    
    const cartAdditions = ecommerceEvents.filter(e => e.action === 'add_to_cart').length;
    const cartRemovals = ecommerceEvents.filter(e => e.action === 'remove_from_cart').length;
    const checkoutStarts = ecommerceEvents.filter(e => e.action === 'begin_checkout').length;
    const checkoutCompletions = ecommerceEvents.filter(e => e.action === 'purchase').length;
    const productViews = this.events.filter(e => e.category === 'navigation' && e.label?.includes('/product/')).length;
    const categoryViews = this.events.filter(e => e.category === 'navigation' && e.label?.includes('/category/')).length;
    const searchQueries = ecommerceEvents.filter(e => e.action === 'search').length;

    const conversionRate = checkoutStarts > 0 ? (checkoutCompletions / checkoutStarts) * 100 : 0;
    const cartAbandonmentRate = cartAdditions > 0 ? ((cartAdditions - checkoutCompletions) / cartAdditions) * 100 : 0;
    
    // Calcular AOV desde los eventos de compra
    const purchaseEvents = ecommerceEvents.filter(e => e.action === 'purchase');
    const totalValue = purchaseEvents.reduce((sum, event) => sum + (event.value || 0), 0);
    const averageOrderValue = purchaseEvents.length > 0 ? totalValue / purchaseEvents.length : 0;

    return {
      cartAdditions,
      cartRemovals,
      checkoutStarts,
      checkoutCompletions,
      productViews,
      categoryViews,
      searchQueries,
      conversionRate,
      averageOrderValue,
      cartAbandonmentRate,
    };
  }
}

// Singleton instance
export const analytics = new AnalyticsManager();

// Utility functions con manejo de errores
export const trackEvent = async (
  event: string,
  category: string,
  action: string,
  label?: string,
  value?: number,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await analytics.trackEvent(event, category, action, label, value, metadata);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics trackEvent error:', error);
    }
  }
};

export const trackEcommerceEvent = async (action: string, data: Record<string, any>): Promise<void> => {
  try {
    await analytics.trackEcommerceEvent(action, data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics trackEcommerceEvent error:', error);
    }
  }
};

export const trackPageView = async (page?: string): Promise<void> => {
  try {
    await analytics.trackPageView(page);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics trackPageView error:', error);
    }
  }
};

export const trackConversion = async (type: string, value?: number, metadata?: Record<string, any>): Promise<void> => {
  try {
    await analytics.trackConversion(type, value, metadata);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics trackConversion error:', error);
    }
  }
};

export const initializeAnalytics = async (): Promise<void> => {
  try {
    await analytics.initialize();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics initialization error:', error);
    }
  }
};
