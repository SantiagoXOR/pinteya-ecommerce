// ===================================
// COMPONENT: Client Error Suppression
// ===================================

'use client'

import { useEffect } from 'react'
import { registerErrorHandler, unregisterErrorHandler, suppressionPatterns } from '@/lib/error-handling/centralized-error-handler'

/**
 * Componente para suprimir errores específicos del cliente
 * Usa el sistema centralizado de manejo de errores para evitar conflictos
 */
export function ClientErrorSuppression() {
  useEffect(() => {
    // Patrones de errores adicionales específicos de este componente
    const additionalPatterns = [
      // Errores específicos de la aplicación que queremos suprimir
      /Error obteniendo producto actual/i,
      /Error original/i,
      
      // Errores de desarrollo
      /Warning: ReactDOM.render is no longer supported/i,
      /Warning: componentWillReceiveProps has been renamed/i,
    ]

    // Función para verificar si un mensaje debe ser suprimido
    const shouldSuppress = (message: string): boolean => {
      // Verificar patrones comunes
      if (suppressionPatterns.abortError([message]) ||
          suppressionPatterns.networkError([message]) ||
          suppressionPatterns.nextAuthError([message])) {
        return true
      }
      
      // Verificar patrones adicionales
      return additionalPatterns.some(pattern => pattern.test(message))
    }

    // Handler para el sistema centralizado
    const clientErrorHandler = (args: any[]): boolean => {
      const message = args.join(' ')
      
      // Si el mensaje debe ser suprimido, manejarlo aquí
      if (shouldSuppress(message)) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 [Client Suppressed Error]:', ...args)
        }
        return true // Indica que el error fue manejado
      }
      
      return false // Permite que otros handlers procesen el error
    }

    // Registrar el handler con prioridad alta (100)
    registerErrorHandler('client-error-suppression', 100, clientErrorHandler)

    // TEMPORALMENTE DESHABILITADO PARA DEBUG
    // Interceptar unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason

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
    }

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
    }

    // TEMPORALMENTE DESHABILITADO PARA DEBUG
    // Interceptar fetch para suprimir errores ERR_ABORTED
    const originalFetch = window.fetch
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
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // Log de configuración
    if (process.env.NODE_ENV === 'development') {
      console.log('🔇 Client error suppression configured')
    }

    // Cleanup function
    return () => {
      // Desregistrar el handler del sistema centralizado
      unregisterErrorHandler('client-error-suppression')
      
      // Restaurar funciones originales solo si este componente las interceptó
      if ((console.error as any).__clientErrorSuppressionActive) {
        console.error = originalConsoleError
        delete (console.error as any).__clientErrorSuppressionActive
      }
      
      if ((console.warn as any).__clientErrorSuppressionActive) {
        console.warn = originalConsoleWarn
        delete (console.warn as any).__clientErrorSuppressionActive
      }
      
      // Restaurar fetch original
      window.fetch = originalFetch

      // Remover event listeners
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔇 Client error suppression cleanup completed')
      }
    }
  }, [])

  return null // Este componente no renderiza nada
}

/**
 * Hook para configurar supresión de errores
 */
export function useClientErrorSuppression() {
  useEffect(() => {
    // Configuración básica de supresión de errores
    const suppressedPatterns = ['ERR_ABORTED', 'AbortError']

    const originalError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (suppressedPatterns.some(pattern => message.includes(pattern))) {
        return // Suprimir
      }
      originalError(...args)
    }

    return () => {
      console.error = originalError
    }
  }, [])
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
  )
}
