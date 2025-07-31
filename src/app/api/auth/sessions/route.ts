/**
 * API de Gestión Avanzada de Sesiones
 * Endpoints para consultar, gestionar y limpiar sesiones de usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/admin-auth';
import {
  getUserSessions,
  getSessionInfo,
  invalidateSession,
  invalidateAllUserSessions,
  updateSessionActivity,
  cleanupExpiredSessions,
  syncSessionsWithClerk,
  getSessionStats,
  isSessionValid
} from '@/lib/auth/session-management';
import { ApiResponse } from '@/types/api';

// =====================================================
// GET /api/auth/sessions
// Obtiene sesiones del usuario o estadísticas generales
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';
    const userId = url.searchParams.get('userId');
    const sessionId = url.searchParams.get('sessionId');

    // Verificar autenticación
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.userId) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Autenticación requerida'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    switch (action) {
      case 'list':
        // Listar sesiones del usuario actual o especificado
        const targetUserId = userId || authResult.userId;
        
        // Solo admins pueden ver sesiones de otros usuarios
        if (targetUserId !== authResult.userId && !authResult.isAdmin) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Permisos insuficientes para ver sesiones de otros usuarios'
          };
          return NextResponse.json(errorResponse, { status: 403 });
        }

        const sessions = await getUserSessions(targetUserId);
        const successResponse: ApiResponse<any> = {
          data: { sessions, count: sessions.length },
          success: true,
          message: 'Sesiones obtenidas exitosamente'
        };
        return NextResponse.json(successResponse);

      case 'info':
        // Obtener información de una sesión específica
        if (!sessionId) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'sessionId es requerido para obtener información'
          };
          return NextResponse.json(errorResponse, { status: 400 });
        }

        const sessionInfo = await getSessionInfo(sessionId);
        if (!sessionInfo) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Sesión no encontrada'
          };
          return NextResponse.json(errorResponse, { status: 404 });
        }

        // Solo el propietario o admin puede ver la sesión
        if (sessionInfo.user_id !== authResult.userId && !authResult.isAdmin) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Permisos insuficientes'
          };
          return NextResponse.json(errorResponse, { status: 403 });
        }

        const infoResponse: ApiResponse<any> = {
          data: { session: sessionInfo },
          success: true,
          message: 'Información de sesión obtenida'
        };
        return NextResponse.json(infoResponse);

      case 'validate':
        // Validar una sesión específica
        if (!sessionId) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'sessionId es requerido para validación'
          };
          return NextResponse.json(errorResponse, { status: 400 });
        }

        const isValid = await isSessionValid(sessionId);
        const validateResponse: ApiResponse<any> = {
          data: { valid: isValid, sessionId },
          success: true,
          message: `Sesión ${isValid ? 'válida' : 'inválida'}`
        };
        return NextResponse.json(validateResponse);

      case 'stats':
        // Obtener estadísticas (solo admins)
        if (!authResult.isAdmin) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Permisos de administrador requeridos'
          };
          return NextResponse.json(errorResponse, { status: 403 });
        }

        const stats = await getSessionStats();
        const statsResponse: ApiResponse<any> = {
          data: { stats },
          success: true,
          message: 'Estadísticas de sesiones obtenidas'
        };
        return NextResponse.json(statsResponse);

      case 'sync':
        // Sincronizar sesiones con Clerk
        const syncUserId = userId || authResult.userId;
        
        if (syncUserId !== authResult.userId && !authResult.isAdmin) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Permisos insuficientes para sincronizar sesiones'
          };
          return NextResponse.json(errorResponse, { status: 403 });
        }

        const syncResult = await syncSessionsWithClerk(syncUserId);
        const syncResponse: ApiResponse<any> = {
          data: syncResult,
          success: syncResult.success,
          message: syncResult.success ? 'Sesiones sincronizadas' : 'Error en sincronización'
        };
        return NextResponse.json(syncResponse, { 
          status: syncResult.success ? 200 : 500 
        });

      default:
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: `Acción no válida: ${action}`
        };
        return NextResponse.json(errorResponse, { status: 400 });
    }
  } catch (error) {
    console.error('Error en GET /api/auth/sessions:', error);
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// =====================================================
// POST /api/auth/sessions
// Acciones sobre sesiones (invalidar, limpiar, etc.)
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, userId, reason } = body;

    if (!action) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Acción es requerida'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Verificar autenticación
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.userId) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Autenticación requerida'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    switch (action) {
      case 'invalidate':
        // Invalidar una sesión específica
        if (!sessionId) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'sessionId es requerido para invalidar'
          };
          return NextResponse.json(errorResponse, { status: 400 });
        }

        // Verificar permisos
        const sessionToInvalidate = await getSessionInfo(sessionId);
        if (!sessionToInvalidate) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Sesión no encontrada'
          };
          return NextResponse.json(errorResponse, { status: 404 });
        }

        if (sessionToInvalidate.user_id !== authResult.userId && !authResult.isAdmin) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Permisos insuficientes'
          };
          return NextResponse.json(errorResponse, { status: 403 });
        }

        const invalidateResult = await invalidateSession(sessionId, reason || 'manual');
        const invalidateResponse: ApiResponse<any> = {
          data: invalidateResult,
          success: invalidateResult.success,
          message: invalidateResult.success ? 'Sesión invalidada' : 'Error invalidando sesión'
        };
        return NextResponse.json(invalidateResponse, { 
          status: invalidateResult.success ? 200 : 500 
        });

      case 'invalidate_all':
        // Invalidar todas las sesiones de un usuario
        const targetUserId = userId || authResult.userId;
        
        if (targetUserId !== authResult.userId && !authResult.isAdmin) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Permisos insuficientes'
          };
          return NextResponse.json(errorResponse, { status: 403 });
        }

        const invalidateAllResult = await invalidateAllUserSessions(
          targetUserId, 
          reason || 'manual_all'
        );
        const invalidateAllResponse: ApiResponse<any> = {
          data: invalidateAllResult,
          success: invalidateAllResult.success,
          message: `${invalidateAllResult.cleaned} sesiones invalidadas`
        };
        return NextResponse.json(invalidateAllResponse);

      case 'cleanup':
        // Limpiar sesiones expiradas (solo admins)
        if (!authResult.isAdmin) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'Permisos de administrador requeridos'
          };
          return NextResponse.json(errorResponse, { status: 403 });
        }

        const cleanupResult = await cleanupExpiredSessions();
        const cleanupResponse: ApiResponse<any> = {
          data: cleanupResult,
          success: cleanupResult.success,
          message: `Cleanup completado: ${cleanupResult.cleaned} sesiones limpiadas`
        };
        return NextResponse.json(cleanupResponse);

      case 'update_activity':
        // Actualizar actividad de sesión
        if (!sessionId) {
          const errorResponse: ApiResponse<null> = {
            data: null,
            success: false,
            error: 'sessionId es requerido'
          };
          return NextResponse.json(errorResponse, { status: 400 });
        }

        const updateResult = await updateSessionActivity(sessionId, body.metadata);
        const updateResponse: ApiResponse<any> = {
          data: { success: updateResult },
          success: updateResult,
          message: updateResult ? 'Actividad actualizada' : 'Error actualizando actividad'
        };
        return NextResponse.json(updateResponse, { 
          status: updateResult ? 200 : 500 
        });

      default:
        const errorResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: `Acción no válida: ${action}`
        };
        return NextResponse.json(errorResponse, { status: 400 });
    }
  } catch (error) {
    console.error('Error en POST /api/auth/sessions:', error);
    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: 'Error interno del servidor'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
