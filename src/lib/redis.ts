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
      logger.info(LogCategory.SYSTEM, 'Redis connected successfully', {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
        db: REDIS_CONFIG.db,
      });
    });

    redisClient.on('error', (error) => {
      logger.error(LogCategory.SYSTEM, 'Redis connection error', error, {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
      });
    });

    redisClient.on('close', () => {
      logger.warn(LogCategory.SYSTEM, 'Redis connection closed', {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
      });
    });

    redisClient.on('reconnecting', () => {
      logger.info(LogCategory.SYSTEM, 'Redis reconnecting...', {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
      });
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
    logger.error(LogCategory.SYSTEM, 'Redis health check failed', error as Error);
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
    logger.info(LogCategory.SYSTEM, 'Redis connection closed gracefully');
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
      logger.debug(LogCategory.CACHE, 'Cache get operation', {
        key,
        hit: value !== null,
      });
      return value;
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Cache get operation failed', error as Error, { key });
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
      
      logger.debug(LogCategory.CACHE, 'Cache set operation', {
        key,
        ttl: ttlSeconds,
      });
      return true;
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Cache set operation failed', error as Error, { 
        key, 
        ttl: ttlSeconds 
      });
      return false;
    }
  }

  /**
   * Elimina un valor del cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      logger.debug(LogCategory.CACHE, 'Cache delete operation', {
        key,
        deleted: result > 0,
      });
      return result > 0;
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Cache delete operation failed', error as Error, { key });
      return false;
    }
  }

  /**
   * Incrementa un contador atómicamente
   */
  async incr(key: string): Promise<number | null> {
    try {
      const result = await this.client.incr(key);
      logger.debug(LogCategory.CACHE, 'Cache increment operation', {
        key,
        value: result,
      });
      return result;
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Cache increment operation failed', error as Error, { key });
      return null;
    }
  }

  /**
   * Establece TTL para una clave existente
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttlSeconds);
      logger.debug(LogCategory.CACHE, 'Cache expire operation', {
        key,
        ttl: ttlSeconds,
        success: result === 1,
      });
      return result === 1;
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Cache expire operation failed', error as Error, { 
        key, 
        ttl: ttlSeconds 
      });
      return false;
    }
  }

  /**
   * Obtiene TTL restante de una clave
   */
  async ttl(key: string): Promise<number | null> {
    try {
      const result = await this.client.ttl(key);
      logger.debug(LogCategory.CACHE, 'Cache TTL check', {
        key,
        ttl: result,
      });
      return result;
    } catch (error) {
      logger.error(LogCategory.CACHE, 'Cache TTL check failed', error as Error, { key });
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
    logger.error(LogCategory.SYSTEM, 'Rate limit info retrieval failed', error as Error, { key });
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
    logger.error(LogCategory.SYSTEM, 'Rate limit increment failed', error as Error, { 
      key, 
      windowSeconds 
    });
    return null;
  }
}
