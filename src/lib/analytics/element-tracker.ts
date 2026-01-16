/**
 * Sistema de tracking de elementos interactivos
 * Captura información detallada de interacciones con elementos del DOM
 */

import { generateElementSelector, detectDeviceType, getElementPosition } from './selector-generator'

export interface ElementInteractionData {
  elementSelector: string
  elementPosition: { x: number; y: number }
  elementDimensions: { width: number; height: number }
  interactionType: 'click' | 'hover' | 'scroll' | 'focus' | 'input'
  deviceType: 'mobile' | 'desktop' | 'tablet'
  page: string
  timestamp: number
  metadata?: Record<string, any>
}

export class ElementTracker {
  private hoverTimers: Map<HTMLElement, NodeJS.Timeout> = new Map()
  private scrollThrottle: number | null = null
  private readonly SCROLL_THROTTLE_MS = 1000 // Track scroll cada 1 segundo
  private isTrackingEnabled: boolean = false
  private globalListeners: Array<{ type: string; handler: EventListener; options?: boolean | AddEventListenerOptions }> = []
  private trackEventCallback?: (data: ElementInteractionData) => void

  /**
   * Trackea un click en un elemento
   */
  trackClick(element: HTMLElement, metadata?: Record<string, any>): ElementInteractionData | null {
    try {
      const selector = generateElementSelector(element)
      const position = getElementPosition(element)
      const deviceType = detectDeviceType()

      return {
        elementSelector: selector,
        elementPosition: { x: position.x, y: position.y },
        elementDimensions: { width: position.width, height: position.height },
        interactionType: 'click',
        deviceType,
        page: typeof window !== 'undefined' ? window.location.pathname : '',
        timestamp: Date.now(),
        metadata,
      }
    } catch (error) {
      console.warn('[ElementTracker] Error tracking click:', error)
      return null
    }
  }

  /**
   * Trackea un hover en un elemento (con debounce)
   */
  trackHover(
    element: HTMLElement,
    metadata?: Record<string, any>,
    hoverDuration: number = 500
  ): ElementInteractionData | null {
    try {
      // Limpiar timer anterior si existe
      const existingTimer = this.hoverTimers.get(element)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Crear nuevo timer
      let hoverData: ElementInteractionData | null = null
      const timer = setTimeout(() => {
        const selector = generateElementSelector(element)
        const position = getElementPosition(element)
        const deviceType = detectDeviceType()

        hoverData = {
          elementSelector: selector,
          elementPosition: { x: position.x, y: position.y },
          elementDimensions: { width: position.width, height: position.height },
          interactionType: 'hover',
          deviceType,
          page: typeof window !== 'undefined' ? window.location.pathname : '',
          timestamp: Date.now(),
          metadata: {
            ...metadata,
            hoverDuration,
          },
        }

        this.hoverTimers.delete(element)
      }, hoverDuration)

      this.hoverTimers.set(element, timer)

      return hoverData // Retorna null inicialmente, se actualiza después del delay
    } catch (error) {
      console.warn('[ElementTracker] Error tracking hover:', error)
      return null
    }
  }

  /**
   * Trackea scroll en la página (con throttle)
   */
  trackScroll(scrollData: { scrollY: number; scrollPercent: number }): ElementInteractionData | null {
    try {
      // Throttle para no trackear cada pixel de scroll
      if (this.scrollThrottle) {
        return null
      }

      this.scrollThrottle = window.setTimeout(() => {
        this.scrollThrottle = null
      }, this.SCROLL_THROTTLE_MS)

      const deviceType = detectDeviceType()

      return {
        elementSelector: 'body',
        elementPosition: { x: 0, y: scrollData.scrollY },
        elementDimensions: {
          width: typeof window !== 'undefined' ? window.innerWidth : 0,
          height: typeof window !== 'undefined' ? window.innerHeight : 0,
        },
        interactionType: 'scroll',
        deviceType,
        page: typeof window !== 'undefined' ? window.location.pathname : '',
        timestamp: Date.now(),
        metadata: {
          scrollY: scrollData.scrollY,
          scrollPercent: scrollData.scrollPercent,
        },
      }
    } catch (error) {
      console.warn('[ElementTracker] Error tracking scroll:', error)
      return null
    }
  }

  /**
   * Trackea focus en un input/textarea
   */
  trackFocus(element: HTMLElement, metadata?: Record<string, any>): ElementInteractionData | null {
    try {
      const selector = generateElementSelector(element)
      const position = getElementPosition(element)
      const deviceType = detectDeviceType()

      return {
        elementSelector: selector,
        elementPosition: { x: position.x, y: position.y },
        elementDimensions: { width: position.width, height: position.height },
        interactionType: 'focus',
        deviceType,
        page: typeof window !== 'undefined' ? window.location.pathname : '',
        timestamp: Date.now(),
        metadata,
      }
    } catch (error) {
      console.warn('[ElementTracker] Error tracking focus:', error)
      return null
    }
  }

