// ===================================
// PINTEYA E-COMMERCE - DYNAMIC SEO MANAGER - ENHANCED
// Sistema de gestión dinámica de SEO para productos, categorías y páginas
// Versión mejorada con templates, cache y análisis automático
// ===================================

import type { Metadata } from 'next';
import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger';
import { getRedisClient } from '@/lib/integrations/redis';

// ===================================
// INTERFACES Y TIPOS MEJORADOS
// ===================================

// Configuración SEO mejorada
export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  structuredData?: object[];
}

// Template SEO para generación dinámica
export interface SEOTemplate {
  id: string;
  name: string;
  type: 'product' | 'category' | 'page' | 'blog' | 'custom';
  titleTemplate: string;
  descriptionTemplate: string;
  keywordsTemplate: string[];
  robotsDirective?: string;
  priority: number;
  isActive: boolean;
  variables: string[];
  conditions?: SEOCondition[];
}

// Condiciones para aplicar templates
export interface SEOCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: any;
}

// Análisis SEO
export interface SEOAnalysis {
  score: number;
  issues: SEOIssue[];
  recommendations: SEORecommendation[];
  metrics: {
    titleLength: number;
    descriptionLength: number;
    keywordDensity: number;
    readabilityScore: number;
    imageOptimization: number;
  };
}

// Problemas SEO detectados
export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'title' | 'description' | 'keywords' | 'images' | 'structure' | 'performance';
  message: string;
  impact: 'high' | 'medium' | 'low';
  fix?: string;
}

// Recomendaciones SEO
export interface SEORecommendation {
  category: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  implementation: string;
}

// Configuración global del sistema SEO
export interface DynamicSEOConfig {
  defaultLanguage: string;
  supportedLanguages: string[];
  baseUrl: string;
  siteName: string;
  defaultImage: string;
  twitterHandle: string;
  facebookAppId?: string;
  enableAutoGeneration: boolean;
  enableAnalytics: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
}

// ===================================
// CONFIGURACIÓN POR DEFECTO
// ===================================

const DEFAULT_SEO_CONFIG: DynamicSEOConfig = {
  defaultLanguage: 'es',
  supportedLanguages: ['es', 'en'],
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://pinteya.com',
  siteName: 'Pinteya E-commerce',
  defaultImage: '/images/og-default.jpg',
  twitterHandle: '@pinteya',
  enableAutoGeneration: true,
  enableAnalytics: true,
  cacheEnabled: true,
  cacheTTL: 3600 // 1 hora
};

const DEFAULT_TEMPLATES: SEOTemplate[] = [
  {
    id: 'product-default',
    name: 'Producto por Defecto',
    type: 'product',
    titleTemplate: '{productName} - {categoryName} | {siteName}',
    descriptionTemplate: 'Compra {productName} en {siteName}. {productDescription} Precio: ${productPrice}. Envío gratis.',
    keywordsTemplate: ['{productName}', '{categoryName}', 'comprar', 'precio', '{siteName}'],
    robotsDirective: 'index,follow',
    priority: 1,
    isActive: true,
    variables: ['productName', 'categoryName', 'productDescription', 'productPrice', 'siteName']
  },
  {
    id: 'category-default',
    name: 'Categoría por Defecto',
    type: 'category',
    titleTemplate: '{categoryName} - Productos de Calidad | {siteName}',
    descriptionTemplate: 'Descubre nuestra selección de {categoryName} en {siteName}. {productCount} productos disponibles con envío gratis.',
    keywordsTemplate: ['{categoryName}', 'productos', 'comprar', '{siteName}'],
    robotsDirective: 'index,follow',
    priority: 1,
    isActive: true,
    variables: ['categoryName', 'productCount', 'siteName']
  },
  {
    id: 'page-default',
    name: 'Página por Defecto',
    type: 'page',
    titleTemplate: '{pageTitle} | {siteName}',
    descriptionTemplate: '{pageDescription}',
    keywordsTemplate: ['{pageKeywords}'],
    robotsDirective: 'index,follow',
    priority: 1,
    isActive: true,
    variables: ['pageTitle', 'pageDescription', 'pageKeywords', 'siteName']
  }
];

export interface ProductSEOData {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  brand: string;
  category: string;
  subcategory?: string;
  images: string[];
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  condition: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  sku?: string;
  gtin?: string;
  mpn?: string;
  slug: string;
}

