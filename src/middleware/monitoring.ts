import { NextRequest, NextResponse } from 'next/server'
import { proactiveMonitoring } from '../lib/monitoring/proactive-monitoring'
import { logger, LogLevel, LogCategory } from '../lib/logger'

/**
 * Middleware para capturar errores y métricas automáticamente
 */
export async function monitoringMiddleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname, searchParams } = request.nextUrl
  
  try {
    // Continuar con la request
    const response = NextResponse.next()
    
    // Medir tiempo de respuesta
    const responseTime = Date.now() - startTime
    
    // Reportar métricas de rendimiento
    if (responseTime > 2000) { // Más de 2 segundos
      await proactiveMonitoring.reportError(
        `Slow response detected: ${responseTime}ms for ${pathname}`,
        {
          path: pathname,
          responseTime,
          method: request.method,
          userAgent: request.headers.get('user-agent'),
          searchParams: Object.fromEntries(searchParams.entries())
        }
      )
    }
    
    // Agregar headers de monitoreo
    response.headers.set('X-Response-Time', responseTime.toString())
    response.headers.set('X-Monitoring-Enabled', 'true')
    
    return response
    
  } catch (error) {
    // Capturar errores del middleware
    const errorMessage = error instanceof Error ? error.message : 'Unknown middleware error'
    
    await proactiveMonitoring.reportError(error, {
      path: pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      searchParams: Object.fromEntries(searchParams.entries()),
      timestamp: new Date().toISOString()
    })
    
    logger.error(LogLevel.ERROR, 'Middleware error', {
      error: errorMessage,
      path: pathname,
      method: request.method
    }, LogCategory.SYSTEM)
    
    // Continuar con la request a pesar del error
    return NextResponse.next()
  }
}

/**
 * Configuración del matcher para el middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}