  /**
   * Trackea input en un campo (con debounce)
   */
  trackInput(element: HTMLElement, metadata?: Record<string, any>): ElementInteractionData | null {
    try {
      const selector = generateElementSelector(element)
      const position = getElementPosition(element)
      const deviceType = detectDeviceType()

      return {
        elementSelector: selector,
        elementPosition: { x: position.x, y: position.y },
        elementDimensions: { width: position.width, height: position.height },
        interactionType: 'input',
        deviceType,
        page: typeof window !== 'undefined' ? window.location.pathname : '',
        timestamp: Date.now(),
        metadata,
      }
    } catch (error) {
      console.warn('[ElementTracker] Error tracking input:', error)
      return null
    }
  }

  /**
   * Limpia timers pendientes
   */
  cleanup(): void {
    this.hoverTimers.forEach(timer => clearTimeout(timer))
    this.hoverTimers.clear()
    if (this.scrollThrottle) {
      clearTimeout(this.scrollThrottle)
      this.scrollThrottle = null
    }
  }

  /**
   * Habilita el tracking automático
   */
  enableTracking(callback?: (data: ElementInteractionData) => void): void {
    if (this.isTrackingEnabled) {
      return
    }
    this.isTrackingEnabled = true
    this.trackEventCallback = callback
    this.init()
  }

  /**
   * Deshabilita el tracking automático
   */
  disableTracking(): void {
    if (!this.isTrackingEnabled) {
      return
    }
    this.isTrackingEnabled = false
    this.removeGlobalListeners()
    this.cleanup()
  }

  /**
   * Inicializa listeners globales para tracking automático
   */
  private init(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    // Listener para clicks
    const clickHandler = (event: MouseEvent) => {
      if (!this.isTrackingEnabled) return
      const target = event.target as HTMLElement
      if (!target) return

      // Ignorar clicks en elementos que no son interactivos (opcional)
      const interactiveElements = ['button', 'a', 'input', 'select', 'textarea']
      if (!interactiveElements.includes(target.tagName.toLowerCase()) && !target.onclick) {
        // Solo trackear si tiene data-analytics-id o es clickeable
        if (!target.getAttribute('data-analytics-id') && !target.closest('button, a')) {
          return
        }
      }

      const interactionData = this.trackClick(target)
      if (interactionData && this.trackEventCallback) {
        this.trackEventCallback(interactionData)
      }
    }

    // Listener para hovers (con debounce)
    const hoverHandler = (event: MouseEvent) => {
      if (!this.isTrackingEnabled) return
      const target = event.target as HTMLElement
      if (!target) return

      // Solo trackear hovers en elementos interactivos
      const interactiveElements = ['button', 'a', 'input', 'select', 'textarea']
      const isInteractive = interactiveElements.some(tag => 
        target.tagName.toLowerCase() === tag || target.closest(tag)
      ) || target.getAttribute('role') === 'button'

      if (!isInteractive) {
        return
      }

      // Usar trackHover que maneja el debounce internamente
      // El callback se llamará después del delay
      const hoverData = this.trackHover(target, undefined, 500)
      // trackHover retorna null inicialmente, el callback se maneja internamente
      // Necesitamos un enfoque diferente para hovers globales
      const existingTimer = this.hoverTimers.get(target)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        const interactionData = this.trackClick(target) // Reutilizar trackClick para obtener datos
        if (interactionData && this.trackEventCallback) {
          const hoverInteractionData: ElementInteractionData = {
            ...interactionData,
            interactionType: 'hover',
          }
          this.trackEventCallback(hoverInteractionData)
        }
        this.hoverTimers.delete(target)
      }, 500)

      this.hoverTimers.set(target, timer)
    }

    // Listener para scroll (con throttle)
    let lastScrollY = window.scrollY
    const scrollHandler = () => {
      if (!this.isTrackingEnabled) return
      const scrollY = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = scrollHeight > 0 ? (scrollY / scrollHeight) * 100 : 0

      // Solo trackear si hay un cambio significativo
      if (Math.abs(scrollY - lastScrollY) < 50) {
        return
      }
      lastScrollY = scrollY

      const interactionData = this.trackScroll({ scrollY, scrollPercent })
      if (interactionData && this.trackEventCallback) {
        this.trackEventCallback(interactionData)
      }
    }

    // Registrar listeners
    document.addEventListener('click', clickHandler, { passive: true, capture: true })
    document.addEventListener('mouseover', hoverHandler, { passive: true, capture: true })
    window.addEventListener('scroll', scrollHandler, { passive: true })

    this.globalListeners = [
      { type: 'click', handler: clickHandler, options: { passive: true, capture: true } },
      { type: 'mouseover', handler: hoverHandler, options: { passive: true, capture: true } },
      { type: 'scroll', handler: scrollHandler, options: { passive: true } },
    ]
  }

  /**
   * Remueve listeners globales
   */
  private removeGlobalListeners(): void {
    this.globalListeners.forEach(({ type, handler, options }) => {
      if (type === 'scroll') {
        window.removeEventListener(type, handler, options as boolean | EventListenerOptions)
      } else {
        document.removeEventListener(type, handler, options as boolean | EventListenerOptions)
      }
    })
    this.globalListeners = []
  }
}

// Instancia singleton
export const elementTracker = new ElementTracker()
