// ===================================
// COMPONENT: Client Error Suppression
// ===================================

'use client';

import { useEffect } from 'react';

/**
 * Componente que configura la supresión de errores en el cliente
 */
export function ClientErrorSuppression() {
  useEffect(() => {
    // Lista de patrones de errores a suprimir (más completa)
    const suppressedErrorPatterns = [
      'ERR_ABORTED',
      'AbortError',
      'The user aborted a request',
      'Request was aborted',
      'net::ERR_ABORTED',
      'Failed to fetch',
      'NetworkError when attempting to fetch resource',
      'Load failed',
      'Connection was aborted',
      'The operation was aborted',
      'Request timeout',
      'ERR_NETWORK',
      'ERR_INTERNET_DISCONNECTED',
      'ERR_CONNECTION_REFUSED',
      'ERR_CONNECTION_RESET',
      'ERR_CONNECTION_ABORTED',
      'NETWORK_ERROR',
      'fetch aborted',
      'request aborted',
      'cancelled'
    ];

    // Función para verificar si un error debe ser suprimido
    const shouldSuppressError = (message: string): boolean => {
      return suppressedErrorPatterns.some(pattern => 
        message.toLowerCase().includes(pattern.toLowerCase())
      );
    };

    // Interceptar console.error
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      
      if (shouldSuppressError(message)) {
        // En desarrollo, mostrar como debug
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 [Client Suppressed Error]:', ...args);
        }
        return;
      }
      
      // Permitir otros errores
      originalConsoleError(...args);
    };

    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      if (shouldSuppressError(message)) {
        // En desarrollo, mostrar como debug
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 [Client Suppressed Warning]:', ...args);
        }
        return;
      }
      
      // Permitir otros warnings
      originalConsoleWarn(...args);
    };

    // TEMPORALMENTE DESHABILITADO PARA DEBUG
    // Interceptar unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      
      // COMENTADO TEMPORALMENTE PARA VER ERRORES REALES
      /*
      if (reason?.name === 'AbortError' || 
          reason?.code === 'ERR_ABORTED' ||
          (reason?.message && shouldSuppressError(reason.message))) {
        
        // Prevenir que aparezca en la consola
        event.preventDefault();
        
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 [Client Suppressed Unhandled Rejection]:', reason);
        }
      }
      */
    };

    // TEMPORALMENTE DESHABILITADO PARA DEBUG
    // Interceptar errores globales
    const handleError = (event: ErrorEvent) => {
      // COMENTADO TEMPORALMENTE PARA VER ERRORES REALES
      /*
      if (event.message && shouldSuppressError(event.message)) {
        event.preventDefault();
        
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 [Client Suppressed Global Error]:', event.message);
        }
      }
      */
    };

    // TEMPORALMENTE DESHABILITADO PARA DEBUG
    // Interceptar fetch para suprimir errores ERR_ABORTED
    const originalFetch = window.fetch;
    /*
    window.fetch = async (...args) => {
      try {
        return await originalFetch(...args);
      } catch (error: any) {
        // Suprimir errores de abort en fetch
        if (error?.name === 'AbortError' || 
            error?.code === 'ERR_ABORTED' ||
            shouldSuppressError(error?.message || '')) {
          
          if (process.env.NODE_ENV === 'development') {
            console.debug('🔇 [Client Suppressed Fetch Error]:', error);
          }
          
          // Re-throw el error pero sin que aparezca en la consola
          const suppressedError = new Error('Request was aborted');
          suppressedError.name = 'AbortError';
          throw suppressedError;
        }
        throw error;
      }
    };
    */

    // Agregar event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Log de configuración
    if (process.env.NODE_ENV === 'development') {
      console.log('🔇 Client error suppression configured');
    }

    // Cleanup function
    return () => {
      // Restaurar funciones originales
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.fetch = originalFetch;
      
      // Remover event listeners
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // Este componente no renderiza nada
}

/**
 * Hook para configurar supresión de errores
 */
export function useClientErrorSuppression() {
  useEffect(() => {
    // Configuración básica de supresión de errores
    const suppressedPatterns = ['ERR_ABORTED', 'AbortError'];
    
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (suppressedPatterns.some(pattern => message.includes(pattern))) {
        return; // Suprimir
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);
}

/**
 * Componente wrapper que aplica supresión de errores a sus hijos
 */
export function ErrorSuppressionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClientErrorSuppression />
      {children}
    </>
  );
}
