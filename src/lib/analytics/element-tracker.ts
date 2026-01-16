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
}

// Instancia singleton
export const elementTracker = new ElementTracker()
