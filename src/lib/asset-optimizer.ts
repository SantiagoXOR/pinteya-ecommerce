// ===================================
// PINTEYA E-COMMERCE - ASSET OPTIMIZER
// ===================================

import { logger, LogLevel, LogCategory } from './enterprise/logger'

// Configuración de optimización de assets
interface AssetConfig {
  compress: boolean
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  maxWidth?: number
  maxHeight?: number
  lazy?: boolean
}

// Configuraciones predefinidas
export const ASSET_CONFIGS = {
  // Para imágenes de productos
  PRODUCT_IMAGES: {
    compress: true,
    quality: 85,
    format: 'webp' as const,
    maxWidth: 800,
    maxHeight: 600,
    lazy: true,
  },

  // Para iconos de pago
  PAYMENT_ICONS: {
    compress: true,
    quality: 90,
    format: 'webp' as const,
    maxWidth: 64,
    maxHeight: 64,
    lazy: false,
  },

  // Para imágenes de hero/banner
  HERO_IMAGES: {
    compress: true,
    quality: 80,
    format: 'webp' as const,
    maxWidth: 1920,
    maxHeight: 1080,
    lazy: true,
  },

  // Para avatares de usuario
  AVATARS: {
    compress: true,
    quality: 85,
    format: 'webp' as const,
    maxWidth: 200,
    maxHeight: 200,
    lazy: true,
  },
} as const

/**
 * Clase principal para optimización de assets
 */
export class AssetOptimizer {
  private static instance: AssetOptimizer

  private constructor() {}

  static getInstance(): AssetOptimizer {
    if (!AssetOptimizer.instance) {
      AssetOptimizer.instance = new AssetOptimizer()
    }
    return AssetOptimizer.instance
  }

  /**
   * Optimiza una URL de imagen
   */
  optimizeImageUrl(
    originalUrl: string,
    config: AssetConfig = ASSET_CONFIGS.PRODUCT_IMAGES
  ): string {
    try {
      // Si es una URL externa, aplicar parámetros de optimización
      if (originalUrl.startsWith('http')) {
        const url = new URL(originalUrl)

        // Para Supabase Storage, agregar parámetros de transformación
        if (url.hostname.includes('supabase')) {
          const params = new URLSearchParams()

          if (config.maxWidth) {
            params.set('width', config.maxWidth.toString())
          }

          if (config.maxHeight) {
            params.set('height', config.maxHeight.toString())
          }

          if (config.quality) {
            params.set('quality', config.quality.toString())
          }

          if (config.format) {
            params.set('format', config.format)
          }

          if (params.toString()) {
            url.search = params.toString()
          }
        }

        return url.toString()
      }

      // Para URLs locales, mantener como están
      return originalUrl
    } catch (error) {
      logger.error(LogCategory.API, 'Image URL optimization failed', error as Error)
      return originalUrl
    }
  }

  /**
   * Genera srcSet para imágenes responsivas
   */
  generateSrcSet(baseUrl: string, config: AssetConfig = ASSET_CONFIGS.PRODUCT_IMAGES): string {
    try {
      const sizes = [
        { width: 320, suffix: 'sm' },
        { width: 640, suffix: 'md' },
        { width: 1024, suffix: 'lg' },
        { width: 1920, suffix: 'xl' },
      ]

      const srcSet = sizes
        .filter(size => !config.maxWidth || size.width <= config.maxWidth)
        .map(size => {
          const optimizedConfig = { ...config, maxWidth: size.width }
          const url = this.optimizeImageUrl(baseUrl, optimizedConfig)
          return `${url} ${size.width}w`
        })
        .join(', ')

      return srcSet
    } catch (error) {
      logger.error(LogCategory.API, 'SrcSet generation failed', error as Error)
      return baseUrl
    }
  }

  /**
   * Genera sizes attribute para imágenes responsivas
   */
  generateSizes(breakpoints: Array<{ condition: string; size: string }>): string {
    return breakpoints.map(bp => `${bp.condition} ${bp.size}`).join(', ')
  }

  /**
   * Precarga assets críticos
   */
  preloadCriticalAssets(assets: Array<{ url: string; type: 'image' | 'font' | 'style' }>): void {
    if (typeof window === 'undefined') {
      return
    }

    assets.forEach(asset => {
      try {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = asset.url

        switch (asset.type) {
          case 'image':
            link.as = 'image'
            break
          case 'font':
            link.as = 'font'
            link.crossOrigin = 'anonymous'
            break
          case 'style':
            link.as = 'style'
            break
        }

        document.head.appendChild(link)

        logger.info(LogCategory.API, 'Asset preloaded')
      } catch (error) {
        logger.error(LogCategory.API, 'Asset preload failed', error as Error)
      }
    })
  }

