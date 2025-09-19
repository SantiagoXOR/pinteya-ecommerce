// ===================================
// PINTEYA E-COMMERCE - ORDERS API HOOK
// Hook especializado para llamadas a la API de órdenes
// ===================================

import { useCallback, useRef } from 'react';
import {
  StrictOrdersListResponse,
  ApiResult,
  toStrictOrdersResponse,
  createStrictApiError,
  isStrictApiResponse
} from '@/types/api-strict';
import { StrictOrderFilters } from './useOrdersEnterpriseStrict';
import { UseOrdersCacheReturn } from './useOrdersCache';

// ===================================
// TIPOS Y CONFIGURACIÓN
// ===================================

interface ApiOptions {
  timeout: number;
  maxRetries: number;
  enableCache: boolean;
}

interface UseOrdersApiOptions extends ApiOptions {
  cache: UseOrdersCacheReturn;
}

export interface UseOrdersApiReturn {
  fetchOrdersInternal: (filters: StrictOrderFilters, isRetry?: boolean) => Promise<ApiResult<StrictOrdersListResponse['data']>>;
  abortCurrentRequest: () => void;
  isRequestInProgress: () => boolean;
}

// ===================================
// UTILIDADES DE API
// ===================================

function buildApiUrl(filters: StrictOrderFilters): string {
  const searchParams = new URLSearchParams();
  
  // Agregar parámetros de filtros
  Object.entries(filters).forEach(([key, value]) => {
    // Siempre incluir parámetros requeridos por la API
    if (key === 'page' || key === 'limit' || key === 'sort_by' || key === 'sort_order') {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    // Para otros parámetros, aplicar filtros normales
    else if (value !== undefined && value !== null && value !== 'all' && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  // Asegurar que siempre tengamos los parámetros mínimos requeridos
  if (!searchParams.has('page')) {
    searchParams.append('page', '1');
  }
  if (!searchParams.has('limit')) {
    searchParams.append('limit', '20');
  }
  if (!searchParams.has('sort_by')) {
    searchParams.append('sort_by', 'created_at');
  }
  if (!searchParams.has('sort_order')) {
    searchParams.append('sort_order', 'desc');
  }
  
  return `/api/admin/orders?${searchParams.toString()}`;
}

async function makeApiRequest(
  url: string, 
  signal: AbortSignal, 
  timeout: number
): Promise<Response> {
  // Crear timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
  });
  
  // Hacer la petición con timeout
  const fetchPromise = fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'include', // ✅ AGREGADO: Incluir cookies de sesión NextAuth.js
    signal
  });
  
  return Promise.race([fetchPromise, timeoutPromise]);
}

// ===================================
// HOOK DE API
// ===================================

export function useOrdersApi(options: UseOrdersApiOptions): UseOrdersApiReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchOrdersInternal = useCallback(async (
    filters: StrictOrderFilters,
    isRetry: boolean = false
  ): Promise<ApiResult<StrictOrdersListResponse['data']>> => {
    try {
      // Validar si la petición es demasiado reciente (anti-spam)
      if (!isRetry && options.cache.isRequestTooRecent(filters)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useOrdersApi] Request blocked - too recent');
        }
        return createStrictApiError('Request too recent', 'REQUEST_THROTTLED');
      }
      
      // Verificar cache primero
      if (options.enableCache) {
        const cachedData = options.cache.getCachedData(filters);
        if (cachedData) {
          return { 
            success: true, 
            data: cachedData.data, 
            message: cachedData.message, 
            timestamp: cachedData.timestamp 
          };
        }
      }
      
      // Verificar si ya hay una petición pendiente
      const pendingRequest = options.cache.getPendingRequest(filters);
      if (pendingRequest) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useOrdersApi] Using pending request');
        }
        return await pendingRequest;
      }
      
      // Gestión del AbortController - Solo abortar si es una petición diferente
      // Crear un identificador único para esta petición
      const requestId = JSON.stringify(filters);
      
      // Solo abortar si hay una petición anterior Y es diferente
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        // Solo abortar si los filtros son diferentes (nueva petición)
        const currentRequestId = (abortControllerRef.current as any)._requestId;
        if (currentRequestId && currentRequestId !== requestId) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useOrdersApi] Aborting previous different request');
          }
          abortControllerRef.current.abort();
        } else if (!currentRequestId) {
          // Abortar si no tiene ID (petición antigua)
          abortControllerRef.current.abort();
        }
      }
      
      const controller = new AbortController();
      (controller as any)._requestId = requestId;
      abortControllerRef.current = controller;
      
      // Crear la promesa de la petición
      const requestPromise = (async (): Promise<ApiResult<StrictOrdersListResponse['data']>> => {
        try {
          const url = buildApiUrl(filters);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[useOrdersApi] Making request:', { url, filters });
          }
          
          const response = await makeApiRequest(url, controller.signal, options.timeout);
          
          // Verificar si la petición fue cancelada
          if (controller.signal.aborted) {
            return createStrictApiError('Request cancelled', 'REQUEST_CANCELLED');
          }
          
          // Verificar status de respuesta
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          // Parsear respuesta JSON
          let jsonData: unknown;
          try {
            jsonData = await response.json();
          } catch (parseError) {
            throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          }
          
          // Validar y transformar respuesta
          const validatedResponse = toStrictOrdersResponse(jsonData);
          
          if (!isStrictApiResponse(validatedResponse)) {
            return validatedResponse; // Es un error
          }
          
          // Guardar en cache si está habilitado
          if (options.enableCache) {
            options.cache.setCachedData(filters, validatedResponse);
          }
          
          return { 
            success: true, 
            data: validatedResponse.data, 
            message: validatedResponse.message, 
            timestamp: validatedResponse.timestamp 
          };
          
        } catch (error) {
          if (controller.signal.aborted) {
            return createStrictApiError('Request cancelled', 'REQUEST_CANCELLED');
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('[useOrdersApi] Request failed:', errorMessage);
          
          return createStrictApiError(errorMessage, 'FETCH_ERROR', { 
            originalError: error,
            filters,
            url: buildApiUrl(filters)
          });
        }
      })();
      
      // Registrar la petición como pendiente
      options.cache.setPendingRequest(filters, requestPromise);
      
      return await requestPromise;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error in fetchOrdersInternal';
      console.error('[useOrdersApi] Unexpected error:', errorMessage);
      
      return createStrictApiError(errorMessage, 'UNEXPECTED_ERROR', { 
        originalError: error,
        filters 
      });
    }
  }, [options]);
  
  const abortCurrentRequest = useCallback((): void => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[useOrdersApi] Request aborted');
      }
    }
  }, []);
  
  const isRequestInProgress = useCallback((): boolean => {
    return abortControllerRef.current !== null && !abortControllerRef.current.signal.aborted;
  }, []);
  
  return {
    fetchOrdersInternal,
    abortCurrentRequest,
    isRequestInProgress
  };
}









