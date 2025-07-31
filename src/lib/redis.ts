// ===================================
// PINTEYA E-COMMERCE - REDIS CONFIGURATION
// ===================================

import Redis from 'ioredis';
import { logger, LogLevel, LogCategory } from './logger';

// Configuración de Redis
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Cliente Redis singleton
let redisClient: Redis | null = null;

/**
 * Obtiene o crea la instancia de Redis
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_CONFIG);

    // Event listeners para logging
    redisClient.on('connect', () => {
      logger.info(LogCategory.API, 'Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error(LogCategory.API, 'Redis connection error', error);
    });

    redisClient.on('close', () => {
      logger.warn(LogCategory.API, 'Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info(LogCategory.API, 'Redis reconnecting...');
    });
  }

  return redisClient;
}

/**
 * Verifica si Redis está disponible
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    logger.error(LogCategory.API, 'Redis health check failed', error as Error);
    return false;
  }
}

/**
 * Cierra la conexión de Redis
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info(LogCategory.API, 'Redis connection closed gracefully');
  }
}

/**
 * Operaciones de cache con manejo de errores
 */
export class RedisCache {
  private client: Redis;

  constructor() {
    this.client = getRedisClient();
  }

  /**
   * Obtiene un valor del cache
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      logger.info(LogCategory.API, 'Cache get operation');
      return value;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache get operation failed', error as Error);
      return null;
    }
  }

  /**
   * Establece un valor en el cache
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      
      logger.info(LogCategory.API, 'Cache set operation');
      return true;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache set operation failed', error as Error);
      return false;
    }
  }

  /**
   * Elimina un valor del cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      logger.info(LogCategory.API, 'Cache delete operation');
      return result > 0;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache delete operation failed', error as Error);
      return false;
    }
  }

  /**
   * Incrementa un contador atómicamente
   */
  async incr(key: string): Promise<number | null> {
    try {
      const result = await this.client.incr(key);
      logger.info(LogCategory.API, 'Cache increment operation');
      return result;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache increment operation failed', error as Error);
      return null;
    }
  }

  /**
   * Establece TTL para una clave existente
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttlSeconds);
      logger.info(LogCategory.API, 'Cache expire operation');
      return result === 1;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache expire operation failed', error as Error);
      return false;
    }
  }

  /**
   * Obtiene TTL restante de una clave
   */
  async ttl(key: string): Promise<number | null> {
    try {
      const result = await this.client.ttl(key);
      logger.info(LogCategory.API, 'Cache TTL check');
      return result;
    } catch (error) {
      logger.error(LogCategory.API, 'Cache TTL check failed', error as Error);
      return null;
    }
  }
}

// Instancia singleton del cache
export const redisCache = new RedisCache();

// Funciones de utilidad para rate limiting
export async function getRateLimitInfo(key: string): Promise<{
  count: number;
  ttl: number;
} | null> {
  try {
    const client = getRedisClient();
    const pipeline = client.pipeline();
    pipeline.get(key);
    pipeline.ttl(key);
    
    const results = await pipeline.exec();
    
    if (!results || results.length !== 2) {
      return null;
    }

    const [countResult, ttlResult] = results;
    const count = parseInt(countResult[1] as string) || 0;
    const ttl = ttlResult[1] as number;

    return { count, ttl };
  } catch (error) {
    logger.error(LogCategory.API, 'Rate limit info retrieval failed', error as Error);
    return null;
  }
}

export async function incrementRateLimit(key: string, windowSeconds: number): Promise<{
  count: number;
  ttl: number;
  isNewWindow: boolean;
} | null> {
  try {
    const client = getRedisClient();
    const pipeline = client.pipeline();

    // Incrementar contador
    pipeline.incr(key);
    // Establecer TTL solo si es la primera vez
    pipeline.expire(key, windowSeconds);
    // Obtener TTL actual
    pipeline.ttl(key);

    const results = await pipeline.exec();

    if (!results || results.length !== 3) {
      return null;
    }

    const count = results[0][1] as number;
    const ttl = results[2][1] as number;
    const isNewWindow = count === 1;

    return { count, ttl, isNewWindow };
  } catch (error) {
    logger.error(LogCategory.API, 'Rate limit increment failed', error as Error);
    return null;
  }
}

// =====================================================
// FUNCIONES ENTERPRISE PARA RATE LIMITING
// =====================================================

/**
 * Rate limiting enterprise con sliding window
 */
export async function enterpriseRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{
  allowed: boolean;
  count: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} | null> {
  try {
    const client = getRedisClient();
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const redisKey = `rate_limit:${key}:${window}`;

    // Usar pipeline para operaciones atómicas
    const pipeline = client.pipeline();
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();

    if (!results || results.length !== 2) {
      return null;
    }

    const count = results[0][1] as number;
    const remaining = Math.max(0, maxRequests - count);
    const resetTime = (window + 1) * windowMs;
    const allowed = count <= maxRequests;

    const result = {
      allowed,
      count,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000)
    };

    logger.debug(LogCategory.API, 'Enterprise rate limit check', {
      key: redisKey,
      count,
      maxRequests,
      allowed,
      remaining
    });

    return result;
  } catch (error) {
    logger.error(LogCategory.API, 'Enterprise rate limit failed', error as Error);
    return null;
  }
}

