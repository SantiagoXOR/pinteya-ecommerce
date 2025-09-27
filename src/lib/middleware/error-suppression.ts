// ===================================
// MIDDLEWARE: Error Suppression
// ===================================

import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware para suprimir errores de red comunes que no son críticos
 */
export function createErrorSuppressionMiddleware() {
  return function errorSuppressionMiddleware(request: NextRequest) {
    // Interceptar y suprimir errores comunes de red
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn

    // Lista de patrones de errores a suprimir
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
    ]

    // Función para verificar si un error debe ser suprimido
    const shouldSuppressError = (message: string): boolean => {
      return suppressedErrorPatterns.some(pattern =>
        message.toLowerCase().includes(pattern.toLowerCase())
      )
    }

    // Override console.error para filtrar errores
    console.error = (...args: any[]) => {
      const message = args.join(' ')

      if (shouldSuppressError(message)) {
        // En desarrollo, mostrar como debug
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 [Suppressed Error]:', ...args)
        }
        return
      }

      // Permitir otros errores
      originalConsoleError(...args)
    }

    // Override console.warn para filtrar warnings
    console.warn = (...args: any[]) => {
      const message = args.join(' ')

      if (shouldSuppressError(message)) {
        // En desarrollo, mostrar como debug
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 [Suppressed Warning]:', ...args)
        }
        return
      }

      // Permitir otros warnings
      originalConsoleWarn(...args)
    }

    // Configurar headers para mejorar el manejo de errores de red
    const response = NextResponse.next()

    // Headers para mejorar la estabilidad de la conexión
    response.headers.set('Connection', 'keep-alive')
    response.headers.set('Keep-Alive', 'timeout=5, max=1000')

    // Headers para cache y performance
    if (request.nextUrl.pathname.startsWith('/api/')) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    }

    // Cleanup function (se ejecutará cuando la request termine)
    const cleanup = () => {
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
    }

    // Agregar cleanup al response
    ;(response as any).__cleanup = cleanup

    return response
  }
}

/**
 * Wrapper para APIs que maneja errores de red de manera robusta
 */
export function withNetworkErrorHandling(handler: Function) {
  return async function (request: NextRequest, context?: any) {
    try {
      // Configurar timeout para la request
      const timeoutSignal = AbortSignal.timeout(30000) // 30 segundos

      // Agregar signal de timeout al request si no existe
      if (!request.signal) {
        ;(request as any).signal = timeoutSignal
      }

      const result = await handler(request, context)
      return result
    } catch (error: any) {
      // Manejar diferentes tipos de errores
      if (error.name === 'AbortError' || error.code === 'ERR_ABORTED') {
        // Error de abort - respuesta silenciosa
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Request was cancelled',
            code: 'REQUEST_CANCELLED',
          }),
          {
            status: 499, // Client Closed Request
            headers: {
              'Content-Type': 'application/json',
              'X-Error-Type': 'abort',
            },
          }
        )
      }

      if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
        // Error de timeout
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Request timeout',
            code: 'REQUEST_TIMEOUT',
          }),
          {
            status: 408,
            headers: {
              'Content-Type': 'application/json',
              'X-Error-Type': 'timeout',
            },
          }
        )
      }

      // Re-throw otros errores para manejo normal
      throw error
    }
  }
}

/**
 * Función para configurar supresión de errores globalmente
 */
export function setupGlobalErrorSuppression() {
  if (typeof window === 'undefined') {
    return
  } // Solo en el cliente

  // Suprimir errores de unhandled promise rejections para AbortError
  window.addEventListener('unhandledrejection', event => {
    if (
      event.reason?.name === 'AbortError' ||
      event.reason?.code === 'ERR_ABORTED' ||
      event.reason?.message?.includes('aborted')
    ) {
      // Prevenir que aparezca en la consola
      event.preventDefault()

      if (process.env.NODE_ENV === 'development') {
        console.debug('🔇 Suppressed unhandled AbortError:', event.reason)
      }
    }
  })

  // Interceptar errores de fetch globalmente
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    try {
      return await originalFetch(...args)
    } catch (error: any) {
      // Suprimir errores de abort en fetch
      if (error.name === 'AbortError' || error.code === 'ERR_ABORTED') {
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔇 Suppressed fetch AbortError:', error)
        }
        throw error // Re-throw para que el código que llama pueda manejarlo
      }
      throw error
    }
  }

  console.log('🔇 Global error suppression configured')
}

/**
 * Hook para React que configura supresión de errores
 */
export function useErrorSuppression() {
  if (typeof window !== 'undefined') {
    setupGlobalErrorSuppression()
  }
}
