/**
 * Sistema de Analytics para Pinteya E-commerce
 * Tracking de eventos, métricas de conversión y análisis de comportamiento
 */

export interface AnalyticsEvent {
  event: string
  category: string
  action: string
  label?: string
  value?: number
  userId?: string
  sessionId: string
  timestamp: number
  page: string
  userAgent: string
  metadata?: Record<string, any>
}

export interface ConversionMetrics {
  cartAdditions: number
  cartRemovals: number
  checkoutStarts: number
  checkoutCompletions: number
  productViews: number
  categoryViews: number
  searchQueries: number
  conversionRate: number
  averageOrderValue: number
  cartAbandonmentRate: number
}

export interface UserInteraction {
  type: 'click' | 'hover' | 'scroll' | 'focus' | 'input'
  element: string
  x: number
  y: number
  timestamp: number
  page: string
  sessionId: string
}

class AnalyticsManager {
  private events: AnalyticsEvent[] = []
  private interactions: UserInteraction[] = []
  private sessionId: string
  private isEnabled: boolean = true
  private isInitialized: boolean = false
  private initializationPromise: Promise<void> | null = null
  // ⚡ PERFORMANCE: Variables para optimizar scroll tracking
  private scrollTimeout: NodeJS.Timeout | null = null
  private scrollRAF: number | null = null
  private lastScrollY: number = 0
  
  // ⚡ FIX: inputTimeout como propiedad de clase para poder gestionarlo
  private inputTimeout: NodeJS.Timeout | null = null
  
  // ⚡ FIX: Referencias a event listeners para poder removerlos
  private clickHandler: ((event: MouseEvent) => void) | null = null
  private scrollHandler: (() => void) | null = null
  private inputHandler: ((event: Event) => void) | null = null
  private focusHandler: ((event: FocusEvent) => void) | null = null
  
  // ⚡ OPTIMIZACIÓN: Throttling para clicks
  private clickThrottleMap: Map<string, number> = new Map()
  private readonly CLICK_THROTTLE_MS = 1000 // Máximo 1 click por segundo por elemento
  
  // ⚡ OPTIMIZACIÓN: Flag para deshabilitar scroll tracking en móviles
  private readonly isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  constructor() {
    this.sessionId = this.generateSessionId()
    // No inicializar automáticamente - usar lazy initialization
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async ensureInitialized(): Promise<void> {
    // Si ya está inicializado, no hacer nada
    if (this.isInitialized) {
      return
    }

    // Si ya hay una inicialización en progreso, esperar a que termine
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // Crear la promesa de inicialización
    this.initializationPromise = this.initializeTracking()

    try {
      await this.initializationPromise
    } catch (error) {
      // En caso de error, limpiar la promesa para permitir reintentos
      this.initializationPromise = null
      throw error
    }
  }

  private async initializeTracking(): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }
    if (this.isInitialized) {
      return
    }

    // ⚡ FIX: Limpiar listeners existentes si hay alguno antes de inicializar
    this.cleanupListeners()