  /**
   * Lazy load de imágenes con Intersection Observer
   */
  setupLazyLoading(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }

    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement

            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute('data-src')
            }

            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset
              img.removeAttribute('data-srcset')
            }

            img.classList.remove('lazy')
            observer.unobserve(img)

            logger.info(LogCategory.API, 'Lazy image loaded')
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    )

    // Observar todas las imágenes lazy
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }

  /**
   * Optimiza CSS crítico
   */
  optimizeCriticalCSS(criticalSelectors: string[]): string {
    try {
      // En una implementación real, esto extraería CSS crítico
      // Por ahora, retornamos un placeholder
      const criticalCSS = criticalSelectors
        .map(selector => `${selector} { /* critical styles */ }`)
        .join('\n')

      logger.info(LogCategory.API, 'Critical CSS optimized')

      return criticalCSS
    } catch (error) {
      logger.error(LogCategory.API, 'Critical CSS optimization failed', error as Error)
      return ''
    }
  }

  /**
   * Comprime y optimiza JSON para APIs
   */
  optimizeJsonResponse(data: any): string {
    try {
      // Remover propiedades null/undefined
      const cleaned = this.removeNullValues(data)

      // Comprimir JSON (sin espacios)
      const compressed = JSON.stringify(cleaned)

      logger.info(LogCategory.API, 'JSON response optimized')

      return compressed
    } catch (error) {
      logger.error(LogCategory.API, 'JSON optimization failed', error as Error)
      // En caso de error (como objetos circulares), retornar string simple
      try {
        return JSON.stringify({ error: 'Serialization failed' })
      } catch {
        return '{"error":"Serialization failed"}'
      }
    }
  }

  /**
   * Remueve valores null/undefined de objetos
   */
  private removeNullValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return undefined
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeNullValues(item)).filter(item => item !== undefined)
    }

    if (typeof obj === 'object') {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.removeNullValues(value)
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue
        }
      }
      return cleaned
    }

    return obj
  }
}

// Instancia singleton
export const assetOptimizer = AssetOptimizer.getInstance()

/**
 * Funciones de utilidad para optimización de assets
 */
export const AssetUtils = {
  /**
   * Optimiza imagen de producto
   */
  optimizeProductImage(url: string): string {
    return assetOptimizer.optimizeImageUrl(url, ASSET_CONFIGS.PRODUCT_IMAGES)
  },

  /**
   * Optimiza icono de pago
   */
  optimizePaymentIcon(url: string): string {
    return assetOptimizer.optimizeImageUrl(url, ASSET_CONFIGS.PAYMENT_ICONS)
  },

  /**
   * Genera imagen responsiva para productos
   */
  generateProductImageProps(url: string) {
    return {
      src: assetOptimizer.optimizeImageUrl(url, ASSET_CONFIGS.PRODUCT_IMAGES),
      srcSet: assetOptimizer.generateSrcSet(url, ASSET_CONFIGS.PRODUCT_IMAGES),
      sizes: assetOptimizer.generateSizes([
        { condition: '(max-width: 640px)', size: '100vw' },
        { condition: '(max-width: 1024px)', size: '50vw' },
        { condition: '', size: '33vw' },
      ]),
      loading: 'lazy' as const,
      decoding: 'async' as const,
    }
  },

  /**
   * Precarga assets críticos de pago
   */
  preloadPaymentAssets(): void {
    const criticalAssets = [
      { url: '/images/logo/visa.svg', type: 'image' as const },
      { url: '/images/logo/mastercard.svg', type: 'image' as const },
      { url: '/images/logo/mercadopago.svg', type: 'image' as const },
    ]

    assetOptimizer.preloadCriticalAssets(criticalAssets)
  },

  /**
   * Inicializa optimizaciones en el cliente
   */
  initializeClientOptimizations(): void {
    if (typeof window === 'undefined') {
      return
    }

    // Configurar lazy loading
    assetOptimizer.setupLazyLoading()

    // Precargar assets críticos
    AssetUtils.preloadPaymentAssets()

    logger.info(LogCategory.API, 'Client asset optimizations initialized')
  },
}
