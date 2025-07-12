// ===================================
// HOOK: useSearchErrorHandler - Manejo robusto de errores de búsqueda
// ===================================

import { useState, useCallback } from 'react';

// ===================================
// TIPOS
// ===================================

export interface SearchError {
  type: 'network' | 'server' | 'validation' | 'timeout' | 'unknown';
  message: string;
  code?: string;
  retryable: boolean;
  timestamp: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface UseSearchErrorHandlerOptions {
  retryConfig?: Partial<RetryConfig>;
  onError?: (error: SearchError) => void;
  onRetrySuccess?: () => void;
  onRetryFailed?: (error: SearchError, attempts: number) => void;
}

// ===================================
// CONFIGURACIÓN POR DEFECTO
// ===================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

// ===================================
// UTILIDADES
// ===================================

/**
 * Clasifica el tipo de error basado en el error original
 */
function classifyError(error: any): SearchError {
  const timestamp = Date.now();
  
  // Error de red
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Error de conexión. Verifica tu conexión a internet.',
      retryable: true,
      timestamp,
    };
  }
  
  // Error de timeout
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'La búsqueda tardó demasiado. Intenta nuevamente.',
      retryable: true,
      timestamp,
    };
  }
  
  // Error del servidor
  if (error.status >= 500) {
    return {
      type: 'server',
      message: 'Error del servidor. Intenta nuevamente en unos momentos.',
      code: error.status?.toString(),
      retryable: true,
      timestamp,
    };
  }
  
  // Error de validación
  if (error.status >= 400 && error.status < 500) {
    return {
      type: 'validation',
      message: error.message || 'Parámetros de búsqueda inválidos.',
      code: error.status?.toString(),
      retryable: false,
      timestamp,
    };
  }
  
  // Error desconocido
  return {
    type: 'unknown',
    message: error.message || 'Error inesperado durante la búsqueda.',
    retryable: true,
    timestamp,
  };
}

/**
 * Calcula el delay para el siguiente retry con backoff exponencial
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

// ===================================
// HOOK PRINCIPAL
// ===================================

export function useSearchErrorHandler(options: UseSearchErrorHandlerOptions = {}) {
  const {
    retryConfig: userRetryConfig = {},
    onError,
    onRetrySuccess,
    onRetryFailed,
  } = options;

  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...userRetryConfig };
  
  const [currentError, setCurrentError] = useState<SearchError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * Maneja un error de búsqueda
   */
  const handleError = useCallback((error: any): SearchError => {
    const searchError = classifyError(error);
    setCurrentError(searchError);
    setRetryCount(0);
    
    // Callback personalizado
    onError?.(searchError);
    
    return searchError;
  }, [onError]);

  /**
   * Ejecuta una operación con retry automático
   */
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'búsqueda'
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
      try {
        setIsRetrying(attempt > 1);
        
        const result = await operation();
        
        // Éxito
        if (attempt > 1) {
          setCurrentError(null);
          setRetryCount(0);
          setIsRetrying(false);
          onRetrySuccess?.();
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        const searchError = classifyError(error);
        
        // Si no es retryable o hemos agotado los intentos
        if (!searchError.retryable || attempt > retryConfig.maxRetries) {
          setCurrentError(searchError);
          setRetryCount(attempt - 1);
          setIsRetrying(false);
          
          if (attempt > 1) {
            onRetryFailed?.(searchError, attempt - 1);
          } else {
            onError?.(searchError);
          }
          
          throw error;
        }
        
        // Preparar para retry
        setRetryCount(attempt);
        const delay = calculateDelay(attempt, retryConfig);
        
        console.warn(`${operationName} falló (intento ${attempt}/${retryConfig.maxRetries}). Reintentando en ${delay}ms...`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }, [retryConfig, onError, onRetrySuccess, onRetryFailed]);

  /**
   * Limpia el estado de error
   */
  const clearError = useCallback(() => {
    setCurrentError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  /**
   * Retry manual
   */
  const retryManually = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    clearError();
    return executeWithRetry(operation, 'retry manual');
  }, [executeWithRetry, clearError]);

  return {
    // Estado
    currentError,
    retryCount,
    isRetrying,
    hasError: currentError !== null,
    
    // Funciones
    handleError,
    executeWithRetry,
    clearError,
    retryManually,
    
    // Configuración
    retryConfig,
  };
}

export default useSearchErrorHandler;
