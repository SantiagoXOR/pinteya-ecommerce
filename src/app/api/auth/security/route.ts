// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API Enterprise de Auditoría de Seguridad Mejorada
 * Refactorizada con utilidades enterprise + RLS + validaciones robustas
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/admin-auth'
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils'
import { executeWithRLS } from '@/lib/auth/enterprise-rls-utils'
import { withCache, getCacheStats } from '@/lib/auth/enterprise-cache'
import {
  analyzeSecurityPatterns,
  getSecurityMetrics,
  generateSecurityReport,
  getActiveSecurityAlerts,
  updateSecurityAlert,
  resolveSecurityAlert,
  markAlertAsFalsePositive,
  runSecurityHealthCheck,
  cleanupOldSecurityEvents,
  exportSecurityEvents,
} from '@/lib/auth/security-audit-enhanced'
import { ApiResponse } from '@/types/api'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'
import { createSecurityLogger } from '@/lib/logging/security-logger'
import { withTimeout, ENDPOINT_TIMEOUTS } from '@/lib/config/api-timeouts'

// =====================================================
// GET /api/auth/security
// Obtiene métricas, alertas o ejecuta análisis
// =====================================================

export async function GET(request: NextRequest) {
  // Aplicar rate limiting para APIs de autenticación
  const rateLimitResult = await withRateLimit(request, RATE_LIMIT_CONFIGS.auth, async () => {
    // Crear logger de seguridad
    const securityLogger = createSecurityLogger(request)

    try {
      // Log del acceso al API de seguridad
      securityLogger.logApiAccess(securityLogger.context, 'auth/security', 'read')

      const url = new URL(request.url)
      const action = url.searchParams.get('action') || 'metrics'
      const userId = url.searchParams.get('userId')
      const severity = url.searchParams.get('severity') as any

      // ENTERPRISE: Autenticación enterprise con permisos específicos de seguridad
      const enterpriseResult = await withTimeout(
        () => requireAdminAuth(request, ['security_read', 'admin_access']),
        ENDPOINT_TIMEOUTS['/api/auth']?.request || 15000,
        'Autenticación enterprise'
      )

      if (!enterpriseResult.success) {
        // Log del intento de acceso no autorizado
        securityLogger.logPermissionDenied(securityLogger.context, 'auth/security', 'read')

        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: enterpriseResult.error || 'Permisos de administrador requeridos',
          enterprise: true,
          code: enterpriseResult.code,
        }
        return NextResponse.json(errorResponse, { status: enterpriseResult.status || 403 })
      }

      const context = enterpriseResult.context!

      // LEGACY: Mantener compatibilidad con método anterior
      const legacyResult = await getAuthenticatedUser(request)
      console.log('🔍 Security API: Enterprise vs Legacy auth comparison:', {
        enterprise: enterpriseResult.success,
        legacy: legacyResult.isAdmin,
        agree: enterpriseResult.success === legacyResult.isAdmin,
      })

      switch (action) {
        case 'metrics':
          // ENTERPRISE: Obtener métricas de seguridad con cache
          const metrics = await withCache(
            `security_metrics_${context.userId}`,
            () => getSecurityMetrics(),
            2 * 60 * 1000 // 2 minutos de cache
          )

          const metricsResponse: ApiResponse<any> = {
            data: {
              metrics,
              cache: getCacheStats(),
              enterprise: {
                user: context.userId,
                role: context.role,
                permissions: context.permissions,
              },
            },
            success: true,
            message: 'Métricas de seguridad obtenidas (enterprise)',
            enterprise: true,
          }
          return NextResponse.json(metricsResponse)

        case 'alerts':
          // ENTERPRISE: Obtener alertas activas con cache
          const alerts = await withCache(
            `security_alerts_${userId || 'all'}_${severity || 'all'}`,
            () => getActiveSecurityAlerts(userId || undefined, severity),
            1 * 60 * 1000 // 1 minuto de cache
          )

          const alertsResponse: ApiResponse<any> = {
            data: {
              alerts,
              count: alerts.length,
              cache: getCacheStats(),
              enterprise: {
                filtered_by_user: userId,
                filtered_by_severity: severity,
                requester: context.userId,
              },
            },
            success: true,
            message: 'Alertas de seguridad obtenidas',
          }
          return NextResponse.json(alertsResponse)

        case 'analyze':
          // Ejecutar análisis de patrones
          const timeWindow = parseInt(url.searchParams.get('timeWindow') || '24')
          const analysisAlerts = await analyzeSecurityPatterns(userId || undefined, timeWindow)
          const analysisResponse: ApiResponse<any> = {
            data: { alerts: analysisAlerts, count: analysisAlerts.length },
            success: true,
            message: `Análisis completado: ${analysisAlerts.length} alertas generadas`,
          }
          return NextResponse.json(analysisResponse)

        case 'health':
          // Ejecutar verificación de salud de seguridad
          const healthCheck = await runSecurityHealthCheck()
          const healthResponse: ApiResponse<any> = {
            data: healthCheck,
            success: true,
            message: `Estado de seguridad: ${healthCheck.status}`,
          }
          return NextResponse.json(healthResponse)

        case 'report':
          // Generar reporte de seguridad
          const startDateStr = url.searchParams.get('startDate')
          const endDateStr = url.searchParams.get('endDate')

          if (!startDateStr || !endDateStr) {
            const errorResponse: ApiResponse<null> = {
              data: null,
              success: false,
              error: 'startDate y endDate son requeridos para generar reporte',
            }
            return NextResponse.json(errorResponse, { status: 400 })
          }

          const startDate = new Date(startDateStr)
          const endDate = new Date(endDateStr)

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            const errorResponse: ApiResponse<null> = {
              data: null,
              success: false,
              error: 'Fechas inválidas',
            }
            return NextResponse.json(errorResponse, { status: 400 })
          }

          const report = await generateSecurityReport(startDate, endDate)
          const reportResponse: ApiResponse<any> = {
            data: { report },
            success: true,
            message: 'Reporte de seguridad generado',
          }
          return NextResponse.json(reportResponse)

        case 'export':
          // Exportar eventos de seguridad
          const exportStartStr = url.searchParams.get('startDate')
          const exportEndStr = url.searchParams.get('endDate')
          const format = (url.searchParams.get('format') as 'json' | 'csv') || 'json'

          if (!exportStartStr || !exportEndStr) {
            const errorResponse: ApiResponse<null> = {
              data: null,
              success: false,
              error: 'startDate y endDate son requeridos para exportar',
            }
            return NextResponse.json(errorResponse, { status: 400 })
          }

          const exportStart = new Date(exportStartStr)
          const exportEnd = new Date(exportEndStr)

          const exportData = await exportSecurityEvents(exportStart, exportEnd, format)

          // Retornar como archivo descargable
          const headers = new Headers()
          headers.set('Content-Type', format === 'json' ? 'application/json' : 'text/csv')
          headers.set(
            'Content-Disposition',
            `attachment; filename="security-events-${exportStartStr}-${exportEndStr}.${format}"`
          )

          return new Response(exportData, { headers })

        default:
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: `Acción no válida: ${action}`,
          }
          return NextResponse.json(errorResponse, { status: 400 })
      }
    } catch (error) {
      // Log del error de seguridad
      securityLogger.logApiError(securityLogger.context, error as Error, {
        endpoint: '/api/auth/security',
        method: 'GET',
        action: request.url,
      })

      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error interno del servidor',
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }
  })

  return rateLimitResult
}

