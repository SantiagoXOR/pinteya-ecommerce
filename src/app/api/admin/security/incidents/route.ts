/**
 * API de Gestión de Incidentes de Seguridad
 * Permite crear, actualizar y gestionar incidentes de seguridad
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils';
import { 
  type SecurityIncident,
  type IncidentTimelineEntry,
  type ResponseAction,
  type SecuritySeverity
} from '@/lib/security/enterprise-audit-system';
import { supabaseAdmin } from '@/lib/integrations/supabase';

// =====================================================
// GET /api/admin/security/incidents
// Obtiene lista de incidentes de seguridad
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const authResult = await requireAdminAuth(request, ['admin_access', 'security_read', 'incident_management']);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const severity = url.searchParams.get('severity');
    const assignedTo = url.searchParams.get('assignedTo');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Construir consulta
    let query = supabaseAdmin
      .from('security_incidents')
      .select(`
        *,
        assigned_user:assigned_to(id, email, first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data: incidents, error, count } = await query;

    if (error) {
      throw new Error(`Error obteniendo incidentes: ${error.message}`);
    }

    // Obtener estadísticas
    const { data: stats } = await supabaseAdmin
      .from('security_incidents')
      .select('status, severity')
      .not('status', 'eq', 'closed');

    const statistics = {
      total: count || 0,
      by_status: {
        open: stats?.filter(s => s.status === 'open').length || 0,
        investigating: stats?.filter(s => s.status === 'investigating').length || 0,
        resolved: stats?.filter(s => s.status === 'resolved').length || 0
      },
      by_severity: {
        low: stats?.filter(s => s.severity === 'low').length || 0,
        medium: stats?.filter(s => s.severity === 'medium').length || 0,
        high: stats?.filter(s => s.severity === 'high').length || 0,
        critical: stats?.filter(s => s.severity === 'critical').length || 0
      }
    };

    const response = {
      success: true,
      data: {
        incidents: incidents || [],
        statistics,
        pagination: {
          limit,
          offset,
          total: count || 0,
          hasMore: (count || 0) > offset + limit
        }
      },
      enterprise: {
        requester: {
          userId: context.userId,
          role: context.role,
          permissions: context.permissions
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SECURITY_INCIDENTS] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error interno al obtener incidentes',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/admin/security/incidents
// Crea un nuevo incidente de seguridad
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación admin con permisos de escritura
    const authResult = await requireAdminAuth(request, ['admin_access', 'security_write', 'incident_create']);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;
    const body = await request.json();

    // Validar datos requeridos
    const {
      title,
      description,
      severity,
      events = [],
      anomalies = [],
      assignedTo,
      priority = 'medium'
    } = body;

    if (!title || !description || !severity) {
      return NextResponse.json(
        {
          error: 'Campos requeridos: title, description, severity',
          code: 'MISSING_REQUIRED_FIELDS',
          enterprise: true
        },
        { status: 400 }
      );
    }

    // Validar severidad
    const validSeverities: SecuritySeverity[] = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        {
          error: `Severidad inválida. Valores válidos: ${validSeverities.join(', ')}`,
          code: 'INVALID_SEVERITY',
          enterprise: true
        },
        { status: 400 }
      );
    }

    // Crear incidente
    const incidentId = generateIncidentId();
    const now = new Date().toISOString();

    const incident: Omit<SecurityIncident, 'timeline' | 'response_actions'> = {
      id: incidentId,
      title,
      description,
      severity,
      status: 'open',
      assigned_to: assignedTo,
      created_at: now,
      updated_at: now,
      events,
      anomalies,
      impact_assessment: {
        affected_users: 0,
        affected_systems: [],
        data_compromised: false,
        estimated_cost: 0
      }
    };

    // Crear entrada inicial en timeline
    const initialTimelineEntry: IncidentTimelineEntry = {
      timestamp: now,
      action: 'incident_created',
      actor: context.userId,
      description: `Incidente creado por ${context.userId}`,
      metadata: {
        severity,
        assignedTo,
        createdBy: context.userId
      }
    };

    // Guardar en base de datos
    const { data: savedIncident, error } = await supabaseAdmin
      .from('security_incidents')
      .insert({
        ...incident,
        timeline: [initialTimelineEntry],
        response_actions: []
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando incidente: ${error.message}`);
    }

    // Crear acciones automáticas basadas en severidad
    const automaticActions = generateAutomaticActions(severity, incidentId);
    
    if (automaticActions.length > 0) {
      await supabaseAdmin
        .from('incident_response_actions')
        .insert(automaticActions);
    }

    // Notificar si es crítico
    if (severity === 'critical') {
      await notifySecurityTeam(savedIncident, context.userId);
    }

    const response = {
      success: true,
      data: {
        incident: savedIncident,
        automaticActions: automaticActions.length,
        notificationSent: severity === 'critical'
      },
      enterprise: {
        requester: {
          userId: context.userId,
          role: context.role
        },
        security: {
          level: context.securityLevel,
          audit: true
        }
      },
      message: 'Incidente de seguridad creado correctamente'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[SECURITY_INCIDENTS_CREATE] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error interno al crear incidente',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH /api/admin/security/incidents
// Actualiza un incidente existente
// =====================================================

export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const authResult = await requireAdminAuth(request, ['admin_access', 'security_write', 'incident_update']);
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: authResult.error,
          code: authResult.code,
          enterprise: true
        },
        { status: authResult.status || 401 }
      );
    }

    const context = authResult.context!;
    const body = await request.json();

    const {
      incidentId,
      status,
      assignedTo,
      resolution,
      impactAssessment,
      addTimelineEntry
    } = body;

    if (!incidentId) {
      return NextResponse.json(
        {
          error: 'incidentId es requerido',
          code: 'MISSING_INCIDENT_ID',
          enterprise: true
        },
        { status: 400 }
      );
    }

    // Obtener incidente actual
    const { data: currentIncident, error: fetchError } = await supabaseAdmin
      .from('security_incidents')
      .select('*')
      .eq('id', incidentId)
      .single();

    if (fetchError || !currentIncident) {
      return NextResponse.json(
        {
          error: 'Incidente no encontrado',
          code: 'INCIDENT_NOT_FOUND',
          enterprise: true
        },
        { status: 404 }
      );
    }

    // Preparar actualizaciones
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    const timelineEntries = [...(currentIncident.timeline || [])];

    // Actualizar status
    if (status && status !== currentIncident.status) {
      updates.status = status;
      timelineEntries.push({
        timestamp: new Date().toISOString(),
        action: 'status_changed',
        actor: context.userId,
        description: `Estado cambiado de ${currentIncident.status} a ${status}`,
        metadata: { oldStatus: currentIncident.status, newStatus: status }
      });

      // Si se resuelve, añadir timestamp
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
    }

    // Actualizar asignación
    if (assignedTo !== undefined && assignedTo !== currentIncident.assigned_to) {
      updates.assigned_to = assignedTo;
      timelineEntries.push({
        timestamp: new Date().toISOString(),
        action: 'assignment_changed',
        actor: context.userId,
        description: assignedTo 
          ? `Incidente asignado a ${assignedTo}` 
          : 'Asignación removida',
        metadata: { oldAssignee: currentIncident.assigned_to, newAssignee: assignedTo }
      });
    }

    // Actualizar evaluación de impacto
    if (impactAssessment) {
      updates.impact_assessment = {
        ...currentIncident.impact_assessment,
        ...impactAssessment
      };
      timelineEntries.push({
        timestamp: new Date().toISOString(),
        action: 'impact_updated',
        actor: context.userId,
        description: 'Evaluación de impacto actualizada',
        metadata: { impactAssessment }
      });
    }

    // Añadir entrada manual al timeline
    if (addTimelineEntry) {
      timelineEntries.push({
        timestamp: new Date().toISOString(),
        action: 'manual_entry',
        actor: context.userId,
        description: addTimelineEntry.description,
        metadata: addTimelineEntry.metadata || {}
      });
    }

    // Actualizar timeline
    updates.timeline = timelineEntries;

    // Guardar cambios
    const { data: updatedIncident, error: updateError } = await supabaseAdmin
      .from('security_incidents')
      .update(updates)
      .eq('id', incidentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Error actualizando incidente: ${updateError.message}`);
    }

    const response = {
      success: true,
      data: {
        incident: updatedIncident,
        changesApplied: Object.keys(updates).length,
        timelineEntriesAdded: timelineEntries.length - (currentIncident.timeline?.length || 0)
      },
      enterprise: {
        requester: {
          userId: context.userId,
          role: context.role
        },
        security: {
          audit: true
        }
      },
      message: 'Incidente actualizado correctamente'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SECURITY_INCIDENTS_UPDATE] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error interno al actualizar incidente',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function generateIncidentId(): string {
  return `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateAutomaticActions(severity: SecuritySeverity, incidentId: string): ResponseAction[] {
  const actions: ResponseAction[] = [];
  const now = new Date().toISOString();

  // Acciones automáticas basadas en severidad
  switch (severity) {
    case 'critical':
      actions.push(
        {
          id: `action_${Date.now()}_1`,
          type: 'automated',
          action: 'notify_security_team',
          status: 'pending',
          metadata: { incidentId, severity, priority: 'immediate' }
        },
        {
          id: `action_${Date.now()}_2`,
          type: 'automated',
          action: 'escalate_to_management',
          status: 'pending',
          metadata: { incidentId, severity, escalationLevel: 1 }
        }
      );
      break;

    case 'high':
      actions.push({
        id: `action_${Date.now()}_1`,
        type: 'automated',
        action: 'notify_security_team',
        status: 'pending',
        metadata: { incidentId, severity, priority: 'high' }
      });
      break;

    case 'medium':
      actions.push({
        id: `action_${Date.now()}_1`,
        type: 'automated',
        action: 'log_for_review',
        status: 'pending',
        metadata: { incidentId, severity, reviewRequired: true }
      });
      break;
  }

  return actions;
}

async function notifySecurityTeam(incident: any, createdBy: string): Promise<void> {
  try {
    console.warn(`[SECURITY_CRITICAL] Incidente crítico creado: ${incident.id}`);
    console.warn(`[SECURITY_CRITICAL] Título: ${incident.title}`);
    console.warn(`[SECURITY_CRITICAL] Creado por: ${createdBy}`);
    
    // En producción, aquí se enviarían notificaciones reales
    // - Email al equipo de seguridad
    // - Slack/Teams notification
    // - SMS para incidentes críticos
    // - Webhook a sistemas externos
  } catch (error) {
    console.error('[SECURITY_NOTIFICATION] Error enviando notificación:', error);
  }
}









