// ===================================
// PINTEYA E-COMMERCE - CACHE MANAGER
// ===================================

import { redisCache } from './redis';
import { logger, LogLevel, LogCategory } from './logger';

// Configuración de cache
export interface CacheConfig {
  ttl: number;           // Time to live en segundos
  prefix: string;        // Prefijo para las claves
  compress?: boolean;    // Comprimir datos grandes
  serialize?: boolean;   // Serializar objetos complejos
}

// Configuraciones predefinidas
export const CACHE_CONFIGS = {
  // Para respuestas de MercadoPago (corta duración)
  MERCADOPAGO_RESPONSE: {
    ttl: 300,              // 5 minutos
    prefix: 'mp_response',
    compress: true,
    serialize: true,
  },
  
  // Para información de pagos (duración media)
  PAYMENT_INFO: {
    ttl: 1800,             // 30 minutos
    prefix: 'payment_info',
    compress: false,
    serialize: true,
  },
  
  // Para configuraciones del sistema (larga duración)
  SYSTEM_CONFIG: {
    ttl: 3600,             // 1 hora
    prefix: 'sys_config',
    compress: false,
    serialize: true,
  },
  
  // Para datos de productos (duración media)
  PRODUCT_DATA: {
    ttl: 900,              // 15 minutos
    prefix: 'product',
    compress: true,
    serialize: true,
  },
  
  // Para sesiones de usuario (corta duración)
  USER_SESSION: {
    ttl: 600,              // 10 minutos
    prefix: 'user_session',
    compress: false,
    serialize: true,
  },
} as const;

/**
 * Clase principal para manejo de cache
 */
export class CacheManager {
  private static instance: CacheManager;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Genera clave de cache
   */
  private generateKey(config: CacheConfig, key: string): string {
    return `cache:${config.prefix}:${key}`;
  }

  /**
   * Serializa datos para almacenamiento
   */
  private serialize(data: any, config: CacheConfig): string {
    try {
      let serialized = config.serialize ? JSON.stringify(data) : data.toString();
      
      if (config.compress && serialized.length > 1000) {
        // Implementación básica de compresión (en producción usar zlib)
        serialized = this.simpleCompress(serialized);
      }
      
      return serialized;
    } catch (error) {
      logger.error(LogCategory.API, 'Serialization error', error as Error);
      throw error;
    }
  }

  /**
   * Deserializa datos del cache
   */
  private deserialize(data: string, config: CacheConfig): any {
    try {
      let deserialized = data;
      
      if (config.compress && data.startsWith('COMPRESSED:')) {
        deserialized = this.simpleDecompress(data);
      }
      
      return config.serialize ? JSON.parse(deserialized) : deserialized;
    } catch (error) {
      logger.error(LogCategory.API, 'Deserialization error', error as Error);
      throw error;
    }
  }

  /**
   * Compresión simple (placeholder para implementación real)
   */
  private simpleCompress(data: string): string {
    // En producción, usar zlib o similar
    return `COMPRESSED:${data}`;
  }

  /**
   * Descompresión simple (placeholder para implementación real)
   */
  private simpleDecompress(data: string): string {
    return data.replace('COMPRESSED:', '');
  }

  /**
   * Obtiene un valor del cache
   */
  async get<T>(key: string, config: CacheConfig): Promise<T | null> {
    const startTime = Date.now();
    const cacheKey = this.generateKey(config, key);

    try {
      const cached = await redisCache.get(cacheKey);
      
      if (cached === null) {
        logger.info(LogCategory.API, 'Cache miss');
        return null;
      }

      const result = this.deserialize(cached, config);
      
      logger.info(LogCategory.API, 'Cache hit');

      return result;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache get error', error as Error);
      return null; // Fallar silenciosamente para no afectar la aplicación
    }
  }

  /**
   * Establece un valor en el cache
   */
  async set<T>(key: string, value: T, config: CacheConfig): Promise<boolean> {
    const startTime = Date.now();
    const cacheKey = this.generateKey(config, key);

    try {
      const serialized = this.serialize(value, config);
      const success = await redisCache.set(cacheKey, serialized, config.ttl);
      
      logger.info(LogCategory.API, 'Cache set');

      return success;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache set error', error as Error);
      return false;
    }
  }

