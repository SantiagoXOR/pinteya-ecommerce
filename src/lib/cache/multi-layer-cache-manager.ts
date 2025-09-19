// ===================================
// PINTEYA E-COMMERCE - MULTI-LAYER CACHE MANAGER
// ===================================

import { logger, LogLevel, LogCategory } from '../enterprise/logger';
import { getRedisClient } from '../integrations/redis';
import { advancedCacheStrategyManager } from './advanced-cache-strategy-manager';

/**
 * Capas de cache disponibles
 */
export enum CacheLayer {
  MEMORY = 'memory',           // Cache en memoria (más rápido)
  REDIS = 'redis',            // Cache Redis (persistente)
  CDN = 'cdn',                // Cache CDN (distribuido)
  BROWSER = 'browser',        // Cache del navegador
  EDGE = 'edge'               // Cache en edge locations
}

/**
 * Configuración de capa de cache
 */
export interface CacheLayerConfig {
  enabled: boolean;
  priority: number;           // Prioridad (1 = más alta)
  ttl: number;               // TTL por defecto
  maxSize?: number;          // Tamaño máximo en bytes
  maxEntries?: number;       // Número máximo de entradas
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
  fallbackLayer?: CacheLayer;
  healthCheckInterval?: number;
}

/**
 * Estado de salud de una capa
 */
export interface LayerHealth {
  layer: CacheLayer;
  healthy: boolean;
  latency: number;
  errorRate: number;
  lastCheck: number;
  errors: string[];
}

/**
 * Métricas de capa de cache
 */
export interface LayerMetrics {
  layer: CacheLayer;
  hits: number;
  misses: number;
  hitRate: number;
  avgLatency: number;
  totalRequests: number;
  bytesStored: number;
  entriesCount: number;
  lastUpdated: number;
}

/**
 * Configuraciones predefinidas por capa
 */
export const LAYER_CONFIGS: Record<CacheLayer, CacheLayerConfig> = {
  [CacheLayer.MEMORY]: {
    enabled: true,
    priority: 1,
    ttl: 300,                 // 5 minutos
    maxSize: 50 * 1024 * 1024, // 50MB
    maxEntries: 10000,
    compressionEnabled: false,
    encryptionEnabled: false,
    healthCheckInterval: 30000 // 30 segundos
  },
  
  [CacheLayer.REDIS]: {
    enabled: true,
    priority: 2,
    ttl: 1800,                // 30 minutos
    maxSize: 500 * 1024 * 1024, // 500MB
    compressionEnabled: true,
    encryptionEnabled: false,
    fallbackLayer: CacheLayer.MEMORY,
    healthCheckInterval: 60000 // 1 minuto
  },
  
  [CacheLayer.CDN]: {
    enabled: true,
    priority: 3,
    ttl: 3600,                // 1 hora
    compressionEnabled: true,
    encryptionEnabled: false,
    fallbackLayer: CacheLayer.REDIS,
    healthCheckInterval: 300000 // 5 minutos
  },
  
  [CacheLayer.BROWSER]: {
    enabled: true,
    priority: 4,
    ttl: 86400,               // 24 horas
    compressionEnabled: false,
    encryptionEnabled: false,
    healthCheckInterval: 600000 // 10 minutos
  },
  
  [CacheLayer.EDGE]: {
    enabled: false,           // Deshabilitado por defecto
    priority: 5,
    ttl: 7200,                // 2 horas
    compressionEnabled: true,
    encryptionEnabled: false,
    fallbackLayer: CacheLayer.CDN,
    healthCheckInterval: 300000 // 5 minutos
  }
};

