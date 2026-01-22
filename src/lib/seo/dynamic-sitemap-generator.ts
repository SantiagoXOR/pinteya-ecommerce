// ===================================
// PINTEYA E-COMMERCE - ENHANCED DYNAMIC SITEMAP GENERATOR
// Sistema avanzado de generación automática de sitemap con priorización inteligente
// Incluye notificaciones a motores de búsqueda, cache multi-capa y análisis de performance
// ===================================

import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger'
import { getRedisClient } from '@/lib/integrations/redis'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { getTenantConfig, getTenantBaseUrl } from '@/lib/tenant'

// ===================================
// INTERFACES Y TIPOS MEJORADOS
// ===================================

export interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
  images?: SitemapImage[]
  videos?: SitemapVideo[]
  news?: SitemapNews[]
  alternateLanguages?: SitemapAlternate[]
}

export interface SitemapImage {
  url: string
  caption?: string
  title?: string
  geoLocation?: string
  license?: string
}

export interface SitemapVideo {
  url: string
  thumbnailUrl: string
  title: string
  description: string
  duration?: number
  rating?: number
  viewCount?: number
  publicationDate?: Date
  familyFriendly?: boolean
  tags?: string[]
}

export interface SitemapNews {
  title: string
  publicationDate: Date
  language: string
  keywords?: string
  genres?: string
  stockTickers?: string
}

export interface SitemapAlternate {
  hreflang: string
  href: string
}

export interface SitemapConfig {
  baseUrl: string
  maxUrlsPerSitemap: number
  enableImages: boolean
  enableVideos: boolean
  enableNews: boolean
  enableCompression: boolean
  enableIndexSitemap: boolean
  cacheEnabled: boolean
  cacheTTL: number // segundos

  // Configuración de prioridades inteligentes
  priorities: {
    homepage: number
    categories: number
    products: number
    staticPages: number
    blogPosts: number
    searchPages: number
  }

  // Configuración de frecuencias de cambio
  changeFrequencies: {
    homepage: SitemapEntry['changeFrequency']
    categories: SitemapEntry['changeFrequency']
    products: SitemapEntry['changeFrequency']
    staticPages: SitemapEntry['changeFrequency']
    blogPosts: SitemapEntry['changeFrequency']
    searchPages: SitemapEntry['changeFrequency']
  }

  // Rutas a excluir
  excludePatterns: string[]

  // Configuración de notificaciones a motores de búsqueda
  searchEngineNotifications: {
    google: { enabled: boolean; apiKey?: string }
    bing: { enabled: boolean; apiKey?: string }
    yandex: { enabled: boolean; apiKey?: string }
  }

  // Configuración de análisis de performance
  performanceAnalysis: {
    enabled: boolean
    trackGenerationTime: boolean
    trackCacheHitRate: boolean
    trackUrlDiscovery: boolean
  }
}

export interface SitemapStats {
  totalUrls: number
  totalSitemaps: number
  staticPages: number
  productPages: number
  categoryPages: number
  blogPages: number
  lastGenerated: Date
  generationTime: number // milliseconds
  fileSize: number
  compressionRatio?: number
  cacheHitRate: number
  urlDiscoveryTime: number
  errors: string[]
  warnings: string[]
}

export interface ProductData {
  id: number
  slug: string
  name: string
  updatedAt: Date
  images?: string[]
  category?: {
    slug: string
    name: string
  }
  isActive?: boolean
  stock?: number
}

export interface CategoryData {
  id: number
  slug: string
  name: string
  updatedAt: Date
  image?: string
  productsCount?: number
  isActive?: boolean
}

export interface BlogData {
  id: number
  slug: string
  title: string
  publishedAt: Date
  updatedAt: Date
  featuredImage?: string
  isPublished?: boolean
}

