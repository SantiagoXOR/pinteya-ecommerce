// ===================================
// PINTEYA E-COMMERCE - BROWSER CACHE OPTIMIZER
// ===================================

import { logger, LogCategory } from '../enterprise/logger'

/**
 * Estrategias de cache del navegador
 */
export enum BrowserCacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
  NETWORK_ONLY = 'network-only',
  CACHE_ONLY = 'cache-only',
}

/**
 * Configuración de cache del navegador
 */
export interface BrowserCacheConfig {
  strategy: BrowserCacheStrategy
  cacheName: string
  maxAge: number
  maxEntries?: number
  networkTimeoutSeconds?: number
  urlPatterns: RegExp[]
  excludePatterns?: RegExp[]
  headers?: Record<string, string>
}

/**
 * Configuraciones predefinidas para diferentes tipos de recursos
 */
export const BROWSER_CACHE_CONFIGS: Record<string, BrowserCacheConfig> = {
  // Assets estáticos (CSS, JS, imágenes)
  STATIC_ASSETS: {
    strategy: BrowserCacheStrategy.CACHE_FIRST,
    cacheName: 'static-assets-v1',
    maxAge: 86400 * 30, // 30 días
    maxEntries: 100,
    urlPatterns: [/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/, /\/_next\/static\//],
    headers: {
      'Cache-Control': 'public, max-age=2592000, immutable',
    },
  },

  // Páginas HTML
  HTML_PAGES: {
    strategy: BrowserCacheStrategy.NETWORK_FIRST,
    cacheName: 'html-pages-v1',
    maxAge: 3600, // 1 hora
    maxEntries: 50,
    networkTimeoutSeconds: 3,
    urlPatterns: [/\/$/, /\/shop/, /\/products/, /\/categories/],
    excludePatterns: [/\/admin/, /\/api/, /\/auth/],
  },

  // APIs públicas
  PUBLIC_API: {
    strategy: BrowserCacheStrategy.STALE_WHILE_REVALIDATE,
    cacheName: 'public-api-v1',
    maxAge: 300, // 5 minutos
    maxEntries: 100,
    networkTimeoutSeconds: 5,
    urlPatterns: [/\/api\/products/, /\/api\/categories/, /\/api\/search/],
    excludePatterns: [/\/api\/auth/, /\/api\/admin/, /\/api\/user/],
  },

  // Imágenes de productos
  PRODUCT_IMAGES: {
    strategy: BrowserCacheStrategy.CACHE_FIRST,
    cacheName: 'product-images-v1',
    maxAge: 86400 * 7, // 7 días
    maxEntries: 200,
    urlPatterns: [
      /\/images\/products\//,
      /\/uploads\/products\//,
      /\.supabase\.co\/storage\/.*\/products\//,
    ],
    headers: {
      'Cache-Control': 'public, max-age=604800',
    },
  },

  // Datos de usuario (cache corto)
  USER_DATA: {
    strategy: BrowserCacheStrategy.NETWORK_FIRST,
    cacheName: 'user-data-v1',
    maxAge: 300, // 5 minutos
    maxEntries: 20,
    networkTimeoutSeconds: 2,
    urlPatterns: [/\/api\/user\/profile/, /\/api\/user\/preferences/],
  },

  // ⚡ OPTIMIZACIÓN: Recursos de terceros (Facebook, Analytics, Google Tag Manager, etc.)
  // Cache agresivo para compensar TTL corto del servidor (20min → 7 días)
  // Ahorro estimado: 186 KiB según Lighthouse
  THIRD_PARTY_SCRIPTS: {
    strategy: BrowserCacheStrategy.STALE_WHILE_REVALIDATE,
    cacheName: 'third-party-scripts-v1',
    maxAge: 86400 * 7, // 7 días (vs 20min del servidor)
    maxEntries: 50,
    networkTimeoutSeconds: 5,
    urlPatterns: [
      /connect\.facebook\.net\/.*fbevents\.js/,
      /connect\.facebook\.net\/.*config\//,
      /www\.googletagmanager\.com\/gtag\/js/, // ⚡ Google Tag Manager (153 KiB)
      /www\.googletagmanager\.com\/.*sw_iframe\.html/, // ⚡ Google Tag Manager iframe
      /www\.google-analytics\.com\/analytics\.js/,
      /www\.google-analytics\.com\/g\/collect/, // ⚡ Google Analytics collect
      /googleads\.g\.doubleclick\.net/, // ⚡ Google Ads
      /www\.google\.com\/.*1p-user-list/, // ⚡ Google APIs
      /www\.google\.com\/ccm\/collect/, // ⚡ Google collect
    ],
    headers: {
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
    },
  },
}

/**
 * Service Worker template para cache optimizado
 */
export const SERVICE_WORKER_TEMPLATE = `
// ===================================
// PINTEYA E-COMMERCE - SERVICE WORKER
// ===================================

const CACHE_VERSION = 'v1.2.0';
const CACHE_CONFIGS = ${JSON.stringify(BROWSER_CACHE_CONFIGS, null, 2)};

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Pre-cache assets críticos
      caches.open(CACHE_CONFIGS.STATIC_ASSETS.cacheName).then((cache) => {
        return cache.addAll([
          '/',
          '/manifest.json',
          '/_next/static/css/app.css',
          '/_next/static/js/app.js'
        ]);
      })
    ])
  );
  
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (!Object.values(CACHE_CONFIGS).some(config => config.cacheName === cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Solo manejar requests GET
  if (request.method !== 'GET') return;
  
  // ⚡ OPTIMIZACIÓN: Buscar configuración usando URL completa para recursos de terceros
  const config = findCacheConfig(url.href) || findCacheConfig(url.pathname + url.search);
  if (!config) return;
  
  event.respondWith(handleRequest(request, config));
});

// Encontrar configuración de cache para una URL
function findCacheConfig(url) {
  // ⚡ OPTIMIZACIÓN: También verificar por dominio completo para recursos de terceros
  const fullUrl = url.includes('://') ? url : `https://${url}`;
  
  for (const [name, config] of Object.entries(CACHE_CONFIGS)) {
    // Verificar patrones de exclusión
    if (config.excludePatterns && config.excludePatterns.some(pattern => {
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      return regex.test(url) || regex.test(fullUrl);
    })) {
      continue;
    }
    
    // Verificar patrones de inclusión
    if (config.urlPatterns.some(pattern => {
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      return regex.test(url) || regex.test(fullUrl);
    })) {
      return config;
    }
  }
  return null;
}

