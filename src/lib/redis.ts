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
