// ===================================
// MIDDLEWARE: Error Suppression
// ===================================

import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware para suprimir errores ERR_ABORTED y mejorar el manejo de errores de red
 */
export function errorSuppressionMiddleware(request: NextRequest) {
  const response = NextResponse.next()

  // Configurar headers para mejorar el manejo de errores de red
  response.headers.set('Connection', 'keep-alive')
  response.headers.set('Keep-Alive', 'timeout=5, max=1000')

  // Headers para prevenir problemas de CORS que pueden causar ERR_ABORTED
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Headers para mejorar la estabilidad de la conexión
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

/**
 * Función para interceptar y suprimir errores específicos en el servidor
 */
export function suppressServerErrors() {
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
    'The operation was aborted',
    'Request timeout',
  ]

  // TEMPORALMENTE DESHABILITADO PARA DEBUG
  // Interceptar console.error en el servidor
  const originalConsoleError = console.error
  /*
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Verificar si el error debe ser suprimido
    const shouldSuppress = suppressedErrorPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (shouldSuppress) {
      // En desarrollo, mostrar como debug
      if (process.env.NODE_ENV === 'development') {
        console.debug('🔇 [Server Suppressed Error]:', ...args);
      }
      return;
    }
    
    // Permitir otros errores
    originalConsoleError(...args);
  };

  // Interceptar console.warn en el servidor
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Verificar si el warning debe ser suprimido
    const shouldSuppress = suppressedErrorPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (shouldSuppress) {
      // En desarrollo, mostrar como debug
      if (process.env.NODE_ENV === 'development') {
        console.debug('🔇 [Server Suppressed Warning]:', ...args);
      }
      return;
    }
    
    // Permitir otros warnings
    originalConsoleWarn(...args);
  };
  */
}

/**
 * Configuración de cleanup para restaurar funciones originales
 */
export function restoreOriginalConsoleFunctions() {
  // Esta función puede ser llamada para restaurar las funciones originales si es necesario
  // En la mayoría de casos no es necesario llamarla
}

// Inicializar supresión de errores del servidor automáticamente
if (typeof window === 'undefined') {
  suppressServerErrors()
}