  /**
   * Elimina un valor del cache
   */
  async delete(key: string, config: CacheConfig): Promise<boolean> {
    const cacheKey = this.generateKey(config, key);

    try {
      const success = await redisCache.del(cacheKey);
      
      logger.info(LogCategory.API, 'Cache delete');

      return success;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache delete error', error as Error);
      return false;
    }
  }

  /**
   * Obtiene o establece un valor (patrón cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    // Intentar obtener del cache primero
    const cached = await this.get<T>(key, config);
    if (cached !== null) {
      return cached;
    }

    // Si no está en cache, obtener del origen
    const startTime = Date.now();
    try {
      const value = await fetcher();
      
      // Almacenar en cache de forma asíncrona
      this.set(key, value, config).catch(error => {
        logger.warn(LogCategory.API, 'Background cache set failed');
      });

      logger.info(LogCategory.API, 'Cache miss - fetched from source');

      return value;
    } catch (error) {
      logger.error(LogCategory.API, 'Fetcher error in getOrSet', error as Error);
      throw error;
    }
  }

  /**
   * Invalida cache por patrón
   */
  async invalidatePattern(pattern: string, config: CacheConfig): Promise<number> {
    const fullPattern = this.generateKey(config, pattern);
    
    try {
      // En Redis real, usaríamos SCAN + DEL para patrones
      // Por simplicidad, aquí solo registramos la operación
      logger.info(LogCategory.API, 'Cache invalidation requested');

      // TODO: Implementar invalidación real por patrón
      return 0;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache invalidation error', error as Error);
      return 0;
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  async getStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
  }> {
    try {
      // En implementación real, obtendríamos estas métricas de Redis
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalKeys: 0,
      };
    } catch (error) {
      logger.error(LogCategory.API, 'Cache stats error', error as Error);
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalKeys: 0,
      };
    }
  }

  /**
   * Limpia todo el cache de un prefijo
   */
  async clear(config: CacheConfig): Promise<boolean> {
    try {
      logger.info(LogCategory.API, 'Cache clear requested');

      // TODO: Implementar limpieza real por prefijo
      return true;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache clear error', error as Error);
      return false;
    }
  }
}

// Instancia singleton
export const cacheManager = CacheManager.getInstance();

/**
 * Decorador para cachear resultados de funciones
 */
export function cached(config: CacheConfig, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator ? keyGenerator(...args) : `${propertyName}:${JSON.stringify(args)}`;
      
      return cacheManager.getOrSet(
        key,
        () => method.apply(this, args),
        config
      );
    };

    return descriptor;
  };
}

/**
 * Funciones de utilidad para casos comunes
 */
export const CacheUtils = {
  /**
   * Cache para respuestas de MercadoPago
   */
  async cacheMercadoPagoResponse<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(key, fetcher, CACHE_CONFIGS.MERCADOPAGO_RESPONSE);
  },

  /**
   * Cache para información de pagos
   */
  async cachePaymentInfo<T>(paymentId: string, fetcher: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(`payment:${paymentId}`, fetcher, CACHE_CONFIGS.PAYMENT_INFO);
  },

  /**
   * Cache para datos de productos
   */
  async cacheProductData<T>(productId: string, fetcher: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(`product:${productId}`, fetcher, CACHE_CONFIGS.PRODUCT_DATA);
  },

  /**
   * Invalida cache de un pago específico
   */
  async invalidatePayment(paymentId: string): Promise<boolean> {
    return cacheManager.delete(`payment:${paymentId}`, CACHE_CONFIGS.PAYMENT_INFO);
  },

  /**
   * Invalida cache de un producto específico
   */
  async invalidateProduct(productId: string): Promise<boolean> {
    return cacheManager.delete(`product:${productId}`, CACHE_CONFIGS.PRODUCT_DATA);
  },
};
