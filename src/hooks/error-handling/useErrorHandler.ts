// ===================================
// HOOK DE MANEJO DE ERRORES
// ===================================
// Hook React para manejo consistente de errores en componentes
// con retry logic, estados de loading y user feedback

import { useState, useCallback, useRef, useEffect } from 'react';
// import { toast } from 'react-hot-toast';
import { ApiError, withErrorHandling } from '@/lib/error-handling/ApiErrorHandler';

// ===================================
// TIPOS E INTERFACES
// ===================================

export interface ErrorState {
  error: ApiError | null;
  isLoading: boolean;
  hasError: boolean;
  retryCount: number;
  lastAttempt: number;
}

export interface UseErrorHandlerOptions {
  /** Máximo número de reintentos automáticos */
  maxRetries?: number;
  /** Habilitar reintentos automáticos */
  enableAutoRetry?: boolean;
  /** Delay entre reintentos (ms) */
  retryDelay?: number;
  /** Mostrar toasts de error */
  showToasts?: boolean;
  /** Callback cuando ocurre un error */
  onError?: (error: ApiError) => void;
  /** Callback cuando se recupera del error */
  onRecover?: () => void;
  /** Callback antes de reintentar */
  onRetry?: (retryCount: number) => void;
}

export interface UseErrorHandlerReturn {
  // Estado
  error: ApiError | null;
  isLoading: boolean;
  hasError: boolean;
  retryCount: number;
  canRetry: boolean;
  
  // Funciones
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    context?: string
  ) => Promise<T | null>;
  retry: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Utilidades
  getErrorMessage: () => string;
  isRetryableError: () => boolean;
}

// ===================================
// HOOK PRINCIPAL
// ===================================