/**
 * Cache en memoria con LRU
 */
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;
  private maxSize: number;
  private maxEntries: number;

  constructor(maxSize: number = 50 * 1024 * 1024, maxEntries: number = 10000) {
    this.maxSize = maxSize;
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {return null;}

    // Verificar TTL
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // Actualizar orden de acceso
    this.accessOrder.set(key, ++this.accessCounter);
    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number): void {
    // Verificar límites
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    this.accessOrder.set(key, ++this.accessCounter);
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    for (const [key, access] of this.accessOrder) {
      if (access < oldestAccess) {
        oldestAccess = access;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  getStats(): { size: number; entries: number } {
    return {
      size: JSON.stringify([...this.cache.values()]).length,
      entries: this.cache.size
    };
  }
}

/**
 * Manager de cache multi-capa
 */
export class MultiLayerCacheManager {
  private static instance: MultiLayerCacheManager;
  private memoryCache: MemoryCache;
  private redis = getRedisClient();
  private layerHealth = new Map<CacheLayer, LayerHealth>();
  private layerMetrics = new Map<CacheLayer, LayerMetrics>();
  private healthCheckIntervals = new Map<CacheLayer, NodeJS.Timeout>();

  private constructor() {
    this.memoryCache = new MemoryCache(
      LAYER_CONFIGS[CacheLayer.MEMORY].maxSize,
      LAYER_CONFIGS[CacheLayer.MEMORY].maxEntries
    );
    this.initializeHealthChecks();
  }

  static getInstance(): MultiLayerCacheManager {
    if (!MultiLayerCacheManager.instance) {
      MultiLayerCacheManager.instance = new MultiLayerCacheManager();
    }
    return MultiLayerCacheManager.instance;
  }

  /**
   * Obtiene datos del cache multi-capa
   */
  async get<T>(key: string, layers?: CacheLayer[]): Promise<T | null> {
    const targetLayers = layers || this.getEnabledLayersByPriority();
    
    for (const layer of targetLayers) {
      if (!this.isLayerHealthy(layer)) {continue;}

      try {
        const startTime = Date.now();
        const result = await this.getFromLayer<T>(key, layer);
        
        if (result !== null) {
          // Registrar hit
          this.recordMetric(layer, 'hit', Date.now() - startTime);
          
          // Propagar a capas de mayor prioridad
          await this.propagateToHigherPriorityLayers(key, result, layer);
          
          return result;
        } else {
          // Registrar miss
          this.recordMetric(layer, 'miss', Date.now() - startTime);
        }
      } catch (error) {
        logger.error(LogCategory.CACHE, `Error en capa ${layer}:`, error as Error);
        this.markLayerUnhealthy(layer, error as Error);
      }
    }

    return null;
  }

  /**
   * Guarda datos en el cache multi-capa
   */
  async set<T>(key: string, data: T, ttl?: number, layers?: CacheLayer[]): Promise<void> {
    const targetLayers = layers || this.getEnabledLayersByPriority();
    
    const setPromises = targetLayers.map(async (layer) => {
      if (!this.isLayerHealthy(layer)) {return;}

      try {
        const layerTtl = ttl || LAYER_CONFIGS[layer].ttl;
        await this.setToLayer(key, data, layerTtl, layer);
        logger.debug(LogCategory.CACHE, `Datos guardados en capa ${layer}: ${key}`);
      } catch (error) {
        logger.error(LogCategory.CACHE, `Error guardando en capa ${layer}:`, error as Error);
        this.markLayerUnhealthy(layer, error as Error);
      }
    });

    await Promise.allSettled(setPromises);
  }

  /**
   * Elimina datos del cache multi-capa
   */
  async delete(key: string, layers?: CacheLayer[]): Promise<void> {
    const targetLayers = layers || this.getEnabledLayersByPriority();
    
    const deletePromises = targetLayers.map(async (layer) => {
      try {
        await this.deleteFromLayer(key, layer);
      } catch (error) {
        logger.error(LogCategory.CACHE, `Error eliminando de capa ${layer}:`, error as Error);
      }
    });

    await Promise.allSettled(deletePromises);
  }

  /**
   * Invalida cache por patrón
   */
  async invalidatePattern(pattern: string, layers?: CacheLayer[]): Promise<void> {
    const targetLayers = layers || this.getEnabledLayersByPriority();
    
    const invalidatePromises = targetLayers.map(async (layer) => {
      try {
        await this.invalidatePatternInLayer(pattern, layer);
      } catch (error) {
        logger.error(LogCategory.CACHE, `Error invalidando patrón en capa ${layer}:`, error as Error);
      }
    });

    await Promise.allSettled(invalidatePromises);
  }

  /**
   * Obtiene datos de una capa específica
   */
  private async getFromLayer<T>(key: string, layer: CacheLayer): Promise<T | null> {
    switch (layer) {
      case CacheLayer.MEMORY:
        return this.memoryCache.get<T>(key);
      
      case CacheLayer.REDIS:
        const redisValue = await this.redis.get(key);
        return redisValue ? JSON.parse(redisValue) : null;
      
      case CacheLayer.CDN:
        // Implementación CDN (placeholder)
        return null;
      
      case CacheLayer.BROWSER:
        // Cache del navegador se maneja en el cliente
        return null;
      
      case CacheLayer.EDGE:
        // Implementación edge cache (placeholder)
        return null;
      
      default:
        return null;
    }
  }

  /**
   * Guarda datos en una capa específica
   */
  private async setToLayer<T>(key: string, data: T, ttl: number, layer: CacheLayer): Promise<void> {
    switch (layer) {
      case CacheLayer.MEMORY:
        this.memoryCache.set(key, data, ttl);
        break;
      
      case CacheLayer.REDIS:
        await this.redis.setex(key, ttl, JSON.stringify(data));
        break;
      
      case CacheLayer.CDN:
        // Implementación CDN (placeholder)
        break;
      
      case CacheLayer.BROWSER:
        // Cache del navegador se maneja en el cliente
        break;
      
      case CacheLayer.EDGE:
        // Implementación edge cache (placeholder)
        break;
    }
  }

  /**
   * Elimina datos de una capa específica
   */
  private async deleteFromLayer(key: string, layer: CacheLayer): Promise<void> {
    switch (layer) {
      case CacheLayer.MEMORY:
        this.memoryCache.delete(key);
        break;
      
      case CacheLayer.REDIS:
        await this.redis.del(key);
        break;
      
      case CacheLayer.CDN:
        // Implementación CDN (placeholder)
        break;
      
      case CacheLayer.BROWSER:
        // Cache del navegador se maneja en el cliente
        break;
      
      case CacheLayer.EDGE:
        // Implementación edge cache (placeholder)
        break;
    }
  }

  /**
   * Invalida patrón en una capa específica
   */
  private async invalidatePatternInLayer(pattern: string, layer: CacheLayer): Promise<void> {
    switch (layer) {
      case CacheLayer.MEMORY:
        // Implementar invalidación por patrón en memoria
        break;
      
      case CacheLayer.REDIS:
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        break;
      
      case CacheLayer.CDN:
        // Implementación CDN (placeholder)
        break;
    }
  }

  /**
   * Propaga datos a capas de mayor prioridad
   */
  private async propagateToHigherPriorityLayers<T>(
    key: string,
    data: T,
    currentLayer: CacheLayer
  ): Promise<void> {
    const currentPriority = LAYER_CONFIGS[currentLayer].priority;
    const higherPriorityLayers = this.getEnabledLayersByPriority()
      .filter(layer => LAYER_CONFIGS[layer].priority < currentPriority);

    for (const layer of higherPriorityLayers) {
      try {
        const ttl = LAYER_CONFIGS[layer].ttl;
        await this.setToLayer(key, data, ttl, layer);
      } catch (error) {
        logger.error(LogCategory.CACHE, `Error propagando a capa ${layer}:`, error as Error);
      }
    }
  }

  /**
   * Obtiene capas habilitadas ordenadas por prioridad
   */
  private getEnabledLayersByPriority(): CacheLayer[] {
    return Object.entries(LAYER_CONFIGS)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => a.priority - b.priority)
      .map(([layer, _]) => layer as CacheLayer);
  }

  /**
   * Verifica si una capa está saludable
   */
  private isLayerHealthy(layer: CacheLayer): boolean {
    const health = this.layerHealth.get(layer);
    return health ? health.healthy : true; // Asumir saludable si no hay datos
  }

  /**
   * Marca una capa como no saludable
   */
  private markLayerUnhealthy(layer: CacheLayer, error: Error): void {
    const health = this.layerHealth.get(layer) || {
      layer,
      healthy: true,
      latency: 0,
      errorRate: 0,
      lastCheck: Date.now(),
      errors: []
    };

    health.healthy = false;
    health.errors.push(error.message);
    health.lastCheck = Date.now();
    
    // Mantener solo los últimos 10 errores
    if (health.errors.length > 10) {
      health.errors = health.errors.slice(-10);
    }

    this.layerHealth.set(layer, health);
  }

  /**
   * Registra métricas de una capa
   */
  private recordMetric(layer: CacheLayer, type: 'hit' | 'miss', latency: number): void {
    const metrics = this.layerMetrics.get(layer) || {
      layer,
      hits: 0,
      misses: 0,
      hitRate: 0,
      avgLatency: 0,
      totalRequests: 0,
      bytesStored: 0,
      entriesCount: 0,
      lastUpdated: Date.now()
    };

    metrics.totalRequests++;
    if (type === 'hit') {
      metrics.hits++;
    } else {
      metrics.misses++;
    }

    metrics.hitRate = (metrics.hits / metrics.totalRequests) * 100;
    metrics.avgLatency = ((metrics.avgLatency * (metrics.totalRequests - 1)) + latency) / metrics.totalRequests;
    metrics.lastUpdated = Date.now();

    this.layerMetrics.set(layer, metrics);
  }

  /**
   * Inicializa health checks para todas las capas
   */
  private initializeHealthChecks(): void {
    Object.entries(LAYER_CONFIGS).forEach(([layer, config]) => {
      if (config.enabled && config.healthCheckInterval) {
        const interval = setInterval(() => {
          this.performHealthCheck(layer as CacheLayer);
        }, config.healthCheckInterval);
        
        this.healthCheckIntervals.set(layer as CacheLayer, interval);
      }
    });
  }

  /**
   * Realiza health check de una capa
   */
  private async performHealthCheck(layer: CacheLayer): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test básico de la capa
      const testKey = `health_check_${layer}_${Date.now()}`;
      const testData = { test: true, timestamp: Date.now() };
      
      await this.setToLayer(testKey, testData, 60, layer);
      const retrieved = await this.getFromLayer(testKey, layer);
      await this.deleteFromLayer(testKey, layer);
      
      const latency = Date.now() - startTime;
      
      // Actualizar estado de salud
      const health: LayerHealth = {
        layer,
        healthy: retrieved !== null,
        latency,
        errorRate: 0, // Calcular basado en métricas históricas
        lastCheck: Date.now(),
        errors: []
      };
      
      this.layerHealth.set(layer, health);
      
    } catch (error) {
      this.markLayerUnhealthy(layer, error as Error);
    }
  }

  /**
   * Obtiene estado de salud de todas las capas
   */
  getLayerHealth(): Record<CacheLayer, LayerHealth> {
    const result: Record<CacheLayer, LayerHealth> = {} as any;
    this.layerHealth.forEach((health, layer) => {
      result[layer] = health;
    });
    return result;
  }

  /**
   * Obtiene métricas de todas las capas
   */
  getLayerMetrics(): Record<CacheLayer, LayerMetrics> {
    const result: Record<CacheLayer, LayerMetrics> = {} as any;
    this.layerMetrics.forEach((metrics, layer) => {
      result[layer] = metrics;
    });
    return result;
  }

  /**
   * Limpia todos los caches
   */
  async clearAll(): Promise<void> {
    const clearPromises = this.getEnabledLayersByPriority().map(async (layer) => {
      try {
        switch (layer) {
          case CacheLayer.MEMORY:
            this.memoryCache.clear();
            break;
          case CacheLayer.REDIS:
            await this.redis.flushdb();
            break;
        }
      } catch (error) {
        logger.error(LogCategory.CACHE, `Error limpiando capa ${layer}:`, error as Error);
      }
    });

    await Promise.allSettled(clearPromises);
  }

  /**
   * Destructor para limpiar recursos
   */
  destroy(): void {
    this.healthCheckIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.healthCheckIntervals.clear();
  }
}

