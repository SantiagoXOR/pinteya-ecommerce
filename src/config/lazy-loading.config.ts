/**
 * Configuración centralizada para lazy loading
 * 
 * Centraliza todas las configuraciones de lazy loading del proyecto para
 * facilitar mantenimiento y consistencia.
 */

export type LazyStrategy = 'viewport' | 'delay' | 'lcp' | 'immediate' | 'adaptive'

export interface LazySectionConfig {
  /** Estrategia de lazy loading */
  strategy: LazyStrategy
  /** Margen antes de que el elemento entre al viewport (solo para 'viewport') */
  rootMargin?: string
  /** Altura mínima para prevenir CLS */
  minHeight: string
  /** Threshold para IntersectionObserver (0-1) */
  threshold?: number
  /** Delay en ms (solo para 'delay') */
  delay?: number
  /** Si debe respetar el nivel de rendimiento del dispositivo */
  respectPerformance?: boolean
}

export interface LazyDelayConfig {
  /** Delay por defecto (ms) */
  default: number
  /** Delay para dispositivos de bajo rendimiento (ms) */
  lowPerformance?: number
  /** Delay para dispositivos de rendimiento medio (ms) */
  mediumPerformance?: number
}

/**
 * Configuración de secciones con lazy loading
 * 
 * Cada sección define su estrategia de carga y parámetros de optimización
 */
export const LAZY_SECTIONS: Record<string, LazySectionConfig> = {
  // Promo Banners - Viewport-based loading
  promoBanner: {
    strategy: 'viewport',
    rootMargin: '200px', // 300px para bannerId === 2, 200px para otros
    minHeight: '48px',
    threshold: 0.01,
  },
  
  // New Arrivals - Viewport-based loading
  newArrivals: {
    strategy: 'viewport',
    rootMargin: '300px',
    minHeight: '500px',
    threshold: 0.01,
  },
  
  // Trending Searches - Viewport-based loading
  trendingSearches: {
    strategy: 'viewport',
    rootMargin: '150px',
    minHeight: '100px',
    threshold: 0.01,
  },
  
  // Testimonials - Viewport-based loading
  testimonials: {
    strategy: 'viewport',
    rootMargin: '150px',
    minHeight: '200px',
    threshold: 0.01,
  },
  
  // Best Seller - Immediate o con delay adaptativo
  bestSeller: {
    strategy: 'adaptive',
    minHeight: '400px',
    respectPerformance: true,
  },
  
  // Category Toggle - Delay-based loading
  categoryToggle: {
    strategy: 'adaptive',
    minHeight: '40px',
    respectPerformance: true,
  },
  
  // Dynamic Product Carousel - Viewport-based loading
  dynamicCarousel: {
    strategy: 'viewport',
    rootMargin: '200px',
    minHeight: '300px',
    threshold: 0.01,
  },
} as const

/**
 * Configuración de delays para componentes con carga diferida
 */
export const LAZY_DELAYS: Record<string, number | LazyDelayConfig> = {
  // Floating Cart - Delay fijo
  floatingCart: 2000,
  
  // Floating WhatsApp - Delay fijo
  floatingWhatsApp: 5000,
  
  // Category Toggle - Delay adaptativo según rendimiento
  categoryToggle: {
    default: 0,
    lowPerformance: 2000,
    mediumPerformance: 1000,
  },
  
  // Best Seller - Delay adaptativo según rendimiento
  bestSeller: {
    default: 0,
    lowPerformance: 3000,
    mediumPerformance: 1500,
  },
} as const

/**
 * Configuración especial para PromoBanner (rootMargin variable según bannerId)
 */
export const PROMO_BANNER_CONFIG = {
  default: {
    rootMargin: '200px',
    minHeight: '48px',
  },
  priority: {
    // bannerId === 2 (Asesoramiento Gratis) - más prioridad
    rootMargin: '300px',
    minHeight: '48px',
  },
} as const

/**
 * Helper para obtener la configuración de una sección
 */
export function getLazySectionConfig(sectionKey: string): LazySectionConfig | undefined {
  return LAZY_SECTIONS[sectionKey]
}

/**
 * Helper para obtener el delay según el nivel de rendimiento
 */
export function getLazyDelay(
  delayKey: string,
  performanceLevel: 'high' | 'medium' | 'low' = 'high'
): number {
  const delayConfig = LAZY_DELAYS[delayKey]
  
  if (typeof delayConfig === 'number') {
    return delayConfig
  }
  
  if (typeof delayConfig === 'object') {
    if (performanceLevel === 'low' && delayConfig.lowPerformance !== undefined) {
      return delayConfig.lowPerformance
    }
    if (performanceLevel === 'medium' && delayConfig.mediumPerformance !== undefined) {
      return delayConfig.mediumPerformance
    }
    return delayConfig.default
  }
  
  return 0
}

/**
 * Helper para obtener rootMargin de PromoBanner según bannerId
 */
export function getPromoBannerRootMargin(bannerId: number): string {
  return bannerId === 2 
    ? PROMO_BANNER_CONFIG.priority.rootMargin 
    : PROMO_BANNER_CONFIG.default.rootMargin
}
