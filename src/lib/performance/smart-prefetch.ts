/**
 * ⚡ PERFORMANCE: Smart Prefetching System
 * 
 * Sistema inteligente de prefetching para navegación instantánea
 * Precarga recursos cuando el usuario hace hover o cuando son visibles
 * 
 * Reduce tiempo de navegación ~0.3s al hacer prefetch de páginas de productos
 * 
 * @example
 * import { smartPrefetcher } from '@/lib/performance/smart-prefetch'
 * 
 * const ProductCard = ({ product }) => {
 *   const prefetchProps = smartPrefetcher.prefetchOnHover(
 *     `/shop-details/${product.id}`,
 *     { delay: 150 }
 *   )
 * 
 *   return (
 *     <Link href={`/shop-details/${product.id}`} {...prefetchProps}>
 *       <ProductImage />
 *     </Link>
 *   )
 * }
 */

'use client'

export interface PrefetchOptions {
  /**
   * Prioridad del prefetch
   * @default 'low'
   */
  priority?: 'high' | 'low' | 'auto'

  /**
   * Delay en ms antes de hacer prefetch
   * @default 100
   */
  delay?: number

  /**
   * Si es true, hace prefetch en hover
   * @default true
   */
  onHover?: boolean

  /**
   * Si es true, hace prefetch cuando es visible
   * @default false
   */
  onVisible?: boolean

  /**
   * Margen antes de que sea visible (solo si onVisible es true)
   * @default '300px'
   */
  rootMargin?: string

  /**
   * Si es true, respeta la preferencia de ahorro de datos
   * @default true
   */
  respectSaveData?: boolean
}

class SmartPrefetcher {
  private prefetchedUrls = new Set<string>()
  private observer: IntersectionObserver | null = null
  private hoverTimers = new Map<string, NodeJS.Timeout>()

  /**
   * Prefetch en hover (precarga al pasar el mouse)
   */
  prefetchOnHover(url: string, options: PrefetchOptions = {}) {
    const { priority = 'low', delay = 100, respectSaveData = true } = options

    return {
      onMouseEnter: () => {
        // Verificar preferencia de ahorro de datos
        if (respectSaveData && this.shouldRespectSaveData()) {
          return
        }

        // Crear timer para delay
        const timer = setTimeout(() => {
          this.prefetch(url, priority)
        }, delay)

        this.hoverTimers.set(url, timer)
      },
      onMouseLeave: () => {
        // Cancelar prefetch si el usuario sale antes del delay
        const timer = this.hoverTimers.get(url)
        if (timer) {
          clearTimeout(timer)
          this.hoverTimers.delete(url)
        }
      },
    }
  }

  /**
   * Prefetch cuando el elemento es visible (precarga al hacer scroll)
   */
  prefetchOnVisible(url: string, options: PrefetchOptions = {}) {
    const { priority = 'low', rootMargin = '300px', respectSaveData = true } = options

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null
    }

    // Verificar preferencia de ahorro de datos
    if (respectSaveData && this.shouldRespectSaveData()) {
      return null
    }

    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const prefetchUrl = entry.target.getAttribute('data-prefetch-url')
              if (prefetchUrl) {
                this.prefetch(prefetchUrl, priority)
                this.observer?.unobserve(entry.target)
              }
            }
          })
        },
        { rootMargin, threshold: 0.01 }
      )
    }

    return this.observer
  }

  /**
   * Prefetch manual de una URL
   */
  prefetch(url: string, priority: 'high' | 'low' | 'auto' = 'low'): void {
    // Si ya fue prefetched, skip
    if (this.prefetchedUrls.has(url)) {
      return
    }

    // Verificar que no sea una URL externa
    if (url.startsWith('http') && !url.includes(window.location.hostname)) {
      console.warn(`⚠️ SmartPrefetch: URL externa ignorada - ${url}`)
      return
    }

    try {
      // Crear link element para prefetch
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      link.as = 'document'

      // Agregar fetchPriority si el navegador lo soporta
      if ('fetchPriority' in link) {
        ;(link as any).fetchPriority = priority
      }

      document.head.appendChild(link)
      this.prefetchedUrls.add(url)

      // Log en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Prefetched: ${url} (${priority} priority)`)
      }
    } catch (error) {
      console.error('Error al hacer prefetch:', error)
    }
  }

  /**
   * Prefetch de múltiples URLs
   */
  prefetchBatch(urls: string[], priority: 'high' | 'low' = 'low'): void {
    urls.forEach((url) => {
      // Pequeño delay entre cada prefetch para no saturar
      setTimeout(() => {
        this.prefetch(url, priority)
      }, 50)
    })
  }

  /**
   * Verificar si debemos respetar la preferencia de ahorro de datos
   */
  private shouldRespectSaveData(): boolean {
    if (typeof window === 'undefined') return true

    const connection =
      (navigator as any)?.connection ||
      (navigator as any)?.mozConnection ||
      (navigator as any)?.webkitConnection

    return connection?.saveData === true
  }

  /**
   * Limpiar todos los prefetches y observers
   */
  cleanup(): void {
    // Limpiar timers
    this.hoverTimers.forEach((timer) => clearTimeout(timer))
    this.hoverTimers.clear()

    // Desconectar observer
    this.observer?.disconnect()
    this.observer = null

    // Limpiar URLs prefetcheadas
    this.prefetchedUrls.clear()

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 SmartPrefetcher cleanup completado')
    }
  }

  /**
   * Obtener estadísticas del prefetcher
   */
  getStats() {
    return {
      totalPrefetched: this.prefetchedUrls.size,
      pendingHovers: this.hoverTimers.size,
      hasObserver: this.observer !== null,
    }
  }
}

// Singleton instance
export const smartPrefetcher = new SmartPrefetcher()

// Cleanup al desmontar (útil en desarrollo con HMR)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    smartPrefetcher.cleanup()
  })
}
















