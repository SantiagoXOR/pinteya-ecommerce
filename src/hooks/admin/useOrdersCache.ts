// ===================================
// PINTEYA E-COMMERCE - ORDERS CACHE HOOK
// Hook especializado para manejo de cache de órdenes
// ===================================

import { useCallback, useRef } from 'react';
import { StrictOrdersListResponse } from '@/types/api-strict';
import { StrictOrderFilters } from './useOrdersEnterpriseStrict';

// ===================================
// TIPOS Y CONFIGURACIÓN
// ===================================

interface CacheEntry {
  data: StrictOrdersListResponse;
  timestamp: number;
  filters: StrictOrderFilters;
  requestId: string;
}

interface CacheOptions {
  enableCache: boolean;
  cacheTimeout: number;
  maxSize?: number;
  cleanupInterval?: number;
  minRequestInterval?: number;
}

// Configuración de cache
const CACHE_CONFIG = {
  MAX_SIZE: 50,
  CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutos
  MIN_REQUEST_INTERVAL: 1000, // 1 segundo mínimo entre peticiones idénticas
} as const;

// ===================================
// CACHE GLOBAL
// ===================================

// Cache compartido entre instancias del hook
const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<any>>();
const requestTimestamps = new Map<string, number>();

// ===================================
// UTILIDADES DE CACHE
// ===================================

function getCacheKey(filters: StrictOrderFilters): string {
  // Crear clave más estable ordenando las propiedades y normalizando valores
  const normalizedFilters = Object.keys(filters)
    .sort()
    .reduce((result, key) => {
      const value = filters[key as keyof StrictOrderFilters];
      // Normalizar valores para evitar claves duplicadas
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        result[key] = value;
      }
      return result;
    }, {} as any);
  return JSON.stringify(normalizedFilters);
}

function cleanupExpiredCache(cacheTimeout: number): void {
  const now = Date.now();
  const expiredKeys: string[] = [];
  
  cache.forEach((entry, key) => {
    if (now - entry.timestamp > cacheTimeout) {
      expiredKeys.push(key);
    }
  });
  
  expiredKeys.forEach(key => {
    cache.delete(key);
    requestTimestamps.delete(key);
  });
  
  // Limpiar cache si está muy grande
  if (cache.size > CACHE_CONFIG.MAX_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = entries.slice(0, cache.size - CACHE_CONFIG.MAX_SIZE);
    toDelete.forEach(([key]) => {
      cache.delete(key);
      requestTimestamps.delete(key);
    });
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[useOrdersCache] Cache cleanup completed:', {
      expired: expiredKeys.length,
      currentSize: cache.size,
      maxSize: CACHE_CONFIG.MAX_SIZE
    });
  }
}

// ===================================
// HOOK DE CACHE
// ===================================

export interface UseOrdersCacheReturn {
  getCachedData: (filters: StrictOrderFilters) => StrictOrdersListResponse | null;
  setCachedData: (filters: StrictOrderFilters, data: StrictOrdersListResponse) => void;
  clearCache: () => void;
  isRequestTooRecent: (filters: StrictOrderFilters) => boolean;
  setPendingRequest: (filters: StrictOrderFilters, promise: Promise<any>) => void;
  getPendingRequest: (filters: StrictOrderFilters) => Promise<any> | null;
  getCacheStats: () => { size: number; maxSize: number; pendingRequests: number };
}

export function useOrdersCache(options: CacheOptions): UseOrdersCacheReturn {
  const lastCleanupRef = useRef<number>(Date.now());
  
  const getCachedData = useCallback((filters: StrictOrderFilters): StrictOrdersListResponse | null => {
    if (!options.enableCache) {return null;}
    
    const key = getCacheKey(filters);
    const entry = cache.get(key);
    
    if (!entry) {return null;}
    
    const isExpired = Date.now() - entry.timestamp > options.cacheTimeout;
    if (isExpired) {
      cache.delete(key);
      requestTimestamps.delete(key);
      return null;
    }
    
    // Log de cache hit en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('[useOrdersCache] Cache hit:', { 
        key: key.substring(0, 100) + '...', 
        age: Date.now() - entry.timestamp,
        cacheSize: cache.size 
      });
    }
    
    return entry.data;
  }, [options.enableCache, options.cacheTimeout]);
  
  const setCachedData = useCallback((filters: StrictOrderFilters, data: StrictOrdersListResponse): void => {
    if (!options.enableCache) {return;}
    
    const key = getCacheKey(filters);
    const requestId = Math.random().toString(36).substr(2, 9);
    
    cache.set(key, {
      data,
      timestamp: Date.now(),
      filters,
      requestId
    });
    
    requestTimestamps.set(key, Date.now());
    
    // Cleanup automático periódico
    const now = Date.now();
    if (now - lastCleanupRef.current > (options.cleanupInterval || CACHE_CONFIG.CLEANUP_INTERVAL)) {
      cleanupExpiredCache(options.cacheTimeout);
      lastCleanupRef.current = now;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[useOrdersCache] Data cached:', {
        key: key.substring(0, 100) + '...',
        cacheSize: cache.size,
        requestId
      });
    }
  }, [options.enableCache, options.cacheTimeout, options.cleanupInterval]);
  
  const clearCache = useCallback((): void => {
    cache.clear();
    pendingRequests.clear();
    requestTimestamps.clear();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[useOrdersCache] Cache cleared');
    }
  }, []);
  
  const isRequestTooRecent = useCallback((filters: StrictOrderFilters): boolean => {
    const key = getCacheKey(filters);
    const lastRequestTime = requestTimestamps.get(key);
    
    if (!lastRequestTime) {return false;}
    
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    return timeSinceLastRequest < (options.minRequestInterval || CACHE_CONFIG.MIN_REQUEST_INTERVAL);
  }, [options.minRequestInterval]);
  
  const setPendingRequest = useCallback((filters: StrictOrderFilters, promise: Promise<any>): void => {
    const key = getCacheKey(filters);
    pendingRequests.set(key, promise);
    
    // Limpiar cuando la promesa se resuelve
    promise.finally(() => {
      pendingRequests.delete(key);
    });
  }, []);
  
  const getPendingRequest = useCallback((filters: StrictOrderFilters): Promise<any> | null => {
    const key = getCacheKey(filters);
    return pendingRequests.get(key) || null;
  }, []);
  
  const getCacheStats = useCallback(() => ({
    size: cache.size,
    maxSize: options.maxSize || CACHE_CONFIG.MAX_SIZE,
    pendingRequests: pendingRequests.size
  }), [options.maxSize]);
  
  return {
    getCachedData,
    setCachedData,
    clearCache,
    isRequestTooRecent,
    setPendingRequest,
    getPendingRequest,
    getCacheStats
  };
}









