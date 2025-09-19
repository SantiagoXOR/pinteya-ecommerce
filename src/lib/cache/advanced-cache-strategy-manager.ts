// ===================================
// PINTEYA E-COMMERCE - ADVANCED CACHE STRATEGY MANAGER
// ===================================

import { logger, LogLevel, LogCategory } from '../enterprise/logger';
import { cacheManager, CACHE_CONFIGS } from '../cache-manager';
import { enterpriseCacheSystem } from '../optimization/enterprise-cache-system';
import { getRedisClient } from '../integrations/redis';

/**
 * Estrategias de cache disponibles
 */
export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',           // Cache primero, fallback a origen
  NETWORK_FIRST = 'network-first',       // Red primero, fallback a cache
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate', // Cache stale + revalidación en background
  NETWORK_ONLY = 'network-only',         // Solo red, sin cache
  CACHE_ONLY = 'cache-only',            // Solo cache, sin red
  FASTEST = 'fastest',                   // El más rápido entre cache y red
  ADAPTIVE = 'adaptive'                  // Adaptativo basado en condiciones
}

/**
 * Configuración de estrategia de cache
 */
export interface CacheStrategyConfig {
  strategy: CacheStrategy;
  ttl: number;
  maxAge?: number;
  staleWhileRevalidate?: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  tags?: string[];
  conditions?: CacheCondition[];
  fallbackStrategy?: CacheStrategy;
  warmupEnabled?: boolean;
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
  analyticsEnabled?: boolean;
}

/**
 * Condiciones para cache adaptativo
 */
export interface CacheCondition {
  type: 'network' | 'device' | 'time' | 'user' | 'location' | 'load';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
  action: 'use' | 'skip' | 'modify';
  modifyTtl?: number;
}

/**
 * Métricas de performance de cache
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  avgResponseTime: number;
  totalRequests: number;
  bytesServed: number;
  lastUpdated: number;
  strategy: CacheStrategy;
}

/**
 * Contexto de ejecución de cache
 */
export interface CacheContext {
  userAgent?: string;
  connectionType?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  location?: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

/**
 * Configuraciones predefinidas de estrategias
 */
export const ADVANCED_CACHE_STRATEGIES: Record<string, CacheStrategyConfig> = {
  // Estrategia para datos críticos del sistema
  CRITICAL_SYSTEM_DATA: {
    strategy: CacheStrategy.CACHE_FIRST,
    ttl: 3600, // 1 hora
    maxAge: 7200, // 2 horas
    priority: 'critical',
    tags: ['system', 'critical'],
    warmupEnabled: true,
    compressionEnabled: true,
    encryptionEnabled: true,
    analyticsEnabled: true,
    fallbackStrategy: CacheStrategy.NETWORK_FIRST
  },

  // Estrategia para datos de productos
  PRODUCT_DATA: {
    strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
    ttl: 900, // 15 minutos
    staleWhileRevalidate: 1800, // 30 minutos
    priority: 'high',
    tags: ['products', 'catalog'],
    warmupEnabled: true,
    compressionEnabled: true,
    analyticsEnabled: true,
    conditions: [
      {
        type: 'load',
        operator: 'gt',
        value: 0.8,
        action: 'modify',
        modifyTtl: 1800 // Extender TTL bajo alta carga
      }
    ]
  },

  // Estrategia para contenido estático
  STATIC_ASSETS: {
    strategy: CacheStrategy.CACHE_FIRST,
    ttl: 86400, // 24 horas
    maxAge: 604800, // 7 días
    priority: 'normal',
    tags: ['static', 'assets'],
    compressionEnabled: true,
    analyticsEnabled: false
  },

  // Estrategia para APIs públicas
  PUBLIC_API: {
    strategy: CacheStrategy.NETWORK_FIRST,
    ttl: 300, // 5 minutos
    priority: 'normal',
    tags: ['api', 'public'],
    analyticsEnabled: true,
    conditions: [
      {
        type: 'network',
        operator: 'eq',
        value: 'slow',
        action: 'use',
        modifyTtl: 600 // Extender TTL en conexiones lentas
      }
    ]
  },

  // Estrategia para datos de usuario
  USER_DATA: {
    strategy: CacheStrategy.ADAPTIVE,
    ttl: 1800, // 30 minutos
    priority: 'high',
    tags: ['user', 'personal'],
    encryptionEnabled: true,
    analyticsEnabled: true,
    conditions: [
      {
        type: 'user',
        operator: 'eq',
        value: 'premium',
        action: 'modify',
        modifyTtl: 3600 // TTL extendido para usuarios premium
      }
    ]
  },

  // Estrategia para búsquedas
  SEARCH_RESULTS: {
    strategy: CacheStrategy.FASTEST,
    ttl: 600, // 10 minutos
    priority: 'normal',
    tags: ['search', 'results'],
    compressionEnabled: true,
    analyticsEnabled: true
  }
};

/**
 * Manager avanzado de estrategias de cache
 */
export class AdvancedCacheStrategyManager {
  private static instance: AdvancedCacheStrategyManager;
  private metrics: Map<string, CacheMetrics> = new Map();
  private strategies: Map<string, CacheStrategyConfig> = new Map();
  private redis = getRedisClient();