// Instancia singleton
export const multiLayerCacheManager = MultiLayerCacheManager.getInstance();

/**
 * Utilidades para cache multi-capa
 */
export const MultiLayerCacheUtils = {
  /**
   * Cache con fallback automático
   */
  async getWithFallback<T>(
    key: string,
    fetcher: () => Promise<T>,
    layers?: CacheLayer[]
  ): Promise<T> {
    // Intentar obtener del cache
    const cached = await multiLayerCacheManager.get<T>(key, layers);
    if (cached !== null) {return cached;}

    // Si no está en cache, obtener de la fuente
    const data = await fetcher();
    await multiLayerCacheManager.set(key, data, undefined, layers);
    return data;
  },

  /**
   * Cache con TTL específico por capa
   */
  async setWithLayerTTLs<T>(
    key: string,
    data: T,
    layerTTLs: Partial<Record<CacheLayer, number>>
  ): Promise<void> {
    const setPromises = Object.entries(layerTTLs).map(async ([layer, ttl]) => {
      await multiLayerCacheManager.set(key, data, ttl, [layer as CacheLayer]);
    });

    await Promise.allSettled(setPromises);
  },

  /**
   * Obtiene estadísticas generales del cache
   */
  getOverallStats(): {
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    healthyLayers: number;
    totalLayers: number;
  } {
    const metrics = multiLayerCacheManager.getLayerMetrics();
    const health = multiLayerCacheManager.getLayerHealth();
    
    let totalHits = 0;
    let totalMisses = 0;
    let healthyLayers = 0;
    
    Object.values(metrics).forEach(metric => {
      totalHits += metric.hits;
      totalMisses += metric.misses;
    });
    
    Object.values(health).forEach(h => {
      if (h.healthy) {healthyLayers++;}
    });
    
    const totalRequests = totalHits + totalMisses;
    const overallHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    
    return {
      totalHits,
      totalMisses,
      overallHitRate,
      healthyLayers,
      totalLayers: Object.keys(LAYER_CONFIGS).length
    };
  }
};