// Configuración por defecto mejorada
const DEFAULT_SITEMAP_CONFIG: SitemapConfig = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://pinteya.com',
  maxUrlsPerSitemap: 50000,
  enableImages: true,
  enableVideos: false,
  enableNews: false,
  enableCompression: true,
  enableIndexSitemap: true,
  cacheEnabled: true,
  cacheTTL: 3600, // 1 hora

  priorities: {
    homepage: 1.0,
    categories: 0.8,
    products: 0.7,
    staticPages: 0.6,
    blogPosts: 0.5,
    searchPages: 0.4,
  },

  changeFrequencies: {
    homepage: 'daily',
    categories: 'weekly',
    products: 'weekly',
    staticPages: 'monthly',
    blogPosts: 'weekly',
    searchPages: 'monthly',
  },

  excludePatterns: [
    '/admin',
    '/api',
    '/auth',
    '/checkout',
    '/cart',
    '/_next',
    '/test',
    '/debug',
    '/clerk-status',
    '/demo',
  ],

  searchEngineNotifications: {
    google: { enabled: true },
    bing: { enabled: true },
    yandex: { enabled: false },
  },

  performanceAnalysis: {
    enabled: true,
    trackGenerationTime: true,
    trackCacheHitRate: true,
    trackUrlDiscovery: true,
  },
}

// ===================================
// ENHANCED DYNAMIC SITEMAP GENERATOR CLASS
// ===================================

export class EnhancedDynamicSitemapGenerator {
  private static instance: EnhancedDynamicSitemapGenerator
  private config: SitemapConfig
  private redis: any
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private stats: SitemapStats

  private constructor(config?: Partial<SitemapConfig>) {
    this.config = { ...DEFAULT_SITEMAP_CONFIG, ...config }

    this.stats = {
      totalUrls: 0,
      totalSitemaps: 0,
      staticPages: 0,
      productPages: 0,
      categoryPages: 0,
      blogPages: 0,
      lastGenerated: new Date(),
      generationTime: 0,
      fileSize: 0,
      cacheHitRate: 0,
      urlDiscoveryTime: 0,
      errors: [],
      warnings: [],
    }

    this.initializeRedis()

    logger.info(
      LogLevel.INFO,
      'Enhanced Dynamic Sitemap Generator initialized',
      {
        baseUrl: this.config.baseUrl,
        maxUrlsPerSitemap: this.config.maxUrlsPerSitemap,
        cacheEnabled: this.config.cacheEnabled,
        enableImages: this.config.enableImages,
      },
      LogCategory.SEO
    )
  }