  private constructor() {
    // Cargar estrategias predefinidas
    Object.entries(ADVANCED_CACHE_STRATEGIES).forEach(([key, config]) => {
      this.strategies.set(key, config);
    });
  }

  static getInstance(): AdvancedCacheStrategyManager {
    if (!AdvancedCacheStrategyManager.instance) {
      AdvancedCacheStrategyManager.instance = new AdvancedCacheStrategyManager();
    }
    return AdvancedCacheStrategyManager.instance;
  }

  /**
   * Ejecuta una estrategia de cache
   */
  async execute<T>(
    key: string,
    fetcher: () => Promise<T>,
    strategyName: string,
    context?: CacheContext
  ): Promise<T> {
    const startTime = Date.now();
    const strategy = this.strategies.get(strategyName);
    
    if (!strategy) {
      logger.warn(LogCategory.CACHE, `Estrategia de cache no encontrada: ${strategyName}`);
      return fetcher();
    }

    try {
      // Evaluar condiciones si existen
      const effectiveStrategy = await this.evaluateConditions(strategy, context);
      
      // Ejecutar estrategia
      const result = await this.executeStrategy(key, fetcher, effectiveStrategy, context);
      
      // Registrar métricas
      await this.recordMetrics(strategyName, startTime, true);
      
      return result;
    } catch (error) {
      // Registrar métricas de error
      await this.recordMetrics(strategyName, startTime, false);
      
      // Intentar estrategia de fallback
      if (strategy.fallbackStrategy) {
        logger.info(LogCategory.CACHE, `Usando estrategia de fallback: ${strategy.fallbackStrategy}`);
        const fallbackConfig = { ...strategy, strategy: strategy.fallbackStrategy };
        return this.executeStrategy(key, fetcher, fallbackConfig, context);
      }
      
      throw error;
    }
  }

  /**
   * Ejecuta la estrategia específica
   */
  private async executeStrategy<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheStrategyConfig,
    context?: CacheContext
  ): Promise<T> {
    switch (config.strategy) {
      case CacheStrategy.CACHE_FIRST:
        return this.cacheFirst(key, fetcher, config);
      
      case CacheStrategy.NETWORK_FIRST:
        return this.networkFirst(key, fetcher, config);
      
      case CacheStrategy.STALE_WHILE_REVALIDATE:
        return this.staleWhileRevalidate(key, fetcher, config);
      
      case CacheStrategy.FASTEST:
        return this.fastest(key, fetcher, config);
      
      case CacheStrategy.ADAPTIVE:
        return this.adaptive(key, fetcher, config, context);
      
      case CacheStrategy.CACHE_ONLY:
        return this.cacheOnly(key, config);
      
      case CacheStrategy.NETWORK_ONLY:
        return fetcher();
      
      default:
        return this.cacheFirst(key, fetcher, config);
    }
  }