// =====================================================
// POST /api/auth/security
// Acciones sobre alertas y mantenimiento
// =====================================================

export async function POST(request: NextRequest) {
  // Aplicar rate limiting para APIs de autenticación (acciones administrativas)
  const rateLimitResult = await withRateLimit(request, RATE_LIMIT_CONFIGS.admin, async () => {
    // Crear logger de seguridad
    const securityLogger = createSecurityLogger(request)

    try {
      // Log del acceso al API de seguridad (POST)
      securityLogger.logApiAccess(securityLogger.context, 'auth/security', 'write')

      const body = await withTimeout(
        () => request.json(),
        ENDPOINT_TIMEOUTS['/api/auth']?.request || 15000,
        'Lectura del body de la request'
      )

      const { action, alertId, status, notes, assignedTo } = body

      if (!action) {
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Acción es requerida',
        }
        return NextResponse.json(errorResponse, { status: 400 })
      }

      // Verificar autenticación y permisos de admin
      const authResult = await withTimeout(
        () => getAuthenticatedUser(request),
        ENDPOINT_TIMEOUTS['/api/auth']?.request || 15000,
        'Verificación de autenticación'
      )

      if (!authResult.userId || !authResult.isAdmin) {
        // Log del intento de acceso no autorizado
        securityLogger.logPermissionDenied(securityLogger.context, 'auth/security', 'write')

        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Permisos de administrador requeridos',
        }
        return NextResponse.json(errorResponse, { status: 403 })
      }

      switch (action) {
        case 'update_alert':
          // Actualizar estado de alerta
          if (!alertId) {
            const errorResponse: ApiResponse<null> = {
              data: null,
              success: false,
              error: 'alertId es requerido',
            }
            return NextResponse.json(errorResponse, { status: 400 })
          }

          const updateResult = await updateSecurityAlert(alertId, {
            status,
            assigned_to: assignedTo,
            resolution_notes: notes,
          })

          const updateResponse: ApiResponse<any> = {
            data: { success: updateResult },
            success: updateResult,
            message: updateResult ? 'Alerta actualizada' : 'Error actualizando alerta',
          }
          return NextResponse.json(updateResponse, {
            status: updateResult ? 200 : 500,
          })

        case 'resolve_alert':
          // Resolver alerta
          if (!alertId || !notes) {
            const errorResponse: ApiResponse<null> = {
              data: null,
              success: false,
              error: 'alertId y notes son requeridos',
            }
            return NextResponse.json(errorResponse, { status: 400 })
          }

          const resolveResult = await resolveSecurityAlert(alertId, notes, authResult.userId)

          const resolveResponse: ApiResponse<any> = {
            data: { success: resolveResult },
            success: resolveResult,
            message: resolveResult ? 'Alerta resuelta' : 'Error resolviendo alerta',
          }
          return NextResponse.json(resolveResponse, {
            status: resolveResult ? 200 : 500,
          })

        case 'false_positive':
          // Marcar como falso positivo
          if (!alertId || !notes) {
            const errorResponse: ApiResponse<null> = {
              data: null,
              success: false,
              error: 'alertId y notes son requeridos',
            }
            return NextResponse.json(errorResponse, { status: 400 })
          }

          const fpResult = await markAlertAsFalsePositive(alertId, notes, authResult.userId)

          const fpResponse: ApiResponse<any> = {
            data: { success: fpResult },
            success: fpResult,
            message: fpResult ? 'Alerta marcada como falso positivo' : 'Error marcando alerta',
          }
          return NextResponse.json(fpResponse, {
            status: fpResult ? 200 : 500,
          })

        case 'cleanup':
          // Limpiar eventos antiguos
          const daysToKeep = body.daysToKeep || 90
          const cleanupCount = await cleanupOldSecurityEvents(daysToKeep)

          const cleanupResponse: ApiResponse<any> = {
            data: { deletedCount: cleanupCount },
            success: true,
            message: `Limpieza completada: ${cleanupCount} eventos eliminados`,
          }
          return NextResponse.json(cleanupResponse)

        case 'force_analysis':
          // Forzar análisis de seguridad
          const forceUserId = body.userId
          const forceTimeWindow = body.timeWindow || 24

          const forceAlerts = await analyzeSecurityPatterns(forceUserId, forceTimeWindow)

          const forceResponse: ApiResponse<any> = {
            data: { alerts: forceAlerts, count: forceAlerts.length },
            success: true,
            message: `Análisis forzado completado: ${forceAlerts.length} alertas generadas`,
          }
          return NextResponse.json(forceResponse)

        default:
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: `Acción no válida: ${action}`,
          }
          return NextResponse.json(errorResponse, { status: 400 })
      }
    } catch (error) {
      // Log del error de seguridad
      securityLogger.logApiError(securityLogger.context, error as Error, {
        endpoint: '/api/auth/security',
        method: 'POST',
        action: request.url,
      })

      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Error interno del servidor',
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }
  })

  return rateLimitResult
}