export interface CategorySEOData {
  id: string;
  name: string;
  description: string;
  slug: string;
  parentCategory?: string;
  productCount: number;
  image?: string;
  subcategories?: string[];
}

export interface PageSEOData {
  path: string;
  title: string;
  description: string;
  type: 'page' | 'article' | 'product' | 'category' | 'checkout' | 'profile';
  lastModified?: Date;
  priority?: number;
  changeFreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

// ===================================
// ENHANCED DYNAMIC SEO MANAGER CLASS
// ===================================

export class EnhancedDynamicSEOManager {
  private static instance: EnhancedDynamicSEOManager;
  private config: DynamicSEOConfig;
  private templates: Map<string, SEOTemplate>;
  private cache: Map<string, { metadata: SEOConfig; timestamp: number }>;
  private redis: any;

  private constructor(config?: Partial<DynamicSEOConfig>) {
    this.config = { ...DEFAULT_SEO_CONFIG, ...config };
    this.templates = new Map();
    this.cache = new Map();

    // Cargar templates por defecto
    DEFAULT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });

    // Inicializar Redis si está disponible
    this.initializeRedis();

    logger.info(LogLevel.INFO, 'Enhanced Dynamic SEO Manager initialized', {
      templatesCount: this.templates.size,
      cacheEnabled: this.config.cacheEnabled
    }, LogCategory.SEO);
  }

  public static getInstance(config?: Partial<DynamicSEOConfig>): EnhancedDynamicSEOManager {
    if (!EnhancedDynamicSEOManager.instance) {
      EnhancedDynamicSEOManager.instance = new EnhancedDynamicSEOManager(config);
    }
    return EnhancedDynamicSEOManager.instance;
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = await getRedisClient();
      logger.info(LogLevel.INFO, 'Redis initialized for SEO caching', {}, LogCategory.SEO);
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Redis not available, using memory cache only', {}, LogCategory.SEO);
    }
  }

  // ===================================
  // GESTIÓN DE TEMPLATES
  // ===================================

  public addTemplate(template: SEOTemplate): void {
    this.templates.set(template.id, template);

    logger.info(LogLevel.INFO, 'SEO template added', {
      templateId: template.id,
      type: template.type,
      priority: template.priority
    }, LogCategory.SEO);
  }

  public updateTemplate(templateId: string, updates: Partial<SEOTemplate>): boolean {
    const template = this.templates.get(templateId);
    if (!template) {
      logger.warn(LogLevel.WARN, 'SEO template not found for update', {
        templateId
      }, LogCategory.SEO);
      return false;
    }

    const updatedTemplate = { ...template, ...updates };
    this.templates.set(templateId, updatedTemplate);

    // Limpiar cache relacionado
    this.clearCacheByType(template.type);

    logger.info(LogLevel.INFO, 'SEO template updated', {
      templateId,
      changes: Object.keys(updates)
    }, LogCategory.SEO);

    return true;
  }

  public getTemplatesByType(type: SEOTemplate['type']): SEOTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.type === type && template.isActive)
      .sort((a, b) => b.priority - a.priority);
  }

  // ===================================
  // GENERACIÓN DE METADATA MEJORADA
  // ===================================

  public async generateMetadata(
    type: SEOTemplate['type'],
    data: Record<string, any>,
    options?: {
      templateId?: string;
      language?: string;
      customTemplate?: Partial<SEOTemplate>;
    }
  ): Promise<SEOConfig> {
    const cacheKey = this.generateCacheKey(type, data, options);

    // Verificar cache
    if (this.config.cacheEnabled) {
      const cached = await this.getCachedMetadata(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Seleccionar template
      const template = this.selectTemplate(type, data, options);

      if (!template) {
        throw new Error(`No template found for type: ${type}`);
      }

      // Generar metadata
      const metadata = await this.processTemplate(template, data, options);

      // Cachear resultado
      if (this.config.cacheEnabled) {
        await this.setCachedMetadata(cacheKey, metadata);
      }

      logger.info(LogLevel.INFO, 'SEO metadata generated', {
        type,
        templateId: template.id,
        cacheKey,
        titleLength: metadata.title.length,
        descriptionLength: metadata.description.length
      }, LogCategory.SEO);

      return metadata;

    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to generate SEO metadata', error as Error, LogCategory.SEO);

      // Fallback a metadata básica
      return this.generateFallbackMetadata(type, data);
    }
  }

  private selectTemplate(
    type: SEOTemplate['type'],
    data: Record<string, any>,
    options?: { templateId?: string; customTemplate?: Partial<SEOTemplate> }
  ): SEOTemplate | null {
    // Template personalizado
    if (options?.customTemplate) {
      return {
        id: 'custom',
        name: 'Custom Template',
        type,
        priority: 999,
        isActive: true,
        variables: [],
        titleTemplate: '',
        descriptionTemplate: '',
        keywordsTemplate: [],
        ...options.customTemplate
      } as SEOTemplate;
    }

    // Template específico
    if (options?.templateId) {
      const template = this.templates.get(options.templateId);
      if (template && template.isActive) {
        return template;
      }
    }

    // Buscar template por tipo y condiciones
    const candidates = this.getTemplatesByType(type);

    for (const template of candidates) {
      if (this.evaluateConditions(template, data)) {
        return template;
      }
    }

    return candidates[0] || null;
  }

  private evaluateConditions(template: SEOTemplate, data: Record<string, any>): boolean {
    if (!template.conditions || template.conditions.length === 0) {
      return true;
    }

    return template.conditions.every(condition => {
      const value = this.getNestedValue(data, condition.field);

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'startsWith':
          return String(value).startsWith(String(condition.value));
        case 'endsWith':
          return String(value).endsWith(String(condition.value));
        case 'greaterThan':
          return Number(value) > Number(condition.value);
        case 'lessThan':
          return Number(value) < Number(condition.value);
        default:
          return true;
      }
    });
  }

  private async processTemplate(
    template: SEOTemplate,
    data: Record<string, any>,
    options?: { language?: string }
  ): Promise<SEOConfig> {
    const language = options?.language || this.config.defaultLanguage;
    const processedData = this.enrichData(data, language);

    // Procesar title
    const title = this.processTemplateString(template.titleTemplate, processedData);

    // Procesar description
    const description = this.processTemplateString(template.descriptionTemplate, processedData);

    // Procesar keywords
    const keywords = template.keywordsTemplate.map(keyword =>
      this.processTemplateString(keyword, processedData)
    ).filter(Boolean);

    // Generar URL canónica
    const canonical = this.generateCanonicalUrl(data, language);

    // Generar structured data
    const structuredData = await this.generateStructuredData(template.type, processedData);

    return {
      title: this.optimizeTitle(title),
      description: this.optimizeDescription(description),
      keywords: this.optimizeKeywords(keywords),
      canonical,
      ogImage: data.image || this.config.defaultImage,
      ogType: this.getOGType(template.type),
      twitterCard: 'summary_large_image',
      structuredData: structuredData ? [structuredData] : undefined,
      noindex: template.robotsDirective?.includes('noindex') || false,
      nofollow: template.robotsDirective?.includes('nofollow') || false
    };
  }

  private processTemplateString(template: string, data: Record<string, any>): string {
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
      const value = this.getNestedValue(data, key);
      return value !== undefined ? String(value) : match;
    });
  }

  private enrichData(data: Record<string, any>, language: string): Record<string, any> {
    return {
      ...data,
      siteName: this.config.siteName,
      baseUrl: this.config.baseUrl,
      language,
      currentDate: new Date().toISOString().split('T')[0],
      currentYear: new Date().getFullYear()
    };
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // ===================================
  // OPTIMIZACIÓN DE METADATA
  // ===================================

  private optimizeTitle(title: string): string {
    // Límite recomendado: 60 caracteres
    if (title.length <= 60) {
      return title;
    }

    // Truncar en palabra completa
    const truncated = title.substring(0, 57);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 40 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  private optimizeDescription(description: string): string {
    // Límite recomendado: 160 caracteres
    if (description.length <= 160) {
      return description;
    }

    // Truncar en palabra completa
    const truncated = description.substring(0, 157);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 140 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  private optimizeKeywords(keywords: string[]): string[] {
    // Filtrar keywords vacías y duplicadas
    const unique = [...new Set(keywords.filter(Boolean))];

    // Límite recomendado: 10 keywords
    return unique.slice(0, 10);
  }

  // ===================================
  // UTILIDADES
  // ===================================

  private generateCanonicalUrl(data: Record<string, any>, language: string): string {
    const baseUrl = this.config.baseUrl;
    const path = data.path || data.slug || '';
    const langPrefix = language !== this.config.defaultLanguage ? `/${language}` : '';

    return `${baseUrl}${langPrefix}${path}`;
  }

  private getOGType(type: SEOTemplate['type']): string {
    switch (type) {
      case 'product':
        return 'product';
      case 'blog':
        return 'article';
      default:
        return 'website';
    }
  }

  private async generateStructuredData(type: SEOTemplate['type'], data: Record<string, any>): Promise<any> {
    switch (type) {
      case 'product':
        return this.generateProductStructuredData(data);
      case 'category':
        return this.generateCategoryStructuredData(data);
      case 'blog':
        return this.generateArticleStructuredData(data);
      default:
        return this.generateWebsiteStructuredData(data);
    }
  }

  private generateProductStructuredData(data: Record<string, any>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.productName || data.name,
      description: data.productDescription || data.description,
      image: data.image || this.config.defaultImage,
      brand: {
        '@type': 'Brand',
        name: this.config.siteName
      },
      offers: {
        '@type': 'Offer',
        price: data.productPrice || data.price,
        priceCurrency: 'ARS',
        availability: data.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: this.config.siteName
        }
      }
    };
  }

  private generateCategoryStructuredData(data: Record<string, any>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: data.categoryName || data.name,
      description: data.categoryDescription || data.description,
      url: this.generateCanonicalUrl(data, this.config.defaultLanguage)
    };
  }

  private generateArticleStructuredData(data: Record<string, any>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      description: data.description,
      image: data.image || this.config.defaultImage,
      author: {
        '@type': 'Person',
        name: data.author || this.config.siteName
      },
      publisher: {
        '@type': 'Organization',
        name: this.config.siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${this.config.baseUrl}/logo.png`
        }
      },
      datePublished: data.publishedAt || data.createdAt,
      dateModified: data.updatedAt || data.publishedAt || data.createdAt
    };
  }

  private generateWebsiteStructuredData(data: Record<string, any>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.config.siteName,
      url: this.config.baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.config.baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
  }

  private generateFallbackMetadata(type: SEOTemplate['type'], data: Record<string, any>): SEOConfig {
    const title = data.title || data.name || `${this.config.siteName}`;
    const description = data.description || `Descubre productos de calidad en ${this.config.siteName}`;

    return {
      title: this.optimizeTitle(title),
      description: this.optimizeDescription(description),
      keywords: ['ecommerce', 'productos', 'comprar'],
      canonical: this.generateCanonicalUrl(data, this.config.defaultLanguage),
      ogImage: this.config.defaultImage,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      noindex: false,
      nofollow: false
    };
  }

  // ===================================
  // GESTIÓN DE CACHE
  // ===================================

  private generateCacheKey(
    type: SEOTemplate['type'],
    data: Record<string, any>,
    options?: any
  ): string {
    const keyData = {
      type,
      id: data.id || data.slug,
      templateId: options?.templateId,
      language: options?.language || this.config.defaultLanguage
    };

    return `seo:${JSON.stringify(keyData)}`;
  }

  private async getCachedMetadata(cacheKey: string): Promise<SEOConfig | null> {
    try {
      // Intentar Redis primero
      if (this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Fallback a cache en memoria
      const memoryCached = this.cache.get(cacheKey);
      if (memoryCached) {
        const isExpired = Date.now() - memoryCached.timestamp > this.config.cacheTTL * 1000;
        if (!isExpired) {
          return memoryCached.metadata;
        } else {
          this.cache.delete(cacheKey);
        }
      }

      return null;
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Failed to get cached SEO metadata', { cacheKey }, LogCategory.SEO);
      return null;
    }
  }

  private async setCachedMetadata(cacheKey: string, metadata: SEOConfig): Promise<void> {
    try {
      // Cachear en Redis si está disponible
      if (this.redis) {
        await this.redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(metadata));
      }

      // Cachear en memoria como backup
      this.cache.set(cacheKey, {
        metadata,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Failed to cache SEO metadata', { cacheKey }, LogCategory.SEO);
    }
  }

  private clearCacheByType(type: SEOTemplate['type']): void {
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.includes(`"type":"${type}"`));

    keysToDelete.forEach(key => this.cache.delete(key));

    logger.info(LogLevel.INFO, 'SEO cache cleared by type', {
      type,
      clearedKeys: keysToDelete.length
    }, LogCategory.SEO);
  }

  public clearCache(): void {
    this.cache.clear();
    logger.info(LogLevel.INFO, 'SEO cache cleared completely', {}, LogCategory.SEO);
  }

  // ===================================
  // ANÁLISIS SEO
  // ===================================

  public analyzeSEO(metadata: SEOConfig): SEOAnalysis {
    const issues: SEOIssue[] = [];
    const recommendations: SEORecommendation[] = [];

    // Analizar título
    if (!metadata.title) {
      issues.push({
        type: 'error',
        category: 'title',
        message: 'El título es requerido',
        impact: 'high',
        fix: 'Agregar un título descriptivo'
      });
    } else if (metadata.title.length > 60) {
      issues.push({
        type: 'warning',
        category: 'title',
        message: 'El título es demasiado largo (>60 caracteres)',
        impact: 'medium',
        fix: 'Reducir la longitud del título'
      });
    } else if (metadata.title.length < 30) {
      issues.push({
        type: 'warning',
        category: 'title',
        message: 'El título es demasiado corto (<30 caracteres)',
        impact: 'medium',
        fix: 'Expandir el título con más información relevante'
      });
    }

    // Analizar descripción
    if (!metadata.description) {
      issues.push({
        type: 'error',
        category: 'description',
        message: 'La descripción es requerida',
        impact: 'high',
        fix: 'Agregar una descripción informativa'
      });
    } else if (metadata.description.length > 160) {
      issues.push({
        type: 'warning',
        category: 'description',
        message: 'La descripción es demasiado larga (>160 caracteres)',
        impact: 'medium',
        fix: 'Reducir la longitud de la descripción'
      });
    } else if (metadata.description.length < 120) {
      issues.push({
        type: 'info',
        category: 'description',
        message: 'La descripción podría ser más descriptiva',
        impact: 'low',
        fix: 'Expandir la descripción con más detalles'
      });
    }

    // Analizar keywords
    if (!metadata.keywords || metadata.keywords.length === 0) {
      issues.push({
        type: 'warning',
        category: 'keywords',
        message: 'No hay palabras clave definidas',
        impact: 'medium',
        fix: 'Agregar palabras clave relevantes'
      });
    } else if (metadata.keywords.length > 10) {
      issues.push({
        type: 'warning',
        category: 'keywords',
        message: 'Demasiadas palabras clave (>10)',
        impact: 'low',
        fix: 'Reducir a las palabras clave más importantes'
      });
    }

    // Calcular score
    const totalIssues = issues.length;
    const criticalIssues = issues.filter(i => i.impact === 'high').length;
    const mediumIssues = issues.filter(i => i.impact === 'medium').length;

    let score = 100;
    score -= criticalIssues * 20;
    score -= mediumIssues * 10;
    score -= (totalIssues - criticalIssues - mediumIssues) * 5;
    score = Math.max(0, score);

    return {
      score,
      issues,
      recommendations,
      metrics: {
        titleLength: metadata.title?.length || 0,
        descriptionLength: metadata.description?.length || 0,
        keywordDensity: metadata.keywords?.length || 0,
        readabilityScore: 0, // TODO: Implementar análisis de legibilidad
        imageOptimization: metadata.ogImage ? 100 : 0
      }
    };
  }

  // ===================================
  // CONFIGURACIÓN Y ESTADÍSTICAS
  // ===================================

  public updateConfig(updates: Partial<DynamicSEOConfig>): void {
    this.config = { ...this.config, ...updates };

    logger.info(LogLevel.INFO, 'SEO configuration updated', {
      changes: Object.keys(updates)
    }, LogCategory.SEO);
  }

  public getConfig(): DynamicSEOConfig {
    return { ...this.config };
  }

  public getStats(): {
    templatesCount: number;
    cacheSize: number;
    activeTemplatesByType: Record<string, number>;
  } {
    const activeTemplatesByType = Array.from(this.templates.values())
      .filter(t => t.isActive)
      .reduce((acc, template) => {
        acc[template.type] = (acc[template.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      templatesCount: this.templates.size,
      cacheSize: this.cache.size,
      activeTemplatesByType
    };
  }

  public destroy(): void {
    this.cache.clear();
    this.templates.clear();
    EnhancedDynamicSEOManager.instance = null as any;
  }
}

// ===================================
// INSTANCIA SINGLETON Y UTILIDADES
// ===================================

export const enhancedDynamicSEOManager = EnhancedDynamicSEOManager.getInstance();

// Configuración base del sitio (mantenida para compatibilidad)
const SITE_CONFIG = {
  name: 'Pinteya E-commerce',
  description: 'Tu pinturería online especializada en productos de pintura, ferretería y corralón',
  url: 'https://pinteya-ecommerce.vercel.app',
  logo: '/images/logo/LOGO POSITIVO.svg',
  defaultImage: '/images/hero/hero-bg.jpg',
  locale: 'es_AR',
  currency: 'ARS',
  themeColor: '#ea5a17',
  twitterHandle: '@pinteya_ecommerce',
};

// Plantillas de SEO optimizadas (mantenidas para compatibilidad)
const SEO_TEMPLATES = {
  product: {
    title: (product: ProductSEOData) =>
      `${product.name} - ${product.brand} | Pinteya E-commerce`,
    description: (product: ProductSEOData) =>
      `Compra ${product.name} de ${product.brand} en Pinteya. ${product.description.slice(0, 100)}... Envío gratis en compras superiores a $50.000. ¡Compra online ahora!`,
    keywords: (product: ProductSEOData) => [
      product.name.toLowerCase(),
      product.brand.toLowerCase(),
      product.category.toLowerCase(),
      ...(product.subcategory ? [product.subcategory.toLowerCase()] : []),
      'pinturería online',
      'envío gratis',
      'argentina',
      'comprar online'
    ]
  },
  category: {
    title: (category: CategorySEOData) =>
      `${category.name} | Pinteya E-commerce - Tu Pinturería Online`,
    description: (category: CategorySEOData) =>
      `Descubre nuestra selección de ${category.name.toLowerCase()} en Pinteya. ${category.description} ${category.productCount} productos disponibles. Envío gratis en compras superiores a $50.000.`,
    keywords: (category: CategorySEOData) => [
      category.name.toLowerCase(),
      'pinturería online',
      'ferretería',
      'corralón',
      'envío gratis',
      'argentina',
      'productos de calidad'
    ]
  },
  page: {
    title: (page: PageSEOData) =>
      `${page.title} | Pinteya E-commerce`,
    description: (page: PageSEOData) =>
      page.description,
    keywords: () => [
      'pinturería online',
      'pinturas',
      'ferretería',
      'corralón',
      'argentina'
    ]
  }
};

class DynamicSEOManager {
  private static instance: DynamicSEOManager;

  static getInstance(): DynamicSEOManager {
    if (!DynamicSEOManager.instance) {
      DynamicSEOManager.instance = new DynamicSEOManager();
    }
    return DynamicSEOManager.instance;
  }

  // Generar metadata para productos
  generateProductMetadata(product: ProductSEOData): Metadata {
    const title = SEO_TEMPLATES.product.title(product);
    const description = SEO_TEMPLATES.product.description(product);
    const keywords = SEO_TEMPLATES.product.keywords(product);
    
    // Validar que product.slug existe antes de generar canonical
    if (!product.slug) {
      console.warn('Product slug is missing, using fallback');
    }
    
    const canonical = product.slug ? `${SITE_CONFIG.url}/products/${product.slug}` : SITE_CONFIG.url;
    const ogImage = product.images?.[0] || SITE_CONFIG.defaultImage;

    return {
      title,
      description,
      keywords,
      alternates: canonical ? {
        canonical,
      } : undefined,
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: SITE_CONFIG.name,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
        locale: SITE_CONFIG.locale,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      other: {
        'product:price:amount': product.price.toString(),
        'product:price:currency': 'ARS',
        'product:availability': product.stock > 0 ? 'InStock' : 'OutOfStock',
        'product:condition': 'NewCondition',
        'product:brand': product.brand,
        'product:category': product.category,
      },
    };
  }

  // Generar metadata para categorías
  generateCategoryMetadata(category: CategorySEOData): Metadata {
    const title = SEO_TEMPLATES.category.title(category);
    const description = SEO_TEMPLATES.category.description(category);
    const keywords = SEO_TEMPLATES.category.keywords(category);
    
    // Validar que category.slug existe antes de generar canonical
    if (!category.slug) {
      console.warn('Category slug is missing, using fallback');
    }
    
    const canonical = category.slug ? `${SITE_CONFIG.url}/categories/${category.slug}` : SITE_CONFIG.url;
    const ogImage = category.image || SITE_CONFIG.defaultImage;

    return {
      title,
      description,
      keywords,
      alternates: canonical ? {
        canonical,
      } : undefined,
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: SITE_CONFIG.name,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${category.name} - ${SITE_CONFIG.name}`,
          },
        ],
        locale: SITE_CONFIG.locale,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      other: {
        'category:name': category.name,
        'category:product_count': category.productCount.toString(),
      },
    };
  }

  // Generar metadata para páginas generales
  generatePageMetadata(page: PageSEOData): Metadata {
    const title = SEO_TEMPLATES.page.title(page);
    const description = SEO_TEMPLATES.page.description(page);
    const keywords = SEO_TEMPLATES.page.keywords();
    
    // Validar que page.path existe antes de generar canonical
    if (!page.path) {
      console.warn('Page path is missing, using fallback');
    }
    
    const canonical = page.path ? `${SITE_CONFIG.url}${page.path}` : SITE_CONFIG.url;

    return {
      title,
      description,
      keywords,
      alternates: canonical ? {
        canonical,
      } : undefined,
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: SITE_CONFIG.name,
        images: [
          {
            url: SITE_CONFIG.defaultImage,
            width: 1200,
            height: 630,
            alt: `${page.title} - ${SITE_CONFIG.name}`,
          },
        ],
        locale: SITE_CONFIG.locale,
        type: page.type === 'article' ? 'article' : 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [SITE_CONFIG.defaultImage],
      },
      robots: {
        index: page.type !== 'checkout' && page.type !== 'profile',
        follow: true,
        googleBot: {
          index: page.type !== 'checkout' && page.type !== 'profile',
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  }

  // Optimizar título para SEO
  optimizeTitle(title: string, maxLength: number = 60): string {
    if (title.length <= maxLength) {return title;}
    
    // Truncar en la última palabra completa
    const truncated = title.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.slice(0, lastSpace) + '...' : truncated + '...';
  }

  // Optimizar descripción para SEO
  optimizeDescription(description: string, maxLength: number = 160): string {
    if (description.length <= maxLength) {return description;}
    
    // Truncar en la última oración completa
    const truncated = description.slice(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    
    const cutPoint = lastPeriod > 0 ? lastPeriod + 1 : lastSpace;
    return cutPoint > 0 ? truncated.slice(0, cutPoint) + '...' : truncated + '...';
  }

  // Generar slug SEO-friendly
  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno
      .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
  }

  // Extraer keywords relevantes del texto
  extractKeywords(text: string, maxKeywords: number = 10): string[] {
    const stopWords = new Set([
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le',
      'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'como',
      'pero', 'sus', 'le', 'ya', 'o', 'porque', 'cuando', 'muy', 'sin', 'sobre', 'también',
      'me', 'hasta', 'donde', 'quien', 'desde', 'todos', 'durante', 'todo', 'esto', 'eso'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Contar frecuencia de palabras
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Ordenar por frecuencia y tomar las más relevantes
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  // Validar configuración SEO
  validateSEOConfig(config: SEOConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.title || config.title.length === 0) {
      errors.push('El título es requerido');
    } else if (config.title.length > 60) {
      errors.push('El título no debe exceder 60 caracteres');
    }

    if (!config.description || config.description.length === 0) {
      errors.push('La descripción es requerida');
    } else if (config.description.length > 160) {
      errors.push('La descripción no debe exceder 160 caracteres');
    }

    if (config.keywords && config.keywords.length === 0) {
      errors.push('Se recomienda incluir al menos 3 keywords');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Exportar instancia singleton
export const dynamicSEOManager = DynamicSEOManager.getInstance();

// Exportar tipos y utilidades
export { DynamicSEOManager, SITE_CONFIG, SEO_TEMPLATES };