// Manejar request según estrategia
async function handleRequest(request, config) {
  switch (config.strategy) {
    case 'cache-first':
      return cacheFirst(request, config);
    case 'network-first':
      return networkFirst(request, config);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, config);
    case 'network-only':
      return fetch(request);
    case 'cache-only':
      return cacheOnly(request, config);
    default:
      return fetch(request);
  }
}

// Estrategia Cache First
async function cacheFirst(request, config) {
  const cache = await caches.open(config.cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    throw error;
  }
}

// Estrategia Network First
async function networkFirst(request, config) {
  const cache = await caches.open(config.cacheName);
  
  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), (config.networkTimeoutSeconds || 3) * 1000);
    });
    
    const response = await Promise.race([networkPromise, timeoutPromise]);
    
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error.message);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Estrategia Stale While Revalidate
async function staleWhileRevalidate(request, config) {
  const cache = await caches.open(config.cacheName);
  const cached = await cache.match(request);
  
  // Revalidar en background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.error('[SW] Background revalidation failed:', error);
  });
  
  // Retornar cache inmediatamente si existe
  if (cached) {
    return cached;
  }
  
  // Si no hay cache, esperar por la red
  return fetchPromise;
}

// Estrategia Cache Only
async function cacheOnly(request, config) {
  const cache = await caches.open(config.cacheName);
  const cached = await cache.match(request);
  
  if (!cached) {
    throw new Error('No cached response available');
  }
  
  return cached;
}