    try {
      // Esperar a que el DOM esté listo
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true })
        })
      }

      // Marcar como inicializado ANTES de hacer cualquier tracking
      // para evitar recursión infinita
      this.isInitialized = true

      // Track page views automáticamente (ahora que ya está inicializado)
      this.trackPageView()

      // ⚡ FIX: Guardar referencia al handler para poder removerlo
      // ⚡ OPTIMIZACIÓN: Delegación de eventos usando un solo listener
      // Usar event delegation en lugar de listeners directos
      this.clickHandler = this.handleClickDelegated.bind(this)
      document.addEventListener('click', this.clickHandler, { passive: true })

      // ⚡ OPTIMIZACIÓN: Track scroll events solo si no es móvil y con debounce más agresivo
      if (!this.isMobile) {
        this.scrollHandler = () => {
          // Cancelar RAF anterior si existe
          if (this.scrollRAF !== null) {
            cancelAnimationFrame(this.scrollRAF)
          }

          // Usar requestAnimationFrame para sincronizar con el render del navegador
          this.scrollRAF = requestAnimationFrame(() => {
            const currentScrollY = window.scrollY
            
            // Solo trackear si hay un cambio significativo (más de 50px) para reducir eventos
            if (Math.abs(currentScrollY - this.lastScrollY) > 50) {
              this.lastScrollY = currentScrollY
              
              // ⚡ OPTIMIZACIÓN: Debounce más agresivo (500ms en lugar de 250ms)
              if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout)
              }
              this.scrollTimeout = setTimeout(() => {
                this.trackInteraction('scroll', 'page', window.scrollX, window.scrollY)
              }, 500) // Aumentado a 500ms para reducir frecuencia
            }
            
            this.scrollRAF = null
          })
        }

        // ⚡ CRITICAL: Agregar passive: true para no bloquear el scroll
        document.addEventListener('scroll', this.scrollHandler, { passive: true })
      }

      // ⚡ FIX: inputTimeout ahora es propiedad de clase, handler guardado
      // Track form interactions con debounce
      this.inputHandler = (event: Event) => {
        if (this.inputTimeout) {
          clearTimeout(this.inputTimeout)
        }
        this.inputTimeout = setTimeout(() => {
          this.handleInput(event)
        }, 300) // Debounce de 300ms para inputs
      }
      document.addEventListener('input', this.inputHandler, { passive: true })
      
      // ⚡ FIX: Guardar referencia al handler para poder removerlo
      // Track focus events (menos frecuentes, no necesita debounce)
      this.focusHandler = this.handleFocus.bind(this)
      document.addEventListener('focus', this.focusHandler, { passive: true, capture: true })
    } catch (error) {
      console.warn('Error initializing analytics tracking:', error)
      // En caso de error, resetear el estado de inicialización
      this.isInitialized = false
    }
  }

  // ⚡ OPTIMIZACIÓN: Delegación de eventos para clicks
  private handleClickDelegated(event: MouseEvent): void {
    const target = event.target as HTMLElement
    if (!target) return

    // ⚡ OPTIMIZACIÓN: Throttling por elemento (máximo 1 click por segundo)
    const elementKey = this.getElementInfo(target)
    const now = Date.now()
    const lastClickTime = this.clickThrottleMap.get(elementKey) || 0
    
    if (now - lastClickTime < this.CLICK_THROTTLE_MS) {
      return // Ignorar clicks muy frecuentes en el mismo elemento
    }
    
    this.clickThrottleMap.set(elementKey, now)
    
    // Limpiar mapa de throttling periódicamente (mantener solo últimos 100 elementos)
    if (this.clickThrottleMap.size > 100) {
      const entries = Array.from(this.clickThrottleMap.entries())
      entries.sort((a, b) => b[1] - a[1]) // Ordenar por timestamp
      this.clickThrottleMap.clear()
      entries.slice(0, 50).forEach(([key, time]) => {
        this.clickThrottleMap.set(key, time)
      })
    }

    this.trackInteraction('click', elementKey, event.clientX, event.clientY)

    // Track specific e-commerce events
    if (target.closest('[data-analytics="add-to-cart"]')) {
      this.trackEcommerceEvent('add_to_cart', {
        productId: target.getAttribute('data-product-id'),
        productName: target.getAttribute('data-product-name'),
        price: target.getAttribute('data-product-price'),
      })
    }

    if (target.closest('[data-analytics="remove-from-cart"]')) {
      this.trackEcommerceEvent('remove_from_cart', {
        productId: target.getAttribute('data-product-id'),
      })
    }

    if (target.closest('[data-analytics="checkout-start"]')) {
      this.trackEcommerceEvent('begin_checkout', {
        cartValue: target.getAttribute('data-cart-value'),
        itemCount: target.getAttribute('data-item-count'),
      })
    }
  }
  
  // Mantener método original para compatibilidad (deprecated)
  private handleClick(event: MouseEvent): void {
    this.handleClickDelegated(event)
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLElement
    const elementInfo = this.getElementInfo(target)
    this.trackInteraction('input', elementInfo, 0, 0)
  }

  private handleFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement
    const elementInfo = this.getElementInfo(target)
    this.trackInteraction('focus', elementInfo, 0, 0)
  }

  private getElementInfo(element: HTMLElement): string {
    const id = element.id ? `#${element.id}` : ''

    // Manejar className que puede ser string o DOMTokenList
    let className = ''
    if (element.className) {
      // Si className es un DOMTokenList, convertir a string
      const classNameValue = element.className as string | DOMTokenList
      const classNameStr =
        typeof classNameValue === 'string' ? classNameValue : classNameValue.toString()

      // Solo procesar si hay clases
      if (classNameStr.trim()) {
        className = `.${classNameStr
          .split(' ')
          .filter(cls => cls.trim())
          .join('.')}`
      }
    }

    const tagName = element.tagName.toLowerCase()
    const dataAnalytics = element.getAttribute('data-analytics') || ''

    return `${tagName}${id}${className}${dataAnalytics ? `[${dataAnalytics}]` : ''}`
  }

  public async trackEvent(
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled) {
      return
    }

    // Solo inicializar si no está ya inicializado para evitar recursión
    if (!this.isInitialized) {
      await this.ensureInitialized()
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      category,
      action,
      ...(label !== undefined && { label }),
      ...(value !== undefined && { value }),
      sessionId: this.sessionId,
      timestamp: Date.now(),
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      ...(metadata !== undefined && { metadata }),
    }

    this.events.push(analyticsEvent)
    this.sendToAnalytics(analyticsEvent)
  }

  public async trackEcommerceEvent(action: string, data: Record<string, any>): Promise<void> {
    await this.trackEvent('ecommerce', 'shop', action, undefined, undefined, data)
  }

  public async trackPageView(page?: string): Promise<void> {
    const currentPage = page || (typeof window !== 'undefined' ? window.location.pathname : '')
    await this.trackEvent('page_view', 'navigation', 'view', currentPage)
  }

  public async trackInteraction(
    type: UserInteraction['type'],
    element: string,
    x: number,
    y: number
  ): Promise<void> {
    if (!this.isEnabled) {
      return
    }

    // Solo inicializar si no está ya inicializado para evitar recursión
    if (!this.isInitialized) {
      await this.ensureInitialized()
    }

    const interaction: UserInteraction = {
      type,
      element,
      x,
      y,
      timestamp: Date.now(),
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      sessionId: this.sessionId,
    }

    this.interactions.push(interaction)
  }

  public async trackConversion(
    type: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent('conversion', 'ecommerce', type, undefined, value, metadata)
  }

  private sendToAnalytics(event: AnalyticsEvent): void {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      return
    }

    // Enviar a Google Analytics 4
    if ((window as any).gtag) {
      try {
        ;(window as any).gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          custom_parameter_session_id: event.sessionId,
          ...event.metadata,
        })
      } catch (error) {
        console.warn('Error sending event to GA:', error)
      }
    }

    // Enviar a nuestro endpoint interno con mejor manejo de errores
    this.sendToInternalAPI(event)
  }

  private eventQueue: AnalyticsEvent[] = []
  private isProcessingQueue: boolean = false
  private queueTimeout: NodeJS.Timeout | null = null

  private async sendToInternalAPI(event: AnalyticsEvent): Promise<void> {
    // Agregar evento a la cola en lugar de enviarlo inmediatamente
    this.eventQueue.push(event)

    // Procesar la cola con debounce
    this.debouncedProcessQueue()
  }

  private debouncedProcessQueue(): void {
    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout)
    }

    this.queueTimeout = setTimeout(() => {
      this.processEventQueue()
    }, 100) // Debounce de 100ms
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessingQueue || this.eventQueue.length === 0) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }

    this.isProcessingQueue = true

    try {
      // Verificar que el documento está listo
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true })
        })
      }

      // Procesar eventos en lotes
      const eventsToProcess = [...this.eventQueue]
      this.eventQueue = []

      // Enviar eventos en lotes de 5 para evitar rate limiting
      const batchSize = 5
      for (let i = 0; i < eventsToProcess.length; i += batchSize) {
        const batch = eventsToProcess.slice(i, i + batchSize)

        for (const event of batch) {
          try {
            const response = await fetch('/api/analytics/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            })

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
          } catch (error) {
            // En caso de error, almacenar el evento para reintento
            this.storeEventForRetry(event)
          }
        }

        // Pausa entre lotes para evitar rate limiting
        if (i + batchSize < eventsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Analytics queue processing error (non-critical):', error)
      }
    } finally {
      this.isProcessingQueue = false
    }
  }

  private storeEventForRetry(event: AnalyticsEvent): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Usar parsing seguro para evitar errores JSON
        const stored = localStorage.getItem('analytics_failed_events') || '[]'
        let failedEvents: AnalyticsEvent[] = []

        try {
          failedEvents = JSON.parse(stored)
          // Verificar que sea un array válido
          if (!Array.isArray(failedEvents)) {
            failedEvents = []
          }
        } catch (parseError) {
          console.warn('Error parsing analytics failed events, resetting:', parseError)
          failedEvents = []
        }

        failedEvents.push(event)

        // Limitar a los últimos 50 eventos fallidos
        if (failedEvents.length > 50) {
          failedEvents.splice(0, failedEvents.length - 50)
        }

        localStorage.setItem('analytics_failed_events', JSON.stringify(failedEvents))
      }
    } catch (error) {
      // Ignorar errores de localStorage
      console.warn('Error storing analytics event for retry:', error)
    }
  }

  public getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  public getInteractions(): UserInteraction[] {
    return [...this.interactions]
  }

  public getSessionId(): string {
    return this.sessionId
  }

  // ⚡ FIX: Método para limpiar todos los event listeners
  private cleanupListeners(): void {
    if (typeof window === 'undefined') {
      return
    }

    // Remover click listener
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler)
      this.clickHandler = null
    }

    // Remover scroll listener
    if (this.scrollHandler) {
      document.removeEventListener('scroll', this.scrollHandler)
      this.scrollHandler = null
    }

    // Remover input listener
    if (this.inputHandler) {
      document.removeEventListener('input', this.inputHandler)
      this.inputHandler = null
    }

    // Remover focus listener
    if (this.focusHandler) {
      document.removeEventListener('focus', this.focusHandler, { capture: true })
      this.focusHandler = null
    }

    // Limpiar timeouts
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout)
      this.inputTimeout = null
    }
  }

  public clearData(): void {
    this.events = []
    this.interactions = []
    this.eventQueue = []

    // ⚡ FIX: Limpiar listeners al limpiar datos
    this.cleanupListeners()

    // Limpiar timeouts y RAF
    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout)
      this.queueTimeout = null
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
      this.scrollTimeout = null
    }
    if (this.scrollRAF !== null) {
      cancelAnimationFrame(this.scrollRAF)
      this.scrollRAF = null
    }
  }

  public disable(): void {
    this.isEnabled = false
  }

  public enable(): void {
    this.isEnabled = true
  }

  public async initialize(): Promise<void> {
    await this.ensureInitialized()
  }

  public getConversionMetrics(): ConversionMetrics {
    const ecommerceEvents = this.events.filter(e => e.category === 'shop')

    const cartAdditions = ecommerceEvents.filter(e => e.action === 'add_to_cart').length
    const cartRemovals = ecommerceEvents.filter(e => e.action === 'remove_from_cart').length
    const checkoutStarts = ecommerceEvents.filter(e => e.action === 'begin_checkout').length
    const checkoutCompletions = ecommerceEvents.filter(e => e.action === 'purchase').length
    const productViews = this.events.filter(
      e => e.category === 'navigation' && e.label?.includes('/product/')
    ).length
    const categoryViews = this.events.filter(
      e => e.category === 'navigation' && e.label?.includes('/category/')
    ).length
    const searchQueries = ecommerceEvents.filter(e => e.action === 'search').length

    const conversionRate = checkoutStarts > 0 ? (checkoutCompletions / checkoutStarts) * 100 : 0
    const cartAbandonmentRate =
      cartAdditions > 0 ? ((cartAdditions - checkoutCompletions) / cartAdditions) * 100 : 0

    // Calcular AOV desde los eventos de compra
    const purchaseEvents = ecommerceEvents.filter(e => e.action === 'purchase')
    const totalValue = purchaseEvents.reduce((sum, event) => sum + (event.value || 0), 0)
    const averageOrderValue = purchaseEvents.length > 0 ? totalValue / purchaseEvents.length : 0

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
    }
  }
}

// Singleton instance
export const analytics = new AnalyticsManager()

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
    // ⚡ FIX: Corregir referencia de optimizedAnalytics a analytics
    await analytics.trackEvent(event, category, action, label, value, metadata)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics trackEvent error:', error)
    }
  }
}

export const trackEcommerceEvent = async (
  action: string,
  data: Record<string, any>
): Promise<void> => {
  try {
    await analytics.trackEcommerceEvent(action, data)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics trackEcommerceEvent error:', error)
    }
  }
}

export const trackPageView = async (page?: string): Promise<void> => {
  try {
    await analytics.trackPageView(page)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics trackPageView error:', error)
    }
  }
}

export const trackConversion = async (
  type: string,
  value?: number,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await analytics.trackConversion(type, value, metadata)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics trackConversion error:', error)
    }
  }
}

export const initializeAnalytics = async (): Promise<void> => {
  try {
    await analytics.initialize()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics initialization error:', error)
    }
  }
}
