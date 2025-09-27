// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - ALERTS MANAGEMENT API
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/auth/admin-auth'
import {
  enterpriseAlertSystem,
  AlertLevel,
  NotificationType,
  AlertStatus,
} from '@/lib/monitoring/alert-system'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'

/**
 * GET /api/admin/monitoring/alerts
 * Obtiene alertas activas y configuración
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await getAuthenticatedAdmin(request)

    if (!authResult.isAdmin || !authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso no autorizado',
        },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as AlertStatus | null
    const level = searchParams.get('level') as AlertLevel | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Obtener alertas de la base de datos
    const supabase = getSupabaseClient(true)
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    let query = supabase
      .from('enterprise_alerts')
      .select('*')
      .order('triggered_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (level) {
      query = query.eq('level', level)
    }

    const { data: alerts, error } = await query

    if (error) {
      throw new Error(`Failed to fetch alerts: ${error.message}`)
    }

    // Obtener estadísticas
    const { data: stats } = await supabase
      .from('enterprise_alerts')
      .select('level, status')
      .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const statistics = {
      total: stats?.length || 0,
      byLevel: {
        info: stats?.filter(s => s.level === 'info').length || 0,
        warning: stats?.filter(s => s.level === 'warning').length || 0,
        critical: stats?.filter(s => s.level === 'critical').length || 0,
        emergency: stats?.filter(s => s.level === 'emergency').length || 0,
      },
      byStatus: {
        active: stats?.filter(s => s.status === 'active').length || 0,
        acknowledged: stats?.filter(s => s.status === 'acknowledged').length || 0,
        resolved: stats?.filter(s => s.status === 'resolved').length || 0,
        suppressed: stats?.filter(s => s.status === 'suppressed').length || 0,
      },
    }

    logger.info(
      LogLevel.INFO,
      'Alerts retrieved',
      {
        userId: authResult.userId,
        alertsCount: alerts?.length || 0,
        filters: { status, level, limit, offset },
      },
      LogCategory.SYSTEM
    )

    return NextResponse.json({
      success: true,
      data: {
        alerts: alerts || [],
        statistics,
        pagination: {
          limit,
          offset,
          total: statistics.total,
        },
      },
    })
  } catch (error) {
    logger.error(
      LogLevel.ERROR,
      'Failed to get alerts',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      LogCategory.SYSTEM
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/monitoring/alerts
 * Crea una nueva regla de alerta o canal de notificación
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await getAuthenticatedAdmin(request)

    if (!authResult.isAdmin || !authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso no autorizado',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, config } = body

    if (type === 'alert_rule') {
      // Crear regla de alerta
      const {
        name,
        description,
        metricName,
        condition,
        threshold,
        level,
        cooldownMinutes,
        channels,
        escalationRules,
        tags,
        enabled = true,
      } = config

      // Validar datos requeridos
      if (!name || !metricName || !condition || threshold === undefined || !level) {
        return NextResponse.json(
          {
            success: false,
            error: 'Faltan campos requeridos',
          },
          { status: 400 }
        )
      }

      const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      enterpriseAlertSystem.setAlertRule({
        id: ruleId,
        name,
        description: description || '',
        enabled,
        metricName,
        condition,
        threshold,
        level,
        cooldownMinutes: cooldownMinutes || 5,
        channels: channels || ['default_log'],
        escalationRules: escalationRules || [],
        tags: tags || {},
        metadata: {
          createdBy: authResult.userId,
          createdAt: new Date().toISOString(),
        },
      })

      logger.info(
        LogLevel.INFO,
        'Alert rule created',
        {
          ruleId,
          name,
          metricName,
          level,
          createdBy: authResult.userId,
        },
        LogCategory.SYSTEM
      )

      return NextResponse.json({
        success: true,
        data: { ruleId, name, enabled },
      })
    } else if (type === 'notification_channel') {
      // Crear canal de notificación
      const { name, notificationType, channelConfig, enabled = true, levels, rateLimit } = config

      if (!name || !notificationType || !levels) {
        return NextResponse.json(
          {
            success: false,
            error: 'Faltan campos requeridos para el canal',
          },
          { status: 400 }
        )
      }

      const channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      enterpriseAlertSystem.setNotificationChannel({
        id: channelId,
        type: notificationType,
        name,
        config: channelConfig || {},
        enabled,
        levels,
        rateLimit,
      })

      logger.info(
        LogLevel.INFO,
        'Notification channel created',
        {
          channelId,
          name,
          type: notificationType,
          createdBy: authResult.userId,
        },
        LogCategory.SYSTEM
      )

      return NextResponse.json({
        success: true,
        data: { channelId, name, type: notificationType, enabled },
      })
    } else if (type === 'escalation_rule') {
      // Crear regla de escalamiento
      const { name, conditions, actions, enabled = true } = config

      if (!name || !conditions || !actions) {
        return NextResponse.json(
          {
            success: false,
            error: 'Faltan campos requeridos para la regla de escalamiento',
          },
          { status: 400 }
        )
      }

      const escalationId = `escalation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      enterpriseAlertSystem.setEscalationRule({
        id: escalationId,
        name,
        enabled,
        conditions,
        actions,
      })

      logger.info(
        LogLevel.INFO,
        'Escalation rule created',
        {
          escalationId,
          name,
          createdBy: authResult.userId,
        },
        LogCategory.SYSTEM
      )

      return NextResponse.json({
        success: true,
        data: { escalationId, name, enabled },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de configuración no válido',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    logger.error(
      LogLevel.ERROR,
      'Failed to create alert configuration',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      LogCategory.SYSTEM
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/monitoring/alerts
 * Actualiza estado de alertas (acknowledge, resolve)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await getAuthenticatedAdmin(request)

    if (!authResult.isAdmin || !authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso no autorizado',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { alertId, action } = body

    if (!alertId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan alertId y action',
        },
        { status: 400 }
      )
    }

    let success = false

    switch (action) {
      case 'acknowledge':
        success = await enterpriseAlertSystem.acknowledgeAlert(alertId, authResult.userId)
        break
      case 'resolve':
        success = await enterpriseAlertSystem.resolveAlert(alertId, authResult.userId)
        break
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Acción no válida',
          },
          { status: 400 }
        )
    }

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo actualizar la alerta',
        },
        { status: 404 }
      )
    }

    logger.info(
      LogLevel.INFO,
      `Alert ${action}d`,
      {
        alertId,
        action,
        userId: authResult.userId,
      },
      LogCategory.SYSTEM
    )

    return NextResponse.json({
      success: true,
      data: { alertId, action, status: 'updated' },
    })
  } catch (error) {
    logger.error(
      LogLevel.ERROR,
      'Failed to update alert',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      LogCategory.SYSTEM
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
