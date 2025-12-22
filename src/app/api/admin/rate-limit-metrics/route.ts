import { NextRequest, NextResponse } from 'next/server'
import { productionOptimizer } from '@/lib/rate-limiting/production-optimizer'
import { auth } from '@/auth'

/**
 * API para obtener métricas de rate limiting
 * Solo accesible para administradores
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const session = await auth()
    // Verificar si es admin usando el rol de la sesión (cargado desde la BD en auth.ts)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
    }

    // Obtener reporte de rendimiento
    const performanceReport = productionOptimizer.getPerformanceReport()

    // Obtener recomendaciones (simulamos límites actuales)
    const currentLimits = {
      '/api/products': { maxRequests: 60 },
      '/api/analytics': { maxRequests: 100 },
      '/api/analytics/events': { maxRequests: 150 },
      '/api/user': { maxRequests: 15 },
      '/api/orders': { maxRequests: 10 },
      '/api/payments': { maxRequests: 5 },
      '/api/search': { maxRequests: 40 },
      '/api/cart': { maxRequests: 30 },
    }

    const recommendations = productionOptimizer.analyzeAndRecommend(currentLimits)

    // Calcular estadísticas generales
    const endpoints = Object.keys(performanceReport)
    const totalEndpoints = endpoints.length
    const criticalEndpoints = endpoints.filter(
      ep => performanceReport[ep].status === 'CRITICAL'
    ).length
    const warningEndpoints = endpoints.filter(
      ep => performanceReport[ep].status === 'WARNING'
    ).length
    const excellentEndpoints = endpoints.filter(
      ep => performanceReport[ep].status === 'EXCELLENT'
    ).length

    const avgResponseTime =
      endpoints.length > 0
        ? Math.round(
            endpoints.reduce((sum, ep) => sum + performanceReport[ep].averageResponseTime, 0) /
              endpoints.length
          )
        : 0

    const avgErrorRate =
      endpoints.length > 0
        ? Math.round(
            (endpoints.reduce((sum, ep) => sum + performanceReport[ep].errorRate, 0) /
              endpoints.length) *
              100
          ) / 100
        : 0

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEndpoints,
          criticalEndpoints,
          warningEndpoints,
          excellentEndpoints,
          avgResponseTime,
          avgErrorRate,
          timestamp: new Date().toISOString(),
        },
        performanceReport,
        recommendations: recommendations.filter(r => r.recommendedLimit !== r.currentLimit),
        environment: process.env.NODE_ENV || 'development',
      },
    })
  } catch (error) {
    console.error('Error obteniendo métricas de rate limiting:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * API para limpiar métricas (útil para testing)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const session = await getServerSession(authOptions)
    // Verificar si es admin usando el rol de la sesión (cargado desde la BD en auth.ts)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 })
    }

    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Operación no permitida en producción' }, { status: 403 })
    }

    productionOptimizer.cleanup()

    return NextResponse.json({
      success: true,
      message: 'Métricas limpiadas exitosamente',
    })
  } catch (error) {
    console.error('Error limpiando métricas:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