/**
 * Rate limiting con múltiples ventanas (más preciso)
 */
export async function slidingWindowRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
  precision: number = 10
): Promise<{
  allowed: boolean;
  count: number;
  remaining: number;
  resetTime: number;
} | null> {
  try {
    const client = getRedisClient();
    const now = Date.now();
    const windowSize = Math.floor(windowMs / precision);
    const currentWindow = Math.floor(now / windowSize);

    // Limpiar ventanas antiguas y contar requests en ventana actual
    const pipeline = client.pipeline();

    // Eliminar ventanas más antiguas que el período de rate limiting
    for (let i = 1; i <= precision; i++) {
      const oldWindow = currentWindow - precision - i;
      pipeline.del(`${key}:${oldWindow}`);
    }

    // Incrementar contador para ventana actual
    const currentKey = `${key}:${currentWindow}`;
    pipeline.incr(currentKey);
    pipeline.expire(currentKey, Math.ceil(windowMs / 1000));

    // Obtener contadores de todas las ventanas en el período
    for (let i = 0; i < precision; i++) {
      const windowKey = `${key}:${currentWindow - i}`;
      pipeline.get(windowKey);
    }

    const results = await pipeline.exec();

    if (!results) {
      return null;
    }

    // Calcular total de requests en la ventana deslizante
    let totalCount = 0;
    const countResults = results.slice(precision + 2); // Saltar operaciones de limpieza e incremento

    for (const result of countResults) {
      if (result[1]) {
        totalCount += parseInt(result[1] as string);
      }
    }

    const remaining = Math.max(0, maxRequests - totalCount);
    const allowed = totalCount <= maxRequests;
    const resetTime = (currentWindow + 1) * windowSize;

    return {
      allowed,
      count: totalCount,
      remaining,
      resetTime
    };
  } catch (error) {
    logger.error(LogCategory.API, 'Sliding window rate limit failed', error as Error);
    return null;
  }
}

/**
 * Obtener estadísticas de rate limiting
 */
export async function getRateLimitStats(pattern: string = 'rate_limit:*'): Promise<{
  totalKeys: number;
  activeWindows: number;
  topKeys: Array<{ key: string; count: number; ttl: number }>;
} | null> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      return {
        totalKeys: 0,
        activeWindows: 0,
        topKeys: []
      };
    }

    // Obtener información de las claves más activas
    const pipeline = client.pipeline();
    keys.forEach(key => {
      pipeline.get(key);
      pipeline.ttl(key);
    });

    const results = await pipeline.exec();

    if (!results) {
      return null;
    }

    const keyStats: Array<{ key: string; count: number; ttl: number }> = [];

    for (let i = 0; i < keys.length; i++) {
      const countResult = results[i * 2];
      const ttlResult = results[i * 2 + 1];

      if (countResult[1] && ttlResult[1]) {
        keyStats.push({
          key: keys[i],
          count: parseInt(countResult[1] as string),
          ttl: ttlResult[1] as number
        });
      }
    }

    // Ordenar por count descendente
    keyStats.sort((a, b) => b.count - a.count);

    return {
      totalKeys: keys.length,
      activeWindows: keyStats.filter(stat => stat.ttl > 0).length,
      topKeys: keyStats.slice(0, 10) // Top 10
    };
  } catch (error) {
    logger.error(LogCategory.API, 'Rate limit stats failed', error as Error);
    return null;
  }
}

/**
 * Limpiar claves de rate limiting expiradas
 */
export async function cleanupRateLimitKeys(pattern: string = 'rate_limit:*'): Promise<number> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    // Verificar TTL de cada clave y eliminar las expiradas
    const pipeline = client.pipeline();
    keys.forEach(key => {
      pipeline.ttl(key);
    });

    const ttlResults = await pipeline.exec();

    if (!ttlResults) {
      return 0;
    }

    const expiredKeys: string[] = [];

    for (let i = 0; i < keys.length; i++) {
      const ttlResult = ttlResults[i];
      if (ttlResult[1] === -2) { // Clave expirada
        expiredKeys.push(keys[i]);
      }
    }

    if (expiredKeys.length > 0) {
      await client.del(...expiredKeys);
      logger.info(LogCategory.API, `Cleaned up ${expiredKeys.length} expired rate limit keys`);
    }

    return expiredKeys.length;
  } catch (error) {
    logger.error(LogCategory.API, 'Rate limit cleanup failed', error as Error);
    return 0;
  }
}

// Exportar cliente Redis para uso directo
export const redis = getRedisClient();