  /**
   * Estrategia Cache First
   */
  private async cacheFirst<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheStrategyConfig
  ): Promise<T> {
    // Intentar obtener del cache
    const cached = await this.getFromCache<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Si no está en cache, obtener de la fuente
    const data = await fetcher();
    await this.setToCache(key, data, config);
    return data;
  }

  /**
   * Estrategia Network First
   */
  private async networkFirst<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheStrategyConfig
  ): Promise<T> {
    try {
      // Intentar obtener de la red
      const data = await fetcher();
      await this.setToCache(key, data, config);
      return data;
    } catch (error) {
      // Si falla la red, intentar cache
      const cached = await this.getFromCache<T>(key);
      if (cached !== null) {
        logger.info(LogCategory.CACHE, `Usando cache como fallback para: ${key}`);
        return cached;
      }
      throw error;
    }
  }

  /**
   * Estrategia Stale While Revalidate
   */
  private async staleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheStrategyConfig
  ): Promise<T> {
    const cached = await this.getFromCache<T>(key);
    
    if (cached !== null) {
      // Revalidar en background
      this.revalidateInBackground(key, fetcher, config);
      return cached;
    }

    // Si no hay cache, obtener de la fuente
    const data = await fetcher();
    await this.setToCache(key, data, config);
    return data;
  }

  /**
   * Estrategia Fastest (race entre cache y red)
   */
  private async fastest<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheStrategyConfig
  ): Promise<T> {
    const cachePromise = this.getFromCache<T>(key);
    const networkPromise = fetcher();

    try {
      // Race entre cache y red
      const result = await Promise.race([
        cachePromise.then(cached => ({ source: 'cache', data: cached })),
        networkPromise.then(data => ({ source: 'network', data }))
      ]);

      if (result.source === 'network') {
        // Si ganó la red, actualizar cache
        await this.setToCache(key, result.data, config);
      }

      return result.data;
    } catch (error) {
      // Si falla el race, intentar el que no falló
      try {
        const cached = await cachePromise;
        if (cached !== null) {return cached;}
      } catch {}

      try {
        const data = await networkPromise;
        await this.setToCache(key, data, config);
        return data;
      } catch {}

      throw error;
    }
  }

  /**
   * Estrategia Adaptativa
   */
  private async adaptive<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheStrategyConfig,
    context?: CacheContext
  ): Promise<T> {
    // Determinar la mejor estrategia basada en el contexto
    let adaptedStrategy = CacheStrategy.CACHE_FIRST;

    if (context) {
      if (context.connectionType === 'slow' || context.deviceType === 'mobile') {
        adaptedStrategy = CacheStrategy.CACHE_FIRST;
      } else if (context.priority === 'critical') {
        adaptedStrategy = CacheStrategy.FASTEST;
      } else {
        adaptedStrategy = CacheStrategy.STALE_WHILE_REVALIDATE;
      }
    }

    const adaptedConfig = { ...config, strategy: adaptedStrategy };
    return this.executeStrategy(key, fetcher, adaptedConfig, context);
  }

  /**
   * Estrategia Cache Only
   */
  private async cacheOnly<T>(key: string, config: CacheStrategyConfig): Promise<T> {
    const cached = await this.getFromCache<T>(key);
    if (cached === null) {
      throw new Error(`Cache miss para key: ${key} (cache-only strategy)`);
    }
    return cached;
  }

  /**
   * Obtiene datos del cache
   */
  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      // Intentar cache enterprise primero
      const enterpriseResult = await enterpriseCacheSystem.get<T>(key);
      if (enterpriseResult !== null) {return enterpriseResult;}

      // Fallback a cache manager básico
      return await cacheManager.get<T>(key);
    } catch (error) {
      logger.error(LogCategory.CACHE, `Error obteniendo del cache: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * Guarda datos en el cache
   */
  private async setToCache<T>(key: string, data: T, config: CacheStrategyConfig): Promise<void> {
    try {
      // Usar cache enterprise si está disponible
      await enterpriseCacheSystem.set(key, data, {
        ttl: config.ttl,
        compress: config.compressionEnabled,
        serialize: true,
        enableMetrics: config.analyticsEnabled
      });
    } catch (error) {
      logger.error(LogCategory.CACHE, `Error guardando en cache: ${key}`, error as Error);
    }
  }

  /**
   * Revalidación en background
   */
  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheStrategyConfig
  ): Promise<void> {
    try {
      const data = await fetcher();
      await this.setToCache(key, data, config);
      logger.info(LogCategory.CACHE, `Revalidación completada para: ${key}`);
    } catch (error) {
      logger.error(LogCategory.CACHE, `Error en revalidación: ${key}`, error as Error);
    }
  }

  /**
   * Evalúa condiciones para estrategia adaptativa
   */
  private async evaluateConditions(
    config: CacheStrategyConfig,
    context?: CacheContext
  ): Promise<CacheStrategyConfig> {
    if (!config.conditions || !context) {return config;}

    const modifiedConfig = { ...config };

    for (const condition of config.conditions) {
      if (this.evaluateCondition(condition, context)) {
        if (condition.action === 'modify' && condition.modifyTtl) {
          modifiedConfig.ttl = condition.modifyTtl;
        }
      }
    }

    return modifiedConfig;
  }

  /**
   * Evalúa una condición específica
   */
  private evaluateCondition(condition: CacheCondition, context: CacheContext): boolean {
    let contextValue: any;

    switch (condition.type) {
      case 'device':
        contextValue = context.deviceType;
        break;
      case 'network':
        contextValue = context.connectionType;
        break;
      case 'user':
        contextValue = context.userId;
        break;
      case 'location':
        contextValue = context.location;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'eq':
        return contextValue === condition.value;
      case 'gt':
        return contextValue > condition.value;
      case 'lt':
        return contextValue < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'contains':
        return typeof contextValue === 'string' && contextValue.includes(condition.value);
      default:
        return false;
    }
  }

  /**
   * Registra métricas de performance
   */
  private async recordMetrics(strategyName: string, startTime: number, success: boolean): Promise<void> {
    const responseTime = Date.now() - startTime;
    const existing = this.metrics.get(strategyName) || {
      hits: 0,
      misses: 0,
      hitRate: 0,
      avgResponseTime: 0,
      totalRequests: 0,
      bytesServed: 0,
      lastUpdated: Date.now(),
      strategy: this.strategies.get(strategyName)?.strategy || CacheStrategy.CACHE_FIRST
    };

    existing.totalRequests++;
    if (success) {
      existing.hits++;
    } else {
      existing.misses++;
    }
    
    existing.hitRate = (existing.hits / existing.totalRequests) * 100;
    existing.avgResponseTime = ((existing.avgResponseTime * (existing.totalRequests - 1)) + responseTime) / existing.totalRequests;
    existing.lastUpdated = Date.now();

    this.metrics.set(strategyName, existing);
  }

  /**
   * Obtiene métricas de una estrategia
   */
  getMetrics(strategyName: string): CacheMetrics | null {
    return this.metrics.get(strategyName) || null;
  }

  /**
   * Obtiene todas las métricas
   */
  getAllMetrics(): Record<string, CacheMetrics> {
    const result: Record<string, CacheMetrics> = {};
    this.metrics.forEach((metrics, strategy) => {
      result[strategy] = metrics;
    });
    return result;
  }

  /**
   * Registra una nueva estrategia
   */
  registerStrategy(name: string, config: CacheStrategyConfig): void {
    this.strategies.set(name, config);
    logger.info(LogCategory.CACHE, `Estrategia registrada: ${name}`);
  }

  /**
   * Invalida cache por tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      await enterpriseCacheSystem.invalidateByTags(tags);
      logger.info(LogCategory.CACHE, `Cache invalidado por tags: ${tags.join(', ')}`);
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Error invalidando cache por tags', error as Error);
    }
  }

  /**
   * Precalienta cache para keys específicos
   */
  async warmupCache(keys: string[], fetchers: (() => Promise<any>)[], strategyName: string): Promise<void> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy || !strategy.warmupEnabled) {return;}

    const warmupPromises = keys.map(async (key, index) => {
      try {
        const fetcher = fetchers[index];
        if (fetcher) {
          await this.execute(key, fetcher, strategyName);
          logger.info(LogCategory.CACHE, `Cache precalentado para: ${key}`);
        }
      } catch (error) {
        logger.error(LogCategory.CACHE, `Error precalentando cache: ${key}`, error as Error);
      }
    });

    await Promise.allSettled(warmupPromises);
  }
}

// Instancia singleton
export const advancedCacheStrategyManager = AdvancedCacheStrategyManager.getInstance();

/**
 * Decorador para aplicar estrategias de cache automáticamente
 */
export function withCacheStrategy(strategyName: string, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator ? keyGenerator(...args) : `${propertyName}:${JSON.stringify(args)}`;
      
      return advancedCacheStrategyManager.execute(
        key,
        () => method.apply(this, args),
        strategyName
      );
    };

    return descriptor;
  };
}

/**
 * Utilidades para estrategias de cache
 */
export const CacheStrategyUtils = {
  /**
   * Crea contexto de cache basado en request
   */
  createContext(request?: any): CacheContext {
    return {
      userAgent: request?.headers?.['user-agent'],
      connectionType: this.detectConnectionType(request),
      deviceType: this.detectDeviceType(request?.headers?.['user-agent']),
      timestamp: Date.now(),
      priority: 'normal'
    };
  },

  /**
   * Detecta tipo de conexión
   */
  detectConnectionType(request?: any): string {
    // Lógica para detectar tipo de conexión
    return 'fast'; // Placeholder
  },

  /**
   * Detecta tipo de dispositivo
   */
  detectDeviceType(userAgent?: string): 'mobile' | 'tablet' | 'desktop' {
    if (!userAgent) {return 'desktop';}
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    
    return 'desktop';
  }
};









