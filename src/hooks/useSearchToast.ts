// ===================================
// HOOK: useSearchToast - Toast notifications para búsquedas
// ===================================

import { useState, useCallback } from 'react';
import type { SearchError } from './useSearchErrorHandler';

// ===================================
// TIPOS
// ===================================

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface UseSearchToastOptions {
  defaultDuration?: number;
  maxToasts?: number;
}

// ===================================
// CONFIGURACIÓN
// ===================================

const DEFAULT_DURATION = 5000;
const MAX_TOASTS = 3;

// ===================================
// UTILIDADES
// ===================================

function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getErrorToastContent(error: SearchError, retryCount: number = 0) {
  const baseTitle = 'Error en la búsqueda';
  
  switch (error.type) {
    case 'network':
      return {
        title: 'Sin conexión',
        description: retryCount > 0 
          ? `Reintentando... (${retryCount}/3)`
          : 'Verifica tu conexión a internet',
      };
      
    case 'timeout':
      return {
        title: 'Búsqueda lenta',
        description: retryCount > 0
          ? `Reintentando búsqueda... (${retryCount}/3)`
          : 'La búsqueda tardó demasiado',
      };
      
    case 'server':
      return {
        title: 'Error del servidor',
        description: retryCount > 0
          ? `Reintentando conexión... (${retryCount}/3)`
          : 'Problema temporal del servidor',
      };
      
    case 'validation':
      return {
        title: 'Búsqueda inválida',
        description: 'Verifica los términos de búsqueda',
      };
      
    default:
      return {
        title: baseTitle,
        description: retryCount > 0
          ? `Reintentando... (${retryCount}/3)`
          : 'Error inesperado',
      };
  }
}

// ===================================
// HOOK PRINCIPAL
// ===================================

export function useSearchToast(options: UseSearchToastOptions = {}) {
  const {
    defaultDuration = DEFAULT_DURATION,
    maxToasts = MAX_TOASTS,
  } = options;

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  /**
   * Agrega un nuevo toast
   */
  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>): string => {
    const id = generateToastId();
    const newToast: ToastNotification = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limitar número máximo de toasts
      return updated.slice(0, maxToasts);
    });

    // Auto-remove después del duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [defaultDuration, maxToasts]);

  /**
   * Remueve un toast específico
   */
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Limpia todos los toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Toast de éxito para búsquedas
   */
  const showSuccessToast = useCallback((query: string, resultCount: number) => {
    return addToast({
      type: 'success',
      title: '¡Búsqueda exitosa!',
      description: `Se encontraron ${resultCount} productos para "${query}"`,
      duration: 3000,
    });
  }, [addToast]);

  /**
   * Toast de error para búsquedas
   */
  const showErrorToast = useCallback((
    error: SearchError, 
    retryCount: number = 0,
    onRetry?: () => void
  ) => {
    const { title, description } = getErrorToastContent(error, retryCount);
    
    return addToast({
      type: 'error',
      title,
      description,
      duration: error.retryable ? 4000 : 6000,
      action: error.retryable && onRetry ? {
        label: 'Reintentar',
        onClick: onRetry,
      } : undefined,
    });
  }, [addToast]);

  /**
   * Toast de advertencia para búsquedas
   */
  const showWarningToast = useCallback((message: string, description?: string) => {
    return addToast({
      type: 'warning',
      title: message,
      description,
      duration: 4000,
    });
  }, [addToast]);

  /**
   * Toast informativo
   */
  const showInfoToast = useCallback((message: string, description?: string) => {
    return addToast({
      type: 'info',
      title: message,
      description,
      duration: 4000,
    });
  }, [addToast]);

  /**
   * Toast para cuando no hay resultados
   */
  const showNoResultsToast = useCallback((query: string) => {
    return addToast({
      type: 'warning',
      title: 'Sin resultados',
      description: `No se encontraron productos para "${query}"`,
      duration: 4000,
    });
  }, [addToast]);

  /**
   * Toast para retry en progreso
   */
  const showRetryToast = useCallback((attempt: number, maxAttempts: number) => {
    return addToast({
      type: 'info',
      title: 'Reintentando búsqueda...',
      description: `Intento ${attempt} de ${maxAttempts}`,
      duration: 2000,
    });
  }, [addToast]);

  /**
   * Toast para retry exitoso
   */
  const showRetrySuccessToast = useCallback(() => {
    return addToast({
      type: 'success',
      title: '¡Conexión restaurada!',
      description: 'La búsqueda se completó exitosamente',
      duration: 3000,
    });
  }, [addToast]);

  /**
   * Toast para retry fallido
   */
  const showRetryFailedToast = useCallback((attempts: number) => {
    return addToast({
      type: 'error',
      title: 'Búsqueda fallida',
      description: `No se pudo completar después de ${attempts} intentos`,
      duration: 6000,
    });
  }, [addToast]);

  return {
    // Estado
    toasts,
    hasToasts: toasts.length > 0,
    
    // Funciones generales
    addToast,
    removeToast,
    clearToasts,
    
    // Funciones específicas para búsquedas
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    showNoResultsToast,
    showRetryToast,
    showRetrySuccessToast,
    showRetryFailedToast,
  };
}

export default useSearchToast;
