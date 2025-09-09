// ===================================
// HOOK: Network Error Handler
// ===================================

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface NetworkErrorHandlerOptions {
  enableLogging?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface NetworkError {
  type: 'network' | 'timeout' | 'abort' | 'server' | 'unknown';
  originalError: any;
  timestamp: number;
  url?: string;
  method?: string;
}

export function useNetworkErrorHandler(options: NetworkErrorHandlerOptions = {}) {
  const {
    enableLogging = true,
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const queryClient = useQueryClient();

  // Función para clasificar errores de red
  const classifyError = useCallback((error: any): NetworkError => {
    const timestamp = Date.now();
    
    // Detectar tipo de error
    let type: NetworkError['type'] = 'unknown';
    
    if (error?.code === 'ERR_ABORTED' || error?.name === 'AbortError') {
      type = 'abort';
    } else if (error?.code === 'ERR_NETWORK' || error?.message?.includes('network')) {
      type = 'network';
    } else if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
      type = 'timeout';
    } else if (error?.status >= 500) {
      type = 'server';
    }

    return {
      type,
      originalError: error,
      timestamp,
      url: error?.config?.url || error?.url,
      method: error?.config?.method || error?.method
    };
  }, []);

  // Función para manejar errores de red
  const handleNetworkError = useCallback((error: any, context?: any) => {
    const networkError = classifyError(error);

    // Para errores de abort, usar console.debug en lugar de console.error para evitar bucles
    if (networkError.type === 'abort') {
      if (enableLogging) {
        console.debug('🔇 Suppressed abort error:', {
          type: networkError.type,
          url: networkError.url,
          method: networkError.method,
          originalError: networkError.originalError,
          context
        });
        console.warn('🚫 Request was aborted - this is usually intentional');
      }
      return; // Salir temprano para errores de abort
    }

    if (enableLogging) {
      console.group('🌐 Network Error Handler');
      console.error('Error Type:', networkError.type);
      console.error('URL:', networkError.url);
      console.error('Method:', networkError.method);
      console.error('Original Error:', networkError.originalError);
      console.error('Context:', context);
      console.groupEnd();
    }

    // Manejar diferentes tipos de errores
    switch (networkError.type) {

      case 'network':
        // Errores de red - invalidar queries para refetch
        if (enableRetry) {
          setTimeout(() => {
            queryClient.invalidateQueries();
          }, retryDelay);
        }
        break;

      case 'timeout':
        // Timeouts - reintentar con delay
        if (enableRetry) {
          setTimeout(() => {
            queryClient.refetchQueries({ type: 'active' });
          }, retryDelay * 2);
        }
        break;

      case 'server':
        // Errores de servidor - reintentar después de un delay más largo
        if (enableRetry) {
          setTimeout(() => {
            queryClient.invalidateQueries();
          }, retryDelay * 3);
        }
        break;

      default:
        // Errores desconocidos - log para debugging
        if (enableLogging) {
          console.warn('❓ Unknown error type:', error);
        }
        break;
    }

    return networkError;
  }, [classifyError, enableLogging, enableRetry, retryDelay, queryClient]);

  // Función para interceptar errores globales
  const setupGlobalErrorHandling = useCallback(() => {
    // Interceptar errores de fetch no manejados
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        return response;
      } catch (error) {
        handleNetworkError(error, { type: 'fetch', url: args[0] });
        throw error;
      }
    };

    // Interceptar errores de unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.name === 'AbortError' || 
          event.reason?.code === 'ERR_ABORTED' ||
          event.reason?.message?.includes('aborted')) {
        // Prevenir que los errores de abort aparezcan en la consola
        event.preventDefault();
        if (enableLogging) {
          console.debug('🔇 Suppressed AbortError from console');
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup function
    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleNetworkError, enableLogging]);

  // Setup global error handling on mount
  useEffect(() => {
    const cleanup = setupGlobalErrorHandling();
    return cleanup;
  }, [setupGlobalErrorHandling]);

  // Función para crear un wrapper de fetch con manejo de errores
  const createFetchWrapper = useCallback((baseUrl?: string) => {
    return async (url: string, options: RequestInit = {}) => {
      const fullUrl = baseUrl ? `${baseUrl}${url}` : url;
      
      try {
        const response = await fetch(fullUrl, {
          ...options,
          // Agregar timeout por defecto
          signal: options.signal || AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        const networkError = handleNetworkError(error, { 
          type: 'wrapper', 
          url: fullUrl, 
          options 
        });
        
        // Re-throw el error para que pueda ser manejado por el código que llama
        throw networkError.originalError;
      }
    };
  }, [handleNetworkError]);

  return {
    handleNetworkError,
    classifyError,
    createFetchWrapper,
    setupGlobalErrorHandling
  };
}

// Hook simplificado para uso básico
export function useNetworkErrorSuppression() {
  return useNetworkErrorHandler({
    enableLogging: false,
    enableRetry: false
  });
}

// Hook para desarrollo con logging detallado
export function useNetworkErrorDebug() {
  return useNetworkErrorHandler({
    enableLogging: true,
    enableRetry: true,
    maxRetries: 5,
    retryDelay: 500
  });
}