// Limpiar caches antiguos
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCacheNames = Object.values(CACHE_CONFIGS).map(config => config.cacheName);
  
  return Promise.all(
    cacheNames.map(cacheName => {
      if (!validCacheNames.includes(cacheName)) {
        console.log('[SW] Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
}

// Mensaje desde el cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEANUP_CACHES') {
    cleanupOldCaches();
  }
});
`

/**
 * Optimizador de cache del navegador
 */
export class BrowserCacheOptimizer {
  private static instance: BrowserCacheOptimizer
  private isServiceWorkerSupported: boolean
  private isServiceWorkerRegistered: boolean = false

  private constructor() {
    this.isServiceWorkerSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator
  }

  static getInstance(): BrowserCacheOptimizer {
    if (!BrowserCacheOptimizer.instance) {
      BrowserCacheOptimizer.instance = new BrowserCacheOptimizer()
    }
    return BrowserCacheOptimizer.instance
  }

  /**
   * Inicializa el optimizador de cache del navegador
   */
  async initialize(): Promise<void> {
    if (!this.isServiceWorkerSupported) {
      logger.warn(LogCategory.CACHE, 'Service Worker no soportado en este navegador')
      return
    }

    // Gate de inicialización por entorno/flag para evitar interferencias en desarrollo
    const enableSW = process.env.NEXT_PUBLIC_ENABLE_SW === 'true'
    const isProd = process.env.NODE_ENV === 'production'
    if (!enableSW || !isProd) {
      logger.warn(
        LogCategory.CACHE,
        'Service Worker deshabilitado por configuración (NEXT_PUBLIC_ENABLE_SW) o entorno no productivo'
      )
      // En desarrollo, desregistrar SWs previos y limpiar caches para evitar InvalidStateError
      try {
        if (document.readyState !== 'complete') {
          await new Promise<void>(resolve => window.addEventListener('load', () => resolve(), { once: true }))
        }
        if ('serviceWorker' in navigator) {
          try {
            const regs = await navigator.serviceWorker.getRegistrations()
            await Promise.all(regs.map(r => r.unregister()))
          } catch (e) {
            // Ignorar InvalidStateError en desarrollo
            logger.warn(
              LogCategory.CACHE,
              'Ignorando error al obtener registros de SW en entorno no productivo',
              e as Error
            )
          }
        }
        try {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(name => caches.delete(name)))
        } catch (e) {
          logger.warn(
            LogCategory.CACHE,
            'Ignorando error al limpiar caches en entorno no productivo',
            e as Error
          )
        }
        logger.info(
          LogCategory.CACHE,
          'SW desregistrado y caches limpiados en entorno no productivo'
        )
      } catch (err) {
        logger.warn(
          LogCategory.CACHE,
          'No se pudo limpiar SW/caches en entorno no productivo',
          err as Error
        )
      }
      return
    }

    try {
      await this.registerServiceWorker()
      await this.setupCacheHeaders()
      this.setupPerformanceObserver()

      logger.info(LogCategory.CACHE, 'Browser Cache Optimizer inicializado correctamente')
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Error inicializando Browser Cache Optimizer', error as Error)
    }
  }

  /**
   * Registra el Service Worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (this.isServiceWorkerRegistered) {
      return
    }

    try {
      // Crear y registrar Service Worker dinámicamente
      const swBlob = new Blob([SERVICE_WORKER_TEMPLATE], { type: 'application/javascript' })
      const swUrl = URL.createObjectURL(swBlob)

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
      })

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nuevo Service Worker disponible
              this.notifyServiceWorkerUpdate()
            }
          })
        }
      })

      this.isServiceWorkerRegistered = true
      logger.info(LogCategory.CACHE, 'Service Worker registrado correctamente')
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Error registrando Service Worker', error as Error)
    }
  }

  /**
   * Configura headers de cache optimizados
   */
  private async setupCacheHeaders(): Promise<void> {
    // Esta función se ejecuta en el cliente para configurar headers
    // Los headers reales se configuran en el servidor

    if (typeof window !== 'undefined') {
      // Configurar meta tags para cache
      this.addCacheMetaTags()

      // Configurar preload para recursos críticos
      this.setupResourcePreloading()
    }
  }

  /**
   * Añade meta tags para optimización de cache
   */
  private addCacheMetaTags(): void {
    const head = document.head

    // Cache-Control para la página actual
    const cacheControlMeta = document.createElement('meta')
    cacheControlMeta.httpEquiv = 'Cache-Control'
    cacheControlMeta.content = 'public, max-age=3600, stale-while-revalidate=86400'
    head.appendChild(cacheControlMeta)

    // Preconnect a dominios externos
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.maptiler.com',
    ]

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      head.appendChild(link)
    })
  }

  /**
   * Configura preloading de recursos críticos
   */
  private setupResourcePreloading(): void {
    const head = document.head

    // Preload de recursos críticos
    const criticalResources = [
      { href: '/_next/static/css/app.css', as: 'style' },
      { href: '/_next/static/js/app.js', as: 'script' },
      { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
    ]

    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.href
      link.as = resource.as
      if (resource.type) {
        link.type = resource.type
      }
      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin
      }
      head.appendChild(link)
    })
  }

  /**
   * Configura Performance Observer para monitoreo
   */
  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      // Observer para Navigation Timing
      const navObserver = new PerformanceObserver(list => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.logNavigationMetrics(entry as PerformanceNavigationTiming)
          }
        })
      })
      navObserver.observe({ entryTypes: ['navigation'] })

      // Observer para Resource Timing
      const resourceObserver = new PerformanceObserver(list => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.logResourceMetrics(entry as PerformanceResourceTiming)
          }
        })
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Error configurando Performance Observer', error as Error)
    }
  }

  /**
   * Registra métricas de navegación
   */
  private logNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      dom: entry.domContentLoadedEventEnd - entry.responseEnd,
      load: entry.loadEventEnd - entry.loadEventStart,
      total: entry.loadEventEnd - entry.navigationStart,
    }

    logger.info(LogCategory.CACHE, 'Navigation metrics:', metrics)
  }

  /**
   * Registra métricas de recursos
   */
  private logResourceMetrics(entry: PerformanceResourceTiming): void {
    const isCacheHit = entry.transferSize === 0 && entry.decodedBodySize > 0

    if (isCacheHit) {
      logger.debug(LogCategory.CACHE, `Cache HIT: ${entry.name}`)
    } else {
      logger.debug(LogCategory.CACHE, `Cache MISS: ${entry.name} (${entry.transferSize} bytes)`)
    }
  }

  /**
   * Notifica sobre actualización del Service Worker
   */
  private notifyServiceWorkerUpdate(): void {
    // Mostrar notificación al usuario sobre nueva versión disponible
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('sw-update-available', {
        detail: { message: 'Nueva versión disponible. Recarga la página para actualizar.' },
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * Limpia caches antiguos
   */
  async clearOldCaches(): Promise<void> {
    if (!this.isServiceWorkerSupported || !navigator.serviceWorker.controller) {
      return
    }

    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEANUP_CACHES',
      })

      logger.info(LogCategory.CACHE, 'Limpieza de caches antiguos iniciada')
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Error limpiando caches antiguos', error as Error)
    }
  }

  /**
   * Fuerza actualización del Service Worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.isServiceWorkerSupported) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      }

      logger.info(LogCategory.CACHE, 'Service Worker actualizado')
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Error actualizando Service Worker', error as Error)
    }
  }

  /**
   * Obtiene estadísticas de cache del navegador
   */
  async getCacheStats(): Promise<{
    caches: Array<{ name: string; size: number; entries: number }>
    totalSize: number
    totalEntries: number
  }> {
    if (!this.isServiceWorkerSupported) {
      return { caches: [], totalSize: 0, totalEntries: 0 }
    }

    try {
      const cacheNames = await caches.keys()
      const cacheStats = await Promise.all(
        cacheNames.map(async name => {
          const cache = await caches.open(name)
          const keys = await cache.keys()

          let size = 0
          for (const request of keys) {
            const response = await cache.match(request)
            if (response) {
              const blob = await response.blob()
              size += blob.size
            }
          }

          return { name, size, entries: keys.length }
        })
      )

      const totalSize = cacheStats.reduce((sum, cache) => sum + cache.size, 0)
      const totalEntries = cacheStats.reduce((sum, cache) => sum + cache.entries, 0)

      return { caches: cacheStats, totalSize, totalEntries }
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Error obteniendo estadísticas de cache', error as Error)
      return { caches: [], totalSize: 0, totalEntries: 0 }
    }
  }

  /**
   * Verifica si el Service Worker está activo
   */
  isServiceWorkerActive(): boolean {
    return this.isServiceWorkerSupported && this.isServiceWorkerRegistered
  }
}

// Instancia singleton
export const browserCacheOptimizer = BrowserCacheOptimizer.getInstance()

/**
 * Utilidades para cache del navegador
 */
export const BrowserCacheUtils = {
  /**
   * Inicializa cache del navegador
   */
  async initialize(): Promise<void> {
    await browserCacheOptimizer.initialize()
  },

  /**
   * Obtiene estadísticas de cache
   */
  async getStats() {
    return browserCacheOptimizer.getCacheStats()
  },

  /**
   * Limpia caches antiguos
   */
  async clearOldCaches(): Promise<void> {
    await browserCacheOptimizer.clearOldCaches()
  },

  /**
   * Actualiza Service Worker
   */
  async updateServiceWorker(): Promise<void> {
    await browserCacheOptimizer.updateServiceWorker()
  },

  /**
   * Verifica si está activo
   */
  isActive(): boolean {
    return browserCacheOptimizer.isServiceWorkerActive()
  },

  /**
   * Desregistra todos los Service Workers y limpia caches
   */
  async unregisterAndClearCaches(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    try {
      if (document.readyState !== 'complete') {
        await new Promise<void>(resolve => window.addEventListener('load', () => resolve(), { once: true }))
      }
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(reg => reg.unregister()))

      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))

      logger.info(LogCategory.CACHE, 'Service Workers desregistrados y caches limpiados')
    } catch (error) {
      const err = error as Error & { name?: string }
      if (err?.name === 'InvalidStateError') {
        logger.warn(
          LogCategory.CACHE,
          'Ignorando InvalidStateError al limpiar SW/caches (documento no activo)',
          err
        )
        return
      }
      logger.warn(LogCategory.CACHE, 'Fallo no crítico al limpiar SW/caches', err)
    }
  },
}