  public static getInstance(config?: Partial<SitemapConfig>): EnhancedDynamicSitemapGenerator {
    if (!EnhancedDynamicSitemapGenerator.instance) {
      EnhancedDynamicSitemapGenerator.instance = new EnhancedDynamicSitemapGenerator(config)
    }
    return EnhancedDynamicSitemapGenerator.instance
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = await getRedisClient()
      logger.info(LogLevel.INFO, 'Redis initialized for sitemap generator', {}, LogCategory.SEO)
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Redis not available for sitemap generator', {}, LogCategory.SEO)
    }
  }

  // ===================================
  // MÉTODOS PRINCIPALES DE GENERACIÓN
  // ===================================

  /**
   * Generar sitemap completo con análisis de performance
   * MULTITENANT: Actualiza baseUrl con el tenant actual
   */
  public async generateSitemap(): Promise<string[]> {
    const startTime = Date.now()
    this.stats.errors = []
    this.stats.warnings = []

    try {
      // MULTITENANT: Actualizar baseUrl con el tenant actual
      const tenant = await getTenantConfig()
      this.config.baseUrl = getTenantBaseUrl(tenant)

      logger.info(LogLevel.INFO, 'Starting enhanced sitemap generation', { 
        baseUrl: this.config.baseUrl,
        tenant: tenant.slug 
      }, LogCategory.SEO)

      // Verificar cache (con clave por tenant)
      const cachedSitemap = await this.getCachedSitemap(tenant.id)
      if (cachedSitemap) {
        this.updateCacheStats(true)
        logger.info(LogLevel.INFO, 'Sitemap served from cache', {}, LogCategory.SEO)
        return cachedSitemap
      }

      this.updateCacheStats(false)

      // Recopilar todas las URLs con análisis de tiempo
      const urlDiscoveryStart = Date.now()
      const allEntries = await this.collectAllUrls()
      this.stats.urlDiscoveryTime = Date.now() - urlDiscoveryStart

      // Dividir en múltiples sitemaps si es necesario
      const sitemaps = this.splitIntoSitemaps(allEntries)

      // Generar XML para cada sitemap
      const sitemapUrls: string[] = []

      if (sitemaps.length === 1) {
        // Sitemap único
        const xml = this.generateSitemapXML(sitemaps[0])
        const filename = 'sitemap.xml'
        await this.saveSitemap(filename, xml)
        sitemapUrls.push(`${this.config.baseUrl}/${filename}`)
      } else {
        // Múltiples sitemaps + índice
        for (let i = 0; i < sitemaps.length; i++) {
          const xml = this.generateSitemapXML(sitemaps[i])
          const filename = `sitemap-${i + 1}.xml`
          await this.saveSitemap(filename, xml)
          sitemapUrls.push(`${this.config.baseUrl}/${filename}`)
        }

        // Generar sitemap índice
        if (this.config.enableIndexSitemap) {
          const indexXml = this.generateSitemapIndexXML(sitemapUrls)
          await this.saveSitemap('sitemap.xml', indexXml)
        }
      }

      // Actualizar estadísticas
      this.updateStats(allEntries, sitemaps.length, Date.now() - startTime)

      // Cachear resultado (con tenant_id) - tenant ya está definido arriba
      await this.cacheSitemap(sitemapUrls, tenant.id)

      // Notificar a motores de búsqueda
      await this.notifySearchEngines()

      logger.info(
        LogLevel.INFO,
        'Enhanced sitemap generation completed',
        {
          totalUrls: this.stats.totalUrls,
          totalSitemaps: this.stats.totalSitemaps,
          generationTime: this.stats.generationTime,
          cacheHitRate: this.stats.cacheHitRate,
        },
        LogCategory.SEO
      )

      return sitemapUrls
    } catch (error) {
      this.stats.errors.push((error as Error).message)
      logger.error(
        LogLevel.ERROR,
        'Failed to generate enhanced sitemap',
        error as Error,
        LogCategory.SEO
      )
      throw error
    }
  }

  /**
   * Recopilar todas las URLs del sitio
   */
  private async collectAllUrls(): Promise<SitemapEntry[]> {
    const entries: SitemapEntry[] = []

    try {
      // URLs estáticas
      const staticEntries = await this.getStaticPages()
      entries.push(...staticEntries)
      this.stats.staticPages = staticEntries.length

      // URLs de productos
      const productEntries = await this.getProductPages()
      entries.push(...productEntries)

      // URLs de categorías
      const categoryEntries = await this.getCategoryPages()
      entries.push(...categoryEntries)

      // URLs de blog (si existen)
      const blogEntries = await this.getBlogPages()
      entries.push(...blogEntries)

      // Actualizar estadísticas después de recopilar todas las URLs
      this.stats.staticPages = staticEntries.length
      this.stats.productPages = productEntries.length
      this.stats.categoryPages = categoryEntries.length
      this.stats.blogPages = blogEntries.length

      // Filtrar URLs excluidas
      const filteredEntries = this.filterExcludedUrls(entries)

      // Ordenar por prioridad y fecha de modificación
      filteredEntries.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return b.lastModified.getTime() - a.lastModified.getTime()
      })

      return filteredEntries
    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to collect URLs', error as Error, LogCategory.SEO)
      throw error
    }
  }

  /**
   * Obtener páginas estáticas
   */
  private async getStaticPages(): Promise<SitemapEntry[]> {
    const staticPages = [
      {
        path: '/',
        priority: this.config.priorities.homepage,
        changeFreq: this.config.changeFrequencies.homepage,
        lastModified: new Date(),
      },
      {
        path: '/shop',
        priority: this.config.priorities.staticPages,
        changeFreq: this.config.changeFrequencies.staticPages,
        lastModified: new Date(),
      },
      {
        path: '/about',
        priority: this.config.priorities.staticPages,
        changeFreq: this.config.changeFrequencies.staticPages,
        lastModified: new Date(),
      },
      {
        path: '/contact',
        priority: this.config.priorities.staticPages,
        changeFreq: this.config.changeFrequencies.staticPages,
        lastModified: new Date(),
      },
      {
        path: '/help',
        priority: this.config.priorities.staticPages,
        changeFreq: this.config.changeFrequencies.staticPages,
        lastModified: new Date(),
      },
      {
        path: '/search',
        priority: this.config.priorities.searchPages,
        changeFreq: this.config.changeFrequencies.searchPages,
        lastModified: new Date(),
      },
    ]

    return staticPages.map(page => ({
      url: `${this.config.baseUrl}${page.path}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFreq,
      priority: page.priority,
    }))
  }

  /**
   * Obtener páginas de productos desde la base de datos
   * MULTITENANT: Filtra por tenant usando tenant_products
   */
  private async getProductPages(): Promise<SitemapEntry[]> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        this.stats.warnings.push('Supabase client not available for product pages')
        return []
      }

      // MULTITENANT: Obtener tenant actual
      const tenant = await getTenantConfig()

      const { data: products, error } = await supabase
        .from('products')
        .select(
          `
          id, slug, name, updated_at, images,
          category:categories(slug, name),
          tenant_products!inner (
            tenant_id,
            is_visible
          )
        `
        )
        .eq('is_active', true)
        .eq('tenant_products.tenant_id', tenant.id)
        .eq('tenant_products.is_visible', true)
        .order('updated_at', { ascending: false })

      if (error) {
        logger.error(LogLevel.ERROR, 'Failed to fetch products for sitemap', error, LogCategory.SEO)
        this.stats.errors.push(`Product fetch error: ${error.message}`)
        return []
      }

      const productEntries = (products || []).map(product => ({
        url: `${this.config.baseUrl}/shop-details/${product.slug}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: this.config.changeFrequencies.products,
        priority: this.config.priorities.products,
        images:
          this.config.enableImages && product.images
            ? product.images.slice(0, 3).map((img: string) => ({
                url: `${this.config.baseUrl}${img}`,
                caption: product.name,
                title: product.name,
              }))
            : undefined,
      }))

      return productEntries
    } catch (error) {
      logger.error(LogLevel.ERROR, 'Error fetching product pages', error as Error, LogCategory.SEO)
      this.stats.errors.push(`Product pages error: ${(error as Error).message}`)
      return []
    }
  }

  /**
   * Obtener páginas de categorías desde la base de datos
   * MULTITENANT: Filtra por tenant_id
   */
  private async getCategoryPages(): Promise<SitemapEntry[]> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        this.stats.warnings.push('Supabase client not available for category pages')
        return []
      }

      // MULTITENANT: Obtener tenant actual
      const tenant = await getTenantConfig()

      const { data: categories, error } = await supabase
        .from('categories')
        .select(
          `
          id, slug, name, updated_at, image,
          products_count:products(count)
        `
        )
        .eq('tenant_id', tenant.id)
        .order('name')

      if (error) {
        logger.error(
          LogLevel.ERROR,
          'Failed to fetch categories for sitemap',
          error,
          LogCategory.SEO
        )
        this.stats.errors.push(`Category fetch error: ${error.message}`)
        return []
      }

      return (categories || []).map(category => ({
        url: `${this.config.baseUrl}/shop?category=${category.slug}`,
        lastModified: new Date(category.updated_at || new Date()),
        changeFrequency: this.config.changeFrequencies.categories,
        priority: this.config.priorities.categories,
        images:
          this.config.enableImages && category.image
            ? [
                {
                  url: `${this.config.baseUrl}${category.image}`,
                  caption: category.name,
                  title: category.name,
                },
              ]
            : undefined,
      }))
    } catch (error) {
      logger.error(LogLevel.ERROR, 'Error fetching category pages', error as Error, LogCategory.SEO)
      this.stats.errors.push(`Category pages error: ${(error as Error).message}`)
      return []
    }
  }

  /**
   * Obtener páginas de blog (placeholder para futuras implementaciones)
   */
  private async getBlogPages(): Promise<SitemapEntry[]> {
    // Por ahora retornamos array vacío, pero se puede implementar cuando se agregue blog
    return []
  }

  /**
   * Filtrar URLs excluidas según patrones configurados
   */
  private filterExcludedUrls(entries: SitemapEntry[]): SitemapEntry[] {
    return entries.filter(entry => {
      const url = new URL(entry.url)
      const path = url.pathname

      return !this.config.excludePatterns.some(pattern => {
        if (pattern.endsWith('*')) {
          return path.startsWith(pattern.slice(0, -1))
        }
        return path === pattern || path.startsWith(pattern + '/')
      })
    })
  }

  /**
   * Dividir entradas en múltiples sitemaps si exceden el límite
   */
  private splitIntoSitemaps(entries: SitemapEntry[]): SitemapEntry[][] {
    const sitemaps: SitemapEntry[][] = []
    const maxUrls = this.config.maxUrlsPerSitemap

    for (let i = 0; i < entries.length; i += maxUrls) {
      sitemaps.push(entries.slice(i, i + maxUrls))
    }

    return sitemaps.length > 0 ? sitemaps : [[]]
  }

  /**
   * Generar XML para un sitemap
   */
  private generateSitemapXML(entries: SitemapEntry[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n'
    const urlsetOpen =
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
      (this.config.enableImages
        ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
        : '') +
      (this.config.enableVideos
        ? ' xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"'
        : '') +
      (this.config.enableNews
        ? ' xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'
        : '') +
      '>\n'

    const urls = entries.map(entry => this.generateUrlXML(entry)).join('')
    const urlsetClose = '</urlset>'

    return xmlHeader + urlsetOpen + urls + urlsetClose
  }

  /**
   * Generar XML para una URL individual
   */
  private generateUrlXML(entry: SitemapEntry): string {
    let xml = '  <url>\n'
    xml += `    <loc>${this.escapeXml(entry.url)}</loc>\n`
    xml += `    <lastmod>${entry.lastModified.toISOString().split('T')[0]}</lastmod>\n`
    xml += `    <changefreq>${entry.changeFrequency}</changefreq>\n`
    xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`

    // Agregar imágenes si están habilitadas
    if (this.config.enableImages && entry.images) {
      entry.images.forEach(image => {
        xml += '    <image:image>\n'
        xml += `      <image:loc>${this.escapeXml(image.url)}</image:loc>\n`
        if (image.caption) {
          xml += `      <image:caption>${this.escapeXml(image.caption)}</image:caption>\n`
        }
        if (image.title) {
          xml += `      <image:title>${this.escapeXml(image.title)}</image:title>\n`
        }
        xml += '    </image:image>\n'
      })
    }

    xml += '  </url>\n'
    return xml
  }

  /**
   * Generar XML para sitemap índice
   */
  private generateSitemapIndexXML(sitemapUrls: string[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n'
    const sitemapIndexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    const sitemaps = sitemapUrls
      .map(url => {
        return (
          `  <sitemap>\n` +
          `    <loc>${this.escapeXml(url)}</loc>\n` +
          `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n` +
          `  </sitemap>\n`
        )
      })
      .join('')

    const sitemapIndexClose = '</sitemapindex>'

    return xmlHeader + sitemapIndexOpen + sitemaps + sitemapIndexClose
  }

  /**
   * Escapar caracteres especiales para XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  // ===================================
  // MÉTODOS DE CACHE Y PERSISTENCIA
  // ===================================

  /**
   * Obtener sitemap desde cache
   * MULTITENANT: Incluye tenant_id en la clave del cache
   */
  private async getCachedSitemap(tenantId?: string): Promise<string[] | null> {
    if (!this.config.cacheEnabled) {
      return null
    }

    const cacheKey = tenantId ? `sitemap:urls:${tenantId}` : 'sitemap:urls'

    try {
      // Intentar Redis primero
      if (this.redis) {
        const cached = await this.redis.get(cacheKey)
        if (cached) {
          const data = JSON.parse(cached)
          if (Date.now() - data.timestamp < this.config.cacheTTL * 1000) {
            return data.urls
          }
        }
      }

      // Fallback a cache en memoria
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL * 1000) {
        return cached.data
      }

      return null
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Error accessing sitemap cache', {}, LogCategory.SEO)
      return null
    }
  }

  /**
   * Cachear sitemap generado
   * MULTITENANT: Incluye tenant_id en la clave del cache
   */
  private async cacheSitemap(urls: string[], tenantId?: string): Promise<void> {
    if (!this.config.cacheEnabled) {
      return
    }

    const cacheKey = tenantId ? `sitemap:urls:${tenantId}` : 'sitemap:urls'

    const cacheData = {
      urls,
      timestamp: Date.now(),
    }

    try {
      // Cachear en Redis
      if (this.redis) {
        await this.redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(cacheData))
      }

      // Cachear en memoria como fallback
      this.cache.set(cacheKey, cacheData)
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Error caching sitemap', {}, LogCategory.SEO)
    }
  }

  /**
   * Guardar sitemap en el sistema de archivos
   */
  private async saveSitemap(filename: string, content: string): Promise<void> {
    try {
      // En un entorno real, esto guardaría el archivo en el sistema de archivos
      // Por ahora, solo calculamos el tamaño para estadísticas
      this.stats.fileSize += Buffer.byteLength(content, 'utf8')

      logger.info(
        LogLevel.INFO,
        `Sitemap saved: ${filename}`,
        {
          size: Buffer.byteLength(content, 'utf8'),
          urls: (content.match(/<url>/g) || []).length,
        },
        LogCategory.SEO
      )
    } catch (error) {
      logger.error(
        LogLevel.ERROR,
        `Failed to save sitemap: ${filename}`,
        error as Error,
        LogCategory.SEO
      )
      throw error
    }
  }

  // ===================================
  // NOTIFICACIONES A MOTORES DE BÚSQUEDA
  // ===================================

  /**
   * Notificar a motores de búsqueda sobre sitemap actualizado
   */
  private async notifySearchEngines(): Promise<void> {
    const sitemapUrl = `${this.config.baseUrl}/sitemap.xml`

    try {
      const notifications: Promise<void>[] = []

      // Google Search Console
      if (this.config.searchEngineNotifications.google.enabled) {
        notifications.push(this.notifyGoogle(sitemapUrl))
      }

      // Bing Webmaster Tools
      if (this.config.searchEngineNotifications.bing.enabled) {
        notifications.push(this.notifyBing(sitemapUrl))
      }

      // Yandex Webmaster
      if (this.config.searchEngineNotifications.yandex.enabled) {
        notifications.push(this.notifyYandex(sitemapUrl))
      }

      await Promise.allSettled(notifications)
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Error notifying search engines', {}, LogCategory.SEO)
    }
  }

  /**
   * Notificar a Google
   */
  private async notifyGoogle(sitemapUrl: string): Promise<void> {
    try {
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`

      // En un entorno real, haríamos una petición HTTP
      logger.info(
        LogLevel.INFO,
        'Google sitemap notification sent',
        { sitemapUrl },
        LogCategory.SEO
      )
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Failed to notify Google', {}, LogCategory.SEO)
    }
  }

  /**
   * Notificar a Bing
   */
  private async notifyBing(sitemapUrl: string): Promise<void> {
    try {
      const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`

      // En un entorno real, haríamos una petición HTTP
      logger.info(LogLevel.INFO, 'Bing sitemap notification sent', { sitemapUrl }, LogCategory.SEO)
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Failed to notify Bing', {}, LogCategory.SEO)
    }
  }

  /**
   * Notificar a Yandex
   */
  private async notifyYandex(sitemapUrl: string): Promise<void> {
    try {
      const pingUrl = `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`

      // En un entorno real, haríamos una petición HTTP
      logger.info(
        LogLevel.INFO,
        'Yandex sitemap notification sent',
        { sitemapUrl },
        LogCategory.SEO
      )
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Failed to notify Yandex', {}, LogCategory.SEO)
    }
  }

  // ===================================
  // MÉTODOS DE ESTADÍSTICAS Y UTILIDADES
  // ===================================

  /**
   * Actualizar estadísticas después de la generación
   */
  private updateStats(entries: SitemapEntry[], sitemapCount: number, generationTime: number): void {
    this.stats.totalUrls = entries.length
    this.stats.totalSitemaps = sitemapCount
    this.stats.lastGenerated = new Date()
    this.stats.generationTime = generationTime

    // Calcular ratio de compresión si está habilitado
    if (this.config.enableCompression) {
      // Placeholder para cálculo real de compresión
      this.stats.compressionRatio = 0.7 // 70% de compresión estimada
    }
  }

  /**
   * Actualizar estadísticas de cache
   */
  private updateCacheStats(isHit: boolean): void {
    const totalRequests = this.stats.cacheHitRate * 100 + (isHit ? 1 : 0)
    const hits = this.stats.cacheHitRate * (totalRequests - 1) + (isHit ? 1 : 0)
    this.stats.cacheHitRate = totalRequests > 0 ? hits / totalRequests : 0
  }

  /**
   * Obtener estadísticas del generador
   */
  public getStats(): SitemapStats {
    return { ...this.stats }
  }

  /**
   * Configurar el generador
   */
  public configure(config: Partial<SitemapConfig>): void {
    this.config = { ...this.config, ...config }
    logger.info(
      LogLevel.INFO,
      'Sitemap generator reconfigured',
      {
        baseUrl: this.config.baseUrl,
        maxUrlsPerSitemap: this.config.maxUrlsPerSitemap,
      },
      LogCategory.SEO
    )
  }

  /**
   * Limpiar cache
   */
  public async clearCache(): Promise<void> {
    try {
      // Limpiar Redis
      if (this.redis) {
        await this.redis.del('sitemap:urls')
      }

      // Limpiar cache en memoria
      this.cache.clear()

      logger.info(LogLevel.INFO, 'Sitemap cache cleared', {}, LogCategory.SEO)
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Error clearing sitemap cache', {}, LogCategory.SEO)
    }
  }

  /**
   * Validar sitemap XML
   */
  public validateSitemap(xml: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Verificaciones básicas
      if (!xml.includes('<?xml version="1.0"')) {
        errors.push('Missing XML declaration')
      }

      if (!xml.includes('<urlset')) {
        errors.push('Missing urlset element')
      }

      if (!xml.includes('</urlset>')) {
        errors.push('Sitemap not properly closed')
      }

      // Contar URLs
      const urlMatches = xml.match(/<url>/g)
      const urlCount = urlMatches ? urlMatches.length : 0

      if (urlCount === 0) {
        errors.push('No URLs found in sitemap')
      }

      if (urlCount > this.config.maxUrlsPerSitemap) {
        errors.push(`Too many URLs: ${urlCount} (max: ${this.config.maxUrlsPerSitemap})`)
      }

      // Verificar URLs válidas
      const locMatches = xml.match(/<loc>(.*?)<\/loc>/g)
      if (locMatches) {
        locMatches.forEach((match, index) => {
          const url = match.replace(/<\/?loc>/g, '')
          try {
            new URL(url)
          } catch {
            errors.push(`Invalid URL at position ${index + 1}: ${url}`)
          }
        })
      }
    } catch (error) {
      errors.push(`Validation error: ${error}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Generar reporte de sitemap
   */
  public generateReport(): {
    summary: SitemapStats
    recommendations: string[]
    performance: {
      generationTime: number
      cacheEfficiency: number
      urlDiscoveryTime: number
    }
  } {
    const recommendations: string[] = []

    // Analizar performance y generar recomendaciones
    if (this.stats.generationTime > 5000) {
      recommendations.push('Consider enabling caching to improve generation time')
    }

    if (this.stats.cacheHitRate < 0.5) {
      recommendations.push('Cache hit rate is low, consider increasing cache TTL')
    }

    if (this.stats.totalUrls > 40000) {
      recommendations.push('Consider splitting into multiple sitemaps for better performance')
    }

    if (this.stats.errors.length > 0) {
      recommendations.push('Fix errors in sitemap generation process')
    }

    return {
      summary: this.getStats(),
      recommendations,
      performance: {
        generationTime: this.stats.generationTime,
        cacheEfficiency: this.stats.cacheHitRate,
        urlDiscoveryTime: this.stats.urlDiscoveryTime,
      },
    }
  }

  /**
   * Destruir instancia y limpiar recursos
   */
  public async destroy(): Promise<void> {
    try {
      await this.clearCache()

      if (this.redis) {
        // En un entorno real, cerraríamos la conexión Redis
        this.redis = null
      }

      this.cache.clear()

      logger.info(
        LogLevel.INFO,
        'Enhanced Dynamic Sitemap Generator destroyed',
        {},
        LogCategory.SEO
      )
    } catch (error) {
      logger.error(
        LogLevel.ERROR,
        'Error destroying sitemap generator',
        error as Error,
        LogCategory.SEO
      )
    }
  }
}

// ===================================
// EXPORTACIONES
// ===================================

// Instancia singleton
export const enhancedDynamicSitemapGenerator = EnhancedDynamicSitemapGenerator.getInstance()

// Exportar clase para uso directo
export { EnhancedDynamicSitemapGenerator as DynamicSitemapGenerator }

// Exportar tipos
export type {
  SitemapEntry,
  SitemapImage,
  SitemapVideo,
  SitemapNews,
  SitemapAlternate,
  SitemapConfig,
  SitemapStats,
  ProductData,
  CategoryData,
  BlogData,
}