export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  
  const {
    maxRetries = 3,
    enableAutoRetry = false,
    retryDelay = 1000,
    showToasts = true,
    onError,
    onRecover,
    onRetry,
  } = options;

  // Estado del error
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    hasError: false,
    retryCount: 0,
    lastAttempt: 0,
  });

  // Referencias para operaciones asíncronas
  const lastOperationRef = useRef<(() => Promise<any>) | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contextRef = useRef<string>('');

  // ===================================
  // FUNCIONES PRINCIPALES
  // ===================================

  /**
   * Ejecuta una operación con manejo de errores
   */
  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T | null> => {
    // Guardar referencia para posibles reintentos
    lastOperationRef.current = operation;
    contextRef.current = context;

    // Limpiar error anterior
    setErrorState(prev => ({
      ...prev,
      error: null,
      hasError: false,
      isLoading: true,
    }));

    try {
      const result = await withErrorHandling(
        operation,
        {
          endpoint: context,
          method: 'GET', // Por defecto, se puede personalizar
        },
        {
          enableToasts: showToasts,
          enableRetry: false, // Manejamos retry manualmente
        }
      );

      // Operación exitosa
      setErrorState(prev => ({
        ...prev,
        error: null,
        hasError: false,
        isLoading: false,
        retryCount: 0,
      }));

      // Callback de recuperación si había error previo
      if (errorState.hasError && onRecover) {
        onRecover();
      }

      return result;
    } catch (error) {
      const apiError = error as ApiError;
      
      // Actualizar estado de error
      setErrorState(prev => ({
        ...prev,
        error: apiError,
        hasError: true,
        isLoading: false,
        lastAttempt: Date.now(),
      }));

      // Callback de error
      if (onError) {
        onError(apiError);
      }

      // Retry automático si está habilitado
      if (enableAutoRetry && isRetryable(apiError) && errorState.retryCount < maxRetries) {
        scheduleAutoRetry();
      }

      return null;
    }
  }, [
    showToasts, 
    onError, 
    onRecover, 
    enableAutoRetry, 
    maxRetries, 
    errorState.hasError, 
    errorState.retryCount
  ]);

  /**
   * Reintenta la última operación
   */
  const retry = useCallback(async (): Promise<void> => {
    if (!lastOperationRef.current || errorState.retryCount >= maxRetries) {
      return;
    }

    const newRetryCount = errorState.retryCount + 1;
    
    // Callback antes de reintentar
    if (onRetry) {
      onRetry(newRetryCount);
    }

    // Actualizar contador de reintentos
    setErrorState(prev => ({
      ...prev,
      retryCount: newRetryCount,
      isLoading: true,
    }));

    // Ejecutar operación nuevamente
    await executeWithErrorHandling(lastOperationRef.current, contextRef.current);
  }, [errorState.retryCount, maxRetries, onRetry, executeWithErrorHandling]);

  /**
   * Limpia el estado de error
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isLoading: false,
      hasError: false,
      retryCount: 0,
      lastAttempt: 0,
    });

    // Limpiar timeout de retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Establece estado de loading manualmente
   */
  const setLoading = useCallback((loading: boolean) => {
    setErrorState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  // ===================================
  // FUNCIONES AUXILIARES
  // ===================================

  /**
   * Programa un retry automático
   */
  const scheduleAutoRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    const delay = retryDelay * Math.pow(2, errorState.retryCount); // Exponential backoff
    
    retryTimeoutRef.current = setTimeout(() => {
      retry();
    }, delay);
  }, [retryDelay, errorState.retryCount, retry]);

  /**
   * Determina si un error es reintentable
   */
  const isRetryable = useCallback((error: ApiError): boolean => {
    if (error.retryable !== undefined) {
      return error.retryable;
    }

    // Errores de red son reintentables
    if (!error.status || error.status >= 500) {
      return true;
    }

    // Rate limiting es reintentable
    if (error.status === 429) {
      return true;
    }

    // Timeouts son reintentables
    if (error.status === 408) {
      return true;
    }

    return false;
  }, []);

  /**
   * Obtiene mensaje de error user-friendly
   */
  const getErrorMessage = useCallback((): string => {
    if (!errorState.error) {
      return '';
    }

    const error = errorState.error;

    // Mensajes específicos por código de error
    const errorMessages: Record<string, string> = {
      'NETWORK_ERROR': 'Error de conexión. Verifica tu internet.',
      'TIMEOUT': 'La operación tardó demasiado. Intenta de nuevo.',
      'UNAUTHORIZED': 'Sesión expirada. Inicia sesión nuevamente.',
      'FORBIDDEN': 'No tienes permisos para esta acción.',
      'NOT_FOUND': 'El recurso solicitado no existe.',
      'RATE_LIMITED': 'Demasiadas solicitudes. Espera un momento.',
      'SERVER_ERROR': 'Error del servidor. Intenta más tarde.',
    };

    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }

    // Mensajes por status HTTP
    if (error.status) {
      if (error.status >= 500) {
        return 'Error del servidor. Intenta más tarde.';
      }
      if (error.status === 404) {
        return 'Recurso no encontrado.';
      }
      if (error.status === 401) {
        return 'Sesión expirada. Inicia sesión nuevamente.';
      }
      if (error.status === 403) {
        return 'No tienes permisos para esta acción.';
      }
    }

    // Mensaje genérico
    return error.message || 'Ocurrió un error inesperado.';
  }, [errorState.error]);

  /**
   * Verifica si el error actual es reintentable
   */
  const isRetryableError = useCallback((): boolean => {
    if (!errorState.error) {
      return false;
    }
    return isRetryable(errorState.error);
  }, [errorState.error, isRetryable]);

  // ===================================
  // EFECTOS
  // ===================================

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // ===================================
  // RETURN
  // ===================================

  return {
    // Estado
    error: errorState.error,
    isLoading: errorState.isLoading,
    hasError: errorState.hasError,
    retryCount: errorState.retryCount,
    canRetry: errorState.retryCount < maxRetries && isRetryableError(),
    
    // Funciones
    executeWithErrorHandling,
    retry,
    clearError,
    setLoading,
    
    // Utilidades
    getErrorMessage,
    isRetryableError,
  };
}

// ===================================
// HOOKS ESPECIALIZADOS
// ===================================

/**
 * Hook para operaciones de API con manejo de errores
 */
export function useApiErrorHandler(options?: UseErrorHandlerOptions) {
  return useErrorHandler({
    maxRetries: 3,
    enableAutoRetry: false,
    showToasts: true,
    ...options,
  });
}

/**
 * Hook para operaciones críticas con retry automático
 */
export function useCriticalErrorHandler(options?: UseErrorHandlerOptions) {
  return useErrorHandler({
    maxRetries: 5,
    enableAutoRetry: true,
    retryDelay: 2000,
    showToasts: true,
    ...options,
  });
}

/**
 * Hook para operaciones silenciosas (sin toasts)
 */
export function useSilentErrorHandler(options?: UseErrorHandlerOptions) {
  return useErrorHandler({
    maxRetries: 2,
    enableAutoRetry: false,
    showToasts: false,
    ...options,
  });
}

// ===================================
// EXPORTS
// ===================================

export type { ErrorState, UseErrorHandlerOptions, UseErrorHandlerReturn };
export default useErrorHandler;
